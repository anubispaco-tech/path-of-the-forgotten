/* 被遺忘者之路：裝備、符文、抽卡箱
 * 裝備數值公式在 js/meta.js 的 gearStats()；這裡只放名稱、倍率、機率 */
'use strict';
(function(D){

/* ---------- 裝備欄位 ----------
 * unlock：需要哪個解鎖（首次通關章節時取得，見 stages.js 的 first.unlock） */
D.SLOTS = {
  weapon:{ n:'主手', icon:'weapon' },
  head:  { n:'頭飾', icon:'head' },
  armor: { n:'護甲', icon:'armorG' },
  ring:  { n:'戒指', icon:'ring' },
  neck:  { n:'項鍊', icon:'neck', unlock:'slot:neck' }
};

/* ---------- 稀有度 ----------
 * m：數值倍率；sock：符文孔數；cap：強化上限；fx：是否附帶特效 */
D.RARITY = [
  { n:'普通', col:'#b9b4a8', m:1.0,  sock:1, cap:10 },
  { n:'優良', col:'#6ad06a', m:1.25, sock:1, cap:15 },
  { n:'稀有', col:'#5fb2ff', m:1.55, sock:2, cap:20 },
  { n:'史詩', col:'#c38cff', m:1.95, sock:2, cap:25 },
  { n:'傳說', col:'#ffa53a', m:2.5,  sock:3, cap:30, fx:true },
  { n:'神話', col:'#ff4a4a', m:3.2,  sock:3, cap:40, fx:true }
];

/* ---------- 裝備種類 ----------
 * 同名、同稀有度的 3 件可以合成成高一階
 * look：裝備外觀（weapon 對應 LOOKS.weapon、head 對應 LOOKS.head、armor 對應 LOOKS.robe 的編號）
 * 項鍊的 stat：elem 元素傷害、sum 召喚傷害、xp 局內經驗、critM 爆擊傷害 */
D.GEAR = {
  weapon:[ {n:'墓窖骨杖',look:'staff'}, {n:'裂魂骨刃',look:'blade'}, {n:'碎顱骨斧',look:'axe'}, {n:'怨魂骨弩',look:'crossbow'} ],
  head:  [ {n:'尖頂法師帽',look:'hat'}, {n:'盜賊兜帽',look:'hood'}, {n:'骸骨戰盔',look:'helmet'} ],
  armor: [ {n:'緋紅法袍',look:0}, {n:'墓苔長袍',look:1}, {n:'深淵法袍',look:2}, {n:'暗影斗篷',look:3} ],
  ring:  [ {n:'裂骨指環'}, {n:'凋零戒指'}, {n:'亡語徽記'}, {n:'黑曜指環'} ],
  neck:  [ {n:'靈魂墜飾',stat:'elem'}, {n:'墓土護符',stat:'sum'}, {n:'亡者項鍊',stat:'xp'}, {n:'黑曜吊墜',stat:'critM'} ]
};

/* ---------- 傳說、神話裝備的特效 ---------- */
D.GEAR_FX = [
  { id:'fx_sk',    d:'擊殺時 15% 機率召喚骷髏僕從（8 秒）' },
  { id:'fx_burst', d:'爆擊時 15% 機率引發靈魂爆炸' },
  { id:'fx_orb',   d:'開局獲得「環繞頭骨」' },
  { id:'fx_guard', d:'生命低於 30% 時無敵 3 秒（每局一次）' },
  { id:'fx_gold',  d:'金幣獲得 +30%' },
  { id:'fx_reroll',d:'每局多 1 次重抽三選一' }
];

/* ---------- 符文 ----------
 * 每件裝備有 1–3 個符文孔（看稀有度）；3 個同系同階合成高一階（最高 5 階）
 * per：每一階的數值（%）；set2 / set4：同系裝滿 2 個、4 個的套裝效果 */
D.RUNES = {
  atk: { n:'破壞', col:'#ff7a5a', stat:'攻擊',     per:[2,3,4,6,8],  set2:'攻擊 +5%',       set4:'爆擊傷害 +30%' },
  def: { n:'堅韌', col:'#93d95e', stat:'生命',     per:[3,4,6,8,11], set2:'生命 +8%',       set4:'每間房開始時獲得一面骨盾' },
  ele: { n:'元素', col:'#7df9ff', stat:'元素傷害', per:[4,6,8,11,15],set2:'元素傷害 +10%',  set4:'三選一更容易出現元素技能' },
  arc: { n:'秘術', col:'#e2b84d', stat:'局內經驗', per:[3,4,6,8,10], set2:'局內經驗 +10%',  set4:'每局多 1 次重抽' }
};
D.RUNE_TIERS = ['碎裂','粗糙','完整','精緻','完美'];
D.RUNE_COST = { craft:30, dismantle:[3,8,20,45,90] };   // 用粉塵打造 1 階符文、分解各階得到的粉塵

/* ---------- 抽卡箱 ----------
 * cur：花費的貨幣；rates：[稀有度或符文階, 權重]
 * pity：第幾抽保底至少多少（每次抽到就重新計算） */
D.BOXES = [
  { id:'bone', n:'骨匣', d:'普通到史詩裝備',   cur:'gold',     cost:300, cost10:2700, kind:'gear', rates:[[0,55],[1,30],[2,12],[3,3]] },
  { id:'soul', n:'魂匣', d:'優良到傳說裝備',   cur:'crystals', cost:60,  cost10:540,  kind:'gear', rates:[[1,50],[2,35],[3,12],[4,3]], pity:[[10,3],[50,4]] },
  { id:'rune', n:'符文箱', d:'1 到 4 階符文', cur:'crystals', cost:40,  cost10:360,  kind:'rune', rates:[[1,55],[2,30],[3,12],[4,3]], pity:[[10,3]], unlock:'sys:runes' }
];

})(window.POF_DATA);
