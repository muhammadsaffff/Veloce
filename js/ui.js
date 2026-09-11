/**
 * User Interface, Glassmorphism HUD, Radar Minimap & Interactive Modals
 * Through the Eyes of a Mosquito
 *
 * Implements:
 * - Glassmorphism HUD (left telemetry, right radar + controls, bottom sensors)
 * - 🌙 NIGHT [N] toggle (label changes to 🌙 NIGHT [ON] when active)
 * - 👁 SENSES [T] toggle (label changes to 👁 SENSES [ON] when active)
 * - 9-variable Emotion Drawer with exact scientific disclaimer
 * - 2D Radar Canvas with top-down room landmarks, hosts, and player heading
 * - Feeding overlay panel with capillary canvas
 * - All modals (Menu, Tutorial, Learn, Records, Settings, Game Over, Pause)
 */

class UIManager {
    constructor(game) {
        this.game = game;
        this._cacheDOM();
        this._initMinimap();
        this._bindEvents();
    }

    _cacheDOM() {
        // Vitals
        this.barEnergy = document.getElementById('bar-energy');
        this.valEnergy = document.getElementById('val-energy');
        this.barHunger = document.getElementById('bar-hunger');
        this.valHunger = document.getElementById('val-hunger');
        this.barStress = document.getElementById('bar-stress');
        this.valStress = document.getElementById('val-stress');
        this.barFear   = document.getElementById('bar-fear');
        this.valFear   = document.getElementById('val-fear');

        // State Badges
        this.valState      = document.getElementById('hud-val-state');
        this.valTarget     = document.getElementById('hud-val-target');
        this.valTargetDist = document.getElementById('hud-val-distance');
        this.valTargetRisk = document.getElementById('hud-val-risk');
        this.valAreaName   = document.getElementById('hud-val-area');

        // Telemetry
        this.teleCO2  = document.getElementById('tele-val-co2');
        this.teleHeat = document.getElementById('tele-val-heat');
        this.teleOdor = document.getElementById('tele-val-odor');
        this.teleMove = document.getElementById('tele-val-move');
        this.teleAttr = document.getElementById('tele-val-attr');

        // HUD Buttons
        this.btnNightVision = document.getElementById('btn-hud-nightvision');
        this.btnPerception  = document.getElementById('btn-hud-perception');
        this.btnMute        = document.getElementById('btn-hud-mute');

        // Overlays & Prompts
        this.actionPrompt      = document.getElementById('hud-action-prompt');
        this.banner            = document.getElementById('hud-phase-banner');
        this.bannerTitle       = document.getElementById('banner-title');
        this.bannerSub         = document.getElementById('banner-sub');
        this.perceptionOverlay = document.getElementById('perception-hud-overlay');

        // Emotion Drawer (Q) - All 9 variables
        this.emotionDrawer   = document.getElementById('drawer-emotions');
        this.drawerHunger    = document.getElementById('drw-val-hunger');
        this.drawerCuriosity = document.getElementById('drw-val-curiosity');
        this.drawerFear      = document.getElementById('drw-val-fear');
        this.drawerStress    = document.getElementById('drw-val-stress');
        this.drawerUrgency   = document.getElementById('drw-val-urgency');
        this.drawerAlertness = document.getElementById('drw-val-alertness');
        this.drawerRelief    = document.getElementById('drw-val-relief');
        this.drawerCalmness  = document.getElementById('drw-val-calmness');
        this.drawerEnergy    = document.getElementById('drw-val-energy');

        this.barDrwHunger    = document.getElementById('drw-bar-hunger');
        this.barDrwCuriosity = document.getElementById('drw-bar-curiosity');
        this.barDrwFear      = document.getElementById('drw-bar-fear');
        this.barDrwStress    = document.getElementById('drw-bar-stress');
        this.barDrwUrgency   = document.getElementById('drw-bar-urgency');
        this.barDrwAlertness = document.getElementById('drw-bar-alertness');
        this.barDrwRelief    = document.getElementById('drw-bar-relief');
        this.barDrwCalmness  = document.getElementById('drw-bar-calmness');
        this.barDrwEnergy    = document.getElementById('drw-bar-energy');

        this.drawerBehavior  = document.getElementById('drw-behavior-title');
        this.drawerDesc      = document.getElementById('drw-behavior-desc');

        // Feeding Panel
        this.feedingPanel     = document.getElementById('feeding-overlay-panel');
        this.feedBar          = document.getElementById('feed-bar-fill');
        this.feedBarVal       = document.getElementById('feed-bar-pct');
        this.feedAccuracyVal  = document.getElementById('feed-val-accuracy');
        this.feedStabilityVal = document.getElementById('feed-val-stability');
        this.feedRiskBar      = document.getElementById('feed-risk-fill');
        this.feedRiskVal      = document.getElementById('feed-risk-pct');
        this.feedWarning      = document.getElementById('feed-warning-text');
        this.feedCanvas       = document.getElementById('feed-reticle-canvas');
        if (this.feedCanvas) this.feedCtx = this.feedCanvas.getContext('2d');

        // Debug Overlay (F3)
        this.debugOverlay = document.getElementById('overlay-debug');
        this.debugFps     = document.getElementById('dbg-fps');
        this.debugPos     = document.getElementById('dbg-pos');
        this.debugVel     = document.getElementById('dbg-vel');
        this.debugState   = document.getElementById('dbg-state');

        // Mission UI
        this.missionBox   = document.getElementById('hud-mission-box');
        this.missionTitle = document.getElementById('hud-mission-title');
        this.missionObj   = document.getElementById('hud-mission-obj');

        // Toast
        this.toast = document.getElementById('ui-toast');
    }

