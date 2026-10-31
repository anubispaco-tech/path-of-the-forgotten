/* 被遺忘者之路 · 局外系統：存檔、數值、裝備、合成、符文、抽卡、每日任務、成就、掃蕩、營地挖掘、營地介面 */
'use strict';
/* ================= 存檔 ================= */
const KEY='pof_save_v2',KEY_OLD='pof_save_v1';
let SAVE=null;
function newSave(){return{v:2,lvl:1,xp:0,gold:0,shards:0,crystals:0,dust:0,tal:{},inv:[],eq:{weapon:null,head:null,armor:null,ring:null,neck:null},runes:[],clear:{},uid:1,q:isTouch?'mid':'high',runs:0,
  style:'model',look:null,lookSet:false,showGear:true,unl:[],actEq:[],pity:{soul:0,soulL:0,rune:0},daily:null,ach:{},mat:null,idle:{t:Date.now()},kills:0,run:null}}
function loadSave(){try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.v===2)return Object.assign(newSave(),s)}catch(e){}
  try{const o=JSON.parse(localStorage.getItem(KEY_OLD)||'null');if(o&&o.v===1)return migrate(o)}catch(e){}return null}
// 舊存檔（v0.4）轉成新格式：稀有度對應、裝備改名、補上解鎖
function migrate(o){const s=Object.assign(newSave(),{lvl:o.lvl,xp:o.xp,gold:o.gold,shards:o.shards,tal:o.tal||{},clear:o.clear||{},uid:o.uid||1,q:o.q||'mid',runs:o.runs||0,style:o.style||'model',look:o.look||null,lookSet:!!o.lookSet});
  const RM={0:0,1:2,2:3,3:4};s.inv=(o.inv||[]).map(it=>{const list=D.GEAR[it.slot]||D.GEAR.ring,b=it.slot==='weapon'?0:it.id%list.length;const n={id:it.id,slot:it.slot,r:RM[it.r]??0,lv:it.lv,up:it.up||0,base:b,n:list[b].n,sock:[]};n.sock=Array(D.RARITY[n.r].sock).fill(null);if(D.RARITY[n.r].fx)n.fx=pick(D.GEAR_FX).id;return n});
  for(const k in o.eq||{})if(k in s.eq)s.eq[k]=o.eq[k];
  if(s.clear.c1){s.unl.push('act:burst');s.actEq=['burst']}if(s.clear.c2){s.unl.push('slot:neck','act:march')}
  s.crystals=150;s.migrated=true;while(s.xp>=xpNeed(s.lvl)){s.xp-=xpNeed(s.lvl);s.lvl++}return s}
function save(){try{localStorage.setItem(KEY,JSON.stringify(SAVE))}catch(e){}}
const xpNeed=l=>Math.round(D.ACCT.base+D.ACCT.per*l+D.ACCT.sq*l*l);
const today=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};
function tal(id){return SAVE.tal[id]||0}
function unlocked(k){return SAVE.unl.includes(k)}
function milestone(id){const m=D.MILESTONES.find(x=>x.id===id);return m&&SAVE.lvl>=m.lv}
function talPoints(){let used=0;for(const k in SAVE.tal)used+=SAVE.tal[k];return SAVE.lvl-1-used}
function slotOpen(sl){const u=D.SLOTS[sl].unlock;return!u||unlocked(u)}

/* ================= 數值 ================= */
function gearStats(it){const r=D.RARITY[it.r],m=r.m*(1+it.up*.08),lv=it.lv,o={};
  if(it.slot==='weapon')o.atk=Math.round((6+lv*3.2)*m);
  if(it.slot==='head')o.hp=Math.round((20+lv*9)*m);
  if(it.slot==='armor'){o.hp=Math.round((24+lv*11)*m);o.def=+((1+lv*.12)*m).toFixed(1)}
  if(it.slot==='ring'){o.crit=+((2+lv*.35)*m).toFixed(1);if(it.r>=1)o.aspd=+((2+lv*.45)*m).toFixed(1)}
  if(it.slot==='neck'){const st=(D.GEAR.neck[it.base]||D.GEAR.neck[0]).stat;o[st]=+((st==='xp'?4+lv*.6:st==='critM'?6+lv*1.2:5+lv)*m).toFixed(1)}return o}
const STAT_N={atk:['攻擊',''],hp:['生命',''],def:['減傷','%'],crit:['爆擊','%'],aspd:['攻速','%'],elem:['元素傷害','%'],sum:['召喚傷害','%'],xp:['局內經驗','%'],critM:['爆擊傷害','%']};
function statLine(g){return Object.keys(g).map(k=>`${STAT_N[k][0]} +${g[k]}${STAT_N[k][1]}`)}
function equipped(){const out=[];for(const sl in SAVE.eq){if(!slotOpen(sl))continue;const it=SAVE.inv.find(i=>i.id===SAVE.eq[sl]);if(it)out.push(it)}return out}
function runeSets(){const c={atk:0,def:0,ele:0,arc:0};for(const it of equipped())for(const r of it.sock||[])if(r)c[r.sys]++;return c}
function baseStats(){const s={atk:22,hp:220,aspd:1.15,crit:.05,critM:1.8,def:0,spd:5.3,lootM:1,goldM:1,elemM:1,sumM:1,xpM:1,magnet:1,healM:1,regen:0,rerolls:0,fx:new Set(),runeSet:runeSets()};
  s.atk+=(SAVE.lvl-1)*2.2;s.hp+=(SAVE.lvl-1)*14;const pc={atk:0,hp:0,elem:0,xp:0};let def=0;
  for(const it of equipped()){const g=gearStats(it);if(g.atk)s.atk+=g.atk;if(g.hp)s.hp+=g.hp;if(g.def)def+=g.def;if(g.crit)s.crit+=g.crit/100;if(g.aspd)s.aspd*=1+g.aspd/100;if(g.elem)s.elemM+=g.elem/100;if(g.sum)s.sumM+=g.sum/100;if(g.xp)s.xpM+=g.xp/100;if(g.critM)s.critM+=g.critM/100;
    if(it.fx)s.fx.add(it.fx);for(const r of it.sock||[])if(r)pc[{atk:'atk',def:'hp',ele:'elem',arc:'xp'}[r.sys]]+=D.RUNES[r.sys].per[r.t-1]}
  const rs=s.runeSet;if(rs.atk>=2)pc.atk+=5;if(rs.atk>=4)s.critM+=.3;if(rs.def>=2)pc.hp+=8;if(rs.ele>=2)pc.elem+=10;if(rs.arc>=2)pc.xp+=10;
  s.atk*=1+pc.atk/100;s.hp*=1+pc.hp/100;s.elemM+=pc.elem/100;s.xpM+=pc.xp/100;
  s.atk*=1+tal('t_atk')*.05;s.crit+=tal('t_crit')*.02;s.aspd*=1+tal('t_spd')*.04;s.critM+=tal('t_critM')*.1;s.elemM+=tal('t_elem')*.06;
  s.hp*=1+tal('t_hp')*.07;def+=tal('t_def')*3;s.regen+=tal('t_regen')*.003;s.lootM+=tal('t_gold')*.1;s.goldM+=tal('t_gold')*.1;s.xpM+=tal('t_xp')*.06;s.sumM+=tal('t_minion')*.08;s.magnet+=tal('t_magnet')*.2;
  if(milestone('ms_xp'))s.xpM+=.15;if(s.fx.has('fx_gold'))s.goldM+=.3;
  s.rerolls=tal('t_roll')+(milestone('ms_roll')?1:0)+(rs.arc>=4?1:0)+(s.fx.has('fx_reroll')?1:0);
  s.def=Math.min(.6,def/100);s.atk=Math.round(s.atk);s.hp=Math.round(s.hp);return s}

