# YOU, THY ARIA — 開発引き継ぎ資料

ブラウザで動くアイソメトリック（斜め見下ろし）アクションRPG。**1つのHTMLファイル**（約10MB）にすべてが入っており、claude.ai の公開アーティファクトとして配信している。

- 公開URL: https://claude.ai/artifact/BbUAMrH6wG7ZkFgbzbMoJ3
- 対象: スマホ優先（縦・横持ち）、パソコンも可。日本語UI。
- 外部ライブラリなし（素のJavaScript + Canvas 2D + Web Audio）。

---

## 1. ビルドと確認

```bash
python3 build.py          # src/ と assets/ を連結して dist/twinsoul.html を生成
npm install               # テスト用（jsdom, @napi-rs/canvas, puppeteer-core, @sparticuz/chromium）
node tests/test.js        # ヘッドレス回帰テスト（最後に "ERRORS: 0" なら合格）
```

- `dist/twinsoul.html` が配布物。**16MB以下**に保つこと（現在 約10.2MB。内訳: キャラ画像 7.5MB、主題歌 2.2MB、コード 0.4MB）。
- `dist/game_only.js` はゲームコード部分だけ。`node --check dist/game_only.js` で構文チェックできる。
- 見た目の確認は `tools/*.js`（puppeteer-core + @sparticuz/chromium のヘッドレスChrome）で画面写真を撮っていた。日本語フォントは `apt-get install fonts-noto-cjk`。

## 2. ファイル構成

```
src/a_head.html   HTML・CSS・DOM（HUD、メニュー、各ダイアログ）。末尾が "<script>\n" で終わり、ゲーム本体のIIFEを開く
src/*.js          ゲーム本体。build.py の ORDER の順に連結され、1つの即時関数の中に入る
assets/flare_data.js   キャラ・敵のスプライト（WebPアトラスをbase64で埋め込み）
assets/song.js         主題歌（MP3をbase64、window.__OPSONG）
assets/op_theme.mp3 / op_beats.json   主題歌の元ファイルと拍の時刻（オープニング同期用）
tests/test.js     jsdom回帰テスト
tools/snap.js     画面写真の自動撮影（node tools/snap.js 出力先 幅 高さ）。JSエラーがあれば失敗終了
tools/*.js        旧来の撮影スクリプト（パスは書き換えて使う）
docs/             設計書・ロードマップ・QA計画
.github/workflows CI（ビルド・構文・容量16MB・回帰テスト）
```

### 連結の仕組み（重要）
- 全モジュールは**同じ関数スコープ**に連結される。モジュール間の参照はグローバル変数ではなく、このスコープ内の名前で行う。
- **関数宣言は巻き上げ**られるので順序に依存しない。`const`/`let` は TDZ があるため、起動時（`boot()` 以前）に参照されうる状態は `var` にしている（`FLOOR`, `BLESS`, `ULT`, `PET`, `NET`, `WB`）。
- `boot()` は全モジュールの後（build.py が末尾に付加）で呼ばれる。
- 既存関数の差し替えは「後ろのモジュールで同名関数を宣言」ではなく、元を改名（例 `derived`→`derivedBase`、`renderSheet`→`renderSheetOld`）してラップする方式を取っている。

## 3. モジュール一覧

