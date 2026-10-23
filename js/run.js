/* 被遺忘者之路 · 副本流程：房間、波次、局內經驗、三選一、事件房、結算、續玩
 * 主線章節 30 間：第 5、15、25 間事件房，第 10、20 間菁英房，第 30 間首領（data/rules.js 可改） */
'use strict';
const RL=D.RULES;
function stageLv(st){if(st.type==='main')return st.lv;let best=st.lv;for(const s of D.STAGES)if(s.type==='main'&&SAVE.clear[s.id])best=Math.max(best,s.lv+2);return best}
function roomType(n){if(RUN.stage.type==='mat')return n===RUN.total?'elite':'battle';if(n===RUN.total)return'boss';if(RL.eventRooms.includes(n))return'event';if(RL.eliteRooms.includes(n))return'elite';return'battle'}
function xpNeedRun(l){return Math.round(RL.runXp.base+RL.runXp.per*l)}
function stageAssets(st){const keys=new Set(themeAssets(st.theme));const add=k=>{const d=D.ENEMIES[k];if(!d)return;keys.add(d.model);if(d.wr)keys.add(d.wr);if(d.wl)keys.add(d.wl);if(d.minion)add(d.minion)};
  for(const[k]of(st.pool||[]).concat(st.late||[]))add(k);for(const k of st.elite||[])add(k);[].concat(st.boss||[]).forEach(add);
  ['chest_gold','table_long_broken','coin_stack_small','candle_triple','pillar','floor_tile_large'].forEach(n=>keys.add(assetKey(n)));return[...keys]}

/* ================= 開始、續玩 ================= */
function startRun(stageId,o){o=o||{};const st=D.STAGES.find(s=>s.id===stageId);if(!st)return;
  if(st.type==='mat'&&!o.resume){if(matLeft(st)<=0){toast('今天的挑戰次數用完了');return}useMat(st)}
  $('fadeTxt').textContent='載入中…';fadeTo(true).then(()=>ensureAssets(stageAssets(st),(d,n)=>{$('fadeTxt').textContent=`載入素材 ${d} / ${n}`})).then(()=>{$('fadeTxt').textContent='';beginRun(st,o)})}
function beginRun(st,o){const snap=o.resume||null,diff=D.DIFFS.find(d=>d.id===(snap?snap.diff:o.diff||'n'))||D.DIFFS[0],base=baseStats();
  RUN={stage:st,diff,lv:stageLv(st),total:st.type==='main'?RL.rooms:RL.matRooms,roomN:0,perks:{},curses:[],gold:0,shards:0,dust:0,crystals:0,kills:0,elites:0,time:0,cleared:0,
    rerolls:base.rerolls,revived:false,phoenix:false,state:'enter',base,seed:(Math.random()*1e9)|0,dmgDone:0,rlv:1,xp:0,need:xpNeedRun(1),cq:[],choosing:false,picks:0,chest:[],runeLoot:[],ev:{},acts:[],actUsed:0};
  const R=seeded(RUN.seed^0x5f3);let last='';for(const n of RL.eventRooms){let e;do{e=wpick(D.EVENTS.map(x=>[x.id,x.w]),R)}while(e===last);RUN.ev[n]=last=e}
  RUN.acts=(SAVE.actEq||[]).filter(id=>unlocked('act:'+id)).slice(0,unlocked('slot:act2')?2:1).map(id=>({id,t:0}));
  if(snap){for(const k of['perks','curses','gold','shards','dust','crystals','kills','elites','time','cleared','rerolls','revived','phoenix','seed','rlv','xp','chest','ev','picks'])if(snap[k]!=null)RUN[k]=JSON.parse(JSON.stringify(snap[k]));RUN.need=xpNeedRun(RUN.rlv)}
  runStats();RUN.hp=snap?Math.max(1,Math.round(RUN.maxHp*snap.hpK)):RUN.maxHp;if(!snap){SAVE.runs++;save()}
  showHubScene(false);$('hub').hidden=true;$('title').hidden=true;$('hud').hidden=false;$('hudStage').textContent=st.ch+' · '+st.name+(diff.id!=='n'?' · '+diff.n:'');$('hudStage').style.color=diff.id!=='n'?diff.col:'';
  if(!P.c){P.c=makeHero(.78)}if(!P.sh)P.sh=shadowFor(.5);scene.add(P.c.root);P.c.root.visible=true;P.sh.visible=true;P.shieldUp=false;P.amb=false;P.atkN=0;
  P.dead=false;P.c.one=null;P.c.cur='';play(P.c,'Idle_Combat',0);G.mode='run';G.paused=false;clearAllies();buildActBtns();
  enterRoom(snap?snap.roomN:1).then(()=>{if(snap){toast('從第 '+RUN.roomN+' 間繼續');syncAllies();return}
    const b=RUN.base,give=(rar,label)=>{const p=rollPerks(1,{only:rar})[0];if(p){applyPerk(p.id,true);setTimeout(()=>toast(label+'：獲得「'+p.n+'」'),900)}};
    if(b.fx.has('fx_orb'))applyPerk('orbit',true);if(tal('t_start'))give('c','先知');if(milestone('ms_rare'))give('r','亡者的饋贈');if(milestone('ms_epic'))give('e','不朽傳承')});
  $('joyHint').style.opacity='1';setTimeout(()=>$('joyHint').style.opacity='0',4500)}
