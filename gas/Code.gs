/**
 * 被遺忘者之路：遊玩數據後端
 * 部署：試算表 → 擴充功能 → Apps Script → 整份貼上 → 儲存
 *      → 上方函式選 setup → 執行（第一次會要求授權）
 *      → 部署 → 新增部署作業 → 類型：網頁應用程式
 *        執行身分：我；存取權：所有人 → 部署 → 複製網址
 * 工作表：Players（每份存檔一列）、Events（事件明細）
 */
const PLAYER_HEADERS = ['pid','name','dev','acct','runs','clears','kills','power','best','ver','first','last'];
const EVENT_HEADERS  = ['ts','pid','name','dev','ev','ch','room','acct','detail','ver'];
const MAX_EVENTS = 60;

function setup() {
  sheet_('Players', PLAYER_HEADERS);
  sheet_('Events', EVENT_HEADERS);
}

function sheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}
const clean_ = (v, n) => String(v == null ? '' : v).replace(/^[=+\-@]+/, '').replace(/[<>]/g, '').slice(0, n || 40);
const num_ = (v, max) => Math.max(0, Math.min(Number(v) || 0, max == null ? 1e9 : max));
// 修正 bonewalker 的 1970 問題：毫秒時間戳約 1.8e12，不能被 1e9 上限截掉
const ts_ = (v, now) => { const t = Number(v); return t > 1.6e12 && t < now.getTime() + 864e5 ? new Date(t) : now; };

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const d = JSON.parse(e.postData.contents);
    const pid = clean_(d.pid, 32);
    if (!/^p[a-z0-9]{6,30}$/.test(pid)) return json_({ ok: false, error: 'pid' });
    const now = new Date();
    const name = clean_(d.name, 16) || '無名';
    const dev = d.dev ? 1 : 0;
    const ver = clean_(d.ver, 12);
    const events = (d.events || []).slice(0, MAX_EVENTS);

    if (events.length) {
      const ev = sheet_('Events', EVENT_HEADERS);
      const rows = events.map(x => {
        const det = Object.assign({}, x); ['ev','ts','ch','room','acct'].forEach(k => delete det[k]);
        return [ts_(x.ts, now), pid, name, dev, clean_(x.ev, 16), clean_(x.ch, 8), num_(x.room, 999),
                num_(x.acct != null ? x.acct : d.acct, 999), JSON.stringify(det).slice(0, 450), ver];
      });
      ev.getRange(ev.getLastRow() + 1, 1, rows.length, EVENT_HEADERS.length).setValues(rows);
    }

    const sh = sheet_('Players', PLAYER_HEADERS);
    const ids = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().map(r => r[0]) : [];
    const i = ids.indexOf(pid);
    const first = i >= 0 ? sh.getRange(i + 2, 11).getValue() : now;
    const row = [pid, name, dev, num_(d.acct, 999), num_(d.runs), clean_(d.clears, 60), num_(d.kills),
                 num_(d.power), clean_(d.best, 20), ver, first, now];
    if (i >= 0) sh.getRange(i + 2, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// 瀏覽器開 網址?action=ping 確認部署成功
function doGet(e) {
  const a = (e && e.parameter && e.parameter.action) || 'ping';
  if (a === 'ping') return json_({ ok: true, game: 'path-of-the-forgotten', time: new Date().toISOString() });
  return json_({ ok: false });
}

const json_ = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
