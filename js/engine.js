/* 被遺忘者之路 Path of the Forgotten · 引擎
 * Three.js r128（lib/ 內附，不依賴 CDN）
 * js/ 檔案依序載入，共用同一個全域範圍：
 *   engine.js 渲染、模型、特效、鏡頭 → world.js 場景 → combat.js 戰鬥與技能
 *   → run.js 副本流程 → meta.js 存檔與局外系統 → main.js 輸入、主迴圈、啟動 */
'use strict';
const T=THREE,D=window.POF_DATA,TAU=Math.PI*2,$=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,rnd=(a,b)=>a+Math.random()*(b-a),ri=(a,b)=>Math.floor(rnd(a,b+1)),pick=a=>a[Math.floor(Math.random()*a.length)];
function seeded(s){s=s>>>0||1;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296}}
function angLerp(a,b,t){let d=((b-a+Math.PI)%TAU+TAU)%TAU-Math.PI;return a+d*t}
function wpick(list,R){R=R||Math.random;let t=0;for(const x of list)t+=x[1];let r=R()*t;for(const x of list){r-=x[1];if(r<=0)return x[0]}return list[list.length-1][0]}
function h(tag,props,...kids){const e=document.createElement(tag);if(props)for(const k in props){const v=props[k];if(v==null||v===false)continue;
  if(k==='on')for(const ev in v)e.addEventListener(ev,v[ev]);else if(k==='cls')e.className=v;else if(k==='style')e.style.cssText=v;else if(k==='html')e.innerHTML=v;else if(k in e)e[k]=v;else e.setAttribute(k,v)}
  for(const c of kids.flat()){if(c==null||c===false)continue;e.append(c.nodeType?c:String(c))}return e}
const fmt=n=>n>=100000?Math.round(n/1000)+'k':n>=10000?(n/1000).toFixed(1)+'k':String(Math.round(n));

/* ================= 圖示 ================= */
const IC={
  multi:'M5 6l5 6-5 6M11 6l5 6-5 6M17 6l3 6-3 6',front:'M8 20V5M5 8l3-3 3 3M16 20V5M13 8l3-3 3 3',diag:'M12 20V5M9 8l3-3 3 3M12 14L5 6M5 10V6h4M12 14l7-8M15 6h4v4',
  back:'M12 4v15M8 15l4 4 4-4M7 7h10',pierce:'M3 12h16M15 8l4 4-4 4M10 7a5 5 0 010 10',bounce:'M3 18l5-10 5 8 5-10M15 6h3v3',side:'M3 12h7M6 9l-3 3 3 3M21 12h-7M18 9l3 3-3 3M12 6v12',
  wall:'M20 4v16M4 15l8-8M12 7v5M12 7H7M4 9l8 8',atk:'M14 4l6 0 0 6-9 9-4 1 1-4zM5 19l-2 2M7 14l3 3',spd:'M13 2L5 14h6l-1 8 8-12h-6z',big:'M12 12m-7 0a7 7 0 1014 0a7 7 0 10-14 0M12 12m-3 0a3 3 0 106 0a3 3 0 10-6 0',
  crit:'M12 3v4M12 17v4M3 12h4M17 12h4M12 12m-5 0a5 5 0 1010 0a5 5 0 10-10 0M12 12h.01',frost:'M12 2v20M4 7l16 10M20 7L4 17M9 3l3 3 3-3M9 21l3-3 3 3',
  fire:'M12 21c4 0 7-3 7-7 0-5-5-6-4-11-3 2-5 5-5 8-1-1-2-2-2-4-2 2-3 4-3 7 0 4 3 7 7 7zM12 21c-2 0-3-2-3-3 0-2 2-3 3-5 1 2 3 3 3 5 0 1-1 3-3 3z',
  chain:'M13 2L6 13h5l-2 9 9-12h-5l2-8z',plague:'M7 15a4 4 0 010-8 5 5 0 019.5-1A4 4 0 0117 15zM8 19h.01M12 20h.01M16 19h.01',elem:'M12 3l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6L3 10l6-1z',
  nova:'M12 12m-3 0a3 3 0 106 0a3 3 0 10-6 0M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',
  orbit:'M12 12m-3 0a3 3 0 106 0a3 3 0 10-6 0M12 3a9 9 0 019 9M12 21a9 9 0 01-9-9M19 5h.01M5 19h.01',hp:'M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z',
  minion:'M12 3a5 5 0 00-5 5c0 2 1 3 2 4v2h6v-2c1-1 2-2 2-4a5 5 0 00-5-5zM10 8h.01M14 8h.01M9 17h6M10 20h4',corpse:'M12 3l2 5 5-2-2 5 5 2-5 2 2 5-5-2-2 5-2-5-5 2 2-5-5-2 5-2-2-5 5 2z',
  command:'M5 21V4l7 3 7-3v11l-7 3-7-3',raise:'M12 21V9M8 13l4-4 4 4M6 4h12',thorns:'M12 3l2 6h6l-5 4 2 7-5-4-5 4 2-7-5-4h6z',regen:'M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10zM12 9v6M9 12h6',
  bshield:'M12 3l7 3v6c0 4-3 7.5-7 9-4-1.5-7-5-7-9V6zM9 12l2 2 4-4',move:'M13 4l7 8-7 8M4 12h15M7 8l-3 4 3 4',mcast:'M4 18l6-6-6-6M12 18h8M14 8l3-3 3 3M17 5v8',
  dodge:'M12 3a9 9 0 100 18M12 3a9 9 0 010 18M12 7v.01M12 12v.01M12 17v.01',trail:'M4 19c4 0 4-6 8-6s4 6 8 6M6 8h.01M12 6h.01M18 8h.01',ambush:'M12 12m-8 0a8 8 0 1016 0a8 8 0 10-16 0M12 12m-3 0a3 3 0 106 0a3 3 0 10-6 0M12 2v4M12 18v4M2 12h4M18 12h4',
  rain:'M8 4l-2 5M13 4l-2 5M18 4l-2 5M6 13l-2 5M11 13l-2 5M16 13l-2 5',burst:'M12 12m-2 0a2 2 0 104 0a2 2 0 10-4 0M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3.5 3.5M15.5 15.5L19 19M5 19l3.5-3.5M15.5 8.5L19 5',
  armor:'M12 3l7 3v6c0 4-3 7.5-7 9-4-1.5-7-5-7-9V6z',leech:'M12 3s6 7 6 11a6 6 0 01-12 0c0-4 6-11 6-11zM9 15a3 3 0 003 3',heal:'M12 5v14M5 12h14',
  weapon:'M17 3l4 4-3 1-9 9-2-2 9-9zM7 15l-4 4 2 2 4-4M14 4l6 6',armorG:'M8 3l4 2 4-2 3 3-2 4v10H7V10L5 6zM9 13h6',ring:'M12 15m-6 0a6 6 0 1012 0a6 6 0 10-12 0M9 4h6l-3 5z',
  head:'M4 16l8-13 8 13zM3 16h18v3H3z',neck:'M5 4c0 6 3 9 7 9s7-3 7-9M12 13v3M12 16l-3 3 3 3 3-3z',
  gold:'M12 12m-8 0a8 8 0 1016 0a8 8 0 10-16 0M12 8v8M9 10h6M9 14h6',shard:'M12 2l6 8-6 12-6-12z',crystal:'M12 2l5 5-5 15-5-15zM7 7h10',dust:'M6 12h.01M10 8h.01M14 14h.01M17 9h.01M9 17h.01M12 11h.01M16 18h.01',
  xp:'M12 3l2.5 6H21l-5 4 2 7-6-4-6 4 2-7-5-4h6.5z',rune:'M12 2l8 5v10l-8 5-8-5V7zM12 7v10M9 9l6 6M15 9l-6 6',box:'M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8',
  quest:'M9 4h6M8 4h8v17H8zM10 9h4M10 13h4M10 17h2',lock:'M6 11h12v10H6zM8 11V7a4 4 0 018 0v4',sweep:'M4 20l9-9M13 11l3-8 5 5-8 3M6 14l4 4',play:'M7 4l13 8-13 8z',
  merge:'M6 4v6a6 6 0 006 6h0a6 6 0 006-6V4M12 16v5M9 21h6',skull:'M12 3a7 7 0 00-7 7c0 2.6 1.3 4.4 3 5.5V18h8v-3.5c1.7-1.1 3-2.9 3-5.5a7 7 0 00-7-7zM9 10h.01M15 10h.01M10 21h4'};
