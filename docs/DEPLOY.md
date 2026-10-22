# 公開のしかた（Cloudflare Pages・URLを知っている人だけ）

会社名の入らないURL（例：`https://thy-aria.pages.dev`）で、検索エンジンには載せずに公開する。

## 初回
1. パソコンで https://dash.cloudflare.com/sign-up からアカウントを作る（無料）
2. 左メニュー「Workers & Pages」→「作成」→「Pages」→「アセットをアップロード（Upload assets）」
3. プロジェクト名に好きな名前を入れる（例：`thy-aria`）。これがURLになる → `https://thy-aria.pages.dev`
4. `thy-aria-site.zip`（`python3 build.py` のあと `dist/site` を中身ごとzipにしたもの）をドラッグ＆ドロップ →「デプロイ」
5. 表示されたURLを、遊んでほしい人にだけ送る

## 更新するとき
「Workers & Pages」→ プロジェクト →「新しいデプロイを作成」→ 新しいzipをドロップ。URLは変わらない。

## メモ
- ページに `noindex` を入れてあるので、検索結果には出ない。ただしURLを知っていれば誰でも開ける
- 招待した人だけにしたいときは、同じ画面の「設定 → アクセスポリシー（Cloudflare Access）」でメールアドレスを登録する（50人まで無料）
- 共闘ボス・ランキングはこの版ではオフライン表示（claude.ai の公開ページでのみ動く）
- GitHub Pages への自動公開は止めてある（`.github/workflows/pages.yml` は手動実行のみ）
