/**
 * Dynamic Environment: Diurnal Lighting, Weather, Ceiling Fan Vortex & Wind
 * Through the Eyes of a Mosquito — Production Upgrade
 *
 * Performance Features:
 * - Dynamic shadow budget & resolution scaling based on Graphics Quality
 * - Reusable rain BufferGeometry points
 * - Conical downward vortex vector calculation with zero allocations
 * - High-efficiency night vision illumination without screen tinting
 */

class DynamicEnvironment {
    constructor(scene) {
        this.scene = scene;

        this.nightVisionBoosted = false;
        this.timeOfDay = 'NIGHT';
        this.weather = 'CLEAR'; // 'CLEAR', 'RAIN', 'STORM'

        // Ceiling Fan & Wind Field
        this.fanEnabled = true;
        this.fanSpeed = 8.8; // rad/s
        this.fanPosition = new THREE.Vector3(-1.0, 11.2, -2.0);

        // Scratch vectors for zero allocation
        this._windResult = new THREE.Vector3();
        this._outward    = new THREE.Vector3();

        // Particles & Timers
        this.rainPoints = null;
        this.rainCount = 1200;
        this.rainVelocities = null;
        this.lightningTimer = Math.random() * 20 + 15;
        this.lightningFlash = 0;
        this.windTime = 0;

        // Lights
        this.ambientLight  = null;
        this.moonLight     = null;
        this.deskLampLight = null;
        this.eyeLight      = null;

        this.fanGroup = null;
        this.bladeHub = null;

        this._initLighting();
        this._buildCeilingFan();
        this._buildRainParticles();
    }

    _initLighting() {
        // Fog for nocturnal atmosphere
        this.scene.fog = new THREE.FogExp2(0x0a1220, 0.012);

        // Ambient deep blue-night light
        this.ambientLight = new THREE.AmbientLight(0x22334e, 1.9);
        this.scene.add(this.ambientLight);

        // Directional Moonlight
        this.moonLight = new THREE.DirectionalLight(0x8ab4f8, 2.0);
        this.moonLight.position.set(20, 26, 16);
        this.moonLight.target.position.set(5, 2, 0);
        this.moonLight.castShadow = true;
        this.moonLight.shadow.mapSize.width = 1024;
        this.moonLight.shadow.mapSize.height = 1024;
        this.scene.add(this.moonLight);
        this.scene.add(this.moonLight.target);

        // Warm Desk Lamp Point Light
        this.deskLampLight = new THREE.PointLight(0xffb84d, 2.2, 16, 1.2);
        this.deskLampLight.position.set(10.2, 4.8, -6.0);
        this.scene.add(this.deskLampLight);

        // Eye Illuminator (Compound-Eye Nocturnal Adaptation)
        this.eyeLight = new THREE.PointLight(0xa5f3fc, 2.2, 16, 1.0);
        this.eyeLight.position.set(0, 5, 0);
        this.scene.add(this.eyeLight);
    }

