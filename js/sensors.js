/**
 * 4-Channel Sensory Physics & Mosquito Perception Mode Visualizer
 * Through the Eyes of a Mosquito
 *
 * Implements:
 * 1. CO2 (cyan) — Long-range chemoreception breath plumes
 * 2. Heat/Infrared (red-orange) — Close-range TRPA1 thermoreception
 * 3. Odor (amber) — Antennal skin volatile clouds
 * 4. Movement (violet) — Johnston's organ acoustic/mechanoreception ripples
 *
 * Mosquito Perception Mode [T / Tab]:
 * - Visual world darkens to thermal wireframe
 * - Sensory signals glow brightly through walls (depthTest: false, renderOrder: 998/999)
 * - 3D Bézier guidance spline points directly to highest attraction target
 */

class SensorSystem {
    constructor(scene) {
        this.scene = scene;
        this.perceptionModeActive = false;
        this.perceptionMeshes = [];
        this.guidanceSpline = null;

        this.selectedHost = null;

        this.lastSensorData = {
            co2: 0,
            heat: 0,
            odor: 0,
            movement: 0,
            attraction: 0,
            nearestDist: '--',
            dangerScore: 0
        };
    }

    togglePerceptionMode() {
        this.perceptionModeActive = !this.perceptionModeActive;
        this._updateMeshVisibility();
        return this.perceptionModeActive;
    }

    setPerceptionMode(active) {
        this.perceptionModeActive = active;
        this._updateMeshVisibility();
    }

    _updateMeshVisibility() {
        for (const item of this.perceptionMeshes) {
            item.mesh.visible = this.perceptionModeActive;
        }

        if (this.guidanceSpline) {
            this.guidanceSpline.visible = this.perceptionModeActive;
        }

        // Show/hide safe zone indicator halos
        if (window.gameEngine?.world?.safeZones) {
            window.gameEngine.world.safeZones.forEach(sz => {
                if (sz._mesh) sz._mesh.visible = this.perceptionModeActive;
            });
        }
    }

    computeSensors(playerPos, hosts) {
        let maxCO2 = 0, maxHeat = 0, maxOdor = 0, maxMovement = 0;
        let bestScore = -Infinity;
        let autoTarget = null;
        let nearestDist = Infinity;

        const activeHosts = hosts.filter(h => h.active);

        for (const host of activeHosts) {
            const d = host.group.position.distanceTo(playerPos);
            if (d < nearestDist) nearestDist = d;

            // Scientific distance falloff: Signal = S0 / (1 + distance * falloffRate)
            const co2Signal  = (host.co2Strength  || 1.0) / (1 + d * 0.08); // Long range
            const heatSignal = (host.heatStrength || 1.0) / (1 + d * 0.28); // Short range
            const odorSignal = (host.odorStrength || 1.0) / (1 + d * 0.12); // Medium range
            const moveSignal = (host.movementRate || 0.3) / (1 + d * 0.22); // Kinetic ripples

            maxCO2      = Math.max(maxCO2, co2Signal);
            maxHeat     = Math.max(maxHeat, heatSignal);
            maxOdor     = Math.max(maxOdor, odorSignal);
            maxMovement = Math.max(maxMovement, moveSignal);

            // Distance proximity score
            const distScore = Math.max(0, 1 - d / 28);

            // Target Attraction Formula
            const attraction = (
                co2Signal  * 0.30 +
                heatSignal * 0.25 +
                odorSignal * 0.20 +
                moveSignal * 0.10 +
                distScore  * 0.15
            ) * 100;

            // Danger penalty based on host alertness & species swat risk
            const dangerPenalty = (host.alertness / 100) * (host.swatDanger || 0.5) * 45;
            const finalScore = attraction - dangerPenalty;

            if (finalScore > bestScore) {
                bestScore = finalScore;
                autoTarget = host;
            }
        }

        this.selectedHost = autoTarget;
        const targetDist = this.selectedHost ? this.selectedHost.group.position.distanceTo(playerPos) : nearestDist;

        this.lastSensorData = {
            co2:         Math.round(Math.min(100, maxCO2 * 100)),
            heat:        Math.round(Math.min(100, maxHeat * 100)),
            odor:        Math.round(Math.min(100, maxOdor * 100)),
            movement:    Math.round(Math.min(100, maxMovement * 100)),
            attraction:  Math.round(Math.max(0, Math.min(100, bestScore))),
            nearestDist: targetDist < Infinity ? targetDist.toFixed(1) : '--',
            dangerScore: this.selectedHost ? Math.round(this.selectedHost.alertness) : 0
        };

        return {
            sensorData: this.lastSensorData,
            nearestHost: this.selectedHost,
            nearestDist
        };
    }

