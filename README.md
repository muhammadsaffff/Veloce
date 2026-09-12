<img width="1280" height="640" alt="git (1)" src="https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd" />



# 🦟Through The Eyes Of a Mosquito👀


Through the Eyes of a Mosquito is an asynchronous, multi-rate 3D biological flight simulation engineered with Three.js and vanilla ES modules. The system places the player in the microscopic, high-velocity perspective of a female mosquito navigating a multi-zone domestic environment.
Team Name: Veloce

 # Team Members
 
- Team Lead: Muhammad Ibrahim - Collage of Engineering Perumon
- Member 2: Muhammad Saffan -  Collage of Engineering Perumon


# Project Description:
A 3D simulation placing players in the microscopic perspective of a female mosquito navigating a multi-room domestic environment. The system features real-time flight physics, compound-eye sensory modes (thermal, $CO_2$, odor), and local host behavioral AI to simulate host tracking, landing, and capillary feeding at 60+ FPS.

# The Problem (that doesn't exist):
Mosquitoes must calculate micro-scale aerodynamic drag, track shifting carbon dioxide plumes in complete darkness, identify exposed capillaries, and evade lethal threats with zero formal navigation training or biological recognition from the organisms they feed on.

# The Solution:
A 3D indie biological flight simulator that lets human players experience domestic survival from an insect's perspective, featuring multi-spectrum sensory shaders, realistic inertia, dynamic host swat AI, and a high-stakes feeding stabilization system.

## Technical Details

# Technologies/Components Used

Languages used: JavaScript (ES6+ Modules), GLSL (Fragment & Vertex Shaders), HTML5, CSS3
Frameworks used: None (Vanilla modular architecture)
Libraries used: Three.js (WebGL 3D Rendering), Web Audio API (Spatial audio & procedural wing buzz)
Tools used: Vite, VS Code, Blender, Chrome DevTools


## Implementation
# Installation

Bash
git clone https://github.com/veloce-team/through-the-eyes-of-a-mosquito.git
cd through-the-eyes-of-a-mosquito
npm install

# Run
BasH
npm run dev

# Project Documentation
For Software: https://muhammadsaffff.github.io/Veloce/

# Screenshots
<img width="1907" height="917" alt="Screenshot 2026-09-12 040126" src="https://github.com/user-attachments/assets/370b7bd3-b900-4800-a6fd-a1c64e5197d1" />
Sensory perception mode showing CO2 convection trails, thermal hot spots on the host, and environmental odor gradients.

<img width="1915" height="923" alt="Screenshot 2026-09-12 041143" src="https://github.com/user-attachments/assets/f2094f49-ace5-476d-9437-7413aa58d431" />
Active feeding HUD tracking accuracy, landing stability, blood intake progress, and host detection risk.

<img width="1905" height="896" alt="Screenshot 2026-09-12 041224" src="https://github.com/user-attachments/assets/560d1fb8-afc2-445b-9a28-e982eb3dab9a" />
First-person flight navigation through the domestic environment showing furniture collision boundaries and dynamic lighting.


# Diagrams

┌─────────────────────────────────────────────────────────┐
│               CENTRAL ENGINE LOOP (rAF)                 │
└────────────────────────────┬────────────────────────────┘
                             │
     ┌───────────────────────┼────────────────────────┐
     ▼ (60 FPS)              ▼ (30 FPS)               ▼ (10-15 FPS)
┌────────────────┐      ┌─────────────────┐      ┌──────────────────┐
│ Flight Physics │      │  Host Local AI  │      │ Sensory Shaders  │
│ Camera Spring  │      │  State Machines │      │ Minimap Blitting │
│ AABB Collision │      │  Reaction Logic │      │ Zone Streaming   │
└────────┬───────┘      └────────┬────────┘      └────────┬─────────┘
         │                       │                        │
         └───────────────────────┼────────────────────────┘
                                 ▼
                      ┌──────────────────────┐
                      │ Three.js / WebGL     │
                      │ Instanced Draw Calls │
                      └──────────────────────┘
Decoupled multi-rate game loop isolating rendering, flight physics, local AI, and sensory calculation frequencies.

## Project Demo
PROJECT: https://muhammadsaffff.github.io/Veloce/

Demonstrates smooth 60 FPS flight, switching between perception modes, host approach, precision landing, feeding mechanics, and swat evasion.



Team Contributions
Muhammad Ibrahim: Three.js rendering engine, GLSL custom sensory shaders, aerodynamic micro-flight physics, and zero-allocation object pools.

Muhammad Saffan: Local host behavioral AI finite state machines, spatial zone streaming, UI/HUD state machine, and Web Audio API integration.

---
Made with ❤️ at TinkerHub Useless Projects 

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--26-26?link=https%3A%2F%2Ftinkerhub.org%2Fevents%2F1M8ORET9A1%2Fuseless-projects-3.0)



