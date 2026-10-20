
  /* ================= skills & skill trees ================= */
  const TIER_LV = [1, 4, 8, 12, 16, 24, 32];
  const SK = [
    { id: 'whirl', form: 'blade', tier: 1, act: true, name: '旋風斬', short: '旋風', lv: 1, max: 10, cd: 2.4, mp: (l) => 10 + l,
      desc: (l) => '周りの敵すべてに攻撃力の' + (200 + 30 * (l - 1)) + '%' },
    { id: 'sword', form: 'blade', tier: 1, act: false, name: '剣術修練', lv: 1, max: 10, desc: (l) => '剣の型の攻撃力 +' + 4 * l + '%' },
    { id: 'sprint', form: 'both', tier: 1, act: true, name: '疾駆（回避）', short: '回避', lv: 1, max: 10, cd: 2.2, mp: () => 4,
      desc: (l) => '素早く跳んで0.3秒無敵。直後' + (1.2 + 0.1 * l).toFixed(1) + '秒 移動の速さ +' + (40 + 3 * l) + '%。攻撃をぎりぎりでかわすと「見切り」（時間がゆっくりになり、2秒間すべて会心）' },
    { id: 'gale', form: 'blade', tier: 2, act: true, name: '疾風突き', short: '疾風', lv: 4, pre: ['whirl', 3], max: 10, cd: 4, mp: (l) => 12 + l,
      desc: (l) => '敵まで一気に踏み込み攻撃力の' + (300 + 40 * (l - 1)) + '%、' + (0.6 + 0.05 * l).toFixed(2) + '秒気絶' },
    { id: 'bash', form: 'blade', tier: 2, act: true, name: '盾打ち', short: '盾打', lv: 4, max: 10, cd: 5, mp: (l) => 10 + l,
      desc: (l) => '前方の敵を盾で殴り攻撃力の' + (150 + 20 * (l - 1)) + '%、吹き飛ばして' + (1 + 0.05 * l).toFixed(2) + '秒気絶' },
    { id: 'iron', form: 'blade', tier: 2, act: false, name: '鉄壁', lv: 4, max: 10, desc: (l) => '剣の型で受けるダメージ -' + 2 * l + '%、最大HP +' + 14 * l },
    { id: 'shift', form: 'both', tier: 2, act: false, name: '変身の極意', lv: 6, max: 10, desc: (l) => '変身の待ち時間 -' + 5 * l + '%、変身後4秒間 与えるダメージ +' + 3 * l + '%' },
    { id: 'rend', form: 'blade', tier: 3, act: true, name: '地裂斬', short: '地裂', lv: 8, pre: ['gale', 3], max: 10, cd: 5, mp: (l) => 18 + Math.round(l * 1.5),
      desc: (l) => '前方一直線の地面を裂き攻撃力の' + (260 + 35 * (l - 1)) + '%、2.5秒鈍足' },
    { id: 'cry', form: 'blade', tier: 3, act: true, name: '鬨の声', short: '鬨声', lv: 8, pre: ['bash', 3], max: 10, cd: 14, mp: () => 15,
      desc: (l) => '周りの敵を引きつけ、6秒間 敵の攻撃力 -' + (20 + 2 * l) + '%、自分の被ダメージ -10%' },
    { id: 'twin', form: 'blade', tier: 3, act: false, name: '連撃', lv: 8, pre: ['sword', 5], max: 10, desc: (l) => '通常攻撃が' + 3 * l + '%の確率でもう一度当たる' },
    { id: 'aura', form: 'blade', tier: 4, act: true, name: '闘気解放', short: '闘気', lv: 12, pre: ['rend', 3], max: 10, cd: 20, mp: () => 25,
      desc: (l) => (8 + 0.5 * l).toFixed(1) + '秒間 攻撃力 +' + (20 + 3 * l) + '%、攻撃の速さ +25%' },
    { id: 'dance', form: 'blade', tier: 4, act: true, name: '剣舞', short: '剣舞', lv: 12, pre: ['cry', 2], max: 10, cd: 8, mp: (l) => 20 + l,
      desc: (l) => '目の前の敵に' + (5 + Math.floor(l / 3)) + '回連続で斬りかかり、1回ごとに攻撃力の' + (85 + 10 * (l - 1)) + '%' },
    { id: 'leech', form: 'blade', tier: 4, act: false, name: '吸命の刃', lv: 12, pre: ['twin', 3], max: 10, desc: (l) => '剣の型で与えたダメージの' + l + '%だけHPを回復' },
    { id: 'keen', form: 'blade', tier: 5, act: false, name: '鋭刃', lv: 16, pre: ['leech', 3], max: 10, desc: (l) => '剣の型の会心率 +' + (1.5 * l).toFixed(1) + '%、会心ダメージ +' + 6 * l + '%' },
    { id: 'chain', form: 'arcane', tier: 1, act: true, name: '連鎖雷', short: '連雷', lv: 1, max: 10, cd: 3, mp: (l) => 14 + l,
      desc: (l) => '敵から敵へ' + (5 + Math.floor((l - 1) / 2)) + '回跳ねる雷、攻撃力の' + (180 + 25 * (l - 1)) + '%' },
    { id: 'amp', form: 'arcane', tier: 1, act: false, name: '魔力増幅', lv: 1, max: 10, desc: (l) => '術の型の攻撃力 +' + 4 * l + '%' },
    { id: 'fireball', form: 'arcane', tier: 2, act: true, name: '爆炎弾', short: '爆炎', lv: 4, pre: ['chain', 3], max: 10, cd: 3.5, mp: (l) => 16 + l,
      desc: (l) => '当たると爆発し、周りに攻撃力の' + (240 + 35 * (l - 1)) + '%' },
    { id: 'heal', form: 'arcane', tier: 2, act: true, name: '癒しの光', short: '癒光', lv: 4, max: 10, cd: 12, mp: (l) => 18 + l,
      desc: (l) => '最大HPの' + (20 + 2 * l) + '%を回復し、さらに5秒間 毎秒2%回復' },
    { id: 'medit', form: 'arcane', tier: 2, act: false, name: '瞑想', lv: 4, max: 10, desc: (l) => '最大MP +' + 8 * l + '、MPの回復 +' + (0.35 * l).toFixed(2) + '/秒' },
    { id: 'frost', form: 'arcane', tier: 3, act: true, name: '氷結陣', short: '氷結', lv: 8, pre: ['fireball', 3], max: 10, cd: 7, mp: (l) => 22 + Math.round(l * 1.5),
      desc: (l) => '4秒間の氷の陣。0.5秒ごとに攻撃力の' + (45 + 8 * (l - 1)) + '%、50%鈍足' },
    { id: 'lance', form: 'arcane', tier: 3, act: true, name: '雷槍', short: '雷槍', lv: 8, pre: ['chain', 5], max: 10, cd: 4, mp: (l) => 16 + l,
      desc: (l) => '一直線に貫く雷で、当たった敵すべてに攻撃力の' + (220 + 30 * (l - 1)) + '%' },
    { id: 'mshield', form: 'arcane', tier: 3, act: false, name: '魔力障壁', lv: 8, pre: ['medit', 3], max: 10, desc: (l) => '術の型で受けるダメージの' + 4 * l + '%をMPで肩代わり' },
    { id: 'meteor', form: 'arcane', tier: 4, act: true, name: '星降り', short: '星降', lv: 12, pre: ['frost', 3], max: 10, cd: 14, mp: (l) => 40 + 2 * l,
      desc: (l) => (6 + Math.floor(l / 2)) + '個の流星が降り注ぎ、それぞれ攻撃力の' + (180 + 25 * (l - 1)) + '%' },
    { id: 'vortex', form: 'arcane', tier: 4, act: true, name: '引力の渦', short: '引渦', lv: 12, pre: ['lance', 3], max: 10, cd: 12, mp: (l) => 26 + l,
      desc: (l) => '周りの敵を一点に引き寄せ攻撃力の' + (120 + 20 * (l - 1)) + '%、1秒気絶' },
    { id: 'quick', form: 'arcane', tier: 4, act: false, name: '高速詠唱', lv: 12, pre: ['mshield', 3], max: 10, desc: (l) => '術の型のスキルの再使用時間 -' + 3 * l + '%' },
    { id: 'focus', form: 'arcane', tier: 5, act: false, name: '精神統一', lv: 16, pre: ['amp', 5], max: 10, desc: (l) => '術の型の会心率 +' + (1.5 * l).toFixed(1) + '%、会心ダメージ +' + 6 * l + '%' },
    // tier 5-6: new actives
    { id: 'skyfall', form: 'blade', tier: 5, act: true, name: '天翔斬', short: '天翔', lv: 16, pre: ['aura', 2], max: 10, cd: 9, mp: (l) => 28 + 2 * l,
      desc: (l) => '狙った敵へ跳びかかり、着地点のまわりを攻撃力×' + (3.2 + 0.4 * (l - 1)).toFixed(1) + 'で叩き伏せ、0.8秒気絶させる' },
    { id: 'storm', form: 'arcane', tier: 5, act: true, name: '雷神招来', short: '雷神', lv: 16, pre: ['meteor', 2], max: 10, cd: 16, mp: (l) => 40 + 2 * l,
      desc: (l) => '5秒間、0.4秒ごとに近くの敵へ雷が落ちる（雷・攻撃力×' + (1.1 + 0.15 * (l - 1)).toFixed(2) + '）' },
    { id: 'blades', form: 'blade', tier: 6, act: true, name: '千刃結界', short: '千刃', lv: 24, pre: ['skyfall', 3], max: 10, cd: 18, mp: (l) => 36 + 2 * l,
      desc: (l) => '4秒間、刃が身のまわりを舞い、0.3秒ごとに近くの敵を攻撃力×' + (0.7 + 0.1 * (l - 1)).toFixed(1) + 'で切り裂く' },
    { id: 'gravity', form: 'arcane', tier: 6, act: true, name: '重力崩壊', short: '崩壊', lv: 24, pre: ['storm', 3], max: 10, cd: 20, mp: (l) => 55 + 3 * l,
      desc: (l) => '狙った場所に重力の渦を生み、1.4秒かけて敵を引き寄せてから攻撃力×' + (5 + 0.6 * (l - 1)).toFixed(1) + 'で崩壊させる' },
    // tier 7: keystones (strong passives with a drawback; one point each)
    { id: 'k_berserk', form: 'blade', tier: 7, act: false, key: true, name: '極意・狂戦士の血', lv: 32, max: 1, desc: () => 'HPが減るほど剣の型の攻撃力が上がる（最大+60%）。代わりに剣の型で受けるダメージ +15%' },
    { id: 'k_blood', form: 'blade', tier: 7, act: false, key: true, name: '極意・血の契約', lv: 32, max: 1, desc: () => '剣の型のHP吸収が2倍。代わりに回復薬の回復量が半分' },
    { id: 'k_elem', form: 'arcane', tier: 7, act: false, key: true, name: '極意・元素の理', lv: 32, max: 1, desc: () => '元素反応のダメージ +60%、敵に残る元素が2倍長く続く。代わりに術の型の通常攻撃 -20%' },
    { id: 'k_echo', form: 'arcane', tier: 7, act: false, key: true, name: '極意・詠唱連鎖', lv: 32, max: 1, desc: () => 'スキルを使うと20%で待ち時間がすぐ戻る。代わりに消費MP +25%' },
    { id: 'k_soul', form: 'both', tier: 7, act: false, key: true, name: '極意・双魂一体', lv: 32, max: 1, desc: () => '変身の待ち時間が半分になり、変身後4秒間 与えるダメージ +25%。代わりに最大HP -10%' },
    { id: 'k_mikiri', form: 'both', tier: 7, act: false, key: true, name: '極意・見切りの境地', lv: 32, max: 1, desc: () => '回避の無敵が0.15秒長く、見切りのスローが1.5倍長い。代わりに回避の待ち時間 +0.8秒' }
  ];
  const SKD = {};
  for (const s of SK) SKD[s.id] = s;
  const SLOTS = { blade: ['whirl', 'gale', 'bash', 'rend', 'cry', 'dance', 'aura', 'sprint'], arcane: ['chain', 'fireball', 'heal', 'frost', 'lance', 'vortex', 'meteor', 'sprint'] };
  const DIR_VEC = [[-0.707, 0.707], [-1, 0], [-0.707, -0.707], [0, -1], [0.707, -0.707], [1, 0], [0.707, 0.707], [0, 1]];
  const fields = [], meteors = [];
  let dash = null, dance = null, skEls = null;
  function baseLv(id) { return prog.skill[id] || 0; }
  function slv(id) { const b = prog.skill[id] || 0; return b ? b + (GEAR.sk[id] || 0) : 0; }
  function reqMet(s) { return prog.level >= s.lv && (!s.pre || baseLv(s.pre[0]) >= s.pre[1]); }
  function canLearn(s) { return prog.kp > 0 && baseLv(s.id) < s.max && reqMet(s); }
  function reqText(s) {
    const parts = [];
    if (s.lv > 1) parts.push('キャラLv' + s.lv);
    if (s.pre) parts.push(SKD[s.pre[0]].name + ' Lv' + s.pre[1]);
    return parts.join('、');
  }
  function learn(id) {
    const s = SKD[id];
    if (!s || !canLearn(s)) return;
    prog.kp--;
    prog.skill[id] = baseLv(id) + 1;
    refreshD();
    questEvent('learn');
    save();
  }
  function cdOf(id) { return SKD[id].cd * (1 - (D.cdr || 0)) * skillCdMul(id) * (id === 'sprint' ? dodgeCdMul() : 1) + skillCdAdd(id); }
  function pickTarget(range) {
    const t = player.target;
    if (t && !t.dead && hyp(t.x - player.x, t.y - player.y) <= range) return t;
    return nearest(player.x, player.y, range, null);
  }
  function aimDir(range) {
    const t = pickTarget(range);
    let ux, uy;
    if (t) { ux = t.x - player.x; uy = t.y - player.y; } else { ux = DIR_VEC[player.dir][0]; uy = DIR_VEC[player.dir][1]; }
    const d = hyp(ux, uy) || 1;
    ux /= d; uy /= d;
    faceToward(ux, uy);
    return [ux, uy, t];
  }
  function explode(x, y, r, dmg) {
    sfx('boom');
    vfxExplode(x, y, r);
    if (dmg > 0) withEl('fire', () => { for (const e of enemies) if (!e.dead && hyp(e.x - x, e.y - y) <= r + e.r) hitEnemy(e, dmg); });
    addFx({ k: 'boom', x, y, r, t: 0, life: 0.55 });
    burst(x, y, 10, 'spark', 14, 'warm', 3);
    burst(x, y, 3, 'dust', 6, '', 1.6);
  }
  function galeStrike(t, mul, stun) {
    if (!t.dead) { hitEnemy(t, D.atk * mul); if (!t.dead) t.stunT = Math.max(t.stunT || 0, stun); }
    addFx({ k: 'impact', x: t.x, y: t.y, t: 0, life: 0.35 });
    burst(t.x, t.y, bodyH(t), 'spark', 12, 'amber', 3);
  }
  function lineHit(ux, uy, len, width, fn) {
    for (const e of enemies) {
      if (e.dead) continue;
      const rx = e.x - player.x, ry = e.y - player.y, pr = rx * ux + ry * uy, lat = Math.abs(rx * uy - ry * ux);
      if (pr > -0.3 && pr < len && lat < width + e.r) fn(e);
    }
  }
  const CAST = {
    skyfall: (l) => castSkyfall(l), blades: (l) => castBlades(l), storm: (l) => castStorm(l), gravity: (l) => castGravity(l),
    whirl(l) {
      const R = 2.1, mul = 2.0 + 0.3 * (l - 1);
      for (const e of enemies) {
        if (e.dead || hyp(e.x - player.x, e.y - player.y) > R + e.r) continue;
        hitEnemy(e, D.atk * mul);
        if (!e.dead) { const dx = e.x - player.x, dy = e.y - player.y, d = hyp(dx, dy) || 1; moveEnemy(e, e.x + dx / d * 0.6, e.y + dy / d * 0.6); }
      }
      addFx({ k: 'spin', x: player.x, y: player.y, R, t: 0, life: 0.42, left: player.faceLeft });
      for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; addPart({ k: 'spark', x: player.x + Math.cos(a) * 1.6, y: player.y + Math.sin(a) * 1.6, z: 8, vx: Math.cos(a) * 1.2, vy: Math.sin(a) * 1.2, vz: 30, t: 0, life: 0.4, s: 0.8, c: 'amber' }); }
      player.swingT = player.swingDur = 0.36;
      return true;
    },
    sprint(l) {
      startDodge(l);
      burst(player.x, player.y, 2, 'dust', 10, '', 2);
      addFx({ k: 'auraburst', x: player.x, y: player.y, t: 0, life: 0.5, c: 'white' });
      return true;
    },
    gale(l) {
      const t = pickTarget(5.5);
      if (!t) { toast('近くに敵がいない'); return false; }
      const dx = t.x - player.x, dy = t.y - player.y, d = hyp(dx, dy) || 1;
      const mul = 3 + 0.4 * (l - 1), stun = 0.6 + 0.05 * l;
      player.target = t; player.path.length = 0;
      faceToward(dx, dy);
      const ex = t.x - dx / d * 0.7, ey = t.y - dy / d * 0.7;
      if (d > 1.1 && !blockedAt(ex, ey, 0.2) && lineClear(player.x, player.y, ex, ey)) dash = { fx: player.x, fy: player.y, tx: ex, ty: ey, t: 0, dur: 0.16, tgt: t, mul, stun };
      else galeStrike(t, mul, stun);
      player.swingT = player.swingDur = 0.32;
      return true;
    },
    bash(l) {
      const a = aimDir(2.4), ux = a[0], uy = a[1];
      const mul = 1.5 + 0.2 * (l - 1), stun = 1 + 0.05 * l;
      lineHit(ux, uy, 1.9, 1.0, (e) => {
        stgBoost = 4;
        try { hitEnemy(e, D.atk * mul); } finally { stgBoost = 1; }
        if (!e.dead) { e.stunT = Math.max(e.stunT || 0, stun); for (let k = 0; k < 4; k++) moveEnemy(e, e.x + ux * 0.25, e.y + uy * 0.25); }
      });
      addFx({ k: 'impact', x: player.x + ux * 0.9, y: player.y + uy * 0.9, t: 0, life: 0.35 });
      burst(player.x + ux * 0.9, player.y + uy * 0.9, 16, 'spark', 10, 'white', 2.5);
      player.swingT = player.swingDur = 0.3;
      return true;
    },
    rend(l) {
      const a = aimDir(6), ux = a[0], uy = a[1];
      const mul = 2.6 + 0.35 * (l - 1), len = 4.4;
      lineHit(ux, uy, len, 0.85, (e) => { hitEnemy(e, D.atk * mul); e.slowT = 2.5; e.slowAmt = 0.4; });
      addFx({ k: 'rend', x: player.x, y: player.y, ux, uy, len, t: 0, life: 0.65 });
      burst(player.x + ux * 1.5, player.y + uy * 1.5, 2, 'dust', 10, '', 2);
      player.swingT = player.swingDur = 0.34;
      return true;
    },
    cry(l) {
      for (const e of enemies) {
        if (e.dead || hyp(e.x - player.x, e.y - player.y) > 5) continue;
        e.state = 'chase'; e.weakT = 6; e.weakAmt = 0.2 + 0.02 * l;
      }
      player.cryT = 6;
      refreshD();
      addFx({ k: 'cry', x: player.x, y: player.y, t: 0, life: 0.8 });
      burst(player.x, player.y, 30, 'spark', 16, 'red', 2.5);
      player.swingT = player.swingDur = 0.3;
      return true;
    },
    aura(l) {
      player.auraT = 8 + 0.5 * l; player.auraLv = l;
      refreshD();
      addFx({ k: 'auraburst', x: player.x, y: player.y, t: 0, life: 0.7, c: 'gold' });
      burst(player.x, player.y, 20, 'gold', 22, 'gold', 2);
      return true;
    },
    dance(l) {
      const t = pickTarget(D.range + 1.2);
      if (!t) { toast('目の前に敵がいない'); return false; }
      player.target = t; player.path.length = 0;
      faceToward(t.x - player.x, t.y - player.y);
      dance = { tgt: t, left: 5 + Math.floor(l / 3), t: 0, mul: 0.85 + 0.1 * (l - 1), flip: false };
      return true;
    },
    chain(l) {
      const t0 = player.target;
      let cur = t0 && !t0.dead && hyp(t0.x - player.x, t0.y - player.y) <= D.range + 1 ? t0 : nearest(player.x, player.y, D.range + 0.5, null);
      if (!cur) { toast('近くに敵がいない'); return false; }
      faceToward(cur.x - player.x, cur.y - player.y);
      const mul = 1.8 + 0.25 * (l - 1), jumps = 4 + Math.floor((l - 1) / 2);
      const hit = new Set(), pts = [[player.x, player.y, 52]];
      let m = 1;
      while (cur && hit.size <= jumps) {
        hit.add(cur);
        pts.push([cur.x, cur.y, bodyH(cur)]);
        withEl('volt', () => hitEnemy(cur, D.atk * mul * m));
        m *= 0.9;
        cur = nearest(cur.x, cur.y, 3.3, hit);
      }
      addFx({ k: 'chain', pts, jit: null, seed: -1, t: 0, life: 0.45 });
      player.swingT = player.swingDur = 0.34;
      return true;
    },
    fireball(l) {
      const t = pickTarget(D.range + 1);
      if (!t) { toast('近くに敵がいない'); return false; }
      const mul = 2.4 + 0.35 * (l - 1);
      faceToward(t.x - player.x, t.y - player.y);
      shots.push({ x: player.x, y: player.y, h: 44, tgt: t, dmg: 0, sp: 9, trail: [], col: 'warm', big: true, onHit: (e) => explode(e.x, e.y, 1.6, D.atk * mul) });
      player.swingT = player.swingDur = 0.34;
      return true;
    },
    heal(l) {
      const amt = Math.round(D.maxHp * (0.2 + 0.02 * l));
      player.hp = Math.min(D.maxHp, player.hp + amt);
      player.healT = 5;
      addText(player.x, player.y, '+' + amt, 'heal', 62);
      addFx({ k: 'heal', x: player.x, y: player.y, t: 0, life: 0.8 });
      burst(player.x, player.y, 6, 'heal', 20, 'mint', 1.4);
      player.swingT = player.swingDur = 0.34;
      return true;
    },
    frost(l) {
      const t = pickTarget(6.5);
      let x, y;
      if (t) { x = t.x; y = t.y; faceToward(t.x - player.x, t.y - player.y); }
      else { x = player.x + DIR_VEC[player.dir][0] * 2.2; y = player.y + DIR_VEC[player.dir][1] * 2.2; }
      fields.push({ x, y, r: 2.2, t: 0, life: 4, tick: 0.15, dmg: D.atk * (0.45 + 0.08 * (l - 1)) });
      player.swingT = player.swingDur = 0.34;
      return true;
    },
    lance(l) {
      const a = aimDir(7), ux = a[0], uy = a[1];
      const mul = 2.2 + 0.3 * (l - 1), len = 6.5;
      lineHit(ux, uy, len, 0.65, (e) => withEl('volt', () => hitEnemy(e, D.atk * mul)));
      addFx({ k: 'lance', x: player.x, y: player.y, ux, uy, len, t: 0, life: 0.4 });
      player.swingT = player.swingDur = 0.34;
      return true;
    },
    vortex(l) {
      const t = pickTarget(7);
      if (!t) { toast('近くに敵がいない'); return false; }
      const cx = t.x, cy = t.y, mul = 1.2 + 0.2 * (l - 1);
      faceToward(cx - player.x, cy - player.y);
      for (const e of enemies) {
        if (e.dead) continue;
        const dx = cx - e.x, dy = cy - e.y, d = hyp(dx, dy);
        if (d > 4.5) continue;
        const pull = Math.min(Math.max(0, d - 0.45), 2.6);
        for (let k = 0; k < 6; k++) moveEnemy(e, e.x + dx / (d || 1) * pull / 6, e.y + dy / (d || 1) * pull / 6);
        hitEnemy(e, D.atk * mul);
        if (!e.dead) e.stunT = Math.max(e.stunT || 0, 1);
      }
      addFx({ k: 'vortex', x: cx, y: cy, t: 0, life: 0.9 });
      burst(cx, cy, 20, 'magic', 24, 'violet', 2.6);
      player.swingT = player.swingDur = 0.34;
      return true;
    },
    meteor(l) {
      const t = pickTarget(7);
      if (!t) { toast('近くに敵がいない'); return false; }
      const n = 6 + Math.floor(l / 2), dmg = D.atk * (1.8 + 0.25 * (l - 1));
      for (let k = 0; k < n; k++) {
        const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * 2.3;
        meteors.push({ x: t.x + Math.cos(a) * r, y: t.y + Math.sin(a) * r, at: 0.45 + k * 0.17, t: 0, dmg });
      }
      faceToward(t.x - player.x, t.y - player.y);
      player.swingT = player.swingDur = 0.34;
      return true;
    }
  };
  function castSkill(i) {
    if (paused || player.dead || dash || dance || transit) return;
    const id = SLOTS[player.form][i], s = SKD[id];
    if (!s) return;
    const l = slv(id);
    if (!l) { toast(s.name + 'はまだ覚えていない（' + reqText(s) + '）'); return; }
    if ((player.cd[id] || 0) > 0) return;
    const mp = Math.round(s.mp(l) * classMpMul() * skillMpMul(id));
    if (player.mp < mp) { toast('MPが足りない'); return; }
    if (castWithGems(id, l) === false) return;
    if (!(bN('echo') && Math.random() < 0.2 * bN('echo'))) player.mp -= mp;
    player.cd[id] = cdOf(id);
    afterCast(id);
    if (SK_SFX[id]) sfx(SK_SFX[id]);
  }
  function useSkill() { castSkill(0); }
  function skillsUpdate(dt) {
    dodgeUpdate(dt);
    growthUpdate(dt);
    let changed = false;
    for (const k of ['auraT', 'shiftT', 'sprintT', 'cryT', 'healT', 'frenzyT']) {
      const before = player[k] || 0;
      player[k] = Math.max(0, before - dt);
      if (before > 0 && player[k] === 0) changed = true;
    }
    if (changed) refreshD();
    for (const k in player.cd) player.cd[k] = Math.max(0, player.cd[k] - dt);
    if (player.healT > 0 && !player.dead) player.hp = Math.min(D.maxHp, player.hp + D.maxHp * 0.02 * dt);
    if (player.auraT > 0 && !player.dead && Math.random() < dt * 12) addPart({ k: 'gold', x: player.x + rand(-0.3, 0.3), y: player.y + rand(-0.3, 0.3), z: rand(4, 24), vx: 0, vy: 0, vz: rand(18, 32), t: 0, life: 0.7, s: 0.6, c: 'gold' });
    if (player.sprintT > 0 && player.moving && Math.random() < dt * 14) addPart({ k: 'dust', x: player.x, y: player.y, z: 1, vx: rand(-0.3, 0.3), vy: rand(-0.3, 0.3), vz: 4, t: 0, life: 0.5, s: 1.2, c: '' });
    if (dash) {
      dash.t += dt;
      const k = Math.min(1, dash.t / dash.dur);
      player.x = dash.fx + (dash.tx - dash.fx) * k;
      player.y = dash.fy + (dash.ty - dash.fy) * k;
      player.moving = true;
      player.walkPhase = (player.walkPhase + dt * 5) % 1;
      for (let n = 0; n < 2; n++) addPart({ k: 'magic', x: player.x + rand(-0.15, 0.15), y: player.y + rand(-0.15, 0.15), z: rand(8, 46), vx: 0, vy: 0, vz: 4, t: 0, life: 0.35, s: 0.7, c: 'amber' });
      if (k >= 1) { const d0 = dash; dash = null; player.moving = false; withCtx(d0.ctx, () => galeStrike(d0.tgt, d0.mul, d0.stun)); }
    }
    if (dance) {
      dance.t -= dt;
      if (dance.t <= 0) {
        const t = dance.tgt;
        if (t.dead || player.dead || hyp(t.x - player.x, t.y - player.y) > D.range + 1.4) dance = null;
        else {
          dance.flip = !dance.flip;
          player.swingT = player.swingDur = 0.12;
          addFx({ k: 'slash', x: t.x, y: t.y, t: 0, life: 0.2, left: dance.flip, h: bodyH(t) + (dance.flip ? 6 : -2) });
          withCtx(dance.ctx, () => hitEnemy(t, D.atk * dance.mul));
          dance.left--;
          dance.t = 0.11;
          if (dance.left <= 0) dance = null;
        }
      }
    }
    for (let i = fields.length - 1; i >= 0; i--) {
      const f = fields[i];
      f.t += dt;
      if (f.t >= f.life) { fields.splice(i, 1); continue; }
      f.tick -= dt;
      if (f.tick <= 0) {
        f.tick = 0.5;
        for (const e of enemies) if (!e.dead && hyp(e.x - f.x, e.y - f.y) <= f.r + e.r) { withCtx(f.ctx, () => withEl('ice', () => hitEnemy(e, f.dmg))); e.slowT = 0.7; e.slowAmt = 0.5; }
      }
      if (Math.random() < dt * 16) { const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * f.r; addPart({ k: 'magic', x: f.x + Math.cos(a) * r, y: f.y + Math.sin(a) * r, z: 2, vx: 0, vy: 0, vz: rand(10, 22), t: 0, life: 0.8, s: 0.5, c: 'cyan' }); }
    }
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.t += dt;
      if (m.t >= m.at) { meteors.splice(i, 1); withCtx(m.ctx, () => explode(m.x, m.y, 1.15, m.dmg)); }
    }
  }

  /* ---------- skill effects ---------- */
  function drawSkillGround() {
    for (const f of fields) {
      const a = Math.min(1, f.t * 4, (f.life - f.t) * 2);
      const x0 = isoX(f.x, f.y), y0 = isoY(f.x, f.y), rx = f.r * 45.25 * zoom;
      ctx.save();
      ctx.globalAlpha = 0.26 * a;
      ctx.fillStyle = '#8fe8ff';
      ctx.beginPath(); ctx.ellipse(x0, y0, rx, rx / 2, 0, 0, TAU); ctx.fill();
      ctx.restore();
      drawGroundRing(RUNE.cyan, x0, y0, f.r, time * 0.8, 0.9 * a);
    }
    for (const m of meteors) {
      const lead = m.at - m.t;
      if (lead > 0.8) continue;
      drawGroundRing(RING.blade, isoX(m.x, m.y), isoY(m.x, m.y), 0.4 + (0.8 - lead) * 0.5, time * 3, clamp(1 - lead / 0.8, 0, 1) * 0.85);
    }
  }
  function drawSkillEmissive() {
    if (player.auraT > 0 && !player.dead) {
      const x0 = isoX(player.x, player.y), y0 = isoY(player.x, player.y), r = 50 * zoom;
      ctx.globalAlpha = 0.45 + 0.15 * Math.sin(time * 8);
      ctx.drawImage(GLOW.gold.img, x0 - r, y0 - 40 * zoom - r, r * 2, r * 2);
      ctx.globalAlpha = 1;
      drawGroundRing(RING.blade, x0, y0, 0.75, -time * 2, 0.75);
    }
    if (player.cryT > 0 && !player.dead) drawGroundRing(RING.white, isoX(player.x, player.y), isoY(player.x, player.y), 0.6, time, 0.35);
    for (const f of fx) {
      const k = f.t / f.life, a = 1 - k;
      if (f.k === 'boom') {
        const gx = isoX(f.x, f.y), gy = isoY(f.x, f.y), y0 = gy - 12 * zoom;
        const r = f.r * 48 * zoom * (0.45 + k * 0.85), r2 = r * 0.45 * (1 - k);
        ctx.globalAlpha = a;
        ctx.drawImage(GLOW.warm.img, gx - r, y0 - r, r * 2, r * 2);
        ctx.drawImage(GLOW.white.img, gx - r2, y0 - r2, r2 * 2, r2 * 2);
        ctx.globalAlpha = 1;
        drawGroundRing(RING.blade, gx, gy, f.r * (0.5 + k * 0.7), 0, a);
      } else if (f.k === 'impact') {
        const gx = isoX(f.x, f.y), gy = isoY(f.x, f.y), r = 40 * zoom * (0.6 + k);
        ctx.globalAlpha = a;
        ctx.drawImage(GLOW.amber.img, gx - r, gy - 26 * zoom - r, r * 2, r * 2);
        ctx.globalAlpha = 1;
        drawGroundRing(RING.blade, gx, gy, 0.5 + k * 0.9, 0, a);
      } else if (f.k === 'auraburst') {
        drawGroundRing(f.c === 'white' ? RING.white : RUNE.gold, isoX(f.x, f.y), isoY(f.x, f.y), 1.1 + k * 0.6, time * 2, a);
      } else if (f.k === 'cry') {
        const gx = isoX(f.x, f.y), gy = isoY(f.x, f.y);
        for (let n = 0; n < 3; n++) { const kk = clamp(k * 1.4 - n * 0.2, 0, 1); if (kk <= 0 || kk >= 1) continue; drawGroundRing(RING.white, gx, gy, 0.6 + kk * 4.4, 0, (1 - kk) * 0.8); }
        const r = 60 * zoom * (0.5 + k);
        ctx.globalAlpha = a * 0.6;
        ctx.drawImage(GLOW.red.img, gx - r, gy - 30 * zoom - r, r * 2, r * 2);
        ctx.globalAlpha = 1;
      } else if (f.k === 'vortex') {
        const gx = isoX(f.x, f.y), gy = isoY(f.x, f.y);
        drawGroundRing(RUNE.violet, gx, gy, 2.4 * (1 - k * 0.6), -time * 6, a);
        drawGroundRing(RING.arcane, gx, gy, 1.2 * (1 - k * 0.5), time * 9, a);
        const r = 54 * zoom * (1 - k * 0.5);
        ctx.globalAlpha = a * 0.8;
        ctx.drawImage(GLOW.violet.img, gx - r, gy - 16 * zoom - r, r * 2, r * 2);
        ctx.globalAlpha = 1;
      } else if (f.k === 'lance') {
        const x0 = isoX(f.x, f.y), y0 = isoY(f.x, f.y) - 40 * zoom;
        const ex = f.x + f.ux * f.len, ey = f.y + f.uy * f.len, x1 = isoX(ex, ey), y1 = isoY(ex, ey) - 20 * zoom;
        ctx.lineCap = 'round';
        for (let pass = 0; pass < 3; pass++) {
          ctx.strokeStyle = pass === 0 ? 'rgba(90,160,255,' + (0.5 * a).toFixed(3) + ')' : pass === 1 ? 'rgba(150,235,255,' + (0.8 * a).toFixed(3) + ')' : 'rgba(255,255,255,' + a.toFixed(3) + ')';
          ctx.lineWidth = (pass === 0 ? 16 : pass === 1 ? 6 : 2) * zoom * (1 - k * 0.5);
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        }
        const r = 30 * zoom * a;
        ctx.globalAlpha = a;
        ctx.drawImage(GLOW.cyan.img, x1 - r, y1 - r, r * 2, r * 2);
        ctx.globalAlpha = 1;
      } else if (f.k === 'rend') {
        const front = f.len * Math.min(1, k * 2.4);
        for (let s = 0.45; s < front; s += 0.36) {
          const age = (k * 2.4 * f.len - s) / f.len;
          const h = (16 + hash1(s * 10) * 12) * zoom * Math.max(0, 1 - age * 1.3);
          if (h <= 0.5) continue;
          const wx = f.x + f.ux * s, wy = f.y + f.uy * s, x0 = isoX(wx, wy), y0 = isoY(wx, wy);
          ctx.globalAlpha = Math.max(0, 1 - age);
          ctx.fillStyle = 'rgba(255,176,90,0.95)';
          ctx.beginPath(); ctx.moveTo(x0 - 5 * zoom, y0); ctx.lineTo(x0 + (hash1(s * 7) - 0.5) * 7 * zoom, y0 - h); ctx.lineTo(x0 + 5 * zoom, y0); ctx.closePath(); ctx.fill();
          const r = 16 * zoom;
          ctx.drawImage(GLOW.amber.img, x0 - r, y0 - r * 0.8, r * 2, r * 1.6);
        }
        ctx.globalAlpha = 1;
      }
    }
    for (const m of meteors) {
      const lead = m.at - m.t;
      if (lead > 0.45 || lead < 0) continue;
      const k = 1 - lead / 0.45, x1 = isoX(m.x, m.y), y1 = isoY(m.x, m.y), x0 = x1 + 90 * zoom, y0 = y1 - 300 * zoom;
      const hx = x0 + (x1 - x0) * k, hy = y0 + (y1 - y0) * k;
      ctx.strokeStyle = 'rgba(255,170,80,0.75)';
      ctx.lineWidth = 7 * zoom; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(hx + (x0 - x1) * 0.22, hy + (y0 - y1) * 0.22); ctx.lineTo(hx, hy); ctx.stroke();
      const r = 24 * zoom;
      ctx.drawImage(GLOW.warm.img, hx - r, hy - r, r * 2, r * 2);
      ctx.drawImage(GLOW.white.img, hx - r / 3, hy - r / 3, r / 1.5, r / 1.5);
    }
    for (const e of enemies) {
      if (e.dead) continue;
      const x0 = isoX(e.x, e.y), y0 = isoY(e.x, e.y);
      if (e.slowT > 0) { ctx.globalAlpha = 0.4; ctx.drawImage(GLOW.cyan.img, x0 - 22 * zoom, y0 - 16 * zoom, 44 * zoom, 32 * zoom); }
      if (e.weakT > 0) { ctx.globalAlpha = 0.3; ctx.drawImage(GLOW.red.img, x0 - 18 * zoom, y0 - bodyH(e) * zoom - 18 * zoom, 36 * zoom, 36 * zoom); }
      ctx.globalAlpha = 1;
    }
  }
  function drawSkillOverlay() {
    ctx.fillStyle = '#ffe27a';
    for (const e of enemies) {
      if (e.dead || !(e.stunT > 0)) continue;
      const x0 = isoX(e.x, e.y), y0 = isoY(e.x, e.y) - (bodyH(e) + 30) * zoom;
      for (let k = 0; k < 3; k++) {
        const a = time * 5 + k * TAU / 3, sx = x0 + Math.cos(a) * 10 * zoom, sy = y0 + Math.sin(a) * 3.5 * zoom, r = 3.2 * zoom;
        ctx.beginPath(); ctx.moveTo(sx, sy - r); ctx.lineTo(sx + r * 0.3, sy - r * 0.3); ctx.lineTo(sx + r, sy); ctx.lineTo(sx + r * 0.3, sy + r * 0.3); ctx.lineTo(sx, sy + r); ctx.lineTo(sx - r * 0.3, sy + r * 0.3); ctx.lineTo(sx - r, sy); ctx.lineTo(sx - r * 0.3, sy - r * 0.3); ctx.closePath(); ctx.fill();
      }
    }
  }
  function collectSkillLights(tw) {
    for (const f of fx) {
      const k = f.t / f.life;
      if (f.k === 'boom') addLight(isoX(f.x, f.y), isoY(f.x, f.y) - 10 * zoom, 3.4 * tw, 'warm', 1 - k);
      else if (f.k === 'impact') addLight(isoX(f.x, f.y), isoY(f.x, f.y) - 20 * zoom, 2.2 * tw, 'amber', 1 - k);
      else if (f.k === 'rend' || f.k === 'lance') addLight(isoX(f.x + f.ux * f.len * 0.5, f.y + f.uy * f.len * 0.5), isoY(f.x + f.ux * f.len * 0.5, f.y + f.uy * f.len * 0.5), 3 * tw, f.k === 'rend' ? 'amber' : 'cyan', (1 - k) * 0.9);
      else if (f.k === 'vortex') addLight(isoX(f.x, f.y), isoY(f.x, f.y), 3 * tw, 'violet', 1 - k);
      else if (f.k === 'cry') addLight(isoX(f.x, f.y), isoY(f.x, f.y) - 20 * zoom, 3 * tw, 'red', (1 - k) * 0.7);
    }
    for (const fl of fields) addLight(isoX(fl.x, fl.y), isoY(fl.x, fl.y), fl.r * 1.5 * tw, 'cyan', 0.7);
    for (const m of meteors) if (m.at - m.t < 0.45) addLight(isoX(m.x, m.y), isoY(m.x, m.y) - 40 * zoom, 2 * tw, 'warm', 0.8);
    for (const s of bshots) addLight(isoX(s.x, s.y), isoY(s.x, s.y) - 22 * zoom, 1.3 * tw, 'warm', 0.7);
    for (const P of bpools) if (!(P.wait > 0)) addLight(isoX(P.x, P.y), isoY(P.x, P.y), P.r * 1.7 * tw, P.kind === 'fire' ? 'warm' : 'cyan', 0.55);
    if (player.auraT > 0) addLight(isoX(player.x, player.y), isoY(player.x, player.y) - 30 * zoom, 2.3 * tw, 'gold', 0.8);
  }

  /* ---------- HUD hotbar and tree UI ---------- */
  function updateSkillButtons() {
    if (!skEls) skEls = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => $('sk' + i));
    const ids = SLOTS[player.form];
    for (let i = 0; i < 8; i++) {
      const id = ids[i], s = SKD[id], l = slv(id), el = skEls[i], key = 'sk' + i;
      if (lastV[key + 'l'] !== id) { lastV[key + 'l'] = id; el.children[0].textContent = s.short; el.setAttribute('aria-label', s.name); }
      const sub = l ? 'Lv' + l : 'Lv' + s.lv + '〜';
      if (lastV[key + 's'] !== sub) { lastV[key + 's'] = sub; el.children[1].textContent = sub; }
      const st = !l ? 'lock' : player.mp < s.mp(l) ? 'dim' : 'on';
      if (lastV[key + 'st'] !== st) {
        lastV[key + 'st'] = st;
        el.classList.toggle('on', st !== 'lock');
        el.classList.toggle('lock', st === 'lock');
        el.classList.toggle('dim', st === 'dim');
      }
      const r = l ? Math.round(clamp((player.cd[id] || 0) / cdOf(id), 0, 1) * 60) / 60 : 0;
      if (lastV[key + 'c'] !== r) { lastV[key + 'c'] = r; el.style.setProperty('--cd', String(r)); }
    }
  }
  function skillCard(s) {
    const l = slv(s.id), met = reqMet(s);
    const card = document.createElement('div');
    card.className = 'skc' + (l ? ' got' : '') + (met ? '' : ' lock');
    const top = document.createElement('div'); top.className = 'skh';
    const nm = document.createElement('span'); nm.className = 'skn'; nm.textContent = s.name;
    const ty = document.createElement('span'); ty.className = 'skt'; ty.textContent = (s.form === 'both' ? '共通' : '') + (s.act ? 'アクティブ' : 'パッシブ');
    const bl = baseLv(s.id), lv = document.createElement('b'); lv.className = 'skl'; lv.textContent = 'Lv ' + bl + (l > bl ? '(+' + (l - bl) + ')' : '') + '/' + s.max;
    top.append(nm, ty, lv);
    const ds = document.createElement('p'); ds.className = 'skd'; ds.textContent = s.desc(Math.max(1, l));
    card.append(top, ds);
    if (l && l < s.max) { const nx = document.createElement('p'); nx.className = 'skx'; nx.textContent = '次のLv：' + s.desc(l + 1); card.append(nx); }
    if (s.act) { const m = document.createElement('p'); m.className = 'skm'; m.textContent = '消費MP ' + s.mp(Math.max(1, l)) + '／再使用 ' + s.cd + '秒'; card.append(m); }
    const rq = reqText(s);
    if (rq) { const r = document.createElement('p'); r.className = 'skr' + (met ? ' ok' : ''); r.textContent = '必要：' + rq; card.append(r); }
    skillCardExtras(s, card);
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'plus'; btn.textContent = '＋';
    btn.setAttribute('aria-label', s.name + 'のレベルを上げる');
    btn.disabled = !canLearn(s);
    btn.addEventListener('click', () => { learn(s.id); renderSheet(); });
    card.append(btn);
    return card;
  }
  function renderTree(form) {
    $('kpText').textContent = String(prog.kp);
    const box = $('skillTree');
    box.textContent = '';
    box.append(elP('ith', gemSummary()));
    for (let tier = 1; tier <= TIER_LV.length; tier++) {
      const list = SK.filter((s) => s.tier === tier && (s.form === form || s.form === 'both'));
      if (!list.length) continue;
      const sec = document.createElement('section'); sec.className = 'tier';
      const h = document.createElement('h4'); h.textContent = tier === 7 ? '極意（キャラLv' + TIER_LV[6] + '〜・強力だが代償がある）' : '第' + tier + '段（キャラLv' + TIER_LV[tier - 1] + '〜）';
      sec.appendChild(h);
      for (const s of list) sec.appendChild(skillCard(s));
      box.appendChild(sec);
    }
  }
