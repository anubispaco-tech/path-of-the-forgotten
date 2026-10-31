/* 被遺忘者之路 · 遊玩數據（送到 GAS 試算表）
 * 開發者標記：網址加 ?dev=1（取消用 ?dev=0），會記在這份存檔裡
 * 自訂名稱：網址加 ?name=你的名字
 * 關閉遙測：把 TEL_URL 清空 */
'use strict';
const TEL_URL='https://script.google.com/macros/s/AKfycbxD2gvTSVyPAempBsjuVoj-ugKVlbDm8gBSXeC63r-Sgn9FQCN50O4LIEyGccix8lPhBQ/exec';
const TEL_VER='0.5.5';
const TEL={q:[],timer:0,ready:false};

function telPid(){if(!SAVE.pid)SAVE.pid='p'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);return SAVE.pid}
function telName(){return SAVE.tname||(SAVE.dev?'dev':'亡者'+telPid().slice(-4))}
function telPower(){try{const s=baseStats();return Math.round(s.atk*s.aspd*(1+s.crit*(s.critM-1))*Math.sqrt(s.hp/(1-s.def)))}catch(e){return 0}}
function telClears(){return Object.keys(SAVE.clear||{}).filter(k=>SAVE.clear[k]).sort().join(',')}
function telBest(){let b='';for(const st of(D.STAGES||[]))if(st.type==='main'&&SAVE.clear[st.id])b=st.id;return b}

// 送事件：ev 為事件名稱，x 為附加欄位（ch、room 會獨立成欄）
function tel(ev,x){if(!TEL_URL||!SAVE)return;try{
  const o=Object.assign({ev,ts:Date.now(),acct:SAVE.lvl},x||{});
  if(RUN&&o.ch==null){o.ch=RUN.stage.id;if(RUN.diff&&RUN.diff.id!=='n')o.diff=RUN.diff.id}
  if(RUN&&o.room==null)o.room=RUN.roomN;
  TEL.q.push(o);
  if(/^(run_end|death|snapshot|gacha|quit)$/.test(ev)||TEL.q.length>=20)telFlush();
  else{clearTimeout(TEL.timer);TEL.timer=setTimeout(telFlush,30000)}}catch(e){}}

function telFlush(){if(!TEL_URL||!SAVE||!TEL.q.length)return;clearTimeout(TEL.timer);
  const body={pid:telPid(),name:telName(),dev:!!SAVE.dev,ver:TEL_VER,acct:SAVE.lvl,runs:SAVE.runs,kills:SAVE.kills||0,
    clears:telClears(),best:telBest(),power:telPower(),events:TEL.q.splice(0,60)};
  try{const s=JSON.stringify(body);
    // text/plain + no-cors：避開 GAS 的 CORS 預檢；sendBeacon 讓關掉 App 時也送得出去
    if(document.visibilityState==='hidden'&&navigator.sendBeacon)navigator.sendBeacon(TEL_URL,new Blob([s],{type:'text/plain'}));
    else fetch(TEL_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:s,keepalive:true}).catch(()=>{})}catch(e){}
  if(TEL.q.length)setTimeout(telFlush,1500)}

function telBoot(){if(!SAVE||TEL.ready)return;TEL.ready=true;
  const u=new URLSearchParams(location.search);
  if(u.has('dev'))SAVE.dev=u.get('dev')!=='0';
  if(u.get('name'))SAVE.tname=u.get('name').slice(0,16);
  telPid();
  // 第一次接上遙測：把既有存檔當成起點送一份快照
  if(!SAVE.telSince){SAVE.telSince=Date.now();
    // 試算表一格明細上限 450 字，欄位壓成短字串
    const gear=equipped().map(it=>it.slot[0]+it.r+'L'+it.lv+'+'+it.up).join(' ');
    const talS=Object.keys(SAVE.tal).filter(k=>SAVE.tal[k]).map(k=>k.replace(/^t_/,'')+SAVE.tal[k]).join(' ');
    tel('snapshot',{xp:SAVE.xp,gold:SAVE.gold,cry:SAVE.crystals,sh:SAVE.shards,dust:SAVE.dust,
      tal:talS,gear,inv:SAVE.inv.length,runes:SAVE.runes.length,pity:[SAVE.pity.soul,SAVE.pity.soulL,SAVE.pity.rune].join('/'),
      ach:Object.keys(SAVE.ach||{}).length,unl:(SAVE.unl||[]).length,new:!SAVE.runs})}
  save();
  tel('open',{touch:typeof isTouch!=='undefined'&&!!isTouch,pwa:matchMedia('(display-mode: standalone)').matches,w:innerWidth,h:innerHeight});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(RUN&&!RUN.ended)tel('bg',{rlv:RUN.rlv});telFlush()}});
  addEventListener('pagehide',telFlush)}

// 局內小工具
function telPerks(){const out=[];if(!RUN)return'';for(const id in RUN.perks)out.push(id+(RUN.perks[id]>1?'x'+RUN.perks[id]:''));return out.join(' ')}
function telHp(){return RUN&&RUN.maxHp?Math.round(RUN.hp/RUN.maxHp*100):0}
function telSrc(src){if(!src)return'dot';const k=src.key||(src.src&&src.src.key)||'?';return k+(src.elite?'*':'')+(src.boss?'!':'')}

addEventListener('load',()=>setTimeout(telBoot,500));
