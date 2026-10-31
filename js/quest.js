/* 被遺忘者之路 · 世界地圖與區域任務線
 * 資料在 data/quests.js；任務進度存在 SAVE.qst = { done:{id:true}, prog:{id:n}, seen:{id:true} }
 * 進度用「包一層」的方式掛在 killEnemy / openEvent / endRun / enterRoom / hurtP / waveCleared 上 */
'use strict';

/* ================= 狀態 ================= */
function qState(){if(!SAVE.qst)SAVE.qst={done:{},prog:{},seen:{}};const Q=SAVE.qst;Q.done=Q.done||{};Q.prog=Q.prog||{};Q.seen=Q.seen||{};return Q}
const stageById=id=>D.STAGES.find(s=>s.id===id);
function stageOpen(id){const st=stageById(id);return!!st&&(!st.req||!!SAVE.clear[st.req])}
function npcOpen(id){return stageOpen(D.NPCS[id].where)}
function npcChain(id){return D.QUESTS.filter(q=>q.npc===id)}
function curQuest(id){const Q=qState();return npcChain(id).find(q=>!Q.done[q.id])||null}
function activeQuests(){const out=[];for(const id in D.NPCS){if(!npcOpen(id))continue;const q=curQuest(id);if(q)out.push(q)}return out}
function qProg(q){return Math.min(q.n,qState().prog[q.id]||0)}
function qReady(q){return qProg(q)>=q.n}
function npcMark(id){if(!npcOpen(id))return'';const q=curQuest(id);if(!q)return'';if(qReady(q))return'?';return qState().seen[q.id]?'':'!'}
const DIFF_RANK={n:0,h:1,x:2};

function qGoal(q){const st=q.st&&stageById(q.st),sn=st?st.name:'';
  const en=k=>D.ENEMIES[k].n.split(' · ')[0];
  switch(q.type){
    case'kill':return`${sn?'在'+sn:''}擊敗${q.k.map(en).join('、')}`;
    case'elite':return`在${sn}擊敗菁英`;
    case'boss':return`擊敗${[].concat(st.boss).map(en).join(' & ')}`;
    case'clear':return`${st?'通關'+sn:'通關任一主線'}${q.diff?'（'+D.DIFFS.find(d=>d.id===q.diff).n+'以上）':''}`;
    case'streak':return`單局連殺達到 ${q.n}`;
    case'event':return`在${sn}遇到${q.e.map(id=>D.EVENTS.find(e=>e.id===id).n).join('或')}`;
    case'nohit':return`在${sn}無傷清完戰鬥房`;
    default:return q.t}}
function rewardChips(r){const out=[];for(const k of['xp','gold','shards','dust','crystals']){if(!r[k])continue;
  const lab={xp:'帳號經驗',gold:'金幣',shards:'骨片',dust:'粉塵',crystals:'魂晶'}[k],ic={xp:'xp',gold:'gold',shards:'shard',dust:'dust',crystals:'crystal'}[k];
  out.push(h('span',{cls:'rw'},svg(ic),`${lab} +${fmt(r[k])}`))}return h('div',{cls:'rws'},...out)}

/* ================= 進度 ================= */
let qToastT=0;
function qAdd(type,match,amount,setMax){if(!SAVE)return;const Q=qState();
  for(const q of activeQuests()){if(q.type!==type||qReady(q)||!match(q))continue;const before=Q.prog[q.id]||0;
    Q.prog[q.id]=setMax?Math.max(before,amount):before+(amount||1);const p=qProg(q);if(p===before)continue;
    if(p>=q.n){banner('任務完成',`${q.t} · 回到地圖找${D.NPCS[q.npc].n.split(' ')[1]}領獎`,'#ffd04a');if(typeof sfx==='function')sfx('streak',5);tel('quest_ready',{q:q.id});save()}
    else{const now=performance.now();if(now-qToastT>1500||p===1){qToastT=now;toast(`任務「${q.t}」${p} / ${q.n}`)}}}}

