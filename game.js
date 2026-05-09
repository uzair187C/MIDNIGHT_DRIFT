// === PARTICLES ===
class Particles {
  constructor(scene) {
    this.particles=[]; this.scene=scene;
    this.smokeMat=new THREE.MeshBasicMaterial({color:0x888888,transparent:true,opacity:0.35});
    this.smokeGeo=new THREE.SphereGeometry(0.18,4,4);
    this.sparkMat=new THREE.MeshBasicMaterial({color:0xffaa44,transparent:true});
    this.sparkGeo=new THREE.BoxGeometry(0.08,0.08,0.08);
    this.flameMat=new THREE.MeshBasicMaterial({color:0xff4400,transparent:true});
    this.flameGeo=new THREE.SphereGeometry(0.12,4,4);
  }
  emit(pos,heading,type) {
    if(this.particles.length>120) return;
    let count=type==='spark'?4:type==='flame'?3:2;
    for(let i=0;i<count;i++){
      let geo=type==='spark'?this.sparkGeo:type==='flame'?this.flameGeo:this.smokeGeo;
      let mat=(type==='spark'?this.sparkMat:type==='flame'?this.flameMat:this.smokeMat).clone();
      let m=new THREE.Mesh(geo,mat);
      let ox=(Math.random()-0.5)*1.5;
      if(type==='flame'){
        m.position.set(pos.x-Math.sin(heading)*2.5+ox*0.3,0.25,pos.z-Math.cos(heading)*2.5);
        m.userData={life:0.5,vy:Math.random()*1,vx:(Math.random()-0.5),vz:-Math.cos(heading)*3};
      } else if(type==='spark'){
        m.position.set(pos.x+ox,0.3,pos.z+(Math.random()-0.5));
        m.userData={life:0.6,vy:1+Math.random()*3,vx:(Math.random()-0.5)*4,vz:(Math.random()-0.5)*4};
      } else {
        m.position.set(pos.x+ox,0.2,pos.z+Math.cos(heading)*1.5);
        m.userData={life:1.2,vy:Math.random()*1.5,vx:(Math.random()-0.5)*1.5,vz:(Math.random()-0.5)*1.5};
      }
      this.scene.add(m); this.particles.push(m);
    }
  }
  update(dt) {
    for(let i=this.particles.length-1;i>=0;i--){
      let p=this.particles[i], d=p.userData;
      d.life-=dt*1.8;
      p.position.y+=d.vy*dt; p.position.x+=d.vx*dt; p.position.z+=d.vz*dt;
      d.vy-=dt*3; // gravity on sparks
      p.scale.setScalar(Math.max(0,d.life));
      p.material.opacity=d.life*0.4;
      if(d.life<=0){
        this.scene.remove(p); p.geometry.dispose(); p.material.dispose();
        this.particles.splice(i,1);
      }
    }
  }
}

// === RAIN ===
class Rain {
  constructor(scene) {
    let geo=new THREE.BufferGeometry();
    let verts=[],vels=[];
    for(let i=0;i<CFG.RAIN_COUNT;i++){
      verts.push((Math.random()-0.5)*300, Math.random()*100, (Math.random()-0.5)*300);
      vels.push(0.5+Math.random()*0.5);
    }
    geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
    this.vels=vels; this.geo=geo;
    this.mesh=new THREE.Points(geo, new THREE.PointsMaterial({color:0x8899bb,size:0.15,transparent:true,opacity:0.3}));
    scene.add(this.mesh);
  }
  update(dt,carPos) {
    let pos=this.geo.attributes.position;
    for(let i=0;i<CFG.RAIN_COUNT;i++){
      let y=pos.getY(i)-this.vels[i]*60*dt;
      if(y<0) y=80+Math.random()*20;
      pos.setY(i,y);
      pos.setX(i,pos.getX(i)+carPos.x*0.001);
      pos.setZ(i,pos.getZ(i)+carPos.z*0.001);
    }
    pos.needsUpdate=true;
    this.mesh.position.set(carPos.x,0,carPos.z);
  }
}

