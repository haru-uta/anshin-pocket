import { DOGS, EMOTIONS, SCENES, CARD_HARD, CARD_CALM, PLAN_ITEMS, FOODS, PLAYS, COLORS, AVATAR_COUNT,
  STICKERS, THEMES, FRAMES, LEVEL_MAX, levelNeed } from './data.js';
import { load, store, fresh, normalize, level, wallet, toCode, fromCode, prettyCode, cleanNick, NICK_MAX, SLOTS } from './save.js';

let S = load();
const SET_KEY = 'anshin-pocket-settings';
const SET = (() => {
  const d = { voice: true, sound: true, bgm: false, calm: false, big: false };
  try { return { ...d, ...JSON.parse(localStorage.getItem(SET_KEY) || '{}') }; } catch { return d; }
})();
const saveSet = () => { try { localStorage.setItem(SET_KEY, JSON.stringify(SET)); } catch { /* 保存できなくても つづける */ } };
const app = document.getElementById('app');

// ---------- 小さな 道具 ----------
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style') el.style.cssText = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(9)) if (c != null && c !== false) el.append(c.nodeType ? c : String(c));
  return el;
}
// 絵が まだ ない ときは 絵もじで かわりに だす
function pic(src, emoji, cls = '', alt = '') {
  const img = h('img', { src, alt, class: cls, draggable: 'false', decoding: 'async' });
  img.onerror = () => (window.__missing ||= []).push(src) && img.replaceWith(h('span', { class: cls + ' emoji', 'aria-hidden': 'true' }, emoji || '❓'));
  return img;
}
// いぬ いがいは しっぽの 文を つかわない
const seeOf = (e) => (DOGS[S.dog].dog ? e.see : e.seeAny || e.see);
const dogImg = (emo, cls = 'dog') => pic(`art/dogs/${DOGS[S.dog].id}_${emo}.png`, '🐶', cls, `${DOGS[S.dog].name}（${EMOTIONS.find((e) => e.id === emo)?.word || ''}）`);
const itemImg = (it, cls = 'icon') => pic(`art/items/${it.id}.png`, it.emoji, cls, '');
const avatarImg = (i, cls = 'avatar') => (i < 0 ? h('span', { class: cls + ' emoji' }, '🙂') : pic(`art/avatars/a${i}.png`, '🙂', cls, 'じぶん'));
const save = () => store(S);
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };


// 線の アイコン（絵もじは 端末ごとに 見た目が かわり、やすっぽく 見えるので つかわない）
const ICONS = {
  speaker: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  back: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
  next: '<path d="M9.5 5.5L16 12l-6.5 6.5"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.9 1.9M16.6 16.6l1.9 1.9M5.5 18.5l1.9-1.9M16.6 7.4l1.9-1.9"/>',
  pencil: '<path d="M4.5 19.5l1-4.5L16 4.5l3.5 3.5L9 18.5z"/><path d="M13.5 7l3.5 3.5"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  bulb: '<path d="M9 17.5h6M10 20.5h4M12 3.5a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3.5z"/>',
  refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v4.5H15"/>',
  lock: '<rect x="5.5" y="10.5" width="13" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  bag: '<path d="M5 8.5h14l-1.2 11.5H6.2z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/>',
  paw: '<circle cx="7" cy="9" r="1.9" fill="currentColor"/><circle cx="11" cy="6.5" r="1.9" fill="currentColor"/><circle cx="15.5" cy="7" r="1.9" fill="currentColor"/><circle cx="18.2" cy="10.8" r="1.8" fill="currentColor"/><path d="M8.5 16.5c0-3 2-5 4.2-5s4.3 2.2 4.3 5c0 2-1.6 2.6-4.3 2.1-2.6.5-4.2-.1-4.2-2.1z" fill="currentColor"/>',
  plus: '<path d="M12 6v12M6 12h12"/>',
  music: '<path d="M9 17.5V6l10-2v11.5"/><circle cx="6.5" cy="17.5" r="2.5" fill="currentColor"/><circle cx="16.5" cy="15.5" r="2.5" fill="currentColor"/>',
  mute: '<path d="M9 17.5V6l10-2v11.5"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/><path d="M3.5 3.5l17 17"/>',
  star: '<path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" fill="#f6c343" stroke="#c98a1b" stroke-width="1.3"/>',
};
function ic(name, cls = '') {
  const span = document.createElement('span');
  span.className = 'ic ' + cls;
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
  return span;
}
const starNum = (n, cls = '') => h('span', { class: 'starnum ' + cls }, ic('star'), String(n));

// よみあげ（端末の 声。ネットは つかわない）
// 端末に ある 日本語の 声から、やさしい 女性の 自然な 声を えらぶ（おとなが 設定で えらび なおせる）
const VOICE_GOOD = /natural|neural|enhanced|premium|拡張|プレミアム/i;
const VOICE_FEMALE = /nanami|kyoko|o-ren|haruka|ayumi|mayu|aoi|shiori|nana|sayaka|google/i;
const VOICE_MALE = /otoya|hattori|ichiro|keita|daichi|naoki|takumi|kenji/i;
let voiceList = [];
function jaVoices() {
  try { return speechSynthesis.getVoices().filter((v) => v.lang && v.lang.replace('_', '-').toLowerCase().startsWith('ja')); } catch { return []; }
}
function voiceScore(v) {
  return (VOICE_GOOD.test(v.name) ? 10 : 0) + (VOICE_FEMALE.test(v.name) ? 5 : 0) - (VOICE_MALE.test(v.name) ? 100 : 0) + (v.localService ? 1 : 0);
}
function pickVoice() {
  voiceList = jaVoices();
  return voiceList.find((v) => v.name === SET.voiceName) || voiceList.slice().sort((x, y) => voiceScore(y) - voiceScore(x))[0] || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.addEventListener?.('voiceschanged', pickVoice); }
