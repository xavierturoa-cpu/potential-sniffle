(() => {
"use strict";

const error = document.getElementById("error");

try {
  if (!window.THREE) throw new Error("Three.js failed to load.");
  const T = THREE;

  const scene = new T.Scene();
  scene.background = new T.Color(0x72b7e8);
  scene.fog = new T.Fog(0x72b7e8, 180, 900);

  const camera = new T.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 2500);
  const renderer = new T.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  document.body.appendChild(renderer.domElement);

  scene.add(new T.HemisphereLight(0xffffff, 0x446633, 1.8));
  scene.add(new T.AmbientLight(0xffffff, 1.2));
  const sun = new T.DirectionalLight(0xffffff, 2);
  sun.position.set(50, 100, 30);
  scene.add(sun);

  const roadMat = new T.MeshBasicMaterial({ color: 0x333333 });
  const grassMat = new T.MeshBasicMaterial({ color: 0x4f8d48 });
  const whiteMat = new T.MeshLambertMaterial({ color: 0xffffff });
  const yellowMat = new T.MeshLambertMaterial({ color: 0xf5c400 });
  const darkMat = new T.MeshLambertMaterial({ color: 0x222222 });

  const roadPieces = [];
  const grassPieces = [];
  const edgeLines = [];
  const centerLines = [];
  const roadLength = 120;
  const roadCount = 22;

  for (let i = 0; i < roadCount; i++) {
    const z = -i * roadLength;
    const road = new T.Mesh(new T.PlaneGeometry(18, roadLength + 2), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.z = z;
    scene.add(road);
    roadPieces.push(road);

    const grass = new T.Mesh(new T.PlaneGeometry(220, roadLength + 2), grassMat);
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = -0.08;
    grass.position.z = z;
    scene.add(grass);
    grassPieces.push(grass);

    for (const x of [-8.8, 8.8]) {
      const edge = new T.Mesh(new T.BoxGeometry(0.16, 0.04, roadLength), yellowMat);
      edge.position.set(x, 0.04, z);
      scene.add(edge);
      edgeLines.push(edge);
    }

    const center = new T.Mesh(new T.BoxGeometry(0.12, 0.035, 6), whiteMat);
    center.position.set(0, 0.03, z);
    scene.add(center);
    centerLines.push(center);
  }

  function makeCar(color, scale = 1) {
    const g = new T.Group();
    const body = new T.Mesh(new T.BoxGeometry(2.25, 0.65, 4.2), new T.MeshLambertMaterial({ color }));
    body.position.y = 0.65;
    g.add(body);
    const cabin = new T.Mesh(new T.BoxGeometry(1.5, 0.65, 1.9), new T.MeshLambertMaterial({ color: 0x9ccce0 }));
    cabin.position.y = 1.25;
    g.add(cabin);
    for (const x of [-1.15, 1.15]) for (const z of [-1.45, 1.45]) {
      const wheel = new T.Mesh(new T.CylinderGeometry(0.36, 0.36, 0.25, 12), darkMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.35, z);
      g.add(wheel);
    }
    g.scale.setScalar(scale);
    return g;
  }

  const player = makeCar(0xdd3333);
  player.position.set(-4.5, 0, 5);
  scene.add(player);

  const towns = [];
  const townStarts = ["River", "Pine", "Lake", "Green", "Red", "Oak", "Hill", "Cedar", "Spring", "Sunny", "West", "East", "North", "South", "Golden", "Silver", "Blue", "Rose", "King", "Mill", "Stone", "Clear", "Bright", "Little", "Grand"];
  const townEnds = ["dale", "creek", "wood", "ville", "ton", "field", "view", "ford", "vale", "side", "bury", "bridge", "town", "grove", "park", "heights", "point", "falls", "crossing", "junction"];
  const streetWords = ["Main", "High", "Park", "Station", "Market", "Church", "School", "Queen", "King", "Victoria", "River", "Lake", "Bridge", "George", "William"];
  function makeTownName(i) { return townStarts[(i * 7 + 3) % townStarts.length] + townEnds[(i * 11 + 5) % townEnds.length]; }
  function addTown(z, index) {
    const town = new T.Group();
    town.userData.name = makeTownName(index);
    town.userData.speedLimit = 40 + ((index * 13) % 4) * 10;
    const signCanvas = document.createElement("canvas"); signCanvas.width = 768; signCanvas.height = 256;
    const ctx = signCanvas.getContext("2d");
    ctx.fillStyle = "#164f9c"; ctx.fillRect(0, 0, 768, 256);
    ctx.fillStyle = "#fff"; ctx.font = "bold 88px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(town.userData.name, 384, 128);
    const sign = new T.Mesh(new T.PlaneGeometry(8, 2.7), new T.MeshBasicMaterial({ map: new T.CanvasTexture(signCanvas), side: T.DoubleSide }));
    sign.position.set(11.2, 4.5, -20); town.add(sign);
    for (let i = 0; i < 16; i++) {
      const side = i % 2 ? 1 : -1;
      const building = new T.Mesh(new T.BoxGeometry(4 + (i % 3), 3 + (i % 4), 5 + (i % 2) * 2), new T.MeshLambertMaterial({ color: [0xd8c19f, 0xb96e4b, 0xaaaaaa, 0xe0d5bd, 0xc9d1d9][i % 5] }));
      building.position.set(side * (13 + (i % 4) * 3), building.geometry.parameters.height / 2, -70 - i * 45); town.add(building);
      const roof = new T.Mesh(new T.ConeGeometry(3.1, 1.3, 4), new T.MeshLambertMaterial({ color: 0x8b3f2f }));
      roof.rotation.y = Math.PI / 4; roof.position.set(building.position.x, building.position.y + building.geometry.parameters.height / 2 + 0.65, building.position.z); town.add(roof);
    }
    town.position.z = z; scene.add(town); towns.push(town);
  }
  addTown(-1400, 0); addTown(-2850, 1); addTown(-4300, 2); addTown(-5750, 3);

  const terrain = [];
  function addTree(z, side) {
    const tree = new T.Group();
    const trunk = new T.Mesh(new T.CylinderGeometry(0.25, 0.35, 2.2, 8), new T.MeshBasicMaterial({ color: 0x6b4226 })); trunk.position.y = 1.1; tree.add(trunk);
    const crown = new T.Mesh(new T.ConeGeometry(1.6, 3.4, 8), new T.MeshBasicMaterial({ color: 0x287a35 })); crown.position.y = 3.4; tree.add(crown);
    tree.position.set(side * (12 + Math.random() * 8), 0, z); scene.add(tree); terrain.push(tree);
  }
  for (let i = 0; i < 38; i++) addTree(-120 - i * 150, i % 2 ? 1 : -1);

  const traffic = [];
  const trafficColors = [0xffffff, 0x4488dd, 0xffaa22, 0x44aa66, 0xcc3333, 0x777777];
  function spawnTraffic(z, lane = null) {
    const side = lane ?? (Math.random() < 0.5 ? -1 : 1);
    const car = makeCar(trafficColors[Math.floor(Math.random() * trafficColors.length)], Math.random() < 0.2 ? 1.25 : 1);
    car.position.set(side < 0 ? -4.5 : 4.5, 0, z); car.userData.dir = side; car.userData.speed = 70 + Math.random() * 35; car.userData.lane = side;
    scene.add(car); traffic.push(car);
  }
  for (let i = 0; i < 5; i++) spawnTraffic(-350 - i * 420, -1);
  for (let i = 0; i < 2; i++) spawnTraffic(-650 - i * 900, 1);

  const passingLanes = [];
  for (let i = 0; i < 6; i++) {
    const z = -700 - i * 1100;
    const lane = new T.Mesh(new T.BoxGeometry(7.5, 0.035, 220), roadMat); lane.position.set(-3.75, 0.015, z); scene.add(lane); passingLanes.push(lane);
    for (let x = -7.5; x < 0; x += 7.5) { const line = new T.Mesh(new T.BoxGeometry(0.12, 0.04, 220), whiteMat); line.position.set(x, 0.04, z); scene.add(line); }
  }

  const signs = [];
  function addSpeedSign(z, value) {
    const g = new T.Group();
    const pole = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 4.6, 8), new T.MeshLambertMaterial({ color: 0x777777 })); pole.position.y = 2.3; g.add(pole);
    const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 512; const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 512, 512); ctx.beginPath(); ctx.arc(256, 256, 205, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill(); ctx.lineWidth = 32; ctx.strokeStyle = "#d71920"; ctx.stroke(); ctx.fillStyle = "#111"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "bold 190px Arial"; ctx.fillText(String(value), 256, 265);
    const face = new T.Mesh(new T.PlaneGeometry(2.7, 2.7), new T.MeshBasicMaterial({ map: new T.CanvasTexture(canvas), side: T.DoubleSide })); face.position.set(0, 4.25, -0.08); g.add(face);
    g.position.set(11.5, 0, z); g.userData.limit = value; scene.add(g); signs.push(g);
  }
  [100,110,90,100,120,100,110,100,80,110,100,80].forEach((v,i)=>addSpeedSign(-220-i*300,v));

  const police = [];
  function spawnPolice(z) { const p = makeCar(0xffffff); p.position.set(4.5,0,z); p.userData.speed=120; p.userData.active=false; scene.add(p); police.push(p); }
  spawnPolice(-1800);

  const keys = {};
  let speed = 100;
  let distance = 0;
  let playerX = -4.5;
  let cameraMode = 0;
  let limit = 100;
  let crashed = false;
  let crashTimer = 0;
  let spawnTimer = 0;
  let policeTimer = 0;
  let cruiseControl = false;
  let cruiseSpeed = 0;
  let paused = false;
  let audioCtx = null, engine = null, gain = null;
  let clock = new T.Clock();

  addEventListener("keydown", e => {
    keys[e.code] = true;
    if (["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) e.preventDefault();
    if (e.code === "KeyV") cameraMode = 1 - cameraMode;
    if (e.code === "KeyC") { cruiseControl = !cruiseControl; if (cruiseControl) cruiseSpeed = Math.min(120, Math.max(0, speed)); }
    if (e.code === "KeyR") reset();
    if (e.code === "Escape" || e.code === "KeyP") { paused = !paused; document.getElementById("pauseScreen").style.display = paused ? "flex" : "none"; }
  });
  addEventListener("keyup", e => keys[e.code] = false);

  function audioStart() { if (audioCtx) return; try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); engine = audioCtx.createOscillator(); gain = audioCtx.createGain(); engine.type = "sawtooth"; gain.gain.value = 0.02; engine.connect(gain).connect(audioCtx.destination); engine.start(); } catch (_) {} }

  function reset() {
    speed = 100; distance = 0; playerX = -4.5; limit = 100; crashed = false; crashTimer = 0; policeTimer = 0; cruiseControl = false; cruiseSpeed = 0;
    player.position.set(-4.5, 0, 5); player.rotation.set(0,0,0);
    for (const t of traffic) scene.remove(t); traffic.length=0;
    for (let i=0;i<5;i++) spawnTraffic(-350-i*420,-1);
    for (let i=0;i<2;i++) spawnTraffic(-650-i*900,1);
    for (const p of police) p.position.z=-1800;
  }

  function updateHud() {
    let hud=document.getElementById("gameHud");
    if(!hud){hud=document.createElement("div");hud.id="gameHud";hud.style.cssText="position:fixed;left:20px;bottom:18px;color:white;font:700 21px Arial;text-shadow:2px 2px 5px #000;z-index:20;pointer-events:none;line-height:1.45";document.body.appendChild(hud);}
    const warning=speed>limit?"  ⚠ SPEEDING":""; const cruise=cruiseControl?"  🛣 CRUISE ON":"";
    hud.innerHTML=Math.round(speed)+" km/h"+warning+cruise+"<br>Limit: "+limit+" km/h<br>Top speed: 120 km/h<br>C = Cruise control";
  }

  function gameLoop() {
    const dt=Math.min(clock.getDelta(),0.05);
    if(paused){renderer.render(scene,camera);return;}
    audioStart();
    if(!crashed){
      const steer=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
      playerX+=steer*8*dt; playerX=Math.max(-7.2,Math.min(7.2,playerX)); player.position.x+=(playerX-player.position.x)*Math.min(1,dt*12); player.rotation.z=-steer*0.08;
      if(cruiseControl) speed+=(cruiseSpeed-speed)*Math.min(1,dt*4); else { if(keys.KeyW||keys.ArrowUp)speed+=140*dt; else speed-=1.5*dt; if(keys.KeyS||keys.ArrowDown)speed-=180*dt; }
      if(keys.KeyW||keys.ArrowUp||keys.KeyS||keys.ArrowDown) cruiseControl=false;
      speed=Math.max(0,Math.min(120,speed));
    } else { crashTimer-=dt; speed=Math.max(0,speed-120*dt); player.rotation.z+=6*dt; if(crashTimer<=0)reset(); }
    const playerMove=speed*dt*0.35;
    for(const obj of [...roadPieces,...grassPieces,...edgeLines,...centerLines]){obj.position.z+=playerMove;if(obj.position.z>100)obj.position.z-=roadLength*roadCount;}
    for(const tree of terrain){tree.position.z+=playerMove;if(tree.position.z>100)tree.position.z-=150*38;}
    let inTown=false;
    for(const town of towns){town.position.z+=playerMove;if(town.position.z>150)town.position.z-=7200;if(Math.abs(town.position.z)<430)inTown=true;}
    if(inTown){const activeTown=towns.find(t=>Math.abs(t.position.z)<430);if(activeTown)limit=activeTown.userData.speedLimit;}
    for(const sign of signs){sign.position.z+=playerMove;if(sign.position.z>100){sign.position.z-=6000;if(!inTown)limit=sign.userData.limit;}}
    for(const lane of passingLanes){lane.position.z+=playerMove;if(lane.position.z>100)lane.position.z-=6600;}
    for(const t of traffic){const trafficSpeed=Math.min(t.userData.speed,limit);const relative=playerMove+(t.userData.dir>0?trafficSpeed:-trafficSpeed)*dt;t.position.z+=relative;if(t.position.z>100)t.position.z-=3000;if(t.position.z<-3000)t.position.z+=3000;if(!crashed&&Math.abs(t.position.z-player.position.z)<3&&Math.abs(t.position.x-player.position.x)<2){crashed=true;crashTimer=1.5;speed=0;}}
    if(speed>limit+15)policeTimer+=dt;else policeTimer=Math.max(0,policeTimer-dt*2);if(policeTimer>4)for(const p of police)p.userData.active=true;
    for(const p of police){if(p.userData.active){p.position.z+=playerMove+p.userData.speed*dt*0.25;if(p.position.z>player.position.z+15)p.position.z=player.position.z-180;if(Math.abs(p.position.z-player.position.z)<5&&speed>limit+15)speed=Math.max(0,speed-80*dt);}else p.position.z+=playerMove;}
    spawnTimer-=dt;if(spawnTimer<=0){const townAhead=isInTownAt(-900);if(townAhead)spawnTraffic(-550-Math.random()*900,Math.random()<0.25?1:-1);else spawnTraffic(-1200-Math.random()*1800,Math.random()<0.12?1:-1);spawnTimer=townAhead?1+Math.random()*1.4:3.5+Math.random()*4.5;}
    distance+=speed*dt/3.6;
    if(cameraMode===0){camera.position.x+=(player.position.x*0.45-camera.position.x)*Math.min(1,dt*6);camera.position.y=6;camera.position.z=15;camera.lookAt(player.position.x,0.7,-80);}else{camera.position.set(player.position.x,1.35,3);camera.lookAt(player.position.x,1.25,-100);}
    if(engine&&gain){engine.frequency.setTargetAtTime(60+speed*0.7,audioCtx.currentTime,0.03);gain.gain.setTargetAtTime(0.015+Math.min(speed/1200,0.06),audioCtx.currentTime,0.05);}
    updateHud();renderer.render(scene,camera);
  }

  reset();
  addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
  renderer.setAnimationLoop(()=>{try{gameLoop();}catch(e){error.style.display="block";error.textContent="GAME ERROR\n\n"+(e.stack||e);renderer.setAnimationLoop(null);}});
} catch(e) { error.style.display="block"; error.textContent="GAME ERROR\n\n"+(e.stack||e); }
})();
