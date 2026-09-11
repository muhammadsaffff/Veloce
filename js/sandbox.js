/**
 * Sandbox Experiment Controller
 * Through the Eyes of a Mosquito
 *
 * Real-time entity spawner & environment controls:
 * - Spawn entities: Human, Dog, Cat, Bird
 * - Spawn custom sanctuary safe zones
 * - Toggle ceiling fan & wind vortex
 * - Change time of day (Night, Dawn/Morning, Day, Dusk/Evening)
 */

class SandboxSystem {
    constructor(scene, dynamicEnv) {
        this.scene = scene;
        this.dynamicEnv = dynamicEnv;
        this.spawnedHosts = [];
        this.customSafeZones = [];
    }

    spawnEntity(type) {
        const playerPos = window.gameEngine?.player?.position || new THREE.Vector3(0, 4, 0);

        // Position spawn slightly offset from player inside room boundaries
        const spawnPos = new THREE.Vector3(
            Math.max(-12, Math.min(12, playerPos.x + (Math.random() - 0.5) * 6)),
            type === 'BIRD' ? Math.min(8, Math.max(2, playerPos.y + 1.0)) : 0.2,
            Math.max(-10, Math.min(10, playerPos.z + (Math.random() - 0.5) * 6))
        );

        const host = new window.Host(this.scene, type, spawnPos, {
            name: `Sandbox ${type} #${this.spawnedHosts.length + 1}`,
            rotationY: Math.random() * Math.PI * 2
        });

        this.spawnedHosts.push(host);

        if (window.gameEngine) {
            window.gameEngine.hosts.push(host);
            window.gameEngine.hostAI.setHosts(window.gameEngine.hosts);
            window.gameEngine.sensors.buildPerceptionVisuals(window.gameEngine.hosts);
            window.gameEngine.ui.showToast(`🧪 Spawned ${host.name}`);
        }
        return host;
    }

    spawnSafeZone() {
        const playerPos = window.gameEngine?.player?.position || new THREE.Vector3(0, 4, 0);
        const sz = {
            position: playerPos.clone(),
            radius: 2.2,
            name: `Custom Shelter #${this.customSafeZones.length + 1}`,
            icon: '🛡️'
        };

        const geo = new THREE.SphereGeometry(sz.radius * 0.7, 12, 8);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x00e676,
            transparent: true,
            opacity: 0.2,
            wireframe: true
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(sz.position);
        mesh.visible = window.gameEngine?.sensors?.perceptionModeActive || false;
        this.scene.add(mesh);
        sz._mesh = mesh;

        this.customSafeZones.push(sz);

        if (window.gameEngine?.world) {
            window.gameEngine.world.safeZones.push(sz);
            window.gameEngine.ui.showToast('🧪 Custom Safe Zone Deployed!');
        }
    }

    removeAllSpawnedHosts() {
        this.spawnedHosts.forEach(h => {
            h.dispose();
            if (window.gameEngine) {
                const idx = window.gameEngine.hosts.indexOf(h);
                if (idx !== -1) window.gameEngine.hosts.splice(idx, 1);
            }
        });
        this.spawnedHosts = [];

        if (window.gameEngine) {
            window.gameEngine.hostAI.setHosts(window.gameEngine.hosts);
            window.gameEngine.sensors.buildPerceptionVisuals(window.gameEngine.hosts);
            window.gameEngine.ui.showToast('Cleared spawned sandbox entities.');
        }
    }

    setTimeOfDay(time) {
        this.dynamicEnv.setTimeOfDay(time);
        if (window.gameEngine?.ui) {
            window.gameEngine.ui.showToast(`Time set to: ${time}`);
        }
    }

    toggleFan(enabled) {
        this.dynamicEnv.fanEnabled = enabled;
        if (window.gameEngine?.ui) {
            window.gameEngine.ui.showToast(`Ceiling Fan: ${enabled ? 'ON' : 'OFF'}`);
        }
    }
}

window.SandboxSystem = SandboxSystem;
