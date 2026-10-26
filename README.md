# あんしん ポケット

訪問看護ステーションはるうたの利用者さん（ASD のある小児）向けの練習アプリ。
気持ちの読み取り・場面の練習（6場面）・じぶんノート・きょうのよてい、レベルとショップ、あいことばでの引き継ぎ。

- 公開: https://haru-uta.github.io/anshin-pocket/
- 仕様と決めたこと: [docs/spec.md](docs/spec.md)
- 試験: `npm test`（あいことば）/ `node tools/e2e.mjs`（ブラウザで操作して画面を点検。写真は out/e2e/）
- 絵: `python tools/gen_art.py`（GPT に描かせる）→ `tools/cut_sheet.py` / `tools/cut_scenes.py` で切り分け

記録はその端末の localStorage だけ。ネットには何も送らない。診断・治療を目的としたものではない。
