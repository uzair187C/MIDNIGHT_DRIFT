# MIDNIGHT DRIFT

An arcade-style open world driving game built with Three.js.

## Overview

This project features:
- A drifting supercar with nitro boost and dynamic handling
- A night city environment with roads, sidewalks, buildings, and map boundaries
- Racing checkpoints and power-up pickups
- HUD elements for speed, RPM, drift score, nitro, and lap timing
- Camera modes and visual effects for immersive gameplay

## Controls

- `W` / `↑`: Accelerate
- `S` / `↓`: Brake / Reverse
- `A` / `←`: Steer Left
- `D` / `→`: Steer Right
- `SPACE`: Handbrake (Drift)
- `SHIFT`: Nitro Boost
- `C`: Cycle Camera Mode
- `T`: Toggle Race Mode
- `R`: Reset Car
- `L`: Toggle Headlights
- `H`: Toggle Controls Panel
- `F`: Horn

## How to Run

1. Open the project folder in VS Code.
2. Start a local server from the project folder:

```sh
python -m http.server 8000
```

3. Open your browser and go to:

```text
http://localhost:8000
```

## Project Structure

- `index.html` — main game page
- `style.css` — HUD, loader, and UI styling
- `input.js` — keyboard and gamepad input handling
- `car.js` — car physics, visuals, and gameplay mechanics
- `world.js` — city, roads, boundaries, and environment generation
- `game.js` — main loop, camera, HUD updates, and game state

## Notes

This project is a work in progress and is designed to be extended with:
- more realistic vehicle physics
- track objectives and missions
- better buildings and world detail
- sound effects and music
