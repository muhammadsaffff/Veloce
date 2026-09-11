/**
 * 3D Bedroom World Environment (28×12×24m Mosquito Scale)
 * Through the Eyes of a Mosquito
 *
 * Enormous Bedroom at Night:
 * - Room Size: X: -14 to +14 (28m), Y: 0 to 12 (12m), Z: -12 to +12 (24m)
 * - Furniture:
 *   • Giant bed with rumpled blankets, layered sheets & soft pillows
 *   • Large study desk with glowing laptop, warm desk lamp & desk chair
 *   • Tall wardrobe/cupboard reaching near the ceiling
 *   • Big window with glass panes & pleated draping curtains
 *   • Monstera Deliciosa & Ficus Benjamina potted plants
 *   • Bedroom floor rug
 * - Safe Resting Zones:
 *   • Monstera broad leaves
 *   • Curtain fabric folds
 *   • Cupboard ceiling crevices
 *   • Ficus canopy
 */

class WorldEnvironment {
    constructor(scene) {
        this.scene = scene;
        this.collisionBoxes = [];
        this.safeZones = [];
        this.discoveredAreas = new Set(['BEDROOM']);

        this.roomBounds = {
            'BEDROOM': { min: new THREE.Vector3(-14, 0, -12), max: new THREE.Vector3(14, 12, 12), name: 'Master Bedroom', icon: '🛏️' }
        };

        this._loadSavedDiscoveries();
        this._buildWorld();
    }

    _loadSavedDiscoveries() {
        try {
            const saved = JSON.parse(localStorage.getItem('mosquito_discovered_areas')) || ['BEDROOM'];
            saved.forEach(a => this.discoveredAreas.add(a));
        } catch {
            this.discoveredAreas.add('BEDROOM');
        }
    }

    saveDiscoveries() {
        try {
            localStorage.setItem('mosquito_discovered_areas', JSON.stringify(Array.from(this.discoveredAreas)));
            localStorage.setItem('mosquito_exploration_pct', '100');
        } catch {}
    }

    getExplorationPercent() {
        return 100;
    }

    getCurrentArea(pos) {
        return { key: 'BEDROOM', name: 'Master Bedroom', icon: '🛏️' };
    }

    checkAreaDiscovery(pos) {
        if (!this.discoveredAreas.has('BEDROOM')) {
            this.discoveredAreas.add('BEDROOM');
            this.saveDiscoveries();
            return { key: 'BEDROOM', name: 'Master Bedroom', icon: '🛏️' };
        }
        return null;
    }

    _mat(color, roughness = 0.8, metalness = 0.1) {
        return new THREE.MeshStandardMaterial({ color, roughness, metalness });
    }

    _box(w, h, d, mat, x, y, z, hasCollision = true) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        mesh.position.set(x, y, z);
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

    _buildWorld() {
        this._buildRoomEnclosure();
        this._buildBed();
        this._buildStudyDesk();
        this._buildWardrobeCupboard();
        this._buildWindowAndCurtains();
        this._buildPlants();
        this._buildRugAndDecor();
        this._buildSafeZones();
    }

