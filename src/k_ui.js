
  /* ================= UI 2.0: controls, settings, inventory tools ================= */
  const OPT_LIST = [
    ['autoPot', '自動で回復薬を使う', 'HPが30%を切ったら回復薬を飲む'],
    ['autoTarget', '次の敵を自動で狙う', '敵を倒したら近くの敵へ攻撃を続ける'],
    ['autoSell', 'ノーマル装備を自動で売る', '拾ったノーマル装備をその場でゴールドに換える'],
    ['stick', '移動スティックを使う', '画面左下をなぞって移動する'],
    ['shake', '画面の揺れ・振動', '強い一撃や撃破で画面を揺らし、対応するスマホでは振動させる'],
    ['op', '起動時にオープニングを流す', 'ゲームを開くたびにオープニングから始める'],
    ['lite', '軽量モード', '画質と演出を抑えて動作を軽くする（古いスマホ向け）']
  ];
  function opt() { if (!prog.opt) prog.opt = { autoPot: true, autoTarget: true, autoSell: false, stick: true }; return prog.opt; }
  const stick = { active: false, id: null, bx: 0, by: 0, dx: 0, dy: 0 };
  let gearFilter = 'all', gearSort = 'power', bulk = false, noteItem = null, noteT = 0, recallArm = 0;
  const bulkSel = new Set();

  /* ---------- movement stick & attack button ---------- */
  function stickZone(x, y) { return opt().stick && x < W * 0.42 && y > H * 0.62; }
  function stickMove(dt) {
    if (!stick.active) return false;
    const len = hyp(stick.dx, stick.dy);
    player.path.length = 0;
    if (len < 8) { player.moving = false; return true; }
    let wx = (stick.dx / HW + stick.dy / HH) / 2, wy = (stick.dy / HH - stick.dx / HW) / 2;
    const wl = hyp(wx, wy) || 1;
    wx /= wl; wy /= wl;
    const sp = D.speed * dt * Math.min(1, len / 44);
    const nx = player.x + wx * sp, ny = player.y + wy * sp;
    if (!blockedAt(nx, player.y, 0.2)) player.x = nx;
    if (!blockedAt(player.x, ny, 0.2)) player.y = ny;
    player.target = null; pendingNpc = null;
    player.moving = true;
    player.walkPhase = (player.walkPhase + sp / 1.15) % 1;
    faceToward(wx, wy);
    return true;
  }
  function attackNearest() {
    if (paused || player.dead || transit) return;
    const cur = player.target && !player.target.dead && hyp(player.target.x - player.x, player.target.y - player.y) < 7.5 ? player.target : null;
    const t = cur || nearest(player.x, player.y, 7.5, null);
    if (!t) { toast('近くに敵がいない'); return; }
    player.target = t; player.path.length = 0; player.repathT = 0; pendingNpc = null;
  }
  function autoRetarget(dead) {
    if (!opt().autoTarget || player.dead) return;
    const t = nearest(player.x, player.y, 5.5, null);
    if (t) { player.target = t; player.repathT = 0; }
  }
  function autoUpdate() {
    if (opt().autoPot && !player.dead && !paused && player.hp < D.maxHp * 0.3 && player.potT <= 0 && prog.potions > 0) drinkPotion();
  }
  function recall() {
    if (player.dead || transit) return;
    if (curMap === 0 && inCamp(player.x, player.y)) { toast('すでに町にいる'); return; }
    if (curMap === 3 && Date.now() - recallArm > 4000) { recallArm = Date.now(); toast('もう一度押すと帰還（回廊はB' + checkpointFloor() + 'Fから再開）'); return; }
    closeSheet();
    transit = true;
    $('fade').classList.add('on');
    setTimeout(() => { enterMap(0, null); $('fade').classList.remove('on'); transit = false; }, 320);
  }

  /* ---------- gear math ---------- */
  const CMP_ROWS = [['atkS', '剣の攻撃力', ''], ['atkA', '杖の攻撃力', ''], ['hpT', '最大HP（装備分）', ''], ['mpT', '最大MP（装備分）', ''], ['drT', '被ダメージ軽減', '%'],
    ['atkPct', '攻撃力', '%'], ['str', '力', ''], ['agi', '素早さ', ''], ['vit', '体力', ''], ['int', '知力', ''], ['luk', '運', ''], ['crit', '会心率', '%'], ['critDmg', '会心ダメージ', '%'],
    ['aspd', '攻撃の速さ', '%'], ['mspd', '移動の速さ', '%'], ['leech', 'HP吸収', '%'], ['mpr', 'MP回復', ''], ['cdr', '再使用短縮', '%'], ['exp', '経験値', '%'], ['gold', 'ゴールド', '%']];
  function totalsOf(eq) {
    const g = emptyGear();
    for (const t of SLOT_TYPES) {
      const it = eq[t];
      if (!it) continue;
      const b = itemBase(it);
      if (t === 'sword') g.swordAtk += b; else if (t === 'staff') g.staffAtk += b; else if (t === 'head') g.hpB += b; else if (t === 'body') g.drB += b; else g.mpB += b;
      for (const o of it.opts) { if (o.k === 'skill') g.sk[o.sid] = (g.sk[o.sid] || 0) + o.v; else g[o.k] = (g[o.k] || 0) + o.v; }
    }
    g.atkS = g.swordAtk; g.atkA = g.staffAtk; g.hpT = (g.hp || 0) + g.hpB; g.mpT = (g.mp || 0) + g.mpB; g.drT = (g.dr || 0) + g.drB;
    return g;
  }
  function powerWith(eq, form) {
    const keep = GEAR;
    GEAR = totalsOf(eq);
    let Dx;
    try { Dx = derived(form); } finally { GEAR = keep; }
    const dps = Dx.atk * (1 + Dx.crit * (Dx.critMul - 1)) / Dx.interval;
    return Math.round(dps * 2 + Dx.maxHp / (1 - Math.min(0.75, Dx.guard || 0)) * 0.25 + Dx.maxMp * 0.15 + Dx.speed * 10 + ((Dx.steal || 0) + (Dx.cdr || 0)) * 200);
  }
  function formFor(type) { return type === 'sword' ? 'blade' : type === 'staff' ? 'arcane' : player.form; }
  function swapped(it) { const eq = Object.assign({}, prog.eq); eq[it.type] = it; return eq; }
  function upgradeDelta(it) { const f = formFor(it.type); return powerWith(swapped(it), f) - powerWith(prog.eq, f); }

  /* ---------- inventory UI ---------- */
  function itemCell(it, onClick, label, delta) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'itc r' + it.rar + (selItem && selItem.id === it.id ? ' sel' : '') + (bulk && bulkSel.has(it.id) ? ' chk' : '');
    let h = '<svg aria-hidden="true"><use href="#' + TYPE_INFO[it.type].icon + '"></use></svg><small>' + it.il + '</small>';
    if (it.plus) h += '<i>+' + it.plus + '</i>';
    if (delta > 0) h += '<b class="up">▲</b>'; else if (delta < 0) h += '<b class="dn">▼</b>';
    if (it.lock) h += '<u><svg aria-hidden="true"><use href="#ic-lock"></use></svg></u>';
    if (it.isNew) h += '<em></em>';
    b.innerHTML = h;
    b.setAttribute('aria-label', (label ? label + '：' : '') + it.name + (delta > 0 ? '（装備中より強い）' : ''));
    b.addEventListener('click', onClick);
    return b;
  }
  function renderGearOld() {}
  function renderGear() {
    if ($('tabGear').hidden) return;
    const row = $('eqRow');
    row.textContent = '';
    for (const t of SLOT_TYPES) {
      const cell = document.createElement('div'); cell.className = 'eqs';
      const it = prog.eq[t];
      if (it) cell.appendChild(itemCell(it, () => { if (bulk) return; selItem = { where: 'eq', id: it.id, type: t }; renderGear(); }, TYPE_INFO[t].name, 0));
      else { const e = document.createElement('div'); e.className = 'itc empty'; e.innerHTML = '<svg aria-hidden="true"><use href="#' + TYPE_INFO[t].icon + '"></use></svg>'; cell.appendChild(e); }
      const cap = document.createElement('span'); cap.textContent = TYPE_INFO[t].name; cell.appendChild(cap);
      row.appendChild(cell);
    }
    const fb = $('gfilter');
    fb.textContent = '';
    for (const [k, name] of [['all', 'すべて']].concat(SLOT_TYPES.map((t) => [t, TYPE_INFO[t].name]))) {
      const c = elBtn(name, 'chip' + (gearFilter === k ? ' on' : ''), () => { gearFilter = k; renderGear(); });
      fb.appendChild(c);
    }
    $('gsort').value = gearSort;
    $('bulkBtn').textContent = bulk ? '選択をやめる' : 'まとめて売る';
    $('invCount').textContent = prog.inv.length + ' / ' + INV_MAX;
    const deltas = new Map();
    for (const it of prog.inv) deltas.set(it.id, upgradeDelta(it));
    let list = prog.inv.filter((it) => gearFilter === 'all' || it.type === gearFilter);
    const order = prog.inv.slice();
    list.sort(gearSort === 'rar' ? (a, b) => b.rar - a.rar || b.il - a.il : gearSort === 'lv' ? (a, b) => b.il - a.il || b.rar - a.rar : gearSort === 'new' ? (a, b) => order.indexOf(b) - order.indexOf(a) : (a, b) => deltas.get(b.id) - deltas.get(a.id) || b.rar - a.rar);
    const grid = $('invGrid');
    grid.textContent = '';
    for (const it of list) grid.appendChild(itemCell(it, () => {
      if (bulk) { if (it.lock) { toast('ロック中の装備は売れない'); return; } if (bulkSel.has(it.id)) bulkSel.delete(it.id); else bulkSel.add(it.id); renderGear(); return; }
      it.isNew = false; selItem = { where: 'inv', id: it.id }; renderGear();
    }, '', deltas.get(it.id)));
    if (!list.length) grid.appendChild(elP('ith', prog.inv.length ? 'この種類の装備は持っていない' : '敵を倒すと装備が落ちることがある'));
    const bar = $('bulkBar');
    bar.hidden = !bulk;
    if (bulk) {
      let g = 0, n = 0;
      for (const it of prog.inv) if (bulkSel.has(it.id) && !it.lock) { g += sellPrice(it); n++; }
      $('bulkGo').textContent = n ? n + '個を売る（+' + g + 'G）' : '売る装備を選ぶ';
      $('bulkGo').disabled = !n;
    }
    renderDetail(deltas);
  }
  function renderDetail(deltas) {
    const box = $('itemDetail');
    box.textContent = '';
    const it = bulk ? null : findSel();
    box.hidden = !it;
    if (!it) return;
    const inInv = selItem.where === 'inv';
    const head = document.createElement('div'); head.className = 'dh';
    const left = document.createElement('div');
    const h = document.createElement('h4'); h.className = 'itn r' + it.rar; h.textContent = it.name + (it.plus ? ' +' + it.plus : '');
    left.append(h, elP('itm', RAR[it.rar].name + '／' + TYPE_INFO[it.type].name + '／アイテムLv' + it.il + (it.lock ? '／ロック中' : '')));
    head.appendChild(left);
    if (inInv) {
      const d = deltas.get(it.id) || 0;
      const pw = document.createElement('span'); pw.className = 'pw ' + (d >= 0 ? 'up' : 'dn'); pw.textContent = '戦力 ' + (d >= 0 ? '▲+' : '▼') + d;
      head.appendChild(pw);
    }
    box.append(head, elP('itb', TYPE_INFO[it.type].baseTxt(itemBase(it))));
    if (it.opts.length) { const ul = document.createElement('ul'); ul.className = 'ito'; for (const o of it.opts) { const li = document.createElement('li'); li.textContent = optText(o); ul.appendChild(li); } box.append(ul); }
    if (it.pow) { const pp = document.createElement('p'); pp.className = 'itp'; pp.textContent = powText(it); box.append(pp); }
    if (inInv) {
      const cur = prog.eq[it.type], a = totalsOf(prog.eq), b = totalsOf(swapped(it));
      box.append(elP('ith', cur ? '装備中の「' + cur.name + (cur.plus ? ' +' + cur.plus : '') + '」と入れ替えたときの変化' : 'この枠は空き。装備したときの変化'));
      const tb = document.createElement('table'); tb.className = 'cmpt';
      tb.innerHTML = '<thead><tr><th>項目</th><th>いま</th><th>装備後</th><th>差</th></tr></thead>';
      const body = document.createElement('tbody');
      let rows = 0;
      for (const [k, name, unit] of CMP_ROWS) {
        const va = a[k] || 0, vb = b[k] || 0, df = Math.round((vb - va) * 10) / 10;
        if (!df) continue;
        const tr = document.createElement('tr');
        const show = (v) => (Math.round(v * 10) / 10) + unit;
        tr.innerHTML = '<td></td><td></td><td></td><td class="' + (df > 0 ? 'up' : 'dn') + '"></td>';
        tr.children[0].textContent = name; tr.children[1].textContent = show(va); tr.children[2].textContent = show(vb); tr.children[3].textContent = (df > 0 ? '▲+' : '▼') + show(df);
        body.appendChild(tr); rows++;
      }
      const skA = a.sk, skB = b.sk;
      for (const id of new Set(Object.keys(skA).concat(Object.keys(skB)))) {
        const df = (skB[id] || 0) - (skA[id] || 0);
        if (!df || !SKD[id]) continue;
        const tr = document.createElement('tr');
        tr.innerHTML = '<td></td><td></td><td></td><td class="' + (df > 0 ? 'up' : 'dn') + '"></td>';
        tr.children[0].textContent = '「' + SKD[id].name + '」Lv'; tr.children[1].textContent = '+' + (skA[id] || 0); tr.children[2].textContent = '+' + (skB[id] || 0); tr.children[3].textContent = (df > 0 ? '▲+' : '▼') + df;
        body.appendChild(tr); rows++;
      }
      if (!rows) { const tr = document.createElement('tr'); tr.innerHTML = '<td colspan="4">変化なし</td>'; body.appendChild(tr); }
      tb.appendChild(body);
      box.appendChild(tb);
    }
    const acts = document.createElement('div'); acts.className = 'ita';
    if (inInv) acts.append(elBtn('装備する', 'primary small', () => equip(it)));
    else acts.append(elBtn('外す', 'ghost small', () => unequip(selItem.type)));
    acts.append(elBtn(it.lock ? 'ロック解除' : 'ロック', 'ghost small', () => { it.lock = !it.lock; save(); renderGear(); }));
    const camp = inCamp(player.x, player.y), cost = enhanceCost(it);
    const eb = elBtn(it.plus >= 10 ? '強化は最大' : '強化 +' + (it.plus + 1) + '（' + cost + 'G・' + Math.round(enhanceRate(it) * 100) + '%）', 'ghost small', () => enhance(it));
    eb.disabled = it.plus >= 10 || !camp || prog.gold < cost;
    acts.append(eb);
    if (inInv) { const sb = elBtn('売る（' + sellPrice(it) + 'G）', 'ghost small', () => sell(it)); sb.disabled = !!it.lock; acts.append(sb); }
    box.append(acts);
    if (!camp) box.append(elP('ith', '強化はキャンプの焚き火のそばでできる（失敗しても壊れない）'));
  }
  function bulkPick(maxRar) { bulkSel.clear(); for (const it of prog.inv) if (!it.lock && it.rar <= maxRar) bulkSel.add(it.id); renderGear(); }
  function bulkSell() {
    let g = 0, n = 0;
    for (let i = prog.inv.length - 1; i >= 0; i--) { const it = prog.inv[i]; if (!bulkSel.has(it.id) || it.lock) continue; g += sellPrice(it); prog.inv.splice(i, 1); n++; }
    if (!n) return;
    prog.gold += g;
    sfx('coin');
    bulkSel.clear(); bulk = false; selItem = null;
    log(n + '個の装備を' + g + 'Gで売った'); toast(n + '個を売った（+' + g + 'G）');
    save(); renderGear();
  }
  function equipBest() {
    let n = 0;
    for (const t of SLOT_TYPES) {
      let best = null, bd = 0;
      for (const it of prog.inv) if (it.type === t) { const d = upgradeDelta(it); if (d > bd) { bd = d; best = it; } }
      if (best) {
        prog.inv.splice(prog.inv.indexOf(best), 1);
        const old = prog.eq[t];
        if (old) prog.inv.push(old);
        best.isNew = false; prog.eq[t] = best;
        refreshGear(); n++;
      }
    }
    selItem = null; save(); renderGear();
    toast(n ? n + 'か所を一番強い装備に変えた' : 'いまの装備が一番強い');
  }
  function onPickup(it) {
    if (upgradeDelta(it) > 0) {
      noteItem = it; noteT = 7;
      $('pickText').innerHTML = '<span class="up">▲</span> ';
      $('pickText').append(it.name + 'は装備中より強い');
      $('pickNote').hidden = false;
    }
  }
  function autoSellPick(it) {
    if (!opt().autoSell || it.rar !== 0 || it.lock) return false;
    const g = sellPrice(it);
    prog.gold += g;
    addText(player.x, player.y, '+' + g + 'G', 'gold', 70);
    return true;
  }

  /* ---------- sheet tabs ---------- */
  function renderSheet() {
    for (const bt of document.querySelectorAll('.tab')) { const on = bt.dataset.tab === sheetTab; bt.classList.toggle('on', on); bt.setAttribute('aria-selected', on ? 'true' : 'false'); }
    const own = sheetTab === 'quest' || sheetTab === 'opt' || sheetTab === 'pet';
    $('tabQuest').hidden = sheetTab !== 'quest';
    $('tabOpt').hidden = sheetTab !== 'opt';
    $('tabPet').hidden = sheetTab !== 'pet';
    if (own) {
      $('tabStat').hidden = true; $('tabSkill').hidden = true; $('tabGear').hidden = true;
      $('sheetTitle').textContent = sheetTab === 'quest' ? '依頼' : sheetTab === 'pet' ? 'ペット' : '設定';
      if (sheetTab === 'quest') renderQuestLog(); else if (sheetTab === 'pet') renderPets(); else renderOpt();
      return;
    }
    renderSheetOld();
    if (sheetTab === 'stat') renderClsInfo();
  }
  function renderQuestLog() {
    const box = $('questLog'), q = qState(), M = MAINQ[q.main];
    box.textContent = '';
    if (M) box.append(qCard('メイン依頼：' + M.title, q.ma ? goalText(M.goal) + '（' + (mainDone() ? '達成！' : mainProgText()) + '）' : 'ミーナに話しかけると受けられる', '報酬：' + rewardText(M.rew)));
    else box.append(qCard('メイン依頼', 'すべて完了', 'ミーナの掲示板で依頼を受けられる'));
    for (const b of q.act) box.append(qCard('掲示板の依頼', bountyText(b) + '（' + (bountyDone(b) ? '達成！' : bountyProg(b)) + '）', '報酬：' + rewardText(b.rew)));
    if (!q.act.length) box.append(elP('ith', '掲示板の依頼は受けていない。始まりの森のミーナから受けられる'));
    box.append(elP('ith', '報告は始まりの森のミーナへ。設定の「帰還」ですぐ町へ戻れる'));
    box.append(recordsCard());
  }
  function renderOpt() {
    const box = $('optList');
    box.textContent = '';
    for (const [k, name, hint] of OPT_LIST) {
      const row = document.createElement('label'); row.className = 'opt';
      const tx = document.createElement('span');
      const n = document.createElement('span'); n.className = 'nm'; n.textContent = name;
      const hh = document.createElement('span'); hh.className = 'hint'; hh.textContent = hint;
      tx.append(n, hh);
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.className = 'sw'; cb.checked = !!opt()[k];
      cb.addEventListener('change', () => { opt()[k] = cb.checked; save(); if (k === 'lite') resize(); });
      row.append(tx, cb);
      box.appendChild(row);
    }
    rankRow(box);
    { const ob = elBtn('オープニングを見る', 'ghost', () => { closeSheet(); opWatch(); }); box.appendChild(ob); }
    { const hb = elBtn('遊び方を見る', 'ghost', () => { closeSheet(); $('intro').hidden = false; paused = true; }); box.appendChild(hb); }
    if (prog.cleared > 0) { const rb = elBtn('エンディングをもう一度見る', 'ghost', () => { closeSheet(); playEnding(null); }); box.appendChild(rb); }
    for (const [k, name] of [['bgm', '音楽の音量'], ['se', '効果音の音量']]) {
      const row = document.createElement('label'); row.className = 'opt';
      const n = document.createElement('span'); n.className = 'nm'; n.textContent = name;
      const r = document.createElement('input'); r.type = 'range'; r.min = '0'; r.max = '100'; r.step = '5'; r.className = 'vol';
      r.value = String(Math.round(opt()[k] * 100));
      r.addEventListener('input', () => { opt()[k] = +r.value / 100; applyVolume(); });
      r.addEventListener('change', () => { save(); if (k === 'se') sfx('pick'); });
      row.append(n, r);
      box.appendChild(row);
    }
  }
  function autoStat() {
    if (prog.sp <= 0) { toast('ステータスポイントがない'); return; }
    const pat = player.form === 'blade' ? ['str', 'str', 'vit', 'agi'] : ['int', 'int', 'vit', 'luk'];
    let i = 0;
    while (prog.sp > 0) { prog.stats[pat[i % pat.length]]++; prog.sp--; i++; }
    refreshD(); renderSheet(); save();
    toast(i + 'ポイントを振り分けた');
  }

  /* ---------- per-frame HUD extras ---------- */
  function updateHud2(dt) {
    const st = $('stick');
    st.hidden = !opt().stick;
    if (stick.active) {
      st.classList.add('on');
      st.style.left = (stick.bx - 56) + 'px'; st.style.top = (stick.by - 56) + 'px'; st.style.bottom = 'auto';
      $('stickKnob').style.transform = 'translate(' + stick.dx + 'px,' + stick.dy + 'px)';
    } else if (st.classList.contains('on')) {
      st.classList.remove('on');
      st.style.left = ''; st.style.top = ''; st.style.bottom = '';
      $('stickKnob').style.transform = '';
    }
    setS('xpLine', prog.exp / expNeed(prog.level));
    setT('goldHud', prog.gold + 'G');
    setT('lvText', String(prog.level));
    if (noteT > 0) { noteT -= dt; if (noteT <= 0 || !prog.inv.includes(noteItem)) { noteT = 0; $('pickNote').hidden = true; } }
  }
  function bindUi2() {
    $('atkBtn').addEventListener('click', attackNearest);
    audioBind();
    $('gsort').addEventListener('change', () => { gearSort = $('gsort').value; renderGear(); });
    $('bestBtn').addEventListener('click', equipBest);
    $('bulkBtn').addEventListener('click', () => { bulk = !bulk; bulkSel.clear(); selItem = null; renderGear(); });
    for (const c of document.querySelectorAll('#bulkBar [data-pick]')) c.addEventListener('click', () => bulkPick(+c.dataset.pick));
    $('bulkGo').addEventListener('click', bulkSell);
    $('bulkCancel').addEventListener('click', () => { bulk = false; bulkSel.clear(); renderGear(); });
    $('autoStat').addEventListener('click', autoStat);
    $('ultBtn').addEventListener('click', useUlt);
    $('worldBtn').addEventListener('click', () => { if (paused || player.dead) return; openWorld(); });
    $('worldClose').addEventListener('click', () => { $('worldDlg').hidden = true; paused = false; });
    $('rideBtn').addEventListener('click', toggleRide);
    $('petOk').addEventListener('click', () => { $('petDlg').hidden = true; paused = !$('sheet').hidden; });
    document.addEventListener('keydown', (ev) => { if ((ev.key === 'f' || ev.key === 'F') && !ev.repeat && $('sheet').hidden) toggleRide(); });
    document.addEventListener('keydown', (ev) => { if ((ev.key === 'r' || ev.key === 'R') && !ev.repeat && $('sheet').hidden) useUlt(); });
    $('fobj').addEventListener('click', floorInfo);
    $('clearOk').addEventListener('click', () => { $('clearDlg').hidden = true; paused = false; });
    $('clearNext').addEventListener('click', () => { const nx = Math.min(10, rankNow() + 1); $('clearDlg').hidden = true; paused = false; setRank(nx); toast('地上へ戻って深淵へ入ると、位階' + ROMAN[nx] + 'のB1Fから始まる'); });
    $('endSkip').addEventListener('click', endSkip);
    $('opSkip').addEventListener('click', (ev) => { ev.stopPropagation(); opFinish(); });
    $('opCv').addEventListener('click', opTap);
    $('opSplash').addEventListener('click', opSplashTap);
    $('opWatch').addEventListener('click', opWatch);
    $('endBtn').addEventListener('click', closeEnding);
    $('recallBtn').addEventListener('click', recall);
    $('pickEquip').addEventListener('click', () => { if (noteItem && prog.inv.includes(noteItem)) { equip(noteItem); toast(noteItem.name + 'を装備した'); } noteT = 0; $('pickNote').hidden = true; });
    $('pickClose').addEventListener('click', () => { noteT = 0; $('pickNote').hidden = true; });
  }
