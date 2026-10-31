/* 被遺忘者之路 · 戰鬥：怪物、詞綴、玩家攻擊、局內技能效果、僕從、主動技
 * 技能效果用 perk('技能id') 查等級；數值說明在 data/skills.js */
'use strict';
let G={mode:'load',time:0,paused:false};
let RUN=null;
const P={x:0,z:0,yaw:Math.PI,c:null,atkT:0,castT:0,moving:false,inv:0,dead:false,queue:[],orbA:0,hitT:0,sh:null,moveT:0,amb:false,ambCd:0,shieldUp:false,shieldT:0,shieldFx:null,trailT:0,regAcc:0,atkN:0};
const enemies=[],bolts=[],ebolts=[],loot=[],orbs=[],allies=[],timers=[];
function later(sec,fn){timers.push({t:(RUN?RUN.time:0)+sec,fn})}
function updTimers(){for(let i=timers.length-1;i>=0;i--){if(RUN&&RUN.time>=timers[i].t){const f=timers[i].fn;timers.splice(i,1);f()}}}
function perk(id){return RUN?RUN.perks[id]||0:0}
function cursed(id){return RUN&&RUN.curses.includes(id)}
const fighting=()=>RUN&&(RUN.state==='fight'||RUN.state==='ritual');
function runStats(){const b=RUN.base,s=Object.assign({},b);
  s.atk=b.atk*(1+perk('atk')*.22)*(perk('L_lich')?1.5:1);
  s.aspd=b.aspd*(1+perk('spd')*.16)*(perk('L_lich')?1.25:1);
  s.crit=b.crit+perk('crit')*.1+(perk('L_eclipse')?.2:0);s.critM=b.critM+perk('crit')*.25;
  s.hp=Math.round(b.hp*(1+perk('hp')*.25)*(cursed('c_hp')?.85:1));
  s.def=1-(1-b.def)*Math.pow(.88,perk('armor'))*(cursed('c_def')?1.15:1);
  s.spd=b.spd*(1+perk('move')*.12)*(cursed('c_spd')?.88:1);
  s.elemM=b.elemM*(1+perk('elem')*.3);s.sumM=b.sumM*(1+perk('command')*.3)*(perk('L_army')?1.5:1);
  s.xpM=b.xpM*(1+perk('xpup')*.25);s.magnet=b.magnet*(1+perk('xpup')*.5);s.healM=b.healM*(cursed('c_heal')?.5:1);
  s.moveAtk=perk('phantom')?1:Math.min(1,((D.RULES&&D.RULES.moveAttack)||0)+perk('mcast')*.2);s.dodge=perk('dodge')*.08;s.regen=b.regen+perk('regen')*.006;
  RUN.st=s;RUN.maxHp=s.hp}

/* ================= 怪物 ================= */
function enemyScale(d,summoned){const lv=RUN.lv,i=RUN.roomN,df=RUN.diff,R=D.RULES;
  const hpM=(d.boss?1+(lv-1)*.25:(1+(lv-1)*.3)*(1+(i-1)*R.roomHp)*(summoned?.6:1))*df.hp,dmM=(1+(lv-1)*.24)*(d.boss?1:1+(i-1)*R.roomDmg)*df.dmg;return{hpM,dmM}}
function spawnEnemy(key,x,z,o){o=o||{};const d=D.ENEMIES[key];if(!d)return null;const el=!!o.elite,sc=d.scale*(el?D.ELITE.scale:1)*(o.small?.75:1);
  const c=makeActor(d.model,{scale:sc,eye:el?'#ffd04a':d.eye,tint:d.tint,recolor:d.recolor,show:d.show,wr:d.wr,wl:d.wl,emis:el?'#3a2a08':d.emis,pixScale:el?1.3:1},key);c.root.position.set(x,d.fly||0,z);scene.add(c.root);
  const{hpM,dmM}=enemyScale(d,o.summoned||o.small);const crowdHp=d.boss||el?1:1/Math.sqrt(RUN&&RUN.cm||1);const hp=Math.round(d.hp*hpM*crowdHp*(el?D.ELITE.hp:1)*(o.small?.45:1));
  const e={key,d,c,x,z,yaw:Math.atan2(P.x-x,P.z-z),r:d.r*(el?1.25:1),hp,max:hp,dmg:d.dmg*dmM*(el?D.ELITE.dmg:1),spd:d.spd*(RUN.diff.spd||1),state:'rise',t:0,slowT:0,burnT:0,burnD:0,flashT:0,kx:0,kz:0,
    cd:rnd(.8,2),touchT:0,phase:0,side:Math.random()<.5?-1:1,sideT:0,ai:{},sh:shadowFor(d.r*(el?1.3:1)),boss:!!d.boss,elite:el,dead:false,haste:1,aff:[],stunT:0,shield:0,small:!!o.small,summoned:!!o.summoned};
  for(const a of(o.aff||[]))addAffix(e,a);
  c.root.rotation.y=e.yaw;enemies.push(e);
  if(d.rise){once(c,'Skeletons_Awaken_Floor',1.4);emit(x,.2,z,'#8a8070',16,2.2,.8,{gr:4,up:2,flat:1});ringFx(x,z,1.4,d.eye||'#ff4a3a',.6)}
  else{c.root.scale.setScalar(.01);const col=glow(d.fly?'#c8b0ff':'#ffe9a0',3,null,.9);col.position.set(x,2,z);col.scale.set(1.2,5,1);e.beam=col;emit(x,.4,z,'#ffe9a0',20,2,.8,{up:2})}
  if(el){e.aura=glow('#ffd04a',e.r*3.2,null,.35);e.aura.position.set(x,.15,z);later(.6,()=>{if(!e.dead)floatTxt(e.x,2.6,e.z,'菁英'+(e.aff.length?' · '+e.aff.map(a=>D.AFFIXES[a].n).join('、'):''),'#ffd04a','big')})}
  if(d.boss||el)updBoss();
  return e}
function addAffix(e,a){if(e.aff.includes(a))return;e.aff.push(a);
  if(a==='berserk'){e.spd*=1.5;e.haste=1.5}
  if(a==='shield'){e.shield=e.max*.3;e.shFx=glow('#7df9ff',e.r*3.4,null,.45)}
  if(a==='toxic')e.toxT=1}
function rollAffixes(n){const keys=Object.keys(D.AFFIXES),out=[];while(out.length<n){const k=pick(keys);if(!out.includes(k))out.push(k)}return out}
function blocked(x,z,r){if(x<-HX+r||x>HX-r||z<-HZ+r||z>HZ-r)return true;for(const c of room.coll)if((x-c.x)*(x-c.x)+(z-c.z)*(z-c.z)<(c.r+r)*(c.r+r))return true;return false}
function moveEnt(o,dx,dz,r){if(!blocked(o.x+dx,o.z,r))o.x+=dx;else{const c=nearestColl(o.x+dx,o.z,r);if(c){const s=Math.sign((o.z-c.z)||1);if(!blocked(o.x,o.z+s*Math.abs(dx)*.7,r))o.z+=s*Math.abs(dx)*.7}}
  if(!blocked(o.x,o.z+dz,r))o.z+=dz;else{const c=nearestColl(o.x,o.z+dz,r);if(c){const s=Math.sign((o.x-c.x)||1);if(!blocked(o.x+s*Math.abs(dz)*.7,o.z,r))o.x+=s*Math.abs(dz)*.7}}}
function nearestColl(x,z,r){for(const c of room.coll)if((x-c.x)*(x-c.x)+(z-c.z)*(z-c.z)<(c.r+r)*(c.r+r))return c;return null}
function wallHit(x,z,r){if(x<-HX+r||x>HX-r||z<-HZ+r||z>HZ-r)return'w';for(const c of room.coll)if((x-c.x)*(x-c.x)+(z-c.z)*(z-c.z)<(c.r+r)*(c.r+r))return c;return null}
function shadowFor(r){const s=new T.Mesh(shadowGeo,shadowMat);s.scale.set(r*2.4,1,r*2.4);s.position.y=.02;scene.add(s);return s}
function freeSpot(minD,R){for(let i=0;i<60;i++){const x=rnd(-HX+1.2,HX-1.2),z=rnd(-HZ+1.5,HZ-7.5);if(Math.hypot(x-P.x,z-P.z)<(minD||5))continue;if(blocked(x,z,R||.6))continue;return[x,z]}return[rnd(-3,3),-5]}

