/* 被遺忘者之路 · 場景：副本房間（地城、野外）、事件房物件、營地 */
'use strict';
const RW=12,RD=21,HX=RW/2,HZ=RD/2;
const room={g:null,coll:[],theme:null,gate:null,doors:[],portal:null,gateOpen:0,torches:[],candles:[],fire:null,rune:null,npc:null,evo:null,spin:[]};
function themeLights(th){scene.background=new T.Color(th.fog);scene.fog=new T.Fog(th.fog,10,60);hemi.color.set(th.hemiSky);hemi.groundColor.set(th.hemiGround);hemi.intensity=th.amb;sun.color.set(th.sun);moteMat.color.set(th.kit&&th.kit.snow?'#ffffff':th.torch)}
function clearGroup(g){room.fire=null;room.doors=[];room.gate=null;room.spin=[];if(room.npc){disposeChar(room.npc);room.npc=null}room.evo=null;if(!g)return;scene.remove(g);g.traverse(n=>{if(n.isInstancedMesh)n.dispose();if(n.material&&n.userData.own){if(n.material.map)n.material.map.dispose();n.material.dispose()}})}
function crackTex(){return canvasTex(128,128,(x)=>{x.strokeStyle='rgba(0,0,0,.55)';x.lineWidth=2;for(let k=0;k<3;k++){x.beginPath();let px=64,py=64;x.moveTo(px,py);for(let i=0;i<6;i++){px+=rnd(-22,22);py+=rnd(-22,22);x.lineTo(px,py)}x.stroke()}})}
const CRACK=crackTex(),crackMat=new T.MeshBasicMaterial({map:CRACK,transparent:true,depthWrite:false});
function addColl(x,z,r){room.coll.push({x,z,r})}

/* ---------- 素材擺放 ----------
 * PROP：房內障礙的縮放與碰撞圓（[x 偏移, z 偏移, 半徑]）；DECO_S：沿牆裝飾的縮放 */
const DS=.75,GATE={w:1.25,h:2.1};
const PROP={pillar:{s:.75,c:[[0,0,.62]]},pillar_decorated:{s:.62,c:[[0,0,.75]]},trunk_large_A:{s:.8,c:[[0,0,.62]]},barrel_large:{s:.6,c:[[0,0,.6]]},crates_stacked:{s:.62,c:[[0,0,.75]]},
  table_long_broken:{s:.7,c:[[0,-.8,.6],[0,.8,.6]]},chest_gold:{s:.8,c:[[0,.2,.7]]},coin_stack_large:{s:.75,c:[[0,0,.6]]},box_stacked:{s:.45,c:[[0,0,.8]]},
  'nature/rock_medium_1':{s:.5,c:[[0,0,.78]]},'nature/rock_medium_2':{s:.5,c:[[0,0,.7]]},'nature/rock_medium_3':{s:.5,c:[[0,0,.82]]},'nature/mushroom_redcap':{s:1.1,c:[[0,0,.8]]},
  'halloween/tree_dead_large':{s:.75,c:[[0,0,.38]]},'halloween/tree_pine_yellow_medium':{s:.5,c:[[0,0,.7]]},'halloween/gravestone':{s:.75,c:[[0,0,.6]]},'halloween/pillar':{s:.6,c:[[0,0,.48]]},
  'halloween/coffin':{s:.6,c:[[0,-.4,.52],[0,.4,.52]]},'halloween/grave_A':{s:.6,c:[[0,0,.66]]},'halloween/shrine_candles':{s:.85,c:[[0,0,.5]]}};
const DECO_S={'halloween/bone_A':.6,'halloween/skull_candle':.45,'halloween/pumpkin_orange_jackolantern':.45,'halloween/pumpkin_yellow_jackolantern':.42,'halloween/ribcage':.6,'halloween/lantern_standing':.7,
  'halloween/plaque_candles':.42,'nature/mushroom_common':.9,'nature/grass_common_short':.55,'nature/fern_1':.32,'nature/mushroom_redcap':.5,'nature/rock_medium_2':.28,'halloween/gravestone':.5};