function speak(text, force) {
  if ((!SET.voice && !force) || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/ /g, ''));
    u.lang = 'ja-JP'; u.rate = 0.88; u.pitch = 1.0;
    const v = pickVoice();
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch { /* 声が でない 端末も ある */ }
}
const sayBtn = (text) => h('button', { class: 'say', 'aria-label': 'よみあげる', onclick: () => speak(text) }, ic('speaker'));

// やさしい 音（大きく しない・急に 鳴らさない）
let actx;
function chime(kind = 'ok') {
  if (!SET.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = kind === 'level' ? [523, 659, 784, 1047] : kind === 'soft' ? [440] : [659, 880];
    notes.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * 0.12;
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.08, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.55);
    });
  } catch { /* 音が でなくても つづける */ }
}


// ---------- BGM（オルゴールの ような 小さな 音楽。音の ファイルは つかわず その場で 作る） ----------
// 音に びんかんな 子も いるので、小さく・ゆっくり・急に 大きく ならない。タイトルの 音符ボタンと 設定で 止められる。
const BGM = { on: false, timer: null, next: 0, step: 0, gain: null };
// ヘ長調 F - Dm - B♭ - C を 1小節ずつ（8分音符 8つ）
const BGM_CHORDS = [[65, 69, 72, 77], [62, 65, 69, 74], [58, 62, 65, 70], [60, 64, 67, 72]];
const BGM_MELODY = [77, 0, 76, 74, 72, 0, 74, 0, 74, 0, 72, 69, 70, 0, 69, 0, 70, 0, 69, 67, 65, 0, 67, 0, 72, 0, 70, 69, 67, 0, 0, 0];
const midiHz = (m) => 440 * 2 ** ((m - 69) / 12);
function bgmNote(t, f, dur, vol, type = 'sine') {
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(BGM.gain); o.start(t); o.stop(t + dur + 0.05);
}
function bgmTick() {
  const beat = 60 / 72 / 2; // 8分音符
  while (BGM.next < actx.currentTime + 0.6) {
    const bar = Math.floor(BGM.step / 8) % 4, i = BGM.step % 8, ch = BGM_CHORDS[bar];
    if (i === 0) bgmNote(BGM.next, midiHz(ch[0] - 12), beat * 7, 0.22, 'triangle');
    bgmNote(BGM.next, midiHz(ch[[0, 1, 2, 3, 2, 1, 2, 3][i]]), beat * 3, 0.10);
    const m = BGM_MELODY[BGM.step % 32];
    if (m) bgmNote(BGM.next, midiHz(m + 12), beat * 4, 0.12);
    BGM.next += beat; BGM.step++;
  }
}
function bgmStart() {
  if (BGM.on || !SET.bgm || document.hidden) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    BGM.gain = actx.createGain();
    const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
    BGM.gain.gain.setValueAtTime(0, actx.currentTime);
    BGM.gain.gain.linearRampToValueAtTime(0.18, actx.currentTime + 2.5); // ゆっくり 大きく する
    BGM.gain.connect(lp).connect(actx.destination);
    BGM.next = actx.currentTime + 0.1; BGM.on = true;
    BGM.timer = setInterval(bgmTick, 200); bgmTick();
  } catch { /* 音が でなくても つづける */ }
}
function bgmStop() {
  if (!BGM.on) return;
  clearInterval(BGM.timer); BGM.on = false;
  const g = BGM.gain;
  try { g.gain.cancelScheduledValues(actx.currentTime); g.gain.setValueAtTime(g.gain.value, actx.currentTime); g.gain.linearRampToValueAtTime(0, actx.currentTime + 0.6); } catch { /* なし */ }
  setTimeout(() => { try { g.disconnect(); } catch { /* なし */ } }, 800);
}
const bgmApply = () => (SET.bgm ? bgmStart() : bgmStop());
// ブラウザは さわる まで 音を ださない ので、さいしょに さわった ときに はじめる
addEventListener('pointerdown', () => bgmApply(), { once: true });
document.addEventListener('visibilitychange', () => (document.hidden ? bgmStop() : bgmApply()));
function bgmBtn() {
  const b = h('button', { class: 'bgm-btn' + (SET.bgm ? ' on' : ''), 'aria-label': SET.bgm ? 'おんがくを とめる' : 'おんがくを ながす', 'aria-pressed': SET.bgm ? 'true' : 'false',
    onclick: (e) => { e.stopPropagation(); SET.bgm = !SET.bgm; saveSet(); bgmApply(); b.replaceWith(bgmBtn()); } }, ic(SET.bgm ? 'music' : 'mute'));
  return b;
}

// ---------- 画面の きりかえ ----------
const ROUTES = {};
let current = 'title';
function go(name, arg, replace = false) {
  try { speechSynthesis.cancel(); } catch { /* なし */ }
  current = name;
  const st = { name, arg };
  if (replace) history.replaceState(st, ''); else history.pushState(st, '');
  draw(name, arg);
}
function draw(name, arg) {
  document.body.classList.toggle('calm', SET.calm);
  document.body.classList.toggle('big', SET.big);
  app.replaceChildren(ROUTES[name](arg));
  app.scrollTop = 0; window.scrollTo(0, 0);
  app.dataset.screen = name;
}
addEventListener('popstate', (e) => {
  closeModal();
  const st = e.state || { name: 'title' };
  current = st.name; draw(st.name, st.arg);
});

function bar(title, back = () => history.back()) {
  return h('header', { class: 'bar' },
    h('button', { class: 'back', onclick: back }, ic('back'), 'もどる'),
    h('h1', {}, title),
    starChip());
}
function starChip() {
  return h('div', { class: 'chip', 'aria-label': `レベル ${level(S.exp)}、スター ${wallet(S)}` },
    h('span', { class: 'lv' }, 'レベル', h('b', {}, String(level(S.exp)))), starNum(wallet(S), 'st'));
}

