/**
 * Optimized 3D Mosquito Flight Physics & Dual-Camera System
 * Through the Eyes of a Mosquito — Production Upgrade
 *
 * Performance Features:
 * - 100% Zero allocations in 60 FPS update loop (pre-allocated scratch vectors)
 * - Independent per-axis wall sliding (X, Y, Z checked separately without snagging)
 * - Smooth lerp camera follow & mouse smoothing
 * - Speed-based dynamic FOV expansion (wind rush effect)
 * - Camera shake on near-miss host swat shockwaves
 * - Micro-hover harmonic oscillation
 * - Post-feeding body load penalty
 */

class PlayerController {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;

        // Position & Kinematics
        this.position = new THREE.Vector3(-6.0, 4.5, 0.0);
        this.velocity = new THREE.Vector3(0, 0, 0);

        this.baseSpeed    = 7.5;
        this.acceleration = 38.0;
        this.drag         = 0.91;
        this.radius       = 0.09;

        // Orientation & Mouse Look
        this.yaw   = 0;
        this.pitch = 0;
        this.targetYaw = 0;
        this.targetPitch = 0;
        this.mouseSensitivity = 1.0; // Scaled via settings

        // Camera Modes & Settings
        this.cameraMode = 'THIRD_PERSON'; // 'FIRST_PERSON' or 'THIRD_PERSON'
        this.thirdPersonDistance = 1.35;
        this.baseFov = 75;
        this.cameraSmoothing = 0.85;
        this.cameraShakeEnabled = true;
        this.shakeIntensity = 0;

        // Control Inputs
        this.keys = {
            forward: false, backward: false, left: false, right: false,
            up: false, down: false, boost: false,
            turnLeft: false, turnRight: false
        };

        this.isPointerLocked = false;
        this.isMouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        // State Flags
        this.isLanded = false;
        this.landedTarget = null;
        this.isResting = false;
        this.restingZone = null;

        this.hoverTime = 0;
        this.totalDistanceTravelled = 0;

        // 3D Procedural Model
        this.model = new window.MosquitoModel();

        // Reusable Scratch Objects (Zero Allocations in Update Loop!)
        this._forward    = new THREE.Vector3();
        this._right      = new THREE.Vector3();
        this._up         = new THREE.Vector3(0, 1, 0);
        this._moveDir    = new THREE.Vector3();
        this._delta      = new THREE.Vector3();
        this._nextPos    = new THREE.Vector3();
        this._testPos    = new THREE.Vector3();
        this._camTarget  = new THREE.Vector3();
        this._backward   = new THREE.Vector3();
        this._lookTarget = new THREE.Vector3();