const GLOWY={'halloween/skull_candle':['#ffcf7a',.9],'halloween/pumpkin_orange_jackolantern':['#ff9a3a',.62],'halloween/pumpkin_yellow_jackolantern':['#ffc84a',.6],'halloween/lantern_standing':['#ffcf7a',.6],'halloween/plaque_candles':['#ffcf7a',.5],'candle_lit':['#ffcf7a',.66],'candle_triple':['#ffcf7a',.55]};
function piece(name,x,y,z,ry,sc,par,tint){const A=ASSETS[assetKey(name)];if(!A)return null;const o=A.scene.clone();o.position.set(x,y,z);o.rotation.y=ry||0;o.scale.setScalar(sc||DS);
  o.traverse(n=>{if(!n.isMesh)return;if(tint)n.material=tintMat(n.material,tint);n.castShadow=true;n.receiveShadow=true});(par||scene).add(o);return o}
const TINTS={};function tintMat(m,col){const k=m.uuid+(typeof col==='string'?col:JSON.stringify(col));if(!TINTS[k]){TINTS[k]=m.clone();if(typeof col!=='string'){if(m.map)TINTS[k].map=recolorTex(m.map,col);else{const c=TINTS[k].color,hsl={};c.getHSL(hsl);c.setHSL(col.h,hsl.s*col.s,Math.min(1,hsl.l*col.l+(col.add||0)))}}else if(m.map)TINTS[k].color.set(col);else TINTS[k].color.multiply(new T.Color(col))}return TINTS[k]}
function decoPiece(g,nm,x,z,ry,tn,R){const s=DECO_S[nm]||.6,o=piece(nm,x,0,z,ry,s,g,/candle|lantern|jackolantern/.test(nm)?null:tn);const gl=GLOWY[nm];
  if(o&&gl){const f=glow(gl[0],.4,g);f.position.set(x,gl[1]*(s/.6)*(nm.startsWith('candle')?1:1.3),z);room.candles.push({f,ph:(R?R():Math.random())*9})}return o}

/* ---------- 房間入口 ----------
 * opts：boss 首領房、event 事件（D.EVENTS 的 id）、elite 菁英房 */
function buildRoom(themeKey,seed,opts){opts=opts||{};const th=D.THEMES[themeKey];
  clearGroup(room.g);const g=new T.Group();room.g=g;scene.add(g);room.coll=[];room.candles=[];room.torches=[];room.theme=th;themeLights(th);
  const R=seeded(seed);(th.kind==='outdoor'?buildOutdoor:buildDungeon)(g,th,R,opts);
  if(opts.event)eventObj(g,th,opts.event);else placeObstacles(g,th,R,opts);
  seedMotes(0,0,HX,HZ,th.kit&&th.kit.snow)}
function floorRune(g,th,big){const rune=new T.Mesh(GEO.plane,new T.MeshBasicMaterial({map:RUNE,color:th.torch,transparent:true,opacity:big?.32:.13,depthWrite:false,blending:T.AdditiveBlending}));rune.rotation.x=-Math.PI/2;rune.position.set(0,.06,-1);rune.scale.setScalar(big?8:5.5);g.add(rune);room.rune=rune}
function placeObstacles(g,th,R,opts){const kit=th.kit,tn=kit.tint,pk=a=>a[Math.floor(R()*a.length)],rr=(a,b)=>a+R()*(b-a);const spots=[];let tries=0;
  if(opts.boss)[[-3,-4],[3,-4],[-3,3.5],[3,3.5]].forEach(p=>spots.push(p));
  else{const n=opts.elite?2:ri(2,4);while(spots.length<n&&tries++<200){const x=Math.round(rr(-HX+2,HX-2)*2)/2,z=Math.round(rr(-HZ+4,HZ-5.5)*2)/2;if(Math.abs(x)<1.3&&z<-HZ+5)continue;if(spots.some(s=>Math.hypot(s[0]-x,s[1]-z)<3.4))continue;spots.push([x,z])}}
  spots.forEach(([x,z])=>{const nm=opts.boss?(th.kind==='outdoor'?kit.obstacles[0]:'pillar_decorated'):pk(kit.obstacles),pd=PROP[nm]||{s:.7,c:[[0,0,.65]]},ry=Math.floor(R()*4)*Math.PI/2;
    const tint=/tree_pine/.test(nm)&&kit.treeTint?kit.treeTint:tn;piece(nm,x,0,z,ry,pd.s,g,tint);
    for(const[cx,cz,r]of pd.c){const c=Math.cos(ry),sn=Math.sin(ry);addColl(x+cx*c+cz*sn,z-cx*sn+cz*c,r)}
    if(kit.crystals&&R()<.7)crystal(g,x+rr(-.4,.4),z+.6,kit.crystals,R)})}
