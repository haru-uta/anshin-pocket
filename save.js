// セーブ（この端末の localStorage）と、べつの端末に うつす「あいことば」。
// あいことばは セーブを そのまま ひらがな 40もじに した もの。ネットには なにも おくらない。
import { DOGS, FOODS, PLAYS, COLORS, AVATAR_COUNT, STICKERS, THEMES, FRAMES, EMOTIONS, SCENES,
  LEVEL_MAX, levelNeed } from './data.js';

const KEY = 'anshin-pocket-v1';
export const NICK_MAX = 6;
export const SLOTS = 6; // ノートに はれる シールの ばしょ

export function fresh() {
  return {
    dog: 0, avatar: -1, frame: 0, theme: 0, nick: '', color: -1,
    foods: [], plays: [], hard: [], calm: [],
    exp: 0, stickers: [], themes: [0], frames: [0], slots: Array(SLOTS).fill(-1),
    emoSeen: [], scenesDone: [],
  };
}

// こわれた セーブや 古い セーブでも、かならず ただしい かたちに もどす
export function normalize(s) {
  const f = fresh();
  if (!s || typeof s !== 'object') return f;
  const int = (v, lo, hi, d) => (Number.isInteger(v) && v >= lo && v <= hi ? v : d);
  const list = (v, n, max) => [...new Set(Array.isArray(v) ? v.filter((x) => Number.isInteger(x) && x >= 0 && x < n) : [])].slice(0, max);
  const set = (v, n, max) => list(v, n, max).sort((a, b) => a - b); // じゅんばんに いみが ない もの
  const out = {
    dog: int(s.dog, 0, DOGS.length - 1, 0),
    avatar: int(s.avatar, -1, AVATAR_COUNT - 1, -1),
    frame: int(s.frame, 0, FRAMES.length - 1, 0),
    theme: int(s.theme, 0, THEMES.length - 1, 0),
    nick: cleanNick(typeof s.nick === 'string' ? s.nick : ''),
    color: int(s.color, -1, COLORS.length - 1, -1),
    foods: list(s.foods, FOODS.length, 3), plays: list(s.plays, PLAYS.length, 3),
    hard: set(s.hard, 8, 8), calm: set(s.calm, 8, 8),
    exp: int(s.exp, 0, 16383, 0),
    stickers: set(s.stickers, STICKERS.length, 99), themes: set(s.themes, THEMES.length, 99),
    frames: set(s.frames, FRAMES.length, 99),
    slots: Array.from({ length: SLOTS }, (_, i) => int(Array.isArray(s.slots) ? s.slots[i] : -1, -1, STICKERS.length - 1, -1)),
    emoSeen: set(s.emoSeen, EMOTIONS.length, 99), scenesDone: set(s.scenesDone, SCENES.length, 99),
  };
  if (!out.themes.includes(0)) out.themes.unshift(0);
  if (!out.frames.includes(0)) out.frames.unshift(0);
  if (!out.themes.includes(out.theme)) out.theme = 0;
  if (!out.frames.includes(out.frame)) out.frame = 0;
  out.slots = out.slots.map((v) => (out.stickers.includes(v) ? v : -1));
  return out;
}

export function load() {
  try { return normalize(JSON.parse(localStorage.getItem(KEY))); } catch { return fresh(); }
}
export function store(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch { return false; }
}

// ---- レベルと スター ----
export function level(exp) {
  let n = 1;
  while (n < LEVEL_MAX && exp >= levelNeed(n + 1)) n++;
  return n;
}
export function spent(s) {
  return s.stickers.reduce((a, i) => a + STICKERS[i].price, 0)
    + s.themes.reduce((a, i) => a + THEMES[i].price, 0)
    + s.frames.reduce((a, i) => a + FRAMES[i].price, 0);
}
export const wallet = (s) => Math.max(0, s.exp - spent(s));

// ---- なまえ ----
const HIRA = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽぁぃぅぇぉゃゅょっー';
const toHira = (c) => (c >= 'ァ' && c <= 'ヶ' ? String.fromCharCode(c.charCodeAt(0) - 0x60) : c);
const toKata = (c) => (c >= 'ぁ' && c <= 'ゖ' ? String.fromCharCode(c.charCodeAt(0) + 0x60) : c);
// ひらがな・カタカナ・ー だけ のこす（どちらか 1しゅるいに そろえる）
export function cleanNick(str) {
  const chars = [...str.normalize('NFC')].filter((c) => HIRA.includes(toHira(c))).slice(0, NICK_MAX);
  const kata = chars.some((c) => c >= 'ァ' && c <= 'ヶ');
  return chars.map((c) => (kata ? toKata(toHira(c)) : toHira(c))).join('');
}

// ---- あいことば ----
// まちがえにくい ひらがな 32もじ（い/り、は/ほ、ぬ/め、さ/ち の かたほうは つかわない）
export const CODE_CHARS = 'あいうえおかきくけこさしすせそたてとなにのはひふへまみむもやゆよ';
const VERSION = 1;
const CODE_LEN = 40; // 200ビット

class Bits {
  constructor() { this.b = []; }
  put(v, n) { for (let i = n - 1; i >= 0; i--) this.b.push((v >> i) & 1); }
}
const maskOf = (arr, n) => arr.reduce((m, i) => (i < n ? m | (1 << i) : m), 0);
const fromMask = (m, n) => Array.from({ length: n }, (_, i) => i).filter((i) => (m >> i) & 1);

