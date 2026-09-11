/**
 * LocalStorage Manager
 * Through the Eyes of a Mosquito
 *
 * Keys:
 * - bestRuns (top 10 run records)
 * - settings (difficulty, volumes, muted, sensitivity)
 * - missionProgress (level & completed list)
 * - highScore (numerical best score)
 */

class StorageManager {
    constructor() {
        this.KEYS = {
            BEST_RUNS: 'mosquito_best_runs',
            SETTINGS:  'mosquito_settings',
            MISSIONS:  'mosquito_mission_progress',
            HIGH_SCORE:'mosquito_high_score'
        };
    }

    // --- Settings ---
    getSettings() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.SETTINGS)) || this._defaultSettings();
        } catch {
            return this._defaultSettings();
        }
    }

    saveSettings(settings) {
        try {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
        } catch {}
    }

    _defaultSettings() {
        return {
            difficulty: 'NORMAL',
            soundVolume: 0.6,
            musicVolume: 0.4,
            muted: false,
            mouseSensitivity: 1.0
        };
    }

    // --- Best Runs Leaderboard (Top 10) ---
    getBestRuns() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.BEST_RUNS)) || [];
        } catch {
            return [];
        }
    }

    saveRun(runRecord) {
        try {
            let runs = this.getBestRuns();
            runs.push(runRecord);
            runs.sort((a, b) => (b.score || 0) - (a.score || 0));
            runs = runs.slice(0, 10);
            localStorage.setItem(this.KEYS.BEST_RUNS, JSON.stringify(runs));
            return runs;
        } catch {
            return [];
        }
    }

    clearLeaderboard() {
        try {
            localStorage.removeItem(this.KEYS.BEST_RUNS);
        } catch {}
    }

    // --- Mission Progress ---
    getMissionProgress() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.MISSIONS)) || { currentLevel: 1, completedLevels: [] };
        } catch {
            return { currentLevel: 1, completedLevels: [] };
        }
    }

    saveMissionProgress(progress) {
        try {
            localStorage.setItem(this.KEYS.MISSIONS, JSON.stringify(progress));
        } catch {}
    }

    // --- High Score ---
    getHighScore() {
        try {
            return parseInt(localStorage.getItem(this.KEYS.HIGH_SCORE), 10) || 0;
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

    // --- Score Calculation ---
    calculateScore(stats) {
        const timeBonus    = (stats.survivalSeconds || 0) * 3;
        const feedBonus    = (stats.successfulFeeds || 0) * 600;
        const escapeBonus  = (stats.successfulEscapes || 0) * 350;
        const speciesBonus = ((stats.fedSpecies ? stats.fedSpecies.length : 0)) * 400;
        const landingBonus = (stats.successfulLandings || 0) * 200;
        const distBonus    = Math.round((stats.distanceTravelled || 0) * 0.5);

        const score = Math.max(0, timeBonus + feedBonus + escapeBonus + speciesBonus + landingBonus + distBonus);

        let rating = 'F';
        if (score >= 6000) rating = 'S (★★★★★)';
        else if (score >= 4000) rating = 'A (★★★★☆)';
        else if (score >= 2500) rating = 'B (★★★☆☆)';
        else if (score >= 1200) rating = 'C (★★☆☆☆)';
        else if (score >= 500)  rating = 'D (★☆☆☆☆)';

        return { score, rating };
    }
}

window.storageManager = new StorageManager();
