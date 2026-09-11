/**
 * 4 Host Species — 3D Procedural Models & Capillary Landing Targets
 * Three.js r128 Compatible
 * Through the Eyes of a Mosquito — Production Upgrade
 *
 * Species:
 * 1. HUMAN: High CO2 plume, slow breathing, lethal swat
 * 2. DOG: Strong body heat & skin odor, twitching ears, high blood yield
 * 3. CAT: High agility, stalking head turns, fast pounce swat
 * 4. BIRD: Quick head twitches, perching hops, lightweight target
 */

class Host {
    constructor(scene, type, position, options = {}) {
        this.scene = scene;
        this.type = type;
        this.id = options.id || `${type}_${Math.floor(Math.random() * 1000)}`;
        this.group = new THREE.Group();
        this.active = true;
        this.alertness = options.initialAlertness || 0;
        this.bloodAvailable = 100;

        this.landingZones = [];
        this.breatheMesh = null;
        this.breatheTime = Math.random() * 10;
        this.zoneId = options.zoneId || 'BEDROOM';

        const cfg = Host.CONFIG[type] || Host.CONFIG.HUMAN;
        this.name         = options.name || cfg.name;
        this.co2Strength  = cfg.co2;
        this.heatStrength = cfg.heat;
        this.odorStrength = cfg.odor;
        this.movementRate = cfg.movement;
        this.swatDanger   = cfg.swatDanger;
        this.bloodYield   = cfg.bloodYield;
        this.color        = cfg.color;

        this._worldLzPos  = new THREE.Vector3(); // Scratch vector

        this._build();
        this.group.position.copy(position);
        if (options.rotationY !== undefined) this.group.rotation.y = options.rotationY;
        scene.add(this.group);
    }

    static get CONFIG() {
        return {
            HUMAN: { name: 'Sleeping Human', co2: 1.0,  heat: 1.0,  odor: 1.0,  movement: 0.25, swatDanger: 0.95, bloodYield: 100, color: 0xdf9b77 },
            DOG:   { name: 'Family Dog',     co2: 0.75, heat: 1.15, odor: 0.85, movement: 0.45, swatDanger: 0.60, bloodYield: 80,  color: 0xc29864 },
            CAT:   { name: 'House Cat',      co2: 0.50, heat: 0.95, odor: 0.50, movement: 0.75, swatDanger: 0.85, bloodYield: 60,  color: 0x475569 },
            BIRD:  { name: 'Garden Bird',    co2: 0.35, heat: 1.25, odor: 0.30, movement: 0.85, swatDanger: 0.40, bloodYield: 35,  color: 0x10b981 },
        };
    }

    _mat(color, roughness = 0.8) {
        return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.05 });
    }

    _createCapsuleMesh(radius, length, mat) {
        const group = new THREE.Group();
        const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 10), mat);
        cylinder.frustumCulled = true;
        group.add(cylinder);

        const capTop = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 6), mat);
        capTop.position.y = length / 2;
        group.add(capTop);

        const capBottom = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 6), mat);
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

        // Torso / Chest
        const torso = this._createCapsuleMesh(0.7, 2.6, clothMat);
        torso.rotation.x = Math.PI / 2;
        torso.position.set(0, 0.85, 0);
        this.group.add(torso);
        this.breatheMesh = torso;

        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 10), skinMat);
        head.position.set(0, 1.1, 2.0);
        this.group.add(head);

        // Hair
        const hair = new THREE.Mesh(new THREE.SphereGeometry(0.58, 10, 8), this._mat(0x1e1b18, 0.95));
        hair.position.set(0, 1.25, 2.1);
        hair.scale.set(1.0, 0.7, 1.0);
        this.group.add(hair);

        // Capillary Landing Zones
        this._addLandingZone('Exposed Forearm Capillary', 0.8, 1.0, 0.5, 0.6);
        this._addLandingZone('Neck Capillary', 0.0, 1.4, 1.6, 0.5);
        this._addLandingZone('Ankle Vein Cluster', -0.5, 0.6, -1.8, 0.5);
    }

    _buildDog() {
        const furMat = this._mat(this.color, 0.9);

        // Dog Body
        const body = this._createCapsuleMesh(0.65, 2.2, furMat);
        body.rotation.x = Math.PI / 2;
        body.position.set(0, 0.7, 0);
        this.group.add(body);
        this.breatheMesh = body;

        // Head & Snout
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 10, 8), furMat);
        head.position.set(0, 1.0, 1.5);
        this.group.add(head);

        const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 0.5, 8), furMat);
        snout.rotation.x = Math.PI / 2;
        snout.position.set(0, 0.9, 1.95);
        this.group.add(snout);

        // Landing Zones
        this._addLandingZone('Ear Flap Capillary', -0.4, 1.15, 1.4, 0.5);
        this._addLandingZone('Inner Belly Warmth', 0.0, 0.6, 0.0, 0.6);
    }

    _buildCat() {
        const furMat = this._mat(this.color, 0.85);

        // Slender Cat Body
        const body = this._createCapsuleMesh(0.42, 1.6, furMat);
        body.rotation.x = Math.PI / 2;
        body.position.set(0, 0.5, 0);
        this.group.add(body);
        this.breatheMesh = body;

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), furMat);
        head.position.set(0, 0.8, 1.1);
        this.group.add(head);

        // Landing Zones
        this._addLandingZone('Ear Tip Capillary', -0.22, 1.15, 1.1, 0.4);
        this._addLandingZone('Throat Soft Tissue', 0.0, 0.65, 0.8, 0.5);
    }

    _buildBird() {
        const featherMat = this._mat(this.color, 0.8);

        const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), featherMat);
        body.position.set(0, 0.45, 0);
        this.group.add(body);
        this.breatheMesh = body;

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), featherMat);
        head.position.set(0, 0.72, 0.22);
        this.group.add(head);

        this._addLandingZone('Bare Leg Skin', 0.0, 0.15, 0.0, 0.35);
    }

    _addLandingZone(name, rx, ry, rz, radius) {
        const ringGeo = new THREE.RingGeometry(radius * 0.4, radius * 0.6, 12);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xef4444,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.65
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = -Math.PI / 2;
        ringMesh.position.set(rx, ry + 0.04, rz);
        this.group.add(ringMesh);

        const lzObj = {
            name,
            relPos: new THREE.Vector3(rx, ry, rz),
            radius,
            ringMesh,
            getWorldPosition: () => this.getLandingZoneWorldPos(lzObj)
        };
        this.landingZones.push(lzObj);
    }

    getLandingZoneWorldPos(lz) {
        this._worldLzPos.copy(lz.relPos);
        this._worldLzPos.applyQuaternion(this.group.quaternion);
        this._worldLzPos.add(this.group.position);
        return this._worldLzPos;
    }

    update(dt) {
        this.breatheTime += dt * 1.8;

        if (this.breatheMesh) {
            const scaleY = 1.0 + Math.sin(this.breatheTime) * 0.035;
            this.breatheMesh.scale.set(1.0, scaleY, 1.0);
        }

        const ringPulse = 0.4 + Math.sin(this.breatheTime * 2.5) * 0.3;
        for (let i = 0; i < this.landingZones.length; i++) {
            const lz = this.landingZones[i];
            if (lz.ringMesh) lz.ringMesh.material.opacity = ringPulse;
        }
    }
}

window.Host = Host;