function claimQuest(q){if(!qReady(q))return;const Q=qState(),r=q.reward||{};Q.done[q.id]=true;
  SAVE.gold+=r.gold||0;SAVE.shards+=r.shards||0;SAVE.dust+=r.dust||0;SAVE.crystals+=r.crystals||0;
  const lv0=SAVE.lvl;SAVE.xp+=r.xp||0;while(SAVE.xp>=xpNeed(SAVE.lvl)){SAVE.xp-=xpNeed(SAVE.lvl);SAVE.lvl++}ach('lv:'+SAVE.lvl);
  save();tel('quest',{q:q.id});if(typeof sfx==='function')sfx('lvl');
  toast(SAVE.lvl>lv0?`任務完成！帳號等級提升至 ${SAVE.lvl}`:'任務完成！獎勵已領取')}

/* ================= 包住戰鬥函式 ================= */
const _qKill=killEnemy;
killEnemy=function(e,src){_qKill(e,src);if(!RUN)return;const st=RUN.stage.id;
  qAdd('kill',q=>q.k.includes(e.key)&&(!q.st||q.st===st));
  if(e.elite)qAdd('elite',q=>!q.st||q.st===st);
  if(e.boss&&!enemies.some(o=>o.boss&&!o.dead))qAdd('boss',q=>q.st===st);
  if(RUN.bestStreak)qAdd('streak',()=>true,RUN.bestStreak,true)};
const _qEvent=openEvent;
openEvent=function(id){_qEvent(id);if(RUN)qAdd('event',q=>q.e.includes(id)&&(!q.st||q.st===RUN.stage.id))};
const _qEnd=endRun;
endRun=function(win){const run=RUN,already=run&&run.ended;_qEnd(win);if(!run||already||!win)return;
  qAdd('clear',q=>(!q.st||q.st===run.stage.id)&&(!q.diff||DIFF_RANK[run.diff.id]>=DIFF_RANK[q.diff])&&(q.st||run.stage.type==='main'));save()};
const _qEnter=enterRoom;
enterRoom=function(n){if(RUN)RUN.qHurt=false;return _qEnter(n)};
const _qHurt=hurtP;
hurtP=function(d,s,dot){const hp0=RUN&&RUN.hp;_qHurt(d,s,dot);if(RUN&&RUN.hp<hp0)RUN.qHurt=true};
const _qWave=waveCleared;
waveCleared=function(){const c0=RUN&&RUN.cleared,type=RUN&&RUN.type;_qWave();if(!RUN||RUN.cleared===c0)return;
  if((type==='battle'||type==='elite')&&!RUN.qHurt)qAdd('nohit',q=>q.st===RUN.stage.id)};
const _qStart=startRun;
startRun=function(id,o){closeModal();return _qStart(id,o)};

/* ================= NPC 對話 ================= */
function npcFace(id,big){const n=D.NPCS[id],k=big?4:2,[x,y]=n.face;
  return h('i',{cls:'npcFace'+(big?' big':''),style:`--k:${k};background-position:${-x*k}px ${-y*k}px;--nc:${n.col}`})}
function npcModal(id,back){const n=D.NPCS[id],q=curQuest(id),Q=qState();if(q)Q.seen[q.id]=true;save();
  const chain=npcChain(id),doneN=chain.filter(x=>Q.done[x.id]).length;
  const kids=[h('div',{cls:'npcHead'},npcFace(id,true),h('div',null,h('small',null,stageById(n.where).name+` · 任務 ${doneN} / ${chain.length}`),h('h2',null,n.n)))];
  if(!q){kids.push(h('p',{cls:'npcSay'},'「'+chain[chain.length-1].done+'」'),h('div',{cls:'qDone'},'這一區的任務都完成了'))}
  else{const ready=qReady(q),p=qProg(q);
    kids.push(h('div',{cls:'qTitle'},h('b',null,q.t),h('span',null,ready?'可以領獎':'進行中')),
      h('p',{cls:'npcSay'},'「'+(ready?q.done:q.say)+'」'),
      h('div',{cls:'qGoal'},h('span',null,qGoal(q)),h('div',{cls:'qbar'},h('i',{style:`width:${p/q.n*100}%`}),h('span',null,`${p} / ${q.n}`))),
      rewardChips(q.reward||{}))}
  kids.push(h('div',{cls:'row'},back?h('button',{type:'button',cls:'btn ghost',on:{click:back}},'返回'):h('button',{type:'button',cls:'btn ghost',on:{click:closeModal}},'關閉'),
    q&&qReady(q)?h('button',{type:'button',cls:'btn gold',on:{click:()=>{claimQuest(q);renderHub();npcModal(id,back)}}},'領取獎勵'):null));
  showModal(...kids);renderHubDots()}