// ---------- ほめる・スター・レベルアップ ----------
let modalEl = null;
function closeModal() { if (modalEl) { modalEl.remove(); modalEl = null; } }
function modal(...kids) {
  closeModal();
  modalEl = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' }, h('div', { class: 'sheet' }, ...kids));
  document.body.append(modalEl);
  return modalEl;
}
// スターを ふやす。レベルが あがったら おしらせ。
function award(n, after) {
  const before = level(S.exp);
  S.exp = Math.min(16383, S.exp + n);
  save();
  const lv = level(S.exp);
  document.querySelectorAll('.chip').forEach((c) => c.replaceWith(starChip()));
  if (lv > before) {
    const got = [...STICKERS, ...THEMES, ...FRAMES].filter((it) => it.lv > before && it.lv <= lv && it.price > 0);
    chime('level');
    modal(
      h('div', { class: 'big-emo' }, dogImg('happy', 'dog mid')),
      h('h2', {}, `レベル ${lv} に なったよ！`),
      got.length ? h('p', {}, 'ショップで あたらしい ものが かえるよ。') : null,
      got.length ? h('div', { class: 'row wrap center' }, got.slice(0, 6).map((it) => h('span', { class: 'mini' }, it.emoji ? itemImg(it, 'icon s') : h('span', { class: 'swatch', style: `background:${it.bg || '#fff'}` }), it.word))) : null,
      h('button', { class: 'btn primary', onclick: () => { closeModal(); after && after(); } }, 'やったね！'));
    speak(`レベル ${lv} に なったよ`);
  } else if (after) after();
}
const plusToast = (n) => {
  const t = h('div', { class: 'toast', role: 'status' }, ic('star'), `+${n}`);
  document.body.append(t); setTimeout(() => t.remove(), 1600);
};

// ---------- タイトル ----------
ROUTES.title = () => {
  const name = S.nick ? `${S.nick}さん、` : '';
  const hold = longPress(() => go('parent'));
  return h('div', { class: 'screen title' },
    h('header', { class: 'hero' },
      pic('art/ui/hero.jpg', '', 'hero-img', ''),
      h('div', { class: 'hero-top' }, bgmBtn(), starChip())),
    h('h1', { class: 'logo' },
      h('span', { class: 'logo-sub' }, 'きもちと ばめんの れんしゅう'),
      h('span', { class: 'logo-main' }, 'あんしん', h('span', { class: 'logo-gap' }), 'ポケット')),
    h('div', { class: 'hello' }, dogImg('happy', 'dog greet'),
      h('p', { class: 'bubble' }, `${name}こんにちは！ ${DOGS[S.dog].name}だよ。`, h('br'), 'きょうは なにを する？')),
    h('nav', { class: 'menu4' },
      menuBtn('きもちを よもう', 'なかまの かおを みてみよう', 'tile_emotions', 'emotions', 'c1'),
      menuBtn('れんしゅう しよう', 'びょういんや はいしゃ', 'tile_practice', 'scenes', 'c2'),
      menuBtn('じぶん ノート', 'すきな ことを かこう', 'tile_note', 'note', 'c3'),
      menuBtn('きょうの よてい', 'えで ならべよう', 'tile_plan', 'plan', 'c4')),
    h('div', { class: 'sub2' },
      h('button', { class: 'wide-card', onclick: () => go('shop') }, pic('art/ui/tile_shop.jpg', '', 'wide-img'), h('span', {}, h('b', {}, 'ショップ'), h('small', {}, 'スターで かえるよ'))),
      h('button', { class: 'wide-card', onclick: () => go('dogs') }, dogImg('happy', 'wide-img dogface'), h('span', {}, h('b', {}, 'なかまを えらぶ'), h('small', {}, `いまは ${DOGS[S.dog].name}`)))),
    h('button', { class: 'parent-btn', ...hold }, ic('gear'), 'おうちの ひと・スタッフ', h('small', {}, '（ながおし）')));
};
function menuBtn(label, sub, tile, route, cls) {
  return h('button', { class: `menu-btn ${cls}`, onclick: () => go(route) },
    h('span', { class: 'mimg' }, pic(`art/ui/${tile}.jpg`, '', 'tile-img')),
    h('span', { class: 'ml' }, label), h('small', { class: 'ms' }, sub));
}
// こどもが まちがえて ひらかない ように、2びょう おしつづけたら ひらく
function longPress(fn) {
  let t = null, el = null;
  const start = (e) => {
    el = e.currentTarget; el.classList.add('holding');
    t = setTimeout(() => { el.classList.remove('holding'); t = null; fn(); }, 1500);
  };
  const stop = () => { if (t) clearTimeout(t); t = null; el && el.classList.remove('holding'); };
  return { onpointerdown: start, onpointerup: stop, onpointerleave: stop, onpointercancel: stop, oncontextmenu: (e) => e.preventDefault() };
}

// ---------- なかまを えらぶ ----------
ROUTES.dogs = () => h('div', { class: 'screen' }, bar('なかまを えらぶ'),
  h('p', { class: 'lead' }, 'いっしょに れんしゅう する なかまを えらんでね。'),
  h('div', { class: 'grid2' }, DOGS.map((d, i) => h('button', {
    class: 'card pick' + (S.dog === i ? ' on' : ''), 'aria-pressed': S.dog === i ? 'true' : 'false',
    onclick: () => { S.dog = i; save(); chime('soft'); speak(`${d.name}だよ。よろしくね`); go('dogs', null, true); },
  }, pic(`art/dogs/${d.id}_happy.png`, '🐶', 'dog mid', d.name), h('b', {}, d.name), h('small', {}, d.kind)))));

// ---------- きもちを よもう ----------
ROUTES.emotions = () => h('div', { class: 'screen' }, bar('きもちを よもう'),
  h('div', { class: 'hello small' }, dogImg('calm', 'dog mid'),
    h('p', { class: 'bubble' }, 'からだを よく みると、きもちの ヒントが あるよ。')),
  h('div', { class: 'grid2' },
    h('button', { class: 'card big-choice', onclick: () => go('emoList') }, pic('art/ui/tile_emotions.jpg', '', 'tile-img'), h('b', {}, 'きもちを みる'), h('small', {}, '6つの きもち')),
    h('button', { class: 'card big-choice', onclick: () => go('quiz') }, dogImg('surprised', 'dog mid'), h('b', {}, 'あてっこ'), h('small', {}, 'どの きもちかな？'))));