    _buildCeilingFan() {
        this.fanGroup = new THREE.Group();
        this.fanGroup.position.copy(this.fanPosition);

        const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.8 });
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0x3b2314, roughness: 0.65 });

        // Mount canopy & downrod
        const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 0.3, 12), metalMat);
        canopy.position.y = 0.7;
        this.fanGroup.add(canopy);

        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8), metalMat);
        rod.position.y = 0.1;
        this.fanGroup.add(rod);

        const motor = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.5, 12), metalMat);
        motor.position.y = -0.5;
        this.fanGroup.add(motor);

        // Rotating Blade Hub
        this.bladeHub = new THREE.Group();
        this.bladeHub.position.y = -0.75;
        this.fanGroup.add(this.bladeHub);

        // 4 Aerodynamic Blades
        for (let i = 0; i < 4; i++) {
            const bladeArm = new THREE.Group();
            bladeArm.rotation.y = (i * Math.PI) / 2;

            const blade = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.04, 0.75), bladeMat);
            blade.position.x = 2.2;
            blade.rotation.x = 0.18; // Pitch for downwash
            bladeArm.add(blade);

            this.bladeHub.add(bladeArm);
        }

        this.scene.add(this.fanGroup);
    }

    _buildRainParticles() {
        const count = this.rainCount;
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3 + 0] = Math.random() * 80 + 10;
            positions[i * 3 + 1] = Math.random() * 26 + 1.0;
            positions[i * 3 + 2] = Math.random() * 90 - 65;
            velocities[i] = 18.0 + Math.random() * 8.0;
        }

        const rainGeo = new THREE.BufferGeometry();
        rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.rainVelocities = velocities;

        const rainMat = new THREE.PointsMaterial({
            color: 0x93c5fd,
            size: 0.18,
            transparent: true,
            opacity: 0.65,
            blending: THREE.AdditiveBlending
        });

        this.rainPoints = new THREE.Points(rainGeo, rainMat);
        this.rainPoints.visible = false;
        this.scene.add(this.rainPoints);
    }

    setGraphicsQuality(quality) {
        if (!this.moonLight) return;
        if (quality === 'LOW') {
            this.moonLight.castShadow = false;
            if (this.deskLampLight) this.deskLampLight.castShadow = false;
            if (this.rainPoints) this.rainPoints.visible = false;
        } else if (quality === 'MEDIUM') {
            this.moonLight.castShadow = true;
            this.moonLight.shadow.mapSize.set(1024, 1024);
        } else if (quality === 'HIGH' || quality === 'ULTRA') {
            this.moonLight.castShadow = true;
            this.moonLight.shadow.mapSize.set(2048, 2048);
        }
    }

    toggleNightVisionBoost() {
        this.nightVisionBoosted = !this.nightVisionBoosted;
        this.applyNightVisionLighting();
        return this.nightVisionBoosted;
    }

    applyNightVisionLighting() {
        if (this.nightVisionBoosted) {
            if (this.ambientLight) this.ambientLight.intensity = 3.2;
            if (this.moonLight)    this.moonLight.intensity = 3.0;
            if (this.eyeLight) {
                this.eyeLight.intensity = 4.2;
                this.eyeLight.distance = 24;
            }
            if (this.scene.fog) this.scene.fog.density = 0.005;
        } else {
            if (this.ambientLight) this.ambientLight.intensity = 1.9;
            if (this.moonLight)    this.moonLight.intensity = 2.0;
            if (this.eyeLight) {
                this.eyeLight.intensity = 2.2;
                this.eyeLight.distance = 16;
            }
            if (this.scene.fog) this.scene.fog.density = 0.012;
        }
    }

    setTimeOfDay(time) {
        this.timeOfDay = time;
        if (time === 'NIGHT') {
            this.ambientLight.color.setHex(0x22334e);
            this.moonLight.color.setHex(0x8ab4f8);
            this.deskLampLight.intensity = 2.2;
            this.applyNightVisionLighting();
        } else if (time === 'DAWN') {
            this.ambientLight.color.setHex(0x475569);
            this.ambientLight.intensity = 2.6;
            this.moonLight.color.setHex(0xfde68a);
            this.deskLampLight.intensity = 1.0;
        } else if (time === 'DAY') {
            this.ambientLight.color.setHex(0x64748b);
            this.ambientLight.intensity = 3.6;
            this.moonLight.color.setHex(0xffffff);
            this.deskLampLight.intensity = 0.2;
        } else if (time === 'DUSK') {
            this.ambientLight.color.setHex(0x3f3f5a);
            this.ambientLight.intensity = 2.2;
            this.moonLight.color.setHex(0xf97316);
            this.deskLampLight.intensity = 2.0;
        }
    }

    setWeather(type) {
        this.weather = type;
        if (this.rainPoints) {
            this.rainPoints.visible = (type === 'RAIN' || type === 'STORM');
        }
    }

    /**
     * Compute compound wind vector with ZERO ALLOCATIONS
     */
    getWindVectorAt(pos) {
        this._windResult.set(0, 0, 0);

        // 1. Ceiling Fan Conical Downwash (Active in Bedroom)
        if (this.fanEnabled && pos.x >= -14 && pos.x <= 14 && pos.z >= -12 && pos.z <= 12) {
            const dx = pos.x - this.fanPosition.x;
            const dz = pos.z - this.fanPosition.z;
            const hDist = Math.hypot(dx, dz);
            const vDist = this.fanPosition.y - pos.y;
            const maxCone = 2.4 + vDist * 0.45;

            if (vDist > 0 && vDist < 11.0 && hDist < maxCone) {
                const hFactor = 1 - (hDist / maxCone);
                const vFactor = 1 - (vDist / 12.0);
                const strength = hFactor * vFactor * 6.5;

                this._windResult.y -= strength * 1.3; // Downward thrust

                if (hDist > 0.1) {
                    this._windResult.x += (dx / hDist) * strength * 0.35;
                    this._windResult.z += (dz / hDist) * strength * 0.35;
                }
                // Tangential swirl
                this._windResult.x += (-dz / (hDist + 0.01)) * strength * 0.4;
                this._windResult.z += ( dx / (hDist + 0.01)) * strength * 0.4;
            }
        }

        // 2. Outdoor Garden Wind Gusts (Active outdoors X > 15)
        if (pos.x > 15) {
            const gust = Math.sin(this.windTime * 0.8) + Math.cos(this.windTime * 1.7) * 0.5;
            const mult = (this.weather === 'STORM') ? 2.5 : (this.weather === 'RAIN' ? 1.4 : 0.8);
            this._windResult.x += Math.sin(this.windTime * 0.5) * gust * 1.5 * mult;
            this._windResult.z += -Math.abs(gust) * 2.0 * mult;
            this._windResult.y += Math.sin(this.windTime * 1.2) * 0.5 * mult;
        }

        return this._windResult;
    }

    update(dt, playerPos) {
        this.windTime += dt;

        // Update Eye Illuminator follow position
        if (this.eyeLight && playerPos) {
            this.eyeLight.position.copy(playerPos);
        }

        // Rotate Fan Blades
        if (this.bladeHub && this.fanEnabled) {
            this.bladeHub.rotation.y += this.fanSpeed * dt;
        }

        // Update Rain Particles
        if (this.rainPoints && this.rainPoints.visible) {
            const posAttr = this.rainPoints.geometry.attributes.position;
            const arr = posAttr.array;
            const vels = this.rainVelocities;
            const count = this.rainCount;

            for (let i = 0; i < count; i++) {
                const idx = i * 3;
                arr[idx + 1] -= vels[i] * dt;
                if (arr[idx + 1] < 0.2) {
                    arr[idx + 1] = 26.0;
                    arr[idx + 0] = Math.random() * 80 + 10;
                    arr[idx + 2] = Math.random() * 90 - 65;
                }
            }
            posAttr.needsUpdate = true;
        }

        // Lightning in Storm weather
        if (this.weather === 'STORM') {
            this.lightningTimer -= dt;
            if (this.lightningTimer <= 0) {
                this.lightningTimer = Math.random() * 18 + 10;
                this.lightningFlash = 1.0;
                if (window.soundEngine && typeof window.soundEngine.playThunder === 'function') {
                    window.soundEngine.playThunder();
                }
            }

            if (this.lightningFlash > 0) {
                this.lightningFlash -= dt * 3.5;
                const flash = Math.max(0, this.lightningFlash);
                if (this.ambientLight) {
                    this.ambientLight.intensity = (this.nightVisionBoosted ? 3.2 : 1.9) + flash * 4.0;
                }
            }
        }
    }
}

window.DynamicEnvironment = DynamicEnvironment;