    _initMinimap() {
        this.minimapCanvas = document.getElementById('canvas-minimap');
        if (this.minimapCanvas) this.minimapCtx = this.minimapCanvas.getContext('2d');
    }

    _bindEvents() {
        // HUD Night Vision Boost button
        this.btnNightVision?.addEventListener('click', () => {
            this.game.toggleNightVision();
        });

        // HUD Perception Mode button
        this.btnPerception?.addEventListener('click', () => {
            this.game.togglePerceptionMode();
        });

        // HUD Mute button
        this.btnMute?.addEventListener('click', () => {
            const isMuted = !window.soundEngine.muted;
            window.soundEngine.setMuted(isMuted);
            this.btnMute.textContent = isMuted ? '🔇' : '🔊';
            const s = window.storageManager.getSettings();
            s.muted = isMuted;
            window.storageManager.saveSettings(s);
        });

        // Close buttons for modals
        document.querySelectorAll('.btn-close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                if (window.soundEngine) window.soundEngine.playClick();
                const id = btn.getAttribute('data-target');
                if (id) document.getElementById(id)?.classList.add('hidden');
            });
        });

        // Main Menu Buttons
        document.getElementById('btn-start-story')?.addEventListener('click', () => {
            this.game.startRun('STORY');
        });
        document.getElementById('btn-start-survival')?.addEventListener('click', () => {
            this.game.startRun('SURVIVAL');
        });
        document.getElementById('btn-start-free')?.addEventListener('click', () => {
            this.game.startRun('FREE');
        });
        document.getElementById('btn-start-sandbox')?.addEventListener('click', () => {
            this.game.startRun('SANDBOX');
        });

        document.getElementById('btn-menu-tutorial')?.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playClick();
            document.getElementById('modal-tutorial')?.classList.remove('hidden');
        });
        document.getElementById('btn-menu-learn')?.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playClick();
            document.getElementById('modal-learn')?.classList.remove('hidden');
        });
        document.getElementById('btn-menu-leaderboard')?.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playClick();
            this.renderLeaderboard();
            document.getElementById('modal-leaderboard')?.classList.remove('hidden');
        });
        document.getElementById('btn-menu-settings')?.addEventListener('click', () => {
            if (window.soundEngine) window.soundEngine.playClick();
            document.getElementById('modal-settings')?.classList.remove('hidden');
        });

        // Game Over Buttons
        document.getElementById('btn-go-retry')?.addEventListener('click', () => {
            this.game.startRun(this.game.gameMode || 'SURVIVAL');
        });
        document.getElementById('btn-go-menu')?.addEventListener('click', () => {
            document.getElementById('modal-gameover')?.classList.add('hidden');
            document.getElementById('modal-main-menu')?.classList.remove('hidden');
        });

        // Pause Overlay Buttons
        document.getElementById('btn-resume-game')?.addEventListener('click', () => {
            this.game.togglePause();
        });
        document.getElementById('btn-quit-main-menu')?.addEventListener('click', () => {
            document.getElementById('overlay-pause')?.classList.add('hidden');
            document.getElementById('modal-main-menu')?.classList.remove('hidden');
            this.game.gameActive = false;
        });
    }

    updateNightVisionUI(isBoosted) {
        if (this.btnNightVision) {
            this.btnNightVision.textContent = isBoosted ? '🌙 NIGHT [ON]' : '🌙 NIGHT [N]';
            this.btnNightVision.classList.toggle('active-btn', isBoosted);
        }
    }

    updatePerceptionUI(isActive) {
        if (this.btnPerception) {
            this.btnPerception.textContent = isActive ? '👁 SENSES [ON]' : '👁 SENSES [T]';
            this.btnPerception.classList.toggle('active-btn', isActive);
        }
        if (this.perceptionOverlay) {
            this.perceptionOverlay.classList.toggle('hidden', !isActive);
        }
    }

    toggleEmotionDrawer() {
        if (!this.emotionDrawer) return;
        const isHidden = this.emotionDrawer.classList.contains('hidden');
        this.emotionDrawer.classList.toggle('hidden', !isHidden);
        if (window.soundEngine) window.soundEngine.playClick();
    }

    toggleDebugOverlay() {
        if (!this.debugOverlay) return;
        this.debugOverlay.classList.toggle('hidden');
    }

    updateHUD(emotions, sensorInfo, state, hostTarget, dt) {
        // Vitals
        const energy  = Math.round(emotions.energy);
        const hunger  = Math.round(emotions.hunger);
        const stress  = Math.round(emotions.stress);
        const fear    = Math.round(emotions.fear);

        if (this.valEnergy) this.valEnergy.textContent = `${energy}%`;
        if (this.barEnergy) this.barEnergy.style.width  = `${energy}%`;

        if (this.valHunger) this.valHunger.textContent = `${hunger}%`;
        if (this.barHunger) this.barHunger.style.width  = `${hunger}%`;

        if (this.valStress) this.valStress.textContent = `${stress}%`;
        if (this.barStress) this.barStress.style.width  = `${stress}%`;

        if (this.valFear)   this.valFear.textContent   = `${fear}%`;
        if (this.barFear)   this.barFear.style.width    = `${fear}%`;

        // State & Target Info
        if (this.valState) this.valState.textContent = state;

        if (hostTarget) {
            if (this.valTarget)     this.valTarget.textContent = hostTarget.name || hostTarget.type;
            if (this.valTargetDist) this.valTargetDist.textContent = `${sensorInfo.sensorData.nearestDist}m`;

            // Risk Level calculation
            const risk = hostTarget.alertness;
            let riskText = 'LOW';
            let riskColor = '#00e676';
            if (risk > 70) {
                riskText = 'EXTREME';
                riskColor = '#ff1744';
            } else if (risk > 45) {
                riskText = 'MODERATE';
                riskColor = '#f59e0b';
            }
            if (this.valTargetRisk) {
                this.valTargetRisk.textContent = riskText;
                this.valTargetRisk.style.color = riskColor;
            }
        } else {
            if (this.valTarget)     this.valTarget.textContent = 'None';
            if (this.valTargetDist) this.valTargetDist.textContent = '--';
            if (this.valTargetRisk) {
                this.valTargetRisk.textContent = 'LOW';
                this.valTargetRisk.style.color = '#00e676';
            }
        }

        // Telemetry Meters
        const data = sensorInfo.sensorData;
        if (this.teleCO2)  this.teleCO2.textContent  = `${data.co2}%`;
        if (this.teleHeat) this.teleHeat.textContent = `${data.heat}%`;
        if (this.teleOdor) this.teleOdor.textContent = `${data.odor}%`;
        if (this.teleMove) this.teleMove.textContent = `${data.movement}%`;
        if (this.teleAttr) this.teleAttr.textContent = `${data.attraction}%`;

        // Update Emotion Drawer bars if open
        if (this.emotionDrawer && !this.emotionDrawer.classList.contains('hidden')) {
            this._updateEmotionDrawer(emotions);
        }

        // Update Debug Telemetry if visible
        if (this.debugOverlay && !this.debugOverlay.classList.contains('hidden')) {
            const p = this.game.player.position;
            const v = this.game.player.velocity;
            if (this.debugFps)   this.debugFps.textContent   = this.game.fps || 60;
            if (this.debugPos)   this.debugPos.textContent   = `${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}`;
            if (this.debugVel)   this.debugVel.textContent   = `${v.length().toFixed(2)} m/s`;
            if (this.debugState) this.debugState.textContent = state;
        }

        // Draw Radar Minimap
        this.renderMinimap();
    }

    _updateEmotionDrawer(e) {
        const setStat = (valEl, barEl, val) => {
            const round = Math.round(val);
            if (valEl) valEl.textContent = `${round}%`;
            if (barEl) barEl.style.width  = `${round}%`;
        };

        setStat(this.drawerHunger,    this.barDrwHunger,    e.hunger);
        setStat(this.drawerCuriosity, this.barDrwCuriosity, e.curiosity);
        setStat(this.drawerFear,      this.barDrwFear,      e.fear);
        setStat(this.drawerStress,    this.barDrwStress,    e.stress);
        setStat(this.drawerUrgency,   this.barDrwUrgency,   e.urgency);
        setStat(this.drawerAlertness, this.barDrwAlertness, e.alertness);
        setStat(this.drawerRelief,    this.barDrwRelief,    e.relief);
        setStat(this.drawerCalmness,  this.barDrwCalmness,  e.calmness);
        setStat(this.drawerEnergy,    this.barDrwEnergy,    e.energy);

        if (this.drawerBehavior) this.drawerBehavior.textContent = e.currentBehavior;
        if (this.drawerDesc)     this.drawerDesc.textContent     = e.behaviorDescription;
    }

    /**
     * Top-Down 2D Radar Canvas of the 28×12×24m Bedroom
     */
    renderMinimap() {
        if (!this.minimapCtx || !this.minimapCanvas) return;
        const ctx = this.minimapCtx;
        const w = this.minimapCanvas.width;
        const h = this.minimapCanvas.height;

        ctx.fillStyle = '#0a101d';
        ctx.fillRect(0, 0, w, h);

        // Map world coords (X: -14 to 14, Z: -12 to 12) into canvas
        const toX = (wx) => ((wx + 14) / 28) * (w - 12) + 6;
        const toY = (wz) => ((wz + 12) / 24) * (h - 12) + 6;

        // Room Border
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(6, 6, w - 12, h - 12);

        // Bed landmark (-10.25 to -1.75, -10.25 to 2.25)
        ctx.fillStyle = 'rgba(30, 58, 138, 0.45)';
        ctx.fillRect(toX(-10.2), toY(-10.2), toX(-1.8) - toX(-10.2), toY(2.2) - toY(-10.2));
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.3)';
        ctx.strokeRect(toX(-10.2), toY(-10.2), toX(-1.8) - toX(-10.2), toY(2.2) - toY(-10.2));

        // Desk landmark (3.75 to 11.25, -8.6 to -4.4)
        ctx.fillStyle = 'rgba(120, 53, 15, 0.4)';
        ctx.fillRect(toX(3.8), toY(-8.6), toX(11.2) - toX(3.8), toY(-4.4) - toY(-8.6));

        // Wardrobe / Cupboard (-13.2 to -7.8, 5.1 to 7.9)
        ctx.fillStyle = 'rgba(71, 85, 105, 0.5)';
        ctx.fillRect(toX(-13.2), toY(5.1), toX(-7.8) - toX(-13.2), toY(7.9) - toY(5.1));

        // Window (front wall Z: 12)
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(toX(-6), toY(11.8)); ctx.lineTo(toX(6), toY(11.8));
        ctx.stroke();

        // Safe Resting Zones (Green dots)
        if (this.game.world?.safeZones) {
            ctx.fillStyle = '#00e676';
            for (const sz of this.game.world.safeZones) {
                ctx.beginPath();
                ctx.arc(toX(sz.position.x), toY(sz.position.z), 2.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Hosts (Dots with species colors)
        if (this.game.hosts) {
            for (const host of this.game.hosts) {
                if (!host.active) continue;
                const hx = toX(host.group.position.x);
                const hy = toY(host.group.position.z);

                // Alert ring if agitated
                if (host.alertness > 40) {
                    ctx.strokeStyle = 'rgba(255, 23, 68, 0.6)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(hx, hy, 5 + (host.alertness / 100) * 4, 0, Math.PI * 2);
                    ctx.stroke();
                }

                // Species icon color
                ctx.fillStyle = host.type === 'HUMAN' ? '#f59e0b' : (host.type === 'DOG' ? '#ff9100' : (host.type === 'CAT' ? '#94a3b8' : '#10b981'));
                ctx.beginPath();
                ctx.arc(hx, hy, 3.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Player Mosquito (Cyan arrow showing heading)
        if (this.game.player) {
            const px = toX(this.game.player.position.x);
            const py = toY(this.game.player.position.z);
            const yaw = this.game.player.yaw;

            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(yaw);

            ctx.fillStyle = '#00e5ff';
            ctx.beginPath();
            ctx.moveTo(0, -6);
            ctx.lineTo(4, 5);
            ctx.lineTo(0, 3);
            ctx.lineTo(-4, 5);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
    }

    showActionPrompt(text) {
        if (!this.actionPrompt) return;
        if (text) {
            this.actionPrompt.textContent = text;
            this.actionPrompt.classList.remove('hidden');
        } else {
            this.actionPrompt.classList.add('hidden');
        }
    }

    showPhaseBanner(title, subtitle) {
        if (!this.banner) return;
        if (this.bannerTitle) this.bannerTitle.textContent = title;
        if (this.bannerSub)   this.bannerSub.textContent   = subtitle;
        this.banner.classList.remove('hidden');
        setTimeout(() => {
            this.banner.classList.add('hidden');
        }, 3400);
    }

    showToast(message) {
        if (!this.toast) return;
        this.toast.textContent = message;
        this.toast.classList.remove('hidden');
        clearTimeout(this._toastTimeout);
        this._toastTimeout = setTimeout(() => {
            this.toast.classList.add('hidden');
        }, 2600);
    }

    showFeedingMinigame(show) {
        if (this.feedingPanel) {
            this.feedingPanel.classList.toggle('hidden', !show);
        }
    }

    updateFeedingUI(statusData, feedingSystem) {
        if (!statusData) return;
        if (this.feedBar)          this.feedBar.style.width        = `${statusData.progress}%`;
        if (this.feedBarVal)       this.feedBarVal.textContent     = `${statusData.progress}%`;
        if (this.feedAccuracyVal)  this.feedAccuracyVal.textContent= `${statusData.accuracy}%`;
        if (this.feedStabilityVal) this.feedStabilityVal.textContent=`${statusData.stability}%`;
        if (this.feedRiskBar)      this.feedRiskBar.style.width    = `${statusData.detectionRisk}%`;
        if (this.feedRiskVal)      this.feedRiskVal.textContent    = `${statusData.detectionRisk}%`;

        if (this.feedWarning) {
            if (statusData.disturbance) {
                this.feedWarning.textContent = statusData.disturbance;
                this.feedWarning.classList.remove('hidden');
            } else {
                this.feedWarning.classList.add('hidden');
            }
        }

        if (this.feedCtx && feedingSystem) {
            feedingSystem.drawReticleCanvas(this.feedCtx, this.feedCanvas.width, this.feedCanvas.height);
        }
    }

    updateMissionBox(missionText) {
        if (!this.missionBox) return;
        if (missionText) {
            if (this.missionTitle) this.missionTitle.textContent = missionText.title;
            if (this.missionObj)   this.missionObj.textContent   = missionText.objective;
            this.missionBox.classList.remove('hidden');
        } else {
            this.missionBox.classList.add('hidden');
        }
    }

    showGameOverModal(stats, scoreData, reason) {
        const modal = document.getElementById('modal-gameover');
        if (!modal) return;

        const reasonEl = document.getElementById('go-reason-text');
        if (reasonEl && reason) reasonEl.textContent = reason;

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setVal('go-val-time', stats.survivalTime || '00:00');
        setVal('go-val-detected', stats.hostsDetected || 0);
        setVal('go-val-approached', stats.hostsApproached || 0);
        setVal('go-val-landings', stats.successfulLandings || 0);
        setVal('go-val-feeds', stats.successfulFeeds || 0);
        setVal('go-val-escapes', stats.successfulEscapes || 0);
        setVal('go-val-species', (stats.fedSpecies ? stats.fedSpecies.length : 0));
        setVal('go-val-dist', `${Math.round(stats.distanceTravelled || 0)}m`);
        setVal('go-val-score', scoreData.score || 0);
        setVal('go-val-rating', scoreData.rating || 'C');

        modal.classList.remove('hidden');
        if (window.soundEngine) window.soundEngine.playGameOver();
    }

    renderLeaderboard() {
        const list = document.getElementById('lb-entries-list');
        if (!list) return;

        const runs = window.storageManager.getBestRuns();
        if (runs.length === 0) {
            list.innerHTML = '<div style="text-align:center; color:#94a3b8; padding:20px;">No flight records yet. Complete runs to claim a spot on the leaderboard!</div>';
            return;
        }

        list.innerHTML = runs.map((run, idx) => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(30,41,59,0.5); padding:8px 12px; margin-bottom:6px; border-radius:6px; font-size:12px;">
                <span style="font-weight:700; color:#38bdf8;">#${idx + 1}</span>
                <span style="color:#e2e8f0;">${run.date || 'Run'}</span>
                <span style="color:#00e676;">${run.survivalTime || '00:00'}</span>
                <span style="color:#f59e0b;">${run.successfulFeeds || 0} Feeds</span>
                <strong style="color:#00e5ff; font-size:14px;">${run.score || 0} PTS</strong>
            </div>
        `).join('');
    }
}

window.UIManager = UIManager;