ROUTES.emoList = () => h('div', { class: 'screen' }, bar('きもちを みる'),
  h('div', { class: 'grid2 emo-grid' }, EMOTIONS.map((e, i) => h('button', {
    class: 'card emo', style: `--c:${e.color}`, onclick: () => go('emoDetail', i),
  }, dogImg(e.id, 'dog mid'), h('b', {}, e.word), S.emoSeen.includes(i) ? h('span', { class: 'seen', 'aria-label': 'みた' }, ic('check')) : null))));

ROUTES.emoDetail = (i) => {
  const e = EMOTIONS[i];
  if (!S.emoSeen.includes(i)) { S.emoSeen.push(i); S.emoSeen.sort((a, b) => a - b); setTimeout(() => { award(1); plusToast(1); }, 400); }
  setTimeout(() => speak(`${e.word}。${seeOf(e)}`), 300);
  return h('div', { class: 'screen' }, bar(e.word),
    h('div', { class: 'emo-hero', style: `--c:${e.color}` }, dogImg(e.id, 'dog big'), h('h2', { class: 'emo-word' }, e.word)),
    h('section', { class: 'panel' }, h('h3', {}, ic('eye'), 'ここを みてね'), h('p', {}, seeOf(e)), sayBtn(`${e.word}。${seeOf(e)}`)),
    h('section', { class: 'panel soft' }, h('h3', {}, ic('bulb'), 'こんな ときは'), h('p', {}, e.tip), sayBtn(e.tip)),
    h('div', { class: 'row between pager' },
      h('button', { class: 'btn', disabled: i === 0, onclick: () => go('emoDetail', i - 1, true) }, '← まえ'),
      h('span', { class: 'count' }, `${i + 1} / ${EMOTIONS.length}`),
      h('button', { class: 'btn primary', onclick: () => (i < EMOTIONS.length - 1 ? go('emoDetail', i + 1, true) : history.back()) }, i < EMOTIONS.length - 1 ? 'つぎ →' : 'おわり')));
};

ROUTES.quiz = () => {
  const order = shuffle(EMOTIONS.map((_, i) => i));
  let k = 0, got = 0;
  const box = h('div', { class: 'quiz' });
  const next = () => {
    if (k >= order.length) {
      box.replaceChildren(
        h('div', { class: 'hello' }, dogImg('happy', 'dog large'), h('p', { class: 'bubble' }, 'ぜんぶ できたね！', h('br'), 'スターを ', starNum(got), ' こ もらったよ。')),
        h('div', { class: 'row center' },
          h('button', { class: 'btn', onclick: () => history.back() }, 'おわる'),
          h('button', { class: 'btn primary', onclick: () => go('quiz', null, true) }, 'もう いちど')));
      speak('ぜんぶ できたね');
      return;
    }
    const ans = order[k];
    const opts = shuffle([ans, ...shuffle(EMOTIONS.map((_, i) => i).filter((i) => i !== ans)).slice(0, 2)]);
    let tries = 0;
    const hint = h('p', { class: 'hint', hidden: true });
    const nextBtn = h('button', { class: 'btn primary next-q', hidden: true, onclick: () => { k++; next(); } },
      k < order.length - 1 ? 'つぎの もんだい' : 'けっかを みる', ic('next'));
    const btns = opts.map((o) => h('button', {
      class: 'btn answer', style: `--c:${EMOTIONS[o].color}`,
      onclick: (ev) => {
        if (o === ans) {
          chime('ok');
          const stars = tries === 0 ? 1 : 0;
          got += stars;
          btns.forEach((b) => (b.disabled = true));
          ev.currentTarget.classList.add('right');
          hint.hidden = false; hint.className = 'hint good';
          hint.textContent = `せいかい！ ${EMOTIONS[ans].word} だね。${seeOf(EMOTIONS[ans])}`;
          speak(`せいかい。${EMOTIONS[ans].word} だね`);
          if (stars) setTimeout(() => { award(stars); plusToast(stars); }, 300);
          nextBtn.hidden = false;
        } else {
          tries++;
          ev.currentTarget.disabled = true; ev.currentTarget.classList.add('dim');
          hint.hidden = false; hint.className = 'hint';
          hint.textContent = `もう いちど みて みよう。${seeOf(EMOTIONS[ans]).split('。')[0]}。`;
          speak(hint.textContent);
        }
      },
    }, EMOTIONS[o].word));
    box.replaceChildren(
      h('p', { class: 'count' }, `${k + 1} / ${order.length}`),
      h('div', { class: 'emo-hero plain' }, dogImg(EMOTIONS[ans].id, 'dog big')),
      h('p', { class: 'q' }, `${DOGS[S.dog].name}は どんな きもち かな？`),
      h('div', { class: 'answers' }, btns), hint, nextBtn);
  };
  next();
  return h('div', { class: 'screen' }, bar('あてっこ'), box);
};

// ---------- れんしゅう しよう ----------
ROUTES.scenes = () => h('div', { class: 'screen' }, bar('れんしゅう しよう'),
  h('p', { class: 'lead' }, 'どの れんしゅうを する？'),
  h('div', { class: 'grid2' }, SCENES.map((sc, i) => h('button', { class: 'card scene', onclick: () => go('scene', { i, k: 0 }) },
    pic(`art/scenes/${sc.id}_1.jpg`, '🖼️', 'thumb'), h('b', {}, sc.title), h('small', {}, sc.sub),
    S.scenesDone.includes(i) ? h('span', { class: 'seen', 'aria-label': 'できた' }, ic('check')) : null))));

