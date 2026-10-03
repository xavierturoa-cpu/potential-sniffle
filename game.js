(() => {
"use strict";

const error = document.getElementById("error");

try {
  if (!window.THREE) throw new Error("Three.js failed to load.");
  const T = window.THREE;

  const scene = new T.Scene();
  scene.background = new T.Color(0x79bff2);

  const camera = new T.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 700);
  camera.position.set(8, 7, 10);

  const renderer = new T.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  document.body.appendChild(renderer.domElement);

  // Auto-generated flat land chunks.
  const terrainChunks = [];
  const CHUNK_SIZE = 1000;
  const TERRAIN_RADIUS = 4;
  let terrainCenterX = Infinity;
  let terrainCenterZ = Infinity;

  function createTerrainChunk() {
    const geometry = new T.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE);
    geometry.rotateX(-Math.PI / 2);
    const mesh = new T.Mesh(
      geometry,
      new T.MeshBasicMaterial({ color: 0x4d963f, side: T.DoubleSide })
    );
    scene.add(mesh);
    terrainChunks.push(mesh);
    return mesh;
  }

  function updateTerrainAround(x, z) {
    const centerX = Math.floor(x / CHUNK_SIZE);
    const centerZ = Math.floor(z / CHUNK_SIZE);
    if (centerX === terrainCenterX && centerZ === terrainCenterZ) return;
    terrainCenterX = centerX;
    terrainCenterZ = centerZ;

    const needed = (TERRAIN_RADIUS * 2 + 1) ** 2;
    while (terrainChunks.length < needed) createTerrainChunk();

    let index = 0;
    for (let dx = -TERRAIN_RADIUS; dx <= TERRAIN_RADIUS; dx++) {
      for (let dz = -TERRAIN_RADIUS; dz <= TERRAIN_RADIUS; dz++) {
        terrainChunks[index++].position.set(
          (centerX + dx) * CHUNK_SIZE,
          0,
          (centerZ + dz) * CHUNK_SIZE
        );
      }
    }
  }

  updateTerrainAround(0, 0);
  const colliders = [];
  const interiorColliders = [];
  const houseEntrances = [];
  const houseInteriors = [];
  const bots = [];
  const lakes = [];

  const natureChunks = new Map();

  function seededRandom(seed) {
    let x = seed | 0;
    return function() {
      x = Math.imul(x ^ (x >>> 15), 1 | x);
      x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  function distanceToSegment(px,pz,x1,z1,x2,z2) {
    const dx=x2-x1,dz=z2-z1,len2=dx*dx+dz*dz;
    const t=len2?Math.max(0,Math.min(1,((px-x1)*dx+(pz-z1)*dz)/len2)):0;
    return Math.hypot(px-(x1+t*dx),pz-(z1+t*dz));
  }

  function nearTown(x,z) {
    return [[0,0],[900,350],[-850,700],[1100,-900],[-1200,-700]].some(([tx,tz])=>Math.hypot(x-tx,z-tz)<105);
  }

  function nearHighway(x,z) {
    const r=[[0,0,900,350],[0,0,-850,700],[0,0,1100,-900],[0,0,-1200,-700],[900,350,-850,700],[900,350,1100,-900],[-850,700,-1200,-700],[1100,-900,-1200,-700]];
    return r.some(v=>distanceToSegment(x,z,v[0],v[1],v[2],v[3])<18);
  }

  function generateNatureChunk(cx,cz) {
    const key=cx+","+cz;
    if(natureChunks.has(key)) return;
    natureChunks.set(key,true);
    const rand=seededRandom((cx*92837111)^(cz*689287499));
    for(let i=0;i<24;i++){
      const x=cx*CHUNK_SIZE+(rand()-0.5)*CHUNK_SIZE;
      const z=cz*CHUNK_SIZE+(rand()-0.5)*CHUNK_SIZE;
      if(nearTown(x,z)||nearHighway(x,z)) continue;
      const roll=rand();
      if(roll<0.72) makeTree(x,z,0.7+rand()*0.9);
      else if(roll<0.9) makeTree(x,z,0.45+rand()*0.5);
      else makeTree(x,z,1.3+rand()*0.8);
    }
  }

  function updateNatureAround(x,z) {
    const cx=Math.floor(x/CHUNK_SIZE),cz=Math.floor(z/CHUNK_SIZE);
    for(let dx=-1;dx<=1;dx++) for(let dz=-1;dz<=1;dz++) generateNatureChunk(cx+dx,cz+dz);
  }

  updateNatureAround(0,0);

  // Lakes.
  function makeLake(x,z,w,d){ return GameModels.makeLake(T,scene,x,z,w,d); }

  function addCollider(x, z, halfX, halfZ) {
    colliders.push({ x, z, halfX, halfZ });
  }

  function circleHitsCollider(x, z, radius, box) {
    const closestX = Math.max(box.x - box.halfX, Math.min(x, box.x + box.halfX));
    const closestZ = Math.max(box.z - box.halfZ, Math.min(z, box.z + box.halfZ));
    const dx = x - closestX;
    const dz = z - closestZ;
    return dx * dx + dz * dz < radius * radius;
  }

  function canMoveTo(x, z, radius) {
    const active = insideHouse ? interiorColliders : colliders;
    return !active.some(box => circleHitsCollider(x, z, radius, box));
  }

  function tryMove(object, dx, dz, radius) {
    const nx = object.position.x + dx;
    const nz = object.position.z + dz;
    let moved = false;
    if (canMoveTo(nx, object.position.z, radius)) {
      object.position.x = nx;
      moved = true;
    }
    if (canMoveTo(object.position.x, nz, radius)) {
      object.position.z = nz;
      moved = true;
    }
    return moved;
  }

  function makeHouse(x,z,width,depth,color){ return GameModels.makeHouse(T,scene,addCollider,interiorColliders,houseEntrances,houseInteriors,x,z,width,depth,color); }

  function makeTree(x,z,scale=1){ return GameModels.makeTree(T,scene,addCollider,x,z,scale); }

  function makeBot(x,z,shirtColor){ return GameModels.makeBot(T,scene,bots,x,z,shirtColor); }

  function buildTown(offsetX, offsetZ) {
    const roadMat = new T.MeshBasicMaterial({ color: 0x777777 });

    const road1 = new T.Mesh(new T.BoxGeometry(18, 0.03, 90), roadMat);
    road1.position.set(offsetX, 0.015, offsetZ);
    scene.add(road1);

    const road2 = new T.Mesh(new T.BoxGeometry(90, 0.03, 18), roadMat);
    road2.position.set(offsetX, 0.02, offsetZ);
    scene.add(road2);

    makeHouse(offsetX - 30, offsetZ - 30, 10, 10, 0xd6a36a);
    makeHouse(offsetX + 30, offsetZ - 30, 12, 9, 0xc97b63);
    makeHouse(offsetX - 30, offsetZ + 30, 11, 10, 0x9ccf8b);
    makeHouse(offsetX + 30, offsetZ + 30, 10, 12, 0xe0c477);
    makeHouse(offsetX - 45, offsetZ, 9, 12, 0xb8a1d9);
    makeHouse(offsetX + 45, offsetZ, 9, 12, 0xd28b8b);

    const treeSpots = [
      [-15,-38,1], [15,-38,1.1], [-15,38,1], [15,38,1.15],
      [-42,-18,0.9], [42,-18,1], [-42,18,1], [42,18,0.9],
      [-10,-12,0.75], [12,-12,0.8], [-12,12,0.85], [12,12,0.75],
      [-55,-45,1.2], [55,-45,1.2], [-55,45,1.15], [55,45,1.2],
      [-70,-20,1], [70,-20,1], [-70,20,1.1], [70,20,1]
    ];
    treeSpots.forEach(([x,z,s]) => makeTree(offsetX + x, offsetZ + z, s));

    makeBot(offsetX - 8, offsetZ - 8, 0xf1c40f);
    makeBot(offsetX + 8, offsetZ - 8, 0x9b59b6);
    makeBot(offsetX - 8, offsetZ + 8, 0x2ecc71);
    makeBot(offsetX + 8, offsetZ + 8, 0xe67e22);
    makeBot(offsetX - 38, offsetZ + 12, 0x3498db);
    makeBot(offsetX + 38, offsetZ - 12, 0xe74c3c);

    makeLake(offsetX - 62, offsetZ, 14, 9);
    makeLake(offsetX + 62, offsetZ, 12, 8);
  }

  function makePlane(){ return GameModels.makePlane(T); }

  function makeCar(){ return GameModels.makeCar(T); }

  function makePlayer(){ return GameModels.makePlayer(T); }

  buildTown(0, 0);
  buildTown(900, 350);
  buildTown(-850, 700);
  buildTown(1100, -900);
  buildTown(-1200, -700);

  // Long highways connecting every town.
  function makeHighway(x1, z1, x2, z2, width = 12) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.hypot(dx, dz);
    const road = new T.Mesh(
      new T.BoxGeometry(width, 0.035, length),
      new T.MeshBasicMaterial({ color: 0x777777 })
    );
    road.position.set((x1 + x2) / 2, 0.025, (z1 + z2) / 2);
    road.rotation.y = Math.atan2(dx, dz);
    scene.add(road);

    // Center markings.
    const line = new T.Mesh(
      new T.BoxGeometry(0.35, 0.045, length),
      new T.MeshBasicMaterial({ color: 0xf5d742 })
    );
    line.position.set(road.position.x, 0.047, road.position.z);
    line.rotation.y = road.rotation.y;
    scene.add(line);
  }

  const townPoints = [
    [0, 0],
    [900, 350],
    [-850, 700],
    [1100, -900],
    [-1200, -700]
  ];

  // Connect towns in a continuous network.
  makeHighway(0, 0, 900, 350);
  makeHighway(0, 0, -850, 700);
  makeHighway(0, 0, 1100, -900);
  makeHighway(0, 0, -1200, -700);
  makeHighway(900, 350, -850, 700);
  makeHighway(900, 350, 1100, -900);
  makeHighway(-850, 700, -1200, -700);
  makeHighway(1100, -900, -1200, -700);

  const car = makeCar();
  car.position.set(3, 0, 0);
  scene.add(car);

  const planeVehicle = makePlane();
  planeVehicle.position.set(0, 1.2, 20);
  planeVehicle.rotation.y = Math.PI;
  scene.add(planeVehicle);

  const player = makePlayer();
  player.position.set(-2, 0, 0);
  scene.add(player);

  let inCar = false;
  let insideHouse = null;
  let inPlane = false;
  let planeSpeed = 0;
  let planePitch = 0;
  let verticalVelocity = 0;
  let grounded = true;
  let speed = 0;

  function toggleNearestHouse() {
    if (insideHouse) {
      const h = insideHouse.entrance;
      insideHouse.interior.visible = false;
      insideHouse.exterior.visible = true;
      player.position.set(h.x, 0, h.z);
      insideHouse = null;
      sfx("door");
      return true;
    }

    for (const h of houseEntrances) {
      if (Math.hypot(player.position.x - h.x, player.position.z - h.z) < 2.2) {
        const hi = houseInteriors.find(v => v.entrance === h);
        if (hi) {
          hi.interior.visible = true;
          hi.exterior.visible = false;
          player.position.set(h.insideX, 0, h.insideZ);
          verticalVelocity = 0;
          grounded = true;
          insideHouse = hi;
          sfx("door");
          return true;
        }
      }
    }
    return false;
  }
  let heading = 0;
  const keys = {};
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  }

  function sfx(type) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === "enter") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);
    } else if (type === "exit") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);
    } else if (type === "bump") {
      osc.type = "square";
      osc.frequency.setValueAtTime(90, now);
    } else if (type === "jump") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(360, now + 0.1);
    } else if (type === "door") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.start(now);
    osc.stop(now + 0.2);
  }
  let camYaw = 0.7;
  let camPitch = 0.48;
  let camDistance = 11;
  let dragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

  addEventListener("pointerdown", initAudio, { once: true });
  addEventListener("keydown", initAudio, { once: true });
  renderer.domElement.style.cursor = "grab";
  renderer.domElement.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    dragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    renderer.domElement.setPointerCapture(e.pointerId);
    renderer.domElement.style.cursor = "grabbing";
  });
  renderer.domElement.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    camYaw -= dx * 0.008;
    camPitch -= dy * 0.006;
    camPitch = Math.max(0.12, Math.min(1.35, camPitch));
  });
  renderer.domElement.addEventListener("pointerup", () => {
    dragging = false;
    renderer.domElement.style.cursor = "grab";
  });
  renderer.domElement.addEventListener("pointercancel", () => {
    dragging = false;
    renderer.domElement.style.cursor = "grab";
  });
  renderer.domElement.addEventListener("wheel", (e) => {
    e.preventDefault();
    camDistance *= Math.exp(e.deltaY * 0.001);
    camDistance = Math.max(3, Math.min(35, camDistance));
  }, { passive: false });

  addEventListener("keydown", (e) => {
    keys[e.code] = true;

    if (["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) {
      e.preventDefault();
    }

    if (e.code === "Space" && !inCar && !insideHouse && grounded) {
      verticalVelocity = 8;
      grounded = false;
      sfx("jump");
      return;
    }

    if (e.code === "KeyE" && inPlane) {
      inPlane = false;
      player.visible = true;
      player.position.set(planeVehicle.position.x + 2, Math.max(0, planeVehicle.position.y - 1), planeVehicle.position.z);
      sfx("exit");
      return;
    }

    if (e.code === "KeyE" && !inCar && !insideHouse && Math.hypot(player.position.x - planeVehicle.position.x, player.position.z - planeVehicle.position.z) < 5) {
      inPlane = true;
      updateTerrainAround(inPlane ? planeVehicle.position.x : (inCar ? car.position.x : player.position.x), inPlane ? planeVehicle.position.z : (inCar ? car.position.z : player.position.z));

    if (inPlane) {        planeVehicle.position.set(player.position.x, 0.6, player.position.z);
        player.visible = false;
        planeSpeed = 0;
        sfx("enter");
      } else {
        player.visible = true;
        player.position.set(planeVehicle.position.x, Math.max(0, planeVehicle.position.y - 1), planeVehicle.position.z);
        sfx("exit");
      }
      return;
    }

    if (e.code === "KeyE" && !inCar && tryEnterHouse()) return;

    if (e.code === "KeyE") {
      const dx = player.position.x - car.position.x;
      const dz = player.position.z - car.position.z;
      if (inCar || Math.hypot(dx, dz) < 4) {
        inCar = !inCar;
        if (inCar) {
          player.visible = false;
          speed = 0;
          sfx("enter");
        } else {
          player.visible = true;
          sfx("exit");
          player.position.set(
            car.position.x + Math.cos(heading) * 3,
            0,
            car.position.z - Math.sin(heading) * 3
          );
        }
      }
    }
  });

  addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });

  function updateBots(dt) {
    for (const bot of bots) {
      bot.timer -= dt;
      if (bot.timer <= 0 || bot.object.position.distanceTo(bot.target) < 0.8) {
        bot.timer = 1.5 + Math.random() * 3;
        bot.target.set(
          bot.object.position.x + (Math.random() - 0.5) * 18,
          0,
          bot.object.position.z + (Math.random() - 0.5) * 18
        );
      }

      const dx = bot.target.x - bot.object.position.x;
      const dz = bot.target.z - bot.object.position.z;
      const len = Math.hypot(dx, dz);
      if (len > 0.1) {
        const mx = dx / len * 2.2 * dt;
        const mz = dz / len * 2.2 * dt;
        if (tryMove(bot.object, mx, mz, 0.55)) {
          bot.object.rotation.y = Math.atan2(mx, mz);
        } else {
          bot.timer = 0;
        }
      }
    }
  }

  function tryEnterHouse() {
    return toggleNearestHouse();
  }

  function update(dt) {
    if (inPlane) {
      const throttle = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
      const turn = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
      const climb = (keys.ShiftLeft || keys.ShiftRight ? 1 : 0) - (keys.Space ? 1 : 0);

      if (throttle > 0) planeSpeed += 18 * dt;
      else if (throttle < 0) planeSpeed -= 12 * dt;
      else planeSpeed *= Math.pow(0.25, dt);
      planeSpeed = Math.max(0, Math.min(65, planeSpeed));

      planeVehicle.rotation.y += turn * 1.4 * dt;
      planeVehicle.position.y += climb * 12 * dt;
      planeVehicle.position.y = Math.max(0.5, planeVehicle.position.y);
      planeVehicle.rotation.x = 0;

      const forward = new T.Vector3(0, 0, -1).applyEuler(planeVehicle.rotation).normalize();
      planeVehicle.position.addScaledVector(forward, planeSpeed * dt);
      planeVehicle.position.y = Math.max(0.5, planeVehicle.position.y);

      // Keep a huge rolling ground centered around whatever the plane is over.
      updateTerrainAround(planeVehicle.position.x, planeVehicle.position.z);
      updateNatureAround(planeVehicle.position.x, planeVehicle.position.z);

      updateCamera(planeVehicle);
      return;
    }

    if (!inCar) {
      // Gravity and jumping.
      if (!insideHouse) {
        verticalVelocity -= 22 * dt;
        player.position.y += verticalVelocity * dt;
        if (player.position.y <= 0) {
          player.position.y = 0;
          verticalVelocity = 0;
          grounded = true;
        } else {
          grounded = false;
        }
      }

      const x = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0);
      const z = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
      const length = Math.hypot(x, z) || 1;

      // Movement is relative to the camera's horizontal direction.
      const forward = new T.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new T.Vector3(forward.z, 0, -forward.x);

      const moveX = (right.x * x + forward.x * (-z)) / length;
      const moveZ = (right.z * x + forward.z * (-z)) / length;

      tryMove(player, moveX * 7 * dt, moveZ * 7 * dt, 0.55);

      if (x || z) player.rotation.y = Math.atan2(moveX, moveZ);

      updateTerrainAround(player.position.x, player.position.z);
      updateNatureAround(player.position.x, player.position.z);
      updateCamera(player);
      return;
    }

    const throttle = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
    const steer = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);

    // Car steering is also based on the camera's horizontal facing direction.
    const camForward = new T.Vector3();
    camera.getWorldDirection(camForward);
    camForward.y = 0;
    camForward.normalize();
    const camAngle = Math.atan2(camForward.x, camForward.z);

    if (throttle > 0) speed += 28 * dt;
    else if (throttle < 0) speed -= 32 * dt;
    else speed *= Math.pow(0.05, dt);

    speed = Math.max(-12, Math.min(45, speed));

    heading = camAngle + steer * 0.45 * (speed >= 0 ? 1 : -1);

    const moved = tryMove(car, Math.sin(heading) * speed * dt, Math.cos(heading) * speed * dt, 1.25);
    if (!moved) {
      if (Math.abs(speed) > 2) sfx("bump");
      speed *= -0.18;
    }
    car.rotation.y = heading;

    updateTerrainAround(car.position.x, car.position.z);
    updateNatureAround(car.position.x, car.position.z);
    updateCamera(car);
  }

  function updateCamera(targetObject) {
    const targetY = inPlane ? 0.5 : (inCar ? 0.8 : 1.0);
    const horizontal = Math.cos(camPitch) * camDistance;
    camera.position.set(
      targetObject.position.x + Math.sin(camYaw) * horizontal,
      targetObject.position.y + targetY + Math.sin(camPitch) * camDistance,
      targetObject.position.z + Math.cos(camYaw) * horizontal
    );
    camera.lookAt(
      targetObject.position.x,
      targetObject.position.y + targetY,
      targetObject.position.z
    );
  }


  // Single pizza shop: the only pizza location in the world.
  const pizzaShop = new T.Group();
  pizzaShop.position.set(0, 0, -55);
  scene.add(pizzaShop);

  const pizzaWall = new T.Mesh(
    new T.BoxGeometry(18, 7, 12),
    new T.MeshBasicMaterial({ color: 0xd85b3f })
  );
  pizzaWall.position.y = 3.5;
  pizzaShop.add(pizzaWall);

  const pizzaRoof = new T.Mesh(
    new T.ConeGeometry(12, 4, 4),
    new T.MeshBasicMaterial({ color: 0x8b2f25 })
  );
  pizzaRoof.position.y = 9;
  pizzaRoof.rotation.y = Math.PI / 4;
  pizzaShop.add(pizzaRoof);

  const pizzaSign = new T.Mesh(
    new T.BoxGeometry(10, 2.2, 0.3),
    new T.MeshBasicMaterial({ color: 0xffd34d })
  );
  pizzaSign.position.set(0, 6.5, 6.15);
  pizzaShop.add(pizzaSign);

  const oven = new T.Mesh(
    new T.BoxGeometry(4, 3, 3),
    new T.MeshBasicMaterial({ color: 0x444444 })
  );
  oven.position.set(-5, 1.5, 0);
  pizzaShop.add(oven);

  addCollider(0, -55, 9, 6);

  const pizzaArrow = document.createElement("div");
  pizzaArrow.style.cssText = "position:fixed;left:50%;top:18%;transform:translateX(-50%);font:bold 32px Arial;color:#fff;text-shadow:0 2px 6px #000;z-index:11;pointer-events:none;text-align:center;";
  document.body.appendChild(pizzaArrow);

  const pizzaMini = document.createElement("div");
  pizzaMini.style.cssText = "display:none;position:fixed;inset:0;background:rgba(18,12,8,.96);z-index:50;color:white;font-family:Arial;text-align:center;padding-top:7vh;";
  pizzaMini.innerHTML = "<h1>🍕 Pizza Kitchen</h1><p>Click the toppings in the right order, then hit COOK!</p>";
  const miniCanvas = document.createElement("canvas");
  miniCanvas.width = 700; miniCanvas.height = 420;
  miniCanvas.style.cssText = "max-width:90%;border:4px solid #f2c14e;border-radius:12px;background:#e8c08a;";
  pizzaMini.appendChild(miniCanvas);
  const cookBtn = document.createElement("button");
  cookBtn.textContent = "COOK PIZZA 🔥";
  cookBtn.style.cssText = "display:block;margin:18px auto;padding:14px 28px;font-size:20px;border:0;border-radius:10px;cursor:pointer;";
  pizzaMini.appendChild(cookBtn);
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "BACK";
  closeBtn.style.cssText = "padding:8px 18px;font-size:16px;";
  pizzaMini.appendChild(closeBtn);
  document.body.appendChild(pizzaMini);
  const mctx = miniCanvas.getContext("2d");
  const miniToppings = ["🍅 Tomato","🧀 Cheese","🥩 Pepperoni","🍄 Mushroom","🫒 Olives"];
  let selectedMini = [];

  const pizzaUI = document.createElement("div");
  pizzaUI.style.cssText = "position:fixed;left:14px;top:14px;padding:10px 14px;background:rgba(0,0,0,.72);color:white;font:14px Arial;line-height:1.5;border-radius:8px;z-index:10;max-width:330px;";
  pizzaUI.innerHTML = "<b>🍕 WORLD PIZZA</b><br>Go to the red pizza shop in your spawn town.<br><small>Press E near it to start an order.</small>";
  document.body.appendChild(pizzaUI);

  let pizzaOrder = null;
  let pizzaToppings = [];
  let pizzaReady = false;
  let pizzaMoney = 0;

  const pizzaToppingNames = ["Pepperoni", "Mushrooms", "Extra Cheese", "Olives", "Peppers"];
  const pizzaTowns = [
    ["Sunset Town", 900, 350],
    ["Pine Town", -850, 700],
    ["Desert Town", 1100, -900],
    ["Lake Town", -1200, -700]
  ];

  function nearPizzaShop() {
    return Math.hypot(player.position.x, player.position.z + 55) < 10;
  }

  function nearPizzaTown() {
    if (!pizzaOrder) return false;
    return Math.hypot(player.position.x - pizzaOrder.x, player.position.z - pizzaOrder.z) < 90;
  }

  function updatePizzaUI() {
    if (!pizzaOrder) {
      pizzaUI.innerHTML = "<b>🍕 WORLD PIZZA</b><br>Only one pizza shop exists on Earth.<br>Go to the red shop in the spawn town.<br><small>E = start an order</small>";
      return;
    }
    pizzaUI.innerHTML =
      "<b>🍕 PIZZA DELIVERY</b><br>" +
      "Deliver to: <b>" + pizzaOrder.name + "</b><br>" +
      "Toppings: " + (pizzaToppings.length ? pizzaToppings.join(", ") : "none") + "<br>" +
      "Status: <b>" + (pizzaReady ? "READY TO DELIVER" : "COOK THE PIZZA") + "</b><br>" +
      "Money: $" + pizzaMoney + "<br><small>1-5 = toppings • F = cook • G = deliver</small>";
  }

  function startPizzaOrder() {
    const t = pizzaTowns[Math.floor(Math.random() * pizzaTowns.length)];
    pizzaOrder = { name: t[0], x: t[1], z: t[2] };
    pizzaToppings = [];
    pizzaReady = false;
    updatePizzaUI();
  }

  function addPizzaTopping(n) {
    if (!pizzaOrder || pizzaReady) return;
    const topping = pizzaToppingNames[n - 1];
    if (!pizzaToppings.includes(topping)) pizzaToppings.push(topping);
    updatePizzaUI();
  }

  function showCookingGame() {
    if (!pizzaOrder || pizzaReady || !nearPizzaShop()) return;
    pizzaMini.style.display = "block";
    selectedMini = [];
    drawCookingGame();
  }

  function drawCookingGame() {
    mctx.clearRect(0,0,700,420);
    mctx.fillStyle="#d9a066"; mctx.fillRect(0,0,700,420);
    mctx.fillStyle="#f5deb3"; mctx.beginPath(); mctx.arc(350,220,125,0,Math.PI*2); mctx.fill();
    mctx.strokeStyle="#b86b35"; mctx.lineWidth=8; mctx.stroke();
    mctx.font="28px Arial"; mctx.fillStyle="#222"; mctx.fillText("Build your pizza",250,45);
    miniToppings.forEach((t,i)=>{
      const x=25+i*135;
      mctx.fillStyle="#fff"; mctx.fillRect(x,335,120,55);
      mctx.fillStyle="#222"; mctx.font="16px Arial"; mctx.fillText(t.split(" ")[0],x+12,368);
    });
    selectedMini.forEach((t,i)=>{
      mctx.font="32px Arial";
      mctx.fillText(["🍅","🧀","🥩","🍄","🫒"][t],300+(i%4)*32,190+Math.floor(i/4)*32);
    });
  }

  miniCanvas.addEventListener("click", e => {
    if (pizzaMini.style.display === "none") return;
    const r=miniCanvas.getBoundingClientRect();
    const x=(e.clientX-r.left)*(700/r.width);
    const y=(e.clientY-r.top)*(420/r.height);
    if(y>325){
      const i=Math.floor(x/135);
      if(i>=0&&i<miniToppings.length&&!selectedMini.includes(i)){
        selectedMini.push(i);
        drawCookingGame();
      }
    }
  });

  cookBtn.onclick=()=>{
    if(!selectedMini.length) return;
    pizzaToppings=selectedMini.map(i=>pizzaToppingNames[i]);
    pizzaReady=true;
    pizzaMini.style.display="none";
    updatePizzaUI();
    sfx("enter");
  };
  closeBtn.onclick=()=>pizzaMini.style.display="none";

  function cookPizza() {
    if (!pizzaOrder || !pizzaToppings.length || pizzaReady || !nearPizzaShop()) return;
    showCookingGame();
    pizzaReady = true;
    updatePizzaUI();
    sfx("enter");
  }

  function updatePizzaArrow() {
    if (!pizzaOrder) { pizzaArrow.textContent=""; return; }
    const targetX = pizzaReady ? pizzaOrder.x : 0;
    const targetZ = pizzaReady ? pizzaOrder.z : -55;
    const dx=targetX-player.position.x, dz=targetZ-player.position.z;
    const dist=Math.hypot(dx,dz);
    const angle=Math.atan2(dx,dz);
    const deg=((angle-camYaw)*180/Math.PI+360)%360;
    let dir="⬆️";
    if(deg>45&&deg<135) dir="➡️";
    else if(deg>=135&&deg<225) dir="⬇️";
    else if(deg>=225&&deg<315) dir="⬅️";
    pizzaArrow.innerHTML=dir+"<div style='font-size:15px'>"+Math.round(dist)+"m — "+(pizzaReady ? pizzaOrder.name : "Pizza Shop")+"</div>";
  }

  function deliverPizza() {
    if (!pizzaOrder || !pizzaReady || !nearPizzaTown()) return;
    pizzaMoney += 100 + pizzaToppings.length * 20;
    pizzaOrder = null;
    pizzaToppings = [];
    pizzaReady = false;
    updatePizzaUI();
    sfx("exit");
  }

  addEventListener("keydown", e => {
    if (e.repeat) return;
    if (e.code === "Digit1") addPizzaTopping(1);
    if (e.code === "Digit2") addPizzaTopping(2);
    if (e.code === "Digit3") addPizzaTopping(3);
    if (e.code === "Digit4") addPizzaTopping(4);
    if (e.code === "Digit5") addPizzaTopping(5);
    if (e.code === "KeyF") cookPizza();
    if (e.code === "KeyG") deliverPizza();
    if (e.code === "KeyE" && nearPizzaShop() && !pizzaOrder && !inCar && !inPlane && !insideHouse) startPizzaOrder();
  });

  updatePizzaUI();

  const clock = new T.Clock();

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    update(dt);
    updateBots(dt);
    renderer.render(scene, camera);
  });

  addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

} catch (e) {
  error.style.display = "block";
  error.style.whiteSpace = "pre-wrap";
  error.textContent = "GAME ERROR\n\n" + (e.stack || e);
}
})();