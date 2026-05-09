// === CONFIG ===
const CFG = {
  // Physics — tuned for arcade feel
  MAX_SPEED: 125,
  REVERSE_SPEED: 35,
  ACCEL: 48,
  BRAKE: 60,
  FRICTION: 0.992,
  STEER_MAX: 2.6,
  DRIFT_GRIP: 0.16,
  NORMAL_GRIP: 0.94,
  GRAVITY: 42,
  // Nitro
  NITRO_ACCEL: 75,
  NITRO_MAX: 100,
  NITRO_DRAIN: 25,
  NITRO_REGEN: 7,
  // Gears
  GEAR_RATIOS: [14, 26, 40, 56, 72, 88, 105],
  // World
  WORLD: 1200,
  ROAD_W: 22,
  BLOCK: 110,
  SIDEWALK_W: 3,
  // Camera
  CAM_DIST: 14,
  CAM_HEIGHT: 5.8,
  CAM_SMOOTH: 5.0,
  // Effects
  SKID_LIFETIME: 30,
  MAX_SKIDS: 800,
  MAX_SPARKS: 80,
  MAX_TRAFFIC: 18,
  RAIN_COUNT: 4000,
  // Audio
  AUDIO_ENABLED: true,
  ENGINE_BASE_FREQ: 80,
  ENGINE_MAX_FREQ: 380,
  // Weather
  WEATHER_CYCLE: false,
};

// === INPUT ===
const keys = {};
const gamepad = { axes: [0,0,0,0], buttons: [] };
const keyJustPressed = {};

window.addEventListener('keydown', e => {
  if(!keys[e.code]) keyJustPressed[e.code] = true;
  keys[e.code] = true;
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

// Clear just-pressed each frame
function clearJustPressed() {
  for(let k in keyJustPressed) delete keyJustPressed[k];
}

// Gamepad support
function pollGamepad() {
  const gps = navigator.getGamepads ? navigator.getGamepads() : [];
  for(const gp of gps) {
    if(!gp) continue;
    gamepad.axes = [...gp.axes];
    gamepad.buttons = gp.buttons.map(b => b.pressed);
    break;
  }
}

function isKey(action) {
  switch(action) {
    case 'fwd': return keys['KeyW'] || keys['ArrowUp'] || gamepad.buttons[7] || (gamepad.axes[1] < -0.3);
    case 'back': return keys['KeyS'] || keys['ArrowDown'] || gamepad.buttons[6] || (gamepad.axes[1] > 0.3);
    case 'left': return keys['KeyA'] || keys['ArrowLeft'] || (gamepad.axes[0] < -0.3);
    case 'right': return keys['KeyD'] || keys['ArrowRight'] || (gamepad.axes[0] > 0.3);
    case 'brake': return keys['Space'] || gamepad.buttons[0];
    case 'nitro': return keys['ShiftLeft'] || keys['ShiftRight'] || gamepad.buttons[1];
    case 'cam': return keyJustPressed['KeyC'] || gamepad.buttons[3];
    case 'reset': return keyJustPressed['KeyR'] || gamepad.buttons[8];
    case 'lights': return keyJustPressed['KeyL'];
    case 'help': return keyJustPressed['KeyH'];
    case 'race': return keyJustPressed['KeyT'];
    case 'horn': return keys['KeyF'] || gamepad.buttons[2];
    case 'weather': return keyJustPressed['KeyP'];
  }
  return false;
}

// Analog steering from gamepad
function getSteerAmount() {
  if(Math.abs(gamepad.axes[0]) > 0.1) return -gamepad.axes[0];
  let kl = keys['KeyA'] || keys['ArrowLeft'];
  let kr = keys['KeyD'] || keys['ArrowRight'];
  if(kl && kr) return 0;
  if(kl) return 1;
  if(kr) return -1;
  return 0;
}

// Throttle amount (0-1) for analog triggers
function getThrottleAmount() {
  if(gamepad.buttons[7]) return 1;
  if(gamepad.axes[5] !== undefined && gamepad.axes[5] > -0.8) return (gamepad.axes[5] + 1) / 2;
  if(keys['KeyW'] || keys['ArrowUp']) return 1;
  return 0;
}

function getBrakeAmount() {
  if(gamepad.buttons[6]) return 1;
  if(gamepad.axes[4] !== undefined && gamepad.axes[4] > -0.8) return (gamepad.axes[4] + 1) / 2;
  if(keys['KeyS'] || keys['ArrowDown']) return 1;
  return 0;
}