function checksum(bits) {
  // FNV-1a（1ビットずつ）。どの 1もじの まちがいも ほぼ かならず みつかる
  let h = 0x811c9dc5;
  for (const b of bits) h = Math.imul(h ^ (b + 1), 0x01000193) >>> 0;
  return (h ^ (h >>> 9) ^ (h >>> 18)) & 0x1ff;
}

export function toCode(state) {
  const s = normalize(state);
  const w = new Bits();
  w.put(VERSION, 3); w.put(s.dog, 2); w.put(s.avatar + 1, 4); w.put(s.frame, 2); w.put(s.theme, 3);
  const nick = [...s.nick];
  w.put(nick.some((c) => c >= 'ァ' && c <= 'ヶ') ? 1 : 0, 1);
  for (let i = 0; i < NICK_MAX; i++) w.put(nick[i] ? HIRA.indexOf(toHira(nick[i])) + 1 : 0, 7);
  w.put(s.color + 1, 4);
  for (let i = 0; i < 3; i++) w.put(s.foods[i] === undefined ? 0 : s.foods[i] + 1, 5);
  for (let i = 0; i < 3; i++) w.put(s.plays[i] === undefined ? 0 : s.plays[i] + 1, 5);
  w.put(maskOf(s.hard, 8), 8); w.put(maskOf(s.calm, 8), 8);
  w.put(s.exp, 14);
  w.put(maskOf(s.stickers, 16), 16); w.put(maskOf(s.themes, 8), 8); w.put(maskOf(s.frames, 4), 4);
  w.put(maskOf(s.emoSeen, 6), 6); w.put(maskOf(s.scenesDone, 6), 6);
  for (const v of s.slots) w.put(v + 1, 5);
  // ここまで 191ビット。のこりを 0 で うめて、さいごに チェックの 9ビット
  while (w.b.length < CODE_LEN * 5 - 9) w.put(0, 1);
  w.put(checksum(w.b), 9);
  // ならびを まぜて、にた セーブでも にた あいことばに ならない ように する
  const bits = scramble(w.b, 1);
  let out = '';
  for (let i = 0; i < CODE_LEN; i++) {
    let v = 0;
    for (let j = 0; j < 5; j++) v = (v << 1) | bits[i * 5 + j];
    out += CODE_CHARS[v];
  }
  return out;
}

// みやすく 5もじ ずつ くぎる
export const prettyCode = (code) => code.match(/.{1,5}/g).join(' ');

// まちがいや 古い セーブは null
export function fromCode(text) {
  const chars = [...String(text).normalize('NFC')].map(toHira).filter((c) => CODE_CHARS.includes(c));
  if (chars.length !== CODE_LEN) return null;
  const raw = [];
  for (const c of chars) { const v = CODE_CHARS.indexOf(c); for (let j = 4; j >= 0; j--) raw.push((v >> j) & 1); }
  const bits = scramble(raw, -1);
  const body = bits.slice(0, CODE_LEN * 5 - 9);
  let pos = 0;
  const get = (n) => { let v = 0; for (let i = 0; i < n; i++) v = (v << 1) | bits[pos++]; return v; };
  if (checksum(body) !== (() => { let v = 0; for (let i = CODE_LEN * 5 - 9; i < CODE_LEN * 5; i++) v = (v << 1) | bits[i]; return v; })()) return null;
  if (get(3) !== VERSION) return null;
  const s = { dog: get(2), avatar: get(4) - 1, frame: get(2), theme: get(3) };
  const kata = get(1);
  let nick = '';
  for (let i = 0; i < NICK_MAX; i++) { const v = get(7); if (v > 0 && v <= HIRA.length) nick += kata ? toKata(HIRA[v - 1]) : HIRA[v - 1]; }
  s.nick = nick;
  s.color = get(4) - 1;
  s.foods = [get(5), get(5), get(5)].filter((v) => v > 0).map((v) => v - 1);
  s.plays = [get(5), get(5), get(5)].filter((v) => v > 0).map((v) => v - 1);
  s.hard = fromMask(get(8), 8); s.calm = fromMask(get(8), 8);
  s.exp = get(14);
  s.stickers = fromMask(get(16), 16); s.themes = fromMask(get(8), 8); s.frames = fromMask(get(4), 4);
  s.emoSeen = fromMask(get(6), 6); s.scenesDone = fromMask(get(6), 6);
  s.slots = Array.from({ length: SLOTS }, () => get(5) - 1);
  return normalize(s);
}

// まっさらな セーブでも 「ああああ…」に ならない ように まぜる きまった ビット列
const KEY_STREAM = (() => { let x = 0x2545f491; return Array.from({ length: CODE_LEN * 5 }, () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 7) & 1; }); })();

// きまった じゅんばんの いれかえ（dir=1 で まぜる、-1 で もどす）＋ となりと XOR
function scramble(bits, dir) {
  const n = bits.length;
  const order = Array.from({ length: n }, (_, i) => (i * 73 + 11) % n); // 73 と 200 は たがいに そ
  if (dir === 1) {
    const out = Array(n);
    for (let i = 0; i < n; i++) out[i] = bits[order[i]];
    for (let i = 1; i < n; i++) out[i] ^= out[i - 1];
    return out.map((v, i) => v ^ KEY_STREAM[i]);
  }
  const un = bits.map((v, i) => v ^ KEY_STREAM[i]);
  for (let i = n - 1; i >= 1; i--) un[i] ^= un[i - 1];
  const out = Array(n);
  for (let i = 0; i < n; i++) out[order[i]] = un[i];
  return out;
}
