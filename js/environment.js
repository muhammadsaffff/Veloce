/**
 * Dynamic Environment: Lighting, Night Vision Boost, Ceiling Fan Wind & Weather
 * Through the Eyes of a Mosquito
 *
 * Implements:
 * - Precise nocturnal lighting specs (ambient 0x22334e @ 1.9, moonlight 0x8ab4f8 @ 2.0)
 * - Nocturnal Eye Illuminator attached to camera (radius 14m)
 * - Night Vision Boost [N]: bumps ambient to 3.4, eye to 4.2/22m, moon to 3.2, halves fog to 0.006
 * - Rotating ceiling fan with realistic conical downward wind vortex physics
 * - Window rain particle precipitation & lightning storm flashes
 */

class DynamicEnvironment {
    constructor(scene) {
        this.scene = scene;

        // Night Vision Boost State
        this.nightVisionBoosted = false;

        // Time of Day
        this.timeOfDay = 'NIGHT';
        this.autoCycle = false;
        this.cycleTime = 0;
        this.cycleDuration = 360;

        // Ceiling Fan & Wind Field
        this.fanEnabled = true;
        this.fanSpeed = 8.8; // rad/s
        this.fanPosition = new THREE.Vector3(-1.0, 11.2, -2.0); // Mounted above central bedroom area

        // Weather
        this.weather = 'RAIN';
        this.rainPoints = null;
        this.lightningTimer = Math.random() * 25 + 15;

        // Lights
        this.ambientLight  = null;
        this.moonLight     = null;
        this.deskLampLight = null;
        this.laptopLight   = null;
        this.eyeLight      = null;

        this.fanGroup = null;
        this.bladeHub = null;

        this._initLighting();
        this._buildCeilingFan();
        this._buildRainParticles();
    }

    _initLighting() {
        // 1. Scene Fog (0.012 default nocturnal density)
        this.scene.fog = new THREE.FogExp2(0x0a1220, 0.012);

        // 2. Ambient Light (Deep blue-night 0x22334e @ 1.9)
        this.ambientLight = new THREE.AmbientLight(0x22334e, 1.9);
        this.scene.add(this.ambientLight);

        // 3. Directional Moonlight (0x8ab4f8 @ 2.0)
        this.moonLight = new THREE.DirectionalLight(0x8ab4f8, 2.0);
        this.moonLight.position.set(6, 16, 14);
        this.moonLight.target.position.set(0, 2, 0);
        this.moonLight.castShadow = true;
        this.moonLight.shadow.mapSize.width = 1024;
        this.moonLight.shadow.mapSize.height = 1024;
        this.scene.add(this.moonLight);
        this.scene.add(this.moonLight.target);

        // 4. Desk Lamp Warm Point Light
        this.deskLampLight = new THREE.PointLight(0xffb84d, 2.4, 16, 1.1);
        this.deskLampLight.position.set(10.2, 6.2, -7.8);
        this.scene.add(this.deskLampLight);

        // 5. Laptop Display Ambient Fill Light
        this.laptopLight = new THREE.PointLight(0x38bdf8, 1.2, 8, 1.2);
        this.laptopLight.position.set(7.5, 5.2, -6.0);
        this.scene.add(this.laptopLight);

        // 6. Nocturnal Eye Illuminator (Compound-Eye Adaptation attached to player)
        this.eyeLight = new THREE.PointLight(0xa5f3fc, 2.2, 14, 1.0);
        this.eyeLight.position.set(0, 5, 0);
        this.scene.add(this.eyeLight);
    }

