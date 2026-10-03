(() => {
  "use strict";
  const error = document.getElementById("error");
  try {
    if (!window.THREE) throw new Error("Three.js failed to load.");
    const T = THREE;

    const scene = new T.Scene();
    scene.background = new T.Color(0x72b7e8);
    scene.fog = new T.Fog(0x72b7e8, 160, 1200);

    const camera = new T.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 3000);
    const renderer = new T.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    document.body.appendChild(renderer.domElement);

    scene.add(new T.HemisphereLight(0xffffff, 0x446633, 2));
    scene.add(new T.AmbientLight(0xffffff, 1));
    const sun = new T.DirectionalLight(0xffffff, 1.8);
    sun.position.set(50, 100, 30);
    scene.add(sun);

    const roadMat = new T.MeshBasicMaterial({color:0x303030});
    const grassMat = new T.MeshBasicMaterial({color:0x4f9348});
    const white = new T.MeshBasicMaterial({color:0xffffff});
    const yellow = new T.MeshBasicMaterial({color:0xf2cf35});
    const dark = new T.MeshBasicMaterial({color:0x171717});
    const glass = new T.MeshBasicMaterial({color:0x8cc9dc, transparent:true, opacity:0.72});

    // Flat infinite highway.
    const roadParts = [], grassParts = [], markings = [];
    const SEG = 140, COUNT = 24;
    for (let i=0;i<COUNT;i++) {
      const z=-i*SEG;
      const road=new T.Mesh(new T.PlaneGeometry(18,SEG+2),roadMat); road.rotation.x=-Math.PI/2; road.position.z=z; scene.add(road); roadParts.push(road);
      const grass=new T.Mesh(new T.PlaneGeometry(220,SEG+2),grassMat); grass.rotation.x=-Math.PI/2; grass.position.y=-0.08; grass.position.z=z; scene.add(grass); grassParts.push(grass);
      for(const x of [-8.8,8.8]) { const e=new T.Mesh(new T.BoxGeometry(0.16,0.04,SEG),yellow); e.position.set(x,0.04,z); scene.add(e); markings.push(e); }
      const dash=new T.Mesh(new T.BoxGeometry(0.12,0.035,7),white); dash.position.set(0,0.03,z); scene.add(dash); markings.push(dash);
    }

    function makeCar(color, scale=1) {
      const g=new T.Group();
      const body=new T.Mesh(new T.BoxGeometry(2.25,0.65,4.2),new T.MeshBasicMaterial({color})); body.position.y=0.65; g.add(body);
      const hood=new T.Mesh(new T.BoxGeometry(2.05,0.25,1.35),new T.MeshBasicMaterial({color})); hood.position.set(0,1.0,1.15); g.add(hood);
      const cab=new T.Mesh(new T.BoxGeometry(1.55,0.7,1.9),glass); cab.position.set(0,1.25,-0.15); g.add(cab);
      for(const x of [-1.15,1.15]) for(const z of [-1.45,1.45]) { const w=new T.Mesh(new T.CylinderGeometry(0.36,0.36,0.28,14),dark); w.rotation.z=Math.PI/2; w.position.set(x,0.35,z); g.add(w); }
      const lights=new T.Mesh(new T.BoxGeometry(1.65,0.16,0.08),new T.MeshBasicMaterial({color:0xffeeee})); lights.position.set(0,0.75,2.12); g.add(lights);
      g.scale.setScalar(scale); return g;
    }

    const skins=[0xdd3333,0x222222,0xffffff,0x1677cc,0xff8a00,0x22aa55];
    let skinIndex=0;
    let modIndex=0;
    const mods=[
      {name:"Stock",power:1.00,handling:1.00},
      {name:"Sport",power:1.18,handling:1.12},
      {name:"Race",power:1.35,handling:1.22}
    ];
    const player=makeCar(skins[skinIndex]);
    player.position.set(-4.5,0,5);
    scene.add(player);

    // First-person interior: dashboard, wheel and windshield frame.
    const interior=new T.Group();
    const dash=new T.Mesh(new T.BoxGeometry(2.2,0.35,0.75),dark); dash.position.set(0,0.65,1.15); interior.add(dash);
    const wheel=new T.Mesh(new T.TorusGeometry(0.38,0.07,10,24),dark); wheel.position.set(0,0.82,0.72); wheel.rotation.x=Math.PI/2; interior.add(wheel);
    const pillarL=new T.Mesh(new T.BoxGeometry(0.09,1.5,0.1),dark); pillarL.position.set(-0.82,1.45,-0.05); interior.add(pillarL);
    const pillarR=pillarL.clone(); pillarR.position.x=0.82; interior.add(pillarR);
    interior.visible=false; player.add(interior);

    // Race bots. They are actual competitors, not ordinary traffic.
    const bots=[];
    const botColors=[0x1677cc,0xffffff,0xff8a00,0x22aa55,0x8b44cc];
    for(let i=0;i<5;i++) {
      const bot=makeCar(botColors[i]);
      bot.position.set(i%2?-4.5:4.5,0,-70-i*75);
      bot.userData.baseSpeed=92+i*4+Math.random()*8;
      bot.userData.progress=0;
      scene.add(bot); bots.push(bot);
    }

    // Towns remain part of the highway, but are visually simple race checkpoints.
    const towns=[];
    const townNames=["Riverdale","Pinecreek","Greenville","Cedarvale","Kingston","Rosewood"];
    function addTown(z,i){
      const g=new T.Group();
      for(let j=0;j<8;j++){
        const side=j%2?-1:1;
        const h=3+(j%3);
        const b=new T.Mesh(new T.BoxGeometry(4,h,5),new T.MeshBasicMaterial({color:[0xb96e4b,0xd8c19f,0xaaaaaa,0xc9d1d9][j%4]}));
        b.position.set(side*(13+(j%3)*3),h/2,-j*42); g.add(b);
      }
      const canvas=document.createElement("canvas"); canvas.width=700; canvas.height=180;
      const ctx=canvas.getContext("2d"); ctx.fillStyle="#16529a"; ctx.fillRect(0,0,700,180); ctx.fillStyle="#fff"; ctx.font="bold 72px Arial"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(townNames[i%townNames.length],350,90);
      const sign=new T.Mesh(new T.PlaneGeometry(7,1.8),new T.MeshBasicMaterial({map:new T.CanvasTexture(canvas),side:T.DoubleSide})); sign.position.set(11,4,-15); g.add(sign);
      g.position.z=z; scene.add(g); towns.push(g);
    }
    for(let i=0;i<6;i++) addTown(-1700-i*1500,i);

    const keys={};
    let speed=100, distance=0, playerX=-4.5, cameraMode=0, limit=100;
    let nitro=100, crashed=false, paused=false, raceTime=0;
    const clock=new T.Clock();

    addEventListener("keydown",e=>{
      keys[e.code]=true;
      if(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) e.preventDefault();
      if(e.code==="KeyV"){cameraMode=1-cameraMode; interior.visible=cameraMode===1;}
      if(e.code==="KeyC") keys.KeyC=!keys.KeyC;
      if(e.code==="KeyM"){modIndex=(modIndex+1)%mods.length;}
      if(e.code>="Digit1"&&e.code<="Digit6"){skinIndex=Number(e.code.slice(-1))-1; player.getObjectByName("body")?.material.color.setHex(skins[skinIndex]); player.traverse(o=>{if(o.isMesh&&o.geometry&&o.geometry.parameters&&o.geometry.parameters.width===2.25)o.material.color.setHex(skins[skinIndex]);});}
      if(e.code==="KeyR") reset();
      if(e.code==="Escape"||e.code==="KeyP"){paused=!paused;}
    });
    addEventListener("keyup",e=>keys[e.code]=false);

    function setPlayerSkin(){
      player.traverse(o=>{if(o.isMesh&&o.material&&o.material.color&&o!==wheel){ if(o.geometry&&o.geometry.parameters&&(o.geometry.parameters.width===2.25||o.geometry.parameters.width===2.05)) o.material.color.setHex(skins[skinIndex]); }});
    }
    function reset(){speed=100;distance=0;playerX=-4.5;nitro=100;crashed=false;raceTime=0;player.position.set(-4.5,0,5);bots.forEach((b,i)=>{b.position.set(i%2?-4.5:4.5,0,-70-i*75);b.userData.progress=0;});setPlayerSkin();}

    function updateHud(){
      let hud=document.getElementById("gameHud");
      if(!hud){hud=document.createElement("div");hud.id="gameHud";hud.style.cssText="position:fixed;left:18px;top:16px;color:#fff;font:700 18px Arial;text-shadow:2px 2px 4px #000;z-index:20;line-height:1.45;pointer-events:none";document.body.appendChild(hud);}
      const sorted=[{p:distance,id:"YOU"},...bots.map((b,i)=>({p:b.userData.progress,id:"BOT "+(i+1)}))].sort((a,b)=>b.p-a.p); const pos=sorted.findIndex(x=>x.id==="YOU")+1;
      const cruise=keys.KeyC?"ON":"OFF";
      hud.innerHTML=`<b>${Math.round(speed)} km/h</b> &nbsp; Limit ${limit}<br>Position: ${pos}/6 &nbsp; Race: ${raceTime.toFixed(1)}s<br>Distance: ${(distance/1000).toFixed(2)} km<br>Skin: ${skinIndex+1}/6 &nbsp; Mod: ${mods[modIndex].name}<br>Nitro: ${Math.round(nitro)}% &nbsp; Cruise: ${cruise}<br><small>WASD/Arrows drive • Shift nitro • V view • C cruise • M mod • 1-6 skins • P pause • R reset</small>`;
    }

    function gameLoop(){
      const dt=Math.min(clock.getDelta(),0.05);
      if(paused){renderer.render(scene,camera);return;}
      raceTime+=dt;
      const mod=mods[modIndex];
      const steer=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
      playerX+=steer*(8*mod.handling)*dt; playerX=Math.max(-7.2,Math.min(7.2,playerX)); player.position.x+=(playerX-player.position.x)*Math.min(1,dt*12); player.rotation.z=-steer*0.08;
      if(keys.ShiftLeft||keys.ShiftRight){if(nitro>0){speed+=220*dt;nitro=Math.max(0,nitro-32*dt);}} else nitro=Math.min(100,nitro+5*dt);
      if(keys.KeyC) speed+=(Math.min(120,speed)-speed)*Math.min(1,dt*3);
      else {if(keys.KeyW||keys.ArrowUp)speed+=140*mod.power*dt; else speed-=1.2*dt;if(keys.KeyS||keys.ArrowDown)speed-=190*dt;}
      speed=Math.max(0,Math.min(160,speed));
      const move=speed*dt*0.35;
      [...roadParts,...grassParts,...markings].forEach(o=>{o.position.z+=move;if(o.position.z>100)o.position.z-=SEG*COUNT;});
      towns.forEach(t=>{t.position.z+=move;if(t.position.z>120)t.position.z-=9000;});
      // Bots move relative to the player and fight for position.
      bots.forEach((b,i)=>{
        const target=b.userData.baseSpeed+(Math.sin(raceTime*0.7+i)*5);
        const rel=move+(target*dt*0.35);
        b.position.z+=rel; b.userData.progress+=target*dt/3.6;
        if(b.position.z>100){b.position.z-=2600;b.userData.progress+=2600;}
        if(b.position.z<-2600)b.position.z+=2600;
        if(Math.abs(b.position.z-player.position.z)<3.1&&Math.abs(b.position.x-player.position.x)<2.0){speed=Math.max(0,speed-70*dt);player.rotation.z+=steer*0.3;}
      });
      distance+=speed*dt/3.6;
      // Posted limits cycle on open highway; racing does not hard-cap the player.
      const segment=Math.floor(distance/900)%6; limit=[90,100,110,120,100,110][segment];
      if(cameraMode===0){camera.position.x+=(player.position.x*0.45-camera.position.x)*Math.min(1,dt*6);camera.position.y=5.5;camera.position.z=14;camera.lookAt(player.position.x,0.8,-90);}
      else {camera.position.set(player.position.x,1.45,3.0);camera.lookAt(player.position.x,1.35,-100);}
      updateHud(); renderer.render(scene,camera);
    }

    reset();
    addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
    renderer.setAnimationLoop(()=>{try{gameLoop();}catch(e){error.style.display="block";error.textContent="GAME ERROR\n\n"+(e.stack||e);renderer.setAnimationLoop(null);}});
  } catch(e) { error.style.display="block"; error.textContent="GAME ERROR\n\n"+(e.stack||e); }
})();