function snapRun(){if(!RUN||RUN.ended)return;const s={id:RUN.stage.id,diff:RUN.diff.id,roomN:RUN.roomN,hpK:clamp(RUN.hp/RUN.maxHp,.05,1),at:Date.now()};
  for(const k of['perks','curses','gold','shards','dust','crystals','kills','elites','time','cleared','rerolls','revived','phoenix','seed','rlv','xp','chest','ev','picks'])s[k]=RUN[k];SAVE.run=s;save()}

/* ================= 房間 ================= */
function enterRoom(n){RUN.roomN=n;RUN.wave=0;RUN.state='enter';RUN.waves=null;RUN.roomT=0;RUN.forced=false;clearCombat();const type=roomType(n),evId=type==='event'?RUN.ev[n]:null;RUN.type=type;
  buildRoom(RUN.stage.theme,RUN.seed+n*977,{boss:type==='boss',event:evId,elite:type==='elite'});room.g.visible=true;syncOrbs();
  P.x=0;P.z=HZ-2.2;P.yaw=Math.PI;P.c.root.position.set(P.x,0,P.z);P.c.root.rotation.y=P.yaw;P.queue.length=0;P.atkT=.4;placeAllies();syncAllies();
  if(RUN.base.runeSet.def>=4)P.shieldUp=true;
  pLight.intensity=.9;camSnap();snapRun();updHud();
  const lab=type==='boss'?'首領':type==='elite'?'菁英':type==='event'?D.EVENTS.find(e=>e.id===evId).n:'';
  $('hudFloor').textContent=`第 ${n} / ${RUN.total} 間`+(lab?' · '+lab:'');$('hudFloor').className=type;
  const th=D.THEMES[RUN.stage.theme];
  if(type==='event'){const ev=D.EVENTS.find(e=>e.id===evId);return fadeTo(false).then(()=>{banner(ev.n,ev.d,ev.col);later(.5,()=>{if(RUN&&RUN.roomN===n&&RUN.state==='enter'){RUN.state='event';processQueue()}})})}
  RUN.waves=genWaves(n,type);
  return fadeTo(false).then(()=>{if(type==='boss'){const b=[].concat(RUN.stage.boss).map(k=>D.ENEMIES[k].n).join(' & ');banner('首領之間',b,'#ff8a4a')}else if(type==='elite')banner('菁英之間','擊敗菁英，獲得稀有以上技能','#ffd04a');else if(n===1)banner(RUN.stage.name,RUN.stage.ch,th.torch);
    later(type==='boss'?1.3:type==='elite'?1:.45,()=>{if(RUN&&RUN.roomN===n&&RUN.state==='enter'){RUN.state='fight';spawnWave();later(.5,processQueue)}})})}
function genWaves(n,type){const st=RUN.stage,R=seeded(RUN.seed+n*131),df=RUN.diff;
  const pool=(st.pool||[]).concat(n>=12||st.type==='mat'?st.late||[]:[]);const cost=k=>D.ENEMIES[k].cost||1;
  const fill=b=>{const out={};let guard=0;while(b>.4&&guard++<40){const ok=pool.filter(([k])=>cost(k)<=b+.5);const k=ok.length?wpick(ok,R):pool.reduce((a,c)=>cost(c[0])<cost(a[0])?c:a)[0];out[k]=(out[k]||0)+1;b-=cost(k)}
    return Object.entries(out).map(([k,c])=>({k,n:c,aff:df.affix}))};
  if(type==='boss')return[[].concat(st.boss).map(k=>({k,n:1}))];
  const budget=st.type==='mat'?3+n*.8:RL.roomBudget.base+RL.roomBudget.per*n;
  if(type==='elite'){const ek=st.elite[Math.floor(R()*st.elite.length)];return[[{k:ek,n:1,elite:true}].concat(fill(budget*.45))]}
  if(n>=8&&R()<.35)return[fill(budget*.62),fill(budget*.5)];
  return[fill(budget)]}
