/* 被遺忘者之路 · 打擊感：合成音效、擊飛與碎骨、連殺
 * 不改原本的戰鬥程式，改用「包一層」的方式掛在 hitEnemy / killEnemy / explode / pickLoot / hurtP / gainXp 上
 * 參數集中在 D.RULES.juice（data/rules.js） */
'use strict';
const JU=()=>D.RULES.juice||{};

/* ================= 1. 音效（WebAudio 即時合成，不需要音檔） ================= */
const SFX={ctx:null,out:null,noise:null,last:{},voices:0};
function sfxOn(){return!SAVE||SAVE.sfx!==false}
function sfxInit(){if(SFX.ctx)return SFX.ctx;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
  try{const c=new AC();SFX.ctx=c;const comp=c.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=6;comp.connect(c.destination);
    SFX.out=c.createGain();SFX.out.gain.value=JU().vol||.55;SFX.out.connect(comp);
    const len=c.sampleRate*1,buf=c.createBuffer(1,len,c.sampleRate),d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;SFX.noise=buf}catch(e){SFX.ctx=null}
  return SFX.ctx}
// iOS／Chrome 需要使用者手勢才能出聲
// iPhone：audioSession 設成 playback，靜音開關打開也照樣有聲音（iOS 16.4+）
try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}
// 解鎖：在使用者手勢裡 resume，並播一段無聲緩衝（舊版 iOS 需要）；iOS 切回 App 時狀態會是 interrupted，不只 suspended
function sfxUnlock(){const c=sfxInit();if(!c)return;if(c.state!=='running'){try{c.resume()}catch(e){}}
  if(!SFX.unlocked){try{const b=c.createBuffer(1,1,22050),s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(0);SFX.unlocked=true}catch(e){}}}
['pointerdown','touchstart','touchend','keydown','click'].forEach(ev=>addEventListener(ev,sfxUnlock,{passive:true,capture:true}));
document.addEventListener('visibilitychange',()=>{if(!SFX.ctx)return;if(document.hidden){try{SFX.ctx.suspend()}catch(e){}}else{try{SFX.ctx.resume()}catch(e){}}});

function env(g,t,a,peak,dec){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+dec)}
function tone(type,f0,f1,dur,vol,t){const c=SFX.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+dur);env(g,t,.004,vol,dur);o.connect(g);g.connect(SFX.out);o.start(t);o.stop(t+dur+.05)}
function noise(fType,f0,f1,q,dur,vol,t){const c=SFX.ctx,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=SFX.noise;s.playbackRate.value=.8+Math.random()*.4;f.type=fType;f.frequency.setValueAtTime(f0,t);if(f1)f.frequency.exponentialRampToValueAtTime(f1,t+dur);f.Q.value=q||1;env(g,t,.003,vol,dur);s.connect(f);f.connect(g);g.connect(SFX.out);s.start(t,Math.random()*.5);s.stop(t+dur+.05)}
const SOUNDS={
  hit(t,k){noise('bandpass',1800*k,500,1.2,.07,.35,t);tone('sine',150*k,60,.08,.4,t)},
  crit(t,k){noise('highpass',3000,1500,.8,.09,.45,t);tone('square',900*k,300,.07,.12,t);tone('sine',110,45,.16,.7,t)},
  kill(t,k){noise('bandpass',2600*k,700,3,.12,.5,t);noise('bandpass',900,300,2,.18,.45,t+.015);tone('triangle',95*k,40,.2,.55,t)},
  elite(t){tone('sine',70,30,.55,.95,t);noise('lowpass',1400,120,.7,.5,.7,t);tone('sawtooth',220,55,.35,.12,t)},
  boom(t,k){noise('lowpass',1100*k,90,.8,.38,.6,t);tone('sine',85*k,32,.32,.6,t)},
  coin(t,k){tone('sine',1900*k,0,.07,.12,t);tone('sine',2850*k,0,.11,.08,t+.045)},
  shard(t){tone('triangle',1300,0,.12,.14,t);tone('triangle',1950,0,.18,.1,t+.06)},
  xp(t,k){tone('sine',650*k,1100*k,.06,.06,t)},
  lvl(t){[523,659,784,1047].forEach((f,i)=>tone('triangle',f,0,.22,.18,t+i*.07));noise('highpass',5000,0,1,.4,.06,t+.2)},
  hurt(t){tone('sawtooth',180,70,.18,.22,t);noise('lowpass',700,200,1,.15,.35,t)},
  streak(t,k){[0,4,7,12].forEach((s,i)=>tone('sawtooth',220*Math.pow(2,(s+k)/12),0,.3,.07,t+i*.05));tone('sine',55,40,.5,.6,t)},
  pick(t){tone('triangle',880,1320,.12,.12,t);tone('sine',1760,0,.18,.06,t+.08)}
};
// 節流：同一種聲音最短間隔（秒）；音高隨機微調避免機械感
const SFX_GAP={hit:.035,crit:.05,kill:.04,coin:.03,xp:.04,boom:.06,hurt:.12,shard:.05};
function sfx(name,k){if(!sfxOn()||!SFX.ctx)return;if(SFX.ctx.state!=='running'){try{SFX.ctx.resume()}catch(e){}if(SFX.ctx.state!=='running')return}const t=SFX.ctx.currentTime,gap=SFX_GAP[name]||0;
  if(gap&&t-(SFX.last[name]||0)<gap)return;SFX.last[name]=t;try{SOUNDS[name](t+.005,k||(.9+Math.random()*.2))}catch(e){}}

