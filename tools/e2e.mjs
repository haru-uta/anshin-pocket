// ブラウザで 実際に 操作して、画面ごとに 写真と 点検（はみ出し・文字の重なり・絵の読みこみ失敗・エラー）。
// 使い方: node tools/e2e.mjs   → out/e2e/<日時>/ に 写真と report.md
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const OUT = path.join(ROOT, 'out', 'e2e', new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19));
fs.mkdirSync(OUT, { recursive: true });
const BROWSER = process.env.E2E_BROWSER || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };

const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  const file = fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, 'index.html') : p;
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(0);
const BASE = `http://127.0.0.1:${server.address().port}/`;

const problems = [];
const passed = [];
let shotNo = 0;

// 画面の 点検: 横はみ出し / 字が 箱から はみ出す / 文字どうしの 重なり / 絵の 失敗
async function audit(page, label) {
  const r = await page.evaluate(() => {
    const out = [];
    const W = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > W + 1) out.push(`横に はみ出し（${document.documentElement.scrollWidth} > ${W}）`);
    const vis = (el) => { const s = getComputedStyle(el); const b = el.getBoundingClientRect(); return s.visibility !== 'hidden' && s.display !== 'none' && b.width > 0 && b.height > 0; };
    const txt = [...document.querySelectorAll('button, p, b, small, h1, h2, h3, span, label, li, a')].filter((el) => vis(el)
      && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
    for (const el of txt) {
      if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflowX !== 'auto' && el.clientWidth > 0) out.push(`字が はみ出す: 「${el.textContent.trim().slice(0, 24)}」`);
      const b = el.getBoundingClientRect();
      if (b.left < -1 || b.right > W + 1) out.push(`画面の そと: 「${el.textContent.trim().slice(0, 24)}」`);
    }
    // 文字の 行の 箱（Range）どうしで 重なりを みる
    const boxes = [];
    for (const el of txt) {
      for (const n of el.childNodes) {
        if (n.nodeType !== 3 || !n.textContent.trim()) continue;
        const rg = document.createRange(); rg.selectNodeContents(n);
        for (const b of rg.getClientRects()) if (b.width > 2 && b.height > 2) boxes.push({ el, b, t: n.textContent.trim().slice(0, 16) });
      }
    }
    const inModal = (el) => !!el.closest('.modal');
    const modalOpen = !!document.querySelector('.modal');
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const A = boxes[i], B = boxes[j];
      if (A.el === B.el || A.el.contains(B.el) || B.el.contains(A.el)) continue;
      if (modalOpen && inModal(A.el) !== inModal(B.el)) continue;
      // うごく 帯（sticky）の 下に もぐるのは よい
      if (!!A.el.closest('.bar') !== !!B.el.closest('.bar')) continue;
      const ov = Math.min(A.b.right, B.b.right) - Math.max(A.b.left, B.b.left);
      const oh = Math.min(A.b.bottom, B.b.bottom) - Math.max(A.b.top, B.b.top);
      if (ov > 3 && oh > 3) out.push(`文字が かさなる: 「${A.t}」と「${B.t}」`);
    }
    // 言葉の とちゅうで 改行（くぎりの 空白・、。 の あいだは 1つの 言葉）
    for (const el of txt) {
      for (const n of el.childNodes) {
        if (n.nodeType !== 3) continue;
        const re = /[^\s、。！？「」・（）]+[、。！？」）]*/g; let m;
        if (el.closest('.adult')) continue; // おとなの 文は ふつうの 改行で よい
        while ((m = re.exec(n.textContent))) {
          if ([...m[0]].length < 2) continue;
          const rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
          const tops = new Set([...rg.getClientRects()].filter((b) => b.width > 1).map((b) => Math.round(b.top / 4)));
          if (tops.size > 1) out.push(`言葉の とちゅうで 改行: 「${m[0]}」`);
        }
      }
    }
    // ボタンが ちいさすぎない か（指で おせる 40px 以上）
    for (const el of document.querySelectorAll('button')) {
      if (!vis(el) || el.closest('.modal') !== (modalOpen ? el.closest('.modal') : null)) continue;
      const b = el.getBoundingClientRect();
      if (b.height < 40 || b.width < 40) out.push(`ボタンが ちいさい: 「${el.textContent.trim().slice(0, 16)}」${Math.round(b.width)}×${Math.round(b.height)}`);
    }
    for (const img of document.querySelectorAll('img')) if (img.complete && img.naturalWidth === 0) out.push(`絵が ない: ${img.getAttribute('src')}`);
    out.push(...(window.__missing || []).map((s) => `絵が ない: ${s}`));
    window.__missing = [];
    return [...new Set(out)];
  });
  for (const p of r) problems.push(`[${label}] ${p}`);
}
async function shot(page, label) {
  await new Promise((r) => setTimeout(r, 250));
  await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })))));
  await audit(page, label);
  const name = `${String(++shotNo).padStart(2, '0')}_${label}.png`;
  await page.screenshot({ path: path.join(OUT, name), fullPage: true });
}
async function click(page, text, sel = 'button') {
  const ok = await page.evaluate((text, sel) => {
    const els = [...document.querySelectorAll(sel)].filter((b) => b.textContent.replace(/\s+/g, ' ').includes(text) && !b.disabled);
    const modal = document.querySelector('.modal');
    const el = (modal ? els.filter((b) => modal.contains(b)) : els)[0] || els[0];
    if (!el) return false;
    el.scrollIntoView({ block: 'center' }); el.click(); return true;
  }, text, sel);
  if (!ok) throw new Error(`ボタン「${text}」が 見つからない`);
  await new Promise((r) => setTimeout(r, 120));
}
const state = (page) => page.evaluate(() => window.__app.S);
async function step(name, fn) {
  try { await fn(); passed.push(name); } catch (e) { problems.push(`[試験] ${name}: ${e.message}`); }
}

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: 'new', args: ['--no-first-run', '--mute-audio'] });
const VIEWS = [
  { tag: 'se', width: 375, height: 667, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { tag: 'iphone', width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { tag: 'ipad', width: 820, height: 1180, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
];
const only = process.env.E2E_VIEW;
for (const v of VIEWS.filter((x) => !only || x.tag === only)) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport(v);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|favicon/.test(m.text())) errors.push(m.text()); });
  await page.evaluateOnNewDocument(() => { Math.random = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })(); });
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  const T = (s) => `${v.tag}_${s}`;

  await step(`${v.tag} タイトル`, async () => { await shot(page, T('タイトル')); });
  await step(`${v.tag} 犬を えらぶ`, async () => {
    await click(page, 'いぬを えらぶ'); await shot(page, T('いぬをえらぶ'));
    await click(page, 'こむぎ');
    if ((await state(page)).dog !== 1) throw new Error('しばいぬに ならない');
    await page.goBack(); await shot(page, T('タイトル_しば'));
  });
  await step(`${v.tag} きもちを みる`, async () => {
    await click(page, 'きもちを よもう'); await shot(page, T('きもち'));
    await click(page, 'きもちを みる'); await shot(page, T('きもち一覧'));
    await click(page, 'こわい');
    await new Promise((r) => setTimeout(r, 700));
    await shot(page, T('きもち_こわい'));
    for (let i = 0; i < 6; i++) { if (await page.$('.modal')) await click(page, 'やったね'); await click(page, i < 5 ? 'つぎ' : 'おわり').catch(() => {}); await new Promise((r) => setTimeout(r, 500)); }
    if (await page.$('.modal')) await click(page, 'やったね');
    const s = await state(page);
    if (s.emoSeen.length < 5) throw new Error(`みた きもち ${s.emoSeen.length}`);
  });
  await step(`${v.tag} あてっこ`, async () => {
    await page.goto(BASE, { waitUntil: 'networkidle0' });
    await click(page, 'きもちを よもう'); await click(page, 'あてっこ'); await shot(page, T('あてっこ'));
    for (let q = 0; q < 6; q++) {
      const ans = await page.evaluate(() => {
        const src = document.querySelector('.emo-hero img')?.getAttribute('src') || '';
        return src.match(/_(\w+)\.png$/)[1];
      });
      const word = { happy: 'うれしい', scared: 'こわい', iya: 'いや', sad: 'かなしい', surprised: 'びっくり', calm: 'おちついて いる' }[ans];
      if (q === 0) {
        // まちがえると ヒントが でる
        const wrong = await page.evaluate((w) => [...document.querySelectorAll('.answer')].find((b) => b.textContent !== w).textContent, word);
        await click(page, wrong, '.answer');
        await shot(page, T('あてっこ_ヒント'));
      }
      await page.evaluate((w) => [...document.querySelectorAll('.answer')].find((b) => b.textContent === w).click(), word);
      if (q === 1) await shot(page, T('あてっこ_せいかい'));
      await new Promise((r) => setTimeout(r, 600));
      if (await page.$('.modal')) { await shot(page, T('レベルアップ')); await click(page, 'やったね'); }
      // 正解の あとは 自動で 進まない（ふりかえれる）
      if (q === 0) { await new Promise((r) => setTimeout(r, 2500)); if ((await page.$eval('.count', (e) => e.textContent)) !== '1 / 6') throw new Error('かってに つぎへ すすんだ'); await shot(page, T('あてっこ_つぎへ')); }
      await click(page, q < 5 ? 'つぎの もんだい' : 'けっかを みる');
    }
    await shot(page, T('あてっこ_おわり'));
  });
  await step(`${v.tag} れんしゅう`, async () => {
    await page.goto(BASE, { waitUntil: 'networkidle0' });
    await click(page, 'れんしゅう しよう'); await shot(page, T('れんしゅう一覧'));
    await click(page, 'ちゅうしゃ');
    for (let k = 0; k < 6; k++) { if (k === 0 || k === 3) await shot(page, T(`ちゅうしゃ_${k + 1}`)); await click(page, k < 5 ? 'つぎ' : 'おわり'); }
    await shot(page, T('ちゅうしゃ_きもち'));
    await click(page, 'こわい', '.card'); await shot(page, T('ちゅうしゃ_こたえ'));
    if (await page.$('.modal')) await click(page, 'やったね');
    if (!(await state(page)).scenesDone.includes(1)) throw new Error('できた しるしが つかない');
  });
  await step(`${v.tag} 6ばめん ぜんぶ ひらける`, async () => {
    for (let i = 0; i < 6; i++) {
      await page.goto(BASE, { waitUntil: 'networkidle0' });
      await page.evaluate((i) => window.__app.go('scene', { i, k: 0 }), i);
      const n = await page.evaluate(() => document.querySelectorAll('.dots span').length);
      for (let k = 0; k < n; k++) { await audit(page, `${T('ばめん')}${i}_${k + 1}`); if (v.tag === 'se') await shot(page, T(`ばめん${i}_${k + 1}`)); await click(page, k < n - 1 ? 'つぎ' : 'おわり'); }
    }
  });
  await step(`${v.tag} ショップ`, async () => {
    await page.goto(BASE, { waitUntil: 'networkidle0' });
    await page.evaluate(() => window.__app.award(60));
    if (await page.$('.modal')) { await shot(page, T('レベルアップ_たくさん')); await click(page, 'やったね'); }
    await click(page, 'ショップ'); await shot(page, T('ショップ'));
    await page.evaluate((n) => [...document.querySelectorAll('.shop-item button')].find((b) => b.textContent.trim() === n && !b.disabled).click(), '3'); await new Promise((r) => setTimeout(r, 120)); await shot(page, T('ショップ_かう'));
    await click(page, 'かう');
    await page.evaluate((n) => [...document.querySelectorAll('.shop-item button')].find((b) => b.textContent.trim() === n && !b.disabled).click(), '5'); await new Promise((r) => setTimeout(r, 120)); await click(page, 'かう');
    await click(page, 'ノートの いろ'); await page.evaluate((n) => [...document.querySelectorAll('.shop-item button')].find((b) => b.textContent.trim() === n && !b.disabled).click(), '4'); await new Promise((r) => setTimeout(r, 120)); await click(page, 'かう'); await shot(page, T('ショップ_いろ'));
    await click(page, 'わく'); await page.evaluate((n) => [...document.querySelectorAll('.shop-item button')].find((b) => b.textContent.trim() === n && !b.disabled).click(), '5'); await new Promise((r) => setTimeout(r, 120)); await click(page, 'かう'); await shot(page, T('ショップ_わく'));
    const s = await state(page);
    if (s.stickers.length !== 2 || s.themes.length !== 2 || s.frames.length !== 2) throw new Error(`かった かず ${JSON.stringify([s.stickers, s.themes, s.frames])}`);
  });
  await step(`${v.tag} じぶんノート`, async () => {
    await page.goto(BASE, { waitUntil: 'networkidle0' });
    await click(page, 'じぶん ノート'); await shot(page, T('ノート_から'));
    await click(page, 'ノートを かく');
    await page.click('.grid4 .card:nth-child(3)'); await shot(page, T('ノート_アバター'));
    await click(page, 'つぎ');
    await page.type('.nick-in', 'はるか123'); await shot(page, T('ノート_なまえ'));
    await click(page, 'つぎ');
    for (const n of [1, 4, 9, 2]) await page.click(`.grid4 .card:nth-child(${n})`);
    await shot(page, T('ノート_たべもの_4つめ'));
    await click(page, 'つぎ'); await page.click('.grid4 .card:nth-child(5)'); await click(page, 'つぎ');
    await page.click('.grid4 .card:nth-child(8)'); await click(page, 'つぎ');
    for (const n of [1, 3, 6]) await page.click(`.grid4 .card:nth-child(${n})`); await shot(page, T('ノート_にがて')); await click(page, 'つぎ');
    for (const n of [2, 3]) await page.click(`.grid4 .card:nth-child(${n})`); await click(page, 'できた');
    await new Promise((r) => setTimeout(r, 600));
    const scr = await page.evaluate(() => document.getElementById('app').dataset.screen);
    if (scr !== 'note') throw new Error(`できた の あと ${scr} に なった`);
    if (await page.$('.modal')) await click(page, 'やったね');
    await page.$eval('.slot.s0', (e) => e.click()); await shot(page, T('ノート_シール'));
    await page.$eval('.modal .card', (e) => e.click()); await page.$eval('.slot.s5', (e) => e.click()); await page.$eval('.modal .card:nth-child(2)', (e) => e.click());
    await shot(page, T('ノート'));
    const s = await state(page);
    if (s.nick !== 'はるか' || s.foods.length !== 3 || s.avatar !== 2 || s.slots[0] < 0) throw new Error(`ノート ${JSON.stringify(s)}`);
    await click(page, 'みせる'); await shot(page, T('ノート_みせる'));
  });
  await step(`${v.tag} きょうの よてい`, async () => {
    await page.goto(BASE, { waitUntil: 'networkidle0' });
    await click(page, 'きょうの よてい'); await shot(page, T('よてい_から'));
    for (const w of ['おきる', 'ごはん', 'がっこう', 'かんごしさん', 'おふろ', 'ねる']) await click(page, w, '.palette .card');
    await click(page, 'できた？'); await new Promise((r) => setTimeout(r, 300));
    if (await page.$('.modal')) await click(page, 'やったね');
    await page.click('.plan li:nth-child(3) [aria-label="うえへ"]');
    await shot(page, T('よてい'));
    const order = await page.$$eval('.plan li b', (bs) => bs.map((b) => b.textContent));
    if (order[1] !== 'がっこう') throw new Error(`ならびかえ ${order}`);
  });
  await step(`${v.tag} あいことば`, async () => {
    await page.goto(BASE, { waitUntil: 'networkidle0' });
    const before = await state(page);
    await page.$eval('.parent-btn', (e) => e.scrollIntoView({ block: 'center' }));
    const h = await page.$('.parent-btn');
    const b = await h.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down();
    await new Promise((r) => setTimeout(r, 1700)); await page.mouse.up();
    if ((await page.evaluate(() => document.getElementById('app').dataset.screen)) !== 'parent') throw new Error('ながおしで ひらかない');
    await shot(page, T('おとな'));
    const code = await page.$eval('[data-testid=code]', (e) => e.textContent);
    await click(page, 'セーブを消す'); await shot(page, T('おとな_けす')); await click(page, '消す');
    if ((await state(page)).exp !== 0) throw new Error('けせない');
    // べつの 端末の つもりで いれる（まちがい → ただしい）
    await page.evaluate(() => window.__app.go('parent'));
    await page.type('.code-in', code.replace('あ', 'い').slice(0, 30));
    await click(page, '読み込む'); await shot(page, T('おとな_まちがい'));
    await page.$eval('.code-in', (e) => (e.value = ''));
    await page.type('.code-in', code);
    await click(page, '読み込む'); await shot(page, T('おとな_つづき')); await click(page, '続きから始める');
    const after = await state(page);
    if (JSON.stringify(after) !== JSON.stringify(before)) throw new Error('あいことばで もどらない');
    await shot(page, T('タイトル_つづき'));
  });
  await step(`${v.tag} 文字を大きく`, async () => {
    await page.evaluate(() => { localStorage.setItem('anshin-pocket-settings', JSON.stringify({ big: true })); });
    await page.goto(BASE, { waitUntil: 'networkidle0' });
    await shot(page, T('大きい字_タイトル'));
    await click(page, 'きょうの よてい'); await shot(page, T('大きい字_よてい'));
    await page.evaluate(() => window.__app.go('shop')); await shot(page, T('大きい字_ショップ'));
    await page.evaluate(() => window.__app.go('scene', { i: 4, k: 2 })); await shot(page, T('大きい字_ばめん'));
    await page.evaluate(() => window.__app.go('noteEdit', 2)); await shot(page, T('大きい字_たべもの'));
    await page.evaluate(() => window.__app.go('noteEdit', 6)); await shot(page, T('大きい字_おちつく'));
    await page.evaluate(() => window.__app.go('note')); await shot(page, T('大きい字_ノート'));
    await page.evaluate(() => window.__app.go('scenes')); await shot(page, T('大きい字_れんしゅう'));
    await page.evaluate(() => window.__app.go('emoDetail', 1)); await shot(page, T('大きい字_きもち'));
    await page.evaluate(() => window.__app.go('parent')); await shot(page, T('大きい字_おとな'));
    await page.evaluate(() => localStorage.removeItem('anshin-pocket-settings'));
  });
  for (const e of errors) problems.push(`[${v.tag} エラー] ${e}`);
  await ctx.close();
}
await browser.close();
server.close();

const uniq = [...new Set(problems)];
const rep = `# 画面の試験 ${path.basename(OUT)}\n\n合格 ${passed.length} 件\n\n## 見つかったこと（${uniq.length}）\n${uniq.map((p) => `- ${p}`).join('\n') || '- なし'}\n`;
fs.writeFileSync(path.join(OUT, 'report.md'), rep);
console.log(rep);
console.log('写真:', OUT);
process.exit(uniq.some((p) => p.includes('[試験]') || p.includes('エラー')) ? 1 : 0);
