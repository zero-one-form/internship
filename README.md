# YOU, THY ARIA

剣と術、ふたつの型を切り替えて戦う、スマホ向けの斜め見下ろしアクションRPG。1つのHTMLファイルで動きます（外部ライブラリなし）。

```bash
npm ci
python3 build.py              # dist/twinsoul.html を生成
node tests/test.js            # 回帰テスト（最後に "ERRORS: 0"）
node tools/snap.js shots      # 実ブラウザで主要画面を撮影
```

- 開発の引き継ぎ資料: [HANDOFF.md](HANDOFF.md)
- 設計書: [docs/GDD.md](docs/GDD.md) ／ ロードマップ: [docs/ROADMAP.md](docs/ROADMAP.md) ／ QA: [docs/QA.md](docs/QA.md)
- キャラクターと敵の画像: [Flare](https://flarerpg.org/)（CC BY-SA 3.0）
