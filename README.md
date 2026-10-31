# 被遺忘者之路 Path of the Forgotten

不死族骷髏法師的副本闖關遊戲。弓箭傳說式玩法（移動閃躲、停下自動施法、打怪升級三選一），RO 式斜 45° 視角，手機直式優先。

## 怎麼玩

| 操作 | 手機 | 電腦 |
|---|---|---|
| 移動 | 按住畫面任意處拖曳 | WASD 或方向鍵 |
| 攻擊 | 停下自動對最近的敵人施法（移動中六成攻速） | 同左 |
| 主動技 | 右下角按鈕 | 空白鍵或 E（第二格按 Q） |
| 暫停 | 右上角按鈕 | Esc 或 P |

**一局的流程**：每章 30 間短房間。打怪掉落綠色魂火（局內經驗），經驗滿就升級、三選一技能。
第 5、15、25 間是事件房（營火、商人、詛咒祭壇、魂火泉、寶箱、儀式挑戰），第 10、20 間是菁英，第 30 間是首領。
倒下時本局技能清空，撿到的金幣、骨片、寶箱裝備照拿，帳號經驗依通過房間數折算。
中途關掉瀏覽器也沒關係，下次在「出征」頁可以從同一間房繼續。

**局外成長**：帳號等級（天賦點、里程碑）、5 格裝備（強化、3 合 1 合成、符文孔）、符文套裝、召喚（骨匣、魂匣、符文箱，有保底）、每日任務、成就、素材關掃蕩、營地挖掘。

## 本機執行

模型用 `fetch` 載入，**不能直接雙擊 `index.html`**。用 VS Code 的 Live Server：在 `index.html` 上按右鍵 → Open with Live Server。

## 檔案結構

| 路徑 | 內容 |
|---|---|
| `index.html` | 頁面骨架與所有介面 |
| `css/style.css` | 介面樣式 |
| `data/rules.js` | 規則數值（房間數、事件房位置、局內升級曲線）、場景主題、主角外觀、像素角色 |
| `data/enemies.js` | 怪物、首領、菁英、詞綴 |
| `data/stages.js` | 主線章節、素材關、難度、房間事件、詛咒、商人價格 |
| `data/skills.js` | 局內技能（6 流派、48 種，含傳說與進化）、主動技 |
| `data/gear.js` | 裝備欄位、稀有度、裝備種類、特效、符文、抽卡箱機率 |
| `data/meta.js` | 貨幣、帳號經驗、天賦、里程碑、每日任務、成就 |
| `js/engine.js` | 渲染、模型載入與動畫對應、特效、鏡頭 |
| `js/world.js` | 地城房間、野外房間、事件房物件、營地 |
| `js/combat.js` | 怪物 AI、詞綴、攻擊、技能效果、僕從、主動技 |
| `js/run.js` | 副本流程：房間、波次、局內經驗、三選一、事件、結算、續玩 |
| `js/meta.js` | 存檔（含舊存檔轉換）、數值、裝備、合成、符文、抽卡、任務、營地介面 |
| `js/main.js` | 輸入、主迴圈、啟動、測試指令 |
| `lib/` | Three.js r128 與載入器（內附，不依賴 CDN） |
| `assets/` | 角色與武器模型；`monsters/` 怪物、`dungeon/` 地城、`halloween/` 墓園道具、`nature/` 岩石草木、`pixel/` 像素彩蛋圖集 |
| `sw.js`、`manifest.webmanifest`、`icons/` | 加到主畫面、離線快取 |

## 常改的地方

