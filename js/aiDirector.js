/**
 * AI Director & Entomological Knowledge Assistant
 * Through the Eyes of a Mosquito — Production Upgrade
 *
 * Architecture:
 * - Local AI (100% Offline): Authoritative, instant semantic knowledge retrieval and scenario ideas.
 * - Optional Online LLM: Compatible with Google Gemini & OpenAI API endpoints for dynamic narration.
 * - Event-Driven Only: Never called in the render loop; triggers only on explicit user request or key events.
 * - Robust Error Handling: Network drops or missing keys gracefully default to Local AI.
 */

class AIDirector {
    constructor() {
        this.status = 'LOCAL_AI'; // 'READY', 'CONNECTED', 'LOCAL_AI', 'ERROR'
        this.provider = 'LOCAL';
        this.apiKey = '';
        this.model = 'gemini-1.5-flash';

        this._loadConfig();

        // Built-in Entomological Biological Knowledge Base (100% offline)
        this.knowledgeBase = {
            vision: {
                title: 'Mosquito Compound Eyes & Night Vision',
                content: 'Mosquitoes see the world through two large compound eyes made up of hundreds of hexagonal ommatidia. Their vision has lower spatial resolution than humans, but an extraordinary flicker fusion rate (>250 Hz)—making human movements appear in slow motion. They cannot see sharp details at distance, but detect polarized light, movement, and contrast adaptations at night.'
            },
            chemoreception: {
                title: 'Maxillary Palps & Carbon Dioxide (CO₂)',
                content: 'Female mosquitoes track breath from over 30 meters away using cpA receptor neurons on their maxillary palps. When CO₂ is detected, it triggers rapid upwind flight and cross-wind zigzag casting to follow turbulent chemical plume trails directly to the host.'
            },
            thermoreception: {
                title: 'TRPA1 Thermoreceptors & Heat Radiation',
                content: 'At distances under 1 to 2 meters, heat becomes the dominant attractant. TRPA1 infrared thermoreceptors located on the tips of the antennae perceive subtle temperature differentials of 0.2°C, guiding the mosquito directly to superficial blood vessels.'
            },
            proboscis: {
                title: 'Proboscis Anatomy & Capillary Micro-Surgery',
                content: 'The proboscis is a bundle of 6 specialized microscopic stylets called the fascicle: 2 serrated maxillae saw through epidermal tissue, 2 mandibles hold the puncture open, the hypopharynx injects saliva containing vasodilators and anticoagulants, and the labrum siphons blood directly from capillaries.'
            },
            aerodynamics: {
                title: 'Wing Beat Aerodynamics & Flight Physics',
                content: 'Mosquitoes flap their narrow wings at 600–800 beats per second—far faster than other insects. Rather than conventional steady aerodynamic lift, they rely on leading-edge vortex rotational drag, spinning the wing on stroke reversals to generate low-pressure suction above the wing.'
            },
            reproduction: {
                title: 'Blood Digestion & Oviposition in Water',
                content: 'Only female mosquitoes consume blood. The protein and iron are metabolized during a 48–72 hour resting period to develop egg batches. Once eggs are mature, the female seeks stagnant water pools, bird baths, or puddles to deposit floating egg rafts.'
            },
            hazards: {
                title: 'Ceiling Fan Downwash & Environmental Hazards',
                content: 'A mosquito’s top flight speed is under 2 km/h. Household ceiling fans generate wind streams exceeding 12 km/h, which completely overpower flight thrust and shred scent plumes. Heavy rain drops weigh 50 times more than a mosquito; surviving a raindrop strike requires rolling with the droplet fluid mass.'
            }
        };
    }

    _loadConfig() {
        if (window.storageManager) {
            const s = window.storageManager.getSettings();
            this.provider = s.aiProvider || 'LOCAL';
            this.apiKey = s.aiApiKey || '';
            this.model = s.aiModel || 'gemini-1.5-flash';
        }
        this.status = this.apiKey ? 'READY' : 'LOCAL_AI';
    }

    setConfig(provider, apiKey, model) {
        this.provider = provider;
        this.apiKey = (apiKey || '').trim();
        if (model) this.model = model.trim();

        if (window.storageManager) {
            const s = window.storageManager.getSettings();
            s.aiProvider = this.provider;
            s.aiApiKey = this.apiKey;
            s.aiModel = this.model;
            window.storageManager.saveSettings(s);
        }

        this.status = this.apiKey ? 'READY' : 'LOCAL_AI';
    }

    /**
     * Test API connection without blocking gameplay
     */
    async testConnection() {
        if (!this.apiKey) {
            this.status = 'LOCAL_AI';
            return { success: false, message: 'No API key provided. Using built-in Local AI.' };
        }

        try {
            const res = await this.askQuestion('Ping test: Confirm connection in 5 words.');
            this.status = 'CONNECTED';
            return { success: true, message: `Connected to ${this.model}! Response: ${res.answer.slice(0, 60)}...` };
        } catch (err) {
            this.status = 'LOCAL_AI';
            return { success: false, message: `Connection failed (${err.message}). Reverted to Local AI.` };
        }
    }

