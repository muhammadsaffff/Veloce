/**
 * Procedural Web Audio API Sound Engine
 * Through the Eyes of a Mosquito
 *
 * All audio synthesized procedurally in real-time — zero external sound files.
 *
 * Implements:
 * 1. Flight drone (pitch & volume modulated by speed and turbo boost)
 * 2. Detection ping (resonant harmonic chime upon lock-on)
 * 3. Alarm on swat & host twitch
 * 4. Rhythmic heartbeat during feeding minigame
 * 5. Swat whoosh (filtered white-noise whoosh)
 * 6. Fan proximity hum (55Hz sub-bass oscillator)
 * 7. Ambient nocturnal mood tones
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.sfxGain    = null;
        this.musicGain  = null;

        this.muted       = false;
        this.soundVolume = 0.6;
        this.musicVolume = 0.4;

        // Persistent synthesizers
        this.flightOscillator = null;
        this.flightGain       = null;
        this.fanHumNode       = null;
        this.fanHumGain       = null;
        this.heartbeatTimer   = null;
        this.ambientOsc       = null;

        this._initialized = false;
    }

    ensureContext() {
        if (this._initialized) {
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            return;
        }

        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            this.ctx = new AudioCtx();

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.muted ? 0 : 1.0;
            this.masterGain.connect(this.ctx.destination);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = this.soundVolume;
            this.sfxGain.connect(this.masterGain);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = this.musicVolume;
            this.musicGain.connect(this.masterGain);

            this._initFlightDrone();
            this._initFanHum();
            this._initAmbientNocturne();

            this._initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported or blocked:', e);
        }
    }

    _initFlightDrone() {
        if (!this.ctx) return;
        // Sawtooth wave passed through subtle distortion to mimic high-frequency wing oscillation
        this.flightOscillator = this.ctx.createOscillator();
        this.flightOscillator.type = 'sawtooth';
        this.flightOscillator.frequency.value = 390;

        const waveShaper = this.ctx.createWaveShaper();
        waveShaper.curve = this._makeDistortionCurve(35);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1800;

        this.flightGain = this.ctx.createGain();
        this.flightGain.gain.value = 0;

        this.flightOscillator.connect(waveShaper);
        waveShaper.connect(filter);
        filter.connect(this.flightGain);
        this.flightGain.connect(this.sfxGain);

        this.flightOscillator.start();
    }

    _initFanHum() {
        if (!this.ctx) return;
        this.fanHumNode = this.ctx.createOscillator();
        this.fanHumNode.type = 'sine';
        this.fanHumNode.frequency.value = 58;

        this.fanHumGain = this.ctx.createGain();
        this.fanHumGain.gain.value = 0;

        this.fanHumNode.connect(this.fanHumGain);
        this.fanHumGain.connect(this.sfxGain);
        this.fanHumNode.start();
    }

    _initAmbientNocturne() {
        if (!this.ctx) return;
        // Deep nocturnal hum
        this.ambientOsc = this.ctx.createOscillator();
        this.ambientOsc.type = 'triangle';
        this.ambientOsc.frequency.value = 110;

        const ambGain = this.ctx.createGain();
        ambGain.gain.value = 0.05;

        this.ambientOsc.connect(ambGain);
        ambGain.connect(this.musicGain);
        this.ambientOsc.start();
    }

    _makeDistortionCurve(amount) {
        const n = 256;
        const curve = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            const x = (i * 2) / n - 1;
            curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
        }
        return curve;
    }

    /**
     * Update flight drone sound with pitch & volume modulation
     */
    updateFlightHum(speedRatio, isBoosting, isLanded) {
        if (!this.ctx || !this.flightGain || this.muted) return;

        const t = this.ctx.currentTime;
        if (isLanded) {
            this.flightGain.gain.setTargetAtTime(0, t, 0.1);
            return;
        }

        const baseFreq = isBoosting ? 560 : 400;
        const targetFreq = baseFreq + speedRatio * 180;
        const targetVol  = isBoosting ? 0.18 : (0.07 + speedRatio * 0.06);

        this.flightOscillator.frequency.setTargetAtTime(targetFreq, t, 0.08);
        this.flightGain.gain.setTargetAtTime(targetVol, t, 0.12);
    }

    updateFanProximity(distance) {
        if (!this.ctx || !this.fanHumGain || this.muted) return;
        const maxDist = 12.0;
        const proximity = Math.max(0, 1 - (distance / maxDist));
        const vol = Math.pow(proximity, 1.8) * 0.22;
        this.fanHumGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.15);
    }

    /**
     * Resonant chime when host is detected
     */
    playDetectionPing() {
        if (!this.ctx || this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.18);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.36);
    }

    /**
     * Swat warning alarm beep
     */
    playAlertAlarm() {
        if (!this.ctx || this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(950, this.ctx.currentTime);
        osc.frequency.setValueAtTime(750, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.21);
    }

    /**
     * White-noise bandpass filtered whoosh for host swat attack
     */
    playSwatWhoosh() {
        if (!this.ctx || this.muted) return;
        const bufferSize = this.ctx.sampleRate * 0.45;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 1.8;
        filter.frequency.setValueAtTime(300, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.15);
        filter.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.42);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.44);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start();
        noise.stop(this.ctx.currentTime + 0.45);
    }

    /**
     * Rhythmic double-thump heartbeat during feeding
     */
    startHeartbeat(bpm = 65) {
        this.stopHeartbeat();
        const intervalMs = (60 / bpm) * 1000;

        const beat = () => {
            if (!this.ctx || this.muted) return;
            const t = this.ctx.currentTime;

            // Lub (first sound)
            const osc1 = this.ctx.createOscillator();
            const gain1 = this.ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(75, t);
            osc1.frequency.exponentialRampToValueAtTime(38, t + 0.12);
            gain1.gain.setValueAtTime(0.35, t);
            gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
            osc1.connect(gain1);
            gain1.connect(this.sfxGain);
            osc1.start(t);
            osc1.stop(t + 0.15);

            // Dub (second sound, slightly delayed)
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(65, t + 0.15);
            osc2.frequency.exponentialRampToValueAtTime(32, t + 0.25);
            gain2.gain.setValueAtTime(0.25, t + 0.15);
            gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.27);
            osc2.connect(gain2);
            gain2.connect(this.sfxGain);
            osc2.start(t + 0.15);
            osc2.stop(t + 0.28);
        };

        beat();
        this.heartbeatTimer = setInterval(beat, intervalMs);
    }

    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    playMissionComplete() {
        if (!this.ctx || this.muted) return;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = this.ctx.currentTime + idx * 0.1;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.25, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 0.36);
        });
    }

    playGameOver() {
        if (!this.ctx || this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.8);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.86);
    }

    playClick() {
        if (!this.ctx || this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(400, t + 0.04);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.05);
    }

    playPerceptionToggle(active) {
        if (!this.ctx || this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime;

        osc.type = 'sine';
        if (active) {
            osc.frequency.setValueAtTime(350, t);
            osc.frequency.exponentialRampToValueAtTime(900, t + 0.18);
        } else {
            osc.frequency.setValueAtTime(900, t);
            osc.frequency.exponentialRampToValueAtTime(350, t + 0.18);
        }

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.23);
    }

    setMuted(muted) {
        this.muted = muted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(muted ? 0 : 1.0, this.ctx.currentTime);
        }
    }

    setSoundVolume(vol) {
        this.soundVolume = vol;
        if (this.sfxGain && this.ctx) {
            this.sfxGain.gain.setValueAtTime(vol, this.ctx.currentTime);
        }
    }

    setMusicVolume(vol) {
        this.musicVolume = vol;
        if (this.musicGain && this.ctx) {
            this.musicGain.gain.setValueAtTime(vol, this.ctx.currentTime);
        }
    }
}

window.soundEngine = new SoundEngine();
