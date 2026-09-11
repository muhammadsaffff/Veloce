/**
 * Host Autonomous AI Behavior Trees & Telegraphed Swat Defense
 * Through the Eyes of a Mosquito — Production Upgrade
 *
 * Performance Features:
 * - Tiered update frequency (nearby 30–60 FPS, distant 5–15 FPS)
 * - Proximity acoustic/air disturbance sensing from mosquito wing buzz
 * - Telegraphed swat defense with red shockwave ring visual & whoosh SFX
 * - Autonomous idle animations: tossing, ear twitches, cat stalking, bird hops
 */

class HostAI {
    constructor(hosts = []) {
        this.hosts = hosts;
        this.swatRings = [];
        this._swatCenter = new THREE.Vector3();
    }

    setHosts(hosts) {
        this.hosts = hosts;
    }

    spawnWorldHosts(scene) {
        const spawned = [
            // 1. Sleeping Human on Bed (Master Bedroom)
            new window.Host(scene, 'HUMAN', new THREE.Vector3(-6, 2.4, 4.0), {
                id: 'human_bedroom',
                name: 'Sleeping Human (Bed)',
                zoneId: 'BEDROOM',
                rotationY: 0
            }),
            // 2. Sleeping Dog on Rug (Living Room)
            new window.Host(scene, 'DOG', new THREE.Vector3(0, 0.2, 22.0), {
                id: 'dog_living',
                name: 'Family Dog (Rug)',
                zoneId: 'LIVING_ROOM',
                rotationY: Math.PI * 0.25
            }),
            // 3. House Cat on Balcony Deck
            new window.Host(scene, 'CAT', new THREE.Vector3(24, 0.3, -2.0), {
                id: 'cat_balcony',
                name: 'Alert Balcony Cat',
                zoneId: 'BALCONY',
                rotationY: -Math.PI * 0.5
            }),
            // 4. Garden Bird Perched on Tree (Outdoor Garden)
            new window.Host(scene, 'BIRD', new THREE.Vector3(43, 6.5, -9.0), {
                id: 'bird_tree',
                name: 'Oak Tree Songbird',
                zoneId: 'GARDEN_YARD',
                rotationY: Math.PI * 0.4
            })
        ];
        this.hosts = spawned;
        return spawned;
    }

    update(dt, playerPos, playerVelocity, scene, isDistantPass = false) {
        const speed = playerVelocity ? playerVelocity.length() : 0;

        for (let i = 0; i < this.hosts.length; i++) {
            const host = this.hosts[i];
            if (!host.active) continue;

            const dist = host.group.position.distanceTo(playerPos);
            const isNearby = dist < 10.0;

            // Tiered update optimization: distant hosts only updated when isDistantPass is true
            if (!isNearby && !isDistantPass) continue;

            host.update(dt);
            this._updateHostBehavior(host, dt, dist, speed, scene);
        }

        // Swat ring animations update every frame
        if (!isDistantPass) {
            this._updateSwatRings(dt, scene, playerPos);
        }
    }

