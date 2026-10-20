
  /* ================= opening movie ================= */
  const OP_END = 70.5, OP_BEAT = 0.395;
  const OP_EN = '"Cinzel","Times New Roman",serif', OP_JP = '"Shippori Mincho","Noto Serif CJK JP","Hiragino Mincho ProN","Yu Mincho",serif';
  const OP = { on: false, ready: false, capturing: false, shots: {}, sd: 1, ev: [], evI: 0, t0: 0, audio: false, seek: null, raf: 0, onEnd: null, scratch: null, tapReady: false };
  const OP_SCENES = [['forest', 0, 0, 0.36], ['canyon', 1, 0, 0.62], ['grave', 2, 0, 0.9], ['ember', 3, 13, 0.36], ['frost', 3, 18, 0.36], ['sand', 3, 28, 0.36], ['blood', 3, 38, 0.36], ['void', 3, 43, 0.36], ['star', 3, 47, 0.36]];
  const op01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const opEase = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const opOut = (k) => 1 - Math.pow(1 - k, 3);
  const opHash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  /* ---------- scene capture (real game maps rendered once, then panned) ---------- */
  function opCapture(progress, done) {
    if (OP.ready) { done(); return; }
    if (OP.capturing) { OP.after = done; return; }
    OP.capturing = true;
    const keep = { map: curMap, floor: curFloor, pf: prog.floor, uz: userZoom, day: dayT, intro: $('intro').hidden };
    let i = 0;
    const step = () => {
      if (i >= OP_SCENES.length) {
        curFloor = keep.floor; prog.floor = keep.pf; dayT = keep.day; userZoom = keep.uz; applyZoom();
        enterMap(keep.map, null);
        $('banner').classList.remove('on');
        OP.ready = true; OP.capturing = false;
        done();
        if (OP.after) { const a = OP.after; OP.after = null; a(); }
        return;
      }
      const [name, id, f, day] = OP_SCENES[i++];
      try {
        if (id === 3) { curFloor = f; prepFloor(); }
        buildMap(id); rebuildBiome();
        enemies.length = 0; shots.length = 0; fx.length = 0; texts.length = 0; parts.length = 0; loot.length = 0; clearBossFx();
        player.x = 1.5; player.y = 1.5;
        for (let k = 0; k < 16; k++) spawnPack();
        let cx = CAMP.x + 4.5, cy = CAMP.y + 3.5;
        if (blockedAt(cx, cy, 0.3)) { const o = nearestOpen(Math.floor(cx), Math.floor(cy)); if (o) { cx = o[0] + 0.5; cy = o[1] + 0.5; } }
        player.x = cx; player.y = cy; player.dir = 6; player.form = i % 2 ? 'blade' : 'arcane'; cam.x = cx; cam.y = cy - 1;
        dayT = DAY_LEN * day; userZoom = 0.82; applyZoom();
        render();
        const sd = Math.min(1.25, window.devicePixelRatio || 1), w = Math.max(1, Math.round(cv.clientWidth * sd)), h = Math.max(1, Math.round(cv.clientHeight * sd));
        const c = mk(w, h);
        c.getContext('2d').drawImage(cv, 0, 0, w, h);
        OP.shots[name] = c; OP.sd = sd;
      } catch (e) { /* a missing shot just shows black */ }
      player.form = prog.form || 'blade';
      progress(i / OP_SCENES.length);
      setTimeout(step, 20);
    };
    step();
  }

  /* ---------- drawing helpers ---------- */
  function opText(g, s, x, y, size, font, fill, o) {
    o = o || {};
    g.save();
    g.font = (o.italic ? 'italic ' : '') + (o.weight || 700) + ' ' + size + 'px ' + font;
    g.textBaseline = 'middle';
    const sp = (o.sp || 0) * size, chars = [...s], ws = chars.map((c) => g.measureText(c).width), tw = ws.reduce((a, b) => a + b, 0) + sp * (chars.length - 1);
    let x0 = o.align === 'left' ? x : o.align === 'right' ? x - tw : x - tw / 2;
    if (o.alpha != null) g.globalAlpha = op01(o.alpha);
    const pass = (dx, col, comp) => { g.globalCompositeOperation = comp || 'source-over'; g.fillStyle = col; let cx = x0 + dx; chars.forEach((c, i) => { g.fillText(c, cx, y); cx += ws[i] + sp; }); };
    if (o.chroma) { pass(-o.chroma, 'rgba(255,40,80,0.8)', 'lighter'); pass(o.chroma, 'rgba(40,220,255,0.8)', 'lighter'); }
    if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = o.blur || size * 0.6; }
    pass(0, fill);
    g.restore();
    return tw;
  }
  function opSprite(g, key, an, dir, idx, x, y, h, o) {
    const E = FL[key];
    if (!E || !E.img) return;
    const A = E.anims[an] || E.anims.stance, fr = A.fr[dir][((idx | 0) % A.n + A.n) % A.n];
    const s = h / Math.max(1, A.fr[dir][0][3]);
    o = o || {};
    g.save();
    if (o.alpha != null) g.globalAlpha = op01(o.alpha);
    if (o.sil) {
      const w = Math.ceil(fr[2] * s) + 2, hh = Math.ceil(fr[3] * s) + 2;
      if (!OP.scratch || OP.scratch.width < w || OP.scratch.height < hh) OP.scratch = mk(Math.max(w, OP.scratch ? OP.scratch.width : 0), Math.max(hh, OP.scratch ? OP.scratch.height : 0));
      const sc = OP.scratch, sg = sc.getContext('2d');
      sg.clearRect(0, 0, sc.width, sc.height);
      sg.globalCompositeOperation = 'source-over';
      sg.drawImage(E.img, fr[0], fr[1], fr[2], fr[3], 0, 0, fr[2] * s, fr[3] * s);
      sg.globalCompositeOperation = 'source-in'; sg.fillStyle = o.sil; sg.fillRect(0, 0, w, hh);
      if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = o.blur || 30; }
      g.drawImage(sc, 0, 0, fr[2] * s, fr[3] * s, x - fr[4] * s, y - fr[5] * s, fr[2] * s, fr[3] * s);
      if (o.detail) { g.shadowBlur = 0; g.globalAlpha = op01(o.detail); g.drawImage(E.img, fr[0], fr[1], fr[2], fr[3], x - fr[4] * s, y - fr[5] * s, fr[2] * s, fr[3] * s); }
    } else {
      if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = o.blur || 30; }
      g.drawImage(E.img, fr[0], fr[1], fr[2], fr[3], x - fr[4] * s, y - fr[5] * s, fr[2] * s, fr[3] * s);
    }
    g.restore();
  }
  function opShot(g, name, k, z0, z1, px0, py0, px1, py1, W2, H2, grade) {
    const img = OP.shots[name];
    if (!img) { g.fillStyle = '#05050c'; g.fillRect(0, 0, W2, H2); return; }
    const iw = img.width / OP.sd, ih = img.height / OP.sd, base = Math.max(W2 / iw, H2 / ih), e = opEase(op01(k));
    const z = base * (z0 + (z1 - z0) * e), dw = iw * z, dh = ih * z;
    const cx = W2 / 2 - (px0 + (px1 - px0) * e) * dw * 0.5, cy = H2 / 2 - (py0 + (py1 - py0) * e) * dh * 0.5;
    g.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
    if (grade) { g.save(); g.globalCompositeOperation = 'overlay'; g.fillStyle = grade; g.fillRect(0, 0, W2, H2); g.restore(); }
  }
  function opVignette(g, W2, H2, a, col) {
    const r = Math.hypot(W2, H2) / 2, gr = g.createRadialGradient(W2 / 2, H2 / 2, r * 0.25, W2 / 2, H2 / 2, r);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, col || 'rgba(0,0,0,' + a + ')');
    g.fillStyle = gr; g.fillRect(0, 0, W2, H2);
  }
  function opBg(g, W2, H2, c1, c2, cx, cy) {
    const r = Math.hypot(W2, H2), gr = g.createRadialGradient(W2 * (cx == null ? 0.5 : cx), H2 * (cy == null ? 0.6 : cy), 0, W2 / 2, H2 / 2, r * 0.75);
    gr.addColorStop(0, c1); gr.addColorStop(1, c2);
    g.fillStyle = gr; g.fillRect(0, 0, W2, H2);
  }
  function opSlash(g, k, x0, y0, x1, y1, w, col) {
    if (k < 0 || k > 1) return;
    const a = 1 - k, hx = x0 + (x1 - x0) * Math.min(1, k * 3), hy = y0 + (y1 - y0) * Math.min(1, k * 3), tx = x0 + (x1 - x0) * Math.max(0, k * 3 - 1.2), ty = y0 + (y1 - y0) * Math.max(0, k * 3 - 1.2);
    const nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny) || 1;
    g.save(); g.globalCompositeOperation = 'lighter'; g.shadowColor = col; g.shadowBlur = 24;
    g.fillStyle = 'rgba(255,255,255,' + a + ')';
    g.beginPath(); g.moveTo(tx, ty); g.lineTo((tx + hx) / 2 + nx / nl * w, (ty + hy) / 2 + ny / nl * w); g.lineTo(hx, hy); g.lineTo((tx + hx) / 2 - nx / nl * w * 0.3, (ty + hy) / 2 - ny / nl * w * 0.3); g.closePath(); g.fill();
    g.restore();
  }
  function opBolt(g, k, x0, y0, x1, y1, seed, col) {
    if (k < 0 || k > 1) return;
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(230,240,255,' + (1 - k) + ')'; g.lineWidth = 3; g.shadowColor = col || '#9fd0ff'; g.shadowBlur = 22;
    g.beginPath(); g.moveTo(x0, y0);
    const n = 9;
    for (let i = 1; i < n; i++) { const u = i / n, j = (opHash(seed * 31 + i + Math.floor(k * 6)) - 0.5) * 60; g.lineTo(x0 + (x1 - x0) * u + j, y0 + (y1 - y0) * u + j * 0.4); }
    g.lineTo(x1, y1); g.stroke(); g.restore();
  }
  function opCircle(g, x, y, r, t, col, a) {
    g.save(); g.translate(x, y); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a; g.strokeStyle = col; g.shadowColor = col; g.shadowBlur = 18; g.lineWidth = 2;
    g.scale(1, 0.42);
    for (const [rr, sp] of [[r, 0.4], [r * 0.78, -0.6], [r * 0.5, 0.9]]) {
      g.save(); g.rotate(t * sp); g.beginPath(); g.arc(0, 0, rr, 0, TAU); g.stroke();
      for (let i = 0; i < 12; i++) { const a2 = i / 12 * TAU; g.beginPath(); g.moveTo(Math.cos(a2) * rr, Math.sin(a2) * rr); g.lineTo(Math.cos(a2) * (rr - 10), Math.sin(a2) * (rr - 10)); g.stroke(); }
      g.restore();
    }
    g.rotate(-t * 0.3); g.beginPath();
    for (let i = 0; i < 7; i++) { const a2 = i * TAU * 3 / 6; const px = Math.cos(a2) * r * 0.78, py = Math.sin(a2) * r * 0.78; if (i) g.lineTo(px, py); else g.moveTo(px, py); }
    g.stroke(); g.restore();
  }
  function opSpeed(g, W2, H2, t, a, col) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = col || 'rgba(255,255,255,0.5)'; g.globalAlpha = a; g.lineWidth = 1.5;
    const cx = W2 / 2, cy = H2 / 2, R = Math.hypot(W2, H2) / 2;
    for (let i = 0; i < 46; i++) { const an = opHash(i + Math.floor(t * 20) * 0.1) * TAU, r0 = R * (0.35 + opHash(i * 7 + Math.floor(t * 20)) * 0.4); g.beginPath(); g.moveTo(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0); g.lineTo(cx + Math.cos(an) * R * 1.1, cy + Math.sin(an) * R * 1.1); g.stroke(); }
    g.restore();
  }
  function opCaption(g, k, num, jp, W2, H2, u) {
    const a = op01(k * 4) * (1 - op01((k - 0.85) * 7)), x = W2 * 0.07 - (1 - opOut(op01(k * 3))) * 30, y = H2 * 0.8;
    g.save(); g.globalAlpha = a; g.fillStyle = '#d9b25a'; g.fillRect(x, y - 2.6 * u, Math.max(0, opOut(op01(k * 2.5)) * 22 * u), 1.2);
    g.restore();
    opText(g, num, x, y - 5.5 * u, 2.6 * u, OP_EN, '#d9b25a', { align: 'left', alpha: a, sp: 0.3 });
    opText(g, jp, x, y + 1.6 * u, 5 * u, OP_JP, '#f6efe0', { align: 'left', alpha: a, sp: 0.12, glow: 'rgba(0,0,0,0.8)', blur: 10 });
  }
  function opGlitch(g, cvs, W2, H2, amt, seed) {
    if (amt <= 0) return;
    const d = OP.dpr;
    for (let i = 0; i < 7; i++) {
      const y = opHash(seed + i) * H2, h = 6 + opHash(seed + i * 3) * 40, dx = (opHash(seed + i * 5) - 0.5) * 90 * amt;
      g.drawImage(cvs, 0, y * d, cvs.width, h * d, dx, y, W2, h);
    }
  }
  function opBigWord(g, t, at, s, jp, W2, H2, u, col) {
    const k = (t - at) / (OP_BEAT * 2);
    if (k < 0 || k > 1) return;
    const sc = 1 + (1 - opOut(op01(k * 4))) * 0.7, a = op01(k * 8) * (1 - op01((k - 0.8) * 5));
    g.save(); g.translate(W2 / 2, H2 * 0.48); g.scale(sc, sc);
    opText(g, s, 0, 0, Math.min(15 * u, W2 * 0.13), OP_EN, '#fff6dc', { alpha: a, chroma: 4 * (1 - op01(k * 3)) + 1, glow: col, sp: 0.06 });
    if (jp) opText(g, jp, 0, 10 * u, 4 * u, OP_JP, '#e8dcc0', { alpha: a * 0.9, sp: 0.4 });
    g.restore();
  }


  /* ---------- the song: lyrics & beat grid (YOU, THY ARIA opening theme) ---------- */
  const OP_BEATS = [0.49, 0.88, 1.3, 1.72, 2.11, 2.51, 2.9, 3.3, 3.69, 4.11, 4.5, 4.9, 5.27, 5.67, 6.08, 6.48, 6.9, 7.29, 7.69, 8.08, 8.48, 8.89, 9.29, 9.68, 10.08, 10.47, 10.89, 11.28, 11.68, 12.07, 12.47, 12.86, 13.21, 13.56, 13.91, 14.3, 14.7, 15.09, 15.49, 15.88, 16.3, 16.7, 17.09, 17.48, 17.9, 18.3, 18.69, 19.09, 19.48, 19.9, 20.29, 20.69, 21.11, 21.5, 21.9, 22.29, 22.71, 23.1, 23.5, 23.89, 24.29, 24.68, 25.08, 25.45, 25.8, 26.17, 26.54, 26.91, 27.31, 27.7, 28.1, 28.51, 28.91, 29.3, 29.7, 30.12, 30.51, 30.91, 31.3, 31.7, 32.09, 32.51, 32.9, 33.3, 33.69, 34.11, 34.5, 34.9, 35.29, 35.71, 36.11, 36.5, 36.9, 37.31, 37.71, 38.1, 38.5, 38.89, 39.29, 39.71, 40.1, 40.5, 40.89, 41.29, 41.68, 42.1, 42.49, 42.89, 43.28, 43.7, 44.12, 44.51, 44.91, 45.3, 45.7, 46.09, 46.49, 46.88, 47.3, 47.69, 48.09, 48.51, 48.9, 49.3, 49.69, 50.11, 50.5, 50.9, 51.29, 51.69, 52.08, 52.5, 52.9, 53.29, 53.71, 54.1, 54.5, 54.89, 55.31, 55.7, 56.1, 56.49, 56.89, 57.31, 57.7, 58.1, 58.49, 58.89, 59.28, 59.7, 60.09, 60.49, 60.88, 61.3, 61.7, 62.09, 62.48, 62.9, 63.3, 63.69, 64.09];
  const OP_LYR = [[0.2, 1.7, 'アリア…　遥かなる旋律よ', 1], [1.7, 3.2, '深淵の底で　呼ぶ声がする', 1], [3.2, 6.4, '名前を失くした　旅人が一人'], [6.4, 8.53, '目覚めた朝は　霧に包まれて'], [8.53, 10.67, '胸の奥にある　ふたつの魂'], [10.67, 12.8, '鋼の刃と　澄んだ旋律'], [12.8, 14.93, '斬るための剣　歌うための声'], [14.93, 17.07, '交差する光　闇を切り裂け'], [17.07, 19.2, '深淵の回廊　降りてゆくほどに'], [19.2, 20.8, '耳の奥で　歌は長くなる'], [20.8, 22.4, '五十の層を　越えたその先に'], [22.4, 24.0, '待っているのは　誰の面影か'], [24.0, 25.6, 'YOU, THY ARIA　あなたの歌が！'], [25.6, 29.26, '真実の　扉を開ける！'], [29.26, 32.91, '覚醒の光　ひとつに重なり！'], [32.91, 36.57, '失くした名前を　取り戻すため！'], [36.57, 40.23, '底で待つのは　遠い日の自分！'], [40.23, 43.89, '歌は還るよ　永遠の果てへ！'], [43.89, 47.54, 'ひろたゆうや　その名を呼ぶよ！'], [47.54, 51.2, '（ひろたゆうや…）', 1], [57.6, 64.0, '魂はひとつに　歌は響き続ける！']];
  function lastBeat(t) { let lo = 0, hi = OP_BEATS.length - 1, r = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (OP_BEATS[m] <= t) { r = m; lo = m + 1; } else hi = m - 1; } return r; }
  function beatK(t, dur) { const i = lastBeat(t); if (i < 0) return 0; const k = (t - OP_BEATS[i]) / (dur || 0.22); return k < 1 ? 1 - k : 0; }
  function hitK(t, at, dur) { const k = (t - at) / (dur || 0.25); return k >= 0 && k < 1 ? 1 - k : 0; }
  function opLoadSong() {
    if (OP.song || OP.songLoading || !window.__OPSONG) return;
    OP.songLoading = true;
    try {
      const bin = atob(window.__OPSONG), buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const c = new OAC(2, 44100, 44100), ok = (b) => { OP.song = b; }, ng = () => { OP.songFail = true; };
      const p = c.decodeAudioData(buf.buffer, ok, ng);
      if (p && p.then) p.then(ok).catch(ng);
    } catch (e) { OP.songFail = true; }
  }
  function opLyric(g, t, W2, H2, u) {
    for (const L of OP_LYR) {
      if (t < L[0] || t >= L[1]) continue;
      const k = (t - L[0]) / (L[1] - L[0]), a = op01((t - L[0]) / 0.25) * op01((L[1] - t) / 0.25), y = H2 * 0.855;
      const size = Math.min(4.2 * u, W2 * 0.046);
      g.save(); g.globalAlpha = a * 0.55; const gr = g.createLinearGradient(W2 * 0.1, 0, W2 * 0.9, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, y - size * 1.1, W2, size * 2.2); g.restore();
      const chars = [...L[2]], n = chars.length, shown = Math.min(n, Math.ceil(n * op01(k * 2.4)));
      opText(g, chars.slice(0, shown).join(''), W2 / 2, y, size, OP_JP, L[3] ? '#c9cfe6' : '#fff7e6', { alpha: a, sp: 0.1, glow: L[3] ? 'rgba(140,170,255,0.7)' : 'rgba(255,180,90,0.7)', blur: 12, italic: !!L[3] });
    }
  }
  function opOrbs(g, t, t0, t1, W2, H2) {
    const k = op01((t - t0) / (t1 - t0)), cx = W2 / 2, cy = H2 * 0.48, R = Math.min(W2, H2) * 0.26 * (1 - opEase(op01((k - 0.55) / 0.45)));
    for (const [ph, col, rim] of [[0, '255,170,70', '#ffb15a'], [Math.PI, '170,130,255', '#a37bff']]) {
      for (let tr = 0; tr < 14; tr++) {
        const a = t * 2.6 + ph - tr * 0.07, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R * 0.55;
        g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(' + col + ',' + (0.5 * (1 - tr / 14)) + ')'; g.shadowColor = rim; g.shadowBlur = 24;
        g.beginPath(); g.arc(x, y, (tr ? 6 : 14) * (1 - tr / 18), 0, TAU); g.fill(); g.restore();
      }
    }
    if (k > 0.85) { g.save(); g.globalCompositeOperation = 'lighter'; const r = (k - 0.85) / 0.15 * Math.max(W2, H2); const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, 'rgba(255,240,210,0.9)'); gr.addColorStop(1, 'rgba(255,240,210,0)'); g.fillStyle = gr; g.fillRect(0, 0, W2, H2); g.restore(); }
  }
  function opLogo(g, t, at, W2, H2, u, sub) {
    const lk = t - at, cx = W2 / 2, cy = H2 * 0.44;
    opBg(g, W2, H2, '#2a1a06', '#000', 0.5, 0.44);
    g.save(); g.translate(cx, cy); g.rotate(t * 0.08); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 18; i++) { g.rotate(TAU / 18); const gr = g.createLinearGradient(0, 0, Math.hypot(W2, H2) * 0.7, 0); gr.addColorStop(0, 'rgba(255,214,140,' + (0.16 * op01(lk * 2)) + ')'); gr.addColorStop(1, 'rgba(255,214,140,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.hypot(W2, H2) * 0.7, -24 - (i % 3) * 14); g.lineTo(Math.hypot(W2, H2) * 0.7, 24 + (i % 3) * 14); g.closePath(); g.fill(); }
    g.restore();
    const rr = Math.min(W2, H2) * opOut(op01(lk * 1.4)) * 1.1;
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,230,180,' + (1 - op01(lk * 1.4)) + ')'; g.lineWidth = 8 * (1 - op01(lk * 1.4)) + 1; g.beginPath(); g.ellipse(cx, cy, rr, rr * 0.36, 0, 0, TAU); g.stroke(); g.restore();
    for (let i = 0; i < 70; i++) { const an = opHash(i + 40) * TAU, sp2 = 80 + opHash(i + 41) * 420, r0 = sp2 * opOut(op01(lk * 0.8)); g.fillStyle = 'rgba(255,' + (190 + (i % 4) * 15) + ',110,' + (1 - op01(lk * 0.6)) + ')'; g.fillRect(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0 * 0.6, 2.5, 2.5); }
    const sp = 0.08 + 0.5 * (1 - opOut(op01(lk * 1.6))), sc = 1 + (1 - opOut(op01(lk * 4))) * 0.5;
    let size = Math.min(12 * u, W2 * 0.11);
    { g.save(); g.font = '700 ' + size + 'px ' + OP_EN; const tw = [...'YOU, THY ARIA'].reduce((a, c) => a + g.measureText(c).width, 0) + sp * size * 12; g.restore(); if (tw > W2 * 0.88) size *= W2 * 0.88 / tw; }
    g.save(); g.translate(cx, cy); g.scale(sc, sc);
    const gr = g.createLinearGradient(0, -size / 2, 0, size / 2); gr.addColorStop(0, '#fff6d0'); gr.addColorStop(0.55, '#e7b44a'); gr.addColorStop(1, '#9a6a10');
    opText(g, 'YOU, THY ARIA', 0, 0, size, OP_EN, gr, { sp, glow: 'rgba(255,190,80,0.8)', blur: 30, chroma: 3 * (1 - op01(lk * 3)) });
    g.restore();
    if (sub) {
      const sa = op01((lk - 0.8) * 1.5);
      g.save(); g.globalAlpha = sa; g.fillStyle = '#d9b25a'; g.fillRect(cx - W2 * 0.18 * sa, cy + size * 0.85, W2 * 0.36 * sa, 1); g.restore();
      opText(g, '― ふたつの魂の歌 ―', cx, cy + size * 1.35, 3.4 * u, OP_JP, '#efe2c4', { alpha: sa, sp: 0.4 });
    }
    return 1 - op01(lk / 0.7);
  }
  function opNameMorph(g, t, t0, W2, H2, u) {
    const cx = W2 / 2, cy = H2 * 0.44, k = t - t0;
    let size = Math.min(11 * u, W2 * 0.1);
    g.save(); g.font = '700 ' + size + 'px ' + OP_EN;
    const lay = (str, sp) => { const ws = [...str].map((c) => g.measureText(c).width), tw = ws.reduce((a, b) => a + b, 0) + sp * size * (ws.length - 1); let x = cx - tw / 2; return [...str].map((c, i) => { const r = { ch: c, x: x + ws[i] / 2 }; x += ws[i] + sp * size; return r; }); };
    const src = lay('YOU, THY ARIA', 0.08), dst = lay('HIROTA YUYA', 0.08);
    g.restore();
    const used = new Set(), moves = [];
    dst.forEach((d, di) => { if (d.ch === ' ') return; const si = src.findIndex((s, i) => s.ch === d.ch && !used.has(i)); used.add(si); moves.push([src[si], d, moves.length]); });
    const toJp = op01((k - 2.3) / 0.9);
    opBg(g, W2, H2, '#14102a', '#000', 0.5, 0.45);
    for (let i = 0; i < 60; i++) { const a = 0.3 + 0.4 * Math.sin(t * 2 + i); g.fillStyle = 'rgba(210,220,255,' + a * 0.6 + ')'; g.fillRect(opHash(i) * W2, opHash(i + 9) * H2, 1.5, 1.5); }
    if (toJp < 1) {
      src.forEach((s, i) => { if (!/[A-Z]/.test(s.ch)) opText(g, s.ch, s.x, cy, size, OP_EN, '#ffe9b0', { alpha: 1 - op01(k / 0.4) }); });
      for (const [s, d, j] of moves) {
        const mk2 = opEase(op01((k - 0.35 - j * 0.07) / 0.9)), lift = (j % 2 ? 1 : -1) * (30 + Math.abs(d.x - s.x) * 0.3) * Math.sin(mk2 * Math.PI);
        const x = s.x + (d.x - s.x) * mk2, y = cy + lift;
        g.save(); g.translate(x, y); g.rotate(mk2 * TAU * (j % 2 ? 1 : -1));
        opText(g, s.ch, 0, 0, size * (1 + Math.sin(mk2 * Math.PI) * 0.25), OP_EN, '#ffe9b0', { glow: 'rgba(255,190,80,0.85)', blur: 20, alpha: 1 - toJp });
        g.restore();
      }
    }
    if (toJp > 0) {
      for (let i = 0; i < 120; i++) { const a0 = opHash(i) * TAU, r0 = (1 - toJp) * 160 * opHash(i + 3); g.fillStyle = 'rgba(200,236,255,' + (1 - toJp) + ')'; g.fillRect(cx + Math.cos(a0) * r0 + (opHash(i + 7) - 0.5) * W2 * 0.6 * (1 - toJp), cy + Math.sin(a0) * r0 * 0.4, 2, 2); }
      opText(g, 'ひろたゆうや', cx, cy, Math.min(12 * u, W2 * 0.12), OP_JP, '#eaf6ff', { alpha: toJp, glow: 'rgba(150,210,255,0.9)', blur: 26, sp: 0.14 });
    }
  }

  /* ---------- the cut ---------- */
  function opDraw(t) {
    const cvs = $('opCv'), g = cvs.getContext('2d'), W2 = cvs.clientWidth, H2 = cvs.clientHeight, u = Math.min(W2, H2) / 100;
    g.setTransform(OP.dpr, 0, 0, OP.dpr, 0, 0);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.shadowBlur = 0;
    g.fillStyle = '#000'; g.fillRect(0, 0, W2, H2);
    let shake = 0, flashA = 0, glitch = 0, letter = 0;
    const seg = (a, b) => t >= a && t < b, kk = (a, b) => op01((t - a) / (b - a));
    if (t < 3.2) {
      for (let i = 0; i < 46; i++) { const sp = 12 + opHash(i + 5) * 30, x = opHash(i) * W2 + Math.sin(t * 0.6 + i) * 14, y = H2 - ((t * sp + opHash(i + 3) * H2) % (H2 + 30)); g.fillStyle = 'rgba(255,' + (140 + (i % 5) * 18) + ',60,' + (0.25 + opHash(i + 8) * 0.5) * op01(t / 1.5) + ')'; g.fillRect(x, y, 2, 2); }
      const gr = g.createRadialGradient(W2 / 2, H2 * 1.05, 0, W2 / 2, H2 * 1.05, H2 * 0.8); gr.addColorStop(0, 'rgba(255,190,110,' + (0.35 * op01(t / 3) + beatK(t, 0.4) * 0.12) + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W2, H2);
      opText(g, 'ARIA', W2 / 2, H2 * 0.42, Math.min(20 * u, W2 * 0.22), OP_EN, 'rgba(255,230,190,0.12)', { sp: 0.5, alpha: op01(t / 2) });
    } else if (t < 8.53) {
      letter = 1;
      const first = t < 6.4, k = first ? kk(3.2, 6.4) : kk(6.4, 8.53);
      opShot(g, first ? 'forest' : 'grave', k, first ? 1.3 : 1.25, first ? 1.08 : 1.1, first ? -0.08 : 0.08, first ? 0.06 : -0.04, first ? 0.06 : -0.04, first ? -0.04 : 0.04, W2, H2, first ? 'rgba(255,190,110,0.28)' : 'rgba(120,150,210,0.3)');
      if (!first) for (let i = 0; i < 6; i++) { const y = H2 * (0.2 + i * 0.13), x = ((t * 18 * (1 + i * 0.2) + i * 140) % (W2 + 400)) - 200; const fg = g.createRadialGradient(x, y, 0, x, y, 220); fg.addColorStop(0, 'rgba(220,230,255,0.22)'); fg.addColorStop(1, 'rgba(220,230,255,0)'); g.fillStyle = fg; g.fillRect(0, 0, W2, H2); }
      opVignette(g, W2, H2, 0.6);
      opCaption(g, k, first ? '— I —' : '— II —', first ? '始まりの森' : '霧の向こう', W2, H2 * 0.3, u);
      flashA = Math.max(hitK(t, 3.2, 0.3), hitK(t, 6.4, 0.25) * 0.7);
    } else if (t < 10.67) {
      opBg(g, W2, H2, '#120c22', '#000', 0.5, 0.5);
      opOrbs(g, t, 8.53, 10.67, W2, H2);
      opText(g, 'TWO SOULS, ONE HEART', W2 / 2, H2 * 0.24, 2.8 * u, OP_EN, '#d9b25a', { sp: 0.35, alpha: kk(8.7, 9.3) });
    } else if (t < 12.8) {
      const k = kk(10.67, 12.8);
      g.save(); g.beginPath(); g.moveTo(0, 0); g.lineTo(W2 * 0.62, 0); g.lineTo(W2 * 0.38, H2); g.lineTo(0, H2); g.closePath(); g.clip();
      opBg(g, W2, H2, '#7a3408', '#020206', 0.25, 0.6); opSprite(g, 'hero_blade', 'stance', 5, Math.floor(t * 8), W2 * 0.28, H2 * 0.82, H2 * 0.48 * (1 + k * 0.05), { sil: '#0a0608', glow: '#ff9a3a', blur: 36, detail: 0.4 }); g.restore();
      g.save(); g.beginPath(); g.moveTo(W2 * 0.62, 0); g.lineTo(W2, 0); g.lineTo(W2, H2); g.lineTo(W2 * 0.38, H2); g.closePath(); g.clip();
      opBg(g, W2, H2, '#40208c', '#020206', 0.75, 0.6); opSprite(g, 'hero_arcane', 'stance', 7, Math.floor(t * 8), W2 * 0.74, H2 * 0.82, H2 * 0.48 * (1 + k * 0.05), { sil: '#0a0608', glow: '#a37bff', blur: 36, detail: 0.4 }); g.restore();
      g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = 20; g.lineWidth = 3; g.beginPath(); g.moveTo(W2 * 0.62, 0); g.lineTo(W2 * 0.38, H2); g.stroke(); g.restore();
      opText(g, 'STEEL', W2 * 0.06, H2 * 0.18, 7 * u, OP_EN, '#ffd0a0', { align: 'left', alpha: kk(10.7, 11.1), glow: '#ff8a2a', sp: 0.1 });
      opText(g, 'MELODY', W2 * 0.94, H2 * 0.3, 7 * u, OP_EN, '#e0d0ff', { align: 'right', alpha: kk(11.7, 12.1), glow: '#8a5aff', sp: 0.1 });
      flashA = hitK(t, 10.67, 0.3);
    } else if (t < 14.93) {
      const blade = t < 13.87, k = blade ? kk(12.8, 13.87) : kk(13.87, 14.93);
      opBg(g, W2, H2, blade ? 'rgba(120,52,10,1)' : 'rgba(64,30,140,1)', '#020206', 0.75, 0.55);
      if (!blade) opCircle(g, W2 * 0.66, H2 * 0.78, Math.min(W2, H2) * 0.42, t, '#b38cff', 0.8);
      opSprite(g, blade ? 'hero_blade' : 'hero_arcane', 'stance', 6, Math.floor(t * 8), W2 * 0.66, H2 * 0.8, H2 * 0.5 * (1 + 0.07 * k), { sil: '#0a0608', glow: blade ? '#ff9a3a' : '#a37bff', blur: 40, detail: 0.45 });
      const x = W2 * 0.07;
      opText(g, blade ? '剣の魂' : '術の魂', x, H2 * 0.3, 3.4 * u, OP_JP, blade ? '#ffb15a' : '#c4a8ff', { align: 'left', alpha: op01(k * 5), sp: 0.6 });
      opText(g, 'ONE SOUL', x - (1 - opOut(op01(k * 3))) * 40, H2 * 0.37, Math.min(9.5 * u, W2 * 0.1), OP_EN, '#fff4dc', { align: 'left', alpha: op01(k * 5), glow: blade ? '#ff8a2a' : '#8a5aff', sp: 0.04 });
      opText(g, blade ? '— TO CUT.' : '— TO SING.', x + 2, H2 * 0.44, 5 * u, OP_EN, '#e0d4bc', { align: 'left', alpha: op01(k * 5 - 1), sp: 0.2 });
      const bi = lastBeat(t), bk = bi >= 0 ? (t - OP_BEATS[bi]) / 0.28 : 2;
      if (blade) opSlash(g, bk, W2 * opHash(bi) * 0.3, H2 * (0.15 + opHash(bi + 1) * 0.3), W2 * (0.7 + opHash(bi + 2) * 0.3), H2 * (0.55 + opHash(bi + 3) * 0.35), 9, '#ffb15a');
      else if (bi % 2 === 0) opBolt(g, bk, W2 * (0.3 + opHash(bi) * 0.5), 0, W2 * 0.7, H2 * 0.45, bi, '#b38cff');
      shake = beatK(t, 0.2) * 6; flashA = Math.max(hitK(t, 12.8, 0.25), hitK(t, 13.87, 0.3));
    } else if (t < 17.07) {
      const k = kk(14.93, 17.07);
      opBg(g, W2, H2, '#1a0c20', '#000', 0.5, 0.5);
      opSpeed(g, W2, H2, t, 0.4);
      opSprite(g, 'hero_blade', 'swing', 5, Math.floor(k * 16), W2 * 0.3, H2 * 0.8, H2 * 0.42, { sil: '#080406', glow: '#ff9a3a', blur: 40, detail: 0.35 });
      opSprite(g, 'hero_arcane', 'cast', 7, Math.floor(k * 16), W2 * 0.72, H2 * 0.8, H2 * 0.42, { sil: '#080406', glow: '#a37bff', blur: 40, detail: 0.35 });
      opSlash(g, kk(15.0, 15.45), 0, H2 * 0.1, W2, H2 * 0.75, 14, '#ffb15a');
      opBolt(g, kk(15.4, 15.9), W2, H2 * 0.1, 0, H2 * 0.75, 7, '#b38cff');
      const xk = kk(15.9, 16.3);
      if (xk > 0 && xk < 1) { g.save(); g.globalCompositeOperation = 'lighter'; const r = xk * Math.max(W2, H2); const gr = g.createRadialGradient(W2 / 2, H2 * 0.42, 0, W2 / 2, H2 * 0.42, r); gr.addColorStop(0, 'rgba(255,250,235,' + (1 - xk) + ')'); gr.addColorStop(1, 'rgba(255,250,235,0)'); g.fillStyle = gr; g.fillRect(0, 0, W2, H2); g.restore(); }
      const tk = kk(15.95, 16.3), sc = 1 + (1 - opOut(tk)) * 0.6;
      g.save(); g.translate(W2 / 2, H2 * 0.24); g.scale(sc, sc);
      opText(g, 'TWIN SOULS', 0, 0, Math.min(11 * u, W2 * 0.11), OP_EN, '#fff6dc', { chroma: 3, glow: '#ffffff', sp: 0.08, alpha: tk });
      g.restore();
      shake = Math.max(beatK(t, 0.2) * 5, hitK(t, 15.95, 0.4) * 14); flashA = hitK(t, 15.95, 0.3) * 0.8;
    } else if (t < 22.4) {
      letter = 1;
      if (t < 20.8) {
        const cuts = [['ember', 13, '灼熱の坑道', 'rgba(255,90,40,0.3)'], ['frost', 18, '氷晶の洞', 'rgba(90,170,255,0.3)'], ['sand', 28, '砂に沈んだ神殿', 'rgba(255,200,90,0.28)'], ['blood', 38, '血涙の回廊', 'rgba(220,30,60,0.3)'], ['void', 43, '虚無の淵', 'rgba(140,80,255,0.3)']];
        const ci = Math.min(cuts.length - 1, Math.floor((t - 17.07) / ((20.8 - 17.07) / cuts.length))), c = cuts[ci], k = ((t - 17.07) / ((20.8 - 17.07) / cuts.length)) - ci;
        opShot(g, c[0], k, 1.35, 1.12, (opHash(ci) - 0.5) * 0.2, (opHash(ci + 4) - 0.5) * 0.2, (opHash(ci + 9) - 0.5) * 0.2, (opHash(ci + 2) - 0.5) * 0.2, W2, H2, c[3]);
        opVignette(g, W2, H2, 0.65);
        opText(g, 'B' + c[1] + 'F', W2 * 0.07, H2 * 0.2, 9 * u, OP_EN, '#fff4dc', { align: 'left', alpha: op01(k * 6), glow: 'rgba(0,0,0,0.9)', blur: 12 });
        opText(g, c[2], W2 * 0.07, H2 * 0.27, 4.4 * u, OP_JP, '#f0e6d0', { align: 'left', alpha: op01(k * 6 - 0.5), sp: 0.15, glow: 'rgba(0,0,0,0.9)', blur: 10 });
        if (t >= 19.2) { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,214,140,0.8)'; g.shadowColor = '#ffb15a'; g.shadowBlur = 14; g.lineWidth = 2; g.beginPath(); const len = (t - 19.2) / 1.6; for (let x = 0; x <= W2 * len; x += 4) { const y = H2 * 0.5 + Math.sin(x * 0.05 + t * 8) * 20 * Math.sin(x / W2 * Math.PI) * (0.4 + beatK(t, 0.3)); if (x) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); g.restore(); }
        glitch = k < 0.16 ? 1 - k / 0.16 : 0;
      } else {
        const k2 = kk(20.8, 22.4);
        opShot(g, 'star', 1, 1.12, 1.12, 0, 0, 0, 0, W2, H2, 'rgba(60,60,160,0.35)');
        g.fillStyle = 'rgba(0,0,0,' + (0.4 + k2 * 0.45) + ')'; g.fillRect(0, 0, W2, H2);
        opText(g, 'B' + Math.min(50, Math.round(30 + 20 * opOut(op01(k2 * 1.4)))) + 'F', W2 / 2, H2 * 0.42, Math.min(16 * u, W2 * 0.18), OP_EN, '#fff6dc', { glow: '#7aa8ff', chroma: 2 });
        opText(g, '50 LAYERS OF ABYSS', W2 / 2, H2 * 0.53, Math.min(5 * u, W2 * 0.05), OP_EN, '#d9b25a', { alpha: op01(k2 * 3), sp: 0.25 });
      }
      flashA = Math.max(flashA, beatK(t, 0.12) * 0.25);
    } else if (t < 24.0) {
      const k = kk(22.4, 24.0);
      opBg(g, W2, H2, '#0c0a1c', '#000', 0.5, 0.2);
      const gr = g.createRadialGradient(W2 / 2, H2 * 0.4, 0, W2 / 2, H2 * 0.4, H2 * 0.5); gr.addColorStop(0, 'rgba(230,236,255,' + (0.35 + k * 0.3) + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W2, H2);
      opSprite(g, 'hero_blade', 'stance', 2, 0, W2 / 2, H2 * 0.86, H2 * 0.52 * (1 + k * 0.08), { sil: '#030306', glow: 'rgba(200,220,255,0.9)', blur: 26 });
      for (const ex of [-0.04, 0.04]) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,60,100,' + k + ')'; g.shadowColor = '#ff2050'; g.shadowBlur = 18; g.beginPath(); g.ellipse(W2 / 2 + ex * W2 * 2.5, H2 * 0.12, 6, 3, 0, 0, TAU); g.fill(); g.restore(); }
      opText(g, 'WHO AWAITS?', W2 / 2, H2 * 0.24, 3.2 * u, OP_EN, '#d9cfae', { sp: 0.5, alpha: kk(22.8, 23.3) * (1 - kk(23.7, 24)) });
    } else if (t < 25.6) {
      flashA = opLogo(g, t, 24.0, W2, H2, u, false);
      shake = Math.max((1 - kk(24, 24.6)) * 16, hitK(t, 25.05, 0.35) * 12); flashA = Math.max(flashA, hitK(t, 25.05, 0.25) * 0.6);
    } else if (t < 29.26) {
      const bosses = [[25.6, 26.52, 'skeleton', '骨の王', 'THE BONE KING', 1], [26.52, 27.43, 'goblin_elite', 'ゴブリンの大将', 'THE GOBLIN WARLORD', 1], [27.43, 28.35, 'fire_ant', '炎蟻の女王', 'THE FLAME QUEEN', 1.1], [28.35, 29.26, 'zombie', '朽ちた巨人', 'THE ROTTEN COLOSSUS', 1]];
      const bb = bosses.find((x) => t >= x[0] && t < x[1]) || bosses[3], k = kk(bb[0], bb[1]);
      opBg(g, W2, H2, '#5a0808', '#000', 0.5, 1.0);
      const zs = 1.12 - 0.12 * opOut(op01(k * 2));
      g.save(); g.translate(W2 / 2, H2 * 0.95); g.scale(zs, zs);
      opSprite(g, bb[2], 'stance', 6, Math.floor(t * 7), 0, 0, H2 * 0.62 * bb[5], { sil: '#100204', glow: '#ff2a2a', blur: 50, detail: 0.22 });
      g.restore();
      opText(g, bb[3], W2 / 2, H2 * 0.2, Math.min(10 * u, W2 * 0.1), OP_JP, '#ffe0d0', { glow: '#ff2a2a', blur: 30, sp: 0.12, chroma: 1.5, alpha: op01(k * 8) });
      opText(g, bb[4], W2 / 2, H2 * 0.27, 2.8 * u, OP_EN, '#d9b25a', { sp: 0.35, alpha: op01(k * 6 - 0.4) });
      const hit = hitK(t, bb[0], 0.3); flashA = hit * 0.6; shake = hit * 12;
    } else if (t < 32.91) {
      const k = kk(29.26, 32.91), blend = 0.5 + 0.5 * Math.sin(t * 5);
      opBg(g, W2, H2, '#4a3410', '#000', 0.5, 0.7);
      g.save(); g.translate(W2 / 2, H2 * 0.62); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 16; i++) { g.rotate(TAU / 16 + t * 0.02); g.fillStyle = 'rgba(255,214,120,' + (0.06 + 0.06 * k) + ')'; g.beginPath(); g.moveTo(0, 0); g.lineTo(H2, -30); g.lineTo(H2, 30); g.closePath(); g.fill(); }
      g.restore();
      opSprite(g, 'hero_blade', 'stance', 6, Math.floor(t * 8), W2 / 2, H2 * 0.86, H2 * 0.5, { sil: '#140a02', glow: '#ffd36e', blur: 50, detail: 0.5 * blend, alpha: 0.5 + 0.5 * blend });
      opSprite(g, 'hero_arcane', 'stance', 6, Math.floor(t * 8), W2 / 2, H2 * 0.86, H2 * 0.5, { sil: '#140a02', glow: '#ffd36e', blur: 50, detail: 0.5 * (1 - blend), alpha: 1 - 0.5 * blend });
      for (let i = 0; i < 60; i++) { const y = H2 - ((t * (40 + opHash(i) * 80) + opHash(i + 2) * H2) % H2); g.fillStyle = 'rgba(255,220,130,' + (0.3 + opHash(i + 5) * 0.6) + ')'; g.fillRect(W2 / 2 + (opHash(i + 1) - 0.5) * W2 * 0.7, y, 2, 3); }
      const tk = kk(29.4, 29.8), sc = 1 + (1 - opOut(tk)) * 0.5;
      g.save(); g.translate(W2 / 2, H2 * 0.2); g.scale(sc, sc);
      opText(g, '覚醒', 0, 0, Math.min(14 * u, W2 * 0.16), OP_JP, '#fff2c8', { glow: '#ffb000', blur: 34, alpha: tk, sp: 0.2 });
      opText(g, 'AWAKENING', 0, 9 * u, 2.8 * u, OP_EN, '#d9b25a', { alpha: tk, sp: 0.5 });
      g.restore();
      flashA = hitK(t, 29.26, 0.4) * 0.8; shake = beatK(t, 0.2) * 3;
    } else if (t < 40.23) {
      const blade = t < 36.57, k = blade ? kk(32.91, 36.57) : kk(36.57, 40.23);
      opShot(g, blade ? 'ember' : 'void', k, 1.2, 1.3, 0, 0, 0.05, -0.05, W2, H2, blade ? 'rgba(255,100,30,0.35)' : 'rgba(120,70,255,0.35)');
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 0, W2, H2);
      opSpeed(g, W2, H2, t, 0.35);
      const bi = Math.max(0, lastBeat(t)), bk = bi >= 0 ? (t - OP_BEATS[bi]) / OP_BEAT : 0;
      for (let e = 0; e < 4; e++) {
        const ang = e / 4 * TAU + 0.5, dist = Math.min(W2, H2) * (0.3 + opOut(op01(bk * 1.5)) * 0.12 * ((bi + e) % 2));
        opSprite(g, blade ? (e % 2 ? 'goblin' : 'skeleton') : (e % 2 ? 'fire_ant' : 'zombie'), 'stance', (e * 2 + 2) % 8, Math.floor(t * 8) + e, W2 / 2 + Math.cos(ang) * dist, H2 * 0.66 + Math.sin(ang) * dist * 0.45, H2 * 0.18, { sil: '#0c0306', glow: blade ? '#ff5a2a' : '#7a5aff', blur: 20 });
      }
      opSprite(g, blade ? 'hero_blade' : 'hero_arcane', blade ? 'swing' : 'cast', 6, Math.floor(bk * 8), W2 / 2, H2 * 0.72, H2 * 0.34, { glow: blade ? '#ffb15a' : '#c4a8ff', blur: 30 });
      if (blade) opSlash(g, bk / 0.8, W2 * (0.1 + opHash(bi) * 0.2), H2 * (0.3 + opHash(bi + 1) * 0.2), W2 * (0.8 + opHash(bi + 2) * 0.2), H2 * (0.6 + opHash(bi + 3) * 0.3), 12, '#ffb15a');
      else for (let e = 0; e < 3; e++) { const ang = (e + bi) / 3 * TAU; opBolt(g, bk, W2 / 2, H2 * 0.5, W2 / 2 + Math.cos(ang) * W2 * 0.35, H2 * 0.62 + Math.sin(ang) * H2 * 0.15, bi * 3 + e, '#b38cff'); }
      if (!blade) for (let m = 0; m < 3; m++) { const mt = (t - (38.2 + m * 0.4)) / 0.5; if (mt > 0 && mt < 1.6) { const ex = W2 * (0.25 + m * 0.25), ey = H2 * 0.7; if (mt < 1) { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = '#ffcf7a'; g.lineWidth = 4; g.shadowColor = '#ff8a2a'; g.shadowBlur = 20; g.beginPath(); g.moveTo(ex - 200 * (1 - mt) - 40, ey - H2 * (1 - mt)); g.lineTo(ex - 200 * (1 - mt), ey - H2 * (1 - mt) + 60); g.stroke(); g.restore(); } else { const r = (mt - 1) * 300; g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,160,60,' + (1.6 - mt) + ')'; g.beginPath(); g.ellipse(ex, ey, r, r * 0.45, 0, 0, TAU); g.fill(); g.restore(); shake = Math.max(shake, (1.6 - mt) * 10); } } }
      const dmg = ['8,214', '12,580', '9,903', '15,377', '11,042', '20,866', '13,519', '18,240'][bi % 8];
      opText(g, dmg, W2 * (0.3 + opHash(bi) * 0.4), H2 * (0.42 - opOut(op01(bk)) * 0.08), 5.8 * u * (1 + (1 - op01(bk * 4)) * 0.6), OP_EN, '#ffd36e', { alpha: 1 - op01((bk - 0.6) * 3), glow: '#ff6a00', blur: 16 });
      const wk = op01(k * 3);
      opText(g, blade ? '斬れ。' : '歌え。', W2 * 0.07, H2 * 0.16, Math.min(14 * u, W2 * 0.15), OP_JP, '#fff4e0', { align: 'left', alpha: wk, glow: blade ? '#ff6a1a' : '#8a4aff', blur: 26, chroma: 2 * (1 - wk) + 1 });
      opText(g, blade ? 'CUT THROUGH THE DARK' : 'SING THE ABYSS', W2 * 0.075, H2 * 0.23, 2.6 * u, OP_EN, '#d9b25a', { align: 'left', alpha: op01(wk * 2 - 0.6), sp: 0.3 });
      shake = Math.max(shake, beatK(t, 0.2) * 5); flashA = Math.max(hitK(t, 32.91, 0.3), hitK(t, 36.57, 0.3), beatK(t, 0.1) * 0.15);
    } else if (t < 43.89) {
      const span = (43.89 - 40.23) / 4, ci = Math.min(3, Math.floor((t - 40.23) / span)), k = (t - 40.23) / span - ci, sh = ['sand', 'frost', 'blood', 'star'][ci];
      opShot(g, sh, k, 1.15, 1.35, 0, 0, (opHash(ci) - 0.5) * 0.3, 0, W2, H2, null);
      opVignette(g, W2, H2, 0.7);
      if (ci === 0) { const n = Math.floor(18 + k * 110); opText(g, String(n), W2 * 0.92, H2 * 0.4, 16 * u, OP_EN, '#ffd36e', { align: 'right', glow: '#ff7a1a', blur: 24 }); opText(g, 'COMBO', W2 * 0.92, H2 * 0.48, 3.6 * u, OP_EN, '#fff', { align: 'right', sp: 0.4 }); }
      if (ci === 1) { const bx = W2 / 2, gr = g.createLinearGradient(0, 0, 0, H2 * 0.8); gr.addColorStop(0, 'rgba(255,122,42,0)'); gr.addColorStop(1, 'rgba(255,122,42,0.85)'); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; const bw = 26 + Math.sin(t * 12) * 4; g.fillRect(bx - bw / 2, 0, bw, H2 * 0.8); g.restore(); opText(g, 'LEGENDARY', bx, H2 * 0.7, 6 * u, OP_EN, '#ff9a3a', { glow: '#ff6a00', blur: 30, sp: 0.2, alpha: op01(k * 4) }); }
      if (ci === 2) { for (let i = 0; i < 9; i++) opText(g, String(1000 + Math.floor(opHash(i + 7) * 9000)), W2 * opHash(i), H2 * (0.2 + opHash(i + 3) * 0.5) - k * 40, (3 + opHash(i + 1) * 4) * u, OP_EN, i % 3 ? '#ffffff' : '#ffd36e', { glow: '#000', blur: 6, alpha: 1 - k }); }
      if (ci === 3) { const r = Math.min(W2, H2) * (0.1 + k * 0.5); g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,220,120,' + (1 - k) + ')'; g.lineWidth = 6; g.shadowColor = '#ffd36e'; g.shadowBlur = 30; g.beginPath(); g.ellipse(W2 / 2, H2 * 0.6, r, r * 0.4, 0, 0, TAU); g.stroke(); g.restore(); opText(g, 'LEVEL UP', W2 / 2, H2 * 0.4, 8 * u, OP_EN, '#ffe9a0', { glow: '#ffb000', blur: 30, sp: 0.15 }); }
      flashA = k < 0.12 ? (1 - k / 0.12) * 0.4 : 0; glitch = k < 0.1 ? 0.5 : 0; shake = beatK(t, 0.18) * 4;
    } else if (t < 47.54) {
      opNameMorph(g, t, 43.89, W2, H2, u);
      flashA = Math.max(hitK(t, 43.89, 0.35) * 0.7, hitK(t, 46.2, 0.4) * 0.5);
    } else if (t < 51.2) {
      const k = kk(47.54, 51.2), cx = W2 / 2, cy = H2 * 0.44;
      opBg(g, W2, H2, '#0e1430', '#000', 0.5, 0.45);
      for (let i = 0; i < 90; i++) { const y = cy - k * H2 * 0.5 * opHash(i + 4) - (t - 47.54) * 10 * opHash(i); g.fillStyle = 'rgba(200,236,255,' + (0.8 * k * (1 - op01(k * 1.2 - opHash(i)))) + ')'; g.fillRect(cx + (opHash(i) - 0.5) * W2 * 0.5 * (0.4 + k), y, 2, 2); }
      opText(g, 'ひろたゆうや', cx, cy, Math.min(12 * u, W2 * 0.12), OP_JP, '#eaf6ff', { alpha: 1 - op01((k - 0.4) / 0.6), glow: 'rgba(150,210,255,0.9)', blur: 26 + k * 30, sp: 0.14 + k * 0.3 });
    } else if (t < 57.6) {
      if (t < 53.0) {
        const k = kk(51.2, 53.0);
        opBg(g, W2, H2, '#3a0a5a', '#000', 0.5, 1.0);
        g.save(); g.translate(W2 / 2, H2 * 0.95); const zs = 1.15 - 0.15 * opOut(op01(k * 2)); g.scale(zs, zs);
        opSprite(g, 'skeleton', 'stance', 6, Math.floor(t * 7), 0, 0, H2 * 0.9, { sil: '#08020c', glow: '#9a4aff', blur: 50, detail: 0.12 });
        g.globalCompositeOperation = 'lighter'; for (const ex of [-0.035, 0.035]) { g.fillStyle = '#ff3a6a'; g.shadowColor = '#ff2050'; g.shadowBlur = 24; g.beginPath(); g.ellipse(ex * H2, -H2 * 0.7, 5, 3, 0, 0, TAU); g.fill(); }
        g.restore();
        opText(g, '深淵の主', W2 / 2, H2 * 0.2, Math.min(10 * u, W2 * 0.13), OP_JP, '#e8d0ff', { glow: '#8a3aff', blur: 30, sp: 0.12, chroma: 4, alpha: op01(k * 6) });
        opText(g, 'LORD OF THE ABYSS', W2 / 2, H2 * 0.27, 2.8 * u, OP_EN, '#d9b25a', { sp: 0.35, alpha: op01(k * 5 - 0.4) });
        glitch = hitK(t, 51.2, 0.5) + beatK(t, 0.12) * 0.3; flashA = hitK(t, 51.2, 0.3) * 0.7; shake = Math.max(hitK(t, 51.2, 0.5) * 18, beatK(t, 0.2) * 6);
      } else {
        const span = (57.6 - 53.0) / 4, wi = Math.min(3, Math.floor((t - 53.0) / span)), blade = wi % 2 === 0;
        opBg(g, W2, H2, blade ? '#5a2408' : '#2a1468', '#000', 0.5, 0.7);
        opSpeed(g, W2, H2, t, 0.5);
        if (wi === 1) for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = (t - (53 + span)) * 300; g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,170,60,0.8)'; g.shadowColor = '#ff7a1a'; g.shadowBlur = 16; g.beginPath(); g.arc(W2 / 2 + Math.cos(a) * r, H2 * 0.55 + Math.sin(a) * r * 0.5, 7, 0, TAU); g.fill(); g.restore(); }
        if (wi === 3) for (let i = 0; i < 8; i++) { const s0 = (t - (53 + span * 3) - i * 0.12) / 0.4; if (s0 > 0 && s0 < 1) { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,240,200,' + (1 - s0) + ')'; g.lineWidth = 3; g.beginPath(); const x = W2 * opHash(i + 30); g.moveTo(x - 80, 0); g.lineTo(x - 80 + 80 * s0, H2 * 0.7 * s0); g.stroke(); g.restore(); } }
        opSprite(g, blade ? 'hero_blade' : 'hero_arcane', 'stance', 6, Math.floor(t * 8), W2 / 2, H2 * 0.95, H2 * 0.62, { sil: '#060306', glow: blade ? '#ff9a3a' : '#a37bff', blur: 50, detail: 0.25, alpha: 0.85 });
        const words = [['50 LAYERS.', '五十の深層'], ['4 TYRANTS.', '四つの暴君'], ['2 SOULS.', 'ふたつの魂'], ['1 SONG.', 'ひとつの歌']];
        const wk = (t - (53 + span * wi)) / span, w = words[wi], sc = 1 + (1 - opOut(op01(wk * 4))) * 0.7, a = op01(wk * 8) * (1 - op01((wk - 0.85) * 7));
        g.save(); g.translate(W2 / 2, H2 * 0.4); g.scale(sc, sc);
        opText(g, w[0], 0, 0, Math.min(15 * u, W2 * 0.13), OP_EN, '#fff6dc', { alpha: a, chroma: 4 * (1 - op01(wk * 3)) + 1, glow: blade ? '#ff8a2a' : '#9a6aff', sp: 0.06 });
        opText(g, w[1], 0, 10 * u, 4 * u, OP_JP, '#e8dcc0', { alpha: a * 0.9, sp: 0.4 });
        g.restore();
        flashA = Math.max(hitK(t, 53 + span * wi, 0.2) * 0.5, beatK(t, 0.1) * 0.15); shake = Math.max(hitK(t, 53 + span * wi, 0.3) * 9, beatK(t, 0.2) * 5);
      }
    } else if (t < 59.2) {
      const k = kk(57.6, 59.2), cx = W2 / 2, cy = H2 * 0.44;
      opBg(g, W2, H2, '#1a1006', '#000', 0.5, 0.44);
      for (let i = 0; i < 160; i++) { const an = opHash(i) * TAU + k * 2, r0 = Math.hypot(W2, H2) * 0.6 * (1 - opEase(op01(k * 1.1 - opHash(i + 2) * 0.2))); g.fillStyle = 'rgba(255,220,150,' + (0.3 + 0.7 * k) + ')'; g.fillRect(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0 * 0.7, 2, 2); }
      g.fillStyle = 'rgba(255,250,235,' + Math.pow(op01((k - 0.7) / 0.3), 2) + ')'; g.fillRect(0, 0, W2, H2);
    } else {
      flashA = opLogo(g, t, 59.2, W2, H2, u, true);
      shake = (1 - kk(59.2, 59.8)) * 16;
      const big = hitK(t, 64.09, 0.6);
      if (big > 0) { flashA = Math.max(flashA, big * 0.55); shake = Math.max(shake, big * 14); const r = (1 - big) * Math.max(W2, H2); g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,230,180,' + big + ')'; g.lineWidth = 6; g.beginPath(); g.ellipse(W2 / 2, H2 * 0.44, r, r * 0.36, 0, 0, TAU); g.stroke(); g.restore(); }
      if (t < 64.5) shake = Math.max(shake, beatK(t, 0.18) * 3);
      if (t >= 65) opText(g, 'TAP TO START', W2 / 2, H2 * 0.82, 3 * u, OP_EN, '#f4ead2', { alpha: 0.35 + 0.65 * Math.abs(Math.sin((t - 65) * 2.2)), sp: 0.45 });
    }
    opLyric(g, t, W2, H2, u);
    if (glitch > 0) opGlitch(g, cvs, W2, H2, glitch, Math.floor(t * 30));
    if (letter) { g.fillStyle = '#000'; const lb = H2 * 0.1; g.fillRect(0, 0, W2, lb); g.fillRect(0, H2 - lb, W2, lb); opLyric(g, t, W2, H2, u); }
    g.save(); g.globalAlpha = 0.06; for (let i = 0; i < 70; i++) { g.fillStyle = i % 2 ? '#fff' : '#000'; g.fillRect(opHash(i + t * 60) * W2, opHash(i * 3 + t * 50) * H2, 1.5, 1.5); } g.restore();
    if (flashA > 0) { g.fillStyle = 'rgba(255,250,240,' + op01(flashA) + ')'; g.fillRect(0, 0, W2, H2); }
    $('opCv').style.transform = shake > 0.3 && !reduceMotion ? 'translate(' + ((opHash(t * 97) - 0.5) * shake * 2).toFixed(1) + 'px,' + ((opHash(t * 89) - 0.5) * shake * 2).toFixed(1) + 'px)' : '';
  }

  /* ---------- control ---------- */
  function opNow() {
    if (OP.seek != null) return OP.seek;
    if (OP.audio && AU.ctx) return AU.ctx.currentTime - OP.t0;
    return (performance.now() - OP.t0) / 1000;
  }
  function opLoop() {
    if (!OP.on) return;
    const cvs = $('opCv'), d = Math.min(1.25, window.devicePixelRatio || 1);
    if (cvs.width !== Math.round(cvs.clientWidth * d) || cvs.height !== Math.round(cvs.clientHeight * d)) { cvs.width = Math.round(cvs.clientWidth * d) || 1; cvs.height = Math.round(cvs.clientHeight * d) || 1; }
    OP.dpr = d;
    if (OP.audio && AU.ctx && AU.ctx.state !== 'running' && performance.now() - OP.started > 800) { OP.audio = false; OP.t0 = performance.now() - Math.max(0, (performance.now() - OP.started) - 250); }
    const t = opNow();
    try { opDraw(Math.max(0, t)); } catch (err) { /* keep running */ }
    if (t > OP_END + 6 && OP.seek == null) { opFinish(); return; }
    OP.raf = requestAnimationFrame(opLoop);
  }
  function startOP(onEnd) {
    OP.onEnd = onEnd || null;
    $('opSplash').hidden = true;
    const ov = $('opOv');
    ov.hidden = false; ov.classList.add('on');
    $('opSkip').hidden = false;
    paused = true; OP.on = true; OP.seek = null; OP.started = performance.now();
    AU.force = '';
    audioInit();
    OP.audio = !!(AU.ctx && OP.song);
    if (OP.audio) {
      if (!AU.opBus) { AU.opBus = AU.ctx.createGain(); AU.opBus.connect(AU.master); }
      const n = AU.ctx.currentTime;
      AU.opBus.gain.cancelScheduledValues(n);
      AU.opBus.gain.setValueAtTime(Math.min(1, opt().bgm * 1.5), n);
      try { if (OP.src) OP.src.stop(); } catch (e) { /* ignore */ }
      OP.src = AU.ctx.createBufferSource();
      OP.src.buffer = OP.song;
      OP.src.connect(AU.opBus);
      OP.t0 = n + 0.25;
      OP.src.start(OP.t0);
    } else OP.t0 = performance.now() + 250;
    cancelAnimationFrame(OP.raf);
    OP.raf = requestAnimationFrame(opLoop);
  }
  function opFinish() {
    if (!OP.on) return;
    OP.on = false;
    cancelAnimationFrame(OP.raf);
    if (AU.ctx && AU.opBus) { const n = AU.ctx.currentTime; AU.opBus.gain.cancelScheduledValues(n); AU.opBus.gain.setTargetAtTime(0.0001, n, 0.25); const s = OP.src; OP.src = null; if (s) setTimeout(() => { try { s.stop(); } catch (e) { /* ignore */ } }, 1500); }
    AU.force = null;
    const ov = $('opOv');
    ov.classList.remove('on');
    $('opCv').style.transform = '';
    setTimeout(() => { if (!OP.on) ov.hidden = true; }, 700);
    const cb = OP.onEnd; OP.onEnd = null;
    if (cb) cb();
  }
  function opTap() {
    if (!OP.on) return;
    if (opNow() >= 64) opFinish();
  }
  function afterOP() {
    if (prog.intro) { $('intro').hidden = true; paused = false; showBanner(MAPS[curMap].name, MAPS[curMap].rec); }
    else paused = true;
  }
  function opWhenSong(cb) {
    opLoadSong();
    const t0 = performance.now();
    const chk = () => { if (OP.song || OP.songFail || !window.__OPSONG || performance.now() - t0 > 8000) cb(); else setTimeout(chk, 100); };
    chk();
  }
  function opBoot() {
    const sp = $('opSplash');
    sp.hidden = false;
    $('opTap').hidden = true; $('opLoad').hidden = false;
    opLoadSong();
    opCapture((k) => { $('opBar').style.transform = 'scaleX(' + k * 0.9 + ')'; }, () => opWhenSong(() => {
      $('opBar').style.transform = 'scaleX(1)';
      $('opLoad').hidden = true; $('opTap').hidden = false; OP.tapReady = true;
    }));
  }
  function opSplashTap() {
    if (!OP.tapReady) return;
    OP.tapReady = false;
    startOP(afterOP);
  }
  function opWatch() {
    const go = () => startOP(() => { paused = !$('intro').hidden || !$('sheet').hidden; });
    if (OP.ready && (OP.song || OP.songFail)) go();
    else { $('opSplash').hidden = false; $('opTap').hidden = true; $('opLoad').hidden = false; opLoadSong(); opCapture((k) => { $('opBar').style.transform = 'scaleX(' + k + ')'; }, () => opWhenSong(() => { $('opSplash').hidden = true; go(); })); }
  }
