import * as T from 'three';
import { coast, route, makeCar, makePlayer, part } from './world.js';
import { makeDistrict, roads, neighborhoods } from './district.js';
import { heists } from './interiors.js';
import { makeAudio } from './audio.js';
import { makeAtmosphere } from './atmosphere.js';
import { makePulseRange } from './equipment.js';
import { bonusContracts } from './content/bonus-contracts.js';

const $ = (id) => document.getElementById(id);
const canvas = $('view');
const map = $('map').getContext('2d');
const largeMap = $('large-map').getContext('2d');
const mapDialog = $('district-map');
const dom = Object.fromEntries(['game','overlay','overlay-title','overlay-text','play','help','prompt','toast','distance','objective-text','stage-count','speed','energy-fill','energy-value','environment','credits','wanted','boost-meter','boost-fill','boost-value','boost-edges','gear-detail','reticle','sound','weather','weather-label'].map(id => [id, $(id)]));
const modeButtons = [...document.querySelectorAll('[data-mode]')];
const gearButtons = [...document.querySelectorAll('[data-gear]')];
const stageBars = [...document.querySelectorAll('#stages i')];

let cameraMenuSuppressedUntil=0;
dom.game.addEventListener('contextmenu',event=>{
  if (event.target===canvas||performance.now()<cameraMenuSuppressedUntil) event.preventDefault();
});

const modes = {
  road: { label:'ROAD', color:'#75eedb', top:28, acceleration:16 },
  boost: { label:'SUPERCAR', color:'#ffab65', top:46, acceleration:24 },
  flight: { label:'FLIGHT', color:'#8ef4f8', top:43, acceleration:19 },
  dive: { label:'UNDERWATER', color:'#a2b5ff', top:24, acceleration:14 },
};
const stages = [
  { text:'Approach the marked sedan, then press F to take the wheel.', target:route.sedan, name:'Service sedan' },
  { text:'Switch to Supercar with 2. Drive through the street beacon. Hold left click for nitro.', target:route.sprint, name:'Street beacon' },
  { text:'Switch to Flight with 3. Hold Q to climb to the relay.', target:route.tower, name:'Sky relay · 15 m' },
  { text:'Cross the seawall. Switch to Underwater with 4 and hold E to dive. Press F to collect the core.', target:route.core, name:'Signal core · 8 m deep' },
  { text:'Hold Q to reach the surface. Drive to the dock and press F to deliver the core.', target:route.dock, name:'Breakwater dock' },
];

let renderer;
try {
  renderer = new T.WebGLRenderer({canvas, antialias:true, alpha:false, powerPreference:'low-power'});
} catch (error) {
  dom['overlay-text'].textContent = 'This game needs WebGL 2. Try a current desktop browser with graphics acceleration enabled.';
  dom.play.disabled = true;
  console.error(error);
}
if (renderer) start();

