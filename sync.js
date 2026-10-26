// 進み具合と あいことば（わたしの ミカタと 同じ あいことば・同じ 置き場。2026-10-26 代表「A」）。
// 置き場へ おくるのは 進み具合だけ。じぶんノートの 中身（なまえ・すきな もの・にがて・かお・いろ）は この端末から 出さない。
// スターは「もらった 1かいずつ」を 記録（e:<数>）で おくり、置き場で 足す（2つの 端末で もらっても 両方 のこる）。
import { STORE_URL } from './config.js';

const KEY = 'anshin-pocket-sync';
const FIELDS = ['dog', 'frame', 'theme', 'stickers', 'themes', 'frames', 'slots', 'emoSeen', 'scenesDone'];
const blank = () => ({ key: '', display: '', dirty: false, pending: [], lastOk: 0, err: '' });
const load = () => { try { return { ...blank(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return blank(); } };
const T = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(T)); } catch { /* 保存できなくても つづける */ } };
const listeners = new Set();
const notify = () => listeners.forEach((f) => { try { f(); } catch { /* なし */ } });

export const enabled = () => !!STORE_URL;
export const info = () => ({ key: T.key, display: T.display, dirty: T.dirty || T.pending.length > 0, lastOk: T.lastOk, err: T.err });
export const onChange = (f) => { listeners.add(f); return () => listeners.delete(f); };
export const progressOf = (s) => Object.fromEntries(FIELDS.map((f) => [f, s[f]]));

// アプリ側の セーブを よむ・かく 道具（app.js から わたす）
let getS = () => null, setS = () => {};
export function bind(get, set) { getS = get; setS = set; }

function newId() {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[b % 62]).join('');
}
const earnEvent = (n) => ({ id: newId(), t: Date.now(), k: 'e:' + Math.min(Math.max(1, Math.floor(n)), 99999) });
const pendingSum = () => T.pending.reduce((a, e) => a + Number(e.k.slice(2)), 0);

async function call(body) {
  if (!STORE_URL) throw new Error('off');
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const res = await fetch(STORE_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), signal: ctl.signal, redirect: 'follow' });
    return await res.json();
  } finally { clearTimeout(t); }
}

// 置き場の 進み具合を この端末の セーブに いれる（ノートの 中身は そのまま。スターは まだ 送って いない 分を 足す）
function apply(anshin) {
  if (!anshin) return;
  const s = getS();
  setS({ ...s, ...progressOf(anshin), exp: (anshin.exp || 0) + pendingSum() });
}

let timer = null;
const soon = () => { clearTimeout(timer); timer = setTimeout(() => sync().catch(() => {}), 2500); };
// セーブが かわった ときに よぶ（えらんだ 物・品・見た 物）
export function changed() {
  if (!T.key) return;
  T.dirty = true; save(); notify(); soon();
}
// スターを もらった ときに よぶ
export function earned(n) {
  if (!T.key || !(n > 0)) return;
  T.pending.push(earnEvent(n)); save(); notify(); soon();
}

let running = null;
// 送って いる さいちゅうなら おわるのを まつ（あいことばを 切り替える 前に）
export const idle = () => (running ? running.catch(() => {}) : Promise.resolve());

export function sync() {
  if (!T.key || !STORE_URL) return Promise.resolve(false);
  if (running) return running.then(() => (T.dirty || T.pending.length ? sync() : true), () => sync());
  const key = T.key;
  const sendDirty = T.dirty;
  const sending = T.pending.slice(0, 200);
  T.dirty = false; save(); // 送って いる あいだの 変更は、また dirty に なる
  running = call({ a: 'sync', app: 'anshin', key, events: sending, anshin: sendDirty ? progressOf(getS()) : undefined }).then((r) => {
    if (T.key !== key) return false; // とちゅうで あいことばが かわった（切り替えは idle を まつので、ふつうは おきない）
    if (!r || !r.ok) { if (sendDirty) T.dirty = true; T.err = r && r.err === 'nokey' ? 'nokey' : 'server'; save(); notify(); return false; }
    const sent = new Set(sending.map((e) => e.id));
    T.pending = T.pending.filter((e) => !sent.has(e.id));
    if (!T.dirty) apply(r.state.anshin); // 送って いる あいだに えらび直して いなければ、合わせた 結果を つかう
    else { const s = getS(); setS({ ...s, exp: (r.state.anshin?.exp || 0) + pendingSum() }); }
    T.lastOk = Date.now(); T.err = '';
    save(); notify();
    if (T.dirty || T.pending.length) soon();
    return true;
  }).catch(() => { if (T.key === key) { if (sendDirty) T.dirty = true; T.err = 'net'; save(); notify(); } return false; })
    .finally(() => { running = null; });
  return running;
}

// あいことばを いれて よびだす。keepLocal: この端末の 進み具合（スター localExp も）を この人の 物として のこすか
export async function lookup(input, keepLocal, localExp) {
  await idle();
  const r = await call({ a: 'sync', app: 'anshin', key: input, events: [] });
  if (!r || !r.ok) return { ok: false, err: r && r.err ? r.err : 'server' };
  Object.assign(T, { key: r.key, display: r.state.display, lastOk: Date.now(), err: '', dirty: false, pending: [] });
  if (keepLocal) {
    if (localExp > 0) T.pending.push(earnEvent(localExp)); // あいことばを 入れる 前に もらって いた 分
    T.dirty = true; save();
    await sync();
  } else { save(); apply(r.state.anshin); }
  notify();
  return { ok: true, state: r.state };
}

export async function create(code) {
  const r = await call({ a: 'new', code });
  if (!r || !r.ok) return { ok: false, err: r && r.err ? r.err : 'server' };
  return { ok: true, key: r.key, display: r.display };
}

export function forget() {
  clearTimeout(timer);
  Object.assign(T, blank());
  save(); notify();
}

addEventListener('online', () => { if (T.key && (T.dirty || T.pending.length)) sync().catch(() => {}); });
