  /* ================= minigame: 釣り (fishing at the camp pond) ================= */
  // cast → wait for a bite → tap in time → reel: hold to pull, let go before the line snaps.
  // The logic runs in fishStep(dt) so tests (and the balance bot) can drive it without a frame loop.
  const FISH = [
    // id, name, weight, minDeep, pull (how hard it fights), size cm [min,max], gold per cm
    ['funa', 'ヒカリブナ', 30, 0, 0.25, [12, 28], 6],
    ['ayu', '森のアユ', 24, 0, 0.35, [15, 30], 9],
    ['koi', '錦ゴイ', 14, 0, 0.45, [30, 70], 10],
    ['nama', 'ヒゲナマズ', 10, 5, 0.55, [40, 90], 12],
    ['ember', 'ホノオウオ', 7, 11, 0.6, [20, 45], 30],
    ['frost', '氷晶マス', 6, 16, 0.6, [25, 55], 32],
    ['bone', 'ホネサカナ', 5, 21, 0.5, [20, 50], 34],
    ['sand', '砂漠のシーラ', 4, 26, 0.7, [60, 140], 26],
    ['star', '流れ星ウオ', 3, 31, 0.75, [10, 25], 160],
    ['gold', '黄金のタイ', 2, 0, 0.8, [40, 80], 120],
    ['lord', '深淵のヌシ', 0.6, 40, 0.95, [150, 300], 80],
    ['boot', '古い長ぐつ', 6, 0, 0.1, [25, 25], 1]
  ].map(([id, name, w, deep, pull, size, gpc]) => ({ id, name, w, deep, pull, size, gpc }));
  const FISH_BY = Object.fromEntries(FISH.map((f) => [f.id, f]));
  var FS = { on: false, phase: 'menu', t: 0, wait: 0, fish: null, size: 0, tension: 0, prog: 0, hold: false, slack: 0, fight: 0, raf: 0, msg: '', last: null };
  function fishState() {
    if (!prog.fish || typeof prog.fish !== 'object') prog.fish = { got: {}, best: {} };
    return prog.fish;
  }
  function fishPick() {
    const deep = prog.deep || 0, pool = FISH.filter((f) => deep >= f.deep), tot = pool.reduce((a, f) => a + f.w, 0);
    let r = Math.random() * tot;
    for (const f of pool) { r -= f.w; if (r <= 0) return f; }
    return pool[0];
  }
  function fishOpen() {
    if (paused || player.dead || curMap === 3 || !inCamp(player.x, player.y)) return;
    FS.on = true; paused = true; drag.active = false;
    $('fishOv').hidden = false;
    fishMenu();
    cancelAnimationFrame(FS.raf); FS.raf = requestAnimationFrame(fishLoop);
  }
  function fishClose() {
    FS.on = false; FS.phase = 'menu'; cancelAnimationFrame(FS.raf);
    $('fishOv').hidden = true; paused = false; save();
  }
  function fishMenu(res) {
    FS.phase = 'menu'; FS.hold = false;
    const S = fishState(), kinds = FISH.filter((f) => S.got[f.id]).length;
    $('fishPanel').hidden = false;
    $('fishLead').textContent = '浮きが沈んだら、すぐにタップ！ そのあとは長押しで巻き、糸が赤くなったら指を離す。深淵の深くまで行くほど、珍しい魚が釣れる。';
    $('fishRes').hidden = !res; if (res) $('fishRes').textContent = res;
    $('fishDex').textContent = '図鑑 ' + kinds + '/' + FISH.length + '：' + FISH.map((f) => S.got[f.id] ? f.name + (S.best[f.id] ? '（' + S.best[f.id] + 'cm）' : '') : '？？？').join('・');
  }
  function fishCast() {
    $('fishPanel').hidden = true;
    FS.phase = 'wait'; FS.t = 0; FS.wait = 1.5 + Math.random() * 3.5; FS.fish = fishPick(); FS.tension = 0; FS.prog = 0; FS.slack = 0; FS.fight = 0; FS.hold = false; FS.msg = '';
    sfx('ui');
  }
  // one input for every phase: a tap on the bite, holding while reeling
  function fishDown() {
    if (FS.phase === 'wait') { FS.phase = 'menu'; fishMenu('早すぎた！ 魚が逃げてしまった'); return; }
    if (FS.phase === 'bite') { FS.phase = 'reel'; FS.t = 0; FS.hold = true; sfx('hit'); return; }
    if (FS.phase === 'reel') FS.hold = true;
  }
  function fishUp() { FS.hold = false; }
  function fishStep(dt) {
    if (!FS.on || FS.freeze) return; // freeze: screenshots hold a moment still
    FS.t += dt;
    if (FS.phase === 'wait' && FS.t >= FS.wait) { FS.phase = 'bite'; FS.t = 0; sfx('quest'); }
    else if (FS.phase === 'bite' && FS.t > 0.9) fishMenu('合わせが遅れた……魚に逃げられた');
    else if (FS.phase === 'reel') {
      const f = FS.fish;
      FS.fight = Math.max(0, FS.fight - dt);
      if (FS.fight <= 0 && Math.random() < dt * (0.4 + f.pull * 0.8)) FS.fight = 0.4 + Math.random() * 0.8; // the fish makes a run
      const pull = FS.fight > 0 ? 0.55 + f.pull * 0.7 : 0.1;
      if (FS.hold) { FS.tension += dt * (0.35 + pull); FS.prog += dt * (FS.fight > 0 ? 0.04 : 0.22) * (1.2 - f.pull * 0.5); }
      else { FS.tension -= dt * 0.6; FS.prog -= dt * (FS.fight > 0 ? 0.08 * f.pull : 0); }
      FS.tension = clamp(FS.tension, 0, 1.2); FS.prog = clamp(FS.prog, 0, 1);
      FS.slack = FS.tension <= 0.02 && FS.fight > 0 ? FS.slack + dt : 0;
      if (FS.tension >= 1) { sfx('fail'); fishMenu('糸が切れた！ ' + (f.id === 'boot' ? '……長ぐつだったけど' : f.name + 'の影が見えたのに')); }
      else if (FS.slack > 2.2) fishMenu('糸がゆるんで、' + f.name + 'に逃げられた');
      else if (FS.prog >= 1) fishCatch();
    }
  }
  function fishCatch() {
    const f = FS.fish, S = fishState(), size = Math.round(f.size[0] + Math.random() * (f.size[1] - f.size[0]));
    const first = !S.got[f.id], record = size > (S.best[f.id] || 0);
    S.got[f.id] = (S.got[f.id] || 0) + 1; if (f.id !== 'boot') S.best[f.id] = Math.max(S.best[f.id] || 0, size);
    const gold = Math.round(size * f.gpc * (1 + prog.level / 40));
    prog.gold += gold;
    if (first && f.id !== 'boot') gainSoul(3, '図鑑');
    const who = HERO_IDS.filter((id) => heroJoined(id));
    const fan = who.length ? HEROINES[who[Math.floor(Math.random() * who.length)]].name + '「' + (f.id === 'boot' ? 'それ、魚じゃないよね……？' : f.id === 'lord' ? 'う、うそでしょ!? ヌシを釣ったの!?' : 'わあ、すごい！') + '」' : '';
    FS.last = { id: f.id, size, gold };
    sfx(f.id === 'lord' || f.id === 'gold' ? 'legend' : 'quest');
    save();
    fishMenu(f.name + '（' + size + 'cm）を釣り上げた！ ' + gold.toLocaleString() + 'G' + (first ? '　図鑑に登録' + (f.id !== 'boot' ? '（魂の欠片+3）' : '') : record ? '　自己ベスト！' : '') + (fan ? '　' + fan : ''));
  }
  function fishLoop() {
    if (!FS.on) return;
    FS.raf = requestAnimationFrame(fishLoop);
    const now = performance.now() / 1000, dt = Math.min(0.05, FS.lastT ? now - FS.lastT : 0); FS.lastT = now;
    try { fishStep(dt); fishDraw(); } catch (e) { console.error(e); fishClose(); }
  }
  function fishDraw() {
    const cv = $('fishCv'), d = Math.min(1.5, window.devicePixelRatio || 1), W2 = Math.max(1, cv.clientWidth), H2 = Math.max(1, cv.clientHeight);
    if (cv.width !== Math.round(W2 * d) || cv.height !== Math.round(H2 * d)) { cv.width = Math.round(W2 * d); cv.height = Math.round(H2 * d); }
    const g = cv.getContext('2d'), t = performance.now() / 1000;
    g.setTransform(d, 0, 0, d, 0, 0);
    // dusk sky, far trees, pond
    let gr = g.createLinearGradient(0, 0, 0, H2); gr.addColorStop(0, '#1b2350'); gr.addColorStop(0.35, '#e88a5a'); gr.addColorStop(0.36, '#1d4a4a'); gr.addColorStop(1, '#0a1e26');
    g.fillStyle = gr; g.fillRect(0, 0, W2, H2);
    g.fillStyle = '#12302a';
    for (let x = -20; x < W2 + 40; x += 34) { const h = 30 + 18 * Math.sin(x * 0.07); g.beginPath(); g.moveTo(x, H2 * 0.36); g.lineTo(x + 17, H2 * 0.36 - h); g.lineTo(x + 34, H2 * 0.36); g.fill(); }
    g.strokeStyle = 'rgba(255,220,180,0.18)'; g.lineWidth = 1.5;
    for (let i = 0; i < 9; i++) { const y = H2 * (0.42 + i * 0.06), o = Math.sin(t * 0.8 + i) * 20; g.beginPath(); g.moveTo(W2 * 0.15 + o, y); g.lineTo(W2 * 0.45 + o, y); g.moveTo(W2 * 0.6 - o, y + 8); g.lineTo(W2 * 0.85 - o, y + 8); g.stroke(); }
    const bx = W2 / 2, by = H2 * 0.58;
    if (FS.phase !== 'menu') {
      const sink = FS.phase === 'bite' ? 10 + Math.sin(t * 30) * 4 : FS.phase === 'reel' ? 14 : Math.sin(t * 2.5) * 2;
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1; g.beginPath(); g.moveTo(W2 * 0.9, H2 * 0.05); g.quadraticCurveTo(W2 * 0.7, by - 120, bx, by + sink - 8); g.stroke();
      g.fillStyle = '#ff5a5a'; g.beginPath(); g.arc(bx, by + sink - 6, 7, Math.PI, 0); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(bx, by + sink - 6, 7, 0, Math.PI); g.fill();
      if (FS.phase === 'bite') { g.fillStyle = '#ffe14a'; g.font = '900 64px sans-serif'; g.textAlign = 'center'; g.fillText('！', bx, by - 40); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 3; g.beginPath(); g.arc(bx, by + 6, 20 + (FS.t * 60) % 30, 0, TAU); g.stroke(); }
    }
    if (FS.phase === 'reel') {
      // the fish shadow struggles under the float
      const sx = bx + Math.sin(t * (FS.fight > 0 ? 9 : 3)) * (FS.fight > 0 ? 40 : 14);
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(sx, by + 40, 30 + FS.fish.pull * 30, 10, 0, 0, TAU); g.fill();
      // tension bar (green → red) and catch progress
      const x0 = W2 * 0.12, w0 = W2 * 0.76, y0 = H2 * 0.82;
      g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(x0, y0, w0, 18); g.fillRect(x0, y0 + 30, w0, 12);
      const k = Math.min(1, FS.tension);
      g.fillStyle = k > 0.75 ? '#ff4a4a' : k > 0.5 ? '#ffc04d' : '#5fdc8a'; g.fillRect(x0, y0, w0 * k, 18);
      g.fillStyle = '#8ff0ff'; g.fillRect(x0, y0 + 30, w0 * FS.prog, 12);
      g.fillStyle = '#fff'; g.font = '800 13px sans-serif'; g.textAlign = 'left'; g.fillText('糸の張り', x0, y0 - 6); g.fillText('釣り上げまで', x0, y0 + 60); g.textAlign = 'right'; g.fillText(FS.hold ? '巻いている…' : 'ゆるめている', x0 + w0, y0 - 6);
      if (FS.fight > 0) { g.textAlign = 'center'; g.fillStyle = '#ffe14a'; g.font = '900 20px sans-serif'; g.fillText('魚が暴れている！', W2 / 2, y0 - 30); }
    }
    if (FS.phase === 'wait') { g.fillStyle = 'rgba(255,255,255,0.8)'; g.font = '800 15px sans-serif'; g.textAlign = 'center'; g.fillText('……アタリを待っている（浮きが沈んだらタップ）', W2 / 2, H2 * 0.85); }
  }
  function fishBind() {
    $('fishBtn').addEventListener('click', fishOpen);
    $('fishGo').addEventListener('click', fishCast);
    $('fishQuit').addEventListener('click', fishClose);
    const cv = $('fishCv');
    cv.addEventListener('pointerdown', (ev) => { if (FS.phase === 'menu') return; ev.preventDefault(); fishDown(); });
    for (const k of ['pointerup', 'pointercancel', 'pointerleave']) cv.addEventListener(k, fishUp);
    document.addEventListener('keydown', (ev) => {
      if (!FS.on) return;
      ev.stopImmediatePropagation();
      if (ev.key === 'Escape') { if (FS.phase === 'menu') fishClose(); else fishMenu('釣りをやめた'); return; }
      if ((ev.key === ' ' || ev.key === 'Enter') && !ev.repeat && FS.phase !== 'menu') { ev.preventDefault(); fishDown(); }
    }, true);
    document.addEventListener('keyup', (ev) => { if (FS.on && (ev.key === ' ' || ev.key === 'Enter')) fishUp(); }, true);
  }