    buildPerceptionVisuals(hosts) {
        // Clear previous meshes
        this.perceptionMeshes.forEach(p => this.scene.remove(p.mesh));
        this.perceptionMeshes = [];
        if (this.guidanceSpline) {
            this.scene.remove(this.guidanceSpline);
            this.guidanceSpline = null;
        }

        for (const host of hosts) {
            if (!host.active) continue;

            // 1. CO2 breath plume (Cyan) — Glowing through walls
            const co2Geo = new THREE.SphereGeometry(2.6 * (host.co2Strength || 1.0), 16, 12);
            const co2Mat = new THREE.MeshBasicMaterial({
                color: 0x00e5ff,
                transparent: true,
                opacity: 0.18,
                depthTest: false,
                wireframe: false
            });
            const co2Mesh = new THREE.Mesh(co2Geo, co2Mat);
            co2Mesh.position.copy(host.group.position);
            co2Mesh.position.y += 1.2;
            co2Mesh.renderOrder = 998;
            co2Mesh.visible = this.perceptionModeActive;
            this.scene.add(co2Mesh);
            this.perceptionMeshes.push({ mesh: co2Mesh, channel: 'CO2', baseOpacity: 0.18 });

            // 2. Heat Infrared Halo (Orange-Red) — Glowing through walls
            const heatGeo = new THREE.SphereGeometry(1.9 * (host.heatStrength || 1.0), 14, 10);
            const heatMat = new THREE.MeshBasicMaterial({
                color: 0xff3d00,
                transparent: true,
                opacity: 0.22,
                depthTest: false
            });
            const heatMesh = new THREE.Mesh(heatGeo, heatMat);
            heatMesh.position.copy(host.group.position);
            heatMesh.position.y += 0.8;
            heatMesh.renderOrder = 998;
            heatMesh.visible = this.perceptionModeActive;
            this.scene.add(heatMesh);
            this.perceptionMeshes.push({ mesh: heatMesh, channel: 'HEAT', baseOpacity: 0.22 });

            // 3. Odor Skin Volatile Cloud (Amber-Gold) — Glowing through walls
            const odorGeo = new THREE.SphereGeometry(2.4 * (host.odorStrength || 1.0), 14, 10);
            const odorMat = new THREE.MeshBasicMaterial({
                color: 0xffb300,
                transparent: true,
                opacity: 0.14,
                depthTest: false
            });
            const odorMesh = new THREE.Mesh(odorGeo, odorMat);
            odorMesh.position.copy(host.group.position);
            odorMesh.renderOrder = 998;
            odorMesh.visible = this.perceptionModeActive;
            this.scene.add(odorMesh);
            this.perceptionMeshes.push({ mesh: odorMesh, channel: 'ODOR', baseOpacity: 0.14 });

            // 4. Movement Acoustic Ripple Ring (Violet) — Mechanoreception
            const moveGeo = new THREE.RingGeometry(0.8, 1.4, 24);
            const moveMat = new THREE.MeshBasicMaterial({
                color: 0xc084fc,
                transparent: true,
                opacity: 0.75,
                side: THREE.DoubleSide,
                depthTest: false
            });
            const moveMesh = new THREE.Mesh(moveGeo, moveMat);
            moveMesh.position.copy(host.group.position);
            moveMesh.position.y += 0.15;
            moveMesh.rotation.x = -Math.PI / 2;
            moveMesh.renderOrder = 999;
            moveMesh.visible = this.perceptionModeActive;
            this.scene.add(moveMesh);
            this.perceptionMeshes.push({ mesh: moveMesh, channel: 'MOVEMENT', baseOpacity: 0.75 });
        }

        this._updateMeshVisibility();
    }

    updateGuidanceSpline(playerPos, targetHost) {
        if (this.guidanceSpline) {
            this.scene.remove(this.guidanceSpline);
            this.guidanceSpline = null;
        }

        if (!targetHost || !this.perceptionModeActive) return;

        const targetPos = targetHost.group.position.clone();
        targetPos.y += 1.0;

        // Smooth 3D Quadratic Bézier guidance curve from mosquito to target
        const mid = playerPos.clone().lerp(targetPos, 0.5);
        mid.y += 2.0;

        const curve = new THREE.QuadraticBezierCurve3(playerPos.clone(), mid, targetPos);
        const points = curve.getPoints(24);
        const geo = new THREE.BufferGeometry().setFromPoints(points);

        const mat = new THREE.LineBasicMaterial({
            color: 0x00e5ff,
            transparent: true,
            opacity: 0.85,
            depthTest: false,
            linewidth: 2
        });

        this.guidanceSpline = new THREE.Line(geo, mat);
        this.guidanceSpline.renderOrder = 999;
        this.scene.add(this.guidanceSpline);
    }

    updatePerceptionPulse(dt) {
        if (!this.perceptionModeActive) return;

        const t = performance.now() * 0.003;
        for (const item of this.perceptionMeshes) {
            if (item.mesh && item.mesh.visible) {
                const pulse = Math.sin(t * 2 + item.mesh.id) * 0.35;
                item.mesh.material.opacity = Math.max(0.04, item.baseOpacity * (1 + pulse));
            }
        }
    }
}

window.SensorSystem = SensorSystem;