| 想做的事 | 改哪裡 |
|---|---|
| 一章幾間房、事件房與菁英房在第幾間 | `data/rules.js` 的 `RULES.rooms`、`eventRooms`、`eliteRooms` |
| 局內升級快慢 | `data/rules.js` 的 `RULES.runXp`（升級所需經驗）；怪物掉多少經驗看 `data/enemies.js` 的 `xp` |
| 房間怪物多寡、後段變強多少 | `data/rules.js` 的 `roomBudget`、`roomHp`、`roomDmg`；每隻怪的點數是 `cost` |
| 新增章節 | `data/stages.js` 的 `STAGES` 照格式加一筆：`pool` 怪物池、`elite` 菁英、`boss` 首領、`first` 首通解鎖 |
| 新增怪物 | `data/enemies.js`，`model` 填 `assets/` 底下的路徑。非 KayKit 的模型會自動把動作對應到它自己的動畫 |
| 新增技能 | `data/skills.js` 的 `PERKS` 加一筆，再到 `js/combat.js` 搜尋 `perk('` 看效果怎麼接 |
| 新增進化 | `PERKS` 加一筆 `evo:true` 並寫 `need`（例：`[['frost',1],['fire',1]]`） |
| 難度倍率 | `data/stages.js` 的 `DIFFS` |
| 抽卡機率、保底 | `data/gear.js` 的 `BOXES` |
| 每日任務、成就 | `data/meta.js` 的 `DAILY`、`ACHIEVEMENTS` |
| 換場景素材 | `data/rules.js` 每個主題的 `kit`；`kind:'outdoor'` 是野外房間 |
| 移動中能不能攻擊 | `data/rules.js` 的 `RULES.moveAttack`：0 = 只能站著攻擊，1 = 移動也全速 |
| 調鏡頭角度 | `js/engine.js` 搜尋 `const CAM=`：`pitch` 是俯角（弧度），`fov` 是視野角 |
| 主角初始數值 | `js/meta.js` 的 `baseStats()` |

## 改版注意

- 改了 `js/`、`data/`、`css/` 或 `index.html` 後，把 `sw.js` 的 `CACHE` 版本號加一版，玩家才會拿到新檔案。
- 存檔鍵是 `pof_save_v2`；第一次開新版時會自動把 v0.4 的 `pof_save_v1` 轉過來（舊裝備換成新稀有度，另送 150 魂晶）。

## 主控台測試指令

在瀏覽器按 F12 → Console：

| 指令 | 作用 |
|---|---|
| `__pof.god()` | 本局幾乎不受傷 |
| `__pof.killAll()` | 擊殺場上所有敵人 |
| `__pof.jump(29)` | 直接跳到第 29 間 |
| `__pof.give('steam')` | 直接獲得某個技能 |
| `__pof.xp(50)` | 獲得局內經驗 |
| `__pof.SAVE` | 查看存檔 |
| `localStorage.removeItem('pof_save_v2')` 後重新整理 | 清除存檔重新開始 |

## 素材授權（全部 CC0，可商用）

| 素材 | 來源 |
|---|---|
| 骷髏角色、冒險者、武器 | Kay Lousberg · KayKit Character Pack: Skeletons、Adventurers |
| 地城 | Kay Lousberg · KayKit Dungeon Remastered |
| 墓園道具、枯樹、石拱門 | Kay Lousberg · KayKit Halloween Bits |
| 怪物（惡魔、蕈王、恐龍、幽魂等） | Quaternius · Ultimate Monsters |
| 岩石、蘑菇、草叢 | Quaternius · Stylized Nature MegaKit |
| 像素角色彩蛋 | 0x72 · 16x16 DungeonTileset II |

## 遊玩數據（v0.5.5）

- 前端：`js/telemetry.js`，送到 GAS 試算表（後端程式在 `gas/Code.gs`）
- 第一次開新版會送一筆 `snapshot`，把既有存檔當起點
- 事件：`open` `run_start` `run_resume` `room` `pick` `reroll` `event` `death` `run_end` `save_quit` `bg` `gacha` `merge` `sweep`
- 開發者標記：標題畫面連點「被遺忘者之路」5 下切換（或網址加 `?dev=1`）；自訂名稱：`?name=名字`。兩者都存在該份存檔裡

## 全螢幕與怪物倍率（v0.5.8）

- 直式手機：房間深度從 21 自動加深（每次 +3，最多 33），直到填滿畫面；整間房仍一次看完。橫式維持 21
- 怪物數量：`(1 + 0.15 × 章節序) × (房間深度/21)^0.6`；一般怪個體血量除以倍率的平方根（首領、菁英不受影響）
- 參數在 `data/rules.js` 的 `roomDepth`、`crowd`