ROUTES.scene = ({ i, k }) => {
  const sc = SCENES[i];
  if (k >= sc.steps.length) return sceneFeel(i);
  const st = sc.steps[k];
  setTimeout(() => speak(st.text), 300);
  return h('div', { class: 'screen' }, bar(sc.title),
    h('div', { class: 'dots', 'aria-label': `${k + 1} / ${sc.steps.length}` }, sc.steps.map((_, j) => h('span', { class: j === k ? 'on' : j < k ? 'done' : '' }))),
    h('figure', { class: 'scene-pic' }, pic(`art/scenes/${sc.id}_${k + 1}.jpg`, '🖼️', 'photo', st.text)),
    h('div', { class: 'step-text' }, h('p', {}, st.text), sayBtn(st.text)),
    h('div', { class: 'tip' }, dogImg('calm', 'dog tiny'), h('p', {}, st.tip), sayBtn(st.tip)),
    h('div', { class: 'row between pager' },
      h('button', { class: 'btn', disabled: k === 0, onclick: () => go('scene', { i, k: k - 1 }, true) }, '← まえ'),
      h('span', { class: 'count' }, `${k + 1} / ${sc.steps.length}`),
      h('button', { class: 'btn primary', onclick: () => go('scene', { i, k: k + 1 }, true) }, k === sc.steps.length - 1 ? 'おわり →' : 'つぎ →')));
};
function sceneFeel(i) {
  setTimeout(() => speak('できたね。いま どんな きもち？'), 300);
  const reply = h('div', { class: 'reply', hidden: true });
  let given = false;
  return h('div', { class: 'screen' }, bar(SCENES[i].title),
    h('div', { class: 'hello' }, dogImg('happy', 'dog large'), h('p', { class: 'bubble' }, 'さいごまで みたね！', h('br'), 'いま どんな きもち？')),
    h('div', { class: 'grid3' }, EMOTIONS.map((e) => h('button', {
      class: 'card emo small', style: `--c:${e.color}`,
      onclick: () => {
        // どの きもちを えらんでも ただしい。こたえて くれた ことを ほめる
        const msg = { happy: 'うれしいね！ ほんとうに いく ときも、こまったら おとなに いって いいよ。', calm: 'おちついて いるね。ほんとうに いく ときも、こまったら おとなに いって いいよ。' }[e.id]
          || `${e.word} きもちを おしえて くれて ありがとう。${e.tip}`;
        reply.hidden = false;
        reply.replaceChildren(h('p', {}, msg), h('button', { class: 'btn primary', onclick: () => history.back() }, 'おわる'));
        speak(msg);
        if (!given) {
          given = true;
          if (!S.scenesDone.includes(i)) { S.scenesDone.push(i); S.scenesDone.sort((a, b) => a - b); }
          award(3); plusToast(3);
        }
      },
    }, dogImg(e.id, 'dog small'), h('b', {}, e.word)))),
    reply);
}

// ---------- じぶん ノート ----------
function themeStyle() {
  const t = THEMES[S.theme];
  const edge = t.edge === 'rainbow' ? 'linear-gradient(90deg,#f6a5a5,#f8d38a,#bfe3a0,#a6d4f2,#c9b5ec)' : t.edge;
  return `--paper:${t.bg};--edge:${edge}`;
}
ROUTES.note = () => {
  const empty = S.avatar < 0 && !S.nick && !S.foods.length;
  const slot = (n) => {
    const v = S.slots[n];
    return h('button', { class: 'slot s' + n + (v < 0 ? ' empty' : ''), 'aria-label': v < 0 ? 'シールを はる' : STICKERS[v].word, onclick: () => pickSticker(n) },
      v < 0 ? ic('plus') : itemImg(STICKERS[v], 'icon'));
  };
  const line = (label, items) => h('div', { class: 'nline' }, h('h3', {}, label),
    items.length ? h('div', { class: 'chips' }, items) : h('p', { class: 'muted' }, 'まだ かいて いないよ'));
  const chipOf = (it) => h('span', { class: 'ichip' }, itemImg(it, 'icon s'), it.word);
  return h('div', { class: 'screen' }, bar('じぶん ノート'),
    h('article', { class: 'note', style: themeStyle() },
      Array.from({ length: SLOTS }, (_, n) => slot(n)),
      h('div', { class: 'me' },
        h('div', { class: 'frame f-' + FRAMES[S.frame].kind }, avatarImg(S.avatar, 'avatar')),
        h('div', {}, h('small', {}, 'なまえ'), h('p', { class: 'nick' }, S.nick || '？？？'))),
      line('すきな たべもの', S.foods.map((i) => chipOf(FOODS[i]))),
      line('すきな あそび', S.plays.map((i) => chipOf(PLAYS[i]))),
      h('div', { class: 'nline' }, h('h3', {}, 'すきな いろ'),
        S.color < 0 ? h('p', { class: 'muted' }, 'まだ かいて いないよ')
          : h('span', { class: 'ichip' }, h('span', { class: 'swatch', style: `background:${COLORS[S.color].hex}` }), COLORS[S.color].word)),
      line('にがてな こと', S.hard.map((i) => chipOf(CARD_HARD[i]))),
      line('おちつく ほうほう', S.calm.map((i) => chipOf(CARD_CALM[i])))),
    h('div', { class: 'row center' },
      h('button', { class: 'btn primary', onclick: () => go('noteEdit', 0) }, ic('pencil'), empty ? 'ノートを かく' : 'かきなおす'),
      h('button', { class: 'btn', onclick: () => go('noteShow') }, ic('eye'), 'みせる')));
};
// ひとに みせる ための、ボタンの ない ノート
ROUTES.noteShow = () => {
  const n = ROUTES.note();
  n.querySelectorAll('.slot.empty, .row.center').forEach((e) => e.remove());
  n.querySelectorAll('.slot').forEach((e) => (e.disabled = true));
  n.classList.add('showing');
  return n;
};
function pickSticker(n) {
  const owned = S.stickers;
  modal(h('h2', {}, 'シールを えらぶ'),
    owned.length ? h('div', { class: 'grid4' }, owned.map((i) => h('button', {
      class: 'card tiny', onclick: () => { S.slots[n] = i; save(); closeModal(); go('note', null, true); },
    }, itemImg(STICKERS[i], 'icon'), h('small', {}, STICKERS[i].word))))
      : h('p', {}, 'シールは ショップで かえるよ。'),
    h('div', { class: 'row center' },
      S.slots[n] >= 0 ? h('button', { class: 'btn', onclick: () => { S.slots[n] = -1; save(); closeModal(); go('note', null, true); } }, 'はがす') : null,
      !owned.length ? h('button', { class: 'btn primary', onclick: () => { closeModal(); go('shop'); } }, 'ショップへ') : null,
      h('button', { class: 'btn', onclick: closeModal }, 'とじる')));
}

