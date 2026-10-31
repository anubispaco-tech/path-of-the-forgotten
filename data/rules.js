/* 被遺忘者之路：遊戲資料（規則、場景主題、外觀、像素角色）
 * 資料分成 data/ 底下幾個檔案，載入順序：rules → enemies → stages → skills → gear → meta
 * 調整數值或新增內容只改 data/，不需要動 js/。 */
'use strict';
window.POF_DATA = {};
(function(D){

/* ---------- 規則 ----------
 * moveAttack：移動中的攻速倍率（0 = 只能站著攻擊，1 = 移動也全速；技能「移動施法」可再提高）
 * eventRooms / eliteRooms：主線章節第幾間是事件房、菁英房；最後一間固定是首領
 * matDaily：每個素材關每天可挑戰或掃蕩的次數
 * idleCapH：營地挖掘最多累積幾小時 */
D.RULES = {
  moveAttack: .6,
  rooms: 30,
  eventRooms: [5, 15, 25],
  eliteRooms: [10, 20],
  matRooms: 6,
  matDaily: 3,
  idleCapH: 8,
  idleRate: { gold: 30, shards: 3 },     // 每小時，會乘上 (1 + 帳號等級 × 0.1)
  runXp: { base: 3, per: 3 },            // 局內升級所需經驗：base + per × 目前等級
  roomBudget: { base: 3.6, per: .26 },   // 戰鬥房的怪物點數：base + per × 房號（會再乘難度的 count）
  waves: { two: 4, three: 16 },          // 第幾間起可能出現 2 波、3 波
  waveEarly: .3,                         // 這一波剩下多少比例的怪時，下一波提前進場（0 = 清空才進場）
  roomDepth: { min: 21, max: 33 },     // 房間深度：直式手機自動加深到填滿畫面
  crowd: { chapter: .15, depth: .6 },    // 怪物倍率：每章 +15%；房間深度比例的 0.6 次方（個體血量除以倍率的平方根）
  pack: 3,                               // 近戰小怪一次 3 隻以上會成群出現
  hitstop: { multi: 3, multiT: .045, elite: .08, boss: .16 }, // 命中停頓：多殺門檻、多殺/菁英/首領停頓秒數
  roomHp: .05,                           // 每往後一間，怪物生命 +5%
  roomDmg: .012
};

/* ---------- 場景主題 ----------
 * kind：dungeon 地城（KayKit 地城素材）或 outdoor 野外（自然包、萬聖節素材）
 * kit 裡的檔名：沒寫資料夾就是 assets/dungeon/；halloween/、nature/ 開頭就是對應資料夾
 * tint：素材染色；banner：牆上旗幟；obstacles：房內障礙；decor：沿牆裝飾 */
D.THEMES = {
  crypt: { name:'墓窖', kind:'dungeon', fog:'#0c0b11', torch:'#7dff8a', torchCore:'#d8ffd0', hemiSky:'#6e6a92', hemiGround:'#1a1720', sun:'#a9b4ff', amb:.62, card:['#1f2a24','#121417','#8fe36a'],
           kit:{ tint:'#b4b8cc', banner:'banner_thin_green', obstacles:['pillar','pillar_decorated','trunk_large_A','pillar'], decor:['candle_triple','candle_lit','sword_shield_broken','barrel_small','trunk_medium_A','bottle_A_green','halloween/bone_A'] } },
  abbey: { name:'修道院', kind:'dungeon', fog:'#140d0c', torch:'#ffae55', torchCore:'#fff0c8', hemiSky:'#c9a68a', hemiGround:'#2a1d18', sun:'#ffd9b0', amb:.7, card:['#3a1c1e','#171214','#ff8a6a'],
           kit:{ tint:'#ffe4cc', banner:'banner_thin_red', obstacles:['pillar_decorated','barrel_large','crates_stacked','table_long_broken'], decor:['candle_triple','barrel_small','box_small','shelf_small_candles','stool','candle_lit','box_stacked'] } },
  grove: { name:'腐化林地', kind:'outdoor', fog:'#0d1410', torch:'#c6ff6a', torchCore:'#f0ffd0', hemiSky:'#8fa88a', hemiGround:'#1a2016', sun:'#d8ffc8', amb:.72, card:['#1e2a18','#10140d','#b6f06a'],
           ground:['#3b4a2c','#4a5934','#2f3a24'], kit:{ tint:'#c8d8b0', rocks:['nature/rock_medium_1','nature/rock_medium_2','nature/rock_medium_3'], big:['nature/rock_big_1','nature/rock_big_2'], trees:['halloween/tree_dead_large','halloween/tree_dead_medium','halloween/tree_dead_small'],
           obstacles:['nature/rock_medium_1','nature/mushroom_redcap','halloween/tree_dead_large','nature/rock_medium_3'], decor:['nature/mushroom_common','nature/grass_common_short','nature/fern_1','nature/mushroom_redcap','halloween/bone_A','nature/grass_common_short'], light:'halloween/lantern_standing' } },
  frost: { name:'銀霜之巔', kind:'outdoor', fog:'#0c1220', torch:'#9fe6ff', torchCore:'#eafaff', hemiSky:'#b8d0ff', hemiGround:'#1a2232', sun:'#e0ecff', amb:.82, card:['#1a2638','#0e121c','#9fe6ff'],
           ground:['#7f8ea8','#97a6bf','#66748e'], kit:{ tint:'#dbe8ff', rocks:['nature/rock_medium_1','nature/rock_medium_2','nature/rock_medium_3'], big:['nature/rock_big_1','nature/rock_big_2'], trees:['halloween/tree_pine_yellow_large','halloween/tree_pine_yellow_medium','halloween/tree_dead_large'], treeTint:{h:.58,s:.35,l:1.15,add:.08},
           obstacles:['nature/rock_medium_2','halloween/tree_pine_yellow_medium','nature/rock_medium_1','halloween/gravestone'], decor:['nature/rock_medium_2','halloween/bone_A','halloween/ribcage','nature/grass_common_short'], light:'halloween/lantern_standing', snow:true } },
  abyss: { name:'魔淵祭壇', kind:'dungeon', fog:'#120608', torch:'#ff5a2a', torchCore:'#ffd0a0', hemiSky:'#a8605a', hemiGround:'#1e0c0c', sun:'#ffb090', amb:.66, card:['#3a1010','#140808','#ff6a3a'],
           kit:{ tint:'#d89088', banner:'banner_thin_red', obstacles:['halloween/pillar','halloween/coffin','halloween/grave_A','pillar_decorated'], decor:['halloween/skull_candle','halloween/pumpkin_orange_jackolantern','halloween/ribcage','halloween/lantern_standing','halloween/bone_A','halloween/plaque_candles','halloween/pumpkin_yellow_jackolantern'] } },
  grave: { name:'骨塚', kind:'dungeon', fog:'#0b0e0c', torch:'#c08cff', torchCore:'#f0e0ff', hemiSky:'#7d8f86', hemiGround:'#141812', sun:'#c8d8ff', amb:.62, card:['#232030','#121117','#c08cff'],
           kit:{ tint:'#bccab4', banner:'banner_thin_white', obstacles:['pillar','halloween/grave_A','trunk_large_A','halloween/coffin'], decor:['candle_lit','sword_shield_broken','halloween/ribcage','halloween/bone_A','halloween/skull_candle'] } },
  vault: { name:'金庫', kind:'dungeon', fog:'#100c09', torch:'#ffcf6a', torchCore:'#fff4d0', hemiSky:'#c9b08a', hemiGround:'#221a14', sun:'#ffe2b0', amb:.7, card:['#3a2e18','#17130e','#e2b84d'],
           kit:{ tint:'#ffe6c0', banner:'banner_thin_yellow', obstacles:['chest_gold','coin_stack_large','crates_stacked','barrel_large'], decor:['coin_stack_small','chest','box_small','candle_triple','barrel_small','coin_stack_small'] } },
  runes: { name:'符文祭壇', kind:'dungeon', fog:'#0a0a16', torch:'#7d9bff', torchCore:'#e0e8ff', hemiSky:'#7a80c8', hemiGround:'#14142a', sun:'#c0c8ff', amb:.66, card:['#1c1f3a','#0e0f1a','#8fa8ff'],
           kit:{ tint:'#b0b8e8', banner:'banner_thin_white', obstacles:['pillar_decorated','halloween/shrine_candles','pillar'], decor:['halloween/plaque_candles','candle_triple','halloween/skull_candle','bottle_A_green','candle_lit'] } },
  mine:  { name:'魂晶礦坑', kind:'outdoor', fog:'#071214', torch:'#5affe6', torchCore:'#e0fffa', hemiSky:'#6aa8a8', hemiGround:'#0e1a1a', sun:'#c0fff4', amb:.66, card:['#122c2c','#0a1414','#5affe6'],
           ground:['#2c3436','#363f42','#22292b'], kit:{ tint:'#a8c8c8', rocks:['nature/rock_medium_1','nature/rock_medium_2','nature/rock_medium_3'], big:['nature/rock_big_1','nature/rock_big_2'], trees:['nature/rock_big_1','nature/rock_big_2'],
           obstacles:['nature/rock_medium_3','nature/rock_medium_1','nature/rock_medium_2'], decor:['nature/rock_medium_2','halloween/lantern_standing','halloween/bone_A'], light:'halloween/post_lantern', crystals:'#5affe6' } }
};

/* ---------- 塑造亡者（主角外觀） ----------
 * body：身體模型；head/back：從哪個模型借哪個零件；robe：袍子顏色（h 色相、s 飽和、l 亮度倍率）
 * 動畫全部共用骷髏法師的骨架，所以任何組合都能正常動作 */
D.LOOKS = {
  body:[ {id:'mage',n:'法師骨架',model:'sk_mage'}, {id:'warrior',n:'戰士骨架',model:'sk_warrior'}, {id:'rogue',n:'盜賊骨架',model:'sk_rogue'}, {id:'minion',n:'小兵骨架',model:'sk_minion'} ],
  head:[ {id:'hat',n:'尖頂法師帽',from:'sk_mage',part:'Skeleton_Mage_Hat'}, {id:'hood',n:'盜賊兜帽',from:'sk_rogue',part:'Skeleton_Rogue_Hood'}, {id:'helmet',n:'骸骨戰盔',from:'sk_warrior',part:'Skeleton_Warrior_Helmet'}, {id:'none',n:'不戴（光頭骷髏）'} ],
  back:[ {id:'none',n:'無'}, {id:'cape',n:'盜賊披風',from:'sk_rogue',part:'Skeleton_Rogue_Cape'}, {id:'cloak',n:'破舊斗篷',from:'sk_warrior',part:'Skeleton_Warrior_Cloak'}, {id:'rags',n:'屍布',from:'sk_minion',part:'Skeleton_Minion_Cloak'} ],
  weapon:[ {id:'staff',n:'骨杖',model:'w_staff'}, {id:'blade',n:'骨刃',model:'w_blade'}, {id:'axe',n:'骨斧',model:'w_axe'}, {id:'crossbow',n:'骨弩',model:'w_crossbow'} ],
  off:[ {id:'none',n:'空手'}, {id:'shield',n:'小骨盾',model:'w_shield'}, {id:'shieldL',n:'大骨盾',model:'w_shield_l'} ],
  eye:[ {n:'邪能綠',c:'#9dff6a'}, {n:'寒魂藍',c:'#6ad8ff'}, {n:'虛空紫',c:'#c38cff'}, {n:'血怒紅',c:'#ff4a3a'}, {n:'聖骸金',c:'#ffd04a'}, {n:'亡者白',c:'#f2f2ff'} ],
  robe:[ {n:'緋紅（原色）',sw:'#8e2a3e'}, {n:'墓苔綠',h:.36,s:.55,l:1,sw:'#2f6b3a'}, {n:'深淵藍',h:.62,s:.6,l:1,sw:'#2c4a8a'}, {n:'暗影紫',h:.77,s:.55,l:1,sw:'#5a2f7a'}, {n:'灰燼',h:0,s:.06,l:1.05,sw:'#6b6670'}, {n:'漆黑',h:.7,s:.15,l:.45,sw:'#1e1c24'}, {n:'舊金',h:.11,s:.65,l:1.15,sw:'#a07a2a'} ],
  def:{ body:'mage', head:'hat', back:'none', weapon:'staff', off:'none', eye:0, robe:0 }
};

/* ---------- 像素角色（彩蛋模式：0x72 DungeonTileset II，CC0） ----------
 * 每個角色：[x, y, 寬, 高]，idle 從 x 開始連續 4 格，run 接在後面 4 格（run:false 代表沿用 idle）
 * 沒列在這裡的怪物，在像素模式下會借用 alias 指定的角色圖 */
D.PIXEL = {
  sheet:'assets/pixel/dungeon_tileset_ii.png', px:.062,
  chars:{
    player: { f:[128,164,16,28] },
    ghoul:  { f:[368,88,16,16] },
    guard:  { f:[368,156,16,20], scale:1.15 },
    necro:  { f:[368,228,16,20], run:false },
    zealot: { f:[128,100,16,28] },
    priest: { f:[128,132,16,28] },
    fanatic:{ f:[128,292,16,28] },
    warden: { f:[16,334,32,34], scale:1.5 },
    inquis: { f:[16,428,32,36], scale:1.5 }
  },
  alias:{ barb:'fanatic', ranger:'priest', assassin:'zealot', ghost:'necro', hywirl:'necro', mushnub:'ghoul', iceguard:'guard', icemin:'ghoul', frostghost:'necro', golem:'guard', imp:'ghoul',
          mushking:'warden', wyrm:'inquis', demonR:'inquis', demonB:'warden', minion:'ghoul' }
};

})(window.POF_DATA);
