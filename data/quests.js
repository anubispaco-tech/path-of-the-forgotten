/* 被遺忘者之路：世界地圖、區域 NPC、任務線
 * D.WORLD.nodes：地圖節點（x, y 為 0–100 / 0–150 的座標），stage 對應 D.STAGES 的 id
 * D.NPCS：每區一位 NPC，face 是 0x72 素材圖上 16×28 角色的左上角座標
 * D.QUESTS：依區域串成任務線，前一個完成才出現下一個
 *   type：kill（擊殺指定怪，k 為怪物 key 陣列，st 限定關卡）、elite（擊敗菁英）、boss（擊敗該章首領）
 *         clear（通關，diff 指定難度以上）、streak（單局連殺達 n）、event（進入指定事件房）
 *         nohit（無傷清完一間戰鬥房）、rooms（累計清房）
 *   reward：xp 帳號經驗、gold、shards、dust、crystals */
'use strict';
(function(D){

D.WORLD = {
  name:'亡者之境',
  nodes:[
    { id:'c1', x:22, y:128, icon:'crypt' },
    { id:'m1', x:48, y:136, icon:'bones' },
    { id:'c2', x:70, y:108, icon:'abbey' },
    { id:'m2', x:88, y:126, icon:'vault' },
    { id:'c3', x:34, y:84,  icon:'grove' },
    { id:'m3', x:12, y:98,  icon:'runes' },
    { id:'c4', x:66, y:52,  icon:'peak' },
    { id:'m4', x:88, y:70,  icon:'mine' },
    { id:'c5', x:30, y:22,  icon:'abyss' }
  ],
  // 主線道路（依序連起來）與支線（素材關）
  road:['c1','c2','c3','c4','c5'],
  side:[['c1','m1'],['c2','m2'],['c3','m3'],['c4','m4']]
};

D.NPCS = {
  dorn:  { n:'守墓人 多恩',   face:[128,260], col:'#e2b84d', where:'c1' },
  aldric:{ n:'叛逃者 艾德里克', face:[128,68],  col:'#7df9ff', where:'c2' },
  sylva: { n:'德魯伊 希爾瓦', face:[128,4],   col:'#8fe36a', where:'c3' },
  khass: { n:'旅者 卡薩',     face:[128,196], col:'#5affe6', where:'c4' },
  morv:  { n:'老巫師 莫維',   face:[128,132], col:'#c38cff', where:'c5' }
};

D.QUESTS = [
  /* ---------- 第一章 灰燼墓窖：守墓人 多恩 ---------- */
  { id:'q1a', npc:'dorn', t:'醒來的骨頭', type:'kill', k:['ghoul'], st:'c1', n:20,
    say:'喔？又一具骨頭站起來了。別緊張，我只是看門的。墓窖裡的瘟疫骷髏越來越多，幫我清掉一些，我就告訴你怎麼出去。',
    done:'不錯的身手，看來你生前不是普通人。', reward:{ xp:120, gold:120 } },
  { id:'q1b', npc:'dorn', t:'術士的低語', type:'kill', k:['necro'], st:'c1', n:8,
    say:'那些瘟疫術士在對死者說話——包括你。你腦中的低語就是他們搞的鬼。讓他們閉嘴。',
    done:'低語變小了吧？我就說。', reward:{ xp:160, shards:10 } },
  { id:'q1c', npc:'dorn', t:'守門人', type:'boss', st:'c1', n:1,
    say:'墓窖的看守者葛雷文擋在出口。他守了這扇門三百年，從沒讓任何東西出去。你會是第一個。',
    done:'葛雷文倒了……三百年了，那扇門第一次打開。', reward:{ xp:240, crystals:30 } },
  { id:'q1d', npc:'dorn', t:'骨塚的收穫', type:'clear', st:'m1', n:1,
    say:'外頭的骨塚堆滿無主的骨頭。拿些回來，你的武器需要磨一磨。',
    done:'這些骨片夠你用一陣子了。', reward:{ xp:120, shards:20 } },
  { id:'q1e', npc:'dorn', t:'不死的手感', type:'streak', n:10,
    say:'最後一課：別停下來。一口氣砍倒十個，你就會明白亡者為什麼不需要休息。',
    done:'去吧。往東走，緋紅修道院的人會來找你麻煩——他們找每個亡者的麻煩。', reward:{ xp:200, crystals:40 } },

  /* ---------- 第二章 緋紅修道院：叛逃者 艾德里克 ---------- */
  { id:'q2a', npc:'aldric', t:'緋紅的盲信', type:'kill', k:['zealot','fanatic'], st:'c2', n:30,
    say:'別拔劍，亡者。我曾是緋紅聖團的騎士，直到我看見他們把活著的村民也當成瘟疫燒掉。他們不會聽你解釋，所以——別解釋。',
    done:'他們的衛兵少了一半，祈禱聲也小了。', reward:{ xp:300, gold:250 } },
  { id:'q2b', npc:'aldric', t:'沉默的牧師', type:'kill', k:['priest'], st:'c2', n:12,
    say:'牧師會治療衛兵，讓戰鬥沒完沒了。先打倒他們。',
    done:'沒有牧師，那些衛兵就只是血肉。', reward:{ xp:300, shards:16 } },
  { id:'q2c', npc:'aldric', t:'金庫的帳本', type:'clear', st:'m2', n:1,
    say:'聖團的金庫藏著他們搜刮來的財寶。把它搬空——那本來就不是他們的。',
    done:'哈！我等這一天很久了。', reward:{ xp:260, gold:400 } },
  { id:'q2d', npc:'aldric', t:'大審判官', type:'boss', st:'c2', n:1,
    say:'大審判官瓦倫下令燒了我的家鄉。我打不過他……但你是亡者，你不怕火。',
    done:'他倒下時喊的是「瘟疫在北方」。也許他知道些什麼。', reward:{ xp:420, crystals:50 } },
  { id:'q2e', npc:'aldric', t:'無瑕的步伐', type:'nohit', st:'c2', n:3,
    say:'聖團的騎士以無傷凱旋為榮。讓他們看看，亡者也能做到——在修道院裡無傷清完三間房。',
    done:'北方的森林在腐爛。瓦倫說得沒錯，源頭在更遠的地方。', reward:{ xp:360, crystals:50 } },

  /* ---------- 第三章 腐化林地：德魯伊 希爾瓦 ---------- */
  { id:'q3a', npc:'sylva', t:'過大的菇', type:'kill', k:['mushnub'], st:'c3', n:40,
    say:'亡者……你身上有瘟疫的味道，但不是你的錯。森林病了。這些菇不該長這麼大、更不該會走路。',
    done:'孢子少了，樹在呼吸。', reward:{ xp:480, shards:24 } },
  { id:'q3b', npc:'sylva', t:'林中怨魂', type:'kill', k:['ghost','hywirl'], st:'c3', n:25,
    say:'死在林子裡的旅人沒能安息，他們的怨魂困在風裡。送他們走。',
    done:'風安靜了。謝謝你。', reward:{ xp:480, dust:20 } },
  { id:'q3c', npc:'sylva', t:'營火旁的故事', type:'event', e:['fire','well'], st:'c3', n:2,
    say:'在林子裡找到亡者營火或魂火泉，坐下來聽聽森林的聲音。你會懂的。',
    done:'你聽見了嗎？根在哭。蕈王把瘟疫種進了土裡。', reward:{ xp:400, crystals:40 } },
  { id:'q3d', npc:'sylva', t:'腐林之主', type:'boss', st:'c3', n:1,
    say:'蕈王就在林子中心。他不是瘟疫的源頭，只是吃得最飽的那一個。',
    done:'他的孢子裡有冰——是從山上被風吹下來的。', reward:{ xp:640, crystals:60 } },
  { id:'q3e', npc:'sylva', t:'符文的回聲', type:'clear', st:'m3', n:2,
    say:'祭壇上的符文記得古老的力量。帶兩次回來，我教你怎麼用。',
    done:'把符文嵌進裝備裡，它們會回應你。往北，去銀霜之巔。', reward:{ xp:520, dust:40 } },

  /* ---------- 第四章 銀霜之巔：旅者 卡薩 ---------- */
  { id:'q4a', npc:'khass', t:'凍骨', type:'kill', k:['icemin','iceguard'], st:'c4', n:50,
    say:'嘶……冷血的我在這裡也快凍僵了。山上的骨頭都被寒氣喚醒，跟你一樣——但它們沒有你的腦子。',
    done:'路清出來了，我可以繼續往上走。', reward:{ xp:900, gold:600 } },
  { id:'q4b', npc:'khass', t:'雪中魔像', type:'elite', st:'c4', n:3,
    say:'菁英守衛把山路堵住了。擊敗三個，讓商隊能通過。',
    done:'商隊會記得你的名字——如果你有名字的話。', reward:{ xp:900, crystals:60 } },
  { id:'q4c', npc:'khass', t:'魂晶礦脈', type:'clear', st:'m4', n:2,
    say:'礦坑裡的魂晶是凍結的靈魂。挖出來，它們會給你力量……也許還能讓它們解脫。',
    done:'這些晶體在你手裡發光，它們認得你。', reward:{ xp:700, crystals:80 } },
  { id:'q4d', npc:'khass', t:'百年沉睡', type:'boss', st:'c4', n:1,
    say:'霜脊巨龍寒牙睡了一百年。瘟疫把牠吵醒了，現在牠的吐息會把整座山變成墳場。',
    done:'巨龍的心臟裡有一塊燒焦的符文……魔淵的味道。', reward:{ xp:1200, crystals:100 } },
  { id:'q4e', npc:'khass', t:'雪崩', type:'streak', n:50,
    say:'山上的人說，真正的戰士能像雪崩一樣一路衝下去。單局連殺五十，讓我看看。',
    done:'雪崩！哈哈！去魔淵吧，亡者——那裡沒有雪，只有火。', reward:{ xp:1000, crystals:100 } },

  /* ---------- 第五章 魔淵祭壇：老巫師 莫維 ---------- */
  { id:'q5a', npc:'morv', t:'小鬼的狂歡', type:'kill', k:['imp'], st:'c5', n:60,
    say:'啊，你終於來了。我研究瘟疫六十年，答案一直在這裡：兩個魔王在收割亡魂。小鬼是他們的收割者。',
    done:'它們會再生，但至少現在安靜了。', reward:{ xp:1400, gold:900 } },
  { id:'q5b', npc:'morv', t:'深淵的試煉', type:'event', e:['ritual'], st:'c5', n:1,
    say:'祭壇旁的儀式能證明你的靈魂夠強。完成一次儀式挑戰。',
    done:'你的靈魂……比我想的還要古老。', reward:{ xp:1400, crystals:100 } },
  { id:'q5c', npc:'morv', t:'雙子魔王', type:'boss', st:'c5', n:1,
    say:'炎魔卡札與霜魔維薩。打倒他們，瘟疫的低語會永遠停止——至少在這片大陸上。',
    done:'低語……停了。你可以記起自己的名字了嗎？', reward:{ xp:2000, crystals:150 } },
  { id:'q5d', npc:'morv', t:'困難的回聲', type:'clear', st:'c5', diff:'h', n:1,
    say:'魔王的殘響還在。用困難的方式再打倒他們一次，確認他們不會回來。',
    done:'殘響消散了。地獄的大門在你面前打開——如果你敢的話。', reward:{ xp:2400, crystals:150 } },
  { id:'q5e', npc:'morv', t:'地獄行者', type:'clear', diff:'x', n:1,
    say:'最後一件事。去任何一章，用地獄難度通關。只有真正被遺忘的人，才敢走那條路。',
    done:'被遺忘者之路的盡頭……其實是另一條路的起點。大陸的另一邊還有東西在等你。', reward:{ xp:3000, crystals:250 } }
];

})(window.POF_DATA);