// === SPEED LINES OVERLAY ===
class SpeedLines {
  constructor() {
    this.canvas=document.getElementById('speedLines');
    this.ctx=this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize',()=>this.resize());
  }
  resize() {
    this.canvas.width=window.innerWidth;
    this.canvas.height=window.innerHeight;
  }
  draw(speed,maxSpeed) {
    let t=Math.abs(speed)/maxSpeed;
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    if(t<0.5) return;
    let intensity=(t-0.5)*2;
    let cx=this.canvas.width/2, cy=this.canvas.height/2;
    let count=Math.floor(intensity*30);
    this.ctx.strokeStyle=`rgba(200,220,255,${intensity*0.15})`;
    this.ctx.lineWidth=1;
    for(let i=0;i<count;i++){
      let angle=Math.random()*Math.PI*2;
      let r1=150+Math.random()*100;
      let r2=r1+50+Math.random()*200*intensity;
      this.ctx.beginPath();
      this.ctx.moveTo(cx+Math.cos(angle)*r1, cy+Math.sin(angle)*r1);
      this.ctx.lineTo(cx+Math.cos(angle)*r2, cy+Math.sin(angle)*r2);
      this.ctx.stroke();
    }
    // Vignette
    let grad=this.ctx.createRadialGradient(cx,cy,this.canvas.height*0.3,cx,cy,this.canvas.height*0.7);
    grad.addColorStop(0,'transparent');
    grad.addColorStop(1,`rgba(0,0,0,${intensity*0.3})`);
    this.ctx.fillStyle=grad;
    this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
  }
}

// === MINIMAP ===
function updateMinimap(car,buildings,traffic) {
  let canvas=document.getElementById('minimap');
  if(!canvas) return;
  let ctx=canvas.getContext('2d');
  let w=canvas.width, h=canvas.height, scale=w/CFG.WORLD;
  ctx.fillStyle='#080812'; ctx.fillRect(0,0,w,h);
  // Grid roads
  ctx.strokeStyle='#1a1a2a'; ctx.lineWidth=2;
  for(let i=-5;i<=5;i++){
    let p=(i*CFG.BLOCK+CFG.WORLD/2)*scale;
    ctx.beginPath();ctx.moveTo(0,p);ctx.lineTo(w,p);ctx.stroke();
    ctx.beginPath();ctx.moveTo(p,0);ctx.lineTo(p,h);ctx.stroke();
  }
  // Buildings
  ctx.fillStyle='#151520';
  buildings.forEach(b=>{
    let bx=(b.x+CFG.WORLD/2)*scale, bz=(b.z+CFG.WORLD/2)*scale;
    ctx.fillRect(bx-b.w*scale/2,bz-b.d*scale/2,b.w*scale,b.d*scale);
  });
  // Traffic
  if(traffic) traffic.forEach(tc=>{
    let tx=(tc.group.position.x+CFG.WORLD/2)*scale;
    let tz=(tc.group.position.z+CFG.WORLD/2)*scale;
    ctx.fillStyle='#ffaa00'; ctx.fillRect(tx-1,tz-1,3,3);
  });
  // Player car
  let cx=(car.pos.x+CFG.WORLD/2)*scale, cz=(car.pos.z+CFG.WORLD/2)*scale;
  ctx.save(); ctx.translate(cx,cz); ctx.rotate(-car.heading);
  ctx.fillStyle='#00ffd5';
  ctx.beginPath(); ctx.moveTo(0,-5); ctx.lineTo(-3,4); ctx.lineTo(3,4);
  ctx.closePath(); ctx.fill();
  // Glow
  ctx.shadowColor='#00ffd5'; ctx.shadowBlur=8;
  ctx.fill(); ctx.restore();
  // Border
  ctx.strokeStyle='rgba(0,255,213,0.2)'; ctx.lineWidth=1;
  ctx.strokeRect(0,0,w,h);
}

