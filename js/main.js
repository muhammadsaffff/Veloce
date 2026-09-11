/**
 * Main Application Bootstrap & UI Event Integrations
 * Through the Eyes of a Mosquito
 */

window.addEventListener('DOMContentLoaded', () => {
    // Instantiate 3D Mosquito Simulation Game
    window.gameEngine = new window.MosquitoGameEngine();

    // ── Bind Sandbox Experiment Controls ─────────────────────────
    document.getElementById('btn-sb-human')?.addEventListener('click', () => {
        window.gameEngine.sandbox.spawnEntity('HUMAN');
    });
    document.getElementById('btn-sb-dog')?.addEventListener('click', () => {
        window.gameEngine.sandbox.spawnEntity('DOG');
    });
    document.getElementById('btn-sb-cat')?.addEventListener('click', () => {
        window.gameEngine.sandbox.spawnEntity('CAT');
    });
    document.getElementById('btn-sb-bird')?.addEventListener('click', () => {
        window.gameEngine.sandbox.spawnEntity('BIRD');
    });
    document.getElementById('btn-sb-safezone')?.addEventListener('click', () => {
        window.gameEngine.sandbox.spawnSafeZone();
    });
    document.getElementById('btn-sb-clear')?.addEventListener('click', () => {
        window.gameEngine.sandbox.removeAllSpawnedHosts();
    });

    // Time of Day controls
    document.getElementById('btn-sb-night')?.addEventListener('click', () => {
        window.gameEngine.sandbox.setTimeOfDay('NIGHT');
    });
    document.getElementById('btn-sb-morning')?.addEventListener('click', () => {
        window.gameEngine.sandbox.setTimeOfDay('MORNING');
    });
    document.getElementById('btn-sb-day')?.addEventListener('click', () => {
        window.gameEngine.sandbox.setTimeOfDay('DAY');
    });
    document.getElementById('btn-sb-evening')?.addEventListener('click', () => {
        window.gameEngine.sandbox.setTimeOfDay('EVENING');
    });

    // Ceiling Fan Toggle
    document.getElementById('btn-sb-fan-toggle')?.addEventListener('click', () => {
        const next = !window.gameEngine.dynamicEnv.fanEnabled;
        window.gameEngine.sandbox.toggleFan(next);
        const btn = document.getElementById('btn-sb-fan-toggle');
        if (btn) btn.textContent = next ? 'FAN: ON' : 'FAN: OFF';
    });

    // ── Bind Settings Modal ───────────────────────────────────────
    const settings = window.storageManager.getSettings();
    const diffSelect = document.getElementById('setting-difficulty');
    if (diffSelect) diffSelect.value = settings.difficulty || 'NORMAL';

    const volSlider = document.getElementById('setting-sound-vol');
    if (volSlider) volSlider.value = Math.round((settings.soundVolume || 0.6) * 100);

    const musicSlider = document.getElementById('setting-music-vol');
    if (musicSlider) musicSlider.value = Math.round((settings.musicVolume || 0.4) * 100);

    const sensSlider = document.getElementById('setting-mouse-sens');
    if (sensSlider) sensSlider.value = Math.round((settings.mouseSensitivity || 1.0) * 100);

    const muteCheck = document.getElementById('setting-mute-check');
    if (muteCheck) muteCheck.checked = !!settings.muted;

    document.getElementById('btn-save-settings')?.addEventListener('click', () => {
        const diff    = diffSelect.value;
        const sVol    = parseInt(volSlider.value, 10) / 100;
        const mVol    = parseInt(musicSlider.value, 10) / 100;
        const sens    = parseInt(sensSlider ? sensSlider.value : '100', 10) / 100;
        const isMuted = muteCheck.checked;

        window.soundEngine.setSoundVolume(sVol);
        window.soundEngine.setMusicVolume(mVol);
        window.soundEngine.setMuted(isMuted);

        window.storageManager.saveSettings({
            difficulty: diff,
            soundVolume: sVol,
            musicVolume: mVol,
            mouseSensitivity: sens,
            muted: isMuted
        });

        document.getElementById('modal-settings')?.classList.add('hidden');
        window.soundEngine.playClick();
        window.gameEngine.ui.showToast('Settings saved successfully.');
    });

    // Clear Leaderboard
    document.getElementById('btn-clear-lb')?.addEventListener('click', () => {
        if (confirm('Reset all saved flight records?')) {
            window.storageManager.clearLeaderboard();
            window.gameEngine.ui.renderLeaderboard();
        }
    });

    // Close Modal by Backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop && backdrop.id !== 'modal-main-menu' && backdrop.id !== 'modal-gameover') {
                backdrop.classList.add('hidden');
            }
        });
    });
});
