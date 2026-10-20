  /* ================= borrowed mechanics: legendary powers, dodge & perfect dodge, boss stagger, slow-mo ================= */
  // Legendary items roll one unique power that changes how a build plays (Diablo-style).
  const LPOW = {
    thunder: { name: '雷鳴', d: '会心の一撃で、当たった敵の周りに小さな雷撃（攻撃力×0.8）' },
    twin: { name: '双魂の衝撃', d: '変身した瞬間、周りに衝撃波（攻撃力×3）' },
    soul: { name: '魂喰らい', d: '敵を倒すたびにMPが回復（最大MPの3%）' },
    last: { name: '不屈', d: 'HPが3割以下のとき、受けるダメージ -35%' },
    shadow: { name: '瞬影', d: '回避（疾駆）のあと2.5秒、与えるダメージ +40%' },
    star: { name: '流星の導き', d: '敵を倒すと15%で、近くの敵に流星が落ちる（攻撃力×2.2）' },
    break: { name: '砕きの刻印', d: 'ボスのブレイクゲージが1.7倍たまりやすい' },
    time: { name: '時詠み', d: '見切りが2倍長く続き、発動時にすべてのスキルの待ち時間が戻る' }
  };
  const LPOW_IDS = Object.keys(LPOW);
  let slowMo = 0, legendBusy = false;
  function hasPow(id) { return !!(GEAR.pow && GEAR.pow[id]); }
  function rollPow() { return LPOW_IDS[(Math.random() * LPOW_IDS.length) | 0]; }
  function powText(it) { return it.pow && LPOW[it.pow] ? '★' + LPOW[it.pow].name + '：' + LPOW[it.pow].d : ''; }
  function addSlowMo(t) { if (!reduceMotion) slowMo = Math.max(slowMo, t); }

  /* ---------- damage hooks ---------- */
  function legendDmgMul(e) {
    let m = 1;
    if (e.brkT > 0) m *= 1.5;
    if (player.shadowT > 0) m *= 1.4;
    return m;
  }
  function legendOnHit(e, dmg, crit) {
    if (e.boss) staggerAdd(e, dmg, crit);
    if (crit && hasPow('thunder') && !legendBusy) {
      legendBusy = true;
      try {
        for (const o of enemies) if (o !== e && !o.dead && hyp(o.x - e.x, o.y - e.y) < 1.8) hitEnemy(o, D.atk * 0.8);
        addVfx({ k: 'ring', x: e.x, y: e.y, R: 1.8, c: '150,230,255', w: 4, life: 0.3 });
      } finally { legendBusy = false; }
    }
  }
  function legendOnKill(e) {
    if (hasPow('soul')) player.mp = Math.min(D.maxMp, player.mp + D.maxMp * 0.03);
    if (hasPow('star') && !legendBusy && Math.random() < 0.15) {
      let best = null, bd = 6;
      for (const o of enemies) { if (o.dead || o === e) continue; const d = hyp(o.x - e.x, o.y - e.y); if (d < bd) { bd = d; best = o; } }
      if (best) { legendBusy = true; try { explode(best.x, best.y, 1.4, D.atk * 2.2); } finally { legendBusy = false; } }
    }
  }
  // returns the damage to apply, or -1 when the hit is dodged
  function legendOnHurt(dmg) {
    if (player.dodgeT > 0) { perfectDodge(); return -1; }
    if (hasPow('last') && player.hp < D.maxHp * 0.3) dmg = Math.round(dmg * 0.65);
    return dmg;
  }
  function legendOnMorph() {
    if (!hasPow('twin') || legendBusy) return;
    legendBusy = true;
    try { for (const o of enemies) if (!o.dead && hyp(o.x - player.x, o.y - player.y) < 2.6) hitEnemy(o, D.atk * 3); } finally { legendBusy = false; }
    addVfx({ k: 'ring', x: player.x, y: player.y, R: 2.6, c: '255,236,170', w: 9, life: 0.5 });
    addShake(6);
  }
  function legendDropMoment(e) {
    addSlowMo(0.45); zoomPunch(0.04); buzz([30, 30, 60]);
    addVfx({ k: 'sflash', c: '255,150,60', a: 0.22, life: 0.5 });
    addVfx({ k: 'pillar', x: e.x, y: e.y, c: '255,140,50', life: 1.4 });
  }

  /* ---------- dodge (疾駆) and perfect dodge (見切り) ---------- */
  function dodgeDir() {
    if (stick.active && (stick.dx || stick.dy)) {
      const wx = (stick.dx / HW + stick.dy / HH) / 2, wy = (stick.dy / HH - stick.dx / HW) / 2, d = hyp(wx, wy) || 1;
      return [wx / d, wy / d];
    }
    if (player.path.length) { const n = player.path[0], dx = n[0] + 0.5 - player.x, dy = n[1] + 0.5 - player.y, d = hyp(dx, dy); if (d > 0.05) return [dx / d, dy / d]; }
    let best = null, bd = 4;
    for (const o of enemies) { if (o.dead || o.obj) continue; const d = hyp(o.x - player.x, o.y - player.y); if (d < bd) { bd = d; best = o; } }
    if (best) { const dx = player.x - best.x, dy = player.y - best.y, d = hyp(dx, dy) || 1; return [dx / d, dy / d]; }
    return DIR_VEC[player.dir];
  }
  function startDodge(l) {
    const [ux, uy] = dodgeDir();
    player.roll = { ux, uy, t: 0.2, sp: 2.8 / 0.2 };
    player.dodgeT = 0.32; player.witchUsed = false;
    player.sprintT = 1.2 + 0.1 * l; player.sprintLv = l;
    if (hasPow('shadow')) player.shadowT = 2.5;
    player.path.length = 0; player.target = null;
    faceToward(ux, uy);
    refreshD();
    burst(player.x, player.y, 2, 'dust', 10, '', 2);
  }
  function perfectDodge() {
    if (player.witchUsed) return;
    player.witchUsed = true;
    const long = hasPow('time');
    addSlowMo(long ? 1.6 : 0.8);
    player.critT = long ? 4 : 2;
    if (long) player.cd = {};
    addText(player.x, player.y, '見切り！', 'multi', 80);
    addVfx({ k: 'ring', x: player.x, y: player.y, R: 2.4, c: '160,220,255', w: 7, life: 0.5 });
    addVfx({ k: 'sflash', c: '150,200,255', a: 0.2, life: 0.4 });
    zoomPunch(0.04); sfx('ice'); buzz(25);
    recAdd('dodges');
  }
  function dodgeUpdate(dt) {
    for (const k of ['dodgeT', 'critT', 'shadowT']) if (player[k] > 0) player[k] = Math.max(0, player[k] - dt);
    const R = player.roll;
    if (!R) return;
    const step = R.sp * dt, nx = player.x + R.ux * step, ny = player.y + R.uy * step;
    if (!blockedAt(nx, ny, 0.25)) { player.x = nx; player.y = ny; }
    else if (!blockedAt(nx, player.y, 0.25)) player.x = nx;
    else if (!blockedAt(player.x, ny, 0.25)) player.y = ny;
    if (Math.random() < 0.7) addPart({ k: 'magic', x: player.x, y: player.y, z: rand(10, 40), vx: 0, vy: 0, vz: 4, t: 0, life: 0.35, s: 1, c: player.form === 'blade' ? 'amber' : 'violet' });
    R.t -= dt;
    if (R.t <= 0) player.roll = null;
  }

  /* ---------- boss stagger / break (Elden Ring / Monster Hunter style) ---------- */
  function staggerAdd(e, dmg, crit) {
    if (e.dead || e.brkT > 0) return;
    const ref = e.world ? 60000 : e.maxHp * 0.1;
    e.stg = (e.stg || 0) + dmg / ref * 100 * (crit ? 1.5 : 1) * stgBoost * (hasPow('break') ? 1.7 : 1);
    if (e.stg >= 100) bossBreak(e);
  }
  let stgBoost = 1;
  function bossBreak(e) {
    e.stg = 0; e.brkT = 4; e.stunT = Math.max(e.stunT || 0, 4);
    e.charge = null;
    addText(e.x, e.y, 'BREAK!', 'multi', bodyH(e) + 40);
    addVfx({ k: 'ring', x: e.x, y: e.y, R: 3.2, c: '255,220,120', w: 10, life: 0.6 });
    addVfx({ k: 'sflash', c: '255,230,170', a: 0.25, life: 0.35 });
    burst(e.x, e.y, bodyH(e), 'gold', 30, 'gold', 4);
    addSlowMo(0.4); zoomPunch(0.06); addShake(10); buzz([40, 30, 40]); sfx('boom');
    toast(bossName(e) + 'が崩れた！ 4秒間 与えるダメージ +50%');
  }