function crystal(g,x,z,col,R){const cm=M(col,{emissive:col,emissiveIntensity:.55});for(let i=0;i<3;i++){const c=mesh(GEO.oct,cm,x+(R()-.5)*.6,.35+R()*.2,z+(R()-.5)*.4,.25+R()*.15,.7+R()*.5,.25+R()*.15,g);c.rotation.set((R()-.5)*.6,R()*TAU,(R()-.5)*.6)}
  const f=glow(col,1.2,g,.6);f.position.set(x,.6,z);room.candles.push({f,ph:R()*9})}

/* ---------- 地城房間（KayKit Dungeon） ---------- */
function buildDungeon(g,th,R,opts){const kit=th.kit,tn=kit.tint,rr=(a,b)=>a+R()*(b-a),pk=a=>a[Math.floor(R()*a.length)];
  mesh(GEO.plane,MB(th.fog),0,-.32,0,140,140,1,g).rotation.x=-Math.PI/2;
  for(let ix=0;ix<4;ix++)for(let iz=0;iz<7;iz++){const x=-4.5+ix*3,z=-9+iz*3;piece('floor_tile_large',x,0,z,Math.floor(R()*4)*Math.PI/2,DS,g,tn)}
  for(let i=0;i<6;i++){const c=new T.Mesh(GEO.plane,crackMat);c.rotation.x=-Math.PI/2;c.rotation.z=rr(0,TAU);c.position.set(rr(-HX+1,HX-1),.05,rr(-HZ+1,HZ-1));c.scale.setScalar(rr(1.2,2.2));g.add(c)}
  floorRune(g,th,opts.boss);
  const NZ=-HZ-.375,walls=['wall','wall','wall_cracked','wall_window_closed'];
  const dw=piece('wall_doorway',0,0,NZ,0,DS,g,tn);const door=dw?dw.getObjectByName('wall_doorway_door'):null;if(door)room.doors.push({o:door,s:1});
  for(const sx of[-1,1]){piece(pk(walls),sx*3,0,NZ,0,DS,g,tn);piece('wall_half',sx*4.5,0,NZ,sx>0?0:Math.PI,DS,g,tn)}
  for(const sx of[-1,1])for(let z=-9;z<=9;z+=3)piece(R()<.15?'wall_pillar':pk(walls),sx*(HX+.375),0,z,Math.PI/2,DS,g,tn);
  for(const sx of[-1,1])piece('pillar',sx*(HX+.375),0,NZ,0,.6,g,tn);
  for(let x=-4.5;x<=4.5;x+=3)piece('barrier',x,0,HZ+.25,0,DS,g,tn);
  gateFx(g,th,NZ);
  const tsp=[[-3.8,-HZ,0],[3.8,-HZ,0],[-HX,0,1],[HX,0,-1]];
  tsp.forEach(([x,z,side],i)=>{piece('torch_mounted',x,1.75,z,side?side*Math.PI/2:0,DS,g);const fx=x+side*.36,fz=side?z:z+.36;
    const fl=glow(th.torch,1.5,g,.95),core=glow(th.torchCore,.55,g);fl.position.set(fx,2.3,fz);core.position.set(fx,2.25,fz);
    const L=TORCH[i];L.color.set(th.torch);L.position.set(x+side*1,2.4,side?z:z+1);L.intensity=1.5;L.distance=opts.boss?12:10;room.torches.push({fl,core,L,x:fx,z:fz,ph:R()*9})});
  if(kit.banner){const bt=kit.bannerTint||'#9a94a8';for(const sx of[-1,1]){piece(kit.banner,sx*2.3,0,NZ,0,DS,g,bt);piece(kit.banner,sx*5.3,0,NZ,0,DS*.9,g,bt);for(const z of[-6,6])piece(kit.banner,sx*(HX+.375),0,z,-sx*Math.PI/2,DS*.9,g,bt)}}
  const deco=(x,z,ry)=>{const nm=pk(kit.decor);if(nm.includes('/'))decoPiece(g,nm,x,z,ry,tn,R);else{const o=piece(nm,x,0,z,ry,.6,g,nm.startsWith('candle')?null:tn);if(o&&nm.startsWith('candle')){const f=glow('#ffcf7a',.35,g);f.position.set(x,nm==='candle_lit'?.66:.55,z);room.candles.push({f,ph:R()*9})}}};
  for(let z=-HZ+1.2;z<HZ-1.5;z+=rr(2.2,3.4)){if(Math.abs(z)<1)continue;if(R()<.7)deco(-HX+.55,z,Math.PI/2);if(R()<.7)deco(HX-.55,z,-Math.PI/2)}
  for(const x of[-HX+.7,-HX+1.7,HX-.7,HX-1.7])if(R()<.75)deco(x,-HZ+.6,0)}
