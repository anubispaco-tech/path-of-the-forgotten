/* 被遺忘者之路 · 輸入、主迴圈、啟動 */
'use strict';
/* ================= 介面事件 ================= */
document.addEventListener('click',e=>{const b=e.target.closest('.styleSeg button');if(b)setStyle(b.dataset.s)});
$('modal').addEventListener('pointerdown',e=>{if(e.target===$('modal'))closeModal()});
document.querySelectorAll('.hubNav button').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
$('pauseBtn').addEventListener('click',openPause);
$('resumeBtn').addEventListener('click',()=>{$('pause').hidden=true;G.paused=false;later(.1,processQueue)});
$('quitBtn').addEventListener('click',()=>{$('pause').hidden=true;if(RUN){RUN.state='dead';endRun(false)}});
$('saveQuitBtn').addEventListener('click',()=>{$('pause').hidden=true;if(RUN){snapRun();toHub();toast('已保存，回到營地後可從出征頁繼續')}});
document.querySelectorAll('#qSeg button').forEach(b=>b.addEventListener('click',()=>{SAVE.q=b.dataset.q;save();applyQuality();document.querySelectorAll('#qSeg button').forEach(x=>x.classList.toggle('on',x===b))}));

/* ================= 輸入 ================= */
const joyEl=$('joy'),joyK=$('joyK');
function joyReset(){joy.id=null;joy.x=joy.y=0;joyEl.classList.remove('on');keys.clear()}
cvs.addEventListener('pointerdown',e=>{if(G.mode!=='run'||G.paused||joy.id!==null)return;e.preventDefault();joy.id=e.pointerId;joy.ox=e.clientX;joy.oy=e.clientY;joy.x=joy.y=0;
  joyEl.style.left=e.clientX+'px';joyEl.style.top=e.clientY+'px';joyK.style.transform='';joyEl.classList.add('on')});
addEventListener('pointermove',e=>{if(e.pointerId!==joy.id)return;let dx=e.clientX-joy.ox,dy=e.clientY-joy.oy;const l=Math.hypot(dx,dy),m=48;if(l>m){dx=dx/l*m;dy=dy/l*m}joy.x=dx/m;joy.y=dy/m;joyK.style.transform=`translate(${dx}px,${dy}px)`});
const joyUp=e=>{if(e.pointerId===joy.id){joy.id=null;joy.x=joy.y=0;joyEl.classList.remove('on')}};
addEventListener('pointerup',joyUp);addEventListener('pointercancel',joyUp);
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){keys.add(k);e.preventDefault()}
  if(G.mode==='run'&&!e.repeat){if(k===' '||k==='e'){castActive(0);e.preventDefault()}if(k==='q')castActive(1)}
  if(k==='escape'||k==='p'){if(!$('pause').hidden){$('pause').hidden=true;G.paused=false}else openPause()}});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
addEventListener('blur',joyReset);document.addEventListener('visibilitychange',()=>{if(document.hidden){joyReset();if(G.mode==='run'&&RUN&&fighting())openPause()}});
document.addEventListener('contextmenu',e=>e.preventDefault());

/* ================= 主迴圈 ================= */
const clock=new T.Clock();
function step(dt){RUN.time+=dt;updTimers();updRun(dt);updPlayer(dt);updEnemies(dt);updAllies(dt);updBolts(dt);updEbolts(dt);updOrbs(dt);updLoot(dt);updTels(dt);updPuddles(dt);P.c.mixer.update(dt);for(const e of enemies)e.c.mixer.update(dt*(e.stunT>0?0:e.slowT>0?.6:1))}
function frame(){requestAnimationFrame(frame);let dt=Math.min(.05,clock.getDelta());G.time+=dt;
  if(banT>0){banT-=dt;if(banT<=0)$('banner').classList.remove('on')}if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').classList.remove('on')}
  if(G.mode==='run'&&RUN&&!G.paused)step(dt);
  else if(G.mode==='run'&&RUN&&RUN.state==='dead'){P.c.mixer.update(dt)}
  updWorld(dt);
  if(fxLightT>0){fxLightT-=dt;fxLight.intensity=Math.max(0,fxLight.intensity-dt*10)}
  shake=Math.max(0,shake-dt*1.6);updParts(dt);updRings(dt);updZaps(dt);updMotes(dt,G.time);updFloats(dt);updCam(G.mode==='run'?Math.min(1,dt*6):1);
  if(!window.__noRender)renderer.render(scene,camera)}

/* ================= 啟動 ================= */
function boot(){SAVE=loadSave()||newSave();ensureDaily();if(!SAVE.inv.length){const st=genGear(1,'weapon',null,{r:0});st.base=0;st.n=D.GEAR.weapon[0].n;SAVE.inv.push(st);SAVE.eq.weapon=st.id}save();
  applyQuality();resize();frame();
  loadCore((d,n)=>{$('loadFill').style.width=(d/n*100)+'%'}).then(()=>{buildHub();showHubScene(true);G.mode='title';$('load').hidden=true;$('title').hidden=false;camSnap()})
  .catch(err=>{$('loadTxt').textContent='模型載入失敗：'+err.message+'。請用 Live Server 或網址開啟，不要直接雙擊 index.html。';console.error(err)})}
$('startBtn').addEventListener('click',()=>{$('title').hidden=true;G.mode='hub';$('hub').hidden=false;
  if(SAVE.migrated){SAVE.migrated=false;save();showModal(h('div',{cls:'resHead'},h('small',null,'v0.5 改版'),h('h2',null,'副本大改版')),h('div',{cls:'lkNote'},
    h('p',null,'每章改成 30 間短房間，打怪會升級、隨時三選一；新增事件房、菁英、主動技、5 格裝備、合成、符文、召喚、每日任務。'),
    h('p',null,'舊裝備已轉成新的稀有度，並送你 150 魂晶當改版禮物。')),h('div',{cls:'row'},h('button',{type:'button',cls:'btn pri',on:{click:closeModal}},'開始')))}
  if(!SAVE.lookSet){switchTab('tabLook');toast('先塑造你的亡者')}else renderHub()});
boot();

/* 測試用掛勾（瀏覽器主控台可用） */
window.__pof={CAM,timers,tels,ebolts,setStyle,get G(){return G},get RUN(){return RUN},get SAVE(){return SAVE},P,enemies,allies,startRun,toHub,showChoice,processQueue,castActive,openBox,mergeAll,sweep,renderHub,switchTab,
  sim(sec,input){const dt=1/30;for(let i=0;i<sec*30;i++){if(input){joy.x=input[0];joy.y=input[1]}G.time+=dt;if(G.mode==='run'&&RUN&&!G.paused)step(dt)}joy.x=joy.y=0},
  fps(){return new Promise(r=>{let n=0;const t0=performance.now();const f=()=>{n++;if(performance.now()-t0<2000)requestAnimationFrame(f);else r(n/2)};requestAnimationFrame(f)})},
  orbsN(){return orbs.length},
  jump(n){if(RUN){RUN.state='trans';fadeTo(true).then(()=>enterRoom(n))}},
  pick(i){const b=document.querySelectorAll('#perkCards .pc:not(.off):not([disabled])');if(b.length)(b[i||0]||b[0]).click();else{const f=[...document.querySelectorAll('#perkFoot .btn:not([disabled])')];if(f.length)f[f.length-1].click()}},
  killAll(){for(const e of enemies)if(!e.dead)hitEnemy(e,1e7,0,null,{noCrit:true})},god(){if(RUN){RUN.god=true}},setSave(s){SAVE=Object.assign(newSave(),s);save()},
  give(id){applyPerk(id)},xp(v){gainXp(v)}};