        this._loadSettings();
        this._bindEvents();
    }

    _loadSettings() {
        if (window.storageManager) {
            const s = window.storageManager.getSettings();
            this.mouseSensitivity = s.mouseSensitivity || 1.0;
            this.baseFov = s.fov || 75;
            this.cameraSmoothing = s.cameraSmoothing !== undefined ? s.cameraSmoothing : 0.85;
            this.cameraShakeEnabled = s.cameraShake !== undefined ? s.cameraShake : true;
            if (this.camera) this.camera.fov = this.baseFov;
        }
    }

    applySettings(s) {
        if (!s) return;
        this.mouseSensitivity = s.mouseSensitivity || 1.0;
        this.baseFov = s.fov || 75;
        this.cameraSmoothing = s.cameraSmoothing !== undefined ? s.cameraSmoothing : 0.85;
        this.cameraShakeEnabled = s.cameraShake !== undefined ? s.cameraShake : true;
        if (this.camera) {
            this.camera.fov = this.baseFov;
            this.camera.updateProjectionMatrix();
        }
    }

    _bindEvents() {
        // Pointer Lock & Right-Click Detach
        this.domElement.addEventListener('mousedown', (e) => {
            if (e.button === 2) {
                if (window.gameEngine && window.gameEngine.feeding && window.gameEngine.feeding.isFeeding) {
                    window.gameEngine.handleAbortFeeding();
                    return;
                }
            }
            this.isMouseDown = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            if (!this.isPointerLocked) {
                this.domElement.requestPointerLock?.();
            }
        });

        this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
        window.addEventListener('mouseup', () => { this.isMouseDown = false; });

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.domElement;
        });

        // Mouse look & feeding reticle steering
        document.addEventListener('mousemove', (e) => {
            let dx = 0, dy = 0;
            if (this.isPointerLocked) {
                dx = e.movementX; dy = e.movementY;
            } else if (this.isMouseDown) {
                dx = e.clientX - this.lastMouseX;
                dy = e.clientY - this.lastMouseY;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }

            if (dx === 0 && dy === 0) return;

            // If in precision feeding minigame, steer needle reticle
            if (window.gameEngine && window.gameEngine.feeding && window.gameEngine.feeding.isFeeding) {
                window.gameEngine.feeding.adjustReticle(dx * 0.0035, dy * 0.0035);
                return;
            }

            // Normal flight steering
            const sens = 0.0022 * this.mouseSensitivity;
            this.targetYaw   -= dx * sens;
            this.targetPitch -= dy * sens;

            // Clamp pitch to prevent gimbal flip
            const maxPitch = Math.PI * 0.44;
            this.targetPitch = Math.max(-maxPitch, Math.min(maxPitch, this.targetPitch));
        });

        // Keyboard Controls
        window.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'KeyW': case 'ArrowUp':    this.keys.forward = true; break;
                case 'KeyS': case 'ArrowDown':  this.keys.backward = true; break;
                case 'KeyA': case 'ArrowLeft':  this.keys.left = true; break;
                case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
                case 'Space': case 'KeyR':      this.keys.up = true; break;
                case 'ControlLeft': case 'ControlRight':
                case 'KeyC':                    this.keys.down = true; break;
                case 'ShiftLeft': case 'ShiftRight': this.keys.boost = true; break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'KeyW': case 'ArrowUp':    this.keys.forward = false; break;
                case 'KeyS': case 'ArrowDown':  this.keys.backward = false; break;
                case 'KeyA': case 'ArrowLeft':  this.keys.left = false; break;
                case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
                case 'Space': case 'KeyR':      this.keys.up = false; break;
                case 'ControlLeft': case 'ControlRight':
                case 'KeyC':                    this.keys.down = false; break;
                case 'ShiftLeft': case 'ShiftRight': this.keys.boost = false; break;
            }
        });
    }

    toggleCameraMode() {
        this.cameraMode = (this.cameraMode === 'THIRD_PERSON') ? 'FIRST_PERSON' : 'THIRD_PERSON';
        if (window.gameEngine && window.gameEngine.ui) {
            window.gameEngine.ui.showToast(this.cameraMode === 'FIRST_PERSON' ? '📷 1ST PERSON CAMERA' : '📷 3RD PERSON CAMERA');
        }
    }

    triggerCameraShake(intensity = 0.35) {
        if (!this.cameraShakeEnabled) return;
        this.shakeIntensity = Math.min(0.8, this.shakeIntensity + intensity);
    }

    takeOff() {
        this.isLanded = false;
        this.landedTarget = null;
        this.isResting = false;
        this.restingZone = null;
        this.velocity.y = 1.6; // Initial climb boost
    }

    land(target) {
        this.isLanded = true;
        this.landedTarget = target;
        this.isResting = false;
        this.velocity.set(0, 0, 0);
    }

    rest(safeZone) {
        this.isLanded = true;
        this.isResting = true;
        this.restingZone = safeZone;
        this.velocity.set(0, 0, 0);
    }

    update(dt, world, emotionSystem, windVector) {
        this.hoverTime += dt * 4.0;

        // Smooth Mouse Look (Interpolation)
        const smoothFactor = Math.min(1.0, dt * 18.0);
        this.yaw   += (this.targetYaw - this.yaw) * smoothFactor;
        this.pitch += (this.targetPitch - this.pitch) * smoothFactor;

        // Decaying Camera Shake
        if (this.shakeIntensity > 0) {
            this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 2.5);
        }

        // If Landed or Resting, freeze velocity and update model/camera
        if (this.isLanded) {
            this.velocity.set(0, 0, 0);
            this.model.update(dt, 0, false, true, emotionSystem.bodyLoad);
            this._updateCamera(0, 0);
            return;
        }

        // Dynamic Flight Speed Modifiers
        const emotionMod = emotionSystem.getFlightSpeedModifier();
        const isBoosting = this.keys.boost && emotionSystem.energy > 5;
        const speedMult  = (isBoosting ? 1.75 : 1.0) * emotionMod;

        // Calculate Direction Vectors (Zero Allocation via Scratch Vectors)
        const cosPitch = Math.cos(this.pitch);
        this._forward.set(
            -Math.sin(this.yaw) * cosPitch,
             Math.sin(this.pitch),
            -Math.cos(this.yaw) * cosPitch
        ).normalize();

        this._right.set(
            Math.cos(this.yaw),
            0,
            -Math.sin(this.yaw)
        ).normalize();

        // Movement input vector
        this._moveDir.set(0, 0, 0);
        if (this.keys.forward)  this._moveDir.add(this._forward);
        if (this.keys.backward) this._moveDir.sub(this._forward);
        if (this.keys.right)    this._moveDir.add(this._right);
        if (this.keys.left)     this._moveDir.sub(this._right);
        if (this.keys.up)       this._moveDir.add(this._up);
        if (this.keys.down)     this._moveDir.sub(this._up);

        if (this._moveDir.lengthSq() > 0) {
            this._moveDir.normalize();
            this.velocity.addScaledVector(this._moveDir, this.acceleration * speedMult * dt);
        } else {
            // Hover stabilization dampening
            this.velocity.multiplyScalar(Math.pow(0.86, dt * 60));
        }

        // Apply Ceiling Fan downwash vortex & outdoor wind
        if (windVector) {
            this.velocity.addScaledVector(windVector, dt * 1.3);
        }

        // Aerodynamic drag
        this.velocity.multiplyScalar(Math.pow(this.drag, dt * 60));

        // Micro-hover harmonic wobble oscillation (biological realism)
        const wobbleX = Math.sin(this.hoverTime * 1.4) * 0.005;
        const wobbleY = Math.cos(this.hoverTime * 1.8) * 0.006;
        const wobbleZ = Math.sin(this.hoverTime * 2.2) * 0.005;

        this._delta.copy(this.velocity).multiplyScalar(dt);
        this._delta.x += wobbleX;
        this._delta.y += wobbleY;
        this._delta.z += wobbleZ;

        this._nextPos.copy(this.position).add(this._delta);

        // ── Per-Axis Independent Wall Sliding (Zero Allocations!) ──
        if (!world.checkCollision(this._nextPos, this.radius)) {
            this.position.copy(this._nextPos);
            this.totalDistanceTravelled += this._delta.length();
        } else {
            let moved = false;

            // 1. Test X axis independently
            this._testPos.set(this.position.x + this._delta.x, this.position.y, this.position.z);
            if (!world.checkCollision(this._testPos, this.radius)) {
                this.position.x = this._testPos.x;
                moved = true;
            } else {
                this.velocity.x *= 0.1;
            }

            // 2. Test Y axis independently
            this._testPos.set(this.position.x, this.position.y + this._delta.y, this.position.z);
            if (!world.checkCollision(this._testPos, this.radius)) {
                this.position.y = this._testPos.y;
                moved = true;
            } else {
                this.velocity.y *= 0.1;
            }

            // 3. Test Z axis independently
            this._testPos.set(this.position.x, this.position.y, this.position.z + this._delta.z);
            if (!world.checkCollision(this._testPos, this.radius)) {
                this.position.z = this._testPos.z;
                moved = true;
            } else {
                this.velocity.z *= 0.1;
            }

            if (moved) {
                this.totalDistanceTravelled += this._delta.length() * 0.7;
            } else {
                this.velocity.multiplyScalar(0.25);
            }
        }

        // Update Mosquito 3D Model position & orientation
        this.model.group.position.copy(this.position);
        this.model.group.rotation.set(this.pitch * 0.65, this.yaw, 0, 'YXZ');

        const speedRatio = Math.min(1.0, this.velocity.length() / (this.baseSpeed * 1.8));
        this.model.update(dt, speedRatio, isBoosting, false, emotionSystem.bodyLoad);

        // Speed-based Dynamic FOV (Wind rush)
        const targetFov = this.baseFov + (speedRatio * 8.0) + (isBoosting ? 6.0 : 0.0);
        if (Math.abs(this.camera.fov - targetFov) > 0.1) {
            this.camera.fov += (targetFov - this.camera.fov) * Math.min(1.0, dt * 6.0);
            this.camera.updateProjectionMatrix();
        }

        // Update Camera
        this._updateCamera(wobbleY, dt);
    }

    _updateCamera(wobbleY, dt) {
        // Compute shake offset
        let shakeX = 0, shakeY = 0;
        if (this.shakeIntensity > 0) {
            shakeX = (Math.random() - 0.5) * this.shakeIntensity * 0.12;
            shakeY = (Math.random() - 0.5) * this.shakeIntensity * 0.12;
        }

        if (this.cameraMode === 'FIRST_PERSON') {
            // First Person: Camera placed right at mosquito head
            this.camera.position.copy(this.position);
            this.camera.position.y += 0.04 + wobbleY + shakeY;
            this.camera.position.x += shakeX;

            this._lookTarget.copy(this.position).add(this._forward);
            this.camera.lookAt(this._lookTarget);
            this.model.group.visible = false; // Hide body in 1st person
        } else {
            // Third Person: Smooth trailing chase camera behind mosquito
            this.model.group.visible = true;

            const cosPitch = Math.cos(this.pitch);
            this._backward.set(
                Math.sin(this.yaw) * cosPitch,
                -Math.sin(this.pitch) + 0.32,
                Math.cos(this.yaw) * cosPitch
            ).normalize();

            this._camTarget.copy(this.position).addScaledVector(this._backward, this.thirdPersonDistance);
            this._camTarget.y = Math.max(0.12, this._camTarget.y + shakeY);
            this._camTarget.x += shakeX;

            // Camera Smoothing (Lerp)
            if (dt > 0) {
                const lerpSpeed = Math.min(1.0, dt * (12.0 * this.cameraSmoothing));
                this.camera.position.lerp(this._camTarget, lerpSpeed);
            } else {
                this.camera.position.copy(this._camTarget);
            }

            this._lookTarget.copy(this.position);
            this._lookTarget.y += 0.08;
            this.camera.lookAt(this._lookTarget);
        }
    }
}

window.PlayerController = PlayerController;