function spawnWave(){const w=RUN.waves&&RUN.waves[RUN.wave];if(!w)return;const spots=[];
  for(const g of w)for(let i=0;i<g.n;i++){let x,z,tries=0;do{x=rnd(-HX+1.2,HX-1.2);z=rnd(-HZ+1.5,3);tries++}while(tries<60&&(Math.hypot(x-P.x,z-P.z)<6||blocked(x,z,.6)||spots.some(s=>Math.hypot(s[0]-x,s[1]-z)<1.6)));
    const d=D.ENEMIES[g.k];if(d.boss){const twin=w.filter(q=>D.ENEMIES[q.k].boss).length>1;x=twin?(spots.length?2.6:-2.6):0;z=-5}spots.push([x,z]);
    const aff=g.elite?rollAffixes(RUN.diff.id==='n'?1:2):(g.aff&&Math.random()<g.aff?rollAffixes(1):[]);spawnEnemy(g.k,x,z,{elite:g.elite,aff})}}
function waveCleared(){if(!RUN||!(RUN.state==='fight'||RUN.state==='ritual'))return;if(enemies.some(o=>!o.dead))return;
  if(RUN.waves&&RUN.wave<RUN.waves.length-1){RUN.wave++;banner('下一波','敵人逼近','#ff8a4a');later(.9,()=>{if(RUN&&RUN.state==='fight')spawnWave()});return}
  const wasRitual=RUN.state==='ritual';RUN.state='clear';for(const l of loot)l.mag=true;RUN.cleared++;track('room');
  if(RUN.type==='boss'||(RUN.stage.type==='mat'&&RUN.roomN===RUN.total)){later(.6,()=>{RUN.state='won';banner('副本完成',RUN.stage.name,'#e2b84d');once(P.c,'Cheer');later(2.2,()=>endRun(true))});return}
  if(wasRitual){const ok=RUN.ritT>0;$('hudTimer').hidden=true;if(ok){banner('儀式完成','選擇一項傳說技能','#c38cff');RUN.cq.push('legend')}else banner('儀式結束','時間到了，祭壇沉寂了','#8a8090')}
  if(RUN.type==='elite')RUN.cq.push('elite');
  later(.7,()=>{processQueue();tryOpenDoor()})}
function tryOpenDoor(){if(!RUN||RUN.state!=='clear')return;if(RUN.choosing||RUN.cq.length){later(.3,tryOpenDoor);return}openDoor()}
function openDoor(){RUN.state='door';room.gateOpen=.001;banner('通道開啟','向北前進',room.theme.torch);emit(0,1.5,-HZ+.2,room.theme.torch,30,3,1,{up:1})}
function checkInteract(){if(RUN.state==='event'&&Math.hypot(P.x-SHRINE.x,P.z-SHRINE.z)<2.6){RUN.state='eventOpen';openEvent(RUN.ev[RUN.roomN])}
  if(RUN.state==='door'&&P.z<-HZ+.9&&Math.abs(P.x)<GATE.w/2+.4){RUN.state='trans';fadeTo(true).then(()=>{if(RUN)enterRoom(RUN.roomN+1)})}}
function clearCombat(){timers.length=0;for(const e of enemies){disposeChar(e.c);scene.remove(e.sh);if(e.shFx)scene.remove(e.shFx);if(e.aura)scene.remove(e.aura);if(e.beam)scene.remove(e.beam)}enemies.length=0;for(const b of bolts)scene.remove(b.m);bolts.length=0;clearEbolts();
  for(const l of loot){if(l.kind==='xp'&&RUN&&!RUN.ended)gainXp(l.v*RUN.st.xpM,true);else if(RUN&&!RUN.ended)pickLoot(l);scene.remove(l.m)}loot.length=0;clearTels();clearPuddles();for(const o of orbs)scene.remove(o.m);orbs.length=0;$('bossBar').hidden=true;$('hudTimer').hidden=true;clearFloats()}
function updRun(dt){if(RUN.state==='fight'){RUN.roomT=(RUN.roomT||0)+dt;if(RUN.roomT>70&&!RUN.forced){RUN.forced=true;for(const e of enemies)if(!e.dead)e.force=true}
    if(RUN.roomT>110){RUN.decayT=(RUN.decayT||0)+dt;if(RUN.decayT>=1){RUN.decayT=0;for(const e of enemies)if(!e.dead&&!e.d.boss)hitEnemy(e,e.max*.08,null,'#9a8cff',{noCrit:true})}}}
  if(RUN.state==='ritual'){RUN.ritT-=dt;const s=Math.max(0,Math.ceil(RUN.ritT));$('hudTimer').textContent=s>0?`儀式 ${s} 秒`:'時間到';$('hudTimer').classList.toggle('late',RUN.ritT<6)}}

