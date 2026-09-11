/**
 * Non-Graphic Precision Feeding Minigame
 * Through the Eyes of a Mosquito
 *
 * Features:
 * - Blood intake progress bar (0–100%)
 * - Host alertness bar (0–100%)
 * - Detection risk bar (0–100%)
 * - Disturbance event warnings ("HOST SHIFTING!", "MUSCLE TREMOR!")
 * - Interactive capillary canvas with wander oscillation
 * - Early detachment via [E] key or Right Click
 * - Post-feed body load weight penalty
 */

class FeedingSystem {
    constructor() {
        this.isFeeding = false;
        this.feedTarget = null;
        this.targetZoneName = 'Capillary Zone';
        this.feedProgress = 0;       // 0–100%

        // Precision Minigame State
        this.reticlePos = { x: 0, y: 0 };    // Player needle offset (-1 to 1)
        this.capillaryPos = { x: 0, y: 0 };  // Moving host capillary center (-1 to 1)
        this.capillaryVelocity = { x: 0, y: 0 };

        this.accuracy = 85;      // 0–100%
        this.stability = 80;     // 0–100%
        this.detectionRisk = 15; // 0–100%

        this.timeInZone = 0;
        this.timeOutsideZone = 0;
        this.driftTimer = 0;
        this.hostTwitchTimer = 4.0;
        this.disturbanceEvent = null;
    }

    /**
     * Evaluate touchdown precision landing accuracy based on approach speed and distance
     */
    evaluateLanding(playerVelocity, distanceToZone) {
        const speed = playerVelocity ? playerVelocity.length() : 0;
        const speedAcc = Math.max(0, Math.min(1.0, 1.0 - (speed / 3.0)));
        const distAcc  = Math.max(0, Math.min(1.0, 1.0 - (distanceToZone / 1.5)));

        const landingAccuracy = Math.round(speedAcc * distAcc * 100);
        return {
            success: landingAccuracy >= 30,
            accuracy: landingAccuracy,
            speedTooHigh: speed > 2.5,
            distanceTooFar: distanceToZone > 1.4
        };
    }

    startFeeding(host, zoneName = 'Capillary Zone', initialAccuracy = 80) {
        this.isFeeding = true;
        this.feedTarget = host;
        this.targetZoneName = zoneName;
        this.feedProgress = 0;
        this.accuracy = initialAccuracy;
        this.stability = 75;
        this.detectionRisk = Math.round((host.alertness || 0) * 0.4 + 10);

        this.reticlePos = { x: 0, y: 0 };
        this.capillaryPos = { x: (Math.random() - 0.5) * 0.3, y: (Math.random() - 0.5) * 0.3 };
        this.capillaryVelocity = { x: (Math.random() - 0.5) * 0.4, y: (Math.random() - 0.5) * 0.4 };

        this.disturbanceEvent = null;
        this.hostTwitchTimer = 3.5 + Math.random() * 3.5;

        if (window.soundEngine) {
            window.soundEngine.startHeartbeat(65);
        }
    }

    adjustReticle(dx, dy) {
        if (!this.isFeeding) return;
        this.reticlePos.x = Math.max(-1.0, Math.min(1.0, this.reticlePos.x + dx));
        this.reticlePos.y = Math.max(-1.0, Math.min(1.0, this.reticlePos.y + dy));
    }

