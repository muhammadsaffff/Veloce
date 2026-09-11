/**
 * 4-Channel Sensory Physics & Multispectral Perception Visualizer
 * Through the Eyes of a Mosquito — Production Upgrade
 *
 * Performance Features:
 * - 10–25 FPS update frequency (decoupled from 60 FPS render loop)
 * - 4 distinct biological sensory channels (CO₂, Heat, Odor, Movement)
 * - Target attraction scoring formula
 * - Multispectral perception modes: NORMAL, LOW LIGHT, HEAT, CO2, ODOR, MOVEMENT, FULL PERCEPTION
 * - 3D Quadratic Bézier guidance curve leading to target capillary
 */

class SensorSystem {
    constructor(scene) {
        this.scene = scene;

        this.MODES = ['NORMAL', 'LOW LIGHT', 'HEAT', 'CO2', 'ODOR', 'MOVEMENT', 'FULL PERCEPTION'];
        this.currentModeIndex = 0;
        this.currentMode = 'NORMAL';
        this.perceptionModeActive = false;

        this.selectedHost = null;
        this.guidanceSpline = null;
        this.perceptionMeshes = [];

        this.lastSensorData = {
            co2: 0,
            heat: 0,
            odor: 0,
            movement: 0,
            attraction: 0,
            nearestDist: '--',
            dangerScore: 0
        };

        this._initGuidanceSpline();
    }

    _initGuidanceSpline() {
        const points = [];
        for (let i = 0; i < 20; i++) points.push(new THREE.Vector3(0, 0, 0));

        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({
            color: 0x00e5ff,
            linewidth: 3,
            transparent: true,
            opacity: 0.85,
            depthTest: false
        });
        this.guidanceSpline = new THREE.Line(geo, mat);
        this.guidanceSpline.renderOrder = 999;
        this.guidanceSpline.visible = false;
        this.scene.add(this.guidanceSpline);
    }

    buildPerceptionVisuals(hosts) {
        for (const host of hosts) {
            const hPos = host.group.position;

            // 1. CO2 Plume ring (Cyan)
            const co2Geo = new THREE.RingGeometry(0.5, 0.75, 16);
            const co2Mat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, side: THREE.DoubleSide, transparent: true, opacity: 0.65, depthTest: false });
            const co2Mesh = new THREE.Mesh(co2Geo, co2Mat);
            co2Mesh.rotation.x = Math.PI / 2;
            co2Mesh.position.set(hPos.x, hPos.y + 1.2, hPos.z);
            co2Mesh.renderOrder = 998;
            co2Mesh.visible = false;
            this.scene.add(co2Mesh);

            // 2. Heat Aura (Red-Orange)
            const heatGeo = new THREE.SphereGeometry(1.8, 8, 6);
            const heatMat = new THREE.MeshBasicMaterial({ color: 0xff3d00, wireframe: true, transparent: true, opacity: 0.5, depthTest: false });
            const heatMesh = new THREE.Mesh(heatGeo, heatMat);
            heatMesh.position.copy(hPos);
            heatMesh.renderOrder = 998;
            heatMesh.visible = false;
            this.scene.add(heatMesh);