/* ================= 局內經驗、升級 ================= */
function gainXp(v,quiet){if(!RUN||RUN.ended)return;RUN.xp+=v;let up=0;while(RUN.xp>=RUN.need){RUN.xp-=RUN.need;RUN.rlv++;RUN.need=xpNeedRun(RUN.rlv);RUN.cq.push('lv');up++}
  if(up){healP(Math.round(RUN.maxHp*.1*up),true)}
  if(up&&!quiet){floatTxt(P.x,2.8,P.z,'升級！','#9dff6a','big');ringFx(P.x,P.z,2.4,'#9dff6a',.5);emit(P.x,1,P.z,'#9dff6a',24,3,.7,{up:2});later(.35,processQueue)}updXp()}
function processQueue(){if(!RUN||RUN.ended||RUN.choosing||RUN.state==='dead'||RUN.state==='won'||!$('pause').hidden)return;const k=RUN.cq.shift();if(!k)return;
  if(k==='lv')showChoice({kind:'lv',sub:`局內等級 Lv ${RUN.rlv}`,title:'升級！選擇一項技能'});
  else if(k==='elite')showChoice({kind:'elite',sub:'菁英擊敗',title:'選擇一項稀有技能',minRar:'r',legend:.35});
  else if(k==='legend')showChoice({kind:'legend',sub:'儀式完成',title:'選擇一項傳說技能',onlyLegend:true})}

/* ================= 三選一 ================= */
const RAR_ORDER={c:0,r:1,e:2,l:3};
function evoReady(p){return p.need.every(([id,lv])=>perk(id)>=lv)}
function evoHint(p){if(p.evo)return null;for(const e of D.PERKS){if(!e.evo||perk(e.id))continue;if(!e.need.some(([id])=>id===p.id))continue;const others=e.need.filter(([id])=>id!==p.id);if(others.some(([id])=>perk(id)>0))return e.n}return null}
function rollPerks(n,o){o=o||{};const out=[],lvl=RUN.rlv||1,b=RUN.base;
  if(o.onlyLegend||o.only==='l'){const pool=D.PERKS.filter(p=>p.rar==='l'&&!p.evo&&perk(p.id)<p.max);while(out.length<n&&pool.length)out.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);return out}
  const pool=D.PERKS.filter(p=>p.w!==0&&perk(p.id)<p.max&&(p.evo?evoReady(p):p.rar!=='l')&&(!o.only||p.rar===o.only)&&(!o.minRar||RAR_ORDER[p.rar]>=RAR_ORDER[o.minRar]));
  const w=p=>{if(p.evo)return 45;const r=D.PERK_RAR[p.rar];let x=r.w+(p.rar==='e'?lvl*1.2:p.rar==='r'?lvl*.8:0);if(b.runeSet.ele>=4&&p.sch==='ele')x*=2;if(perk(p.id))x*=1.25;return x};
  if(!o.minRar&&!o.only&&RUN.hp<RUN.maxHp*.45&&Math.random()<.6)out.push(D.PERKS.find(p=>p.id==='heal'));
  if(o.legend&&Math.random()<o.legend){const L=D.PERKS.filter(p=>p.rar==='l'&&!p.evo&&perk(p.id)<p.max);if(L.length)out.push(pick(L))}
  while(out.length<n&&pool.length){let tw=0;for(const p of pool)tw+=w(p);let r=Math.random()*tw,i=0;for(;i<pool.length;i++){r-=w(pool[i]);if(r<=0)break}const p=pool.splice(Math.min(i,pool.length-1),1)[0];if(!out.includes(p))out.push(p)}return out}
function perkCard(p,o){o=o||{};const cur=perk(p.id),rar=D.PERK_RAR[p.rar],sch=D.SCHOOLS[p.sch],hint=evoHint(p);
  return h('button',{type:'button',cls:'pc r-'+p.rar+(p.evo?' evo':'')+(o.disabled?' off':''),disabled:!!o.disabled,style:`--pc:${p.rar==='c'?sch.col:rar.col};--sc:${sch.col}`,on:{click:o.click}},
    h('div',{cls:'ic'},svg(p.icon)),h('div',{cls:'tags'},h('i',{style:'color:'+sch.col},sch.n),h('i',{style:'color:'+rar.col},p.evo?'進化':rar.n)),h('b',null,p.n),h('span',null,p.d),
    o.extra?h('span',{cls:'ex'},o.extra):null,hint?h('span',{cls:'hint'},'可解鎖進化「'+hint+'」'):null,
    p.max>1&&p.max<99?h('em',null,`Lv ${cur} → ${cur+1}`):null,o.price!=null?h('strong',{cls:'price'+(RUN.gold<o.price?' no':'')},svg('gold'),o.price):null)}
function openChoice(sub,title){G.paused=true;RUN.choosing=true;banT=0;$('banner').classList.remove('on');$('perkSub').textContent=sub;$('perkBox_h').textContent=title;$('perkCards').replaceChildren();$('rerollBtn').hidden=true;$('perkFoot').replaceChildren();$('perk').hidden=false;joyReset()}
function closeChoice(){$('perk').hidden=true;RUN.choosing=false;G.paused=false;later(.15,processQueue)}
function showChoice(o){openChoice(o.sub,o.title);const list=rollPerks(3,o);if(!list.length){closeChoice();return}RUN.lastChoice=o;
  list.forEach(p=>$('perkCards').append(perkCard(p,{click:()=>pickPerk(p)})));
  $('rerollBtn').hidden=RUN.rerolls<=0||o.kind==='legend';$('rerollN').textContent=RUN.rerolls}
$('rerollBtn').addEventListener('click',()=>{if(RUN&&RUN.rerolls>0&&RUN.lastChoice){RUN.rerolls--;showChoice(RUN.lastChoice)}});
function pickPerk(p,keepOpen){if(!keepOpen)closeChoice();applyPerk(p.id);ringFx(P.x,P.z,3,p.rar==='c'?D.SCHOOLS[p.sch].col:D.PERK_RAR[p.rar].col,.6);emit(P.x,1,P.z,D.SCHOOLS[p.sch].col,30,3,.8,{up:2});once(P.c,'Spellcast_Raise',1.4)}
function applyPerk(id,silent){if(id==='heal'){healP(Math.round(RUN.maxHp*.4));return}RUN.perks[id]=(RUN.perks[id]||0)+1;if(!silent){RUN.picks++;track('pick')}
  const p=D.PERKS.find(x=>x.id===id);if(p&&p.evo){track('evo');banner('進化','「'+p.n+'」','#ffa53a')}
  const before=RUN.maxHp;runStats();if(id==='hp')RUN.hp+=RUN.maxHp-before;RUN.hp=Math.min(RUN.hp,RUN.maxHp);if(id==='bshield')P.shieldUp=true;syncOrbs();syncAllies();updHud()}