// ノートを かく: 1がめん 1しつもん
const EDIT_STEPS = [
  { key: 'avatar', q: 'じぶんの えを えらんでね。すきな えで いいよ。' },
  { key: 'nick', q: 'なまえを かいてね。（ひらがな・カタカナ 6もじ まで）' },
  { key: 'foods', q: 'すきな たべものを えらんでね。（3つ まで）', list: FOODS, max: 3 },
  { key: 'plays', q: 'すきな あそびを えらんでね。（3つ まで）', list: PLAYS, max: 3 },
  { key: 'color', q: 'すきな いろを えらんでね。' },
  { key: 'hard', q: 'にがてな ことを えらんでね。（いくつ でも）', list: CARD_HARD, max: 8 },
  { key: 'calm', q: 'おちつく ほうほうを えらんでね。（いくつ でも）', list: CARD_CALM, max: 8 },
];
ROUTES.noteEdit = (k) => {
  const st = EDIT_STEPS[k];
  const last = k === EDIT_STEPS.length - 1;
  const done = () => {
    save();
    if (last) {
      const first = !localStorage.getItem('anshin-pocket-note-done');
      try { localStorage.setItem('anshin-pocket-note-done', '1'); } catch { /* なし */ }
      history.go(-1);
      if (first) setTimeout(() => { award(5); plusToast(5); }, 300);
    } else go('noteEdit', k + 1, true);
  };
  let body;
  if (st.key === 'avatar') {
    body = h('div', { class: 'grid4' }, Array.from({ length: AVATAR_COUNT }, (_, i) => h('button', {
      class: 'card tiny' + (S.avatar === i ? ' on' : ''), 'aria-pressed': S.avatar === i ? 'true' : 'false',
      onclick: (e) => { S.avatar = i; body.querySelectorAll('.on').forEach((b) => { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); }); e.currentTarget.classList.add('on'); e.currentTarget.setAttribute('aria-pressed', 'true'); },
    }, avatarImg(i, 'avatar'))));
  } else if (st.key === 'nick') {
    const inp = h('input', { class: 'nick-in', value: S.nick, maxlength: String(NICK_MAX * 2), autocomplete: 'off', 'aria-label': 'なまえ', placeholder: 'れい: はるか' });
    const note = h('p', { class: 'muted' }, '');
    inp.addEventListener('input', () => {
      const c = cleanNick(inp.value);
      note.textContent = c !== inp.value.trim() && inp.value ? `「${c || '（なし）'}」に なるよ` : '';
    });
    inp.addEventListener('change', () => { S.nick = cleanNick(inp.value); });
    body = h('div', { class: 'nick-box' }, inp, note);
    body.commit = () => { S.nick = cleanNick(inp.value); };
  } else if (st.key === 'color') {
    body = h('div', { class: 'grid4' }, COLORS.map((c, i) => h('button', {
      class: 'card tiny' + (S.color === i ? ' on' : ''), 'aria-pressed': S.color === i ? 'true' : 'false',
      onclick: (e) => { S.color = i; body.querySelectorAll('.on').forEach((b) => b.classList.remove('on')); e.currentTarget.classList.add('on'); },
    }, h('span', { class: 'swatch big', style: `background:${c.hex}` }), h('small', {}, c.word))));
  } else {
    const sel = S[st.key];
    const msg = h('p', { class: 'muted center' }, '');
    body = h('div', {}, h('div', { class: 'grid4' }, st.list.map((it, i) => h('button', {
      class: 'card tiny' + (sel.includes(i) ? ' on' : ''), 'aria-pressed': sel.includes(i) ? 'true' : 'false',
      onclick: (e) => {
        const at = sel.indexOf(i);
        if (at >= 0) sel.splice(at, 1);
        else if (sel.length < st.max) sel.push(i);
        else { msg.textContent = `${st.max}つ まで だよ。どれかを はずしてね。`; return; }
        msg.textContent = '';
        e.currentTarget.classList.toggle('on', sel.includes(i));
        e.currentTarget.setAttribute('aria-pressed', sel.includes(i) ? 'true' : 'false');
      },
    }, itemImg(it, 'icon'), h('small', {}, it.word)))), msg);
  }
  setTimeout(() => speak(st.q), 300);
  return h('div', { class: 'screen' }, bar(`ノートを かく ${k + 1}/${EDIT_STEPS.length}`, () => { body.commit && body.commit(); save(); history.go(-1); }),
    h('p', { class: 'lead' }, st.q), body,
    h('div', { class: 'row between pager' },
      h('button', { class: 'btn', disabled: k === 0, onclick: () => { body.commit && body.commit(); save(); go('noteEdit', k - 1, true); } }, '← まえ'),
      h('button', { class: 'btn primary', onclick: () => { body.commit && body.commit(); done(); } }, last ? 'できた！' : 'つぎ →')));
};

