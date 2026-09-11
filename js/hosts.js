/**
 * 4 Host Species — 3D Procedural Models & Anatomic Capillary Landing Zones
 * Three.js r128 Compatible
 * Through the Eyes of a Mosquito
 *
 * Species:
 * 1. HUMAN — High CO2, warm thermoreception, slow deep breathing, lethal swat
 * 2. DOG   — Strong body heat & skin odor, twitching ear, high blood yield
 * 3. CAT   — High agility, sudden lightning-fast pounce swat, stealthy
 * 4. BIRD  — Rapid head twitches, perching hops, lightweight target
 */

class Host {
    constructor(scene, type, position, options = {}) {
        this.scene = scene;
        this.type = type;
        this.id = options.id || `${type}_${Math.floor(Math.random() * 1000)}`;
        this.group = new THREE.Group();
        this.active = true;
        this.alertness = options.initialAlertness || 0; // 0–100%
        this.bloodAvailable = 100;

        this.landingZones = [];
        this.breatheMesh = null;
        this.breatheTime = Math.random() * 10;
        this.currentActivity = 'RESTING'; // 'RESTING', 'TWITCHING', 'ALERT', 'SWATTING'

        const cfg = Host.CONFIG[type] || Host.CONFIG.HUMAN;
        this.name          = options.name || cfg.name;
        this.co2Strength   = cfg.co2;
        this.heatStrength  = cfg.heat;
        this.odorStrength  = cfg.odor;
        this.movementRate  = cfg.movement;
        this.swatDanger    = cfg.swatDanger;
        this.bloodYield    = cfg.bloodYield;
        this.color         = cfg.color;
        this.speciesArea   = options.area || 'BEDROOM';

        this._build();
        this.group.position.copy(position);
        if (options.rotationY !== undefined) this.group.rotation.y = options.rotationY;
        scene.add(this.group);
    }

    static get CONFIG() {
        return {
            HUMAN: { name: 'Sleeping Human', co2: 1.0,  heat: 1.0,  odor: 1.0,  movement: 0.25, swatDanger: 0.95, bloodYield: 100, color: 0xdf9b77 },
            DOG:   { name: 'Sleeping Dog',   co2: 0.75, heat: 1.15, odor: 0.85, movement: 0.45, swatDanger: 0.60, bloodYield: 80,  color: 0xc29864 },
            CAT:   { name: 'Alert Cat',      co2: 0.50, heat: 0.95, odor: 0.50, movement: 0.75, swatDanger: 0.85, bloodYield: 60,  color: 0x475569 },
            BIRD:  { name: 'Caged Parakeet', co2: 0.35, heat: 1.25, odor: 0.30, movement: 0.85, swatDanger: 0.40, bloodYield: 35,  color: 0x10b981 },
        };
    }

    _mat(color, roughness = 0.8, metalness = 0.05) {
        return new THREE.MeshStandardMaterial({ color, roughness, metalness });
    }