    update(dt) {
        if (!this.isFeeding || !this.feedTarget) return null;

        const host = this.feedTarget;
        this.driftTimer += dt;

        // 1. Capillary wander oscillation driven by host breathing rhythm
        const freq = host.type === 'HUMAN' ? 1.2 : (host.type === 'DOG' ? 1.8 : 2.4);
        this.capillaryPos.x += Math.sin(this.driftTimer * freq) * dt * 0.4 + this.capillaryVelocity.x * dt;
        this.capillaryPos.y += Math.cos(this.driftTimer * (freq * 0.8)) * dt * 0.35 + this.capillaryVelocity.y * dt;

        // Soft rebound at bounds
        if (Math.abs(this.capillaryPos.x) > 0.7) {
            this.capillaryVelocity.x *= -1;
            this.capillaryPos.x = Math.sign(this.capillaryPos.x) * 0.7;
        }
        if (Math.abs(this.capillaryPos.y) > 0.7) {
            this.capillaryVelocity.y *= -1;
            this.capillaryPos.y = Math.sign(this.capillaryPos.y) * 0.7;
        }

        // Random subtle twitch nudges
        if (Math.random() < dt * 0.8) {
            this.capillaryVelocity.x = (Math.random() - 0.5) * 0.8;
            this.capillaryVelocity.y = (Math.random() - 0.5) * 0.8;
        }

        // 2. Compute reticle distance from capillary center
        const distToCapillary = Math.hypot(
            this.reticlePos.x - this.capillaryPos.x,
            this.reticlePos.y - this.capillaryPos.y
        );

        const targetRadius = 0.38;
        const isInside = distToCapillary <= targetRadius;

        if (isInside) {
            this.timeInZone += dt;
            this.timeOutsideZone = 0;
            this.accuracy = Math.min(100, this.accuracy + dt * 12);
            this.stability = Math.min(100, this.stability + dt * 10);
            this.detectionRisk = Math.max(5, this.detectionRisk - dt * 4);

            // Blood intake rate accelerates when aligned
            const intakeRate = 12.0 * (this.accuracy / 100);
            this.feedProgress = Math.min(100, this.feedProgress + dt * intakeRate);
        } else {
            this.timeOutsideZone += dt;
            this.accuracy = Math.max(10, this.accuracy - dt * 25);
            this.stability = Math.max(15, this.stability - dt * 20);

            // Needle scraping against tissue spikes host alertness & detection risk
            this.detectionRisk = Math.min(100, this.detectionRisk + dt * 22);
            host.alertness = Math.min(100, host.alertness + dt * 14);

            // Very slow intake when misaligned
            this.feedProgress = Math.min(100, this.feedProgress + dt * 2.5);
        }

        // 3. Periodic Host Disturbance Tremor
        this.hostTwitchTimer -= dt;
        if (this.hostTwitchTimer <= 0) {
            this._triggerHostTremor(host);
            this.hostTwitchTimer = 3.5 + Math.random() * 4.5;
        }

        // Clear disturbance text after 1.8 seconds
        if (this.disturbanceEvent && performance.now() - this.disturbanceEvent.time > 1800) {
            this.disturbanceEvent = null;
        }

        // 4. Check for Swat Lethal Threshold
        if (this.detectionRisk >= 100 || host.alertness >= 90) {
            return {
                status: 'SWAT_TRIGGERED',
                host,
                progress: this.feedProgress,
                accuracy: Math.round(this.accuracy)
            };
        }

        // 5. Check for Feeding Complete
        if (this.feedProgress >= 100) {
            return {
                status: 'COMPLETE',
                host,
                bloodAmount: 100,
                accuracy: Math.round(this.accuracy)
            };
        }

        return {
            status: 'FEEDING',
            progress: Math.round(this.feedProgress),
            accuracy: Math.round(this.accuracy),
            stability: Math.round(this.stability),
            detectionRisk: Math.round(this.detectionRisk),
            hostAlertness: Math.round(host.alertness),
            disturbance: this.disturbanceEvent ? this.disturbanceEvent.text : null
        };
    }

    _triggerHostTremor(host) {
        const tremors = [
            '⚠ HOST SHIFTING!',
            '⚠ MUSCLE TREMOR!',
            '⚠ RESPIRATORY HEAVE!',
            '⚠ INVOLUNTARY TWITCH!'
        ];
        const text = tremors[Math.floor(Math.random() * tremors.length)];
        this.disturbanceEvent = { text, time: performance.now() };

        // Sudden jump in capillary position
        this.capillaryPos.x += (Math.random() - 0.5) * 0.45;
        this.capillaryPos.y += (Math.random() - 0.5) * 0.45;
        this.detectionRisk = Math.min(100, this.detectionRisk + 12);
        host.alertness = Math.min(100, host.alertness + 8);

        if (window.soundEngine) {
            window.soundEngine.playAlertAlarm();
        }
    }

    stopFeeding() {
        this.isFeeding = false;
        this.feedTarget = null;
        this.disturbanceEvent = null;
        if (window.soundEngine) {
            window.soundEngine.stopHeartbeat();
        }
    }

    /**
     * Render the 2D Reticle Canvas
     */
    drawReticleCanvas(ctx, width, height) {
        if (!ctx) return;
        const cx = width / 2;
        const cy = height / 2;
        const scale = width * 0.38;

        // Background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);

        // Capillary Tissue Grid
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 15) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y < height; y += 15) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }

        // 1. Moving Red Capillary Target Zone
        const capX = cx + this.capillaryPos.x * scale;
        const capY = cy + this.capillaryPos.y * scale;
        const capRadius = scale * 0.38;

        // Outer pulse
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.beginPath();
        ctx.arc(capX, capY, capRadius, 0, Math.PI * 2);
        ctx.fill();

        // Inner core
        ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
        ctx.beginPath();
        ctx.arc(capX, capY, capRadius * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // 2. Proboscis Needle Reticle (Cyan)
        const retX = cx + this.reticlePos.x * scale;
        const retY = cy + this.reticlePos.y * scale;

        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2;

        // Crosshair circle
        ctx.beginPath();
        ctx.arc(retX, retY, 10, 0, Math.PI * 2);
        ctx.stroke();

        // Crosshair tick lines
        ctx.beginPath();
        ctx.moveTo(retX - 16, retY); ctx.lineTo(retX - 6, retY);
        ctx.moveTo(retX + 6, retY);  ctx.lineTo(retX + 16, retY);
        ctx.moveTo(retX, retY - 16); ctx.lineTo(retX, retY - 6);
        ctx.moveTo(retX, retY + 6);  ctx.lineTo(retX, retY + 16);
        ctx.stroke();

        // Center dot
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(retX, retY, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

window.FeedingSystem = FeedingSystem;
