
  /* ================= abyss floors 2.0: objectives, curses, elite affixes, treasure goblins, blessings ================= */
  var FLOOR = { obj: 'kill', mods: [], goal: 0, done: 0, timer: 0, waveT: 0, burnT: 0, bonus: 0, last: '' };
  var BLESS = [], phoenixUsed = false, blessOpen = false, inBless = false, blessQueue = 0;
  const OBJ_INFO = { kill: '殲滅', bounty: '賞金首', treasure: '宝探し', survive: '耐久', seal: '封印石', boss: 'ボス' };
  const MODS = {
    frenzy: ['狂乱', '敵が速く、攻撃的', 25], armored: ['鋼鉄', '敵の体力1.4倍', 25], horde: ['大群', '敵が大幅に増える', 20], elite: ['精鋭', '強い個体が増える', 30],
    blast: ['爆ぜる骸', '倒した敵が爆発する', 30], regen: ['再生', '敵が回復し続ける', 20], burning: ['灼熱', '足元に炎が湧く', 25], gold: ['黄金', 'ゴールド2倍', 0], dark: ['深い闇', '視界が暗い', 15]
  };
  const AFFIX = { fast: '俊足の', tough: '頑強な', burn: '業火の', split: '分裂する', shield: '守護された', regen: '再生する', thunder: '雷を放つ', nova: '爆ぜる' };
  const BASE_NAME = { goblin: 'ゴブリン', goblin_elite: 'ゴブリン戦士', fire_ant: '火蟻', skeleton: '骸骨', zombie: 'ゾンビ' };
  const BLESSINGS = [
    ['atk', '剛力の祝福', '攻撃力 +20%'], ['spd', '疾風の祝福', '移動速度 +15%・攻撃速度 +10%'], ['crit', '鷹の目', '会心率 +8%'], ['critd', '断罪の刃', '会心ダメージ +40%'],
    ['leech', '血の盟約', 'HP吸収 +3%'], ['mana', '泉の加護', 'MP回復 +4/秒'], ['guard', '守護の鎧', '受けるダメージ -12%'], ['cdr', '時の砂', '再使用時間 -15%'],
    ['chain', '連爆', '敵を倒すと35%で周りが爆発'], ['thunder', '雷霆', '攻撃が当たると15%で落雷'], ['soul', '魂喰らい', '敵を倒すとHP 2%回復'], ['phoenix', '不死鳥', '一度だけHP50%で立ち上がる'],
    ['greed', '強欲', 'ゴールド +50%・経験値 +25%'], ['echo', '残響', 'スキルの20%でMPを使わない']
  ];
  const bN = (id) => { let n = 0; for (const b of BLESS) if (b === id) n++; return n; };
  function derived(form) {
    const d = soulMods(petMods(classMods(derivedBase(form), form)));
    if (!BLESS || !BLESS.length) return d;
    d.atk *= 1 + 0.2 * bN('atk');
    d.speed *= 1 + 0.15 * bN('spd'); d.interval /= 1 + 0.1 * bN('spd');
    d.crit = Math.min(0.85, d.crit + 0.08 * bN('crit'));
    d.critMul += 0.4 * bN('critd');
    d.steal += 0.03 * bN('leech');
    d.mpRegen += 4 * bN('mana');
    d.guard = Math.min(0.8, d.guard + 0.12 * bN('guard'));
    d.cdr = Math.min(0.7, d.cdr + 0.15 * bN('cdr'));
    return d;
  }
  function inDive() { return curMap === 3; }
  function floorGoldMul() { return inDive() ? rankMul() * (1 + FLOOR.bonus / 100) * (FLOOR.mods.includes('gold') ? 2 : 1) * (1 + 0.5 * bN('greed')) : 1; }
  function floorExpMul() { return inDive() ? rankMul() * (1 + FLOOR.bonus / 100) * (1 + 0.25 * bN('greed')) : 1; }
  function clearDive() { if (BLESS.length) { BLESS = []; refreshD(); } phoenixUsed = false; blessQueue = 0; prog.bless = []; prog.phx = false; }

  /* ---------- floor setup ---------- */
  function openTile(minCamp, avoid) {
    for (let k = 0; k < 400; k++) {
      const c = reachList[(Math.random() * reachList.length) | 0], i = c % MW, j = (c / MW) | 0, x = i + 0.5, y = j + 0.5;
      if (Math.min(i, j, MW - 1 - i, MH - 1 - j) < 4 || hyp(x - CAMP.x, y - CAMP.y) < minCamp || blockedAt(x, y, 0.35)) continue;
      if (avoid && avoid.some((p) => hyp(p[0] - x, p[1] - y) < 9)) continue;
      return [x, y];
    }
    return [CAMP.x + 7, CAMP.y + 7];
  }
  function tileNear(x, y, r0, r1) {
    for (let k = 0; k < 60; k++) {
      const a = Math.random() * TAU, r = rand(r0, r1), px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      if (px < 2 || py < 2 || px > MW - 2 || py > MH - 2 || blockedAt(px, py, 0.3) || !reachable[idx(Math.floor(px), Math.floor(py))] || inCamp(px, py)) continue;
      return [px, py];
    }
    return null;
  }
  function pickKind() { const K = MAPS[3].kinds || [['goblin', 1]]; let r = Math.random() * K.reduce((a, k) => a + k[1], 0); for (const k of K) { r -= k[1]; if (r <= 0) return k[0]; } return K[0][0]; }
  const specials = [];
  function spawnSpecial(kind) {
    const base = MAPS[3].base, p = openTile(10, specials);
    specials.push(p);
    let e;
    if (kind === 'chest') {
      e = makeEnemy('undead', p[0], p[1], base, ++packSeq, false);
      Object.assign(e, { obj: 'chest', maxHp: 1, hp: 1, armor: 0, exp: 0, title: '宝箱', _f: 1, r: 0.45 });
      for (let k = 0; k < 4; k++) { const q = tileNear(p[0], p[1], 1.2, 2.6); if (q) enemies.push(makeEnemy(pickKind(), q[0], q[1], base + 1, e.pack, k === 0)); }
    } else if (kind === 'seal') {
      e = makeEnemy('undead', p[0], p[1], base + 2, ++packSeq, false);
      Object.assign(e, { obj: 'seal', armor: 0, title: '封印石', spT: 2, _f: 1, r: 0.6 });
      e.maxHp = e.hp = Math.round(e.maxHp * 9); e.exp *= 5;
    } else if (kind === 'goblin') {
      e = makeEnemy('goblin', p[0], p[1], base + 3, ++packSeq, false);
      Object.assign(e, { treasure: true, title: '宝ゴブリン', tg: 24, _f: 1, aggro: 0 });
      e.maxHp = e.hp = Math.round(e.maxHp * 5); e.speed = 3.3;
      toast('宝ゴブリンが現れた！ 逃げられる前に倒せ');
    } else {
      e = makeEnemy(pickKind(), p[0], p[1], base + 2, ++packSeq, true);
      e.bounty = true; e.forceAff = 2;
      e.maxHp = e.hp = Math.round(e.maxHp * 2); e.exp *= 3;
      for (let k = 0; k < 2; k++) { const q = tileNear(p[0], p[1], 1, 2.2); if (q) enemies.push(makeEnemy(e.type, q[0], q[1], base + 1, e.pack, false)); }
    }
    enemies.push(e);
    return e;
  }
  function setupFloor() {
    const f = curFloor;
    specials.length = 0;
    FLOOR.mods = []; FLOOR.done = 0; FLOOR.timer = 0; FLOOR.goal = 0; FLOOR.burnT = 4;
    const nm = f >= 26 ? 2 : f >= 6 ? 1 : 0, keys = Object.keys(MODS);
    while (FLOOR.mods.length < nm) { const k = keys[randi(0, keys.length - 1)]; if (!FLOOR.mods.includes(k)) FLOOR.mods.push(k); }
    FLOOR.bonus = FLOOR.mods.reduce((a, k) => a + MODS[k][2], 0);
    let obj = 'kill';
    if (f >= 3) { const pool = ['kill', 'bounty', 'treasure', 'seal'] /* 耐久 removed from the rotation (tedious); FLOOR.force can still pick it */.filter((o) => o !== FLOOR.last); obj = pool[randi(0, pool.length - 1)]; }
    if (FLOOR.force) { obj = FLOOR.force; FLOOR.force = null; }
    FLOOR.obj = obj; FLOOR.last = obj;
    if (obj === 'kill') FLOOR.goal = floorNeed = Math.round(floorNeed * (FLOOR.mods.includes('horde') ? 1.3 : 1));
    else if (obj === 'survive') { FLOOR.goal = Math.round(35 + Math.min(25, f * 0.5)); FLOOR.timer = FLOOR.goal; FLOOR.waveT = 2; }
    else { FLOOR.goal = 3; for (let i = 0; i < 3; i++) spawnSpecial(obj === 'treasure' ? 'chest' : obj === 'seal' ? 'seal' : 'bounty'); }
    if (f >= 6 && !FLOOR.mods.includes(weekMod())) { FLOOR.mods.push(weekMod()); FLOOR.bonus += MODS[weekMod()][2]; }
    if (FLOOR.mods.includes('horde')) for (let k = 0; k < 8; k++) spawnPack();
    if (f >= 4 && Math.random() < 0.22) spawnSpecial('goblin');
    const M = MAPS[3];
    M.rec = LAYOUT_NAME[M.layout || 'field'] + '／' + OBJ_INFO[obj] + '：' + objGoal() + (FLOOR.mods.length ? '／' + FLOOR.mods.map((k) => MODS[k][0]).join('・') + '（報酬+' + FLOOR.bonus + '%）' : '');
    toast(OBJ_INFO[obj] + '：' + objGoal());
  }
  function objGoal() {
    const o = FLOOR.obj;
    return o === 'kill' ? '敵を' + floorNeed + '体倒せ' : o === 'bounty' ? '3体の賞金首を倒せ' : o === 'treasure' ? '3つの宝箱を開けよ' : o === 'survive' ? FLOOR.goal + '秒生き延びよ' : o === 'seal' ? '3つの封印石を砕け' : 'ボスを倒せ';
  }
  function bossFloorSetup() { FLOOR.obj = 'boss'; FLOOR.mods = []; FLOOR.bonus = 0; specials.length = 0; }

  /* ---------- enemies ---------- */
  function floorInitEnemy(e) {
    e._f = 1;
    if (!inDive() || e.obj) return;
    const f = curFloor, m = FLOOR.mods;
    // deeper floors are tougher on their own, not just higher level (B50: HP x5, damage x3)
    e.maxHp = Math.round(e.maxHp * (1 + f * 0.08)); e.hp = e.maxHp; e.dmg *= 1 + f * 0.04;
    if (m.includes('elite') && !e.elite && !e.boss && Math.random() < 0.2) { e.elite = true; e.maxHp *= 3; e.hp = e.maxHp; e.dmg *= 1.4; e.exp *= 3; e.r *= 1.2; }
    if (m.includes('frenzy')) { e.speed *= 1.25; e.dmg *= 1.15; e.atkInt *= 0.85; }
    if (m.includes('armored')) { e.maxHp = Math.round(e.maxHp * 1.4); e.hp = e.maxHp; }
    if (m.includes('regen')) e.regen = 0.02;
    let n = e.forceAff || 0;
    if (!n && e.elite && f >= 6) n = f >= 26 ? 2 : 1;
    if (!n && e.boss && f >= 25) n = f >= 40 ? 2 : 1;
    if (n) {
      const pool = e.boss ? ['thunder', 'burn', 'shield', 'fast'] : Object.keys(AFFIX), aff = [];
      while (aff.length < n) { const a = pool[randi(0, pool.length - 1)]; if (!aff.includes(a)) aff.push(a); }
      e.aff = aff;
      if (aff.includes('fast')) e.speed *= 1.45;
      if (aff.includes('tough')) { e.maxHp = Math.round(e.maxHp * 1.8); e.hp = e.maxHp; }
      if (aff.includes('regen')) e.regen = Math.max(e.regen || 0, 0.03);
      if (aff.includes('shield')) e.shCycle = 3;
      if (aff.includes('thunder')) e.thT = 2.5;
      if (!e.boss) e.title = (e.bounty ? '賞金首 ' : '') + aff.map((a) => AFFIX[a]).join('') + (BASE_NAME[enemyKey(e)] || '魔物');
    }
  }
  function affixThink(e, dt) {
    if (e.regen && e.hp < e.maxHp) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * e.regen * dt);
    if (e.shieldT > 0) e.shieldT = Math.max(0, e.shieldT - dt);
    if (!e.aff) return;
    const chase = e.state === 'chase' && !player.dead, dp = hyp(player.x - e.x, player.y - e.y);
    if (e.shCycle != null) { e.shCycle -= dt; if (e.shCycle <= 0) { e.shCycle = 6.5; e.shieldT = 1.8; } }
    if (e.aff.includes('burn') && chase) { e.bnT = (e.bnT || 0) - dt; if (e.bnT <= 0) { e.bnT = 1.4; bpools.push({ x: e.x, y: e.y, r: 0.85, t: 0, wait: 0.35, life: 4, dps: e.dmg * 0.45, kind: 'fire', tick: 0.2 }); } }
    if (e.thT != null && chase && dp < 8) { e.thT -= dt; if (e.thT <= 0) { e.thT = e.boss ? 2.2 : 3.2; const d = dp || 1; bshots.push({ x: e.x, y: e.y, vx: (player.x - e.x) / d * 5.5, vy: (player.y - e.y) / d * 5.5, t: 0, life: 2.6, dmg: e.dmg * 0.8 }); sfx('zap'); } }
  }
  function objThink(e, dt) {
    e.hitT = Math.max(0, e.hitT - dt);
    if (e.obj === 'seal') {
      e.spT -= dt;
      if (e.spT <= 0 && hyp(player.x - e.x, player.y - e.y) < 15 && !player.dead) {
        e.spT = 5;
        const q = tileNear(e.x, e.y, 1, 2);
        if (q) { const m = makeEnemy(pickKind(), q[0], q[1], MAPS[3].base, e.pack, false); m.state = 'chase'; enemies.push(m); burst(q[0], q[1], 10, 'magic', 10, 'violet', 2); }
      }
      return true;
    }
    if (e.obj === 'chest') return true;
    if (e.treasure) {
      e.anim += dt; e.moving = false; e.tg -= dt;
      if (e.tg <= 0) { e.dead = true; e.deathT = 0.3; burst(e.x, e.y, 20, 'gold', 20, 'gold', 3); toast('宝ゴブリンに逃げられた……'); return true; }
      const dx = e.x - player.x, dy = e.y - player.y, d = hyp(dx, dy) || 1;
      if (d < 7 && !player.dead) {
        const j = Math.sin(e.anim * 2.3) * 0.7, ux = dx / d, uy = dy / d, vx = ux - uy * j, vy = uy + ux * j, vl = hyp(vx, vy) || 1;
        e.moving = moveEnemy(e, e.x + vx / vl * e.speed * dt, e.y + vy / vl * e.speed * dt);
        if (!e.moving) moveEnemy(e, e.x + rand(-1, 1) * e.speed * dt, e.y + rand(-1, 1) * e.speed * dt);
        e.dir = dirFrom(vx, vy); e.faceLeft = (vx - vy) < 0;
      }
      if (Math.random() < dt * 8) burst(e.x, e.y, 20, 'gold', 1, 'gold', 1);
      return true;
    }
    return false;
  }
  function floorOnKill(e) {
    if (e.obj === 'chest') {
      const g = Math.round(MAPS[3].base * 30 * floorGoldMul());
      prog.gold += g; addText(e.x, e.y, '+' + g + 'G', 'gold', 40);
      const it = genItem(MAPS[3].base + 2, Math.max(1, rollRarity(true)));
      loot.push({ x: e.x + 0.4, y: e.y, it, t: 0, sx: e.x, sy: e.y });
      addVfx({ k: 'drop', x: e.x, y: e.y, c: Math.max(2, it.rar), life: 0.9 }); sfx('rare');
      objProgress('宝箱');
    } else if (e.obj === 'seal') {
      vfxExplode(e.x, e.y, 1.4); addShake(8); objProgress('封印石');
    } else if (e.bounty) {
      const it = genItem(e.lvl + 2, Math.max(2, rollRarity(true)));
      loot.push({ x: e.x, y: e.y, it, t: 0, sx: e.x, sy: e.y });
      objProgress('賞金首');
    } else if (e.treasure) {
      const g = Math.round(MAPS[3].base * 120 * floorGoldMul());
      prog.gold += g; addText(e.x, e.y, '+' + g + 'G', 'gold', 50);
      for (let k = 0; k < 3; k++) { const it = genItem(e.lvl + 2, k === 0 && Math.random() < 0.35 ? 3 : Math.max(2, rollRarity(true))); loot.push({ x: e.x + rand(-1, 1), y: e.y + rand(-1, 1), it, t: 0, sx: e.x, sy: e.y }); }
      for (let k = 0; k < 14; k++) addVfx({ k: 'orb', sx: e.x, sy: e.y, sh: 30, ox: rand(-2, 2), oy: rand(-2, 2), g: 'gold', life: 0.6 + Math.random() * 0.5, d: k * 0.03 });
      toast('宝ゴブリンを倒した！ ' + g + 'G と装備を手に入れた'); sfx('legend'); addShake(10);
    }
    if (e.aff && !e.boss) {
      if (e.aff.includes('split')) for (let k = 0; k < 3; k++) { const q = tileNear(e.x, e.y, 0.5, 1.5); if (q) { const m = makeEnemy(e.type, q[0], q[1], Math.max(1, e.lvl - 2), e.pack, false); m.state = 'chase'; m._f = 1; enemies.push(m); } }
      if (e.aff.includes('nova')) slams.push({ x: e.x, y: e.y, t: 0, at: 0.9, r: 1.6, dmg: e.dmg * 1.6 });
    }
    if (FLOOR.mods.includes('blast') && !e.obj && !e.boss) slams.push({ x: e.x, y: e.y, t: 0, at: 0.9, r: 1.15, dmg: e.dmg * 1.1 });
    if (BLESS.length && !e.obj) {
      if (bN('soul') && !player.dead) player.hp = Math.min(D.maxHp, player.hp + D.maxHp * 0.02 * bN('soul'));
      if (bN('chain') && !inBless && Math.random() < 0.35) { inBless = true; explode(e.x, e.y, 1.25, D.atk * 0.6 * bN('chain')); inBless = false; }
    }
  }
  function objProgress(name) {
    if (FLOOR.obj === 'treasure' || FLOOR.obj === 'seal' || FLOOR.obj === 'bounty') {
      FLOOR.done++;
      if (FLOOR.done >= FLOOR.goal) { openStairs(); if (FLOOR.obj === 'treasure') blessSoon('宝箱の祝福'); }
      else toast(name + ' ' + FLOOR.done + '/' + FLOOR.goal);
    }
  }
  function blessOnHit(e) {
    if (inBless || !bN('thunder') || Math.random() > 0.15 * bN('thunder')) return;
    inBless = true;
    addFx({ k: 'chain', pts: [[e.x, e.y, 260], [e.x, e.y, bodyH(e)]], t: 0, life: 0.25 });
    for (const o of enemies) if (!o.dead && o !== e && hyp(o.x - e.x, o.y - e.y) < 1.4) hitEnemy(o, D.atk * 0.8);
    if (!e.dead) hitEnemy(e, D.atk * 0.8);
    sfx('zap');
    inBless = false;
  }
  function phoenixSave() {
    if (!bN('phoenix') || phoenixUsed) return false;
    phoenixUsed = true; prog.phx = true;
    player.hp = Math.round(D.maxHp * 0.5);
    addVfx({ k: 'pillar', x: player.x, y: player.y, c: '255,140,60', life: 1.2 }); addVfx({ k: 'ring', x: player.x, y: player.y, R: 3, c: '255,140,60', w: 10, life: 0.7 }); addVfx({ k: 'sflash', c: '255,170,90', a: 0.4, life: 0.5 });
    toast('不死鳥の祝福で立ち上がった！'); sfx('legend');
    return true;
  }
  function floorUpdate(dt) {
    if (!inDive() || player.dead) return;
    if (FLOOR.obj === 'survive' && !stairsOpen) {
      FLOOR.timer -= dt; FLOOR.waveT -= dt;
      if (FLOOR.waveT <= 0) {
        FLOOR.waveT = Math.max(1.5, 3 - curFloor * 0.02);
        const n = 2 + (Math.random() < 0.5 ? 1 : 0);
        for (let k = 0; k < n; k++) { const q = tileNear(player.x, player.y, 6, 9); if (q) { const m = makeEnemy(pickKind(), q[0], q[1], MAPS[3].base, ++packSeq, Math.random() < 0.12); m.state = 'chase'; enemies.push(m); burst(q[0], q[1], 10, 'magic', 8, 'violet', 2); } }
      }
      if (FLOOR.timer <= 0) { toast('生き延びた！'); openStairs(); const it = genItem(MAPS[3].base + 2, Math.max(2, rollRarity(true))); loot.push({ x: player.x + 0.6, y: player.y, it, t: 0, sx: player.x, sy: player.y }); }
    }
    if (FLOOR.mods.includes('burning')) { FLOOR.burnT -= dt; if (FLOOR.burnT <= 0) { FLOOR.burnT = 5; for (let k = 0; k < 2; k++) { const q = tileNear(player.x, player.y, 0, 2.5); if (q) bpools.push({ x: q[0], y: q[1], r: 1.0, t: 0, wait: 0.9, life: 5, dps: 6 + curFloor * 2.2, kind: 'fire', tick: 0 }); } } }
    if (blessQueue && !blessOpen && !paused) { blessQueue--; offerBless(FLOOR.qTitle || '深淵の祝福'); }
  }

  /* ---------- blessings ---------- */
  function blessSoon(title) { FLOOR.qTitle = title; blessQueue++; }
  function offerBless(title) {
    if (!inDive() || player.dead) return;
    const pool = BLESSINGS.filter((b) => !(b[0] === 'phoenix' && bN('phoenix'))), pick = [];
    while (pick.length < 3 && pool.length) pick.push(pool.splice(randi(0, pool.length - 1), 1)[0]);
    blessOpen = true; paused = true; drag.active = false;
    $('blessTitle').textContent = title;
    const box = $('blessCards');
    box.textContent = '';
    for (const b of pick) {
      const c = document.createElement('button'); c.type = 'button'; c.className = 'bcard';
      const n = bN(b[0]);
      c.innerHTML = '<b></b><span></span><small></small>';
      c.children[0].textContent = b[1]; c.children[1].textContent = b[2]; c.children[2].textContent = n ? '重ねがけ ' + (n + 1) + '段目' : '新しい祝福';
      c.addEventListener('click', () => chooseBless(b[0]));
      box.appendChild(c);
    }
    $('blessDlg').hidden = false;
    sfx('quest');
  }
  function chooseBless(id) {
    if (!inDive()) { $('blessDlg').hidden = true; blessOpen = false; paused = false; return; }
    BLESS.push(id);
    prog.bless = BLESS.slice(); save();
    refreshD();
    $('blessDlg').hidden = true; blessOpen = false; paused = false;
    const b = BLESSINGS.find((x) => x[0] === id);
    toast('祝福「' + b[1] + '」を得た（深淵を出るか倒れるまで有効）');
    addVfx({ k: 'pillar', x: player.x, y: player.y, c: '255,214,120', life: 1 }); addVfx({ k: 'ring', x: player.x, y: player.y, R: 2.6, c: '255,214,120', w: 8, life: 0.6 });
    sfx('aura');
  }
  function floorHud() {
    const el = $('fobj');
    if (WB.on && curMap === 3) { const txt = '◆ 世界の裂け目 残り' + Math.max(0, Math.ceil(WB.t)) + '秒|与ダメージ ' + Math.round(WB.dmg).toLocaleString(); if (el.dataset.t !== txt) { el.dataset.t = txt; el.textContent = ''; const a = document.createElement('div'); a.textContent = txt.split('|')[0]; const b = document.createElement('div'); b.className = 'fs'; b.textContent = txt.split('|')[1]; el.append(a, b); } el.hidden = false; return; }
    if (!inDive()) { if (!el.hidden) el.hidden = true; return; }
    const o = FLOOR.obj;
    const main = stairsOpen ? '◆ 門が開いた！ 次の階へ' : o === 'kill' ? '◆ 殲滅 ' + Math.min(floorKills, floorNeed) + '/' + floorNeed : o === 'survive' ? '◆ 耐久 残り' + Math.max(0, Math.ceil(FLOOR.timer)) + '秒' : o === 'boss' ? '◆ ボスを倒せ' : '◆ ' + OBJ_INFO[o] + ' ' + FLOOR.done + '/' + FLOOR.goal;
    const sub = (FLOOR.mods.length ? FLOOR.mods.map((k) => MODS[k][0]).join('・') + ' 報酬+' + FLOOR.bonus + '%' : '') + (BLESS.length ? (FLOOR.mods.length ? '　' : '') + '祝福×' + BLESS.length : '');
    const txt = main + '|' + sub;
    if (el.dataset.t !== txt) { el.dataset.t = txt; el.textContent = ''; const a = document.createElement('div'); a.textContent = main; el.appendChild(a); if (sub) { const b = document.createElement('div'); b.className = 'fs'; b.textContent = sub; el.appendChild(b); } }
    el.hidden = false;
  }
  function floorInfo() {
    if (!inDive()) return;
    const lines = [objGoal()].concat(FLOOR.mods.map((k) => MODS[k][0] + '：' + MODS[k][1]), BLESS.map((id) => '祝福 ' + BLESSINGS.find((b) => b[0] === id)[1]));
    toast(lines.slice(0, 4).join('／'));
  }

  /* ---------- drawing ---------- */
  function drawObj(e, x0, y0) {
    if (x0 < -60 || x0 > W + 60 || y0 < -60 || y0 > H + 80) return;
    const a = e.dead ? clamp(e.deathT / 0.3, 0, 1) : 1, z = zoom;
    ctx.save(); ctx.globalAlpha = a;
    if (e.obj === 'chest') {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x0, y0, 18 * z, 8 * z, 0, 0, TAU); ctx.fill();
      const w = 30 * z, h = 18 * z, bob = e.hitT > 0 ? -3 * z : 0;
      ctx.fillStyle = '#6a3e1c'; ctx.fillRect(x0 - w / 2, y0 - h + bob, w, h);
      ctx.fillStyle = '#8a5428'; ctx.beginPath(); ctx.moveTo(x0 - w / 2, y0 - h + bob); ctx.quadraticCurveTo(x0, y0 - h - 14 * z + bob, x0 + w / 2, y0 - h + bob); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e3b42c'; ctx.fillRect(x0 - w / 2, y0 - h + bob, w, 3 * z); ctx.fillRect(x0 - 3 * z, y0 - h - 2 * z + bob, 6 * z, 10 * z);
      ctx.strokeStyle = '#2a1608'; ctx.lineWidth = 1.5; ctx.strokeRect(x0 - w / 2, y0 - h + bob, w, h);
      if (!e.dead) emis.push(['gold', x0, y0 - h, 38 * z, 0.45 + 0.15 * Math.sin(time * 4)]);
    } else {
      const sp = SPR.crystals[1], s = 1.7 + (e.hitT > 0 ? 0.1 : 0);
      drawSpr(sp, x0, y0, false, a, s);
      if (e.hitT > 0) { ctx.globalCompositeOperation = 'lighter'; drawSpr(sp, x0, y0, false, 0.6, s); }
      if (!e.dead) { emis.push(['violet', x0, y0 - 40 * z, 70 * z, 0.55 + 0.2 * Math.sin(time * 3)]); emis.push(['red', x0, y0 - 30 * z, 40 * z, 0.35]); }
    }
    ctx.restore();
  }
  function affixDraw(e, x0, y0) {
    const h = bodyH(e) * zoom;
    if (e.treasure) emis.push(['gold', x0, y0 - h * 0.6, 60 * zoom, 0.7 + 0.2 * Math.sin(time * 8)]);
    if (e.shieldT > 0) { emis.push(['cyan', x0, y0 - h * 0.6, 70 * zoom, 0.75]); ctx.save(); ctx.strokeStyle = 'rgba(150,230,255,0.85)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(x0, y0 - h * 0.55, 30 * zoom, 38 * zoom, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
    if (e.aff) {
      if (e.aff.includes('burn')) emis.push(['warm', x0, y0 - h * 0.4, 46 * zoom, 0.5]);
      if (e.aff.includes('thunder')) emis.push(['cyan', x0, y0 - h * 0.8, 36 * zoom, 0.45 + 0.3 * Math.random()]);
      if (e.aff.includes('fast')) emis.push(['white', x0, y0 - h * 0.3, 30 * zoom, 0.25]);
      if (e.aff.includes('regen')) emis.push(['mint', x0, y0 - h * 0.5, 36 * zoom, 0.35]);
    }
  }