/* ================= 裝備 ================= */
function rollRarity(lv,minR,diff){const bonus=Math.min(25,lv*2);let roll=Math.random()*100;let r=roll<.6+bonus*.06?4:roll<4+bonus*.25?3:roll<14+bonus*.6?2:roll<45+bonus?1:0;
  if(diff&&diff.mythic&&Math.random()<.05)r=5;if(minR!=null)r=Math.max(r,minR);return r}
function genGear(lv,slot,minR,o){o=o||{};const slots=Object.keys(D.SLOTS).filter(slotOpen);slot=slot||pick(slots);const r=o.r!=null?o.r:rollRarity(lv,minR,o.diff);
  const list=D.GEAR[slot],b=Math.floor(Math.random()*list.length);const it={id:SAVE.uid++,slot,r,lv:Math.max(1,lv),up:0,base:b,n:list[b].n,sock:Array(D.RARITY[r].sock).fill(null)};if(D.RARITY[r].fx)it.fx=pick(D.GEAR_FX).id;return it}
function addGear(it){SAVE.inv.push(it);if(it.r>=5)ach('myth')}
const upCost=it=>({gold:Math.round(25*(it.up+1)*D.RARITY[it.r].m*(1+it.lv*.15)),sh:2+it.up*2});
function mergeGroups(){const g={};for(const it of SAVE.inv){if(it.r>=5)continue;const k=it.slot+'|'+it.base+'|'+it.r;(g[k]=g[k]||[]).push(it)}return Object.values(g).filter(a=>a.length>=3)}
function mergeOne(list){const eqIds=Object.values(SAVE.eq);list=list.slice().sort((a,b)=>(eqIds.includes(b.id)?1:0)-(eqIds.includes(a.id)?1:0)||b.up-a.up||b.lv-a.lv);const[base,...rest]=list.slice(0,3);
  let refund=0;for(const x of rest){refund+=x.up*2;for(const r of x.sock||[])if(r)SAVE.runes.push(r);SAVE.inv=SAVE.inv.filter(i=>i!==x)}
  base.r++;base.up=Math.max(base.up,...rest.map(x=>x.up));base.lv=Math.max(base.lv,...rest.map(x=>x.lv));const ns=D.RARITY[base.r].sock;while(base.sock.length<ns)base.sock.push(null);if(D.RARITY[base.r].fx&&!base.fx)base.fx=pick(D.GEAR_FX).id;
  SAVE.shards+=refund;ach('merge');if(base.r>=5)ach('myth');return base}
function mergeAll(){let n=0,guard=0;let g;while((g=mergeGroups()).length&&guard++<200){mergeOne(g[0]);n++}save();if(n)tel('merge',{n});return n}
function dismantleGain(it){return 1+it.r*3+it.up}
/* ================= 符文 ================= */
function genRune(t,sys){return{id:SAVE.uid++,sys:sys||pick(Object.keys(D.RUNES)),t:clamp(t||1,1,5)}}
function runeName(r){return D.RUNE_TIERS[r.t-1]+D.RUNES[r.sys].n+'符文'}
function runeLine(r){const R=D.RUNES[r.sys];return`${R.stat} +${R.per[r.t-1]}%`}
function mergeRunes(){let n=0;for(;;){let done=false;for(const sys in D.RUNES)for(let t=1;t<5;t++){const g=SAVE.runes.filter(r=>r.sys===sys&&r.t===t);if(g.length>=3){const take=g.slice(0,3);SAVE.runes=SAVE.runes.filter(r=>!take.includes(r));SAVE.runes.push(genRune(t+1,sys));n++;done=true}}if(!done)break}save();return n}

/* ================= 抽卡 ================= */
function openBox(id,count){const bx=D.BOXES.find(b=>b.id===id),cost=count>=10?bx.cost10:bx.cost*count;if(SAVE[bx.cur]<cost){toast(D.CURRENCY[bx.cur].n+'不足');return null}SAVE[bx.cur]-=cost;const out=[];
  for(let i=0;i<count;i++){let tier=wpick(bx.rates);
    if(bx.pity){const pk=bx.id==='rune'?'rune':'soul';SAVE.pity[pk]++;if(bx.id==='soul')SAVE.pity.soulL++;
      for(const[n,min]of bx.pity){const cnt=min>=4&&bx.id==='soul'?SAVE.pity.soulL:SAVE.pity[pk];if(cnt>=n&&tier<min)tier=min}
      if(tier>=(bx.id==='soul'?3:3))SAVE.pity[pk]=0;if(bx.id==='soul'&&tier>=4)SAVE.pity.soulL=0}
    if(bx.kind==='gear'){const it=genGear(Math.max(1,SAVE.lvl-1+ri(0,2)),null,null,{r:tier});addGear(it);out.push({gear:it})}else{const r=genRune(tier);SAVE.runes.push(r);out.push({rune:r})}}
  track('box');save();tel('gacha',{box:id,n:count,cost,got:out.map(o=>o.gear?'g'+o.gear.r:'r'+o.rune.t),pity:SAVE.pity});return out}

/* ================= 每日任務、素材關次數、成就 ================= */
function ensureDaily(){const d=today();if(!SAVE.daily||SAVE.daily.date!==d){const pool=D.DAILY.pool.slice(),q=[];while(q.length<D.DAILY.pick&&pool.length)q.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
    SAVE.daily={date:d,q:q.map(x=>({id:x.id,p:0,c:false})),bonus:false};save()}
  if(!SAVE.mat||SAVE.mat.date!==d){SAVE.mat={date:d,n:{}};save()}}
