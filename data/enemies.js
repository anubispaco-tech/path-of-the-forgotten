/* 被遺忘者之路：怪物
 * model：模型（assets/ 底下的路徑，不含 .glb）
 * ai：chase 追擊、charger 衝鋒、caster 遠程、slammer 重擊、boss 首領
 * hp / dmg 為 1 級基礎值，會隨章節等級、房號、難度成長
 * xp：擊殺掉落的局內經驗；cost：戰鬥房的點數（越強越貴）
 * fly：飛行高度；emis：自發光顏色（讓暗色模型看得清楚）
 * tint：顏色相乘（只能變暗、偏色）；recolor：把貼圖整個換色相（h 色相 0–1、s 飽和倍率、l 亮度倍率），例如紅色恐龍變冰藍
 * 首領的 moves：可用招式（nova 彈幕、slam 重擊、charge 衝鋒、summon 召喚、spores 毒雲） */
'use strict';
(function(D){

D.ENEMIES = {
  // 第一章：墓窖
  ghoul:   { n:'瘟疫骷髏', model:'sk_minion', scale:.62, r:.42, hp:38,  dmg:10, spd:2.7, ai:'chase',   gold:[1,2], xp:1, cost:1,   eye:'#ff4a3a', rise:true },
  guard:   { n:'骸骨衛士', model:'sk_warrior', scale:.7, r:.5,  hp:105, dmg:18, spd:1.7, ai:'charger', gold:[2,4], xp:3, cost:2.5, eye:'#ff4a3a', rise:true, wr:'w_axe', wl:'w_shield' },
  necro:   { n:'瘟疫術士', model:'sk_mage',   scale:.64, r:.42, hp:52,  dmg:12, spd:2.0, ai:'caster',  gold:[2,3], xp:2, cost:1.5, eye:'#c06bff', rise:true, wr:'w_staff', tint:'#b8a0d8', bolt:'#c06bff', shots:1 },
  // 第二章：修道院
  zealot:  { n:'緋紅衛兵',   model:'knight',  scale:.66, r:.46, hp:95,  dmg:16, spd:2.0, ai:'slammer', gold:[2,4], xp:3, cost:2.5, show:['1H_Sword','Round_Shield'], tint:'#ffb0a8' },
  priest:  { n:'緋紅牧師',   model:'hmage',   scale:.64, r:.42, hp:58,  dmg:12, spd:2.0, ai:'caster',  gold:[2,4], xp:2, cost:1.5, show:['1H_Wand'], tint:'#ffc0b0', bolt:'#ffe08a', shots:3 },
  fanatic: { n:'緋紅狂熱者', model:'knight',  scale:.68, r:.48, hp:115, dmg:20, spd:1.8, ai:'charger', gold:[3,5], xp:4, cost:3,   show:['2H_Sword'], tint:'#ff9088' },
  barb:    { n:'聖團狂戰士', model:'barb',    scale:.7,  r:.5,  hp:130, dmg:22, spd:1.9, ai:'charger', gold:[3,5], xp:4, cost:3,   show:['2H_Axe','Barbarian_Hat','Barbarian_Cape'], tint:'#ffc8b8' },
  ranger:  { n:'聖團遊俠',   model:'rogueh',  scale:.66, r:.42, hp:60,  dmg:14, spd:2.3, ai:'caster',  gold:[2,4], xp:2, cost:1.5, show:['2H_Crossbow','Rogue_Cape'], tint:'#ffd8c0', bolt:'#ffe9a0', shots:1, boltSpd:9 },
  assassin:{ n:'緋紅刺客',   model:'rogue',   scale:.64, r:.4,  hp:55,  dmg:13, spd:3.5, ai:'chase',   gold:[2,3], xp:2, cost:1.5, show:['Knife','Knife_Offhand','Rogue_Cape'], tint:'#ff9a9a' },
  // 第三章：腐化林地
  mushnub: { n:'腐菌怪',   model:'monsters/mushnub', scale:.42, r:.48, hp:70,  dmg:14, spd:2.4, ai:'chase',   gold:[1,3], xp:1, cost:1,   tint:'#d8ffb0' },
  ghost:   { n:'怨魂',     model:'monsters/ghost',   scale:.5,  r:.45, hp:60,  dmg:14, spd:2.2, ai:'caster',  gold:[2,3], xp:2, cost:1.5, fly:.55, emis:'#3a2a5a', bolt:'#c38cff', shots:2 },
  hywirl:  { n:'颶風靈',   model:'monsters/hywirl',  scale:.5,  r:.5,  hp:110, dmg:18, spd:2.4, ai:'charger', gold:[2,4], xp:3, cost:2.5, fly:.45, emis:'#24103a' },
  // 第四章：銀霜之巔
  icemin:  { n:'霜骨',       model:'sk_minion',  scale:.62, r:.42, hp:60,  dmg:14, spd:2.9, ai:'chase',   gold:[1,2], xp:1, cost:1,   eye:'#6ad8ff', rise:true, tint:'#bcd8ff' },
  iceguard:{ n:'冰封衛士',   model:'sk_warrior', scale:.72, r:.5,  hp:160, dmg:22, spd:1.8, ai:'charger', gold:[2,4], xp:4, cost:3,   eye:'#6ad8ff', rise:true, wr:'w_axe', wl:'w_shield_l', tint:'#bcd8ff' },
  frostghost:{n:'霜魂',      model:'monsters/ghost',  scale:.52, r:.45, hp:80,  dmg:16, spd:2.2, ai:'caster',  gold:[2,4], xp:2, cost:2,   fly:.6, emis:'#1a3a5a', recolor:{h:.56,s:.7,l:1.6,add:.12}, bolt:'#9fe6ff', shots:3 },
  golem:   { n:'霜棘魔像',   model:'monsters/cactoro', scale:.55, r:.6,  hp:220, dmg:26, spd:1.5, ai:'slammer', gold:[3,5], xp:5, cost:4,   recolor:{h:.55,s:.55,l:1.1,add:.05} },
  // 第五章：魔淵祭壇
  imp:     { n:'魔淵小鬼', model:'monsters/demon', scale:.36, r:.4, hp:70, dmg:16, spd:3.2, ai:'chase', gold:[1,3], xp:1, cost:1, tint:'#ffb0a0' },

  // 首領
  warden:  { n:'墓窖看守者 · 葛雷文', model:'sk_warrior', scale:1.35, r:1.0, hp:1800, dmg:22, spd:1.9, ai:'boss', boss:1, gold:[30,40], eye:'#ff3a2a', wr:'w_axe', wl:'w_shield', bolt:'#9dff6a', minion:'ghoul', moves:['nova','slam','charge','summon'] },
  inquis:  { n:'緋紅大審判官 · 瓦倫', model:'knight', scale:1.3, r:1.0, hp:2400, dmg:26, spd:2.0, ai:'boss', boss:1, gold:[45,60], show:['2H_Sword'], tint:'#ff7a70', bolt:'#ffe08a', minion:'zealot', moves:['nova','slam','charge','summon'] },
  mushking:{ n:'腐林之主 · 蕈王', model:'monsters/mushking', scale:1.15, r:1.0, hp:2600, dmg:28, spd:1.8, ai:'boss', boss:1, gold:[55,70], bolt:'#b0ff3a', minion:'mushnub', moves:['spores','nova','slam','summon'] },
  wyrm:    { n:'霜脊巨龍 · 寒牙', model:'monsters/dino', scale:1.25, r:1.1, hp:2900, dmg:32, spd:2.1, ai:'boss', boss:1, gold:[70,90], recolor:{h:.57,s:.6,l:1.15,add:.06}, emis:'#0a1a2a', bolt:'#9fe6ff', minion:'icemin', moves:['nova','charge','slam','summon'] },
  demonR:  { n:'炎魔 · 卡札', model:'monsters/demon', scale:1.1, r:1.0, hp:1800, dmg:34, spd:2.2, ai:'boss', boss:1, twin:'demonB', gold:[45,55], bolt:'#ff6a2a', minion:'imp', moves:['nova','charge','slam'] },
  demonB:  { n:'霜魔 · 維薩', model:'monsters/bluedemon', scale:1.1, r:1.0, hp:1800, dmg:30, spd:2.0, ai:'boss', boss:1, twin:'demonR', gold:[45,55], bolt:'#6ad8ff', minion:'imp', moves:['nova','slam','summon'] }
};

/* ---------- 怪物詞綴 ----------
 * 菁英怪一定有 1–2 個；困難、地獄難度的一般怪也有機率出現 */
D.AFFIXES = {
  berserk: { n:'狂暴', col:'#ff5a3a', d:'攻擊與移動速度提高 50%' },
  split:   { n:'分裂', col:'#9dff6a', d:'死亡時分裂成兩隻較弱的分身' },
  shield:  { n:'護盾', col:'#7df9ff', d:'護盾吸收相當於 30% 生命的傷害' },
  toxic:   { n:'劇毒', col:'#b0ff3a', d:'走過的地方留下毒圈' },
  blink:   { n:'傳送', col:'#c38cff', d:'受到攻擊時有機率瞬間移動' }
};

/* 菁英怪：生命、傷害、體型倍率 */
D.ELITE = { hp:5, dmg:1.25, scale:1.35, xp:15, gold:[8,14] };

})(window.POF_DATA);
