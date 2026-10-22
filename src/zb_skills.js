  /* ================= skills 2.0: support gems (Path of Exile), hotbar loadout, new skills, keystones ================= */
  // Support gems socket into active skills. A cast carries a context (damage, crit, leech, element...) that also
  // follows its projectiles, fields, meteors and dashes, so delayed hits keep the gem effects.
  const GEMS = {
    amp: { name: '増幅', d: 'このスキルのダメージ +35%' },
    twin: { name: '二連', d: '0.3秒後にもう一度発動（威力60%）' },
    haste: { name: '速攻', d: '再使用時間 -25%' },
    thrift: { name: '節約', d: '消費MP -40%' },
    fire: { name: '炎の付与', d: 'このスキルの攻撃に炎の元素が付く' },
    ice: { name: '氷の付与', d: 'このスキルの攻撃に氷の元素が付く' },
    volt: { name: '雷の付与', d: 'このスキルの攻撃に雷の元素が付く' },
    crit: { name: '必中', d: 'このスキルの会心率 +25%' },
    leech: { name: '吸命', d: 'このスキルで与えたダメージの3%だけHP回復' },
    exec: { name: '処刑', d: 'HPが35%以下の敵へのダメージ +60%' }
  };
  const GEM_IDS = Object.keys(GEMS);
  const NO_TWIN = ['sprint', 'aura', 'cry', 'heal', 'dance', 'blades', 'storm'];
  const DEF_SLOTS = { blade: ['whirl', 'gale', 'bash', 'rend', 'cry', 'dance', 'aura'], arcane: ['chain', 'fireball', 'heal', 'frost', 'lance', 'vortex', 'meteor'] };
  var skillCtx = null;
  const recasts = [], storms = [], gravs = [];
  function keyOn(id) { return baseLv(id) > 0; }
  function gemBag() { if (!prog.gems || typeof prog.gems !== 'object') prog.gems = {}; return prog.gems; }
  function sockOf(id) { if (!prog.sock || typeof prog.sock !== 'object') prog.sock = {}; if (!Array.isArray(prog.sock[id])) prog.sock[id] = []; return prog.sock[id]; }
  function sockets(id) { const b = baseLv(id); return !SKD[id] || !SKD[id].act || id === 'sprint' || !b ? 0 : 1 + (b >= 5 ? 1 : 0) + (b >= 10 ? 1 : 0); }
  function gemsUsed(g) { let n = 0; for (const id in (prog.sock || {})) for (const x of prog.sock[id]) if (x === g) n++; return n; }
  function gemFree(g) { return (gemBag()[g] || 0) - gemsUsed(g); }
  function skillGems(id) { return sockOf(id).slice(0, sockets(id)).filter((g) => GEMS[g]); }
  function gainGem(g, quiet) {
    g = g || GEM_IDS[(Math.random() * GEM_IDS.length) | 0];
    gemBag()[g] = (gemBag()[g] || 0) + 1;
    if (!quiet) { toast('サポート宝石「' + GEMS[g].name + '」を手に入れた（スキル画面ではめられる）'); sfx('rare'); }
    return g;
  }
  function makeCtx(id) {
    const gs = skillGems(id), c = { id, dmg: 1, crit: 0, leech: 0, exec: false, el: null, twin: false };
    for (const g of gs) {
      if (g === 'amp') c.dmg *= 1.35;
      else if (g === 'crit') c.crit += 0.25;
      else if (g === 'leech') c.leech += 0.03;
      else if (g === 'exec') c.exec = true;
      else if (g === 'twin') c.twin = true;
      else if (g === 'fire' || g === 'ice' || g === 'volt') c.el = g;
    }
    return c;
  }
  function withCtx(c, fn) {
    if (!c) return fn();
    const prev = skillCtx; skillCtx = c;
    try { return c.el && !curEl ? withEl(c.el, fn) : fn(); } finally { skillCtx = prev; }
  }
  function ctxDmgMul(e) {
    const c = skillCtx;
    let m = c ? c.dmg * (c.exec && e.hp < e.maxHp * 0.35 ? 1.6 : 1) : 1;
    if (player.form === 'blade' && keyOn('k_berserk')) m *= 1 + 0.6 * (1 - clamp(player.hp / D.maxHp, 0, 1));
    if (player.shiftT > 0 && keyOn('k_soul')) m *= 1.25;
    if (!c && player.form === 'arcane' && keyOn('k_elem')) m *= 0.8;
    return m;
  }
  function ctxCritAdd() { return skillCtx ? skillCtx.crit : 0; }
  function ctxOnDamage(dmg) {
    let st = skillCtx ? skillCtx.leech : 0;
    if (player.form === 'blade' && keyOn('k_blood')) st += D.steal;
    if (st > 0 && !player.dead) player.hp = Math.min(D.maxHp, player.hp + dmg * st);
  }
  // wraps CAST: context for synchronous hits, then tags anything the cast spawned
  function castWithGems(id, l) {
    const c = makeCtx(id), n0 = [shots.length, fields.length, meteors.length, storms.length, gravs.length], d0 = dash, dn0 = dance;
    const ok = withCtx(c, () => CAST[id](l));
    if (ok === false) return false;
    const tag = (arr, from) => { for (let k = from; k < arr.length; k++) if (!arr[k].ctx) arr[k].ctx = c; };
    tag(shots, n0[0]); tag(fields, n0[1]); tag(meteors, n0[2]); tag(storms, n0[3]); tag(gravs, n0[4]);
    if (dash && dash !== d0) dash.ctx = c;
    if (dance && dance !== dn0) dance.ctx = c;
    if (c.twin && !NO_TWIN.includes(id)) recasts.push({ id, l, t: 0.3, ctx: Object.assign({}, c, { dmg: c.dmg * 0.6, twin: false }) });
    return true;
  }
  function skillMpMul(id) { return (skillGems(id).includes('thrift') ? 0.6 : 1) * (keyOn('k_echo') ? 1.25 : 1); }
  function skillCdMul(id) { return skillGems(id).includes('haste') ? 0.75 : 1; }
  function skillCdAdd(id) { return id === 'sprint' && keyOn('k_mikiri') ? 0.8 : 0; }
  function afterCast(id) { if (keyOn('k_echo') && id !== 'sprint' && Math.random() < 0.2) { player.cd[id] = 0; addText(player.x, player.y, '詠唱連鎖', 'react', 70); } }

  /* ---------- hotbar loadout ---------- */
  function applySlots() {
    if (!prog.slots || typeof prog.slots !== 'object') prog.slots = {};
    for (const f of ['blade', 'arcane']) {
      const want = Array.isArray(prog.slots[f]) ? prog.slots[f] : DEF_SLOTS[f];
      const ok = want.length === 7 && new Set(want).size === 7 && want.every((id) => SKD[id] && SKD[id].act && id !== 'sprint' && (SKD[id].form === f || SKD[id].form === 'both'));
      prog.slots[f] = (ok ? want : DEF_SLOTS[f]).slice();
      for (let i = 0; i < 7; i++) SLOTS[f][i] = prog.slots[f][i];
      SLOTS[f][7] = 'sprint';
    }
  }
  function setSlot(form, id, i) {
    applySlots();
    const arr = prog.slots[form], at = arr.indexOf(id);
    if (at === i) return;
    if (at >= 0) arr[at] = arr[i];
    arr[i] = id;
    applySlots(); save();
  }

  /* ---------- new active skills ---------- */
  function castSkyfall(l) {
    const t = pickTarget(6.5) || nearest(player.x, player.y, 6.5, null);
    if (!t) { toast('近くに敵がいない'); return false; }
    const dx = t.x - player.x, dy = t.y - player.y, d = hyp(dx, dy) || 1;
    let lx = t.x - dx / d * 0.7, ly = t.y - dy / d * 0.7;
    if (blockedAt(lx, ly, 0.25)) { lx = player.x; ly = player.y; }
    for (let k = 0; k < 8; k++) addPart({ k: 'magic', x: player.x + (lx - player.x) * k / 8, y: player.y + (ly - player.y) * k / 8, z: 20 + Math.sin(k / 8 * Math.PI) * 60, vx: 0, vy: 0, vz: 2, t: 0, life: 0.4, s: 1, c: 'amber' });
    player.x = lx; player.y = ly; player.path.length = 0;
    faceToward(dx, dy);
    const mul = 3.2 + 0.4 * (l - 1);
    for (const e of foesAt(lx, ly, 2.2)) { hitEnemy(e, D.atk * mul); if (!e.dead) e.stunT = Math.max(e.stunT || 0, 0.8); }
    addVfx({ k: 'ring', x: lx, y: ly, R: 2.4, c: '255,196,90', w: 9, life: 0.5 });
    addFx({ k: 'impact', x: lx, y: ly, t: 0, life: 0.35 });
    burst(lx, ly, 4, 'dust', 20, '', 4);
    addShake(7); zoomPunch(0.03);
    player.swingT = player.swingDur = 0.3;
    return true;
  }
  function castBlades(l) { player.bladesT = 4; player.bladesTick = 0; player.bladesMul = 0.7 + 0.1 * (l - 1); player.bladesCtx = skillCtx; return true; }
  function castStorm(l) { storms.push({ t: 5, tick: 0, mul: 1.1 + 0.15 * (l - 1) }); player.swingT = player.swingDur = 0.34; return true; }
  function castGravity(l) {
    const t = pickTarget(7) || nearest(player.x, player.y, 7, null);
    if (!t) { toast('近くに敵がいない'); return false; }
    faceToward(t.x - player.x, t.y - player.y);
    gravs.push({ x: t.x, y: t.y, t: 0, at: 1.4, mul: 5 + 0.6 * (l - 1) });
    player.swingT = player.swingDur = 0.34;
    return true;
  }
  function foesAt(x, y, r) { return enemies.filter((e) => !e.dead && hyp(e.x - x, e.y - y) <= r + (e.r || 0)); }
  function growthUpdate(dt) {
    for (let i = recasts.length - 1; i >= 0; i--) {
      const R = recasts[i]; R.t -= dt;
      if (R.t > 0) continue;
      recasts.splice(i, 1);
      if (!player.dead && !paused) withCtx(R.ctx, () => CAST[R.id](R.l));
    }
    if (player.bladesT > 0) {
      player.bladesT -= dt; player.bladesTick -= dt;
      if (player.bladesTick <= 0) {
        player.bladesTick = 0.3;
        withCtx(player.bladesCtx, () => { for (const e of foesAt(player.x, player.y, 1.9)) hitEnemy(e, D.atk * player.bladesMul); });
        for (let k = 0; k < 2; k++) addVfx({ k: 'swoosh', x: player.x, y: player.y, h: 30, a: Math.random() * TAU, dir: k ? 1 : -1, c: '255,210,120', big: true, life: 0.25 });
      }
    }
    for (let i = storms.length - 1; i >= 0; i--) {
      const S = storms[i]; S.t -= dt; S.tick -= dt;
      if (S.t <= 0 || player.dead) { storms.splice(i, 1); continue; }
      if (S.tick > 0) continue;
      S.tick = 0.4;
      const near = foesAt(player.x, player.y, 6);
      if (!near.length) continue;
      const e = near[(Math.random() * near.length) | 0];
      withCtx(S.ctx, () => withEl(curEl || 'volt', () => hitEnemy(e, D.atk * S.mul)));
      addFx({ k: 'chain', pts: [[e.x, e.y, 170], [e.x, e.y, bodyH(e)]], jit: null, seed: -1, t: 0, life: 0.3 });
      sfx('zap');
    }
    for (let i = gravs.length - 1; i >= 0; i--) {
      const g = gravs[i]; g.t += dt;
      for (const e of foesAt(g.x, g.y, 3.6)) {
        if (e.boss) continue;
        const dx = g.x - e.x, dy = g.y - e.y, d = hyp(dx, dy);
        if (d > 0.4) moveEnemy(e, e.x + dx / d * Math.min(d, 3.2 * dt), e.y + dy / d * Math.min(d, 3.2 * dt));
      }
      if (Math.random() < dt * 30) { const a = Math.random() * TAU; addPart({ k: 'magic', x: g.x + Math.cos(a) * 2.6, y: g.y + Math.sin(a) * 2.6, z: 10, vx: -Math.cos(a) * 2.4, vy: -Math.sin(a) * 2.4, vz: 0, t: 0, life: 0.6, s: 0.8, c: 'violet' }); }
      if (g.t < g.at) continue;
      gravs.splice(i, 1);
      withCtx(g.ctx, () => { for (const e of foesAt(g.x, g.y, 2.6)) hitEnemy(e, D.atk * g.mul); });
      vfxExplode(g.x, g.y, 2); addVfx({ k: 'ring', x: g.x, y: g.y, R: 3, c: '176,146,255', w: 10, life: 0.6 }); addVfx({ k: 'sflash', c: '200,170,255', a: 0.18, life: 0.3 });
      addShake(9); zoomPunch(0.04); sfx('boom');
    }
  }

  /* ---------- skill tab: sockets and hotbar slot for each active skill ---------- */
  function skillCardExtras(s, card) {
    if (!s.act || s.id === 'sprint' || !baseLv(s.id)) return;
    const row = document.createElement('div'); row.className = 'skx2';
    const form = s.form === 'both' ? player.form : s.form;
    applySlots();
    const slot = document.createElement('select'); slot.className = 'gsort';
    slot.setAttribute('aria-label', s.name + 'をホットバーに置く場所');
    const at = prog.slots[form].indexOf(s.id);
    if (at < 0) { const o = document.createElement('option'); o.value = ''; o.textContent = 'ホットバーに置く…'; slot.append(o); }
    for (let i = 0; i < 7; i++) { const o = document.createElement('option'); o.value = String(i); o.textContent = 'ボタン' + (i + 1) + (prog.slots[form][i] === s.id ? '（ここ）' : '：' + SKD[prog.slots[form][i]].short); slot.append(o); }
    slot.value = at < 0 ? '' : String(at);
    slot.addEventListener('change', () => { if (slot.value !== '') { setSlot(form, s.id, +slot.value); renderSheet(); } });
    row.append(slot);
    const n = sockets(s.id), sk = sockOf(s.id);
    for (let k = 0; k < 3; k++) {
      const sel = document.createElement('select'); sel.className = 'gsort gem';
      if (k >= n) { sel.disabled = true; const o = document.createElement('option'); o.textContent = '◇ スキルLv' + (k === 1 ? 5 : 10) + 'で開放'; sel.append(o); row.append(sel); continue; }
      sel.setAttribute('aria-label', s.name + 'の宝石枠' + (k + 1));
      const cur = GEMS[sk[k]] ? sk[k] : '';
      const o0 = document.createElement('option'); o0.value = ''; o0.textContent = '◇ 空き'; sel.append(o0);
      for (const g of GEM_IDS) {
        if (g !== cur && gemFree(g) <= 0) continue;
        const o = document.createElement('option'); o.value = g; o.textContent = '◆ ' + GEMS[g].name + '（' + GEMS[g].d + '）'; sel.append(o);
      }
      sel.value = cur;
      sel.addEventListener('change', () => { sk[k] = sel.value || null; save(); renderSheet(); });
      row.append(sel);
    }
    card.append(row);
  }
  function gemPrice() { return 400 + prog.level * 40; }
  function gemDropOn(e) { if (e.world) return; const p = e.final ? 1 : e.boss ? 0.4 : e.elite ? 0.04 : 0.002; if (Math.random() < p) gainGem(); }
  function gemSummary() {
    const have = GEM_IDS.filter((g) => (gemBag()[g] || 0) > 0).map((g) => GEMS[g].name + '×' + gemBag()[g] + (gemsUsed(g) ? '（' + gemsUsed(g) + '使用中）' : ''));
    return 'サポート宝石：' + (have.length ? have.join('、') : 'まだない（強い個体・ボス・道具屋）');
  }
