/* THOMAS_OS — FULL EMBLEM 3D ENGINE
   The SHIELD, PLATE, ORBIT RINGS, DOTS, LIGHTS, AND LABEL are one true 3D model.
   No external libraries, trackers, fonts, or CDN needed. WebGL 1 compatible.
   Drag the whole emblem freely through 360 degrees on BOTH axes. */
(() => {
  'use strict';
  const canvas = document.getElementById('holo-core-canvas');
  const hit = document.getElementById('holo-drag-surface');
  const autoButton = document.getElementById('holo-auto-toggle');
  const resetButton = document.getElementById('holo-reset');
  const fallback = document.getElementById('holo-core-fallback');
  if (!canvas || !hit || !autoButton || !resetButton) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pauseMotion = () => reduced.matches || document.body.classList.contains('pause-motion');
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  const rad = Math.PI/180;
  const normDegrees = v => ((Math.round(v / rad) % 360)+360)%360;
  const gl = canvas.getContext('webgl', {alpha:true,antialias:true,premultipliedAlpha:false,depth:true,powerPreference:'default',preserveDrawingBuffer:true});
  if (!gl) {canvas.hidden=true;fallback.hidden=false;return;}
  const vertex = `
    attribute vec3 aPos; attribute vec3 aNorm; attribute vec2 aUV;
    uniform mat4 uMVP; uniform mat4 uModel;
    varying vec3 vNormal; varying vec2 vUV;
    void main(){gl_Position=uMVP*vec4(aPos,1.0);vNormal=mat3(uModel)*aNorm;vUV=aUV;}
  `;
  const fragment = `
    precision mediump float;
    varying vec3 vNormal; varying vec2 vUV;
    uniform vec3 uColor;uniform float uAlpha;uniform float uEmissive;uniform float uIsText;
    uniform sampler2D uTexture;
    void main(){
      if(uIsText>0.5){vec4 ink=texture2D(uTexture,vUV);if(ink.a<0.025)discard;gl_FragColor=vec4(ink.rgb*max(uColor,vec3(.3)),ink.a*uAlpha);return;}
      vec3 n=normalize(vNormal);vec3 light=normalize(vec3(-.32,.65,1.0));
      float diff=max(dot(n,light),0.0);
      float spec=pow(max(dot(n,normalize(vec3(-.18,.40,1.0))),0.0),19.0);
      float rim=pow(1.0-abs(n.z),2.8);
      vec3 c=uColor * (uEmissive+0.33+0.50*diff) + vec3(.12,.16,.25)*(spec*.55+rim*.18);
      gl_FragColor=vec4(clamp(c,0.0,1.0),uAlpha);
    }
  `;
  const shader=(kind,source)=>{
    const sh=gl.createShader(kind);gl.shaderSource(sh,source);gl.compileShader(sh);
    if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw new Error('3D shader: '+gl.getShaderInfoLog(sh));
    return sh;
  };
  let program;
  try {
    program=gl.createProgram();
    gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));
    gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
  } catch(err) {
    console.warn('3D emblem unavailable, using fallback:',err);
    canvas.hidden=true;fallback.hidden=false;return;
  }
  gl.useProgram(program);
  const aPos=gl.getAttribLocation(program,'aPos'),aNorm=gl.getAttribLocation(program,'aNorm'),aUV=gl.getAttribLocation(program,'aUV');
  const uMVP=gl.getUniformLocation(program,'uMVP'),uModel=gl.getUniformLocation(program,'uModel');
  const uColor=gl.getUniformLocation(program,'uColor'),uAlpha=gl.getUniformLocation(program,'uAlpha');
  const uEmissive=gl.getUniformLocation(program,'uEmissive'),uIsText=gl.getUniformLocation(program,'uIsText');
  const uTexture=gl.getUniformLocation(program,'uTexture');
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);
  const I=()=>new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
  const multiply=(a,b)=>{
    const m=new Float32Array(16);
    for(let c=0;c<4;c++)for(let r=0;r<4;r++){
      let n=0;for(let k=0;k<4;k++)n+=a[k*4+r]*b[c*4+k];m[c*4+r]=n;
    }return m;
  };
  const move=(x,y,z)=>{const m=I();m[12]=x;m[13]=y;m[14]=z;return m;};
  const rotateX=a=>new Float32Array([1,0,0,0, 0,Math.cos(a),Math.sin(a),0, 0,-Math.sin(a),Math.cos(a),0, 0,0,0,1]);
  const rotateY=a=>new Float32Array([Math.cos(a),0,-Math.sin(a),0, 0,1,0,0, Math.sin(a),0,Math.cos(a),0, 0,0,0,1]);
  const rotateZ=a=>new Float32Array([Math.cos(a),Math.sin(a),0,0, -Math.sin(a),Math.cos(a),0,0, 0,0,1,0, 0,0,0,1]);
  const projection=(fov,aspect,n,f)=>{
    const t=1/Math.tan(fov/2),out=new Float32Array(16);out[0]=t/aspect;out[5]=t;
    out[10]=(f+n)/(n-f);out[11]=-1;out[14]=2*f*n/(n-f);return out;
  };
  // Vertex geometry: [px,py,pz,nx,ny,nz,u,v], with Uint16 indices.
  const geo=()=>({v:[],i:[]});
  const add=(g,p,n=[0,0,1],uv=[0,0])=>{
    const index=g.v.length/8;g.v.push(...p,...n,...uv);return index;
  };
  const tri=(g,a,b,c)=>g.i.push(a,b,c);
  const normal=(a,b,c)=>{
    const u=b.map((v,i)=>v-a[i]),v=c.map((t,i)=>t-a[i]);
    const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    const len=Math.hypot(...cross)||1;return cross.map(x=>x/len);
  };
  const turn=(p,rx=0,ry=0,rz=0)=>{
    let [x,y,z]=p,c=Math.cos(rx),s=Math.sin(rx);[y,z]=[c*y-s*z,s*y+c*z];
    c=Math.cos(ry);s=Math.sin(ry);[x,z]=[c*x+s*z,-s*x+c*z];
    c=Math.cos(rz);s=Math.sin(rz);[x,y]=[c*x-s*y,s*x+c*y];return [x,y,z];
  };
  const torus=(major,minor,angles=[0,0,0],arcStart=0,arcEnd=Math.PI*2)=>{
    const g=geo(),long=120,short=8;
    for(let j=0;j<=long;j++){
      const theta=arcStart+(arcEnd-arcStart)*j/long,ct=Math.cos(theta),st=Math.sin(theta);
      for(let k=0;k<=short;k++){
        const phi=k/short*Math.PI*2,cp=Math.cos(phi),sp=Math.sin(phi);
        const p=turn([(major+minor*cp)*ct,(major+minor*cp)*st,minor*sp],...angles);
        const n=turn([ct*cp,st*cp,sp],...angles);
        add(g,p,n,[j/long,k/short]);
      }
    }
    for(let j=0;j<long;j++)for(let k=0;k<short;k++){
      const a=j*(short+1)+k,b=a+(short+1);tri(g,a,b,a+1);tri(g,a+1,b,b+1);
    }return g;
  };
  const sphere=(r,center,lat=10,lon=14)=>{
    const g=geo();for(let j=0;j<=lat;j++){
      const theta=Math.PI*j/lat;
      for(let k=0;k<=lon;k++){
        const phi=2*Math.PI*k/lon;
        const n=[Math.sin(theta)*Math.cos(phi),Math.sin(theta)*Math.sin(phi),Math.cos(theta)];
        add(g,center.map((c,i)=>c+r*n[i]),n,[k/lon,j/lat]);
      }
    }for(let j=0;j<lat;j++)for(let k=0;k<lon;k++){
      const a=j*(lon+1)+k,b=a+lon+1;tri(g,a,a+1,b);tri(g,a+1,b+1,b);
    }return g;
  };
  const tube=(points,radius=.012,sides=9)=>{
    const g=geo();for(let i=0;i<points.length;i++){
      const p=points[i],prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)];
      const tangent=[next[0]-prev[0],next[1]-prev[1],next[2]-prev[2]];
      const inv=1/(Math.hypot(...tangent)||1);tangent.forEach((v,k)=>tangent[k]=v*inv);
      let side=[-tangent[1],tangent[0],0];if(Math.hypot(...side)<.08)side=[1,0,0];
      const ls=1/(Math.hypot(...side)||1);side=side.map(x=>x*ls);
      let up=[tangent[1]*side[2]-tangent[2]*side[1],tangent[2]*side[0]-tangent[0]*side[2],tangent[0]*side[1]-tangent[1]*side[0]];
      const lu=1/(Math.hypot(...up)||1);up=up.map(x=>x*lu);
      for(let k=0;k<=sides;k++){
        const phi=2*Math.PI*k/sides,c=Math.cos(phi),s=Math.sin(phi);
        const n=side.map((x,t)=>x*c+up[t]*s);
        add(g,p.map((x,t)=>x+n[t]*radius),n,[i/(points.length-1),k/sides]);
      }
    }for(let i=0;i<points.length-1;i++)for(let k=0;k<sides;k++){
      const a=i*(sides+1)+k,b=a+sides+1;tri(g,a,b,a+1);tri(g,a+1,b,b+1);
    }return g;
  };
  const polygon=(pts,front=.16,back=-.20)=>{
    const g=geo(),cent=[0,0];pts.forEach(p=>{cent[0]+=p[0]/pts.length;cent[1]+=p[1]/pts.length;});
    const fc=add(g,[...cent,front],[0,0,1]);
    const start=g.v.length/8;
    pts.forEach(p=>add(g,[...p,front],[0,0,1]));
    for(let k=0;k<pts.length;k++)tri(g,fc,start+k,start+(k+1)%pts.length);
    const bc=add(g,[...cent,back],[0,0,-1]);const bs=g.v.length/8;
    pts.forEach(p=>add(g,[...p,back],[0,0,-1]));
    for(let k=0;k<pts.length;k++)tri(g,bc,bs+(k+1)%pts.length,bs+k);
    for(let k=0;k<pts.length;k++){
      const a=pts[k],b=pts[(k+1)%pts.length],n=normal([a[0],a[1],back],[b[0],b[1],back],[a[0],a[1],front]);
      const j=add(g,[...a,back],n),m=add(g,[...b,back],n),o=add(g,[...b,front],n),q=add(g,[...a,front],n);
      tri(g,j,m,o);tri(g,j,o,q);
    }return g;
  };
  const plane=(w,h,z,centerY=0)=>{
    const g=geo(),ids=[add(g,[-w/2,centerY-h/2,z],[0,0,1],[0,1]),add(g,[w/2,centerY-h/2,z],[0,0,1],[1,1]),add(g,[w/2,centerY+h/2,z],[0,0,1],[1,0]),add(g,[-w/2,centerY+h/2,z],[0,0,1],[0,0])];
    tri(g,ids[0],ids[1],ids[2]);tri(g,ids[0],ids[2],ids[3]);return g;
  };
  const meshes=[];
  const create=(g,color,alpha=1,emissive=.5,type='translucent')=>{
    const array=new Float32Array(g.v),indices=new Uint16Array(g.i),vbo=gl.createBuffer(),ibo=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.bufferData(gl.ARRAY_BUFFER,array,gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
    const m={vbo,ibo,count:indices.length,color,alpha,emissive,type,texture:null};meshes.push(m);return m;
  };
  // All parts below share ONE model transform; turning the whole group turns EVERY part.
  const framePts=[[-1.03,1.24,-.50],[1.06,1.08,-.50],[1.01,-1.26,-.50],[-.98,-1.11,-.50]];
  create(polygon([[-1.03,1.24],[1.06,1.08],[1.01,-1.26],[-.98,-1.11]],-.48,-.52),'plate',.40,.3,'translucent');
  create(tube([...framePts,framePts[0]],.018,8),'secondary',.90,.9);
  const shield=[[-.70,.68],[-.14,.87],[0,.93],[.14,.87],[.70,.68],[.68,-.13],[.57,-.49],[.37,-.76],[0,-1.00],[-.37,-.76],[-.57,-.49],[-.68,-.13]];
  create(polygon(shield,.20,-.22),'shield',1,.35,'opaque');
  const shieldOutline=(scale,z)=>[...shield,shield[0]].map(p=>[p[0]*scale,p[1]*scale,z]);
  create(tube(shieldOutline(1,.235),.034,10),'primary',1,1.0);
  create(tube(shieldOutline(.78,.258),.012,7),'secondary',.60,.85);
  create(tube(shieldOutline(1,-.246),.025,10),'secondary',.90,.8);
  const check=[[-.35,-.07,.285],[-.08,-.36,.285],[.45,.27,.285]];
  create(tube(check,.056,12),'primary',1,1.45);
  create(sphere(.057,check[0],8,12),'primary',1,1.3);
  create(sphere(.057,check[2],8,12),'primary',1,1.3);
  // Back-face insignia means full 360 rotation still presents a finished design.
  create(tube([[-.32,-.07,-.27],[-.07,-.35,-.27],[.43,.26,-.27]],.047,10),'secondary',1,.9);
  // Orbital ring geometry (not flat CSS circles) with independent planes in three axes.
  const bluePlane=[1.11,.12,.38],purplePlane=[.16,1.23,.15],pinkPlane=[.59,-.66,.12];
  for(const [r,t,a,key] of [[1.57,.017,bluePlane,'primary'],[1.48,.018,purplePlane,'secondary'],[1.67,.014,pinkPlane,'pink']]){
    create(torus(r,t*3.1,a),'glow-'+key,.10,.95,'glow');
    create(torus(r,t,a),key,.87,1.0);
  }
  create(torus(1.35,.010,[.28,.26,-.18]),'soft',.37,.72);
  // A full 3D dotted outer halo: dots are spheres distributed on a tilted plane.
  const dottedPlane=[.28,-.20,-.11];
  for(let i=0;i<62;i++){
    const angle=Math.PI*2*i/62;
    const pos=turn([1.84*Math.cos(angle),1.84*Math.sin(angle),0],...dottedPlane);
    if(i%2===0)create(sphere(.013,pos,5,8),i%10===0?'secondary':'soft',.62,.8);
  }
  // Illuminated tracking satellites are located ON the 3D orbits.
  const orbPos=(radius,theta,angles)=>turn([radius*Math.cos(theta),radius*Math.sin(theta),0],...angles);
  for(const [radius,theta,angles,key] of [[1.57,1.38,bluePlane,'primary'],[1.48,-.50,purplePlane,'secondary'],[1.67,3.6,pinkPlane,'pink'],[1.57,5.20,bluePlane,'primary']]){
    const p=orbPos(radius,theta,angles);create(sphere(.067,p,10,14),'glow-'+key,.22,1.1,'glow');
    create(sphere(.038,p,10,14),key,1,1.0);
  }
  // Rear small axial electronics grid. It rotates as part of the icon too.
  for(let i=-2;i<=2;i++){
    const x=i*.31,y=i*.30,z=-.59;
    create(tube([[x,-.80,z],[x,.80,z]],.005,6),'soft',.23,.65);
    create(tube([[-.80,y,z],[.80,y,z]],.005,6),'soft',.23,.65);
  }
  // Canvas label is an actual textured 3D plane below the shield.
  const title=document.createElement('canvas');title.width=1024;title.height=180;
  const ctx=title.getContext('2d');ctx.clearRect(0,0,title.width,title.height);
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 66px ui-monospace, monospace';
  ctx.shadowColor='#57eafa';ctx.shadowBlur=23;ctx.fillStyle='#e3faff';ctx.fillText('THOMAS // CORE',512,94);
  const labelTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,labelTexture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,title);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  create(plane(1.64,.30,.46,-1.27),'label',1,1.0,'text').texture=labelTexture;
  gl.uniform1i(uTexture,0);
  const readPitch=document.getElementById('holo-angle-x'),readYaw=document.getElementById('holo-angle-y');
  let yaw=-25*rad,pitch=-14*rad, velYaw=0,velPitch=0;
  let isDragging=false,pointerId=null,px=0,py=0,pt=0;
  let lastInteraction=performance.now(),lastFrame=0,auto=!reduced.matches,visible=true;
  const angles=()=>{if(readPitch)readPitch.textContent=normDegrees(pitch)+'°';if(readYaw)readYaw.textContent=normDegrees(yaw)+'°';};
  const syncAuto=()=>{autoButton.textContent=auto?'AUTO: ON':'AUTO: OFF';autoButton.setAttribute('aria-pressed',String(auto));autoButton.title=auto?'Pause automatic rotation':'Resume automatic rotation';};
  const reset=()=>{yaw=-25*rad;pitch=-14*rad;velYaw=0;velPitch=0;lastInteraction=performance.now();angles();};
  syncAuto();angles();fallback.hidden=true;
  autoButton.addEventListener('click',()=>{auto=!auto;syncAuto();velYaw=velPitch=0;lastInteraction=performance.now();});
  resetButton.addEventListener('click',reset);
  hit.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    isDragging=true;pointerId=e.pointerId;px=e.clientX;py=e.clientY;pt=performance.now();
    velYaw=velPitch=0;lastInteraction=pt;
    hit.classList.add('is-dragging');hit.setPointerCapture?.(e.pointerId);e.preventDefault();
  });
  hit.addEventListener('pointermove',e=>{
    if(!isDragging||e.pointerId!==pointerId)return;
    const t=performance.now(),dt=clamp((t-pt)/1000,.008,.12);
    const dx=e.clientX-px,dy=e.clientY-py;
    const dyaw=dx*.009,dpitch=-dy*.009;
    yaw+=dyaw;pitch+=dpitch; // both axes unbounded: genuine 360-degree control
    velYaw=clamp(dyaw/dt,-6,6);velPitch=clamp(dpitch/dt,-6,6);
    px=e.clientX;py=e.clientY;pt=t;lastInteraction=t;angles();e.preventDefault();
  });
  const end=e=>{if(!isDragging||(e&&e.pointerId!==pointerId))return;isDragging=false;
    hit.classList.remove('is-dragging');lastInteraction=performance.now();
    if(hit.hasPointerCapture?.(pointerId))hit.releasePointerCapture(pointerId);pointerId=null;};
  hit.addEventListener('pointerup',end);hit.addEventListener('pointercancel',end);
  hit.addEventListener('lostpointercapture',()=>{isDragging=false;pointerId=null;hit.classList.remove('is-dragging');});
  hit.addEventListener('keydown',e=>{
    const d={ArrowLeft:[-18,0],ArrowRight:[18,0],ArrowUp:[0,-18],ArrowDown:[0,18]}[e.key];
    if(d){yaw+=d[0]*rad;pitch+=d[1]*rad;velYaw=velPitch=0;lastInteraction=performance.now();angles();e.preventDefault();}
    else if(e.key==='Home'){reset();e.preventDefault();}
    else if(e.key===' '){auto=!auto;syncAuto();lastInteraction=performance.now();e.preventDefault();}
  });
  reduced.addEventListener?.('change',()=>{if(reduced.matches){auto=false;velYaw=velPitch=0;syncAuto();}});
  const palette=()=>{
    const el=getComputedStyle(document.body),parse=c=>{
      c=c.trim();if(c.startsWith('#')&&c.length===7)return [parseInt(c.slice(1,3),16)/255,parseInt(c.slice(3,5),16)/255,parseInt(c.slice(5,7),16)/255];
      const m=c.match(/\d+(?:\.\d+)?/g);return m&&m.length>=3?m.slice(0,3).map(x=>Number(x)/255):[.5,.8,1];
    };
    const a=parse(el.getPropertyValue('--neon')),
          b=parse(el.getPropertyValue('--secondary')),
          c=parse(el.getPropertyValue('--pink'));
    return {primary:a,secondary:b,pink:c,soft:a.map(v=>v*.60),shield:el.getPropertyValue('--neon').trim()==='#cb7aff'?[.10,.12,.27]:[.07,.22,.31],plate:[.11,.14,.32],label:[1,1,1],
      'glow-primary':a,'glow-secondary':b,'glow-pink':c};
  };
  let colors=palette();
  const spectrum=document.getElementById('spectrum-toggle');
  spectrum?.addEventListener('click',()=>{requestAnimationFrame(()=>colors=palette());});
  const drawMesh=(m,mvp,model)=>{
    gl.bindBuffer(gl.ARRAY_BUFFER,m.vbo);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.ibo);
    gl.enableVertexAttribArray(aPos);gl.vertexAttribPointer(aPos,3,gl.FLOAT,false,32,0);
    gl.enableVertexAttribArray(aNorm);gl.vertexAttribPointer(aNorm,3,gl.FLOAT,false,32,12);
    gl.enableVertexAttribArray(aUV);gl.vertexAttribPointer(aUV,2,gl.FLOAT,false,32,24);
    gl.uniformMatrix4fv(uMVP,false,mvp);gl.uniformMatrix4fv(uModel,false,model);
    gl.uniform3fv(uColor,colors[m.color]||[1,1,1]);
    gl.uniform1f(uAlpha,m.alpha);gl.uniform1f(uEmissive,m.emissive);
    gl.uniform1f(uIsText,m.type==='text'?1:0);
    if(m.texture){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,m.texture);}
    gl.drawElements(gl.TRIANGLES,m.count,gl.UNSIGNED_SHORT,0);
  };
  let w=0,h=0;
  const size=()=>{
    const r=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,1.6);
    const width=Math.max(1,Math.round(r.width*dpr)),height=Math.max(1,Math.round(r.height*dpr));
    if(w!==width||h!==height){w=width;h=height;canvas.width=width;canvas.height=height;gl.viewport(0,0,w,h);}
  };
  if('ResizeObserver' in window)new ResizeObserver(size).observe(canvas);else window.addEventListener('resize',size,{passive:true});
  if('IntersectionObserver' in window)new IntersectionObserver(es=>{visible=es[0]?.isIntersecting??true;},{threshold:0}).observe(canvas);
  size();
  const render=t=>{
    const dt=lastFrame?clamp((t-lastFrame)/1000,0,.05):0;lastFrame=t;
    const paused=pauseMotion();
    if(!document.hidden&&visible){
      if(!isDragging&&!paused){
        if(Math.abs(velYaw)+Math.abs(velPitch)>.004){yaw+=velYaw*dt;pitch+=velPitch*dt;const damping=Math.exp(-5.4*dt);velYaw*=damping;velPitch*=damping;angles();}
        else if(auto&&t-lastInteraction>1400){yaw+=dt*.17;angles();}
      }
      if(Math.abs(yaw)>1200)yaw%=Math.PI*2;if(Math.abs(pitch)>1200)pitch%=Math.PI*2;
      size();gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      const bob=paused?0:Math.sin(t*.00132)*.12,roll=paused?0:Math.sin(t*.00073)*.06;
      const drift=paused?0:Math.sin(t*.00061)*.045;
      const model=multiply(move(0,bob,0),multiply(rotateY(yaw),multiply(rotateX(pitch+drift),rotateZ(roll))));
      const aspect=Math.max(.1,w/h);
      const cameraDist=aspect < .95 ? 8.10:7.45;
      const view=move(0,0,-cameraDist);
      const fov=44*rad;
      const mvp=multiply(projection(fov,aspect,.1,40),multiply(view,model));
      const opaque=meshes.filter(m=>m.type==='opaque');
      const transparent=meshes.filter(m=>m.type==='translucent'||m.type==='text');
      const glow=meshes.filter(m=>m.type==='glow');
      gl.depthMask(true);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);opaque.forEach(m=>drawMesh(m,mvp,model));
      gl.depthMask(false);transparent.forEach(m=>drawMesh(m,mvp,model));
      gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.disable(gl.DEPTH_TEST);glow.forEach(m=>drawMesh(m,mvp,model));
      gl.enable(gl.DEPTH_TEST);gl.depthMask(true);
    }
    requestAnimationFrame(render);
  };
  requestAnimationFrame(render);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback.hidden=false;canvas.hidden=true;},{once:true});
})();
