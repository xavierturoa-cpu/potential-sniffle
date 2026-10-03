(() => {
"use strict";

const error = document.getElementById("error");

try {
  if (!window.THREE) throw new Error("Three.js failed to load.");
  const T = window.THREE;

  const scene = new T.Scene();
  scene.background = new T.Color(0x79bff2);
  scene.fog = new T.Fog(0x79bff2, 90, 260);

  const camera = new T.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 700);
  camera.position.set(8, 7, 10);

  const renderer = new T.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  document.body.appendChild(renderer.domElement);

  const sun = new T.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-80, 120, 60);
  scene.add(sun);
  scene.add(new T.HemisphereLight(0xbfe9ff, 0x35502f, 1.2));

  // A huge spherical world gives the map a visible round horizon.
  const worldSphere = new T.Mesh(
    new T.SphereGeometry(145, 64, 32),
    new T.MeshBasicMaterial({ color: 0x4d963f })
  );
  worldSphere.position.set(0, -145, 0);
  scene.add(worldSphere);

  // Flat town surface tangent to the spherical world.
  const ground = new T.Mesh(
    new T.PlaneGeometry(210, 210),
    new T.MeshLambertMaterial({ color: 0x4d963f })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Atmospheric sky dome.
  const sky = new T.Mesh(
    new T.SphereGeometry(330, 32, 16),
    new T.MeshBasicMaterial({ color: 0x8fd3ff, side: T.BackSide, fog: false })
  );
  scene.add(sky);

  // Sun and moon.
  const sunBall = new T.Mesh(
    new T.SphereGeometry(6, 24, 16),
    new T.MeshBasicMaterial({ color: 0xfff1a8 })
  );
  sunBall.position.set(-120, 120, -170);
  scene.add(sunBall);

  const moonBall = new T.Mesh(
    new T.SphereGeometry(4.5, 24, 16),
    new T.MeshBasicMaterial({ color: 0xe8ecff })
  );
  moonBall.position.set(120, 90, -150);
  scene.add(moonBall);

  // Lakes.
  function makeLake(x, z, w, d) {
    const lake = new T.Mesh(
      new T.CircleGeometry(1, 32),
      new T.MeshBasicMaterial({ color: 0x3c9fd8 })
    );
    lake.scale.set(w, d, 1);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(x, 0.035, z);
    scene.add(lake);
  }

  // World collision boxes. Buildings and trees register solid rectangles here.
  const colliders = [];
  const interiorColliders = [];
  const houseEntrances = [];
  const houseInteriors = [];
  const bots = [];
  const lakes = [];

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
    if (Math.abs(x) > 102 - radius || Math.abs(z) > 102 - radius) return false;
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

  function makeHouse(x, z, width, depth, color) {
    const house = new T.Group();
    const base = new T.Mesh(
      new T.BoxGeometry(width, 3.2, depth),
      new T.MeshBasicMaterial({ color })
    );
    base.position.y = 1.6;
    house.add(base);

    const roof = new T.Mesh(
      new T.ConeGeometry(Math.max(width, depth) * 0.72, 2.2, 4),
      new T.MeshBasicMaterial({ color: 0x8b3a2e })
    );
    roof.position.y = 4.3;
    roof.rotation.y = Math.PI / 4;
    house.add(roof);

    // Door and windows are visual only; the whole building is solid.
    const door = new T.Mesh(new T.BoxGeometry(0.8, 1.5, 0.08), new T.MeshBasicMaterial({ color: 0x5a321f }));
    door.position.set(0, 0.75, depth / 2 + 0.05);
    house.add(door);
    for (const wx of [-width * 0.27, width * 0.27]) {
      const win = new T.Mesh(new T.BoxGeometry(0.75, 0.75, 0.08), new T.MeshBasicMaterial({ color: 0x8ed8ff }));
      win.position.set(wx, 1.9, depth / 2 + 0.05);
      house.add(win);
    }

    house.position.set(x, 0, z);
    scene.add(house);

    // Simple furnished interior, hidden until the player enters the house.
    const interior = new T.Group();
    const floor = new T.Mesh(
      new T.BoxGeometry(width - 0.5, 0.12, depth - 0.5),
      new T.MeshBasicMaterial({ color: 0x9b7653 })
    );
    floor.position.y = 0.06;
    interior.add(floor);

    const backWall = new T.Mesh(
      new T.BoxGeometry(width - 0.5, 3.0, 0.15),
      new T.MeshBasicMaterial({ color: 0xf0e4d0 })
    );
    backWall.position.set(0, 1.5, -(depth / 2 - 0.25));
    interior.add(backWall);

    const couch = new T.Mesh(
      new T.BoxGeometry(Math.min(3.2, width - 2), 0.8, 0.9),
      new T.MeshBasicMaterial({ color: 0x4d6fa8 })
    );
    couch.position.set(0, 0.4, -1.2);
    interior.add(couch);

    const table = new T.Mesh(
      new T.BoxGeometry(1.6, 0.15, 1.0),
      new T.MeshBasicMaterial({ color: 0x6b4423 })
    );
    table.position.set(0, 0.8, 0.4);
    interior.add(table);

    const bed = new T.Mesh(
      new T.BoxGeometry(Math.min(2.4, width - 2), 0.45, 1.7),
      new T.MeshBasicMaterial({ color: 0xb7d7f0 })
    );
    bed.position.set(width / 2 - 1.3, 0.23, depth / 2 - 1.5);
    interior.add(bed);

    interior.position.set(x, 0, z);
    interior.visible = false;
    scene.add(interior);

    // Exterior wall collision with a real doorway gap.
    const gap = 1.15;
    const sideWidth = Math.max(0.5, width / 2 - gap / 2);
    addCollider(x - (gap / 2 + sideWidth / 2), z, sideWidth / 2, depth / 2 + 0.15);
    addCollider(x + (gap / 2 + sideWidth / 2), z, sideWidth / 2, depth / 2 + 0.15);

    const entrance = { x, z: z + depth / 2 + 1.5, insideX: x, insideZ: z + depth / 2 - 2.2, width, depth };
    houseEntrances.push(entrance);
    houseInteriors.push({ interior, entrance });

    // Furniture collision while inside.
    interiorColliders.push(
      { x, z: z - depth / 2 + 0.4, halfX: width / 2 - 0.3, halfZ: 0.25 },
      { x, z: z + 1.2, halfX: Math.min(1.7, width / 2 - 1), halfZ: 0.55 },
      { x: x + width / 2 - 1.3, z: z + depth / 2 - 1.5, halfX: 1.2, halfZ: 0.85 }
    );
  }

  function makeTree(x, z, scale = 1) {
    const tree = new T.Group();
    const trunk = new T.Mesh(
      new T.CylinderGeometry(0.35 * scale, 0.45 * scale, 2.4 * scale, 8),
      new T.MeshBasicMaterial({ color: 0x6b4423 })
    );
    trunk.position.y = 1.2 * scale;
    tree.add(trunk);
    const crown = new T.Mesh(
      new T.SphereGeometry(1.45 * scale, 12, 10),
      new T.MeshBasicMaterial({ color: 0x238b45 })
    );
    crown.position.y = 2.9 * scale;
    tree.add(crown);
    tree.position.set(x, 0, z);
    scene.add(tree);
    addCollider(x, z, 0.75 * scale, 0.75 * scale);
  }

  function makeBot(x, z, shirtColor) {
    const bot = new T.Group();
    const legs = new T.Mesh(new T.BoxGeometry(0.55, 0.9, 0.38), new T.MeshBasicMaterial({ color: 0x333344 }));
    legs.position.y = 0.45;
    bot.add(legs);
    const shirt = new T.Mesh(new T.BoxGeometry(0.85, 1, 0.52), new T.MeshBasicMaterial({ color: shirtColor }));
    shirt.position.y = 1.35;
    bot.add(shirt);
    const head = new T.Mesh(new T.SphereGeometry(0.35, 12, 10), new T.MeshBasicMaterial({ color: 0xf0b27a }));
    head.position.y = 2.1;
    bot.add(head);

    bot.position.set(x, 0, z);
    scene.add(bot);
    bots.push({ object: bot, target: new T.Vector3(x, 0, z), timer: 0 });
  }

  function buildTown() {

    // Small town square / streets.
    const roadMat = new T.MeshBasicMaterial({ color: 0x777777 });
    const road1 = new T.Mesh(new T.BoxGeometry(18, 0.03, 90), roadMat);
    road1.position.y = 0.015;
    scene.add(road1);
    const road2 = new T.Mesh(new T.BoxGeometry(90, 0.03, 18), roadMat);
    road2.position.y = 0.02;
    scene.add(road2);

    makeHouse(-30, -30, 10, 10, 0xd6a36a);
    makeHouse(30, -30, 12, 9, 0xc97b63);
    makeHouse(-30, 30, 11, 10, 0x9ccf8b);
    makeHouse(30, 30, 10, 12, 0xe0c477);
    makeHouse(-45, 0, 9, 12, 0xb8a1d9);
    makeHouse(45, 0, 9, 12, 0xd28b8b);

    const treeSpots = [
      [-15,-38,1], [15,-38,1.1], [-15,38,1], [15,38,1.15],
      [-42,-18,0.9], [42,-18,1], [-42,18,1], [42,18,0.9],
      [-10,-12,0.75], [12,-12,0.8], [-12,12,0.85], [12,12,0.75],
      [-55,-45,1.2], [55,-45,1.2], [-55,45,1.15], [55,45,1.2],
      [-70,-20,1], [70,-20,1], [-70,20,1.1], [70,20,1]
    ];
    treeSpots.forEach(([x,z,s]) => makeTree(x,z,s));

    makeBot(-8, -8, 0xf1c40f);
    makeBot(8, -8, 0x9b59b6);
    makeBot(-8, 8, 0x2ecc71);
    makeBot(8, 8, 0xe67e22);
    makeBot(-38, 12, 0x3498db);
    makeBot(38, -12, 0xe74c3c);

    makeLake(-62, 0, 14, 9);
    makeLake(62, 0, 12, 8);
  }

  function makePlane() {
    const plane = new T.Group();

    const fuselage = new T.Mesh(
      new T.BoxGeometry(1.2, 0.8, 4.8),
      new T.MeshBasicMaterial({ color: 0xf1f1f1 })
    );
    fuselage.position.y = 0.2;
    plane.add(fuselage);

    const wings = new T.Mesh(
      new T.BoxGeometry(7, 0.16, 1.1),
      new T.MeshBasicMaterial({ color: 0xdddddd })
    );
    wings.position.y = 0.35;
    plane.add(wings);

    const tail = new T.Mesh(
      new T.BoxGeometry(0.18, 1.1, 1),
      new T.MeshBasicMaterial({ color: 0xe53935 })
    );
    tail.position.set(0, 0.75, 1.7);
    plane.add(tail);

    const prop = new T.Mesh(
      new T.BoxGeometry(0.12, 2.2, 0.12),
      new T.MeshBasicMaterial({ color: 0x222222 })
    );
    prop.position.set(0, 0.2, -2.5);
    plane.add(prop);

    return plane;
  }

  function makeCar() {
    const car = new T.Group();

    const body = new T.Mesh(
      new T.BoxGeometry(2.4, 0.7, 4.2),
      new T.MeshBasicMaterial({ color: 0xe53935 })
    );
    body.position.y = 0.7;
    car.add(body);

    const cabin = new T.Mesh(
      new T.BoxGeometry(1.6, 0.75, 1.8),
      new T.MeshBasicMaterial({ color: 0x9ed9ef })
    );
    cabin.position.set(0, 1.25, -0.2);
    car.add(cabin);

    for (const x of [-1.25, 1.25]) {
      for (const z of [-1.35, 1.35]) {
        const wheel = new T.Mesh(
          new T.CylinderGeometry(0.38, 0.38, 0.3, 16),
          new T.MeshBasicMaterial({ color: 0x111111 })
        );
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, 0.38, z);
        car.add(wheel);
      }
    }

    return car;
  }

  function makePlayer() {
    const player = new T.Group();

    const legs = new T.Mesh(
      new T.BoxGeometry(0.5, 0.9, 0.35),
      new T.MeshBasicMaterial({ color: 0x222244 })
    );
    legs.position.y = 0.45;
    player.add(legs);

    const shirt = new T.Mesh(
      new T.BoxGeometry(0.8, 1, 0.5),
      new T.MeshBasicMaterial({ color: 0x246bce })
    );
    shirt.position.y = 1.35;
    player.add(shirt);

    const head = new T.Mesh(
      new T.SphereGeometry(0.34, 16, 12),
      new T.MeshBasicMaterial({ color: 0xf0b27a })
    );
    head.position.y = 2.1;
    player.add(head);

    // Simple smiley face on the front of the head so forward is obvious.
    const face = new T.Group();
    face.position.set(0, 2.1, 0.31);

    const eyeMat = new T.MeshBasicMaterial({ color: 0x111111 });
    for (const x of [-0.11, 0.11]) {
      const eye = new T.Mesh(new T.SphereGeometry(0.045, 8, 8), eyeMat);
      eye.position.set(x, 0.08, 0);
      face.add(eye);
    }

    const smile = new T.Mesh(
      new T.TorusGeometry(0.11, 0.025, 6, 16, Math.PI),
      eyeMat
    );
    smile.rotation.z = Math.PI;
    smile.position.set(0, -0.07, 0);
    face.add(smile);
    player.add(face);

    return player;
  }

  buildTown();

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

    if (e.code === "KeyE" && !inCar && !insideHouse && Math.hypot(player.position.x - planeVehicle.position.x, player.position.z - planeVehicle.position.z) < 5) {
      inPlane = !inPlane;
      if (inPlane) {
        planeVehicle.position.set(player.position.x, Math.max(1.5, player.position.y + 0.8), player.position.z);
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
          Math.max(-85, Math.min(85, bot.object.position.x + (Math.random() - 0.5) * 18)),
          0,
          Math.max(-85, Math.min(85, bot.object.position.z + (Math.random() - 0.5) * 18))
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
      const climb = (keys.Space ? 1 : 0) - (keys.ShiftLeft || keys.ShiftRight ? 1 : 0);

      if (throttle > 0) planeSpeed += 18 * dt;
      else if (throttle < 0) planeSpeed -= 12 * dt;
      else planeSpeed *= Math.pow(0.25, dt);
      planeSpeed = Math.max(0, Math.min(65, planeSpeed));

      planeVehicle.rotation.y += turn * 1.4 * dt;
      planePitch += climb * 0.8 * dt;
      planePitch *= Math.pow(0.35, dt);
      planePitch = Math.max(-0.55, Math.min(0.55, planePitch));

      const forward = new T.Vector3(0, 0, -1).applyEuler(planeVehicle.rotation).normalize();
      planeVehicle.position.addScaledVector(forward, planeSpeed * dt);
      planeVehicle.position.y = Math.max(1.5, Math.min(110, planeVehicle.position.y));
      planeVehicle.position.x = Math.max(-100, Math.min(100, planeVehicle.position.x));
      planeVehicle.position.z = Math.max(-100, Math.min(100, planeVehicle.position.z));

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