function svg(name,cls){const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 24 24');if(cls)s.setAttribute('class',cls);
  const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',IC[name]||IC.xp);p.setAttribute('fill','none');p.setAttribute('stroke','currentColor');
  p.setAttribute('stroke-width','2');p.setAttribute('stroke-linecap','round');p.setAttribute('stroke-linejoin','round');s.append(p);return s}

/* ================= 渲染 ================= */
const cvs=$('gl');
const renderer=new T.WebGLRenderer({canvas:cvs,antialias:true,powerPreference:'high-performance'});
const scene=new T.Scene();
const camera=new T.PerspectiveCamera(30,1,.5,220);
const QUAL={low:{pr:1,sh:0},mid:{pr:1.5,sh:1024},high:{pr:2,sh:2048}};
const isTouch=matchMedia('(pointer:coarse)').matches;
const hemi=new T.HemisphereLight('#888','#222',.7);scene.add(hemi);
const sun=new T.DirectionalLight('#fff',.55);sun.position.set(-7,18,9);scene.add(sun,sun.target);
(function(){const c=sun.shadow.camera;c.left=-11;c.right=11;c.top=15;c.bottom=-15;c.near=2;c.far=50;sun.shadow.bias=-.0008;sun.shadow.normalBias=.03})();
renderer.shadowMap.type=T.PCFSoftShadowMap;
const TORCH=[0,1,2,3].map(()=>{const l=new T.PointLight('#fff',1.6,10,2);scene.add(l);return l});
const pLight=new T.PointLight('#9dff6a',.9,7,2);scene.add(pLight);
const fxLight=new T.PointLight('#ffb35a',0,9,2);scene.add(fxLight);let fxLightT=0;
let VW=1,VH=1,camDist=40,camPitch=.9,shake=0,camFitW=0,camFitH=0;

