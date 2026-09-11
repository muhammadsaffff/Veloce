/**
 * 3D Mosquito Flight Physics, Dual Camera & Independent Per-Axis Wall Sliding
 * Through the Eyes of a Mosquito
 *
 * Flight Physics Parameters:
 * - baseSpeed: 7.5
 * - acceleration: 36.0
 * - drag: 0.91
 * - Micro-hover wobble oscillation for insect realism
 * - Independent per-axis wall sliding (X, Y, Z checked separately)
 * - Mouse drag steering + pointer lock support + Arrow keys
 * - WASD + Arrow Keys
 * - Space/R = climb, C/Ctrl = dive
 * - Shift = turbo boost
 * - V = toggle first/third person camera
 * - E = land / feed / rest / detach
 */

class PlayerController {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;

        // Position & Kinematics
        this.position = new THREE.Vector3(-6.0, 4.5, 0.0); // Start hovering near bed
        this.velocity = new THREE.Vector3(0, 0, 0);

        this.baseSpeed    = 7.5;
        this.acceleration = 36.0;
        this.drag         = 0.91;
        this.radius       = 0.09;

        // Camera & Orientation
        this.yaw   = 0;
        this.pitch = 0;
        this.mouseSensitivity = 0.0022;

        this.cameraMode = 'THIRD_PERSON'; // Default to 3rd person to appreciate mosquito model
        this.thirdPersonDistance = 1.35;

        // Control Inputs
        this.keys = {
            forward: false, backward: false, left: false, right: false,
            up: false, down: false, boost: false,
            turnLeft: false, turnRight: false, pitchUp: false, pitchDown: false
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

        this.model = new window.MosquitoModel();
        this._bindEvents();
    }

    _bindEvents() {
        // Mouse pointer lock & feeding abort on Right Click
        this.domElement.addEventListener('mousedown', (e) => {
            if (e.button === 2) {
                // Right click: instant feeding abort & escape
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

        // Prevent browser context menu on right click
        this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

        window.addEventListener('mouseup', () => { this.isMouseDown = false; });

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.domElement;
        });

        // Mouse look (pointer lock + drag fallback) & Feeding Reticle steering
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

            if (dx !== 0 || dy !== 0) {
                // If in precision feeding minigame, steer capillary reticle
                if (window.gameEngine && window.gameEngine.feeding && window.gameEngine.feeding.isFeeding) {
                    window.gameEngine.feeding.adjustReticle(dx * 0.008, dy * 0.008);
                    return;
                }

                const sens = (window.storageManager?.getSettings()?.mouseSensitivity || 1.0) * this.mouseSensitivity;
                this.yaw   -= dx * sens;
                this.pitch -= dy * sens;

                // Clamp pitch to avoid gimbal flip
                const maxPitch = Math.PI / 2 - 0.05;
                this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
            }
        });

