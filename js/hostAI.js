/**
 * Host Autonomous AI Behavior Trees & Swat Defense
 * Through the Eyes of a Mosquito
 *
 * Implements:
 * 1. Proximity disturbance sensing (acoustic wing buzz displaces air)
 * 2. Species-specific autonomous idle animations & twitches
 * 3. Alertness accumulation (0–100%)
 * 4. Telegraphed swat defense with expanding red warning ring visual
 * 5. Swat hit and near-miss evasion detection
 */

class HostAI {
    constructor(hosts) {
        this.hosts = hosts || [];
        this.swatRings = [];
    }

    setHosts(hosts) {
        this.hosts = hosts;
    }

    update(dt, playerPos, playerVelocity, scene) {
        const speed = playerVelocity ? playerVelocity.length() : 0;

        for (const host of this.hosts) {
            if (!host.active) continue;
            host.update(dt);
            this._updateHostBehavior(host, dt, playerPos, speed, scene);
        }

        this._updateSwatRings(dt, scene);
    }

    _updateHostBehavior(host, dt, playerPos, playerSpeed, scene) {
        const dist = host.group.position.distanceTo(playerPos);

        // 1. Proximity Disturbance Sensing
        if (dist < 1.8) {
            // Very close: wing buzzing vibration triggers rapid alertness
            const speedFactor = 1 + playerSpeed * 0.45;
            host.alertness = Math.min(100, host.alertness + dt * 24.0 * speedFactor);
        } else if (dist < 4.5) {
            host.alertness = Math.min(100, host.alertness + dt * 7.5);
        } else {
            // Natural alertness calming
            host.alertness = Math.max(0, host.alertness - dt * 3.2);
        }

        // 2. Species-Specific Autonomous Idle Actions & Twitches
        host._idleTimer = (host._idleTimer || 0) + dt;

        if (host.type === 'HUMAN') {
            // Periodic tossing and turning in bed
            if (host._idleTimer > 16 + Math.random() * 14) {
                host._idleTimer = 0;
                host.group.rotation.y += (Math.random() - 0.5) * 0.22;
                host.alertness = Math.min(100, host.alertness + 8);
            }
        } else if (host.type === 'DOG') {
            // Ear scratching or body shake
            if (host._idleTimer > 9 + Math.random() * 9) {
                host._idleTimer = 0;
                host.alertness = Math.min(100, host.alertness + 12);
                host.group.rotation.y += (Math.random() - 0.5) * 0.35;
            }
        } else if (host.type === 'CAT') {
            // Cat: Sudden stalking pounce or head flick
            if (host._idleTimer > 5 + Math.random() * 7) {
                host._idleTimer = 0;
                host.alertness = Math.min(100, host.alertness + 18);
                host.group.rotation.y += (Math.random() - 0.5) * 0.55;
            }
        } else if (host.type === 'BIRD') {
            // Bird: Quick perching hops
            if (host._idleTimer > 2.5 + Math.random() * 3.5) {
                host._idleTimer = 0;
                host.group.position.x += (Math.random() - 0.5) * 0.3;
                host.group.position.z += (Math.random() - 0.5) * 0.3;
                host.alertness = Math.min(100, host.alertness + 10);
            }
        }

        // 3. Swat Trigger when Alertness >= 85%
        if (host.alertness >= 85 && !host._swatCooldown) {
            this._triggerSwat(host, playerPos, scene);
            host._swatCooldown = true;
            // Cooldown before next swat
            const cd = host.type === 'CAT' ? 2200 : (host.type === 'HUMAN' ? 3400 : 2800);
            setTimeout(() => { host._swatCooldown = false; }, cd);
        }
    }

    _triggerSwat(host, playerPos, scene) {
        if (window.soundEngine) {
            window.soundEngine.playSwatWhoosh();
            window.soundEngine.playAlertAlarm();
        }

        // Telegraphed Attack Ring: Red expanding shockwave ring
        const ringGeo = new THREE.RingGeometry(0.35, 0.65, 24);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xff1744,
            transparent: true,
            opacity: 0.95,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(host.group.position);
        ring.position.y += 1.0;
        ring.rotation.x = -Math.PI / 2;
        ring._life = 1.0;
        ring._speed = host.type === 'CAT' ? 6.5 : 4.8;
        scene.add(ring);
        this.swatRings.push({ mesh: ring, scene });

        // Swat Hit / Near-Miss Detection
        const swatDist = host.group.position.distanceTo(playerPos);
        const dangerRadius = 2.4 * (host.swatDanger || 0.8);

        if (swatDist < dangerRadius) {
            // Direct Hit!
            window.dispatchEvent(new CustomEvent('hostSwatHit', { detail: { host } }));
        } else {
            // Near Miss: Mosquito felt the displacement wave!
            window.dispatchEvent(new CustomEvent('hostSwatNearMiss', { detail: { host, distance: swatDist } }));
        }
    }

    _updateSwatRings(dt, scene) {
        for (let i = this.swatRings.length - 1; i >= 0; i--) {
            const r = this.swatRings[i];
            r.mesh._life -= dt * 1.8;
            r.mesh.scale.setScalar(1 + (1 - r.mesh._life) * r.mesh._speed);
            r.mesh.material.opacity = Math.max(0, r.mesh._life * 0.95);

            if (r.mesh._life <= 0) {
                scene.remove(r.mesh);
                this.swatRings.splice(i, 1);
            }
        }
    }

    /**
     * Spawn 4 host species across the 28×12×24m bedroom
     */
    spawnWorldHosts(scene) {
        const hostConfigs = [
            // 1. Sleeping Human on the giant bed (-6, 1.2, -4)
            {
                type: 'HUMAN',
                name: 'Sleeping Human (Bed)',
                pos: new THREE.Vector3(-6.0, 1.2, -4.0),
                area: 'BEDROOM',
                rotY: 0
            },
            // 2. Sleeping Dog on the soft floor rug (2, 0.05, 2)
            {
                type: 'DOG',
                name: 'Family Golden Retriever (Rug)',
                pos: new THREE.Vector3(2.0, 0.05, 2.0),
                area: 'BEDROOM',
                rotY: -0.5
            },
            // 3. Alert Cat on the study desk ledge (7.5, 4.3, -4.5)
            {
                type: 'CAT',
                name: 'Prowling Cat (Desk Ledge)',
                pos: new THREE.Vector3(7.5, 4.3, -4.5),
                area: 'BEDROOM',
                rotY: Math.PI / 1.5
            },
            // 4. Parakeet near window & plant (0.0, 5.5, 11.0)
            {
                type: 'BIRD',
                name: 'Window Parakeet (Perch)',
                pos: new THREE.Vector3(0.0, 5.5, 11.0),
                area: 'BEDROOM',
                rotY: Math.PI
            },
        ];

        return hostConfigs.map(cfg => new window.Host(scene, cfg.type, cfg.pos, {
            name: cfg.name,
            area: cfg.area,
            rotationY: cfg.rotY
        }));
    }
}

window.HostAI = HostAI;