/* ================= 世界地圖 ================= */
const SVGNS='http://www.w3.org/2000/svg';
function sv(tag,attrs,...kids){const e=document.createElementNS(SVGNS,tag);for(const k in attrs||{})if(attrs[k]!=null)e.setAttribute(k,attrs[k]);for(const c of kids)if(c!=null)e.append(c);return e}
// 地圖圖示（以節點為中心、約 ±4 的範圍）
const MAP_ICON={
  crypt:'M-3 3V-1a3 3 0 016 0v4zM-1 0h2M0-1v2',
  abbey:'M-3 3v-4l3-3 3 3v4zM0-6v-3M-1-8h2',
  grove:'M0 4v-3M-3 1l3-5 3 5zM-2-1l2-4 2 4z',
  peak:'M-4 3l3-6 2 3 1-2 2 5zM-1-3l1 1 1-1',
  abyss:'M0 4c-3 0-4-2-3-4 1 1 1 1 1 0 0-2 1-3 2-5 0 2 2 3 2 5 1 0 1-1 1-2 1 2 0 6-3 6z',
  bones:'M-3-2l6 4M-3 2l6-4M-3.5-2.5a1 1 0 100 1M3.5 2.5a1 1 0 100-1',
  vault:'M-3 3h6M-3 0h6v3h-6zM0-4l4 3h-8z',
  runes:'M0-4l3 4-3 4-3-4zM0-2v4',
  mine:'M-2 3l-1-3 2-4 2 1 1-1 1 3-1 4z'
};
function renderWorld(box){const W=D.WORLD,Q=qState();
  const wrap=h('div',{cls:'worldWrap'});box.append(title(W.name,'點地點查看副本與任務'),wrap);
  const s=sv('svg',{viewBox:'0 0 100 150',class:'worldMap'});
  const defs=sv('defs',null,
    sv('radialGradient',{id:'wmSea',cx:'50%',cy:'45%',r:'75%'},sv('stop',{offset:'0',['stop-color']:'#1b1a26'}),sv('stop',{offset:'1',['stop-color']:'#08070c'})),
    sv('linearGradient',{id:'wmLand',x1:'0',y1:'1',x2:'0',y2:'0'},sv('stop',{offset:'0',['stop-color']:'#2e2a22'}),sv('stop',{offset:'.45',['stop-color']:'#24302a'}),sv('stop',{offset:'.7',['stop-color']:'#2a3540'}),sv('stop',{offset:'1',['stop-color']:'#3a1a1e'})),
    sv('filter',{id:'wmGlow',x:'-50%',y:'-50%',width:'200%',height:'200%'},sv('feGaussianBlur',{stdDeviation:'1.6'})));
  s.append(defs,sv('rect',{x:0,y:0,width:100,height:150,rx:4,fill:'url(#wmSea)'}));
  // 大陸輪廓
  s.append(sv('path',{d:'M8 142C2 128 4 112 2 98 1 86 10 76 16 70 22 60 12 46 16 32 20 16 34 8 48 10 60 12 74 20 80 30 90 40 98 52 96 66 94 80 98 92 96 106 94 120 98 134 90 142 78 148 58 146 44 147 30 148 16 148 8 142Z',fill:'url(#wmLand)',stroke:'#5a4f3a',['stroke-width']:.6,['stroke-dasharray']:'1.2 .8'}));
  // 地形點綴：墓地、修道院紅、森林、雪山、魔淵熔岩
  const deco=sv('g',{opacity:.55});
  [[14,118],[28,140],[40,124]].forEach(([x,y])=>deco.append(sv('path',{d:`M${x-1} ${y+1}v-2a1 1 0 012 0v2z`,fill:'#8a8270'})));
  [[60,98],[80,114],[74,100]].forEach(([x,y])=>deco.append(sv('rect',{x:x-1,y:y-1,width:2,height:2,fill:'#7a2a2a'})));
  for(let i=0;i<14;i++){const x=18+((i*37)%30),y=72+((i*23)%26);deco.append(sv('path',{d:`M${x} ${y+2}l1.5-3 1.5 3z`,fill:'#3f6a3a'}))}
  for(let i=0;i<7;i++){const x=52+((i*17)%34),y=42+((i*13)%22);deco.append(sv('path',{d:`M${x-3} ${y+2}l3-5 3 5z`,fill:'#9fb8c8'}),sv('path',{d:`M${x-1} ${y-1}l1-2 1 2z`,fill:'#e8f4ff'}))}
  for(let i=0;i<6;i++){const x=16+((i*19)%32),y=12+((i*11)%16);deco.append(sv('circle',{cx:x,cy:y,r:1.4,fill:'#ff5a2a',opacity:.7}))}
  s.append(deco);
  const node=id=>W.nodes.find(n=>n.id===id);
  // 道路
  const road=(a,b,side)=>{const A=node(a),B=node(b),open=stageOpen(b),mx=(A.x+B.x)/2+(side?0:(A.y>B.y?6:-6)),my=(A.y+B.y)/2;
    return sv('path',{d:`M${A.x} ${A.y}Q${mx} ${my} ${B.x} ${B.y}`,fill:'none',stroke:open?(side?'#8a7a5a':'#e2b84d'):'#4a4438',['stroke-width']:side?.7:1.2,['stroke-dasharray']:open?(side?'1.5 1':'none'):'1.5 1.5',opacity:open?.95:.6})};
  for(let i=0;i<W.road.length-1;i++)s.append(road(W.road[i],W.road[i+1]));
  for(const[a,b]of W.side)s.append(road(a,b,true));
  // 目前前線：最後一個已開放的主線
  const front=[...W.road].reverse().find(stageOpen);
  // 節點
  for(const n of W.nodes){const st=stageById(n.id),open=stageOpen(n.id),main=st.type==='main',cl=SAVE.clear[n.id];
    const npc=Object.keys(D.NPCS).find(k=>D.NPCS[k].where===n.id),mark=npc?npcMark(npc):'';
    const c=D.THEMES[st.theme].card,r=main?5.2:3.8;
    const g=sv('g',{class:'wmNode'+(open?'':' lock'),transform:`translate(${n.x} ${n.y})`,tabindex:0,role:'button','aria-label':st.name});
    if(n.id===front)g.append(sv('circle',{r:r+3,fill:'none',stroke:'#e2b84d',['stroke-width']:.6,class:'wmPulse'}));
    if(open)g.append(sv('circle',{r:r+1.5,fill:c[2],opacity:.35,filter:'url(#wmGlow)'}));
    g.append(sv('circle',{r,fill:open?c[0]:'#1a1916',stroke:open?c[2]:'#4a4438',['stroke-width']:main?.9:.6}));
    g.append(sv('path',{d:MAP_ICON[n.icon],fill:'none',stroke:open?'#f2ead8':'#6a6252',['stroke-width']:.75,['stroke-linecap']:'round',['stroke-linejoin']:'round',transform:main?'scale(.95)':'scale(.7)'}));
    if(cl)g.append(sv('circle',{cx:r*.75,cy:r*.75,r:1.6,fill:'#5fbf4a',stroke:'#0b0a0e',['stroke-width']:.4}),sv('path',{d:`M${r*.75-.8} ${r*.75}l.6.6 1.1-1.2`,fill:'none',stroke:'#fff',['stroke-width']:.45}));
    if(!open)g.append(sv('path',{d:'M-1.3 0v-1a1.3 1.3 0 012.6 0v1M-1.8 0h3.6v2.4h-3.6z',fill:'#0b0a0e',stroke:'#7a7262',['stroke-width']:.45,transform:'translate(0 .6)'}));
    if(mark){g.append(sv('g',{transform:`translate(${-r*.8} ${-r*.9})`,class:'wmMark'},sv('circle',{r:2.2,fill:mark==='?'?'#ffd04a':'#e2b84d',stroke:'#0b0a0e',['stroke-width']:.5}),sv('text',{y:1.05,['text-anchor']:'middle',['font-size']:3,['font-weight']:900,fill:'#1a1206'},mark)))}
    const label=sv('text',{y:r+4.2,['text-anchor']:'middle',['font-size']:main?3.1:2.5,fill:open?'#efe6d0':'#6a6252',class:'wmLabel'},st.name);g.append(label);
    if(main&&open){const best=SAVE.clear[n.id+':x']?'地獄':SAVE.clear[n.id+':h']?'困難':cl?'普通':'';if(best)g.append(sv('text',{y:r+7,['text-anchor']:'middle',['font-size']:2.1,fill:best==='地獄'?'#ff6a6a':best==='困難'?'#ffa53a':'#9a927e'},'已通關 '+best))}
    g.addEventListener('click',()=>regionModal(n.id));g.addEventListener('keydown',e=>{if(e.key==='Enter')regionModal(n.id)});s.append(g)}
  wrap.append(s);
  // 地圖下方：進行中的區域任務
  const act=activeQuests();if(act.length){box.append(title('區域任務',`${act.filter(qReady).length} 個可以領獎`));
    box.append(h('div',{cls:'qMini'},...act.map(q=>{const p=qProg(q),ready=qReady(q);return h('button',{type:'button',cls:'qm'+(ready?' ready':''),on:{click:()=>npcModal(q.npc)}},npcFace(q.npc),
      h('div',null,h('b',null,q.t),h('span',null,qGoal(q)),h('div',{cls:'qbar'},h('i',{style:`width:${p/q.n*100}%`}),h('span',null,`${p} / ${q.n}`))),h('em',null,ready?'領獎':''))})))}}
