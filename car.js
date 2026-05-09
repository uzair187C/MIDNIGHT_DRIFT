// === ENGINE AUDIO ===
class EngineAudio {
  constructor() {
    this.ctx = null; this.osc = null; this.gain = null; this.active = false;
    document.addEventListener('click', () => this.init(), {once:true});
    document.addEventListener('keydown', () => this.init(), {once:true});
  }
  init() {
    if(this.active) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.osc = this.ctx.createOscillator();
      this.osc2 = this.ctx.createOscillator();
      this.gain = this.ctx.createGain();
      const dist = this.ctx.createWaveShaper();
      dist.curve = new Float32Array(256).map((_,i) => {
        let x = (i*2/255)-1;
        return (Math.PI+200)*x/(Math.PI+200*Math.abs(x));
      });
      this.osc.type = 'sawtooth'; this.osc2.type = 'square';
      this.osc.connect(dist); this.osc2.connect(dist);
      dist.connect(this.gain); this.gain.connect(this.ctx.destination);
      this.gain.gain.value = 0;
      this.osc.start(); this.osc2.start();
      this.active = true;
    } catch(e) {}
  }
  update(speed, throttle, boosting) {
    if(!this.active) return;
    let rpm = Math.abs(speed) / CFG.MAX_SPEED;
    let freq = CFG.ENGINE_BASE_FREQ + rpm * (CFG.ENGINE_MAX_FREQ - CFG.ENGINE_BASE_FREQ);
    if(boosting) freq *= 1.15;
    this.osc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05);
    this.osc2.frequency.setTargetAtTime(freq * 0.5, this.ctx.currentTime, 0.05);
    let vol = 0.02 + rpm * 0.06 + (throttle ? 0.03 : 0);
    if(boosting) vol += 0.03;
    this.gain.gain.setTargetAtTime(Math.min(vol, 0.12), this.ctx.currentTime, 0.05);
  }
}

// === SKID MARKS ===
class SkidMarks {
  constructor(scene) {
    this.marks = [];
    this.scene = scene;
    this.mat = new THREE.MeshBasicMaterial({color:0x111111, transparent:true, opacity:0.5, depthWrite:false});
  }
  add(x, z, angle, width) {
    if(this.marks.length > CFG.MAX_SKIDS) {
      let old = this.marks.shift();
      this.scene.remove(old); old.geometry.dispose();
    }
    let geo = new THREE.PlaneGeometry(width || 0.25, 1.2);
    let m = new THREE.Mesh(geo, this.mat);
    m.rotation.x = -Math.PI/2;
    m.rotation.z = -angle;
    m.position.set(x, 0.025, z);
    this.scene.add(m);
    this.marks.push(m);
  }
}

// === CAR CLASS ===
class Car {
  constructor(scene) {
    this.pos = new THREE.Vector3(0, 0.4, 0);
    this.heading = 0;
    this.speed = 0;
    this.steer = 0;
    this.driftAngle = 0;
    this.driftScore = 0;
    this.driftCombo = 0;
    this.totalDrift = 0;
    this.nitro = CFG.NITRO_MAX;
    this.airborne = false;
    this.vy = 0;
    this.lightsOn = true;
    this.bodyRoll = 0;
    this.bodyPitch = 0;
    this.prevAccel = 0;
    this.distanceTraveled = 0;
    this.topSpeed = 0;
    this.raceMode = false;
    this.checkpointCount = 0;
    this.raceStartTime = 0;
    this.bestLapTime = Infinity;
    this.group = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.group.add(this.bodyGroup);
    this.engine = new EngineAudio();
    this.skidMarks = new SkidMarks(scene);
    this._buildModel();
    scene.add(this.group);
  }

