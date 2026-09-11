/**
 * 3D Procedural Mosquito Model (Three.js r128 compatible)
 * Through the Eyes of a Mosquito
 *
 * Anatomical features:
 * - Slender thorax and articulating head
 * - Ruby-red compound eyes with subtle emissive facet glow
 * - Needle-fine proboscis for capillary feeding
 * - Segmented abdomen that expands and reddens as blood is ingested
 * - Translucent venated wings with high-frequency harmonic flap animation
 * - Slender hexapod legs positioned naturally
 */

class MosquitoModel {
    constructor() {
        this.group = new THREE.Group();
        this.wingTime = 0;
        this.leftWing = null;
        this.rightWing = null;
        this.abdomen = null;
        this.abdomenMat = null;
        this.legs = [];
        this._build();
    }

    _build() {
        const g = this.group;

        // 1. Thorax (central body segment)
        const thoraxGeo = new THREE.SphereGeometry(0.08, 10, 8);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x2b3820,
            roughness: 0.8,
            metalness: 0.15
        });
        const thorax = new THREE.Mesh(thoraxGeo, bodyMat);
        thorax.scale.set(0.9, 0.75, 1.35);
        g.add(thorax);

        // 2. Head
        const headGeo = new THREE.SphereGeometry(0.05, 10, 8);
        const head = new THREE.Mesh(headGeo, bodyMat);
        head.position.set(0, 0.028, 0.11);
        g.add(head);

        // 3. Ruby-Red Compound Eyes
        const eyeMat = new THREE.MeshStandardMaterial({
            color: 0xdd1100,
            roughness: 0.2,
            metalness: 0.6,
            emissive: 0x660000
        });
        const eyeGeo = new THREE.SphereGeometry(0.022, 8, 8);
        [-0.03, 0.03].forEach(xOff => {
            const eye = new THREE.Mesh(eyeGeo, eyeMat);
            eye.position.set(xOff, 0.042, 0.13);
            eye.scale.set(1.0, 1.2, 0.9);
            g.add(eye);
        });

        // 4. Antennae
        const antMat = new THREE.MeshBasicMaterial({ color: 0x1f2937 });
        [-0.018, 0.018].forEach(xOff => {
            const antGeo = new THREE.CylinderGeometry(0.0015, 0.001, 0.09, 4);
            const ant = new THREE.Mesh(antGeo, antMat);
            ant.position.set(xOff, 0.055, 0.145);
            ant.rotation.x = Math.PI / 4;
            ant.rotation.z = xOff > 0 ? -0.25 : 0.25;
            g.add(ant);
        });

        // 5. Proboscis (feeding needle)
        const proGeo = new THREE.CylinderGeometry(0.003, 0.001, 0.20, 6);
        const proMat = new THREE.MeshStandardMaterial({
            color: 0x111827,
            roughness: 0.5,
            metalness: 0.5
        });
        const proboscis = new THREE.Mesh(proGeo, proMat);
        proboscis.position.set(0, -0.005, 0.20);
        proboscis.rotation.x = Math.PI / 2 + 0.12;
        g.add(proboscis);

        // 6. Abdomen (Segmented ellipsoid - engorges with blood intake)
        const abdGeo = new THREE.SphereGeometry(0.07, 12, 10);
        this.abdomenMat = new THREE.MeshStandardMaterial({
            color: 0x3d2b12,
            roughness: 0.65,
            metalness: 0.2
        });
        this.abdomen = new THREE.Mesh(abdGeo, this.abdomenMat);
        this.abdomen.position.set(0, -0.015, -0.16);
        this.abdomen.scale.set(0.9, 0.85, 2.2);
        this.abdomen.rotation.x = 0.22;
        g.add(this.abdomen);

        // 7. Wings (Translucent with light blue/violet sheen)
        const wingMat = new THREE.MeshStandardMaterial({
            color: 0xbae6fd,
            transparent: true,
            opacity: 0.42,
            roughness: 0.1,
            metalness: 0.3,
            side: THREE.DoubleSide
        });

        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.quadraticCurveTo(0.12, 0.06, 0.28, 0.04);
        wingShape.quadraticCurveTo(0.32, 0.0, 0.28, -0.04);
        wingShape.quadraticCurveTo(0.12, -0.06, 0, 0);
        const wingGeo = new THREE.ShapeGeometry(wingShape);

        // Left Wing Pivot
        const leftPivot = new THREE.Group();
        leftPivot.position.set(-0.035, 0.05, -0.01);
        const leftMesh = new THREE.Mesh(wingGeo, wingMat);
        leftMesh.position.set(-0.02, 0, 0);
        leftMesh.rotation.z = Math.PI;
        leftMesh.rotation.y = 0.25;
        leftPivot.add(leftMesh);
        g.add(leftPivot);
        this.leftWing = leftPivot;

        // Right Wing Pivot
        const rightPivot = new THREE.Group();
        rightPivot.position.set(0.035, 0.05, -0.01);
        const rightMesh = new THREE.Mesh(wingGeo, wingMat);
        rightMesh.position.set(0.02, 0, 0);
        rightMesh.rotation.y = -0.25;
        rightPivot.add(rightMesh);
        g.add(rightPivot);
        this.rightWing = rightPivot;

        // 8. Hexapod Insect Legs (3 pairs)
        const legMat = new THREE.MeshBasicMaterial({ color: 0x1c1917 });
        const legConfigs = [
            { x: 0.05, z: 0.04, spread: 0.5, len: 0.18 },
            { x: 0.06, z: -0.01, spread: 0.8, len: 0.24 },
            { x: 0.05, z: -0.06, spread: 0.6, len: 0.28 }
        ];

        legConfigs.forEach(cfg => {
            [-1, 1].forEach(side => {
                const legGroup = new THREE.Group();
                legGroup.position.set(cfg.x * side, -0.03, cfg.z);

                // Femur
                const femur = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.0018, cfg.len * 0.5, 4), legMat);
                femur.position.set(cfg.spread * 0.06 * side, -cfg.len * 0.2, 0);
                femur.rotation.z = -0.6 * side;
                legGroup.add(femur);

                // Tibia
                const tibia = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.001, cfg.len * 0.6, 4), legMat);
                tibia.position.set(cfg.spread * 0.12 * side, -cfg.len * 0.5, 0);
                tibia.rotation.z = 0.4 * side;
                legGroup.add(tibia);

                g.add(legGroup);
                this.legs.push(legGroup);
            });
        });

        // Set overall scale for appropriate camera framing
        g.scale.setScalar(1.2);
    }

    update(dt, speedRatio = 0, isBoosting = false, isLanded = false, bodyLoad = 0) {
        // High-frequency wing flapping (harmonic oscillations)
        if (!isLanded) {
            const flapRate = (isBoosting ? 65 : 45) * (1 + speedRatio * 0.5);
            this.wingTime += dt * flapRate;

            const flapAngle = Math.sin(this.wingTime) * (isBoosting ? 0.75 : 0.55);
            if (this.leftWing) {
                this.leftWing.rotation.z = flapAngle;
                this.leftWing.rotation.x = Math.cos(this.wingTime * 0.5) * 0.15;
            }
            if (this.rightWing) {
                this.rightWing.rotation.z = -flapAngle;
                this.rightWing.rotation.x = -Math.cos(this.wingTime * 0.5) * 0.15;
            }
        } else {
            // Folded resting wings
            if (this.leftWing) {
                this.leftWing.rotation.set(-0.2, 0.15, -0.3);
            }
            if (this.rightWing) {
                this.rightWing.rotation.set(-0.2, -0.15, 0.3);
            }
        }

        // Abdomen expansion & reddening from ingested blood load (0 to 100)
        if (this.abdomen && this.abdomenMat) {
            const loadFactor = Math.min(1.0, bodyLoad / 100);
            const scaleW = 0.9 + loadFactor * 0.85;
            const scaleH = 0.85 + loadFactor * 0.75;
            const scaleL = 2.2 + loadFactor * 0.45;
            this.abdomen.scale.set(scaleW, scaleH, scaleL);

            // Transition color from dark brown to bright arterial crimson
            const r = Math.round(0x3d + (0xcc - 0x3d) * loadFactor);
            const gVal = Math.round(0x2b * (1 - loadFactor * 0.8));
            const b = Math.round(0x12 * (1 - loadFactor * 0.8));
            this.abdomenMat.color.setRGB(r / 255, gVal / 255, b / 255);
            this.abdomenMat.emissive.setRGB((loadFactor * 0.25), 0, 0);
        }
    }
}

window.MosquitoModel = MosquitoModel;
