/* 被遺忘者之路：局外成長（天賦、里程碑、每日任務、成就、貨幣） */
'use strict';
(function(D){

/* ---------- 貨幣 ---------- */
D.CURRENCY = {
  gold:     { n:'金幣',     col:'#e2b84d', icon:'gold' },
  shards:   { n:'骨片',     col:'#bfe4ff', icon:'shard' },
  crystals: { n:'魂晶',     col:'#5affe6', icon:'crystal' },
  dust:     { n:'符文粉塵', col:'#8fa8ff', icon:'dust' }
};

/* ---------- 帳號等級 ----------
 * 升級所需經驗：base + per × 等級 + sq × 等級²（前 10 級比較快） */
D.ACCT = { base:60, per:30, sq:4 };

/* ---------- 天賦 ----------
 * 每升一級帳號等級得 1 點；可免費重置 */
D.TALENTS = [
  { tree:'亡魂', col:'#c38cff', desc:'攻擊', nodes:[
    { id:'t_atk',  n:'骨弒',   d:'攻擊力 +5%',       max:5 },
    { id:'t_crit', n:'冷酷',   d:'爆擊率 +2%',       max:5 },
    { id:'t_spd',  n:'迅咒',   d:'攻擊速度 +4%',     max:5 },
    { id:'t_critM',n:'處決',   d:'爆擊傷害 +10%',    max:5 },
    { id:'t_elem', n:'元素師', d:'元素傷害 +6%',     max:5 } ] },
  { tree:'骨甲', col:'#93d95e', desc:'生存', nodes:[
    { id:'t_hp',   n:'硬骨',   d:'最大生命 +7%',     max:5 },
    { id:'t_def',  n:'麻木',   d:'受到傷害 -3%',     max:5 },
    { id:'t_regen',n:'癒骨',   d:'每秒回復 0.3% 最大生命', max:3 },
    { id:'t_heal', n:'營火守望', d:'營火與藥水回復 +10%', max:3 },
    { id:'t_rev',  n:'不死',   d:'每次副本可復活一次（50% 生命）', max:1 } ] },
  { tree:'怨咒', col:'#e2b84d', desc:'策略', nodes:[
    { id:'t_start',n:'先知',   d:'進入副本時先獲得一個隨機技能', max:1 },
    { id:'t_roll', n:'改命',   d:'每次副本可重抽三選一 1 次',     max:3 },
    { id:'t_xp',   n:'噬魂',   d:'局內經驗 +6%',                 max:5 },
    { id:'t_gold', n:'拾荒',   d:'金幣與骨片獲得 +10%',          max:5 },
    { id:'t_minion',n:'統御',  d:'召喚物傷害 +8%',               max:5 },
    { id:'t_magnet',n:'吸魂',  d:'拾取範圍 +20%',                max:3 } ] }
];

/* ---------- 里程碑（帳號等級到達時自動取得） ---------- */
D.MILESTONES = [
  { lv:5,  id:'ms_roll',  n:'命運之線', d:'每局多 1 次重抽' },
  { lv:10, id:'ms_rare',  n:'亡者的饋贈', d:'開局獲得一個稀有技能' },
  { lv:15, id:'ms_xp',    n:'靈魂熔爐', d:'局內經驗 +15%' },
  { lv:20, id:'ms_epic',  n:'不朽傳承', d:'開局獲得一個史詩技能' }
];

/* ---------- 每日任務（每天隨機 3 個；台灣時間 0 點刷新） ---------- */
D.DAILY = {
  pick:3, reward:30, bonus:40,
  pool:[
    { id:'kill',   n:'擊殺 150 名敵人',         t:150 },
    { id:'room',   n:'通過 25 個房間',           t:25 },
    { id:'main',   n:'通關任一主線章節',         t:1 },
    { id:'mat',    n:'完成素材關或掃蕩 2 次',    t:2 },
    { id:'active', n:'施放主動技 6 次',          t:6 },
    { id:'box',    n:'開啟任一抽卡箱 1 次',      t:1 },
    { id:'up',     n:'強化裝備 2 次',            t:2 },
    { id:'pick',   n:'在副本中選擇 15 次技能',   t:15 },
    { id:'elite',  n:'擊敗 2 名菁英怪',          t:2 }
  ]
};

/* ---------- 成就（一次性，給魂晶） ---------- */
D.ACHIEVEMENTS = [
  { id:'a_c1',   n:'走出墓窖',     d:'首次通關第一章', ev:'clear:c1', r:50 },
  { id:'a_c2',   n:'聖團之敵',     d:'首次通關第二章', ev:'clear:c2', r:80 },
  { id:'a_c3',   n:'腐林淨化者',   d:'首次通關第三章', ev:'clear:c3', r:120 },
  { id:'a_c4',   n:'屠龍者',       d:'首次通關第四章', ev:'clear:c4', r:160 },
  { id:'a_c5',   n:'魔淵終結',     d:'首次通關第五章', ev:'clear:c5', r:220 },
  { id:'a_evo',  n:'質變',         d:'第一次在副本中選擇進化技能', ev:'evo', r:60 },
  { id:'a_bar',  n:'彈幕大師',     d:'帶著 4 個以上「彈幕」技能通關主線', ev:'school:bar', r:80 },
  { id:'a_ele',  n:'元素大師',     d:'帶著 4 個以上「元素」技能通關主線', ev:'school:ele', r:80 },
  { id:'a_sum',  n:'亡靈大師',     d:'帶著 4 個以上「亡靈召喚」技能通關主線', ev:'school:sum', r:80 },
  { id:'a_bone', n:'骨甲大師',     d:'帶著 4 個以上「骨甲生存」技能通關主線', ev:'school:bone', r:80 },
  { id:'a_ghost',n:'幽魂大師',     d:'帶著 4 個以上「幽魂身法」技能通關主線', ev:'school:ghost', r:80 },
  { id:'a_lv10', n:'老骨頭',       d:'帳號等級達到 10', ev:'lv:10', r:50 },
  { id:'a_lv20', n:'古老亡魂',     d:'帳號等級達到 20', ev:'lv:20', r:100 },
  { id:'a_merge',n:'熔骨',         d:'第一次合成裝備', ev:'merge', r:30 },
  { id:'a_myth', n:'神話降臨',     d:'取得一件神話裝備', ev:'myth', r:150 },
  { id:'a_kill', n:'千骨之路',     d:'累計擊殺 1000 名敵人', ev:'kills:1000', r:60 },
  { id:'a_hard', n:'無懼',         d:'以困難難度通關任一章節', ev:'diff:h', r:100 }
];

})(window.POF_DATA);
