(() => {
"use strict";

window.GameModels = {
  makeLake(T, scene, x, z, w, d) {
    const lake = new T.Mesh(
      new T.CircleGeometry(1, 32),
      new T.MeshBasicMaterial({ color: 0x3c9fd8 })
    );
    lake.scale.set(w, d, 1);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(x, 0.035, z);
    scene.add(lake);
    return lake;
  },

  makeTree(T, scene, addCollider, x, z, scale = 1) {
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
    return tree;
  },

  makeBot(T, scene, bots, x, z, shirtColor) {
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
    return bot;
  },

  makeHouse(T, scene, addCollider, interiorColliders, houseEntrances, houseInteriors, x, z, width, depth, color) {
    const house = new T.Group();
    const base = new T.Mesh(new T.BoxGeometry(width, 3.2, depth), new T.MeshBasicMaterial({ color }));
    base.position.y = 1.6;
    house.add(base);

    const roof = new T.Mesh(
      new T.ConeGeometry(Math.max(width, depth) * 0.72, 2.2, 4),
      new T.MeshBasicMaterial({ color: 0x8b3a2e })
    );
    roof.position.y = 4.3;
    roof.rotation.y = Math.PI / 4;
    house.add(roof);

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

    const interior = new T.Group();
    const floor = new T.Mesh(new T.BoxGeometry(width - 0.5, 0.12, depth - 0.5), new T.MeshBasicMaterial({ color: 0x9b7653 }));
    floor.position.y = 0.06;
    interior.add(floor);

    const backWall = new T.Mesh(new T.BoxGeometry(width - 0.5, 3.0, 0.15), new T.MeshBasicMaterial({ color: 0xf0e4d0 }));
    backWall.position.set(0, 1.5, -(depth / 2 - 0.25));
    interior.add(backWall);

    const couch = new T.Mesh(new T.BoxGeometry(Math.min(3.2, width - 2), 0.8, 0.9), new T.MeshBasicMaterial({ color: 0x4d6fa8 }));
    couch.position.set(0, 0.4, -1.2);
    interior.add(couch);

    const table = new T.Mesh(new T.BoxGeometry(1.6, 0.15, 1.0), new T.MeshBasicMaterial({ color: 0x6b4423 }));
    table.position.set(0, 0.8, 0.4);
    interior.add(table);

    const bed = new T.Mesh(new T.BoxGeometry(Math.min(2.4, width - 2), 0.45, 1.7), new T.MeshBasicMaterial({ color: 0xb7d7f0 }));
    bed.position.set(width / 2 - 1.3, 0.23, depth / 2 - 1.5);
    interior.add(bed);

    interior.position.set(x, 0, z);
    interior.visible = false;
    scene.add(interior);

    const gap = 1.15;
    const sideWidth = Math.max(0.5, width / 2 - gap / 2);
    addCollider(x - (gap / 2 + sideWidth / 2), z, sideWidth / 2, depth / 2 + 0.15);
    addCollider(x + (gap / 2 + sideWidth / 2), z, sideWidth / 2, depth / 2 + 0.15);

    const entrance = { x, z: z + depth / 2 + 1.5, insideX: x, insideZ: z + depth / 2 - 2.2, width, depth };
    houseEntrances.push(entrance);
    houseInteriors.push({ interior, entrance, exterior: house });

    interiorColliders.push(
      { x, z: z - depth / 2 + 0.4, halfX: width / 2 - 0.3, halfZ: 0.25 },
      { x, z: z + 1.2, halfX: Math.min(1.7, width / 2 - 1), halfZ: 0.55 },
      { x: x + width / 2 - 1.3, z: z + depth / 2 - 1.5, halfX: 1.2, halfZ: 0.85 }
    );
    return house;
  },

  makePlane(T) {
    const plane = new T.Group();
    const fuselage = new T.Mesh(new T.BoxGeometry(1.2, 0.8, 4.8), new T.MeshBasicMaterial({ color: 0xf1f1f1 }));
    fuselage.position.y = 0.2;
    plane.add(fuselage);
    const wings = new T.Mesh(new T.BoxGeometry(7, 0.16, 1.1), new T.MeshBasicMaterial({ color: 0xdddddd }));
    wings.position.y = 0.35;
    plane.add(wings);
    const tail = new T.Mesh(new T.BoxGeometry(0.18, 1.1, 1), new T.MeshBasicMaterial({ color: 0xe53935 }));
    tail.position.set(0, 0.75, 1.7);
    plane.add(tail);
    const prop = new T.Mesh(new T.BoxGeometry(0.12, 2.2, 0.12), new T.MeshBasicMaterial({ color: 0x222222 }));
    prop.position.set(0, 0.2, -2.5);
    plane.add(prop);
    return plane;
  },

  makeCar(T) {
    const car = new T.Group();
    const body = new T.Mesh(new T.BoxGeometry(2.4, 0.7, 4.2), new T.MeshBasicMaterial({ color: 0xe53935 }));
    body.position.y = 0.7;
    car.add(body);
    const cabin = new T.Mesh(new T.BoxGeometry(1.6, 0.75, 1.8), new T.MeshBasicMaterial({ color: 0x9ed9ef }));
    cabin.position.set(0, 1.25, -0.2);
    car.add(cabin);
    for (const x of [-1.25, 1.25]) for (const z of [-1.35, 1.35]) {
      const wheel = new T.Mesh(new T.CylinderGeometry(0.38, 0.38, 0.3, 16), new T.MeshBasicMaterial({ color: 0x111111 }));
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.38, z);
      car.add(wheel);
    }
    return car;
  },

  makePlayer(T) {
    const player = new T.Group();
    const legs = new T.Mesh(new T.BoxGeometry(0.5, 0.9, 0.35), new T.MeshBasicMaterial({ color: 0x222244 }));
    legs.position.y = 0.45;
    player.add(legs);
    const shirt = new T.Mesh(new T.BoxGeometry(0.8, 1, 0.5), new T.MeshBasicMaterial({ color: 0x246bce }));
    shirt.position.y = 1.35;
    player.add(shirt);
    const head = new T.Mesh(new T.SphereGeometry(0.34, 16, 12), new T.MeshBasicMaterial({ color: 0xf0b27a }));
    head.position.y = 2.1;
    player.add(head);

    const face = new T.Group();
    face.position.set(0, 2.1, 0.31);
    const eyeMat = new T.MeshBasicMaterial({ color: 0x111111 });
    for (const x of [-0.11, 0.11]) {
      const eye = new T.Mesh(new T.SphereGeometry(0.045, 8, 8), eyeMat);
      eye.position.set(x, 0.08, 0);
      face.add(eye);
    }
    const smile = new T.Mesh(new T.TorusGeometry(0.11, 0.025, 6, 16, Math.PI), eyeMat);
    smile.rotation.z = Math.PI;
    smile.position.set(0, -0.07, 0);
    face.add(smile);
    player.add(face);
    return player;
  }
};
})();