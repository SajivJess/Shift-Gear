import * as T from 'three';
import {part} from './world.js';

export const heists = [
  {
    id:'ledger',title:'The Night Ledger',venue:'Vela Exchange',room:'exchange',
    entrance:[-28,0,54.4],reward:4800,seconds:85,color:0xffb06a,
    actions:[
      {target:[-35.5,0,46.9],name:'Security desk',prompt:'Override security',brief:'Enter Vela Exchange and override the security desk.',gate:true},
      {target:[-28,0,36.4],name:'Archive',prompt:'Take the ledger',brief:'The vault is open. Take the encrypted ledger from the archive.',loot:true},
      {target:[-54,0,63],name:'Market handoff',prompt:'Deliver the ledger',brief:'Carry the ledger to the Market Way handoff before the alarm timer runs out.',escape:true},
    ],
  },
  {
    id:'cache',title:'Floodgate Cache',venue:'Cinder Freight',room:'warehouse',
    entrance:[76,0,58.4],reward:6200,seconds:95,color:0x86e6e4,
    actions:[
      {target:[68,0,52.8],name:'Warehouse breaker',prompt:'Enable the bypass',brief:'Enter Cinder Freight and enable the breaker on the west wall.'},
      {target:[82.5,0,47.4],name:'Freight console',prompt:'Unlock the cargo cage',brief:'Use the powered freight console to unlock the storage cage.',gate:true},
      {target:[76,0,38],name:'Tagged crate',prompt:'Take the floodgate module',brief:'Recover the floodgate module from the tagged crate.',loot:true},
      {target:[109,0,19],name:'Dock handoff',prompt:'Deliver the module',brief:'Get the module to the dock handoff before security locks down the district.',escape:true},
    ],
  },
];

