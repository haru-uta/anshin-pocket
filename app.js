import { DOGS, EMOTIONS, SCENES, CARD_HARD, CARD_CALM, PLAN_ITEMS, FOODS, PLAYS, COLORS, AVATAR_COUNT,
  STICKERS, THEMES, FRAMES, LEVEL_MAX, levelNeed } from './data.js';
import { load, store, fresh, normalize, level, wallet, toCode, fromCode, prettyCode, cleanNick, NICK_MAX, SLOTS } from './save.js';

let S = load();
const SET_KEY = 'anshin-pocket-settings';
const SET = (() => {
  const d = { voice: true, sound: true, calm: false, big: false };
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
const dogImg = (emo, cls = 'dog') => pic(`art/dogs/${DOGS[S.dog].id}_${emo}.png`, '🐶', cls, `${DOGS[S.dog].name}（${EMOTIONS.find((e) => e.id === emo)?.word || ''}）`);
const itemImg = (it, cls = 'icon') => pic(`art/items/${it.id}.png`, it.emoji, cls, '');
const avatarImg = (i, cls = 'avatar') => (i < 0 ? h('span', { class: cls + ' emoji' }, '🙂') : pic(`art/avatars/a${i}.png`, '🙂', cls, 'じぶん'));
const save = () => store(S);
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

// よみあげ（端末の 声。ネットは つかわない）
function speak(text) {
  if (!SET.voice || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/ /g, ''));
    u.lang = 'ja-JP'; u.rate = 0.9; u.pitch = 1.05;
    const v = speechSynthesis.getVoices().find((x) => x.lang && x.lang.startsWith('ja'));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch { /* 声が でない 端末も ある */ }
}
const sayBtn = (text) => h('button', { class: 'say', 'aria-label': 'よみあげる', onclick: () => speak(text) }, '🔊');

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
    h('button', { class: 'back', onclick: back }, h('span', { 'aria-hidden': 'true' }, '←'), ' もどる'),
    h('h1', {}, title),
    starChip());
}
function starChip() {
  return h('div', { class: 'chip', 'aria-label': `レベル ${level(S.exp)}、スター ${wallet(S)}` },
    h('span', { class: 'lv' }, `Lv ${level(S.exp)}`), h('span', { class: 'st' }, `⭐ ${wallet(S)}`));
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
      got.length ? h('div', { class: 'row wrap center' }, got.slice(0, 6).map((it) => h('span', { class: 'mini' }, it.emoji ? itemImg(it, 'icon s') : '🎨', it.word))) : null,
      h('button', { class: 'btn primary', onclick: () => { closeModal(); after && after(); } }, 'やったね！'));
    speak(`レベル ${lv} に なったよ`);
  } else if (after) after();
}
const plusToast = (n) => {
  const t = h('div', { class: 'toast', role: 'status' }, `⭐ +${n}`);
  document.body.append(t); setTimeout(() => t.remove(), 1600);
};