// ---------- きょうの よてい ----------
const PLAN_KEY = 'anshin-pocket-plan';
const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
function loadPlan() {
  try {
    const p = JSON.parse(localStorage.getItem(PLAN_KEY));
    if (p && Array.isArray(p.items)) {
      p.items = p.items.filter((x) => PLAN_ITEMS.some((it) => it.id === x.id));
      if (p.date === today()) return p;
      return { date: today(), items: [], stars: 0, prev: p.items.map((x) => x.id) };
    }
  } catch { /* なし */ }
  return { date: today(), items: [], stars: 0, prev: [] };
}
const savePlan = (p) => { try { localStorage.setItem(PLAN_KEY, JSON.stringify(p)); } catch { /* なし */ } };
ROUTES.plan = () => {
  const p = loadPlan();
  const nowIdx = p.items.findIndex((x) => !x.done);
  const redraw = () => { savePlan(p); go('plan', null, true); };
  const list = h('ol', { class: 'plan' }, p.items.map((x, n) => {
    const it = PLAN_ITEMS.find((t) => t.id === x.id);
    return h('li', { class: (x.done ? 'done' : '') + (n === nowIdx ? ' now' : '') },
      n === nowIdx ? h('span', { class: 'now-tag' }, 'いま') : null,
      itemImg(it, 'icon'), h('b', {}, it.word),
      h('span', { class: 'tools' },
        h('button', { class: 'mini-btn', 'aria-label': 'うえへ', disabled: n === 0, onclick: () => { [p.items[n - 1], p.items[n]] = [p.items[n], p.items[n - 1]]; redraw(); } }, '▲'),
        h('button', { class: 'mini-btn', 'aria-label': 'したへ', disabled: n === p.items.length - 1, onclick: () => { [p.items[n + 1], p.items[n]] = [p.items[n], p.items[n + 1]]; redraw(); } }, '▼'),
        h('button', { class: 'mini-btn', 'aria-label': 'けす', onclick: () => { p.items.splice(n, 1); redraw(); } }, '✕')),
      h('button', {
        class: 'check' + (x.done ? ' on' : ''), 'aria-pressed': x.done ? 'true' : 'false',
        onclick: () => {
          x.done = !x.done;
          if (x.done) {
            chime('ok');
            if (!x.starred && p.stars < 10) { x.starred = true; p.stars++; savePlan(p); award(1, redraw); plusToast(1); return; }
          }
          redraw();
        },
      }, x.done ? [ic('check'), 'できた'] : 'できた？'));
  }));
  return h('div', { class: 'screen' }, bar('きょうの よてい'),
    p.items.length ? list : h('div', { class: 'hello small' }, dogImg('calm', 'dog mid'),
      h('p', { class: 'bubble' }, 'きょうの よていを ならべよう。', h('br'), 'したの えを おしてね。')),
    !p.items.length && p.prev && p.prev.length ? h('div', { class: 'row center' },
      h('button', { class: 'btn', onclick: () => { p.items = p.prev.map((id) => ({ id })); p.prev = []; redraw(); } }, ic('refresh'), 'きのうと おなじ')) : null,
    p.items.length && p.items.every((x) => x.done) ? h('p', { class: 'hint good center' }, 'ぜんぶ できたね！ すごい！') : null,
    h('h2', { class: 'sub-h' }, 'よていを ふやす'),
    h('div', { class: 'grid4 palette' }, PLAN_ITEMS.map((it) => h('button', {
      class: 'card tiny', onclick: () => { if (p.items.length < 12) { p.items.push({ id: it.id }); redraw(); } },
    }, itemImg(it, 'icon'), h('small', {}, it.word)))),
    p.items.length >= 12 ? h('p', { class: 'muted center' }, 'よていは 12こ まで だよ。') : null);
};

// ---------- ショップ ----------
const SHOP_TABS = [
  { key: 'stickers', label: 'シール', list: STICKERS },
  { key: 'themes', label: 'ノートの いろ', list: THEMES },
  { key: 'frames', label: 'わく', list: FRAMES },
];
ROUTES.shop = (tab = 0) => {
  const T = SHOP_TABS[tab];
  const lv = level(S.exp);
  const nextNeed = lv < LEVEL_MAX ? levelNeed(lv + 1) - S.exp : 0;
  const look = (it) => (T.key === 'stickers' ? itemImg(it, 'icon')
    : T.key === 'themes' ? h('span', { class: 'swatch big theme', style: `background:${it.bg};border-color:${it.edge === 'rainbow' ? '#e7a' : it.edge}` })
      : h('span', { class: 'frame f-' + it.kind + ' demo' }, avatarImg(S.avatar, 'avatar')));
  const cards = T.list.map((it, i) => {
    const own = S[T.key].includes(i);
    const using = (T.key === 'themes' && S.theme === i) || (T.key === 'frames' && S.frame === i);
    const locked = !own && it.lv > lv;
    let action;
    if (own && T.key === 'stickers') action = h('span', { class: 'tag ok' }, 'もってる');
    else if (own) action = using ? h('span', { class: 'tag ok' }, 'つかってる')
      : h('button', { class: 'btn small', onclick: () => { S[T.key === 'themes' ? 'theme' : 'frame'] = i; save(); go('shop', tab, true); } }, 'つかう');
    else if (locked) action = h('span', { class: 'tag' }, ic('lock'), `レベル ${it.lv}`);
    else action = h('button', { class: 'btn small primary', disabled: wallet(S) < it.price, onclick: () => buy(T, i, tab) }, starNum(it.price));
    return h('div', { class: 'card shop-item' + (locked ? ' locked' : '') }, look(it), h('b', {}, it.word), action);
  });
  return h('div', { class: 'screen' }, bar('ショップ'),
    h('p', { class: 'lead small' }, lv < LEVEL_MAX ? ['つぎの レベルまで あと ', starNum(nextNeed)] : 'さいこう レベル！'),
    h('div', { class: 'tabs', role: 'tablist' }, SHOP_TABS.map((t, j) => h('button', {
      role: 'tab', 'aria-selected': j === tab ? 'true' : 'false', class: j === tab ? 'on' : '', onclick: () => go('shop', j, true),
    }, t.label))),
    h('div', { class: 'grid3' }, cards),
    h('p', { class: 'muted center' }, 'スターは、れんしゅう すると もらえるよ。'));
};
function buy(T, i, tab) {
  const it = T.list[i];
  modal(h('h2', {}, `${it.word} を かう？`), h('p', { class: 'center' }, starNum(it.price), ' つかうよ。（いま ', starNum(wallet(S)), '）'),
    h('div', { class: 'row center' },
      h('button', { class: 'btn', onclick: closeModal }, 'やめる'),
      h('button', { class: 'btn primary', onclick: () => {
        if (wallet(S) < it.price || S[T.key].includes(i)) return closeModal();
        S[T.key].push(i); S[T.key].sort((a, b) => a - b);
        if (T.key === 'themes') S.theme = i;
        if (T.key === 'frames') S.frame = i;
        save(); chime('ok'); closeModal(); go('shop', tab, true);
      } }, 'かう')));
}