    /**
     * Query scientific question with offline fallback
     */
    async askQuestion(query, context = {}) {
        const q = (query || '').toLowerCase().trim();

        // 1. Try Online API if configured
        if (this.apiKey && this.provider !== 'LOCAL') {
            try {
                const onlineAnswer = await this._callOnlineAPI(query, context);
                if (onlineAnswer) {
                    this.status = 'CONNECTED';
                    return { answer: onlineAnswer, source: 'ONLINE_AI' };
                }
            } catch (err) {
                console.warn('AIDirector: Online query failed, using offline fallback.', err);
                this.status = 'LOCAL_AI';
            }
        }

        // 2. Offline Entomological Knowledge Matching
        return { answer: this._queryOfflineKnowledge(q), source: 'LOCAL_AI' };
    }

    _queryOfflineKnowledge(q) {
        if (!q) {
            return "Greetings tiny flier! I am your Biology Assistant. Ask me about mosquito compound eyes, CO₂ tracking, proboscis anatomy, flight vortexes, or egg laying.";
        }

        if (q.includes('eye') || q.includes('vision') || q.includes('night') || q.includes('see')) {
            return `${this.knowledgeBase.vision.title}\n\n${this.knowledgeBase.vision.content}`;
        }
        if (q.includes('co2') || q.includes('carbon') || q.includes('plume') || q.includes('smell') || q.includes('odor')) {
            return `${this.knowledgeBase.chemoreception.title}\n\n${this.knowledgeBase.chemoreception.content}`;
        }
        if (q.includes('heat') || q.includes('thermal') || q.includes('temperature') || q.includes('warm')) {
            return `${this.knowledgeBase.thermoreception.title}\n\n${this.knowledgeBase.thermoreception.content}`;
        }
        if (q.includes('proboscis') || q.includes('needle') || q.includes('bite') || q.includes('feed') || q.includes('blood')) {
            return `${this.knowledgeBase.proboscis.title}\n\n${this.knowledgeBase.proboscis.content}`;
        }
        if (q.includes('fly') || q.includes('wing') || q.includes('aerodynamic') || q.includes('speed')) {
            return `${this.knowledgeBase.aerodynamics.title}\n\n${this.knowledgeBase.aerodynamics.content}`;
        }
        if (q.includes('egg') || q.includes('breed') || q.includes('puddle') || q.includes('water') || q.includes('pond')) {
            return `${this.knowledgeBase.reproduction.title}\n\n${this.knowledgeBase.reproduction.content}`;
        }
        if (q.includes('fan') || q.includes('wind') || q.includes('vortex') || q.includes('rain')) {
            return `${this.knowledgeBase.hazards.title}\n\n${this.knowledgeBase.hazards.content}`;
        }

        return "In this simulation, mosquitoes navigate using four sensory channels: Carbon Dioxide (CO₂ plumes up to 30m), Body Heat (TRPA1 sensors within 2m), Skin Odors (volatile fatty acids), and Movement (Johnston's organ). Manage your flight energy by resting in dark corners or sipping sweet plant nectar!";
    }

    async _callOnlineAPI(query, context) {
        const prompt = `You are a biological narrator for the 3D indie simulation "Through the Eyes of a Mosquito".
Current State: Zone: ${context.zone || 'Bedroom'}, Energy: ${context.energy || 100}%, Target: ${context.target || 'None'}.
User Question: "${query}"
Answer accurately in 2 concise paragraphs with real entomological science.`;

        // Gemini API
        if (this.provider === 'GEMINI' || this.apiKey.startsWith('AIza')) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model || 'gemini-1.5-flash'}:generateContent?key=${this.apiKey}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { maxOutputTokens: 280, temperature: 0.7 }
                })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return data?.candidates?.[0]?.content?.parts?.[0]?.text;
        }

        // OpenAI compatible API
        const url = 'https://api.openai.com/v1/chat/completions';
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model || 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 280
            })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data?.choices?.[0]?.message?.content;
    }

    /**
     * Generate dynamic sandbox scenario
     */
    generateScenario() {
        const scenarios = [
            {
                title: 'Stormy Night Garden Infiltration',
                zone: 'GARDEN_YARD',
                weather: 'STORM',
                timeOfDay: 'NIGHT',
                fanEnabled: false,
                desc: 'A raging thunderstorm outside. Raindrops crash down into the yard while lightning illuminates the giant oak tree. Avoid water impact and feed from the perched songbird.'
            },
            {
                title: 'Ceiling Fan Downwash Gauntlet',
                zone: 'BEDROOM',
                weather: 'CLEAR',
                timeOfDay: 'NIGHT',
                fanEnabled: true,
                desc: 'The master bedroom ceiling fan is spinning at maximum speed. Navigate the physical downward vortex to touch down on the sleeping human without crashing.'
            },
            {
                title: 'Canine Thermal Trail at Dusk',
                zone: 'LIVING_ROOM',
                weather: 'CLEAR',
                timeOfDay: 'DUSK',
                fanEnabled: false,
                desc: 'Dusk falls over the living room. The family dog sleeps on the soft rug, radiating strong thermal heat and skin volatiles. Approach quietly to avoid triggering its ears.'
            },
            {
                title: 'Balcony Cat Stalking Challenge',
                zone: 'BALCONY',
                weather: 'CLEAR',
                timeOfDay: 'NIGHT',
                fanEnabled: false,
                desc: 'The house cat is alert on the balcony railing coping. It reacts with lightning-fast pounces when disturbed. Stay behind its blind spot to feed.'
            }
        ];
        return scenarios[Math.floor(Math.random() * scenarios.length)];
    }
}

window.AIDirector = AIDirector;
window.aiDirector = new AIDirector();
