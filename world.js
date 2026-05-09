// === WORLD BUILDER ===
class World {
  constructor(scene) {
    this.buildings = []; this.ramps = []; this.scene = scene;
    this.trafficCars = [];
    this._buildSky(scene); this._buildGround(scene); this._buildRoads(scene);
    this._buildCity(scene); this._buildHighways(scene); this._buildRamps(scene);
    this._buildTrees(scene); this._buildLights(scene); this._buildDecorations(scene);
    this._buildTraffic(scene);
  }

  _buildSky(scene) {
    scene.background = new THREE.Color(0x04040a);
    // Reduced fog density for visibility
    scene.fog = new THREE.FogExp2(0x04040a, 0.00025);
    // Dense Stars
    let starGeo = new THREE.BufferGeometry();
    let starVerts = [];
    // Fewer, subtler stars placed above horizon to avoid drowning the scene
    for(let i=0;i<600;i++){
      let r=800+Math.random()*400, t=Math.random()*Math.PI*2, p=Math.random()*Math.PI/2; // p limited to upper hemisphere
      starVerts.push(Math.cos(t)*Math.sin(p)*r, Math.cos(p)*r, Math.sin(t)*Math.sin(p)*r);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({color:0xffffff, size:0.35, transparent:true, opacity:0.35})));
    // Moon
    let moon = new THREE.Mesh(new THREE.SphereGeometry(12,24,24), new THREE.MeshBasicMaterial({color:0xf0f5ff}));
    moon.position.set(-300, 250, -400);
    scene.add(moon);
    let moonGlow = new THREE.PointLight(0x6688cc, 0.5, 1000);
    moonGlow.position.copy(moon.position);
    scene.add(moonGlow);
  }

  _buildGround(scene) {
    // SIMPLE BRIGHT GROUND - VERY VISIBLE
    let groundMat = new THREE.MeshStandardMaterial({
      color: 0x2a4a2f,
      roughness: 0.8,
      metalness: 0.0
    });
    let ground = new THREE.Mesh(
      new THREE.PlaneGeometry(CFG.WORLD*3, CFG.WORLD*3),
      groundMat
    );
      ground.rotation.x = -Math.PI/2;
      // Place ground at y=0 so car is clearly above it
      ground.position.y = 0;
    scene.add(ground);

    // Boundary walls - VISIBLE
    let wallMat = new THREE.MeshStandardMaterial({color:0x662222, roughness:0.6, metalness:0.1});
    let wallHeight = CFG.BARRIER_HEIGHT;
    let wallThick = CFG.BARRIER_THICKNESS;
    let edge = CFG.WORLD - wallThick;
    
    let wallH = new THREE.Mesh(new THREE.BoxGeometry(CFG.WORLD*2 + wallThick*2, wallHeight, wallThick), wallMat);
    wallH.position.set(0, wallHeight/2, -edge);
    scene.add(wallH);
    let wallH2 = wallH.clone();
    wallH2.position.set(0, wallHeight/2, edge);
    scene.add(wallH2);
    let wallV = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallHeight, CFG.WORLD*2 + wallThick*2), wallMat);
    wallV.position.set(-edge, wallHeight/2, 0);
    scene.add(wallV);
    let wallV2 = wallV.clone();
    wallV2.position.set(edge, wallHeight/2, 0);
    scene.add(wallV2);
    
    // Boundary marker lights - REDUCED
    for(let i = -3; i <= 3; i++) {
      let light1 = new THREE.PointLight(0xff3333, 0.8, 60);
      light1.position.set(i * 300, 2, -edge);
      scene.add(light1);
      let light2 = light1.clone();
      light2.position.set(i * 300, 2, edge);
      scene.add(light2);
    }

    // Grid Helper for spatial reference
    let grid = new THREE.GridHelper(CFG.WORLD, 40, 0x00ffd5, 0x112233);
    grid.position.y = 0.05;
    grid.material.transparent = true;
    grid.material.opacity = 0.15;
    scene.add(grid);

    // Central asphalt plaza (new ground area) - slightly above base ground to avoid z-fighting
    let asphaltMat = new THREE.MeshStandardMaterial({color:0x0b0b0d, roughness:0.18, metalness:0.02});
    let asphalt = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), asphaltMat);
    asphalt.rotation.x = -Math.PI/2; asphalt.position.set(0, 0.03, 0);
    scene.add(asphalt);

    // Concrete plaza for variety
    let concreteMat = new THREE.MeshStandardMaterial({color:0x33373a, roughness:0.9, metalness:0.0});
    let plaza = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), concreteMat);
    plaza.rotation.x = -Math.PI/2; plaza.position.set(-420, 0.04, 420);
    scene.add(plaza);
  }

  _buildRoads(scene) {
    let roadMat = new THREE.MeshStandardMaterial({color:0x101219, roughness:0.18, metalness:0.04});
    let sidewalkMat = new THREE.MeshStandardMaterial({color:0x23262f, roughness:0.96, metalness:0.03});
    let curbMat = new THREE.MeshStandardMaterial({color:0x44455a, roughness:0.8, metalness:0.02});
    let laneMark = new THREE.MeshBasicMaterial({color:0xffffff});
    let centerMark = new THREE.MeshBasicMaterial({color:0xffd500});

    for(let i=-6;i<=6;i++){
      let pos = i*CFG.BLOCK;
      // Grid roads
      let rx = new THREE.Mesh(new THREE.PlaneGeometry(CFG.WORLD, CFG.ROAD_W), roadMat);
      rx.rotation.x=-Math.PI/2; rx.position.set(0,0.02,pos); scene.add(rx);
      let rz = new THREE.Mesh(new THREE.PlaneGeometry(CFG.ROAD_W, CFG.WORLD), roadMat);
      rz.rotation.x=-Math.PI/2; rz.position.set(pos,0.02,0); scene.add(rz);

      // Sidewalks
      let sx1 = new THREE.Mesh(new THREE.PlaneGeometry(CFG.WORLD, CFG.SIDEWALK_W), sidewalkMat);
      sx1.rotation.x=-Math.PI/2; sx1.position.set(0,0.035,pos + CFG.ROAD_W/2 + CFG.SIDEWALK_W/2);
      scene.add(sx1);
      let sx2 = sx1.clone(); sx2.position.set(0,0.035,pos - CFG.ROAD_W/2 - CFG.SIDEWALK_W/2);
      scene.add(sx2);
      let sz1 = new THREE.Mesh(new THREE.PlaneGeometry(CFG.SIDEWALK_W, CFG.WORLD), sidewalkMat);
      sz1.rotation.x=-Math.PI/2; sz1.position.set(pos + CFG.ROAD_W/2 + CFG.SIDEWALK_W/2,0.035,0);
      scene.add(sz1);
      let sz2 = sz1.clone(); sz2.position.set(pos - CFG.ROAD_W/2 - CFG.SIDEWALK_W/2,0.035,0);
      scene.add(sz2);

      // Road edges
      let edge1 = new THREE.Mesh(new THREE.PlaneGeometry(CFG.WORLD, 0.2), curbMat);
      edge1.rotation.x=-Math.PI/2; edge1.position.set(0,0.04,pos + CFG.ROAD_W/2);
      scene.add(edge1);
      let edge2 = edge1.clone(); edge2.position.set(0,0.04,pos - CFG.ROAD_W/2);
      scene.add(edge2);
      let edge3 = new THREE.Mesh(new THREE.PlaneGeometry(0.2, CFG.WORLD), curbMat);
      edge3.rotation.x=-Math.PI/2; edge3.position.set(pos + CFG.ROAD_W/2,0.04,0);
      scene.add(edge3);
      let edge4 = edge3.clone(); edge4.position.set(pos - CFG.ROAD_W/2,0.04,0);
      scene.add(edge4);

      // Dashed center markings
      for(let m=-CFG.WORLD/2; m<CFG.WORLD/2; m+=14){
        let d1=new THREE.Mesh(new THREE.PlaneGeometry(6,0.15), centerMark);
        d1.rotation.x=-Math.PI/2; d1.position.set(m,0.05,pos); scene.add(d1);
        let d2=new THREE.Mesh(new THREE.PlaneGeometry(0.15,6), centerMark);
        d2.rotation.x=-Math.PI/2; d2.position.set(pos,0.05,m); scene.add(d2);
      }

      // Side lane markings
      for(let m=-CFG.WORLD/2; m<CFG.WORLD/2; m+=20){
        let s1=new THREE.Mesh(new THREE.PlaneGeometry(2,0.1), laneMark);
        s1.rotation.x=-Math.PI/2; s1.position.set(m,0.045,pos - CFG.ROAD_W/2 + 1);
        scene.add(s1);
        let s2=s1.clone(); s2.position.set(m,0.045,pos + CFG.ROAD_W/2 - 1);
        scene.add(s2);
        let s3=new THREE.Mesh(new THREE.PlaneGeometry(0.1,2), laneMark);
        s3.rotation.x=-Math.PI/2; s3.position.set(pos - CFG.ROAD_W/2 + 1,0.045,m);
        scene.add(s3);
        let s4=s3.clone(); s4.position.set(pos + CFG.ROAD_W/2 - 1,0.045,m);
        scene.add(s4);
      }
    }
  }

  _buildHighways(scene) {
    // Outer Highway Loop
    let hwMat = new THREE.MeshStandardMaterial({color:0x0a0a0c, roughness:0.3});
    let radius = 550;
    let width = 30;
    let ring = new THREE.Mesh(new THREE.TorusGeometry(radius, width/2, 4, 64), hwMat);
    ring.rotation.x = Math.PI/2;
    ring.position.y = 0.05;
    scene.add(ring);
    
    // Barriers
    let barMat = new THREE.MeshStandardMaterial({color:0x333333});
    for(let a=0; a<Math.PI*2; a+=0.04){
      let x = Math.cos(a)*radius, z = Math.sin(a)*radius;
      let b1 = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 4), barMat);
      b1.position.set(Math.cos(a)*(radius+width/2), 0.75, Math.sin(a)*(radius+width/2));
      b1.rotation.y = -a;
      scene.add(b1);
      let b2 = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 4), barMat);
      b2.position.set(Math.cos(a)*(radius-width/2), 0.75, Math.sin(a)*(radius-width/2));
      b2.rotation.y = -a;
      scene.add(b2);
    }
  }

  _makeWindowTex(style) {
    let c=document.createElement('canvas'); c.width=64; c.height=128;
    let ctx=c.getContext('2d');
    ctx.fillStyle='#050508'; ctx.fillRect(0,0,64,128);
    for(let r=0;r<16;r++) for(let col=0;col<4;col++){
      if(Math.random()>0.3){
        let l=40+Math.random()*50;
        let h = style===1 ? 210+Math.random()*30 : 30+Math.random()*40;
        ctx.fillStyle=`hsl(${h},70%,${l}%)`;
        ctx.fillRect(col*16+2,r*8+2,12,4);
        // Bloom helper: draw bright center
        ctx.fillStyle=`hsl(${h},100%,90%)`;
        ctx.fillRect(col*16+6,r*8+3,4,2);
      }
    }
    return new THREE.CanvasTexture(c);
  }

  _buildCity(scene) {
    for(let bx=-5;bx<=5;bx++) for(let bz=-5;bz<=5;bz++){
      let cx=bx*CFG.BLOCK, cz=bz*CFG.BLOCK;
      if(bx===0&&bz===0) continue; // Spawn
      let dist=Math.sqrt(bx*bx+bz*bz);
      let isDowntown=dist<3;
      let numB=isDowntown?3:1+Math.floor(Math.random()*2);
      
      for(let n=0;n<numB;n++){
        let w=12+Math.random()*15;
        let d=12+Math.random()*15;
        let h=isDowntown?40+Math.random()*100:10+Math.random()*40;
        let ox=(Math.random()-0.5)*(CFG.BLOCK-CFG.ROAD_W-w-10);
        let oz=(Math.random()-0.5)*(CFG.BLOCK-CFG.ROAD_W-d-10);
        let px=cx+ox, pz=cz+oz;
        
        let tex=this._makeWindowTex(isDowntown?1:0);
        tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
        tex.repeat.set(Math.ceil(w/12),Math.ceil(h/12));
        
        let mats = new THREE.MeshStandardMaterial({
          map:tex,
          roughness:0.15,
          metalness:0.3,
          emissiveMap:tex,
          emissive: new THREE.Color(isDowntown ? 0x3388aa : 0x224466),
          emissiveIntensity: isDowntown ? 0.8 : 0.4
        });
        let bld=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mats);
        bld.position.set(px,h/2,pz); scene.add(bld);
        this.buildings.push({x:px,z:pz,w:w,d:d,h:h});
        
        // Roof Spires & Neon
        if(isDowntown && Math.random()>0.4){
          let sh = 5+Math.random()*20;
          let spire = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.4, sh), new THREE.MeshStandardMaterial({color:0x888888}));
          spire.position.set(px, h+sh/2, pz); scene.add(spire);
          let beacon = new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshBasicMaterial({color:0xff0000}));
          beacon.position.set(px, h+sh, pz); scene.add(beacon);
          let bl = new THREE.PointLight(0xff0000, 1, 30);
          bl.position.copy(beacon.position); scene.add(bl);
        }
      }
    }

    // Add special landmarks
    // Small industrial district in corner for map variety
    (function buildIndustrial(){
      let ix = CFG.WORLD/2 - 220, iz = CFG.WORLD/2 - 220;
      let wareMat = new THREE.MeshStandardMaterial({color:0x2b2b2b, roughness:0.5, metalness:0.6});
      let doorMat = new THREE.MeshStandardMaterial({color:0x111111, roughness:0.2});
      for(let i=0;i<6;i++){
        let w = 60 + Math.random()*40, d = 80 + Math.random()*60, h = 12 + Math.random()*8;
        let px = ix + (i%3) * (w + 20);
        let pz = iz + Math.floor(i/3) * (d + 30);
        let wh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wareMat);
        wh.position.set(px, h/2 + 0.02, pz); scene.add(wh);
        // Big garage door
        let door = new THREE.Mesh(new THREE.BoxGeometry(w*0.6, h*0.5, 1), doorMat);
        door.position.set(px, (h*0.25)+0.02, pz + d/2 + 0.6); scene.add(door);
        // Small rooftop vents
        for(let v=0; v<3; v++){
          let vent = new THREE.Mesh(new THREE.BoxGeometry(2,1,2), new THREE.MeshStandardMaterial({color:0x444444}));
          vent.position.set(px - w/4 + v* (w/4), h + 0.8, pz - d/6); scene.add(vent);
        }
      }
      // Crane
      let craneMat = new THREE.MeshStandardMaterial({color:0xffcc66, metalness:0.9});
      let base = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 6), craneMat); base.position.set(ix + 80, 3, iz + 80); scene.add(base);
      let arm = new THREE.Mesh(new THREE.BoxGeometry(1,1,80), craneMat); arm.position.set(ix + 80, 30, iz + 40); scene.add(arm);
    })();

    this._buildLandmarks(scene);
  }

  _buildLandmarks(scene) {
    // Central Tower
    let towerGeo = new THREE.CylinderGeometry(8, 12, 150, 16);
    let towerMat = new THREE.MeshStandardMaterial({color: 0x222244, metalness: 0.8, roughness: 0.2});
    let tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(0, 75, 0);
    scene.add(tower);
    
    // Tower lights
    for(let i = 0; i < 8; i++) {
      let light = new THREE.PointLight(0x00ffff, 2, 50);
      light.position.set(Math.cos(i * Math.PI / 4) * 10, 140, Math.sin(i * Math.PI / 4) * 10);
      scene.add(light);
    }
    
    // Add to buildings for collision
    this.buildings.push({x: 0, z: 0, w: 24, d: 24, h: 150});

    // Bridge
    let bridgeLength = 200;
    let bridge = new THREE.Mesh(new THREE.BoxGeometry(bridgeLength, 2, 8), new THREE.MeshStandardMaterial({color: 0x444466, metalness: 0.7}));
    bridge.position.set(0, 15, 300);
    scene.add(bridge);
    
    // Bridge supports
    for(let i = -2; i <= 2; i++) {
      let support = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.5, 30), new THREE.MeshStandardMaterial({color: 0x333344}));
      support.position.set(i * 40, -15, 300);
      scene.add(support);
    }
    
    // Bridge lights
    for(let i = -5; i <= 5; i++) {
      let light = new THREE.PointLight(0xffaa00, 1, 30);
      light.position.set(i * 20, 18, 300);
      scene.add(light);
    }
  }

  _buildRamps(scene) {
    let rampMat=new THREE.MeshStandardMaterial({color:0x333333,roughness:0.4,metalness:0.3});
    let neonMat=new THREE.MeshBasicMaterial({color:0x00ffd5});
    let ramps=[
      {x:60,z:220,w:14,d:24,h:8,rot:0},{x:-140,z:-180,w:16,d:30,h:10,rot:Math.PI/3},
      {x:250,z:0,w:14,d:24,h:7,rot:Math.PI/2},{x:-300,z:300,w:18,d:35,h:12,rot:-Math.PI/4},
      {x:0,z:-350,w:15,d:25,h:9,rot:0},{x:400,z:-400,w:20,d:40,h:15,rot:Math.PI/6}
    ];
    ramps.forEach(r=>{
      let geo=new THREE.BoxGeometry(r.w,r.h,r.d);
      let pos=geo.attributes.position;
      for(let i=0;i<pos.count;i++){
        if(pos.getZ(i)<0 && pos.getY(i)>0) pos.setY(i,0);
      }
      pos.needsUpdate=true; geo.computeVertexNormals();
      let m=new THREE.Mesh(geo,rampMat);
      m.position.set(r.x,r.h/2,r.z); m.rotation.y=r.rot; scene.add(m);
      
      // Neon edges
      [-1, 1].forEach(s=>{
        let edge = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, r.d), neonMat);
        edge.position.set(r.x + Math.cos(r.rot)*s*r.w/2, r.h/2 + 0.1, r.z + Math.sin(r.rot)*s*r.w/2);
        edge.rotation.y = r.rot;
        scene.add(edge);
      });
      this.ramps.push(r);
    });
  }

  _buildTrees(scene) {
    let trunkMat=new THREE.MeshStandardMaterial({color:0x1a110a});
    let leafMat=new THREE.MeshStandardMaterial({color:0x051a05, roughness:0.9});
    for(let i=0;i<100;i++){
      let a=Math.random()*Math.PI*2, dist=200+Math.random()*300;
      let x=Math.cos(a)*dist, z=Math.sin(a)*dist;
      let h=4+Math.random()*6;
      let t=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.4,h),trunkMat);
      t.position.set(x,h/2,z); scene.add(t);
      let c=new THREE.Mesh(new THREE.SphereGeometry(2+Math.random()*2,8,8),leafMat);
      c.position.set(x,h+1.5,z); scene.add(c);
    }
  }

  _buildLights(scene) {
    let poleMat=new THREE.MeshStandardMaterial({color:0x222222,metalness:0.8});
    for(let i=-6;i<=6;i++) for(let j=-6;j<=6;j++){
      if(Math.random()>0.4) continue;
      [-1,1].forEach(s=>{
        let x=i*CFG.BLOCK+s*(CFG.ROAD_W/2+2), z=j*CFG.BLOCK;
        let p=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.15,10),poleMat);
        p.position.set(x,5,z); scene.add(p);
        let arm=new THREE.Mesh(new THREE.BoxGeometry(s*3,0.1,0.1),poleMat);
        arm.position.set(x-s*1.5,10,z); scene.add(arm);
        let l=new THREE.PointLight(0xffddaa, 0.6, 40);
        l.position.set(x-s*3, 9.5, z); scene.add(l);
        scene.add(new THREE.Mesh(new THREE.SphereGeometry(0.3), new THREE.MeshBasicMaterial({color:0xfff0aa})).translateX(x-s*3).translateY(9.5).translateZ(z));
      });
    }
  }

  _buildDecorations(scene) {
    // Neon Signs on buildings
    let colors=[0xff00ff, 0x00ffff, 0xffff00, 0xff0000];
    this.buildings.forEach((b,i)=>{
      if(i%4!==0) return;
      let col=colors[i%4];
      let neon=new THREE.Mesh(new THREE.BoxGeometry(b.w*0.6, 2, 0.2), new THREE.MeshBasicMaterial({color:col}));
      neon.position.set(b.x, b.h*0.6, b.z+b.d/2+0.1); scene.add(neon);
      let gl=new THREE.PointLight(col, 0.8, 25);
      gl.position.set(b.x, b.h*0.6, b.z+b.d/2+1); scene.add(gl);
    });

    // Checkpoints for racing
    this.checkpoints = [];
    let checkpointPositions = [
      {x: 0, z: 100, rot: 0},
      {x: 100, z: 100, rot: Math.PI/2},
      {x: 100, z: -100, rot: Math.PI},
      {x: -100, z: -100, rot: -Math.PI/2},
      {x: -100, z: 0, rot: 0}
    ];
    checkpointPositions.forEach((pos, i) => {
      let ringGeo = new THREE.TorusGeometry(8, 1, 8, 16);
      let ringMat = new THREE.MeshBasicMaterial({color: 0x00ff88, transparent: true, opacity: 0.7});
      let ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(pos.x, 2, pos.z);
      ring.rotation.x = Math.PI/2;
      scene.add(ring);
      
      let glow = new THREE.PointLight(0x00ff88, 2, 20);
      glow.position.set(pos.x, 2, pos.z);
      scene.add(glow);
      
      this.checkpoints.push({x: pos.x, z: pos.z, rot: pos.rot, passed: false, ring: ring, glow: glow});
    });

    // Power-ups
    this.powerUps = [];
    let powerUpPositions = [
      {x: 50, z: 50, type: 'nitro'},
      {x: -50, z: 50, type: 'nitro'},
      {x: 50, z: -50, type: 'nitro'},
      {x: -50, z: -50, type: 'nitro'},
      {x: 0, z: 200, type: 'boost'},
      {x: 200, z: 0, type: 'boost'},
      {x: 0, z: -200, type: 'boost'},
      {x: -200, z: 0, type: 'boost'}
    ];
    powerUpPositions.forEach(pos => {
      let geo, mat, light;
      if (pos.type === 'nitro') {
        geo = new THREE.OctahedronGeometry(2);
        mat = new THREE.MeshBasicMaterial({color: 0xffaa00, transparent: true, opacity: 0.8});
        light = new THREE.PointLight(0xffaa00, 3, 15);
      } else {
        geo = new THREE.CylinderGeometry(3, 3, 0.5);
        mat = new THREE.MeshBasicMaterial({color: 0x00ffff, transparent: true, opacity: 0.8});
        light = new THREE.PointLight(0x00ffff, 3, 15);
      }
      let mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos.x, 1, pos.z);
      scene.add(mesh);
      light.position.copy(mesh.position);
      scene.add(light);
      
      this.powerUps.push({x: pos.x, z: pos.z, type: pos.type, mesh: mesh, light: light, active: true});
    });
  }

  _buildTraffic(scene) {
    this.trafficCars=[];
    let carColors=[0xcc2222,0x2244cc,0x22cc44,0xcccc22,0xffffff,0x666666,0xff6600];
    for(let i=0;i<CFG.MAX_TRAFFIC;i++){
      let road=Math.floor(Math.random()*11)-5;
      let isXroad=Math.random()>0.5;
      let carGroup=new THREE.Group();
      let col=carColors[Math.floor(Math.random()*carColors.length)];
      let body=new THREE.Mesh(new THREE.BoxGeometry(1.8,0.6,3.8),new THREE.MeshStandardMaterial({color:col,metalness:0.5,roughness:0.2}));
      body.position.y=0.4; carGroup.add(body);
      let glass=new THREE.Mesh(new THREE.BoxGeometry(1.5,0.4,1.5),new THREE.MeshStandardMaterial({color:0x111111}));
      glass.position.set(0,0.8,-0.2); carGroup.add(glass);
      // Head/Tail lights
      [-0.6,0.6].forEach(x=>{
        let h=new THREE.Mesh(new THREE.SphereGeometry(0.1),new THREE.MeshBasicMaterial({color:0xffffee}));
        h.position.set(x,0.4,1.9); carGroup.add(h);
        let t=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.15,0.1),new THREE.MeshBasicMaterial({color:0xaa0000}));
        t.position.set(x,0.4,-1.9); carGroup.add(t);
      });
      let offset=(Math.random()-0.5)*CFG.WORLD;
      let lane=(Math.random()>0.5?1:-1)*5;
      let speed=15+Math.random()*20;
      let dir=lane>0?1:-1;
      if(isXroad){
        carGroup.position.set(offset,0.1,road*CFG.BLOCK+lane);
        carGroup.rotation.y=dir>0?0:Math.PI;
      } else {
        carGroup.position.set(road*CFG.BLOCK+lane,0.1,offset);
        carGroup.rotation.y=dir>0?Math.PI/2:-Math.PI/2;
      }
      scene.add(carGroup);
      this.trafficCars.push({group:carGroup,speed:speed*dir,isX:isXroad,half:CFG.WORLD/2});
    }
  }

  updateTraffic(dt) {
    this.trafficCars.forEach(tc=>{
      if(tc.isX){
        tc.group.position.x+=tc.speed*dt;
        if(tc.group.position.x>tc.half) tc.group.position.x=-tc.half;
        if(tc.group.position.x<-tc.half) tc.group.position.x=tc.half;
      } else {
        tc.group.position.z+=tc.speed*dt;
        if(tc.group.position.z>tc.half) tc.group.position.z=-tc.half;
        if(tc.group.position.z<-tc.half) tc.group.position.z=tc.half;
      }
    });
  }
}
