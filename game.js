(() => {
"use strict";
const error=document.getElementById("error");
const showError=e=>{if(error){error.style.display="block";error.textContent="GAME ERROR

"+e;}};
try{
if(!window.THREE)throw new Error("Three.js did not load.");
const T=THREE, scene=new T.Scene();

function makeTexture(bg,marks=[]){const cv=document.createElement("canvas");cv.width=256;cv.height=256;const x=cv.getContext("2d");x.fillStyle=bg;x.fillRect(0,0,256,256);for(const m of marks){x.fillStyle=m[0];x.fillRect(m[1],m[2],m[3],m[4]);}const tex=new T.CanvasTexture(cv);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(4,80);return tex;}
const roadTexture=makeTexture("#303030",[["#383838",20,20,3,3],["#272727",130,100,4,4],["#3b3b3b",200,180,2,2]]);
const grassTexture=makeTexture("#4f8d48",[["#5b984d",20,40,4,2],["#3d7b3e",150,120,5,3],["#629e51",80,210,3,2]]);
scene.background=new T.Color(0x79b9ea);
const camera=new T.PerspectiveCamera(68,innerWidth/innerHeight,.1,1800);
const renderer=new T.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));document.body.appendChild(renderer.domElement);
scene.add(new T.HemisphereLight(0xffffff,0x557744,1.7));const sun=new T.DirectionalLight(0xffffff,2);sun.position.set(50,80,30);scene.add(sun);
const roadMat=new T.MeshLambertMaterial({color:0x303030}),grassMat=new T.MeshLambertMaterial({color:0x4f8d48}),lineMat=new T.MeshLambertMaterial({color:0xffffff}),yellowMat=new T.MeshLambertMaterial({color:0xf5c400});
roadMat.map=roadTexture;const road=new T.Mesh(new T.PlaneGeometry(18,1800),roadMat);road.rotation.x=-Math.PI/2;road.position.set(0,0,-850);scene.add(road);
grassMat.map=grassTexture;const grass=new T.Mesh(new T.PlaneGeometry(180,1800),grassMat);grass.rotation.x=-Math.PI/2;grass.position.set(0,-.08,-850);scene.add(grass);

const laneXs=[-4.5,4.5],markings=[];
for(const x of [0])for(let z=0;z>-1800;z-=14){const m=new T.Mesh(new T.BoxGeometry(.12,.035,6),lineMat);m.position.set(x,.03,z);scene.add(m);markings.push(m);}
const passingZones=[];for(let i=0;i<6;i++){const z=-700-i*1100,zone=new T.Group();zone.position.z=z;
 for(let j=0;j<65;j++){const m=new T.Mesh(new T.BoxGeometry(.12,.035,6),lineMat);m.position.set(6.75,.04,j*-14);zone.add(m);}
 scene.add(zone);passingZones.push(zone);}
const median=new T.Mesh(new T.BoxGeometry(.5,.5,1800),new T.MeshLambertMaterial({color:0x777777}));median.position.set(0,.18,-850);scene.add(median);
for(const x of [-8.8,8.8]){const edge=new T.Mesh(new T.BoxGeometry(.18,.04,1800),yellowMat);edge.position.set(x,.04,-850);scene.add(edge);}

function car(color){const g=new T.Group(),body=new T.Mesh(new T.BoxGeometry(2.3,.65,4.2),new T.MeshLambertMaterial({color}));body.position.y=.7;const roof=new T.Mesh(new T.BoxGeometry(1.55,.65,1.9),new T.MeshLambertMaterial({color:0x9ccce0}));roof.position.y=1.3;g.add(body,roof);for(const x of [-1.18,1.18])for(const z of [-1.45,1.45]){const w=new T.Mesh(new T.CylinderGeometry(.38,.38,.24,12),new T.MeshLambertMaterial({color:0x111111}));w.rotation.z=Math.PI/2;w.position.set(x,.4,z);g.add(w);}return g;}
const player=car(0xdd3333);player.position.set(4.5,0,5);scene.add(player);

function tree(x,z){const g=new T.Group();const tr=new T.Mesh(new T.CylinderGeometry(.16,.23,2.2,8),new T.MeshLambertMaterial({color:0x70452b}));tr.position.y=1.1;const top=new T.Mesh(new T.ConeGeometry(1.3,3.2,8),new T.MeshLambertMaterial({color:0x28733a}));top.position.y=3;g.add(tr,top);g.position.set(x,0,z);scene.add(g);return g;}
const scenery=[];for(let i=0;i<70;i++){const z=-i*28-20;scenery.push(tree(-25-Math.random()*12,z),tree(25+Math.random()*12,z));}
function building(x,z,s=1){const g=new T.Group();const b=new T.Mesh(new T.BoxGeometry(8*s,6*s,8*s),new T.MeshLambertMaterial({color:[0xc98f62,0xd6d6d6,0xb56b4f,0xe0b45f][Math.floor(Math.random()*4)]}));b.position.y=3*s;g.add(b);for(let i=0;i<3;i++){const w=new T.Mesh(new T.BoxGeometry(1*s,1*s,.15),new T.MeshLambertMaterial({color:0x8ec8df}));w.position.set(-2*s+i*2*s,3*s,4.05*s);g.add(w);}g.position.set(x,0,z);scene.add(g);return g;}
const towns=[];function makeTown(z){const town=[];for(let i=0;i<9;i++){const side=i%2?-1:1;town.push(building(side*(34+Math.random()*18),z-Math.random()*110,.7+Math.random()*1.1));}return town;}
for(let i=0;i<3;i++)towns.push(...makeTown(-1800-i*2400));

function sign(z,limit){
 const g=new T.Group();
 const pole=new T.Mesh(new T.CylinderGeometry(.08,.08,3.8,8),new T.MeshLambertMaterial({color:0x777777}));pole.position.y=1.9;
 const board=new T.Mesh(new T.BoxGeometry(2.5,2,.12),new T.MeshLambertMaterial({color:0xffffff}));board.position.y=3.7;g.add(pole,board);
 const c=document.createElement("canvas");c.width=512;c.height=512;const ctx=c.getContext("2d");
 ctx.fillStyle="white";ctx.fillRect(0,0,512,512);
 ctx.strokeStyle="#111";ctx.lineWidth=12;ctx.strokeRect(8,8,496,496);
 ctx.fillStyle="#111";ctx.textAlign="center";ctx.font="bold 58px Arial";ctx.fillText("SPEED LIMIT",256,115);
 ctx.font="bold 190px Arial";ctx.fillText(String(limit),256,320);
 ctx.font="bold 48px Arial";ctx.fillText("km/h",256,400);
 const tex=new T.CanvasTexture(c);tex.anisotropy=4;
 const face=new T.Mesh(new T.PlaneGeometry(2.35,1.85),new T.MeshBasicMaterial({map:tex}));
 face.position.set(0,3.7,-.08);g.add(face);g.position.set(17,0,z);g.userData.limit=limit;scene.add(g);return g;
}
const signs=[sign(-260,100),sign(-650,110),sign(-1040,90),sign(-1450,120)];

function exitSign(z,name,dist){const g=new T.Group();const board=new T.Mesh(new T.BoxGeometry(6.8,2.1,.12),new T.MeshLambertMaterial({color:0x0b6b35}));board.position.y=4.2;g.add(board);const pole=new T.Mesh(new T.CylinderGeometry(.08,.08,4.2,8),new T.MeshLambertMaterial({color:0x888888}));pole.position.y=2.1;g.add(pole);const cv=document.createElement("canvas");cv.width=512;cv.height=160;const ctx=cv.getContext("2d");ctx.fillStyle="#0b6b35";ctx.fillRect(0,0,512,160);ctx.fillStyle="white";ctx.font="bold 46px Arial";ctx.textAlign="center";ctx.fillText("EXIT",256,55);ctx.font="bold 34px Arial";ctx.fillText(name,256,100);ctx.font="28px Arial";ctx.fillText(dist+" km",256,137);const tx=new T.CanvasTexture(cv);const face=new T.Mesh(new T.PlaneGeometry(6.65,2.05),new T.MeshBasicMaterial({map:tx}));face.position.set(0,4.2,-.08);g.add(face);g.position.set(-17,0,z);scene.add(g);return g;}
const exits=[exitSign(-1750,"WATTLE GROVE",1),exitSign(-4150,"RIVERDALE",2),exitSign(-6550,"COASTAL TOWN",1)];
let speed=65,limit=100,x=4.5,cameraMode=0,spawn=1,distance=0,policeTimer=0,crashVX=0,crashVZ=0,crashSpin=0,crashTime=0,paused=false;
const clock=new T.Clock(),keys={},traffic=[],police=[];
let audioCtx=null,engineOsc=null,engineGain=null;
function startEngine(){if(audioCtx)return;audioCtx=new(window.AudioContext||window.webkitAudioContext)();engineOsc=audioCtx.createOscillator();engineGain=audioCtx.createGain();engineOsc.type="sawtooth";engineOsc.frequency.value=70;engineGain.gain.value=.035;engineOsc.connect(engineGain).connect(audioCtx.destination);engineOsc.start();}
function updateEngine(){if(!audioCtx)return;engineOsc.frequency.setTargetAtTime(55+speed*.9,audioCtx.currentTime,.05);engineGain.gain.setTargetAtTime(.018+Math.min(speed/300,.8)*.045,audioCtx.currentTime,.08);}
const pauseOverlay=document.createElement("div");
pauseOverlay.id="pauseMenu";
pauseOverlay.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.72);display:none;align-items:center;justify-content:center;z-index:50;font-family:Arial,sans-serif;color:white;text-align:center";
pauseOverlay.innerHTML='<div style="min-width:280px;padding:30px 38px;background:rgba(20,20,20,.94);border:2px solid #fff;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.5)"><div style="font-size:42px;font-weight:800;margin-bottom:18px">PAUSED</div><div style="font-size:17px;line-height:1.7;margin-bottom:22px">WASD / Arrow Keys — Drive<br>V — Camera<br>R — Restart<br>ESC — Resume</div><button id="resumeBtn" style="font-size:18px;font-weight:700;padding:11px 28px;border:0;border-radius:7px;cursor:pointer">RESUME</button><button id="restartBtn" style="display:block;margin:12px auto 0;font-size:16px;padding:9px 24px;border:0;border-radius:7px;cursor:pointer">RESTART</button></div>';
document.body.appendChild(pauseOverlay);
const resumeBtn=document.getElementById("resumeBtn"),restartBtn=document.getElementById("restartBtn");
function setPaused(value){paused=value;pauseOverlay.style.display=paused?"flex":"none";if(paused){for(const k in keys)keys[k]=false;}}
resumeBtn.onclick=()=>setPaused(false);
restartBtn.onclick=()=>{reset();setPaused(false);};
addEventListener("keydown",e=>{
 if(e.code==="Escape"){e.preventDefault();setPaused(!paused);return;}
 startEngine();keys[e.code]=true;
 if(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault();
 if(e.code==="KeyR")reset();if(e.code==="KeyV")cameraMode=1-cameraMode;
});
addEventListener("keyup",e=>keys[e.code]=false);
function truck(){const g=new T.Group(),body=new T.Mesh(new T.BoxGeometry(2.5,1.5,7),new T.MeshLambertMaterial({color:[0xffffff,0xd32f2f,0xeeeeee,0x3366aa][Math.floor(Math.random()*4)]}));body.position.y=1;g.add(body);const cab=new T.Mesh(new T.BoxGeometry(2.5,1.8,2.1),new T.MeshLambertMaterial({color:0xf2f2f2}));cab.position.set(0,1.2,2.25);g.add(cab);return g;}
function addTraffic(){const side=Math.random()<.5?-1:1,t=Math.random()<.28?truck():car([0xffffff,0x4488dd,0xffaa22,0x44aa66][Math.floor(Math.random()*4)]);t.position.set(side<0?-4.5:4.5,0,-220-Math.random()*500);t.userData.dir=side;t.userData.lane=side>0?4.5:-4.5;t.userData.cruise=limit/3.6*(.94+Math.random()*.10);scene.add(t);traffic.push(t);}
function policeCar(){const p=car(0x111111);p.scale.set(.9,.9,.9);p.userData.police=true;p.position.set(player.position.x+((Math.random()<.5?-1:1)*7),0,player.position.z+80);scene.add(p);police.push(p);}
function reset(){speed=100;limit=100;x=4.5;cameraMode=0;spawn=1;distance=0;policeTimer=0;crashVX=0;crashVZ=0;crashSpin=0;crashTime=0;player.position.set(x,0,5);for(const t of traffic)scene.remove(t);traffic.length=0;for(const p of police)scene.remove(p);police.length=0;}
function frame(){
 requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.033);
 if(player.userData.crashed){crashTime-=dt;player.position.x+=crashVX*dt;player.position.z+=crashVZ*dt;crashVX*=.96;crashVZ*=.96;player.rotation.z+=crashSpin*dt;crashSpin*=.97;speed=Math.max(0,speed-20*dt);if(crashTime<=0){player.userData.crashed=false;player.rotation.z=0;player.position.set(x,0,5);speed=100;}}
 else{const steer=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);x+=steer*9*dt;x=Math.max(-7.5,Math.min(7.5,x));player.position.x+=(x-player.position.x)*Math.min(1,dt*10);player.rotation.z=-steer*.1;}
 if(keys.KeyW||keys.ArrowUp)speed+=120*dt;else speed-=0.8*dt;if(keys.KeyS||keys.ArrowDown)speed-=140*dt;speed=Math.max(0,speed);
 const move=speed*dt*.35;
 for(const m of markings){m.position.z+=move;if(m.position.z>30)m.position.z-=1800;}
 for(const s of scenery){s.position.z+=move;if(s.position.z>30)s.position.z-=1980;}
 for(const z of passingZones){z.position.z+=move;if(z.position.z>80)z.position.z-=6600;}
 for(const t of towns){t.position.z+=move;if(t.position.z>100)t.position.z-=2400;}
 for(const s of signs){s.position.z+=move;if(s.position.z>50){s.position.z-=1800;limit=s.userData.limit;}}
 for(const e of exits){e.position.z+=move;if(e.position.z>80)e.position.z-=2400;}
 for(const t of traffic){
   if(t.userData.dir>0 && Math.abs(t.position.z+350)<170 && Math.random()<0.015)t.position.x=6.75;
   if(t.userData.dir>0 && Math.abs(t.position.z+350)>=170)t.position.x=4.5;
   t.position.z+=move*(t.userData.dir<0?1:.92);t.position.z+=(t.userData.dir<0?1:-1)*t.userData.cruise*dt;if(!player.userData.crashed&&Math.abs(t.position.z-player.position.z)<3&&Math.abs(t.position.x-player.position.x)<2){player.userData.crashed=true;crashTime=2.5;crashVX=(player.position.x-t.position.x)*4;crashVZ=(player.position.z-t.position.z)*3;crashSpin=(Math.random()-.5)*9;speed=0;}}
 spawn-=dt;if(spawn<=0){addTraffic();spawn=1+Math.random()*1.5;}
 if(speed>limit+15||speed<Math.max(35,limit-45))policeTimer+=dt;else policeTimer=Math.max(0,policeTimer-dt*.5);
 if(policeTimer>7&&police.length<2){policeCar();policeTimer=0;}
 for(let i=police.length-1;i>=0;i--){const p=police[i];p.position.z+=move*1.12;p.position.x+=(player.position.x-p.position.x)*dt*.8;if(Math.abs(p.position.z-player.position.z)<3&&Math.abs(p.position.x-player.position.x)<2)speed=40;if(p.position.z>40){scene.remove(p);police.splice(i,1);}}
 if(cameraMode===0){camera.position.x+=(player.position.x*.45-camera.position.x)*Math.min(1,dt*5);camera.position.y=6;camera.position.z=14;camera.lookAt(player.position.x,0,-70);}
 else{camera.position.set(player.position.x,1.35,3.2);camera.lookAt(player.position.x,1.25,-70);}
 let el=document.getElementById("speed");if(!el){el=document.createElement("div");el.id="speed";el.style.cssText="position:fixed;left:20px;bottom:20px;color:white;font:700 24px Arial;text-shadow:2px 2px 4px #000;z-index:10;pointer-events:none";document.body.appendChild(el);}el.textContent=Math.round(speed)+" km/h";const delta=speed-limit;el.style.color=Math.abs(delta)<=5?"#35d05b":(delta<0?"#ffd21f":"#ff3b30");updateEngine();
 let de=document.getElementById("distance");if(!de){de=document.createElement("div");de.id="distance";de.style.cssText="position:fixed;left:20px;bottom:52px;color:white;font:700 20px Arial;text-shadow:2px 2px 4px #000;z-index:10;pointer-events:none";document.body.appendChild(de);}de.textContent=(distance/1000).toFixed(2)+" km";
 distance+=speed*dt/3.6;
 renderer.render(scene,camera);
}
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
reset();frame();
}catch(e){showError(e.stack||String(e));}
})();