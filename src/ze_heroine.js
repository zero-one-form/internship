  /* ================= heroines: companions with personality, affinity talks, story scenes, ultimate cut-ins ================= */
  // Art comes from assets/heroines/<id>_<kind>.webp (AI-generated, embedded by build.py into window.__HEROINE_ART).
  // Until an image exists, a code-drawn placeholder is shown in the same place.
  const HEROINES = {
    mina: {
      name: 'ミーナ', title: 'ギルド受付・癒し手', col: '#5fae6e', hair: ['#f2cf7a', '#c9963a'], cloth: ['#2f6b45', '#1d4a2f'], eye: '#3f9a5a',
      ult: '森の揺りかご', ultD: 'HPを大きく回復し、6秒間 受けるダメージを40%減らす',
      d: '主人公のHPを癒やし、危ないときは守りの結界を張る。奥義「森の揺りかご」'
    },
    aria: {
      name: 'アリア', title: '底に眠る歌', col: '#b9a6ff', hair: ['#f4f2ff', '#c6b4ff'], cloth: ['#fffaf0', '#e8c46a'], eye: '#f2c94c',
      ult: '汝の歌', ultD: 'まわりの敵すべてに雷の大ダメージ。8秒間 味方全員の攻撃 +30%',
      d: '歌で味方の攻撃を高め、音の波で敵をまとめて打つ（雷）。奥義「汝の歌」'
    },
    karen: {
      name: 'カレン', title: '灼熱の踊り子', col: '#ff7a3c', hair: ['#e8443a', '#ff9a3c'], cloth: ['#d8342c', '#f2b84a'], eye: '#ffa040',
      ult: '紅蓮の舞', ultD: 'まわりの敵すべてに炎の大ダメージ。8秒間 カレンの舞が倍の速さになる',
      d: '前に出て敵の群れの中で舞い、炎でまとめて焼く。奥義「紅蓮の舞」'
    },
    setsuna: {
      name: 'セツナ', title: '氷晶の姫', col: '#6aa8ff', hair: ['#a8d4ff', '#5a9ae8'], cloth: ['#2a4a8a', '#cfe4ff'], eye: '#3a7ae0',
      ult: '氷華の檻', ultD: 'まわりの敵すべてに氷の大ダメージ。8秒間 主人公の受けるダメージを30%減らす',
      d: '後ろから氷の矢で敵を凍えさせる。奥義「氷華の檻」'
    },
    riko: {
      name: 'リコ', title: '気弱な死霊術師', col: '#9a7ad8', hair: ['#c8bce0', '#8a7ab0'], cloth: ['#2a2230', '#6a4a9a'], eye: '#8a5ad8',
      ult: 'おともだち大行進', ultD: 'まわりの敵すべてに雷の大ダメージ。倒した魂で主人公のHPを25%回復',
      d: 'おばけの友だちが敵から敵へ跳ねる（雷・最大3体）。奥義「おともだち大行進」'
    },
    nefi: {
      name: 'ネフィ', title: '砂の神殿の巫女', col: '#2fb8a8', hair: ['#f2d08a', '#c89a4a'], cloth: ['#f4f0e0', '#3ab8a8'], eye: '#2a9a8a',
      ult: '砂陽の祈り', ultD: 'まわりの敵に大ダメージ。10秒間 主人公はどんな攻撃でもHPが1残る',
      d: '太陽の杖から光の玉を放つ。奥義「砂陽の祈り」でピンチを耐えしのぐ'
    },
    yuzu: {
      name: 'ユズ', title: '毒霧の薬師', col: '#7ccf6a', hair: ['#a8e6c0', '#5aa880'], cloth: ['#3a6a3a', '#f4ead0'], eye: '#c8d84a',
      ult: '特製の万能薬', ultD: 'HPを40%回復し回復薬を2個補充。まわりの敵の攻撃を8秒間35%弱める',
      d: '薬びんを投げて敵をまとめて打ち、攻撃を弱める。奥義「特製の万能薬」'
    },
    luna: {
      name: 'ルナ', title: '紅月の姫君', col: '#d8344a', hair: ['#2a1a22', '#c8283a'], cloth: ['#1e1418', '#b8202e'], eye: '#e0283a',
      ult: '紅月の宴', ultD: 'まわりの敵に大ダメージ。当てた敵1体ごとにHPを5%吸い取る（最大50%）',
      d: '血の矢で敵を射ち、少しずつ主人公のHPを癒やす。奥義「紅月の宴」'
    },
    shion: {
      name: 'シオン', title: '虚無の騎士', col: '#8a6ad8', hair: ['#d0c8e8', '#9a8ac8'], cloth: ['#2a3050', '#7a4ab8'], eye: '#4a3a9a',
      ult: '虚空の盾', ultD: 'まわりの敵に大ダメージを与え、2.5秒間 動けなくする',
      d: '前に立って斬り込み、同行しているだけで主人公の受けるダメージを10%減らす。奥義「虚空の盾」'
    },
    stella: {
      name: 'ステラ', title: '星を読む少女', col: '#f2c94c', hair: ['#2a3a7a', '#1a2450'], cloth: ['#f4f2ff', '#1e2a5a'], eye: '#f2c94c',
      ult: '流星群', ultD: 'まわりの敵に流れ星が10回降りそそぐ',
      d: '敵の頭上に小さな星を落とし、まわりごと打つ。奥義「流星群」'
    }
  };
  const HERO_IDS = Object.keys(HEROINES);
  // gifts: the gold sink. Each gift raises affection by half a level; the price grows with the level.
  const GIFTS = {
    mina: ['ハーブティー', 'ふふ、いい香り。今度、一緒に飲みましょう？'],
    aria: ['オルゴール', '……きれいなおと。ずっと、きいてたい'],
    karen: ['金の足飾り', 'わ、わかってるじゃない！ 次の舞で着けるね！'],
    setsuna: ['雪の結晶のブローチ', 'まあ……。一生、大切にいたします'],
    riko: ['ホネ吉用のリボン', 'ホ、ホネ吉、すっごく似合ってるよ……！'],
    nefi: ['星見の枕', 'ふわぁ……。これで、もっとよく眠れるのです'],
    yuzu: ['珍しい薬草', '……へえ、いい目利きじゃん。ありがと'],
    luna: ['紅いバラ', 'と、当然の献上品なのだわ！ ……うれしいのだわ'],
    shion: ['上等な砥石', '……感謝する。……大事に使う'],
    stella: ['古い星図', 'わあ！ この星座、はじめて見た！ ありがとう！']
  };
  const GIFT_AFF = 15;
  function giftCost(id) { return 10000 * Math.pow(affLv(id) + 1, 2); }
  function giveGift(id) {
    const S = heroS(id), c = giftCost(id);
    if (!S.j || affLv(id) >= AFF_MAX) return false;
    if (prog.gold < c) { toast('ゴールドが足りない（' + c.toLocaleString() + 'G）'); return false; }
    const lv0 = affLv(id);
    prog.gold -= c; S.aff += GIFT_AFF;
    toast(HEROINES[id].name + '「' + GIFTS[id][1] + '」' + (affLv(id) > lv0 ? '　好感度 Lv' + affLv(id) + '！' : ''));
    sfx('quest'); save();
    return true;
  }
  const AFF_STEP = 30, AFF_MAX = 10, ULT_NEED = 90, HERO_MAX_OUT = 3, HERO_DMG = 0.6, HERO_ULT = 0.7; // tuned with tools/sim.js (SIM_HEROES=1) // at most three heroines travel together
  // scenes: [speaker, expression, text]; speaker '' = narration, '?' = an unseen voice
  const SCENES = {
    mina_join: [
      ['mina', 'normal', 'おかえりなさい。B10Fの番人、本当に越えたのね'],
      ['mina', 'smile', '……決めたわ。受付はトマに任せる。私も一緒に行く'],
      ['', '', 'トマが「えっ、ボクが!?」と声を上げた。ガルドは黙って、ミーナの杖に油を差した。'],
      ['mina', 'sad', 'あなたの歌が、底へ呼ばれている気がするの。ひとりで行かせたくない'],
      ['mina', 'smile', '回復は任せて。前に出るのはあなたの役目よ'],
      ['', '', '――「や君、また走ってるの？」 遠くで、誰かが笑った気がした。知らないはずの声なのに、なつかしい。'],
      ['', '', 'ミーナが仲間になった。']
    ],
    aria_voice: [
      ['', '', '耳の奥の旋律に、知らない声が重なった。'],
      ['?', '', '……きこえる？'],
      ['mina', 'sad', '今の、聞こえた？ ……歌っていたわ。誰かが、もっと下で']
    ],
    aria_meet: [
      ['', '', '暴君が崩れた跡に、小さな光が浮かんでいた。光はやがて、少女の形になった。'],
      ['aria', 'normal', '……やっと、みつけた'],
      ['aria', 'smile', 'あなたの歌。ずっと、きこえてた'],
      ['mina', 'sad', 'あなた……人じゃない、のね'],
      ['aria', 'sad', 'わからない。なまえも、ない。……でも、うたは、ある'],
      ['', '', '少女は光の粒になって消えた。「したで、まってる」という声だけを残して。'],
      ['', '', '光がまぶしくて、思わず目もとに手をやった。……そこに、透明な板が二枚あった気がする。世界はいつも、レンズの向こうにあった。']
    ],
    aria_join: [
      ['aria', 'smile', 'また、あえた'],
      ['aria', 'normal', 'ここから先、ひとりだと、さむい。……いっしょに、いく'],
      ['mina', 'smile', '名前がないなら、呼び名を決めましょう。あなたの歌から生まれた子だもの。――アリア、はどう？'],
      ['aria', 'smile', 'アリア。……すき'],
      ['', '', 'アリアが仲間になった。']
    ],
    story_b30: [
      ['aria', 'sad', 'ここ、しってる。むかし、だれかが、ここで、うたってた'],
      ['mina', 'normal', '墓所の石板……「歌は、底へ還る」。あれはきっと、この子のことね'],
      ['aria', 'normal', 'わたし、だれかの、うたのつづき。……だれの？'],
      ['', '', '石板の隅に、子どもの落書きのような絵があった。なだらかな、ふたつの山。――若葉色の服の胸に、同じ絵があった気がする。']
    ],
    story_b40: [
      ['mina', 'sad', '打ち明けるわ。私の家は代々、森の門を見張る「歌守り」だったの'],
      ['mina', 'normal', 'ふたつの魂を持つ旅人が現れたら、底まで送り届けること。それが言い伝えよ'],
      ['mina', 'smile', 'でも今は、言い伝えだから一緒にいるんじゃない。……わかるでしょう？'],
      ['aria', 'smile', 'ミーナ、うそ、へた'],
      ['', '', '山のふもとの公園を、息を切らして走っていた。ゴールの先で、誰かが手を振っていた。――あれは、いつの記憶だろう。']
    ],
    story_b50: [
      ['aria', 'normal', 'さいごの、いっせつ。あそこに、ある'],
      ['aria', 'sad', 'うたがおわったら、わたし、きえる、かも'],
      ['mina', 'sad', '……'],
      ['aria', 'smile', 'でも、いい。あなたの歌が、おわりをもてるなら'],
      ['aria', 'normal', '……ねえ。わたしのうたの、だいめい、おぼえてる？ ならべかえて。そこに、あなたが、いる']
    ],
    mina_t1: [
      ['mina', 'normal', 'トマの目利き箱、実はね……中身を選んでるのはトマ本人なの。内緒よ'],
      ['mina', 'smile', 'ガルドは無口だけど、あなたの剣を研ぐときだけ鼻歌を歌ってるの。気づいてた？']
    ],
    mina_t2: [
      ['mina', 'sad', '受付をしていた頃、帰ってこなかった冒険者もたくさんいたの'],
      ['mina', 'normal', 'だから、あなたが「ただいま」って言うたびに、ほっとしてた'],
      ['mina', 'smile', '……今は隣にいるから、もっと安心ね']
    ],
    mina_t3: [
      ['mina', 'normal', 'あなたの名前、いつか思い出せたら、一番に教えて'],
      ['mina', 'smile', '約束よ。受付係は、名前を覚えるのが仕事なんだから']
    ],
    karen_meet: [
      ['', '', '熱気の向こうで、炎がくるりと回った。踊っている――燃える坑道の真ん中で、ひとりの少女が。'],
      ['karen', 'normal', 'へえ、ここまで降りてくる物好きがいるなんてね。アタシはカレン。見てのとおり、踊り子よ'],
      ['mina', 'sad', 'こんな場所で踊りを？ 危ないわ'],
      ['karen', 'smile', '危ないから踊るの！ 炎ってのはね、怖がると噛みつくけど、一緒に踊れば味方になるんだから'],
      ['karen', 'normal', '……アンタの剣、いい音してる。ちょっと先まで、見物させてもらうわ']
    ],
    karen_join: [
      ['karen', 'smile', 'やるじゃない！ アンタと戦ってると、足が勝手にステップ踏んじゃう'],
      ['karen', 'sad', '……実はね、アタシの一座、この坑道の奥で消えたの。火の神様に捧げる舞の途中で'],
      ['karen', 'normal', 'アンタたち、もっと下まで行くんでしょ？ だったら、アタシも行く。みんなの行方、自分の目で確かめたい'],
      ['mina', 'smile', '前に出てくれる仲間は大歓迎よ。……無茶はしないでね'],
      ['karen', 'smile', '無茶は踊り子の特技よ！ よろしく、相棒！'],
      ['', '', 'カレンが仲間になった。']
    ],
    karen_t1: [
      ['karen', 'normal', 'ガルドのおっちゃん、アタシの腕輪を見て「いい細工だ」だって。……あの人に褒められると、なんか照れる'],
      ['karen', 'smile', 'トマには踊りを教えてあげたの。三歩で転んだけど！']
    ],
    karen_t2: [
      ['karen', 'sad', '一座のみんな、ほんとはもう……って、わかってる。わかってるけど'],
      ['karen', 'normal', 'だから、アタシは踊り続ける。みんなの分まで、明るい舞を'],
      ['karen', 'smile', '……アンタの前だと、湿っぽい顔しちゃうな。ナイショね']
    ],
    karen_t3: [
      ['karen', 'normal', 'ねえ、全部終わったら、アタシの舞を一番前で見てよ'],
      ['karen', 'smile', '観客はアンタひとりでいい。……なんてね！ 顔、赤いわよ？']
    ],
    setsuna_meet: [
      ['', '', '凍てついた広間の奥に、氷の玉座があった。そこに座る少女は、まつげまで白く凍っていた。'],
      ['setsuna', 'normal', '……旅の方、ですか。このような場所まで。わたくしはセツナ。氷晶の国の……最後の王女です'],
      ['setsuna', 'sad', '国は百年前、深淵の冷気に呑まれました。わたくしだけが、この玉座で眠り続けていたのです'],
      ['mina', 'sad', '百年……ずっと、ひとりで？'],
      ['setsuna', 'normal', 'ええ。……少し、先までご一緒してもよろしいでしょうか。人の声を、もう少し聞いていたいのです']
    ],
    setsuna_join: [
      ['setsuna', 'smile', 'あなたの剣が氷を砕くたび、胸の奥があたたかくなります。不思議ですね'],
      ['setsuna', 'normal', '決めました。わたくしも参ります。国を呑んだ冷気が、どこから来たのか知りたいのです'],
      ['setsuna', 'sad', '……それに、ひとりの玉座には、もう戻りたくありません'],
      ['karen', 'smile', 'お姫様、よろしく！ 寒かったらアタシにくっついてな！'],
      ['', '', 'セツナが仲間になった。']
    ],
    setsuna_t1: [
      ['setsuna', 'normal', 'トマさんに「お姫様」と呼ばれると、少しくすぐったいです'],
      ['setsuna', 'smile', 'ミーナさんのスープ、百年ぶりの温かい食事でした。……おかわり、してもよろしいでしょうか']
    ],
    setsuna_t2: [
      ['setsuna', 'sad', '眠っている間、ずっと同じ夢を見ていました。誰もいない城で、誰かの足音を待つ夢を'],
      ['setsuna', 'smile', '……あの足音、あなただったのかもしれませんね']
    ],
    setsuna_t3: [
      ['setsuna', 'normal', 'いつか国を取り戻せたら、あなたを城の舞踏会にお招きします'],
      ['setsuna', 'smile', '踊りはカレンさんに習っておきますね。……足を踏んでも、笑わないでください']
    ],
    riko_meet: [
      ['', '', '納骨堂の暗がりで、骸骨がカタカタと鳴った。――襲ってこない。むしろ、何かを守るように立っている。'],
      ['riko', 'sad', 'ひぅっ!? ご、ごめんなさい、ごめんなさい！ この子たち、悪い子じゃないんです……！'],
      ['riko', 'normal', 'り、リコです。死霊術師、です……いちおう。この子はホネ吉。いちばんの、お友だち'],
      ['mina', 'smile', '大丈夫よ、怖がらないで。……骸骨さんも、ね'],
      ['riko', 'smile', 'え、えへへ……ホネ吉、ほめられたね']
    ],
    riko_join: [
      ['riko', 'normal', 'あ、あの！ ……この下の階、すっごく怖いおばけがいるんです。この子たちも、おびえてて'],
      ['riko', 'sad', 'リコ、ずっと逃げてばっかりで……でも、みなさんと一緒なら、ちょっとだけ、がんばれそうで'],
      ['riko', 'smile', 'つ、連れていってください！ おばけのお友だち、すっごく働き者なので！'],
      ['aria', 'smile', 'ホネ吉、いいおと。カタカタ'],
      ['', '', 'リコが仲間になった。']
    ],
    riko_t1: [
      ['riko', 'normal', 'ガルドさんに、ホネ吉の歯を磨くブラシを作ってもらいました……！'],
      ['riko', 'smile', 'ホネ吉、ぴかぴか。……えへへ']
    ],
    riko_t2: [
      ['riko', 'sad', '村では「気味が悪い」って言われてました。おばけと話せるの、リコだけだったから'],
      ['riko', 'normal', 'でも、みなさんは、ホネ吉にも「おはよう」って言ってくれる'],
      ['riko', 'smile', '……リコ、ここにいて、いいんですよね？']
    ],
    riko_t3: [
      ['riko', 'normal', 'も、もしリコがおばけになっても、あなたのそばに出ますね'],
      ['riko', 'sad', 'あっ、ち、違うんです！ 怖い意味じゃなくて！ ……ずっと一緒って意味で……ひぅぅ']
    ],
    nefi_meet: [
      ['', '', '砂に埋もれた祭壇で、ひとりの巫女がすやすやと眠っていた。太陽の杖を、大事そうに抱えたまま。'],
      ['nefi', 'normal', 'ふわぁ……。ラ・メス、旅のひと。……あ、「こんにちは」のことです'],
      ['nefi', 'smile', 'ネフェルティ……ネフィと呼んでください。この神殿の、お留守番なのです'],
      ['setsuna', 'normal', 'お留守番……？ 神殿の方々は、どちらに？'],
      ['nefi', 'sad', '……みんな、砂といっしょに、もっと下へ。ネフィは、ずっと待っているのです']
    ],
    nefi_join: [
      ['nefi', 'normal', 'あなたたちの足音は、太陽みたいにあったかいのです'],
      ['nefi', 'smile', '待つのは、もうおしまい。ネフィも、みんなを迎えに行くのです。……ハト・ネブ（よろしくおねがいします）'],
      ['riko', 'smile', 'ね、ネフィさんの杖、きらきらしてて、おばけたちも喜んでます……！'],
      ['', '', 'ネフィが仲間になった。']
    ],
    nefi_t1: [
      ['nefi', 'normal', 'トマの箱から、むかしの神殿の飾りが出てきたのです。……おいくらで売ってたのかは、聞かないのです'],
      ['nefi', 'smile', 'ふわぁ。……おひるねの時間なのです']
    ],
    nefi_t2: [
      ['nefi', 'sad', 'ネフィ、みんなの顔を、少しずつ忘れてきているのです。待ちすぎて'],
      ['nefi', 'normal', 'だから、あなたたちの顔は、毎日ちゃんと見るのです。忘れないように'],
      ['nefi', 'smile', '……じーっ。今日もいいお顔なのです']
    ],
    nefi_t3: [
      ['nefi', 'normal', '古いことばで「セネブ」は「あなたが元気でありますように」という意味なのです'],
      ['nefi', 'smile', 'セネブ。……毎朝、あなたに言うことにしたのです']
    ],
    yuzu_meet: [
      ['', '', '毒の霧が、ある一角だけ晴れていた。湯気の立つ鍋をかき混ぜる少女がいる。'],
      ['yuzu', 'normal', 'あー、そこ踏まないで。霧よけの薬、まいてあるから。……で、アンタたち誰？ 遭難者？'],
      ['yuzu', 'smile', 'アタシはユズ、薬師。この霧の毒、薬の材料として優秀なんだよね。だから住んでる'],
      ['mina', 'sad', '住んで……!? 体は大丈夫なの？'],
      ['yuzu', 'normal', '平気平気。自分で作った解毒薬、毎朝飲んでるし。……アンタたちの顔色の方が心配だわ']
    ],
    yuzu_join: [
      ['yuzu', 'normal', 'はいはい、わかった。そんなボロボロで下に行くって言うなら、ついてってあげる'],
      ['yuzu', 'sad', '……昔、薬が間に合わなくて、助けられなかった人がいるんだ。もう、ああいうのはごめんなの'],
      ['yuzu', 'smile', 'だから感謝しなさいよ？ 薬代はツケにしといてあげる'],
      ['riko', 'smile', 'ゆ、ユズさんの薬、ホネ吉もぴかぴかになりました……！'],
      ['', '', 'ユズが仲間になった。']
    ],
    yuzu_t1: [
      ['yuzu', 'normal', 'トマに頼まれて「若返りの薬」作ったら、トマが子どもになりかけた。……今のは聞かなかったことに'],
      ['yuzu', 'smile', 'ガルドのおっさんの腰痛の薬は自信作。毎晩取りに来るんだよね、あの人']
    ],
    yuzu_t2: [
      ['yuzu', 'sad', '助けられなかったの、アタシの姉さん。病気でさ。アタシが薬師になったの、それから'],
      ['yuzu', 'normal', '……アンタが無茶して帰ってくると、ちょっと腹が立つ。なんでかわかる？'],
      ['yuzu', 'smile', 'わかんないならいい。はい、薬。飲んで']
    ],
    yuzu_t3: [
      ['yuzu', 'normal', '全部終わったら、森のキャンプに薬屋を開こうと思って'],
      ['yuzu', 'smile', '常連第一号はアンタね。……ツケ、まだ残ってるから逃がさないよ']
    ],
    luna_meet: [
      ['', '', '血の色の回廊の奥、壊れた玉座の上で、少女が足をぶらぶらさせていた。'],
      ['luna', 'normal', '無礼者！ このルナ様の回廊に、断りもなく足を踏み入れるなんて！'],
      ['luna', 'sad', '……って、久しぶりのお客なのだわ。べ、別に寂しかったわけじゃないのだわ！'],
      ['karen', 'smile', 'わかりやすっ'],
      ['luna', 'smile', 'こ、この子はコウモリのクロ。わらわの……じゃなくて、ルナ様の一の家来なのだわ']
    ],
    luna_join: [
      ['luna', 'normal', 'ふん。おまえたち、なかなかやるのだわ。特別に、ルナ様の家来にしてあげてもいいのだわ'],
      ['luna', 'sad', '……ほんとはね、この回廊にずっとひとりで、誰も来なくて。紅い月を見上げてばかりいたのだわ'],
      ['luna', 'smile', 'だから……つ、連れていきなさい！ 置いていったら、泣いちゃうのだわ！'],
      ['setsuna', 'smile', 'ひとりの玉座の寂しさは、わたくしもよく知っています。ご一緒しましょう'],
      ['', '', 'ルナが仲間になった。']
    ],
    luna_t1: [
      ['luna', 'normal', 'ミーナのトマトスープ、悪くないのだわ。血みたいに赤くて、とってもおいしいのだわ'],
      ['luna', 'smile', 'クロはアリアの歌が好きみたい。ルナ様の家来なのに、浮気なのだわ']
    ],
    luna_t2: [
      ['luna', 'sad', '吸血鬼は、人に怖がられるもの。……ずっと、そう教えられてきたのだわ'],
      ['luna', 'normal', 'でも、おまえはルナ様のこと、一度も怖がらなかったのだわ'],
      ['luna', 'smile', '……ほめてあげる。頭、なでてあげてもいいのだわ']
    ],
    luna_t3: [
      ['luna', 'normal', '紅い月の夜には、吸血鬼は一番大事な人の名前を呼ぶのだわ'],
      ['luna', 'smile', 'おまえ、名前がないのでしょう？ ……だったら、思い出すまでルナ様が「家来」って呼んであげるのだわ']
    ],
    shion_meet: [
      ['', '', '何もない淵に、ひとりの騎士が立っていた。剣を地に突き、誰かを待つように。'],
      ['shion', 'normal', '……シオン。騎士だ。……それ以外は、思い出せない'],
      ['aria', 'normal', 'あなたも、きおく、ないの？'],
      ['shion', 'normal', '……ああ。だが、この先に行かせてはならないものがあることだけは、覚えている'],
      ['shion', 'smile', '……おまえたちの剣は、まっすぐだ。少し、見届けさせてくれ']
    ],
    shion_join: [
      ['shion', 'normal', '……決めた。おまえたちの盾になる'],
      ['shion', 'sad', '守るべき誰かがいた気がする。顔も、名前も、思い出せないが'],
      ['shion', 'smile', '……だから今は、目の前の仲間を守る。それで、いい'],
      ['luna', 'smile', 'む、無口な家来が増えたのだわ。よろしくなのだわ！'],
      ['', '', 'シオンが仲間になった。']
    ],
    shion_t1: [
      ['shion', 'normal', '……ガルドに、剣の手入れを教わった。……うまい、と言われた'],
      ['shion', 'smile', '……うれしかった。……これは、皆には言うな']
    ],
    shion_t2: [
      ['shion', 'sad', '……夢を見た。小さな手を引いて、星の下を歩く夢だ'],
      ['shion', 'normal', '……あの手が誰のものか、この淵の先で、わかる気がする']
    ],
    shion_t3: [
      ['shion', 'normal', '……記憶が戻っても、戻らなくても'],
      ['shion', 'smile', '……私は、おまえの騎士だ。……それだけは、忘れない']
    ],
    stella_meet: [
      ['', '', '星が終わる場所。崩れた天文台で、少女が空のない天井を見上げていた。'],
      ['stella', 'normal', 'あ、来た来た！ 星がね、今日あなたたちが来るって言ってたの。ステラだよ'],
      ['shion', 'sad', '……ステラ。……その名前を、私は知っている気がする'],
      ['stella', 'smile', 'ふふ、ほんと？ 星読みは、会う人みんなと、どこかでつながってるんだよ'],
      ['aria', 'sad', 'このばしょ、さいごのうたの、すぐそば']
    ],
    stella_join: [
      ['stella', 'normal', 'あのね、星がずっと同じことを言ってるの。「歌の終わりに、二つの魂が出会う」って'],
      ['stella', 'sad', 'それがどういう意味か、ステラにもまだ読めないんだ。……ちょっと、こわい'],
      ['stella', 'smile', 'だから、一緒に確かめに行く！ 最後の星まで、ちゃんと見届けるね'],
      ['shion', 'smile', '……ステラは、私が守る。……なぜか、そう決まっている気がする'],
      ['stella', 'normal', 'それとね、あなたの名前、星の並びに隠れてるの。文字が六つ。……でも、順番がばらばら'],
      ['', '', 'ステラが仲間になった。']
    ],
    stella_t1: [
      ['stella', 'normal', 'トマの今日の運勢、「大当たりの箱を開ける」だって。……トマ、すっごい顔で箱を並べてたよ'],
      ['stella', 'smile', 'あなたの運勢？ ふふ、ナイショ。いいことだよ']
    ],
    stella_t2: [
      ['stella', 'sad', '星読みって、ときどき、見たくない未来も見えちゃうの'],
      ['stella', 'normal', 'でもね、星の光って何百年も前の光なんだよ。だから未来は、まだ変えられるの'],
      ['stella', 'smile', '……あなたと一緒なら、きっと変えられる']
    ],
    stella_t3: [
      ['stella', 'normal', 'あなたの星、ずっと探してたんだ。空のどこにもなくて'],
      ['stella', 'smile', 'わかった。あなたの星は、ここにあったんだね。……みんなの真ん中に']
    ],
    aria_t1: [
      ['aria', 'normal', 'ミーナのごはん、あたたかい。……あたたかい、すき'],
      ['aria', 'smile', 'あなたの剣のおと、たのしい。ちゃん、ちゃん、って']
    ],
    aria_t2: [
      ['aria', 'sad', 'ゆめ、みた。そらがあって、だれかが、わらってた'],
      ['aria', 'normal', 'あれ、あなたの、きおく？']
    ],
    aria_t3: [
      ['aria', 'smile', 'あなたのうた、ぜんぶ、おぼえた'],
      ['aria', 'normal', 'だから、あなたがわすれても、わたしが、うたってあげる']
    ]
  };
  // memory fragments: the hero's real name, one letter per story beat, in scrambled order (the ending reveals it)
  const MEMO = { mina_join: 'や', aria_meet: 'ゆ', story_b30: 'た', story_b40: 'う', stella_join: 'ろ', story_b50: 'ひ' };
  const MEMO_N = Object.keys(MEMO).length;
  function memoList() { if (!Array.isArray(prog.memo)) prog.memo = []; return prog.memo; }
  function memoGain(key) {
    const ch = MEMO[key], L = memoList();
    if (!ch || L.includes(ch)) return;
    L.push(ch);
    setTimeout(() => toast('記憶のかけら「' + ch + '」を思い出した（' + L.length + '/' + MEMO_N + '）'), 600);
  }
  const TALKS = { mina: [['mina_t1', 2], ['mina_t2', 5], ['mina_t3', 8]], aria: [['aria_t1', 2], ['aria_t2', 5], ['aria_t3', 8]], karen: [['karen_t1', 2], ['karen_t2', 5], ['karen_t3', 8]],
    setsuna: [['setsuna_t1', 2], ['setsuna_t2', 5], ['setsuna_t3', 8]], riko: [['riko_t1', 2], ['riko_t2', 5], ['riko_t3', 8]], nefi: [['nefi_t1', 2], ['nefi_t2', 5], ['nefi_t3', 8]],
    yuzu: [['yuzu_t1', 2], ['yuzu_t2', 5], ['yuzu_t3', 8]], luna: [['luna_t1', 2], ['luna_t2', 5], ['luna_t3', 8]], shion: [['shion_t1', 2], ['shion_t2', 5], ['shion_t3', 8]], stella: [['stella_t1', 2], ['stella_t2', 5], ['stella_t3', 8]] };
  const HERO_E = {};
  let talkQ = [], talkCur = null, talkI = 0, talkAutoT = 0, heroAuraT = 0, heroKillN = 0;

  function heroS(id) {
    if (!prog.heroines || typeof prog.heroines !== 'object') prog.heroines = {};
    if (!prog.heroines[id]) prog.heroines[id] = { j: false, aff: 0, seen: [], out: true, ult: 0 };
    return prog.heroines[id];
  }
  function storySeen() { if (!Array.isArray(prog.story)) prog.story = []; return prog.story; }
  function heroJoined(id) { return heroS(id).j; }
  function heroOut() { return HERO_IDS.filter((id) => heroS(id).j && heroS(id).out !== false).slice(0, HERO_MAX_OUT); }
  // a new heroine always comes along; if the party is full, the longest-serving one (never Mina) takes a rest
  function heroJoin(id) {
    const S = heroS(id); S.j = true; S.out = true;
    const others = HERO_IDS.filter((x) => x !== id && heroS(x).j && heroS(x).out !== false), joined = (x) => storySeen().indexOf(x + '_join');
    let msg = '';
    if (others.length >= HERO_MAX_OUT) { const b = others.filter((x) => x !== 'mina').sort((p, q) => joined(p) - joined(q))[0]; heroS(b).out = false; msg = HEROINES[b].name + 'は休憩へ'; }
    toast(HEROINES[id].name + 'が仲間に！' + (msg ? '　' + msg + '（同行は3人まで）' : '')); sfx('level');
  }
  function affLv(id) { return Math.min(AFF_MAX, Math.floor(heroS(id).aff / AFF_STEP)); }
  function heroPow(id) { return 1 + 0.06 * affLv(id); }
  function heroAtkMul() { return (heroOut().includes('aria') ? 1.12 + 0.01 * affLv('aria') : 1) * (player.ariaSongT > 0 ? 1.3 : 1); }
  function heroGuard(dmg) {
    if (player.minaShieldT > 0) dmg = Math.round(dmg * 0.6);
    if (player.setsunaT > 0) dmg = Math.round(dmg * 0.7);
    if (heroOut().includes('shion')) dmg = Math.round(dmg * 0.9);
    if (player.nefiT > 0 && dmg >= player.hp) dmg = Math.max(0, Math.ceil(player.hp) - 1); // the prayer leaves 1 HP
    return dmg;
  }

  /* ---------- art ---------- */
  const heroImgs = {};
  function heroArt(key) {
    const src = window.__HEROINE_ART && window.__HEROINE_ART[key];
    if (!src) return null;
    let im = heroImgs[key];
    if (!im) { im = heroImgs[key] = new Image(); im.onload = heroArtLoaded; im.src = src; }
    return im.complete && im.naturalWidth ? im : null;
  }
  // images decode asynchronously: start them at boot, and redraw open portraits once one arrives
  function heroArtPreload() { for (const k in (window.__HEROINE_ART || {})) heroArt(k); }
  function heroArtLoaded() {
    if (talkCur) talkShow();
    const b = $('heroBtn'); if (b) b.dataset.id = '';
  }
  // placeholder: a simple chibi drawn in code with each heroine's palette
  function drawHeroinePH(g, id, x, y, s, t, faceLeft, expr) {
    const H = HEROINES[id];
    g.save(); g.translate(x, y); if (faceLeft) g.scale(-1, 1);
    const bob = Math.sin(t * 3) * 1.2 * s;
    g.lineJoin = 'round'; g.strokeStyle = 'rgba(30,20,40,0.55)'; g.lineWidth = 1.1 * s;
    // dress / robe
    const dg = g.createLinearGradient(0, -22 * s, 0, 0); dg.addColorStop(0, H.cloth[0]); dg.addColorStop(1, H.cloth[1]);
    g.fillStyle = dg; g.beginPath(); g.moveTo(-9 * s, 0); g.lineTo(-5 * s, -20 * s + bob); g.lineTo(5 * s, -20 * s + bob); g.lineTo(9 * s, 0); g.closePath(); g.fill(); g.stroke();
    // back hair
    const hg = g.createLinearGradient(0, -44 * s, 0, -10 * s); hg.addColorStop(0, H.hair[0]); hg.addColorStop(1, H.hair[1]);
    g.fillStyle = hg;
    if (id === 'aria') { g.beginPath(); g.ellipse(0, -24 * s + bob, 12 * s, 18 * s, 0, 0, TAU); g.fill(); }
    else { g.beginPath(); g.ellipse(-1 * s, -31 * s + bob, 11 * s, 11 * s, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(9 * s, -16 * s + bob, 3 * s, 9 * s, 0.2, 0, TAU); g.fill(); }
    // face
    g.fillStyle = '#ffe8dc'; g.beginPath(); g.arc(0, -31 * s + bob, 9.5 * s, 0, TAU); g.fill(); g.stroke();
    // bangs
    g.fillStyle = hg; g.beginPath(); g.moveTo(-10 * s, -31 * s + bob); g.quadraticCurveTo(-9 * s, -43 * s + bob, 0, -42 * s + bob); g.quadraticCurveTo(10 * s, -43 * s + bob, 10 * s, -31 * s + bob); g.quadraticCurveTo(4 * s, -37 * s + bob, -2 * s, -34 * s + bob); g.quadraticCurveTo(-6 * s, -37 * s + bob, -10 * s, -31 * s + bob); g.fill();
    // eyes
    const ey = -30 * s + bob;
    if (expr === 'smile') { g.strokeStyle = '#2a1a2a'; g.lineWidth = 1.4 * s; for (const ex of [-3.6, 3.6]) { g.beginPath(); g.arc(ex * s, ey + 0.8 * s, 1.8 * s, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); } }
    else { for (const ex of [-3.6, 3.6]) { g.fillStyle = H.eye; g.beginPath(); g.ellipse(ex * s, ey, 1.7 * s, 2.3 * s, 0, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(ex * s + 0.6 * s, ey - 0.9 * s, 0.7 * s, 0, TAU); g.fill(); } }
    if (expr === 'sad') { g.strokeStyle = '#2a1a2a'; g.lineWidth = 1 * s; g.beginPath(); g.moveTo(-5.5 * s, ey - 3.6 * s); g.lineTo(-2 * s, ey - 4.4 * s); g.moveTo(5.5 * s, ey - 3.6 * s); g.lineTo(2 * s, ey - 4.4 * s); g.stroke(); }
    g.fillStyle = 'rgba(255,120,140,0.35)'; g.beginPath(); g.ellipse(-5.5 * s, ey + 3 * s, 2 * s, 1.1 * s, 0, 0, TAU); g.ellipse(5.5 * s, ey + 3 * s, 2 * s, 1.1 * s, 0, 0, TAU); g.fill();
    // accessory
    if (id === 'mina') { g.strokeStyle = '#8a5a2a'; g.lineWidth = 1.6 * s; g.beginPath(); g.moveTo(11 * s, 0); g.lineTo(13 * s, -30 * s + bob); g.stroke(); g.fillStyle = '#9ee08a'; g.beginPath(); g.ellipse(13 * s, -32 * s + bob, 3 * s, 2 * s, 0.5, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,230,140,0.9)'; g.beginPath(); g.arc(13.5 * s, -29 * s + bob, 1.4 * s, 0, TAU); g.fill(); }
    else { g.fillStyle = '#ffe28a'; g.beginPath(); g.arc(7 * s, -40 * s + bob, 1.8 * s, 0, TAU); g.fill(); g.fillRect(8.4 * s, -46 * s + bob, 0.9 * s, 6 * s); }
    g.restore();
  }
  function drawBust(g, id, w, h, expr) {
    const im = heroArt(id + '_bust_' + (expr || 'normal')) || heroArt(id + '_bust_normal');
    g.clearRect(0, 0, w, h);
    if (im) { const k = Math.min(w / im.naturalWidth, h / im.naturalHeight); g.drawImage(im, (w - im.naturalWidth * k) / 2, h - im.naturalHeight * k, im.naturalWidth * k, im.naturalHeight * k); }
    else drawHeroinePH(g, id, w / 2, h * 0.98, h / 50, 0.3, false, expr);
  }

  /* ---------- field ---------- */
  function heroEnt(id) {
    let E = HERO_E[id];
    if (!E) E = HERO_E[id] = { isHeroine: true, hid: id, x: player.x, y: player.y, atkT: 1, anim: Math.random() * 5, faceLeft: false, moving: false, map: -1, sk: 0 };
    return E;
  }
  function heroUpdate(dt) {
    for (const k of ['minaShieldT', 'ariaSongT', 'karenDanceT', 'setsunaT', 'nefiT']) if (player[k] > 0) player[k] = Math.max(0, player[k] - dt);
    const out = heroOut();
    out.forEach((id, i) => heroStep(id, heroEnt(id), i, dt));
    if (autoOn() && !paused && !player.dead) for (const id of out) if (heroS(id).ult >= ULT_NEED && nearest(player.x, player.y, 5, null)) { heroUlt(id); break; }
  }
  function heroStep(id, E, idx, dt) {
    E.anim += dt;
    if (E.map !== curMap || hyp(E.x - player.x, E.y - player.y) > 14) { E.map = curMap; E.x = player.x - 0.8 + idx * 1.6; E.y = player.y + 0.8; }
    const fight = !player.dead && !inCamp(player.x, player.y) ? nearest(player.x, player.y, 7, null) : null;
    const back = [[-1.3, 1.1], [1.1, 1.3], [0.2, 1.9], [-1.9, 0.1], [1.9, -0.1], [-0.6, 2.5], [1.4, 2.4], [-2.2, 1.6], [2.4, 0.9], [-1.0, -1.2]][idx % 10];
    // the dancer fights in front, inside the pack; the others stay behind the hero
    const front = (id === 'karen' || id === 'shion') && fight && hyp(fight.x - player.x, fight.y - player.y) < 5;
    const tx = front ? fight.x + (player.x - fight.x) * 0.25 : player.x + back[0] * (fight ? 1.6 : 1);
    const ty = front ? fight.y + (player.y - fight.y) * 0.25 : player.y + back[1] * (fight ? 1.6 : 1);
    const dx = tx - E.x, dy = ty - E.y, d = hyp(dx, dy), sp = Math.max(3.6, D.speed * 1.2);
    E.moving = d > 0.2;
    if (E.moving) { const st = Math.min(d, sp * dt); E.x += dx / d * st; E.y += dy / d * st; if (Math.abs(dx - dy) > 0.02) E.faceLeft = (dx - dy) < 0; }
    if (player.dead) return;
    E.atkT -= dt; E.sk -= dt;
    const pw = heroPow(id) * petDmgMul() * HERO_DMG;
    if (id === 'mina') {
      if (player.hp < D.maxHp * 0.35 && E.sk <= 0) { E.sk = 25; player.minaShieldT = 4; addVfx({ k: 'ring', x: player.x, y: player.y, R: 1.6, c: '140,230,160', w: 6, life: 0.5 }); addText(E.x, E.y, '結界！', 'heal', 70); }
      if (E.atkT > 0) return;
      E.atkT = 1.6;
      if (player.hp < D.maxHp * 0.85) { const amt = Math.round(D.maxHp * 0.02 * heroPow(id)); player.hp = Math.min(D.maxHp, player.hp + amt); burst(player.x, player.y, 20, 'heal', 6, 'mint', 1.2); return; }
      if (fight) { faceE(E, fight); shots.push({ x: E.x, y: E.y, h: 36, tgt: fight, dmg: D.atk * 0.7 * pw, sp: 11, trail: [], col: 'mint' }); }
    } else if (id === 'setsuna' || id === 'nefi') {
      if (E.atkT > 0 || !fight) return;
      E.atkT = id === 'setsuna' ? 1.5 : 1.7; faceE(E, fight);
      shots.push({ x: E.x, y: E.y, h: 36, tgt: fight, dmg: D.atk * (id === 'setsuna' ? 0.75 : 0.8) * pw, sp: 12, trail: [], col: id === 'setsuna' ? 'cyan' : 'gold', ctx: { dmg: 1, crit: 0, leech: 0, el: id === 'setsuna' ? 'ice' : null } });
    } else if (id === 'riko') {
      if (E.atkT > 0 || !fight) return;
      E.atkT = 2.0; faceE(E, fight);
      // a ghost friend hops from enemy to enemy
      let cur = fight, n = 0; const hit = new Set();
      withEl('volt', () => {
        while (cur && n < 3) {
          hit.add(cur); hitEnemy(cur, D.atk * 0.65 * pw); addVfx({ k: 'ring', x: cur.x, y: cur.y, R: 0.9, c: '190,160,255', w: 4, life: 0.35 });
          n++; const c0 = cur; cur = enemies.filter((e) => !e.dead && !hit.has(e) && hyp(e.x - c0.x, e.y - c0.y) < 3.5).sort((a, b) => hyp(a.x - c0.x, a.y - c0.y) - hyp(b.x - c0.x, b.y - c0.y))[0];
        }
      });
    } else if (id === 'yuzu' || id === 'stella') {
      if (E.atkT > 0 || !fight) return;
      E.atkT = id === 'yuzu' ? 1.9 : 2.1; faceE(E, fight);
      // a thrown flask / a falling star: splash damage around the target
      const R = id === 'yuzu' ? 1.6 : 1.4;
      for (const e of enemies) if (!e.dead && hyp(e.x - fight.x, e.y - fight.y) < R) { hitEnemy(e, D.atk * (id === 'yuzu' ? 0.7 : 0.9) * pw); if (id === 'yuzu') { e.weakT = Math.max(e.weakT || 0, 4); e.weakAmt = Math.max(e.weakAmt || 0, 0.2); } }
      addVfx({ k: 'ring', x: fight.x, y: fight.y, R, c: id === 'yuzu' ? '140,230,110' : '255,220,120', w: 5, life: 0.4 });
    } else if (id === 'luna') {
      if (E.atkT > 0 || !fight) return;
      E.atkT = 1.6; faceE(E, fight);
      shots.push({ x: E.x, y: E.y, h: 36, tgt: fight, dmg: D.atk * 0.85 * pw, sp: 13, trail: [], col: 'red', ctx: { dmg: 1, crit: 0, leech: 0, el: null } });
      if (player.hp < D.maxHp) player.hp = Math.min(D.maxHp, player.hp + D.maxHp * 0.01);
    } else if (id === 'shion') {
      if (E.atkT > 0 || !fight) return;
      const t = enemies.filter((e) => !e.dead && hyp(e.x - E.x, e.y - E.y) < 2.2)[0];
      if (!t) return;
      E.atkT = 1.4; faceE(E, t);
      hitEnemy(t, D.atk * 1.0 * pw); if (!t.dead && !t.boss) t.stunT = Math.max(t.stunT || 0, 0.3);
      addVfx({ k: 'ring', x: t.x, y: t.y, R: 1, c: '170,140,255', w: 5, life: 0.3 });
    } else if (id === 'karen') {
      if (E.atkT > 0 || !fight) return;
      E.atkT = player.karenDanceT > 0 ? 0.9 : 1.8;
      const hits = enemies.filter((e) => !e.dead && hyp(e.x - E.x, e.y - E.y) < 2.4);
      if (!hits.length) { faceE(E, fight); shots.push({ x: E.x, y: E.y, h: 30, tgt: fight, dmg: D.atk * 0.7 * pw, sp: 12, trail: [], col: 'warm', ctx: { dmg: 1, crit: 0, leech: 0, el: 'fire' } }); return; }
      withEl('fire', () => { for (const e of hits) hitEnemy(e, D.atk * 0.8 * pw); });
      addVfx({ k: 'ring', x: E.x, y: E.y, R: 2.4, c: '255,140,60', w: 6, life: 0.4 });
    } else {
      if (E.atkT > 0 || !fight) return;
      E.atkT = 2.4;
      const hits = enemies.filter((e) => !e.dead && hyp(e.x - E.x, e.y - E.y) < 2.6);
      if (!hits.length) { faceE(E, fight); shots.push({ x: E.x, y: E.y, h: 40, tgt: fight, dmg: D.atk * 0.8 * pw, sp: 12, trail: [], col: 'cyan', ctx: { dmg: 1, crit: 0, leech: 0, el: 'volt' } }); return; }
      withEl('volt', () => { for (const e of hits) hitEnemy(e, D.atk * 0.9 * pw); });
      addVfx({ k: 'ring', x: E.x, y: E.y, R: 2.6, c: '190,170,255', w: 5, life: 0.45 });
    }
  }
  function faceE(E, t) { if (Math.abs((t.x - E.x) - (t.y - E.y)) > 0.02) E.faceLeft = ((t.x - E.x) - (t.y - E.y)) < 0; }
  function drawHeroine(E) {
    const x0 = isoX(E.x, E.y), y0 = isoY(E.x, E.y);
    if (x0 < -60 || x0 > W + 60 || y0 < -80 || y0 > H + 60) return;
    const fl = E.hid === 'aria' ? (10 + Math.sin(E.anim * 2.4) * 3) * zoom : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x0, y0, 11 * zoom, 4.5 * zoom, 0, 0, TAU); ctx.fill();
    const im = heroArt(E.hid + '_chibi');
    if (im) {
      const hgt = 70 * zoom, wd = hgt * im.naturalWidth / im.naturalHeight;
      ctx.save(); ctx.translate(x0, y0 - fl); if (E.faceLeft) ctx.scale(-1, 1); ctx.drawImage(im, -wd / 2, -hgt, wd, hgt); ctx.restore();
    } else drawHeroinePH(ctx, E.hid, x0, y0 - fl, 1.25 * zoom, E.anim, E.faceLeft, 'normal');
    emis.push([{ aria: 'violet', karen: 'warm', setsuna: 'cyan', riko: 'violet', nefi: 'gold', yuzu: 'lime', luna: 'red', shion: 'violet', stella: 'gold' }[E.hid] || 'mint', x0, y0 - fl - 30 * zoom, 26 * zoom, 0.25]);
  }
  function heroOnKill(e) {
    const out = heroOut();
    if (!out.length) return;
    heroKillN++;
    for (const id of out) {
      const S = heroS(id);
      S.ult = Math.min(ULT_NEED, S.ult + (e.boss ? 15 : e.elite ? 3 : 1));
      if (e.boss) S.aff += 3; else if (heroKillN % 25 === 0) S.aff += 1;
    }
  }
  function heroUlt(id) {
    const S = heroS(id);
    if (!S || S.ult < ULT_NEED || paused || player.dead) return;
    S.ult = 0;
    cutIn(id);
    if (id === 'mina') {
      player.hp = Math.min(D.maxHp, player.hp + D.maxHp * 0.6); player.minaShieldT = 6;
      addVfx({ k: 'pillar', x: player.x, y: player.y, c: '140,230,160', life: 1 }); burst(player.x, player.y, 20, 'heal', 30, 'mint', 2);
    } else if (id === 'setsuna') {
      withEl('ice', () => { for (const e of enemies) if (!e.dead && hyp(e.x - player.x, e.y - player.y) < 6) hitEnemy(e, D.atk * 4.5 * heroPow(id) * HERO_ULT); });
      player.setsunaT = 8;
      addVfx({ k: 'ring', x: player.x, y: player.y, R: 6, c: '150,200,255', w: 14, life: 0.8 }); addVfx({ k: 'sflash', c: '200,230,255', a: 0.3, life: 0.5 });
      addShake(8); zoomPunch(0.05);
    } else if (id === 'riko') {
      withEl('volt', () => { for (const e of enemies) if (!e.dead && hyp(e.x - player.x, e.y - player.y) < 7) hitEnemy(e, D.atk * 4 * heroPow(id) * HERO_ULT); });
      player.hp = Math.min(D.maxHp, player.hp + D.maxHp * 0.25);
      addVfx({ k: 'ring', x: player.x, y: player.y, R: 7, c: '180,150,255', w: 12, life: 0.8 }); burst(player.x, player.y, 20, 'heal', 24, 'violet', 2);
      addShake(8); zoomPunch(0.05);
    } else if (id === 'yuzu') {
      player.hp = Math.min(D.maxHp, player.hp + D.maxHp * 0.4);
      prog.potions = Math.min(potMax(), prog.potions + 2);
      for (const e of enemies) if (!e.dead && hyp(e.x - player.x, e.y - player.y) < 6) { e.weakT = 8; e.weakAmt = 0.35; }
      addVfx({ k: 'ring', x: player.x, y: player.y, R: 6, c: '140,230,110', w: 12, life: 0.8 }); burst(player.x, player.y, 20, 'heal', 24, 'lime', 2);
    } else if (id === 'luna') {
      let n = 0;
      for (const e of enemies) if (!e.dead && hyp(e.x - player.x, e.y - player.y) < 6) { hitEnemy(e, D.atk * 5 * heroPow(id) * HERO_ULT); n++; }
      player.hp = Math.min(D.maxHp, player.hp + D.maxHp * Math.min(0.5, 0.05 * n));
      addVfx({ k: 'ring', x: player.x, y: player.y, R: 6, c: '230,40,70', w: 14, life: 0.8 }); addVfx({ k: 'sflash', c: '255,80,100', a: 0.3, life: 0.5 });
      addShake(10); zoomPunch(0.06);
    } else if (id === 'shion') {
      for (const e of enemies) if (!e.dead && hyp(e.x - player.x, e.y - player.y) < 5) { hitEnemy(e, D.atk * 4 * heroPow(id) * HERO_ULT); if (!e.dead) e.stunT = Math.max(e.stunT || 0, e.boss ? 1 : 2.5); }
      addVfx({ k: 'ring', x: player.x, y: player.y, R: 5, c: '170,130,255', w: 14, life: 0.8 }); addVfx({ k: 'sflash', c: '190,160,255', a: 0.3, life: 0.5 });
      addShake(12); zoomPunch(0.06);
    } else if (id === 'stella') {
      const near = enemies.filter((e) => !e.dead && hyp(e.x - player.x, e.y - player.y) < 8);
      for (let i = 0; i < 10 && near.length; i++) { const e = near[Math.floor(Math.random() * near.length)]; if (!e.dead) { hitEnemy(e, D.atk * 2.5 * heroPow(id) * HERO_ULT); addVfx({ k: 'ring', x: e.x, y: e.y, R: 1.2, c: '255,220,120', w: 6, life: 0.5 }); } }
      addVfx({ k: 'sflash', c: '255,240,180', a: 0.35, life: 0.6 }); addShake(10); zoomPunch(0.06);
    } else if (id === 'nefi') {
      for (const e of enemies) if (!e.dead && hyp(e.x - player.x, e.y - player.y) < 6) hitEnemy(e, D.atk * 3.5 * heroPow(id) * HERO_ULT);
      player.nefiT = 10;
      addVfx({ k: 'pillar', x: player.x, y: player.y, c: '255,220,120', life: 1.2 }); addVfx({ k: 'sflash', c: '255,230,160', a: 0.3, life: 0.5 });
      addShake(6); zoomPunch(0.05);
    } else if (id === 'karen') {
      withEl('fire', () => { for (const e of enemies) if (!e.dead && hyp(e.x - player.x, e.y - player.y) < 6) hitEnemy(e, D.atk * 5.5 * heroPow(id) * HERO_ULT); });
      player.karenDanceT = 8;
      addVfx({ k: 'ring', x: player.x, y: player.y, R: 6, c: '255,130,50', w: 14, life: 0.8 }); addVfx({ k: 'sflash', c: '255,170,90', a: 0.3, life: 0.5 });
      burst(player.x, player.y, 20, 'ember', 30, 'warm', 2);
      addShake(10); zoomPunch(0.06);
    } else {
      withEl('volt', () => { for (const e of enemies) if (!e.dead && hyp(e.x - player.x, e.y - player.y) < 7) hitEnemy(e, D.atk * 6 * heroPow(id) * HERO_ULT); });
      player.ariaSongT = 8;
      addVfx({ k: 'ring', x: player.x, y: player.y, R: 7, c: '200,180,255', w: 12, life: 0.8 }); addVfx({ k: 'sflash', c: '220,200,255', a: 0.3, life: 0.5 });
      addShake(10); zoomPunch(0.06);
    }
    sfx('legend');
  }
  // Persona-style cut-in: the heroine slides across a slanted band with the skill name
  function cutIn(id) {
    const H = HEROINES[id], el = $('cutin');
    $('cutinName').textContent = H.ult;
    $('cutinWho').textContent = H.name;
    el.style.setProperty('--cc', H.col);
    const cv = $('cutinCv'); drawBust(cv.getContext('2d'), id, cv.width, cv.height, 'smile');
    el.hidden = false; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    addSlowMo(0.7);
    setTimeout(() => { el.hidden = true; el.classList.remove('on'); }, 1200);
  }

  /* ---------- talk scenes ---------- */
  function playScene(key) {
    if (!SCENES[key]) return;
    talkQ.push(key);
    if (!talkCur) talkNext();
  }
  function talkNext() {
    talkCur = talkQ.shift() || null; talkI = 0;
    if (!talkCur) { $('talkDlg').hidden = true; paused = false; save(); return; }
    paused = true; drag.active = false;
    $('talkDlg').hidden = false;
    talkShow();
  }
  function talkShow() {
    const line = SCENES[talkCur][talkI], who = line[0], H = HEROINES[who];
    $('talkName').textContent = who === '' ? '' : who === '?' ? '？？？' : H.name;
    $('talkName').style.background = H ? H.col : 'transparent';
    $('talkText').textContent = line[2];
    const cv = $('talkCv'), g = cv.getContext('2d');
    if (H) { cv.style.visibility = 'visible'; drawBust(g, who, cv.width, cv.height, line[1]); }
    else cv.style.visibility = 'hidden';
    talkAutoT = 0;
  }
  function talkAdvance() {
    if (!talkCur) return;
    talkI++;
    if (talkI >= SCENES[talkCur].length) { talkDone(talkCur); talkNext(); } else talkShow();
  }
  function talkDone(key) {
    if (!storySeen().includes(key)) storySeen().push(key);
    memoGain(key);
    if (key === 'mina_join') { heroJoin('mina'); toast('ミーナが仲間になった！（「仲間」タブで会話できる）'); }
    for (const id of ['setsuna', 'riko', 'nefi', 'yuzu', 'luna', 'shion', 'stella']) if (key === id + '_join') heroJoin(id);
    if (key === 'karen_join') heroJoin('karen');
    if (key === 'aria_join') heroJoin('aria');
    for (const id of HERO_IDS) for (const [k] of TALKS[id]) if (k === key) { prog.gold += 500 * (1 + affLv(id)); heroS(id).seen.push(k); toast(HEROINES[id].name + 'との距離が縮まった（' + 500 * (1 + affLv(id)) + 'G）'); }
  }
  function talkReady(id) { const S = heroS(id); return S.j ? TALKS[id].find(([k, need]) => affLv(id) >= need && !S.seen.includes(k)) : null; }
  // story beats are checked a few times a second; scenes queue up instead of interrupting each other
  function heroTick(dt) {
    heroAuraT -= dt;
    if (heroAuraT > 0) return;
    heroAuraT = 0.5;
    if (talkCur || paused || player.dead || !$('intro').hidden || OP.on || transit) return;
    const seen = storySeen(), q = qState();
    const once = (k, cond) => { if (!seen.includes(k) && !talkQ.includes(k) && cond) playScene(k); };
    once('mina_join', q.main >= MAINQ_MINA && curMap === 0 && inCamp(player.x, player.y));
    if (curMap === 3 && !WB.on) {
      once('aria_voice', curFloor >= 11 && heroJoined('mina'));
      once('karen_meet', curFloor >= 13 && heroJoined('mina'));
      once('karen_join', curFloor >= 14 && seen.includes('karen_meet') && (curFloor > 14 || stairsOpen));
      once('setsuna_meet', curFloor >= 17 && heroJoined('mina'));
      once('setsuna_join', curFloor >= 18 && seen.includes('setsuna_meet') && (curFloor > 18 || stairsOpen));
      once('riko_meet', curFloor >= 22 && heroJoined('mina'));
      once('riko_join', curFloor >= 23 && seen.includes('riko_meet') && (curFloor > 23 || stairsOpen));
      once('nefi_meet', curFloor >= 27 && heroJoined('mina'));
      once('nefi_join', curFloor >= 28 && seen.includes('nefi_meet') && (curFloor > 28 || stairsOpen));
      for (const [id, f] of [['yuzu', 32], ['luna', 37], ['shion', 42], ['stella', 47]]) {
        once(id + '_meet', curFloor >= f && heroJoined('mina'));
        once(id + '_join', curFloor >= f + 1 && seen.includes(id + '_meet') && (curFloor > f + 1 || stairsOpen));
      }
      once('aria_meet', curFloor >= 15 && seen.includes('aria_voice') && (curFloor > 15 || stairsOpen));
      once('aria_join', curFloor >= 20 && seen.includes('aria_meet') && (curFloor > 20 || stairsOpen));
      once('story_b30', curFloor >= 30 && heroJoined('aria') && (curFloor > 30 || stairsOpen));
      once('story_b40', curFloor >= 40 && heroJoined('aria') && (curFloor > 40 || stairsOpen));
      once('story_b50', curFloor >= 50 && heroJoined('aria'));
    }
  }
  function heroAuto(dt) {
    if (!talkCur || !autoOn()) { talkAutoT = 0; return; }
    talkAutoT += dt;
    if (talkAutoT > 2.6) talkAdvance();
  }

  /* ---------- companion tab section ---------- */
  function heroCards(box) {
    const head = document.createElement('div'); head.className = 'qc';
    head.append(elP('qh', 'ヒロイン（同行 ' + heroOut().length + '/' + HERO_MAX_OUT + '人）'), elP('qr', '一緒に戦うほど好感度が上がり、会話が増える。奥義ゲージがたまると右の顔のボタンで発動（AUTO中は自動）。同行は3人まで。'));
    box.append(head);
    for (const id of HERO_IDS) {
      const H = HEROINES[id], S = heroS(id), c = document.createElement('div'); c.className = 'qc hcard' + (heroOut().includes(id) ? ' on' : '');
      const cv = document.createElement('canvas'); cv.width = 160; cv.height = 200; cv.className = 'pcv hcv';
      const info = document.createElement('div');
      if (!S.j) {
        drawHeroinePH(cv.getContext('2d'), id, 80, 196, 4.2, 0.3, false, 'normal');
        cv.style.filter = 'brightness(0)'; cv.style.opacity = '0.35';
        info.append(elP('qg', '？？？'), elP('qr', '物語を進めると出会える'));
      } else {
        drawBust(cv.getContext('2d'), id, cv.width, cv.height, 'smile');
        info.append(elP('qg', H.name + '　' + H.title), elP('qh', '好感度 Lv' + affLv(id) + (affLv(id) < AFF_MAX ? '（次まで ' + (AFF_STEP - S.aff % AFF_STEP) + '）' : '（最大）') + '　奥義 ' + Math.floor(S.ult / ULT_NEED * 100) + '%'), elP('qr', H.d), elP('qr', '奥義「' + H.ult + '」：' + H.ultD));
        const acts = document.createElement('div'); acts.className = 'ita';
        if (affLv(id) < AFF_MAX) acts.append(elBtn('贈り物：' + GIFTS[id][0] + '（' + giftCost(id).toLocaleString() + 'G）', 'ghost small', () => { if (giveGift(id)) renderPets(); }));
        const tk = talkReady(id);
        if (tk) acts.append(elBtn('話す（新しい話）', 'primary small', () => { closeSheet(); playScene(tk[0]); }));
        const isOut = heroOut().includes(id);
        acts.append(elBtn(isOut ? '休ませる' : '連れて行く', 'ghost small', () => {
          if (!isOut && heroOut().length >= HERO_MAX_OUT) { toast('同行は3人まで。先に誰かを休ませてね'); return; }
          S.out = !isOut; save(); renderPets();
        }));
        info.append(acts);
      }
      c.append(cv, info);
      box.append(c);
    }
  }
  function heroHud() {
    const b = $('heroBtn'), out = heroOut(), id = out.find((x) => heroS(x).ult >= ULT_NEED) || out[0];
    if (!id) { if (!b.hidden) b.hidden = true; return; }
    if (b.hidden) b.hidden = false;
    const pct = heroS(id).ult / ULT_NEED;
    if (b.dataset.id !== id) { b.dataset.id = id; const cv = $('heroBtnCv'); drawBust(cv.getContext('2d'), id, cv.width, cv.height, 'normal'); b.setAttribute('aria-label', HEROINES[id].name + 'の奥義「' + HEROINES[id].ult + '」'); }
    b.style.setProperty('--ult', String(pct));
    b.classList.toggle('ready', pct >= 1);
  }
