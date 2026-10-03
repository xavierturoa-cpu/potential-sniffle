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

      player.position.x += moveX * 7 * dt;
      player.position.z += moveZ * 7 * dt;

      if (x || z) player.rotation.y = Math.atan2(moveX, moveZ);

      updateCamera(player);
      return;
    }

    const throttle = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
    const steer = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0);

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

    car.position.x += Math.sin(heading) * speed * dt;
    car.position.z += Math.cos(heading) * speed * dt;
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