    _buildRoomEnclosure() {
        // Floor (Dark hardwood floor plank texture tone)
        const floorMat = this._mat(0x181e2b, 0.85);
        const floor = new THREE.Mesh(new THREE.BoxGeometry(28, 0.4, 24), floorMat);
        floor.position.set(0, -0.2, 0);
        floor.receiveShadow = true;
        this.scene.add(floor);
        this.collisionBoxes.push({ min: new THREE.Vector3(-14, -1, -12), max: new THREE.Vector3(14, 0.05, 12) });

        // Ceiling
        const ceilMat = this._mat(0x0e131d, 0.95);
        const ceiling = new THREE.Mesh(new THREE.BoxGeometry(28, 0.4, 24), ceilMat);
        ceiling.position.set(0, 12.2, 0);
        this.scene.add(ceiling);
        this.collisionBoxes.push({ min: new THREE.Vector3(-14, 11.95, -12), max: new THREE.Vector3(14, 13.5, 12) });

        // Walls (X: -14 to +14, Z: -12 to +12, Height: 12)
        const wallMat = this._mat(0x1a2333, 0.9);

        // Back Wall (Z: -12)
        this._box(28, 12, 0.4, wallMat, 0, 6, -12);

        // Front Wall with Window opening (Z: +12)
        // Solid sections around window
        this._box(8, 12, 0.4, wallMat, -10, 6, 12);
        this._box(8, 12, 0.4, wallMat, 10, 6, 12);
        this._box(12, 2.5, 0.4, wallMat, 0, 1.25, 12);  // below window
        this._box(12, 2.5, 0.4, wallMat, 0, 10.75, 12); // above window

        // Left Wall (X: -14)
        this._box(0.4, 12, 24, wallMat, -14, 6, 0);

        // Right Wall (X: +14)
        this._box(0.4, 12, 24, wallMat, 14, 6, 0);

        // Baseboard Moldings
        const trimMat = this._mat(0x0f172a, 0.7);
        this._box(28, 0.4, 0.1, trimMat, 0, 0.2, -11.9, false);
        this._box(0.1, 0.4, 24, trimMat, -13.9, 0.2, 0, false);
        this._box(0.1, 0.4, 24, trimMat, 13.9, 0.2, 0, false);
    }

    _buildBed() {
        // Bed base: Center around (-6, 0, -4)
        // Solid wooden bed frame
        this._box(8.5, 0.8, 12.5, this._mat(0x27190f, 0.8), -6, 0.4, -4);

        // Tall Wooden Headboard
        this._box(8.5, 3.8, 0.6, this._mat(0x382314, 0.8), -6, 1.9, -10.2);

        // Giant Thick Mattress
        this._box(8.0, 1.0, 11.8, this._mat(0xe2e8f0, 0.95), -6, 1.3, -4);

        // Rumpled Folded Blanket (Deep indigo navy)
        this._box(7.4, 0.7, 8.5, this._mat(0x1e3a8a, 0.9), -6, 1.95, -2.5);
        // Blanket wrinkles / ridges for realistic rumpled texture
        this._box(7.0, 0.35, 2.2, this._mat(0x1e40af, 0.9), -6, 2.3, 0.5);
        this._box(3.5, 0.3, 3.0, this._mat(0x2563eb, 0.9), -4.5, 2.3, -4.0);

        // Giant Soft Pillows
        this._box(3.4, 0.55, 2.2, this._mat(0xf1f5f9, 0.9), -8.2, 2.0, -8.5);
        this._box(3.4, 0.55, 2.2, this._mat(0xf8fafc, 0.9), -3.8, 2.0, -8.5);

        // Bedside Nightstand
        this._box(2.4, 2.2, 2.2, this._mat(0x27190f, 0.8), -11.5, 1.1, -9.5);
        // Small glowing alarm clock on nightstand
        const clock = this._box(0.8, 0.4, 0.4, this._mat(0x0f172a, 0.3), -11.5, 2.4, -9.5, false);
        const clockDisplay = new THREE.Mesh(
            new THREE.PlaneGeometry(0.7, 0.3),
            new THREE.MeshBasicMaterial({ color: 0x22c55e })
        );
        clockDisplay.position.set(-11.5, 2.4, -9.29);
        this.scene.add(clockDisplay);
    }