/* ================= 2. 擊飛與碎骨 ================= */
const DEB={list:[],geo:null,max:140};
function spawnDebris(x,y,z,n,col,dir,force){if(G.mode!=='run')return;const J=JU();n=Math.round(n*(J.debris==null?1:J.debris));if(n<=0)return;
  if(!DEB.geo)DEB.geo=new T.BoxGeometry(1,1,1);
  for(let i=0;i<n;i++){let b;if(DEB.list.length>=DEB.max){b=DEB.list.shift();scene.remove(b.m)}
    const m=new T.Mesh(DEB.geo,M(Math.random()<.25?'#b8a98a':col));const s=rnd(.1,.22);m.scale.set(s*rnd(.6,1.8),s,s*rnd(.6,1.4));m.castShadow=false;
    const a=dir+rnd(-1.1,1.1),sp=rnd(2,5.5)*force;m.position.set(x,y,z);scene.add(m);
    b={m,vx:Math.sin(a)*sp,vz:Math.cos(a)*sp,vy:rnd(2.5,6)*Math.min(1.6,force),rx:rnd(-12,12),rz:rnd(-12,12),t:0,life:rnd(2.2,3.2),rest:false};DEB.list.push(b)}}
function updDebris(dt){for(let i=DEB.list.length-1;i>=0;i--){const b=DEB.list[i],m=b.m;b.t+=dt;
  if(!b.rest){b.vy-=18*dt;m.position.x+=b.vx*dt;m.position.y+=b.vy*dt;m.position.z+=b.vz*dt;m.rotation.x+=b.rx*dt;m.rotation.z+=b.rz*dt;
    if(m.position.x<-HX+.2||m.position.x>HX-.2){b.vx*=-.4;m.position.x=clamp(m.position.x,-HX+.2,HX-.2)}if(m.position.z<-HZ+.2||m.position.z>HZ-.2){b.vz*=-.4;m.position.z=clamp(m.position.z,-HZ+.2,HZ-.2)}
    if(m.position.y<.04){m.position.y=.04;if(Math.abs(b.vy)<1.2){b.rest=true}else{b.vy=-b.vy*.32;b.vx*=.55;b.vz*=.55;b.rx*=.5;b.rz*=.5}}}
  if(b.t>b.life){const k=1-(b.t-b.life)/.6;if(k<=0){scene.remove(m);DEB.list.splice(i,1);continue}m.scale.multiplyScalar(.94)}}}