function gateFx(g,th,NZ){const arch=new T.Group();arch.position.set(0,0,NZ);g.add(arch);
  const portal=new T.Mesh(GEO.plane,new T.MeshBasicMaterial({map:GLOW,color:th.torch,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending}));portal.position.set(0,GATE.h*.55,-.1);portal.scale.set(GATE.w*1.6,GATE.h*1.5,1);arch.add(portal);room.portal=portal;
  mesh(GEO.plane,MB('#000000'),0,GATE.h/2,-.45,GATE.w+.2,GATE.h+.1,1,arch);room.gateOpen=0}

/* ---------- 野外房間（自然包、萬聖節素材） ---------- */
const GROUND_TEX={};
function groundTex(th){const k=th.ground.join();if(GROUND_TEX[k])return GROUND_TEX[k];const[a,b,c]=th.ground;
  const t=canvasTex(256,256,(x,w,hh)=>{x.fillStyle=a;x.fillRect(0,0,w,hh);const R=seeded(7);
    for(let i=0;i<70;i++){x.globalAlpha=.35+R()*.35;x.fillStyle=R()<.5?b:c;x.beginPath();const px=R()*w,py=R()*hh,r=8+R()*26;x.ellipse(px,py,r,r*(.5+R()*.5),R()*TAU,0,TAU);x.fill()}
    x.globalAlpha=.55;for(let i=0;i<140;i++){x.fillStyle=R()<.5?'rgba(0,0,0,.35)':'rgba(255,255,255,.12)';x.fillRect(R()*w,R()*hh,2+R()*3,2+R()*2)}x.globalAlpha=1});
  t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(3,5);return GROUND_TEX[k]=t}