// ---------- おうちの ひと・スタッフ ----------
function voicePicker() {
  const vs = jaVoices();
  if (!vs.length) return h('p', { class: 'muted' }, 'この端末には日本語の読み上げの声がありません。');
  const cur = pickVoice();
  const sel = h('select', { class: 'voice-sel', 'aria-label': '読み上げの声', onchange: (e) => { SET.voiceName = e.target.value; saveSet(); speak('こんにちは。いっしょに れんしゅう しようね。', true); } },
    vs.slice().sort((x, y) => voiceScore(y) - voiceScore(x)).map((v) => h('option', { value: v.name, selected: cur && v.name === cur.name ? true : false }, v.name)));
  return h('div', { class: 'voice-box' },
    h('label', {}, '声', sel),
    h('button', { class: 'btn small', onclick: () => speak('こんにちは。いっしょに れんしゅう しようね。', true) }, ic('speaker'), 'きいてみる'),
    h('p', { class: 'muted' }, 'iPhone・iPad は「設定 → アクセシビリティ → 読み上げコンテンツ → 声 → 日本語」で「Kyoko（拡張）」などを入れると、より自然な声になります。'));
}

ROUTES.parent = () => {
  const toggle = (key, label) => h('label', { class: 'switch' },
    h('input', { type: 'checkbox', checked: SET[key], onchange: (e) => { SET[key] = e.target.checked; saveSet(); if (key === 'bgm') bgmApply(); document.body.classList.toggle('calm', SET.calm); document.body.classList.toggle('big', SET.big); } }),
    h('span', {}, label));
  const code = toCode(S);
  const copyMsg = h('span', { class: 'muted', role: 'status' }, '');
  const inp = h('textarea', { class: 'code-in', rows: '3', 'aria-label': 'あいことば', placeholder: 'あいことばを いれてください（40もじ）' });
  const loadMsg = h('p', { class: 'muted', role: 'status' }, '');
  return h('div', { class: 'screen adult' }, bar('おうちの方・スタッフ'),
    h('section', { class: 'panel' }, h('h2', {}, '設定'),
      toggle('voice', '文の読み上げ（端末の音声）'),
      voicePicker(),
      toggle('sound', '効果音（小さな音）'),
      toggle('bgm', 'BGM（小さな音楽）'),
      toggle('calm', '動きを少なくする'),
      toggle('big', '文字を大きくする')),
    h('section', { class: 'panel' }, h('h2', {}, 'あいことば（別の端末で続きから）'),
      h('p', {}, 'この端末の進み具合（レベル・スター・ノート・ショップの品）を、40文字のひらがなにしたものです。別の端末で入力すると、続きから始められます。'),
      h('p', { class: 'code', 'data-testid': 'code' }, prettyCode(code)),
      h('div', { class: 'row' },
        h('button', { class: 'btn small', onclick: async () => {
          try { await navigator.clipboard.writeText(code); copyMsg.textContent = 'コピーしました'; } catch { copyMsg.textContent = 'コピーできませんでした。書き写してください。'; }
        } }, 'コピー'), copyMsg),
      h('h3', {}, '別の端末のあいことばを入れる'),
      inp,
      h('button', { class: 'btn small primary', onclick: () => {
        const s = fromCode(inp.value);
        if (!s) { loadMsg.textContent = 'あいことばが正しくありません。1文字ずつ確かめてください（区切りの空白はあってもなくても大丈夫です）。'; return; }
        modal(h('h2', {}, '続きから始めますか？'),
          h('p', { class: 'adult' }, `レベル ${level(s.exp)}・スター ${wallet(s)}${s.nick ? `・なまえ「${s.nick}」` : ''} のセーブです。この端末の今の進み具合は上書きされます。`),
          h('div', { class: 'row center' },
            h('button', { class: 'btn', onclick: closeModal }, 'やめる'),
            h('button', { class: 'btn primary', onclick: () => { S = s; save(); closeModal(); go('title', null, true); } }, '続きから始める')));
      } }, '読み込む'), loadMsg),
    h('section', { class: 'panel' }, h('h2', {}, 'このアプリについて'),
      h('p', {}, '気持ちの読み取りや、病院・散髪などの場面を前もって知るための練習用アプリです。診断や治療を目的としたものではありません。'),
      h('p', {}, '入力した内容と進み具合は、この端末の中だけに保存されます。インターネットには送信しません。'),
      h('p', { class: 'muted' }, '訪問看護ステーションはるうた')),
    h('section', { class: 'panel' }, h('h2', {}, 'はじめから'),
      h('p', {}, 'この端末のセーブを消して、最初から始めます。あいことばを控えておくと元に戻せます。'),
      h('button', { class: 'btn small danger', onclick: () => modal(h('h2', {}, '本当に消しますか？'),
        h('p', { class: 'adult' }, 'レベル・スター・ノート・ショップの品がすべて消えます。'),
        h('div', { class: 'row center' },
          h('button', { class: 'btn', onclick: closeModal }, 'やめる'),
          h('button', { class: 'btn danger', onclick: () => {
            S = fresh(); save();
            try { localStorage.removeItem(PLAN_KEY); localStorage.removeItem('anshin-pocket-note-done'); } catch { /* なし */ }
            closeModal(); go('title', null, true);
          } }, '消す'))) }, 'セーブを消す')));
};

// ---------- はじまり ----------
history.replaceState({ name: 'title' }, '');
draw('title');
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
window.__app = { get S() { return S; }, set S(v) { S = normalize(v); save(); }, go, award };