/* ================= 貼圖 ================= */
function canvasTex(w,hh,fn){const c=document.createElement('canvas');c.width=w;c.height=hh;fn(c.getContext('2d'),w,hh);const t=new T.CanvasTexture(c);return t}
const GLOW=canvasTex(64,64,(x)=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.75)');g.addColorStop(.6,'rgba(255,255,255,.18)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64)});
const SOFT=canvasTex(64,64,(x)=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.5,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64)});
const BLOB=canvasTex(64,64,(x)=>{const g=x.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'rgba(0,0,0,.6)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64)});
const RUNE=canvasTex(256,256,(x)=>{x.translate(128,128);x.strokeStyle='#fff';x.lineWidth=3;x.globalAlpha=.9;
  x.beginPath();x.arc(0,0,118,0,TAU);x.stroke();x.lineWidth=1.5;x.beginPath();x.arc(0,0,100,0,TAU);x.stroke();
  x.beginPath();for(let i=0;i<5;i++){const a=i*TAU*2/5-Math.PI/2;x[i?'lineTo':'moveTo'](Math.cos(a)*100,Math.sin(a)*100)}x.closePath();x.stroke();
  x.font='bold 16px serif';x.textAlign='center';x.textBaseline='middle';const g='ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊ';for(let i=0;i<16;i++){x.save();x.rotate(i/16*TAU);x.fillStyle='#fff';x.fillText(g[i],0,-109);x.restore()}});
const shadowGeo=new T.PlaneGeometry(1,1).rotateX(-Math.PI/2),shadowMat=new T.MeshBasicMaterial({map:BLOB,transparent:true,depthWrite:false});

/* ================= 共用幾何、材質 ================= */
const GEO={box:new T.BoxGeometry(1,1,1),cyl:new T.CylinderGeometry(.5,.5,1,12),cyl6:new T.CylinderGeometry(.5,.5,1,6),sph:new T.SphereGeometry(.5,10,8),
  cone:new T.ConeGeometry(.5,1,8),rock:new T.DodecahedronGeometry(.5,0),oct:new T.OctahedronGeometry(.5,0),coin:new T.CylinderGeometry(.16,.16,.05,10),
  plane:new T.PlaneGeometry(1,1),ring:new T.RingGeometry(.86,1,48).rotateX(-Math.PI/2),disc:new T.CircleGeometry(1,40).rotateX(-Math.PI/2),
  lineFill:new T.PlaneGeometry(1,1).rotateX(-Math.PI/2).translate(0,0,-.5),spike:new T.ConeGeometry(.12,.7,5).rotateX(Math.PI/2)};
const MC={};
const M=(c,o)=>{const k='l'+c+(o?JSON.stringify(o):'');return MC[k]||(MC[k]=new T.MeshLambertMaterial(Object.assign({color:c},o||{})))};
const MB=(c)=>MC['b'+c]||(MC['b'+c]=new T.MeshBasicMaterial({color:c}));
function mesh(g,m,x,y,z,sx,sy,sz,p){const o=new T.Mesh(g,m);o.position.set(x||0,y||0,z||0);if(sx!=null)o.scale.set(sx,sy==null?sx:sy,sz==null?sx:sz);
  if(!m.isMeshBasicMaterial){o.castShadow=true;o.receiveShadow=true}(p||scene).add(o);return o}

/* ================= 模型 =================
 * ASSETS 的鍵就是 assets/ 底下的路徑（不含 .glb），例如 'sk_mage'、'monsters/ghost'、'dungeon/wall'、'halloween/coffin'
 * 核心素材開機時載入；章節專用素材在出征時才載入（ensureAssets） */
const CORE_ASSETS=['sk_mage','sk_warrior','sk_minion','sk_rogue','knight','hmage','w_staff','w_axe','w_shield','w_blade','w_crossbow','w_shield_l'];
const ACC={knight:['1H_Sword_Offhand','Badge_Shield','Rectangle_Shield','Round_Shield','Spike_Shield','1H_Sword','2H_Sword'],hmage:['Spellbook','Spellbook_open','1H_Wand','2H_Staff'],
  barb:['1H_Axe_Offhand','Barbarian_Round_Shield','1H_Axe','2H_Axe','Mug','Barbarian_Hat','Barbarian_Cape'],rogue:['Knife_Offhand','1H_Crossbow','2H_Crossbow','Knife','Throwable','Rogue_Cape'],
  rogueh:['Knife_Offhand','1H_Crossbow','2H_Crossbow','Knife','Throwable','Rogue_Cape']};
const ONCE={Death_A:1,Spellcast_Shoot:1,Spellcast_Raise:1,'1H_Melee_Attack_Chop':1,'2H_Melee_Attack_Chop':1,Cheer:1,Skeletons_Awaken_Floor:1,Hit_A:1};
// 非 KayKit 骨架的模型（Quaternius 怪物）用自己的動畫，這裡把動作名稱對應過去
const ANIM_ALIAS={Idle:['Idle','Flying_Idle'],Idle_Combat:['Idle','Flying_Idle'],Running_A:['Run','Fast_Flying','Walk'],Walking_A:['Walk','Flying_Idle','Run'],
  '1H_Melee_Attack_Chop':['Punch','Bite_Front','Headbutt','Weapon'],'2H_Melee_Attack_Chop':['Weapon','Headbutt','Punch','Bite_Front'],Spellcast_Shoot:['Punch','Headbutt','Bite_Front'],
  Spellcast_Raise:['Yes','Weapon','Punch','Bite_Front'],Death_A:['Death'],Hit_A:['HitReact','HitRecieve'],Cheer:['Yes'],Skeletons_Awaken_Floor:[]};
const ASSETS={},CLIPS={},LOADING={};
const assetKey=n=>n.includes('/')?n:'dungeon/'+n;
function prepAsset(g){g.scene.traverse(n=>{if(!n.isMesh)return;const om=n.material,sk=!!n.isSkinnedMesh;let nm;
  if(!om.map)nm=new T.MeshBasicMaterial({color:om.color,skinning:sk,vertexColors:!!(n.geometry.attributes.color)});
  else{om.map.encoding=T.LinearEncoding;om.map.needsUpdate=true;nm=new T.MeshLambertMaterial({map:om.map,skinning:sk,transparent:om.transparent,alphaTest:om.alphaTest||(om.transparent?.4:0),side:om.side})}
  nm.name=om.name;n.material=nm;n.castShadow=true;n.receiveShadow=!sk;n.frustumCulled=sk?false:true})}
function fetchModel(path){return fetch(path+'.glb').then(r=>{if(!r.ok)throw new Error(path+' '+r.status);return r.arrayBuffer()}).catch(()=>fetch(path+'.b64.txt').then(r=>{if(!r.ok)throw new Error(path+' '+r.status);return r.text()}).then(t=>{const bin=atob(t.trim()),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u.buffer}))}
const GL_LOADER=new T.GLTFLoader();
function loadOne(k,must){if(ASSETS[k])return Promise.resolve();if(LOADING[k])return LOADING[k];
  return LOADING[k]=fetchModel('assets/'+k).then(buf=>new Promise((res,rej)=>GL_LOADER.parse(buf,'',res,rej))).then(g=>{prepAsset(g);ASSETS[k]=g}).catch(e=>{if(must)throw e;console.warn('素材缺少',k)})}
function ensureAssets(keys,onProg){keys=[...new Set(keys)].filter(k=>!ASSETS[k]);let done=0;if(!keys.length){onProg&&onProg(1,1);return Promise.resolve()}
  return Promise.all(keys.map(k=>loadOne(k,false).then(()=>onProg&&onProg(++done,keys.length))))}
function loadCore(onProg){const keys=CORE_ASSETS.slice();for(const k in D.THEMES){const th=D.THEMES[k];if(th.kind!=='dungeon')continue;if(['crypt','abbey','grave','vault'].includes(k))keys.push(...themeAssets(k))}
  let done=0;const all=[...new Set(keys)];
  return Promise.all(all.map(k=>loadOne(k,CORE_ASSETS.includes(k)).then(()=>onProg(++done,all.length)))).then(()=>{ASSETS.sk_mage.animations.forEach(c=>CLIPS[c.name]=c)}).then(()=>D.PIXEL?loadPixSheet():null)}
function themeAssets(key){const th=D.THEMES[key],kt=th.kit,out=[];if(!kt)return out;
  if(th.kind==='dungeon'){out.push(...['floor_tile_large','wall','wall_cracked','wall_window_closed','wall_pillar','wall_doorway','wall_half','barrier','pillar','pillar_decorated','torch_mounted','candle_lit'].map(assetKey));if(kt.banner)out.push(assetKey(kt.banner))}
  else out.push('halloween/arch_gate','halloween/fence_pillar',...(kt.rocks||[]),...(kt.big||[]),...(kt.trees||[]));
  for(const n of(kt.obstacles||[]).concat(kt.decor||[]))out.push(assetKey(n));if(kt.light)out.push(assetKey(kt.light));return out}
function findBone(o,name){return o.getObjectByName(name)||o.getObjectByName(name.replace(/\./g,''))}
function makeChar(key,o){o=o||{};const A=ASSETS[key]||ASSETS.sk_minion;const root=new T.Group(),sk=T.SkeletonUtils.clone(A.scene);root.add(sk);sk.scale.setScalar(o.scale||.7);
  const acc=ACC[key]||[],mats=[];
  if(o.look)applyLookParts(sk,o.look);
  sk.traverse(n=>{if(!n.isMesh)return;if(acc.includes(n.name)&&!(o.show||[]).includes(n.name)){n.visible=false;return}
    const m=n.material.clone();n.material=m;
    if(m.isMeshBasicMaterial){if(o.eye)m.color.set(o.eye)}else{if(o.recolor&&m.map)m.map=recolorTex(m.map,o.recolor);if(o.tint)m.color.set(o.tint);if(o.robeTex&&m.map)m.map=o.robeTex;if(o.emis){m.emissive.set(o.emis)}m.userData.em=m.emissive.clone();mats.push(m)}
    if(o.hideHat&&/Hat$/.test(n.name))n.visible=false});
  for(const side of['r','l']){const w=o['w'+side];if(w&&ASSETS[w]){const b=findBone(sk,'handslot.'+side);if(b){const m=ASSETS[w].scene.clone();m.traverse(n=>{if(n.isMesh){n.material=n.material.clone();if(!n.material.isMeshBasicMaterial){if(o.tint)n.material.color.set(o.tint);if(o.robeTex&&n.material.map)n.material.map=o.robeTex;if(side==='r'&&o.wglow)n.material.emissive.set(o.wglow);n.material.userData.em=n.material.emissive.clone();mats.push(n.material)}else if(o.eye)n.material.color.set(o.eye)}});b.add(m);
    if(side==='r'&&o.wglow){const g=glow(o.wglow,.9,m,.8);g.position.set(0,.6,0)}}}}
  const mixer=new T.AnimationMixer(sk);const c={root,sk,mixer,acts:{},cur:'',one:null,mats,hand:findBone(sk,'handslot.r'),own:null};
  if(A.animations&&A.animations.length&&key!=='sk_mage'){c.own={};for(const cl of A.animations)c.own[cl.name]=cl}
  mixer.addEventListener('finished',e=>{if(c.one&&e.action===c.acts[c.one]){c.one=null;c.cur=''}});
  play(c,'Idle',0);mixer.update(Math.random()*2);return c}
/* ---------- 塑造亡者：零件組裝、袍子染色 ---------- */
const LK=D.LOOKS,PART_RE=/_(Hat|Helmet|Hood|Cloak|Cape)$/;
function lk(kind,v){const L=LK[kind];return typeof v==='number'?L[v]||L[0]:L.find(x=>x.id===v)||L[0]}
function applyLookParts(sk,look){sk.traverse(n=>{if(n.isMesh&&PART_RE.test(n.name))n.visible=false});
  let skinParent=null;sk.traverse(n=>{if(n.isSkinnedMesh&&!skinParent)skinParent=n.parent});
  for(const kind of['head','back']){const it=lk(kind,look[kind]);if(!it.part||!ASSETS[it.from])continue;const src=ASSETS[it.from].scene.getObjectByName(it.part);if(!src)continue;
    const m=src.clone();m.visible=true;
    if(src.isSkinnedMesh){const bones=src.skeleton.bones.map(b=>sk.getObjectByName(b.name));if(bones.some(b=>!b))continue;m.bind(new T.Skeleton(bones,src.skeleton.boneInverses.map(x=>x.clone())),src.bindMatrix.clone());(skinParent||sk).add(m)}
    else{const pb=src.parent&&sk.getObjectByName(src.parent.name);if(!pb)continue;pb.add(m)}}}
const ROBE_TEX={};
function robeTex(i){const r=LK.robe[i];if(!r||r.h==null)return null;if(ROBE_TEX[i])return ROBE_TEX[i];
  let base=null;ASSETS.sk_mage.scene.traverse(n=>{if(!base&&n.isMesh&&n.material.map)base=n.material.map});if(!base||!base.image)return null;
  const img=base.image,W=img.width,H=img.height,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');x.drawImage(img,0,0);
  const x0=W*2/8,y0=H*2/4,w=W/8,hh=H/4,d=x.getImageData(x0,y0,w,hh),p=d.data,c=new T.Color(),hsl={};
  for(let i=0;i<p.length;i+=4){c.setRGB(p[i]/255,p[i+1]/255,p[i+2]/255);c.getHSL(hsl);c.setHSL(r.h,Math.min(1,hsl.s*r.s+.05*r.s),Math.min(1,hsl.l*r.l));p[i]=c.r*255;p[i+1]=c.g*255;p[i+2]=c.b*255}
  x.putImageData(d,x0,y0);const t=new T.CanvasTexture(cv);t.flipY=base.flipY;t.encoding=base.encoding;t.wrapS=base.wrapS;t.wrapT=base.wrapT;t.magFilter=base.magFilter;t.minFilter=base.minFilter;
  return ROBE_TEX[i]=t}
const RECOLOR={};
function recolorTex(base,rc){if(!base||!base.image)return base;const k=base.uuid+JSON.stringify(rc);if(RECOLOR[k])return RECOLOR[k];
  const img=base.image,W=img.width,H=img.height,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');x.drawImage(img,0,0);
  const d=x.getImageData(0,0,W,H),p=d.data,c=new T.Color(),hsl={};
  for(let i=0;i<p.length;i+=4){c.setRGB(p[i]/255,p[i+1]/255,p[i+2]/255);c.getHSL(hsl);c.setHSL(rc.h,Math.min(1,hsl.s*rc.s),Math.min(1,hsl.l*rc.l+(rc.add||0)));p[i]=c.r*255;p[i+1]=c.g*255;p[i+2]=c.b*255}
  x.putImageData(d,0,0);const t=new T.CanvasTexture(cv);t.flipY=base.flipY;t.encoding=base.encoding;t.wrapS=base.wrapS;t.wrapT=base.wrapT;t.magFilter=base.magFilter;t.minFilter=base.minFilter;return RECOLOR[k]=t}
function clipFor(c,name){if(!c.own)return CLIPS[name];if(c.own[name])return c.own[name];for(const a of(ANIM_ALIAS[name]||[]))if(c.own[a])return c.own[a];return null}
function act(c,name){if(!c.acts[name]){const clip=clipFor(c,name);if(!clip)return null;const a=c.mixer.clipAction(clip);if(ONCE[name]){a.setLoop(T.LoopOnce,1);a.clampWhenFinished=true}c.acts[name]=a}return c.acts[name]}
function play(c,name,fade,ts){if(c.one)return;if(c.pix){c.cur=name;c.ts=ts==null?1:ts;return}if(c.cur===name){if(ts!=null&&c.acts[name])c.acts[name].timeScale=ts;return}const a=act(c,name);if(!a)return;const prev=c.acts[c.cur];a.reset();a.timeScale=ts==null?1:ts;a.setEffectiveWeight(1);a.fadeIn(fade==null?.15:fade).play();if(prev&&prev!==a)prev.fadeOut(fade==null?.15:fade);c.cur=name}
function once(c,name,ts){if(c.pix){c.one=name;c.cur=name;c.ot=0;c.oneT=(PIX_ONE[name]||.4)/(ts||1)*(name==='Death_A'?1:1.6);return}const a=act(c,name);if(!a)return;const prev=c.acts[c.cur];if(c.one&&c.acts[c.one]&&c.acts[c.one]!==a)c.acts[c.one].fadeOut(.08);c.one=null;a.reset();a.timeScale=ts||1;a.setEffectiveWeight(1);a.fadeIn(.08).play();if(prev&&prev!==a)prev.fadeOut(.08);c.cur=name;c.one=name}
function flash(c,col,k){if(c.pix){if(k>0)c.mat.color.setRGB(1,col[1]>.5?.55:.3,col[2]>.5?.55:.3);else c.mat.color.setRGB(1,1,1);return}
  for(const m of c.mats){if(k>0)m.emissive.setRGB(col[0]*k,col[1]*k,col[2]*k);else if(m.userData.em)m.emissive.copy(m.userData.em);else m.emissive.setRGB(0,0,0)}}
function disposeChar(c){if(c.root.parent)c.root.parent.remove(c.root);if(c.pix){c.tex.dispose();c.mat.dispose();return}c.mixer.stopAllAction();for(const m of c.mats)m.dispose()}
/* ---------- 像素角色（永遠面向鏡頭的 2D 圖，RO 做法） ---------- */
const PIX={base:null,W:1,H:1};
function loadPixSheet(){return new Promise(res=>{const img=new Image();img.onload=()=>{const t=new T.Texture(img);t.magFilter=T.NearestFilter;t.minFilter=T.NearestFilter;t.generateMipmaps=false;t.needsUpdate=true;PIX.base=t;PIX.W=img.width;PIX.H=img.height;res()};img.onerror=()=>{console.warn('像素素材載入失敗');res()};img.src=D.PIXEL.sheet})}
const PIX_ONE={Death_A:99,Skeletons_Awaken_Floor:1.1,Hit_A:.22,Spellcast_Shoot:.22,Spellcast_Raise:.6,Cheer:1.4,'1H_Melee_Attack_Chop':.4,'2H_Melee_Attack_Chop':.55};
function pixId(id){const ch=D.PIXEL.chars;return ch[id]?id:(D.PIXEL.alias||{})[id]}
function makePix(id,o){const d=D.PIXEL.chars[id],[x,y,w,h]=d.f,sc=(d.scale||1)*(o&&o.pixScale||1),px=D.PIXEL.px;
  const tex=PIX.base.clone();tex.needsUpdate=true;const mat=new T.SpriteMaterial({map:tex,transparent:true,alphaTest:.5});const spr=new T.Sprite(mat);spr.center.set(.5,0);
  const sw=w*px*sc,sh=h*px*sc;spr.scale.set(sw,sh,1);const root=new T.Group();root.add(spr);const hand=new T.Object3D();hand.position.set(0,sh*.55,.25);root.add(hand);
  if(o&&o.pixTint)mat.color.set(o.pixTint);
  const c={pix:true,root,spr,mat,tex,d,x,y,w,h,sw,sh,cur:'Idle',one:null,oneT:0,ot:0,ft:Math.random()*4,ts:1,face:1,mats:[],hand,acts:{}};
  c.mixer={update:dt=>pixUpdate(c,dt),stopAllAction(){}};pixFrame(c,0,false);return c}
function pixFrame(c,f,run){const{W,H}=PIX;const fx=c.x+((run&&c.d.run!==false?4:0)+f)*c.w;c.tex.repeat.set(c.face*c.w/W,c.h/H);c.tex.offset.set((c.face>0?fx:fx+c.w)/W,1-(c.y+c.h)/H)}
function pixUpdate(c,dt){const sy=Math.sin(c.root.rotation.y);if(Math.abs(sy)>.2)c.face=sy>0?1:-1;
  if(c.one){c.ot+=dt;c.oneT-=dt;if(c.oneT<=0&&c.one!=='Death_A'){c.one=null;c.cur=''}}
  const run=/Running|Walking/.test(c.cur);c.ft+=dt*(run?10:5)*(c.ts||1);pixFrame(c,Math.floor(c.ft)%4,run);
  let sx=1,syy=1,rot=0,op=1;const t=c.ot;
  if(c.one==='Death_A'){rot=-c.face*Math.min(1,t*4)*Math.PI/2;op=t>.9?Math.max(0,1-(t-.9)*1.5):1}
  else if(c.one==='Skeletons_Awaken_Floor'){syy=Math.min(1,t/1)}
  else if(c.one&&/Spellcast|Melee/.test(c.one)){const k=Math.sin(Math.min(1,t/(PIX_ONE[c.one]||.3))*Math.PI);sx=1+k*.12;syy=1-k*.08}
  else if(c.one==='Hit_A'){sx=1.1;syy=.9}
  else if(c.one==='Cheer'){syy=1+Math.abs(Math.sin(t*9))*.12}
  else if(run){syy=1+Math.abs(Math.sin(c.ft*Math.PI))*.05}
  c.spr.scale.set(c.sw*sx,c.sh*syy,1);c.mat.rotation=rot;c.mat.opacity=op}
function makeActor(model,o,pid){const id=pid&&pixId(pid);if(SAVE&&SAVE.style==='pixel'&&PIX.base&&D.PIXEL&&id)return makePix(id,o);return makeChar(model,o)}

/* ================= 粒子 ================= */
const PMAX=2000,pPos=new Float32Array(PMAX*3),pCol=new Float32Array(PMAX*3),PS=[];let pIdx=0;
for(let i=0;i<PMAX;i++){PS.push({l:0});pPos[i*3+1]=-999}
const pGeo=new T.BufferGeometry();pGeo.setAttribute('position',new T.BufferAttribute(pPos,3));pGeo.setAttribute('color',new T.BufferAttribute(pCol,3));
const pts=new T.Points(pGeo,new T.PointsMaterial({size:.32,map:SOFT,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));pts.frustumCulled=false;scene.add(pts);
const tmpC=new T.Color();
function emit(x,y,z,col,n,spd,life,o){o=o||{};tmpC.set(col);for(let i=0;i<n;i++){const p=PS[pIdx];pIdx=(pIdx+1)%PMAX;const a=Math.random()*TAU,u=o.flat?rnd(-.15,.15):Math.random()*2-1,s=Math.sqrt(1-u*u),v=spd*(.35+Math.random()*.65);
  p.x=x+(o.sp?rnd(-o.sp,o.sp):0);p.y=y;p.z=z+(o.sp?rnd(-o.sp,o.sp):0);p.vx=Math.cos(a)*s*v;p.vy=u*v+(o.up||0);p.vz=Math.sin(a)*s*v;p.l=p.m=life*(.6+Math.random()*.4);p.gr=o.gr==null?0:o.gr;p.r=tmpC.r;p.g=tmpC.g;p.b=tmpC.b;p.dr=o.drag||.94}}
function updParts(dt){for(let i=0;i<PMAX;i++){const p=PS[i];if(p.l<=0)continue;const j=i*3;p.l-=dt;p.vy-=p.gr*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vx*=p.dr;p.vz*=p.dr;
  const k=Math.max(0,p.l/p.m);pPos[j]=p.x;pPos[j+1]=p.y;pPos[j+2]=p.z;pCol[j]=p.r*k;pCol[j+1]=p.g*k;pCol[j+2]=p.b*k;if(p.l<=0)pPos[j+1]=-999}
  pGeo.attributes.position.needsUpdate=true;pGeo.attributes.color.needsUpdate=true}
// 環境浮塵
const MOTE=60,mPos=new Float32Array(MOTE*3),motes=[];for(let i=0;i<MOTE;i++)motes.push({x:0,y:0,z:0,p:Math.random()*TAU});
const mGeo=new T.BufferGeometry();mGeo.setAttribute('position',new T.BufferAttribute(mPos,3));
const moteMat=new T.PointsMaterial({size:.12,map:SOFT,color:'#9dff6a',transparent:true,opacity:.7,depthWrite:false,blending:T.AdditiveBlending});
const motePts=new T.Points(mGeo,moteMat);motePts.frustumCulled=false;scene.add(motePts);
let moteFall=false;
function seedMotes(cx,cz,rx,rz,fall){moteFall=!!fall;moteMat.size=fall?.16:.12;for(const m of motes){m.x=cx+rnd(-rx,rx);m.y=rnd(.3,4);m.z=cz+rnd(-rz,rz);m.cx=cx;m.cz=cz;m.rx=rx;m.rz=rz}}
function updMotes(dt,t){motes.forEach((m,i)=>{m.p+=dt*.8;m.y+=dt*(moteFall?-.7:.18);if(m.y>4||m.y<0){m.y=moteFall?4:.2;m.x=m.cx+rnd(-m.rx,m.rx);m.z=m.cz+rnd(-m.rz,m.rz)}mPos[i*3]=m.x+Math.sin(m.p)*.4;mPos[i*3+1]=m.y;mPos[i*3+2]=m.z+Math.cos(m.p*.7)*.4});mGeo.attributes.position.needsUpdate=true}

/* ================= 發光精靈、地面預警、閃電 ================= */
const SPR_MAT={};
function glowMat(col,op){const k=col+'|'+(op||1);return SPR_MAT[k]||(SPR_MAT[k]=new T.SpriteMaterial({map:GLOW,color:col,transparent:true,opacity:op||1,depthWrite:false,blending:T.AdditiveBlending}))}
function glow(col,size,p,op){const s=new T.Sprite(glowMat(col,op));s.scale.set(size,size,1);(p||scene).add(s);return s}
const tels=[];
function tele(kind,x,z,o,dur,fn){const col=o.col||'#ff3a2a',y=.06;const g=new T.Group();g.position.set(x,y,z);scene.add(g);
  const em=new T.MeshBasicMaterial({color:col,transparent:true,opacity:.85,depthWrite:false,side:T.DoubleSide}),fm=new T.MeshBasicMaterial({color:col,transparent:true,opacity:.3,depthWrite:false,side:T.DoubleSide});
  let edge,fill;
  if(kind==='circle'){edge=new T.Mesh(GEO.ring,em);edge.scale.setScalar(o.r);fill=new T.Mesh(GEO.disc,fm);fill.scale.setScalar(.01)}
  else{g.rotation.y=o.a;edge=new T.Mesh(GEO.lineFill,em);edge.scale.set(o.w,1,o.len);em.opacity=.22;fill=new T.Mesh(GEO.lineFill,fm);fill.scale.set(o.w,1,.01);fm.opacity=.45}
  g.add(edge,fill);tels.push({kind,g,edge,fill,em,fm,o,dur,t:0,fn});return tels[tels.length-1]}
function updTels(dt){for(let i=tels.length-1;i>=0;i--){const t=tels[i];t.t+=dt;const k=Math.min(1,t.t/t.dur);
  if(t.kind==='circle')t.fill.scale.setScalar(Math.max(.01,t.o.r*k));else t.fill.scale.set(t.o.w,1,Math.max(.01,t.o.len*k));
  t.em.opacity=(t.kind==='circle'?.6:.18)+Math.sin(t.t*30)*.12;
  if(t.t>=t.dur){scene.remove(t.g);t.em.dispose();t.fm.dispose();tels.splice(i,1);t.fn&&t.fn()}}}
function clearTels(){for(const t of tels){scene.remove(t.g);t.em.dispose();t.fm.dispose()}tels.length=0}
// 擴散環
const rings=[];
function ringFx(x,z,r,col,dur,y){const m=new T.Mesh(GEO.ring,new T.MeshBasicMaterial({color:col,transparent:true,opacity:.9,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide}));m.position.set(x,(y||.08),z);scene.add(m);rings.push({m,r,t:0,dur})}
function updRings(dt){for(let i=rings.length-1;i>=0;i--){const r=rings[i];r.t+=dt;const k=r.t/r.dur;r.m.scale.setScalar(.2+r.r*Math.sqrt(k));r.m.material.opacity=.9*(1-k);if(k>=1){scene.remove(r.m);r.m.material.dispose();rings.splice(i,1)}}}
function lightFlash(x,z,col,k){fxLight.position.set(x,1.5,z);fxLight.color.set(col);fxLight.intensity=k||2.5;fxLightT=.25}
// 閃電（鋸齒線段）
const zaps=[];
function zap(x1,y1,z1,x2,y2,z2,col){const n=7,pts=[];for(let i=0;i<=n;i++){const t=i/n,j=i===0||i===n?0:.35;pts.push(new T.Vector3(lerp(x1,x2,t)+rnd(-j,j),lerp(y1,y2,t)+rnd(-j,j)*.6,lerp(z1,z2,t)+rnd(-j,j)))}
  const g=new T.BufferGeometry().setFromPoints(pts),m=new T.LineBasicMaterial({color:col||'#bfe8ff',transparent:true,opacity:1,blending:T.AdditiveBlending,depthWrite:false});const l=new T.Line(g,m);scene.add(l);zaps.push({l,t:0});
  const gl=glow(col||'#bfe8ff',1.4);gl.position.set(x2,y2,z2);zaps.push({l:gl,t:0,spr:1})}
function updZaps(dt){for(let i=zaps.length-1;i>=0;i--){const z=zaps[i];z.t+=dt;const k=1-z.t/.2;if(k<=0){scene.remove(z.l);if(!z.spr){z.l.geometry.dispose();z.l.material.dispose()}zaps.splice(i,1);continue}if(!z.spr)z.l.material.opacity=k;else z.l.scale.setScalar(1.4*k)}}
// 地面效果（毒雲、幽影、冰霜）
const puddles=[];
function puddle(x,z,r,col,dur,o){const g=glow(col,r*2.2,null,.55);g.position.set(x,.25,z);const p=Object.assign({g,x,z,r,col,dur,t:0,tick:0},o||{});puddles.push(p);return p}
function clearPuddles(){for(const p of puddles)scene.remove(p.g);puddles.length=0;for(const z of zaps)scene.remove(z.l);zaps.length=0}

/* ================= 浮動文字、橫幅、提示 ================= */
const floatBox=$('floats'),floats=[],V3=new T.Vector3();
function proj(x,y,z){V3.set(x,y,z).project(camera);if(V3.z>1)return null;return[(V3.x+1)/2*VW,(1-V3.y)/2*VH]}
function floatTxt(x,y,z,txt,col,cls){let f=floats.find(f=>!f.on);if(!f){if(floats.length>56)return;f={el:h('div',{cls:'ft'})};floatBox.append(f.el);floats.push(f)}
  f.on=true;f.t=0;f.x=x+rnd(-.25,.25);f.y=y;f.z=z;f.el.textContent=txt;f.el.className='ft'+(cls?' '+cls:'');f.el.style.color=col||'#fff';f.el.style.display=''}
function updFloats(dt){for(const f of floats){if(!f.on)continue;f.t+=dt;if(f.t>.9){f.on=false;f.el.style.display='none';continue}const p=proj(f.x,f.y+f.t*1.2,f.z);if(!p){f.el.style.display='none';continue}
  const s=f.t<.1?1.35-f.t*3.5:1;f.el.style.opacity=f.t>.6?String((.9-f.t)/.3):'1';f.el.style.transform=`translate(${p[0]|0}px,${p[1]|0}px) translate(-50%,-50%) scale(${s})`}}
function clearFloats(){for(const f of floats){f.on=false;f.el.style.display='none'}}
let banT=0;function banner(t,s,col){$('bnT').textContent=t;$('bnS').textContent=s||'';$('banner').style.setProperty('--bc',col||'#8fe36a');$('banner').classList.add('on');banT=2.2}
let toastT=0;function toast(t){const e=$('toast');e.textContent=t;e.classList.add('on');toastT=2.2}
function fadeTo(on){$('fade').classList.toggle('on',on);return new Promise(r=>setTimeout(r,360))}

/* ================= 鏡頭（RO 式斜視角，自動框住整個房間） ================= */
const camT=new T.Vector3();
const CAM={pitch:.6,pitchPort:.62,fov:28,pad:.2,min:14,lead:-2.2,landCap:1.35};
function camPlace(tz,dist){camera.position.set(0,Math.sin(camPitch)*dist,tz+Math.cos(camPitch)*dist);camera.lookAt(0,0,tz);camera.updateMatrixWorld()}
function ndc(x,y,z){V3.set(x,y,z).project(camera);return V3}
let camC=0,camMin=0,camMax=0;
function camFit(){camera.clearViewOffset();camera.aspect=VW/VH;camera.fov=CAM.fov;camPitch=VW<VH?CAM.pitchPort:CAM.pitch;camera.updateProjectionMatrix();
  const top=1-2*((VW<VH?178:104)/VH),bot=-1+2*(18/VH),band=top-bot;
  const yT=()=>ndc(0,3.2,-HZ-.6).y,yB=()=>ndc(0,0,HZ+.8).y;
  const center=(dist)=>{let lo=-HZ-6,hi=HZ+6;for(let i=0;i<30;i++){const m=(lo+hi)/2;camPlace(m,dist);const c=(yT()+yB())/2;if(c>(top+bot)/2)hi=m;else lo=m}return(lo+hi)/2};
  const widthOk=(dist,tz)=>{camPlace(tz,dist);for(const z of[-HZ,0,HZ]){const v=ndc(HX+CAM.pad,0,z);if(Math.abs(v.x)>1)return false}return true};
  let lo=8,hi=120;for(let i=0;i<30;i++){const m=(lo+hi)/2;if(widthOk(m,0))hi=m;else lo=m}let dist=Math.max(hi,CAM.min);
  let tz=center(dist);camPlace(tz,dist);let fits=yT()-yB()<=band;
  if(!fits){const cap=dist*CAM.landCap;let d2=dist;for(;d2<=cap;d2+=.5){tz=center(d2);camPlace(tz,d2);if(yT()-yB()<=band)break}dist=Math.min(d2,cap);tz=center(dist);camPlace(tz,dist);fits=yT()-yB()<=band}
  camDist=dist;camC=tz;
  if(fits){camMin=camMax=tz}else{let l=-HZ-8,r=tz;for(let i=0;i<30;i++){const m=(l+r)/2;camPlace(m,dist);if(yT()>top)r=m;else l=m}camMin=r;l=tz;r=HZ+8;for(let i=0;i<30;i++){const m=(l+r)/2;camPlace(m,dist);if(yB()<bot)l=m;else r=m}camMax=l;if(camMin>camMax)camMin=camMax=tz}
  if(scene.fog&&G.mode==='run'){scene.fog.near=camDist*.8;scene.fog.far=camDist*2.2}}
function camSnap(){camFitW=0;updCam(1)}
function updCam(k){if(G.mode==='run'){if(camFitW!==VW||camFitH!==VH){camFitW=VW;camFitH=VH;camFit()}const tz=camMin===camMax?camC:clamp(P.z+CAM.lead,camMin,camMax);camT.x=lerp(camT.x,0,k);camT.y=0;camT.z=lerp(camT.z,tz,k);
    const sx=shake>0?rnd(-1,1)*shake*.5:0,sz=shake>0?rnd(-1,1)*shake*.5:0;camera.position.set(camT.x+sx,camT.y+Math.sin(camPitch)*camDist,camT.z+Math.cos(camPitch)*camDist+sz);camera.lookAt(camT.x+sx,camT.y,camT.z+sz)}
  else{const port=VW<VH,t=G.time*.1,yaw=Math.sin(t)*.22+.25,dist=port?15:11;camera.fov=port?40:34;camera.aspect=VW/VH;
    camera.position.set(Math.sin(yaw)*dist,port?5.2:4,Math.cos(yaw)*dist);camera.lookAt(0,port?.6:.9,0);
    if(G.mode==='hub')camera.setViewOffset(VW,VH,port||VW<760?0:VW*.2,VH*(port?.26:VW<760?.14:.04),VW,VH);else camera.setViewOffset(VW,VH,0,VH*(port?.16:.05),VW,VH);camera.updateProjectionMatrix()}}

/* ================= 品質、尺寸 ================= */
function applyQuality(){const q=QUAL[SAVE?SAVE.q:'mid']||QUAL.mid;renderer.setPixelRatio(Math.min(devicePixelRatio||1,q.pr));renderer.shadowMap.enabled=q.sh>0;sun.castShadow=q.sh>0;
  if(q.sh){sun.shadow.mapSize.set(q.sh,q.sh);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}}
  scene.traverse(n=>{if(n.material){const ms=Array.isArray(n.material)?n.material:[n.material];ms.forEach(m=>m.needsUpdate=true)}});resize()}
function resize(){VW=innerWidth;VH=innerHeight;renderer.setSize(VW,VH,false);camera.aspect=VW/VH;camFitW=0;camera.updateProjectionMatrix()}
addEventListener('resize',resize);