function buildOutdoor(g,th,R,opts){const kit=th.kit,tn=kit.tint,rr=(a,b)=>a+R()*(b-a),pk=a=>a[Math.floor(R()*a.length)],tt=n=>/tree_pine/.test(n)&&kit.treeTint?kit.treeTint:tn;
  mesh(GEO.plane,MB(th.fog),0,-.32,0,140,140,1,g).rotation.x=-Math.PI/2;
  const out=mesh(GEO.plane,M(th.ground[2]),0,-.02,0,40,48,1,g);out.rotation.x=-Math.PI/2;out.castShadow=false;
  const gr=new T.Mesh(GEO.plane,new T.MeshLambertMaterial({map:groundTex(th)}));gr.rotation.x=-Math.PI/2;gr.scale.set(RW+.6,RD+.6,1);gr.receiveShadow=true;g.add(gr);
  for(let i=0;i<5;i++){const c=new T.Mesh(GEO.plane,crackMat);c.rotation.x=-Math.PI/2;c.rotation.z=rr(0,TAU);c.position.set(rr(-HX+1,HX-1),.02,rr(-HZ+1,HZ-1));c.scale.setScalar(rr(1,2));g.add(c)}
  floorRune(g,th,opts.boss);
  // 東西兩側：岩石牆 + 後方枯樹
  for(const sx of[-1,1]){for(let z=-HZ-.5;z<=HZ+1;z+=rr(1.3,1.8)){const nm=pk(kit.rocks);piece(nm,sx*(HX+.55+rr(0,.35)),-.1,z,rr(0,TAU),rr(.45,.62),g,tn)}
    for(let z=-HZ;z<=HZ+2;z+=rr(2.4,3.4)){const nm=pk(kit.trees);piece(nm,sx*(HX+rr(1.8,2.8)),0,z,rr(0,TAU),nm.includes('rock')?rr(.4,.55):rr(.8,1.1),g,tt(nm))}}
  // 北側：中央石拱門，兩側大岩石
  const NZ=-HZ-.35;
  for(const sx of[-1,1]){piece(pk(kit.big),sx*rr(2.9,3.3),-.2,NZ-.3,rr(0,TAU),rr(.42,.5),g,tn);piece(pk(kit.big),sx*rr(5.2,5.8),-.2,NZ-.1,rr(0,TAU),rr(.45,.55),g,tn);
    piece(pk(kit.trees),sx*rr(1.5,4.5),0,NZ-rr(2.2,3),rr(0,TAU),rr(.9,1.2),g,tt(kit.trees[0]))}
  const ag=piece('halloween/arch_gate',0,0,NZ,0,.6,g,tn);if(ag){const l=ag.getObjectByName('arch_gate_left'),r=ag.getObjectByName('arch_gate_right');if(l)room.doors.push({o:l,s:-1});if(r)room.doors.push({o:r,s:1})}
  gateFx(g,th,NZ);
  // 南側：矮柱與小石
  for(let x=-HX;x<=HX+.01;x+=2){piece('halloween/fence_pillar',x,0,HZ+.5,0,.45,g,tn);if(R()<.6)piece(pk(kit.rocks),x+1,-.1,HZ+.7,rr(0,TAU),rr(.2,.3),g,tn)}
  // 燈：四個角落
  const ls=[[-HX+.55,-HZ+.9],[HX-.55,-HZ+.9],[-HX+.55,1.5],[HX-.55,-.5]];
  ls.forEach(([x,z],i)=>{const nm=kit.light||'halloween/lantern_standing';piece(nm,x,0,z,R()*TAU,nm.includes('post')?.42:.75,g);addColl(x,z,.32);
    const fl=glow(th.torch,1.3,g,.9),core=glow(th.torchCore,.45,g);const y=nm.includes('post')?1.3:.62;fl.position.set(x,y,z);core.position.set(x,y,z);
    const L=TORCH[i];L.color.set(th.torch);L.position.set(x,2.2,z);L.intensity=1.6;L.distance=opts.boss?13:11;room.torches.push({fl,core,L,x,z,ph:R()*9,low:1})});
  // 沿邊裝飾、地面草叢
  for(let z=-HZ+1.2;z<HZ-1;z+=rr(1.6,2.8)){for(const sx of[-1,1])if(R()<.75)decoPiece(g,pk(kit.decor),sx*(HX-rr(.4,.7)),z,rr(0,TAU),tn,R)}
  if(!kit.snow&&!kit.crystals)for(let i=0;i<10;i++){const x=rr(-HX+1.2,HX-1.2),z=rr(-HZ+1.5,HZ-1.5);if(Math.abs(x)<1.5&&z<-HZ+4)continue;piece('nature/grass_common_short',x,0,z,rr(0,TAU),rr(.35,.5),g,tn)}
  if(kit.crystals)for(let i=0;i<6;i++){const sx=R()<.5?-1:1;crystal(g,sx*(HX-.5),rr(-HZ+1.5,HZ-1.5),kit.crystals,R)}}

/* ---------- 事件房物件 ----------
 * 每種事件在房間中央放一個可互動的物件；走到旁邊（半徑 2.6）就會觸發 */
