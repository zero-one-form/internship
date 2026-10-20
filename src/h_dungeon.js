
  /* ================= abyss dungeon (endless floors) ================= */
  let curFloor = 1, floorKills = 0, floorNeed = 0, stairsOpen = false, bossRef = null;
  const slams = [];
  const BOSS_HIT_CAP = 0.38, BOSS_SHOT_CAP = 0.14; // telegraphed boss attacks: max share of max HP per hit
  const BOSS_NAMES = { skeleton: '骨の王', zombie: '朽ちた巨人', goblin_elite: 'ゴブリンの大将', fire_ant: '炎蟻の女王' };
  function checkpointFloor() { return Math.floor(Math.max(0, prog.deep - 1) / 5) * 5 + 1; }
  function prepFloor() {
    const M = MAPS[3], f = curFloor;
    if (WB.on) { wbPrep(M); return; }
    const T = themeOf(f);
    M.name = (rankNow() ? '位階' + ROMAN[rankNow()] + '・' : '') + T.name + ' B' + f + 'F';
    M.biome = T.key;
    layoutFloor(M, f);
    M.ponds = T.ponds || 3;
    M.seed = 1000 + f * 7919;
    M.base = 2 + f * 2 + rankNow() * 25;
    M.elite = Math.min(0.5, 0.22 + f * 0.01);
    M.kinds = T.kinds ? T.kinds : f % 3 === 1 ? [['undead', 0.5], ['ant', 0.3], ['goblin', 0.2]] : f % 3 === 2 ? [['ant', 0.5], ['undead', 0.3], ['goblin', 0.2]] : [['goblin', 0.45], ['undead', 0.35], ['ant', 0.2]];
    M.rec = '敵Lv' + M.base + '／最深 B' + Math.max(prog.deep, f) + 'F' + (f === ABYSS_MAX ? '／最下層' : f % 5 === 0 ? '／ボスの階' : '／' + (f - (f - 1) % 5) + '〜' + (f - (f - 1) % 5 + 4) + '層');
    prog.floor = f;
  }
  function farTile() {
    let best = null, bd = -1;
    for (let k = 0; k < 500; k++) {
      const c = reachList[(Math.random() * reachList.length) | 0], i = c % MW, j = (c / MW) | 0;
      if (Math.min(i, j, MW - 1 - i, MH - 1 - j) < 5) continue;
      const d = hyp(i + 0.5 - CAMP.x, j + 0.5 - CAMP.y);
      if (d > bd && !blockedAt(i + 0.5, j + 0.5, 0.3)) { bd = d; best = [i + 0.5, j + 0.5]; }
    }
    return best || [CAMP.x + 6, CAMP.y + 6];
  }
  function startFloor() {
    if (WB.on) { wbStart(); return; }
    floorKills = 0; stairsOpen = false; bossRef = null; clearBossFx();
    floorNeed = Math.min(40, 12 + curFloor);
    if (curFloor > prog.deep) prog.deep = curFloor;
    lbOnFloor(curFloor);
    questEvent('floor');
    if (curFloor >= ABYSS_MAX) { bossFloorSetup(); spawnFinal(); }
    else if (curFloor % 5 === 0) { bossFloorSetup(); spawnBoss(); }
    else setupFloor();
  }
  function spawnBoss() {
    const t = farTile(), kinds = ['undead', 'goblin', 'ant', 'undead'], type = kinds[(curFloor / 5 - 1) % 4];
    const e = makeEnemy(type, t[0], t[1], MAPS[3].base + 3, ++packSeq, true);
    e.boss = true; e.maxHp = e.hp = Math.round(e.hp * (4 + curFloor / 5)); e.dmg *= 1.6; e.r = 0.55; e.aggro = 9; e.exp *= 8; e.slamT = 4; e.sumT = 12;
    if (type === 'undead') e.cv = (curFloor / 5) % 2 === 0 ? 1 : 0;
    enemies.push(e);
    bossRef = e;
    toast(bossName(e) + 'がこの階のどこかにいる');
  }
  function openStairs() {
    if (stairsOpen) return;
    stairsOpen = true;
    if (!WB.on) { addSlowMo(0.5); zoomPunch(0.03); }
    const t = farTile();
    const last = curFloor >= ABYSS_MAX;
    const pt = last ? { x: t[0], y: t[1], to: 0, arrive: 1, label: '地上へ帰還' } : { x: t[0], y: t[1], to: 3, arrive: 0, next: true, label: 'B' + (curFloor + 1) + 'F（' + themeOf(curFloor + 1).name + '）へ' };
    portals.push(pt);
    props.push({ kind: 'portal', v: 0, x: pt.x, y: pt.y, s: 1, ph: 0, depth: pt.x + pt.y });
    chunkCache.delete(Math.floor(pt.x / CH) * 64 + Math.floor(pt.y / CH));
    toast(last ? '地上への門が開いた！' : '次の階への門が開いた！（ミニマップの水色の点）');
    log('B' + (curFloor + 1) + 'Fへの門が開いた');
  }
  function dungeonKill(e) {
    if (curMap !== 3) return;
    floorOnKill(e);
    if (e.world) { bossRef = null; wbKilled(); return; }
    if (e.boss) { bossRef = null; if (e.final) finalVictory(e); else { toast('ボスを倒した！'); log('ボスを倒した'); } openStairs(); if (!e.final) blessSoon('ボス撃破の祝福'); return; }
    floorKills++;
    if (curFloor % 5 !== 0 && FLOOR.obj === 'kill' && floorKills >= floorNeed) openStairs();
  }
  /* ---------- boss kits ---------- */
  const bshots = [], blines = [], bpools = [];
  const MINION = { skeleton: 'undead', zombie: 'undead', goblin_elite: 'goblin', fire_ant: 'ant' };
  function clearBossFx() { slams.length = 0; bshots.length = 0; blines.length = 0; bpools.length = 0; }
  function segDist(px, py, L) {
    const dx = L.x2 - L.x1, dy = L.y2 - L.y1, l2 = dx * dx + dy * dy || 1;
    const u = clamp(((px - L.x1) * dx + (py - L.y1) * dy) / l2, 0, 1);
    return hyp(px - (L.x1 + dx * u), py - (L.y1 + dy * u));
  }
  function rayLen(x, y, dx, dy, max) {
    let l = 0;
    while (l < max && !blockedAt(x + dx * (l + 0.3), y + dy * (l + 0.3), 0.3)) l += 0.3;
    return l;
  }
  function summonMinions(e, n) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * TAU, x = e.x + Math.cos(a) * 1.6, y = e.y + Math.sin(a) * 1.6;
      if (blockedAt(x, y, 0.25)) continue;
      const m = makeEnemy(MINION[enemyKey(e)] || 'goblin', x, y, MAPS[3].base, e.pack, false);
      m.state = 'chase';
      enemies.push(m);
    }
    burst(e.x, e.y, 20, 'magic', 18, 'violet', 2);
  }
  function boneRain(e, n) {
    sfx('warn');
    for (let k = 0; k < n; k++) {
      let x = player.x, y = player.y;
      if (k) { for (let t = 0; t < 8; t++) { const a = Math.random() * TAU, r = rand(0.8, 3.4); x = player.x + Math.cos(a) * r; y = player.y + Math.sin(a) * r; if (!blockedAt(x, y, 0.1)) break; } }
      slams.push({ x, y, t: -k * 0.11, at: 1.05, r: 0.95, dmg: e.dmg * 1.3 });
    }
  }
  function fireRing(e, n, off) {
    sfx('fire');
    for (let k = 0; k < n; k++) { const a = off + k * TAU / n; bshots.push({ x: e.x, y: e.y, vx: Math.cos(a) * 4.2, vy: Math.sin(a) * 4.2, t: 0, life: 3.2, dmg: e.dmg * 0.9 }); }
    burst(e.x, e.y, 16, 'spark', 14, 'amber', 2.2);
  }
  function firePools(e, n) {
    for (let k = 0; k < n; k++) {
      // retry a few spots so the attack doesn't fizzle next to walls
      for (let tries = 0; tries < 8; tries++) {
        const a = Math.random() * TAU, r = k ? rand(1.2, 3) * (1 - tries * 0.08) : 0, x = player.x + Math.cos(a) * r, y = player.y + Math.sin(a) * r;
        if (blockedAt(x, y, 0.1)) continue;
        bpools.push({ x, y, r: 1.15, t: 0, wait: 0.85, life: 6, dps: e.dmg * 0.5, kind: 'fire', tick: 0 });
        break;
      }
    }
  }
  function fissures(e, n) {
    sfx('warn');
    const a0 = Math.atan2(player.y - e.y, player.x - e.x);
    for (let k = 0; k < n; k++) {
      const a = a0 + (k - (n - 1) / 2) * 0.55, len = 9;
      blines.push({ x1: e.x, y1: e.y, x2: clamp(e.x + Math.cos(a) * len, 1, MW - 1), y2: clamp(e.y + Math.sin(a) * len, 1, MH - 1), w: 1.0, t: 0, at: 1.2, dmg: e.dmg * 2 });
    }
  }
  function startCharge(e) {
    const dx0 = player.x - e.x, dy0 = player.y - e.y, d = hyp(dx0, dy0) || 1, dx = dx0 / d, dy = dy0 / d;
    const len = Math.max(1.5, rayLen(e.x, e.y, dx, dy, 8));
    e.charge = { dx, dy, t: 0, at: 0.85, left: len, hit: false };
    blines.push({ x1: e.x, y1: e.y, x2: e.x + dx * len, y2: e.y + dy * len, w: 1.1, t: 0, at: 0.85, dmg: 0 });
    sfx('warn');
  }
  function chargeStep(e, dt) {
    const c = e.charge;
    c.t += dt;
    e.dir = dirFrom(c.dx, c.dy);
    if (Math.abs(c.dx - c.dy) > 0.01) e.faceLeft = (c.dx - c.dy) < 0;
    if (c.t < c.at) return true;
    const st = Math.min(c.left, 13 * dt);
    c.left -= st;
    const moved = moveEnemy(e, e.x + c.dx * st, e.y + c.dy * st);
    e.moving = true;
    if (Math.random() < dt * 30) burst(e.x, e.y, 2, 'dust', 2, '', 1.2);
    if (!c.hit && !player.dead && hyp(player.x - e.x, player.y - e.y) < 0.95) { c.hit = true; hurtPlayer(e.dmg * 2.2, BOSS_HIT_CAP); sfx('bash'); }
    if (c.left <= 0 || !moved) { e.charge = null; sfx('slam'); burst(e.x, e.y, 4, 'dust', 14, '', 2.4); }
    return true;
  }
  function bossPhase(e, k) {
    if (k === 'skeleton') summonMinions(e, 4);
    else if (k === 'goblin_elite') { summonMinions(e, 3); e.speed *= 1.15; }
    else if (k === 'fire_ant') fireRing(e, 20, 0);
    else { sfx('warn'); slams.push({ x: e.x, y: e.y, t: 0, at: 1.4, r: 3, dmg: e.dmg * 2.4 }); }
  }
  function bossThink(e, dt, dp) {
    if (e.final) return finalThink(e, dt, dp);
    const k = enemyKey(e), nm = bossName(e);
    if (e.cdA === undefined) { e.cdA = 3; e.cdB = 6; e.phase = 1; e.lx = e.x; e.ly = e.y; }
    const fr = e.hp / e.maxHp;
    if (e.phase === 1 && fr < 0.5) { e.phase = 2; toast(nm + 'の攻撃が激しくなった！'); sfx('cry'); bossPhase(e, k); }
    if (!e.enraged && fr < 0.3) { e.enraged = true; e.speed *= 1.25; e.atkInt *= 0.8; toast(nm + 'が怒り狂った！'); sfx('aura'); burst(e.x, e.y, 30, 'magic', 30, 'amber', 2.5); }
    if (e.charge) return chargeStep(e, dt);
    const rate = e.enraged ? 1.45 : 1;
    e.cdA -= dt * rate; e.cdB -= dt * rate; e.sumT -= dt * rate;
    if (e.wave > 0) { e.wave -= dt; if (e.wave <= 0) fireRing(e, 16, Math.PI / 16); }
    if (e.state !== 'chase' || player.dead || dp > 10) return false;
    if (k === 'skeleton') {
      if (e.cdA <= 0) { e.cdA = 5.5; sfx('warn'); slams.push({ x: player.x, y: player.y, t: 0, at: 1.3, r: 1.9, dmg: e.dmg * 2.4 }); }
      if (e.cdB <= 0) { e.cdB = 8.5; boneRain(e, e.phase === 2 ? 11 : 7); }
    } else if (k === 'goblin_elite') {
      if (e.cdA <= 0) { e.cdA = 6; startCharge(e); return true; }
      if (e.cdB <= 0) { e.cdB = 7.5; sfx('warn'); slams.push({ x: e.x, y: e.y, t: 0, at: 1.1, r: 2.4, dmg: e.dmg * 2 }); }
    } else if (k === 'fire_ant') {
      if (e.cdA <= 0) { e.cdA = 5; fireRing(e, e.phase === 2 ? 14 : 10, Math.random() * TAU); if (e.phase === 2) e.wave = 0.6; }
      if (e.cdB <= 0) { e.cdB = 8; firePools(e, e.phase === 2 ? 4 : 3); }
    } else {
      if (e.cdA <= 0) { e.cdA = 6.5; fissures(e, e.phase === 2 ? 5 : 3); }
      if (e.cdB <= 0) { e.cdB = 8; sfx('warn'); slams.push({ x: e.x, y: e.y, t: 0, at: 1.6, r: 2.8, dmg: e.dmg * 2.6 }); }
      if (e.phase === 2 && hyp(e.x - e.lx, e.y - e.ly) > 0.9) { e.lx = e.x; e.ly = e.y; bpools.push({ x: e.x, y: e.y, r: 0.9, t: 0, wait: 0, life: 5, dps: e.dmg * 0.45, kind: 'poison', tick: 0.3 }); }
    }
    if (e.sumT <= 0) { e.sumT = 16; summonMinions(e, e.phase === 2 ? 4 : 3); }
    return false;
  }
  function dungeonUpdate(dt) {
    if (curMap === 3) abyssAmbient(dt);
    for (let i = slams.length - 1; i >= 0; i--) {
      const s = slams[i];
      s.t += dt;
      if (s.t < s.at) continue;
      slams.splice(i, 1);
      if (!player.dead && hyp(player.x - s.x, player.y - s.y) < s.r) hurtPlayer(s.dmg, BOSS_HIT_CAP);
      addFx({ k: 'boom', x: s.x, y: s.y, r: s.r, t: 0, life: 0.55 });
      burst(s.x, s.y, 4, 'dust', s.r > 1.2 ? 14 : 6, '', 2.5);
    }
    for (let i = bshots.length - 1; i >= 0; i--) {
      const s = bshots[i];
      s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.t > s.life || blockedAt(s.x, s.y, 0.05)) { bshots.splice(i, 1); continue; }
      if (!player.dead && hyp(player.x - s.x, player.y - s.y) < 0.45) { bshots.splice(i, 1); hurtPlayer(s.dmg, BOSS_SHOT_CAP); burst(s.x, s.y, 20, 'spark', 8, 'amber', 1.6); }
    }
    for (let i = blines.length - 1; i >= 0; i--) {
      const L = blines[i];
      L.t += dt;
      if (L.t < L.at) continue;
      blines.splice(i, 1);
      if (L.dmg > 0) {
        if (!player.dead && segDist(player.x, player.y, L) < L.w / 2 + 0.2) hurtPlayer(L.dmg, BOSS_HIT_CAP);
        for (let k = 0; k <= 6; k++) { const u = k / 6; burst(L.x1 + (L.x2 - L.x1) * u, L.y1 + (L.y2 - L.y1) * u, 3, 'dust', 4, '', 2); }
        sfx('slam');
      }
    }
    for (let i = bpools.length - 1; i >= 0; i--) {
      const P = bpools[i];
      if (P.wait > 0) { P.wait -= dt; if (P.wait <= 0) sfx('fire'); continue; }
      P.t += dt; P.tick -= dt;
      if (P.t > P.life) { bpools.splice(i, 1); continue; }
      if (P.tick <= 0) { P.tick = 0.5; if (!player.dead && hyp(player.x - P.x, player.y - P.y) < P.r) hurtPlayer(P.dps * 0.5); }
      if (Math.random() < dt * 4) burst(P.x + rand(-0.5, 0.5) * P.r, P.y + rand(-0.5, 0.5) * P.r, 2, 'magic', 1, P.kind === 'fire' ? 'amber' : 'mint', 0.6);
    }
  }
  function isoQuad(L, fx) {
    const dx = L.x2 - L.x1, dy = L.y2 - L.y1, len = hyp(dx, dy) || 1, nx = -dy / len * L.w / 2, ny = dx / len * L.w / 2;
    const ex = L.x1 + dx * fx, ey = L.y1 + dy * fx;
    ctx.beginPath();
    ctx.moveTo(isoX(L.x1 + nx, L.y1 + ny), isoY(L.x1 + nx, L.y1 + ny));
    ctx.lineTo(isoX(ex + nx, ey + ny), isoY(ex + nx, ey + ny));
    ctx.lineTo(isoX(ex - nx, ey - ny), isoY(ex - nx, ey - ny));
    ctx.lineTo(isoX(L.x1 - nx, L.y1 - ny), isoY(L.x1 - nx, L.y1 - ny));
    ctx.closePath();
  }
  function drawDungeonGround() {
    for (const P of bpools) {
      const x0 = isoX(P.x, P.y), y0 = isoY(P.x, P.y), rx = P.r * 45.25 * zoom;
      if (x0 < -rx || x0 > W + rx || y0 < -rx || y0 > H + rx) continue;
      ctx.save();
      ctx.translate(x0, y0); ctx.scale(1, 0.5);
      if (P.wait > 0) {
        ctx.globalAlpha = 0.85; ctx.strokeStyle = '#ffa04a'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
        ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.stroke();
      } else {
        const fire = P.kind === 'fire', g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
        g.addColorStop(0, fire ? 'rgba(255,214,110,0.85)' : 'rgba(170,255,130,0.7)');
        g.addColorStop(0.55, fire ? 'rgba(255,96,30,0.6)' : 'rgba(70,190,70,0.5)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = clamp(Math.min((P.life - P.t) / 0.8, P.t / 0.25), 0, 1) * (0.85 + 0.15 * Math.sin(time * 9 + P.x));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
    for (const L of blines) {
      const k = clamp(L.t / L.at, 0, 1);
      ctx.save();
      ctx.fillStyle = L.dmg > 0 ? '#ff3b4e' : '#ffb03b';
      ctx.globalAlpha = 0.16; isoQuad(L, 1); ctx.fill();
      ctx.globalAlpha = 0.9; ctx.strokeStyle = L.dmg > 0 ? '#ff6b7a' : '#ffc46b'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.globalAlpha = 0.38; isoQuad(L, k); ctx.fill();
      ctx.restore();
    }
    for (const s of slams) {
      if (s.t < 0) continue;
      const k = s.t / s.at, x0 = isoX(s.x, s.y), y0 = isoY(s.x, s.y), rx = s.r * 45.25 * zoom;
      ctx.save();
      ctx.globalAlpha = 0.18 + 0.25 * k;
      ctx.fillStyle = '#ff3b4e';
      ctx.beginPath(); ctx.ellipse(x0, y0, Math.max(0.1, rx * k), Math.max(0.1, rx * k / 2), 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = '#ff6b7a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x0, y0, rx, rx / 2, 0, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    if (bossRef && !bossRef.dead && bossRef.final) {
      const x0 = isoX(bossRef.x, bossRef.y), y0 = isoY(bossRef.x, bossRef.y), rx = (70 + 10 * Math.sin(time * 3)) * zoom;
      ctx.save(); ctx.globalAlpha = 0.4; ctx.strokeStyle = '#b07cff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(x0, y0, rx, rx / 2, 0, 0, TAU); ctx.stroke(); ctx.restore();
    }
    if (bossRef && !bossRef.dead && bossRef.enraged) {
      const x0 = isoX(bossRef.x, bossRef.y), y0 = isoY(bossRef.x, bossRef.y), rx = (40 + 6 * Math.sin(time * 8)) * zoom;
      ctx.save(); ctx.globalAlpha = 0.45; ctx.fillStyle = '#ff2a3a';
      ctx.beginPath(); ctx.ellipse(x0, y0, rx, rx / 2, 0, 0, TAU); ctx.fill(); ctx.restore();
    }
  }
  function drawBossShots() {
    for (const s of bshots) {
      const x0 = isoX(s.x, s.y), y0 = isoY(s.x, s.y);
      if (x0 < -30 || x0 > W + 30 || y0 < -60 || y0 > H + 30) continue;
      const r = 9 * zoom, y1 = y0 - 22 * zoom;
      ctx.save();
      ctx.globalAlpha = 0.3; ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(x0, y0, r * 0.8, r * 0.4, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x0, y1, 0, x0, y1, r * 1.9);
      g.addColorStop(0, 'rgba(255,244,190,1)'); g.addColorStop(0.35, 'rgba(255,140,40,0.9)'); g.addColorStop(1, 'rgba(255,60,20,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x0, y1, r * 1.9, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }
