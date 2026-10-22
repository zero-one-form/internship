
  /* ================= ending: YOU, THY ARIA → hirota yuya → ひろたゆうや ================= */
  const TITLE = 'YOU, THY ARIA', NAME_UP = 'HIROTA YUYA', NAME_LO = 'hirota yuya', NAME_JP = 'ひろたゆうや';
  MOODS.ending = { bpm: 62, prog: [[60, MAJ], [55, MAJ], [57, MIN], [53, MAJ]], scale: [0, 2, 4, 7, 9], key: 60, pad: ['triangle', 1600, 0.04], arp: [0.55, 'sine', 0.035, 0, 24], mel: [0.45, 'sine', 0.05], bass: [1, 'sine', 0.08], drum: 0 };
  SFX.chime = (t) => { const m = AU.pm || 1; vc(t, 1047 * m, 1.4, 'sine', 0.07); vc(t, 2094 * m, 0.9, 'sine', 0.02); };
  SFX.reveal = (t) => { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => vc(t + i * 0.035, f, 3, 'triangle', 0.045)); vc(t, 131, 3, 'sine', 0.12); nz(t, 2.6, 0.05, 'highpass', 6000, 9000); };
  let END = null;
  function endWait(ms) { return new Promise((res) => { if (!END || END.skip) { res(); return; } const id = setTimeout(res, ms * END.rate); END.timers.push([id, res]); }); }
  function endSkip() {
    if (!END || END.skip) return;
    END.skip = true;
    for (const [id, res] of END.timers) { clearTimeout(id); res(); }
    END.timers.length = 0;
    endFinal();
  }
  function endLine(text, ms) {
    if (!END) return Promise.resolve();
    const el = $('endLine');
    el.textContent = text;
    el.classList.add('on');
    return endWait(ms).then(() => { el.classList.remove('on'); return endWait(1000); });
  }
  function layoutRow(str, cls) {
    const ov = $('ending'), m = document.createElement('div');
    m.className = 'emeasure ' + (cls || '');
    for (const ch of str) { const s = document.createElement('span'); s.textContent = ch; m.appendChild(s); }
    ov.appendChild(m);
    const ob = ov.getBoundingClientRect(), out = [...m.children].map((s) => { const r = s.getBoundingClientRect(); return { ch: s.textContent, x: r.left - ob.left, y: r.top - ob.top, w: r.width, h: r.height }; });
    m.remove();
    return out;
  }
  function anim(el, frames, opts) {
    if (!el.animate) { const last = frames[frames.length - 1]; for (const k in last) if (k !== 'offset' && k !== 'easing') el.style[k] = last[k]; return Promise.resolve(); }
    const o2 = Object.assign({ fill: 'forwards' }, opts);
    o2.duration = (o2.duration || 0) * END.rate; if (o2.delay) o2.delay *= END.rate;
    const a = el.animate(frames, o2);
    END.anims.push(a);
    return a.finished.catch(() => {});
  }
  function endStars() {
    const cv = $('endCv'), g = cv.getContext('2d');
    const fit = () => { const d = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(cv.clientWidth * d) || 1; cv.height = Math.round(cv.clientHeight * d) || 1; END.dpr = d; };
    fit();
    END.stars = Array.from({ length: 140 }, () => ({ x: Math.random(), y: Math.random(), s: Math.random() * 1.4 + 0.3, p: Math.random() * TAU, v: 0.003 + Math.random() * 0.01 }));
    END.parts = [];
    let last = 0;
    const loop = (ts) => {
      if (!END || END.closed) return;
      const dt = (last ? Math.min(0.25, (ts - last) / 1000) : 0.016) / END.rate;
      last = ts;
      if (cv.width !== Math.round(cv.clientWidth * END.dpr)) fit();
      const Wc = cv.width, Hc = cv.height;
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(2,2,8,0.35)';
      g.fillRect(0, 0, Wc, Hc);
      g.globalCompositeOperation = 'lighter';
      for (const s of END.stars) {
        s.y -= s.v * dt; if (s.y < 0) { s.y = 1; s.x = Math.random(); }
        const a = 0.35 + 0.35 * Math.sin(ts / 700 + s.p);
        g.fillStyle = 'rgba(210,220,255,' + a.toFixed(2) + ')';
        g.fillRect(s.x * Wc, s.y * Hc, s.s * END.dpr, s.s * END.dpr);
      }
      for (const p of END.parts) {
        p.t += dt;
        const k = clamp((p.t - p.d) / p.dur, 0, 1), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        const bx = p.sx + p.vx * Math.min(p.t, 0.6), by = p.sy + p.vy * Math.min(p.t, 0.6);
        const sw = Math.sin(k * Math.PI) * p.sw;
        p.x = bx + (p.tx - bx) * e - (p.ty - by) * sw * 0.002; p.y = by + (p.ty - by) * e + (p.tx - bx) * sw * 0.002;
        const al = p.fade ? Math.max(0, 1 - p.fade) : 1;
        if (al <= 0) continue;
        g.fillStyle = k < 1 ? 'rgba(255,214,140,' + (0.85 * al).toFixed(2) + ')' : 'rgba(200,236,255,' + (0.9 * al).toFixed(2) + ')';
        const r = (k < 1 ? 1.6 : 1.3) * END.dpr;
        g.fillRect(p.x * END.dpr - r / 2, p.y * END.dpr - r / 2, r, r);
        if (p.fadeOn) p.fade = (p.fade || 0) + dt * 0.8;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  function samplePoints(draw, step) {
    const ov = $('ending'), w = ov.clientWidth || 390, h = ov.clientHeight || 844;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    if (!g || !g.getImageData) return [];
    draw(g);
    let d;
    try { d = g.getImageData(0, 0, w, h).data; } catch (e) { return []; }
    const pts = [];
    for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) if (d[(y * w + x) * 4 + 3] > 120) pts.push([x + Math.random(), y + Math.random()]);
    return pts;
  }
  function endFinal() {
    const ov = $('ending');
    if (!ov) return;
    const t = $('endTitle'); t.textContent = '';
    $('endLine').classList.remove('on');
    for (const a of END.anims) { try { a.cancel(); } catch (e) { /* ignore */ } }
    for (const p of END.parts) p.fadeOn = true;
    $('endName').classList.add('on');
    $('endHero').classList.add('on');
    $('endMys').classList.add('on');
    $('endFin').classList.add('on');
    $('endBtn').hidden = false;
    $('endSkip').hidden = true;
  }
  async function playEnding(done) {
    END = { done, skip: false, timers: [], anims: [], closed: false, parts: [], rate: window.__endRate || 1 };
    const ov = $('ending');
    $('endTitle').textContent = '';
    for (const id of ['endName', 'endMys', 'endFin', 'endHero']) $(id).classList.remove('on');
    { const src = window.__HEROINE_ART && window.__HEROINE_ART.yuya_bust_normal, im = $('endHero'); if (src && !im.getAttribute('src')) im.src = src; }
    $('endBtn').hidden = true; $('endSkip').hidden = false;
    ov.hidden = false; paused = true;
    AU.force = 'ending';
    endStars();
    try { if (document.fonts && document.fonts.load) await Promise.race([Promise.all([document.fonts.load('700 40px "Cinzel"', TITLE), document.fonts.load('italic 600 40px "Cormorant Garamond"', NAME_LO), document.fonts.load('600 40px "Shippori Mincho"', NAME_JP)]), new Promise((r) => setTimeout(r, 1500))]); } catch (e) { /* ignore */ }
    await endWait(60);
    ov.classList.add('on');
    await endWait(1400);
    if (!END || END.skip) return;
    await endLine('深淵の主は、光の粒となって消えた。', 2600);
    if (!END || END.skip) return;
    await endLine('ふたつの魂は、ひとつの歌になる――', 2600);
    if (!END || END.skip) return;
    // 1) the title rises
    const box = $('endTitle'), src = layoutRow(TITLE, 'up');
    const spans = src.map((L, i) => {
      const s = document.createElement('span'); s.className = 'el up'; s.textContent = L.ch;
      s.style.left = L.x + 'px'; s.style.top = L.y + 'px';
      box.appendChild(s);
      anim(s, [{ opacity: 0, transform: 'translateY(26px)', filter: 'blur(10px)' }, { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' }], { duration: 1100, delay: 120 * i, easing: 'cubic-bezier(.2,.7,.2,1)' });
      return s;
    });
    await endWait(400); if (!END || END.skip) return; sfx('reveal');
    await endWait(1100 + 120 * src.length + 2600);
    if (!END || END.skip) return;
    // 2) punctuation fades, letters rearrange into the hidden name
    const tgt = layoutRow(NAME_UP, 'up'), used = new Set(), moves = [];
    spans.forEach((s, i) => { if (!/[A-Z]/.test(src[i].ch)) anim(s, [{ opacity: 1 }, { opacity: 0, transform: 'scale(.4)' }], { duration: 700, easing: 'ease-in' }); });
    await endWait(800);
    if (!END || END.skip) return;
    tgt.forEach((T, ti) => {
      if (T.ch === ' ') return;
      const si = src.findIndex((S, k) => S.ch === T.ch && !used.has(k));
      used.add(si);
      moves.push({ s: spans[si], from: src[si], to: T, ti });
    });
    moves.sort((a, b) => a.to.x - b.to.x);
    moves.forEach((m, k) => {
      const dx = m.to.x - m.from.x, dy = m.to.y - m.from.y, lift = (k % 2 ? 1 : -1) * (40 + Math.abs(dx) * 0.25);
      m.s.style.zIndex = String(10 + k);
      anim(m.s, [{ transform: 'translate(0,0) rotate(0deg)' }, { transform: 'translate(' + dx * 0.5 + 'px,' + (dy + lift) + 'px) rotate(' + (k % 2 ? 160 : -160) + 'deg) scale(1.25)', offset: 0.5 }, { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(360deg) scale(1)' }],
        { duration: 1700, delay: 90 * k, easing: 'cubic-bezier(.65,0,.35,1)' });
      setTimeout(() => { if (END && !END.skip) { AU.pm = 1 + k * 0.06; sfx('chime'); } }, (1700 + 90 * k) * END.rate);
      m.to.k = k;
    });
    await endWait(1700 + 90 * moves.length + 1500);
    if (!END || END.skip) return;
    // 3) the name flips into lowercase
    const lo = layoutRow(NAME_LO, 'lo');
    moves.forEach((m, k) => {
      setTimeout(() => {
        if (!END || END.skip) return;
        anim(m.s, [{ transform: 'translate(' + (m.to.x - m.from.x) + 'px,' + (m.to.y - m.from.y) + 'px) rotateX(0deg)' }, { transform: 'translate(' + (m.to.x - m.from.x) + 'px,' + (m.to.y - m.from.y) + 'px) rotateX(90deg)' }], { duration: 260, easing: 'ease-in' }).then(() => {
          if (!END || END.skip) return;
          const L = lo[m.ti];
          m.s.textContent = L.ch; m.s.className = 'el lo';
          anim(m.s, [{ transform: 'translate(' + (m.to.x - m.from.x) + 'px,' + (m.to.y - m.from.y) + 'px) rotateX(-90deg)' }, { transform: 'translate(' + (L.x - m.from.x) + 'px,' + (L.y - m.from.y) + 'px) rotateX(0deg)' }], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' });
          m.lo = L;
        });
      }, 110 * k * END.rate);
    });
    await endWait(110 * moves.length + 900);
    if (!END || END.skip) return;
    sfx('chime');
    await endWait(2400);
    if (!END || END.skip) return;
    // 4) the letters scatter into light and become ひろたゆうや
    const ob = $('ending').getBoundingClientRect(), fs = parseFloat(getComputedStyle(spans[0]).fontSize) || 40;
    const from = samplePoints((g) => {
      g.fillStyle = '#fff'; g.textBaseline = 'top'; g.font = 'italic 600 ' + fs * 1.15 + 'px "Cormorant Garamond", serif';
      for (const m of moves) { const r = m.s.getBoundingClientRect(); g.fillText(m.s.textContent, r.left - ob.left, r.top - ob.top); }
    }, 3);
    const ne = $('endName'), nr = ne.getBoundingClientRect(), nfs = parseFloat(getComputedStyle(ne).fontSize) || 48;
    const to = samplePoints((g) => { g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '600 ' + nfs + 'px "Shippori Mincho", "Noto Serif CJK JP", serif'; g.fillText(NAME_JP, (nr.left + nr.right) / 2 - ob.left, (nr.top + nr.bottom) / 2 - ob.top); }, 3);
    for (const m of moves) anim(m.s, [{ opacity: 1, filter: 'blur(0)' }, { opacity: 0, filter: 'blur(6px) brightness(3)' }], { duration: 450, easing: 'ease-out' });
    sfx('reveal');
    if (from.length && to.length) {
      from.sort((a, b) => a[0] - b[0]); to.sort((a, b) => a[0] - b[0]);
      const n = Math.min(1600, Math.max(from.length, to.length));
      for (let i = 0; i < n; i++) {
        const f = from[Math.floor(i / n * from.length)], t = to[Math.floor(i / n * to.length)], a = Math.random() * TAU, sp = 30 + Math.random() * 120;
        END.parts.push({ sx: f[0], sy: f[1], tx: t[0], ty: t[1], vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, d: 0.5 + Math.random() * 0.35, dur: 1.9 + Math.random() * 0.6, sw: (Math.random() - 0.5) * 2, x: f[0], y: f[1] });
      }
    }
    await endWait(2900);
    if (!END || END.skip) return;
    ne.classList.add('on');
    $('endHero').classList.add('on'); // the face behind the name: the traveller himself
    for (const p of END.parts) p.fadeOn = true;
    await endWait(2600);
    if (!END || END.skip) return;
    $('endMys').classList.add('on');
    await endWait(2800);
    if (!END || END.skip) return;
    $('endFin').classList.add('on');
    await endWait(1600);
    if (!END || END.skip) return;
    $('endBtn').hidden = false; $('endSkip').hidden = true;
  }
  function closeEnding() {
    if (!END) return;
    END.closed = true;
    const cb = END.done;
    END = null;
    AU.force = null; AU.pm = 1;
    const ov = $('ending');
    ov.classList.remove('on');
    setTimeout(() => { ov.hidden = true; }, 300);
    if (cb) cb(); else paused = false;
  }
