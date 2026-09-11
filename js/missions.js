/**
 * Story Mode — 10-Level Mission Progression System
 * Through the Eyes of a Mosquito
 */

class MissionSystem {
    constructor() {
        this.progress = window.storageManager?.getMissionProgress() || { currentLevel: 1, completedLevels: [] };
        this.currentLevel = this.progress.currentLevel || 1;
        this.activeMission = null;
        this.missionTimer = 0;
        this._completed = false;
    }

    static LEVELS = [
        {
            id: 1,
            title: 'First Awakening',
            objective: 'Detect your first host in the bedroom.',
            hint: 'Fly across the bedroom and scan for warm chemical and thermal signals.',
            goal: (stats) => stats.hostsDetected >= 1,
        },
        {
            id: 2,
            title: 'Sensory Tracking',
            objective: 'Track and approach a host within 3 meters using Perception Mode [T / Tab].',
            hint: 'Activate Perception Mode [T] and follow the cyan CO₂ guidance line toward a host.',
            goal: (stats) => stats.perceptionUsed && stats.hostsApproached >= 1,
        },
        {
            id: 3,
            title: 'Touchdown Precision',
            objective: 'Execute a precision touchdown landing on a host capillary [E].',
            hint: 'Hover close (<1.4m) at low speed (<2.5 m/s) and press [E].',
            goal: (stats) => stats.hasLanded || stats.successfulLandings >= 1,
        },
        {
            id: 4,
            title: 'First Blood',
            objective: 'Complete your first precision blood feeding session.',
            hint: 'Keep the cyan reticle aligned with the moving capillary circle until intake reaches 100%.',
            goal: (stats) => stats.successfulFeeds >= 1,
        },
        {
            id: 5,
            title: 'Safe Harbor',
            objective: 'Rest in a sanctuary safe zone (Monstera leaf, curtain fold, or cupboard crevice).',
            hint: 'Fly to a green safe zone and press [E] to metabolize blood and replenish energy.',
            goal: (stats) => stats.hasRestedInSafeZone || stats.successfulEscapes >= 1,
        },
        {
            id: 6,
            title: 'The Sleeping Giant',
            objective: 'Feed successfully from the sleeping human on the bed.',
            hint: 'Find the human on the bed (-6, 1.2, -4). Watch out for sleep-tossing twitches!',
            goal: (stats) => stats.fedSpecies && stats.fedSpecies.includes('HUMAN'),
        },
        {
            id: 7,
            title: 'Canine Thermal Trail',
            objective: 'Track and feed from the sleeping dog on the floor rug.',
            hint: 'Follow high heat (red halo) and odor signals toward the bedroom rug.',
            goal: (stats) => stats.fedSpecies && stats.fedSpecies.includes('DOG'),
        },
        {
            id: 8,
            title: 'Feline Reflexes',
            objective: 'Evade a cat’s lightning-fast pounce swat reaction.',
            hint: 'Approach the cat. When the red warning ring expands, dash away with Turbo [Shift]!',
            goal: (stats) => stats.evadedCatPounce || stats.swatsEvaded >= 1,
        },
        {
            id: 9,
            title: 'Species Connoisseur',
            objective: 'Feed from at least three different host species (Human, Dog, Cat, Bird).',
            hint: 'Locate different species across the bedroom universe and feed from each.',
            goal: (stats) => stats.fedSpecies && stats.fedSpecies.length >= 3,
        },
        {
            id: 10,
            title: 'Master of the Night',
            objective: 'Survive for at least 3 minutes and reach full blood capacity.',
            hint: 'Manage hunger, avoid fan downwash turbulence, and escape to shelter when heavy.',
            goal: (stats) => stats.survivalSeconds >= 180 && stats.successfulFeeds >= 2,
        },
    ];

    startLevel(level) {
        this.activeMission = MissionSystem.LEVELS.find(l => l.id === level) || MissionSystem.LEVELS[0];
        this.currentLevel = this.activeMission.id;
        this.missionTimer = 0;
        this._completed = false;
        return this.activeMission;
    }

    update(dt, runStats) {
        if (!this.activeMission || this._completed) return null;
        this.missionTimer += dt;

        if (this.activeMission.goal(runStats)) {
            this._completed = true;
            this._onMissionComplete(this.activeMission);
            return {
                completed: true,
                mission: this.activeMission,
                nextLevel: this.currentLevel < MissionSystem.LEVELS.length ? this.currentLevel + 1 : null
            };
        }
        return null;
    }

    _onMissionComplete(mission) {
        if (!this.progress.completedLevels.includes(mission.id)) {
            this.progress.completedLevels.push(mission.id);
        }
        if (this.currentLevel < MissionSystem.LEVELS.length) {
            this.progress.currentLevel = this.currentLevel + 1;
        }
        window.storageManager?.saveMissionProgress(this.progress);

        if (window.soundEngine) {
            window.soundEngine.playMissionComplete();
        }
    }

    getCurrentMissionText() {
        if (!this.activeMission) return null;
        return {
            title: `MISSION ${this.activeMission.id}: ${this.activeMission.title}`,
            objective: this.activeMission.objective,
            hint: this.activeMission.hint
        };
    }
}

window.MissionSystem = MissionSystem;