function matLeft(st){ensureDaily();return D.RULES.matDaily-(SAVE.mat.n[st.id]||0)}
function useMat(st){ensureDaily();SAVE.mat.n[st.id]=(SAVE.mat.n[st.id]||0)+1;save()}
function track(ev,n){if(!SAVE)return;ensureDaily();n=n||1;for(const q of SAVE.daily.q){if(q.id!==ev)continue;const def=D.DAILY.pool.find(x=>x.id===q.id);const was=q.p>=def.t;q.p=Math.min(def.t,q.p+n);if(!was&&q.p>=def.t){toast('每日任務完成：'+def.n);setDots()}}
  if(ev==='evo')ach('evo')}
function ach(ev){if(!SAVE)return;for(const a of D.ACHIEVEMENTS){if(SAVE.ach[a.id])continue;let ok=false;const[k,v]=a.ev.split(':'),[ek,evv]=ev.split(':');
    if(k!==ek)continue;if(k==='lv'||k==='kills')ok=+evv>=+v;else ok=a.ev===ev||(k==='diff'&&ev.startsWith('diff:'));if(ok){SAVE.ach[a.id]='ready';toast('成就達成：'+a.n);setDots()}}}
function claimable(){ensureDaily();let n=0;for(const q of SAVE.daily.q){const def=D.DAILY.pool.find(x=>x.id===q.id);if(!q.c&&q.p>=def.t)n++}if(!SAVE.daily.bonus&&SAVE.daily.q.every(q=>q.c))n++;for(const k in SAVE.ach)if(SAVE.ach[k]==='ready')n++;return n}

/* ================= 營地挖掘、掃蕩 ================= */
function idleGain(){const hrs=Math.min(D.RULES.idleCapH,(Date.now()-(SAVE.idle.t||Date.now()))/3.6e6),m=1+SAVE.lvl*.1;return{hrs,gold:Math.floor(D.RULES.idleRate.gold*m*hrs),shards:Math.floor(D.RULES.idleRate.shards*m*hrs)}}
function sweep(st){if(!SAVE.clear[st.id]||matLeft(st)<=0)return;tel('sweep',{ch:st.id});useMat(st);const rw=st.reward,lvK=1+(stageLv(st)-st.lv)*.12,b=baseStats(),out=[];
  const g=Math.round((rw.gold||0)*lvK*b.goldM),s=Math.round((rw.shards||0)*lvK*b.lootM),du=Math.round((rw.dust||0)*lvK),cr=Math.round((rw.crystals||0)*lvK),xp=Math.round((rw.xp||0)*lvK);
  SAVE.gold+=g;SAVE.shards+=s;SAVE.dust+=du;SAVE.crystals+=cr;SAVE.xp+=xp;while(SAVE.xp>=xpNeed(SAVE.lvl)){SAVE.xp-=xpNeed(SAVE.lvl);SAVE.lvl++}
  if(g)out.push(['gold','#e2b84d','金幣 +'+g]);if(s)out.push(['shard','#bfe4ff','骨片 +'+s]);if(du)out.push(['dust','#8fa8ff','符文粉塵 +'+du]);if(cr)out.push(['crystal','#5affe6','魂晶 +'+cr]);out.push(['xp','#c38cff','帳號經驗 +'+xp]);
  if(rw.rune){const r=genRune(wpick([[1,60],[2,30],[3,10]]));SAVE.runes.push(r);out.push(['rune',D.RUNES[r.sys].col,runeName(r)])}
  track('mat');ach('lv:'+SAVE.lvl);save();showModal(h('div',{cls:'resHead'},h('small',null,'掃蕩'),h('h2',null,st.name)),h('div',{cls:'resLoot'},...out.map(([i,c,t])=>{const e=h('div',{cls:'loot'},svg(i),h('span',null,t));e.firstChild.style.color=c;return e})),h('div',{cls:'row'},h('button',{type:'button',cls:'btn pri',on:{click:closeModal}},'好')));renderHub()}

/* ================= 主角模型（外觀 + 裝備外觀） ================= */
function heroLook(){const L=Object.assign({},LK.def,SAVE&&SAVE.look||{});if(SAVE&&SAVE.showGear){const get=sl=>{const it=SAVE.inv.find(i=>i.id===SAVE.eq[sl]);return it&&D.GEAR[sl][it.base]};
  const w=get('weapon');if(w&&w.look)L.weapon=w.look;const hd=get('head');if(hd&&hd.look)L.head=hd.look;const a=get('armor');if(a&&a.look!=null)L.robe=a.look}return L}
function makeHero(scale,pixScale){const L=heroLook(),body=lk('body',L.body),w=lk('weapon',L.weapon),of=lk('off',L.off);const wi=SAVE.showGear&&SAVE.inv.find(i=>i.id===SAVE.eq.weapon);
  return makeActor(body.model,{scale,look:L,wr:w.model,wl:of.model,eye:lk('eye',L.eye).c,robeTex:robeTex(L.robe),pixScale,wglow:wi&&wi.r>=3?D.RARITY[wi.r].col:null},'player')}
function rebuildHero(){if(hubChar){const p=hubChar.root.position.clone(),ry=hubChar.root.rotation.y;disposeChar(hubChar);hubChar=makeHero(.85,.8);hubChar.root.position.copy(p);hubChar.root.rotation.y=ry;hubG.add(hubChar.root);play(hubChar,'Idle',0)}
  if(P.c&&!RUN){disposeChar(P.c);P.c=null}}

/* ================= 營地介面 ================= */
function setDots(){if(!SAVE||!$('hub'))return;$('talDot').hidden=talPoints()<=0;$('questDot').hidden=claimable()<=0;$('gearDot').hidden=!mergeGroups().length}
function renderHub(){ensureDaily();$('hLv').textContent=SAVE.lvl;const need=xpNeed(SAVE.lvl);$('hXp').style.width=(SAVE.xp/need*100)+'%';$('hXpT').textContent=`${SAVE.xp} / ${need}`;
  $('hGold').textContent=fmt(SAVE.gold);$('hShard').textContent=fmt(SAVE.shards);$('hCrys').textContent=fmt(SAVE.crystals);setDots();
  const tab=document.querySelector('.hubNav .on').dataset.tab;({tabStage:renderStages,tabTal:renderTal,tabGear:renderGear,tabLook:renderLook,tabGacha:renderGacha,tabQuest:renderQuests})[tab]()}
function switchTab(id){document.querySelectorAll('.hubNav button').forEach(x=>x.classList.toggle('on',x.dataset.tab===id));document.querySelectorAll('.hubBody .tab').forEach(t=>t.hidden=t.id!==id);renderHub()}
function showModal(...kids){$('modalBox').replaceChildren(...kids);$('modal').hidden=false}
function closeModal(){$('modal').hidden=true}
const title=(t,s)=>h('div',{cls:'tabTitle'},h('h3',null,t),s?h('small',null,s):null);
const curChip=(cur,v)=>{const c=D.CURRENCY[cur];const e=h('span',{cls:'cc'+(SAVE[cur]<v?' no':'')},svg(c.icon),fmt(v));e.firstChild.style.color=c.col;return e};

