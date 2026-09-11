/**
 * 3D Connected World Environment (8 Zones: House + Outdoor Garden)
 * Through the Eyes of a Mosquito — Production Upgrade
 *
 * Performance Features:
 * - Centralized reusable material palette (minimizes WebGL state switches)
 * - Explicit frustum culling enabled on all meshes
 * - Pre-allocated AABB collision boxes for fast spatial boundary checks
 * - Safe resting zones, sweet nectar sources, and stagnant water pools
 * - Connected zones: Master Bedroom, Living Room, Kitchen, Bathroom, Hallway, Balcony, Garden, Pond
 */

class WorldEnvironment {
    constructor(scene) {
        this.scene = scene;
        this.collisionBoxes = [];
        this.safeZones = [];
        this.nectarSpots = [];
        this.waterSpots = [];
        this.discoveredZones = new Set(['BEDROOM']);

        this.zones = {
            BEDROOM:     { id: 'BEDROOM',     name: 'Master Bedroom', icon: '🛏️', bounds: { minX: -14, maxX: 14, minZ: -12, maxZ: 12 } },
            LIVING_ROOM: { id: 'LIVING_ROOM', name: 'Living Room',    icon: '🛋️', bounds: { minX: -14, maxX: 14, minZ: 12,  maxZ: 38 } },
            KITCHEN:     { id: 'KITCHEN',     name: 'Kitchen',        icon: '🍳', bounds: { minX: 14,  maxX: 36, minZ: 12,  maxZ: 38 } },
            BATHROOM:    { id: 'BATHROOM',    name: 'Bathroom',       icon: '🛁', bounds: { minX: -36, maxX: -14,minZ: 12,  maxZ: 30 } },
            BALCONY:     { id: 'BALCONY',     name: 'Balcony Deck',   icon: '🪴', bounds: { minX: 14,  maxX: 28, minZ: -12, maxZ: 10 } },
            GARDEN_YARD: { id: 'GARDEN_YARD', name: 'Outdoor Garden', icon: '🌿', bounds: { minX: 20,  maxX: 80, minZ: -45, maxZ: 35 } },
            POND_STREET: { id: 'POND_STREET', name: 'Garden Pond',    icon: '💧', bounds: { minX: 35,  maxX: 85, minZ: -75, maxZ: -20 } }
        };

        this._materials = this._createSharedMaterials();
        this._buildWorld();
    }

