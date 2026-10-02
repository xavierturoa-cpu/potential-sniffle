(() => {
"use strict";
const error = document.getElementById("error");
const showError = e => { error.style.display="block"; error.textContent="GAME ERROR\\n\\n"+e; };
try {
  if(!window.THREE) throw new Error("Three.js did not load.");
  const T=THREE;

  const scene=new T.Scene();
  scene.background=new T.Color(0x66aee8);

  const camera=new T.PerspectiveCamera(65,innerWidth/innerHeight,.1,1000);
  camera.position.set(0,6,14);
  camera.lookAt(0,0,-60);

  const renderer=new T.WebGLRenderer({antialias:true});
  renderer.setSize(innerWidth,innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  document.body.appendChild(renderer.domElement);

  scene.add(new T.AmbientLight(0xffffff,1.5));
  const sun=new T.DirectionalLight(0xffffff,2);
  sun.position.set(20,50,20);
  scene.add(sun);

  const roadMat=new T.MeshLambertMaterial({color:0x333333});
  const grassMat=new T.MeshLambertMaterial({color:0x4c8a45});
  const whiteMat=new T.MeshLambertMaterial({color:0xffffff});
  const redMat=new T.MeshLambertMaterial({color:0xdd2222});
  const blackMat=new T.MeshLambertMaterial({color:0x111111});
  const greenMat=new T.MeshLambertMaterial({color:0x18733a});
  const brownMat=new T.MeshLambertMaterial({color:0x70452b});

  const grass=new T.Mesh(new T.PlaneGeometry(100,1000),grassMat);
  grass.rotation.x=-Math.PI/2;
  grass.position.set(0,-.15,-450);
  scene.add(grass);

  const road=new T.Mesh(new T.PlaneGeometry(18,1000),roadMat);
  road.rotation.x=-Math.PI/2;
  road.position.set(0,0,-450);
  scene.add(road);

  const lines=[];
  for(const x of [-3,3]) for(let i=0;i<70;i++){
    const m=new T.Mesh(new T.BoxGeometry(.12,.04,5),whiteMat);
    m.position.set(x,.03,10-i*14);
    scene.add(m);
    lines.push(m);
  }

  function makeTree(x,z){
    const g=new T.Group();
    const trunk=new T.Mesh(new T.CylinderGeometry(.15,.22,2,8),brownMat);
    trunk.position.y=1;
    const top=new T.Mesh(new T.ConeGeometry(1.2,3,8),greenMat);
    top.position.y=3;
    g.add(trunk,top);
    g.position.set(x,0,z);
    scene.add(g);
    return g;
  }
  const trees=[];
  for(let i=0;i<35;i++){
    trees.push(makeTree(-13,i*-25));
    trees.push(makeTree(13,i*-25-12));
  }

  function makeCar(color){
    const g=new T.Group();
    const body=new T.Mesh(new T.BoxGeometry(2.2,.65,4),new T.MeshLambertMaterial({color}));
    body.position.y=.65;
    const roof=new T.Mesh(new T.BoxGeometry(1.5,.65,1.8),new T.MeshLambertMaterial({color:0x8ec5df}));
    roof.position.y=1.25;
    g.add(body,roof);
    for(const x of [-1.15,1.15]) for(const z of [-1.35,1.35]){
      const w=new T.Mesh(new T.CylinderGeometry(.38,.38,.25,12),blackMat);
      w.rotation.z=Math.PI/2;
      w.position.set(x,.38,z);
      g.add(w);
    }
    return g;
  }

  const player=makeCar(0xdd3333);
  player.position.set(0,0,5);
  scene.add(player);

  const keys={};
  addEventListener("keydown",e=>{keys[e.code]=true;if(e.code==="KeyR")reset();});
  addEventListener("keyup",e=>keys[e.code]=false);

  let x=0,speed=65,distance=0,crashed=false,spawn=1;
  const traffic=[];

  function reset(){
    x=0;speed=65;distance=0;crashed=false;spawn=1;
    player.position.x=0;
    for(const t of traffic)scene.remove(t);
    traffic.length=0;
    
  }

  function addTraffic(){
    const lane=(Math.floor(Math.random()*3)-1)*3;
    const t=makeCar([0xffffff,0x4488dd,0xffaa22,0x44aa66][Math.floor(Math.random()*4)]);
    t.position.set(lane,0,-180-Math.random()*220);
    scene.add(t);
    traffic.push(t);
  }

  const clock=new T.Clock();

  function frame(){
    requestAnimationFrame(frame);
    const dt=Math.min(clock.getDelta(),.033);

    if(!crashed){
      const steer=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
      x+=steer*9*dt;
      x=Math.max(-7,Math.min(7,x));
      player.position.x+=(x-player.position.x)*Math.min(1,dt*12);
      player.rotation.z=-steer*.1;

      if(keys.KeyW||keys.ArrowUp)speed+=60*dt;else speed-=3*dt;
      if(keys.KeyS||keys.ArrowDown)speed-=70*dt;
      speed=Math.max(20,Math.min(160,speed));

      const move=speed*dt*.35;
      for(const l of lines){l.position.z+=move;if(l.position.z>25)l.position.z-=980;}
      for(const t of trees){t.position.z+=move;if(t.position.z>25)t.position.z-=875;}

      spawn-=dt;
      if(spawn<=0){addTraffic();spawn=1.2+Math.random()*1.2;}

      for(let i=traffic.length-1;i>=0;i--){
        const t=traffic[i];
        t.position.z+=move;
        if(t.position.z>30){scene.remove(t);traffic.splice(i,1);continue;}
        if(Math.abs(t.position.x-player.position.x)<1.8&&Math.abs(t.position.z-player.position.z)<3){
          crashed=true;
          
        }
      }

      distance+=speed*dt/3.6;
      
      
    }

    camera.position.x+=(player.position.x*.45-camera.position.x)*Math.min(1,dt*5);
    camera.position.y=6;
    camera.position.z=14;
    camera.lookAt(player.position.x,0,-70);
    renderer.render(scene,camera);
  }

  addEventListener("resize",()=>{
    camera.aspect=innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
  });

  reset();
  frame();
} catch(e) {
  showError(e.stack||String(e));
}
})();