(() => {
"use strict";

const $ = id => document.getElementById(id);
const errorBox = $("error");
function showError(msg) {
  errorBox.style.display = "block";
  errorBox.textContent = "GAME ERROR\n\n" + msg;
}
window.addEventListener("error", e => showError(e.message || "Unknown error"));

if (!window.THREE) {
  showError("Three.js failed to load.");
  return;
}

try {
  const T = THREE;
  const scene = new T.Scene();
  scene.background = new T.Color(0x79a9d2);
  scene.fog = new T.Fog(0x79a9d2, 90, 430);

  const camera = new T.PerspectiveCamera(70, innerWidth / innerHeight, .1, 1000);
  const renderer = new T.WebGLRenderer({antialias:true});
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  scene.add(new T.HemisphereLight(0xffffff, 0x405040, 1.5));
  const sun = new T.DirectionalLight(0xffffff, 1.7);
  sun.position.set(-60,100,60);
  scene.add(sun);

  const mat = c => new T.MeshStandardMaterial({color:c, roughness:.82});
  const road = new T.Mesh(new T.BoxGeometry(18,.3,900), mat(0x303236));
  road.position.set(0,0,-420);
  scene.add(road);

  const grass = new T.Mesh(new T.BoxGeometry(70,.15,900), mat(0x4d7844));
  grass.position.set(0,-.18,-420);
  scene.add(grass);

  const laneLines=[];
  for(const x of [-3,3]){
    for(let i=0;i<75;i++){
      const line=new T.Mesh(new T.BoxGeometry(.13,.05,5),mat(0xf5f0d0));
      line.position.set(x,.18,8-i*12);
      scene.add(line);
      laneLines.push(line);
    }
  }

  const scenery=[];
  function tree(x,z){
    const g=new T.Group();
    const trunk=new T.Mesh(new T.CylinderGeometry(.16,.22,1.8,8),mat(0x70472d));
    trunk.position.y=.9;
    const crown=new T.Mesh(new T.ConeGeometry(1.15,3.2,8),mat(0x28613a));
    crown.position.y=2.8;
    g.add(trunk,crown);
    g.position.set(x,0,z);
    scene.add(g);
    scenery.push(g);
  }
  for(let i=0;i<45;i++){
    const z=5-i*20;
    tree(-13-Math.random()*8,z);
    tree(13+Math.random()*8,z-10);
  }

  function car(color){
    const g=new T.Group();
    const body=new T.Mesh(new T.BoxGeometry(2.2,.65,4),mat(color));
    body.position.y=.7;
    const cabin=new T.Mesh(new T.BoxGeometry(1.55,.7,1.7),mat(0x9db8c6));
    cabin.position.set(0,1.25,.1);
    g.add(body,cabin);
    for(const x of [-1.05,1.05]) for(const z of [-1.35,1.35]){
      const w=new T.Mesh(new T.CylinderGeometry(.38,.38,.3,12),mat(0x111111));
      w.rotation.z=Math.PI/2;
      w.position.set(x,.4,z);
      g.add(w);
    }
    g.traverse(o => {if(o.isMesh)o.castShadow=true;});
    return g;
  }

  const player=car(0xd83a3a);
  player.position.set(0,.2,4);
  scene.add(player);

  const traffic=[];
  const colors=[0xe9e9e9,0x4d78c4,0xe09b32,0x5c8b6a,0x87566a];

  function spawn(){
    const lane=(Math.floor(Math.random()*3)-1)*3;
    const c=car(colors[Math.floor(Math.random()*colors.length)]);
    c.scale.setScalar(.9);
    c.position.set(lane,.2,-180-Math.random()*180);
    scene.add(c);
    traffic.push({mesh:c,lane,speed:35+Math.random()*45});
  }

  const keys={};
  addEventListener("keydown",e=>{
    keys[e.code]=true;
    if(e.code==="KeyR") reset();
  });
  addEventListener("keyup",e=>keys[e.code]=false);

  let playerX=0;
  let speed=65;
  let distance=0;
  let spawnTimer=1;
  let crashed=false;

  function reset(){
    playerX=0;
    speed=65;
    distance=0;
    spawnTimer=1;
    crashed=false;
    player.position.x=0;
    player.rotation.set(0,0,0);
    for(const t of traffic) scene.remove(t.mesh);
    traffic.length=0;
    $("status").textContent="DRIVING";
  }

  function update(dt){
    if(crashed)return;

    const steer=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
    playerX += steer*9*dt;
    playerX = Math.max(-7,Math.min(7,playerX));

    if(keys.KeyW||keys.ArrowUp)speed+=55*dt;
    else speed-=4*dt;
    if(keys.KeyS||keys.ArrowDown)speed-=80*dt;
    speed=Math.max(20,Math.min(150,speed));

    player.position.x += (playerX-player.position.x)*Math.min(1,dt*12);
    player.rotation.z=-steer*.12;
    player.rotation.y=steer*.07;

    const move=speed*dt*.30;

    for(const line of laneLines){
      line.position.z+=move;
      if(line.position.z>25)line.position.z-=900;
    }

    for(const item of scenery){
      item.position.z+=move;
      if(item.position.z>25)item.position.z-=900;
    }

    for(let i=traffic.length-1;i>=0;i--){
      const t=traffic[i];
      t.mesh.position.z += move - t.speed*dt*.10;
      if(t.mesh.position.z>35){
        scene.remove(t.mesh);
        traffic.splice(i,1);
        continue;
      }
      t.mesh.position.x += (t.lane-t.mesh.position.x)*dt*2;
      if(Math.abs(t.mesh.position.x-player.position.x)<1.7 &&
         Math.abs(t.mesh.position.z-player.position.z)<3){
        crashed=true;
        $("status").textContent="CRASH — press R";
      }
    }

    distance+=speed*dt/3.6;
    spawnTimer-=dt;
    if(spawnTimer<=0){
      spawn();
      spawnTimer=1+Math.random()*1.3;
    }

    $("speed").textContent=Math.round(speed)+" km/h";
    $("distance").textContent=Math.floor(distance)+" m";
  }

  const clock=new T.Clock();

  function animate(){
    requestAnimationFrame(animate);
    const dt=Math.min(clock.getDelta(),.033);
    update(dt);

    camera.position.x += (player.position.x*.55-camera.position.x)*Math.min(1,dt*5);
    camera.position.y=5.2;
    camera.position.z=player.position.z+10;
    camera.lookAt(player.position.x,1,player.position.z-18);

    renderer.render(scene,camera);
  }

  addEventListener("resize",()=>{
    camera.aspect=innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
  });

  reset();
  animate();
} catch(err) {
  showError(err && err.stack ? err.stack : String(err));
}
})();