/* ---------- 出征 ---------- */
function renderStages(){const box=$('tabStage');box.replaceChildren();
  if(SAVE.run){const r=SAVE.run,st=D.STAGES.find(s=>s.id===r.id);if(st)box.append(h('div',{cls:'resume'},h('div',null,h('small',null,'副本進行中'),h('b',null,`${st.ch} · ${st.name}`),h('span',null,`第 ${r.roomN} / ${st.type==='main'?D.RULES.rooms:D.RULES.matRooms} 間 · 局內等級 ${r.rlv} · 生命 ${Math.round(r.hpK*100)}%`)),
    h('div',{cls:'row'},h('button',{type:'button',cls:'btn ghost',on:{click:()=>{showModal(h('div',{cls:'resHead'},h('h2',null,'放棄這一局？')),h('p',{cls:'lkNote'},'這一局撿到的金幣、經驗與技能都不會保留。'),h('div',{cls:'row'},h('button',{type:'button',cls:'btn ghost',on:{click:closeModal}},'取消'),h('button',{type:'button',cls:'btn',on:{click:()=>{SAVE.run=null;save();closeModal();renderHub()}}},'放棄')))}}},'放棄'),
      h('button',{type:'button',cls:'btn pri',on:{click:()=>startRun(st.id,{resume:r})}},'繼續')))) }
  const ig=idleGain();box.append(h('div',{cls:'idle'},svg('sweep'),h('div',null,h('b',null,'營地挖掘'),h('span',null,`已累積 ${ig.hrs.toFixed(1)} / ${D.RULES.idleCapH} 小時：金幣 ${ig.gold}、骨片 ${ig.shards}`)),
    h('button',{type:'button',cls:'btn gold sm',disabled:ig.gold<1,on:{click:()=>{const g=idleGain();SAVE.gold+=g.gold;SAVE.shards+=g.shards;SAVE.idle.t=Date.now();save();toast(`領取金幣 ${g.gold}、骨片 ${g.shards}`);renderHub()}}},'領取')));
  const acts=D.ACTIVES.filter(a=>unlocked('act:'+a.id));
  if(acts.length){const slots=unlocked('slot:act2')?2:1;SAVE.actEq=(SAVE.actEq||[]).filter(id=>acts.some(a=>a.id===id)).slice(0,slots);
    box.append(title('主動技',`帶 ${slots} 個進副本 · 右下角按鈕施放`),h('div',{cls:'acts'},...acts.map(a=>{const on=SAVE.actEq.includes(a.id);return h('button',{type:'button',cls:'actc'+(on?' on':''),style:'--ac:'+a.col,on:{click:()=>{let L=SAVE.actEq.filter(x=>x!==a.id);if(!on){L.push(a.id);if(L.length>slots)L.shift()}SAVE.actEq=L;save();renderStages()}}},svg(a.icon),h('b',null,a.n),h('span',null,a.d+`（冷卻 ${a.cd} 秒）`))})))}
  if(PIX.base)box.append(h('div',{cls:'qrow',style:'margin-top:6px'},h('span',null,'角色風格'),h('div',{cls:'seg styleSeg'},h('button',{type:'button','data-s':'model'},'3D 模型'),h('button',{type:'button','data-s':'pixel'},'像素（彩蛋）'))));
  box.append(title('主線','30 間房 · 第 5、15、25 間事件 · 第 10、20 間菁英'));
  for(const st of D.STAGES.filter(s=>s.type==='main')){const lock=st.req&&!SAVE.clear[st.req],cl=SAVE.clear[st.id],c=D.THEMES[st.theme].card;
    const dOk=d=>d.id==='n'||(d.id==='h'&&SAVE.clear[st.id])||(d.id==='x'&&SAVE.clear[st.id+':h']&&unlocked('diff:x'));const sel=(SAVE.diffSel||{})[st.id]||'n';const df=D.DIFFS.find(d=>d.id===sel&&dOk(d))||D.DIFFS[0];
    const boss=[].concat(st.boss).map(k=>D.ENEMIES[k].n.split(' · ')[0]).join(' & ');
    box.append(h('div',{cls:'stg'+(lock?' lock':''),style:`--c1:${c[0]};--c2:${c[1]};--acc:${c[2]}`},cl?h('div',{cls:'clr'},'✓ 已通關'+(cl>1?' ×'+cl:'')+(SAVE.clear[st.id+':h']?' · 困難':'')+(SAVE.clear[st.id+':x']?' · 地獄':'')):null,
      h('div',{cls:'ch'},st.ch+` · 建議等級 ${st.lv}`),h('h4',null,st.name),h('p',null,lock?'需要先通關「'+D.STAGES.find(s=>s.id===st.req).name+'」':st.desc),
      lock?null:h('div',{cls:'meta'},h('span',null,h('b',null,D.RULES.rooms),' 間'),h('span',null,'首領 ',h('b',null,boss)),h('span',null,'裝備 ×',h('b',null,st.reward.gear))),
      lock?null:h('div',{cls:'seg diffSeg'},...D.DIFFS.map(d=>h('button',{type:'button',cls:(d===df?'on':'')+(dOk(d)?'':' lk'),disabled:!dOk(d),style:'--dc:'+d.col,on:{click:()=>{SAVE.diffSel=Object.assign(SAVE.diffSel||{},{[st.id]:d.id});save();renderStages()}}},d.n))),
      lock||df.id==='n'?null:h('div',{cls:'dnote'},`怪物生命 ×${df.hp}、傷害 ×${df.dmg}，獎勵 ×${df.loot}`+(df.mythic?'，可能掉落神話裝備':'')),
      h('button',{type:'button',cls:'btn '+(lock?'':'pri'),disabled:lock,on:{click:()=>dropThen(()=>startRun(st.id,{diff:df.id}))}},lock?'鎖定':'出征')))}
  box.append(title('素材','每個素材關每天 '+D.RULES.matDaily+' 次（挑戰或掃蕩）'));
  for(const st of D.STAGES.filter(s=>s.type==='mat')){const lock=st.req&&!SAVE.clear[st.req],c=D.THEMES[st.theme].card,left=matLeft(st);const lootN={shards:'骨片',gold:'金幣',dust:'符文粉塵',crystals:'魂晶'}[st.loot];
    box.append(h('div',{cls:'stg mat'+(lock?' lock':''),style:`--c1:${c[0]};--c2:${c[1]};--acc:${c[2]}`},h('div',{cls:'ch'},`素材 · 今日剩 ${left} / ${D.RULES.matDaily} 次`),h('h4',null,st.name),h('p',null,lock?'需要先通關「'+D.STAGES.find(s=>s.id===st.req).name+'」':st.desc),
      lock?null:h('div',{cls:'meta'},h('span',null,h('b',null,D.RULES.matRooms),' 間'),h('span',null,'主要掉落 ',h('b',null,lootN))),
      h('div',{cls:'row'},h('button',{type:'button',cls:'btn ghost',disabled:lock||!SAVE.clear[st.id]||left<=0,on:{click:()=>sweep(st)}},SAVE.clear[st.id]?'掃蕩':'通關後可掃蕩'),
        h('button',{type:'button',cls:'btn '+(lock?'':'pri'),disabled:lock||left<=0,on:{click:()=>dropThen(()=>startRun(st.id))}},lock?'鎖定':left<=0?'明天再來':'出征'))))}
  syncStyleSeg()}
