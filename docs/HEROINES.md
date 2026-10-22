# ヒロイン設定と画像の作り方

> 現在の絵は `tools/art/heroines.js` でコードから描いたベクター画（SVG→WebP）。`node tools/art/heroines.js` で作り直せる。
> AIで生成した絵に差し替えるときは、下の手順で同じ名前のファイルを `assets/heroines/` に置けば上書きされる。

画像はAIで生成し（Bの方針）、このリポジトリの `assets/heroines/` に置けばゲームに組み込まれる。
置くまでの間は、ゲーム側でコードで描いた仮の絵を表示する。

---

## 0. Geminiにそのまま貼る版（可愛さ重視・おすすめ）

1人につき1つの会話で、①→②→③→④の順に貼る（①の顔を基準に②〜④をそろえる）。気に入らない回は「もっと可愛く、目を大きく」と追加で頼む。

### ミーナ
① 立ち絵・ふつう
```
Generate an image. Cute moe anime girl illustration in a modern gacha game style, kawaii, big sparkling eyes with detailed highlights, small face, soft pink blush on cheeks, glossy hair, cel shading, clean thin lineart, soft pastel colors, single character, centered, plain pure white background, no text, no watermark, portrait aspect ratio 3:4.
Bust portrait from chest up of a sweet gentle girl around 18: long honey-blonde hair in a loose side braid over her right shoulder, a small green leaf hair clip, big soft emerald-green eyes, gentle warm closed-mouth smile, forest-green hooded robe with gold trim and small leaf embroidery, hood down, holding a wooden staff topped with fresh leaves and a tiny glowing lantern.
```
② 立ち絵・笑顔
```
Same character, same outfit, same art style, same framing and white background. Change only the expression: bright happy open-mouth smile, eyes happily closed in curved arcs, extra blush.
```
③ 立ち絵・困り顔
```
Same character, same outfit, same art style, same framing and white background. Change only the expression: worried troubled face, eyebrows raised in the middle, slightly teary eyes, looking a little aside, hand near her chest.
```
④ ちびキャラ
```
Same character as a full-body chibi figure, 2.5 heads tall, big head and tiny body, three-quarter view facing right, cheerful ready pose holding her leaf staff with the little lantern, simple cute shapes readable at small size, plain pure white background, square 1:1, no text.
```

### アリア
① 立ち絵・ふつう
```
Generate an image. Cute moe anime girl illustration in a modern gacha game style, kawaii, big sparkling eyes with detailed highlights, small face, soft pink blush on cheeks, glossy hair, cel shading, clean thin lineart, soft pastel colors, single character, centered, plain pure white background, no text, no watermark, portrait aspect ratio 3:4.
Bust portrait from chest up of a small ethereal girl around 15: very long fluffy silver-white hair that fades to pale lavender at the tips, big golden eyes with star-shaped highlights, innocent curious expression with lips slightly parted, white and gold frilly dress decorated with musical staff lines and notes, a glowing golden music-note hair ornament, tiny sparkles of light floating around her.
```
② 立ち絵・笑顔
```
Same character, same outfit, same art style, same framing and white background. Change only the expression: soft blissful smile, eyes gently curved, head tilted slightly, as if humming a song.
```
③ 立ち絵・悲しい顔
```
Same character, same outfit, same art style, same framing and white background. Change only the expression: sad lonely face, eyes looking down, small tears at the corners of her eyes.
```
④ ちびキャラ
```
Same character as a full-body chibi figure, 2.5 heads tall, big head and tiny body, three-quarter view facing right, floating slightly above the ground with arms open as if singing, little music notes and sparkles around her, simple cute shapes readable at small size, plain pure white background, square 1:1, no text.
```

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

## 5. カレン（`karen`）✅

**役どころ**：灼熱の坑道（B11〜B15）で踊る炎の踊り子。B13Fで出会い、B14Fで仲間になる。一座が坑道の奥で消えた理由を探している。
**性格・口調**：勝ち気で姉御肌、照れ屋。「アタシ」「〜じゃない！」「相棒！」
**戦い方**：前衛。敵の群れの中に飛び込み、まわりを炎で焼く。奥義「紅蓮の舞」でまわりに炎の大ダメージ、8秒間 攻撃の速さが倍。
**見た目**：紅い髪の高いポニーテール（毛先が炎の色）、金の炎の髪飾り、琥珀色の瞳、八重歯、赤と金の踊り子衣装と透ける橙のショール。

