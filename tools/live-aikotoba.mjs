// 公開版で あいことばを 本物の 置き場まで 通す 試験（CORS・進み具合・べつの 端末・ノートを おくらない）。
// 使い方: TEST_KEY=<試験用の あいことば> node tools/live-aikotoba.mjs
// 置き場の 試験用 あいことば（わたしの ミカタの 試験で 作った 物）に 進み具合が すこし のこる。
import puppeteer from 'puppeteer-core';

const BASE = process.env.E2E_BASE || 'https://haru-uta.github.io/anshin-pocket/';
const BROWSER = process.env.E2E_BROWSER || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const KEY = process.env.TEST_KEY;
if (!KEY) { console.log('TEST_KEY を つけて ください'); process.exit(2); }
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: BROWSER, headless: 'new', args: ['--no-first-run', '--mute-audio'] });
const errors = [];
async function device() {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|favicon/.test(m.text())) errors.push(m.text()); });
  await page.goto(BASE + '?t=' + Date.now(), { waitUntil: 'networkidle0' });
  return page;
}
let ok = true;
const check = (name, cond, info) => { console.log(cond ? 'OK ' : 'NG ', name, cond ? '' : JSON.stringify(info)); if (!cond) ok = false; };

const A = await device();
check('置き場の URL が入っている', await A.evaluate(() => window.__app.Sync.enabled()));
const la = await A.evaluate((k) => window.__app.Sync.lookup(k, false, 0), KEY);
check('試験用の あいことばを 呼び出せる（CORS が通る）', la.ok === true, la);
const exp0 = await A.evaluate(() => window.__app.S.exp);
await A.evaluate(() => { window.__app.S = { ...window.__app.S, nick: 'しけん' }; window.__app.award(3); });
for (let i = 0; i < 30 && (await A.evaluate(() => window.__app.Sync.info().dirty)); i++) await wait(500);
check('スターが 置き場に 届く', !(await A.evaluate(() => window.__app.Sync.info().dirty)), await A.evaluate(() => window.__app.Sync.info()));

const B = await device();
const lb = await B.evaluate((k) => window.__app.Sync.lookup(k.replace(/・/g, ' '), false, 0), KEY);
check('べつの 端末で 呼び出せる', lb.ok === true && lb.state.anshin && lb.state.anshin.exp === exp0 + 3, lb.state && lb.state.anshin);
check('ノートの なまえは 置き場に ない', !JSON.stringify(lb.state).includes('しけん'));
check('画面の エラーなし', errors.length === 0, errors);
console.log('スター:', exp0, '→', exp0 + 3);
await browser.close();
process.exit(ok ? 0 : 1);