/* ================= 玩家攻擊 ================= */
function nearestEnemy(){let best=null,bd=1e9;for(const e of enemies){if(e.dead||e.state==='rise'&&e.t<.6)continue;const d=Math.hypot(e.x-P.x,e.z-P.z)+(losBlocked(P.x,P.z,e.x,e.z)?6:0);if(d<bd){bd=d;best=e}}return best}
function losBlocked(x1,z1,x2,z2){for(const c of room.coll){const dx=x2-x1,dz=z2-z1,l2=dx*dx+dz*dz;const t=clamp(((c.x-x1)*dx+(c.z-z1)*dz)/(l2||1),0,1);const px=x1+dx*t-c.x,pz=z1+dz*t-c.z;if(px*px+pz*pz<c.r*c.r)return true}return false}
function attack(t,moving){const a=Math.atan2(t.x-P.x,t.z-P.z);if(!moving){P.yaw=a;once(P.c,'Spellcast_Shoot',2.2)}P.castT=.12;
  const volleys=1+perk('multi');const amb=P.amb;P.amb=false;for(let v=0;v<volleys;v++)P.queue.push({t:.11+v*.13,a,amb});P.atkT=1/RUN.st.aspd;
  P.atkN++;if(perk('L_rain')&&P.atkN%5===0)later(.15,()=>{if(RUN&&fighting())ringShot(12,1,'#c38cff')})}
function fireVolley(a,amb){const S=RUN.st,dmg=S.atk*(perk('big')?1.35:1)*(amb?2:1),dirs=[],nF=1+perk('front')+(perk('barrage')?2:0);
  for(let i=0;i<nF;i++)dirs.push([a,(i-(nF-1)/2)*.42]);
  if(perk('diag'))for(let i=0;i<perk('diag');i++){dirs.push([a+.5+i*.22,0]);dirs.push([a-.5-i*.22,0])}
  for(let i=0;i<perk('back');i++)dirs.push([a+Math.PI+(i?.3:0),0]);
  if(perk('side')){dirs.push([a+Math.PI/2,0]);dirs.push([a-Math.PI/2,0])}
  const hp=handPos();for(const[ang,off]of dirs){const ox=Math.cos(ang)*off,oz=-Math.sin(ang)*off;shoot(hp.x+ox,hp.z+oz,ang,dmg)}
  emit(hp.x,1.2,hp.z,amb?'#ffffff':'#b48cff',amb?12:5,2,.25)}
function ringShot(n,mult,col,x,z){x=x==null?P.x:x;z=z==null?P.z:z;for(let i=0;i<n;i++)shoot(x,z,i/n*TAU+Math.random()*.2,RUN.st.atk*mult,col);ringFx(x,z,2.5,col||'#c38cff',.4)}
const HV=new T.Vector3();function handPos(){if(P.c.hand){P.c.hand.getWorldPosition(HV);return{x:HV.x,z:HV.z}}return{x:P.x+Math.sin(P.yaw)*.5,z:P.z+Math.cos(P.yaw)*.5}}
const boltMatCore=new T.MeshBasicMaterial({color:'#f2e6ff'});
function shoot(x,z,a,dmg,col,o){o=o||{};const el=col||(perk('fire')?'#9dff6a':perk('frost')?'#9fe6ff':'#b06bff');const big=perk('big')&&!col;
  const m=new T.Group();m.position.set(x,1.05,z);scene.add(m);glow(el,big?1.8:1.25,m,.95);const core=new T.Mesh(o.spike?GEO.spike:GEO.sph,o.spike?M('#e8dcc0'):boltMatCore);core.scale.setScalar(o.spike?1:big?.3:.2);if(o.spike)core.rotation.y=a;m.add(core);
  bolts.push({m,x,z,vx:Math.sin(a)*15,vz:Math.cos(a)*15,dmg,pierce:perk('pierce')+(perk('barrage')?1:0),bounce:col?0:perk('bounce'),wall:perk('wall')&&!col?2:0,hit:new Set(),life:o.life||1.6,col:el,proc:!col,r:big?.2:.12})}
function updBolts(dt){for(let i=bolts.length-1;i>=0;i--){const b=bolts[i];b.life-=dt;const steps=2;let dead=b.life<=0;
  for(let s=0;s<steps&&!dead;s++){b.x+=b.vx*dt/steps;b.z+=b.vz*dt/steps;
    const w=wallHit(b.x,b.z,.12);if(w){if(b.wall>0){b.wall--;if(w==='w'){if(b.x<-HX+.12||b.x>HX-.12)b.vx*=-1;else b.vz*=-1}else{const nx=b.x-w.x,nz=b.z-w.z,l=Math.hypot(nx,nz)||1,dot=(b.vx*nx+b.vz*nz)/l;b.vx-=2*dot*nx/l;b.vz-=2*dot*nz/l}b.x+=b.vx*dt;b.z+=b.vz*dt;emit(b.x,1,b.z,b.col,4,2,.2)}else{dead=true;emit(b.x,1,b.z,b.col,6,2.5,.25);break}}
    for(const e of enemies){if(e.dead||b.hit.has(e))continue;const rr=e.r+.15+b.r-.12;if((e.x-b.x)*(e.x-b.x)+(e.z-b.z)*(e.z-b.z)<rr*rr){b.hit.add(e);hitEnemy(e,b.dmg,Math.atan2(b.vx,b.vz),b.col,{src:b.proc?'bolt':'aoe'});
      if(b.bounce>0){b.bounce--;b.dmg*=.75;if(perk('thunder'))chainZap(e,1,true);let nb=null,nd=7;for(const o of enemies){if(o.dead||b.hit.has(o))continue;const d=Math.hypot(o.x-b.x,o.z-b.z);if(d<nd){nd=d;nb=o}}if(nb){const a=Math.atan2(nb.x-b.x,nb.z-b.z);b.vx=Math.sin(a)*15;b.vz=Math.cos(a)*15;b.life=Math.max(b.life,.8)}else if(b.pierce<=0){dead=true}}
      else if(b.pierce>0){b.pierce--;b.dmg*=.85}else{dead=true}break}}}
  if(dead){scene.remove(b.m);bolts.splice(i,1)}else{b.m.position.set(b.x,1.05,b.z);if(Math.random()<.6)emit(b.x,1.05,b.z,b.col,1,.4,.22)}}}