絵は `tools/art/gemini_gen.py`（Gemini API）で生成：1枚目の立ち絵を作り、残り3枚はそれを参照画像に渡して顔をそろえた。

```
[共通の画風（§0）]
Bust portrait from chest up of a lively confident girl around 17, a fire dancer: long crimson-red hair in a high ponytail with flame-orange tips, a golden flame-shaped hair ornament, big bright amber-orange eyes, confident cheeky grin showing a small fang, red and gold dancer outfit with a flowing sheer orange shawl and gold bangles, a few small embers floating around her.
```

## 6. セツナ・リコ・ネフィ ✅

| | セツナ（`setsuna`） | リコ（`riko`） | ネフィ（`nefi`） |
|---|---|---|---|
| 地層・加入 | 氷晶の洞：B17で出会い B18で加入 | 骸の納骨堂：B22で出会い B23で加入 | 砂に沈んだ神殿：B27で出会い B28で加入 |
| 人物 | 百年眠っていた氷の国の最後の王女。礼儀正しく寂しがり。「〜です」「わたくし」 | 気弱な死霊術師。骸骨の友だち「ホネ吉」。「ひぅっ」「ご、ごめんなさい」 | 神殿の留守番の巫女。おっとり、古いことばを混ぜる。「〜なのです」「ラ・メス」 |
| 戦い方 | 後衛。氷の矢 | おばけが敵から敵へ跳ねる（雷・最大3体） | 太陽の杖から光の玉 |
| 奥義 | 「氷華の檻」：氷の大ダメージ＋8秒間 被ダメージ-30% | 「おともだち大行進」：雷の大ダメージ＋HP25%回復 | 「砂陽の祈り」：大ダメージ＋10秒間 HPが1残る |

白い服やおばけのように白い部分が多い絵は `tools/cutout.py --keep-white` で切り抜く（囲まれた白を消す処理を止める）。

## 7. ユズ・ルナ・シオン・ステラ ✅

| | ユズ（`yuzu`） | ルナ（`luna`） | シオン（`shion`） | ステラ（`stella`） |
|---|---|---|---|---|
| 地層・加入 | 毒霧の底 B32→B33 | 血涙の回廊 B37→B38 | 虚無の淵 B42→B43 | 星の終わる場所 B47→B48 |
| 人物 | 皮肉屋で面倒見のいい薬師。「はいはい」「ツケね」 | 誇り高く甘えん坊な吸血鬼。「ルナ様」「〜なのだわ」 | 記憶のない無口な騎士。「……了解」 | 星読みの少女。物語の終わりの鍵。シオンと何かの縁がある |
| 戦い方 | 薬びんを投げてまとめて打ち、敵の攻撃を弱める | 血の矢。撃つたびに主人公のHPを少し癒やす | 前に立って斬る。同行中は被ダメージ-10% | 敵の頭上に星を落とす（範囲） |
| 奥義 | 「特製の万能薬」：HP40%回復・回復薬+2・敵の攻撃-35% | 「紅月の宴」：大ダメージ、1体ごとにHP5%吸収 | 「虚空の盾」：大ダメージ＋2.5秒動きを止める | 「流星群」：流れ星10発 |

## 8. 同行のルール
- 同行は **3人まで**（`HERO_MAX_OUT`）。新しく仲間になった子は必ず同行し、満員なら一番長く同行していた子（ミーナ以外）が休憩に回る。
- 「仲間」タブの「連れて行く／休ませる」で入れ替える。

## 9. 衣装（夏祭りの浴衣）
- 1着 300万G（`COSTUMES`）。買うとすぐ着る。「仲間」タブで「いつもの服に戻す／浴衣を着る」を切り替え
- 浴衣の絵は仲間タブ・奥義のカットイン・奥義ボタン・ログイン報酬・フィールドのちびキャラに使う。会話の立ち絵は表情差分が要るのでいつもの服
- 絵は各ヒロインの立ち絵を参照画像にして生成（立ち絵1枚＋ちびキャラ1枚）。容量を抑えるため立ち絵480px・ちびキャラ240px・品質80
- 指示文に背景の光（ぼかし）を入れると切り抜けない絵になるので、「背景には何も描かない」と明記する
