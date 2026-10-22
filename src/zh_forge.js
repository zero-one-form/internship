  /* ================= minigame: 鍛冶の打ち込み (timing strikes that raise the enhance success rate) ================= */
  // Three hammer strikes on a sweeping marker. PERFECT +10% / GOOD +5% to the success rate;
  // three PERFECTs guarantee success and sometimes forge two levels at once. Logic in forgeStep(dt) / forgeHit().
  const FORGE_N = 3;
  var FG = { on: false, it: null, pos: 0, dir: 1, hits: [], phase: 'idle', t: 0, freeze: false, raf: 0, flash: null };
  function forgeSpeed(it) { return 0.9 + it.plus * 0.12; }            // sweeps per second across the bar
  function forgeZone(it) { return { good: Math.max(0.07, 0.15 - it.plus * 0.008), perfect: Math.max(0.025, 0.05 - it.plus * 0.002) }; }
  function forgeOpen(it) {
    if (!it || it.plus >= 10 || !inCamp(player.x, player.y)) return;
    if (prog.gold < enhanceCost(it)) { toast('所持金が足りない'); return; }
    FG.on = true; FG.it = it; FG.pos = 0; FG.dir = 1; FG.hits = []; FG.phase = 'strike'; FG.t = 0; FG.flash = null;
    paused = true; drag.active = false;
    $('forgeOv').hidden = false; $('forgePanel').hidden = true;
    cancelAnimationFrame(FG.raf); FG.raf = requestAnimationFrame(forgeLoop);
  }
  function forgeClose(back) {
    FG.on = false; cancelAnimationFrame(FG.raf);
    $('forgeOv').hidden = true; paused = false;
    if (back) { openSheet(); setTab('gear'); }
  }
  function forgeStep(dt) {
    if (!FG.on || FG.freeze) return;
    FG.t += dt;
    if (FG.flash) { FG.flash.t += dt; if (FG.flash.t > 0.6) FG.flash = null; }
    if (FG.phase !== 'strike') return;
    FG.pos += FG.dir * dt * forgeSpeed(FG.it) * 2;
    if (FG.pos > 1) { FG.pos = 2 - FG.pos; FG.dir = -1; }
    if (FG.pos < -1) { FG.pos = -2 - FG.pos; FG.dir = 1; }
  }
  function forgeHit() {
    if (!FG.on || FG.phase !== 'strike') return;
    const Z = forgeZone(FG.it), d = Math.abs(FG.pos), q = d <= Z.perfect ? 2 : d <= Z.good ? 1 : 0;
    FG.hits.push(q);
    FG.flash = { q, t: 0 };
    sfx(q === 2 ? 'crit' : q ? 'anvil' : 'fail'); if (q) addShake(q * 2);
    if (FG.hits.length >= FORGE_N) { FG.phase = 'done'; setTimeout(() => { if (FG.on && FG.phase === 'done') forgeResolve(); }, TEST ? 0 : 500); }
  }
  function forgeBonus(hits) { return hits.reduce((a, q) => a + (q === 2 ? 0.1 : q === 1 ? 0.05 : 0), 0); }
  function forgeResolve() {
    const it = FG.it, hits = FG.hits, all = hits.every((q) => q === 2), bonus = forgeBonus(hits);
    const before = it.plus, ok = enhance(it, { bonus, sure: all, great: all && Math.random() < 0.35 });
    const words = hits.map((q) => (q === 2 ? 'PERFECT' : q ? 'GOOD' : 'MISS')).join(' / ');
    $('forgeRes').textContent = words + '　成功率 +' + Math.round(bonus * 100) + '%' + (all ? '（会心の打ち込み！）' : '') + '　→　' +
      (ok ? '強化成功！ +' + it.plus + (it.plus - before >= 2 ? '（二段階上がった！）' : '') : '失敗…（装備はそのまま）');
    $('forgeTitle').textContent = 'ガルドの鍛冶場';
    const cost = enhanceCost(it);
    $('forgeAgain').hidden = it.plus >= 10; $('forgeAgain').disabled = prog.gold < cost;
    $('forgeAgain').textContent = 'もう一度（' + cost + 'G）';
    $('forgePanel').hidden = false;
    FG.phase = 'result';
  }
  function forgeLoop() {
    if (!FG.on) return;
    FG.raf = requestAnimationFrame(forgeLoop);
    const now = performance.now() / 1000, dt = Math.min(0.05, FG.lastT ? now - FG.lastT : 0); FG.lastT = now;
    try { forgeStep(dt); forgeDraw(); } catch (e) { console.error(e); forgeClose(false); }
  }
  function forgeDraw() {
    const cv = $('forgeCv'), d = Math.min(1.5, window.devicePixelRatio || 1), W2 = Math.max(1, cv.clientWidth), H2 = Math.max(1, cv.clientHeight);
    if (cv.width !== Math.round(W2 * d) || cv.height !== Math.round(H2 * d)) { cv.width = Math.round(W2 * d); cv.height = Math.round(H2 * d); }
    const g = cv.getContext('2d'), t = performance.now() / 1000, it = FG.it;
    g.setTransform(d, 0, 0, d, 0, 0);
    g.fillStyle = rad(g, W2 / 2, H2 * 0.62, Math.max(W2, H2) * 0.7, [[0, '#5a2a10'], [0.5, '#261208'], [1, '#0c0604']]); g.fillRect(0, 0, W2, H2);
    // anvil with the glowing blade on top
    const ax = W2 / 2, ay = H2 * 0.5, aw = Math.min(W2 * 0.6, 280);
    g.fillStyle = '#2b2d36'; g.beginPath(); g.moveTo(ax - aw / 2, ay); g.lineTo(ax + aw / 2, ay); g.lineTo(ax + aw * 0.32, ay + 26); g.lineTo(ax + aw * 0.12, ay + 30); g.lineTo(ax + aw * 0.16, ay + 80); g.lineTo(ax - aw * 0.16, ay + 80); g.lineTo(ax - aw * 0.12, ay + 30); g.lineTo(ax - aw * 0.4, ay + 22); g.closePath(); g.fill();
    g.fillStyle = '#4a4d5a'; g.fillRect(ax - aw / 2, ay - 4, aw, 6);
    const heat = 0.6 + 0.4 * Math.sin(t * 3);
    g.fillStyle = 'rgba(255,' + Math.round(120 + 60 * heat) + ',40,0.95)'; g.fillRect(ax - aw * 0.35, ay - 12, aw * 0.6, 8);
    g.fillStyle = rad(g, ax - aw * 0.05, ay - 8, aw * 0.5, [[0, 'rgba(255,150,60,0.35)'], [1, 'rgba(255,150,60,0)']]); g.fillRect(0, 0, W2, H2);
    if (it) { g.fillStyle = '#ffe2b0'; g.font = '800 16px sans-serif'; g.textAlign = 'center'; g.fillText(it.name + '　+' + it.plus + ' → +' + Math.min(10, it.plus + 1), W2 / 2, H2 * 0.16); }
    // timing bar
    const bx = W2 * 0.1, bw = W2 * 0.8, by = H2 * 0.74, Z = it ? forgeZone(it) : { good: 0.1, perfect: 0.04 };
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(bx, by, bw, 22);
    g.fillStyle = 'rgba(255,200,90,0.55)'; g.fillRect(bx + bw * (0.5 - Z.good / 2), by, bw * Z.good, 22);
    g.fillStyle = '#ffe14a'; g.fillRect(bx + bw * (0.5 - Z.perfect / 2), by, bw * Z.perfect, 22);
    const mx = bx + bw * (0.5 + FG.pos / 2);
    g.fillStyle = '#fff'; g.fillRect(mx - 2, by - 8, 4, 38);
    g.fillStyle = '#fff'; g.font = '800 14px sans-serif'; g.textAlign = 'center';
    g.fillText(FG.phase === 'strike' ? 'タップで打つ（' + (FG.hits.length + 1) + '/' + FORGE_N + '）　白い線が金色に重なった瞬間！' : '', W2 / 2, by + 50);
    // strike marks so far
    for (let k = 0; k < FORGE_N; k++) { const q = FG.hits[k]; g.fillStyle = q === 2 ? '#ffe14a' : q === 1 ? '#ffb05a' : q === 0 ? '#666' : 'rgba(255,255,255,0.18)'; g.beginPath(); g.arc(W2 / 2 + (k - 1) * 30, by - 28, 9, 0, TAU); g.fill(); }
    if (FG.flash) {
      const q = FG.flash.q, k = FG.flash.t / 0.6;
      g.globalAlpha = 1 - k; g.fillStyle = q === 2 ? '#ffe14a' : q ? '#ffb05a' : '#aaa'; g.font = '900 ' + (36 + k * 10) + 'px sans-serif';
      g.fillText(q === 2 ? 'PERFECT!' : q ? 'GOOD' : 'MISS', W2 / 2, ay - 50 - k * 20);
      if (q) for (let n = 0; n < 14; n++) { const a = n / 14 * TAU, r = 20 + k * 90; g.fillStyle = '#ffd27a'; g.fillRect(ax - aw * 0.05 + Math.cos(a) * r, ay - 10 + Math.sin(a) * r * 0.5, 3, 3); }
      g.globalAlpha = 1;
    }
  }
  function forgeBind() {
    const cv = $('forgeCv');
    cv.addEventListener('pointerdown', (ev) => { if (FG.phase !== 'strike') return; ev.preventDefault(); forgeHit(); });
    $('forgeAgain').addEventListener('click', () => { const it = FG.it; forgeClose(false); forgeOpen(it); });
    $('forgeBack').addEventListener('click', () => forgeClose(true));
    document.addEventListener('keydown', (ev) => {
      if (!FG.on) return;
      ev.stopImmediatePropagation();
      if (ev.key === 'Escape') { forgeClose(true); return; }
      if ((ev.key === ' ' || ev.key === 'Enter') && !ev.repeat) { ev.preventDefault(); forgeHit(); }
    }, true);
  }
