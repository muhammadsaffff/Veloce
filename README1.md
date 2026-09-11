# 🦟 Through the Eyes of a Mosquito
### *The world is enormous when you're tiny.*

A complete, polished, playable **3D browser-based simulation game** built with HTML5 Canvas, Three.js r128, native Web Audio API, and Vanilla ES6 JavaScript. No backend, no build tools, and no external npm dependencies required — simply open `index.html` locally in any modern web browser.

---

## 🎮 Gameplay & Core Loop

```
Search ➔ Detect Host ➔ Track Host ➔ Approach ➔ Feed ➔ Escape ➔ Rest ➔ Repeat
```

You play as a female mosquito hunting for blood meals inside a giant 28×12×24m bedroom at night. Fly through huge furniture, detect hosts using 4 physiological sensory channels, master precision capillary feeding, dodge lethal swat defense reactions, and manage 9 internal behavioral state variables.

---

## 🌟 Key Features

### 1. 🛏️ Enormous 3D Bedroom Universe (28×12×24m)
- **Giant Furniture**: Layered bed with rumpled blankets, study desk with warm lamp & laptop, tall wardrobe cupboard, window with rain particles and draping curtains, and potted Monstera & Ficus plants.
- **Sanctuary Safe Resting Zones**: Monstera broad leaves, pleated curtain folds, cupboard ceiling crevices, and under-bed shadows where you can rest, metabolize ingested blood, and replenish energy reserves.
- **Ceiling Fan Aerodynamic Vortex**: Rotating fan blades create real physical downward wind vortex physics that force the mosquito downward and outward if caught in the downwash.

### 2. 🌙 Nocturnal Lighting & Night Vision Boost
- Deep blue-night ambient illumination (`0x22334e` @ `1.9`) and directional moonlight (`0x8ab4f8` @ `2.0`).
- **Nocturnal Eye Illuminator**: Point light attached to the camera simulating compound-eye nocturnal adaptation.
- **Night Vision Boost (`N` key or HUD button)**: Bumps ambient to `3.4`, eye light to `4.2` (22m radius), moonlight to `3.2`, and halves scene fog density from `0.012` to `0.006`.

### 3. ✈️ 3D Flight Physics & Dual Camera
- **Tuned Physics**: Base speed `7.5`, acceleration `36.0`, drag `0.91`, with micro-hover wobble oscillation for insect biological realism.
- **Independent Per-Axis Wall Sliding**: Checks X, Y, and Z collisions independently, allowing the mosquito to glide seamlessly along walls, furniture, and ceilings without snagging.
- **Dual Camera Mode (`V` key)**: Toggle between 1st Person (compound insect eyes) and 3rd Person (chaser view).

### 4. 👁️ 4-Channel Sensory System & Perception Mode
- **CO₂ (Cyan)**: Long-range breath plumes from hosts.
- **Heat / Infrared (Orange-Red)**: Close-range thermal signatures.
- **Odor (Amber)**: Skin volatile scent clouds.
- **Movement (Violet)**: Johnston's organ acoustic/mechanoreception ripples.
- **Mosquito Perception Mode (`T` or `Tab` key)**: The world darkens into thermal wireframe while all sensory signals glow through walls with a 3D Bézier guidance spline pointing to the highest attraction target.

### 5. 👥 4 Host Species & Autonomous AI Swat Defense
- **Human**: Sleeping on bed, highest CO₂, slow rhythmic breathing, dangerous swat (`0.95`).
- **Dog**: Sleeping on rug, intense heat & odor, ear-scratching twitches, moderate swat risk (`0.60`).
- **Cat**: Perched on desk ledge, low odor, lightning-fast pounce swat (`0.85`).
- **Bird**: Perched near window, rapid head twitches, hops, lightweight target (`0.40`).
- **Telegraphed Swat Defense**: Expanding red shockwave ring visual, whoosh SFX, and near-miss evasion handling.

### 6. 🩸 Precision Feeding Minigame
- Interactive capillary reticle canvas steered via mouse or keys.
- Real-time meters for Accuracy %, Stability %, Detection Risk %, and Blood Intake %.
- Disturbance event warnings ("HOST SHIFTING!", "MUSCLE TREMOR!").
- Early detach via `E` or Right Click.
- Physical body load weight penalty (abdomen expands and reddens, slowing flight speed by up to 40%).

### 7. 🧠 9-Variable Internal States Engine
- Simulates: **Hunger, Curiosity, Fear, Stress, Urgency, Alertness, Relief, Calmness, Energy**.
- Real-time animated bars in the glassmorphism Emotion Drawer (`Q` key).

### 8. 🔊 Procedural Web Audio API Engine
- 100% procedural real-time synthesis — zero external audio files.
- Speed-modulated flight drone, detection chimes, swat alarms, feeding heartbeats, swat whooshes, and ceiling fan proximity hums.

### 9. 🏆 4 Game Modes
- **Story Mode**: 10-level mission progression.
- **Survival Challenge**: Survive as long as possible with local top 10 leaderboard.
- **Free Simulation**: Unconstrained exploration.
- **Sandbox Experiment**: Real-time spawner for Human, Dog, Cat, Bird, custom shelter zones, fan toggle, and time-of-day controls.

---

## ⌨️ Controls

| Key | Action |
|-----|--------|
| **W / A / S / D** or **Arrow Keys** | Fly & Steer |
| **Space / R** | Climb |
| **C / Ctrl** | Dive |
| **Shift** | Turbo Boost |
| **N** | Toggle Night Vision Boost |
| **T / Tab** | Toggle Mosquito Perception Mode |
| **E** | Land / Feed / Rest / Detach |
| **Right Click** | Abort Feeding & Detach |
| **Q** | Open/Close Emotion Drawer |
| **V** | Toggle 1st / 3rd Person Camera |
| **P / Esc** | Pause Simulation |
| **F3** | Toggle Debug Telemetry |

---

## 🔬 Scientific Disclaimer

> “The emotional states shown in this simulation (Hunger, Curiosity, Fear, Stress, Urgency, Alertness, Relief, Calmness) are fictional interpretations designed to help players understand mosquito behavior. They do not represent proven human-like emotions or conscious experiences in mosquitoes.”

---

## 🚀 Getting Started

No build tools or web servers required!
1. Clone the repository:
   ```bash
   git clone https://github.com/muhammadsaffff/Veloce.git
   ```
2. Double-click `index.html` to play directly in your browser.