function dropThen(fn){if(!SAVE.run){fn();return}showModal(h('div',{cls:'resHead'},h('h2',null,'放棄進行中的副本？')),h('p',{cls:'lkNote'},'開始新的一局會放棄目前這一局，裡面的收穫不會保留。'),h('div',{cls:'row'},h('button',{type:'button',cls:'btn ghost',on:{click:closeModal}},'取消'),h('button',{type:'button',cls:'btn pri',on:{click:()=>{SAVE.run=null;save();closeModal();fn()}}},'放棄並出征')))}

/* ---------- 裝備、符文 ---------- */
let gearView='gear',gearFilter='all';
function renderGear(){const box=$('tabGear');box.replaceChildren();const runesOn=unlocked('sys:runes');
  if(runesOn)box.append(h('div',{cls:'seg subSeg'},h('button',{type:'button',cls:gearView==='gear'?'on':'',on:{click:()=>{gearView='gear';renderGear()}}},'裝備'),h('button',{type:'button',cls:gearView==='rune'?'on':'',on:{click:()=>{gearView='rune';renderGear()}}},'符文')));
  if(gearView==='rune'&&runesOn){renderRunes(box);return}
  box.append(title('已裝備','點選查看、強化、鑲嵌符文'));
  const row=h('div',{cls:'eqRow five'});for(const sl in D.SLOTS){const open=slotOpen(sl),it=open&&SAVE.inv.find(i=>i.id===SAVE.eq[sl]),r=it?D.RARITY[it.r]:null;
    row.append(h('button',{type:'button',cls:'slot'+(open?'':' lock'),style:it?'--rc:'+r.col:'',on:{click:()=>{if(!open){toast('首次通關第二章解鎖項鍊欄');return}it?itemModal(it):(gearFilter=sl,renderGear())}}},h('small',null,D.SLOTS[sl].n),svg(open?D.SLOTS[sl].icon:'lock','gi'),h('b',null,it?it.n+(it.up?' +'+it.up:''):open?'空':'未解鎖'),it?h('span',null,statLine(gearStats(it))[0]):null))}
  box.append(row);const s=baseStats();
  box.append(h('div',{cls:'statGrid'},...[['攻擊',s.atk],['生命',s.hp],['攻速',s.aspd.toFixed(2)+'/秒'],['爆擊',Math.round(s.crit*100)+'%'],['爆擊傷害',Math.round(s.critM*100)+'%'],['減傷',Math.round(s.def*100)+'%'],['元素傷害','+'+Math.round((s.elemM-1)*100)+'%'],['召喚傷害','+'+Math.round((s.sumM-1)*100)+'%'],['局內經驗','+'+Math.round((s.xpM-1)*100)+'%']].map(([a,b])=>h('div',null,h('span',null,a),String(b)))));
  const fxs=[...s.fx].map(id=>D.GEAR_FX.find(f=>f.id===id).d);if(fxs.length)box.append(h('div',{cls:'fxList'},...fxs.map(t=>h('div',null,'✦ '+t))));
  const rs=s.runeSet,sets=[];for(const k in rs){const R=D.RUNES[k];if(rs[k]>=2)sets.push(R.n+'×2：'+R.set2);if(rs[k]>=4)sets.push(R.n+'×4：'+R.set4)}if(sets.length)box.append(h('div',{cls:'fxList'},...sets.map(t=>h('div',null,'◆ '+t))));
  box.append(h('label',{cls:'tgl'},h('input',{type:'checkbox',checked:SAVE.showGear,on:{change:e=>{SAVE.showGear=e.target.checked;save();rebuildHero();toast(SAVE.showGear?'顯示裝備外觀':'保留自訂外觀')}}}),h('span',null,'顯示裝備外觀（主手、頭飾、護甲顏色）')));
  const mg=mergeGroups();
  box.append(h('div',{cls:'tabTitle'},h('h3',null,'背包'),h('small',null,SAVE.inv.length+' 件'),h('button',{type:'button',cls:'btn gold sm',disabled:!mg.length,on:{click:()=>{const n=mergeAll();toast(n?`合成了 ${n} 次`:'沒有可以合成的裝備');rebuildHero();renderHub()}}},svg('merge'),mg.length?`一鍵合成（${mg.length}）`:'一鍵合成')));
  box.append(h('div',{cls:'chips'},...[['all','全部']].concat(Object.keys(D.SLOTS).filter(slotOpen).map(k=>[k,D.SLOTS[k].n])).map(([k,n])=>h('button',{type:'button',cls:gearFilter===k?'on':'',on:{click:()=>{gearFilter=k;renderGear()}}},n))));
  const inv=SAVE.inv.filter(i=>gearFilter==='all'||i.slot===gearFilter).sort((a,b)=>b.r-a.r||b.lv-a.lv||b.up-a.up);
  if(!inv.length)box.append(h('div',{cls:'empty'},'通關主線、開寶箱或抽卡可以獲得裝備'));
  else box.append(h('div',{cls:'inv'},...inv.map(it=>{const eq=SAVE.eq[it.slot]===it.id;return h('button',{type:'button',cls:'it'+(eq?' eq':''),style:'--rc:'+D.RARITY[it.r].col,on:{click:()=>itemModal(it)},title:it.n},svg(D.SLOTS[it.slot].icon,'gi'),h('em',null,it.up?'+'+it.up:'Lv'+it.lv),it.sock.some(Boolean)?h('i',{cls:'rdot'}):null)})))}