| ファイル | 行数 | 役割 |
|---|---|---|
| b_core.js | 987 | 定数、マップ定義(MAPS)、マップ生成(buildMap)、経路探索(A*)、プレイヤー・敵AI、戦闘(hitEnemy/killEnemy/hurtPlayer)、能力計算(derivedBase)、保存/読込(save/load)、更新ループ(update) |
| e_skills.js | 538 | スキル26種(SKD)、スキルツリー、ホットバー、スキル効果(爆発explode・流星meteors 等)、光源収集 |
| g_items.js | 305 | 装備の生成・ドロップ・拾得・強化・売却、レア度、追加効果 |
| h_dungeon.js | 294 | 深淵の回廊：階の準備(prepFloor/startFloor)、門、ボス4種の技、危険地帯(弾・線・床) |
| i_quests.js | 247 | 町のNPC3人、メイン依頼10話、依頼掲示板、追跡表示 |
| c1_assets.js | 557 | 地形テクスチャ・木・小物などの手続き生成スプライト、Flareスプライト読込 |
| c2_render.js | 884 | 描画全般（空・地面チャンク・水・崖・小物・キャラ・光・ミニマップ・ダメージ数字） |
| d_ui.js | 361 | HUD更新、入力（タップ/ドラッグ/ピンチ/キー）、起動処理(boot)、テスト用フック(window.__G) |
| k_ui.js | 364 | UI 2.0：移動スティック、攻撃ボタン、装備比較・一括売却・ロック、設定、各ボタンの登録 |
| l_audio.js | 176 | 効果音31種とBGM（Web Audioで手続き生成、場所ごとの曲調） |
| m_abyss.js | 156 | 深淵50層の10地層テーマ、B50Fの深淵の主、踏破処理 |
| n_feel.js | 67 | 爽快感：ヒットストップ、画面揺れ、ノックバック、コンボ、覚醒 |
| o_ending.js | 218 | エンディング（タイトル→HIROTA YUYA→ひろたゆうや のアナグラム演出） |
| p_op.js | 553 | オープニングムービー（主題歌の歌詞時刻と拍に同期、実マップを撮影して使用） |
| q_vfx.js | 185 | 追加エフェクト層（衝撃、斬撃、撃破、光の玉、爆発、柱、画面フラッシュ） |
| r_floor.js | 319 | 階の目標5種、呪い9種、強敵の特性8種、宝ゴブリン、祝福14種、`derived()`本体（上位職・ペット・祝福を合成） |
| s_layout.js | 169 | 深淵の地形9種（洞窟、石室、迷宮、浮島、環状、闘技場、裂け目 ほか）と連結保証 |
| t_meta.js | 63 | 深淵の位階（周回Ⅰ〜Ⅹ）、潜行状態の保存、冒険の記録 |
| u_class.js | 194 | 上位職4種（Lv20〜）と奥義 |
| v_pet.js | 249 | ペット（タマゴ1/2000、5種＋色違い、成長、戦闘、騎乗、手続き描画） |
| w_world.js | 190 | オンライン：週替わり共闘ボス（共有HP）と週間深淵ランキング |
| x_aria.js | 292 | ミニゲーム「アリアの演奏」（2レーンのリズムゲーム、歌の加護） |

## 4. 主なゲームシステム（どこを見るか）

- **マップ**: 0 始まりの森 / 1 赤砂の峡谷 / 2 霧の墓所 / 3 深淵の回廊（56×56タイル）。`MAPS`（b_core.js）、移動は `enterMap(id, arrive)`。
- **深淵**: 全50層。5層ごとに地層テーマ（m_abyss.js `THEMES`）、地形（s_layout.js `pickLayout`）、5層ごとにボス、B50Fに深淵の主。位階（t_meta.js）で敵Lv+25/段。
- **階の流れ**: `enterMap(3)` → `prepFloor()` → `buildMap()` → 敵配置 → `startFloor()` → `setupFloor()`（目標・呪い）または `bossFloorSetup()`。門は `openStairs()`。
- **能力値**: `derived(form)`（r_floor.js）が `derivedBase`(b_core) に上位職・ペット騎乗・祝福を重ねる。結果は `D`。
- **敵**: `makeEnemy(type, x, y, lvl, pack, elite)`。種類は goblin / ant / undead（見た目キーは `enemyKey`）。特性は `e.aff`、ボスは `e.boss`、深淵の主は `e.final`、共闘ボスは `e.world`。
- **オンライン**: w_world.js。`claude.use('db')` と `claude.use('user')`。書き込みは各自のドキュメント `lb/<自分のid>`、`wb/<自分のid>` のみ。

## 5. 保存データ
- `localStorage` のキー `twinsoul-save-v1` に `prog` オブジェクトをJSONで保存。
- **新しい項目を足したら、必ず b_core.js の `load()` に検証（サニタイズ）処理を追加**すること。保存データは信頼しない前提で、型・範囲を確認してから取り込んでいる。数値は `num(v, 既定値, 最小, 最大)`（b_core）、装備は `cleanItem`（g_items、こちらは `num(v, 最小, 最大, 既定値)` と引数順が違うので注意）。
- 主な項目: level, exp, stats, sp, kp, skill, form, gold, potions, eq, inv, map, deep, floor, q(依頼), opt(設定), cleared, rank, rankMax, rankDeep, bless, phx, rec(記録), cls(上位職), pets, wb(共闘), wk(週間)。

