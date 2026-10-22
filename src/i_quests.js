
  /* ================= town NPCs & quests ================= */
  const TYPE_NAME = { goblin: 'ゴブリン', ant: '火蟻', undead: '骸骨・ゾンビ' };
  const MAINQ = [
    { title: 'はじめての討伐', story: 'ようこそ、旅の方。まずは森を荒らすゴブリンを退治してくれないかしら？', goal: { t: 'kill', what: 'goblin', n: 5 }, rew: { gold: 60, exp: 40, pot: 3 } },
    { title: 'スキルを磨け', story: '力を伸ばすにはスキルの修練が欠かせないわ。ステータス画面でスキルをひとつ強化してきて。', goal: { t: 'learn', n: 1 }, rew: { item: 1, exp: 60 } },
    { title: 'ふたつの魂', story: 'あなたは剣と術、ふたつの型を持つんですってね。術の型で敵を10体倒してみせて。', goal: { t: 'killForm', what: 'arcane', n: 10 }, rew: { gold: 120, exp: 150 } },
    { title: '赤砂の峡谷へ', story: '森の東の門の先に、赤い砂の峡谷が広がっているの。様子を見てきてくれる？', goal: { t: 'map', what: 1 }, rew: { gold: 200, exp: 200 } },
    { title: '火蟻の群れ', story: '火蟻が増えすぎて、商人が街道を通れないの。15体ほど減らしてきて。', goal: { t: 'kill', what: 'ant', n: 15 }, rew: { item: 2, exp: 300 } },
    { title: '霧の墓所', story: '峡谷の南に、霧に包まれた墓所があるらしいわ。足を踏み入れた人は少ないの。', goal: { t: 'map', what: 2 }, rew: { gold: 300, pot: 5, exp: 400 } },
    { title: '深淵の入口', story: '森の北の門は「深淵の回廊」へ通じているわ。B3Fまで潜って、無事に戻ってきて。', goal: { t: 'floor', n: 3 }, rew: { item: 2, exp: 600 } },
    { title: '最初の番人', story: 'B5Fには番人がいると聞いたわ。あなたなら越えられるはず。', goal: { t: 'floor', n: 6 }, rew: { item: 3, gold: 1000, exp: 1200 } },
    { title: '鍛えし刃', story: '鍛冶屋のガルドが、腕のいい冒険者を探しているの。装備を+5まで鍛えてみて。', goal: { t: 'plus', n: 5 }, rew: { gold: 1500, exp: 1500 } },
    { title: '深淵の底へ', story: 'これが私からの最後の依頼。B10Fの番人を越えて、その先を見てきて。', goal: { t: 'floor', n: 11 }, rew: { item: 3, gold: 3000, exp: 4000 } },
    // after Mina joins the party, Toma runs the desk (GDD §6-2: one story beat every ten floors)
    { title: '歌の聞こえる場所', story: '受付代理のトマです！ ミーナさんから伝言です。「B20Fの先で、歌が待っている」……だそうです。行ってみてください！', goal: { t: 'floor', n: 21 }, rew: { item: 3, gold: 30000, exp: 20000 } },
    { title: '墓所の石板', story: 'B30Fに古い石板があるって、古文書に書いてありました！ 読めたら……ボクにも教えてくださいね？', goal: { t: 'floor', n: 31 }, rew: { item: 3, gold: 80000, exp: 50000 } },
    { title: '歌守りの言い伝え', story: 'ミーナさんの家の言い伝えに「四十の門」っていうのがあるんです。B40Fの先、きっと何かあります！', goal: { t: 'floor', n: 41 }, rew: { item: 3, gold: 150000, exp: 80000 } },
    { title: '最後の一節', story: 'これがボクからの……いいえ、ギルドからの最後の依頼です。B50F、深淵の底へ。みんなで、帰ってきてください！', goal: { t: 'floor', n: 50 }, rew: { item: 3, gold: 300000, exp: 120000 } }
  ];
  const MAINQ_MINA = 10; // Mina joins once the first ten (her own) requests are done
  const NPCS = [
    { role: 'quest', name: 'ギルド受付 ミーナ', key: 'npc_mina', base: 'hero_arcane', tint: '#9fe6d8', dx: 2.6, dy: 0.4 },
    { role: 'shop', name: '行商ゴブリン トマ', key: 'goblin', base: 'goblin', dx: 0.6, dy: 2.7 },
    { role: 'smith', name: '鍛冶屋 ガルド', key: 'npc_smith', base: 'hero_blade', tint: '#e6aa6c', dx: -2.6, dy: 1.4 }
  ];
  let pendingNpc = null, npcOpen = null, trackLast = -1, qTick = 0;
  function qState() { if (!prog.q) prog.q = { main: 0, mp: 0, ma: false, mn: false, act: [], board: [] }; return prog.q; }
  function maxPlus() { let m = 0; for (const t of SLOT_TYPES) if (prog.eq[t]) m = Math.max(m, prog.eq[t].plus); for (const it of prog.inv) m = Math.max(m, it.plus); return m; }
  function goalText(g) {
    if (g.t === 'kill') return TYPE_NAME[g.what] + 'を' + g.n + '体倒す';
    if (g.t === 'killForm') return '術の型で敵を' + g.n + '体倒す';
    if (g.t === 'learn') return 'スキルを' + g.n + '回強化する';
    if (g.t === 'map') return MAPS[g.what].name + 'に入る';
    if (g.t === 'floor') return '深淵の回廊 B' + g.n + 'Fに到達する';
    return '装備を+' + g.n + 'まで強化する';
  }
  function mainDone() {
    const q = qState(), M = MAINQ[q.main];
    if (!M || !q.ma) return false;
    const g = M.goal;
    if (g.t === 'floor') return prog.deep >= g.n;
    if (g.t === 'plus') return maxPlus() >= g.n;
    if (g.t === 'map') return q.mp >= 1;
    return q.mp >= g.n;
  }
  function mainProgText() {
    const q = qState(), g = MAINQ[q.main].goal;
    if (g.t === 'floor') return '最深 B' + prog.deep + 'F';
    if (g.t === 'plus') return '最高 +' + maxPlus();
    if (g.t === 'map') return q.mp ? '到着' : '未到着';
    return Math.min(q.mp, g.n) + '/' + g.n;
  }
  function bountyDone(b) { return b.k === 'floor' ? prog.deep >= b.n : b.p >= b.n; }
  function bountyText(b) { return b.k === 'kill' ? TYPE_NAME[b.what] + 'を' + b.n + '体倒す' : b.k === 'elite' ? '強い個体を' + b.n + '体倒す' : '深淵の回廊 B' + b.n + 'Fに到達する'; }
  function bountyProg(b) { return b.k === 'floor' ? '最深 B' + prog.deep + 'F' : Math.min(b.p, b.n) + '/' + b.n; }
  function genBounty() {
    const L = prog.level, r = Math.random();
    if (r < 0.6) { const n = randi(8, 16); return { k: 'kill', what: ['goblin', 'ant', 'undead'][randi(0, 2)], n, p: 0, rew: { gold: Math.round(25 * L + n * 6), exp: Math.round(expNeed(L) * 0.18), item: Math.random() < 0.3 ? 1 : 0 } }; }
    if (r < 0.85) { const n = randi(2, 4); return { k: 'elite', n, p: 0, rew: { gold: Math.round(60 * L), exp: Math.round(expNeed(L) * 0.3), item: 2 } }; }
    if (prog.deep >= ABYSS_MAX) { const n = randi(3, 5); return { k: 'elite', n, p: 0, rew: { gold: Math.round(70 * L), exp: Math.round(expNeed(L) * 0.35), item: 2 } }; }
    const f = Math.min(ABYSS_MAX, Math.max(2, prog.deep + randi(1, 2)));
    return { k: 'floor', n: f, p: 0, rew: { gold: Math.round(80 * L + f * 30), exp: Math.round(expNeed(L) * 0.4), item: 2 } };
  }
  function fillBoard() { const q = qState(); while (q.board.length < 3) q.board.push(genBounty()); }
  function rewardText(r) {
    const a = [];
    if (r.gold) a.push(r.gold + 'G');
    if (r.exp) a.push('経験値' + r.exp);
    if (r.pot) a.push('回復薬×' + r.pot);
    if (r.item) a.push(RAR[r.item].name + '以上の装備');
    return a.join('、');
  }
  function giveReward(r) {
    if (r.gold) prog.gold += r.gold;
    if (r.pot) gainPotion(r.pot);
    if (r.item) {
      const it = genItem(prog.level + 1, Math.max(r.item, rollRarity(r.item >= 2)));
      if (prog.inv.length < INV_MAX) prog.inv.push(it); else loot.push({ x: player.x + 0.5, y: player.y, it, t: 0 });
      log(RAR[it.rar].name + '：' + it.name + 'を受け取った');
    }
    if (r.exp) gainExp(r.exp);
    save();
  }
  function deskName() { return heroJoined('mina') ? '受付' : 'ミーナ'; }
  function checkNotify() {
    const q = qState();
    if (q.ma && mainDone() && !q.mn) { q.mn = true; toast('依頼達成！' + deskName() + 'に報告しよう'); sfx('quest'); }
    for (const b of q.act) if (bountyDone(b) && !b.nt) { b.nt = true; toast('掲示板の依頼を達成！' + deskName() + 'に報告しよう'); }
  }
  function questKill(e) {
    const q = qState(), M = MAINQ[q.main];
    if (M && q.ma && !mainDone()) {
      const g = M.goal;
      if ((g.t === 'kill' && e.type === g.what) || (g.t === 'killForm' && player.form === g.what)) q.mp++;
    }
    for (const b of q.act) if (!bountyDone(b) && ((b.k === 'kill' && e.type === b.what) || (b.k === 'elite' && e.elite))) b.p++;
  }
  function questEvent(kind, v) {
    const q = qState(), M = MAINQ[q.main];
    if (M && q.ma && !mainDone()) {
      if (kind === 'learn' && M.goal.t === 'learn') q.mp++;
      if (kind === 'map' && M.goal.t === 'map' && v === M.goal.what) q.mp = 1;
    }
    checkNotify();
  }
  function questUpdate(dt) {
    qTick -= dt;
    if (qTick <= 0) { qTick = 1; checkNotify(); }
    if (pendingNpc && !player.dead && hyp(pendingNpc.x - player.x, pendingNpc.y - player.y) < 1.9) {
      const role = pendingNpc.role;
      pendingNpc = null;
      player.path.length = 0;
      openNpc(role);
    }
  }

  /* ---------- NPC rendering & interaction ---------- */
  function drawNpc(p, x0, y0) {
    const N = NPCS.find((n) => n.role === p.role);
    const d = hyp(player.x - p.x, player.y - p.y);
    const dir = d < 4.5 ? dirFrom(player.x - p.x, player.y - p.y) : 6;
    const key = FL[N.key] && FL[N.key].img ? N.key : N.base;
    const A = flAnim(key, 'stance');
    drawFlare(key, 'stance', dir, A ? animIndex(A, time + p.ph) : 0, x0, y0, 0.8, 1);
  }
  function makeNpcLooks() {
    for (const N of NPCS) {
      const E = FL[N.base];
      if (!N.tint || !E || !E.img) continue;
      const A = E.anims.stance;
      let cw = 2, ch = 2;
      for (let d = 0; d < 8; d++) for (let i = 0; i < A.n; i++) { cw = Math.max(cw, A.fr[d][i][2] + 2); ch = Math.max(ch, A.fr[d][i][3] + 2); }
      const c = mk(cw * A.n, ch * 8), g = c.getContext('2d'), fr = [];
      for (let d = 0; d < 8; d++) {
        fr.push([]);
        for (let i = 0; i < A.n; i++) { const f = A.fr[d][i], x = i * cw, y = d * ch; g.drawImage(E.img, f[0], f[1], f[2], f[3], x, y, f[2], f[3]); fr[d].push([x, y, f[2], f[3], f[4], f[5]]); }
      }
      g.globalCompositeOperation = 'multiply';
      g.fillStyle = N.tint;
      g.fillRect(0, 0, c.width, c.height);
      const mask = mk(c.width, c.height), mg = mask.getContext('2d');
      for (let d = 0; d < 8; d++) for (let i = 0; i < A.n; i++) { const f = A.fr[d][i]; mg.drawImage(E.img, f[0], f[1], f[2], f[3], i * cw, d * ch, f[2], f[3]); }
      g.globalCompositeOperation = 'destination-in';
      g.drawImage(mask, 0, 0);
      g.globalCompositeOperation = 'source-over';
      FL[N.key] = { img: c, sc: E.sc, anims: { stance: { n: A.n, dur: A.dur, type: A.type, fr } } };
    }
  }
  function npcMark() { const q = qState(); return (MAINQ[q.main] && (!q.ma || mainDone())) || q.act.some(bountyDone) || q.act.length < 3 ? '！' : ''; }
  function drawNpcLabels() {
    if (curMap !== 0) return;
    ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    const mark = npcMark();
    for (const p of props) {
      if (p.kind !== 'npc') continue;
      const N = NPCS.find((n) => n.role === p.role), x0 = isoX(p.x, p.y), y0 = isoY(p.x, p.y) - 92 * zoom;
      if (x0 < -80 || x0 > W + 80 || y0 < -40 || y0 > H + 40) continue;
      ctx.font = '800 ' + Math.round(11 * Math.max(0.9, zoom)) + 'px ' + FONT;
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(8,10,28,0.85)'; ctx.strokeText(N.name, x0, y0);
      ctx.fillStyle = '#d8ffd0'; ctx.fillText(N.name, x0, y0);
      if (p.role === 'quest' && mark) {
        const by = y0 - 18 * zoom + Math.sin(time * 4) * 3;
        ctx.font = '800 ' + Math.round(22 * Math.max(0.9, zoom)) + 'px ' + FONT;
        ctx.strokeText(mark, x0, by); ctx.fillStyle = '#ffd34d'; ctx.fillText(mark, x0, by);
      }
    }
  }
  function pickNpc(px, py) {
    if (curMap !== 0) return null;
    let best = null, bd = 38 * zoom;
    for (const p of props) {
      if (p.kind !== 'npc') continue;
      const d = hyp(px - isoX(p.x, p.y), py - (isoY(p.x, p.y) - 40 * zoom));
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }
  function talkTo(np) {
    player.target = null; drag.active = false;
    if (hyp(np.x - player.x, np.y - player.y) < 1.9) { openNpc(np.role); return; }
    pendingNpc = np;
    const pth = findPath(player.x, player.y, np.x, np.y);
    if (pth) player.path = pth;
  }

  /* ---------- dialogs ---------- */
  function qCard(head, goal, rew) { const c = document.createElement('div'); c.className = 'qc'; c.append(elP('qh', head), elP('qg', goal), elP('qr', rew)); return c; }
  function shopRow(name, price, fn) { const c = document.createElement('div'); c.className = 'qc row2'; c.append(elP('qg', name), elBtn(price, 'primary small', fn)); return c; }
  function elH(t) { const h = document.createElement('h3'); h.className = 'sub'; h.textContent = t; return h; }
  function boxPrice() { return 40 + prog.level * 25; }
  function gambleRarity() { const r = Math.random() * 100; return r < 40 ? 0 : r < 80 ? 1 : r < 96 ? 2 : 3; }
  function buyPots(cost, n) { if (prog.potions + n > potMax()) { toast('回復薬はこれ以上持てない（最大' + potMax() + '個）'); return; } buy(cost, () => gainPotion(n)); }
  function buy(cost, fn) { if (prog.gold < cost) { toast('所持金が足りない'); return; } prog.gold -= cost; fn(); save(); renderNpc(); }
  function openNpc(role) {
    if (player.dead || !$('intro').hidden) return;
    npcOpen = role; drag.active = false;
    renderNpc();
    paused = true;
    $('npcDlg').hidden = false;
  }
  function closeNpc() { $('npcDlg').hidden = true; npcOpen = null; paused = false; save(); }
  function renderNpc() {
    const N = NPCS.find((n) => n.role === npcOpen), body = $('npcBody');
    if (!N) return;
    $('npcTitle').textContent = N.name;
    body.textContent = '';
    if (npcOpen === 'quest') {
      const q = qState(), M = MAINQ[q.main];
      $('npcLine').textContent = M ? (q.ma ? (mainDone() ? 'よくやってくれたわ！ さあ、報酬を受け取って。' : 'がんばって。無理はしないでね。') : M.story) : 'メインの依頼はすべて片付いたわ。掲示板の依頼なら、いつでもあるわよ。';
      if (M) {
        const card = qCard('メイン依頼：' + M.title, goalText(M.goal) + (q.ma ? '（' + mainProgText() + '）' : ''), '報酬：' + rewardText(M.rew));
        if (!q.ma) card.append(elBtn('受ける', 'primary small', () => { q.ma = true; q.mp = 0; q.mn = false; if (M.goal.t === 'map' && curMap === M.goal.what) q.mp = 1; checkNotify(); renderNpc(); }));
        else if (mainDone()) card.append(elBtn('報告して報酬を受け取る', 'primary small', () => { const rew = M.rew; q.main++; q.ma = false; q.mp = 0; q.mn = false; giveReward(rew); toast('依頼「' + M.title + '」を完了した'); renderNpc(); }));
        body.append(card);
      }
      fillBoard();
      body.append(elH('依頼掲示板（受注は3件まで）'));
      for (const b of q.act.slice()) {
        const c = qCard('受注中', bountyText(b) + '（' + bountyProg(b) + '）', '報酬：' + rewardText(b.rew));
        if (bountyDone(b)) c.append(elBtn('報酬を受け取る', 'primary small', () => { q.act.splice(q.act.indexOf(b), 1); giveReward(b.rew); renderNpc(); }));
        else c.append(elBtn('あきらめる', 'ghost small', () => { q.act.splice(q.act.indexOf(b), 1); renderNpc(); }));
        body.append(c);
      }
      for (const b of q.board.slice()) {
        const c = qCard('新しい依頼', bountyText(b), '報酬：' + rewardText(b.rew));
        const ab = elBtn('受ける', 'primary small', () => { if (q.act.length >= 3) return; q.board.splice(q.board.indexOf(b), 1); q.act.push(b); fillBoard(); checkNotify(); renderNpc(); });
        ab.disabled = q.act.length >= 3;
        c.append(ab);
        body.append(c);
      }
    } else if (npcOpen === 'shop') {
      $('npcLine').textContent = 'いらっしゃい！ 掘り出し物もあるよ。所持金 ' + prog.gold + 'G／回復薬 ' + prog.potions + '個';
      const bp = boxPrice();
      body.append(
        shopRow('回復薬', '20G', () => buyPots(20, 1)),
        shopRow('回復薬×5', '90G', () => buyPots(90, 5)),
        shopRow('サポート宝石の袋（スキルにはめる宝石がひとつ）', gemPrice() + 'G', () => buy(gemPrice(), () => gainGem())),
        shopRow('ふしぎなタマゴ（仲間が生まれる。5個まで持てる）', eggPrice() + 'G', () => { if (pets().eggs.length >= 5) { toast('タマゴはもう持てない（5個まで）'); return; } buy(eggPrice(), () => gainEgg()); }),
        shopRow('目利き箱（Lv' + prog.level + 'の装備がひとつ。運がよければレジェンド）', bp + 'G', () => {
          if (prog.inv.length >= INV_MAX) { toast('持ち物がいっぱい'); return; }
          buy(bp, () => { const it = genItem(prog.level, gambleRarity()); prog.inv.push(it); toast(RAR[it.rar].name + '：' + it.name + '！'); log(RAR[it.rar].name + '：' + it.name + 'を手に入れた'); });
        }));
    } else {
      $('npcLine').textContent = '鍛えたい装備があれば任せな。強化は失敗しても壊れねえから安心しろ。';
      body.append(elBtn('装備画面を開く', 'primary small', () => { closeNpc(); openSheet(); if (!$('sheet').hidden) { sheetTab = 'gear'; renderSheet(); } }));
    }
  }
  function updateTracker() {
    const el = $('qtrack'), q = qState(), M = MAINQ[q.main], lines = [];
    if (M) lines.push(q.ma ? '★ ' + M.title + '：' + (mainDone() ? 'ミーナに報告' : mainProgText()) : '★ ミーナから新しい依頼');
    for (const b of q.act.slice(0, 2)) lines.push('・' + (b.k === 'kill' ? TYPE_NAME[b.what] : b.k === 'elite' ? '強い個体' : 'B' + b.n + 'F到達') + '：' + (bountyDone(b) ? '報告' : bountyProg(b)));
    const txt = lines.join('|');
    if (el.dataset.t === txt) return;
    el.dataset.t = txt;
    el.textContent = '';
    for (const l of lines) { const d = document.createElement('div'); d.textContent = l; el.appendChild(d); }
    el.hidden = !lines.length;
  }