/* 傷害：src = bolt（主攻擊，會觸發冰火閃電）、orb、ally、aoe、dot、chain */
function hitEnemy(e,base,a,col,o){if(e.dead)return;o=o||{};const S=RUN.st;let dmg=base*rnd(.92,1.08),crit=false;if(!o.noCrit&&Math.random()<S.crit){dmg*=S.critM;crit=true}dmg=Math.max(1,Math.round(dmg));
  if(e.shield>0){const ab=Math.min(e.shield,dmg);e.shield-=ab;dmg-=ab;if(e.shield<=0&&e.shFx){scene.remove(e.shFx);e.shFx=null;ringFx(e.x,e.z,2,'#7df9ff',.4);floatTxt(e.x,2.2,e.z,'護盾破碎','#7df9ff')}if(dmg<=0){e.flashT=.06;emit(e.x,1,e.z,'#7df9ff',3,2,.2);return}}
  e.hp-=dmg;RUN.dmgDone+=dmg;e.flashT=.09;e.sqT=crit?.13:.09;
  if(crit){pop(e.x,1.1+(e.d.fly||0),e.z,'#ffd98a',e.boss?2:1.25,.14);shake=Math.max(shake,.05)}if(!e.boss&&!e.elite&&e.state!=='charge'&&o.src==='bolt'){e.kx+=Math.sin(a)*1.6;e.kz+=Math.cos(a)*1.6}
  floatTxt(e.x,1.7+e.d.scale+(e.d.fly||0),e.z,dmg,crit?'#ffd04a':o.src==='dot'?'#b0ff8a':o.src==='chain'?'#bfe8ff':'#ffffff',crit?'crit':o.src==='dot'?'dot':'');emit(e.x,1+(e.d.fly||0),e.z,col||'#b06bff',crit?10:5,3,.3);
  if(o.src==='bolt'||o.src==='orb'){if(perk('frost')){e.slowT=2}if(perk('fire')){e.burnT=2.2;e.burnD=S.atk*.35*S.elemM}
    if(perk('steam')&&e.slowT>0&&e.burnT>0&&G.time>(e.steamT||0)){e.steamT=G.time+1.5;later(.05,()=>explode(e.x,e.z,2,S.atk*1.2*S.elemM,'#ffffff','steam'))}
    if(o.src==='bolt'&&perk('chain')&&Math.random()<.3)chainZap(e,perk('chain'))}
  if(crit){if(perk('L_eclipse'))explode(e.x,e.z,1.5,dmg*.5,'#c38cff','eclipse',e);if(S.fx.has('fx_burst')&&Math.random()<.15)explode(e.x,e.z,2,S.atk*.8,'#c38cff','burst')}
  if(e.aff.includes('blink')&&e.hp>0&&G.time>(e.blinkT||0)&&Math.random()<.25){e.blinkT=G.time+2.5;const s=freeSpot(3,e.r);emit(e.x,1,e.z,'#c38cff',14,3,.4);e.x=s[0];e.z=s[1];emit(e.x,1,e.z,'#c38cff',14,3,.4)}
  if(e.boss||e.elite)updBoss();if(e.hp<=0)killEnemy(e,o.src)}
function explode(x,z,r,dmg,col,kind,skip){ringFx(x,z,r,col,.35);emit(x,.8,z,col,16,3.5,.45,{up:1.5});lightFlash(x,z,col,1.8);
  for(const e of enemies){if(e.dead||e===skip)continue;if(Math.hypot(e.x-x,e.z-z)<r+e.r)hitEnemy(e,dmg,Math.atan2(e.x-x,e.z-z),col,{noCrit:true,src:kind==='corpse'?'corpse':'aoe'})}}
function chainZap(from,n,force){const S=RUN.st,hit=new Set([from]);let cur=from;for(let k=0;k<n;k++){let nb=null,nd=4.5;for(const o of enemies){if(o.dead||hit.has(o))continue;const d=Math.hypot(o.x-cur.x,o.z-cur.z);if(d<nd){nd=d;nb=o}}if(!nb)break;
  zap(cur.x,1.1+(cur.d.fly||0),cur.z,nb.x,1.1+(nb.d.fly||0),nb.z,'#bfe8ff');hit.add(nb);const t=nb;hitEnemy(t,S.atk*.5*S.elemM*(force?1.2:1),0,'#bfe8ff',{noCrit:true,src:'chain'});cur=nb}}
function killEnemy(e,src){e.dead=true;e.hp=0;e.state='dead';e.t=0;RUN.kills++;track('kill');if(e.sqOn){e.sqOn=false;e.sqT=0;e.c.root.scale.set(1,1,1)}
  const kc=e.d.eye||e.d.bolt||'#ffe9a0',HS=D.RULES.hitstop||{};pop(e.x,1+(e.d.fly||0),e.z,kc,e.boss?6:e.elite?3.6:2.2,e.boss?.45:.22);pop(e.x,1+(e.d.fly||0),e.z,'#ffffff',e.boss?2.4:e.elite?1.4:.75,.1);emit(e.x,1,e.z,'#ffffff',e.boss?20:5,5,.25);
  if(e.boss)hitStop(HS.boss||.16);else if(e.elite){hitStop(HS.elite||.08);shake=Math.max(shake,.25)}
  else{const now=RUN.time;if(now-(RUN.mkT||0)>.15){RUN.mkT=now;RUN.mkN=0}RUN.mkN++;if(RUN.mkN===(HS.multi||3)){hitStop(HS.multiT||.045);shake=Math.max(shake,.14);ringFx(e.x,e.z,2.6,'#ffffff',.3)}}once(e.c,'Death_A',1.3);emit(e.x,.8,e.z,e.d.eye||'#ffe9a0',e.boss?60:16,3.5,.7,{gr:3});ringFx(e.x,e.z,e.boss?5:1.6,e.d.eye||'#ffe9a0',.5);
  if(e.beam){scene.remove(e.beam);e.beam=null}if(e.shFx){scene.remove(e.shFx);e.shFx=null}if(e.aura){scene.remove(e.aura);e.aura=null}
  const st=RUN.stage,gv=1+Math.floor((RUN.lv-1)*.3);let gN=ri(e.d.gold[0],e.d.gold[1])+(st.loot==='gold'?ri(2,4):0);if(e.elite)gN+=ri(D.ELITE.gold[0],D.ELITE.gold[1]);for(let i=0;i<gN;i++)dropLoot('gold',e.x,e.z,gv);
  if(st.loot==='shards'?Math.random()<.75:Math.random()<.08)dropLoot('shard',e.x,e.z,1);
  if(st.loot==='dust'&&Math.random()<.5)dropLoot('dust',e.x,e.z,ri(1,2));
  if(st.loot==='crystals'&&Math.random()<.35)dropLoot('crystal',e.x,e.z,1);
  if(!e.boss&&!e.summoned){const xv=(e.d.xp||1)*(e.elite?D.ELITE.xp/(e.d.xp||1):1);const xc=xv/(RUN.diff.count||1)/(RUN.cm||1);dropLoot('xp',e.x,e.z,e.small?Math.max(.5,xc*.4):xc)}
  if(e.elite){RUN.elites++;track('elite')}
  if(perk('leech'))healP(Math.round(RUN.maxHp*.03*perk('leech')));
  const S=RUN.st;
  if(perk('plague'))puddle(e.x,e.z,1.6,'#9dff3a',3,{kind:'pois',dmg:S.atk*.25*perk('plague')*S.elemM});
  if(perk('corpse')&&src!=='corpse'&&Math.random()<.35)later(.15,()=>explode(e.x,e.z,2,S.atk*.6*perk('corpse')*S.sumM,'#9dff6a','corpse'));
  if(perk('raise')&&!e.boss&&Math.random()<.15)later(.5,()=>spawnAlly('temp',e.x,e.z,10));
  if(S.fx.has('fx_sk')&&!e.boss&&Math.random()<.15)later(.5,()=>spawnAlly('temp',e.x,e.z,8));
  if(e.aff.includes('split')&&!e.small)for(let i=0;i<2;i++){const a=rnd(0,TAU),x=clamp(e.x+Math.sin(a)*.8,-HX+1,HX-1),z=clamp(e.z+Math.cos(a)*.8,-HZ+1,HZ-1);later(.3,()=>{if(RUN&&fighting()){const s=spawnEnemy(e.key,x,z,{small:true});if(s){s.state='act';s.c.root.scale.setScalar(1)}}})}
  if(e.boss){const twin=enemies.find(o=>o.boss&&!o.dead&&o!==e);
    if(twin){twin.rage=true;banner(twin.d.n.split(' · ')[1]||twin.d.n,'陷入狂怒','#ff6a3a');shake=.4}
    else{$('bossBar').hidden=true;shake=.6;lightFlash(e.x,e.z,'#ffe9a0',4);for(const o of enemies)if(!o.dead&&o!==e)killEnemy(o,'boss')}}
  if(e.boss||e.elite)updBoss();
  if(!enemies.some(o=>!o.dead))later(.45,waveCleared);else earlyWave()}
