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
    }
  };
  const HERO_IDS = Object.keys(HEROINES);
  const AFF_STEP = 30, AFF_MAX = 10, ULT_NEED = 60;
  // scenes: [speaker, expression, text]; speaker '' = narration, '?' = an unseen voice
  const SCENES = {
    mina_join: [
      ['mina', 'normal', 'おかえりなさい。B10Fの番人、本当に越えたのね'],
      ['mina', 'smile', '……決めたわ。受付はトマに任せる。私も一緒に行く'],
      ['', '', 'トマが「えっ、ボクが!?」と声を上げた。ガルドは黙って、ミーナの杖に油を差した。'],
      ['mina', 'sad', 'あなたの歌が、底へ呼ばれている気がするの。ひとりで行かせたくない'],
      ['mina', 'smile', '回復は任せて。前に出るのはあなたの役目よ'],
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
      ['', '', '少女は光の粒になって消えた。「したで、まってる」という声だけを残して。']
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
      ['aria', 'normal', 'わたし、だれかの、うたのつづき。……だれの？']
    ],
    story_b40: [
      ['mina', 'sad', '打ち明けるわ。私の家は代々、森の門を見張る「歌守り」だったの'],
      ['mina', 'normal', 'ふたつの魂を持つ旅人が現れたら、底まで送り届けること。それが言い伝えよ'],
      ['mina', 'smile', 'でも今は、言い伝えだから一緒にいるんじゃない。……わかるでしょう？'],
      ['aria', 'smile', 'ミーナ、うそ、へた']
    ],
    story_b50: [
      ['aria', 'normal', 'さいごの、いっせつ。あそこに、ある'],
      ['aria', 'sad', 'うたがおわったら、わたし、きえる、かも'],
      ['mina', 'sad', '……'],
      ['aria', 'smile', 'でも、いい。あなたの歌が、おわりをもてるなら']
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
  const TALKS = { mina: [['mina_t1', 2], ['mina_t2', 5], ['mina_t3', 8]], aria: [['aria_t1', 2], ['aria_t2', 5], ['aria_t3', 8]], karen: [['karen_t1', 2], ['karen_t2', 5], ['karen_t3', 8]] };
  const HERO_E = {};
  let talkQ = [], talkCur = null, talkI = 0, talkAutoT = 0, heroAuraT = 0, heroKillN = 0;

  function heroS(id) {
    if (!prog.heroines || typeof prog.heroines !== 'object') prog.heroines = {};
    if (!prog.heroines[id]) prog.heroines[id] = { j: false, aff: 0, seen: [], out: true, ult: 0 };
    return prog.heroines[id];
  }
  function storySeen() { if (!Array.isArray(prog.story)) prog.story = []; return prog.story; }
  function heroJoined(id) { return heroS(id).j; }
  function heroOut() { return HERO_IDS.filter((id) => heroS(id).j && heroS(id).out !== false); }
  function affLv(id) { return Math.min(AFF_MAX, Math.floor(heroS(id).aff / AFF_STEP)); }
  function heroPow(id) { return 1 + 0.06 * affLv(id); }
  function heroAtkMul() { return (heroOut().includes('aria') ? 1.12 + 0.01 * affLv('aria') : 1) * (player.ariaSongT > 0 ? 1.3 : 1); }
  function heroGuard(dmg) { return player.minaShieldT > 0 ? Math.round(dmg * 0.6) : dmg; }

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
    for (const k of ['minaShieldT', 'ariaSongT', 'karenDanceT']) if (player[k] > 0) player[k] = Math.max(0, player[k] - dt);
    const out = heroOut();
    out.forEach((id, i) => heroStep(id, heroEnt(id), i, dt));
    if (autoOn() && !paused && !player.dead) for (const id of out) if (heroS(id).ult >= ULT_NEED && nearest(player.x, player.y, 5, null)) { heroUlt(id); break; }
  }
  function heroStep(id, E, idx, dt) {
    E.anim += dt;
    if (E.map !== curMap || hyp(E.x - player.x, E.y - player.y) > 14) { E.map = curMap; E.x = player.x - 0.8 + idx * 1.6; E.y = player.y + 0.8; }
    const fight = !player.dead && !inCamp(player.x, player.y) ? nearest(player.x, player.y, 7, null) : null;
    const back = [[-1.3, 1.1], [1.1, 1.3], [0.2, 1.9]][idx % 3];
    // the dancer fights in front, inside the pack; the others stay behind the hero
    const front = id === 'karen' && fight && hyp(fight.x - player.x, fight.y - player.y) < 5;
    const tx = front ? fight.x + (player.x - fight.x) * 0.25 : player.x + back[0] * (fight ? 1.6 : 1);
    const ty = front ? fight.y + (player.y - fight.y) * 0.25 : player.y + back[1] * (fight ? 1.6 : 1);
    const dx = tx - E.x, dy = ty - E.y, d = hyp(dx, dy), sp = Math.max(3.6, D.speed * 1.2);
    E.moving = d > 0.2;
    if (E.moving) { const st = Math.min(d, sp * dt); E.x += dx / d * st; E.y += dy / d * st; if (Math.abs(dx - dy) > 0.02) E.faceLeft = (dx - dy) < 0; }
    if (player.dead) return;
    E.atkT -= dt; E.sk -= dt;
    const pw = heroPow(id) * petDmgMul();
    if (id === 'mina') {
      if (player.hp < D.maxHp * 0.35 && E.sk <= 0) { E.sk = 25; player.minaShieldT = 4; addVfx({ k: 'ring', x: player.x, y: player.y, R: 1.6, c: '140,230,160', w: 6, life: 0.5 }); addText(E.x, E.y, '結界！', 'heal', 70); }
      if (E.atkT > 0) return;
      E.atkT = 1.6;
      if (player.hp < D.maxHp * 0.85) { const amt = Math.round(D.maxHp * 0.03 * heroPow(id)); player.hp = Math.min(D.maxHp, player.hp + amt); burst(player.x, player.y, 20, 'heal', 6, 'mint', 1.2); return; }
      if (fight) { faceE(E, fight); shots.push({ x: E.x, y: E.y, h: 36, tgt: fight, dmg: D.atk * 0.7 * pw, sp: 11, trail: [], col: 'mint' }); }
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
    emis.push([{ aria: 'violet', karen: 'warm' }[E.hid] || 'mint', x0, y0 - fl - 30 * zoom, 26 * zoom, 0.25]);
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
    } else if (id === 'karen') {
      withEl('fire', () => { for (const e of enemies) if (!e.dead && hyp(e.x - player.x, e.y - player.y) < 6) hitEnemy(e, D.atk * 5.5 * heroPow(id)); });
      player.karenDanceT = 8;
      addVfx({ k: 'ring', x: player.x, y: player.y, R: 6, c: '255,130,50', w: 14, life: 0.8 }); addVfx({ k: 'sflash', c: '255,170,90', a: 0.3, life: 0.5 });
      burst(player.x, player.y, 20, 'ember', 30, 'warm', 2);
      addShake(10); zoomPunch(0.06);
    } else {
      withEl('volt', () => { for (const e of enemies) if (!e.dead && hyp(e.x - player.x, e.y - player.y) < 7) hitEnemy(e, D.atk * 6 * heroPow(id)); });
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
    if (key === 'mina_join') { const S = heroS('mina'); S.j = true; S.out = true; toast('ミーナが仲間になった！（「仲間」タブで会話できる）'); sfx('level'); }
    if (key === 'karen_join') { const S = heroS('karen'); S.j = true; S.out = true; toast('カレンが仲間になった！'); sfx('level'); }
    if (key === 'aria_join') { const S = heroS('aria'); S.j = true; S.out = true; toast('アリアが仲間になった！'); sfx('level'); }
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
    once('mina_join', q.main >= MAINQ.length && curMap === 0 && inCamp(player.x, player.y));
    if (curMap === 3 && !WB.on) {
      once('aria_voice', curFloor >= 11 && heroJoined('mina'));
      once('karen_meet', curFloor >= 13 && heroJoined('mina'));
      once('karen_join', curFloor >= 14 && seen.includes('karen_meet') && (curFloor > 14 || stairsOpen));
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
    head.append(elP('qh', 'ヒロイン'), elP('qr', '一緒に戦うほど好感度が上がり、会話が増える。奥義ゲージがたまると右の顔のボタンで発動（AUTO中は自動）。'));
    box.append(head);
    for (const id of HERO_IDS) {
      const H = HEROINES[id], S = heroS(id), c = document.createElement('div'); c.className = 'qc hcard' + (S.j && S.out !== false ? ' on' : '');
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
        const tk = talkReady(id);
        if (tk) acts.append(elBtn('話す（新しい話）', 'primary small', () => { closeSheet(); playScene(tk[0]); }));
        acts.append(elBtn(S.out !== false ? '休ませる' : '連れて行く', 'ghost small', () => { S.out = S.out === false; save(); renderPets(); }));
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