export function makeInteriors(scene,{box,light,solid,collider,footprint,sign}) {
  function room({id,x,z,w,d,h,face,wall,trim,floor,name}) {
    const front=z+face*d/2,back=z-face*d/2;
    const entryWidth=4.35;
    box(x,.034,z,w,.065,d,floor);
    for(let i=-w/2+1.6;i<w/2-1.2;i+=2.4) box(x+i,.071,z,.026,.009,d-.5,0x8f9690);
    for(let i=-d/2+1.6;i<d/2-1.2;i+=2.4) box(x,.072,z+i,w-.5,.009,.026,0x8f9690);
    footprint(x,z,w,d,'#a4a99e');
    solid(x,h/2,back,w,h,.43,wall);
    for(const side of [-1,1]) {
      solid(x+side*w/2,h/2,z,.43,h,d,wall);
      const sideWidth=(w-entryWidth)/2;
      solid(x+side*(entryWidth/2+sideWidth/2),h/2,front,sideWidth,h,.43,wall);
      box(x+side*(entryWidth/2+.15),1.67,front+face*.3,.3,3.3,.55,trim);
      light(x+side*(entryWidth/2+.19),2.28,front+face*.59,.085,1.55,.038,0xffd191);
      for(const offset of [3.7,6.7,9.6].filter(offset=>offset<w/2-.7)) {
        box(x+side*offset,2.1,front+face*.242,2.25,1.8,.085,0x344f60);
        light(x+side*offset,2.1,front+face*.294,2.03,1.53,.038,0x79a9ab);
        box(x+side*offset,2.1,front+face*.33,.075,1.57,.043,trim);
      }
    }
    solid(x,(h+3.27)/2,front,entryWidth,h-3.27,.45,wall);
    box(x,h+.19,z,w+.85,.53,d+.76,trim);
    collider(x,h+.19,z,w+.85,.53,d+.76);
    box(x,h-.12,z,w-.3,.19,d-.30,0xa9a99c);
    box(x,3.32,front+face*.38,5.1,.16,1.35,trim);
    for (const dx of [-w*.22,w*.22]) for(const dz of [-d*.23,d*.23]) {
      box(x+dx,h-.28,z+dz,.39,.14,3.3,0x3e535c);
      light(x+dx,h-.368,z+dz,.27,.04,3.16,0xffebbe);
    }
    sign(name,x,3.94,front+face*.37,Math.min(w*.72,13),{
      color:id==='warehouse'?'#ffe2a0':'#e8f5df',back:id==='warehouse'?'#344a53':'#454b43',yaw:face===-1?Math.PI:0,
    });
    return { id,x,z,w,d,h,front, contains:point=>Math.abs(point.x-x)<w/2+.03&&Math.abs(point.z-z)<d/2+.03&&point.y<h-.1 };
  }

  function slidingDoor(room,z,color) {
    const gap=3.75,span=(room.w-gap)/2-.17;
    const height=room.h-.13;
    for(const side of [-1,1]) solid(room.x+side*(gap/2+span/2),height*.5,z,span,height,.43,color);
    solid(room.x,(room.h+3.2)/2,z,gap,room.h-3.2,.44,color);
    const door=new T.Group();door.position.set(room.x,0,z);scene.add(door);
    part(door,0,1.57,0,gap-.13,3.10,.36,0x394c57);
    for(const x of [-1.35,-.45,.45,1.35]) part(door,x,1.65,.215,.063,2.48,.044,0x627782);
    part(door,0,.21,.207,gap-.32,.14,.052,0xdc9b52,0x64411f);
    const blocker=collider(room.x,1.6,z,gap,3.2,.46);
    const frameLight=part(scene,room.x,3.19,z+.24,2.5,.091,.093,0xeb9672,0x984d33);
    const alarm=part(scene,room.x+.92,room.h-.48,z+.18,.3,.18,.26,0x695f51);
    let amount=0;
    return {update(dt,open,alert,now){
      amount=T.MathUtils.damp(amount,open?1:0,8.5,dt);
      door.position.x=room.x+amount*(gap+.17);
      blocker.enabled=amount<.88;
      frameLight.material.color.setHex(open?0x77ddd0:0xeb9672);
      alarm.material.color.setHex(alert&&Math.sin(now*16)>0?0xff7345:0x695f51);
      alarm.material.emissive.setHex(alert&&Math.sin(now*16)>0?0xeb431c:0x080702);
    }};
  }

  function console(x,z,tone) {
    solid(x,.57,z,1.18,1.14,.66,0x46585f);
    box(x,1.17,z,1.22,.105,.72,0x7b8c8e);
    light(x,1.24,z,.77,.027,.45,tone);
  }
  function cargo(x,y,z,color) {
    const prop=new T.Group();prop.position.set(x,y,z);scene.add(prop);
    part(prop,0,.22,0,1.01,.38,.77,0x2f444d);
    part(prop,0,.47,0,.82,.08,.59,color,color);
    for(const side of [-1,1]) part(prop,side*.36,.23,0,.05,.395,.79,0x7d8c88);
    return prop;
  }

  const exchange=room({id:'exchange',x:-28,z:43,w:28,d:20,h:5.85,face:1,wall:0xc6a986,trim:0x6f7669,floor:0xa7a291,name:'VELA EXCHANGE'});
  box(-28,6.15,43,25.1,.42,16.9,0x9d997f);
  box(-28,6.6,43,21.8,.57,13.5,0xb2a485);
  box(-28,7.15,43,17.8,.65,9.1,0xa79779);
  for(const x of [-38,-33,-23,-18]) {
    box(x,2.69,54.12,.43,5.36,.52,0xc6b08e);
    box(x,5.24,54.12,.68,.31,.76,0xad9b80);
  }
  box(-28,5.29,54.08,22,.36,1.48,0xc4b498);
  box(-28,.076,47.6,4.2,.032,8.6,0x785c51);
  for(const x of [-38,-18]) {
    solid(x,.55,44.2,2.2,1.1,3,0x7d6252);
    box(x,1.14,44.2,2.28,.13,3.17,0xb79875);
  }
  console(-36.2,45.6,0xabe2cd);
  solid(-28,.39,35.3,2.6,.78,1,0x5b6a66);
  exchange.gate=slidingDoor(exchange,39.5,0x9e8f79);
  exchange.loot=cargo(-28,.80,35.34,0xffb46e);

  const warehouse=room({id:'warehouse',x:76,z:46,w:24,d:22,h:6.6,face:1,wall:0x75827e,trim:0x505d62,floor:0x858a7d,name:'CINDER FREIGHT'});
  for(const z of [37.2,41.6,46,50.4,54.8]) {
    box(76,6.13,z,23.3,.2,.31,0x4e5a61);
    for(const x of [64.4,87.6]) box(x,3.31,z,.20,6.60,.28,0x455459);
  }
  for (let i=0;i<6;i++) {
    const x=i%2?85:66.5,z=37.1+Math.floor(i/2)*3.08;
    solid(x,.86,z,1.44,1.72,1.62,i%2?0xa48756:0x806755);
    box(x,1.735,z,1.47,.05,1.65,0xae9868);
  }
  solid(67.1,.64,50.5,2.04,1.28,1.71,0xa18a60);
  console(67.15,54.02,0xd7b26a);console(83.45,47,0x96dbc6);
  warehouse.gate=slidingDoor(warehouse,42,0x596b69);
  solid(76,.32,37.2,2.05,.64,1.22,0x46646a);
  warehouse.loot=cargo(76,.65,37.1,0x8ce4e8);

  const cafe=room({id:'cafe',x:25,z:94,w:15,d:12,h:4.9,face:-1,wall:0xa77458,trim:0x5d6c57,floor:0xb0a38b,name:'TIDEGLASS CAFE'});
  box(25,3.34,87.2,9.8,.15,1.76,0x527c70);
  for(let i=0;i<8;i++) box(20.4+i*1.32,3.429,87.2,.47,.034,1.76,0xe0c396);
  solid(29.9,.65,96.8,3.1,1.3,1.1,0x8d6650);
  box(29.9,1.32,96.8,3.16,.12,1.27,0xc49a75);
  for(const [x,z] of [[20.5,92.2],[20.5,96.1],[28.8,91.3]]) {
    solid(x,.53,z,1.15,1.06,1.15,0x788070);
    box(x,1.06,z,1.26,.12,1.26,0xb8926b);
    box(x+.76,.49,z,.43,.11,.53,0x597366);
    box(x-.76,.49,z,.43,.11,.53,0x597366);
  }
  cafe.counter=[29.1,0,95.35];
  return [exchange,warehouse,cafe];
}
