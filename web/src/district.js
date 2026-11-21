import * as T from 'three';
import {coast} from './world.js';
import {makeInteriors} from './interiors.js';

const surfaces = new T.BoxGeometry(1,1,1);
const round = new T.CylinderGeometry(1,1,1,12);
const canopy = new T.IcosahedronGeometry(1,1);
const dummy = new T.Object3D();
const paint = new T.Color();

export const roads = [
  { a:[0,-103], b:[0,103], width:16, main:true },
  { a:[-106,65], b:[106,65], width:14, main:true },
  { a:[-106,19], b:[106,19], width:13, main:true },
  { a:[-67,-32], b:[106,-32], width:13, main:true },
  { a:[-65,-78], b:[94,-78], width:10, main:true },
  { a:[-54,-78], b:[-54,65], width:10 },
  { a:[54,-89], b:[54,65], width:11 },
  { a:[94,-89], b:[94,98], width:9 },
  { a:[-86,65], b:[-86,86], width:7 },
  { a:[-86,86], b:[-72,94], width:7 },
  { a:[-72,94], b:[0,94], width:7 },
  { a:[54,65], b:[64,82], width:8 },
  { a:[64,82], b:[94,82], width:8 },
  { a:[-101,-11], b:[-81,0], width:7 },
  { a:[-81,0], b:[-54,0], width:7 },
];

export const neighborhoods = [
  {name:'Foundry Court', x:23, z:83, radius:28, color:'#9a7160'},
  {name:'Vela Market', x:-36, z:48, radius:34, color:'#a8835c'},
  {name:'Glassline', x:28, z:-64, radius:48, color:'#6699a6'},
  {name:'Rain Garden', x:-82, z:-33, radius:35, color:'#76a087'},
  {name:'Cinder Wharf', x:82, z:45, radius:33, color:'#a17e62'},
  {name:'Beacon Point', x:166, z:-67, radius:30, color:'#a0afb1'},
];

function randomFrom(seed) {
  return () => {
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    return seed/4294967296;
  };
}