/* ================= 事件房 ================= */
function priceM(){return 1+(RUN.lv-1)*.25}
function openEvent(id){const ev=D.EVENTS.find(e=>e.id===id),box=()=>$('perkCards'),leave=(txt)=>h('button',{type:'button',cls:'btn ghost',on:{click:()=>{closeChoice();openDoor()}}},txt||'離開');
  const heal=Math.round(RUN.maxHp*.5*(1+tal('t_heal')*.1));
  if(id==='fire'){openChoice(ev.n,'在火邊稍作停留');
    box().append(h('button',{type:'button',cls:'pc',style:'--pc:#93d95e',on:{click:()=>{closeChoice();healP(heal);ringFx(P.x,P.z,3,'#93d95e',.6);openDoor()}}},h('div',{cls:'ic'},svg('heal')),h('b',null,'回復生命'),h('span',null,`回復 50% 最大生命`)),
      h('button',{type:'button',cls:'pc',style:'--pc:#c38cff',on:{click:()=>{showChoice({kind:'fire',sub:ev.n,title:'汲取營火的力量'});const done=()=>{if(RUN.choosing){later(.2,done);return}openDoor()};later(.2,done)}}},h('div',{cls:'ic'},svg('xp')),h('b',null,'汲取力量'),h('span',null,'從三項技能中選擇一項')));return}
  if(id==='shop'){const pm=priceM(),stock=rollPerks(3,{}).filter(p=>p.id!=='heal').slice(0,3);const draw=()=>{openChoice(ev.n,'「金幣換力量，亡者也講規矩。」');$('perkSub').textContent=`${ev.n} · 你有 ${RUN.gold} 金幣`;
      stock.forEach(p=>{const price=Math.round(D.SHOP.perk[RAR_ORDER[p.rar]]*pm);box().append(perkCard(p,{price,disabled:RUN.gold<price||p.sold,click:()=>{if(RUN.gold<price)return;RUN.gold-=price;p.sold=1;applyPerk(p.id);emit(P.x,1,P.z,'#e2b84d',20,3,.6,{up:2});draw()}}))});
      const pp=Math.round(D.SHOP.potion*pm),rp=Math.round(D.SHOP.reroll*pm);
      $('perkFoot').append(h('button',{type:'button',cls:'btn',disabled:RUN.gold<pp||RUN.hp>=RUN.maxHp,on:{click:()=>{RUN.gold-=pp;healP(Math.round(RUN.maxHp*.35*(1+tal('t_heal')*.1)));draw()}}},`藥水（回復 35%）· ${pp} 金`),
        h('button',{type:'button',cls:'btn',disabled:RUN.gold<rp,on:{click:()=>{RUN.gold-=rp;RUN.rerolls++;toast('重抽次數 +1');draw()}}},`重抽 +1 · ${rp} 金`),leave());updHud()};draw();return}
  if(id==='curse'){openChoice(ev.n,'力量的代價');const L=rollPerks(3,{onlyLegend:true});const free=D.CURSES.filter(c=>!RUN.curses.includes(c.id));
    if(!L.length||!free.length){box().append(h('div',{cls:'empty'},'祭壇已經沒有東西能給你了。'));$('perkFoot').append(leave());return}
    L.forEach(p=>{const c=pick(free);box().append(perkCard(p,{extra:'詛咒：'+c.n+'（'+c.d+'）',click:()=>{RUN.curses.push(c.id);closeChoice();applyPerk(p.id);ringFx(P.x,P.z,3.4,'#ff4a6a',.7);banner('詛咒',c.n+'：'+c.d,'#ff4a6a');openDoor()}}))});$('perkFoot').append(leave('不接受，離開'));return}
  if(id==='well'){openChoice(ev.n,'讓一個技能再升一級');const own=Object.keys(RUN.perks).map(k=>D.PERKS.find(p=>p.id===k)).filter(p=>p&&p.max>1&&perk(p.id)<p.max);
    const list=[];while(list.length<3&&own.length)list.push(own.splice(Math.floor(Math.random()*own.length),1)[0]);
    if(!list.length){box().append(h('button',{type:'button',cls:'pc',style:'--pc:#7df9ff',on:{click:()=>{closeChoice();healP(heal);openDoor()}}},h('div',{cls:'ic'},svg('heal')),h('b',null,'飲下泉水'),h('span',null,'沒有可以升級的技能，改為回復 50% 生命')));return}
    list.forEach(p=>box().append(perkCard(p,{click:()=>{closeChoice();applyPerk(p.id);ringFx(P.x,P.z,3,'#7df9ff',.6);openDoor()}})));$('perkFoot').append(leave());return}
  if(id==='chest'){const pm=priceM(),g=Math.round(ri(25,45)*pm),s=ri(2,5),gear=Math.random()<.45?genGear(RUN.lv+ri(0,1),null,1,{diff:RUN.diff}):null;RUN.gold+=g;RUN.shards+=s;if(gear)RUN.chest.push(gear);
    openChoice(ev.n,'寶箱打開了');if(room.evo){room.evo.traverse(n=>{if(n.isMesh)n.material=tintMat(n.material,'#fff4c0')})}emit(SHRINE.x,1,SHRINE.z,'#ffd76a',40,4,.8,{up:3});
    const L=h('div',{cls:'chestL'},h('div',null,svg('gold'),`金幣 +${g}`),h('div',null,svg('shard'),`骨片 +${s}`),gear?h('div',{style:'color:'+D.RARITY[gear.r].col},svg(D.SLOTS[gear.slot].icon),`${D.RARITY[gear.r].n} · ${gear.n}（通關或倒下都會帶回營地）`):null);
    box().append(L);$('perkFoot').append(leave('收下，繼續前進'));updHud();return}
  if(id==='ritual'){openChoice(ev.n,'限時 25 秒擊敗所有敵人');box().append(h('div',{cls:'empty'},'成功可以選一項傳說技能；失敗則什麼都拿不到，但敵人還是要打倒。'));
    $('perkFoot').append(h('button',{type:'button',cls:'btn pri',on:{click:()=>{closeChoice();startRitual()}}},'開始儀式'),leave('放棄，離開'));return}}
function startRitual(){RUN.state='ritual';RUN.ritT=25;$('hudTimer').hidden=false;banner('儀式開始','25 秒內擊敗所有敵人','#c38cff');ringFx(SHRINE.x,SHRINE.z,5,'#c38cff',.7);
  const n=Math.max(8,RUN.roomN);RUN.waves=[genWaves(n,'battle')[0].map(g=>Object.assign(g,{aff:Math.max(.5,RUN.diff.affix)}))];const extra=RUN.waves[0];extra.push({k:RUN.stage.elite[0],n:1,elite:true});RUN.wave=0;later(.6,()=>{if(RUN&&RUN.state==='ritual')spawnWave()})}