const LOOT_LOOK={gold:['#ffd76a','#5a3a08'],shard:['#bfe4ff','#1a4a6a'],dust:['#8fa8ff','#1a2a6a'],crystal:['#5affe6','#0a5a50']};
function dropLoot(kind,x,z,v){let m;if(kind==='xp'){m=new T.Group();glow('#9dff6a',v>=8?1.1:.6,m,.9);const core=new T.Mesh(GEO.oct,M('#d8ffc0',{emissive:'#3a8a20'}));core.scale.setScalar(v>=8?.32:.18);m.add(core)}
  else if(kind==='gold'){m=new T.Mesh(GEO.coin,M('#ffd76a',{emissive:'#5a3a08'}))}else{const c=LOOT_LOOK[kind];m=new T.Mesh(GEO.oct,M(c[0],{emissive:c[1]}));m.scale.setScalar(kind==='crystal'?.36:.3)}
  if(m.isMesh)m.castShadow=true;scene.add(m);const a=rnd(0,TAU),s=rnd(1.5,3.5);loot.push({kind,v:v||1,m,x,z,y:.6,vx:Math.sin(a)*s,vz:Math.cos(a)*s,vy:rnd(3,5),t:0,mag:false})}
function updLoot(dt){const mr=1.8*(RUN.st.magnet||1);for(let i=loot.length-1;i>=0;i--){const l=loot[i];l.t+=dt;
  if(l.mag||(l.t>.5&&Math.hypot(P.x-l.x,P.z-l.z)<mr)){l.mag=true;const dx=P.x-l.x,dz=P.z-l.z,d=Math.hypot(dx,dz)||1,sp=Math.min(24,6+l.t*10);l.x+=dx/d*sp*dt;l.z+=dz/d*sp*dt;l.y=lerp(l.y,1,.2);
    if(d<.45){scene.remove(l.m);loot.splice(i,1);pickLoot(l);continue}}
  else{l.vy-=14*dt;l.y+=l.vy*dt;l.x+=l.vx*dt;l.z+=l.vz*dt;l.vx*=.92;l.vz*=.92;if(blocked(l.x,l.z,.2)){l.x-=l.vx*dt;l.z-=l.vz*dt;l.vx*=-.5;l.vz*=-.5}if(l.y<.1){l.y=.1;l.vy=Math.abs(l.vy)*.35}}
  l.m.position.set(l.x,l.y+(l.kind==='xp'?.3+Math.sin(G.time*5+i)*.1:0),l.z);l.m.rotation.y+=dt*5;if(l.kind==='gold')l.m.rotation.x=Math.PI/2.4}}
function pickLoot(l){if(l.kind==='gold'){RUN.gold+=l.v}else if(l.kind==='shard'){RUN.shards+=l.v;floatTxt(P.x,2.4,P.z,'+1 骨片','#bfe4ff')}else if(l.kind==='dust'){RUN.dust+=l.v;floatTxt(P.x,2.4,P.z,'+'+l.v+' 粉塵','#8fa8ff')}
  else if(l.kind==='crystal'){RUN.crystals+=l.v;floatTxt(P.x,2.4,P.z,'+1 魂晶','#5affe6')}else if(l.kind==='xp'){gainXp(l.v*RUN.st.xpM)}updHud()}

/* ================= 敵人 AI ================= */
function updEnemies(dt){for(const e of enemies){const c=e.c;e.t+=dt;
  if(e.flashT>0){e.flashT-=dt;flash(c,[1,1,1],e.flashT>0?.9:0)}
  if(e.dead){if(e.t>1.4){c.root.position.y-=dt*.8}e.sh.visible=false;continue}
  e.slowT=Math.max(0,e.slowT-dt);if(e.burnT>0){e.burnT-=dt;e.burnTick=(e.burnTick||0)+dt;if(e.burnTick>=.5){e.burnTick=0;hitEnemy(e,e.burnD*.5,0,'#ff7a3a',{noCrit:true,src:'dot'})}if(Math.random()<.3)emit(e.x,1,e.z,'#9dff6a',1,1,.4,{up:1.5})}
  if(e.dead)continue;
  if(e.toxT!=null){e.toxT-=dt;if(e.toxT<=0&&e.state!=='rise'){e.toxT=1.3;puddle(e.x,e.z,.95,'#b0ff3a',3.2,{kind:'toxic',dmg:e.dmg*.3})}}
  const slow=e.slowT>0?.6:1,dx=P.x-e.x,dz=P.z-e.z,dist=Math.hypot(dx,dz)||1,face=Math.atan2(dx,dz);
  if(e.stunT>0){e.stunT-=dt;play(c,'Idle_Combat');if(Math.random()<.2)emit(e.x,1.2,e.z,'#bfe8ff',1,.6,.5)}
  else if(e.state==='rise'){if(e.beam){c.root.scale.setScalar(Math.min(1,e.t/.6));e.beam.material.opacity=Math.max(0,1-e.t/.8);if(e.t>.8){scene.remove(e.beam);e.beam=null}}if(e.t>(e.d.rise?1.15:.7)){e.state='act';e.t=0}}
  else{const A=e.d.ai,hd=dt*e.haste;
    if(A==='chase')aiChase(e,hd,slow,dist,dx,dz,face);
    else if(A==='charger')aiCharger(e,hd,slow,dist,dx,dz,face);
    else if(A==='caster')aiCaster(e,hd,slow,dist,dx,dz,face);
    else if(A==='slammer')aiSlammer(e,hd,slow,dist,dx,dz,face);
    else if(A==='boss')aiBoss(e,hd,slow,dist,dx,dz,face)}
  if(e.kx||e.kz){moveEnt(e,e.kx*dt*6,e.kz*dt*6,e.r);e.kx*=.8;e.kz*=.8;if(Math.abs(e.kx)<.01)e.kx=0;if(Math.abs(e.kz)<.01)e.kz=0}
  for(const o of enemies){if(o===e||o.dead)continue;const ox=e.x-o.x,oz=e.z-o.z,d=Math.hypot(ox,oz),m=e.r+o.r;if(d>0&&d<m){const p=(m-d)*.5;moveEnt(e,ox/d*p,oz/d*p,e.r)}}
  const pr=e.r+.38;if(dist<pr){const p=pr-dist;moveEnt(e,-dx/dist*p,-dz/dist*p,e.r)}
  const fy=e.d.fly?e.d.fly+Math.sin(G.time*3+e.x)*.12:c.root.position.y;
  c.root.position.set(e.x,fy,e.z);c.root.rotation.y=angLerp(c.root.rotation.y,e.yaw,Math.min(1,dt*12));
  if(e.sqT>0&&e.state!=='rise'){e.sqT-=dt;const k=Math.max(0,e.sqT)/.13,b=e.boss?.4:1;c.root.scale.set(1+.14*k*b,1-.2*k*b,1+.14*k*b);e.sqOn=e.sqT>0;if(!e.sqOn)c.root.scale.set(1,1,1)}e.sh.position.set(e.x,.02,e.z);
  if(e.shFx)e.shFx.position.set(e.x,1+(e.d.fly||0),e.z);if(e.aura)e.aura.position.set(e.x,.15,e.z)}
  for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];if(e.dead&&e.t>2.6){disposeChar(e.c);scene.remove(e.sh);enemies.splice(i,1)}}}
const STEER=[0,.45,-.45,.9,-.9,1.35,-1.35,1.8,-1.8];
function walkTo(e,dx,dz,dist,sp,dt){const a=Math.atan2(dx,dz),side=e.side||1,look=e.r+.55;let moved=false;
  if(e.sideT>0)e.sideT-=dt;
  for(const o0 of STEER){const o=o0*side;const ang=a+o;if(blocked(e.x+Math.sin(ang)*look,e.z+Math.cos(ang)*look,e.r*.9))continue;
    moveEnt(e,Math.sin(ang)*sp*dt,Math.cos(ang)*sp*dt,e.r);if(o0!==0){e.sideT=.8}else if(e.sideT<=0&&Math.random()<.01)e.side=-side;e.yaw=angLerp(e.yaw,ang,.5);moved=true;break}
  if(!moved){e.side=-side;moveEnt(e,dx/dist*sp*dt,dz/dist*sp*dt,e.r)}
  play(e.c,'Running_A',.2,sp/3)}
