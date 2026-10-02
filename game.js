(() => {
"use strict";

const error = document.getElementById("error");

try {
  if (!window.THREE) throw new Error("Three.js failed to load.");
  const T = THREE;

  const scene = new T.Scene();
  scene.background = new T.Color(0x78b7e8);
  scene.fog = new T.Fog(0x78b7e8, 180, 900);

  const camera = new T.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 2500);
  const renderer = new T.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  document.body.appendChild(renderer.domElement);

  scene.add(new T.HemisphereLight(0xffffff, 0x446633, 1.8));
  const sun = new T.DirectionalLight(0xffffff, 2);
  sun.position.set(50, 100, 30);
  scene.add(sun);

  const roadMat = new T.MeshLambertMaterial({ color: 0x333333 });
  const grassMat = new T.MeshLambertMaterial({ color: 0x4f8d48 });
  const whiteMat = new T.MeshLambertMaterial({ color: 0xffffff });
  const yellowMat = new T.MeshLambertMaterial({ color: 0xf5c400 });
  const darkMat = new T.MeshLambertMaterial({ color: 0x222222 });

  // Endless world pieces
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
    const body = new T.Mesh(
      new T.BoxGeometry(2.25, 0.65, 4.2),
      new T.MeshLambertMaterial({ color })
    );
    body.position.y = 0.65;
    g.add(body);

    const cabin = new T.Mesh(
      new T.BoxGeometry(1.5, 0.65, 1.9),
      new T.MeshLambertMaterial({ color: 0x9ccce0 })
    );
    cabin.position.y = 1.25;
    g.add(cabin);

    for (const x of [-1.15, 1.15]) {
      for (const z of [-1.45, 1.45]) {
        const wheel = new T.Mesh(
          new T.CylinderGeometry(0.36, 0.36, 0.25, 12),
          darkMat
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.35, z);
        g.add(wheel);
      }
    }

    g.scale.setScalar(scale);
    return g;
  }

  const player = makeCar(0xdd3333);
  player.position.set(4.5, 0, 5);
  scene.add(player);

  // Towns and roadside buildings
  const towns = [];
  function addTown(z, name) {
    const town = new T.Group();
    town.userData.name = name;

    const signCanvas = document.createElement("canvas");
    signCanvas.width = 768;
    signCanvas.height = 256;
    const ctx = signCanvas.getContext("2d");
    ctx.fillStyle = "#164f9c";
    ctx.fillRect(0, 0, 768, 256);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 100px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, 384, 128);

    const sign = new T.Mesh(
      new T.PlaneGeometry(8, 2.7),
      new T.MeshBasicMaterial({ map: new T.CanvasTexture(signCanvas), side: T.DoubleSide })
    );
    sign.position.set(11.5, 4.5, 0);
    town.add(sign);

    for (let i = 0; i < 5; i++) {
      const building = new T.Mesh(
        new T.BoxGeometry(4 + Math.random() * 2, 3 + Math.random() * 3, 5),
        new T.MeshLambertMaterial({ color: [0xd8c19f, 0xb96e4b, 0xaaaaaa, 0xe0d5bd][i % 4] })
      );
      building.position.set(-17 - i * 7, building.geometry.parameters.height / 2, 18 + i * 10);
      town.add(building);

      const roof = new T.Mesh(
        new T.ConeGeometry(3.2, 1.4, 4),
        new T.MeshLambertMaterial({ color: 0x8b3f2f })
      );
      roof.rotation.y = Math.PI / 4;
      roof.position.set(building.position.x, building.position.y + building.geometry.parameters.height / 2 + 0.7, building.position.z);
      town.add(roof);
    }

    town.position.z = z;
    scene.add(town);
    towns.push(town);
  }

  addTown(-1400, "RIVERDALE");
  addTown(-2850, "PINE CREEK");
  addTown(-4300, "OUTBACK");
  addTown(-5750, "SUNSET");

  // Curves and hills are represented by gently moving roadside objects and road sections.
  const terrain = [];
  for (let i = 0; i < 150; i++) {
    for (const side of [-1, 1]) {
      const g = new T.Group();
      const trunk = new T.Mesh(
        new T.CylinderGeometry(0.15, 0.22, 2.2, 8),
        new T.MeshLambertMaterial({ color: 0x70452b })
      );
      trunk.position.y = 1.1;
      const crown = new T.Mesh(
        new T.ConeGeometry(1.3, 3.2, 8),
        new T.MeshLambertMaterial({ color: 0x28733a })
      );
      crown.position.y = 3;
      g.add(trunk, crown);
      g.position.set(side * (18 + Math.random() * 18), 0, -i * 38 - 30);
      scene.add(g);
      terrain.push(g);
    }
  }

  // Traffic
  const traffic = [];
  const trafficColors = [0xffffff, 0x4488dd, 0xffaa22, 0x44aa66, 0xcc3333, 0x777777];

  function spawnTraffic(z, lane = null) {
    const side = lane ?? (Math.random() < 0.5 ? -1 : 1);
    const car = makeCar(
      trafficColors[Math.floor(Math.random() * trafficColors.length)],
      Math.random() < 0.2 ? 1.25 : 1
    );
    car.position.set(side < 0 ? -4.5 : 4.5, 0, z);
    car.userData.dir = side;
    car.userData.speed = 70 + Math.random() * 35;
    car.userData.lane = side;
    scene.add(car);
    traffic.push(car);
  }

  for (let i = 0; i < 12; i++) spawnTraffic(-150 - i * 170);

  // Overtaking / passing lanes
  const passingLanes = [];
  for (let i = 0; i < 6; i++) {
    const z = -700 - i * 1100;
    const lane = new T.Mesh(
      new T.BoxGeometry(7.5, 0.035, 220),
      roadMat
    );
    lane.position.set(-3.75, 0.015, z);
    scene.add(lane);
    passingLanes.push(lane);

    for (let x = -7.5; x < 0; x += 7.5) {
      const line = new T.Mesh(new T.BoxGeometry(0.12, 0.04, 220), whiteMat);
      line.position.set(x, 0.04, z);
      scene.add(line);
    }
  }

  // Speed signs
  const signs = [];
  function addSpeedSign(z, value) {
    const g = new T.Group();
    const pole = new T.Mesh(
      new T.CylinderGeometry(0.07, 0.07, 4.6, 8),
      new T.MeshLambertMaterial({ color: 0x777777 })
    );
    pole.position.y = 2.3;
    g.add(pole);

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 512, 512);
    ctx.beginPath();
    ctx.arc(256, 256, 205, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.lineWidth = 32;
    ctx.strokeStyle = "#d71920";
    ctx.stroke();
    ctx.fillStyle = "#111";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 190px Arial";
    ctx.fillText(String(value), 256, 265);

    const face = new T.Mesh(
      new T.PlaneGeometry(2.7, 2.7),
      new T.MeshBasicMaterial({ map: new T.CanvasTexture(canvas), side: T.DoubleSide })
    );
    face.position.set(0, 4.25, -0.08);
    g.add(face);
    g.position.set(11.5, 0, z);
    g.userData.limit = value;
    scene.add(g);
    signs.push(g);
  }

  addSpeedSign(-220, 100);
  addSpeedSign(-520, 110);
  addSpeedSign(-820, 90);
  addSpeedSign(-1120, 100);
  addSpeedSign(-1420, 120);
  addSpeedSign(-1720, 100);
  addSpeedSign(-2020, 110);
  addSpeedSign(-2420, 100);
  addSpeedSign(-3020, 80);
  addSpeedSign(-3600, 110);
  addSpeedSign(-4400, 100);
  addSpeedSign(-5200, 80);

  // Town / exit signs
  const exits = [];
  function addExit(z, label) {
    const g = new T.Group();
    const board = new T.Mesh(
      new T.BoxGeometry(6.5, 2.1, 0.18),
      new T.MeshLambertMaterial({ color: 0x176b35 })
    );
    board.position.y = 4.4;
    g.add(board);

    const pole1 = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 4.3, 8), new T.MeshLambertMaterial({ color: 0x777777 }));
    pole1.position.set(-2.3, 2.1, 0);
    const pole2 = pole1.clone();
    pole2.position.x = 2.3;
    g.add(pole1, pole2);

    const c = document.createElement("canvas");
    c.width = 650; c.height = 210;
    const x = c.getContext("2d");
    x.fillStyle = "#176b35"; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = "#fff"; x.font = "bold 58px Arial"; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillText(label, c.width / 2, c.height / 2);
    board.material = new T.MeshBasicMaterial({ map: new T.CanvasTexture(c) });

    g.position.set(11.2, 0, z);
    scene.add(g);
    exits.push(g);
  }

  addExit(-1350, "RIVERDALE EXIT");
  addExit(-2800, "PINE CREEK EXIT");
  addExit(-4250, "OUTBACK EXIT");
  addExit(-5700, "SUNSET EXIT");

  // Police cars
  const police = [];
  function spawnPolice(z) {
    const p = makeCar(0xffffff, 1);
    p.position.set(4.5, 0, z);
    const lightBar = new T.Mesh(
      new T.BoxGeometry(0.9, 0.18, 0.35),
      new T.MeshLambertMaterial({ color: 0x2244ff })
    );
    lightBar.position.y = 1.65;
    p.add(lightBar);
    p.userData.speed = 120;
    p.userData.active = false;
    scene.add(p);
    police.push(p);
  }
  spawnPolice(-1800);

  // Controls / state
  const keys = {};
  let speed = 100;
  let distance = 0;
  let playerX = 4.5;
  let cameraMode = 0;
  let limit = 100;
  let crashed = false;
  let crashTimer = 0;
  let spawnTimer = 0;
  let policeTimer = 0;
  let paused = false;
  let audioCtx = null;
  let engine = null;
  let gain = null;
  let clock = new T.Clock();

  addEventListener("keydown", e => {
    keys[e.code] = true;
    if (["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) e.preventDefault();
    if (e.code === "KeyV") cameraMode = 1 - cameraMode;
    if (e.code === "KeyR") reset();
    if (e.code === "Escape" || e.code === "KeyP") {
      paused = !paused;
      document.getElementById("pauseScreen").style.display = paused ? "flex" : "none";
    }
  });
  addEventListener("keyup", e => keys[e.code] = false);

  function audioStart() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      engine = audioCtx.createOscillator();
      gain = audioCtx.createGain();
      engine.type = "sawtooth";
      gain.gain.value = 0.02;
      engine.connect(gain).connect(audioCtx.destination);
      engine.start();
    } catch (_) {}
  }

  function reset() {
    speed = 100;
    distance = 0;
    playerX = 4.5;
    limit = 100;
    crashed = false;
    crashTimer = 0;
    policeTimer = 0;
    player.position.set(4.5, 0, 5);
    player.rotation.set(0, 0, 0);
    for (const t of traffic) scene.remove(t);
    traffic.length = 0;
    for (let i = 0; i < 12; i++) spawnTraffic(-150 - i * 170);
    for (const p of police) p.position.z = -1800;
  }

  function updateHud() {
    let hud = document.getElementById("gameHud");
    if (!hud) {
      hud = document.createElement("div");
      hud.id = "gameHud";
      hud.style.cssText =
        "position:fixed;left:20px;bottom:18px;color:white;font:700 21px Arial;text-shadow:2px 2px 5px #000;z-index:20;pointer-events:none;line-height:1.45";
      document.body.appendChild(hud);
    }
    const warning = speed > limit ? "  ⚠ SPEEDING" : "";
    hud.innerHTML =
      Math.round(speed) + " km/h" + warning +
      "<br>Limit: " + limit + " km/h" +
      "<br>" + (distance / 1000).toFixed(2) + " km";
  }

  // Pause overlay
  const pause = document.createElement("div");
  pause.id = "pauseScreen";
  pause.style.cssText =
    "display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);color:#fff;z-index:50;align-items:center;justify-content:center;flex-direction:column;font:700 34px Arial;text-align:center";
  pause.innerHTML = "PAUSED<div style='font-size:18px;margin-top:12px'>Press P or Esc to continue</div>";
  document.body.appendChild(pause);

  // First-person dashboard
  const dashboard = document.createElement("div");
  dashboard.id = "dashboard";
  dashboard.style.cssText =
    "display:none;position:fixed;left:50%;bottom:0;transform:translateX(-50%);width:70%;height:85px;background:linear-gradient(#111,#050505);border-radius:40px 40px 0 0;z-index:15;pointer-events:none;box-shadow:0 -8px 30px #000";
  dashboard.innerHTML =
    "<div style='position:absolute;left:50%;top:25px;transform:translateX(-50%);color:#ddd;font:700 15px Arial'>AUSSIE HIGHWAY</div>";
  document.body.appendChild(dashboard);

  function gameLoop() {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (paused) {
      renderer.render(scene, camera);
      return;
    }

    audioStart();

    if (!crashed) {
      const steer =
        (keys.KeyD || keys.ArrowRight ? 1 : 0) -
        (keys.KeyA || keys.ArrowLeft ? 1 : 0);

      playerX += steer * 8 * dt;
      playerX = Math.max(2.3, Math.min(7.2, playerX));
      player.position.x += (playerX - player.position.x) * Math.min(1, dt * 12);
      player.rotation.z = -steer * 0.08;

      if (keys.KeyW || keys.ArrowUp) speed += 140 * dt;
      else speed -= 1.5 * dt;
      if (keys.KeyS || keys.ArrowDown) speed -= 180 * dt;
      speed = Math.max(0, speed);

      // Gentle steering-based road curve illusion.
      const curve = Math.sin(distance / 380) * 0.35;
      player.rotation.y += (curve * 0.015 - player.rotation.y) * dt * 2;
    } else {
      crashTimer -= dt;
      speed = Math.max(0, speed - 120 * dt);
      player.rotation.z += 6 * dt;
      if (crashTimer <= 0) reset();
    }

    const playerMove = speed * dt * 0.35;

    const allRoadObjects = [...roadPieces, ...grassPieces, ...edgeLines, ...centerLines];
    for (const obj of allRoadObjects) {
      obj.position.z += playerMove;
      if (obj.position.z > 100) obj.position.z -= roadLength * roadCount;
    }

    for (const tree of terrain) {
      tree.position.z += playerMove;
      if (tree.position.z > 100) tree.position.z -= 150 * 38;
    }

    for (const town of towns) {
      town.position.z += playerMove;
      if (town.position.z > 150) town.position.z -= 7200;
    }

    for (const sign of signs) {
      sign.position.z += playerMove;
      if (sign.position.z > 100) {
        sign.position.z -= 6000;
        limit = sign.userData.limit;
      }
    }

    for (const exit of exits) {
      exit.position.z += playerMove;
      if (exit.position.z > 100) exit.position.z -= 7200;
    }

    for (const lane of passingLanes) {
      lane.position.z += playerMove;
      if (lane.position.z > 100) lane.position.z -= 6600;
    }

    for (const t of traffic) {
      const relative =
        playerMove +
        (t.userData.dir > 0 ? t.userData.speed : -t.userData.speed) * dt;
      t.position.z += relative;

      if (t.position.z > 100) t.position.z -= 3000;
      if (t.position.z < -3000) t.position.z += 3000;

      if (
        !crashed &&
        Math.abs(t.position.z - player.position.z) < 3 &&
        Math.abs(t.position.x - player.position.x) < 2
      ) {
        crashed = true;
        crashTimer = 1.5;
        speed = 0;
      }
    }

    // Speeding enforcement: after sustained speeding, police start chasing.
    if (speed > limit + 15) policeTimer += dt;
    else policeTimer = Math.max(0, policeTimer - dt * 2);

    if (policeTimer > 4) {
      for (const p of police) p.userData.active = true;
    }

    for (const p of police) {
      if (p.userData.active) {
        p.position.z += playerMove + p.userData.speed * dt * 0.25;
        if (p.position.z > player.position.z + 15) p.position.z = player.position.z - 180;
        if (Math.abs(p.position.z - player.position.z) < 5 && speed > limit + 15) {
          speed = Math.max(0, speed - 80 * dt);
        }
      } else {
        p.position.z += playerMove;
      }
    }

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnTraffic(-900 - Math.random() * 1600);
      spawnTimer = 1.2 + Math.random() * 2;
    }

    distance += speed * dt / 3.6;

    if (cameraMode === 0) {
      camera.position.x +=
        (player.position.x * 0.45 - camera.position.x) * Math.min(1, dt * 6);
      camera.position.y = 6;
      camera.position.z = 15;
      camera.lookAt(player.position.x, 0.7, -80);
      dashboard.style.display = "none";
    } else {
      camera.position.set(player.position.x, 1.35, 3);
      camera.lookAt(player.position.x, 1.25, -100);
      dashboard.style.display = "block";
    }

    if (engine && gain) {
      engine.frequency.setTargetAtTime(
        60 + speed * 0.7,
        audioCtx.currentTime,
        0.03
      );
      gain.gain.setTargetAtTime(
        0.015 + Math.min(speed / 1200, 0.06),
        audioCtx.currentTime,
        0.05
      );
    }

    updateHud();
    renderer.render(scene, camera);
  }

  reset();
  renderer.setAnimationLoop(gameLoop);

  addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
} catch (e) {
  if (error) {
    error.style.display = "block";
    error.textContent = "GAME ERROR\n\n" + (e.stack || e);
  }
}
})();