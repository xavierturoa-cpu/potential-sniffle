(() => {
"use strict";
const error=document.getElementById("error");
const showError=e=>{if(error){error.style.display="block";error.textContent="GAME ERROR\
\
"+e;}};
try{
if(!window.THREE)throw new Error("Three.js did not load.");
const T=THREE, scene=new T.Scene();
scene.background=new T.Color(0x79b9ea);
const camera=new T.PerspectiveCamera(68,innerWidth/innerHeight,.1,1800);
const renderer=new T.WebGLRenderer({antialias:true}); renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); document.body.appendChild(renderer.domElement);
scene.add(new T.HemisphereLight(0xffffff,0x557744,1.7));
const sun=new T.DirectionalLight(0xffffff,2); sun.position.set(50,80,30); scene.add(sun);

const roadMat=new T.MeshLambertMaterial({color:0x303030}), grassMat=new T.MeshLambertMaterial({color:0x4f8d48}), lineMat=new T.MeshLambertMaterial({color:0xffffff}), yellowMat=new T.MeshLambertMaterial({color:0xf5c400});
const road=new T.Mesh(new T.PlaneGeometry(30,1800),roadMat); road.rotation.x=-Math.PI/2; road.position.set(0,0,-850); scene.add(road);
const grass=new T.Mesh(new T.PlaneGeometry(180,1800),grassMat); grass.rotation.x=-Math.PI/2; grass.position.set(0,-.08,-850); scene.add(grass);

// Six-lane motorway: 3 lanes each direction, divided by a median.
const laneXs=[-11,-6.5,-2,2,6.5,11];
const markings=[];
for(const x of [-9,-4.25,4.25,9]) for(let z=0;z>-1800;z-=14){const m=new T.Mesh(new T.BoxGeometry(.12,.035,6),lineMat);m.position.set(x,.03,z);scene.add(m);markings.push(m);}
const median=new T.Mesh(new T.BoxGeometry(1.2,.5,1800),new T.MeshLambertMaterial({color:0x777777})); median.position.set(0,.18,-850); scene.add(median);
for(const x of [-14.6,14.6]){const edge=new T.Mesh(new T.BoxGeometry(.18,.04,1800),yellowMat);edge.position.set(x,.04,-850);scene.add(edge);}

function car(color){
 const g=new T.Group(), body=new T.Mesh(new T.BoxGeometry(2.3,.65,4.2),new T.MeshLambertMaterial({color}));body.position.y=.7;
 const roof=new T.Mesh(new T.BoxGeometry(1.55,.65,1.9),new T.MeshLambertMaterial({color:0x9ccce0}));roof.position.y=1.3;g.add(body,roof);
 for(const x of [-1.18,1.18])for(const z of [-1.45,1.45]){const w=new T.Mesh(new T.CylinderGeometry(.38,.38,.24,12),new T.MeshLambertMaterial({color:0x111111}));w.rotation.z=Math.PI/2;w.position.set(x,.4,z);g.add(w);}
 return g;
}
const player=car(0xdd3333); player.position.set(2,0,5);scene.add(player);

function tree(x,z){const g=new T.Group();const tr=new T.Mesh(new T.CylinderGeometry(.16,.23,2.2,8),new T.MeshLambertMaterial({color:0x70452b}));tr.position.y=1.1;const top=new T.Mesh(new T.ConeGeometry(1.3,3.2,8),new T.MeshLambertMaterial({color:0x28733a}));top.position.y=3;g.add(tr,top);g.position.set(x,0,z);scene.add(g);return g;}
const scenery=[]; for(let i=0;i<70;i++){const z=-i*28-20;scenery.push(tree(-25-Math.random()*12,z),tree(25+Math.random()*12,z));}

function building(x,z,s=1){const g=new T.Group();const b=new T.Mesh(new T.BoxGeometry(8*s,6*s,8*s),new T.MeshLambertMaterial({color:[0xc98f62,0xd6d6d6,0xb56b4f,0xe0b45f][Math.floor(Math.random()*4)]}));b.position.y=3*s;g.add(b);for(let i=0;i<3;i++){const w=new T.Mesh(new T.BoxGeometry(1*s,1*s,.15),new T.MeshLambertMaterial({color:0x8ec8df}));w.position.set(-2*s+i*2*s,3*s,4.05*s);g.add(w);}g.position.set(x,0,z);scene.add(g);return g;}
const towns=[];
function makeTown(z){const town=[];for(let i=0;i<9;i++){const side=i%2?-1:1;town.push(building(side*(34+Math.random()*18),z-Math.random()*110,0.7+Math.random()*1.1));}return town;}
for(let i=0;i<5;i++)towns.push(...makeTown(-420-i*360));

function sign(z,limit){
 const g=new T.Group(), pole=new T.Mesh(new T.CylinderGeometry(.08,.08,3.8,8),new T.MeshLambertMaterial({color:0x777777}));pole.position.y=1.9;
 const board=new T.Mesh(new T.BoxGeometry(2.5,2,0.12),new T.MeshLambertMaterial({color:0xffffff}));board.position.y=3.7;g.add(pole,board);
 const c=document.createElement("canvas");c.width=256;c.height=256;const ctx=c.getContext("2d");ctx.fillStyle="white";ctx.fillRect(0,0,256,256);ctx.fillStyle="black";ctx.font="bold 110px Arial";ctx.textAlign="center";ctx.fillText(String(limit),128,145);ctx.font="bold 30px Arial";ctx.fillText("MAX",128,195);
 const tex=new T.CanvasTexture(c);const face=new T.Mesh(new T.PlaneGeometry(2.35,1.85),new T.MeshBasicMaterial({map:tex}));face.position.set(0,3.7,-.08);g.add(face);g.position.set(17,0,z);scene.add(g);return g;
}
const signs=[sign(-260,100),sign(-650,110),sign(-1040,100),sign(-1450,110)];


function exitSign(z,name,dist){const g=new T.Group();const board=new T.Mesh(new T.BoxGeometry(6.8,2.1,.12),new T.MeshLambertMaterial({color:0x0b6b35}));board.position.y=4.2;g.add(board);const pole=new T.Mesh(new T.CylinderGeometry(.08,.08,4.2,8),new T.MeshLambertMaterial({color:0x888888}));pole.position.y=2.1;g.add(pole);const cv=document.createElement("canvas");cv.width=512;cv.height=160;const ctx=cv.getContext("2d");ctx.fillStyle="#0b6b35";ctx.fillRect(0,0,512,160);ctx.fillStyle="white";ctx.font="bold 46px Arial";ctx.textAlign="center";ctx.fillText("EXIT",256,55);ctx.font="bold 34px Arial";ctx.fillText(name,256,100);ctx.font="28px Arial";ctx.fillText(dist+" km",256,137);const tx=new T.CanvasTexture(cv);const face=new T.Mesh(new T.PlaneGeometry(6.65,2.05),new T.MeshBasicMaterial({map:tx}));face.position.set(0,4.2,-.08);g.add(face);g.position.set(-17,0,z);scene.add(g);return g;}
const exits=[exitSign(-350,"WATTLE GROVE",1),exitSign(-800,"RIVERDALE",2),exitSign(-1250,"COASTAL TOWN",1)];
let speed=65,limit=100,x=2,cameraMode=0,spawn=1,distance=0,policeTimer=0;
const clock=new T.Clock();
const keys={},traffic=[],police=[];
addEventListener("keydown",e=>{keys[e.code]=true;if(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault();if(e.code==="KeyR")reset();if(e.code==="KeyV")cameraMode=1-cameraMode;});
addEventListener("keyup",e=>keys[e.code]=false);

function addTraffic(){const side=Math.random()<.5?-1:1;const lanes=side<0?[-11,-6.5,-2]:[2,6.5,11];const t=car([0xffffff,0x4488dd,0xffaa22,0x44aa66][Math.floor(Math.random()*4)]);t.position.set(lanes[Math.floor(Math.random()*3)],0,-220-Math.random()*500);t.userData.dir=side;scene.add(t);traffic.push(t);}
function policeCar(){const p=car(0x111111);p.scale.set(.9,.9,.9);p.userData.police=true;p.position.set(player.position.x+((Math.random()<.5?-1:1)*7),0,player.position.z+80);scene.add(p);police.push(p);}

function reset(){speed=65;limit=100;x=2;cameraMode=0;spawn=1;distance=0;policeTimer=0;player.position.set(x,0,5);for(const t of traffic)scene.remove(t);traffic.length=0;for(const p of police)scene.remove(p);police.length=0;}

function frame(){
 requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.033);
 const steer=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);x+=steer*9*dt;x=Math.max(-12,Math.min(12,x));player.position.x+=(x-player.position.x)*Math.min(1,dt*10);player.rotation.z=-steer*.1;
 if(keys.KeyW||keys.ArrowUp)speed+=60*dt;else speed-=3*dt;if(keys.KeyS||keys.ArrowDown)speed-=70*dt;speed=Math.max(20,Math.min(180,speed));
 const move=speed*dt*.35;
 for(const m of markings){m.position.z+=move;if(m.position.z>30)m.position.z-=1800;}
 for(const s of scenery){s.position.z+=move;if(s.position.z>30)s.position.z-=1980;}
 for(const t of towns){t.position.z+=move;if(t.position.z>100)t.position.z-=1800;}
 for(const s of signs){s.position.z+=move;if(s.position.z>50)s.position.z-=1800;}
 for(const e of exits){e.position.z+=move;if(e.position.z>80)e.position.z-=1800;}
 for(const t of traffic){t.position.z+=move*(t.userData.dir<0?1:.92);if(Math.abs(t.position.z-player.position.z)<3&&Math.abs(t.position.x-player.position.x)<2){}}
 spawn-=dt;if(spawn<=0){addTraffic();spawn=1+Math.random()*1.5;}
 // Speed enforcement: police can spawn after sustained speeding or driving well below the posted limit.
 if(speed>limit+15||speed<Math.max(35,limit-45))policeTimer+=dt;else policeTimer=Math.max(0,policeTimer-dt*.5);
 if(policeTimer>7&&police.length<2){policeCar();policeTimer=0;}
 for(let i=police.length-1;i>=0;i--){const p=police[i];p.position.z+=move*1.12;p.position.x+=(player.position.x-p.position.x)*dt*.8;if(Math.abs(p.position.z-player.position.z)<3&&Math.abs(p.position.x-player.position.x)<2){speed=40;}if(p.position.z>40){scene.remove(p);police.splice(i,1);}}
 if(cameraMode===0){camera.position.x+=(player.position.x*.45-camera.position.x)*Math.min(1,dt*5);camera.position.y=6;camera.position.z=14;camera.lookAt(player.position.x,0,-70);}
 else{camera.position.set(player.position.x,1.35,3.2);camera.lookAt(player.position.x,1.25,-70);}
 let el=document.getElementById("speed");if(!el){el=document.createElement("div");el.id="speed";el.style.cssText="position:fixed;left:20px;bottom:20px;color:white;font:700 24px Arial;text-shadow:2px 2px 4px #000;z-index:10;pointer-events:none";document.body.appendChild(el);}el.textContent=Math.round(speed)+" km/h";
 let de=document.getElementById("distance");if(!de){de=document.createElement("div");de.id="distance";de.style.cssText="position:fixed;left:20px;bottom:52px;color:white;font:700 20px Arial;text-shadow:2px 2px 4px #000;z-index:10;pointer-events:none";document.body.appendChild(de);}de.textContent=(distance/1000).toFixed(1)+" km";
 renderer.render(scene,camera);
}
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
reset();frame();
}catch(e){showError(e.stack||String(e));}
})();