/**
 * Core 3D Simulation Game Engine Loop & State Machine
 * Through the Eyes of a Mosquito
 *
 * Game Modes:
 * - STORY (10-Level Mission Progression)
 * - SURVIVAL (Survive as long as possible)
 * - FREE (Unconstrained simulation exploration)
 * - SANDBOX (Interactive spawner & environmental laboratory)
 *
 * State Machine:
 * - SEARCHING -> TRACKING -> APPROACHING -> FEEDING -> ESCAPING -> RESTING
 */

class MosquitoGameEngine {
    constructor() {
        this.container = document.getElementById('game-container');
        this.canvas    = document.getElementById('webgl-canvas');

        this.gameMode   = 'SURVIVAL';
        this.state      = 'SEARCHING';
        this.gameActive = false;
        this.isPaused   = false;

        this.lastTime   = performance.now();
        this.fps        = 60;
        this.frameCount = 0;
        this.fpsTimer   = 0;

        // Run Metrics
        this.runStats = {
            startTime: 0,
            survivalSeconds: 0,
            survivalTime: '00:00',
            hostsDetected: 0,
            hostsApproached: 0,
            successfulLandings: 0,
            successfulFeeds: 0,
            failedFeeds: 0,
            successfulEscapes: 0,
            distanceTravelled: 0,
            fedSpecies: [],
            perceptionUsed: false,
            hasLanded: false,
            hasRestedInSafeZone: false,
            evadedCatPounce: false,
            swatsEvaded: 0
        };

        this.detectedHostsSet   = new Set();
        this.approachedHostsSet = new Set();

        this.initThree();
        this.initEngines();
        this.bindEvents();

        // Start animation loop
        requestAnimationFrame((t) => this.loop(t));
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a1220);

        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.02,
            120
        );

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        window.addEventListener('resize', () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        });
    }

    initEngines() {
        // 1. World & Dynamic Environment
        this.world = new window.WorldEnvironment(this.scene);
        this.dynamicEnv = new window.DynamicEnvironment(this.scene);

        // 2. Emotions & Player
        this.emotions = new window.EmotionSystem();
        this.player = new window.PlayerController(this.camera, this.canvas);
        this.scene.add(this.player.model.group);

        // 3. Sensory Engine
        this.sensors = new window.SensorSystem(this.scene);

        // 4. Feeding & Missions
        this.feeding = new window.FeedingSystem();
        this.missions = new window.MissionSystem();

        // 5. Host AI & Spawner
        this.hostAI = new window.HostAI();
        this.hosts = this.hostAI.spawnWorldHosts(this.scene);
        this.hostAI.setHosts(this.hosts);
        this.sensors.buildPerceptionVisuals(this.hosts);

        // 6. Sandbox & UI
        this.sandbox = new window.SandboxSystem(this.scene, this.dynamicEnv);
        this.ui = new window.UIManager(this);
    }

    startRun(mode = 'SURVIVAL') {
        this.gameMode   = mode;
        this.gameActive = true;
        this.isPaused   = false;
        this.state      = 'SEARCHING';

        // Reset Run Metrics
        this.runStats = {
            startTime: performance.now(),
            survivalSeconds: 0,
            survivalTime: '00:00',
            hostsDetected: 0,
            hostsApproached: 0,
            successfulLandings: 0,
            successfulFeeds: 0,
            failedFeeds: 0,
            successfulEscapes: 0,
            distanceTravelled: 0,
            fedSpecies: [],
            perceptionUsed: false,
            hasLanded: false,
            hasRestedInSafeZone: false,
            evadedCatPounce: false,
            swatsEvaded: 0
        };

        this.detectedHostsSet.clear();
        this.approachedHostsSet.clear();

        // Spawn player near bed hovering in bedroom
        this.player.position.set(-6.0, 4.5, 0.0);
        this.player.velocity.set(0, 0, 0);
        this.player.takeOff();

        // Reset emotions & host alertness
        this.emotions.hunger    = 70;
        this.emotions.energy    = 100;
        this.emotions.fear      = 10;
        this.emotions.stress    = 15;
        this.emotions.bodyLoad  = 0;
        this.emotions.relief    = 0;
        this.emotions.calmness  = 65;
        this.hosts.forEach(h => { h.alertness = 0; });

        // Show/hide Sandbox floating panel
        const sbPanel = document.getElementById('modal-sandbox-ctrl');
        if (sbPanel) sbPanel.classList.toggle('hidden', mode !== 'SANDBOX');

        // Mode specific announcements
        if (mode === 'STORY') {
            const m = this.missions.startLevel(this.missions.currentLevel);
            this.ui.updateMissionBox(this.missions.getCurrentMissionText());
            this.ui.showPhaseBanner(`MISSION ${m.id}: ${m.title}`, m.objective);
        } else if (mode === 'SANDBOX') {
            this.ui.updateMissionBox(null);
            this.ui.showPhaseBanner('SANDBOX LABORATORY', 'Spawn hosts, adjust time of day, and test environmental physics.');
        } else if (mode === 'FREE') {
            this.ui.updateMissionBox(null);
            this.ui.showPhaseBanner('FREE SIMULATION', 'Explore the 28×12×24m bedroom universe with no restrictions.');
        } else {
            this.ui.updateMissionBox(null);
            this.ui.showPhaseBanner('SURVIVAL CHALLENGE', 'Survive as long as possible. Feed, evade swats, and rest in shelter.');
        }

        // Hide menus & modals
        document.getElementById('modal-main-menu')?.classList.add('hidden');
        document.getElementById('modal-gameover')?.classList.add('hidden');
        document.getElementById('overlay-pause')?.classList.add('hidden');

        // Reset night vision & audio
        this.dynamicEnv.applyNightVisionLighting();
        window.soundEngine.ensureContext();
    }

    bindEvents() {
        // Global Keyboard Controls
        window.addEventListener('keydown', (e) => {
            window.soundEngine.ensureContext();

            // N: Night Vision Boost Toggle
            if (e.code === 'KeyN' && this.gameActive && !this.isPaused) {
                e.preventDefault();
                this.toggleNightVision();
            }

            // T or Tab: Mosquito Perception Mode Toggle
            if ((e.code === 'KeyT' || e.code === 'Tab') && this.gameActive && !this.isPaused) {
                e.preventDefault();
                this.togglePerceptionMode();
            }

            // E: Contextual Action (Land / Feed / Rest / Detach)
            if (e.code === 'KeyE' && this.gameActive && !this.isPaused) {
                e.preventDefault();
                this.handleContextAction();
            }

            // Q: Emotion Drawer Toggle
            if (e.code === 'KeyQ') {
                e.preventDefault();
                this.ui.toggleEmotionDrawer();
            }

            // P or Escape: Pause Toggle
            if (e.code === 'KeyP' || e.code === 'Escape') {
                if (this.gameActive) {
                    e.preventDefault();
                    this.togglePause();
                }
            }

            // F3: Debug Overlay
            if (e.code === 'F3') {
                e.preventDefault();
                this.ui.toggleDebugOverlay();
            }
        });

        // Swat Hit Event Listener
        window.addEventListener('hostSwatHit', (e) => {
            if (!this.gameActive) return;
            const host = e.detail?.host;
            const reason = host ? `Crushed by ${host.name} swat attack!` : 'Crushed by host swat attack!';
            this.handleGameOver(reason);
        });

        // Swat Near Miss Event Listener
        window.addEventListener('hostSwatNearMiss', (e) => {
            if (!this.gameActive) return;
            this.emotions.onSwatNearMiss();
            this.runStats.swatsEvaded++;
            if (e.detail?.host?.type === 'CAT') {
                this.runStats.evadedCatPounce = true;
            }
            this.ui.showToast('⚡ NEAR MISS! Swat shockwave felt!');
        });
    }

    toggleNightVision() {
        const isBoosted = this.dynamicEnv.toggleNightVisionBoost();
        this.ui.updateNightVisionUI(isBoosted);
        if (window.soundEngine) window.soundEngine.playClick();
        this.ui.showToast(isBoosted ? '🌙 NIGHT VISION: BOOST [ON]' : '🌙 NIGHT VISION: STANDARD');
    }

    togglePerceptionMode() {
        const isActive = this.sensors.togglePerceptionMode();
        this.ui.updatePerceptionUI(isActive);
        this.runStats.perceptionUsed = true;
        if (window.soundEngine) window.soundEngine.playPerceptionToggle(isActive);
        this.ui.showToast(isActive ? '👁 SENSES: PERCEPTION [ON]' : '👁 SENSES: NORMAL VISION');
    }

    handleContextAction() {
        // 1. If currently feeding, E detaches early
        if (this.feeding.isFeeding) {
            this.handleAbortFeeding();
            return;
        }

        // 2. If landed or resting, Space or E takes off
        if (this.player.isLanded) {
            this.player.takeOff();
            this.state = 'SEARCHING';
            this.ui.showToast('Took flight.');
            if (window.soundEngine) window.soundEngine.playClick();
            return;
        }

        // 3. Check for nearby Safe Resting Zone
        const nearbySafeZone = this.world.getNearbySafeZone(this.player.position);
        if (nearbySafeZone) {
            this.player.rest(nearbySafeZone);
            this.state = 'RESTING';
            this.runStats.hasRestedInSafeZone = true;
            this.runStats.successfulEscapes++;
            this.ui.showToast(`Resting on ${nearbySafeZone.name}. Energy restoring...`);
            if (window.soundEngine) window.soundEngine.playClick();
            return;
        }

        // 4. Check for nearby Host Capillary Zone
        const nearbyZone = this._findNearbyCapillaryZone(1.5);
        if (nearbyZone) {
            const landingEval = this.feeding.evaluateLanding(this.player.velocity, nearbyZone.distance);
            if (landingEval.success) {
                // Successful precision landing!
                this.player.land(nearbyZone.host);
                this.state = 'FEEDING';
                this.runStats.successfulLandings++;
                this.runStats.hasLanded = true;
                this.feeding.startFeeding(nearbyZone.host, nearbyZone.zone.name, landingEval.accuracy);
                this.ui.showFeedingMinigame(true);
                this.ui.showToast(`Landed on ${nearbyZone.zone.name}!`);
            } else {
                // Landing failed due to excess speed
                this.ui.showToast(landingEval.speedTooHigh ? '⚠ Approach too fast! Slow down (<2.5 m/s) to land.' : '⚠ Too far from capillary target!');
                nearbyZone.host.alertness = Math.min(100, nearbyZone.host.alertness + 15);
            }
        }
    }

    handleAbortFeeding() {
        if (!this.feeding.isFeeding) return;
        this.feeding.stopFeeding();
        this.ui.showFeedingMinigame(false);
        this.player.takeOff();
        this.state = 'ESCAPING';
        this.ui.showToast('Detached and escaped!');
    }

    _findNearbyCapillaryZone(maxDist = 1.5) {
        for (const host of this.hosts) {
            if (!host.active) continue;
            for (const lz of host.landingZones) {
                const wp = lz.getWorldPosition();
                const d = wp.distanceTo(this.player.position);
                if (d <= maxDist) {
                    return { host, zone: lz, distance: d, worldPos: wp };
                }
            }
        }
        return null;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseOverlay = document.getElementById('overlay-pause');
        if (pauseOverlay) {
            pauseOverlay.classList.toggle('hidden', !this.isPaused);
        }
        if (this.isPaused) {
            if (window.soundEngine) window.soundEngine.stopHeartbeat();
        } else {
            this.lastTime = performance.now();
        }
    }

    handleGameOver(reason) {
        this.gameActive = false;
        if (this.feeding.isFeeding) {
            this.feeding.stopFeeding();
            this.ui.showFeedingMinigame(false);
        }

        const scoreData = window.storageManager.calculateScore(this.runStats);
        window.storageManager.saveHighScore(scoreData.score);
        window.storageManager.saveRun({
            date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            survivalTime: this.runStats.survivalTime,
            score: scoreData.score,
            rating: scoreData.rating,
            successfulFeeds: this.runStats.successfulFeeds
        });

        this.ui.showGameOverModal(this.runStats, scoreData, reason);
    }

    loop(timestamp) {
        requestAnimationFrame((t) => this.loop(t));

        const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
        this.lastTime = timestamp;

        // FPS counter
        this.frameCount++;
        this.fpsTimer += dt;
        if (this.fpsTimer >= 1.0) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTimer = 0;
        }

        if (!this.gameActive || this.isPaused) {
            this.renderer.render(this.scene, this.camera);
            return;
        }

        // 1. Update Survival Timer
        this.runStats.survivalSeconds += dt;
        const mins = String(Math.floor(this.runStats.survivalSeconds / 60)).padStart(2, '0');
        const secs = String(Math.floor(this.runStats.survivalSeconds % 60)).padStart(2, '0');
        this.runStats.survivalTime = `${mins}:${secs}`;

        // 2. Wind Physics from Ceiling Fan
        const windVector = this.dynamicEnv.getWindVectorAt(this.player.position);

        // 3. Update Player Flight Physics
        this.player.update(dt, this.world, this.emotions, windVector);
        this.runStats.distanceTravelled = this.player.totalDistanceTravelled;

        // 4. Update Dynamic Environment
        this.dynamicEnv.update(dt, this.player.position);

        // 5. Update Host Species AI & Swat Defense
        this.hostAI.update(dt, this.player.position, this.player.velocity, this.scene);

        // 6. Compute Sensory Channels
        const sensorInfo = this.sensors.computeSensors(this.player.position, this.hosts);
        const targetHost = sensorInfo.nearestHost;

        // 7. Sensory Visualizer Pulse & Guidance Spline
        this.sensors.updatePerceptionPulse(dt);
        this.sensors.updateGuidanceSpline(this.player.position, targetHost);

        // 8. Update Detection & Approach Metrics
        if (sensorInfo.sensorData.attraction > 25 && targetHost) {
            if (!this.detectedHostsSet.has(targetHost.id)) {
                this.detectedHostsSet.add(targetHost.id);
                this.runStats.hostsDetected++;
                if (window.soundEngine) window.soundEngine.playDetectionPing();
            }
        }

        if (sensorInfo.nearestDist < 3.5 && targetHost) {
            if (!this.approachedHostsSet.has(targetHost.id)) {
                this.approachedHostsSet.add(targetHost.id);
                this.runStats.hostsApproached++;
            }
        }

        // 9. Update State Machine
        if (this.player.isResting) {
            this.state = 'RESTING';
        } else if (this.feeding.isFeeding) {
            this.state = 'FEEDING';
        } else if (this.emotions.fear > 50) {
            this.state = 'ESCAPING';
        } else if (sensorInfo.nearestDist < 2.5) {
            this.state = 'APPROACHING';
        } else if (sensorInfo.sensorData.attraction > 30) {
            this.state = 'TRACKING';
        } else {
            this.state = 'SEARCHING';
        }

        // 10. Update 9-Variable Internal States
        this.emotions.update(
            dt,
            this.state,
            sensorInfo.nearestDist,
            this.feeding.isFeeding,
            this.player.isResting
        );

        // Starvation Check
        if (this.emotions.energy <= 0) {
            this.handleGameOver('Exhausted flight energy reserves!');
            return;
        }
        if (this.emotions.hunger >= 100) {
            this.handleGameOver('Starved while searching for hosts!');
            return;
        }

        // 11. Feeding Minigame Update
        if (this.feeding.isFeeding) {
            const feedResult = this.feeding.update(dt);
            this.ui.updateFeedingUI(feedResult, this.feeding);

            if (feedResult) {
                if (feedResult.status === 'COMPLETE') {
                    // Blood feeding successful!
                    this.emotions.onFeedComplete(feedResult.bloodAmount);
                    this.runStats.successfulFeeds++;
                    if (!this.runStats.fedSpecies.includes(feedResult.host.type)) {
                        this.runStats.fedSpecies.push(feedResult.host.type);
                    }
                    this.feeding.stopFeeding();
                    this.ui.showFeedingMinigame(false);
                    this.player.takeOff();
                    this.state = 'RESTING';
                    this.ui.showToast('🩸 Sated! Full blood intake achieved. Abdomen engorged!');
                } else if (feedResult.status === 'SWAT_TRIGGERED') {
                    // Host alerted and triggered swat!
                    this.feeding.stopFeeding();
                    this.ui.showFeedingMinigame(false);
                    this.player.takeOff();
                    this.state = 'ESCAPING';
                    this.runStats.failedFeeds++;
                    this.hostAI._triggerSwat(feedResult.host, this.player.position, this.scene);
                }
            }
        }

        // 12. Contextual Action Prompts
        if (this.feeding.isFeeding) {
            this.ui.showActionPrompt('Press [E] or [Right Click] to Detach');
        } else if (this.player.isLanded) {
            this.ui.showActionPrompt('Press [Space] or [E] to Take Off');
        } else {
            const nearbyCapillary = this._findNearbyCapillaryZone(1.5);
            const nearbyShelter   = this.world.getNearbySafeZone(this.player.position);

            if (nearbyCapillary) {
                this.ui.showActionPrompt(`Press [E] to Land on ${nearbyCapillary.zone.name}`);
            } else if (nearbyShelter) {
                this.ui.showActionPrompt(`Press [E] to Rest on ${nearbyShelter.name}`);
            } else {
                this.ui.showActionPrompt(null);
            }
        }

        // 13. Story Mode Mission Progress Check
        if (this.gameMode === 'STORY') {
            const missionRes = this.missions.update(dt, this.runStats);
            if (missionRes && missionRes.completed) {
                this.ui.showPhaseBanner(`MISSION ${missionRes.mission.id} COMPLETE!`, missionRes.mission.title);
                if (missionRes.nextLevel) {
                    setTimeout(() => {
                        const next = this.missions.startLevel(missionRes.nextLevel);
                        this.ui.updateMissionBox(this.missions.getCurrentMissionText());
                        this.ui.showPhaseBanner(`MISSION ${next.id}: ${next.title}`, next.objective);
                    }, 3500);
                } else {
                    this.ui.showPhaseBanner('STORY COMPLETED!', 'You mastered all 10 missions in Through the Eyes of a Mosquito!');
                }
            }
        }

        // 14. Sound Updates
        if (window.soundEngine) {
            const speedRatio = this.player.velocity.length() / (this.player.baseSpeed * 1.8);
            const isBoosting = this.player.keys.boost;
            window.soundEngine.updateFlightHum(speedRatio, isBoosting, this.player.isLanded);
        }

        // 15. UI Update
        this.ui.updateHUD(this.emotions, sensorInfo, this.state, targetHost, dt);

        // 16. Render Three.js Scene
        this.renderer.render(this.scene, this.camera);
    }
}

window.MosquitoGameEngine = MosquitoGameEngine;
