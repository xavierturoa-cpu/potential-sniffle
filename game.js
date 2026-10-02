(() => {
"use strict";

const error = document.getElementById("error");
try {
  if (!window.THREE) throw new Error("Three.js failed to load.");

  const T = THREE;
  const scene = new T.Scene();
  scene.background = new T.Color(0x78b7e8);

  const camera = new T.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 2000);
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

  const road = new T.Mesh(new T.PlaneGeometry(18, 2400), roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.z = -1100;
  scene.add(road);

  const grass = new T.Mesh(new T.PlaneGeometry(220, 2400), grassMat);
  grass.rotation.x = -Math.PI / 2;
  grass.position.y = -0.08;
  grass.position.z = -1100;
  scene.add(grass);

  for (const x of [-8.8, 8.8]) {
    const edge = new T.Mesh(new T.BoxGeometry(0.16, 0.04, 2400), yellowMat);
    edge.position.set(x, 0.04, -1100);
    scene.add(edge);
  }

  const center = [];
  for (let z = 20; z > -2400; z -= 14) {
    const m = new T.Mesh(new T.BoxGeometry(0.12, 0.035, 6), whiteMat);
    m.position.set(0, 0.03, z);
    scene.add(m);
    center.push(m);
  }

  function makeCar(color, scale = 1) {
    const g = new T.Group();
    const body = new T.Mesh(new T.BoxGeometry(2.25, 0.65, 4.2), new T.MeshLambertMaterial({ color }));
    body.position.y = 0.65;
    g.add(body);
    const cabin = new T.Mesh(new T.BoxGeometry(1.5, 0.65, 1.9), new T.MeshLambertMaterial({ color: 0x9ccce0 }));
    cabin.position.y = 1.25;
    g.add(cabin);
    for (const x of [-1.15, 1.15]) {
      for (const z of [-1.45, 1.45]) {
        const wheel = new T.Mesh(new T.CylinderGeometry(0.36, 0.36, 0.25, 12), new T.MeshLambertMaterial({ color: 0x111111 }));
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

  const traffic = [];
  const trafficColors = [0xffffff, 0x4488dd, 0xffaa22, 0x44aa66];

  function spawnTraffic(z) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const car = makeCar(trafficColors[Math.floor(Math.random() * trafficColors.length)], Math.random() < 0.2 ? 1.25 : 1);
    car.position.set(side < 0 ? -4.5 : 4.5, 0, z);
    car.userData.dir = side;
    car.userData.speed = 70 + Math.random() * 35;
    scene.add(car);
    traffic.push(car);
  }

  for (let i = 0; i < 8; i++) spawnTraffic(-120 - i * 120);

  const trees = [];
  for (let i = 0; i < 80; i++) {
    for (const side of [-1, 1]) {
      const g = new T.Group();
      const trunk = new T.Mesh(new T.CylinderGeometry(0.15, 0.22, 2.2, 8), new T.MeshLambertMaterial({ color: 0x70452b }));
      trunk.position.y = 1.1;
      const crown = new T.Mesh(new T.ConeGeometry(1.3, 3.2, 8), new T.MeshLambertMaterial({ color: 0x28733a }));
      crown.position.y = 3;
      g.add(trunk, crown);
      g.position.set(side * (18 + Math.random() * 18), 0, -i * 30 - 30);
      scene.add(g);
      trees.push(g);
    }
  }

  const signs = [];
  function addSpeedSign(z, limit) {
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

    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, 512, 512);

    // Australian-style red-ring speed sign
    ctx.beginPath();
    ctx.arc(256, 256, 205, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = 32;
    ctx.strokeStyle = "#d71920";
    ctx.stroke();

    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 190px Arial";
    ctx.fillText(String(limit), 256, 265);

    const texture = new T.CanvasTexture(canvas);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const face = new T.Mesh(
      new T.PlaneGeometry(2.7, 2.7),
      new T.MeshBasicMaterial({ map: texture, side: T.DoubleSide })
    );
    face.position.set(0, 4.25, -0.08);
    g.add(face);

    g.position.set(11.5, 0, z);
    g.userData.limit = limit;
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

  const keys = {};
  addEventListener("keydown", e => {
    keys[e.code] = true;
    if (["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) e.preventDefault();
    if (e.code === "KeyV") cameraMode = 1 - cameraMode;
    if (e.code === "KeyR") reset();
  });
  addEventListener("keyup", e => keys[e.code] = false);

  let speed = 100;
  let distance = 0;
  let playerX = 4.5;
  let cameraMode = 0;
  let limit = 100;
  let crashed = false;
  let crashTimer = 0;
  let spawnTimer = 0;
  let audioCtx = null;
  let engine = null;
  let gain = null;

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
    player.position.set(4.5, 0, 5);
    player.rotation.set(0, 0, 0);
    crashed = false;
    crashTimer = 0;
    for (const t of traffic) scene.remove(t);
    traffic.length = 0;
    for (let i = 0; i < 8; i++) spawnTraffic(-120 - i * 120);
  }

  function updateHud() {
    let hud = document.getElementById("gameHud");
    if (!hud) {
      hud = document.createElement("div");
      hud.id = "gameHud";
      hud.style.cssText = "position:fixed;left:20px;bottom:18px;color:white;font:700 22px Arial;text-shadow:2px 2px 5px #000;z-index:20;pointer-events:none;line-height:1.5";
      document.body.appendChild(hud);
    }
    hud.innerHTML = Math.round(speed) + " km/h<br>" + (distance / 1000).toFixed(2) + " km";
  }

  function gameLoop() {
    const dt = Math.min(clock.getDelta(), 0.05);

    audioStart();

    if (!crashed) {
      const steer = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
      playerX += steer * 8 * dt;
      playerX = Math.max(2.3, Math.min(7.2, playerX));
      player.position.x += (playerX - player.position.x) * Math.min(1, dt * 12);
      player.rotation.z = -steer * 0.08;

      if (keys.KeyW || keys.ArrowUp) speed += 140 * dt;
      else speed -= 1.5 * dt;
      if (keys.KeyS || keys.ArrowDown) speed -= 180 * dt;
      speed = Math.max(0, speed);
    } else {
      crashTimer -= dt;
      speed = Math.max(0, speed - 120 * dt);
      player.rotation.z += 6 * dt;
      if (crashTimer <= 0) reset();
    }

    const playerMove = speed * dt * 0.35;

    for (const m of center) {
      m.position.z += playerMove;
      if (m.position.z > 30) m.position.z -= 2400;
    }

    for (const tree of trees) {
      tree.position.z += playerMove;
      if (tree.position.z > 50) tree.position.z -= 2400;
    }

    for (const s of signs) {
      s.position.z += playerMove;
      if (s.position.z > 60) {
        s.position.z -= 1800;
        limit = s.userData.limit;
      }
    }

    for (const t of traffic) {
      const relative = playerMove + (t.userData.dir > 0 ? t.userData.speed : -t.userData.speed) * dt;
      t.position.z += relative;
      if (t.position.z > 80) t.position.z -= 2200;
      if (t.position.z < -2200) t.position.z += 2200;

      if (!crashed && Math.abs(t.position.z - player.position.z) < 3 && Math.abs(t.position.x - player.position.x) < 2) {
        crashed = true;
        crashTimer = 1.5;
        speed = 0;
      }
    }

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnTraffic(-800 - Math.random() * 900);
      spawnTimer = 1.5 + Math.random() * 2;
    }

    distance += speed * dt / 3.6;

    if (cameraMode === 0) {
      camera.position.x += (player.position.x * 0.45 - camera.position.x) * Math.min(1, dt * 6);
      camera.position.y = 6;
      camera.position.z = 15;
      camera.lookAt(player.position.x, 0.7, -80);
    } else {
      camera.position.set(player.position.x, 1.35, 3);
      camera.lookAt(player.position.x, 1.25, -100);
    }

    if (engine && gain) {
      engine.frequency.setTargetAtTime(60 + speed * 0.7, audioCtx.currentTime, 0.03);
      gain.gain.setTargetAtTime(0.015 + Math.min(speed / 1200, 0.06), audioCtx.currentTime, 0.05);
    }

    updateHud();
    renderer.render(scene, camera);
  }

  const clock = new T.Clock();
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