function itemModal(it){const r=D.RARITY[it.r],g=gearStats(it),eq=SAVE.eq[it.slot]===it.id,c=upCost(it),maxUp=it.up>=r.cap,can=!maxUp&&SAVE.gold>=c.gold&&SAVE.shards>=c.sh;
  const g2=gearStats(Object.assign({},it,{up:it.up+1})),same=SAVE.inv.filter(x=>x.slot===it.slot&&x.base===it.base&&x.r===it.r),canMerge=it.r<5&&same.length>=3,fx=it.fx&&D.GEAR_FX.find(f=>f.id===it.fx);
  const socks=unlocked('sys:runes')?h('div',{cls:'socks'},...it.sock.map((s,i)=>s?h('button',{type:'button',cls:'sock on',style:'--sc:'+D.RUNES[s.sys].col,title:runeName(s),on:{click:()=>{it.sock[i]=null;SAVE.runes.push(s);save();itemModal(it);renderHub()}}},svg('rune'),h('span',null,runeName(s)),h('small',null,runeLine(s)+' · 點擊取下'))
    :h('button',{type:'button',cls:'sock',on:{click:()=>runePicker(it,i)}},svg('rune'),h('span',null,'空的符文孔'),h('small',null,SAVE.runes.length?'點擊鑲嵌':'沒有可用的符文')))):h('div',{cls:'dnote'},`符文孔 ${it.sock.length} 個（首次通關第三章解鎖符文系統）`);
  showModal(h('div',{cls:'itemCard',style:'--rc:'+r.col},svg(D.SLOTS[it.slot].icon,'gi'),h('h2',null,it.n+(it.up?' +'+it.up:'')),h('div',{cls:'r'},`${r.n} · ${D.SLOTS[it.slot].n} · 物品等級 ${it.lv} · 強化上限 +${r.cap}`),
    h('div',{cls:'st'},...statLine(g).map((s,i)=>h('div',null,s,!maxUp?h('b',null,'  →  '+(statLine(g2)[i]||'').split('+')[1]):null))),fx?h('div',{cls:'fx'},'✦ '+fx.d):null,socks,
    h('div',{cls:'cost'},maxUp?'已強化至上限':'強化需要：',maxUp?null:h('span',{cls:SAVE.gold<c.gold?'no':''},`金幣 ${c.gold}`),maxUp?null:' · ',maxUp?null:h('span',{cls:SAVE.shards<c.sh?'no':''},`骨片 ${c.sh}`))),
    h('div',{cls:'row'},h('button',{type:'button',cls:'btn gold',disabled:!can,on:{click:()=>{SAVE.gold-=c.gold;SAVE.shards-=c.sh;it.up++;track('up');save();renderHub();itemModal(it);toast('強化成功')}}},'強化'),
      h('button',{type:'button',cls:'btn pri',disabled:eq,on:{click:()=>{SAVE.eq[it.slot]=it.id;save();closeModal();rebuildHero();renderHub();toast('已裝備「'+it.n+'」')}}},eq?'裝備中':'裝備')),
    h('div',{cls:'row'},h('button',{type:'button',cls:'btn',disabled:!canMerge,on:{click:()=>{const b=mergeOne(same.includes(it)?[it,...same.filter(x=>x!==it)]:same);save();rebuildHero();renderHub();itemModal(b);toast('合成成功：'+D.RARITY[b.r].n+' '+b.n)}}},canMerge?`合成（${same.length} / 3 件）`:`合成需要 3 件同名同階（${same.length} / 3）`)),
    h('div',{cls:'row'},h('button',{type:'button',cls:'btn ghost',disabled:eq,on:{click:()=>{const gain=dismantleGain(it);for(const s of it.sock)if(s)SAVE.runes.push(s);SAVE.inv=SAVE.inv.filter(x=>x!==it);SAVE.shards+=gain;save();closeModal();renderHub();toast(`分解獲得骨片 ×${gain}`)}}},eq?'裝備中無法分解':`分解（骨片 +${dismantleGain(it)}）`),h('button',{type:'button',cls:'btn ghost',on:{click:closeModal}},'關閉')))}
function runePicker(it,idx){if(!SAVE.runes.length){toast('沒有可用的符文：打符文祭壇或開符文箱');return}
  const list=SAVE.runes.slice().sort((a,b)=>b.t-a.t||a.sys.localeCompare(b.sys));
  showModal(h('div',{cls:'resHead'},h('small',null,it.n),h('h2',null,'選擇符文')),h('div',{cls:'runeList'},...list.map(r=>h('button',{type:'button',cls:'rn',style:'--sc:'+D.RUNES[r.sys].col,on:{click:()=>{SAVE.runes=SAVE.runes.filter(x=>x!==r);it.sock[idx]=r;save();renderHub();itemModal(it)}}},svg('rune'),h('b',null,runeName(r)),h('span',null,runeLine(r))))),
    h('div',{cls:'row'},h('button',{type:'button',cls:'btn ghost',on:{click:()=>itemModal(it)}},'返回')))}
function renderRunes(box){box.append(title('符文','裝進裝備的符文孔；同系 2、4 個有套裝效果'));
  box.append(h('div',{cls:'statGrid two'},...Object.keys(D.RUNES).map(k=>{const R=D.RUNES[k];return h('div',{style:'--sc:'+R.col},h('span',null,R.n+' · '+R.stat),h('small',null,'2 件：'+R.set2),h('small',null,'4 件：'+R.set4))})));
  const g={};for(const r of SAVE.runes){const k=r.sys+'|'+r.t;(g[k]=g[k]||[]).push(r)}
  box.append(h('div',{cls:'tabTitle'},h('h3',null,'持有'),h('small',null,`${SAVE.runes.length} 個 · 粉塵 ${SAVE.dust}`),h('button',{type:'button',cls:'btn gold sm',on:{click:()=>{const n=mergeRunes();toast(n?`合成了 ${n} 次`:'沒有可以合成的符文（需要 3 個同系同階）');renderHub()}}},svg('merge'),'一鍵合成')));
  const keys=Object.keys(g).sort((a,b)=>+b.split('|')[1]-+a.split('|')[1]);
  if(!keys.length)box.append(h('div',{cls:'empty'},'打「符文祭壇」或開「符文箱」取得符文'));
  else box.append(h('div',{cls:'runeList'},...keys.map(k=>{const list=g[k],r=list[0],R=D.RUNES[r.sys];return h('button',{type:'button',cls:'rn',style:'--sc:'+R.col,on:{click:()=>{const gain=D.RUNE_COST.dismantle[r.t-1];showModal(h('div',{cls:'resHead'},h('small',null,runeLine(r)),h('h2',null,runeName(r))),h('p',{cls:'lkNote'},`持有 ${list.length} 個。到「裝備」點選一件裝備的符文孔就能鑲嵌。`),
    h('div',{cls:'row'},h('button',{type:'button',cls:'btn ghost',on:{click:()=>{SAVE.runes=SAVE.runes.filter(x=>x!==r);SAVE.dust+=gain;save();closeModal();renderHub();toast(`分解獲得粉塵 ×${gain}`)}}},`分解 1 個（粉塵 +${gain}）`),h('button',{type:'button',cls:'btn pri',on:{click:closeModal}},'關閉')))}}},svg('rune'),h('b',null,runeName(r)),h('span',null,runeLine(r)),h('em',null,'×'+list.length))})));
  box.append(title('打造',`花費 ${D.RUNE_COST.craft} 符文粉塵，打造指定系的 1 階符文`),h('div',{cls:'craft'},...Object.keys(D.RUNES).map(k=>{const R=D.RUNES[k];return h('button',{type:'button',cls:'btn',style:'--sc:'+R.col,disabled:SAVE.dust<D.RUNE_COST.craft,on:{click:()=>{SAVE.dust-=D.RUNE_COST.craft;const r=genRune(1,k);SAVE.runes.push(r);save();renderHub();toast('打造：'+runeName(r))}}},R.n)})))}