function touch(e,dt,dist,mult){e.touchT-=dt;if(dist<e.r+.5&&e.touchT<=0){e.touchT=.9;hurtP(e.dmg*(mult||1),e);once(e.c,'1H_Melee_Attack_Chop',1.6)}}
function aiChase(e,dt,slow,dist,dx,dz,face){if(dist>e.r+.45)walkTo(e,dx,dz,dist,e.spd*slow,dt);else{e.yaw=face;play(e.c,'Idle_Combat')}touch(e,dt,dist)}
function aiCharger(e,dt,slow,dist,dx,dz,face){const a=e.ai;e.cd-=dt;
  if(e.state==='act'){e.yaw=face;if(dist<7.5&&e.cd<=0&&!losBlocked(e.x,e.z,P.x,P.z)){e.state='aim';e.t=0;a.ang=face;play(e.c,'Idle_Combat');tele('line',e.x,e.z,{a:face,w:1.2*(e.elite?1.4:1),len:9},.75)}
    else if(dist>1.2){walkTo(e,dx,dz,dist,e.spd*slow,dt)}else play(e.c,'Idle_Combat');touch(e,dt,dist)}
  else if(e.state==='aim'){if(e.t>=.75){e.state='charge';e.t=0;a.hit=false;once(e.c,'2H_Melee_Attack_Chop',1.4)}}
  else if(e.state==='charge'){const sp=12;const ox=e.x,oz=e.z;moveEnt(e,Math.sin(a.ang)*sp*dt,Math.cos(a.ang)*sp*dt,e.r);if(Math.random()<.7)emit(e.x,.3,e.z,'#8a8070',2,1,.4,{up:1});
    if(!a.hit&&Math.hypot(P.x-e.x,P.z-e.z)<e.r+.55){a.hit=true;hurtP(e.dmg*1.3,e)}if(e.t>.75||(ox===e.x&&oz===e.z)){e.state='rest';e.t=0;shake=Math.max(shake,.12)}}
  else if(e.state==='rest'){play(e.c,'Idle_Combat');if(e.t>.7){e.state='act';e.cd=rnd(2.2,3.2)}}}
function aiCaster(e,dt,slow,dist,dx,dz,face){const a=e.ai;e.cd-=dt;e.yaw=face;
  if(e.state==='act'){const sp=e.spd*slow;a.str=(a.str||0)+dt;
    if(e.force&&dist>1.6)walkTo(e,dx,dz,dist,sp,dt);else if(dist<4.5&&!e.force)walkTo(e,-dx,-dz,dist,sp,dt);else if(dist>8.5||losBlocked(e.x,e.z,P.x,P.z))walkTo(e,dx,dz,dist,sp,dt);
    else{const s=Math.sin(a.str*.9+e.x)>0?1:-1;moveEnt(e,dz/dist*sp*.5*s*dt,-dx/dist*sp*.5*s*dt,e.r);play(e.c,'Walking_A',.2,1)}
    if(e.cd<=0&&dist<11&&!losBlocked(e.x,e.z,P.x,P.z)){e.state='cast';e.t=0;once(e.c,'Spellcast_Shoot',1.2);a.g=glow(e.d.bolt,1.4,e.c.root);a.g.position.set(0,1.4,.4)}}
  else if(e.state==='cast'){if(a.g)a.g.scale.setScalar(.6+e.t*2.2);if(e.t>=.55){if(a.g){e.c.root.remove(a.g);a.g=null}const n=(e.d.shots||1)+(e.elite?2:0);for(let i=0;i<n;i++)eshoot(e,face+(i-(n-1)/2)*.32,(e.d.boltSpd||5.6)*(RUN.diff.spd||1),e.d.bolt,e.dmg);e.state='act';e.cd=rnd(2,2.8)}}}
function aiSlammer(e,dt,slow,dist,dx,dz,face){const a=e.ai;e.cd-=dt;const R=1.9*(e.elite?1.3:1);
  if(e.state==='act'){e.yaw=face;if(dist<2.1+(e.elite?.4:0)&&e.cd<=0){e.state='wind';e.t=0;a.x=e.x+Math.sin(face)*1.1;a.z=e.z+Math.cos(face)*1.1;play(e.c,'Idle_Combat');tele('circle',a.x,a.z,{r:R},.8)}
    else if(dist>1.5)walkTo(e,dx,dz,dist,e.spd*slow,dt);else play(e.c,'Idle_Combat')}
  else if(e.state==='wind'){if(e.t>.45&&!a.sw){a.sw=1;once(e.c,'1H_Melee_Attack_Chop',1.3)}if(e.t>=.8){a.sw=0;e.state='act';e.cd=rnd(1.6,2.4);ringFx(a.x,a.z,R+.1,'#ffb35a',.35);emit(a.x,.3,a.z,'#c9b090',14,3,.5,{up:2,gr:6,flat:1});shake=Math.max(shake,.15);
    if(Math.hypot(P.x-a.x,P.z-a.z)<R+.3)hurtP(e.dmg*1.4,e)}}}
function aiBoss(e,dt,slow,dist,dx,dz,face){const a=e.ai,rage=e.rage||e.hp<e.max*.4,moves=e.d.moves||['nova','slam','charge','summon'];e.cd-=dt;a.sum=(a.sum==null?10:a.sum)-dt;
  if(e.state==='act'){e.yaw=face;if(dist>2.6)walkTo(e,dx,dz,dist,e.spd*(rage?1.25:1)*slow,dt);else play(e.c,'Idle_Combat');touch(e,dt,dist,1.2);
    if(e.cd<=0){let opts=moves.filter(m=>m!=='summon');if(moves.includes('summon')&&e.hp<e.max*.65&&a.sum<=0)opts=['summon'];let m=pick(opts);if(m===a.last&&opts.length>1)m=pick(opts.filter(x=>x!==a.last));a.last=m;e.state=m;e.t=0;a.k=0;
      if(m==='slam'){a.pts=[];const n=rage?3:2;for(let i=0;i<n;i++)a.pts.push(null)}
      if(m==='charge'){a.ang=face;tele('line',e.x,e.z,{a:face,w:2,len:12},.9);play(e.c,'Idle_Combat')}
      if(m==='summon'){once(e.c,'Spellcast_Raise',1);a.sum=13}
      if(m==='nova'||m==='spores'){once(e.c,'Spellcast_Raise',1.2)}}}
  else if(e.state==='nova'){const waves=rage?3:2;if(e.t>=.5+a.k*.55&&a.k<waves){const n=rage?20:16,off=a.k*.5/n*TAU+Math.random();for(let i=0;i<n;i++)eshoot(e,off+i/n*TAU,(rage?5.2:4.6)*(RUN.diff.spd||1),e.d.bolt,e.dmg*.8,1);ringFx(e.x,e.z,3,e.d.bolt,.4);a.k++}
    if(e.t>.6+waves*.55){e.state='act';e.cd=rage?1.4:2}}
  else if(e.state==='spores'){const n=rage?5:4;if(a.k<n&&e.t>=.4+a.k*.25){const px=clamp(P.x+rnd(-2.5,2.5),-HX+1,HX-1),pz=clamp(P.z+rnd(-2.5,2.5),-HZ+1,HZ-1),dmg=e.dmg;tele('circle',px,pz,{r:1.3,col:'#b0ff3a'},.9,()=>{puddle(px,pz,1.3,'#b0ff3a',4,{kind:'toxic',dmg:dmg*.45});emit(px,.4,pz,'#b0ff3a',14,2,.6,{up:1})});a.k++}
    if(e.t>.6+n*.25+.6){e.state='act';e.cd=rage?1.3:1.9}}
  else if(e.state==='slam'){const n=a.pts.length;if(a.k<n&&e.t>=a.k*.42){const px=P.x,pz=P.z;a.pts[a.k]={x:px,z:pz};tele('circle',px,pz,{r:2.3},.85,()=>{ringFx(px,pz,2.5,'#ff8a4a',.4);emit(px,.3,pz,'#ffb35a',20,4,.5,{up:2,gr:6,flat:1});shake=Math.max(shake,.2);lightFlash(px,pz,'#ff8a4a',2.5);if(Math.hypot(P.x-px,P.z-pz)<2.5)hurtP(e.dmg*1.5,e)});once(e.c,'2H_Melee_Attack_Chop',1.2);a.k++}
    if(e.t>n*.42+.9){e.state='act';e.cd=rage?1.2:1.8}}
  else if(e.state==='charge'){if(e.t<.9)return;if(!a.go){a.go=1;a.hit=false;once(e.c,'2H_Melee_Attack_Chop',1)}const sp=14,ox=e.x,oz=e.z;moveEnt(e,Math.sin(a.ang)*sp*dt,Math.cos(a.ang)*sp*dt,e.r);emit(e.x,.3,e.z,'#c9b090',3,1.5,.4,{up:1});
    if(!a.hit&&Math.hypot(P.x-e.x,P.z-e.z)<e.r+.6){a.hit=true;hurtP(e.dmg*1.6,e)}if(e.t>1.75||(ox===e.x&&oz===e.z)){a.go=0;e.state='act';e.cd=1.3;shake=.25;emit(e.x,.5,e.z,'#c9b090',18,4,.5,{gr:5})}}
  else if(e.state==='summon'){if(e.t>.6&&!a.done){a.done=1;const alive=enemies.filter(o=>!o.dead&&!o.boss).length;for(let i=0;i<(alive>8?1:3);i++){const ang=i/3*TAU+Math.random(),x=clamp(e.x+Math.sin(ang)*3,-HX+1,HX-1),z=clamp(e.z+Math.cos(ang)*3,-HZ+1,HZ-1);if(!blocked(x,z,.5))spawnEnemy(e.d.minion,x,z,{summoned:true})}}
    if(e.t>1.4){a.done=0;e.state='act';e.cd=1}}}
