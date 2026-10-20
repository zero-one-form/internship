  /* ================= idle layer: companion party UI & training, offline hunting, AUTO battle ================= */
  const TRAIN = [
    { id: 'atk', name: '攻撃の訓練', base: 200, max: 999, d: (l) => '仲間の与えるダメージ +' + 8 * l + '%' },
    { id: 'spd', name: '素早さの訓練', base: 300, max: 50, d: (l) => '仲間の攻撃の速さ +' + 4 * l + '%' },
    { id: 'exp', name: '絆の訓練', base: 150, max: 50, d: (l) => '仲間が得る経験値 +' + 20 * l + '%' }
  ];
  const OFFLINE_CAP_MIN = 480;
  function trainCost(T) { return Math.round(T.base * Math.pow(1.18, trainS()[T.id] || 0)); }
  function slotCost() { return Math.round(2000 * Math.pow(4, pets().slots || 0)); }
  function eggPrice() { return 6000 + prog.level * 250; }

  /* ---------- extra companion shapes ---------- */
  function drawPetExtra(g, sh, c, k, t, mount) {
    const grd = (y0, y1) => { const gr = g.createLinearGradient(0, y0 * k, 0, y1 * k); gr.addColorStop(0, c[0]); gr.addColorStop(1, c[1]); return gr; };
    const eye = (ex, ey, r, col) => { g.fillStyle = col || '#1a1420'; g.beginPath(); g.arc(ex, ey, r, 0, TAU); g.fill(); };
    if (sh === 'golem') {
      const b = Math.sin(t * 4) * 0.6;
      g.fillStyle = grd(-26, 0);
      for (const [x, y, rx, ry] of [[-7, -5, 5, 5], [7, -5, 5, 5], [0, -14 + b, 11, 9], [-12, -14 + b, 4.5, 6], [12, -14 + b, 4.5, 6]]) { g.beginPath(); g.ellipse(x * k, y * k, rx * k, ry * k, 0, 0, TAU); g.fill(); g.stroke(); }
      if (!mount) { g.beginPath(); g.ellipse(0, (-26 + b) * k, 6 * k, 5 * k, 0, 0, TAU); g.fill(); g.stroke(); eye(-2 * k, (-26 + b) * k, 1.2 * k, '#7fe0ff'); eye(2.5 * k, (-26 + b) * k, 1.2 * k, '#7fe0ff'); }
    } else if (sh === 'fairy') {
      const f = Math.sin(t * 16);
      g.fillStyle = 'rgba(255,255,255,0.55)';
      for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 7 * k, -14 * k, (6 + f) * k, 3.4 * k, s * 0.7, 0, TAU); g.fill(); g.beginPath(); g.ellipse(s * 6 * k, -8 * k, (4 - f * 0.5) * k, 2.4 * k, -s * 0.5, 0, TAU); g.fill(); }
      g.fillStyle = grd(-16, -2); g.beginPath(); g.ellipse(0, -9 * k, 3.4 * k, 6 * k, 0, 0, TAU); g.fill(); g.stroke();
      if (!mount) { g.fillStyle = '#ffe6d0'; g.beginPath(); g.arc(0, -17 * k, 3.6 * k, 0, TAU); g.fill(); g.stroke(); eye(1.2 * k, -17.5 * k, 0.8 * k); g.fillStyle = c[0]; g.beginPath(); g.arc(-2 * k, -20.5 * k, 2.2 * k, 0, TAU); g.fill(); }
    } else {
      const o = Math.max(0, Math.sin(t * 5)) * 5;
      g.fillStyle = grd(-14, 0); g.beginPath(); g.rect(-11 * k, -11 * k, 22 * k, 11 * k); g.fill(); g.stroke();
      g.fillStyle = '#ffd36e'; g.fillRect(-11 * k, -7 * k, 22 * k, 1.6 * k);
      g.save(); g.translate(-11 * k, -11 * k); g.rotate(-o * 0.06);
      g.fillStyle = grd(-20, -10); g.beginPath(); g.moveTo(0, 0); g.lineTo(22 * k, 0); g.quadraticCurveTo(22 * k, -9 * k, 11 * k, -9 * k); g.quadraticCurveTo(0, -9 * k, 0, 0); g.fill(); g.stroke();
      g.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo((2 + i * 4) * k, 0); g.lineTo((4 + i * 4) * k, 2.6 * k); g.lineTo((6 + i * 4) * k, 0); g.fill(); }
      g.restore();
      if (!mount) { g.fillStyle = '#ff5a6a'; g.beginPath(); g.ellipse(2 * k, -11.5 * k, 4 * k, (1 + o * 0.3) * k, 0, 0, TAU); g.fill(); }
    }
  }

  /* ---------- companion tab ---------- */
  function renderPets() {
    const box = $('petBox'), P = pets();
    box.textContent = '';
    const party = partyList();
    const top = document.createElement('div'); top.className = 'qc';
    top.append(elP('qh', '仲間（同行 ' + party.length + '/' + partySlots() + '枠　所持 ' + P.list.length + '/' + PET_KEEP + '）'));
    top.append(elP('qr', 'AUTOをオンにすると、仲間はフィールド中の敵に自分から向かっていく。ゲームを閉じている間も狩りを続け、次に開いたときに成果を持ち帰る（最大8時間）。'));
    box.append(top);
    const eg = document.createElement('div'); eg.className = 'qc';
    eg.append(elP('qh', 'タマゴ（' + P.eggs.length + '/5）'));
    if (P.eggs.length) {
      eg.append(elP('qg', '温めているタマゴ：' + Math.floor(P.eggs[0].p / EGG_NEED * 100) + '%'));
      const bar = document.createElement('div'); bar.className = 'bar xp'; bar.style.display = 'block'; bar.style.height = '8px';
      const i = document.createElement('i'); i.style.background = 'linear-gradient(90deg,#ffe7a0,#e0a020)'; i.style.transform = 'scaleX(' + Math.min(1, P.eggs[0].p / EGG_NEED) + ')'; bar.append(i); eg.append(bar);
      eg.append(elP('qr', '敵を倒すと温まる（強い個体は3倍、ボスは10倍）'));
    } else eg.append(elP('qr', 'タマゴはどの敵からも2000分の1で落ちる。道具屋や魂の祭壇でも手に入る。孵ると12種類のどれかが生まれる'));
    box.append(eg);
    const tr = document.createElement('div'); tr.className = 'qc';
    tr.append(elP('qh', '訓練所（ゴールドで仲間全員を強化）　所持 ' + prog.gold + 'G'));
    for (const T of TRAIN) {
      const l = trainS()[T.id] || 0, row = document.createElement('div'); row.className = 'qc row2';
      const t = document.createElement('div'); t.append(elP('qg', T.name + '　Lv' + l), elP('qr', l ? T.d(l) + '　→ ' + T.d(l + 1) : T.d(1)));
      const b = elBtn(l >= T.max ? '最大' : trainCost(T) + 'G', 'primary small', () => {
        if (l >= T.max) return;
        if (prog.gold < trainCost(T)) { toast('所持金が足りない'); return; }
        prog.gold -= trainCost(T); trainS()[T.id] = l + 1; sfx('anvil'); save(); renderPets();
      });
      b.disabled = l >= T.max || prog.gold < trainCost(T);
      row.append(t, b); tr.append(row);
    }
    if (partySlots() < PARTY_MAX) {
      const row = document.createElement('div'); row.className = 'qc row2';
      const t = document.createElement('div'); t.append(elP('qg', '同行の枠を増やす　' + partySlots() + '→' + (partySlots() + 1)), elP('qr', 'いっしょに戦える仲間が1匹増える（最大' + PARTY_MAX + '）'));
      const b = elBtn(slotCost() + 'G', 'primary small', () => {
        if (prog.gold < slotCost()) { toast('所持金が足りない'); return; }
        prog.gold -= slotCost(); P.slots = (P.slots || 0) + 1; sfx('quest'); save(); renderPets();
      });
      b.disabled = prog.gold < slotCost();
      row.append(t, b); tr.append(row);
    }
    box.append(tr);
    if (!P.list.length) { box.append(elP('ith', 'まだ仲間はいない')); return; }
    const sorted = P.list.slice().sort((a, b) => (party.includes(b) ? 1 : 0) - (party.includes(a) ? 1 : 0) || b.lvl - a.lvl);
    for (const p of sorted) {
      const S = PET_SP[p.sp], inP = party.includes(p), lead = P.active === p.id;
      const c = document.createElement('div'); c.className = 'qc pcard' + (inP ? ' on' : '');
      const cv = document.createElement('canvas'); cv.width = 160; cv.height = 110; cv.className = 'pcv';
      drawPetShape(cv.getContext('2d'), p.sp, p.shiny, 82, 100, p.sp === 'slime' ? 3.4 : 2.9, 0.4, false, false);
      const info = document.createElement('div');
      info.append(elP('qg', petName(p) + (lead ? '　★リーダー' : inP ? '　同行中' : '')), elP('qh', PET_RAR[S.rar] + (p.shiny ? '・色違い' : '') + '　Lv' + p.lvl + (p.lvl >= PET_MAX ? '（最大）' : '') + '　' + (petAdult(p) ? '成体' : '幼体') + '　戦力 ' + Math.round(petPower(p) * 100)), elP('qr', S.desc));
      if (p.lvl < PET_MAX) info.append(elP('qr', '次のLvまで ' + Math.ceil(petNeed(p.lvl) - p.exp) + '体'));
      const acts = document.createElement('div'); acts.className = 'ita';
      if (inP) {
        acts.append(elBtn('休ませる', 'ghost small', () => { partyRemove(p.id); save(); renderPets(); }));
        if (!lead) acts.append(elBtn('リーダーにする', 'ghost small', () => { const old = P.active; P.party = (P.party || []).filter((x) => x !== p.id); if (old) P.party.unshift(old); P.active = p.id; P.ride = false; PET.map = -1; PARTY_E[old] = null; refreshD(); save(); renderPets(); }));
        if (lead && petAdult(p)) acts.append(elBtn(P.ride ? '降りる' : '騎乗する', 'primary small', () => { toggleRide(); renderPets(); }));
      } else acts.append(elBtn('連れて行く', 'primary small', () => { if (partyAdd(p.id)) { PET.map = -1; save(); renderPets(); } }));
      info.append(acts);
      c.append(cv, info);
      box.append(c);
    }
  }

  /* ---------- offline hunting ---------- */
  function offlineRewards() {
    const last = prog.seen, now = Date.now();
    prog.seen = now;
    if (typeof last !== 'number' || !isFinite(last) || last > now) return null;
    const min = Math.min(OFFLINE_CAP_MIN, Math.floor((now - last) / 60000));
    const party = partyList();
    if (min < 3 || !party.length) return null;
    const power = party.reduce((a, q) => a + petPower(q), 0);
    const gold = Math.round(min * power * (6 + prog.level * 1.2) * partyGoldMul());
    const exp = Math.round(min * power * expNeed(prog.level) * 0.004);
    const pexp = Math.round(min * 1.5);
    prog.gold += gold;
    gainExp(exp);
    for (const q of party) petGainExp(q, pexp);
    return { min, gold, exp, pexp, n: party.length };
  }
  function showOffline(r) {
    if (!r) return;
    const lead = partyList()[0];
    paused = true;
    $('petTitle').textContent = 'おかえりなさい！';
    $('petLine').textContent = '仲間' + r.n + '匹が ' + (r.min >= 60 ? Math.floor(r.min / 60) + '時間' : '') + (r.min % 60) + '分 狩りを続けていた';
    $('petDesc').textContent = r.gold + 'G、経験値 ' + r.exp + '、仲間の経験値 ' + r.pexp + 'を持ち帰った。' + (r.min >= OFFLINE_CAP_MIN ? '（8時間ぶんで打ち止め）' : '');
    $('petOk').textContent = 'ありがとう';
    $('petDlg').hidden = false;
    const c = $('petCv'), g = c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height);
    if (lead) drawPetShape(g, lead.sp, lead.shiny, c.width / 2, c.height * 0.78, 2.6, 0.5, false, false);
    sfx('quest');
  }

  /* ---------- AUTO battle ---------- */
  let autoHold = 0, autoSkT = 0, autoMorphT = 4, autoDeadT = 0, autoBlessT = 0;
  function autoOn() { return !!opt().auto; }
  function autoToggle() {
    opt().auto = !opt().auto; save();
    autoHud(true);
    toast(opt().auto ? 'AUTO：主人公と仲間が自動で戦う（操作すると少しの間 手動になる）' : 'AUTOを止めた');
  }
  function autoManual() { autoHold = 2.5; }
  function autoHud(force) {
    const b = $('autoBtn'), on = autoOn();
    if (force || b.dataset.on !== String(on)) { b.dataset.on = String(on); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }
  }
  function autoUpdate(dt) {
    autoHud(false);
    if (!autoOn()) return;
    if (player.dead) { autoDeadT += dt; if (autoDeadT > 3 && !$('dead').hidden) { autoDeadT = 0; respawn(); } return; }
    autoDeadT = 0;
    if (autoHold > 0) { autoHold -= dt; return; }
    if (stick.active || drag.active) { autoHold = 2.5; return; }
    if (transit) return;
    if (prog.sp > 0) { const pat = player.form === 'blade' ? ['str', 'str', 'vit', 'agi'] : ['int', 'int', 'vit', 'luk']; let i = 0; while (prog.sp > 0) { prog.stats[pat[i++ % 4]]++; prog.sp--; } refreshD(); }
    // target: current one, else the nearest enemy (objectives included) anywhere on the map
    let t = player.target && !player.target.dead ? player.target : null;
    if (!t) {
      let bd = 1e9;
      for (const e of enemies) { if (e.dead) continue; const d = hyp(e.x - player.x, e.y - player.y) - (e.obj ? 3 : 0); if (d < bd) { bd = d; t = e; } }
      if (t && hyp(t.x - player.x, t.y - player.y) > 30) t = null;
      if (t) { player.target = t; player.repathT = 0; }
    }
    if (!t && curMap === 3 && stairsOpen && !player.path.length) {
      const pt = portals[portals.length - 1], path = pt && findPath(player.x, player.y, pt.x, pt.y);
      if (path) player.path = path;
    }
    // skills on cooldown order, heal only when hurt
    autoSkT -= dt;
    const near = t && hyp(t.x - player.x, t.y - player.y) < (player.form === 'blade' ? 3.2 : 6);
    if (autoSkT <= 0 && near) {
      autoSkT = 0.3;
      const ids = SLOTS[player.form];
      for (let i = 0; i < 7; i++) {
        const id = ids[i], s = SKD[id], l = slv(id);
        if (!l || (player.cd[id] || 0) > 0 || player.mp < Math.round(s.mp(l) * classMpMul() * skillMpMul(id))) continue;
        if (id === 'heal' && player.hp > D.maxHp * 0.6) continue;
        castSkill(i);
        break;
      }
    }
    autoMorphT -= dt;
    if (autoMorphT <= 0 && near && player.morphT <= 0) { autoMorphT = 7; morph(); }
  }
  // dialogs pause the game, so this runs from the frame loop: AUTO picks a blessing / advanced class after a short wait
  let pendingOffline = null;
  function autoBless(dt) {
    if (pendingOffline && !paused && $('intro').hidden && !OP.on) { const r = pendingOffline; pendingOffline = null; showOffline(r); }
    const cls = !$('clsDlg').hidden;
    if (!autoOn() || (!blessOpen && !cls)) { autoBlessT = 0; return; }
    autoBlessT += dt;
    if (autoBlessT > 2.5) { autoBlessT = 0; const cs = cls ? $('clsCards').querySelectorAll('button') : $('blessCards').children; if (cs.length) cs[(Math.random() * cs.length) | 0].click(); }
  }