// ---------- タイトル ----------
ROUTES.title = () => {
  const name = S.nick ? `${S.nick}さん、` : '';
  const hold = longPress(() => go('parent'));
  return h('div', { class: 'screen title' },
    h('div', { class: 'top-row' }, starChip()),
    h('h1', { class: 'logo' }, h('span', {}, 'あんしん'), h('span', {}, 'ポケット')),
    h('div', { class: 'hello' }, dogImg('happy', 'dog hero'),
      h('p', { class: 'bubble' }, `${name}こんにちは！`, h('br'), `${DOGS[S.dog].name}だよ。きょうは なにを する？`)),
    h('nav', { class: 'menu4' },
      menuBtn('きもちを よもう', dogImg('surprised', 'mi'), 'emotions', 'c1'),
      menuBtn('れんしゅう しよう', pic('art/scenes/hospital_1.jpg', '🏥', 'mi photo'), 'scenes', 'c2'),
      menuBtn('じぶん ノート', avatarImg(S.avatar, 'mi round'), 'note', 'c3'),
      menuBtn('きょうの よてい', itemImg(PLAN_ITEMS[0], 'mi'), 'plan', 'c4')),
    h('div', { class: 'row center sub' },
      h('button', { class: 'btn ghost', onclick: () => go('shop') }, '🛍️ ショップ'),
      h('button', { class: 'btn ghost', onclick: () => go('dogs') }, '🐶 いぬを えらぶ')),
    h('button', { class: 'parent-btn', ...hold }, '⚙ おうちの ひと・スタッフ', h('small', {}, '（ながおし）')));
};
function menuBtn(label, img, route, cls) {
  return h('button', { class: `menu-btn ${cls}`, onclick: () => go(route) }, h('span', { class: 'mimg' }, img), h('span', { class: 'ml' }, label));
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

// ---------- いぬを えらぶ ----------
ROUTES.dogs = () => h('div', { class: 'screen' }, bar('いぬを えらぶ'),
  h('p', { class: 'lead' }, 'いっしょに れんしゅう する いぬを えらんでね。'),
  h('div', { class: 'grid2' }, DOGS.map((d, i) => h('button', {
    class: 'card pick' + (S.dog === i ? ' on' : ''), 'aria-pressed': S.dog === i ? 'true' : 'false',
    onclick: () => { S.dog = i; save(); chime('soft'); speak(`${d.name}だよ。よろしくね`); go('dogs', null, true); },
  }, pic(`art/dogs/${d.id}_happy.png`, '🐶', 'dog mid', d.name), h('b', {}, d.name), h('small', {}, d.kind)))));

// ---------- きもちを よもう ----------
ROUTES.emotions = () => h('div', { class: 'screen' }, bar('きもちを よもう'),
  h('div', { class: 'hello small' }, dogImg('calm', 'dog mid'),
    h('p', { class: 'bubble' }, 'いぬの からだを よく みると、きもちの ヒントが あるよ。')),
  h('div', { class: 'grid2' },
    h('button', { class: 'card big-choice', onclick: () => go('emoList') }, h('span', { class: 'emoji xl' }, '📖'), h('b', {}, 'きもちを みる'), h('small', {}, '6つの きもち')),
    h('button', { class: 'card big-choice', onclick: () => go('quiz') }, h('span', { class: 'emoji xl' }, '❓'), h('b', {}, 'あてっこ'), h('small', {}, 'どの きもちかな？'))));

ROUTES.emoList = () => h('div', { class: 'screen' }, bar('きもちを みる'),
  h('div', { class: 'grid2 emo-grid' }, EMOTIONS.map((e, i) => h('button', {
    class: 'card emo', style: `--c:${e.color}`, onclick: () => go('emoDetail', i),
  }, dogImg(e.id, 'dog mid'), h('b', {}, e.word), S.emoSeen.includes(i) ? h('span', { class: 'seen', 'aria-label': 'みた' }, '✔') : null))));

ROUTES.emoDetail = (i) => {
  const e = EMOTIONS[i];
  if (!S.emoSeen.includes(i)) { S.emoSeen.push(i); S.emoSeen.sort((a, b) => a - b); setTimeout(() => { award(1); plusToast(1); }, 400); }
  setTimeout(() => speak(`${e.word}。${e.see}`), 300);
  return h('div', { class: 'screen' }, bar(e.word),
    h('div', { class: 'emo-hero', style: `--c:${e.color}` }, dogImg(e.id, 'dog big'), h('h2', { class: 'emo-word' }, e.word)),
    h('section', { class: 'panel' }, h('h3', {}, '👀 ここを みてね'), h('p', {}, e.see), sayBtn(`${e.word}。${e.see}`)),
    h('section', { class: 'panel soft' }, h('h3', {}, '💡 こんな ときは'), h('p', {}, e.tip), sayBtn(e.tip)),
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
        h('div', { class: 'hello' }, dogImg('happy', 'dog hero'), h('p', { class: 'bubble' }, 'ぜんぶ できたね！', h('br'), `⭐ ${got}こ もらったよ。`)),
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
          hint.textContent = `せいかい！ ${EMOTIONS[ans].word} だね。${EMOTIONS[ans].see}`;
          speak(`せいかい。${EMOTIONS[ans].word} だね`);
          const goNext = () => { k++; next(); };
          setTimeout(() => (stars ? award(stars, goNext) : goNext()), SET.calm ? 2600 : 2200);
        } else {
          tries++;
          ev.currentTarget.disabled = true; ev.currentTarget.classList.add('dim');
          hint.hidden = false; hint.className = 'hint';
          hint.textContent = `もう いちど みて みよう。${EMOTIONS[ans].see.split('。')[0]}。`;
          speak(hint.textContent);
        }
      },
    }, EMOTIONS[o].word));
    box.replaceChildren(
      h('p', { class: 'count' }, `${k + 1} / ${order.length}`),
      h('div', { class: 'emo-hero plain' }, dogImg(EMOTIONS[ans].id, 'dog big')),
      h('p', { class: 'q' }, 'この いぬは どんな きもち かな？'),
      h('div', { class: 'answers' }, btns), hint);
  };
  next();
  return h('div', { class: 'screen' }, bar('あてっこ'), box);
};

