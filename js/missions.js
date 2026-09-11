/**
 * 15-Mission Story Mode & 9 Unlockable Achievements
 * Through the Eyes of a Mosquito — Production Upgrade
 */

class MissionSystem {
    constructor() {
        this.progress = window.storageManager?.getMissionProgress() || { currentLevel: 1, completedLevels: [] };
        this.currentLevel = this.progress.currentLevel || 1;
        this.activeMission = null;
        this.missionTimer = 0;
        this._completed = false;

        this.achievements = [
            { id: 'FIRST_BLOOD', name: 'First Blood', desc: 'Complete your first precision blood meal.', unlocked: false },
            { id: 'AEROBAT', name: 'Master Aerobat', desc: 'Perform a high-speed turbo boost dive without crashing.', unlocked: false },
            { id: 'GHOST_EVASION', name: 'Ghost in the Room', desc: 'Evade a host swat within 0.6m of the impact radius.', unlocked: false },
            { id: 'SPECIES_COLLECTOR', name: 'Host Diversity', desc: 'Feed successfully from all 4 animal host species.', unlocked: false },
            { id: 'GREAT_OUTDOORS', name: 'Breaking the Window', desc: 'Exit the house through the open bedroom window into the wild garden.', unlocked: false },
            { id: 'FLOWER_POWER', name: 'Nectar Sipper', desc: 'Replenish energy from garden flowers or kitchen fruit bowl.', unlocked: false },
            { id: 'STORM_SURVIVOR', name: 'Eye of the Storm', desc: 'Survive in the outdoor garden during heavy rain and lightning.', unlocked: false },
            { id: 'LIFE_CYCLE', name: 'Next Generation', desc: 'Lay an egg raft on the stagnant garden pond surface.', unlocked: false },
            { id: 'APEX_SURVIVOR', name: 'Apex Nocturnal', desc: 'Survive for over 5 minutes with zero swat damage taken.', unlocked: false }
        ];

        this._loadAchievements();
    }

    _loadAchievements() {
        if (window.storageManager) {
            const saved = window.storageManager.getAchievements();
            this.achievements.forEach(ach => {
                if (saved[ach.id]) ach.unlocked = true;
            });
        }
    }

    unlockAchievement(id) {
        const ach = this.achievements.find(a => a.id === id);
        if (ach && !ach.unlocked) {
            ach.unlocked = true;
            if (window.storageManager) window.storageManager.unlockAchievement(id);
            if (window.soundEngine && typeof window.soundEngine.playDiscoveryPing === 'function') {
                window.soundEngine.playDiscoveryPing();
            }
            if (window.gameEngine && window.gameEngine.ui) {
                window.gameEngine.ui.showToast(`🏆 ACHIEVEMENT UNLOCKED: ${ach.name}!`);
            }
            return ach;
        }
        return null;
    }