const SHRINE={x:0,z:-2};
function eventObj(g,th,evId){const{x,z}=SHRINE,ev=D.EVENTS.find(e=>e.id===evId)||D.EVENTS[0],col=ev.col;
  if(room.rune){room.rune.material.opacity=.35;room.rune.material.color.set(col);room.rune.position.set(x,.07,z)}
  const L=TORCH[2];L.color.set(col);L.position.set(x,1.8,z);L.intensity=2.4;L.distance=12;
  if(evId==='fire'){for(let i=0;i<10;i++){const a=i/10*TAU;mesh(GEO.rock,M('#5a5560'),x+Math.cos(a)*1.05,.18,z+Math.sin(a)*1.05,.5,.38,.5,g)}
    for(let i=0;i<4;i++){const l=mesh(GEO.cyl6,M('#3a2a1e'),x,.25,z,.14,1.3,.14,g);l.rotation.set(Math.PI/2.4,i*TAU/4,0)}
    const a=glow('#7dff8a',3,g,.95),b=glow('#d8ffd0',1.2,g);a.position.set(x,1,z);b.position.set(x,.7,z);room.fire={a,b,col:'#7dff8a',core:'#d8ffd0'}}
  else if(evId==='shop'){piece('table_long_broken',x,0,z+.6,Math.PI/2,.6,g);piece('chest_gold',x-1.3,0,z+.4,.3,.5,g);piece('coin_stack_small',x+.9,.62,z+.6,0,.5,g);
    room.npc=makeChar('sk_rogue',{scale:.72,look:{head:'hood',back:'cape'},eye:'#ffd04a',tint:'#d8c8b0'});room.npc.root.position.set(x,0,z-.4);g.add(room.npc.root);play(room.npc,'Idle',0);
    const f=glow('#ffd76a',2.2,g,.7);f.position.set(x,1.2,z+.4);room.fire={a:f,col:'#ffd76a',core:'#fff4c0',calm:1}}
  else if(evId==='curse'){mesh(GEO.box,M('#2a1a22'),x,.4,z,1.6,.8,1.6,g);mesh(GEO.box,M('#4a1a2a'),x,.85,z,1.3,.12,1.3,g);const oc=mesh(GEO.oct,M('#ff4a6a',{emissive:'#a01030'}),x,1.6,z,.6,1,.6,g);room.spin.push({o:oc,ax:'y'});
    for(let i=0;i<4;i++){const a=i/4*TAU+Math.PI/4;piece('candle_triple',x+Math.cos(a)*1.4,0,z+Math.sin(a)*1.4,0,.6,g)}
    const f=glow('#ff4a6a',2.6,g,.8);f.position.set(x,1.6,z);room.fire={a:f,col:'#ff4a6a',core:'#ffd0d8'}}
  else if(evId==='well'){for(let i=0;i<12;i++){const a=i/12*TAU;mesh(GEO.box,M('#4a5060'),x+Math.cos(a)*1.1,.3,z+Math.sin(a)*1.1,.5,.6,.32,g).rotation.y=-a}
    const w=mesh(GEO.disc,new T.MeshBasicMaterial({color:'#7df9ff',transparent:true,opacity:.7}),x,.5,z,1,1,1,g);w.userData.own=1;
    const f=glow('#7df9ff',3.2,g,.85);f.position.set(x,1.3,z);room.fire={a:f,col:'#7df9ff',core:'#e0ffff'}}
  else if(evId==='chest'){const c=piece('chest_gold',x,0,z,0,.95,g);const f=glow('#ffd76a',2.8,g,.75);f.position.set(x,1,z);room.fire={a:f,col:'#ffd76a',core:'#fff4c0',calm:1};room.evo=c}
  else if(evId==='ritual'){const rm=new T.Mesh(GEO.plane,new T.MeshBasicMaterial({map:RUNE,color:'#c38cff',transparent:true,opacity:.7,depthWrite:false,blending:T.AdditiveBlending}));rm.rotation.x=-Math.PI/2;rm.position.set(x,.08,z);rm.scale.setScalar(4.4);g.add(rm);room.spin.push({o:rm,ax:'z'});
    for(let i=0;i<4;i++){const a=i/4*TAU+Math.PI/4;piece('pillar',x+Math.cos(a)*2.1,0,z+Math.sin(a)*2.1,0,.45,g,th.kit.tint);addColl(x+Math.cos(a)*2.1,z+Math.sin(a)*2.1,.4);const f=glow('#c38cff',.8,g);f.position.set(x+Math.cos(a)*2.1,1.6,z+Math.sin(a)*2.1);room.candles.push({f,ph:i*2})}
    mesh(GEO.oct,M('#c38cff',{emissive:'#5a2a9a'}),x,1.2,z,.5,.8,.5,g);const f=glow('#c38cff',2.4,g,.8);f.position.set(x,1.2,z);room.fire={a:f,col:'#c38cff',core:'#f0e0ff',calm:1}}
  if(evId!=='ritual')addColl(x,z,.95);return{x,z}}

