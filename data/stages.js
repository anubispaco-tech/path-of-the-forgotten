/* 被遺忘者之路：章節、素材關、難度、房間事件
 * 主線章節：30 間小房間（第 5、15、25 間事件房，第 10、20 間菁英房，第 30 間首領），規則在 rules.js
 * pool：戰鬥房會出現的怪物與權重；late：第 12 間以後加入的怪物
 * elite：菁英房的菁英候選；boss：首領（陣列代表雙首領）
 * reward：通關獎勵；first：首次通關額外獎勵與解鎖
 * 素材關：6 間房，最後一間是菁英；每天可打或掃蕩 3 次 */
'use strict';
(function(D){

D.STAGES = [
  { id:'c1', type:'main', ch:'第一章', name:'灰燼墓窖', theme:'crypt', lv:1, req:null,
    desc:'你在墓窖深處甦醒，瘟疫的低語仍在腦中迴盪。斬斷它，走出去。',
    pool:[['ghoul',5],['necro',2],['guard',2]], late:[['guard',1]], elite:['guard','necro'], boss:'warden',
    reward:{ xp:240, gold:150, shards:8, gear:1 },
    first:{ crystals:60, unlock:['act:burst'], text:'解鎖主動技「靈魂爆發」、第二章、聖團金庫' } },
  { id:'c2', type:'main', ch:'第二章', name:'緋紅修道院', theme:'abbey', lv:4, req:'c1',
    desc:'活人的聖團把一切亡者視為瘟疫。他們不會聽你解釋。',
    pool:[['zealot',3],['priest',2],['assassin',2],['ranger',2]], late:[['fanatic',2],['barb',1]], elite:['fanatic','barb','priest'], boss:'inquis',
    reward:{ xp:540, gold:300, shards:14, gear:2 },
    first:{ crystals:90, unlock:['slot:neck','act:march'], text:'解鎖項鍊欄、主動技「亡者行軍」、第三章、符文祭壇' } },
  { id:'c3', type:'main', ch:'第三章', name:'腐化林地', theme:'grove', lv:7, req:'c2',
    desc:'瘟疫滲進了森林。樹在枯死，菇類卻長得比人還高。',
    pool:[['mushnub',4],['ghost',3],['ghoul',2]], late:[['hywirl',2],['necro',1]], elite:['hywirl','ghost','mushnub'], boss:'mushking',
    reward:{ xp:1030, gold:480, shards:20, gear:2 },
    first:{ crystals:120, unlock:['sys:runes','act:blizzard'], text:'解鎖符文系統、主動技「寒冬風暴」、第四章、魂晶礦坑' } },
  { id:'c4', type:'main', ch:'第四章', name:'銀霜之巔', theme:'frost', lv:10, req:'c3',
    desc:'山巔的寒風把骨頭凍得發白。巨龍在雪裡沉睡了一百年。',
    pool:[['icemin',4],['iceguard',2],['frostghost',2]], late:[['golem',1]], elite:['golem','iceguard','frostghost'], boss:'wyrm',
    reward:{ xp:2420, gold:700, shards:28, gear:3 },
    first:{ crystals:160, unlock:['slot:act2','act:step'], text:'解鎖主動技第二格、主動技「幽影步」、第五章' } },
  { id:'c5', type:'main', ch:'第五章', name:'魔淵祭壇', theme:'abyss', lv:14, req:'c4',
    desc:'瘟疫的源頭不在人間。兩位魔王守著祭壇，等著收割亡魂。',
    pool:[['imp',4],['necro',2],['assassin',2],['barb',1]], late:[['hywirl',1],['golem',1],['ghost',1]], elite:['barb','golem','hywirl'], boss:['demonR','demonB'],
    reward:{ xp:3890, gold:1000, shards:36, gear:3 },
    first:{ crystals:220, unlock:['diff:x'], text:'解鎖地獄難度' } },

  { id:'m1', type:'mat', ch:'素材', name:'骨塚', theme:'grave', lv:1, req:null, loot:'shards',
    desc:'無主的骨頭堆成山。骨片用來強化裝備。',
    pool:[['ghoul',4],['necro',2],['guard',1]], elite:['guard'], reward:{ xp:40, gold:20, shards:18 } },
  { id:'m2', type:'mat', ch:'素材', name:'聖團金庫', theme:'vault', lv:3, req:'c1', loot:'gold',
    desc:'緋紅聖團搜刮來的金幣，現在歸亡者所有。',
    pool:[['zealot',3],['priest',2],['assassin',2]], elite:['fanatic'], reward:{ xp:60, gold:220, shards:3 } },
  { id:'m3', type:'mat', ch:'素材', name:'符文祭壇', theme:'runes', lv:6, req:'c2', loot:'dust',
    desc:'古老的符文還在發光。打碎守衛，帶走它們。',
    pool:[['necro',3],['ghost',2],['priest',2]], elite:['ghost'], reward:{ xp:90, gold:60, dust:40, rune:1 } },
  { id:'m4', type:'mat', ch:'素材', name:'魂晶礦坑', theme:'mine', lv:9, req:'c3', loot:'crystals',
    desc:'亡魂凝結成的晶體。抽卡用的魂晶從這裡來。',
    pool:[['icemin',3],['frostghost',2],['mushnub',2]], elite:['golem'], reward:{ xp:120, gold:80, crystals:25 } }
];

/* ---------- 難度 ----------
 * 通關普通解鎖困難；困難通關、且第五章普通通關後解鎖地獄 */
D.DIFFS = [
  { id:'n', n:'普通', hp:1,   dmg:1,   loot:1,   affix:0,   col:'#c9c2b0' },
  { id:'h', n:'困難', hp:1.6, dmg:1.3, loot:1.6, affix:.25, col:'#ffa53a' },
  { id:'x', n:'地獄', hp:2.5, dmg:1.6, loot:2.4, affix:.5,  col:'#ff4a4a', mythic:true }
];

/* ---------- 房間事件（第 5、15、25 間） ---------- */
D.EVENTS = [
  { id:'fire',   n:'亡者營火', d:'回復生命，或汲取力量',           col:'#9dff6a', w:3 },
  { id:'shop',   n:'骸骨商人', d:'用局內金幣購買技能與補給',         col:'#e2b84d', w:3 },
  { id:'curse',  n:'詛咒祭壇', d:'獲得傳說技能，但要承受一個詛咒',   col:'#ff4a6a', w:2 },
  { id:'well',   n:'魂火泉',   d:'讓一個已學會的技能再升一級',       col:'#7df9ff', w:2 },
  { id:'chest',  n:'寶箱房',   d:'金幣、骨片，或一件帶回營地的裝備', col:'#ffd76a', w:2 },
  { id:'ritual', n:'儀式挑戰', d:'限時擊敗強敵，成功獲得傳說技能',   col:'#c38cff', w:2 }
];

/* 詛咒祭壇的負面效果 */
D.CURSES = [
  { id:'c_hp',   n:'血肉枯萎', d:'最大生命 -15%' },
  { id:'c_def',  n:'脆骨',     d:'受到的傷害 +15%' },
  { id:'c_heal', n:'冷火',     d:'回復效果 -50%' },
  { id:'c_spd',  n:'沉重',     d:'移動速度 -12%' }
];

/* 骸骨商人的價格（局內金幣） */
D.SHOP = { perk:[40,70,110], potion:30, reroll:25 };

})(window.POF_DATA);