    _buildStudyDesk() {
        // Study desk in positive X quadrant (X: 7, Z: -5)
        const deskMat = this._mat(0x382314, 0.7);
        const legMat  = this._mat(0x1c1917, 0.8);

        // Desktop
        this._box(7.5, 0.35, 4.2, deskMat, 7.5, 4.2, -6.5);

        // Desk Legs (Sturdy wooden legs)
        this._box(0.35, 4.2, 0.35, legMat, 4.2, 2.1, -8.2);
        this._box(0.35, 4.2, 0.35, legMat, 10.8, 2.1, -8.2);
        this._box(0.35, 4.2, 0.35, legMat, 4.2, 2.1, -4.8);
        this._box(0.35, 4.2, 0.35, legMat, 10.8, 2.1, -4.8);

        // Open Laptop on Desk
        const laptopBase = this._box(2.2, 0.08, 1.4, this._mat(0x94a3b8, 0.3, 0.8), 7.5, 4.41, -6.0, false);
        const laptopScreen = new THREE.Mesh(
            new THREE.BoxGeometry(2.2, 1.3, 0.06),
            this._mat(0x0f172a, 0.2, 0.9)
        );
        laptopScreen.position.set(7.5, 5.05, -6.7);
        laptopScreen.rotation.x = -0.2;
        this.scene.add(laptopScreen);

        // Screen blue-light display plane
        const screenGlow = new THREE.Mesh(
            new THREE.PlaneGeometry(2.0, 1.1),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        screenGlow.position.set(7.5, 5.05, -6.66);
        screenGlow.rotation.x = -0.2;
        this.scene.add(screenGlow);

        // Warm Desk Lamp
        // Base
        this._box(0.9, 0.12, 0.9, this._mat(0xd97706, 0.4, 0.6), 10.2, 4.43, -7.8, false);
        // Stem
        this._box(0.1, 1.8, 0.1, this._mat(0xd97706, 0.4, 0.6), 10.2, 5.3, -7.8, false);
        // Lampshade
        const shade = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.75, 0.8, 12, 1, true),
            new THREE.MeshStandardMaterial({ color: 0xfef08a, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
        );
        shade.position.set(10.2, 6.2, -7.8);
        this.scene.add(shade);

        // Stack of textbooks
        this._box(1.8, 0.5, 1.3, this._mat(0x991b1b, 0.8), 5.2, 4.62, -7.2, false);
        this._box(1.6, 0.4, 1.2, this._mat(0x065f46, 0.8), 5.3, 5.07, -7.2, false);

        // Desk Chair (Office ergonomic chair)
        this._box(2.2, 0.35, 2.2, this._mat(0x1e293b, 0.85), 7.5, 2.2, -3.2);
        this._box(2.2, 2.8, 0.3, this._mat(0x1e293b, 0.85), 7.5, 3.6, -2.1);
        this._box(0.3, 2.2, 0.3, this._mat(0x0f172a, 0.5, 0.7), 7.5, 1.1, -3.2);
    }

    _buildWardrobeCupboard() {
        // Tall wardrobe along back wall (X: -10, Z: 6)
        // 5.5m wide, 10.5m tall, 2.8m deep (ceiling is 12m, leaving a 1.5m crevice at the top!)
        const woodMat = this._mat(0x27190f, 0.75);
        this._box(5.5, 10.5, 2.8, woodMat, -10.5, 5.25, 6.5);

        // Wardrobe door handles
        this._box(0.1, 1.2, 0.15, this._mat(0xd4af37, 0.3, 0.8), -8.2, 5.2, 7.95, false);
        this._box(0.1, 1.2, 0.15, this._mat(0xd4af37, 0.3, 0.8), -12.8, 5.2, 7.95, false);
    }

    _buildWindowAndCurtains() {
        // Enormous window on front wall (Z: +12, X: -6 to +6, Y: 2.5 to 9.5)
        const frameMat = this._mat(0x1e293b, 0.7);

        // Outer window frame
        this._box(12.4, 0.4, 0.6, frameMat, 0, 2.5, 12);
        this._box(12.4, 0.4, 0.6, frameMat, 0, 9.5, 12);
        this._box(0.4, 7.0, 0.6, frameMat, -6.0, 6.0, 12);
        this._box(0.4, 7.0, 0.6, frameMat, 6.0, 6.0, 12);
        // Window mullions (cross beams)
        this._box(0.2, 7.0, 0.4, frameMat, 0, 6.0, 12);
        this._box(12.0, 0.2, 0.4, frameMat, 0, 6.0, 12);

        // Window Glass (translucent blue night sheen)
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.15,
            roughness: 0.1,
            metalness: 0.9,
            side: THREE.DoubleSide
        });
        const glass = new THREE.Mesh(new THREE.PlaneGeometry(12.0, 7.0), glassMat);
        glass.position.set(0, 6.0, 11.95);
        this.scene.add(glass);

        // Curtain Rod
        const rodMat = this._mat(0xd4af37, 0.3, 0.8);
        this._box(14.0, 0.15, 0.15, rodMat, 0, 10.2, 11.4, false);