    _updateHostBehavior(host, dt, dist, playerSpeed, scene) {
        // 1. Proximity Disturbance Sensing
        if (dist < 1.8) {
            // Close: wing drone displacement rapidly elevates alertness
            const speedMult = 1.0 + playerSpeed * 0.4;
            host.alertness = Math.min(100, host.alertness + dt * 26.0 * speedMult);
        } else if (dist < 4.5) {
            host.alertness = Math.min(100, host.alertness + dt * 8.0);
        } else {
            // Calming down
            host.alertness = Math.max(0, host.alertness - dt * 3.5);
        }

        // 2. Autonomous Idle Animations & Twitches
        host._idleTimer = (host._idleTimer || 0) + dt;

        if (host.type === 'HUMAN') {
            if (host._idleTimer > 15 + Math.random() * 10) {
                host._idleTimer = 0;
                host.group.rotation.y += (Math.random() - 0.5) * 0.25;
                host.alertness = Math.min(100, host.alertness + 10);
            }
        } else if (host.type === 'DOG') {
            if (host._idleTimer > 8 + Math.random() * 8) {
                host._idleTimer = 0;
                host.alertness = Math.min(100, host.alertness + 12);
                host.group.rotation.y += (Math.random() - 0.5) * 0.35;
            }
        } else if (host.type === 'CAT') {
            if (host._idleTimer > 4 + Math.random() * 6) {
                host._idleTimer = 0;
                host.alertness = Math.min(100, host.alertness + 18);
                host.group.rotation.y += (Math.random() - 0.5) * 0.5;
            }
        } else if (host.type === 'BIRD') {
            if (host._idleTimer > 2.5 + Math.random() * 3.0) {
                host._idleTimer = 0;
                host.group.position.x += (Math.random() - 0.5) * 0.25;
                host.group.position.z += (Math.random() - 0.5) * 0.25;
                host.alertness = Math.min(100, host.alertness + 8);
            }
        }

        // 3. Swat Defense Trigger when Alertness >= 85%
        if (host.alertness >= 85 && !host._swatCooldown && dist < 6.0) {
            this._triggerSwat(host, scene);
            host._swatCooldown = true;
            const cd = host.type === 'CAT' ? 2200 : (host.type === 'HUMAN' ? 3200 : 2600);
            setTimeout(() => { host._swatCooldown = false; }, cd);
        }
    }

    _triggerSwat(host, scene) {
        if (window.soundEngine) {
            window.soundEngine.playSwatWhoosh();
            window.soundEngine.playAlertAlarm();
        }

        // Expanding Red Warning Shockwave Ring Visual
        const ringGeo = new THREE.RingGeometry(0.1, 0.25, 20);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xff1744,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85,
            depthTest: false
        });
        const mesh = new THREE.Mesh(ringGeo, ringMat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.copy(host.group.position);
        mesh.position.y += 1.0;
        mesh.renderOrder = 999;
        scene.add(mesh);

        const targetRadius = (host.type === 'HUMAN') ? 3.5 : (host.type === 'CAT' ? 2.5 : 3.0);

        this.swatRings.push({
            mesh,
            host,
            center: host.group.position.clone(),
            radius: 0.2,
            maxRadius: targetRadius,
            life: 0.8,
            age: 0,
            hasDamaged: false
        });

        host.alertness = Math.max(30, host.alertness - 45);
    }

    _updateSwatRings(dt, scene, playerPos) {
        for (let i = this.swatRings.length - 1; i >= 0; i--) {
            const ring = this.swatRings[i];
            ring.age += dt;
            const progress = ring.age / ring.life;

            if (progress >= 1.0) {
                scene.remove(ring.mesh);
                ring.mesh.geometry.dispose();
                ring.mesh.material.dispose();
                this.swatRings.splice(i, 1);
                continue;
            }

            ring.radius = progress * ring.maxRadius;
            const scale = ring.radius / 0.25;
            ring.mesh.scale.set(scale, scale, 1);
            ring.mesh.material.opacity = Math.max(0, 0.85 * (1 - progress));

            // Swat collision detection against player
            if (!ring.hasDamaged && playerPos) {
                const distToCenter = playerPos.distanceTo(ring.center);
                if (distToCenter <= ring.radius && Math.abs(playerPos.y - ring.center.y) < 2.2) {
                    ring.hasDamaged = true;

                    // Near miss or direct hit
                    if (distToCenter < 0.6) {
                        window.dispatchEvent(new CustomEvent('hostSwatHit', { detail: { host: ring.host } }));
                    } else {
                        window.dispatchEvent(new CustomEvent('hostSwatNearMiss', { detail: { host: ring.host } }));
                        // Blast wind displacement on near miss
                        if (window.gameEngine && window.gameEngine.player) {
                            window.gameEngine.player.triggerCameraShake(0.5);
                        }
                    }
                }
            }
        }
    }
}

window.HostAI = HostAI;