// === HUD UPDATE ===
function updateHUD(car, world) {
  document.getElementById('speed-val').textContent=car.getSpeedKmh();
  // RPM
  let rpm=car.getRPM();
  let rpmFill=document.getElementById('rpm-fill');
  if(rpmFill) rpmFill.style.width=(rpm/8000*100)+'%';
  let rpmVal=document.getElementById('rpm-val');
  if(rpmVal) rpmVal.textContent=Math.round(rpm);
  // Drift
  let driftHud=document.getElementById('drift-hud');
  if(car.driftScore>10){
    driftHud.classList.add('active');
    document.getElementById('drift-score').textContent=Math.floor(car.driftScore);
    let multi=Math.min(5,1+Math.floor(car.driftCombo));
    document.getElementById('drift-multi').textContent=multi>1?'x'+multi:'';
  } else driftHud.classList.remove('active');
  // Gear
  let s=Math.abs(car.speed), gear='N';
  if(car.speed<-0.5) gear='R';
  else if(s<2) gear='N';
  else if(s<14) gear='1';
  else if(s<26) gear='2';
  else if(s<40) gear='3';
  else if(s<56) gear='4';
  else if(s<72) gear='5';
  else if(s<85) gear='6';
  else gear='7';
  document.getElementById('gear-display').textContent=gear;
  // Nitro
  document.getElementById('nitro-fill').style.width=(car.nitro/CFG.NITRO_MAX*100)+'%';
  // Total drift
  let td=document.getElementById('total-drift');
  if(td) td.textContent=Math.floor(car.totalDrift+car.driftScore).toLocaleString();
  // Distance
  let dist=document.getElementById('distance');
  if(dist) dist.textContent=(car.distanceTraveled/1000).toFixed(1)+'km';
  // Top speed
  let ts=document.getElementById('top-speed');
  if(ts) ts.textContent=Math.round(car.topSpeed);

  // Race stats
  if (car.raceMode) {
    let lapTime = car.raceStartTime > 0 ? (performance.now() - car.raceStartTime) / 1000 : 0;
    let bestTime = car.bestLapTime < Infinity ? (car.bestLapTime / 1000).toFixed(2) + 's' : '--';
    document.getElementById('distance').textContent = `CP: ${car.checkpointCount}/${world.checkpoints.length}`;
    document.getElementById('top-speed').textContent = `Lap: ${lapTime.toFixed(2)}s`;
    if (document.getElementById('total-drift').nextSibling) {
      document.getElementById('total-drift').nextSibling.textContent = `Best: ${bestTime}`;
    } else {
      let bestRow = document.createElement('div');
      bestRow.className = 'stat-row';
      bestRow.innerHTML = '<span class="stat-label">BEST LAP</span><span class="stat-val" id="best-lap">' + bestTime + '</span>';
      document.getElementById('stats-box').appendChild(bestRow);
    }
  } else {
    let bestRow = document.getElementById('stats-box').querySelector('#best-lap');
    if (bestRow && bestRow.parentNode) {
      bestRow.parentNode.remove();
    }
  }
}