    _buildCeilingFan() {
        this.fanGroup = new THREE.Group();
        this.fanGroup.position.copy(this.fanPosition);

        const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.8 });
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0x3b2314, roughness: 0.6 });

        // Ceiling Mount Canopy
        const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 0.3, 16), metalMat);
        canopy.position.y = 0.7;
        this.fanGroup.add(canopy);

        // Downrod
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8), metalMat);
        rod.position.y = 0.1;
        this.fanGroup.add(rod);

        // Motor Housing
        const motor = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.6, 16), metalMat);
        motor.position.y = -0.5;
        this.fanGroup.add(motor);

        // Rotating Blades Hub
        this.bladeHub = new THREE.Group();
        this.bladeHub.position.y = -0.7;

        const bladeGeo = new THREE.BoxGeometry(4.2, 0.04, 0.65);

        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const blade = new THREE.Mesh(bladeGeo, bladeMat);
            blade.position.set(Math.cos(angle) * 2.4, 0, Math.sin(angle) * 2.4);
            blade.rotation.y = -angle;
            blade.rotation.z = 0.14; // Aerodynamic pitch angle creating downwash
            this.bladeHub.add(blade);
        }

        this.fanGroup.add(this.bladeHub);
        this.scene.add(this.fanGroup);
    }

    _buildRainParticles() {
        // Rain particles outside the bedroom window (Z > 12)
        const count = 450;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count * 3; i += 3) {
            positions[i]     = (Math.random() - 0.5) * 24; // across window width
            positions[i + 1] = Math.random() * 16;
            positions[i + 2] = 12.2 + Math.random() * 8;   // outdoors beyond glass
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0x93c5fd,
            size: 0.14,
            transparent: true,
            opacity: 0.5
        });

        this.rainPoints = new THREE.Points(geo, mat);
        this.scene.add(this.rainPoints);
    }

    /**
     * Toggle Night Vision Boost [N key or HUD button]
     */
    toggleNightVisionBoost() {
        this.nightVisionBoosted = !this.nightVisionBoosted;
        this.applyNightVisionLighting();
        return this.nightVisionBoosted;
    }

    applyNightVisionLighting() {
        if (this.timeOfDay !== 'NIGHT') return;

        if (this.nightVisionBoosted) {
            // Bumped night vision settings
            if (this.ambientLight) this.ambientLight.intensity = 3.4;
            if (this.moonLight)    this.moonLight.intensity = 3.2;
            if (this.eyeLight) {
                this.eyeLight.intensity = 4.2;
                this.eyeLight.distance = 22;
            }
            if (this.scene.fog) {
                this.scene.fog.density = 0.006; // Halved fog density
            }
        } else {
            // Base deep blue-night settings
            if (this.ambientLight) this.ambientLight.intensity = 1.9;
            if (this.moonLight)    this.moonLight.intensity = 2.0;
            if (this.eyeLight) {
                this.eyeLight.intensity = 2.2;
                this.eyeLight.distance = 14;
            }
            if (this.scene.fog) {
                this.scene.fog.density = 0.012;
            }
        }
    }

    setTimeOfDay(time) {
        this.timeOfDay = time;
        if (time === 'NIGHT') {
            this.ambientLight.color.setHex(0x22334e);
            this.moonLight.color.setHex(0x8ab4f8);
            this.deskLampLight.intensity = 2.4;
            this.applyNightVisionLighting();
        } else if (time === 'MORNING' || time === 'DAWN') {
            this.ambientLight.color.setHex(0x475569);
            this.ambientLight.intensity = 2.6;
            this.moonLight.color.setHex(0xfde68a);
            this.moonLight.intensity = 3.2;
            this.deskLampLight.intensity = 1.0;
            if (this.eyeLight) this.eyeLight.intensity = 1.2;
            if (this.scene.fog) this.scene.fog.density = 0.008;
        } else if (time === 'DAY') {
            this.ambientLight.color.setHex(0x64748b);
            this.ambientLight.intensity = 3.6;
            this.moonLight.color.setHex(0xffffff);
            this.moonLight.intensity = 4.2;
            this.deskLampLight.intensity = 0.4;
            if (this.eyeLight) this.eyeLight.intensity = 0.6;
            if (this.scene.fog) this.scene.fog.density = 0.004;
        } else if (time === 'EVENING' || time === 'DUSK') {
            this.ambientLight.color.setHex(0x3f3f5a);
            this.ambientLight.intensity = 2.2;
            this.moonLight.color.setHex(0xf97316); // Amber sunset glow
            this.moonLight.intensity = 3.0;
            this.deskLampLight.intensity = 1.8;
            if (this.eyeLight) this.eyeLight.intensity = 1.6;
            if (this.scene.fog) this.scene.fog.density = 0.010;
        }
    }

    /**
     * Compute compound downward wind vortex vector from ceiling fan
     */
    getWindVectorAt(pos) {
        if (!this.fanEnabled) return null;

        const dx = pos.x - this.fanPosition.x;
        const dz = pos.z - this.fanPosition.z;
        const hDist = Math.hypot(dx, dz);
        const vDist = this.fanPosition.y - pos.y;

        // Expanding downward cone from fan hub
        const maxCone = 2.4 + vDist * 0.45;

        if (vDist > 0 && vDist < 11.0 && hDist < maxCone) {
            // Strength peaks under blade tips and falls off toward cone perimeter
            const hFactor = 1 - (hDist / maxCone);
            const vFactor = 1 - (vDist / 12.0);
            const vortexStrength = hFactor * vFactor * 6.5;

            // Physical vectors:
            // 1. Heavy downward wind draft
            const down = new THREE.Vector3(0, -vortexStrength * 1.3, 0);

            // 2. Outward radial divergence
            const outward = (hDist > 0.1)
                ? new THREE.Vector3(dx, 0, dz).normalize().multiplyScalar(vortexStrength * 0.35)
                : new THREE.Vector3(0, 0, 0);

            // 3. Tangential rotational swirl
            const swirl = (hDist > 0.1)
                ? new THREE.Vector3(-dz, 0, dx).normalize().multiplyScalar(vortexStrength * 0.45)
                : new THREE.Vector3(0, 0, 0);

            return down.add(outward).add(swirl);
        }

        return null;
    }

    update(dt, playerPos) {
        // Spin fan blades
        if (this.fanEnabled && this.bladeHub) {
            this.bladeHub.rotation.y += this.fanSpeed * dt;
        }

        // Nocturnal eye illuminator follows mosquito
        if (playerPos && this.eyeLight) {
            this.eyeLight.position.copy(playerPos);
        }

        // Rain animation outside window
        if (this.rainPoints) {
            const pa = this.rainPoints.geometry.attributes.position.array;
            for (let i = 1; i < pa.length; i += 3) {
                pa[i] -= dt * 22;
                if (pa[i] < 0) pa[i] = 16;
            }
            this.rainPoints.geometry.attributes.position.needsUpdate = true;
        }

        // Fan proximity sound update
        if (window.soundEngine && playerPos) {
            const fanDist = playerPos.distanceTo(this.fanPosition);
            window.soundEngine.updateFanProximity(fanDist);
        }

        // Lightning flash in night mode
        if (this.timeOfDay === 'NIGHT') {
            this.lightningTimer -= dt;
            if (this.lightningTimer <= 0) {
                this._triggerLightning();
                this.lightningTimer = Math.random() * 30 + 20;
            }
        }
    }

    _triggerLightning() {
        if (!this.moonLight) return;
        const origColor = this.moonLight.color.getHex();
        const origInt   = this.moonLight.intensity;

        this.moonLight.color.setHex(0xdbeafe);
        this.moonLight.intensity = 6.5;

        setTimeout(() => {
            this.moonLight.intensity = 1.2;
            setTimeout(() => {
                this.moonLight.intensity = 5.2;
                setTimeout(() => {
                    this.moonLight.color.setHex(origColor);
                    this.moonLight.intensity = origInt;
                }, 75);
            }, 55);
        }, 85);
    }
}

window.DynamicEnvironment = DynamicEnvironment;
