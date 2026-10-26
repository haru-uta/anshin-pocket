import test from 'node:test';
import assert from 'node:assert/strict';
import { fresh, normalize, toCode, fromCode, prettyCode, cleanNick, level, wallet, CODE_CHARS } from '../save.js';

const full = () => normalize({
  dog: 3, avatar: 11, frame: 3, theme: 7, nick: 'ハルウタタロ', color: 11,
  foods: [15, 0, 7], plays: [2, 15, 9], hard: [0, 7, 3], calm: [1, 6],
  exp: 16383, stickers: [...Array(16).keys()], themes: [...Array(8).keys()], frames: [0, 1, 2, 3],
  slots: [15, -1, 0, 3, -1, 9], emoSeen: [0, 5], scenesDone: [1, 2, 5],
});

test('あいことばで ぜんぶ もどる', () => {
  for (const s of [fresh(), full(), normalize({ nick: 'ゆいー', exp: 37, stickers: [2], slots: [2] })]) {
    const code = toCode(s);
    assert.equal([...code].length, 40);
    assert.ok([...code].every((c) => CODE_CHARS.includes(c)));
    assert.deepEqual(fromCode(code), normalize(s));
    assert.deepEqual(fromCode(prettyCode(code)), normalize(s)); // くぎり ありでも よめる
  }
});

test('1もじ まちがえたら よめない', () => {
  const code = [...toCode(full())];
  let bad = 0;
  for (let i = 0; i < code.length; i++) {
    const c = code.slice(); c[i] = CODE_CHARS[(CODE_CHARS.indexOf(c[i]) + 1) % 32];
    if (fromCode(c.join('')) === null) bad++;
  }
  assert.ok(bad >= 39, `まちがいに きづいた かず ${bad}/40`);
  assert.equal(fromCode('あいう'), null);
  assert.equal(fromCode(''), null);
});

test('なまえは ひらがな・カタカナ 6もじまで', () => {
  assert.equal(cleanNick('たろう123abc'), 'たろう');
  assert.equal(cleanNick('はるうたちゃんです'), 'はるうたちゃ');
  assert.equal(cleanNick('ハるうた'), 'ハルウタ');
  assert.equal(cleanNick('漢字'), '');
});

test('こわれた セーブでも おちない', () => {
  for (const bad of [null, 1, 'x', { dog: 99, exp: -5, slots: [99], themes: [7], theme: 7, stickers: 'x' }]) {
    const s = normalize(bad);
    assert.equal(s.dog, 0); assert.ok(s.themes.includes(0));
  }
  // もって いない シールは はれない
  assert.deepEqual(normalize({ slots: [3, 3] }).slots[0], -1);
});

test('レベルと おさいふ', () => {
  assert.equal(level(0), 1); assert.equal(level(4), 1); assert.equal(level(5), 2); assert.equal(level(15), 3);
  assert.equal(level(999999), 20);
  assert.equal(wallet(normalize({ exp: 10, stickers: [0] })), 7);
});