// === MAIN GAME ===
class Game {
  constructor() {
    this.canvas=document.getElementById('gameCanvas');
    this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setSize(window.innerWidth,window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.0;
    this.renderer.outputEncoding=THREE.sRGBEncoding;

    this.scene=new THREE.Scene();
    
    // Camera - FIXED TO LOOK AT CAR SPAWN
    this.camera=new THREE.PerspectiveCamera(70,window.innerWidth/window.innerHeight,0.1,2000);
    this.camera.position.set(0, 8, 15);
    this.camera.lookAt(0, 1, 0);
    this.camMode=0;
    this.camSmooth=new THREE.Vector3(0, 1, 0);
    this.screenShake={x:0,y:0,intensity:0};

    // Post-processing - SIMPLIFIED FOR PERFORMANCE
    this.composer = new THREE.EffectComposer(this.renderer);
    const renderPass = new THREE.RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    
    // Bloom disabled for performance
    // const bloomPass = new THREE.UnrealBloomPass(...);

    // Lighting - REDUCED
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    let mainLight = new THREE.DirectionalLight(0xffffff, 0.7);
    mainLight.position.set(100, 300, 100);
    this.scene.add(mainLight);
    // Add a hemisphere light to brighten ground and buildings without many point lights
    let hemi = new THREE.HemisphereLight(0xddddff, 0x222233, 0.45);
    this.scene.add(hemi);
    
    // Environment Map for Reflections
    this.cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, { format: THREE.RGBAFormat, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
    this.cubeCamera = new THREE.CubeCamera(0.1, 1000, this.cubeRenderTarget);
    this.frame = 0;

    // Load
    let fill=document.getElementById('loadFill');
    let loadText=document.getElementById('loadText');
    fill.style.width='20%'; loadText.textContent='Igniting Engines...';
    
    setTimeout(()=>{
      this.world=new World(this.scene);
      fill.style.width='50%'; loadText.textContent='Building Neon City...';
      
      setTimeout(()=>{
        this.car=new Car(this.scene);
        // Environment map disabled for stability
        /*
        this.car.bodyGroup.traverse(obj => {
          if(obj.isMesh && obj.material.isMeshStandardMaterial) {
            obj.material.envMap = this.cubeRenderTarget.texture;
            obj.material.envMapIntensity = 1.5;
            obj.material.needsUpdate = true;
          }
        });
        */

        this.particles=new Particles(this.scene);
        this.rain=new Rain(this.scene);
        this.speedLines=new SpeedLines();

        // Force initial camera behind the car to avoid 180° startup
        try {
          const camX = this.car.pos.x - Math.sin(this.car.heading) * CFG.CAM_DIST;
          const camZ = this.car.pos.z - Math.cos(this.car.heading) * CFG.CAM_DIST;
          const camY = this.car.pos.y + CFG.CAM_HEIGHT + 2;
          this.camera.position.set(camX, camY, camZ);
          this.camSmooth.set(this.car.pos.x + Math.sin(this.car.heading) * 4, this.car.pos.y + 1, this.car.pos.z + Math.cos(this.car.heading) * 4);
          this.camera.up.set(0,1,0);
          this.camera.lookAt(this.car.pos);
        } catch(e) {}
        
        fill.style.width='100%'; loadText.textContent='READY';
        
        setTimeout(() => {
          document.getElementById('loader').style.display='none';
          document.getElementById('hud').style.display='block';
          this.start();
        }, 300);
      }, 500);
    }, 500);

    this._camCD=0;
    window.addEventListener('resize',()=>{
      this.camera.aspect=window.innerWidth/window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth,window.innerHeight);
      this.composer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  start() { this.lastTime=performance.now(); this.loop(); }

  loop() {
    requestAnimationFrame(()=>this.loop());
    let now=performance.now();
    let dt=Math.min((now-this.lastTime)/1000, 0.05);
    this.lastTime=now;
    
    pollGamepad();
    this._camCD-=dt;
    if(isKey('cam')&&this._camCD<=0){this.camMode=(this.camMode+1)%4;this._camCD=0.3;}
    if(isKey('reset')) this.car.reset();
    if(isKey('lights')) this.car.lightsOn = !this.car.lightsOn;
    if(isKey('race')) {
      this.car.raceMode = !this.car.raceMode;
      if (this.car.raceMode) {
        this.car.resetCheckpoints(this.world.checkpoints);
        this.car.resetPowerUps(this.world.powerUps);
        this.car.checkpointCount = 0;
        this.car.raceStartTime = 0;
      }
    }
    if(isKey('help')) {
      let p = document.getElementById('controls-panel');
      p.style.display = p.style.display === 'none' ? 'block' : 'none';
    }

    // Update
    this.car.update(dt,this.world.buildings,this.world.ramps);
    this.world.updateTraffic(dt);
    this.particles.update(dt);
    this.rain.update(dt,this.car.pos);

    // Checkpoint checking
    if (this.car.checkCheckpoint(this.world.checkpoints)) {
      this.car.checkpointCount++;
      if (this.car.checkpointCount >= this.world.checkpoints.length) {
        // Completed lap
        let lapTime = performance.now() - this.car.raceStartTime;
        this.car.bestLapTime = Math.min(this.car.bestLapTime, lapTime);
        this.car.checkpointCount = 0;
        this.car.raceStartTime = performance.now();
        this.car.resetCheckpoints(this.world.checkpoints);
      }
    }

    // Power-up collection
    let powerUp = this.car.checkPowerUp(this.world.powerUps);
    if (powerUp === 'nitro') {
      this.car.nitro = Math.min(CFG.NITRO_MAX, this.car.nitro + 50);
      // Visual feedback
      this.screenShake.intensity = Math.max(this.screenShake.intensity, 0.2);
    } else if (powerUp === 'boost') {
      this.car.speed *= 1.3; // Instant speed boost
      this.screenShake.intensity = Math.max(this.screenShake.intensity, 0.3);
    }

    // Traffic Collision
    this.world.trafficCars.forEach(tc => {
      let dx = this.car.pos.x - tc.group.position.x;
      let dz = this.car.pos.z - tc.group.position.z;
      let dist = Math.sqrt(dx*dx + dz*dz);
      if(dist < 3.8) {
        this.car.speed *= 0.4;
        this.car.hitWall = true;
        // Simple push-away
        this.car.pos.x += (dx/dist) * 0.5;
        this.car.pos.z += (dz/dist) * 0.5;
      }
    });
    
    // Screen Shake
    if(this.car.hitWall){
      this.screenShake.intensity=0.8;
      this.car.hitWall=false;
    }
    
    // Update CubeCamera (optimized to every 4 frames)
    /* 
    if(this.frame % 4 === 0) {
      this.cubeCamera.position.copy(this.car.pos);
      this.cubeCamera.update(this.renderer, this.scene);
    }
    */
    this.frame++;

    // Particles emit
    let absDrift = Math.abs(this.car.driftAngle);
    if(absDrift>0.2 && Math.abs(this.car.speed)>10){
      this.particles.emit(this.car.pos,this.car.heading,'smoke');
    }
    if(this.car.isBoosting){
      this.particles.emit(this.car.pos,this.car.heading,'flame');
      this.screenShake.intensity = Math.max(this.screenShake.intensity, 0.1);
    }

    // Camera
    this._updateCamera(dt);
    
    if(this.screenShake.intensity>0.01){
      this.screenShake.intensity *= 0.9;
      let s = this.screenShake.intensity;
      this.camera.position.x += (Math.random()-0.5)*s;
      this.camera.position.y += (Math.random()-0.5)*s;
    }

    // Dynamic FOV
    let targetFov = 65 + (Math.abs(this.car.speed)/CFG.MAX_SPEED)*25;
    if(this.car.isBoosting) targetFov += 10;
    this.camera.fov += (targetFov - this.camera.fov) * dt * 4;
    this.camera.updateProjectionMatrix();

    // Render
    updateHUD(this.car, this.world);
    updateMinimap(this.car,this.world.buildings,this.world.trafficCars);
    this.speedLines.draw(this.car.speed,CFG.MAX_SPEED);
    
    this.composer.render();
    clearJustPressed();
  }

  _updateCamera(dt) {
    let car=this.car, cd, ch, lo;
    switch(this.camMode){
      case 0: cd=CFG.CAM_DIST;ch=CFG.CAM_HEIGHT;lo=4;break; // Chase
      case 1: cd=25;ch=12;lo=6;break; // Far
      case 2: cd=-0.5;ch=1.4;lo=15;break; // Hood
      case 3: cd=0.1;ch=45;lo=0;break; // Top
    }
    
    // Smooth camera target
    let tx = car.pos.x - Math.sin(car.heading) * cd;
    let tz = car.pos.z - Math.cos(car.heading) * cd;
    let ty = car.pos.y + ch;
    
    // Look ahead logic
    let lx = car.pos.x + Math.sin(car.heading) * lo;
    let lz = car.pos.z + Math.cos(car.heading) * lo;
    let ly = car.pos.y + 1;
    
    let smooth = this.camMode === 3 ? 2 : CFG.CAM_SMOOTH;
    this.camera.position.x += (tx - this.camera.position.x) * dt * smooth;
    this.camera.position.y += (ty - this.camera.position.y) * dt * smooth;
    this.camera.position.z += (tz - this.camera.position.z) * dt * smooth;
    
    this.camSmooth.x += (lx - this.camSmooth.x) * dt * smooth;
    this.camSmooth.y += (ly - this.camSmooth.y) * dt * smooth;
    this.camSmooth.z += (lz - this.camSmooth.z) * dt * smooth;
    
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(this.camSmooth);
    
    // Dutch roll on steering - REDUCED FOR STABILITY
    if(this.camMode !== 3) {
      let targetRoll = -car.steer * 0.02 * (Math.abs(car.speed)/40);
      this.camera.rotation.z += (targetRoll - this.camera.rotation.z) * dt * 3;
      this.camera.rotation.z = Math.max(-0.15, Math.min(0.15, this.camera.rotation.z));
    } else {
      this.camera.rotation.z = 0;
    }
  }
}

window.addEventListener('load',()=>{new Game();});
