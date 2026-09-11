/**
 * 9-Variable Internal States Engine (Simulated Behavioral Parameters)
 * Through the Eyes of a Mosquito
 *
 * SCIENTIFIC DISCLAIMER:
 * "The emotional states shown in this simulation (Hunger, Curiosity, Fear, Stress, Urgency, Alertness, Relief, Calmness)
 * are fictional interpretations designed to help players understand mosquito behavior. They do not represent proven
 * human-like emotions or conscious experiences in mosquitoes."
 */

class EmotionSystem {
    constructor() {
        // 9 simulated variables (0–100)
        this.hunger    = 70;
        this.curiosity = 40;
        this.fear      = 10;
        this.stress    = 15;
        this.urgency   = 50;
        this.alertness = 20;
        this.relief    = 0;
        this.calmness  = 65;
        this.energy    = 100;

        // Physical derived parameter
        this.bodyLoad  = 0; // 0–100 blood weight load

        this.currentBehavior = 'SEARCHING';
        this.behaviorDescription = 'Scanning ambient air currents for trace thermal and chemical plumes.';
    }

    update(dt, gameState, nearestHostDist, isFeeding, isResting) {
        // Hunger steadily rises over time
        this.hunger = Math.min(100, this.hunger + dt * 0.75);

        // Energy dynamics: drains in flight, recovers in sanctuary resting zones
        if (isResting) {
            this.energy   = Math.min(100, this.energy + dt * 14.0);
            this.bodyLoad = Math.max(0, this.bodyLoad - dt * 6.0); // Digest blood
            this.relief   = Math.min(100, this.relief + dt * 25.0);
            this.stress   = Math.max(0, this.stress - dt * 18.0);
            this.fear     = Math.max(0, this.fear - dt * 12.0);
            this.calmness = Math.min(100, this.calmness + dt * 15.0);
        } else if (isFeeding) {
            this.energy    = Math.max(0, this.energy - dt * 0.4);
            this.stress    = Math.min(100, this.stress + dt * 8.0);
            this.fear      = Math.min(100, this.fear + dt * 5.0);
            this.urgency   = Math.min(100, this.urgency + dt * 4.0);
            this.alertness = Math.min(100, this.alertness + dt * 10.0);
        } else {
            // Free flight drain
            this.energy  = Math.max(0, this.energy - dt * 1.6);
            this.relief  = Math.max(0, this.relief - dt * 8.0);
            this.calmness = Math.max(0, 100 - this.stress * 0.6 - this.fear * 0.4);
        }

        // Host proximity effects
        if (nearestHostDist !== null && nearestHostDist < 10) {
            const prox = 1 - (nearestHostDist / 10);
            this.curiosity = Math.min(100, this.curiosity + prox * dt * 20.0);
            this.alertness = Math.min(100, this.alertness + prox * dt * 16.0);
            if (nearestHostDist < 3.0) {
                this.urgency = Math.min(100, this.urgency + dt * 18.0);
            }
        } else {
            this.curiosity = Math.max(10, this.curiosity - dt * 4.0);
            this.alertness = Math.max(10, this.alertness - dt * 6.0);
        }

        // Urgency is driven directly by hunger
        this.urgency = Math.max(this.urgency, this.hunger * 0.65);

        // Clamp all 9 variables strictly between 0 and 100
        const vars = ['hunger', 'curiosity', 'fear', 'stress', 'urgency', 'alertness', 'relief', 'calmness', 'energy'];
        vars.forEach(v => {
            this[v] = Math.max(0, Math.min(100, this[v]));
        });

        this._updateBehavior(gameState);
    }

    _updateBehavior(state) {
        const descriptions = {
            'SEARCHING':   ['SEARCHING', 'Scanning ambient air currents for trace thermal and chemical plumes.'],
            'TRACKING':    ['TRACKING', 'Chemical gradient locked — following CO₂ and heat vectors.'],
            'APPROACHING': ['APPROACHING', 'Closing distance. Aligning trajectory with host capillary zone.'],
            'FEEDING':     ['FEEDING', 'Engorging blood meal. Monitoring host alertness and disturbance tremors.'],
            'ESCAPING':    ['ESCAPING', 'Threat detected! Evading swat radius toward safety.'],
            'RESTING':     ['RESTING & DIGESTING', 'Sheltered in sanctuary zone. Metabolizing blood and replenishing flight energy.']
        };

        const current = descriptions[state] || ['HOVERING', 'Observing environment.'];
        this.currentBehavior = current[0];
        this.behaviorDescription = current[1];
    }

    onFeedComplete(bloodAmount) {
        this.hunger   = Math.max(0, this.hunger - bloodAmount * 0.85);
        this.bodyLoad = Math.min(100, this.bodyLoad + bloodAmount);
        this.energy   = Math.min(100, this.energy + bloodAmount * 0.35);
        this.relief   = 85;
        this.stress   = Math.max(0, this.stress - 25);
    }

    onNectarFeed(amount = 35) {
        this.energy   = Math.min(100, this.energy + amount);
        this.hunger   = Math.max(0, this.hunger - amount * 0.5);
        this.calmness = Math.min(100, this.calmness + 20);
        this.relief   = 70;
    }

    onSwatNearMiss() {
        this.fear    = Math.min(100, this.fear + 40);
        this.stress  = Math.min(100, this.stress + 30);
        this.urgency = Math.min(100, this.urgency + 35);
        this.calmness = Math.max(0, this.calmness - 50);
    }

    getFlightSpeedModifier() {
        // Ingested blood load slows flight speed (up to 40% slower when engorged)
        const weightPenalty = 1 - (this.bodyLoad * 0.004);
        // Fear provides temporary adrenaline flight burst (up to 25% boost)
        const fearBoost = 1 + (this.fear * 0.0025);
        return Math.max(0.35, weightPenalty * fearBoost);
    }
}

window.EmotionSystem = EmotionSystem;
