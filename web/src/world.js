import * as T from 'three';

export const coast = 106;
export const route = {
  spawn: [0, 0, 83], sedan: [1.2, 0, 68], sprint: [0, 0, 19],
  tower: [54, 15, -32], core: [135, -8, -30], dock: [110, 0, 19],
};

const cube = new T.BoxGeometry(1, 1, 1);

function material(color, glow = 0) {
  return new T.MeshStandardMaterial({ color, roughness: .76, emissive: glow, emissiveIntensity: .8 });
}

export function part(parent, x, y, z, w, h, d, color, glow = 0) {
  const mesh = new T.Mesh(cube, material(color, glow));
  mesh.position.set(x, y, z);
  mesh.scale.set(w, h, d);
  parent.add(mesh);
  return mesh;
}

export function makeCar() {
  const group = new T.Group();
  part(group,0,.53,0,2.1,.48,4.35,0x365e6f);
  part(group,0,.93,-.95,2,.3,1.95,0x578b98);
  part(group,0,1.18,.26,1.66,.62,1.94,0x223f50);
  part(group,0,1.51,.38,1.59,.11,1.54,0x63929a);
  part(group,0,.88,1.53,2,.25,1.12,0x578b98);
  part(group,0,.61,-2.22,1.4,.23,.065,0x172632);
  part(group,0,.47,2.19,1.9,.14,.075,0x23313a);
  const wheels=[];
  const wheelRadius = .36;
  const tireGeometry = new T.CylinderGeometry(wheelRadius,wheelRadius,.30,20).rotateZ(Math.PI/2);
  const rimGeometry = new T.CylinderGeometry(.195,.195,.31,16).rotateZ(Math.PI/2);
  const tireMaterial = material(0x18252d), rimMaterial = material(0x78939e);
  for (const x of [-1.02,1.02]) {
    part(group,x*.68,.82,-2.19,.45,.14,.09,0xffefc7,0xffd185);
    part(group,x*.68,.81,2.14,.43,.13,.07,0xef7050,0xd6432f);
    for (const z of [-1.35,1.34]) {
      const steering = new T.Group(), axle = new T.Group();
      steering.position.set(x,wheelRadius,z);
      group.add(steering);
      steering.add(axle);
      axle.add(new T.Mesh(tireGeometry,tireMaterial),new T.Mesh(rimGeometry,rimMaterial));
      const side = Math.sign(x);
      part(axle,side*.163,0,0,.035,.31,.058,0xc3d2d5);
      part(axle,side*.164,0,0,.033,.055,.29,0xc3d2d5);
      part(axle,side*.161,.265,.025,.024,.075,.125,0x8bbac4);
      wheels.push({ steering, axle, front:z<0 });
    }
  }
  const boost = new T.Group(), flight = new T.Group(), dive = new T.Group();
  const exhaust = new T.Group();
  exhaust.visible=false;
  boost.add(exhaust);
  const flameGeometry = new T.ConeGeometry(1,1,12).translate(0,.5,0).rotateX(Math.PI/2);
  const outerFlame = new T.MeshBasicMaterial({color:0xff682c,transparent:true,opacity:.72,depthWrite:false,blending:T.AdditiveBlending});
  const innerFlame = new T.MeshBasicMaterial({color:0xb8f4ff,transparent:true,opacity:.96,depthWrite:false,blending:T.AdditiveBlending});
  for(const x of [-.65,.65]) {
    part(boost,x,.42,2.23,.25,.19,.19,0x24313a);
    for(const [material,width,length] of [[outerFlame,.24,2.05],[innerFlame,.12,1.3]]) {
      const flame = new T.Mesh(flameGeometry,material);
      flame.position.set(x,.42,2.29);flame.scale.set(width,width,length);exhaust.add(flame);
    }
  }
  group.add(boost,flight,dive);
  part(boost,0,1.23,1.92,2.42,.12,.43,0xff9955,0xcb5729);
  for(const x of [-1.05,1.05]) {
    part(boost,x,.53,.04,.12,.16,2.7,0xff9955,0xf08036);
    part(flight,x*1.75,.74,.2,2.44,.13,1.25,0x7debd9,0x23c4ac).rotation.y = x*.25;
    part(flight,x*.87,.53,1.88,.42,.48,.73,0x296b80);
    part(flight,x*.87,.53,2.28,.26,.31,.12,0x75efff,0x4af7ff);
    part(dive,x*.96,.63,.34,.54,.46,3.45,0x8ba8f9,0x344298);
    part(dive,x*.89,.62,-1.55,.31,.2,.12,0x7fc0ff,0x63baff);
  }
  return { group, wheels, wheelRadius, exhaust, kits: {boost,flight,dive} };
}

export function makePlayer() {
  const group=new T.Group();
  const torso=new T.Group();torso.position.y=1.04;group.add(torso);
  part(torso,0,.15,0,.58,.43,.33,0xe5905b);
  part(torso,0,.035,0,.56,.105,.365,0x263d4b);
  part(torso,0,.50,0,.37,.36,.33,0xc89a7e);
  part(torso,0,.63,.029,.43,.16,.39,0x273949);
  part(torso,0,.49,-.179,.37,.09,.038,0x294755);
  part(torso,0,.14,.187,.34,.29,.14,0x273949);
  part(torso,0,.15,.267,.071,.09,.012,0x9df9e3,0x51ae9d);
  const legs=[]; const arms=[];
  for(const x of [-1,1]) {
    const leg=new T.Group(); leg.position.set(x*.155,.99,0); group.add(leg); legs.push(leg);
    part(leg,0,-.4,0,.22,.71,.24,0x27475a);
    part(leg,0,-.85,-.065,.24,.19,.38,0x152831);
    const arm=new T.Group();arm.position.set(x*.37,.31,0);torso.add(arm);arms.push(arm);
    part(arm,0,-.22,0,.17,.44,.21,0xc97652);
    part(arm,0,-.48,0,.18,.15,.19,0xe1b591);
  }
  const hand = new T.Group();
  hand.position.set(.025,-.51,-.14);
  arms[1].add(hand);
  const gear = {};
  for (const name of ['pistol','scanner','repair','beacon','pad']) {
    gear[name] = new T.Group();
    hand.add(gear[name]);
  }
  part(gear.pistol,0,.041,-.09,.11,.10,.26,0x3c5869);
  part(gear.pistol,0,-.055,-.04,.089,.15,.10,0x203641);
  part(gear.pistol,0,.06,-.217,.076,.061,.016,0x9df9e3,0x55cbac);
  part(gear.scanner,0,.01,-.07,.15,.11,.27,0x253d4b);
  part(gear.scanner,0,.068,-.10,.117,.015,.159,0x93eac3,0x4cbe8c);
  part(gear.repair,0,-.08,-.047,.24,.21,.28,0xff9855);
  part(gear.repair,.127,-.08,-.047,.018,.10,.04,0xffefd2);
  part(gear.repair,.127,-.08,-.047,.018,.04,.108,0xffefd2);
  part(gear.beacon,0,-.031,-.054,.10,.25,.10,0xa88cf9);
  part(gear.beacon,0,.107,-.054,.12,.048,.12,0xd2afff,0x8f55fe);
  part(gear.pad,0,.03,-.079,.23,.045,.22,0x35526a);
  part(gear.pad,0,.054,-.079,.185,.014,.172,0x91c5f2,0x4975b4);
  return {group,torso,legs,arms,gear};
}