        // Pleated Draping Curtains (Soft fabric with folds)
        const curtainMat = this._mat(0x334155, 0.95);

        // Left Curtain Folds
        for (let i = 0; i < 4; i++) {
            const zOffset = (i % 2 === 0) ? 0.15 : -0.15;
            this._box(0.9, 9.0, 0.2, curtainMat, -6.8 + i * 0.45, 5.7, 11.3 + zOffset, true);
        }

        // Right Curtain Folds
        for (let i = 0; i < 4; i++) {
            const zOffset = (i % 2 === 0) ? 0.15 : -0.15;
            this._box(0.9, 9.0, 0.2, curtainMat, 5.4 + i * 0.45, 5.7, 11.3 + zOffset, true);
        }
    }

    _buildPlants() {
        // 1. Monstera Deliciosa Plant (Corner X: -11.5, Z: -2.0)
        // Ceramic Pot
        const potMat = this._mat(0x78350f, 0.85);
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.0, 2.2, 14), potMat);
        pot.position.set(-11.5, 1.1, -2.0);
        this.scene.add(pot);
        this.collisionBoxes.push({
            min: new THREE.Vector3(-12.8, 0, -3.3),
            max: new THREE.Vector3(-10.2, 2.2, -0.7)
        });

        // Monstera broad fenestrated leaves
        const leafMat = new THREE.MeshStandardMaterial({
            color: 0x15803d,
            roughness: 0.6,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        const leafOffsets = [
            { angle: 0.2,  h: 2.8, dist: 1.8, tilt: 0.35, scale: 2.4 },
            { angle: 1.3,  h: 3.4, dist: 2.1, tilt: 0.28, scale: 2.7 },
            { angle: 2.4,  h: 4.1, dist: 1.9, tilt: 0.40, scale: 2.5 },
            { angle: 3.6,  h: 4.8, dist: 2.2, tilt: 0.30, scale: 2.8 },
            { angle: 4.7,  h: 3.2, dist: 1.7, tilt: 0.45, scale: 2.3 },
            { angle: 5.6,  h: 4.3, dist: 2.0, tilt: 0.32, scale: 2.6 },
        ];

        leafOffsets.forEach(cfg => {
            const lx = -11.5 + Math.cos(cfg.angle) * cfg.dist;
            const lz = -2.0  + Math.sin(cfg.angle) * cfg.dist;

            // Stem
            const stem = new THREE.Mesh(
                new THREE.CylinderGeometry(0.04, 0.06, cfg.h - 1.5, 6),
                this._mat(0x166534, 0.8)
            );
            stem.position.set((-11.5 + lx) / 2, (1.5 + cfg.h) / 2, (-2.0 + lz) / 2);
            this.scene.add(stem);

            // Broad Leaf blade
            const leafMesh = new THREE.Mesh(new THREE.PlaneGeometry(cfg.scale, cfg.scale * 0.8), leafMat);
            leafMesh.position.set(lx, cfg.h, lz);
            leafMesh.rotation.set(-cfg.tilt, cfg.angle, 0.15);
            this.scene.add(leafMesh);
        });

        // 2. Ficus Benjamina Plant (Near window X: 11.5, Z: 7.0)
        const ficusPot = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.9, 1.8, 12), this._mat(0x57534e, 0.9));
        ficusPot.position.set(11.5, 0.9, 7.0);
        this.scene.add(ficusPot);
        this.collisionBoxes.push({
            min: new THREE.Vector3(10.3, 0, 5.8),
            max: new THREE.Vector3(12.7, 1.8, 8.2)
        });

        // Ficus Trunk & Dense Canopy
        const trunkMat = this._mat(0x44403c, 0.9);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 4.0, 8), trunkMat);
        trunk.position.set(11.5, 2.9, 7.0);
        this.scene.add(trunk);

        const ficusLeafMat = new THREE.MeshStandardMaterial({
            color: 0x166534,
            roughness: 0.7,
            metalness: 0.05,
            side: THREE.DoubleSide
        });

        // Multiple branching canopy clusters
        for (let i = 0; i < 8; i++) {
            const ang = (i / 8) * Math.PI * 2;
            const cluster = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 6), ficusLeafMat);
            cluster.position.set(11.5 + Math.cos(ang) * 1.2, 4.8 + (i % 3) * 0.6, 7.0 + Math.sin(ang) * 1.2);
            cluster.scale.set(1.1, 0.7, 1.1);
            this.scene.add(cluster);
        }
    }

    _buildRugAndDecor() {
        // Large Bedroom Floor Rug where Dog rests (X: 2, Z: 2)
        const rugMat = this._mat(0x334155, 0.95);
        const rug = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.06, 7.0), rugMat);
        rug.position.set(2.0, 0.03, 2.0);
        rug.receiveShadow = true;
        this.scene.add(rug);

        // Wastebasket near desk
        const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.5, 1.4, 10, 1, true), this._mat(0x475569, 0.5));
        bin.position.set(3.6, 0.7, -7.5);
        this.scene.add(bin);
        this.collisionBoxes.push({
            min: new THREE.Vector3(2.9, 0, -8.2),
            max: new THREE.Vector3(4.3, 1.4, -6.8)
        });
    }

    _buildSafeZones() {
        // Safe resting zones designated in prompt:
        // 1. Monstera leaves
        // 2. Curtain folds
        // 3. Cupboard ceiling crevices
        // 4. Ficus canopy
        this.safeZones = [
            {
                name: 'Monstera Broad Leaf Sanctuary',
                position: new THREE.Vector3(-10.2, 4.4, -1.8),
                radius: 1.8,
                icon: '🌿'
            },
            {
                name: 'Monstera Lower Leaf Rest',
                position: new THREE.Vector3(-12.5, 3.2, -0.6),
                radius: 1.6,
                icon: '🍃'
            },
            {
                name: 'Pleated Curtain Deep Fold',
                position: new THREE.Vector3(-5.8, 6.2, 11.3),
                radius: 1.6,
                icon: '🪟'
            },
            {
                name: 'Right Curtain Fold Shelter',
                position: new THREE.Vector3(5.8, 6.2, 11.3),
                radius: 1.6,
                icon: '🪟'
            },
            {
                name: 'Wardrobe Ceiling Crevice',
                position: new THREE.Vector3(-10.5, 11.2, 6.5),
                radius: 2.2,
                icon: '🚪'
            },
            {
                name: 'Ficus Tree Canopy Hideaway',
                position: new THREE.Vector3(11.5, 5.2, 7.0),
                radius: 2.0,
                icon: '🌳'
            },
            {
                name: 'Under Bed Shadow Haven',
                position: new THREE.Vector3(-6.0, 0.4, -4.0),
                radius: 2.4,
                icon: '🛏️'
            }
        ];

        // Add visual glowing green sanctuary indicators for perception & debug
        const szMat = new THREE.MeshBasicMaterial({
            color: 0x00e676,
            transparent: true,
            opacity: 0.14,
            wireframe: true
        });

        this.safeZones.forEach(sz => {
            const halo = new THREE.Mesh(new THREE.SphereGeometry(sz.radius * 0.7, 10, 8), szMat);
            halo.position.copy(sz.position);
            halo.visible = false; // toggled on in perception mode
            this.scene.add(halo);
            sz._mesh = halo;
        });
    }

    /**
     * Check 3D AABB Collision against world boxes
     */
    checkCollision(pos, radius = 0.08) {
        // Outer room boundaries check
        if (pos.x - radius < -14 || pos.x + radius > 14) return true;
        if (pos.y - radius < 0.1 || pos.y + radius > 11.9) return true;
        if (pos.z - radius < -12 || pos.z + radius > 12) return true;

        // Interior furniture collision
        for (const b of this.collisionBoxes) {
            if (pos.x + radius > b.min.x && pos.x - radius < b.max.x &&
                pos.y + radius > b.min.y && pos.y - radius < b.max.y &&
                pos.z + radius > b.min.z && pos.z - radius < b.max.z) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if player is near a safe resting zone
     */
    getNearbySafeZone(pos) {
        for (const sz of this.safeZones) {
            if (pos.distanceTo(sz.position) <= sz.radius) {
                return sz;
            }
        }
        return null;
    }
}

window.WorldEnvironment = WorldEnvironment;