function start() {
  const scene = new T.Scene();
  scene.fog = new T.FogExp2(0xaac7cb,.0054);
  const sky = new T.Mesh(new T.SphereGeometry(430,22,14), new T.ShaderMaterial({
    side:T.BackSide, depthWrite:false,
    uniforms:{ horizon:{value:new T.Color(0xf0bea2)},zenith:{value:new T.Color(0x4c98bf)},sunlight:{value:1} },
    vertexShader:'varying vec3 vDir; void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`uniform vec3 horizon,zenith; uniform float sunlight; varying vec3 vDir;
      void main(){vec3 d=normalize(vDir);vec3 col=mix(horizon,zenith,smoothstep(-.06,.68,d.y));
      float s=max(dot(d,normalize(vec3(-.39,.17,-.90))),0.);col+=sunlight*(vec3(.63,.29,.1)*pow(s,40.)+vec3(.85,.51,.24)*smoothstep(.9983,.9993,s));
      gl_FragColor=vec4(col,1.);
      #include <colorspace_fragment>
      }`,
  }));
  sky.renderOrder = -10;
  const ambient=new T.HemisphereLight(0xc5e6fa,0x626a60,2.3);
  scene.add(sky,ambient);
  const sun=new T.DirectionalLight(0xffdbc2,2.25);
  sun.position.set(-75,55,-58);
  scene.add(sun);
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.45));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const camera=new T.PerspectiveCamera(58,1,.16,740);
  const {solids,footprints,interiors}=makeDistrict(scene);
  const roomsById=new Map(interiors.map(room=>[room.id,room]));
  const avatar=makePlayer(), vehicle=makeCar();
  scene.add(avatar.group,vehicle.group);
  const atmosphere=makeAtmosphere(scene,coast,sun,ambient,sky);
  const range=makePulseRange(scene,solids),audio=makeAudio();
  const viewGear=new T.Group();viewGear.position.set(.31,-.28,-.72);viewGear.rotation.set(.13,-.21,.085);
  const viewItems=Object.fromEntries(Object.entries(avatar.gear).map(([key,model])=>[key,model.clone(true)]));
  viewGear.add(...Object.values(viewItems));camera.add(viewGear);scene.add(camera);

  const ring = new T.Group();
  const checkpointColors = [0x75eedb, 0xffab65, 0xc6b5ff, 0x8ebeff, 0xffd391];
  const ringMaterial=new T.MeshBasicMaterial({color:0xffb365,transparent:true,opacity:.84,depthWrite:false});
  const halo=new T.Mesh(new T.TorusGeometry(1.9,.095,7,32),ringMaterial);
  const diamond=new T.Mesh(new T.OctahedronGeometry(.42),new T.MeshBasicMaterial({color:0xffd28f}));
  ring.add(halo,diamond); scene.add(ring);
  const guide = new T.Mesh(new T.CylinderGeometry(.033,.033,1,6), new T.MeshBasicMaterial({color:0xffc582,transparent:true,opacity:.42,depthWrite:false}));
  scene.add(guide);
  const core = new T.Mesh(new T.IcosahedronGeometry(.87,1),new T.MeshStandardMaterial({color:0x81fff1,emissive:0x34eeb6,emissiveIntensity:1.3,metalness:.45,roughness:.3}));
  core.position.fromArray(route.core);scene.add(core);
  const entrances=heists.map(job=>{
    const marker=new T.Mesh(new T.OctahedronGeometry(.39),new T.MeshBasicMaterial({color:job.color,transparent:true,opacity:.84}));
    marker.position.fromArray(job.entrance);marker.position.y=2.25;scene.add(marker);
    return {job,marker};
  });

  const drone=new T.Group();
  part(drone,0,0,0,1.3,.55,1.35,0x273c4c);
  part(drone,0,0,0,3,.18,.36,0x789aa8);
  const droneLamp=part(drone,0,.35,0,.55,.24,.5,0xff693c,0xff421a);
  drone.position.set(102,8,-14);drone.visible=false;scene.add(drone);
  const fieldBeacon=new T.Mesh(new T.OctahedronGeometry(.27),new T.MeshBasicMaterial({color:0xc4a7ff}));
  fieldBeacon.visible=false;scene.add(fieldBeacon);

  const shadow = new T.Mesh(new T.CircleGeometry(1,24),new T.MeshBasicMaterial({color:0x122630,transparent:true,opacity:.3,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2; scene.add(shadow);

  const position=avatar.group.position.fromArray(route.spawn);
  const car=vehicle.group.position.fromArray(route.sedan);
  const keys=new Set();
  const target=new T.Vector3(), camGoal=new T.Vector3(), look=new T.Vector3();
  let playing=false, hasStarted=false, inCar=false, mode='road', stage=0, finished=false;
  let yaw=0, avatarYaw=0, speed=0, jumpVelocity=0, verticalSpeed=0, energy=100;
  let orbit=0, lookOffset=0, pitch=0, pitchTarget=0, closeCamera=false, toastTime=0, elapsed=0;
  let rightDrag=null,leftHeld=false,nitro=100,boosting=false,boostLocked=false,boostUsedAt=-5;
  let running=false, gait=0, footfall=0, walkSpeed=0, scanUntil=0;
  let equipped='pistol';
  let credits=readCredits(), security=0, hudTime=0;
  let ammo=8, reloadAt=0, nextShot=0, hitUntil=0, recoil=0, kits=2, droneHealth=3;
  let submerged=false;
  let contract=null, carrying=false, contractDeadline=0, missionTime=0;
  const completedContracts=new Set();
  const completedHeists=new Set(), unlockedHeists=new Set();
  let heist=null, trackedHeist=null, actionIndex=0, heistDeadline=0;
  let currentRoom=null, cafeCooldown=0;

  function readCredits() {
    try { return Math.max(0, Number(localStorage.getItem('shiftgear-credits')) || 0); } catch { return 0; }
  }
  function award(amount) {
    credits += amount;
    try { localStorage.setItem('shiftgear-credits',String(credits)); } catch {/* Storage can be unavailable for local files. */}
  }
  function toast(message) {
    dom.toast.textContent=message;dom.toast.hidden=false;toastTime=elapsed+3.6;
  }
  const clamp=T.MathUtils.clamp;
  const near=(p,q) => Math.hypot(p.x-q[0],p.y-q[1],p.z-q[2]);
  const flat=(p,q) => Math.hypot(p.x-q[0],p.z-q[2]);
  const down=(...names) => names.some(key=>keys.has(key));
  const onDock=(x,z) => x>coast&&x<121&&z>11.1&&z<26.9;
  const yawTowards = (from,to,factor) => from+Math.atan2(Math.sin(to-from),Math.cos(to-from))*factor;

  function modeTo(next) {
    if (!playing || !inCar || next===mode) return;
    if ((next==='road'||next==='boost') && (car.y>2.1 || car.x>coast&&!onDock(car.x,car.z))) {
      toast('Return to the street before switching to a road mode.');return;
    }
    if ((next==='road'||next==='boost') && mode==='dive' && car.y<-.24) {
      toast('Surface before switching to a road mode.');return;
    }
    if (next==='dive' && (car.x<coast||onDock(car.x,car.z))) {
      toast('Move beyond the seawall and dock before diving.');return;
    }
    if (next==='flight' && car.y < -1.1) {
      toast('Surface before switching to Flight.');return;
    }
    if (next!=='road' && energy<9) { toast('Nanotech depleted. Press R for checkpoint recovery.');return; }
    setMode(next);
  }
  function setMode(next, automatic=false) {
    mode=next;verticalSpeed=0;energy-=next==='road'?0:4;
    if (next==='flight' && car.y<1.3) car.y=1.3;
    if (automatic) car.y=0;
    vehicle.kits[mode]?.scale.setScalar(.18);
    updateLoadout();audio.play(next==='dive'?'water':'transform');
    toast(automatic?'Shore reached · Road mode restored':`${modes[mode].label} MODE ONLINE`);
  }
  function updateLoadout() {
    $('modes').hidden=!inCar;
    $('gear').hidden=inCar;
    $('speed-readout').hidden=!inCar;
    $('gear-readout').hidden=inCar;
    dom['boost-meter'].hidden=!inCar || mode!=='boost';
    dom.reticle.hidden=inCar || equipped!=='pistol';
    for(const button of modeButtons) {
      button.disabled=!inCar;
      const active=inCar && button.dataset.mode===mode;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    }
    for (const button of gearButtons) {
      const active=button.dataset.gear===equipped;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
      if (active) $('equipped').textContent=button.title;
    }
    for (const [name,model] of Object.entries(avatar.gear)) model.visible=name===equipped;
    for(const [key,kit] of Object.entries(vehicle.kits)) kit.visible=key===mode;
    for (const wheel of vehicle.wheels) wheel.steering.visible=mode!=='dive' && mode!=='flight';
    dom.game.style.setProperty('--mode',inCar?modes[mode].color:modes.road.color);
  }
  function equip(name) {
    if (!playing || inCar || name===equipped) return;
    equipped=name;
    updateLoadout();
    audio.play('equip');
  }
  function advance() {
    stage++;
    if(stage===stages.length) {
      finished=true;security=0;award(1200);audio.play('reward');toast('Signal Run complete · +₡ 1,200');
    } else audio.play('checkpoint');
    updateObjective();
  }
  function updateObjective() {
    const operation=heist??trackedHeist;
    const count=heist?heist.actions.length:contract?2:5;
    const current=heist?actionIndex:contract?(carrying?1:0):trackedHeist?0:stage;
    $('operation-title').textContent=operation?.title??contract?.title??'Signal Run';
    dom['objective-text'].textContent=heist?heist.actions[actionIndex].brief
      :trackedHeist?trackedHeist.actions[0].brief
      :contract
      ? (carrying?'Deliver the cargo at the marked waypoint. Press F to drop it off.':'Find the cargo at the marked pickup. Press F to load it.')
      : finished?'Core delivered. Open the map for delivery contracts, or press R to replay.':stages[stage].text;
    dom['stage-count'].textContent=trackedHeist&&!heist?'TRACKING':!operation&&!contract&&finished?'COMPLETE':`${current+1} / ${count}`;
    $('stages').style.gridTemplateColumns=`repeat(${count},1fr)`;
    stageBars.forEach((bar,i)=>{bar.hidden=i>=count;bar.classList.toggle('done',i<current);bar.classList.toggle('active',i===current);});
  }
  function currentObjective() {
    if (heist) return heist.actions[actionIndex];
    if (trackedHeist) {
      return currentRoom?.id===trackedHeist.room?trackedHeist.actions[0]:{target:trackedHeist.entrance,name:trackedHeist.venue};
    }
    if (contract) return {target:carrying?contract.dropoff:contract.pickup,name:carrying?'Cargo delivery':'Cargo pickup'};
    return finished?null:stages[stage];
  }
  function locatedHeist() {
    if (inCar || !currentRoom || heist) return null;
    return heists.find(job=>job.room===currentRoom.id&&!completedHeists.has(job.id)&&near(position,job.actions[0].target)<2.65)??null;
  }
  function heistInteraction() {
    const ready=locatedHeist();
    if (!heist && !ready) return false;
    if (ready && contract) { toast('Finish the active delivery contract before starting a heist');return true; }
    if(ready) {
      heist=ready;trackedHeist=null;actionIndex=0;heistDeadline=0;
    }
    const action=heist.actions[actionIndex];
    const p=inCar?car:position;
    if (near(p,action.target)>(action.escape?7.8:2.65) || (!action.escape && (inCar || currentRoom?.id!==heist.room))) return false;
    if (action.escape && inCar && (Math.abs(speed)>7||car.y<-.24||car.y>3.7)) {
      toast('Set down and slow to complete the handoff');return true;
    }
    if (action.gate) { unlockedHeists.add(heist.id);audio.play('transform');toast('Security gate unlocked'); }
    else if(action.loot) { heistDeadline=missionTime+heist.seconds;audio.play('alarm');toast('Cargo secured · security lockdown started'); }
    else if(action.escape) {
      award(heist.reward);completedHeists.add(heist.id);audio.play('reward');
      toast(`${heist.title} complete · +₡ ${heist.reward.toLocaleString()}`);
      heist=null;heistDeadline=0;updateObjective();return true;
    } else { audio.play('checkpoint');toast('Bypass installed'); }
    actionIndex++;updateObjective();return true;
  }
  function failHeist(message) {
    trackedHeist=heist;heist=null;heistDeadline=0;actionIndex=0;audio.play('dry');
    toast(message);updateObjective();
  }
  function showHeists() {
    const list=$('heist-list');list.replaceChildren();
    for (const job of heists) {
      const button=document.createElement('button');button.type='button';
      const names=document.createElement('div');
      const title=document.createElement('b');title.textContent=job.title;
      const place=document.createElement('small');place.textContent=job.venue;names.append(title,place);
      const label=document.createElement('span');
      const done=completedHeists.has(job.id);
      label.textContent=done?'Complete':heist===job?'Active':trackedHeist===job?'Untrack':`₡ ${job.reward.toLocaleString()}`;
      button.append(names,label);button.disabled=done||Boolean(heist)||Boolean(contract);
      button.addEventListener('click',()=>{
        trackedHeist=trackedHeist===job?null:job;mapDialog.close();updateObjective();
        if(trackedHeist) toast(`Entrance marked · ${job.venue}`);
      });
      list.append(button);
    }
  }
  function interactWithContract() {
    if (!contract) return false;
    const p=inCar?car:position;
    if (near(p,currentObjective().target)>6.5) return false;
    if (inCar && Math.abs(speed)>6) { toast('Slow down to handle the cargo');return true; }
    if (!carrying) {
      carrying=true;contractDeadline=missionTime+contract.bonusTimeSeconds;
      audio.play('checkpoint');toast('Cargo loaded · on-time bonus available');
    } else {
      const bonus=missionTime<=contractDeadline?Math.round(contract.reward*.25):0;
      const reward=contract.reward+bonus;
      completedContracts.add(contract.id);award(reward);contract=null;carrying=false;
      audio.play('reward');toast(`Contract complete · +₡ ${reward.toLocaleString()}`);
    }
    updateObjective();return true;
  }
  function showContracts() {
    const list=$('contract-list');list.hidden=!finished;list.replaceChildren();
    if (!finished) return;
    for (const job of bonusContracts) {
      const button=document.createElement('button');button.type='button';
      button.title=job.description;
      button.append(job.title);
      const payment=document.createElement('span');
      const done=completedContracts.has(job.id);
      payment.textContent=done?'Complete':job===contract?'Active':`₡ ${job.reward.toLocaleString()}`;
      button.append(payment);button.disabled=done||Boolean(contract)||Boolean(heist);
      button.addEventListener('click',()=>{
        contract=job;trackedHeist=null;carrying=false;mapDialog.close();updateObjective();
        audio.play('checkpoint');toast(`Contract accepted · ${job.title}`);
      });
      list.append(button);
    }
  }
  function interact() {
    if (heistInteraction()) return;
    if (interactWithContract()) return;
    if(!inCar&&currentRoom?.counter&&near(position,currentRoom.counter)<2.4) {
      if (missionTime<cafeCooldown) {toast('Tideglass Café · take a seat and enjoy the view');return;}
      cafeCooldown=missionTime+35;energy=Math.min(100,energy+25);audio.play('equip');toast('Tideglass Café · nanotech reserve topped up');return;
    }
    if (!heist && inCar && stage===3 && mode==='dive' && near(car,route.core)<5.2) {
      advance();security=2;drone.visible=true;droneHealth=3;drone.position.set(102,13,-14);
      toast('Signal core secured · security drone dispatched');return;
    }
    if (!heist && inCar && stage===4 && near(car,route.dock)<8 && car.y>=-.24 && car.y<4) { advance();return; }
    if (inCar) {
      if (car.y>1.3 || car.x>coast-1&&!onDock(car.x,car.z) || Math.abs(speed)>3) {
        toast('Stop on land before exiting the car.');return;
      }
      const sideX=Math.cos(yaw)*1.9, sideZ=Math.sin(yaw)*1.9;
      const exit = [1,-1].map(sign=>[car.x+sideX*sign,car.z+sideZ*sign]).find(([x,z])=>!blocked(x,z,0,.5));
      if (!exit) { toast('Move away from the wall to exit.');return; }
      inCar=false;avatar.group.visible=true;position.set(exit[0],0,exit[1]);orbit+=yaw;lookOffset=orbit;avatarYaw=yaw;speed=0;updateLoadout();audio.play('door');return;
    }
    if (position.distanceTo(car)<4.05) {
      inCar=true;running=false;avatar.group.visible=false;orbit=lookOffset=pitch=pitchTarget=0;updateLoadout();audio.play('door');
      if (!heist && stage===0) { advance();toast('Vehicle acquired · Nanotech available'); }
    }
  }
  function checkpoint() {
    if(heist) {
      const [x,,z]=heist.entrance;
      releaseMouse();inCar=false;speed=jumpVelocity=walkSpeed=0;
      position.set(x,0,z+.4);unlockedHeists.delete(heist.id);
      failHeist('Heist reset · return to the security panel');updateLoadout();return;
    }
    trackedHeist=null;
    releaseMouse();speed=verticalSpeed=jumpVelocity=orbit=lookOffset=pitch=pitchTarget=walkSpeed=0;energy=nitro=100;security=0;
    if ((stage===0||finished) && !contract) { ammo=8;kits=2;reloadAt=0;fieldBeacon.visible=false; }
    drone.visible=false;mode='road';yaw=avatarYaw=0;
    if (contract) {
      inCar=true;avatar.group.visible=false;car.fromArray(route.sedan);
    } else if (stage===0 || finished) {
      stage=0;finished=false;inCar=false;avatar.group.visible=true;
      position.fromArray(route.spawn);car.fromArray(route.sedan);
    } else {
      inCar=true;avatar.group.visible=false;
      if (stage===1) car.fromArray(route.sedan);
      if (stage===2) car.set(0,0,29);
      if (stage===3) { car.set(126,-.5,19);mode='dive'; }
      if (stage===4) { car.set(111,2,19);mode='flight'; }
    }
    updateObjective();updateLoadout();toast('Checkpoint restored');
  }
  function reload() {
    if (inCar || equipped!=='pistol' || ammo===8 || reloadAt>0) return;
    reloadAt=elapsed+.82;
    audio.play('reload');
  }
  function useGear() {
    switch(equipped) {
      case 'pistol': {
        if (reloadAt>0 || elapsed<nextShot) return;
        nextShot=elapsed+.23;
        if (ammo===0) { audio.play('dry');toast('Pulse cell empty · press X to reload');return; }
        ammo--;recoil=1;audio.play('pulse');
        const result=range.shoot(camera,currentRoom?viewItems.pistol:avatar.gear.pistol,drone,elapsed);
        if (result) { hitUntil=elapsed+.15;audio.play('hit'); }
        if (result==='drone' && --droneHealth===0) {
          security=0;drone.visible=false;toast('Security drone disabled');
        }
        return;
      }
      case 'scanner':
        scanUntil=elapsed+6;audio.play('scan');
        toast(currentObjective()?`Tracking ${currentObjective().name}`:'Scanner ready · check the map for contracts');
        return;
      case 'repair':
        if (kits===0) { toast('No repair kits remaining');return; }
        if (position.distanceTo(car)>6) { toast('Move closer to the sedan to restore its systems');return; }
        if (energy>=99 && nitro>=99) { toast('Sedan systems are already charged');return; }
        kits--;energy=Math.min(100,energy+45);nitro=Math.min(100,nitro+50);audio.play('transform');
        toast(`Sedan recharged · ${kits} repair kits left`);
        return;
      case 'beacon':
        fieldBeacon.position.set(position.x,1.18,position.z);fieldBeacon.visible=true;
        audio.play('scan');toast('Personal waypoint placed on the map');
        return;
      case 'pad':
        toggleMap();
    }
  }
  function blocked(x,z,y,radius) {
    if (x < -106 || x > 205 || Math.abs(z)>102) return true;
    if (radius>=1 && interiors.some(room=>room.contains({x,y,z}))) return true;
    return solids.some(b=>b.enabled!==false && y<b.top+.16 && y+(radius>=1?1.31:1.75)>b.bottom && Math.abs(x-b.x)<b.w/2+radius && Math.abs(z-b.z)<b.d/2+radius);
  }
  function updateNitro(dt,requested) {
    const fresh=requested && !boostLocked && nitro>0 && speed>=-1 && energy>0;
    if (fresh!==boosting) audio.play(fresh?'boost':'boostEnd');
    boosting=fresh;
    if (boosting) {
      nitro=Math.max(0,nitro-25*dt);
      boostUsedAt=elapsed;
      if (nitro===0) { boostLocked=true;toast('Nitro depleted · release to recharge'); }
    } else if (!leftHeld && elapsed-boostUsedAt>1.15) {
      nitro=Math.min(100,nitro+17*dt);
      if (nitro>=14) boostLocked=false;
    }
  }
  function drive(dt) {
    let throttle=Number(down('KeyW','ArrowUp'))-Number(down('KeyS','ArrowDown'));
    const steer=Number(down('KeyD','ArrowRight'))-Number(down('KeyA','ArrowLeft'));
    const aerial=mode==='flight'||mode==='dive';
    const handbrake=!aerial && down('Space');
    updateNitro(dt,mode==='boost'&&leftHeld&&!handbrake&&throttle>=0);
    if (boosting) throttle=1;
    const spec=modes[mode];
    const top=spec.top*(boosting?1.3:1);
    if (throttle<=0 || speed<top) speed+=throttle*spec.acceleration*dt*(boosting?1.52:1);
    if (!throttle || energy===0 && aerial) speed*=Math.exp(-dt*(aerial?1.2:1.45));
    if (handbrake) speed*=Math.exp(-dt*6.5);
    if (speed>top && !boosting) speed=T.MathUtils.damp(speed,top,1.4,dt);
    speed=clamp(speed,-spec.top*.4,boosting?top:Math.max(top,spec.top*1.3));
    const steerScale=aerial?1:Math.min(Math.abs(speed)/3.9,1);
    yaw+=steer*dt*(aerial?1.62:1.78)*steerScale*(speed<-.1&&!aerial?-1:1);
    if (aerial) {
      const direction=Number(down('KeyQ'))-Number(down('KeyE'));
      verticalSpeed=T.MathUtils.lerp(verticalSpeed,direction*(mode==='flight'?8:5.6),1-Math.exp(-dt*5));
      let floor = mode==='flight'?1.3:-10.4;
      if (mode==='flight' && verticalSpeed<0) for (const b of solids) {
        if (b.enabled!==false && Math.abs(car.x-b.x)<b.w/2+1.1 && Math.abs(car.z-b.z)<b.d/2+1.1 && car.y>=b.top) {
          floor=Math.max(floor,b.top+.77);
        }
      }
      car.y=clamp(car.y+verticalSpeed*dt,floor,mode==='flight'?55:.43);
    } else car.y=Math.max(0,car.y-dt*8);

    if (mode!=='road') energy=clamp(energy-dt*(mode==='flight'?1.45:mode==='dive'?.8:.4),0,100);
    else energy=Math.min(100,energy+dt*5);
    const fromX=car.x,fromZ=car.z;
    const forwardX=Math.sin(yaw),forwardZ=-Math.cos(yaw);
    const nx=fromX+forwardX*speed*dt, nz=fromZ+forwardZ*speed*dt;
    const bay = nx>coast;
    const dockAccess = nz>11.1 && nz<26.9 && nx<121;
    const canCross = bay ? (aerial||dockAccess) : (mode!=='dive'||car.y>=-.24);
    const hitX=!canCross || blocked(nx,car.z,car.y,1.32);
    const hitZ=blocked(hitX?car.x:nx,nz,car.y,1.32) || (!aerial&&car.x>coast&&!dockAccess);
    if (!hitX) car.x=nx;
    if (!hitZ) car.z=nz;
    if (hitX||hitZ) speed*=Math.exp(-dt*10);
    const dockSurface=onDock(car.x,car.z);
    if (mode==='dive' && car.y>=-.24 && (car.x<=coast || dockSurface)) setMode('road',true);
    vehicle.group.rotation.y=-yaw;
    vehicle.group.rotation.z= T.MathUtils.lerp(vehicle.group.rotation.z, -steer*Math.min(Math.abs(speed)/17,1)*(aerial?.19:.07),dt*5);
    vehicle.group.rotation.x= T.MathUtils.lerp(vehicle.group.rotation.x, aerial?verticalSpeed*.027:0,dt*5);
    if (!aerial) {
      const distance=(car.x-fromX)*forwardX+(car.z-fromZ)*forwardZ;
      for (const wheel of vehicle.wheels) {
        wheel.axle.rotation.x=(wheel.axle.rotation.x-distance/vehicle.wheelRadius)%(Math.PI*2);
        if (wheel.front) {
          wheel.steering.rotation.y=T.MathUtils.damp(wheel.steering.rotation.y,-steer*.46,13,dt);
        }
      }
    }
    if (!heist && stage===1 && mode==='boost' && flat(car,route.sprint)<6.5 && Math.abs(speed)>3) advance();
    if (!heist && stage===2 && mode==='flight' && near(car,route.tower)<6.3) advance();
  }
  function walk(dt) {
    updateNitro(dt,false);
    const forward=Number(down('KeyW','ArrowUp'))-Number(down('KeyS','ArrowDown'));
    const right=Number(down('KeyD','ArrowRight'))-Number(down('KeyA','ArrowLeft'));
    const motion=Math.hypot(forward,right);
    running=motion>0 && down('ShiftLeft','ShiftRight');
    walkSpeed=T.MathUtils.damp(walkSpeed,motion?(running?10.4:5.45):0,motion?12:19,dt);
    const step=dt*walkSpeed/(motion||1);
    const dx=(right*Math.cos(orbit)+forward*Math.sin(orbit))*step;
    const dz=(right*Math.sin(orbit)-forward*Math.cos(orbit))*step;
    const priorX=position.x,priorZ=position.z;
    const nx=position.x+dx,nz=position.z+dz;
    if((nx<coast-.5||onDock(nx,position.z)) && !blocked(nx,position.z,position.y,.35) && Math.hypot(nx-car.x,position.z-car.z)>1.23) position.x=nx;
    if((position.x<coast-.5||onDock(position.x,nz)) && !blocked(position.x,nz,position.y,.35) && Math.hypot(position.x-car.x,nz-car.z)>1.23) position.z=nz;
    const aiming=equipped==='pistol'&&!running;
    if(aiming||motion) avatarYaw=yawTowards(avatarYaw,aiming?orbit:Math.atan2(dx,-dz),Math.min(1,dt*15));
    avatar.group.rotation.y=-avatarYaw;
    const distance=Math.hypot(position.x-priorX,position.z-priorZ);
    const moving=distance>dt*.4;
    if (moving) gait+=dt*(running?16.3:10.7);
    const airborne=position.y>.03;
    const stride=Math.sin(gait)*(running?.89:.52);
    const hipSwing=moving&&!airborne?Math.sin(gait*2)*(running?.072:.036):Math.sin(elapsed*2.3)*.017;
    avatar.torso.position.y=T.MathUtils.damp(avatar.torso.position.y,1.04+hipSwing,14,dt);
    avatar.torso.rotation.x=T.MathUtils.damp(avatar.torso.rotation.x,airborne?.17:running?.29:moving?.09:0,9,dt);
    avatar.torso.rotation.z=T.MathUtils.damp(avatar.torso.rotation.z,-right*(running?.13:.08),10,dt);
    recoil=T.MathUtils.damp(recoil,0,12,dt);
    for (let i=0;i<2;i++) {
      const sign=i===0?1:-1;
      const legAngle=airborne?(i===0?.72:-.54):moving?stride*sign:0;
      const armAngle=aiming&&i===1 ? 1.48+pitch*.55-recoil*.26 : airborne?-.38:moving?-stride*sign*.8:0;
      avatar.legs[i].rotation.x=T.MathUtils.damp(avatar.legs[i].rotation.x,legAngle,18,dt);
      avatar.arms[i].rotation.x=T.MathUtils.damp(avatar.arms[i].rotation.x,armAngle,18,dt);
    }
    const nextFootfall=Math.floor(gait/Math.PI);
    if(moving&&!airborne&&nextFootfall!==footfall) audio.play('footstep');
    footfall=nextFootfall;
    jumpVelocity-=dt*18;position.y=Math.max(0,position.y+jumpVelocity*dt);
    if(position.y===0) { if(airborne&&jumpVelocity<-3) audio.play('land');jumpVelocity=0; }
  }

  function resize() {
    const w=window.innerWidth,h=window.innerHeight;
    camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
  }
  window.addEventListener('resize',resize);resize();
  function enterFullscreen() {
    if (document.fullscreenEnabled && !document.fullscreenElement) {
      return document.documentElement.requestFullscreen({navigationUI:'hide'});
    }
    return Promise.resolve();
  }
  function toggleMap() {
    if (mapDialog.open) { mapDialog.close();return; }
    if (!playing) return;
    keys.clear();releaseMouse();
    showHeists();showContracts();
    drawMap(largeMap,inCar?car:position);
    mapDialog.showModal();
  }
  function showHelp() {
    if(!playing) return;
    playing=false;keys.clear();releaseMouse();dom.overlay.hidden=false;dom.play.textContent='Resume game';dom.play.focus();
  }
  dom.help.addEventListener('click',showHelp);
  $('map-toggle').addEventListener('click',toggleMap);
  $('map-close').addEventListener('click',()=>mapDialog.close());
  dom.sound.addEventListener('click',()=>{
    audio.unlock();
    const muted=audio.toggle();
    const label=muted?'Unmute sound':'Mute sound';
    dom.sound.textContent=muted?'×':'♪';dom.sound.title=label;
    dom.sound.setAttribute('aria-label',label);dom.sound.setAttribute('aria-pressed',String(muted));
    dom.sound.blur();
  });
  dom.weather.addEventListener('click',()=>{
    toast(`${atmosphere.next()} conditions`);
    dom.weather.blur();
  });
  $('fullscreen').hidden=!document.fullscreenEnabled;
  $('fullscreen').addEventListener('click',()=>{
    const action=document.fullscreenElement?document.exitFullscreen():enterFullscreen();
    action.catch(()=>toast('Fullscreen is unavailable in this browser view.'));
    $('fullscreen').blur();
  });
  dom.play.addEventListener('click',()=>{
    audio.unlock();
    playing=true;dom.overlay.hidden=true;document.activeElement?.blur();audio.play('equip');
    if (!hasStarted) enterFullscreen().catch(()=>{});
    hasStarted=true;
  });
  modeButtons.forEach(button=>button.addEventListener('click',()=>{modeTo(button.dataset.mode);button.blur();}));
  gearButtons.forEach(button=>button.addEventListener('click',()=>{equip(button.dataset.gear);button.blur();}));
  window.addEventListener('keydown',event=>{
    if(!playing || event.ctrlKey || event.metaKey || event.altKey) return;
    if(event.code==='KeyM'&&!event.repeat){toggleMap();return;}
    if(mapDialog.open) return;
    if(event.code==='Escape'){showHelp();return;}
    if(['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.code)) event.preventDefault();
    keys.add(event.code);
    if(event.repeat) return;
    if(event.code==='KeyF') interact();
    if(event.code==='KeyV') closeCamera=!closeCamera;
    if(event.code==='KeyR') checkpoint();
    if(event.code==='KeyX') reload();
    if(event.code==='Space'&&!inCar&&position.y===0) jumpVelocity=6.7;
    const slot=['Digit1','Digit2','Digit3','Digit4','Digit5'].indexOf(event.code);
    if(slot<0) return;
    if(inCar) {
      if(slot<modeButtons.length) modeTo(modeButtons[slot].dataset.mode);
    } else equip(gearButtons[slot].dataset.gear);
  });
  window.addEventListener('keyup',event=>keys.delete(event.code));
  function releaseMouse() {
    leftHeld=false;
    if(boosting) audio.play('boostEnd');
    boosting=false;rightDrag=null;canvas.classList.remove('looking');
  }
  window.addEventListener('blur',()=>{keys.clear();releaseMouse();});
  canvas.addEventListener('mousedown',event=>{
    if (!playing || mapDialog.open) return;
    if (event.button===2) {
      event.preventDefault();
      cameraMenuSuppressedUntil=performance.now()+240;
      rightDrag={x:event.clientX,y:event.clientY};canvas.classList.add('looking');
    } else if (event.button===0) {
      if (inCar) leftHeld=true;
      else useGear();
    }
  });
  window.addEventListener('mousemove',event=>{
    if ((event.buttons&1)===0) leftHeld=false;
    if (!rightDrag) {
      if (playing&&!mapDialog.open&&!inCar&&equipped==='pistol'&&event.target===canvas) {
        lookOffset+=clamp(event.movementX,-85,85)*.0041;
        pitchTarget=clamp(pitchTarget-clamp(event.movementY,-85,85)*.0044,-.76,.61);
      }
      return;
    }
    if ((event.buttons&2)===0 || !playing || mapDialog.open) {
      rightDrag=null;canvas.classList.remove('looking');return;
    }
    lookOffset+=(event.clientX-rightDrag.x)*.0055;
    pitchTarget=clamp(pitchTarget-(event.clientY-rightDrag.y)*.006,-.76,.61);
    cameraMenuSuppressedUntil=performance.now()+240;
    rightDrag.x=event.clientX;rightDrag.y=event.clientY;
  });
  window.addEventListener('mouseup',event=>{
    if (event.button===0) leftHeld=false;
    if (event.button===2 && rightDrag) {
      cameraMenuSuppressedUntil=performance.now()+240;
      rightDrag=null;canvas.classList.remove('looking');
    }
  });

  function follow(dt) {
    const p=inCar?car:position;
    if(!hasStarted) {
      camGoal.set(125+Math.sin(elapsed*.16)*13,28,77-Math.sin(elapsed*.14)*7);
      target.set(29,11,12);
      camera.position.lerp(camGoal,1-Math.exp(-dt*3));
      look.lerp(target,1-Math.exp(-dt*4));camera.lookAt(look);
      sky.position.copy(camera.position);scene.background=dayColor;
      return;
    }
    const angle=orbit+(inCar?yaw:0)+(playing?0:Math.sin(elapsed*.25)*.19);
    currentRoom=!inCar?interiors.find(room=>room.contains(position))??null:null;
    const indoor=Boolean(currentRoom);
    avatar.group.visible=!inCar&&!indoor;
    viewGear.visible=indoor&&playing;
    if (indoor) for (const [name,model] of Object.entries(viewItems)) model.visible=equipped===name;
    viewGear.position.y=-.28+Math.sin(gait)*Math.min(.022,walkSpeed*.0028);
    viewGear.position.z=-.72+recoil*.085;
    const aimed=playing&&!inCar&&equipped==='pistol'&&!running;
    const distance=indoor?0:aimed?3.9:closeCamera?(inCar?5:3.5):(inCar?11+(boosting?1.45:0):9.6);
    const height=indoor?1.62+(running?Math.sin(gait)*.025:0):(aimed?2.38:closeCamera?(inCar?2.8:2.5):(inCar?5.25:5.5))-pitch*(aimed?2:3.4);
    const shoulder=indoor?0:aimed?.72:inCar?0:1.22;
    camGoal.set(p.x-Math.sin(angle)*distance+Math.cos(angle)*shoulder,p.y+height,p.z+Math.cos(angle)*distance+Math.sin(angle)*shoulder);
    // Shorten the chase camera before it reaches the back of a building.
    for(let fraction=.16;!indoor&&fraction<=1;fraction+=.12) {
      const x=T.MathUtils.lerp(p.x,camGoal.x,fraction), z=T.MathUtils.lerp(p.z,camGoal.z,fraction);
      const y=p.y+1.4+(height-1.4)*fraction;
      if (solids.some(b=>b.enabled!==false&&y>b.bottom-.16&&y<b.top+.16&&Math.abs(x-b.x)<b.w/2+.24&&Math.abs(z-b.z)<b.d/2+.24)) {
        camGoal.set(T.MathUtils.lerp(p.x,camGoal.x,Math.max(.12,fraction-.12)),p.y+Math.max(2,height*fraction),T.MathUtils.lerp(p.z,camGoal.z,Math.max(.12,fraction-.12)));break;
      }
    }
    if(indoor) camera.position.copy(camGoal);
    else camera.position.lerp(camGoal,1-Math.exp(-dt*8));
    const focusDistance=indoor?5:aimed?18:inCar?5:3;
    const focusY=indoor?height+Math.tan(pitch)*focusDistance:(aimed?1.85:1)+pitch*(aimed?20:10);
    target.set(p.x+Math.sin(angle)*focusDistance,p.y+focusY,p.z-Math.cos(angle)*focusDistance);
    if (indoor) look.copy(target);
    else look.lerp(target,1-Math.exp(-dt*11));
    camera.lookAt(look);
    const nextSubmerged=inCar&&mode==='dive'&&car.y< -1.3;
    if(submerged!==nextSubmerged&&playing) audio.play('water');
    submerged=nextSubmerged;
    sky.visible=!submerged;sky.position.copy(camera.position);
    scene.background=submerged?underwaterColor:dayColor;
    const fov=T.MathUtils.damp(camera.fov,indoor?70:boosting?67:running?63:aimed?54:58,7,dt);
    if(Math.abs(fov-camera.fov)>.035){camera.fov=fov;camera.updateProjectionMatrix();}
    shadow.visible=p.x<coast||flat(p,route.dock)<9;
    shadow.position.set(p.x,.046,p.z);shadow.scale.set(inCar?1.6:.53,inCar?2.6:.53,1);
    shadow.material.opacity=.27*Math.max(.12,1-p.y*.12);
  }
  const dayColor=new T.Color(0xaac7cb),underwaterColor=new T.Color(0x237888);
  const mapLayers=new Map();

  function drawMap(map,p) {
    const w=map.canvas.width,h=map.canvas.height;
    const projectX=x=>(x+112)*w/324,projectZ=z=>(z+108)*h/216;
    const scale=w/416;
    let base=mapLayers.get(w);
    if(!base) {
      base=document.createElement('canvas');base.width=w;base.height=h;
      const ctx=base.getContext('2d');
      const water=ctx.createLinearGradient(projectX(coast),0,w,h*.15);
      water.addColorStop(0,'#286068');water.addColorStop(.42,'#204956');water.addColorStop(1,'#163746');
      ctx.fillStyle=water;ctx.fillRect(0,0,w,h);
      ctx.strokeStyle='#6ab6b426';ctx.lineWidth=scale;
      for(let i=0;i<8;i++) {
        const x=projectX(coast+5+i*12);
        ctx.beginPath();ctx.moveTo(x,0);ctx.bezierCurveTo(x+17*scale,.28*h,x-3*scale,.72*h,x+18*scale,h);ctx.stroke();
      }
      ctx.fillStyle='#344743';ctx.fillRect(0,0,projectX(coast),h);
      ctx.save();ctx.beginPath();ctx.rect(0,0,projectX(coast),h);ctx.clip();
      for(const place of neighborhoods.slice(0,-1)) {
        const x=projectX(place.x),z=projectZ(place.z),r=place.radius*w/238;
        const patch=ctx.createRadialGradient(x,z,r*.06,x,z,r);
        patch.addColorStop(0,place.color+'a0');patch.addColorStop(1,place.color+'00');
        ctx.fillStyle=patch;ctx.fillRect(x-r,z-r,r*2,r*2);
      }
      ctx.restore();
      ctx.fillStyle='#9ba892';ctx.fillRect(projectX(coast-1.9),0,2.6*scale,h);
      ctx.fillStyle='#519397';ctx.fillRect(projectX(-91.5),projectZ(-31.5),19*w/324,15*h/216);
      ctx.fillStyle='#b09c81';ctx.fillRect(projectX(101),projectZ(11),22*w/324,16*h/216);
      ctx.lineCap='round';ctx.lineJoin='round';
      for(const road of roads) {
        ctx.strokeStyle=road.main?'#afbaad':'#8d9a90';ctx.lineWidth=road.width*scale*.65;
        ctx.beginPath();ctx.moveTo(projectX(road.a[0]),projectZ(road.a[1]));ctx.lineTo(projectX(road.b[0]),projectZ(road.b[1]));ctx.stroke();
      }
      for(const road of roads) {
        ctx.strokeStyle=road.main?'#43565a':'#506264';ctx.lineWidth=road.width*scale*.44;
        ctx.beginPath();ctx.moveTo(projectX(road.a[0]),projectZ(road.a[1]));ctx.lineTo(projectX(road.b[0]),projectZ(road.b[1]));ctx.stroke();
      }
      for(const site of footprints) {
        const x=projectX(site.x-site.w/2),z=projectZ(site.z-site.d/2),wid=site.w*w/324,dep=site.d*h/216;
        ctx.fillStyle='#0e242c65';ctx.fillRect(x+scale,z+scale,wid,dep);
        ctx.fillStyle=site.color;ctx.fillRect(x,z,wid,dep);
      }
      ctx.font=`700 ${Math.round(17*scale)}px monospace`;ctx.fillStyle='#c3e0da';ctx.fillText('N',12*scale,24*scale);
      if(w>600) {
        ctx.font='800 18px Bahnschrift, sans-serif';ctx.textAlign='center';ctx.strokeStyle='#16313c';ctx.lineWidth=4;
        for(const place of neighborhoods) {
          const atX=projectX(place.x),atZ=projectZ(place.z-8);
          ctx.strokeText(place.name,atX,atZ);ctx.fillText(place.name,atX,atZ);
        }
        ctx.font='600 14px Bahnschrift, sans-serif';ctx.fillStyle='#97cbc7';ctx.fillText('BREAKWATER BAY',projectX(164),projectZ(45));
      }
      mapLayers.set(w,base);
    }
    map.drawImage(base,0,0);
    for(const job of heists) if(!completedHeists.has(job.id)) {
      const x=projectX(job.entrance[0]),z=projectZ(job.entrance[2]);
      map.fillStyle='#9ae9dd';map.strokeStyle='#234653';map.lineWidth=1.5*scale;
      map.beginPath();map.moveTo(x,z-6*scale);map.lineTo(x+5*scale,z+4*scale);map.lineTo(x-5*scale,z+4*scale);map.closePath();map.fill();map.stroke();
    }
    const objective=currentObjective();
    if(objective) {
      const [x,,z]=objective.target;
      map.save();map.translate(projectX(x),projectZ(z));map.rotate(Math.PI/4);
      map.fillStyle='#ffa35b';map.fillRect(-6*scale,-6*scale,12*scale,12*scale);map.restore();
    } else if (finished) {
      map.fillStyle='#f6c782';
      for(const job of bonusContracts) if(!completedContracts.has(job.id)) {
        map.fillRect(projectX(job.pickup[0])-3*scale,projectZ(job.pickup[2])-3*scale,6*scale,6*scale);
      }
    }
    if(drone.visible){map.fillStyle='#ff6864';map.beginPath();map.arc(projectX(drone.position.x),projectZ(drone.position.z),5*scale,0,Math.PI*2);map.fill();}
    if(fieldBeacon.visible){map.fillStyle='#c4a7ff';map.beginPath();map.arc(projectX(fieldBeacon.position.x),projectZ(fieldBeacon.position.z),4.2*scale,0,Math.PI*2);map.fill();}
    map.save();map.translate(projectX(p.x),projectZ(p.z));map.rotate(inCar?yaw:avatarYaw);
    map.scale(scale,scale);
    map.fillStyle='#a3ffe8';map.strokeStyle='#0a232c';map.lineWidth=2;map.beginPath();
    map.moveTo(0,-11);map.lineTo(8,7);map.lineTo(0,4);map.lineTo(-8,7);map.closePath();map.fill();map.stroke();map.restore();
  }
  function updateHud() {
    const p=inCar?car:position;
    dom.speed.textContent=String(Math.round(Math.abs(speed)*3.6)).padStart(2,'0');
    dom['energy-fill'].style.width=`${energy}%`;
    dom['energy-value'].textContent=`${Math.round(energy)}%`;
    dom.environment.textContent=!inCar?(running?'SPRINTING':'ON FOOT'):mode==='flight'?`ALT ${Math.round(car.y)} M`:mode==='dive'?`DEPTH ${Math.max(0,Math.round(-car.y))} M`:modes[mode].label;
    dom['boost-fill'].style.width=`${nitro}%`;
    dom['boost-value'].textContent=boostLocked?'RECHARGING':`${Math.round(nitro)}%`;
    dom['boost-edges'].classList.toggle('active',boosting);
    dom['gear-detail'].textContent=equipped==='pistol'?(reloadAt?'RELOADING':`${String(ammo).padStart(2,'0')} / 08  ·  X RELOAD`):equipped==='repair'?`${kits} KITS  ·  LEFT CLICK`:'LEFT CLICK TO USE';
    dom.reticle.hidden=!playing || mapDialog.open || inCar || equipped!=='pistol';
    dom.reticle.classList.toggle('hit',hitUntil>elapsed);
    dom['weather-label'].textContent=atmosphere.label();
    dom.credits.textContent=`₡ ${credits.toLocaleString()}`;
    const alert=heistDeadline>0?3:security;
    dom.wanted.textContent=alert===3?'◆ ◆ ◆':alert?'◆ ◆ ◇':'◇ ◇ ◇';dom.wanted.classList.toggle('hot',alert>0);
    $('objectives').classList.toggle('lockdown',heistDeadline>0);
    const venue=heists.find(job=>job.room===currentRoom?.id)?.venue??(currentRoom?.id==='cafe'?'Tideglass Café':null);
    const district=neighborhoods.reduce((closest,place)=>Math.hypot(p.x-place.x,p.z-place.z)<Math.hypot(p.x-closest.x,p.z-closest.z)?place:closest);
    $('district-name').textContent=(venue??district.name).toUpperCase();
    const objective=currentObjective();
    const bonus=cargoBonusLabel();
    const timeLeft=heistDeadline>0?` · LOCKDOWN ${Math.max(0,Math.ceil(heistDeadline-missionTime))}S`:'';
    dom.distance.textContent=objective?`${objective.name.toUpperCase()} · ${Math.round(near(p,objective.target))} M${bonus}${timeLeft}`:'REWARD DEPOSITED';
    let hint='';
    const heistAction=heist?.actions[actionIndex];
    const ready=locatedHeist();
    if(heistAction&&near(p,heistAction.target)<(heistAction.escape?7.8:2.65)&&(heistAction.escape||currentRoom?.id===heist.room)) hint=`[F] ${heistAction.prompt}`;
    else if(ready) hint=`[F] ${ready.actions[0].prompt}`;
    else if(!inCar&&currentRoom?.counter&&near(p,currentRoom.counter)<2.4) hint='[F] Use the café counter';
    else if(contract&&near(p,objective.target)<6.5) hint=carrying?'[F] Deliver cargo':'[F] Load cargo';
    else if(!inCar&&p.distanceTo(car)<4.05) hint='[F] Enter sedan';
    else if(!heist&&inCar&&stage===3&&mode==='dive'&&near(car,route.core)<5.2) hint='[F] Recover signal core';
    else if(!heist&&inCar&&stage===4&&near(car,route.dock)<8&&car.y>=-.24&&car.y<4) hint='[F] Deliver core';
    else if(inCar&&car.y<=1.3&&Math.abs(speed)<1&&(car.x<coast-1||onDock(car.x,car.z))) hint='[F] Exit sedan';
    dom.prompt.hidden=!hint;if(dom.prompt.textContent!==hint)dom.prompt.textContent=hint;
    drawMap(map,p);
    if (mapDialog.open) drawMap(largeMap,p);
  }
  function cargoBonusLabel() {
    if (!contract || !carrying) return '';
    const remaining=Math.ceil(contractDeadline-missionTime);
    return remaining>0?` · BONUS ${remaining}S`:'';
  }
  function effects(dt) {
    const objective=currentObjective();
    const [x,y,z]=objective?.target??route.dock;
    ring.visible=Boolean(objective);
    ring.position.set(x,y+(heist||trackedHeist||contract?1.62:stage===0?3.05:stage===1||stage===4?1.8:0),z);
    diamond.position.y=Math.sin(elapsed*3)*.3;
    diamond.rotation.y=elapsed*1.8;
    halo.rotation.y=elapsed*.6;
    const color=heist?.color??trackedHeist?.color??(contract?0xffd391:checkpointColors[Math.min(stage,checkpointColors.length-1)]);
    ringMaterial.color.setHex(color);diamond.material.color.setHex(color);guide.material.color.setHex(color);
    ringMaterial.opacity=.72+.18*Math.sin(elapsed*4);
    ring.scale.setScalar(scanUntil>elapsed?1.18+Math.sin(elapsed*7)*.16:1);
    guide.visible=Boolean(objective)&&(heist||trackedHeist||contract||stage!==3);
    guide.position.set(x,ring.position.y*.5,z);guide.scale.y=Math.max(.2,ring.position.y);
    core.visible=stage<4;core.rotation.y=elapsed*.7;
    for (const {job,marker} of entrances) {
      const room=roomsById.get(job.room);
      const done=completedHeists.has(job.id), active=heist===job;
      if(!done&&!active&&currentRoom!==room) unlockedHeists.delete(job.id);
      const open=unlockedHeists.has(job.id);
      room.gate.update(dt,open,active&&heistDeadline>0,elapsed);
      room.loot.visible=!done&&!(active&&heistDeadline>0);
      marker.visible=!done&&!active;marker.position.y=2.15+Math.sin(elapsed*2+job.entrance[0])*.19;marker.rotation.y=elapsed*.85;
    }
    fieldBeacon.rotation.y=elapsed*1.7;
    fieldBeacon.position.y=1.12+Math.sin(elapsed*3.5)*.2;
    vehicle.kits[mode]?.scale.lerp(unitScale,Math.min(dt*8,1));
    vehicle.exhaust.visible=boosting;
    if (boosting) vehicle.exhaust.scale.z=.97+Math.sin(elapsed*144)*.14+Math.cos(elapsed*91)*.10;
    range.update(elapsed,dt);
    if(security>0 && playing && !mapDialog.open) {
      const px=Math.min(car.x,coast+14),pz=car.z;
      const dx=px-drone.position.x,dz=pz-drone.position.z,length=Math.max(1,Math.hypot(dx,dz));
      const step=Math.min(length,10*dt);
      drone.position.x+=dx/length*step;drone.position.z+=dz/length*step;
      drone.position.y=T.MathUtils.lerp(drone.position.y,Math.max(6.5,car.y+3),dt*2);
      drone.rotation.y=-Math.atan2(dx,-dz);droneLamp.visible=Math.sin(elapsed*18)>0;
      if(length<5.1&&Math.abs(car.y-drone.position.y)<4&&energy>0) energy=Math.max(0,energy-dt*4);
    }
    drone.visible=security>0;
  }
  const unitScale=new T.Vector3(1,1,1);
  updateObjective();updateLoadout();updateHud();
  camera.position.set(125,28,77);look.set(29,11,12);
  let previous=performance.now();
  renderer.setAnimationLoop(now=>{
    const dt=Math.min((now-previous)/1000,.05);previous=now;elapsed+=dt;
    const active=playing&&!mapDialog.open;
    if(active){
      missionTime+=dt;
      if(heistDeadline>0&&missionTime>heistDeadline) failHeist('Lockdown reached · return to the entrance and retry');
      orbit=T.MathUtils.damp(orbit,lookOffset,13,dt);
      pitch=T.MathUtils.damp(pitch,pitchTarget,13,dt);
      if(inCar)drive(dt);else walk(dt);
    }
    if(reloadAt&&elapsed>=reloadAt){ammo=8;reloadAt=0;}
    follow(dt);effects(dt);
    const wet=atmosphere.update(dt,camera,submerged,active);
    audio.update({running:inCar,speed,mode,boosting,wet,active});
    if(toastTime<elapsed)dom.toast.hidden=true;
    hudTime+=dt;if(hudTime>=.08){hudTime=0;updateHud();}
    renderer.render(scene,camera);
  });
}
