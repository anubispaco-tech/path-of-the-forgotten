/* 被遺忘者之路：局內技能（三選一）、進化、主動技
 * sch：流派；rar：稀有度（c 普通、r 稀有、e 史詩、l 傳說）；max：最多幾級
 * 傳說技能只從菁英房、儀式挑戰、詛咒祭壇取得
 * 進化（evo）：need 裡的技能都達到指定等級後，才會出現在三選一裡
 * 效果寫在 js/combat.js，搜尋 perk('技能id') 就找得到 */
'use strict';
(function(D){

D.SCHOOLS = {
  bar:  { n:'彈幕',     col:'#c38cff' },
  ele:  { n:'元素',     col:'#7df9ff' },
  sum:  { n:'亡靈召喚', col:'#9dff6a' },
  bone: { n:'骨甲生存', col:'#e8d9a8' },
  ghost:{ n:'幽魂身法', col:'#9fb4ff' },
  gen:  { n:'通用',     col:'#ff8a6a' }
};

D.PERK_RAR = {
  c: { n:'普通', col:'#c9c2b0', w:62 },
  r: { n:'稀有', col:'#5fb2ff', w:30 },
  e: { n:'史詩', col:'#c38cff', w:8 },
  l: { n:'傳說', col:'#ffa53a', w:0 }
};

D.PERKS = [
  // 通用
  { id:'atk',    n:'怨念強化',   sch:'gen',  rar:'c', max:6, icon:'atk',    d:'攻擊力 +22%。' },
  { id:'spd',    n:'迅捷咒文',   sch:'gen',  rar:'c', max:5, icon:'spd',    d:'攻擊速度 +16%。' },
  { id:'crit',   n:'致命凋零',   sch:'gen',  rar:'r', max:4, icon:'crit',   d:'爆擊率 +10%，爆擊傷害 +25%。' },
  { id:'xpup',   n:'靈魂吸收',   sch:'gen',  rar:'c', max:2, icon:'xp',     d:'局內經驗 +25%，拾取範圍 +50%。' },
  { id:'heal',   n:'亡者的慰藉', sch:'gen',  rar:'c', max:99, w:0, icon:'heal', d:'立即回復 40% 最大生命。' },
  // 彈幕
  { id:'multi',  n:'連續施法',   sch:'bar',  rar:'r', max:3, icon:'multi',  d:'每次攻擊多發射一輪暗影彈。' },
  { id:'front',  n:'並列飛彈',   sch:'bar',  rar:'r', max:3, icon:'front',  d:'正前方多一發暗影彈。' },
  { id:'diag',   n:'扇形射擊',   sch:'bar',  rar:'r', max:2, icon:'diag',   d:'額外向左右斜前方各射一發。' },
  { id:'back',   n:'後方詛咒',   sch:'bar',  rar:'c', max:2, icon:'back',   d:'向身後射出一發暗影彈。' },
  { id:'side',   n:'側翼射擊',   sch:'bar',  rar:'c', max:1, icon:'side',   d:'向左右兩側各射出一發暗影彈。' },
  { id:'pierce', n:'穿魂',       sch:'bar',  rar:'r', max:2, icon:'pierce', d:'暗影彈可以穿透一名敵人。' },
  { id:'bounce', n:'靈魂彈跳',   sch:'bar',  rar:'r', max:3, icon:'bounce', d:'命中後彈向附近另一名敵人。' },
  { id:'wall',   n:'迴響',       sch:'bar',  rar:'c', max:1, icon:'wall',   d:'暗影彈碰到牆壁會反彈兩次。' },
  { id:'big',    n:'巨魂彈',     sch:'bar',  rar:'e', max:1, icon:'big',    d:'暗影彈變大，傷害 +35%。' },
  // 元素
  { id:'frost',  n:'寒骨之觸',   sch:'ele',  rar:'r', max:1, icon:'frost',  d:'命中使敵人緩速 40%，持續 2 秒。' },
  { id:'fire',   n:'邪火',       sch:'ele',  rar:'r', max:1, icon:'fire',   d:'命中點燃敵人，每秒造成攻擊力 35% 傷害。' },
  { id:'chain',  n:'連鎖閃電',   sch:'ele',  rar:'r', max:3, icon:'chain',  d:'命中時 30% 機率放出閃電，連鎖到附近 1 名敵人（每級 +1）。' },
  { id:'plague', n:'瘟疫毒雲',   sch:'ele',  rar:'r', max:2, icon:'plague', d:'敵人死亡時留下毒雲，持續傷害附近敵人。' },
  { id:'elem',   n:'元素親和',   sch:'ele',  rar:'c', max:3, icon:'elem',   d:'燃燒、毒雲、閃電、冰霜傷害 +30%。' },
  { id:'nova',   n:'寒冰新星',   sch:'ele',  rar:'e', max:1, icon:'nova',   d:'每 6 秒在身邊爆發冰環，傷害並緩速周圍敵人。' },
  // 亡靈召喚
  { id:'minion', n:'骷髏僕從',   sch:'sum',  rar:'r', max:3, icon:'minion', d:'召喚一名骷髏僕從為你作戰（每級 +1 名）。' },
  { id:'orbit',  n:'環繞頭骨',   sch:'sum',  rar:'r', max:3, icon:'orbit',  d:'兩顆燃燒的頭骨繞著你旋轉，觸碰造成傷害。' },
  { id:'corpse', n:'屍爆',       sch:'sum',  rar:'r', max:2, icon:'corpse', d:'敵人死亡時 35% 機率爆炸，傷害周圍敵人。' },
  { id:'command',n:'亡者號令',   sch:'sum',  rar:'c', max:3, icon:'command',d:'僕從、頭骨、屍爆傷害 +30%。' },
  { id:'raise',  n:'屍骸復甦',   sch:'sum',  rar:'e', max:1, icon:'raise',  d:'擊殺敵人時 15% 機率讓它復活為你作戰 10 秒。' },
  // 骨甲生存
  { id:'hp',     n:'骨骼增生',   sch:'bone', rar:'c', max:5, icon:'hp',     d:'最大生命 +25%，並回復等量生命。' },
  { id:'armor',  n:'骨甲',       sch:'bone', rar:'c', max:3, icon:'armor',  d:'受到的傷害 -12%。' },
  { id:'leech',  n:'吞噬靈魂',   sch:'bone', rar:'r', max:3, icon:'leech',  d:'每擊殺一名敵人回復 3% 最大生命。' },
  { id:'thorns', n:'荊棘骨刺',   sch:'bone', rar:'r', max:2, icon:'thorns', d:'受到攻擊時反擊攻擊者，造成攻擊力 80% 傷害。' },
  { id:'regen',  n:'不朽之軀',   sch:'bone', rar:'c', max:3, icon:'regen',  d:'每秒回復 0.6% 最大生命。' },
  { id:'bshield',n:'骨盾',       sch:'bone', rar:'e', max:1, icon:'bshield',d:'每 8 秒產生一面骨盾，抵擋一次傷害。' },
  // 幽魂身法
  { id:'move',   n:'幽魂步',     sch:'ghost',rar:'c', max:3, icon:'move',   d:'移動速度 +12%。' },
  { id:'mcast',  n:'移動施法',   sch:'ghost',rar:'r', max:2, icon:'mcast',  d:'移動中的攻擊速度 +20%（最高與站立相同）。' },
  { id:'dodge',  n:'虛化',       sch:'ghost',rar:'r', max:3, icon:'dodge',  d:'8% 機率完全閃避傷害。' },
  { id:'trail',  n:'冥影殘跡',   sch:'ghost',rar:'r', max:2, icon:'trail',  d:'移動時留下幽影，傷害踩到的敵人。' },
  { id:'ambush', n:'伏擊',       sch:'ghost',rar:'e', max:1, icon:'ambush', d:'移動後停下的第一次攻擊傷害加倍（3 秒冷卻）。' },

  // 傳說（菁英房、儀式挑戰、詛咒祭壇）
  { id:'L_rain',   n:'魂之暴雨',   sch:'bar',  rar:'l', max:1, icon:'rain',   d:'每第 5 次攻擊，向四周射出 12 發暗影彈。' },
  { id:'L_storm',  n:'末日風暴',   sch:'ele',  rar:'l', max:1, icon:'chain',  d:'每 4 秒，閃電隨機轟擊 3 名敵人，造成攻擊力 200% 傷害。' },
  { id:'L_army',   n:'不死大軍',   sch:'sum',  rar:'l', max:1, icon:'minion', d:'額外召喚 3 名骷髏僕從，召喚物傷害 +50%。' },
  { id:'L_phoenix',n:'骨灰重生',   sch:'bone', rar:'l', max:1, icon:'heal',   d:'倒下時以全滿生命復活一次。' },
  { id:'L_lich',   n:'巫妖之心',   sch:'gen',  rar:'l', max:1, icon:'crit',   d:'攻擊力 +50%，攻擊速度 +25%。' },
  { id:'L_eclipse',n:'蝕月',       sch:'ghost',rar:'l', max:1, icon:'dodge',  d:'爆擊率 +20%，爆擊時在目標周圍引發爆炸。' },

  // 進化（條件達成後才會出現）
  { id:'steam',    n:'蒸氣爆裂', sch:'ele',  rar:'l', evo:true, max:1, icon:'nova',   need:[['frost',1],['fire',1]],   d:'同時被冰凍與燃燒的敵人會爆炸，傷害周圍敵人。' },
  { id:'thunder',  n:'魂雷',     sch:'ele',  rar:'l', evo:true, max:1, icon:'chain',  need:[['bounce',3],['chain',1]], d:'暗影彈每次彈跳都會放出閃電。' },
  { id:'legion',   n:'亡者軍團', sch:'sum',  rar:'l', evo:true, max:1, icon:'minion', need:[['orbit',3],['minion',1]], d:'頭骨會射擊附近敵人，僕從攻擊速度 +60%。' },
  { id:'fortress', n:'骨堡',     sch:'bone', rar:'l', evo:true, max:1, icon:'armor',  need:[['armor',3],['thorns',1]], d:'受傷時向四周射出 8 根骨刺。' },
  { id:'phantom',  n:'幽冥行者', sch:'ghost',rar:'l', evo:true, max:1, icon:'mcast',  need:[['mcast',2],['dodge',1]],  d:'移動中全速攻擊；閃避時放出一圈暗影彈。' },
  { id:'barrage',  n:'萬魂齊發', sch:'bar',  rar:'l', evo:true, max:1, icon:'multi',  need:[['multi',3],['front',2]],  d:'每一輪暗影彈多 2 發，並且帶有穿透。' }
];

/* ---------- 主動技 ----------
 * 出征前選擇帶進副本，右下角按鈕施放（電腦按空白鍵 / E） */
D.ACTIVES = [
  { id:'burst',    n:'靈魂爆發', cd:18, icon:'burst',    col:'#c38cff', d:'向四周射出 24 發暗影彈，並在 1 秒內無敵。' },
  { id:'march',    n:'亡者行軍', cd:25, icon:'minion',   col:'#9dff6a', d:'召喚 4 名骷髏戰士，戰鬥 10 秒。' },
  { id:'blizzard', n:'寒冬風暴', cd:28, icon:'frost',    col:'#9fe6ff', d:'凍結所有敵人 2.5 秒，並造成攻擊力 150% 傷害。' },
  { id:'step',     n:'幽影步',   cd:10, icon:'move',     col:'#9fb4ff', d:'朝移動方向瞬移 5 公尺，原地留下爆炸，並短暫無敵。' }
];

})(window.POF_DATA);