const eMat={};
function eshoot(e,a,sp,col,dmg,big){const m=new T.Group();const y=1.1+(e.d.fly||0)*.5;m.position.set(e.x,y,e.z);scene.add(m);glow(col,big?1.3:1.1,m);const core=new T.Mesh(GEO.sph,eMat[col]||(eMat[col]=new T.MeshBasicMaterial({color:new T.Color(col).lerp(new T.Color('#ffffff'),.6)})));core.scale.setScalar(.26);m.add(core);
  ebolts.push({m,x:e.x+Math.sin(a)*.6,z:e.z+Math.cos(a)*.6,vx:Math.sin(a)*sp,vz:Math.cos(a)*sp,dmg,life:5,col,src:e,y})}
function updEbolts(dt){for(let i=ebolts.length-1;i>=0;i--){const b=ebolts[i];b.life-=dt;b.x+=b.vx*dt;b.z+=b.vz*dt;let dead=b.life<=0;
  if(!dead&&wallHit(b.x,b.z,.15)){dead=true;emit(b.x,1,b.z,b.col,6,2,.3)}
  if(!dead&&!P.dead&&(P.x-b.x)*(P.x-b.x)+(P.z-b.z)*(P.z-b.z)<.42*.42){dead=true;hurtP(b.dmg,b.src);emit(b.x,1,b.z,b.col,8,2.5,.3)}
  if(dead){scene.remove(b.m);ebolts.splice(i,1)}else{b.m.position.set(b.x,b.y,b.z);if(Math.random()<.4)emit(b.x,b.y,b.z,b.col,1,.3,.3)}}}
function updBoss(){const list=enemies.filter(e=>(e.boss||e.elite)&&!e.dead);if(!list.length){$('bossBar').hidden=true;return}
  const bs=list.filter(e=>e.boss),use=bs.length?bs:list,hp=use.reduce((s,e)=>s+Math.max(0,e.hp),0),mx=use.reduce((s,e)=>s+e.max,0);$('bossBar').hidden=false;$('bossBar').classList.toggle('elite',!bs.length);
  const e0=use[0];$('bossName').textContent=bs.length>1?bs.map(e=>e.d.n.split(' · ')[1]||e.d.n).join(' & '):(e0.elite?'菁英 · '+e0.d.n+(e0.aff.length?'（'+e0.aff.map(a=>D.AFFIXES[a].n).join('、')+'）':''):e0.d.n);$('bossFill').style.width=(clamp(hp/mx,0,1)*100)+'%'}

/* ================= 地面效果：毒雲（我方）、毒圈（敵方）、幽影 ================= */
function updPuddles(dt){for(let i=puddles.length-1;i>=0;i--){const p=puddles[i];p.t+=dt;const k=1-p.t/p.dur;if(k<=0){scene.remove(p.g);puddles.splice(i,1);continue}
  p.g.material=glowMat(p.col,.55);p.g.scale.setScalar(p.r*2.2*(k<.2?k*5:1));if(Math.random()<.25)emit(p.x+rnd(-p.r,p.r)*.7,.3,p.z+rnd(-p.r,p.r)*.7,p.col,1,.4,.8,{up:.8});
  p.tick-=dt;if(p.tick>0)continue;p.tick=.5;
  if(p.kind==='toxic'){if(Math.hypot(P.x-p.x,P.z-p.z)<p.r+.2)hurtP(p.dmg,null,true)}
  else for(const e of enemies){if(e.dead)continue;if(Math.hypot(e.x-p.x,e.z-p.z)<p.r+e.r)hitEnemy(e,p.dmg,0,p.col,{noCrit:true,src:'dot'})}}}

/* ================= 環繞頭骨 ================= */
function syncOrbs(){const want=perk('orbit')*2;while(orbs.length<want){const m=new T.Group();scene.add(m);glow('#9dff6a',1.1,m);const sk=new T.Mesh(GEO.sph,M('#e8e0c8',{emissive:'#2a4a10'}));sk.scale.setScalar(.32);m.add(sk);orbs.push({m,shT:Math.random()})}while(orbs.length>want){scene.remove(orbs.pop().m)}}
function updOrbs(dt){if(!orbs.length)return;P.orbA+=dt*3.2;const S=RUN.st;orbs.forEach((o,i)=>{const a=P.orbA+i/orbs.length*TAU,x=P.x+Math.sin(a)*1.8,z=P.z+Math.cos(a)*1.8;o.m.position.set(x,1,z);if(Math.random()<.4)emit(x,1,z,'#9dff6a',1,.3,.3);
  for(const e of enemies){if(e.dead||e.state==='rise')continue;if(Math.hypot(e.x-x,e.z-z)<e.r+.35&&G.time>(e['orb'+i]||0)){e['orb'+i]=G.time+.45;hitEnemy(e,S.atk*.45*S.sumM,a+Math.PI/2,'#9dff6a',{src:'orb'})}}
  if(perk('legion')&&fighting()){o.shT-=dt;if(o.shT<=0){o.shT=1.2;let t=null,td=6;for(const e of enemies){if(e.dead||e.state==='rise')continue;const d=Math.hypot(e.x-x,e.z-z);if(d<td){td=d;t=e}}if(t)shoot(x,z,Math.atan2(t.x-x,t.z-z),S.atk*.4*S.sumM,'#9dff6a',{life:.8})}}})}