function regionModal(id){const st=stageById(id),npc=Object.keys(D.NPCS).find(k=>D.NPCS[k].where===id);
  const re=()=>{regionModal(id)};const card=st.type==='main'?stageCardMain(st,re):stageCardMat(st,re);
  const kids=[card];
  if(npc&&stageOpen(id)){const q=curQuest(npc),mark=npcMark(npc);kids.push(h('button',{type:'button',cls:'npcBtn'+(mark==='?'?' ready':''),on:{click:()=>npcModal(npc,re)}},npcFace(npc),
    h('div',null,h('small',null,'區域 NPC'),h('b',null,D.NPCS[npc].n),h('span',null,q?(qReady(q)?'任務完成，點我領獎':`任務：${q.t}`):'任務全部完成')),mark?h('em',null,mark):null))}
  kids.push(h('div',{cls:'row'},h('button',{type:'button',cls:'btn ghost',on:{click:()=>{closeModal();renderHub()}}},'關閉')));
  showModal(...kids);$('modalBox').classList.add('regionBox')}
const _qClose=closeModal;
closeModal=function(){const b=$('modalBox');if(b)b.classList.remove('regionBox');return _qClose()};
// 出征頁紅點：有任務可領獎或新任務
function renderHubDots(){const any=Object.keys(D.NPCS).some(id=>npcMark(id)!=='');const b=document.querySelector('.hubNav button[data-tab="tabStage"]');if(!b)return;
  let d=b.querySelector('.dot');if(!d){d=h('i',{cls:'dot'});b.append(d)}d.hidden=!any}
const _qDots=setDots;
setDots=function(){_qDots();try{renderHubDots()}catch(e){}};
// 任務頁最上方也列出區域任務
const _qRQ=renderQuests;
renderQuests=function(){_qRQ();const box=$('tabQuest'),act=activeQuests();if(!act.length)return;
  const head=title('區域任務','到世界地圖找 NPC 領獎'),list=h('div',{cls:'qMini'},...act.map(q=>{const p=qProg(q),ready=qReady(q);
    return h('button',{type:'button',cls:'qm'+(ready?' ready':''),on:{click:()=>npcModal(q.npc)}},npcFace(q.npc),h('div',null,h('b',null,q.t),h('span',null,qGoal(q)),h('div',{cls:'qbar'},h('i',{style:`width:${p/q.n*100}%`}),h('span',null,`${p} / ${q.n}`))),h('em',null,ready?'領獎':''))}));
  box.prepend(head,list)};