/* ================= 結算 ================= */
function endRun(win){if(!RUN||RUN.ended)return;RUN.ended=true;G.paused=true;$('perk').hidden=true;const st=RUN.stage,rw=st.reward||{},df=RUN.diff,total=RUN.total,done=win?total:RUN.cleared,b=RUN.base;
  const key=st.id+(df.id==='n'?'':':'+df.id),first=win&&!SAVE.clear[key],firstN=first&&df.id==='n',lvK=st.type==='mat'?1+(RUN.lv-st.lv)*.12:1,lm=df.loot;
  const xp=Math.round((win?rw.xp:rw.xp*.5*done/total)*lvK*(first?1.5:1)*(1+(lm-1)*.5)+RUN.kills);
  const gold=Math.round((RUN.gold+(win?(rw.gold||0)*lvK:0))*b.goldM*lm),shards=Math.round((RUN.shards+(win?(rw.shards||0)*lvK:0))*b.lootM*lm);
  const dust=Math.round((RUN.dust+(win?(rw.dust||0)*lvK:0))*lm),crystals=Math.round(RUN.crystals+(win?(rw.crystals||0)*lvK:0)+(firstN&&st.first?st.first.crystals:0));
  const gear=RUN.chest.slice();if(win)for(let i=0;i<(rw.gear||0)+(first?1:0);i++)gear.push(genGear(st.lv+ri(0,2)+(df.id==='x'?3:df.id==='h'?1:0),null,first&&i===0?2:df.id==='x'?2:df.id==='h'?1:null,{diff:df}));
  const runes=[];if(win&&rw.rune)for(let i=0;i<rw.rune;i++)runes.push(genRune(wpick([[1,60],[2,30],[3,10]])));
  if(win)SAVE.clear[key]=(SAVE.clear[key]||0)+1;SAVE.gold+=gold;SAVE.shards+=shards;SAVE.dust+=dust;SAVE.crystals+=crystals;for(const g of gear)addGear(g);for(const r of runes)SAVE.runes.push(r);
  SAVE.kills=(SAVE.kills||0)+RUN.kills;SAVE.run=null;
  const unl=[];if(firstN&&st.first)for(const u of st.first.unlock){if(!SAVE.unl.includes(u)){SAVE.unl.push(u);unl.push(u)}if(u.startsWith('act:')&&(SAVE.actEq||[]).length<(unlocked('slot:act2')?2:1)){SAVE.actEq=(SAVE.actEq||[]).concat(u.slice(4))}}
  const lv0=SAVE.lvl;SAVE.xp+=xp;while(SAVE.xp>=xpNeed(SAVE.lvl)){SAVE.xp-=xpNeed(SAVE.lvl);SAVE.lvl++}
  if(win&&st.type==='main'){track('main');ach('clear:'+st.id);if(df.id!=='n')ach('diff:h');const cnt={};for(const id in RUN.perks){const p=D.PERKS.find(x=>x.id===id);if(p&&p.sch!=='gen')cnt[p.sch]=(cnt[p.sch]||0)+1}for(const s in cnt)if(cnt[s]>=4)ach('school:'+s)}
  if(win&&st.type==='mat')track('mat');ach('lv:'+SAVE.lvl);ach('kills:'+SAVE.kills);save();
  $('resSub').textContent=st.ch+' · '+st.name+(df.id!=='n'?' · '+df.n:'');const t=$('resTitle');t.textContent=win?(first?'首次通關':'通關'):'挑戰失敗';t.className=win?'win':'lose';
  const mm=Math.floor(RUN.time/60),ss=Math.floor(RUN.time%60);
  $('resStats').replaceChildren(h('div',null,h('b',null,`${done} / ${total}`),h('span',null,'通過房間')),h('div',null,h('b',null,RUN.kills),h('span',null,'擊殺')),h('div',null,h('b',null,'Lv '+RUN.rlv),h('span',null,'局內等級')),h('div',null,h('b',null,`${mm}:${String(ss).padStart(2,'0')}`),h('span',null,'用時')));
  const L=$('resLoot');L.replaceChildren();let d=0;const row=(icon,col,txt,val,cls)=>{const e=h('div',{cls:'loot'+(cls?' '+cls:''),style:`animation-delay:${(d++)*.07}s`},svg(icon),h('span',null,txt),val!=null?h('b',null,val):null);e.firstChild.style.color=col;L.append(e)};
  row('xp','#c38cff','帳號經驗','+'+xp);row('gold','#e2b84d','金幣','+'+gold);if(shards)row('shard','#bfe4ff','骨片','+'+shards);if(dust)row('dust','#8fa8ff','符文粉塵','+'+dust);if(crystals)row('crystal','#5affe6','魂晶','+'+crystals);
  for(const g of gear){const r=D.RARITY[g.r];row(D.SLOTS[g.slot].icon,r.col,`${r.n} · ${g.n}`,'Lv'+g.lv)}
  for(const r of runes){const R=D.RUNES[r.sys];row('rune',R.col,`${D.RUNE_TIERS[r.t-1]}${R.n}符文`,'T'+r.t)}
  if(SAVE.lvl>lv0)row('xp','#e2b84d',`等級提升至 ${SAVE.lvl}，獲得 ${SAVE.lvl-lv0} 天賦點`,null,'lvup');
  for(const m of D.MILESTONES)if(lv0<m.lv&&SAVE.lvl>=m.lv)row('xp','#ffa53a',`里程碑「${m.n}」：${m.d}`,null,'lvup');
  if(firstN&&st.first)row('xp','#8fe36a',st.first.text,null,'lvup');
  $('resRetry').textContent=st.type==='mat'?`再挑戰（剩 ${matLeft(st)} 次）`:'再挑戰';$('resRetry').disabled=st.type==='mat'&&matLeft(st)<=0;
  $('resRetry').onclick=()=>{$('result').hidden=true;clearRun();startRun(st.id,{diff:df.id})};$('resHub').onclick=()=>{$('result').hidden=true;toHub()};
  setTimeout(()=>{$('result').hidden=false;joyReset()},win?200:400)}
