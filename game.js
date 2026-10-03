(() => {
"use strict";

const error = document.getElementById("error");

try {
  if (!window.THREE) throw new Error("Three.js failed to load.");
  const T = window.THREE;

  const scene = new T.Scene();
  scene.background = new T.Color(0x87ceeb);

  const camera = new T.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 500);
  camera.position.set(8, 7, 10);

  const renderer = new T.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  document.body.appendChild(renderer.domElement);

  scene.add(new T.HemisphereLight(0xffffff, 0x557755, 2));

  // Just a simple plane.
  const plane = new T.Mesh(
    new T.PlaneGeometry(200, 200),
    new T.MeshBasicMaterial({ color: 0x4d963f })
  );
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);

  // World collision boxes. Buildings and trees register solid rectangles here.
  const colliders = [];
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
    if (Math.abs(x) > 98 - radius || Math.abs(z) > 98 - radius) return false;
    return !colliders.some(box => circleHitsCollider(x, z, radius, box));
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
    addCollider(x, z, width / 2 + 0.15, depth / 2 + 0.15);
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

  const player = makePlayer();
  player.position.set(-2, 0, 0);
  scene.add(player);

  let inCar = false;
  let speed = 0;
  let heading = 0;
  const keys = {};
  let camYaw = 0.7;
  let camPitch = 0.48;
  let camDistance = 11;
  let dragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

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

    if (e.code === "KeyE") {
      const dx = player.position.x - car.position.x;
      const dz = player.position.z - car.position.z;
      if (inCar || Math.hypot(dx, dz) < 4) {
        inCar = !inCar;
        if (inCar) {
          player.visible = false;
          speed = 0;
        } else {
          player.visible = true;
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

  function update(dt) {
    if (!inCar) {
      const x = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
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

    heading = camAngle - steer * 0.45 * (speed >= 0 ? 1 : -1);

    const moved = tryMove(car, Math.sin(heading) * speed * dt, Math.cos(heading) * speed * dt, 1.25);
    if (!moved) speed *= -0.18;
    car.rotation.y = heading;

    updateCamera(car);
  }

  function updateCamera(targetObject) {
    const targetY = inCar ? 0.8 : 1.0;
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