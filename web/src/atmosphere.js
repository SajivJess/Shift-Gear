import * as T from 'three';

const weatherTypes = [
  {label:'Clear', rain:0, haze:.0052, sun:2.65, ambient:2.18, sky:0x559ec6, horizon:0xffcd97},
  {label:'Overcast', rain:0, haze:.009, sun:1.32, ambient:1.78, sky:0x648597, horizon:0xacc1c9},
  {label:'Showers', rain:1, haze:.013, sun:.69, ambient:1.51, sky:0x39596c, horizon:0x7f9da7},
];

export function makeAtmosphere(scene,coast,sun,ambient,sky) {
  const uniforms={
    time:{value:0}, wet:{value:0}, coast:{value:coast},
    light:{value:new T.Vector3(-.61,.53,-.58).normalize()},
    waterNear:{value:new T.Color(0x30a49f)},waterDeep:{value:new T.Color(0x0b4a69)},
    haze:{value:new T.Color(0xa7bbc1)},
  };
  const water=new T.Mesh(new T.PlaneGeometry(385,670,70,108),new T.ShaderMaterial({
    uniforms,side:T.DoubleSide,transparent:true,depthWrite:false,
    vertexShader:`uniform float time, wet, coast; varying vec3 world;
      void main(){vec4 p=modelMatrix*vec4(position,1.);float edge=smoothstep(0.,8.,p.x-coast);
      p.y+=edge*(.8+wet*.65)*(.14*sin(p.x*.18+p.z*.1+time*1.2)+.09*cos(p.z*.32-time*1.55));
      world=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`,
    fragmentShader:`uniform float time, wet, coast;uniform vec3 light,waterNear,waterDeep,haze;
      varying vec3 world;
      void main(){vec2 x=world.xz;float t=time;
      float a=sin(dot(x,vec2(.82,.39))+t*2.7),b=cos(dot(x,vec2(-.44,1.17))-t*2.1);
      float c=sin(dot(x,vec2(2.1,-1.4))+t*2.9),d=sin(dot(x,vec2(3.5,2.7))-t*4.1);
      vec3 n=normalize(vec3((a*.17+b*.045+c*.035)*(1.+wet*.57),1.,(b*.15-a*.042+d*.024)*(1.+wet*.57)));
      vec3 v=normalize(cameraPosition-world), h=normalize(v+light);
      float fresnel=pow(1.-max(.0,abs(dot(n,v))),4.);
      float glint=pow(max(.0,dot(n,h)),mix(68.,21.,wet));
      float shore=world.x-coast;
      float foam=exp(-abs(shore-(.75+sin(x.y*.26-t*1.35)*.48))*2.9);
      float ripple=max(.0,a*b*.55+c*.19);float fade=1.-exp(-length(cameraPosition-world)*.006);
      vec3 color=mix(waterNear,waterDeep,smoothstep(0.,35.,shore));
      color=mix(color,haze*.85,fresnel*.58)+vec3(.18,.22,.20)*foam+glint*vec3(.77,.68,.50)*mix(.83,.33,wet)+.045*ripple;
      color=mix(color,haze,fade*.53);
      gl_FragColor=vec4(color,mix(.65,.97,max(fresnel,foam)));
      #include <colorspace_fragment>
    }`,
  }));
  water.rotation.x=-Math.PI/2;water.position.set(coast+192.5,-.21,0);scene.add(water);

  const count=140, lines=new Float32Array(count*6);
  const drops=Array.from({length:count},()=>({x:Math.random()*30-15,y:Math.random()*20,z:Math.random()*30-15}));
  const rainGeometry=new T.BufferGeometry();
  const rainPositions=new T.BufferAttribute(lines,3).setUsage(T.DynamicDrawUsage);
  rainGeometry.setAttribute('position',rainPositions);
  const rain=new T.LineSegments(rainGeometry,new T.LineBasicMaterial({color:0xbcd8e5,transparent:true,opacity:0,depthWrite:false}));
  rain.frustumCulled=false;rain.visible=false;scene.add(rain);

  const nextTop=new T.Color(),nextHorizon=new T.Color(),deep=new T.Color(0x177182),lightTint=new T.Color();
  let index=0,wet=0,clock=0,holdUntil=60;

  function next() {
    index=(index+1)%weatherTypes.length;
    holdUntil=clock+75;
    return weatherTypes[index].label;
  }

  function update(dt, camera, submerged,active) {
    if (active) clock+=dt;
    if (clock>holdUntil) next();
    const forecast=weatherTypes[index];
    uniforms.time.value=clock;
    wet=T.MathUtils.damp(wet,forecast.rain,1.5,dt);
    uniforms.wet.value=wet;
    nextTop.setHex(forecast.sky);nextHorizon.setHex(forecast.horizon);
    sky.material.uniforms.zenith.value.lerp(nextTop,dt*1.2);
    sky.material.uniforms.horizon.value.lerp(nextHorizon,dt*1.2);
    sky.material.uniforms.sunlight.value=T.MathUtils.damp(sky.material.uniforms.sunlight.value,forecast.sun/2.65,1.5,dt);
    scene.fog.color.lerp(submerged?deep:sky.material.uniforms.horizon.value,Math.min(1,5*dt));
    scene.fog.density=T.MathUtils.damp(scene.fog.density,submerged?.062:forecast.haze,3,dt);
    sun.intensity=T.MathUtils.damp(sun.intensity,forecast.sun,1.3,dt);
    ambient.intensity=T.MathUtils.damp(ambient.intensity,submerged?1.64:forecast.ambient,2,dt);
    lightTint.setHex(submerged?0x85c6e2:0xffdcc2);sun.color.lerp(lightTint,Math.min(1,4*dt));
    uniforms.haze.value.copy(scene.fog.color);
    rain.visible=wet>.02&&!submerged;
    if (rain.visible) {
      rain.position.copy(camera.position);
      rain.material.opacity=wet*.42;
      for(let i=0;i<count;i++) {
        const drop=drops[i];
        if(active){drop.y-=dt*(14+i%7);drop.x-=dt*1.15;if(drop.y< -5){drop.y+=20;drop.x=Math.random()*30-15;}}
        const k=i*6;
        lines[k]=drop.x;lines[k+1]=drop.y;lines[k+2]=drop.z;
        lines[k+3]=drop.x+.11;lines[k+4]=drop.y+.63;lines[k+5]=drop.z+.035;
      }
      rainPositions.needsUpdate=true;
    }
    return submerged ? wet*.22 : wet;
  }
  return { update, next, label:()=>weatherTypes[index].label };
}