/* ---------- 營地（主城） ---------- */
const hubG=new T.Group();let hubBuilt=false,hubChar=null,hubFire=null;
function buildHub(){if(hubBuilt)return;hubBuilt=true;scene.add(hubG);const R=seeded(77),rr=(a,b)=>a+R()*(b-a);
  mesh(GEO.plane,MB('#0c0b11'),0,-.05,0,200,200,1,hubG).rotation.x=-Math.PI/2;
  const gm=new T.Mesh(new T.CircleGeometry(16,40).rotateX(-Math.PI/2),M('#2a2633'));gm.receiveShadow=true;hubG.add(gm);
  const tiles=[];for(let r=1.6;r<5.5;r+=1)for(let a=0;a<TAU;a+=1/r){tiles.push([Math.cos(a)*r,Math.sin(a)*r,a])}
  const tm=new T.InstancedMesh(GEO.box,M('#ffffff'),tiles.length);tm.receiveShadow=true;const mx=new T.Matrix4(),q=new T.Quaternion(),s=new T.Vector3(),p=new T.Vector3(),c=new T.Color();
  tiles.forEach((t,i)=>{p.set(t[0],.02,t[1]);q.setFromAxisAngle(new T.Vector3(0,1,0),-t[2]);s.set(.86,.12,.86);mx.compose(p,q,s);tm.setMatrixAt(i,mx);c.set('#3c3846').lerp(new T.Color('#4c4856'),R());tm.setColorAt(i,c)});hubG.add(tm);
  for(let i=0;i<9;i++){const a=i/9*TAU;mesh(GEO.rock,M('#55525c'),Math.cos(a)*.75,.12,Math.sin(a)*.75,.38,.28,.38,hubG)}
  for(let i=0;i<4;i++){const l=mesh(GEO.cyl6,M('#3a2a1e'),0,.18,0,.12,1.1,.12,hubG);l.rotation.set(Math.PI/2.4,i*TAU/4,0)}
  hubFire={a:glow('#7dff8a',2.6,hubG,.9),b:glow('#d8ffd0',1,hubG)};hubFire.a.position.set(0,.8,0);hubFire.b.position.set(0,.55,0);
  [[-5.2,-4.6,.6],[5.4,-4,-.7],[-.2,-7.2,0]].forEach(([x,z,ry])=>{const tg=new T.Group();tg.position.set(x,0,z);tg.rotation.y=ry;hubG.add(tg);
    const cl=mesh(new T.ConeGeometry(1.8,2.6,4,1,true),new T.MeshLambertMaterial({color:'#4a2f62',side:T.DoubleSide}),0,1.3,0,1,1,1,tg);cl.rotation.y=Math.PI/4;
    mesh(GEO.plane,MB('#0a080d'),0,.7,1.27,.9,1.3,1,tg);mesh(GEO.cyl6,M('#3a2c22'),0,2.8,0,.06,.6,.06,tg);mesh(GEO.plane,new T.MeshLambertMaterial({color:'#7dff8a',side:T.DoubleSide}),.22,2.9,0,.4,.25,1,tg)});
  for(let i=0;i<10;i++){const a=rr(0,TAU),r=rr(6.5,11),x=Math.cos(a)*r,z=Math.sin(a)*r;if(z>2&&Math.abs(x)<5)continue;grave(hubG,x,z,rr)}
  for(let i=0;i<5;i++){const a=rr(Math.PI*1.1,Math.PI*1.9),r=rr(7,12),x=Math.cos(a)*r,z=Math.sin(a)*r;deadTree(hubG,x,z,rr)}
  for(let i=0;i<6;i++){const a=rr(0,TAU),r=rr(3,6);bones(hubG,Math.cos(a)*r,Math.sin(a)*r,rr)}
  mesh(GEO.box,M('#2a2236'),-3.2,.35,.2,1.4,.7,.8,hubG);mesh(GEO.box,M('#4b3d63'),-3.2,.75,.2,1.2,.12,.7,hubG);const ag=glow('#9dff6a',.9,hubG,.8);ag.position.set(-3.2,1,.2);
  for(const x of[-2.8,2.8]){mesh(GEO.cyl6,M('#3a2c22'),x,1.6,-4.2,.08,3.2,.08,hubG);piece('banner_thin_green',x+.5,0,-4.2,0,.6,hubG,'#9a94a8')}
  hubChar=makeHero(.85,.8);hubChar.root.position.set(1.15,0,1.1);hubChar.root.rotation.y=.35;hubG.add(hubChar.root);play(hubChar,'Idle')}
