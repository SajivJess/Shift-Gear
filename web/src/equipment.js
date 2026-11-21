import * as T from 'three';
import {part} from './world.js';

const practicePoints = [[13.5,76],[22,76],[30.5,76]];

export function makePulseRange(scene,buildings) {
  const targets=practicePoints.map(([x,z])=>{
    const group=new T.Group();group.position.set(x,0,z);scene.add(group);
    part(group,0,.12,0,1.22,.24,.78,0x354451);
    part(group,0,.72,0,.13,1.25,.13,0x667c88);
    const plate=new T.Mesh(new T.OctahedronGeometry(.6),new T.MeshStandardMaterial({color:0x559fab,emissive:0x49dcff,emissiveIntensity:.45,roughness:.32,metalness:.44}));
    plate.position.y=1.47;group.add(plate);
    return {group,plate,until:0};
  });
  const trainer = new T.Group();trainer.position.set(22,0,72.5);scene.add(trainer);
  part(trainer,0,.15,0,21,.24,.29,0x545d65);
  for (let x=-10;x<=10;x+=2) part(trainer,x,.285,0,.90,.035,.29,0xffa464);

  const raycaster=new T.Raycaster();
  const center=new T.Vector2(0,0), intersection=new T.Vector3();
  const hit=new T.Vector3(), origin=new T.Vector3();
  const shotLineGeometry=new T.BufferGeometry();
  const shotCoordinates=new T.BufferAttribute(new Float32Array(6),3);
  shotLineGeometry.setAttribute('position',shotCoordinates);
  const shotLine = new T.Line(shotLineGeometry,new T.LineBasicMaterial({color:0x92f8ff,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));
  shotLine.frustumCulled=false;shotLine.visible=false;scene.add(shotLine);
  const spark = new T.Mesh(new T.OctahedronGeometry(1),new T.MeshBasicMaterial({color:0xb3fcff,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));
  spark.visible=false;scene.add(spark);
  const flash = new T.Mesh(new T.IcosahedronGeometry(1,0),new T.MeshBasicMaterial({color:0x91faff,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));
  flash.visible=false;scene.add(flash);
  const bounds=buildings.map(body=>{
    const {x,z,w,d,bottom,top}=body;
    return {body,box:new T.Box3(new T.Vector3(x-w/2,bottom,z-d/2),new T.Vector3(x+w/2,top,z+d/2))};
  });
  const sphere=new T.Sphere();
  let shotAt=-5, impact=false;

  function shoot(camera,muzzle,drone,now) {
    camera.updateMatrixWorld();
    raycaster.setFromCamera(center,camera);
    const ray=raycaster.ray;
    let nearest=115,result='';
    for(const {body,box} of bounds) {
      if(body.enabled!==false&&ray.intersectBox(box,intersection)) nearest=Math.min(nearest,intersection.distanceTo(ray.origin));
    }
    if(ray.direction.y<-.004) {
      const ground=-ray.origin.y/ray.direction.y;
      if(ground>0) nearest=Math.min(nearest,ground);
    }
    let selected=null;
    for (const {group,plate,until} of targets) {
      if(until>now) continue;
      sphere.center.copy(group.position).add(plate.position);sphere.radius=.69;
      if(ray.intersectSphere(sphere,intersection) && intersection.distanceTo(ray.origin)<nearest) {
        nearest=intersection.distanceTo(ray.origin);selected=group;result='plate';
      }
    }
    if (drone.visible) {
      sphere.center.copy(drone.position);sphere.radius=1.4;
      if(ray.intersectSphere(sphere,intersection) && intersection.distanceTo(ray.origin)<nearest) {
        nearest=intersection.distanceTo(ray.origin);result='drone';
      }
    }
    ray.at(nearest,hit);
    origin.set(0,.059,-.23);
    muzzle.localToWorld(origin);
    // Check cover along the visible path from the equipped model too.
    const muzzleRay=new T.Ray(origin,hit.clone().sub(origin).normalize());
    let muzzleDistance=origin.distanceTo(hit);
    for(const {body,box} of bounds) if(body.enabled!==false&&muzzleRay.intersectBox(box,intersection)) {
      const depth=intersection.distanceTo(origin);
      if(depth+1e-3<muzzleDistance){muzzleDistance=depth;hit.copy(intersection);result='';}
    }
    if (result==='plate') targets.find(target=>target.group===selected).until=now+3.2;
    shotCoordinates.setXYZ(0,origin.x,origin.y,origin.z);shotCoordinates.setXYZ(1,hit.x,hit.y,hit.z);
    shotCoordinates.needsUpdate=true;
    spark.position.copy(hit);flash.position.copy(origin);
    impact=nearest<114.9 || muzzleDistance<110;
    shotAt=now;
    return result;
  }
  function update(now,dt) {
    const life=now-shotAt;
    shotLine.visible=life<.105;shotLine.material.opacity=Math.max(0,1-life/.105);
    spark.visible=impact&&life<.24;spark.scale.setScalar(.13+Math.max(0,life)*1.9);
    spark.material.opacity=Math.max(0,1-life/.24);
    flash.visible=life<.095;flash.scale.setScalar(.08+Math.max(0,1-life/.095)*.17);
    flash.material.opacity=Math.max(0,1-life/.095);
    for(const target of targets) {
      const active=target.until<=now;
      target.plate.rotation.y+=dt*1.2;
      target.plate.position.y=T.MathUtils.damp(target.plate.position.y,active?1.47:.83,7,dt);
      target.plate.material.emissiveIntensity=active?.45:1.4;
      target.plate.material.color.setHex(active?0x559fab:0xffa365);
    }
  }
  return {shoot,update};
}