        // Keyboard Controls
        window.addEventListener('keydown', (e) => {
            this._handleKey(e.code, true);

            // Camera toggle [V]
            if (e.code === 'KeyV') {
                this.toggleCamera();
                if (window.soundEngine) window.soundEngine.playClick();
                if (window.gameEngine?.ui) {
                    window.gameEngine.ui.showToast(`Camera: ${this.cameraMode === 'FIRST_PERSON' ? '1st Person (Insect Eyes)' : '3rd Person (Chaser)'}`);
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this._handleKey(e.code, false);
        });
    }

    _handleKey(code, pressed) {
        switch (code) {
            case 'KeyW':
                this.keys.forward = pressed; break;
            case 'KeyS':
                this.keys.backward = pressed; break;
            case 'KeyA':
                this.keys.left = pressed; break;
            case 'KeyD':
                this.keys.right = pressed; break;

            // Arrow keys for flight & steering
            case 'ArrowUp':
                this.keys.forward = pressed; break;
            case 'ArrowDown':
                this.keys.backward = pressed; break;
            case 'ArrowLeft':
                this.keys.turnLeft = pressed; break;
            case 'ArrowRight':
                this.keys.turnRight = pressed; break;

            // Climb: Space or R
            case 'Space':
            case 'KeyR':
                this.keys.up = pressed; break;

            // Dive: C or ControlLeft/ControlRight
            case 'KeyC':
            case 'ControlLeft':
            case 'ControlRight':
                this.keys.down = pressed; break;

            // Turbo Boost
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.boost = pressed; break;
        }
    }

    toggleCamera() {
        this.cameraMode = this.cameraMode === 'FIRST_PERSON' ? 'THIRD_PERSON' : 'FIRST_PERSON';
    }

    takeOff() {
        this.isLanded = false;
        this.landedTarget = null;
        this.isResting = false;
        this.restingZone = null;
        this.velocity.y = 1.2; // initial gentle lift
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
        this.hoverTime += dt * 3.8;

        // Arrow keys steering
        if (this.keys.turnLeft)  this.yaw   += dt * 2.4;
        if (this.keys.turnRight) this.yaw   -= dt * 2.4;

        // If landed, immobilize and update model & camera
        if (this.isLanded) {
            this.velocity.set(0, 0, 0);
            this.model.update(dt, 0, false, true, emotionSystem.bodyLoad);
            this._updateCamera(0);
            return;
        }

        const emotionMod = emotionSystem.getFlightSpeedModifier();
        const isBoosting = this.keys.boost && emotionSystem.energy > 5;
        const speedMult  = (isBoosting ? 1.75 : 1.0) * emotionMod;

        // Direction vectors relative to camera yaw & pitch
        const forward = new THREE.Vector3(
            -Math.sin(this.yaw) * Math.cos(this.pitch),
             Math.sin(this.pitch),
            -Math.cos(this.yaw) * Math.cos(this.pitch)
        ).normalize();

        const right = new THREE.Vector3(
            Math.cos(this.yaw),
            0,
            -Math.sin(this.yaw)
        ).normalize();

        const up = new THREE.Vector3(0, 1, 0);

        // Movement input vector
        const moveDir = new THREE.Vector3();
        if (this.keys.forward)  moveDir.add(forward);
        if (this.keys.backward) moveDir.sub(forward);
        if (this.keys.right)    moveDir.add(right);
        if (this.keys.left)     moveDir.sub(right);
        if (this.keys.up)       moveDir.add(up);
        if (this.keys.down)     moveDir.sub(up);

        if (moveDir.lengthSq() > 0) {
            moveDir.normalize();
            this.velocity.addScaledVector(moveDir, this.acceleration * speedMult * dt);
        } else {
            // Hover stabilization when no keys are pressed
            this.velocity.multiplyScalar(Math.pow(0.86, dt * 60));
        }

        // Apply Ceiling Fan wind vortex force
        if (windVector) {
            this.velocity.addScaledVector(windVector, dt * 1.3);
        }

        // Aerodynamic drag
        this.velocity.multiplyScalar(Math.pow(this.drag, dt * 60));

        // Micro-hover wobble oscillation (insect biological realism)
        const wobbleX = Math.sin(this.hoverTime * 1.4) * 0.006;
        const wobbleY = Math.cos(this.hoverTime * 1.8) * 0.007;
        const wobbleZ = Math.sin(this.hoverTime * 2.2) * 0.006;

        const delta = this.velocity.clone().multiplyScalar(dt);
        delta.x += wobbleX;
        delta.y += wobbleY;
        delta.z += wobbleZ;

        const nextPos = this.position.clone().add(delta);

        // ── Per-Axis Independent Wall Sliding ──────────────────
        // Check X, Y, Z independently to ensure smooth gliding along walls and furniture
        if (!world.checkCollision(nextPos, this.radius)) {
            this.position.copy(nextPos);
            this.totalDistanceTravelled += delta.length();
        } else {
            let moved = false;

            // Test X axis independently
            const testX = new THREE.Vector3(this.position.x + delta.x, this.position.y, this.position.z);
            if (!world.checkCollision(testX, this.radius)) {
                this.position.x = testX.x;
                moved = true;
            } else {
                this.velocity.x *= 0.1; // Deflect velocity along collision surface
            }

            // Test Y axis independently
            const testY = new THREE.Vector3(this.position.x, this.position.y + delta.y, this.position.z);
            if (!world.checkCollision(testY, this.radius)) {
                this.position.y = testY.y;
                moved = true;
            } else {
                this.velocity.y *= 0.1;
            }

            // Test Z axis independently
            const testZ = new THREE.Vector3(this.position.x, this.position.y, this.position.z + delta.z);
            if (!world.checkCollision(testZ, this.radius)) {
                this.position.z = testZ.z;
                moved = true;
            } else {
                this.velocity.z *= 0.1;
            }

            if (moved) {
                this.totalDistanceTravelled += delta.length() * 0.7;
            } else {
                this.velocity.multiplyScalar(0.2);
            }
        }

        // Update Mosquito 3D Model position & orientation
        this.model.group.position.copy(this.position);
        this.model.group.rotation.set(this.pitch * 0.65, this.yaw, 0, 'YXZ');

        const speedRatio = Math.min(1.0, this.velocity.length() / (this.baseSpeed * 1.8));
        this.model.update(dt, speedRatio, isBoosting, false, emotionSystem.bodyLoad);

        // Update Camera
        this._updateCamera(wobbleY);
    }

    _updateCamera(wobbleY) {
        if (this.cameraMode === 'FIRST_PERSON') {
            // First Person: Camera placed directly at mosquito head
            this.camera.position.copy(this.position);
            this.camera.position.y += 0.04 + wobbleY;

            const lookTarget = this.position.clone().add(new THREE.Vector3(
                -Math.sin(this.yaw) * Math.cos(this.pitch),
                 Math.sin(this.pitch),
                -Math.cos(this.yaw) * Math.cos(this.pitch)
            ));
            this.camera.lookAt(lookTarget);
            this.model.group.visible = false; // Hide body in 1st person
        } else {
            // Third Person: Camera positioned behind mosquito
            this.model.group.visible = true;

            const backward = new THREE.Vector3(
                Math.sin(this.yaw) * Math.cos(this.pitch),
                -Math.sin(this.pitch) + 0.35, // Slightly elevated angle
                Math.cos(this.yaw) * Math.cos(this.pitch)
            ).normalize();

            const camPos = this.position.clone().addScaledVector(backward, this.thirdPersonDistance);
            camPos.y = Math.max(0.15, camPos.y); // Don't clip through floor
            this.camera.position.copy(camPos);

            // Look at slightly ahead of mosquito
            const lookTarget = this.position.clone();
            lookTarget.y += 0.08;
            this.camera.lookAt(lookTarget);
        }
    }
}

window.PlayerController = PlayerController;