/* ================= 骷髏僕從 ================= */
function spawnAlly(kind,x,z,life){if(kind==='temp'&&allies.filter(a=>a.life).length>=6)return null;const war=kind==='march';
  const c=makeActor(war?'sk_warrior':'sk_minion',{scale:war?.62:.52,eye:'#9dff6a',tint:'#d8ffd0',wr:war?'w_axe':'w_blade',emis:'#0a2a08'},'minion');
  const p=blocked(x,z,.4)?[P.x,P.z]:[x,z];c.root.position.set(p[0],0,p[1]);scene.add(c.root);
  const a={c,x:p[0],z:p[1],yaw:0,atkT:rnd(0,.5),life:life||0,r:.38,kind,sh:shadowFor(.38)};allies.push(a);once(c,'Skeletons_Awaken_Floor',1.6);ringFx(p[0],p[1],1.2,'#9dff6a',.5);emit(p[0],.3,p[1],'#9dff6a',12,2,.6,{up:1.5});return a}
function syncAllies(){const want=perk('minion')+(perk('L_army')?3:0);let perm=allies.filter(a=>!a.life);
  while(perm.length<want){const a=rnd(0,TAU);spawnAlly('perm',P.x+Math.sin(a)*1.2,P.z+Math.cos(a)*1.2,0);perm=allies.filter(a=>!a.life)}}
function placeAllies(){allies.forEach((a,i)=>{if(a.life){removeAlly(a);return}const ang=i/Math.max(1,allies.length)*TAU;a.x=clamp(P.x+Math.sin(ang)*1.2,-HX+.6,HX-.6);a.z=clamp(P.z+Math.cos(ang)*1.2-.5,-HZ+.6,HZ-.6);a.c.root.position.set(a.x,0,a.z)});
  for(let i=allies.length-1;i>=0;i--)if(allies[i].dead)allies.splice(i,1)}
function removeAlly(a){a.dead=true;emit(a.x,.8,a.z,'#9dff6a',12,2,.5);disposeChar(a.c);scene.remove(a.sh)}
function clearAllies(){for(const a of allies){disposeChar(a.c);scene.remove(a.sh)}allies.length=0}
function updAllies(dt){const S=RUN.st,haste=perk('legion')?1.6:1;for(let i=allies.length-1;i>=0;i--){const a=allies[i];
  if(a.life){a.life-=dt;if(a.life<=0){removeAlly(a);allies.splice(i,1);continue}}
  let t=null,td=1e9;if(fighting())for(const e of enemies){if(e.dead||e.state==='rise')continue;const d=Math.hypot(e.x-a.x,e.z-a.z);if(d<td){td=d;t=e}}
  const sp=4.4*(a.kind==='march'?1.1:1);
  if(t){const dx=t.x-a.x,dz=t.z-a.z,d=td||1;a.yaw=Math.atan2(dx,dz);if(d>t.r+.75){moveEnt(a,dx/d*sp*dt,dz/d*sp*dt,a.r);play(a.c,'Running_A',.15,1.4)}
    else{a.atkT-=dt*haste;play(a.c,'Idle_Combat');if(a.atkT<=0){a.atkT=.9;once(a.c,'1H_Melee_Attack_Chop',1.8);const dm=S.atk*(a.kind==='march'?.9:.6)*S.sumM;later(.18,()=>{if(!t.dead&&RUN)hitEnemy(t,dm,a.yaw,'#9dff6a',{src:'ally'})})}}}
  else{const dx=P.x-a.x,dz=P.z-a.z,d=Math.hypot(dx,dz);if(d>2.2){a.yaw=Math.atan2(dx,dz);moveEnt(a,dx/d*sp*dt,dz/d*sp*dt,a.r);play(a.c,'Running_A',.15,1.4)}else play(a.c,'Idle',.3)}
  for(const o of allies){if(o===a)continue;const ox=a.x-o.x,oz=a.z-o.z,d=Math.hypot(ox,oz);if(d>0&&d<.7){moveEnt(a,ox/d*(.7-d)*.5,oz/d*(.7-d)*.5,a.r)}}
  a.c.root.position.set(a.x,0,a.z);a.c.root.rotation.y=angLerp(a.c.root.rotation.y,a.yaw,Math.min(1,dt*12));a.sh.position.set(a.x,.02,a.z);a.c.mixer.update(dt)}}

/* ================= 玩家 ================= */
function hurtP(dmg,src,dot){if(P.dead||P.inv>0||!RUN||RUN.state==='dead'||RUN.god)return;const S=RUN.st;
  if(!dot&&S.dodge>0&&Math.random()<S.dodge){floatTxt(P.x,2.2,P.z,'閃避','#9fb4ff');emit(P.x,1,P.z,'#9fb4ff',10,2,.4);P.inv=.25;if(perk('phantom')&&G.time>(P.phT||0)){P.phT=G.time+1;ringShot(8,.8,'#9fb4ff')}return}
  if(!dot&&P.shieldUp){P.shieldUp=false;P.shieldT=8;P.inv=.4;ringFx(P.x,P.z,2,'#e8d9a8',.4);floatTxt(P.x,2.2,P.z,'格擋','#e8d9a8');if(P.shieldFx)P.shieldFx.visible=false;return}
  dmg=Math.max(1,Math.round(dmg*(1-S.def)*rnd(.92,1.08)));RUN.hp-=dmg;RUN.lastBy=telSrc(dot?null:src);P.inv=dot?.1:.55;P.hitT=.15;shake=Math.max(shake,dot?.06:.18);
  floatTxt(P.x,2.2,P.z,'-'+dmg,'#ff5a5a','big');flash(P.c,[1,.1,.1],.8);setTimeout(()=>P.c&&flash(P.c,[0,0,0],0),110);if(!P.c.one&&!dot)once(P.c,'Hit_A',1.6);
  if(!dot&&src&&!src.dead&&perk('thorns'))hitEnemy(src,S.atk*.8*perk('thorns'),Math.atan2(src.x-P.x,src.z-P.z),'#e8d9a8',{noCrit:true,src:'aoe'});
  if(!dot&&perk('fortress')&&G.time>(P.fortT||0)){P.fortT=G.time+.5;for(let i=0;i<8;i++)shoot(P.x,P.z,i/8*TAU,S.atk*.6,'#e8d9a8',{spike:true,life:.7})}
  if(RUN.hp>0&&RUN.hp<RUN.maxHp*.3&&S.fx.has('fx_guard')&&!RUN.guarded){RUN.guarded=true;P.inv=3;banner('護主','3 秒無敵','#ffd04a');ringFx(P.x,P.z,3,'#ffd04a',.6)}
  if(RUN.hp<=0){RUN.hp=0;
    if(perk('L_phoenix')&&!RUN.phoenix){RUN.phoenix=true;RUN.hp=1;P.inv=2.5;later(.25,()=>{if(!RUN)return;healP(RUN.maxHp,false,true);banner('骨灰重生','從灰燼中站起','#ffa53a');ringFx(P.x,P.z,5,'#ffa53a',.8);emit(P.x,1,P.z,'#ffa53a',50,5,.9,{up:2});clearEbolts()})}
    else if(tal('t_rev')&&!RUN.revived){RUN.revived=true;RUN.hp=1;P.inv=2;later(.25,()=>{if(!RUN)return;healP(Math.round(RUN.maxHp*.5),false,true);banner('不死','骨頭重新拼好了','#93d95e');ringFx(P.x,P.z,4,'#93d95e',.7);emit(P.x,1,P.z,'#93d95e',40,4,.8,{up:2});clearEbolts()})}
    else die()}updHud()}
