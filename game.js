(() => {
"use strict";
const error=document.getElementById("error");
try{
if(!window.THREE) throw new Error("Three.js failed to load.");
const T=THREE;
const scene=new T.Scene(); scene.background=new T.Color(0x72b7e8); scene.fog=new T.Fog(0x72b7e8,180,1200);
const camera=new T.PerspectiveCamera(70,innerWidth/innerHeight,.1,2500);
const renderer=new T.WebGLRenderer({antialias:true}); renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); document.body.appendChild(renderer.domElement);
scene.add(new T.HemisphereLight(0xffffff,0x446633,2)); scene.add(new T.AmbientLight(0xffffff,1));
const sun=new T.DirectionalLight(0xffffff,1.7); sun.position.set(50,100,30); scene.add(sun);
const grassMat=new T.MeshBasicMaterial({color:0x4f9348}); const asphaltMat=new T.MeshBasicMaterial({color:0x555555}); const white=new T.MeshBasicMaterial({color:0xffffff}); const dark=new T.MeshBasicMaterial({color:0x171717}); const rampMat=new T.MeshBasicMaterial({color:0x9b9b9b});
const ground=new T.Mesh(new T.PlaneGeometry(900,900),grassMat); ground.rotation.x=-Math.PI/2; ground.position.y=-.12; scene.add(ground);
const pad=new T.Mesh(new T.BoxGeometry(130,.18,130),asphaltMat); pad.position.y=-.02; scene.add(pad);
for(let i=-60;i<=60;i+=20){const line=new T.Mesh(new T.BoxGeometry(.12,.02,130),white);line.position.set(i,.09,0);scene.add(line);}
for(let i=-60;i<=60;i+=20){const line=new T.Mesh(new T.BoxGeometry(130,.02,.12),white);line.position.set(0,.09,i);scene.add(line);}
function makeCar(color){const g=new T.Group();const body=new T.Mesh(new T.BoxGeometry(2.25,.65,4.2),new T.MeshBasicMaterial({color}));body.name="body";body.position.y=.65;g.add(body);const hood=new T.Mesh(new T.BoxGeometry(2.05,.25,1.35),new T.MeshBasicMaterial({color}));hood.name="hood";hood.position.set(0,1,1.15);g.add(hood);const cab=new T.Mesh(new T.BoxGeometry(1.55,.7,1.9),new T.MeshBasicMaterial({color:0x8cc9dc,transparent:true,opacity:.72});cab.position.set(0,1.25,-.15);g.add(cab);for(const x of[-1.15,1.15])for(const z of[-1.45,1.45]){const w=new T.Mesh(new T.CylinderGeometry(.36,.36,.28,14),dark);w.rotation.z=Math.PI/2;w.position.set(x,.35,z);g.add(w);}return g;}
const skins=[0xdd3333,0x222222,0xffffff,0x1677cc,0xff8a00,0x22aa55]; let skinIndex=0;
const player=makeCar(skins[0]); player.position.set(0,0,35); scene.add(player);
const interior=new T.Group(); const dash=new T.Mesh(new T.BoxGeometry(2.2,.35,.75),dark);dash.position.set(0,.65,1.15);interior.add(dash);const wheel=new T.Mesh(new T.TorusGeometry(.38,.07,10,24),dark);wheel.position.set(0,.82,.72);wheel.rotation.x=Math.PI/2;interior.add(wheel);const p1=new T.Mesh(new T.BoxGeometry(.09,1.5,.1),dark);p1.position.set(-.82,1.45,-.05);interior.add(p1);const p2=p1.clone();p2.position.x=.82;interior.add(p2);interior.visible=false;player.add(interior);
const obstacles=[];
function addObstacle(o){scene.add(o);obstacles.push(o);return o;}
function ramp(x,z,rot=0){const g=new T.Group();const mesh=new T.Mesh(new T.BoxGeometry(7,2.5,12),rampMat);mesh.rotation.x=-.28;mesh.position.y=1.15;g.add(mesh);g.position.set(x,0,z);g.rotation.y=rot;return addObstacle(g);}
function wall(x,z,w,d){return addObstacle(Object.assign(new T.Mesh(new T.BoxGeometry(w,1.2,d),rampMat),{position:new T.Vector3(x,.6,z)}));}
function cone(x,z){return addObstacle(Object.assign(new T.Mesh(new T.ConeGeometry(.35,1.2,12),new T.MeshBasicMaterial({color:0xff7a00})),{position:new T.Vector3(x,.6,z)}));}
ramp(-38,-30,0);ramp(38,-5,Math.PI);ramp(-35,28,Math.PI/2);ramp(35,38,-Math.PI/2);
wall(-25,0,1.2,25);wall(25,10,1.2,25);wall(0,-48,30,1.2);wall(0,48,30,1.2);
for(let i=0;i<14;i++)cone(-15+(i%7)*5,-12+Math.floor(i/7)*8);
const bots=[];for(let i=0;i<3;i++){const b=makeCar([0x1677cc,0xffffff,0xff8a00][i]);b.position.set(-18+i*18,0,-35-i*10);b.userData.phase=Math.random()*6.28;b.userData.speed=7+i*1.5;scene.add(b);bots.push(b);}
const keys={};let speed=0,heading=0,steerVel=0,drift=0,paused=false,cameraMode=0,nitro=100,crashed=false;
addEventListener("keydown",e=>{keys[e.code]=true;if(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code))e.preventDefault();if(e.code==="KeyV"){cameraMode=1-cameraMode;interior.visible=cameraMode===1;}if(e.code==="KeyR")reset();if(e.code==="KeyP"||e.code==="Escape")paused=!paused;if(e.code>="Digit1"&&e.code<="Digit6"){skinIndex=Number(e.code.slice(-1))-1;setSkin();}});addEventListener("keyup",e=>keys[e.code]=false);
function setSkin(){player.traverse(o=>{if(o.isMesh&&o.material&&o.material.color&&(o.name==="body"||o.name==="hood"))o.material.color.setHex(skins[skinIndex]);});}
function reset(){speed=0;heading=0;steerVel=0;drift=0;nitro=100;crashed=false;player.position.set(0,0,35);player.rotation.set(0,0,0);player.userData.vx=0;player.userData.vz=0;setSkin();}
function updateHud(){let h=document.getElementById("gameHud");if(!h){h=document.createElement("div");h.id="gameHud";h.style.cssText="position:fixed;left:18px;top:16px;color:#fff;font:700 18px Arial;text-shadow:2px 2px 4px #000;z-index:20;line-height:1.5;pointer-events:none";document.body.appendChild(h);}h.innerHTML=`<b>${Math.round(Math.abs(speed)*3.6)} km/h</b><br>Drift: ${drift.toFixed(0)}°<br>Nitro: ${Math.round(nitro)}%<br><small>S / Down = accelerate • W / Up = reverse • A/D steer • Space handbrake drift • Shift nitro • V view • 1-6 skins • R reset • P pause</small>`+(crashed?"<br>💥 CRASH":"");}
const clock=new T.Clock();
function gameLoop(){const dt=Math.min(clock.getDelta(),.05);if(paused){renderer.render(scene,camera);return;}
// S/Down is now forward throttle; W/Up is reverse.
const throttle=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);const steer=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);const hand=!!keys.Space;
const accel=throttle>0?30:throttle<0?-42:-8; speed+=accel*dt;if(keys.ShiftLeft||keys.ShiftRight){if(nitro>0){speed+=55*dt;nitro-=35*dt;}}else nitro=Math.min(100,nitro+10*dt);speed=Math.max(-12,Math.min(52,speed));
const grip=hand?1.2:4.5;const turnRate=(1.4+Math.min(Math.abs(speed)/18,1.8))*(hand?1.45:1);heading+=steer*turnRate*dt*(speed>=0?1:-1);const slip=hand&&Math.abs(speed)>7?.62:.18;const forwardX=Math.sin(heading),forwardZ=Math.cos(heading);player.userData.vx=player.userData.vx||0;player.userData.vz=player.userData.vz||0;const targetVX=forwardX*speed,targetVZ=forwardZ*speed;const blend=Math.min(1,dt*(slip<.3?grip:grip*.45));player.userData.vx+=(targetVX-player.userData.vx)*blend;player.userData.vz+=(targetVZ-player.userData.vz)*blend;
const oldX=player.position.x,oldZ=player.position.z;player.position.x+=player.userData.vx*dt;player.position.z+=player.userData.vz*dt;player.position.x=Math.max(-63,Math.min(63,player.position.x));player.position.z=Math.max(-63,Math.min(63,player.position.z));
// Simple car-sized collision boxes against ramps, walls and cones.
for(const o of obstacles){const dx=player.position.x-o.position.x,dz=player.position.z-o.position.z;const hit=Math.abs(dx)<(o.geometry?.parameters?.width?o.geometry.parameters.width/2:4)+1.15&&Math.abs(dz)<(o.geometry?.parameters?.depth?o.geometry.parameters.depth/2:6)+2.1;if(hit&&o!==player){crashed=true;player.position.x=oldX;player.position.z=oldZ;player.userData.vx*=-.45;player.userData.vz*=-.45;speed*=.35;}}
player.rotation.y=heading;player.rotation.z=steer*(hand?-.22:-.06);const sideX=Math.cos(heading),sideZ=-Math.sin(heading);const lateral=Math.abs(player.userData.vx*sideX+player.userData.vz*sideZ);drift=Math.min(90,lateral*7+(hand&&Math.abs(speed)>7?35:0));
for(const b of bots){b.userData.phase+=dt*b.userData.speed*.08;b.position.x+=Math.sin(b.userData.phase)*dt*5;b.position.z+=Math.cos(b.userData.phase)*dt*5;if(b.position.x>58)b.position.x=-58;if(b.position.x<-58)b.position.x=58;if(b.position.z>58)b.position.z=-58;if(b.position.z<-58)b.position.z=58;if(Math.abs(player.position.x-b.position.x)<2.2&&Math.abs(player.position.z-b.position.z)<3.2){crashed=true;speed*=.25;player.userData.vx*=-.5;player.userData.vz*=-.5;}}
// Camera stays centered on the car and follows its heading.
if(cameraMode===0){const backX=-Math.sin(heading)*12,backZ=-Math.cos(heading)*12;camera.position.x=player.position.x+backX;camera.position.y=7;camera.position.z=player.position.z+backZ;camera.lookAt(player.position.x,1,player.position.z);}else{camera.position.set(player.position.x+Math.sin(heading)*1.8,1.45,player.position.z+Math.cos(heading)*1.8);camera.lookAt(player.position.x+Math.sin(heading)*20,1.35,player.position.z+Math.cos(heading)*20);}
updateHud();renderer.render(scene,camera);}
reset();addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});renderer.setAnimationLoop(()=>{try{gameLoop();}catch(e){error.style.display="block";error.textContent="GAME ERROR\n\n"+(e.stack||e);renderer.setAnimationLoop(null);}});
}catch(e){error.style.display="block";error.textContent="GAME ERROR\n\n"+(e.stack||e);}
})();