// ---------- れんしゅう しよう ----------
ROUTES.scenes = () => h('div', { class: 'screen' }, bar('れんしゅう しよう'),
  h('p', { class: 'lead' }, 'どの れんしゅうを する？'),
  h('div', { class: 'grid2' }, SCENES.map((sc, i) => h('button', { class: 'card scene', onclick: () => go('scene', { i, k: 0 }) },
    pic(`art/scenes/${sc.id}_1.jpg`, '🖼️', 'thumb'), h('b', {}, sc.title), h('small', {}, sc.sub),
    S.scenesDone.includes(i) ? h('span', { class: 'seen', 'aria-label': 'できた' }, '✔') : null))));

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
    h('div', { class: 'hello' }, dogImg('happy', 'dog hero'), h('p', { class: 'bubble' }, 'さいごまで みたね！', h('br'), 'いま どんな きもち？')),
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
      v < 0 ? '＋' : itemImg(STICKERS[v], 'icon'));
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
      h('button', { class: 'btn primary', onclick: () => go('noteEdit', 0) }, empty ? '✏️ ノートを かく' : '✏️ かきなおす'),
      h('button', { class: 'btn', onclick: () => go('noteShow') }, '👀 みせる')));
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
      }, x.done ? '✔ できた' : 'できた？'));
  }));
  return h('div', { class: 'screen' }, bar('きょうの よてい'),
    p.items.length ? list : h('div', { class: 'hello small' }, dogImg('calm', 'dog mid'),
      h('p', { class: 'bubble' }, 'きょうの よていを ならべよう。', h('br'), 'したの えを おしてね。')),
    !p.items.length && p.prev && p.prev.length ? h('div', { class: 'row center' },
      h('button', { class: 'btn', onclick: () => { p.items = p.prev.map((id) => ({ id })); p.prev = []; redraw(); } }, '🔁 きのうと おなじ')) : null,
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
    else if (locked) action = h('span', { class: 'tag' }, `🔒 レベル ${it.lv}`);
    else action = h('button', { class: 'btn small primary', disabled: wallet(S) < it.price, onclick: () => buy(T, i, tab) }, `⭐ ${it.price}`);
    return h('div', { class: 'card shop-item' + (locked ? ' locked' : '') }, look(it), h('b', {}, it.word), action);
  });
  return h('div', { class: 'screen' }, bar('ショップ'),
    h('p', { class: 'lead small' }, lv < LEVEL_MAX ? `つぎの レベルまで あと ⭐ ${nextNeed}` : 'さいこう レベル！'),
    h('div', { class: 'tabs', role: 'tablist' }, SHOP_TABS.map((t, j) => h('button', {
      role: 'tab', 'aria-selected': j === tab ? 'true' : 'false', class: j === tab ? 'on' : '', onclick: () => go('shop', j, true),
    }, t.label))),
    h('div', { class: 'grid3' }, cards),
    h('p', { class: 'muted center' }, '⭐ は れんしゅう すると もらえるよ。'));
};
function buy(T, i, tab) {
  const it = T.list[i];
  modal(h('h2', {}, `${it.word} を かう？`), h('p', { class: 'center' }, `⭐ ${it.price} つかうよ。（いま ⭐ ${wallet(S)}）`),
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
ROUTES.parent = () => {
  const toggle = (key, label) => h('label', { class: 'switch' },
    h('input', { type: 'checkbox', checked: SET[key], onchange: (e) => { SET[key] = e.target.checked; saveSet(); document.body.classList.toggle('calm', SET.calm); document.body.classList.toggle('big', SET.big); } }),
    h('span', {}, label));
  const code = toCode(S);
  const copyMsg = h('span', { class: 'muted', role: 'status' }, '');
  const inp = h('textarea', { class: 'code-in', rows: '3', 'aria-label': 'あいことば', placeholder: 'あいことばを いれてください（40もじ）' });
  const loadMsg = h('p', { class: 'muted', role: 'status' }, '');
  return h('div', { class: 'screen adult' }, bar('おうちの方・スタッフ'),
    h('section', { class: 'panel' }, h('h2', {}, '設定'),
      toggle('voice', '文の読み上げ（端末の音声）'),
      toggle('sound', '効果音（小さな音）'),
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
