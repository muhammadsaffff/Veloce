/**
 * Main Application Bootstrap & Staged Loading Pipeline
 * Through the Eyes of a Mosquito — Production Upgrade
 */

window.addEventListener('DOMContentLoaded', async () => {
    // 1. Grab Loading Screen Elements
    const loadingOverlay   = document.getElementById('overlay-loading');
    const loadingBarFill   = document.getElementById('loading-bar-fill');
    const loadingBarPct    = document.getElementById('loading-bar-pct');
    const loadingStageText = document.getElementById('loading-stage-text');

    const updateStage = (pct, text) => {
        if (loadingBarFill) loadingBarFill.style.width = `${pct}%`;
        if (loadingBarPct)  loadingBarPct.textContent  = `${pct}%`;
        if (loadingStageText) loadingStageText.textContent = text;
    };

    // Staged Real Loading Sequence
    try {
        updateStage(15, 'Initializing WebGL Canvas & 3D Rendering Pipeline...');
        await new Promise(r => setTimeout(r, 120));

        updateStage(35, 'Constructing 8-Zone Environment (Bedroom, Living, Garden, Pond)...');
        await new Promise(r => setTimeout(r, 150));

        // Instantiate Game Engine
        window.gameEngine = new window.MosquitoGameEngine();

        updateStage(55, 'Synthesizing Ceiling Fan Vortex & Dynamic Lighting Engine...');
        await new Promise(r => setTimeout(r, 120));

        updateStage(75, 'Spawning 4 Procedural Host Models & Capillary Vasculature...');
        await new Promise(r => setTimeout(r, 150));

        updateStage(90, 'Waking 4-Channel Sensory Mesh & AI Entomological Director...');
        await new Promise(r => setTimeout(r, 120));

        updateStage(100, 'Ready to Fly! The world is enormous when you\'re tiny.');
        await new Promise(r => setTimeout(r, 200));

        // Fade out loading screen
        if (loadingOverlay) {
            loadingOverlay.classList.add('fade-out');
            setTimeout(() => {
                loadingOverlay.classList.add('hidden');
                loadingOverlay.classList.remove('fade-out');
            }, 400);
        }
    } catch (err) {
        console.error('Loading error:', err);
        if (loadingStageText) loadingStageText.textContent = 'Ready (Starting with fallback settings)';
        if (loadingOverlay) loadingOverlay.classList.add('hidden');
        if (!window.gameEngine) window.gameEngine = new window.MosquitoGameEngine();
    }

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

    // ── Bind Settings Modal & Persistence ─────────────────────────
    document.getElementById('btn-save-settings')?.addEventListener('click', () => {
        const diff    = document.getElementById('setting-difficulty')?.value || 'NORMAL';
        const quality = document.getElementById('setting-graphics-quality')?.value || 'AUTO';
        const sVol    = parseInt(document.getElementById('setting-sound-vol')?.value || '60', 10) / 100;
        const mVol    = parseInt(document.getElementById('setting-music-vol')?.value || '40', 10) / 100;
        const sens    = parseInt(document.getElementById('setting-mouse-sens')?.value || '100', 10) / 100;
        const fov     = parseInt(document.getElementById('setting-camera-fov')?.value || '75', 10);
        const shake   = document.getElementById('setting-cam-shake')?.checked ?? true;
        const isMuted = document.getElementById('setting-mute-check')?.checked ?? false;
        const aiProv  = document.getElementById('setting-ai-provider')?.value || 'GEMINI';
        const aiKey   = document.getElementById('setting-ai-key')?.value?.trim() || '';

        // Apply to engines
        window.soundEngine.setSoundVolume(sVol);
        window.soundEngine.setMusicVolume(mVol);
        window.soundEngine.setMuted(isMuted);

        if (window.gameEngine) {
            window.gameEngine.setGraphicsQuality(quality);
            if (window.gameEngine.player) {
                window.gameEngine.player.cameraFov = fov;
                window.gameEngine.player.cameraShakeEnabled = shake;
                window.gameEngine.camera.fov = fov;
                window.gameEngine.camera.updateProjectionMatrix();
            }
        }

        if (window.aiDirector) {
            window.aiDirector.configure(aiProv, aiKey);
        }

        // Save to LocalStorage
        window.storageManager.saveSettings({
            difficulty: diff,
            graphicsQuality: quality,
            soundVolume: sVol,
            musicVolume: mVol,
            mouseSensitivity: sens,
            cameraFov: fov,
            cameraShake: shake,
            muted: isMuted,
            aiProvider: aiProv,
            aiApiKey: aiKey
        });

        document.getElementById('modal-settings')?.classList.add('hidden');
        window.soundEngine.playClick();
        window.gameEngine.ui.showToast('Settings saved and applied successfully.');
    });

    // Clear Leaderboard Button
    document.getElementById('btn-clear-lb')?.addEventListener('click', () => {
        if (confirm('Reset all saved flight records?')) {
            window.storageManager.clearLeaderboard();
            window.gameEngine.ui.renderLeaderboard();
            window.gameEngine.ui.showToast('Flight records reset.');
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