## 6. 公開設定（アーティファクトのランタイム機能）
共闘ボスとランキングのために、公開時に次の機能を宣言している。再公開で `capabilities` を省略すると前回の宣言が引き継がれる。

```json
{"db": {"rules": [
  {"path": "lb", "read": "view", "write": "owner"},
  {"path": "lb/{self}", "write": "interact"},
  {"path": "wb", "read": "view", "write": "owner"},
  {"path": "wb/{self}", "write": "interact"}]},
 "user": {"scopes": ["profile"]}}
```
- 書き込めるのは共有設定で「投稿者(Contributor)」以上の人。公開リンクで来た組織外の人は閲覧のみ、未サインインはオフライン動作。
- db にはトランザクションも加算命令もないため、共有HPは「各自の累計ダメージを自分のドキュメントに書く → 全員分を読んで合計」で計算している。

## 7. テスト
- `tests/test.js` は jsdom 上でゲームを起動し、`window.__TEST__ = true` で有効になる `window.__G`（d_ui.js）経由で約200項目を検査する。最後の行が `ERRORS: 0` なら合格。実行時間は約2分。
- `window.__TEST__` のときは、起動時のオープニングと上位職の自動選択画面を出さない。
- **過去に「たまに失敗する」テストの原因はすべてテスト側だった**：
  - 実時間のタイマー（門の移動・帰還の320ms待ち）が、同期的に進めたフレームと噛み合わない。
  - ヒットストップでゲーム内時間が遅くなり、フレーム数で待つと足りない。
  - キャンプ内では敵が退いて体力を回復する。
  - メニューやダイアログが開いたままだと `paused` で進まない。
  新しいテストを書くときはこれらを避けること。
- 実ブラウザ確認は tools/ のスクリプト（`window.__G.opSeek(t)` でオープニングの任意時刻を描画できる、`G.paused = true` と `G.step(dt)` で状態を止めて撮影できる）。

## 8. 素材とライセンス
- キャラクター・敵の画像: **Flare**（Clint Bellanger ほか）、**CC BY-SA 3.0**。ゲーム内（設定・メニュー下部）にクレジット表示あり。消さないこと。改変・再配布時も同ライセンスの条件に従う。
- 主題歌「YOU, THY ARIA」: 依頼者が Gemini で作成して提供したもの（歌詞の時刻は元動画の字幕から取得）。権利関係は依頼者に確認すること。
- そのほかのグラフィック（地形・小物・ペット・エフェクト）と効果音・BGMは、すべてコードで手続き生成した独自のもの。

## 9. 未完了・既知の課題
- **オンライン機能は本番サーバーでの動作を未確認**（開発環境からサーバーに接続できず、オフライン動作のみ確認済み）。公開ページで王冠ボタンの最上部が「通信：オンライン」になるか要確認。
- 共闘ボスのHP（基本800万×参加人数^0.8）と報酬は仮の値。実際の参加状況で調整が必要。
- ボス階の被ダメージ：予告つき大技は1撃で最大HPの38%（弾は14%）までに制限済み。実プレイでの再計測が必要。
- 地上の3マップ（森・峡谷・墓所）は深淵のような地形の多様化をしていない。
- 装備を変えても主人公の見た目は変わらない（Flareの重ね合わせ画像を使えば可能だが、ファイルが重くなる）。
- ペットは手続き描画の簡易な絵。

## 10. 次の候補（依頼者と相談済みのもの）
- ミニゲーム: ~~リズムゲーム「アリアの演奏」~~（実装済み）、釣り、鍛冶の打ち込み、トマの賭け遊び、ペットのお世話。
- 毎日の依頼・ログイン報酬、セット装備/ユニーク装備、称号と実績、ギルド、リアルタイム協力プレイ（`room` 機能）。

## 11. 開発の進め方（これまでのやり方）
- 1回の作業で1つの大きな機能を足し、テスト → 実ブラウザで画面写真 → 公開、の順。
- 既存コードの変更は「一意に一致する文字列を置き換える」方式で行っていた（置換前に一致件数が1件であることを確認）。
- UI文言は日本語。スマホでの見やすさ（縦844px程度）を常に確認する。
- 依頼者は「どんどん改良して」「続けて」で次へ進める方針。仕様の意図（例：タマゴは2000分の1）は依頼者の指定を尊重する。