    static LEVELS = [
        {
            id: 1,
            title: 'First Awakening',
            zone: 'BEDROOM',
            objective: 'Detect your first warm host in the master bedroom.',
            goal: (stats) => stats.hostsDetected >= 1
        },
        {
            id: 2,
            title: 'Sensory Tracking',
            zone: 'BEDROOM',
            objective: 'Track and approach a host within 3 meters using Perception Mode [SPACE / P].',
            goal: (stats) => stats.perceptionUsed && stats.hostsApproached >= 1
        },
        {
            id: 3,
            title: 'Touchdown Precision',
            zone: 'BEDROOM',
            objective: 'Execute a precision touchdown landing on a host capillary [E].',
            goal: (stats) => stats.hasLanded || stats.successfulLandings >= 1
        },
        {
            id: 4,
            title: 'First Blood',
            zone: 'BEDROOM',
            objective: 'Complete your first precision blood feeding session.',
            goal: (stats) => stats.successfulFeeds >= 1
        },
        {
            id: 5,
            title: 'Safe Harbor',
            zone: 'BEDROOM',
            objective: 'Rest in a sanctuary safe zone (under bed, curtain fold, or potted plant).',
            goal: (stats) => stats.hasRestedInSafeZone || stats.successfulEscapes >= 1
        },
        {
            id: 6,
            title: 'The Sleeping Giant',
            zone: 'BEDROOM',
            objective: 'Feed successfully from the sleeping human on the bed.',
            goal: (stats) => stats.fedSpecies && stats.fedSpecies.includes('HUMAN')
        },
        {
            id: 7,
            title: 'Canine Thermal Trail',
            zone: 'LIVING_ROOM',
            objective: 'Navigate through the hallway to the living room and locate the dog.',
            goal: (stats) => stats.zonesDiscovered && stats.zonesDiscovered.includes('LIVING_ROOM')
        },
        {
            id: 8,
            title: 'Living Room Feast',
            zone: 'LIVING_ROOM',
            objective: 'Feed from the sleeping family dog on the living room rug.',
            goal: (stats) => stats.fedSpecies && stats.fedSpecies.includes('DOG')
        },
        {
            id: 9,
            title: 'Feline Reflexes',
            zone: 'BALCONY',
            objective: 'Evade the cat’s lightning-fast pounce swat reaction on the balcony.',
            goal: (stats) => stats.evadedCatPounce || stats.swatsEvaded >= 1
        },
        {
            id: 10,
            title: 'Kitchen Nectar Raid',
            zone: 'KITCHEN',
            objective: 'Enter the kitchen and feed on sweet fruit in the countertop bowl.',
            goal: (stats) => stats.hasEatenNectar
        },
        {
            id: 11,
            title: 'Steam Sanctuary',
            zone: 'BATHROOM',
            objective: 'Visit the high-humidity bathroom and locate the bathtub water surface.',
            goal: (stats) => stats.zonesDiscovered && stats.zonesDiscovered.includes('BATHROOM')
        },
        {
            id: 12,
            title: 'Breaking the Window',
            zone: 'BALCONY',
            objective: 'Fly through the open bedroom window out onto the balcony deck.',
            goal: (stats) => stats.zonesDiscovered && stats.zonesDiscovered.includes('BALCONY')
        },
        {
            id: 13,
            title: 'Wild Songbird',
            zone: 'GARDEN_YARD',
            objective: 'Climb into the giant oak tree canopy and feed from the songbird.',
            goal: (stats) => stats.fedSpecies && stats.fedSpecies.includes('BIRD')
        },
        {
            id: 14,
            title: 'Garden Pond Oviposition',
            zone: 'POND_STREET',
            objective: 'Reach the stagnant garden pond and touch down on a lily pad.',
            goal: (stats) => stats.hasLaidEggs || (stats.zonesDiscovered && stats.zonesDiscovered.includes('POND_STREET'))
        },
        {
            id: 15,
            title: 'Master of All Realms',
            zone: 'GARDEN_YARD',
            objective: 'Feed from all 4 host species, discover at least 6 zones, and survive.',
            goal: (stats) => (stats.fedSpecies && stats.fedSpecies.length >= 4) && (stats.zonesDiscovered && stats.zonesDiscovered.length >= 6)
        }
    ];

    startLevel(level) {
        this.activeMission = MissionSystem.LEVELS.find(l => l.id === level) || MissionSystem.LEVELS[0];
        this.currentLevel = this.activeMission.id;
        this.missionTimer = 0;
        this._completed = false;
        return this.activeMission;
    }

    getCurrentMissionText() {
        if (!this.activeMission) return null;
        return {
            id: this.activeMission.id,
            title: this.activeMission.title,
            objective: this.activeMission.objective
        };
    }

    update(dt, runStats) {
        if (!this.activeMission || this._completed) return null;
        this.missionTimer += dt;

        if (this.activeMission.goal(runStats)) {
            this._completed = true;

            if (!this.progress.completedLevels.includes(this.currentLevel)) {
                this.progress.completedLevels.push(this.currentLevel);
            }

            const nextLevel = this.currentLevel + 1;
            if (nextLevel <= MissionSystem.LEVELS.length) {
                this.progress.currentLevel = nextLevel;
            }

            if (window.storageManager) window.storageManager.saveMissionProgress(this.progress);

            return {
                completed: true,
                mission: this.activeMission,
                nextLevel: nextLevel <= MissionSystem.LEVELS.length ? nextLevel : null
            };
        }

        // Check Dynamic Achievements
        if (runStats.successfulFeeds >= 1) this.unlockAchievement('FIRST_BLOOD');
        if (runStats.swatsEvaded >= 1) this.unlockAchievement('GHOST_EVASION');
        if (runStats.fedSpecies && runStats.fedSpecies.length >= 4) this.unlockAchievement('SPECIES_COLLECTOR');
        if (runStats.zonesDiscovered && runStats.zonesDiscovered.includes('GARDEN_YARD')) this.unlockAchievement('GREAT_OUTDOORS');
        if (runStats.hasEatenNectar) this.unlockAchievement('FLOWER_POWER');
        if (runStats.hasLaidEggs) this.unlockAchievement('LIFE_CYCLE');
        if (runStats.survivalSeconds >= 300 && (!runStats.damageTaken || runStats.damageTaken === 0)) this.unlockAchievement('APEX_SURVIVOR');

        return null;
    }
}

window.MissionSystem = MissionSystem;
