// === WORLD BUILDER (COMPLETE REDESIGN) ===
class World {
  constructor(scene) {
    this.buildings = [];
    this.ramps = [];
    this.scene = scene;
    this.trafficCars = [];
    this.checkpoints = [];
    this.powerUps = [];
    
    // Build world in layers
    this._buildSky(scene);
    this._buildGround(scene);
    this._buildWaterfront(scene);
    this._buildDowntownCore(scene);
    this._buildIndustrialZone(scene);
    this._buildParkArea(scene);
    this._buildRingHighway(scene);
    this._buildRamps(scene);
    this._buildLights(scene);
    this._buildRaceCheckpoints(scene);
    this._buildPowerUps(scene);
    this._buildTraffic(scene);
  }

  _buildSky(scene) {
    scene.background = new THREE.Color(0x0a0a15);
    scene.fog = new THREE.FogExp2(0x0a0a15, 0.0002);
    
    // Subtle stars above horizon
    let starGeo = new THREE.BufferGeometry();
    let starVerts = [];
    for(let i = 0; i < 400; i++) {
      let r = 900 + Math.random() * 300;
      let t = Math.random() * Math.PI * 2;
      let p = Math.random() * Math.PI * 0.4; // Upper hemisphere only
      starVerts.push(
        Math.cos(t) * Math.sin(p) * r,
        Math.cos(p) * r,
        Math.sin(t) * Math.sin(p) * r
      );
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.4,
      transparent: true,
      opacity: 0.4
    })));
    
    // Moon
    let moon = new THREE.Mesh(
      new THREE.SphereGeometry(15, 24, 24),
      new THREE.MeshBasicMaterial({color: 0xf5f5dc})
    );
    moon.position.set(-400, 300, -500);
    scene.add(moon);
    
    let moonGlow = new THREE.PointLight(0x88aaff, 0.6, 1200);
    moonGlow.position.copy(moon.position);
    scene.add(moonGlow);
  }

  _buildGround(scene) {
    // Base ground - large grass plane
    let grassMat = new THREE.MeshStandardMaterial({
      color: 0x1a3a1a,
      roughness: 0.95,
      metalness: 0.0
    });
    let grassGround = new THREE.Mesh(
      new THREE.PlaneGeometry(3000, 3000),
      grassMat
    );
    grassGround.rotation.x = -Math.PI / 2;
    grassGround.position.y = -0.1;
    scene.add(grassGround);
    
    // Central asphalt base (main play area)
    let asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x0d0d0f,
      roughness: 0.2,
      metalness: 0.05
    });
    let asphalt = new THREE.Mesh(
      new THREE.PlaneGeometry(1600, 1600),
      asphaltMat
    );
    asphalt.rotation.x = -Math.PI / 2;
    asphalt.position.y = 0.01;
    scene.add(asphalt);
    
    // Grid helper for reference
    let grid = new THREE.GridHelper(1600, 32, 0x00ff88, 0x112233);
    grid.position.y = 0.02;
    grid.material.transparent = true;
    grid.material.opacity = 0.12;
    scene.add(grid);
    
    // Boundary walls (thick, visible)
    let wallMat = new THREE.MeshStandardMaterial({
      color: 0x441111,
      roughness: 0.6,
      metalness: 0.2
    });
    let wallHeight = 8;
    let wallThick = 5;
    let edge = 810;
    
    // North wall
    let wallN = new THREE.Mesh(
      new THREE.BoxGeometry(1650, wallHeight, wallThick),
      wallMat
    );
    wallN.position.set(0, wallHeight / 2, -edge);
    scene.add(wallN);
    
    // South wall
    let wallS = wallN.clone();
    wallS.position.set(0, wallHeight / 2, edge);
    scene.add(wallS);
    
    // East wall
    let wallE = new THREE.Mesh(
      new THREE.BoxGeometry(wallThick, wallHeight, 1650),
      wallMat
    );
    wallE.position.set(edge, wallHeight / 2, 0);
    scene.add(wallE);
    
    // West wall
    let wallW = wallE.clone();
    wallW.position.set(-edge, wallHeight / 2, 0);
    scene.add(wallW);
  }

  _buildDowntownCore(scene) {
    // Tall buildings in a grid pattern around center
    let blockSize = 120;
    let buildingMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      metalness: 0.6,
      roughness: 0.3,
      emissive: 0x0a3a5f,
      emissiveIntensity: 0.5
    });
    
    for(let x = -2; x <= 2; x++) {
      for(let z = -2; z <= 2; z++) {
        if(x === 0 && z === 0) continue; // Spawn area
        
        let cx = x * blockSize;
        let cz = z * blockSize;
        let numBuildings = 2 + Math.floor(Math.random() * 2);
        
        for(let b = 0; b < numBuildings; b++) {
          let w = 20 + Math.random() * 18;
          let d = 20 + Math.random() * 18;
          let h = 50 + Math.random() * 80;
          
          let ox = (Math.random() - 0.5) * 60;
          let oz = (Math.random() - 0.5) * 60;
          
          let bx = cx + ox;
          let bz = cz + oz;
          
          // Windows texture
          let windowTex = this._makeWindowTexture();
          windowTex.wrapS = windowTex.wrapT = THREE.RepeatWrapping;
          windowTex.repeat.set(
            Math.ceil(w / 8),
            Math.ceil(h / 8)
          );
          
          let mat = buildingMat.clone();
          mat.map = windowTex;
          mat.emissiveMap = windowTex;
          
          let building = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            mat
          );
          building.position.set(bx, h / 2, bz);
          scene.add(building);
          
          this.buildings.push({
            x: bx, z: bz, w: w, d: d, h: h,
            type: 'downtown'
          });
          
          // Rooftop lights (random beacons)
          if(Math.random() > 0.5) {
            let beaconColor = [0xff0055, 0x00ffaa, 0xffaa00][Math.floor(Math.random() * 3)];
            let beacon = new THREE.Mesh(
              new THREE.SphereGeometry(0.8),
              new THREE.MeshBasicMaterial({color: beaconColor})
            );
            beacon.position.set(bx, h + 1, bz);
            scene.add(beacon);
            
            let light = new THREE.PointLight(beaconColor, 1.5, 40);
            light.position.copy(beacon.position);
            scene.add(light);
          }
        }
      }
    }
    
    // Central tower
    let towerGeo = new THREE.CylinderGeometry(12, 18, 200, 16);
    let towerMat = new THREE.MeshStandardMaterial({
      color: 0x0f0f1f,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x005577,
      emissiveIntensity: 0.6
    });
    let tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(0, 100, 0);
    scene.add(tower);
    this.buildings.push({x: 0, z: 0, w: 36, d: 36, h: 200, type: 'tower'});
    
    // Tower lights spiral
    for(let i = 0; i < 12; i++) {
      let angle = (i / 12) * Math.PI * 2;
      let height = i * 15;
      let radius = 15;
      let light = new THREE.PointLight(0x00ffff, 2, 60);
      light.position.set(
        Math.cos(angle) * radius,
        100 + height,
        Math.sin(angle) * radius
      );
      scene.add(light);
    }
  }

  _buildIndustrialZone(scene) {
    // South-east industrial area
    let baseX = 300;
    let baseZ = 300;
    
    let wareMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.7,
      metalness: 0.4
    });
    
    let doorMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 0.3
    });
    
    // Warehouse cluster
    for(let i = 0; i < 5; i++) {
      let w = 70 + Math.random() * 50;
      let d = 100 + Math.random() * 80;
      let h = 15 + Math.random() * 10;
      
      let px = baseX + (i % 2) * 180;
      let pz = baseZ + Math.floor(i / 2) * 220;
      
      let warehouse = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        wareMat
      );
      warehouse.position.set(px, h / 2, pz);
      scene.add(warehouse);
      
      this.buildings.push({
        x: px, z: pz, w: w, d: d, h: h,
        type: 'warehouse'
      });
      
      // Loading doors
      let door = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.7, h * 0.6, 1.5),
        doorMat
      );
      door.position.set(px, (h * 0.3), pz + d / 2 + 1);
      scene.add(door);
      
      // Roof vents
      for(let v = 0; v < 4; v++) {
        let vent = new THREE.Mesh(
          new THREE.BoxGeometry(3, 2, 3),
          new THREE.MeshStandardMaterial({color: 0x444444})
        );
        vent.position.set(
          px - w / 3 + v * (w / 8),
          h + 0.5,
          pz - d / 3
        );
        scene.add(vent);
      }
    }
    
    // Cargo crane
    let craneMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      metalness: 0.95,
      roughness: 0.15
    });
    
    let craneBase = new THREE.Mesh(
      new THREE.BoxGeometry(8, 8, 8),
      craneMat
    );
    craneBase.position.set(baseX + 250, 4, baseZ + 250);
    scene.add(craneBase);
    
    let craneArm = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 120),
      craneMat
    );
    craneArm.position.set(baseX + 250, 40, baseZ + 180);
    scene.add(craneArm);
    
    // Cargo containers
    let containerMat = new THREE.MeshStandardMaterial({
      color: 0xcc3333,
      roughness: 0.6
    });
    
    for(let i = 0; i < 8; i++) {
      let container = new THREE.Mesh(
        new THREE.BoxGeometry(12, 12, 28),
        containerMat.clone()
      );
      container.position.set(
        baseX + 300 + (i % 4) * 35,
        6,
        baseZ + 320 + Math.floor(i / 4) * 35
      );
      scene.add(container);
    }
  }

  _buildWaterfront(scene) {
    // North waterfront area
    let waterMat = new THREE.MeshStandardMaterial({
      color: 0x0a2a3a,
      roughness: 0.1,
      metalness: 0.3
    });
    
    let water = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 400),
      waterMat
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, 0.005, -450);
    scene.add(water);
    
    // Sandy beach
    let sandMat = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.95,
      metalness: 0.0
    });
    
    let sand = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 300),
      sandMat
    );
    sand.rotation.x = -Math.PI / 2;
    sand.position.set(0, 0.01, -300);
    scene.add(sand);
    
    // Pier structure
    let pierMat = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.8,
      metalness: 0.1
    });
    
    let pier = new THREE.Mesh(
      new THREE.BoxGeometry(60, 2, 200),
      pierMat
    );
    pier.position.set(150, 0.5, -400);
    scene.add(pier);
    
    // Pier supports
    for(let i = 0; i < 6; i++) {
      let support = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 2, 20),
        pierMat
      );
      support.position.set(
        150 - 20 + i * 20,
        -8,
        -400 + (Math.random() - 0.5) * 100
      );
      scene.add(support);
    }
    
    // Dock lights
    for(let i = 0; i < 4; i++) {
      let light = new THREE.PointLight(0xffdd88, 1, 50);
      light.position.set(150 - 25 + i * 20, 3, -400);
      scene.add(light);
    }
    
    // Beach huts
    for(let i = 0; i < 3; i++) {
      let hut = new THREE.Mesh(
        new THREE.BoxGeometry(8, 6, 8),
        new THREE.MeshStandardMaterial({color: 0xaa6644})
      );
      hut.position.set(-100 + i * 50, 3, -280);
      scene.add(hut);
    }
  }

  _buildParkArea(scene) {
    // East park with winding paths
    let parkX = -450;
    let parkZ = -200;
    
    let grassMat = new THREE.MeshStandardMaterial({
      color: 0x2a4a2a,
      roughness: 0.9,
      metalness: 0.0
    });
    
    let parkGround = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 500),
      grassMat
    );
    parkGround.rotation.x = -Math.PI / 2;
    parkGround.position.set(parkX, 0.02, parkZ);
    scene.add(parkGround);
    
    // Trees scattered
    for(let i = 0; i < 15; i++) {
      let tx = parkX - 150 + Math.random() * 300;
      let tz = parkZ - 200 + Math.random() * 400;
      
      let trunkMat = new THREE.MeshStandardMaterial({
        color: 0x1a0f05,
        roughness: 0.9
      });
      
      let trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 1.2, 8),
        trunkMat
      );
      trunk.position.set(tx, 4, tz);
      scene.add(trunk);
      
      let foliageMat = new THREE.MeshStandardMaterial({
        color: 0x1a3a1a,
        roughness: 0.95
      });
      
      let foliage = new THREE.Mesh(
        new THREE.SphereGeometry(5 + Math.random() * 3, 8, 8),
        foliageMat
      );
      foliage.position.set(tx, 12, tz);
      scene.add(foliage);
    }
  }

  _buildRingHighway(scene) {
    // Highway loop around the city
    let roadMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0c,
      roughness: 0.25,
      metalness: 0.08
    });
    
    let laneMarkMat = new THREE.MeshBasicMaterial({color: 0xffffaa});
    
    // Draw highway as 4 segments (N, E, S, W)
    let segments = [
      {x: 0, z: -550, w: 80, d: 200}, // North
      {x: 550, z: 0, w: 200, d: 80}, // East
      {x: 0, z: 550, w: 80, d: 200}, // South
      {x: -550, z: 0, w: 200, d: 80} // West
    ];
    
    segments.forEach(seg => {
      let road = new THREE.Mesh(
        new THREE.PlaneGeometry(seg.w, seg.d),
        roadMat
      );
      road.rotation.x = -Math.PI / 2;
      road.position.set(seg.x, 0.03, seg.z);
      scene.add(road);
      
      // Lane markings
      let markCount = Math.floor(seg.d / 20);
      for(let m = 0; m < markCount; m++) {
        let mark = new THREE.Mesh(
          new THREE.PlaneGeometry(seg.w * 0.3, 3),
          laneMarkMat
        );
        mark.rotation.x = -Math.PI / 2;
        if(seg.w > seg.d) {
          mark.position.set(seg.x, 0.04, seg.z - seg.d / 2 + m * 20);
        } else {
          mark.position.set(seg.x - seg.w / 2 + m * 20, 0.04, seg.z);
        }
        scene.add(mark);
      }
    });
    
    // Barrier walls on highway
    let barrierMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5,
      metalness: 0.2
    });
    
    for(let i = 0; i < 16; i++) {
      let angle = (i / 16) * Math.PI * 2;
      let radius = 600;
      let x = Math.cos(angle) * radius;
      let z = Math.sin(angle) * radius;
      
      let barrier = new THREE.Mesh(
        new THREE.BoxGeometry(8, 3, 15),
        barrierMat
      );
      barrier.position.set(x, 1.5, z);
      barrier.rotation.y = angle + Math.PI / 2;
      scene.add(barrier);
    }
  }

  _buildRamps(scene) {
    // Jump ramps scattered around
    let rampMat = new THREE.MeshStandardMaterial({
      color: 0x333366,
      roughness: 0.4,
      metalness: 0.4
    });
    
    let neonMat = new THREE.MeshBasicMaterial({color: 0x00ffdd});
    
    let rampSpecs = [
      {x: 200, z: 100, rot: 0.3},
      {x: -250, z: 150, rot: -0.2},
      {x: 150, z: -250, rot: 0.5},
      {x: -100, z: -300, rot: -0.4}
    ];
    
    rampSpecs.forEach(spec => {
      let w = 25, d = 40, h = 12;
      
      let geometry = new THREE.BoxGeometry(w, h, d);
      let positions = geometry.attributes.position;
      
      // Skew front edge to create ramp
      for(let i = 0; i < positions.count; i++) {
        let y = positions.getY(i);
        let z = positions.getZ(i);
        if(z > 0 && y > -h / 2) {
          let newY = y + (z / (d / 2)) * (h / 2);
          positions.setY(i, newY);
        }
      }
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      
      let ramp = new THREE.Mesh(geometry, rampMat);
      ramp.position.set(spec.x, h / 2, spec.z);
      ramp.rotation.y = spec.rot;
      scene.add(ramp);
      
      // Neon edge lights
      let neonEdge = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.3, d),
        neonMat
      );
      neonEdge.position.set(spec.x, h + 0.3, spec.z);
      neonEdge.rotation.y = spec.rot;
      scene.add(neonEdge);
      
      this.ramps.push(spec);
    });
  }

  _buildLights(scene) {
    // Street lights on main roads
    let poleMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.9,
      roughness: 0.2
    });
    
    let lightMat = new THREE.MeshStandardMaterial({
      color: 0xffdd99,
      metalness: 0.7,
      roughness: 0.3
    });
    
    let positions = [
      {x: -300, z: -300}, {x: 300, z: -300},
      {x: -300, z: 300}, {x: 300, z: 300},
      {x: 0, z: -500}, {x: 0, z: 500},
      {x: -500, z: 0}, {x: 500, z: 0}
    ];
    
    positions.forEach(pos => {
      let pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 12),
        poleMat
      );
      pole.position.set(pos.x, 6, pos.z);
      scene.add(pole);
      
      let head = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.5, 1.5),
        lightMat
      );
      head.position.set(pos.x, 12.5, pos.z);
      scene.add(head);
      
      let light = new THREE.PointLight(0xffdd99, 1.2, 60);
      light.position.set(pos.x, 12, pos.z);
      scene.add(light);
    });
  }

  _buildRaceCheckpoints(scene) {
    // Racing checkpoints forming a circuit
    this.checkpoints = [];
    
    let checkpointLayout = [
      {x: 0, z: 200, rot: 0},
      {x: 250, z: 100, rot: Math.PI / 4},
      {x: 300, z: -100, rot: Math.PI / 2},
      {x: 100, z: -300, rot: 3 * Math.PI / 4},
      {x: -150, z: -280, rot: Math.PI},
      {x: -320, z: -50, rot: -3 * Math.PI / 4},
      {x: -250, z: 200, rot: -Math.PI / 2}
    ];
    
    checkpointLayout.forEach((pos, i) => {
      let ringGeo = new THREE.TorusGeometry(10, 1.5, 8, 16);
      let ringMat = new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.8
      });
      let ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(pos.x, 2, pos.z);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
      
      let glow = new THREE.PointLight(0x00ff88, 2.5, 25);
      glow.position.copy(ring.position);
      scene.add(glow);
      
      this.checkpoints.push({
        x: pos.x,
        z: pos.z,
        rot: pos.rot,
        passed: false,
        ring: ring,
        glow: glow
      });
    });
  }

  _buildPowerUps(scene) {
    // Power-ups placed strategically
    this.powerUps = [];
    
    let powerUpLayout = [
      {x: 0, z: 0, type: 'nitro'},
      {x: 150, z: 150, type: 'boost'},
      {x: -200, z: 50, type: 'nitro'},
      {x: 50, z: -250, type: 'boost'},
      {x: 250, z: -150, type: 'nitro'},
      {x: -150, z: -200, type: 'boost'}
    ];
    
    powerUpLayout.forEach(pos => {
      let geo, mat, light, color;
      
      if(pos.type === 'nitro') {
        geo = new THREE.OctahedronGeometry(2.5);
        color = 0xff9900;
        mat = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.85
        });
        light = new THREE.PointLight(color, 3, 20);
      } else {
        geo = new THREE.DodecahedronGeometry(2);
        color = 0x00ffff;
        mat = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.85
        });
        light = new THREE.PointLight(color, 3, 20);
      }
      
      let mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos.x, 2, pos.z);
      scene.add(mesh);
      
      light.position.copy(mesh.position);
      scene.add(light);
      
      this.powerUps.push({
        x: pos.x,
        z: pos.z,
        type: pos.type,
        mesh: mesh,
        light: light,
        active: true
      });
    });
  }

  _buildTraffic(scene) {
    this.trafficCars = [];
    let carColors = [0xcc2222, 0x2244cc, 0x22cc44, 0xcccc22, 0xffffff, 0xff6600];
    
    for(let i = 0; i < CFG.MAX_TRAFFIC; i++) {
      let carGroup = new THREE.Group();
      let col = carColors[Math.floor(Math.random() * carColors.length)];
      
      let body = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.6, 3.8),
        new THREE.MeshStandardMaterial({
          color: col,
          metalness: 0.5,
          roughness: 0.2
        })
      );
      body.position.y = 0.4;
      carGroup.add(body);
      
      let glass = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.4, 1.5),
        new THREE.MeshStandardMaterial({color: 0x111111})
      );
      glass.position.set(0, 0.8, -0.2);
      carGroup.add(glass);
      
      // Lights
      for(let x of [-0.6, 0.6]) {
        let headlight = new THREE.Mesh(
          new THREE.SphereGeometry(0.1),
          new THREE.MeshBasicMaterial({color: 0xffffee})
        );
        headlight.position.set(x, 0.4, 1.9);
        carGroup.add(headlight);
        
        let taillight = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.15, 0.1),
          new THREE.MeshBasicMaterial({color: 0xaa0000})
        );
        taillight.position.set(x, 0.4, -1.9);
        carGroup.add(taillight);
      }
      
      // Spawn on roads
      let roadChoice = Math.floor(Math.random() * 4);
      let pos = Math.random() * 300 - 150;
      let speed = 20 + Math.random() * 15;
      
      switch(roadChoice) {
        case 0: // North highway
          carGroup.position.set(pos, 0.1, -550);
          carGroup.rotation.y = 0;
          break;
        case 1: // East highway
          carGroup.position.set(550, 0.1, pos);
          carGroup.rotation.y = Math.PI / 2;
          break;
        case 2: // South highway
          carGroup.position.set(pos, 0.1, 550);
          carGroup.rotation.y = Math.PI;
          break;
        case 3: // West highway
          carGroup.position.set(-550, 0.1, pos);
          carGroup.rotation.y = -Math.PI / 2;
          break;
      }
      
      scene.add(carGroup);
      this.trafficCars.push({
        group: carGroup,
        speed: speed,
        roadChoice: roadChoice,
        maxDist: 600
      });
    }
  }

  _makeWindowTexture() {
    let canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 128;
    let ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, 64, 128);
    
    for(let row = 0; row < 16; row++) {
      for(let col = 0; col < 4; col++) {
        if(Math.random() > 0.25) {
          let hue = 200 + Math.random() * 40;
          let light = 40 + Math.random() * 40;
          ctx.fillStyle = `hsl(${hue}, 70%, ${light}%)`;
          ctx.fillRect(col * 16 + 2, row * 8 + 2, 12, 4);
          
          ctx.fillStyle = `hsl(${hue}, 100%, 85%)`;
          ctx.fillRect(col * 16 + 6, row * 8 + 3, 4, 2);
        }
      }
    }
    
    return new THREE.CanvasTexture(canvas);
  }

  updateTraffic(dt) {
    this.trafficCars.forEach(tc => {
      let roadSpeeds = [
        {dir: [1, 0], base: tc.group.position.x},
        {dir: [0, 1], base: tc.group.position.z},
        {dir: [-1, 0], base: tc.group.position.x},
        {dir: [0, -1], base: tc.group.position.z}
      ];
      
      let roadSpeed = roadSpeeds[tc.roadChoice];
      let newBase = roadSpeed.base + tc.speed * dt;
      
      if(tc.roadChoice === 0) tc.group.position.x = newBase;
      if(tc.roadChoice === 1) tc.group.position.z = newBase;
      if(tc.roadChoice === 2) tc.group.position.x = newBase;
      if(tc.roadChoice === 3) tc.group.position.z = newBase;
      
      // Wrap around
      if(Math.abs(newBase) > tc.maxDist) {
        if(tc.roadChoice === 0 || tc.roadChoice === 2) {
          tc.group.position.x = -newBase;
        } else {
          tc.group.position.z = -newBase;
        }
      }
    });
  }
}