    /**
     * Helper to create capsule-like rounded cylinders in Three.js r128
     */
    _createCapsuleMesh(radius, length, mat) {
        const group = new THREE.Group();
        const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 12), mat);
        group.add(cylinder);

        const capTop = new THREE.Mesh(new THREE.SphereGeometry(radius, 10, 8), mat);
        capTop.position.y = length / 2;
        group.add(capTop);

        const capBottom = new THREE.Mesh(new THREE.SphereGeometry(radius, 10, 8), mat);
        capBottom.position.y = -length / 2;
        group.add(capBottom);

        return group;
    }

    _build() {
        if (this.type === 'HUMAN') this._buildHuman();
        else if (this.type === 'DOG') this._buildDog();
        else if (this.type === 'CAT') this._buildCat();
        else if (this.type === 'BIRD') this._buildBird();
    }

    _buildHuman() {
        const skinMat = this._mat(this.color, 0.75);
        const clothMat = this._mat(0x3b82f6, 0.85);

        // Torso / Chest (Lying prone on bed)
        const torso = this._createCapsuleMesh(0.7, 2.6, clothMat);
        torso.rotation.x = Math.PI / 2;
        torso.position.set(0, 0.85, 0);
        this.group.add(torso);
        this.breatheMesh = torso;

        // Head with neck
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 12), skinMat);
        head.position.set(0, 1.1, 2.0);
        this.group.add(head);

        // Pillow beneath head
        const pillow = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 1.6), this._mat(0xf8fafc, 0.9));
        pillow.position.set(0, 0.7, 2.0);
        this.group.add(pillow);

        // Arms (Forearms exposed on sheet)
        [-0.95, 0.95].forEach((x, idx) => {
            const arm = this._createCapsuleMesh(0.24, 2.2, skinMat);
            arm.rotation.x = Math.PI / 2;
            arm.rotation.z = idx === 0 ? 0.2 : -0.2;
            arm.position.set(x, 0.65, 0.4);
            this.group.add(arm);
        });

        // Legs under sheet
        [-0.42, 0.42].forEach(x => {
            const leg = this._createCapsuleMesh(0.32, 2.6, clothMat);
            leg.rotation.x = Math.PI / 2;
            leg.position.set(x, 0.65, -2.2);
            this.group.add(leg);

            // Exposed ankle skin
            const foot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.6), skinMat);
            foot.position.set(x, 0.35, -3.8);
            this.group.add(foot);
        });

        // Capillary Landing Zones
        this._addLandingZone(new THREE.Vector3(0.35, 1.25, 1.8), 0.6, 'Jugular Capillary (Neck)');
        this._addLandingZone(new THREE.Vector3(-0.95, 0.85, 0.6), 0.5, 'Radial Vein (Forearm)');
        this._addLandingZone(new THREE.Vector3(0.42, 0.55, -3.8), 0.5, 'Lateral Malleolus (Ankle)');
    }

    _buildDog() {
        const furMat = this._mat(this.color, 0.9);
        const noseMat = this._mat(0x18181b, 0.5);

        // Torso curled on rug
        const torso = this._createCapsuleMesh(0.55, 1.8, furMat);
        torso.rotation.x = Math.PI / 2;
        torso.rotation.z = 0.4;
        torso.position.set(0, 0.55, 0);
        this.group.add(torso);
        this.breatheMesh = torso;

        // Dog Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), furMat);
        head.position.set(0.65, 0.7, 1.0);
        this.group.add(head);

        // Muzzle / Snout
        const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.5, 10), furMat);
        muzzle.rotation.x = Math.PI / 2;
        muzzle.position.set(0.75, 0.6, 1.45);
        this.group.add(muzzle);

        // Nose tip
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), noseMat);
        nose.position.set(0.75, 0.62, 1.72);
        this.group.add(nose);

        // Floppy Ears
        [-0.25, 0.25].forEach(xOff => {
            const ear = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.45, 0.25), furMat);
            ear.position.set(0.65 + xOff, 0.75, 0.9);
            ear.rotation.z = xOff < 0 ? 0.4 : -0.4;
            this.group.add(ear);
        });

        // Tail curled
        const tail = this._createCapsuleMesh(0.1, 0.9, furMat);
        tail.position.set(-0.6, 0.4, -1.0);
        tail.rotation.z = 1.1;
        this.group.add(tail);

        // Capillary Landing Zones (High blood flow, thin fur areas)
        this._addLandingZone(new THREE.Vector3(0.5, 0.95, 0.95), 0.5, 'Inner Ear Capillaries');
        this._addLandingZone(new THREE.Vector3(0.75, 0.72, 1.55), 0.4, 'Nasal Dermus');
        this._addLandingZone(new THREE.Vector3(-0.2, 0.75, 0.2), 0.6, 'Abdominal Ventral Skin');
    }

    _buildCat() {
        const furMat = this._mat(this.color, 0.85);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, emissive: 0x3f6212, roughness: 0.2 });

        // Sleek Torso (Crouched or upright resting)
        const torso = this._createCapsuleMesh(0.35, 1.3, furMat);
        torso.rotation.x = Math.PI / 2.3;
        torso.position.set(0, 0.6, 0);
        this.group.add(torso);
        this.breatheMesh = torso;

        // Cat Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), furMat);
        head.position.set(0, 1.05, 0.65);
        this.group.add(head);

        // Glowing Cat Eyes
        [-0.12, 0.12].forEach(xOff => {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeMat);
            eye.position.set(xOff, 1.12, 0.92);
            this.group.add(eye);
        });

        // Pointed Triangular Ears
        [-0.18, 0.18].forEach(xOff => {
            const earGeo = new THREE.ConeGeometry(0.12, 0.26, 4);
            const ear = new THREE.Mesh(earGeo, furMat);
            ear.position.set(xOff, 1.4, 0.62);
            ear.rotation.z = xOff < 0 ? 0.3 : -0.3;
            this.group.add(ear);
        });

        // Cat Tail (Curled S-curve)
        const tail = this._createCapsuleMesh(0.06, 1.1, furMat);
        tail.position.set(0, 0.7, -0.85);
        tail.rotation.x = -0.5;
        tail.rotation.y = 0.3;
        this.group.add(tail);

        // Capillary Landing Zones
        this._addLandingZone(new THREE.Vector3(-0.16, 1.42, 0.64), 0.45, 'Cat Pinna / Ear Flap');
        this._addLandingZone(new THREE.Vector3(0, 0.95, 0.88), 0.35, 'Whisker Pad Dermus');
    }

    _buildBird() {
        const featherMat = this._mat(this.color, 0.8);
        const beakMat    = this._mat(0xf59e0b, 0.4);

        // Bird Body (Compact egg shape)
        const bodyGeo = new THREE.SphereGeometry(0.35, 10, 8);
        const body = new THREE.Mesh(bodyGeo, featherMat);
        body.scale.set(0.8, 1.1, 1.2);
        body.position.set(0, 0.55, 0);
        this.group.add(body);
        this.breatheMesh = body;

        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), featherMat);
        head.position.set(0, 0.95, 0.25);
        this.group.add(head);

        // Beak
        const beak = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 6), beakMat);
        beak.rotation.x = Math.PI / 2;
        beak.position.set(0, 0.92, 0.46);
        this.group.add(beak);

        // Tail Feathers
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.7), this._mat(0x047857, 0.9));
        tail.position.set(0, 0.45, -0.65);
        tail.rotation.x = -0.3;
        this.group.add(tail);

        // Wooden Perch
        const perch = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.0, 8), this._mat(0x78350f, 0.8));
        perch.rotation.z = Math.PI / 2;
        perch.position.set(0, 0.15, 0);
        this.group.add(perch);

        // Capillary Landing Zones
        this._addLandingZone(new THREE.Vector3(0, 1.15, 0.15), 0.35, 'Cranial Bare Patch');
        this._addLandingZone(new THREE.Vector3(0.12, 0.22, 0.05), 0.3, 'Tarsus / Bird Leg Skin');
    }

    _addLandingZone(relativePos, radius, name) {
        // Invisible trigger sphere + pulsing glowing target ring
        const ringGeo = new THREE.RingGeometry(radius * 0.4, radius * 0.6, 16);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xff1744,
            transparent: true,
            opacity: 0.65,
            side: THREE.DoubleSide
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.copy(relativePos);
        ringMesh.rotation.x = -Math.PI / 2;
        this.group.add(ringMesh);

        this.landingZones.push({
            relativePos,
            radius,
            name,
            ringMesh,
            getWorldPosition: () => {
                const wp = new THREE.Vector3();
                ringMesh.getWorldPosition(wp);
                return wp;
            }
        });
    }

    update(dt) {
        this.breatheTime += dt * 1.5;

        // 1. Rhythmic breathing oscillation
        if (this.breatheMesh) {
            const bRate = this.type === 'HUMAN' ? 1.0 : (this.type === 'DOG' ? 1.6 : 2.2);
            const scaleOffset = Math.sin(this.breatheTime * bRate) * 0.035;
            this.breatheMesh.scale.set(1 + scaleOffset, 1 + scaleOffset, 1 + scaleOffset);
        }

        // 2. Pulse landing zone rings
        const t = performance.now() * 0.003;
        this.landingZones.forEach((lz, idx) => {
            if (lz.ringMesh) {
                const pulse = 0.5 + Math.sin(t * 3 + idx) * 0.3;
                lz.ringMesh.material.opacity = pulse;
                const s = 1.0 + Math.sin(t * 3 + idx) * 0.15;
                lz.ringMesh.scale.set(s, s, s);
            }
        });

        // 3. Alertness natural decay if player far away
        if (this.alertness > 0) {
            this.alertness = Math.max(0, this.alertness - dt * 2.5);
        }
    }

    dispose() {
        this.active = false;
        this.scene.remove(this.group);
    }
}

window.Host = Host;
