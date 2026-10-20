# ヒロイン設定と画像の作り方

> 現在の絵は `tools/art/heroines.js` でコードから描いたベクター画（SVG→WebP）。`node tools/art/heroines.js` で作り直せる。
> AIで生成した絵に差し替えるときは、下の手順で同じ名前のファイルを `assets/heroines/` に置けば上書きされる。

画像はAIで生成し（Bの方針）、このリポジトリの `assets/heroines/` に置けばゲームに組み込まれる。
置くまでの間は、ゲーム側でコードで描いた仮の絵を表示する。

---

## 1. 作る画像（1人あたり4枚）

| ファイル名 | 中身 | 大きさの目安 | 使う場所 |
|---|---|---|---|
| `<id>_bust_normal.png` | 胸から上・ふつうの顔 | 縦長 768×1024 | 会話の立ち絵 |
| `<id>_bust_smile.png` | 胸から上・笑顔 | 同上 | 会話（うれしい場面） |
| `<id>_bust_sad.png` | 胸から上・困り顔／悲しい顔 | 同上 | 会話（深刻な場面） |
| `<id>_chibi.png` | 全身のデフォルメ（2〜2.5頭身）、斜め前（右向き） | 正方形 512×512 | フィールドで一緒に戦う姿（左右は反転して使う） |

- `<id>` は `mina`、`aria`。
- **背景は真っ白の無地**で生成する（透明にできない生成ツールが多いため）。白い背景は `python3 tools/cutout.py` が自動で切り抜く。透明PNGで出せるならそのままでよい。
- 文字・ロゴ・透かしが入っていないものを使う。
- 4枚とも**同じ会話・同じ参照画像の流れの中で**作ると顔がそろいやすい（1枚目をできの良いものにして、2枚目以降は「この画像と同じキャラクターで」と頼む）。

## 2. 共通の画風（すべてのプロンプトの最初に付ける）

```
High-quality anime game character illustration, cel shading, clean thin lineart, soft pastel fantasy colors, gentle rim light, wholesome all-ages style, single character, centered, plain pure white background, no text, no logo, no watermark.
```

- 実在の絵師名や既存作品のキャラ名はプロンプトに入れない（似せすぎると権利の問題になるため）。
- 生成ツールの利用規約で、作った画像をゲームに使ってよいか（商用・公開の可否）を確認しておく。

---

## 3. ミーナ（`mina`）

**役どころ**：森のキャンプのギルド受付。物語の序盤から主人公を導く。旅人の「歌」について何かを知っている。メイン依頼をすべて終えると、仲間として一緒に深淵へ潜る。

**性格**：落ち着いたお姉さん肌。やさしいが、ときどき主人公をからかう。核心のことになると言葉を濁す。

**口調**：「〜ね」「〜よ」「ふふ」。例：「無理はしないで。……なんて言っても、あなたは行くんでしょうけど」

**戦い方**：癒し手。主人公のHPを回復し、ピンチには守りの結界を張る。奥義「森の揺りかご」で大回復。

**見た目**：18〜20歳くらい。蜂蜜色の長い髪を右肩でゆるい三つ編みに。翠の瞳。深緑のフード付きローブ（金の縁取り、葉の刺繍）。木の杖（先に若葉と小さな灯り）。

### プロンプト（英語のままコピー）

立ち絵・ふつう
```
[共通の画風], bust portrait from chest up, a gentle young woman around 19 years old, long honey-blonde hair in a loose side braid over her right shoulder, soft green eyes, calm kind smile with closed mouth, deep forest-green hooded robe with gold trim and small embroidered leaves, hood down, holding a wooden staff topped with fresh leaves and a tiny glowing lantern, guild receptionist of a forest camp, warm and slightly mysterious
```
立ち絵・笑顔：上の文の `calm kind smile with closed mouth` を `bright open smile, eyes slightly closed, cheerful` に置き換える。
立ち絵・困り顔：`worried expression, eyebrows slightly raised, looking a little aside` に置き換える。

ちびキャラ
```
[共通の画風], full body chibi character, 2.5 heads tall, three-quarter view facing right, standing in a light ready pose holding a staff, same character: young woman with long honey-blonde side braid, green eyes, deep forest-green hooded robe with gold trim and leaf embroidery, wooden staff with leaves and a tiny lantern, cute simple shapes, readable at small size
```

---

## 4. アリア（`aria`）

**役どころ**：旅人の耳に残る「歌」が少女の姿をとったもの。深淵の「底で待っている人」。B11Fから声だけが聞こえ、B15Fで姿を見せ、B20Fで仲間になる。B50Fの先で物語の答えに関わる。

**性格**：無垢で好奇心旺盛。言葉を覚えたばかりのように、短く歌うように話す。主人公と同じく記憶がない。

**口調**：「……きこえる？」「あなたの歌、すき」「ここ、つめたい。でも、こわくない」

**戦い方**：歌い手。仲間全員の攻撃を高める歌を流し、音の波で敵をまとめて攻撃する（雷の元素）。奥義「汝の歌」で全体に大ダメージと強化。

**見た目**：15〜16歳くらいに見える。銀白の長い髪で、毛先が淡い紫に溶ける。金色の星のような瞳。白と金のドレスに五線譜の模様。髪に光る音符の飾り。少し宙に浮いている。

### プロンプト（英語のままコピー）

立ち絵・ふつう
```
[共通の画風], bust portrait from chest up, an ethereal teenage girl around 15 years old, very long silver-white hair fading to pale lavender at the tips, golden star-like eyes, innocent curious expression with lips slightly parted, white and gold dress decorated with musical staff lines, a glowing musical-note hair ornament, faint sparkles of light around her, the personification of a song from the depths
```
立ち絵・笑顔：`innocent curious expression with lips slightly parted` を `soft happy smile, eyes gently curved` に置き換える。
立ち絵・悲しい顔：`sad lonely expression, eyes looking down` に置き換える。

ちびキャラ
```
[共通の画風], full body chibi character, 2.5 heads tall, three-quarter view facing right, floating slightly above the ground with arms open as if singing, same character: girl with very long silver-white hair fading to lavender, golden star eyes, white and gold dress with musical staff pattern, glowing music-note hair ornament, little light sparkles, cute simple shapes, readable at small size
```

---

## 5. 今後の候補（地層ごとに1人）

| 地層 | 名前（仮） | 役どころ | 元素 |
|---|---|---|---|
| 灼熱の坑道 | カレン | 炎の踊り子。勝ち気で姉御肌 | 炎 |
| 氷晶の洞 | セツナ | 氷の国の姫。礼儀正しく寂しがり | 氷 |
| 骸の納骨堂 | リコ | 気弱な死霊術師。骸骨の友だちがいる | 雷 |
| 砂に沈んだ神殿 | ネフィ | 神殿の巫女。古代語で話すおっとり者 | 回復 |

設定が固まったら、同じ形でプロンプトを追加する。