  _buildModel() {
    const bodyMat = new THREE.MeshStandardMaterial({color:0xffffff, metalness:0.8, roughness:0.2});
    const darkMat = new THREE.MeshStandardMaterial({color:0x0a0a10, metalness:0.6, roughness:0.3});
    const glassMat = new THREE.MeshStandardMaterial({color:0x102030, metalness:0.95, roughness:0.05, transparent:true, opacity:0.6});
    const chromeMat = new THREE.MeshStandardMaterial({color:0xdddddd, metalness:1.0, roughness:0.05});
    const tireMat = new THREE.MeshStandardMaterial({color:0x1a1a1a, roughness:0.95});
    const carbonMat = new THREE.MeshStandardMaterial({color:0x151518, metalness:0.4, roughness:0.5});

    // === MAIN BODY (lower + upper merged) ===
    // Lower body - wide, aggressive
    let lowerGeo = new THREE.BoxGeometry(2.15, 0.5, 5.0);
    let lower = new THREE.Mesh(lowerGeo, bodyMat);
    lower.position.y = 0.25;
    this.bodyGroup.add(lower);

    // Front fender bulge
    [-1, 1].forEach(s => {
      let fg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 1.6), bodyMat);
      fg.position.set(s * 1.15, 0.38, 1.2);
      this.bodyGroup.add(fg);
    });

    // Rear fender bulge (wider - Bugatti style)
    [-1, 1].forEach(s => {
      let rg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 1.8), bodyMat);
      rg.position.set(s * 1.2, 0.35, -1.3);
      this.bodyGroup.add(rg);
    });

    // Hood - long, low, sloping
    let hoodGeo = new THREE.BoxGeometry(1.9, 0.28, 1.8);
    let hood = new THREE.Mesh(hoodGeo, bodyMat);
    hood.position.set(0, 0.48, 1.6);
    hood.rotation.x = -0.08;
    this.bodyGroup.add(hood);

    // Hood center ridge
    let ridge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 1.6), chromeMat);
    ridge.position.set(0, 0.63, 1.5);
    this.bodyGroup.add(ridge);

    // Front nose (lower, aggressive)
    let nose = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.22, 0.6), darkMat);
    nose.position.set(0, 0.3, 2.7);
    nose.rotation.x = -0.15;
    this.bodyGroup.add(nose);

    // Horseshoe grille
    let grille = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.08), chromeMat);
    grille.position.set(0, 0.38, 2.52);
    this.bodyGroup.add(grille);
    let grilleInner = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.25, 0.1), darkMat);
    grilleInner.position.set(0, 0.38, 2.53);
    this.bodyGroup.add(grilleInner);
    // Grille mesh lines
    for(let i = 0; i < 5; i++) {
      let bar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.015, 0.06), chromeMat);
      bar.position.set(0, 0.3 + i * 0.05, 2.54);
      this.bodyGroup.add(bar);
    }

    // Side air intakes
    [-1, 1].forEach(s => {
      let intake = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.8), darkMat);
      intake.position.set(s * 1.08, 0.35, -0.1);
      this.bodyGroup.add(intake);
      // Chrome trim
      let trim = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.82), chromeMat);
      trim.position.set(s * 1.1, 0.35, -0.1);
      this.bodyGroup.add(trim);
    });

    // Cabin
    let cabGeo = new THREE.BoxGeometry(1.55, 0.5, 1.5);
    let cab = new THREE.Mesh(cabGeo, bodyMat);
    cab.position.set(0, 0.78, -0.15);
    this.bodyGroup.add(cab);

    // Roof scoop
    let scoop = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.5), carbonMat);
    scoop.position.set(0, 1.05, -0.3);
    this.bodyGroup.add(scoop);

    // Windshield
    let ws = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.48, 0.06), glassMat);
    ws.position.set(0, 0.85, 0.55);
    ws.rotation.x = -0.55;
    this.bodyGroup.add(ws);

    // Rear window
    let rw = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.35, 0.06), glassMat);
    rw.position.set(0, 0.82, -0.85);
    rw.rotation.x = 0.45;
    this.bodyGroup.add(rw);

    // Side windows
    [-1, 1].forEach(s => {
      let sw = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 1.1), glassMat);
      sw.position.set(s * 0.76, 0.85, -0.15);
      this.bodyGroup.add(sw);
    });

    // Side mirrors
    [-1, 1].forEach(s => {
      let arm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.06), chromeMat);
      arm.position.set(s * 0.95, 0.78, 0.4);
      this.bodyGroup.add(arm);
      let mirror = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.14), darkMat);
      mirror.position.set(s * 1.12, 0.78, 0.4);
      this.bodyGroup.add(mirror);
    });

    // Rear diffuser
    let diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.18, 0.3), carbonMat);
    diffuser.position.set(0, 0.15, -2.55);
    this.bodyGroup.add(diffuser);
    for(let i = 0; i < 7; i++) {
      let fin = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.15, 0.25), carbonMat);
      fin.position.set(-0.75 + i * 0.25, 0.16, -2.55);
      this.bodyGroup.add(fin);
    }

    // Rear deck / engine cover
    let rearDeck = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.25, 1.5), bodyMat);
    rearDeck.position.set(0, 0.55, -1.6);
    rearDeck.rotation.x = 0.06;
    this.bodyGroup.add(rearDeck);

    // Engine cover vents
    for(let i = 0; i < 4; i++) {
      let vent = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.02, 0.08), darkMat);
      vent.position.set(0, 0.7, -1.2 - i * 0.2);
      this.bodyGroup.add(vent);
    }

    // Rear spoiler (active aero style)
    let spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.05, 0.35), carbonMat);
    spoiler.position.set(0, 1.0, -2.15);
    spoiler.rotation.x = -0.1;
    this.bodyGroup.add(spoiler);
    [-0.75, 0.75].forEach(x => {
      let leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.06), chromeMat);
      leg.position.set(x, 0.85, -2.15);
      this.bodyGroup.add(leg);
    });

    // Exhaust tips (quad)
    [-0.5, -0.2, 0.2, 0.5].forEach(x => {
      let pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.15, 8), chromeMat);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(x, 0.22, -2.55);
      this.bodyGroup.add(pipe);
    });

    // === WHEELS ===
    this.wheels = [];
    const wPos = [[-1.0, 0.22, 1.4], [1.0, 0.22, 1.4], [-1.05, 0.22, -1.5], [1.05, 0.22, -1.5]];
    wPos.forEach((p, i) => {
      let wg = new THREE.Group();
      let tire = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.12, 12, 24), tireMat);
      wg.add(tire);
      let rim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.2, 12), chromeMat);
      rim.rotation.z = Math.PI / 2;
      wg.add(rim);
      let disc = new THREE.Mesh(new THREE.CircleGeometry(0.2, 12), new THREE.MeshStandardMaterial({color:0x333333, metalness:0.8, roughness:0.2}));
      disc.position.set(p[0] > 0 ? 0.11 : -0.11, 0, 0);
      disc.rotation.y = p[0] > 0 ? Math.PI/2 : -Math.PI/2;
      wg.add(disc);
      for(let s = 0; s < 6; s++) {
        let spoke = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.025, 0.025), chromeMat);
        spoke.rotation.z = (s / 6) * Math.PI;
        wg.add(spoke);
      }
      // Brake caliper glow
      let caliper = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.1),
        new THREE.MeshBasicMaterial({color:0xff2200}));
      caliper.position.set(p[0] > 0 ? 0.08 : -0.08, -0.15, 0);
      wg.add(caliper);
      wg.position.set(p[0], p[1], p[2]);
      this.group.add(wg);
      this.wheels.push(wg);
    });

    // === LIGHTS ===
    // Headlights (thin LED strip style)
    this.headlightL = new THREE.SpotLight(0xeeeeff, 3, 80, 0.45, 0.6);
    this.headlightL.position.set(-0.65, 0.4, 2.5);
    this.headlightL.target.position.set(-0.3, 0, 25);
    this.group.add(this.headlightL);
    this.group.add(this.headlightL.target);

    this.headlightR = new THREE.SpotLight(0xeeeeff, 3, 80, 0.45, 0.6);
    this.headlightR.position.set(0.65, 0.4, 2.5);
    this.headlightR.target.position.set(0.3, 0, 25);
    this.group.add(this.headlightR);
    this.group.add(this.headlightR.target);

    // DRL strips
    let drlMat = new THREE.MeshBasicMaterial({color:0xccddff});
    [-0.65, 0.65].forEach(x => {
      let drl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.04), drlMat);
      drl.position.set(x, 0.42, 2.52);
      this.bodyGroup.add(drl);
    });

    // Taillights (C-shaped Bugatti style)
    let tlMat = new THREE.MeshBasicMaterial({color:0xff1111});
    this.taillightMeshes = [];
    [-0.7, 0.7].forEach(x => {
      let tl = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.04), tlMat);
      tl.position.set(x, 0.5, -2.52);
      this.bodyGroup.add(tl);
      this.taillightMeshes.push(tl);
      // Vertical part of C
      let tv = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.04), tlMat);
      tv.position.set(x + (x > 0 ? 0.15 : -0.15), 0.42, -2.52);
      this.bodyGroup.add(tv);
    });
    // Center taillight bar
    let centerTl = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.03, 0.04), tlMat);
    centerTl.position.set(0, 0.5, -2.52);
    this.bodyGroup.add(centerTl);

    // Under glow
    this.underGlow = new THREE.PointLight(0x00ffd5, 1.5, 10);
    this.underGlow.position.set(0, 0.05, 0);
    this.group.add(this.underGlow);

    // EB badge on rear
    let badge = new THREE.Mesh(new THREE.CircleGeometry(0.12, 16),
      new THREE.MeshBasicMaterial({color:0xccaa44}));
    badge.position.set(0, 0.42, -2.53);
    this.bodyGroup.add(badge);
  }

  update(dt, buildings, ramps) {
    let accel = 0, boosting = false, throttle = false;
    let inputThrottle = getThrottleAmount();
    let inputBrake = getBrakeAmount();
    let handbrake = isKey('brake');

    // Gear logic
    let speedKmh = Math.abs(this.speed * 3.6);
    let targetGear = 0;
    for(let i = 0; i < CFG.GEAR_RATIOS.length; i++) {
      if(speedKmh < CFG.GEAR_RATIOS[i]) {
        targetGear = i + 1;
        break;
      }
      targetGear = CFG.GEAR_RATIOS.length;
    }
    if(this.speed < -1) targetGear = -1; // Reverse

    // Acceleration
    if(inputThrottle > 0) {
      accel = CFG.ACCEL * inputThrottle;
      throttle = true;
      if(isKey('nitro') && this.nitro > 0) {
        accel = CFG.NITRO_ACCEL;
        this.nitro = Math.max(0, this.nitro - CFG.NITRO_DRAIN * dt);
        boosting = true;
      }
    }
    if(inputBrake > 0) {
      if(this.speed > 1) accel = -CFG.BRAKE * inputBrake;
      else accel = -CFG.ACCEL * 0.5 * inputBrake;
    }
    if(!boosting) this.nitro = Math.min(CFG.NITRO_MAX, this.nitro + CFG.NITRO_REGEN * dt);

    // Speed Update
    this.speed += accel * dt;
    this.speed *= CFG.FRICTION;
    this.speed = Math.max(-CFG.REVERSE_SPEED, Math.min(CFG.MAX_SPEED, this.speed));
    if(Math.abs(this.speed) < 0.1 && inputThrottle === 0 && inputBrake === 0) this.speed = 0;

    // Stats
    this.distanceTraveled += Math.abs(this.speed) * dt;
    this.topSpeed = Math.max(this.topSpeed, speedKmh);

    // Race mode
    if (this.raceMode) {
      if (this.checkpointCount === 0 && this.raceStartTime === 0) {
        this.raceStartTime = performance.now();
      }
    }

    // Steering with auto-center snap
    let steerTarget = getSteerAmount();
    let steerSpeed = handbrake ? 10 : 7;
    if(steerTarget === 0) steerSpeed = 12; // Snap back faster
    this.steer += (steerTarget - this.steer) * Math.min(1, dt * steerSpeed);

    // Grip & Drift Physics
    let grip = CFG.NORMAL_GRIP;
    if(handbrake && Math.abs(this.speed) > 5) grip = CFG.DRIFT_GRIP;
    
    // Tire slip and side velocity
    let speedFactor = 1 - (Math.abs(this.speed) / CFG.MAX_SPEED) * 0.4;
    let turnRate = this.steer * CFG.STEER_MAX * speedFactor * Math.sign(this.speed);
    
    let targetDrift = 0;
    if(handbrake && Math.abs(this.speed) > 10) {
      targetDrift = turnRate * (1.5 - grip) * 2.5;
    } else if(Math.abs(this.speed) > 30 && Math.abs(this.steer) > 0.8) {
      // Natural drift at high speed sharp turns
      targetDrift = turnRate * 0.5;
    }

    this.driftAngle += (targetDrift - this.driftAngle) * dt * (handbrake ? 3 : 5);
    if(Math.abs(this.driftAngle) < 0.01) this.driftAngle = 0;
    
    this.heading += (turnRate * grip + this.driftAngle * (1-grip)) * dt;

    // Movement with side slip
    let moveAngle = this.heading + this.driftAngle * 0.4;
    this.pos.x += Math.sin(moveAngle) * this.speed * dt;
    this.pos.z += Math.cos(moveAngle) * this.speed * dt;

    // Map boundary collision
    let boundary = CFG.MAP_BOUNDARY;
    if(this.pos.x < -boundary) { this.pos.x = -boundary; this.speed *= 0.3; this.hitWall = true; }
    if(this.pos.x > boundary) { this.pos.x = boundary; this.speed *= 0.3; this.hitWall = true; }
    if(this.pos.z < -boundary) { this.pos.z = -boundary; this.speed *= 0.3; this.hitWall = true; }
    if(this.pos.z > boundary) { this.pos.z = boundary; this.speed *= 0.3; this.hitWall = true; }

    // Advanced Suspension & Ramps
    let groundY = 0.4;
    let suspensionForce = 0;
    let normal = new THREE.Vector3(0, 1, 0);
    
    if(ramps) {
      for(const r of ramps) {
        let dx = this.pos.x - r.x, dz = this.pos.z - r.z;
        let c = Math.cos(-r.rot), s = Math.sin(-r.rot);
        let lx = c*dx - s*dz;
        let lz = s*dx + c*dz;
        if(Math.abs(lx) < r.w/2 + 1 && lz > -r.d/2 && lz < r.d/2) {
          let h = ((lz + r.d/2) / r.d) * r.h;
          groundY = Math.max(groundY, h + 0.4);
        }
      }
    }

    // Suspension physics
    let compression = Math.max(0, groundY - this.pos.y);
    suspensionForce = compression * 200; // Spring force
    suspensionForce -= this.vy * 15; // Damping

    // Gravity & Air
    if(this.pos.y > groundY + 0.05) {
      this.vy -= CFG.GRAVITY * dt;
      this.airborne = true;
    } else {
      if(this.airborne && this.vy < -8) {
        // Impact effect
        this.hitWall = true; 
        this.speed *= 0.8; // Lose speed on hard landing
      }
      this.pos.y = groundY;
      this.vy = Math.max(this.vy + suspensionForce * dt, 0); // Apply suspension
      this.airborne = false;
    }
    this.pos.y += this.vy * dt;
    if(this.pos.y < 0.4) { this.pos.y = 0.4; this.vy = 0; this.airborne = false; }

    // Collision
    if(buildings) {
      for(const b of buildings) {
        let hw = b.w/2 + 1.2, hd = b.d/2 + 1.2;
        if(this.pos.x > b.x-hw && this.pos.x < b.x+hw && this.pos.z > b.z-hd && this.pos.z < b.z+hd) {
          let ox1 = (b.x+hw)-this.pos.x, ox2 = this.pos.x-(b.x-hw);
          let oz1 = (b.z+hd)-this.pos.z, oz2 = this.pos.z-(b.z-hd);
          let m = Math.min(ox1,ox2,oz1,oz2);
          if(m===ox1) this.pos.x=b.x+hw; else if(m===ox2) this.pos.x=b.x-hw;
          else if(m===oz1) this.pos.z=b.z+hd; else this.pos.z=b.z-hd;
          this.speed *= 0.2;
          this.hitWall = true;
        }
      }
    }

    // Scoring
    let absDrift = Math.abs(this.driftAngle);
    if(absDrift > 0.15 && Math.abs(this.speed) > 12) {
      this.driftCombo += dt;
      let multi = Math.min(8, 1 + Math.floor(this.driftCombo));
      this.driftScore += absDrift * Math.abs(this.speed) * multi * dt * 15;
    } else {
      if(this.driftCombo > 0.5) this.totalDrift += Math.floor(this.driftScore);
      this.driftCombo = 0;
      this.driftScore *= 0.92;
      if(this.driftScore < 1) this.driftScore = 0;
    }

    // Effects
    if(absDrift > 0.15 && Math.abs(this.speed) > 8 && !this.airborne) {
      [-1.0, 1.0].forEach(s => {
        let wx = this.pos.x + Math.cos(this.heading) * s * 1.0 - Math.sin(this.heading) * 1.5;
        let wz = this.pos.z - Math.sin(this.heading) * s * 1.0 - Math.cos(this.heading) * 1.5;
        this.skidMarks.add(wx, wz, this.heading + this.driftAngle, 0.3);
      });
    }

    // Body Lean
    let targetRoll = -this.steer * Math.min(1, Math.abs(this.speed) / 25) * 0.12;
    if(this.airborne) targetRoll = this.steer * 0.2;
    let targetPitch = -(accel / CFG.ACCEL) * 0.05;
    this.bodyRoll += (targetRoll - this.bodyRoll) * dt * 5;
    this.bodyPitch += (targetPitch - this.bodyPitch) * dt * 4;

    // Update Transform
    this.group.position.copy(this.pos);
    this.group.rotation.y = this.heading;
    this.bodyGroup.rotation.z = this.bodyRoll;
    this.bodyGroup.rotation.x = this.bodyPitch;

    // Wheels
    let spin = this.speed * dt * 4;
    this.wheels.forEach((w, i) => {
      w.children.forEach(c => { if(c.geometry.type === 'TorusGeometry') c.rotation.z += spin; });
      if(i < 2) w.rotation.y = this.steer * 0.4;
      // Wheel suspension animation
      let compression = Math.max(0, 0.4 - this.pos.y) * 0.5;
      w.position.y = (i < 2 ? 0.22 : 0.22) - compression;
    });

    // Lights
    this.headlightL.visible = this.lightsOn;
    this.headlightR.visible = this.lightsOn;
    let braking = inputBrake > 0.1 && this.speed > 1;
    this.taillightMeshes.forEach(tl => {
      tl.material.color.setHex(braking ? 0xff2222 : 0xff0000);
      tl.scale.setScalar(braking ? 1.3 : 1.0);
    });

    // Underglow
    let t = Math.abs(this.speed) / CFG.MAX_SPEED;
    let rpmFactor = Math.min(1, this.getRPM() / 8000);
    if(boosting) { 
      this.underGlow.color.setHex(0xffaa00); 
      this.underGlow.intensity = 5 + rpmFactor * 3; 
    } else if(absDrift > 0.2) { 
      this.underGlow.color.setHex(0xff00ff); 
      this.underGlow.intensity = 3 + rpmFactor * 2; 
    } else { 
      this.underGlow.color.setHex(0x00ffff); 
      this.underGlow.intensity = 0.5 + t * 2 + rpmFactor; 
    }

    this.engine.update(this.speed, throttle, boosting);
    this.isBoosting = boosting;
    this.isThrottle = throttle;
  }

  reset() {
    this.pos.set(0, 0.4, 0);
    this.heading = 0; this.speed = 0; this.steer = 0;
    this.driftAngle = 0; this.vy = 0; this.bodyRoll = 0; this.bodyPitch = 0;
  }

  getSpeedKmh() { return Math.abs(Math.round(this.speed * 3.6)); }
  getRPM() { return Math.min(8000, 800 + Math.abs(this.speed / CFG.MAX_SPEED) * 7200); }

  checkCheckpoint(checkpoints) {
    if (!checkpoints) return false;
    let nextCheckpoint = checkpoints.find(cp => !cp.passed);
    if (!nextCheckpoint) return false;
    
    let dx = this.pos.x - nextCheckpoint.x;
    let dz = this.pos.z - nextCheckpoint.z;
    let dist = Math.sqrt(dx*dx + dz*dz);
    
    if (dist < 10) {
      nextCheckpoint.passed = true;
      nextCheckpoint.ring.material.color.setHex(0xff8800);
      nextCheckpoint.glow.color.setHex(0xff8800);
      return true;
    }
    return false;
  }

  checkPowerUp(powerUps) {
    if (!powerUps) return null;
    for (let pu of powerUps) {
      if (!pu.active) continue;
      let dx = this.pos.x - pu.x;
      let dz = this.pos.z - pu.z;
      let dist = Math.sqrt(dx*dx + dz*dz);
      
      if (dist < 5) {
        pu.active = false;
        pu.mesh.visible = false;
        pu.light.visible = false;
        return pu.type;
      }
    }
    return null;
  }

  resetCheckpoints(checkpoints) {
    if (!checkpoints) return;
    checkpoints.forEach(cp => {
      cp.passed = false;
      cp.ring.material.color.setHex(0x00ff88);
      cp.glow.color.setHex(0x00ff88);
    });
  }

  resetPowerUps(powerUps) {
    if (!powerUps) return;
    powerUps.forEach(pu => {
      pu.active = true;
      pu.mesh.visible = true;
      pu.light.visible = true;
    });
  }
}