            this.perceptionMeshes.push({ host, co2Mesh, heatMesh });
        }
    }

    togglePerceptionMode() {
        this.currentModeIndex = (this.currentModeIndex + 1) % this.MODES.length;
        this.currentMode = this.MODES[this.currentModeIndex];
        this.perceptionModeActive = (this.currentMode !== 'NORMAL');
        this._updateVisibility();
        return this.perceptionModeActive;
    }

    _updateVisibility() {
        const isSpec = this.perceptionModeActive;
        for (const item of this.perceptionMeshes) {
            item.co2Mesh.visible = isSpec && (this.currentMode === 'CO2' || this.currentMode === 'FULL PERCEPTION');
            item.heatMesh.visible = isSpec && (this.currentMode === 'HEAT' || this.currentMode === 'FULL PERCEPTION');
        }
        if (this.guidanceSpline) {
            this.guidanceSpline.visible = isSpec;
        }
    }

    computeSensors(playerPos, hosts) {
        let maxCO2 = 0, maxHeat = 0, maxOdor = 0, maxMovement = 0;
        let bestScore = -Infinity;
        let nearestHost = null;
        let nearestDist = Infinity;

        const activeHosts = (hosts || []).filter(h => h.active);

        for (let i = 0; i < activeHosts.length; i++) {
            const host = activeHosts[i];
            const d = host.group.position.distanceTo(playerPos);
            if (d < nearestDist) nearestDist = d;

            // Distance falloff physics
            const co2Sig  = (host.co2Strength  || 1.0) / (1 + d * 0.08); // Plumes reach 30m
            const heatSig = (host.heatStrength || 1.0) / (1 + d * 0.30); // Heat reaches ~3m
            const odorSig = (host.odorStrength || 1.0) / (1 + d * 0.12); // Skin volatiles reach 15m
            const moveSig = (host.movementRate || 0.3) / (1 + d * 0.22); // Johnston's organ

            maxCO2  = Math.max(maxCO2, co2Sig);
            maxHeat = Math.max(maxHeat, heatSig);
            maxOdor = Math.max(maxOdor, odorSig);
            maxMovement = Math.max(maxMovement, moveSig);

            const distScore = Math.max(0, 1 - (d / 32));
            const dangerPenalty = ((host.alertness || 0) / 100) * 0.35;

            // Biological Attraction Formula
            const attraction = (
                co2Sig * 0.30 +
                heatSig * 0.25 +
                odorSig * 0.20 +
                moveSig * 0.10 +
                distScore * 0.15 -
                dangerPenalty
            ) * 100;

            if (attraction > bestScore) {
                bestScore = attraction;
                nearestHost = host;
            }
        }

        this.selectedHost = nearestHost;

        this.lastSensorData = {
            co2: Math.min(100, Math.round(maxCO2 * 100)),
            heat: Math.min(100, Math.round(maxHeat * 100)),
            odor: Math.min(100, Math.round(maxOdor * 100)),
            movement: Math.min(100, Math.round(maxMovement * 100)),
            attraction: Math.max(0, Math.min(100, Math.round(bestScore))),
            nearestDist: nearestDist < 999 ? nearestDist : 999,
            dangerScore: nearestHost ? Math.round(nearestHost.alertness || 0) : 0
        };

        return {
            sensorData: this.lastSensorData,
            nearestHost: nearestHost,
            nearestDist: nearestDist
        };
    }

    updatePerceptionPulse(dt) {
        if (!this.perceptionModeActive) return;
        const time = performance.now() * 0.003;
        for (const item of this.perceptionMeshes) {
            if (item.co2Mesh.visible) {
                const s = 1.0 + Math.sin(time) * 0.2;
                item.co2Mesh.scale.set(s, s, 1);
            }
            if (item.heatMesh.visible) {
                const s = 1.0 + Math.cos(time * 1.5) * 0.1;
                item.heatMesh.scale.set(s, s, s);
            }
        }
    }

    updateGuidanceSpline(playerPos, targetHost) {
        if (!this.guidanceSpline || !this.perceptionModeActive || !targetHost || !playerPos) {
            if (this.guidanceSpline) this.guidanceSpline.visible = false;
            return;
        }

        const targetPos = targetHost.group.position.clone();
        targetPos.y += 1.0;

        const mid = new THREE.Vector3().addVectors(playerPos, targetPos).multiplyScalar(0.5);
        mid.y += 1.8;

        const curve = new THREE.QuadraticBezierCurve3(playerPos, mid, targetPos);
        const curvePoints = curve.getPoints(19);

        const posAttr = this.guidanceSpline.geometry.attributes.position;
        for (let i = 0; i < curvePoints.length; i++) {
            posAttr.setXYZ(i, curvePoints[i].x, curvePoints[i].y, curvePoints[i].z);
        }
        posAttr.needsUpdate = true;
        this.guidanceSpline.visible = true;
    }
}

window.SensorSystem = SensorSystem;