function clearEbolts(){for(const b of ebolts)scene.remove(b.m);ebolts.length=0}
function healP(n,silent,raw){if(!RUN||n<=0)return;if(!raw)n=n*RUN.st.healM;const before=RUN.hp;RUN.hp=Math.min(RUN.maxHp,RUN.hp+n);if(RUN.hp>before&&!silent){floatTxt(P.x,2.4,P.z,'+'+Math.round(RUN.hp-before),'#93d95e');emit(P.x,1,P.z,'#93d95e',8,1.5,.6,{up:1.5})}updHud()}
function die(){P.dead=true;RUN.state='dead';tel('death',{type:RUN.type,by:RUN.lastBy,wave:RUN.wave,rlv:RUN.rlv,t:Math.round(RUN.roomT||0),runT:Math.round(RUN.time),perks:telPerks(),phoenix:RUN.phoenix,revived:RUN.revived});once(P.c,'Death_A',1);emit(P.x,1,P.z,'#9dff6a',30,3,1,{gr:2});banner('你倒下了','骨頭散落一地','#e0474f');later(2.2,()=>endRun(false))}
const joy={id:null,ox:0,oy:0,x:0,y:0},keys=new Set();
function inputDir(){let ix=joy.x,iz=joy.y;if(keys.has('a')||keys.has('arrowleft'))ix-=1;if(keys.has('d')||keys.has('arrowright'))ix+=1;if(keys.has('w')||keys.has('arrowup'))iz-=1;if(keys.has('s')||keys.has('arrowdown'))iz+=1;return[ix,iz]}
function updPlayer(dt){if(P.dead){return}P.inv=Math.max(0,P.inv-dt);P.hitT=Math.max(0,P.hitT-dt);const S=RUN.st;
  const[ix,iz]=inputDir();const il=Math.hypot(ix,iz);P.moving=il>.15&&RUN.state!=='dead';
  if(P.moving){const n=Math.min(1,il),sp=S.spd*n;moveEnt(P,ix/il*sp*dt,iz/il*sp*dt,.38);P.yaw=angLerp(P.yaw,Math.atan2(ix,iz),Math.min(1,dt*16));P.castT=0;P.moveT+=dt;
    if(!P.c.one||P.c.cur==='Spellcast_Shoot'){P.c.one=null;play(P.c,'Running_A',.12,1.25*n)}
    if(S.moveAtk>0){P.atkT-=dt*S.moveAtk;if(fighting()&&P.atkT<=0){const t=nearestEnemy();if(t)attack(t,true)}}else{P.queue.length=0;P.atkT=Math.max(P.atkT,.12)}
    if(perk('trail')&&fighting()){P.trailT-=dt;if(P.trailT<=0){P.trailT=.35;puddle(P.x,P.z,.9,'#9fb4ff',1.5,{kind:'trail',dmg:S.atk*.3*perk('trail')})}}}
  else{if(perk('ambush')&&P.moveT>.8&&G.time>P.ambCd&&fighting()){P.amb=true;P.ambCd=G.time+3;ringFx(P.x,P.z,1.4,'#ffffff',.3)}P.moveT=0;
    P.atkT-=dt;if(!P.c.one)play(P.c,'Idle_Combat',.2);
    if(fighting()){const t=nearestEnemy();if(t){P.yaw=angLerp(P.yaw,Math.atan2(t.x-P.x,t.z-P.z),Math.min(1,dt*20));if(P.atkT<=0)attack(t)}}}
  for(let i=P.queue.length-1;i>=0;i--){const q=P.queue[i];q.t-=dt;if(q.t<=0){P.queue.splice(i,1);const t=nearestEnemy();fireVolley(t?Math.atan2(t.x-P.x,t.z-P.z):q.a,q.amb)}}
  // 回復、骨盾、新星、風暴
  if(S.regen>0&&RUN.hp<RUN.maxHp){P.regAcc+=S.regen*RUN.maxHp*dt*S.healM;if(P.regAcc>=1){const n=Math.floor(P.regAcc);P.regAcc-=n;RUN.hp=Math.min(RUN.maxHp,RUN.hp+n);updHud()}}
  if(perk('bshield')&&!P.shieldUp){P.shieldT-=dt;if(P.shieldT<=0){P.shieldUp=true;ringFx(P.x,P.z,1.2,'#e8d9a8',.3)}}
  if(P.shieldUp){if(!P.shieldFx){P.shieldFx=glow('#e8d9a8',2.2,null,.35)}P.shieldFx.visible=true;P.shieldFx.position.set(P.x,1,P.z)}else if(P.shieldFx)P.shieldFx.visible=false;
  if(fighting()){if(perk('nova')){RUN.novaT=(RUN.novaT==null?3:RUN.novaT)-dt;if(RUN.novaT<=0){RUN.novaT=6;ringFx(P.x,P.z,3.5,'#9fe6ff',.45);emit(P.x,.5,P.z,'#9fe6ff',24,4,.5,{flat:1});for(const e of enemies){if(e.dead)continue;if(Math.hypot(e.x-P.x,e.z-P.z)<3.5+e.r){e.slowT=Math.max(e.slowT,2);hitEnemy(e,S.atk*.8*S.elemM,0,'#9fe6ff',{noCrit:true,src:'aoe'})}}}}
    if(perk('L_storm')){RUN.stormT=(RUN.stormT==null?2:RUN.stormT)-dt;if(RUN.stormT<=0){RUN.stormT=4;const live=enemies.filter(e=>!e.dead&&e.state!=='rise');for(let k=0;k<3&&live.length;k++){const e=live.splice(Math.floor(Math.random()*live.length),1)[0];zap(e.x+rnd(-.5,.5),9,e.z,e.x,1,e.z,'#bfe8ff');lightFlash(e.x,e.z,'#bfe8ff',2);hitEnemy(e,S.atk*2*S.elemM,0,'#bfe8ff',{noCrit:true,src:'chain'})}}}}
  // 主動技冷卻
  for(const a of RUN.acts){if(a.t>0)a.t=Math.max(0,a.t-dt)}updActBtns();
  checkInteract();
  P.c.root.position.set(P.x,0,P.z);P.c.root.rotation.y=P.yaw;P.sh.position.set(P.x,.02,P.z);pLight.position.set(P.x,2.2,P.z+.5);
  P.c.root.visible=!(P.inv>0&&P.inv<.5&&Math.floor(G.time*24)%2)}

/* ================= 主動技 ================= */
function castActive(i){if(!RUN||G.paused||P.dead)return;const a=RUN.acts[i];if(!a||a.t>0)return;if(!(fighting()||RUN.state==='door'||RUN.state==='clear'))return;
  const S=RUN.st,def=D.ACTIVES.find(x=>x.id===a.id);a.t=def.cd;track('active');RUN.actUsed=(RUN.actUsed||0)+1;
  if(a.id==='burst'){ringShot(24,1,'#c38cff');P.inv=Math.max(P.inv,1);once(P.c,'Spellcast_Raise',1.6);lightFlash(P.x,P.z,'#c38cff',3)}
  else if(a.id==='march'){for(let k=0;k<4;k++){const ang=k/4*TAU;spawnAlly('march',P.x+Math.sin(ang)*1.4,P.z+Math.cos(ang)*1.4,10)}once(P.c,'Spellcast_Raise',1.6)}
  else if(a.id==='blizzard'){ringFx(P.x,P.z,12,'#9fe6ff',.7);lightFlash(P.x,P.z,'#9fe6ff',4);shake=.3;for(const e of enemies){if(e.dead)continue;e.stunT=2.5;e.slowT=Math.max(e.slowT,4);emit(e.x,1,e.z,'#eafaff',10,2,.6);hitEnemy(e,S.atk*1.5*S.elemM,0,'#9fe6ff',{noCrit:true,src:'aoe'})}once(P.c,'Spellcast_Raise',1.6)}
  else if(a.id==='step'){let[ix,iz]=inputDir();if(Math.hypot(ix,iz)<.15){ix=Math.sin(P.yaw);iz=Math.cos(P.yaw)}const l=Math.hypot(ix,iz),ox=P.x,oz=P.z;for(let k=0;k<25;k++)moveEnt(P,ix/l*.2,iz/l*.2,.38);
    explode(ox,oz,2,S.atk*1.2,'#9fb4ff','step');emit(P.x,1,P.z,'#9fb4ff',20,3,.5);P.inv=Math.max(P.inv,.6)}
  updActBtns()}