    _createSharedMaterials() {
        return {
            woodFloor: new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.65, metalness: 0.1 }),
            tileFloor: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.35, metalness: 0.2 }),
            bathFloor: new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.9 }),
            grass:     new THREE.MeshStandardMaterial({ color: 0x2e5c1e, roughness: 0.9, metalness: 0.05 }),
            wallIndoor:new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85, metalness: 0.05 }),
            wallOutdoor:new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9, metalness: 0.05 }),
            ceiling:   new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9, metalness: 0.05 }),
            woodDark:  new THREE.MeshStandardMaterial({ color: 0x3b2314, roughness: 0.7 }),
            mattress:  new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9 }),
            blanket:   new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.85 }),
            pillow:    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.95 }),
            metal:     new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.35, metalness: 0.75 }),
            glass:     new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.3 }),
            leaf:      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.55, side: THREE.DoubleSide }),
            treeBark:  new THREE.MeshStandardMaterial({ color: 0x3f2e20, roughness: 0.95 }),
            treeFoliage:new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.85 }),
            water:     new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.85, transparent: true, opacity: 0.82 }),
            flower:    new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.45 }),
            glowWarm:  new THREE.MeshBasicMaterial({ color: 0xffedd5 }),
            screenGlow:new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        };
    }

    _box(w, h, d, mat, x, y, z, hasCollision = true) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        mesh.position.set(x, y, z);
        mesh.frustumCulled = true;
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        this.scene.add(mesh);

        if (hasCollision) {
            this.collisionBoxes.push({
                min: new THREE.Vector3(x - w / 2, y - h / 2, z - d / 2),
                max: new THREE.Vector3(x + w / 2, y + h / 2, z + d / 2)
            });
        }
        return mesh;
    }

    _cylinder(rt, rb, h, segs, mat, x, y, z, hasCollision = true) {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs), mat);
        mesh.position.set(x, y, z);
        mesh.frustumCulled = true;
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        this.scene.add(mesh);

        if (hasCollision) {
            const r = Math.max(rt, rb);
            this.collisionBoxes.push({
                min: new THREE.Vector3(x - r, y - h / 2, z - r),
                max: new THREE.Vector3(x + r, y + h / 2, z + r)
            });
        }
        return mesh;
    }

    _addSafeZone(name, x, y, z, radius) {
        const p = new THREE.Vector3(x, y, z);
        this.safeZones.push({ name, pos: p, position: p, radius });
    }

    _addNectar(name, x, y, z, amount = 35) {
        const p = new THREE.Vector3(x, y, z);
        this.nectarSpots.push({ name, pos: p, position: p, radius: 1.2, amount, replenished: true });
    }

    _addWater(name, x, y, z, isPond = false) {
        this.waterSpots.push({ name, pos: new THREE.Vector3(x, y, z), radius: isPond ? 8.0 : 1.4, isPond });
    }

    _buildWorld() {
        const m = this._materials;

        // 1. Master Bedroom (X: -14 to 14, Z: -12 to 12, Y: 0 to 12)
        this._box(28, 0.4, 24, m.woodFloor, 0, -0.2, 0, false);
        this._box(28, 0.4, 24, m.ceiling, 0, 12.2, 0, true);

        // North & West Bedroom Walls
        this._box(28, 12, 0.4, m.wallIndoor, 0, 6, -12, true);
        this._box(0.4, 12, 24, m.wallIndoor, -14, 6, 0, true);

        // East Bedroom Wall with Large Open Window to Balcony
        this._box(0.4, 3.2, 24, m.wallIndoor, 14, 1.6, 0, true);
        this._box(0.4, 3.2, 24, m.wallIndoor, 14, 10.4, 0, true);
        this._box(0.4, 5.6, 8, m.wallIndoor, 14, 6, -8, true);
        this._box(0.4, 5.6, 8, m.wallIndoor, 14, 6, 8, true);
        this._box(0.8, 0.3, 8.4, m.woodDark, 14, 3.2, 0, true); // Sill
        this._box(0.1, 5.4, 4, m.glass, 14, 6.0, 2, true); // Half glass pane (opening at Z: -4 to 0)

        // Window Curtains (Safe Resting Shelters)
        this._box(0.6, 9.0, 2.4, m.blanket, 13.6, 6.0, -4.5, true);
        this._box(0.6, 9.0, 2.4, m.blanket, 13.6, 6.0, 4.5, true);
        this._addSafeZone('Window Curtain Folds', 13.4, 7.0, -4.2, 1.8);

        // South Bedroom Wall with Open Doorway to Living Room
        this._box(10, 12, 0.4, m.wallIndoor, -9, 6, 12, true);
        this._box(10, 12, 0.4, m.wallIndoor, 9, 6, 12, true);
        this._box(8, 4, 0.4, m.wallIndoor, 0, 10, 12, true); // Door header (X: -4 to 4 is open)

        // Bedroom Furniture: Giant Bed
        this._box(8.5, 1.2, 11, m.woodDark, -6, 0.6, 3.5, true);
        this._box(8.8, 4.5, 0.8, m.woodDark, -6, 2.6, -1.8, true); // Headboard
        this._box(8.0, 1.4, 10.2, m.mattress, -6, 1.8, 3.5, true); // Mattress
        this._box(3.2, 0.6, 2.0, m.pillow, -8, 2.7, 0.2, true); // Pillows
        this._box(3.2, 0.6, 2.0, m.pillow, -4, 2.7, 0.2, true);
        this._box(7.8, 0.5, 7.0, m.blanket, -6, 2.6, 5.0, true); // Rumpled Blanket
        this._addSafeZone('Under Bed Frame Shelter', -6, 0.4, 4.0, 2.6);

        // Study Desk, Chair & Laptop
        this._box(7.0, 0.4, 3.5, m.woodDark, 8, 3.2, -7, true);
        this._cylinder(0.18, 0.18, 3.2, 8, m.metal, 5, 1.6, -8.2, true);
        this._cylinder(0.18, 0.18, 3.2, 8, m.metal, 11, 1.6, -8.2, true);
        this._cylinder(0.18, 0.18, 3.2, 8, m.metal, 5, 1.6, -5.8, true);
        this._cylinder(0.18, 0.18, 3.2, 8, m.metal, 11, 1.6, -5.8, true);

        this._box(1.8, 0.1, 1.2, m.metal, 7.5, 3.45, -7, false);
        this._box(1.8, 1.2, 0.1, m.screenGlow, 7.5, 4.1, -7.5, false); // Laptop

        // Tall Wardrobe Cupboard
        this._box(4.5, 9.5, 2.5, m.woodDark, -11, 4.75, -9, true);
        this._addSafeZone('Top of Wardrobe Ceiling Crevice', -11, 10.2, -9, 1.8);

        // Potted Monstera Plant
        this._buildPottedPlant(11, 0, 7);

        // 2. Living Room (X: -14 to 14, Z: 12 to 38)
        this._box(28, 0.4, 26, m.woodFloor, 0, -0.2, 25, false);
        this._box(28, 0.4, 26, m.ceiling, 0, 12.2, 25, true);
        this._box(28, 12, 0.4, m.wallIndoor, 0, 6, 38, true); // South Wall

        // Large L-Sofa
        this._box(10.0, 1.2, 4.0, m.blanket, 0, 0.8, 24, true);
        this._box(10.0, 2.8, 1.0, m.blanket, 0, 2.2, 26, true);
        this._box(1.2, 2.2, 4.0, m.blanket, -4.8, 1.5, 24, true);
        this._box(1.2, 2.2, 4.0, m.blanket, 4.8, 1.5, 24, true);
        this._box(4.0, 1.2, 4.5, m.blanket, -3.2, 0.8, 28, true);
        this._addSafeZone('Under Living Room Sofa', 0, 0.4, 24, 3.0);

        // Coffee Table & Floor Rug
        this._box(6.0, 0.3, 3.0, m.woodDark, 0, 1.8, 20, true);
        this._box(11.0, 0.04, 9.0, m.pillow, 0, 0.02, 22, false);

        // TV Stand & Flat TV Screen
        this._box(8.0, 2.0, 1.8, m.woodDark, 0, 1.0, 36, true);
        this._box(7.0, 4.0, 0.2, m.metal, 0, 4.5, 36.2, true);
        this._box(6.6, 3.6, 0.1, m.screenGlow, 0, 4.5, 36.0, false);

        // 3. Kitchen & Dining (X: 14 to 36, Z: 12 to 38)
        this._box(22, 0.4, 26, m.tileFloor, 25, -0.2, 25, false);
        this._box(22, 0.4, 26, m.ceiling, 25, 12.2, 25, true);
        this._box(22, 12, 0.4, m.wallIndoor, 25, 6, 38, true);
        this._box(0.4, 12, 26, m.wallIndoor, 36, 6, 25, true);

        // Counter & Sink with Water Puddle
        this._box(18.0, 3.4, 3.0, m.metal, 25, 1.7, 34, true);
        this._box(2.2, 0.05, 1.4, m.water, 22, 3.45, 34, false);
        this._addWater('Kitchen Sink Water Droplets', 22, 3.5, 34, false);

        // Fruit Bowl (Nectar Energy Source)
        this._cylinder(1.2, 0.8, 0.6, 12, m.pillow, 27, 3.7, 34, true);
        const fruitMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 });
        this._cylinder(0.5, 0.5, 0.5, 8, fruitMat, 27, 4.1, 34, false);
        this._addNectar('Ripe Sweet Fruit Bowl', 27, 4.2, 34, 40);

        // Refrigerator
        this._box(3.5, 8.5, 3.5, m.metal, 33, 4.25, 15, true);

        // 4. Bathroom (X: -36 to -14, Z: 12 to 30)
        this._box(22, 0.4, 18, m.bathFloor, -25, -0.2, 21, false);
        this._box(22, 0.4, 18, m.ceiling, -25, 12.2, 21, true);
        this._box(0.4, 12, 18, m.wallIndoor, -36, 6, 21, true);
        this._box(22, 12, 0.4, m.wallIndoor, -25, 6, 30, true);

        // Bathtub & Water Surface
        this._box(5.0, 2.6, 10.0, m.pillow, -30, 1.3, 22, true);
        this._box(3.8, 0.1, 8.5, m.water, -30, 1.8, 22, false);
        this._addWater('Bathtub Water Surface', -30, 1.9, 22, false);

        // Hanging Towel (Shelter)
        this._box(1.8, 4.5, 0.3, m.blanket, -22, 5.0, 13.5, true);
        this._addSafeZone('Behind Hanging Towel', -22, 5.0, 13.5, 1.6);

        // 5. Balcony Deck (X: 14 to 28, Z: -12 to 10)
        this._box(14, 0.4, 22, m.woodFloor, 21, -0.2, -1, false);
        this._box(0.3, 0.3, 22, m.metal, 28, 4.2, -1, true); // Railing
        this._box(14, 0.3, 0.3, m.metal, 21, 4.2, -12, true);
        this._box(14, 0.3, 0.3, m.metal, 21, 4.2, 10, true);

        // Flower Planters on Balcony
        this._buildPlanter(20, 0.5, -5);
        this._buildPlanter(20, 0.5, 3);

        // 6. Outdoor Garden & Yard (X: 20 to 80, Z: -45 to 35)
        const grassGround = this._box(75, 0.6, 130, m.grass, 55, -0.3, -10, false);
        grassGround.receiveShadow = true;

        // Giant Oak Tree (X: 45, Z: -10)
        this._cylinder(1.8, 2.4, 18, 12, m.treeBark, 45, 9, -10, true);
        const canopy = new THREE.Mesh(new THREE.SphereGeometry(9.0, 12, 10), m.treeFoliage);
        canopy.position.set(45, 20, -10);
        this.scene.add(canopy);
        this._addSafeZone('Oak Tree Deep Canopy', 45, 19.0, -10, 4.0);
        this._addSafeZone('Oak Tree Hollow Bark', 45, 4.0, -8, 2.0);

        // Garden Bench
        this._box(6.0, 0.4, 1.8, m.woodDark, 52, 1.6, 12, true);
        this._addSafeZone('Under Garden Bench', 52, 0.6, 12, 2.5);

        // Wild Flower Clusters with Nectar
        this._buildFlowerCluster(38, 0, 5);
        this._buildFlowerCluster(55, 0, -25);

        // 7. Garden Stagnant Pond & Perimeter (X: 58, Z: -45)
        const pondGeo = new THREE.CylinderGeometry(11.0, 11.0, 0.3, 24);
        const pondMesh = new THREE.Mesh(pondGeo, m.water);
        pondMesh.position.set(58, 0.05, -45);
        this.scene.add(pondMesh);
        this._addWater('Stagnant Breeding Pond', 58, 0.2, -45, true);

        // Floating Lily Pads (Oviposition & Safe Zones)
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const px = 58 + Math.cos(angle) * 5.5;
            const pz = -45 + Math.sin(angle) * 5.5;
            const lilyPad = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.04, 12), m.leaf);
            lilyPad.position.set(px, 0.22, pz);
            this.scene.add(lilyPad);
            this._addSafeZone(`Lily Pad #${i+1}`, px, 0.3, pz, 1.8);
        }

        // Stone Perimeter Wall & Street Lamp
        this._box(1.5, 4.5, 110, m.wallOutdoor, 85, 2.25, -15, true);
        this._cylinder(0.25, 0.35, 16.0, 8, m.metal, 65, 8.0, -30, true);

        // World Bounds Barriers (Prevents falling through floor or flying infinitely)
        this.collisionBoxes.push({ min: new THREE.Vector3(-100, -2, -100), max: new THREE.Vector3(120, 0, 100) });
        this.collisionBoxes.push({ min: new THREE.Vector3(-100, 28, -100), max: new THREE.Vector3(120, 32, 100) });
    }

    _buildPottedPlant(x, y, z) {
        const m = this._materials;
        this._cylinder(1.0, 0.7, 1.8, 12, m.woodDark, x, y + 0.9, z, true);
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const lx = x + Math.cos(angle) * 1.4;
            const lz = z + Math.sin(angle) * 1.4;
            const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.9), m.leaf);
            leaf.position.set(lx, y + 2.0, lz);
            leaf.rotation.y = angle;
            this.scene.add(leaf);
        }
        this._addSafeZone('Potted Ficus Leaves', x, y + 2.2, z, 1.8);
    }

    _buildPlanter(x, y, z) {
        const m = this._materials;
        this._box(4.5, 0.8, 1.5, m.woodDark, x, y + 0.4, z, true);
        this._addNectar('Balcony Flowers', x, y + 1.2, z, 25);
    }

    _buildFlowerCluster(x, y, z) {
        const m = this._materials;
        for (let i = 0; i < 6; i++) {
            const fx = x + (Math.random() - 0.5) * 3.5;
            const fz = z + (Math.random() - 0.5) * 3.5;
            const blossom = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), m.flower);
            blossom.position.set(fx, y + 0.7, fz);
            this.scene.add(blossom);
        }
        this._addNectar('Wild Garden Flowers', x, y + 0.9, z, 45);
    }

    /**
     * Determine current active zone based on 3D player position
     */
    getCurrentZone(pos) {
        if (!pos) return this.zones.BEDROOM;
        for (const k in this.zones) {
            const z = this.zones[k];
            const b = z.bounds;
            if (pos.x >= b.minX && pos.x <= b.maxX && pos.z >= b.minZ && pos.z <= b.maxZ) {
                return z;
            }
        }
        return (pos.x > 15) ? this.zones.GARDEN_YARD : this.zones.BEDROOM;
    }

    getCurrentZoneName(pos) {
        const z = this.getCurrentZone(pos);
        return z ? z.name : '🛏️ Bedroom';
    }

    /**
     * Fast AABB collision test
     */
    checkCollision(pos, radius = 0.09) {
        for (let i = 0; i < this.collisionBoxes.length; i++) {
            const b = this.collisionBoxes[i];
            if (pos.x + radius > b.min.x && pos.x - radius < b.max.x &&
                pos.y + radius > b.min.y && pos.y - radius < b.max.y &&
                pos.z + radius > b.min.z && pos.z - radius < b.max.z) {
                return true;
            }
        }
        return false;
    }

    getNearbySafeZone(pos) {
        for (let i = 0; i < this.safeZones.length; i++) {
            const sz = this.safeZones[i];
            if (pos.distanceTo(sz.pos) <= sz.radius) {
                return sz;
            }
        }
        return null;
    }

    getNearbyNectar(pos) {
        for (let i = 0; i < this.nectarSpots.length; i++) {
            const n = this.nectarSpots[i];
            if (n.replenished && pos.distanceTo(n.pos) <= n.radius) {
                return n;
            }
        }
        return null;
    }

    getNearbyNectarSpot(pos) {
        return this.getNearbyNectar(pos);
    }

    getNearbyWater(pos) {
        for (let i = 0; i < this.waterSpots.length; i++) {
            const w = this.waterSpots[i];
            if (pos.distanceTo(w.pos) <= w.radius) {
                return w;
            }
        }
        return null;
    }
}

window.WorldEnvironment = WorldEnvironment;