function grave(g,x,z,rr){mesh(GEO.box,M('#5d625a'),x,.6,z,.9,1.3,.22,g).rotation.z=rr(-.12,.12);mesh(GEO.cyl,M('#5d625a'),x,1.25,z,.9,.22,.9,g).rotation.x=Math.PI/2;mesh(GEO.box,M('#2a2c24'),x,.03,z+.6,.9,.06,1.2,g)}
function bones(g,x,z,rr){const bm=M('#d8d0b8');for(let i=0;i<4;i++){const b=mesh(GEO.cyl6,bm,x+rr(-.3,.3),.08,z+rr(-.3,.3),.07,.55,.07,g);b.rotation.set(Math.PI/2,0,rr(0,TAU))}mesh(GEO.sph,bm,x+rr(-.2,.2),.16,z+rr(-.2,.2),.28,.26,.3,g)}
function deadTree(g,x,z,rr){const tm=M('#2e2420');mesh(GEO.cyl6,tm,x,1.2,z,.3,2.4,.3,g);for(let i=0;i<4;i++){const b=mesh(GEO.cyl6,tm,x,1.4+i*.35,z,.12,1.3,.12,g);b.rotation.set(rr(-1,1),rr(0,TAU),rr(.6,1.1));b.position.x+=Math.sin(b.rotation.y)*.4;b.position.z+=Math.cos(b.rotation.y)*.4}}
function showHubScene(on){hubG.visible=on;if(room.g)room.g.visible=!on;if(on){scene.background=new T.Color('#0c0b11');scene.fog=new T.Fog('#0c0b11',12,34);hemi.color.set('#6e6a92');hemi.groundColor.set('#1a1720');hemi.intensity=.55;sun.color.set('#a9b4ff');
  TORCH.forEach((l,i)=>{l.intensity=i===0?2.2:0;l.color.set('#7dff8a');l.position.set(0,1.4,0);l.distance=12});pLight.intensity=0;moteMat.color.set('#9dff6a');seedMotes(0,0,7,7)}}

/* ---------- 每幀：火把、蠟燭、事件物件、門 ---------- */
function updWorld(dt){if(room.g&&room.g.visible){
  for(const t of room.torches){const f=Math.sin(G.time*10+t.ph)*.5+Math.sin(G.time*6.7+t.ph*2)*.5;t.fl.scale.setScalar((t.low?1.3:1.5)+f*.2);t.L.intensity=(t.low?1.6:1.45)+f*.3;if(Math.random()<.12)emit(t.x,t.low?.9:2.4,t.z,room.theme.torch,1,.4,.9,{up:1.2,drag:.98})}
  for(const c of room.candles)c.f.scale.setScalar(.33+Math.sin(G.time*13+c.ph)*.04);
  if(room.fire){const f=Math.sin(G.time*11)*.5+Math.sin(G.time*7.3)*.5,F=room.fire;if(F.calm)F.a.scale.setScalar(2.4+Math.sin(G.time*2)*.25);else{F.a.scale.setScalar(2.9+f*.3);if(F.b)F.b.scale.setScalar(1.2+f*.12)}
    if(Math.random()<(F.calm?.3:.7))emit(SHRINE.x+rnd(-.3,.3),.6,SHRINE.z+rnd(-.3,.3),Math.random()<.5?F.col:F.core,1,.6,1.1,{up:1.8,drag:.98})}
  for(const s of room.spin)s.o.rotation[s.ax]+=dt*(s.ax==='y'?1.4:.6);
  if(room.npc)room.npc.mixer.update(dt);
  if(room.rune)room.rune.rotation.z+=dt*.05;
  if(room.gateOpen>0&&room.gateOpen<1){room.gateOpen=Math.min(1,room.gateOpen+dt*1.4);const k=1-Math.pow(1-room.gateOpen,3);for(const d of room.doors)d.o.rotation.y=1.75*k*d.s;if(room.portal)room.portal.material.opacity=.85*room.gateOpen;shake=Math.max(shake,.05)}
  if(room.portal&&room.gateOpen>=1){room.portal.material.opacity=.7+Math.sin(G.time*3)*.15;if(Math.random()<.5)emit(rnd(-1,1),rnd(.2,2.2),-HZ-.2,room.theme.torch,1,.6,1,{up:.8})}}
  if(hubG.visible&&hubChar){hubChar.mixer.update(dt);if(!$('tabLook').hidden&&!$('hub').hidden)hubChar.root.rotation.y+=dt*.7;const f=Math.sin(G.time*11)*.5+Math.sin(G.time*7.3)*.5;hubFire.a.scale.setScalar(2.5+f*.25);hubFire.b.scale.setScalar(1+f*.12);TORCH[0].intensity=2.1+f*.35;
    if(Math.random()<.6)emit(rnd(-.25,.25),.5,rnd(-.25,.25),Math.random()<.5?'#7dff8a':'#d8ffd0',1,.6,1.1,{up:1.6,drag:.98})}}
