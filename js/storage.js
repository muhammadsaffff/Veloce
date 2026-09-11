/**
 * Storage & Progression Persistence Manager
 * Through the Eyes of a Mosquito — Production Upgrade
 *
 * Persists:
 * - Simulation & Graphics Settings (Quality, Audio, Camera, AI configuration)
 * - Leaderboard / Best Runs (Top 10 records)
 * - Mission Progression (Current level & completed list)
 * - Achievements Unlocked
 * - World Zone Discoveries
 * - Lifetime Statistics
 */

class StorageManager {
    constructor() {
        this.KEYS = {
            SETTINGS:      'mosquito_prod_settings',
            BEST_RUNS:     'mosquito_prod_best_runs',
            MISSIONS:      'mosquito_prod_missions',
            ACHIEVEMENTS:  'mosquito_prod_achievements',
            DISCOVERIES:   'mosquito_prod_discoveries',
            HIGH_SCORE:    'mosquito_prod_high_score',
            STATISTICS:    'mosquito_prod_stats'
        };
    }

    // --- Settings ---
    getSettings() {
        try {
            const raw = localStorage.getItem(this.KEYS.SETTINGS);
            if (!raw) return this._defaultSettings();
            return Object.assign(this._defaultSettings(), JSON.parse(raw));
        } catch (e) {
            console.warn('StorageManager: Failed to load settings, using defaults.', e);
            return this._defaultSettings();
        }
    }

    saveSettings(settings) {
        try {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (e) {
            console.warn('StorageManager: Failed to save settings.', e);
            return false;
        }
    }

    _defaultSettings() {
        return {
            difficulty: 'NORMAL',          // EASY, NORMAL, HARD
            graphicsQuality: 'AUTO',       // LOW, MEDIUM, HIGH, ULTRA, AUTO
            soundVolume: 0.6,              // 0.0 - 1.0
            musicVolume: 0.4,              // 0.0 - 1.0
            muted: false,
            mouseSensitivity: 1.0,         // 0.2 - 2.5
            fov: 75,                       // 60 - 100
            cameraSmoothing: 0.85,         // 0.1 - 1.0
            cameraShake: true,             // bool
            flightAssistance: true,        // bool
            aiProvider: 'LOCAL',           // LOCAL, GEMINI, OPENAI
            aiApiKey: '',
            aiModel: 'gemini-1.5-flash'
        };
    }

    // --- Best Runs (Top 10 Leaderboard) ---
    getBestRuns() {
        try {
            const raw = localStorage.getItem(this.KEYS.BEST_RUNS);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    saveRun(record) {
        try {
            const runs = this.getBestRuns();
            runs.push({
                date: record.date || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                survivalTime: record.survivalTime || '00:00',
                survivalSeconds: record.survivalSeconds || 0,
                score: record.score || 0,
                rating: record.rating || 'B',
                successfulFeeds: record.successfulFeeds || 0,
                fedSpecies: record.fedSpecies || [],
                distanceFlown: Math.round(record.distanceTravelled || 0)
            });
            runs.sort((a, b) => (b.score || 0) - (a.score || 0));
            const top10 = runs.slice(0, 10);
            localStorage.setItem(this.KEYS.BEST_RUNS, JSON.stringify(top10));
            this.saveHighScore(record.score || 0);
            return top10;
        } catch (e) {
            console.warn('StorageManager: Failed to save run.', e);
            return [];
        }
    }

    clearLeaderboard() {
        try {
            localStorage.removeItem(this.KEYS.BEST_RUNS);
            return true;
        } catch {
            return false;
        }
    }

    // --- High Score ---
    getHighScore() {
        try {
            return parseInt(localStorage.getItem(this.KEYS.HIGH_SCORE) || '0', 10);
        } catch {
            return 0;
        }
    }

    saveHighScore(score) {
        try {
            const current = this.getHighScore();
            if (score > current) {
                localStorage.setItem(this.KEYS.HIGH_SCORE, String(score));
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    // --- Mission Progression ---
    getMissionProgress() {
        try {
            const raw = localStorage.getItem(this.KEYS.MISSIONS);
            return raw ? JSON.parse(raw) : { currentLevel: 1, completedLevels: [] };
        } catch {
            return { currentLevel: 1, completedLevels: [] };
        }
    }

    saveMissionProgress(prog) {
        try {
            localStorage.setItem(this.KEYS.MISSIONS, JSON.stringify(prog));
            return true;
        } catch {
            return false;
        }
    }

    // --- Achievements ---
    getAchievements() {
        try {
            const raw = localStorage.getItem(this.KEYS.ACHIEVEMENTS);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }

    unlockAchievement(id) {
        try {
            const ach = this.getAchievements();
            if (!ach[id]) {
                ach[id] = { unlockedAt: Date.now() };
                localStorage.setItem(this.KEYS.ACHIEVEMENTS, JSON.stringify(ach));
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    // --- World Discoveries ---
    getDiscoveries() {
        try {
            const raw = localStorage.getItem(this.KEYS.DISCOVERIES);
            return raw ? JSON.parse(raw) : ['BEDROOM'];
        } catch {
            return ['BEDROOM'];
        }
    }

    saveDiscovery(zoneId) {
        try {
            const discs = new Set(this.getDiscoveries());
            discs.add(zoneId);
            localStorage.setItem(this.KEYS.DISCOVERIES, JSON.stringify(Array.from(discs)));
        } catch {}
    }

    // --- Score Calculator ---
    calculateScore(stats) {
        const timeBonus     = Math.round((stats.survivalSeconds || 0) * 4);
        const feedBonus     = (stats.successfulFeeds || 0) * 800;
        const escapeBonus   = (stats.successfulEscapes || 0) * 450;
        const speciesBonus  = (stats.fedSpecies ? stats.fedSpecies.length : 0) * 600;
        const landingBonus  = (stats.successfulLandings || 0) * 300;
        const zoneBonus     = (stats.zonesDiscovered ? stats.zonesDiscovered.length : 1) * 350;
        const distBonus     = Math.round((stats.distanceTravelled || 0) * 0.5);

        const totalScore = Math.max(0, timeBonus + feedBonus + escapeBonus + speciesBonus + landingBonus + zoneBonus + distBonus);

        let rating = 'F';
        if (totalScore >= 8000) rating = 'S (★★★★★)';
        else if (totalScore >= 5500) rating = 'A (★★★★☆)';
        else if (totalScore >= 3500) rating = 'B (★★★☆☆)';
        else if (totalScore >= 1800) rating = 'C (★★☆☆☆)';
        else if (totalScore >= 600)  rating = 'D (★☆☆☆☆)';

        return { score: totalScore, rating };
    }
}

window.StorageManager = StorageManager;
window.storageManager = new StorageManager();