function clearDebris(){for(const b of DEB.list)scene.remove(b.m);DEB.list.length=0}

/* ================= 3. 連殺 ================= */
const STK={n:0,t:0,best:0,el:null,tier:0};
function stkEl(){if(STK.el)return STK.el;const e=h('div',{id:'streak',hidden:true},h('b',null,''),h('small',null,'連殺'));$('hud').append(e);STK.el=e;return e}
function stkKill(e){const J=JU().streak||{},win=J.window||2.6;const now=RUN.time;
  if(now-STK.t>win){stkEnd();STK.n=0;STK.tier=0}STK.n++;STK.t=now;STK.best=Math.max(STK.best,STK.n);RUN.bestStreak=Math.max(RUN.bestStreak||0,STK.n);
  const el=stkEl();if(STK.n>=(J.show||5)){el.hidden=false;el.firstChild.textContent='×'+STK.n;el.style.setProperty('--sc',STK.n>=50?'#ff4a6a':STK.n>=25?'#ffa53a':STK.n>=10?'#ffd04a':'#e8e0d0');el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop')}
  const ms=(J.miles||[10,25,50,100]);const idx=ms.indexOf(STK.n);
  if(idx>=0){STK.tier=idx+1;const names=J.names||['屠戮','血洗','亡者狂潮','天災降臨'],gold=(J.gold||[6,15,30,60])[idx];
    banner(names[idx]+' ×'+STK.n,'獎勵金幣 +'+gold,STK.n>=50?'#ff4a6a':'#ffd04a');sfx('streak',idx*2);
    for(let i=0;i<Math.min(24,gold);i++)later(i*.02,()=>{if(RUN&&!RUN.ended)dropLoot('gold',P.x+rnd(-.5,.5),P.z+rnd(-.5,.5),Math.ceil(gold/Math.min(24,gold)))});
    ringFx(P.x,P.z,3+idx,STK.n>=50?'#ff4a6a':'#ffd04a',.5);shake=Math.max(shake,.15+idx*.05);tel('streak',{n:STK.n})}}
function stkEnd(){if(STK.el)STK.el.hidden=true}
function stkTick(){if(STK.n&&RUN&&RUN.time-STK.t>((JU().streak||{}).window||2.6)){if(STK.n>=10)floatTxt(P.x,2.8,P.z,'連殺 ×'+STK.n,'#ffd04a','crit');stkEnd();STK.n=0;STK.tier=0}}

/* ================= 包住原本的函式 ================= */
const _hitEnemy=hitEnemy;
hitEnemy=function(e,base,a,col,o){if(!e||e.dead)return _hitEnemy(e,base,a,col,o);const hp0=e.hp,max=e.max,src=o&&o.src;
  e.__hp0=hp0;e.__dir=a;_hitEnemy(e,base,a,col,o);const dealt=hp0-Math.max(0,e.hp);
  if(!e.dead&&src!=='dot'){const big=dealt>max*.25;sfx(big?'crit':'hit',big?1:(.85+Math.random()*.3));
    if(src!=='dot'&&!e.boss&&!e.elite&&e.state!=='charge'){const kb=(JU().knock||1)*(src==='aoe'||src==='corpse'?1.2:.6);e.kx+=Math.sin(a||0)*kb;e.kz+=Math.cos(a||0)*kb}}};
const _killEnemy=killEnemy;
killEnemy=function(e,src){const a=e.__dir!=null?e.__dir:Math.atan2(e.x-P.x,e.z-P.z),over=(e.__hp0!=null&&e.hp<-e.max*((JU().overkill)||.6))||src==='aoe'&&Math.random()<.3;_killEnemy(e,src);
  const J=JU(),big=e.boss||e.elite,col=e.d.debris||'#e8dcc0',y=.6+(e.d.fly||0)*.6;
  // 擊飛：屍體沿受擊方向飛出（首領不飛）
  if(!e.boss){const f=(over?1.8:1)*(e.elite?.5:1)*(J.fly||1);e.flyVx=Math.sin(a)*7*f;e.flyVz=Math.cos(a)*7*f;e.flyVy=over?4:2}
  spawnDebris(e.x,y,e.z,(e.boss?26:e.elite?14:over?12:6)*(e.small?.6:1),col,a,over||big?1.5:1);
  if(over&&!big){emit(e.x,.9,e.z,col,14,4.5,.4,{gr:4});floatTxt(e.x,2.1+e.d.scale,e.z,'粉碎','#fff1c0','crit');shake=Math.max(shake,.1)}
  sfx(big?'elite':'kill',over?.8:(.9+Math.random()*.25));if(over||big)try{navigator.vibrate&&navigator.vibrate(big?40:12)}catch(err){}
  stkKill(e)};
const _explode=explode;
explode=function(x,z,r,dmg,col,kind,skip){sfx('boom',r>2.5?.75:1);return _explode(x,z,r,dmg,col,kind,skip)};
const _pickLoot=pickLoot;
pickLoot=function(l){_pickLoot(l);if(l.kind==='gold')sfx('coin');else if(l.kind==='xp')sfx('xp',.9+Math.min(.6,(RUN.xp/RUN.need)*.6));else sfx('shard')};
const _hurtP=hurtP;
hurtP=function(d,s,dot){const hp0=RUN&&RUN.hp;_hurtP(d,s,dot);if(RUN&&RUN.hp<hp0&&!dot){sfx('hurt');try{navigator.vibrate&&navigator.vibrate(25)}catch(e){}}};
const _gainXp=gainXp;
gainXp=function(v,q){const l0=RUN&&RUN.rlv;_gainXp(v,q);if(RUN&&RUN.rlv>l0)sfx('lvl')};
const _pickPerk=pickPerk;
pickPerk=function(p,k){sfx('pick');return _pickPerk(p,k)};
const _updEnemies=updEnemies;
updEnemies=function(dt){_updEnemies(dt);for(const e of enemies){if(!e.dead||e.flyVx==null)continue;const r=e.c.root;
  if(e.t<.45){const k=Math.max(0,1-e.t/.45);let nx=r.position.x+e.flyVx*dt*k,nz=r.position.z+e.flyVz*dt*k;nx=clamp(nx,-HX+.4,HX-.4);nz=clamp(nz,-HZ+.4,HZ-.4);r.position.x=nx;r.position.z=nz;
    e.flyVy-=14*dt;r.position.y=Math.max(e.d.fly||0,r.position.y+e.flyVy*dt*k)}}
  updDebris(dt);stkTick()};
const _clearCombat=clearCombat;
clearCombat=function(){_clearCombat();clearDebris()};
const _beginRun=beginRun;
beginRun=function(st,o){STK.n=0;STK.best=0;STK.tier=0;stkEnd();return _beginRun(st,o)};

/* 暫停選單：音效開關 */
(()=>{const box=document.querySelector('#pause .qrow');if(!box)return;const row=h('div',{cls:'qrow'},h('span',null,'音效'),h('div',{cls:'seg',id:'sfxSeg'},
    h('button',{type:'button','data-v':'on'},'開'),h('button',{type:'button','data-v':'off'},'關')));box.parentNode.insertBefore(row,box);
  const sync=()=>row.querySelectorAll('button').forEach(b=>b.classList.toggle('on',(b.dataset.v==='on')===sfxOn()));
  row.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!SAVE)return;SAVE.sfx=b.dataset.v==='on';save();sync();if(SAVE.sfx){sfxInit();sfx('pick')}});
  addEventListener('load',()=>setTimeout(sync,600));$('pauseBtn').addEventListener('click',sync)})();