/* ---------- 召喚（抽卡） ---------- */
function renderGacha(){const box=$('tabGacha');box.replaceChildren();box.append(title('召喚','只用遊戲內貨幣；每個箱子都公開機率'));
  for(const bx of D.BOXES){const lock=bx.unlock&&!unlocked(bx.unlock);const pity=bx.pity?bx.pity.map(([n,min])=>{const cnt=bx.id==='soul'&&min>=4?SAVE.pity.soulL:SAVE.pity[bx.id==='rune'?'rune':'soul'];return`${n} 抽保底${bx.kind==='gear'?D.RARITY[min].n:min+' 階'}（${cnt} / ${n}）`}).join(' · '):'';
    box.append(h('div',{cls:'box b-'+bx.id+(lock?' lock':'')},h('div',{cls:'bxIc'},svg(bx.kind==='rune'?'rune':'box')),h('div',{cls:'bxM'},h('h4',null,bx.n),h('p',null,lock?'首次通關第三章解鎖':bx.d),pity?h('small',null,pity):null,
      h('button',{type:'button',cls:'link',on:{click:()=>rates(bx)}},'查看機率')),
      lock?null:h('div',{cls:'bxB'},h('button',{type:'button',cls:'btn',disabled:SAVE[bx.cur]<bx.cost,on:{click:()=>pull(bx,1)}},'抽 1 次 ',curChip(bx.cur,bx.cost)),h('button',{type:'button',cls:'btn pri',disabled:SAVE[bx.cur]<bx.cost10,on:{click:()=>pull(bx,10)}},'抽 10 次 ',curChip(bx.cur,bx.cost10)))))}
  box.append(h('p',{cls:'lkNote'},'魂晶來源：首次通關章節、每日任務、成就、魂晶礦坑。重複的裝備可以 3 合 1 合成更高稀有度。'))}
function rates(bx){const tot=bx.rates.reduce((s,r)=>s+r[1],0);showModal(h('div',{cls:'resHead'},h('small',null,'機率'),h('h2',null,bx.n)),h('div',{cls:'rates'},...bx.rates.map(([t,w])=>h('div',null,h('span',{style:'color:'+(bx.kind==='gear'?D.RARITY[t].col:'#8fa8ff')},bx.kind==='gear'?D.RARITY[t].n:D.RUNE_TIERS[t-1]+'（'+t+' 階）'),h('b',null,(w/tot*100).toFixed(1)+'%')))),
  bx.pity?h('p',{cls:'lkNote'},'保底：'+bx.pity.map(([n,m])=>`累積 ${n} 抽未出現${bx.kind==='gear'?D.RARITY[m].n:m+' 階'}以上，下一抽必出`).join('；')):null,h('div',{cls:'row'},h('button',{type:'button',cls:'btn pri',on:{click:closeModal}},'關閉')))}
function pull(bx,n){const out=openBox(bx.id,n);if(!out)return;renderHub();
  showModal(h('div',{cls:'resHead'},h('small',null,bx.n),h('h2',null,'召喚結果')),h('div',{cls:'pulls'},...out.map((o,i)=>{if(o.gear){const r=D.RARITY[o.gear.r];return h('div',{cls:'pl r'+o.gear.r,style:`--rc:${r.col};animation-delay:${i*.06}s`},svg(D.SLOTS[o.gear.slot].icon),h('b',null,o.gear.n),h('span',null,r.n))}
    const R=D.RUNES[o.rune.sys];return h('div',{cls:'pl r'+(o.rune.t+1),style:`--rc:${R.col};animation-delay:${i*.06}s`},svg('rune'),h('b',null,runeName(o.rune)),h('span',null,runeLine(o.rune)))})),
    h('div',{cls:'row'},h('button',{type:'button',cls:'btn',disabled:SAVE[bx.cur]<(n>=10?bx.cost10:bx.cost),on:{click:()=>pull(bx,n)}},'再抽 '+n+' 次'),h('button',{type:'button',cls:'btn pri',on:{click:closeModal}},'收下')))}

/* ---------- 任務 ---------- */
function renderQuests(){ensureDaily();const box=$('tabQuest');box.replaceChildren();box.append(title('每日任務','每天 0 點刷新 · 每項 '+D.DAILY.reward+' 魂晶'));
  for(const q of SAVE.daily.q){const def=D.DAILY.pool.find(x=>x.id===q.id),done=q.p>=def.t;
    box.append(h('div',{cls:'qst'+(q.c?' got':'')},h('div',null,h('b',null,def.n),h('div',{cls:'qbar'},h('i',{style:`width:${q.p/def.t*100}%`}),h('span',null,`${Math.floor(q.p)} / ${def.t}`))),
      h('button',{type:'button',cls:'btn sm '+(done&&!q.c?'pri':'ghost'),disabled:!done||q.c,on:{click:()=>{q.c=true;SAVE.crystals+=D.DAILY.reward;save();toast(`魂晶 +${D.DAILY.reward}`);renderHub()}}},q.c?'已領取':done?'領取':'未完成')))}
  const all=SAVE.daily.q.every(q=>q.c);box.append(h('div',{cls:'qst bonus'+(SAVE.daily.bonus?' got':'')},h('div',null,h('b',null,'完成全部每日任務'),h('small',null,'額外 '+D.DAILY.bonus+' 魂晶')),
    h('button',{type:'button',cls:'btn sm '+(all&&!SAVE.daily.bonus?'pri':'ghost'),disabled:!all||SAVE.daily.bonus,on:{click:()=>{SAVE.daily.bonus=true;SAVE.crystals+=D.DAILY.bonus;save();toast(`魂晶 +${D.DAILY.bonus}`);renderHub()}}},SAVE.daily.bonus?'已領取':'領取')));
  box.append(title('成就','一次性獎勵'));
  for(const a of D.ACHIEVEMENTS){const st=SAVE.ach[a.id];box.append(h('div',{cls:'qst'+(st==='claimed'?' got':'')},h('div',null,h('b',null,a.n),h('small',null,a.d)),
    h('button',{type:'button',cls:'btn sm '+(st==='ready'?'pri':'ghost'),disabled:st!=='ready',on:{click:()=>{SAVE.ach[a.id]='claimed';SAVE.crystals+=a.r;save();toast(`魂晶 +${a.r}`);renderHub()}}},st==='claimed'?'已領取':st==='ready'?`領取 ${a.r}`:`${a.r} 魂晶`)))}}

