/* THOMAS_OS / dependency-free SOFTWARE 3D renderer.
   Used when hardware WebGL is disabled. This is NOT a flat placeholder:
   one freely rotating 3D coordinate frame drives every ring, shield surface,
   glass sheet, particle, node and title. Full 360 degree manual orbit remains. */
(() => {
  'use strict';
  const canvas=document.getElementById('holo-core-canvas');
  if(!canvas || !canvas.hidden) return; // primary WebGL 3D is active
  const ctx=canvas.getContext('2d');
  if(!ctx) return;
  canvas.hidden=false;
  document.getElementById('holo-core-fallback').hidden=true;
  const hit=document.getElementById('holo-drag-surface');
  const autoButton=document.getElementById('holo-auto-toggle');
  const resetButton=document.getElementById('holo-reset');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const stopped=()=>reduced.matches||document.body.classList.contains('pause-motion');
  let yaw=-25*Math.PI/180,pitch=-14*Math.PI/180,vy=0,vp=0;
  let isDragging=false,pid=null,px=0,py=0,pt=0;
  let auto=!reduced.matches,lastInteraction=performance.now(),lastFrame=0;
  let inView=true,w=0,h=0,dpr=1;
  const RAD=Math.PI/180,TAU=Math.PI*2;
  const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
  const norm=a=>((Math.round(a/RAD)%360)+360)%360;
  const readX=document.getElementById('holo-angle-x'),readY=document.getElementById('holo-angle-y');
  const angles=()=>{readX.textContent=norm(pitch)+'°';readY.textContent=norm(yaw)+'°';};
  const syncAuto=()=>{autoButton.textContent='AUTO: '+(auto?'ON':'OFF');autoButton.setAttribute('aria-pressed',String(auto));};
  const reset=()=>{yaw=-25*RAD;pitch=-14*RAD;vy=vp=0;lastInteraction=performance.now();angles();};
  autoButton.addEventListener('click',()=>{auto=!auto;syncAuto();vy=vp=0;lastInteraction=performance.now();});
  resetButton.addEventListener('click',reset);
  hit.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    isDragging=true;pid=e.pointerId;px=e.clientX;py=e.clientY;pt=performance.now();
    vy=vp=0;lastInteraction=pt;hit.classList.add('is-dragging');hit.setPointerCapture?.(pid);e.preventDefault();
  });
  hit.addEventListener('pointermove',e=>{
    if(!isDragging||pid!==e.pointerId)return;
    const t=performance.now(),dt=clamp((t-pt)/1000,.008,.12),dx=e.clientX-px,dy=e.clientY-py;
    const dyaw=dx*.009,dpitch=-dy*.009;
    yaw+=dyaw;pitch+=dpitch;vy=clamp(dyaw/dt,-6,6);vp=clamp(dpitch/dt,-6,6);
    px=e.clientX;py=e.clientY;pt=t;lastInteraction=t;angles();e.preventDefault();
  });
  const release=e=>{if(!isDragging||(e&&e.pointerId!==pid))return;isDragging=false;
    hit.classList.remove('is-dragging');lastInteraction=performance.now();
    if(hit.hasPointerCapture?.(pid))hit.releasePointerCapture(pid);pid=null;};
  hit.addEventListener('pointerup',release);hit.addEventListener('pointercancel',release);
  hit.addEventListener('lostpointercapture',()=>{isDragging=false;pid=null;hit.classList.remove('is-dragging');});
  hit.addEventListener('keydown',e=>{
    const d={ArrowLeft:[-18,0],ArrowRight:[18,0],ArrowUp:[0,-18],ArrowDown:[0,18]}[e.key];
    if(d){yaw+=d[0]*RAD;pitch+=d[1]*RAD;vy=vp=0;lastInteraction=performance.now();angles();e.preventDefault();}
    else if(e.key==='Home'){reset();e.preventDefault();}
    else if(e.key===' '){auto=!auto;syncAuto();lastInteraction=performance.now();e.preventDefault();}
  });
  reduced.addEventListener?.('change',()=>{if(reduced.matches){auto=false;vy=vp=0;syncAuto();}});
  syncAuto();angles();
  const theme=()=>{
    const s=getComputedStyle(document.body);
    return {cyan:s.getPropertyValue('--neon').trim()||'#48f7ff',purple:s.getPropertyValue('--secondary').trim()||'#ad74ff',pink:s.getPropertyValue('--pink').trim()||'#ff54ca'};
  };
  let pal=theme();document.getElementById('spectrum-toggle')?.addEventListener('click',()=>requestAnimationFrame(()=>{pal=theme();}));
  const resize=()=>{const b=canvas.getBoundingClientRect();dpr=Math.min(window.devicePixelRatio||1,1.45);
    const nw=Math.max(1,Math.round(b.width*dpr)),nh=Math.max(1,Math.round(b.height*dpr));
    if(canvas.width!==nw||canvas.height!==nh){canvas.width=nw;canvas.height=nh;}w=b.width;h=b.height;};
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(canvas);else window.addEventListener('resize',resize);
  if('IntersectionObserver' in window)new IntersectionObserver(e=>inView=e[0]?.isIntersecting??true,{threshold:0}).observe(canvas);
  resize();
  const vecRot=(p,rx,ry,rz)=>{
    let [x,y,z]=p,c=Math.cos(rx),s=Math.sin(rx);[y,z]=[c*y-s*z,s*y+c*z];
    c=Math.cos(ry);s=Math.sin(ry);[x,z]=[c*x+s*z,-s*x+c*z];
    c=Math.cos(rz);s=Math.sin(rz);[x,y]=[c*x-s*y,s*x+c*y];return [x,y,z];
  };
  const centerShield=[[-.70,.68],[-.14,.87],[0,.93],[.14,.87],[.70,.68],[.68,-.13],[.57,-.49],[.37,-.76],[0,-1],[-.37,-.76],[-.57,-.49],[-.68,-.13]];
  const rectangle=[[-1.03,1.24,-.50],[1.06,1.08,-.50],[1.01,-1.26,-.50],[-.98,-1.11,-.50]];
  const loop=points=>[...points,points[0]];
  const projects=(points)=>points.map(project);
  let roll=0,float=0;
  function project(p){
    let pt=vecRot(p,0,0,roll);pt=vecRot(pt,pitch,0,0);pt=vecRot(pt,0,yaw,0);
    const z=pt[2],d=Math.max(6.1,7.35-z),lens=h/(2*Math.tan(22*Math.PI/180));
    const scale=lens/d;
    return {x:w*.5+pt[0]*scale,y:h*.51-(pt[1]+float)*scale,z,scale};
  }
  const line=(pts,color,width=.013,alpha=.8,halo=0)=>{
    const projected=pts.map(project),z=projected.reduce((s,p)=>s+p.z,0)/projected.length;
    return {z,draw:()=>{
      ctx.save();ctx.globalAlpha=alpha;ctx.beginPath();ctx.moveTo(projected[0].x,projected[0].y);
      for(const p of projected.slice(1))ctx.lineTo(p.x,p.y);
      ctx.strokeStyle=color;ctx.lineWidth=width*projected[0].scale;ctx.lineJoin='round';ctx.lineCap='round';
      if(halo){ctx.shadowBlur=halo;ctx.shadowColor=color;}ctx.stroke();ctx.restore();
    }};
  };
  const poly=(points,fill,stroke=null,alpha=1)=>{
    const pts=points.map(project),z=pts.reduce((s,p)=>s+p.z,0)/pts.length;
    return {z,draw:()=>{
      ctx.save();ctx.globalAlpha=alpha;ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
      pts.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();
      const minx=Math.min(...pts.map(p=>p.x)),miny=Math.min(...pts.map(p=>p.y));
      const maxx=Math.max(...pts.map(p=>p.x)),maxy=Math.max(...pts.map(p=>p.y));
      let grad=ctx.createLinearGradient(minx,miny,maxx,maxy);
      if(fill==='shield'){grad.addColorStop(0,'#234076');grad.addColorStop(.45,'#0d1d40');grad.addColorStop(1,'#22184d');}
      else if(fill==='back'){grad.addColorStop(0,'#152855');grad.addColorStop(1,'#10152e');}
      else{grad.addColorStop(0,'#224773');grad.addColorStop(1,'#25113e');}
      ctx.fillStyle=grad;ctx.fill();
      if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();}ctx.restore();
    }};
  };
  const dot=(point,r,color,alpha=1)=>{
    const p=project(point),rr=Math.max(.5,p.scale*r);
    return {z:p.z,draw:()=>{
      ctx.save();ctx.globalAlpha=alpha;let g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,rr*3.4);
      g.addColorStop(0,color);g.addColorStop(.18,color+'cc');g.addColorStop(1,'#00000000');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,rr*3.4,0,TAU);ctx.fill();
      ctx.fillStyle=color;ctx.beginPath();ctx.arc(p.x,p.y,rr,0,TAU);ctx.fill();ctx.restore();
    }};
  };
  const addOrbit=(parts,major,angles,color,t=0)=>{
    const n=92;
    for(let j=0;j<n;j++){
      const a=TAU*j/n,b=TAU*(j+1)/n;
      const p1=vecRot([major*Math.cos(a),major*Math.sin(a),0],...angles);
      const p2=vecRot([major*Math.cos(b),major*Math.sin(b),0],...angles);
      parts.push(line([p1,p2],color,.032,.085,14));
      parts.push(line([p1,p2],color,.015,.75,0));
    }
  };
  function render(now){
    const dt=lastFrame?clamp((now-lastFrame)/1000,0,.05):0;
    if(inView && !document.hidden){
      if(!isDragging&&!stopped()){
        if(Math.abs(vy)+Math.abs(vp)>.003){yaw+=vy*dt;pitch+=vp*dt;const damping=Math.exp(-5.4*dt);vy*=damping;vp*=damping;angles();}
        else if(auto&&now-lastInteraction>1400){yaw+=dt*.17;angles();}
      }
      if(Math.abs(yaw)>1200)yaw%=TAU;if(Math.abs(pitch)>1200)pitch%=TAU;
      roll=stopped()?0:Math.sin(now*.00073)*.05;
      float=stopped()?0:Math.sin(now*.00132)*.12;
      resize();ctx.clearRect(0,0,canvas.width,canvas.height);ctx.setTransform(dpr,0,0,dpr,0,0);
      const parts=[];
      // The glass square is behind the shield, and physically tilts with the whole object.
      parts.push(poly(rectangle,'glass',null,.17));
      parts.push(line(loop(rectangle),pal.purple,.022,.73,11));
      for(let i=-2;i<=2;i++){
        parts.push(line([[i*.31,-.80,-.55],[i*.31,.80,-.55]],pal.cyan,.007,.12));
        parts.push(line([[-.80,i*.31,-.55],[.80,i*.31,-.55]],pal.cyan,.007,.12));
      }
      const bluePlane=[1.11,.12,.38],purplePlane=[.16,1.23,.15],pinkPlane=[.59,-.66,.12];
      addOrbit(parts,1.58,bluePlane,pal.cyan);
      addOrbit(parts,1.48,purplePlane,pal.purple);
      addOrbit(parts,1.67,pinkPlane,pal.pink);
      for(let i=0;i<58;i++){
        const a=TAU*i/58;
        const p=vecRot([1.88*Math.cos(a),1.88*Math.sin(a),0],.28,-.20,-.11);
        parts.push(dot(p,.011,i%7===0?pal.purple:pal.cyan,.42));
      }
      // The shield is a true volume, with a front, back, and individually shaded sidewalls.
      const front=centerShield.map(p=>[...p,.20]),back=centerShield.map(p=>[...p,-.22]);
      for(let i=0;i<front.length;i++){
        const j=(i+1)%front.length;
        parts.push(poly([front[i],front[j],back[j],back[i]],'back',pal.purple,.90));
      }
      parts.push(poly(back,'back',pal.purple,1));
      parts.push(poly(front,'shield',pal.cyan,.98));
      parts.push(line(loop(front),pal.cyan,.048,.82,17));
      parts.push(line(loop(front),pal.cyan,.026,1,0));
      parts.push(line(loop(back),pal.purple,.025,.94,12));
      parts.push(line(loop(front.map(p=>[p[0]*.81,p[1]*.81,.27])),pal.purple,.010,.46));
      const check=[[-.36,-.075,.30],[-.08,-.36,.30],[.45,.27,.30]];
      parts.push(line(check,pal.cyan,.095,.36,19));parts.push(line(check,pal.cyan,.048,1,10));
      parts.push(line([[-.36,-.075,-.28],[-.08,-.36,-.28],[.45,.27,-.28]],pal.purple,.044,.9,10));
      const orbPos=(r,a,ang)=>vecRot([r*Math.cos(a),r*Math.sin(a),0],...ang);
      for(const [r,a,ang,color] of [[1.58,1.38,bluePlane,pal.cyan],[1.48,-.5,purplePlane,pal.purple],[1.67,3.6,pinkPlane,pal.pink],[1.58,5.2,bluePlane,pal.cyan]]){
        parts.push(dot(orbPos(r,a,ang),.041,color,1));
      }
      parts.sort((a,b)=>a.z-b.z);
      for(const part of parts)part.draw();
      // The title is projected from a 3D location: it stays attached to the EMBLEM.
      const p=project([0,-1.34,.46]),axis=project([.30,-1.34,.46]);
      const backp=project([0,0,1]);
      if(p.z > project([0,-1.34,-.46]).z){
        ctx.save();ctx.globalAlpha=clamp((p.z+3)/3,0,.86);
        ctx.textAlign='center';ctx.font=`bold ${Math.max(8,Math.min(13,p.scale*.18))}px ui-monospace, monospace`;
        ctx.letterSpacing='1px';ctx.fillStyle='#d5faff';ctx.shadowBlur=8;ctx.shadowColor=pal.cyan;
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(axis.y-p.y,axis.x-p.x));ctx.fillText('THOMAS // CORE',0,0);ctx.restore();ctx.restore();
      }
    }
    lastFrame=now;
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
})();