export function makeDistrict(scene) {
  const records=[], lights=[], drums=[], crowns=[];
  const solids=[], footprints=[];
  const random=randomFrom(77031);
  const box=(x,y,z,w,h,d,color,yaw=0)=>records.push([x,y,z,w,h,d,color,yaw]);
  const light=(x,y,z,w,h,d,color,yaw=0)=>lights.push([x,y,z,w,h,d,color,yaw]);
  const roundBox=(x,y,z,w,h,d,color)=>drums.push([x,y,z,w,h,d,color,0]);
  const foliage=(x,y,z,w,h,d,color,yaw=0)=>crowns.push([x,y,z,w,h,d,color,yaw]);
  const collider=(x,y,z,w,h,d)=>{
    const body={x,z,w,d,bottom:y-h*.5,top:y+h*.5};
    solids.push(body);return body;
  };
  const solid=(x,y,z,w,h,d,color)=>{box(x,y,z,w,h,d,color);return collider(x,y,z,w,h,d);};
  const footprint=(x,z,w,d,color)=>footprints.push({x,z,w,d,color});

  box(-2,-1.7,0,216,3.4,208,0x627d71);
  box(141,-12.05,1,285,2.1,325,0x38616a);
  box(104,-.74,0,4,1.48,208,0x9eac9e);
  box(103,.08,-41,5.7,.16,115,0xc8b49a);
  box(112,-.28,19,22,.56,16,0xb3a791);
  box(113,-.19,19,20,.38,10,0x4f6270);
  box(102,.065,52,7,.13,48,0xb5a18c);

  function section(a,b,width,y,height,color) {
    const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
    box((a[0]+b[0])/2,y,(a[1]+b[1])/2,width,height,length+.12,color,Math.atan2(dx,dz));
  }
  function roadDistance(x,z,{a,b}) {
    const dx=b[0]-a[0],dz=b[1]-a[1];
    const t=T.MathUtils.clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);
    return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);
  }
  for(const road of roads) section(road.a,road.b,road.width+3.7,.007,.014,0x919b92);
  for(const road of roads) section(road.a,road.b,road.width,.023,.026,road.main?0x35434b:0x40505a);
  for(const road of roads) {
    const {a,b,width,main}=road;
    const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
    const ux=dx/length,uz=dz/length;
    for(let t=5;t<length-3;t+=main?7.4:9) {
      const x=a[0]+ux*t,z=a[1]+uz*t;
      if (roads.some(other=>other!==road&&roadDistance(x,z,other)<other.width*.63)) continue;
      box(x,.043,z,.17,.012,main?2.6:1.3,main?0xe4b981:0xa2b6af,Math.atan2(ux,uz));
    }
    if(main) for(let t=3;t<length-2;t+=3) {
      const x=a[0]+ux*t,z=a[1]+uz*t;
      for(const side of [-1,1]) {
        const px=x+uz*(width/2+.55)*side,pz=z-ux*(width/2+.55)*side;
        if (!roads.some(other=>other!==road&&roadDistance(px,pz,other)<other.width*.57)) {
          box(px,.071,pz,.32,.118,3.06,0xa8b1a9,Math.atan2(ux,uz));
        }
      }
    }
  }
  for(const [x,z] of [[0,65],[0,19],[0,-32],[54,-32],[54,19],[94,19],[-54,65]]) {
    for(let i=-5;i<=5;i+=1.65) box(x+i,.045,z+8.3,.84,.014,1.66,0xc8d4ce);
  }

  function sign(text,x,y,z,width,{color='#eafff2',back='#203a48',yaw=0}={}) {
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=100;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle=back;ctx.fillRect(0,0,512,100);
    ctx.fillStyle=color;ctx.fillRect(0,0,512,4);ctx.fillRect(0,96,512,4);
    ctx.font='700 50px Bahnschrift, Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(text,256,53,474);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
    const mesh=new T.Mesh(new T.PlaneGeometry(width,width*.1953),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));
    mesh.position.set(x,y,z);mesh.rotation.y=yaw;scene.add(mesh);
  }

  function tree(x,z,size=1,kind='leaf') {
    if(roads.some(road=>roadDistance(x,z,road)<road.width/2+1.65)) return;
    roundBox(x,1.8*size,z,.14*size,3.6*size,.14*size,0x7a614a);
    if(kind==='palm') {
      for(let i=0;i<5;i++) {
        const a=i*Math.PI*.4;
        foliage(x+Math.cos(a)*.94*size,3.7*size,z+Math.sin(a)*.94*size,1.4*size,.21*size,.46*size,0x629361,-a);
      }
    } else {
      foliage(x,3.54*size,z,1.35*size,1.48*size,1.23*size,0x587f5d,.4);
      foliage(x+.47*size,4.16*size,z-.34*size,.80*size,.87*size,.71*size,0x8fa562,1);
    }
  }
  function streetLamp(x,z,dir=1) {
    box(x,2.8,z,.14,5.6,.16,0x384750);
    box(x+dir*.55,5.51,z,1.24,.125,.18,0x41525a);
    light(x+dir*1.03,5.42,z,.26,.091,.31,0xffe4a8);
  }
  function bench(x,z) {
    box(x,.48,z,2.35,.12,.55,0x8c6449);
    box(x,.84,z-.22,2.32,.42,.10,0xbb895e);
    for(const leg of [-.8,.8]) box(x+leg,.24,z,.11,.46,.42,0x3c4b50);
  }
  function plaza(x,z,w,d,tone) {
    box(x,.031,z,w,.06,d,tone);
    for(let i=-w*.5+2;i<w*.5;i+=4.7) box(x+i,.072,z,.029,.012,d*.97,0x899688);
    for(let i=-d*.5+2;i<d*.5;i+=4.7) box(x,.073,z+i,w*.97,.012,.029,0x899688);
  }
  function building({x,z,w,d,h,style='brick',color}) {
    const glass=style==='glass',stack=style==='step',service=style==='workshop';
    const trim=glass?0x9bbac0:service?0x54616a:0xb2a18a;
    solid(x,h/2,z,w,h,d,color);footprint(x,z,w,d,glass?'#5b818d':service?'#756b65':'#81766e');
    box(x,.18,z,w+.86,.36,d+.86,trim);
    box(x,h+.16,z,w+.62,.33,d+.68,trim);
    if(stack||glass) {
      const t=stack?h*.29:Math.min(9,h*.23);
      solid(x+w*.08,h+t*.5,z-d*.10,w*.64,t,d*.61,glass?0x577d88:color);
      if(glass) {
        box(x+w*.08,h+t+.13,z-d*.1,w*.72,.24,d*.66,0xc0bfac);
        light(x+w*.08,h+t+.34,z-d*.1,w*.62,.22,d*.59,0x73b5be);
      }
    } else if (service) {
      const roof=new T.Mesh(new T.CylinderGeometry(1,1,w+.85,3),new T.MeshStandardMaterial({color:0xc3a37c,roughness:.86}));
      roof.rotation.z=Math.PI/2;roof.position.set(x,h+.67,z);roof.scale.set(.95,1,d*.58);scene.add(roof);
    } else box(x,h+.51,z,w*.36,.84,d*.32,0x59646b);
    const gap=glass?2.42:service?3.7:3.12;
    for(let y=2.65;y<h-1;y+=gap) {
      if(glass) {
        for(const face of [-1,1]) {
          light(x,y,z+face*(d/2+.018),w-.76,1.49,.038,random()>.75?0x83b4b8:0x528494);
          light(x+face*(w/2+.018),y,z,.038,1.49,d-.68,0x6b9ba4);
        }
        for(let ox=-w/2+1.7;ox<w/2-1;ox+=3.3) for(const face of [-1,1]) {
          box(x+ox,y,z+face*(d/2+.045),.082,1.59,.079,0x57707c);
        }
      } else for(let ox=-w/2+1.6;ox<w/2-1;ox+=service?3.8:3.03) {
        for(const face of [-1,1]) light(x+ox,y,z+face*(d/2+.022),1.38,service?1.6:1.13,.045,random()>.47?0xeac582:0x586f76);
      }
    }
  }

  // Each district has its own blocks, height limits, frontage, and street character.
  plaza(25,86,33,27,0xbeaa90);
  plaza(-27,48,36,24,0xbda98f);
  plaza(75,43,33,32,0x8b9186);
  plaza(26,-13,35,36,0x9eaba2);
  plaza(-80,-23,37,37,0x8b9b84);
  plaza(-32,82,40,24,0xb3a690);

  const buildings=[
    {x:-73,z:46,w:23,d:18,h:11,color:0xb4846b,style:'step'},
    {x:-91,z:39,w:12,d:13,h:7,color:0xa67867,style:'workshop'},
    {x:-31,z:10,w:28,d:10,h:10,color:0xa49a85,style:'brick'},
    {x:-36,z:-52,w:24,d:18,h:13,color:0xc39b7e,style:'step'},
    {x:-22,z:-65,w:17,d:13,h:8,color:0x967669,style:'brick'},
    {x:-84,z:-78,w:30,d:20,h:11,color:0xb7a68e,style:'step'},
    {x:-78,z:77,w:13,d:9,h:7,color:0xb48c6d,style:'workshop'},
    {x:-38,z:81,w:20,d:11,h:7,color:0xbc8f6d,style:'brick'},
    {x:26,z:42,w:29,d:22,h:30,color:0x7397a3,style:'step'},
    {x:37,z:57,w:12,d:8,h:9,color:0xab907d,style:'brick'},
    {x:23,z:-57,w:22,d:20,h:43,color:0x5b8797,style:'glass'},
    {x:42,z:-65,w:11,d:7,h:19,color:0x819f9f,style:'glass'},
    {x:72,z:-60,w:24,d:17,h:34,color:0x759ba3,style:'glass'},
    {x:72,z:-47,w:17,d:9,h:16,color:0x8d999b,style:'glass'},
    {x:35,z:-93,w:30,d:12,h:26,color:0x748990,style:'step'},
    {x:71,z:-5,w:19,d:22,h:14,color:0xa38776,style:'brick'},
    {x:23,z:-13,w:17,d:15,h:8,color:0xb3a082,style:'step'},
    {x:74,z:92,w:12,d:9,h:5,color:0x848278,style:'workshop'},
  ];
  for(const data of buildings) building(data);
  sign('GLASSLINE',23,9,-46.95,12,{color:'#def8fa',back:'#325361'});
  sign('VELA MARKET',-73,5,55.05,14,{color:'#fce2b5',back:'#755646'});
  sign('FOUNDRY COURT',19,3.5,96,11,{color:'#fff0d7',back:'#654b40'});

  // Rain Garden: rows of stepping stones, an open pavilion, and a low water garden.
  box(-82,.07,-24,24,.14,23,0xc1b99d);
  box(-82,.15,-24,19,.11,15,0x52959b);
  for(let i=0;i<7;i++) box(-91+i*3,.23,-19,.9,.14,2.55,0xcacbb2);
  roundBox(-85,1.15,-26,.76,2.1,.76,0xb0bab0);
  roundBox(-85,2.22,-26,1.46,.2,1.46,0xd9d0b6);
  for(const x of [-101,-67]) for(const z of [-38,-12]) box(x,2.26,z,.28,4.52,.28,0x6e5b4c);
  box(-98,4.55,-35,7.2,.22,7.2,0xa17e5a);
  const trees=[[-99,-36,1.27],[-95,-29,1],[-97,-15,1.04],[-69,-19,1.08],[-65,-10,.9],[-99,49,1],[-52,86,1.03],[-46,92,.9],[13,30,.85],[12,51,1.01],[45,85,.95],[33,99,.92],[65,75,1.01],[101,38,.87],[101,62,.93],[101,-11,1.14],[101,-51,.93],[101,-71,.93],[42,-17,1.07],[18,-24,.8]];
  trees.forEach(([x,z,size],i)=>tree(x,z,size,i>11&&i<18?'palm':'leaf'));
  for(const [x,z] of [[-87,-12],[-78,-12],[36,90],[14,92],[-13,55],[99,-15]]) bench(x,z);
  for(const [x,z,dir] of [[-9,76,1],[9,56,-1],[-9,35,1],[9,1,-1],[-10,-47,1],[10,-68,-1],[45,-42,1],[64,-20,-1],[99,-23,-1],[99,1,-1],[100,34,-1],[100,56,-1],[100,75,-1],[-65,72,1],[-102,56,1],[-45,26,-1]]) streetLamp(x,z,dir);

  // Cinder Wharf cranes and stacks, isolated from the drivable shoreline exit.
  for(const [x,z,color] of [[72,67,0xa75948],[81,71,0x587884],[86,72,0xa7865c],[86,11,0x7f6658],[82,1,0x617c79]]) {
    if(roads.some(road=>roadDistance(x,z,road)<road.width/2+1.4)) continue;
    solid(x,1.31,z,5.7,2.62,2.57,color);footprint(x,z,5.7,2.57,'#8b766a');
    for(let rib=-2.4;rib<2.6;rib+=.63) box(x+rib,1.31,z+1.31,.08,2.54,.065,0x756f63);
  }
  for(const z of [4,43]) {
    box(102,5.5,z,.65,11,.65,0xc4a04f);
    box(108,11,z,12.5,.49,.74,0xc4a04f);
    box(114,8.5,z,.055,4.6,.065,0x4c5c62);
    box(114,6.3,z,1.05,.35,.94,0x52646a);
  }
  for(const x of [107,116,121]) for(const z of [11.6,26.4]) {
    roundBox(x,.42,z,.18,.88,.18,0x48545a);light(x,.85,z,.23,.074,.23,0xeaca75);
  }
  sign('CINDER WHARF',103,3.7,26.9,9,{color:'#ffdb9b',back:'#394f58'});

  // The lighthouse breaks the horizon above the dive site.
  roundBox(168,-.56,-67,13,2.33,10.4,0x858e83);
  roundBox(168,.75,-67,8.7,.44,8.4,0xbdb89f);
  roundBox(169,6.1,-67,2.31,10.5,2.31,0xede5c8);
  roundBox(169,6.7,-67,2.34,1.85,2.34,0xa75648);
  roundBox(169,11.55,-67,2.6,.64,2.6,0x445a61);
  roundBox(169,12.3,-67,1.56,1.32,1.56,0xffd77e);
  roundBox(169,13.17,-67,2.1,.42,2.1,0x485d65);
  collider(168,-.56,-67,24,2.33,20);
  footprint(168,-67,24,20,'#ac9b7e');

  // Underwater research site and wreck fragments give the core a recognizable location.
  box(135,-9.9,-30,14,.8,12,0x42656c);
  for(const x of [128,142]) for(const z of [-36,-24]) {
    box(x,-7.15,z,.8,5.5,.8,0x587b7d);
    light(x,-4.5,z,.91,.3,.91,0x70dcd1);
  }
  for(const z of [-35.9,-24.1]) {
    box(135,-4.84,z,14.8,.27,.28,0x568c92);
    light(135,-5.05,z,13,.09,.092,0x51c8c8);
  }
  for(let i=0;i<20;i++) {
    const x=115+random()*51,z=-46+random()*36;
    if(Math.abs(x-135)<9&&Math.abs(z+30)<8) continue;
    const s=.55+random()*1.75;
    foliage(x,-10.8+s*.38,z,s,s*.7,s*.76,i%3?0x557675:0x9b817a,random()*5);
  }

  const interiors=makeInteriors(scene,{box,light,solid,collider,footprint,sign});
  function batch(geometry,items,material) {
    if (!items.length) return;
    const mesh=new T.InstancedMesh(geometry,material,items.length);
    items.forEach(([x,y,z,w,h,d,color,yaw],i)=>{
      dummy.position.set(x,y,z);dummy.rotation.set(0,yaw,0);dummy.scale.set(w,h,d);dummy.updateMatrix();
      mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,paint.setHex(color));
    });
    mesh.computeBoundingSphere();scene.add(mesh);
  }
  const masonry=new T.MeshStandardMaterial({color:0xffffff,roughness:.77});
  batch(surfaces,records,masonry);
  batch(surfaces,lights,new T.MeshBasicMaterial({color:0xd8e6e5}));
  batch(round,drums,masonry);batch(canopy,crowns,masonry);
  return {solids,footprints,interiors};
}