/* ---------- 天賦 ---------- */
function renderTal(){const box=$('tabTal');box.replaceChildren();const pts=talPoints();
  box.append(h('div',{cls:'ptsBox'},h('span',null,'可用天賦點（每升一級 +1）'),h('b',null,pts)));
  const cols=h('div',{cls:'talCols'});D.TALENTS.forEach(tr=>{const col=h('div',{cls:'talCol',style:'--tc:'+tr.col},h('h5',null,tr.tree,h('small',null,tr.desc)));
    tr.nodes.forEach(n=>{const r=tal(n.id),max=r>=n.max,can=pts>0&&!max;col.append(h('div',{cls:'tal'+(max?' max':'')},h('b',null,n.n),h('span',null,n.d),h('div',{cls:'pips'},Array.from({length:n.max},(_,i)=>h('i',{cls:i<r?'on':''}))),
      h('button',{type:'button',cls:can?'can':'',disabled:!can,on:{click:()=>{SAVE.tal[n.id]=r+1;save();renderHub()}}},max?'已滿':'升級')))});cols.append(col)});box.append(cols);
  box.append(title('里程碑','帳號等級到達時自動取得'),h('div',{cls:'mss'},...D.MILESTONES.map(m=>h('div',{cls:'ms'+(SAVE.lvl>=m.lv?' on':'')},h('b',null,'Lv '+m.lv),h('div',null,h('strong',null,m.n),h('span',null,m.d))))));
  const used=SAVE.lvl-1-pts;box.append(h('div',{cls:'row'},h('button',{type:'button',cls:'btn ghost',disabled:!used,on:{click:()=>{SAVE.tal={};save();renderHub();toast('天賦已重置')}}},'重置天賦（免費）')))}

/* ---------- 外觀 ---------- */
function setLook(k,v){SAVE.look=Object.assign({},LK.def,SAVE.look||{},{[k]:v});save();rebuildHero();if(hubChar&&Math.random()<.5)once(hubChar,'Cheer',1.6);renderLook()}
function renderLook(){const box=$('tabLook');box.replaceChildren();const L=Object.assign({},LK.def,SAVE.look||{});
  box.append(title('塑造亡者','隨時可以回來修改'));
  if(SAVE.style==='pixel')box.append(h('div',{cls:'empty',style:'margin-bottom:10px'},'目前是像素角色模式，外觀只會套用在 3D 模型。'));
  if(SAVE.showGear&&equipped().some(it=>['weapon','head','armor'].includes(it.slot)))box.append(h('div',{cls:'dnote',style:'margin-bottom:8px'},'「顯示裝備外觀」開啟中：主手、頭飾、布料顏色會跟著裝備。到「裝備」頁可以關閉。'));
  const step=(kind,label)=>{const list=LK[kind],i=Math.max(0,list.findIndex(x=>x.id===L[kind])),go=d=>setLook(kind,list[(i+d+list.length)%list.length].id);
    return h('div',{cls:'lkRow'},h('span',{cls:'lkL'},label),h('button',{type:'button',cls:'lkA','aria-label':'上一個',on:{click:()=>go(-1)}},'‹'),h('b',{cls:'lkV'},list[i].n),h('button',{type:'button',cls:'lkA','aria-label':'下一個',on:{click:()=>go(1)}},'›'))};
  const sw=(kind,label)=>h('div',{cls:'lkRow'},h('span',{cls:'lkL'},label),h('div',{cls:'lkSw'},...LK[kind].map((it,i)=>h('button',{type:'button',cls:'sw'+(L[kind]===i?' on':''),title:it.n,'aria-label':it.n,style:`--c:${it.c||it.sw}`,on:{click:()=>setLook(kind,i)}}))),h('small',{cls:'lkN'},LK[kind][L[kind]].n));
  box.append(step('body','骨架'),step('head','頭飾'),step('back','背後'),sw('eye','魂火'),sw('robe','布料'),step('weapon','主手'),step('off','副手'));
  const rand=()=>{const r=a=>Math.floor(Math.random()*a.length);SAVE.look={body:LK.body[r(LK.body)].id,head:LK.head[r(LK.head)].id,back:LK.back[r(LK.back)].id,weapon:LK.weapon[r(LK.weapon)].id,off:LK.off[r(LK.off)].id,eye:r(LK.eye),robe:r(LK.robe)};save();rebuildHero();renderLook()};
  box.append(h('div',{cls:'row'},h('button',{type:'button',cls:'btn ghost',on:{click:rand}},'隨機'),h('button',{type:'button',cls:'btn ghost',on:{click:()=>{SAVE.look=Object.assign({},LK.def);save();rebuildHero();renderLook()}}},'還原')));
  if(!SAVE.lookSet)box.append(h('div',{cls:'row'},h('button',{type:'button',cls:'btn pri',on:{click:()=>{SAVE.lookSet=true;save();switchTab('tabStage');toast('亡者已甦醒')}}},'就是這副骨頭，出發')));
  box.append(h('p',{cls:'lkNote'},'外觀只影響樣子，不影響數值。'))}

/* ---------- 角色風格（3D／像素彩蛋） ---------- */
function setStyle(st){if(!SAVE||SAVE.style===st)return;SAVE.style=st;save();
  if(hubChar){const p=hubChar.root.position.clone(),ry=hubChar.root.rotation.y;disposeChar(hubChar);hubChar=makeHero(.85,.8);hubChar.root.position.copy(p);hubChar.root.rotation.y=ry;hubG.add(hubChar.root);play(hubChar,'Idle')}
  if(P.c){const vis=P.c.root.visible&&!!RUN;disposeChar(P.c);P.c=makeHero(.78);if(RUN){scene.add(P.c.root);P.c.root.position.set(P.x,0,P.z);P.c.root.rotation.y=P.yaw;P.c.root.visible=vis||true;play(P.c,'Idle_Combat',0)}}
  for(const e of enemies){if(e.dead)continue;const d=e.d;disposeChar(e.c);e.c=makeActor(d.model,{scale:d.scale*(e.elite?D.ELITE.scale:1),eye:d.eye,tint:d.tint,recolor:d.recolor,show:d.show,wr:d.wr,wl:d.wl,emis:d.emis},e.key);e.c.root.position.set(e.x,d.fly||0,e.z);e.c.root.rotation.y=e.yaw;scene.add(e.c.root);play(e.c,'Idle_Combat',0)}
  syncStyleSeg();toast(st==='pixel'?'角色風格：像素（彩蛋）':'角色風格：3D 模型')}
function syncStyleSeg(){document.querySelectorAll('.styleSeg button').forEach(b=>b.classList.toggle('on',b.dataset.s===(SAVE&&SAVE.style||'model')))}