function clearRun(){if(RUN){clearCombat();RUN=null}clearAllies();if(P.shieldFx)P.shieldFx.visible=false}
function toHub(){fadeTo(true).then(()=>{clearRun();if(P.c){P.c.root.visible=false;P.sh.visible=false}$('hud').hidden=true;$('perk').hidden=true;$('pause').hidden=true;
  G.mode='hub';G.paused=false;showHubScene(true);$('hub').hidden=false;renderHub();camSnap();fadeTo(false)})}

/* ================= 副本介面 ================= */
let hpShown=1;
function updHud(){if(!RUN)return;const k=clamp(RUN.hp/RUN.maxHp,0,1);$('hpFill').style.width=(k*100)+'%';if(k!==hpShown){$('hpGhost').style.width=(Math.max(k,hpShown)*100)+'%';setTimeout(()=>$('hpGhost').style.width=(k*100)+'%',30);hpShown=k}
  $('hpTxt').textContent=`${Math.ceil(RUN.hp)} / ${RUN.maxHp}`;$('hudGold').textContent=RUN.gold;updXp();
  const row=$('perkRow'),key=JSON.stringify(RUN.perks)+RUN.curses.join();if(row.dataset.k!==key){row.dataset.k=key;
    row.replaceChildren(...Object.keys(RUN.perks).map(id=>{const p=D.PERKS.find(x=>x.id===id);const col=p.rar==='c'?D.SCHOOLS[p.sch].col:D.PERK_RAR[p.rar].col;return h('div',{cls:'pk r-'+p.rar,style:'--pc:'+col,title:p.n},svg(p.icon),RUN.perks[id]>1?h('em',null,RUN.perks[id]):null)}),
      ...RUN.curses.map(c=>h('div',{cls:'pk curse',style:'--pc:#ff4a6a',title:D.CURSES.find(x=>x.id===c).n},svg('skull'))))}}
function updXp(){if(!RUN)return;$('xpFill').style.width=(clamp(RUN.xp/RUN.need,0,1)*100)+'%';$('xpLv').textContent='Lv '+RUN.rlv}
function buildActBtns(){const box=$('actBtns');box.replaceChildren();RUN.acts.forEach((a,i)=>{const d=D.ACTIVES.find(x=>x.id===a.id);const b=h('button',{type:'button',cls:'act',style:'--ac:'+d.col,'aria-label':d.n,on:{pointerdown:e=>{e.stopPropagation();e.preventDefault();castActive(i)}}},svg(d.icon),h('i',{cls:'cd'}),h('small',null,d.n));box.append(b);a.el=b});box.hidden=!RUN.acts.length}
function updActBtns(){for(const a of RUN.acts){if(!a.el)continue;const d=D.ACTIVES.find(x=>x.id===a.id),k=a.t/d.cd;a.el.classList.toggle('ready',a.t<=0);a.el.lastChild.previousSibling.style.setProperty('--k',k);a.el.lastChild.previousSibling.textContent=a.t>0?Math.ceil(a.t):''}}
function openPause(){if(G.mode!=='run'||!RUN||RUN.choosing||RUN.ended)return;G.paused=true;joyReset();const pl=$('pausePerks');pl.replaceChildren();
  const ids=Object.keys(RUN.perks);if(!ids.length)pl.append(h('div',{cls:'empty'},'尚未獲得任何技能'));
  ids.forEach(id=>{const p=D.PERKS.find(x=>x.id===id),col=p.rar==='c'?D.SCHOOLS[p.sch].col:D.PERK_RAR[p.rar].col;pl.append(h('div',{cls:'li',style:'--pc:'+col,title:p.d},svg(p.icon),h('span',null,p.n),h('em',null,'×'+RUN.perks[id])))});
  RUN.curses.forEach(c=>{const x=D.CURSES.find(y=>y.id===c);pl.append(h('div',{cls:'li',style:'--pc:#ff4a6a'},svg('skull'),h('span',null,x.n+'：'+x.d)))});
  $('pauseInfo').textContent=`第 ${RUN.roomN} / ${RUN.total} 間 · 局內等級 ${RUN.rlv} · 擊殺 ${RUN.kills}`;
  document.querySelectorAll('#qSeg button').forEach(b=>b.classList.toggle('on',b.dataset.q===SAVE.q));syncStyleSeg();$('pause').hidden=false}
