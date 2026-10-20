
  /* ================= ground chunks ================= */
  const CH = 8, NC = Math.ceil(MW / CH), WATER_D = 7, CLIFF_H = 92;
  const chunkCache = new Map();
  let chunkClock = 0;
  function chunkBounds(ci, cj) {
    const i0 = ci * CH, j0 = cj * CH, iE = Math.min(MW, i0 + CH), jE = Math.min(MH, j0 + CH);
    const front = iE >= MW || jE >= MH;
    const xu = (i0 - jE) * 32 - 12, yu = (i0 + j0) * 16 - 30;
    const wu = (iE - j0 - (i0 - jE)) * 32 + 24, hu = (iE + jE - i0 - j0) * 16 + 30 + (front ? CLIFF_H + 24 : 24);
    return { i0, j0, iE, jE, xu, yu, wu, hu };
  }
  function tuft(g, x, y, s, h, cols) {
    const n = 4 + Math.floor(h * 4);
    for (let k = 0; k < n; k++) {
      const a = (k / (n - 1) - 0.5) * 1.15 + (hash1(h * 100 + k) - 0.5) * 0.3;
      const L = (4 + hash1(h * 50 + k) * 5) * s, w = 0.95 * s, bx = x + (k - n / 2) * 0.7 * s;
      g.fillStyle = cols[Math.min(3, Math.floor(k / n * 2 + hash1(h * 70 + k) * 2.2))];
      g.beginPath(); g.moveTo(bx - w, y); g.quadraticCurveTo(bx + Math.sin(a) * L * 0.4, y - L * 0.6, bx + Math.sin(a) * L, y - Math.cos(a) * L); g.lineTo(bx + w, y); g.closePath(); g.fill();
    }
  }
  function flowerDecal(g, x, y, s, h, cols) {
    g.strokeStyle = '#3d7944'; g.lineWidth = 0.7 * s;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 4 * s); g.stroke();
    g.fillStyle = cols[Math.floor(h * cols.length) % cols.length];
    for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + h * 3; g.beginPath(); g.ellipse(x + Math.cos(a) * 1.5 * s, y - 4 * s + Math.sin(a) * 1.1 * s, 1.3 * s, 0.9 * s, a, 0, TAU); g.fill(); }
    g.fillStyle = '#f2a516'; g.beginPath(); g.arc(x, y - 4 * s, 0.8 * s, 0, TAU); g.fill();
  }
  function reedDecal(g, x, y, s, h) {
    const n = 3 + Math.floor(h * 4);
    for (let k = 0; k < n; k++) {
      const ox = (k - n / 2) * 2.2 * s + (hash1(h * 30 + k) - 0.5) * 2 * s, L = (9 + hash1(h * 40 + k) * 8) * s, bend = (hash1(h * 60 + k) - 0.5) * 4 * s;
      g.strokeStyle = k % 2 ? '#4f7a3a' : '#6b9446'; g.lineWidth = 0.9 * s;
      g.beginPath(); g.moveTo(x + ox, y); g.quadraticCurveTo(x + ox, y - L * 0.6, x + ox + bend, y - L); g.stroke();
      if (hash1(h * 80 + k) < 0.4) { g.fillStyle = '#7a5230'; g.beginPath(); g.ellipse(x + ox + bend * 0.85, y - L * 0.85, 1.1 * s, 2.6 * s, 0, 0, TAU); g.fill(); }
    }
  }
  function lilyDecal(g, x, y, s, flower) {
    g.save(); g.translate(x, y); g.scale(1, 0.5);
    g.fillStyle = '#4c9a50';
    g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 7 * s, 0.35, TAU - 0.12); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(200,240,160,0.5)'; g.lineWidth = 0.8 * s;
    g.beginPath(); g.arc(0, 0, 6 * s, 0.6, TAU - 0.4); g.stroke();
    g.restore();
    if (flower) {
      g.fillStyle = '#ffd1e6';
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; g.beginPath(); g.ellipse(x + Math.cos(a) * 2 * s, y - 2 * s + Math.sin(a) * s, 2 * s, 1.1 * s, a, 0, TAU); g.fill(); }
      g.fillStyle = '#ffe066'; g.beginPath(); g.arc(x, y - 2 * s, s, 0, TAU); g.fill();
    }
  }
  function waterBlobs(i, j, out) {
    out.push([i + 0.5 + (hash2(i, j, 140) - 0.5) * 0.1, j + 0.5 + (hash2(i, j, 141) - 0.5) * 0.1, 0.55 + hash2(i, j, 142) * 0.05]);
    if (tileAt(i + 1, j) === T_WATER) out.push([i + 1, j + 0.5, 0.5]);
    if (tileAt(i, j + 1) === T_WATER) out.push([i + 0.5, j + 1, 0.5]);
    if (tileAt(i + 1, j) === T_WATER && tileAt(i, j + 1) === T_WATER && tileAt(i + 1, j + 1) === T_WATER) out.push([i + 1, j + 1, 0.56]);
    return out;
  }
  const PROP_SHADOW = { crystal: [0.45, 0.3], spire: [0.8, 0.42], tomb: [0.4, 0.36], lamp: [0.22, 0.3], portal: [0.9, 0.28], tree: [1.05, 0.42], bush: [0.55, 0.34], rock: [0.55, 0.38], tent: [1.25, 0.38], crate: [0.5, 0.38], barrel: [0.4, 0.36], banner: [0.28, 0.3], bench: [0.7, 0.32] };
  function buildChunk(ci, cj) {
    const B = chunkBounds(ci, cj), s = SG;
    const BIc = BIOMES[MAPS[curMap].biome];
    const cw = Math.ceil(B.wu * s), chh = Math.ceil(B.hu * s);
    const c = mk(cw, chh), g = c.getContext('2d');
    const X = (x, y) => ((x - y) * 32 - B.xu) * s;
    const Y = (x, y) => ((x + y) * 16 - B.yu) * s;
    const dia = (i, j, e) => { g.moveTo(X(i, j), Y(i, j) - e); g.lineTo(X(i + 1, j) + 2 * e, Y(i + 1, j)); g.lineTo(X(i + 1, j + 1), Y(i + 1, j + 1) + e); g.lineTo(X(i, j + 1) - 2 * e, Y(i, j + 1)); g.closePath(); };
    const fillPat = (name) => { g.save(); g.translate(-B.xu * s, -B.yu * s); g.fillStyle = g.createPattern(TEX[name], 'repeat'); g.fill(); g.restore(); };
    const softBlob = (x, y, rw, stops) => {
      const rx = rw * 45.25 * s;
      g.save(); g.translate(X(x, y), Y(x, y)); g.scale(1, 0.5);
      g.fillStyle = rad(g, 0, 0, rx, stops);
      g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill();
      g.restore();
    };
    g.save();
    g.beginPath();
    g.moveTo(X(B.i0, B.j0), Y(B.i0, B.j0) - 1); g.lineTo(X(B.iE, B.j0) + 2, Y(B.iE, B.j0)); g.lineTo(X(B.iE, B.jE), Y(B.iE, B.jE) + 1); g.lineTo(X(B.i0, B.jE) - 2, Y(B.i0, B.jE)); g.closePath();
    g.clip();
    g.beginPath(); g.rect(0, 0, cw, chh); fillPat('grass');
    for (let j = B.j0 - 3; j < B.jE + 3; j++) {
      for (let i = B.i0 - 3; i < B.iE + 3; i++) {
        if (!inB(i, j) || hash2(i, j, 3) > 0.38) continue;
        const dark = hash2(i, j, 4) < 0.55;
        softBlob(i + 0.5, j + 0.5, 1.1 + hash2(i, j, 5) * 1.3, dark ? [[0, 'rgba(8,36,22,0.22)'], [1, 'rgba(8,36,22,0)']] : [[0, 'rgba(186,214,112,0.14)'], [1, 'rgba(186,214,112,0)']]);
      }
    }
    for (const kind of [T_PATH, T_CAMP]) {
      const bl = [];
      for (let j = B.j0 - 2; j < B.jE + 2; j++) {
        for (let i = B.i0 - 2; i < B.iE + 2; i++) {
          if (tileAt(i, j) !== kind) continue;
          for (let n = 0; n < 3; n++) bl.push([i + 0.5 + (hash2(i, j, 10 + n) - 0.5) * 0.36, j + 0.5 + (hash2(i, j, 20 + n) - 0.5) * 0.36, (kind === T_CAMP ? 0.64 : 0.5) + hash2(i, j, 30 + n) * 0.16]);
        }
      }
      if (!bl.length) continue;
      g.beginPath();
      for (const b of bl) { const rx = b[2] * 1.2 * 45.25 * s; g.moveTo(X(b[0], b[1]) + rx, Y(b[0], b[1])); g.ellipse(X(b[0], b[1]), Y(b[0], b[1]), rx, rx / 2, 0, 0, TAU); }
      g.fillStyle = 'rgba(48,36,20,0.3)'; g.fill();
      g.beginPath();
      for (const b of bl) { const rx = b[2] * 45.25 * s; g.moveTo(X(b[0], b[1]) + rx, Y(b[0], b[1])); g.ellipse(X(b[0], b[1]), Y(b[0], b[1]), rx, rx / 2, 0, 0, TAU); }
      fillPat(kind === T_CAMP ? 'camp' : 'dirt');
    }
    for (let j = B.j0; j < B.jE; j++) {
      for (let i = B.i0; i < B.iE; i++) {
        const t = tile[idx(i, j)];
        if (t !== T_PATH && t !== T_CAMP) continue;
        const n = 2 + Math.floor(hash2(i, j, 33) * 4);
        for (let k = 0; k < n; k++) {
          const px = X(i + 0.15 + hash2(i, j, 34 + k) * 0.7, j + 0.15 + hash2(i, j, 44 + k) * 0.7), py = Y(i + 0.15 + hash2(i, j, 34 + k) * 0.7, j + 0.15 + hash2(i, j, 44 + k) * 0.7);
          const r = (0.9 + hash2(i, j, 54 + k) * 1.4) * s;
          g.fillStyle = 'rgba(40,28,16,0.35)'; g.beginPath(); g.ellipse(px + 0.4 * s, py + 0.5 * s, r * 1.3, r * 0.8, 0, 0, TAU); g.fill();
          g.fillStyle = hash2(i, j, 64 + k) < 0.5 ? '#b5a183' : '#8c7a64'; g.beginPath(); g.ellipse(px, py, r * 1.2, r * 0.75, 0, 0, TAU); g.fill();
          g.fillStyle = 'rgba(255,248,230,0.5)'; g.beginPath(); g.arc(px - r * 0.4, py - r * 0.25, r * 0.35, 0, TAU); g.fill();
        }
      }
    }
    const pitT = [];
    for (let j = B.j0 - 1; j < B.jE + 1; j++) for (let i = B.i0 - 1; i < B.iE + 1; i++) if (tileAt(i, j) === T_PIT) pitT.push([i, j]);
    if (pitT.length) {
      g.save();
      g.beginPath(); for (const p of pitT) dia(p[0], p[1], 0.8); g.fillStyle = '#05040a'; g.fill();
      g.clip();
      const Dp = 30 * s, top = (BIc.tuft && BIc.tuft[2]) || '#4c4868';
      for (const p of pitT) {
        const i = p[0], j = p[1];
        for (const e of [[tileAt(i, j - 1), X(i, j), Y(i, j), X(i + 1, j), Y(i + 1, j)], [tileAt(i - 1, j), X(i, j), Y(i, j), X(i, j + 1), Y(i, j + 1)]]) {
          if (e[0] === T_PIT || e[0] === -1) continue;
          const gr = g.createLinearGradient(0, Math.min(e[2], e[4]), 0, Math.max(e[2], e[4]) + Dp);
          gr.addColorStop(0, top); gr.addColorStop(0.25, 'rgba(30,26,40,1)'); gr.addColorStop(1, 'rgba(5,4,10,1)');
          g.fillStyle = gr;
          g.beginPath(); g.moveTo(e[1], e[2]); g.lineTo(e[3], e[4]); g.lineTo(e[3], e[4] + Dp); g.lineTo(e[1], e[2] + Dp); g.closePath(); g.fill();
          g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 1.2 * s; g.beginPath(); g.moveTo(e[1], e[2]); g.lineTo(e[3], e[4]); g.stroke();
        }
        if (hash2(i, j, 71) < 0.07) { const cx = X(i + 0.5, j + 0.5), cy = Y(i + 0.5, j + 0.5) + 10 * s, rr = 60 * s; g.fillStyle = rad(g, cx, cy, rr, [[0, rgba(BIc.water, 0.22)], [1, rgba(BIc.water, 0)]]); g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); }
      }
      g.restore();
    }
    const wt = [];
    for (let j = B.j0 - 1; j < B.jE + 1; j++) for (let i = B.i0 - 1; i < B.iE + 1; i++) if (tileAt(i, j) === T_WATER) wt.push([i, j]);
    if (wt.length) {
      const wb = [];
      for (let j = B.j0 - 2; j < B.jE + 2; j++) for (let i = B.i0 - 2; i < B.iE + 2; i++) if (tileAt(i, j) === T_WATER) waterBlobs(i, j, wb);
      const hole = (dy) => { g.beginPath(); for (const b of wb) { const rx = b[2] * 45.25 * s, cx = X(b[0], b[1]), cy = Y(b[0], b[1]) + dy; g.moveTo(cx + rx, cy); g.ellipse(cx, cy, rx, rx / 2, 0, 0, TAU); } };
      hole(-1.5 * s); g.fillStyle = 'rgba(222,232,168,0.7)'; g.fill();
      hole(0); g.fillStyle = '#5c4632'; g.fill();
      hole(WATER_D * 0.45 * s); g.fillStyle = '#2e2116'; g.fill();
      g.save();
      hole(0); g.clip();
      hole(WATER_D * s); g.fillStyle = 'rgba(230,248,255,0.5)'; g.fill();
      hole((WATER_D + 1.6) * s); g.fillStyle = BIc.water; g.fill();
      g.translate(0, WATER_D * s);
      for (const w of wt) { const d = wdepth[idx(w[0], w[1])]; if (d < 2) continue; softBlob(w[0] + 0.5, w[1] + 0.5, d >= 3 ? 1.6 : 1.2, [[0, d >= 3 ? 'rgba(10,34,70,0.5)' : 'rgba(14,44,78,0.38)'], [1, 'rgba(12,38,72,0)']]); }
      for (const w of wt) {
        const i = w[0], j = w[1], d = wdepth[idx(i, j)];
        if (d > 2 || hash2(i, j, 40) > 0.24) continue;
        const px = i + 0.3 + hash2(i, j, 41) * 0.4, py = j + 0.3 + hash2(i, j, 42) * 0.4;
        lilyDecal(g, X(px, py), Y(px, py), s, hash2(i, j, 43) < 0.35);
      }
      g.restore();
    }
    for (const p of props) {
      if (p.x < B.i0 - 3 || p.x > B.iE + 3 || p.y < B.j0 - 3 || p.y > B.jE + 3) continue;
      const sh = PROP_SHADOW[p.kind];
      if (!sh) continue;
      const rw = sh[0] * (p.s || 1) * (p.kind === 'tree' && p.v >= 3 ? 0.8 : 1);
      softBlob(p.x + 0.34, p.y + 0.06, rw, [[0, 'rgba(4,16,12,' + sh[1] + ')'], [0.6, 'rgba(4,16,12,' + (sh[1] * 0.5).toFixed(3) + ')'], [1, 'rgba(4,16,12,0)']]);
    }
    if (inB(Math.floor(CAMP.x), Math.floor(CAMP.y)) && CAMP.x >= B.i0 - 4 && CAMP.x <= B.iE + 4 && CAMP.y >= B.j0 - 4 && CAMP.y <= B.jE + 4) {
      softBlob(CAMP.x, CAMP.y, 0.9, [[0, 'rgba(20,12,8,0.5)'], [1, 'rgba(20,12,8,0)']]);
    }
    g.restore();
    for (let j = B.j0; j < B.jE; j++) {
      for (let i = B.i0; i < B.iE; i++) {
        if (tile[idx(i, j)] !== T_GRASS) continue;
        const nT = Math.floor(hash2(i, j, 50) * (BIc.tuftN + 1));
        for (let n = 0; n < nT; n++) { const u = i + 0.15 + hash2(i, j, 51 + n) * 0.7, v = j + 0.15 + hash2(i, j, 61 + n) * 0.7; tuft(g, X(u, v), Y(u, v), s, hash2(i, j, 71 + n), BIc.tuft); }
        if (hash2(i, j, 80) < BIc.flowers) {
          const nf = 1 + Math.floor(hash2(i, j, 81) * 3);
          for (let n = 0; n < nf; n++) { const u = i + 0.2 + hash2(i, j, 82 + n) * 0.6, v = j + 0.2 + hash2(i, j, 86 + n) * 0.6; flowerDecal(g, X(u, v), Y(u, v), s, hash2(i, j, 90 + n), BIc.flowerCols); }
        }
        if (BIc.reeds && (tileAt(i + 1, j) === T_WATER || tileAt(i, j + 1) === T_WATER || tileAt(i - 1, j) === T_WATER || tileAt(i, j - 1) === T_WATER) && hash2(i, j, 97) < 0.75) reedDecal(g, X(i + 0.5, j + 0.5), Y(i + 0.5, j + 0.5), s, hash2(i, j, 98));
      }
    }
    const cliff = (x0, y0, x1, y1, dark, sd) => {
      const Hc = CLIFF_H * s;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x1, y1 + Hc); g.lineTo(x0, y0 + Hc); g.closePath();
      fillPat('rock');
      g.save(); g.clip();
      const top = Math.min(y0, y1), bot = Math.max(y0, y1) + Hc, lx = Math.min(x0, x1) - 2, wx = Math.abs(x1 - x0) + 4;
      g.fillStyle = lin(g, 0, top, 0, bot, [[0, dark ? 'rgba(10,12,30,0.4)' : 'rgba(255,240,220,0.06)'], [0.5, dark ? 'rgba(10,12,30,0.5)' : 'rgba(10,12,30,0.22)'], [1, 'rgba(10,12,30,0.65)']]);
      g.fillRect(lx, top - 2, wx, bot - top + 4);
      g.strokeStyle = 'rgba(16,16,30,0.4)'; g.lineWidth = s;
      for (let k = 1; k < 6; k++) { const off = k * 15 * s + (hash1(sd * 7 + k) - 0.5) * 4 * s; g.beginPath(); g.moveTo(x0, y0 + off); g.lineTo(x1, y1 + off + (hash1(sd * 9 + k) - 0.5) * 3 * s); g.stroke(); }
      g.strokeStyle = 'rgba(8,8,18,0.45)';
      for (let k = 0; k < 2; k++) { const t = hash1(sd * 13 + k), cx = x0 + (x1 - x0) * t, cy = y0 + (y1 - y0) * t; g.beginPath(); g.moveTo(cx, cy + 6 * s); g.lineTo(cx + 2 * s, cy + 20 * s); g.lineTo(cx - s, cy + 34 * s); g.stroke(); }
      g.globalCompositeOperation = 'destination-out';
      g.fillStyle = lin(g, 0, Math.max(y0, y1) + Hc * 0.3, 0, bot, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,1)']]);
      g.fillRect(lx, top - 2, wx, bot - top + 4);
      g.restore();
      g.fillStyle = '#3d7944';
      g.beginPath(); g.moveTo(x0, y0 - s); g.lineTo(x1, y1 - s);
      const n = 8;
      for (let k = n; k >= 0; k--) { const t = k / n; g.lineTo(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + (2 + hash1(sd * 17 + k) * 5) * s * (k % 2 ? 1 : 0.45)); }
      g.closePath(); g.fill();
    };
    if (B.jE === MH) for (let i = B.i0; i < B.iE; i++) cliff(X(i, MH), Y(i, MH), X(i + 1, MH), Y(i + 1, MH), false, i);
    if (B.iE === MW) for (let j = B.j0; j < B.jE; j++) cliff(X(MW, j + 1), Y(MW, j + 1), X(MW, j), Y(MW, j), true, j + 100);
    return { c, B, used: 0 };
  }

  /* ================= rendering ================= */
  const cv = $('cv');
  const ctx = cv.getContext('2d');
  let W = 1, H = 1, DPR = 1, zoom = 1, HW = 32, HH = 16, ox = 0, oy = 0;
  let lightCv = null, lctx = null, LW = 0, LH = 0, starCv = null, vigCv = null, dprCap = 2;
  let env = { amb: [255, 255, 255], dark: 0, sky: ['#8fb5d8', '#d8e8f0'] };
  const lights = [], emis = [], drawList = [];
  function resize() {
    const r = $('game').getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    DPR = opt().lite ? 1 : Math.min(dprCap, window.devicePixelRatio || 1);
    if (cv.width === Math.round(W * DPR) && cv.height === Math.round(H * DPR) && starCv && starCv.width === Math.ceil(W) && starCv.height === Math.ceil(H)) return;
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    applyZoom();
    ensureAssets();
    starCv = mk(Math.ceil(W), Math.ceil(H));
    const sg = starCv.getContext('2d'), R = seeded(99);
    for (let k = 0; k < 150; k++) { sg.fillStyle = 'rgba(255,255,255,' + (0.3 + R() * 0.7).toFixed(2) + ')'; sg.beginPath(); sg.arc(R() * W, R() * H, R() < 0.9 ? 0.7 : 1.3, 0, TAU); sg.fill(); }
    if (typeof drawPortrait === 'function') drawPortrait();
  }
  function computeOrigin() {
    ox = W / 2 - (cam.x - cam.y) * HW;
    oy = H * 0.56 - (cam.x + cam.y) * HH;
  }
  const isoX = (x, y) => (x - y) * HW + ox;
  const isoY = (x, y) => (x + y) * HH + oy;
  function toWorld(px, py) {
    const a = (px - ox) / HW, b = (py - oy) / HH;
    return [(a + b) / 2, (b - a) / 2];
  }
  function drawSpr(sp, x, y, flip, alpha, scale) {
    const z = zoom * (scale || 1);
    const a = alpha == null ? 1 : alpha;
    if (a !== 1) ctx.globalAlpha = a;
    if (flip) { ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1); ctx.drawImage(sp.img, -sp.ax * z, -sp.ay * z, sp.w * z, sp.h * z); ctx.restore(); }
    else ctx.drawImage(sp.img, x - sp.ax * z, y - sp.ay * z, sp.w * z, sp.h * z);
    if (a !== 1) ctx.globalAlpha = 1;
  }
  function drawGroundRing(sp, x, y, rWorld, rot, alpha) {
    const spriteR = sp.w / 2 - 2;
    const k = rWorld * 45.25 * zoom / spriteR;
    ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.5); ctx.rotate(rot || 0);
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.drawImage(sp.img, -sp.ax * k, -sp.ay * k, sp.w * k, sp.h * k);
    ctx.restore();
  }

  const ENV_KEYS = [
    [0.00, [255, 252, 246], 0.0, '#8fb5d8', '#dceaf1'],
    [0.30, [255, 249, 238], 0.0, '#8fb5d8', '#dceaf1'],
    [0.38, [255, 224, 192], 0.14, '#7f8fc6', '#f2c8a6'],
    [0.46, [216, 160, 170], 0.48, '#3c3f78', '#d98b7c'],
    [0.54, [100, 116, 176], 1.0, '#0b1030', '#24305f'],
    [0.82, [100, 116, 176], 1.0, '#0b1030', '#24305f'],
    [0.90, [204, 178, 198], 0.45, '#4a4f88', '#e0a59a'],
    [0.96, [255, 246, 236], 0.05, '#8fb5d8', '#e6eef2'],
    [1.00, [255, 252, 246], 0.0, '#8fb5d8', '#dceaf1']
  ];
  function envAt(ph) {
    let k = 0;
    while (k < ENV_KEYS.length - 2 && ENV_KEYS[k + 1][0] < ph) k++;
    const A = ENV_KEYS[k], B = ENV_KEYS[k + 1], t = clamp((ph - A[0]) / Math.max(1e-6, B[0] - A[0]), 0, 1);
    return { amb: [A[1][0] + (B[1][0] - A[1][0]) * t, A[1][1] + (B[1][1] - A[1][1]) * t, A[1][2] + (B[1][2] - A[1][2]) * t], dark: A[2] + (B[2] - A[2]) * t, sky: [mix(A[3], B[3], t), mix(A[4], B[4], t)] };
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    const bsk = BIOMES[MAPS[curMap].biome].sky;
    g.addColorStop(0, bsk ? bsk[0] : env.sky[0]); g.addColorStop(1, bsk ? bsk[1] : env.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (envDark > 0.3 && starCv) { ctx.globalAlpha = (envDark - 0.3) / 0.7; ctx.drawImage(starCv, 0, 0, W, H); ctx.globalAlpha = 1; }
  }
  function drawChunks() {
    const vis = [];
    for (let cj = 0; cj < NC; cj++) {
      for (let ci = 0; ci < NC; ci++) {
        const B = chunkBounds(ci, cj);
        const x = B.xu * zoom + ox, y = B.yu * zoom + oy, w = B.wu * zoom, h = B.hu * zoom;
        if (x > W || y > H || x + w < 0 || y + h < 0) continue;
        vis.push([ci, cj, x, y, w, h]);
      }
    }
    vis.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
    let built = 0;
    chunkClock++;
    for (const v of vis) {
      const key = v[0] * 64 + v[1];
      let ch = chunkCache.get(key);
      if (!ch) { ch = buildChunk(v[0], v[1]); chunkCache.set(key, ch); built++; }
      ch.used = chunkClock;
      ctx.drawImage(ch.c, v[2], v[3], v[4], v[5]);
    }
    const cap = Math.max(24, vis.length + 10);
    if (!built && chunkCache.size < cap) {
      for (let cj = 0; cj < NC && !built; cj++) {
        for (let ci = 0; ci < NC && !built; ci++) {
          const key = ci * 64 + cj;
          if (chunkCache.has(key)) continue;
          const B = chunkBounds(ci, cj);
          const x = B.xu * zoom + ox, y = B.yu * zoom + oy, w = B.wu * zoom, h = B.hu * zoom;
          if (x > W + 320 || y > H + 320 || x + w < -320 || y + h < -320) continue;
          const ch = buildChunk(ci, cj); ch.used = chunkClock - 1; chunkCache.set(key, ch); built++;
        }
      }
    }
    if (chunkCache.size > cap) {
      const arr = [...chunkCache.entries()].sort((a, b) => a[1].used - b[1].used);
      for (let k = 0; k < arr.length - cap; k++) if (arr[k][1].used < chunkClock) chunkCache.delete(arr[k][0]);
    }
  }
  function drawWaterAnim() {
    const vis = [];
    for (const k of waterList) {
      const i = k % MW, j = (k / MW) | 0, x0 = isoX(i, j), y0 = isoY(i, j);
      if (x0 < -HW * 2 || x0 > W + HW * 2 || y0 < -HH * 3 || y0 > H + HH) continue;
      vis.push(i, j);
    }
    if (!vis.length) return;
    const wd = WATER_D * zoom;
    ctx.save();
    ctx.beginPath();
    const wbs = [];
    for (let n = 0; n < vis.length; n += 2) waterBlobs(vis[n], vis[n + 1], wbs);
    for (const b of wbs) { const rx = b[2] * 45.25 * zoom, cx = isoX(b[0], b[1]), cy = isoY(b[0], b[1]) + wd; ctx.moveTo(cx + rx, cy); ctx.ellipse(cx, cy, rx, rx / 2, 0, 0, TAU); }
    ctx.clip();
    ctx.lineCap = 'round';
    const day = 1 - envDark * 0.6;
    for (let n = 0; n < vis.length; n += 2) {
      const i = vis[n], j = vis[n + 1];
      for (let q = 0; q < 2; q++) {
        const h = hash2(i, j, q + 5), u = ((time * (0.05 + h * 0.06) + h) % 1);
        const cx = i + 0.1 + u * 0.8, cy = j + 0.2 + hash2(i, j, q + 9) * 0.6;
        const x0 = isoX(cx, cy), y0 = isoY(cx, cy) + wd;
        const a = (0.1 + 0.12 * Math.sin(time * 1.8 + h * 20)) * day * Math.sin(u * Math.PI);
        if (a <= 0.01) continue;
        ctx.strokeStyle = 'rgba(210,244,255,' + a.toFixed(3) + ')';
        ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(x0 - 7 * zoom, y0 - 3.5 * zoom); ctx.lineTo(x0 + 7 * zoom, y0 + 3.5 * zoom); ctx.stroke();
      }
      if (envDark < 0.5 && hash2(i, j, Math.floor(time * 1.5)) < 0.06) {
        const gx = isoX(i + 0.5, j + 0.5), gy = isoY(i + 0.5, j + 0.5) + wd;
        const tw = 0.5 + 0.5 * Math.sin(time * 9 + i), r = 3 * zoom * tw;
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.7 * tw).toFixed(3) + ')'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(gx - r, gy); ctx.lineTo(gx + r, gy); ctx.moveTo(gx, gy - r * 0.6); ctx.lineTo(gx, gy + r * 0.6); ctx.stroke();
      }
    }
    ctx.restore();
  }
  function drawGroundFx() {
    const cx0 = isoX(CAMP.x, CAMP.y), cy0 = isoY(CAMP.x, CAMP.y);
    const crx = CAMP.r * HW * Math.SQRT2;
    if (cx0 > -crx - 40 && cx0 < W + crx + 40 && cy0 > -crx && cy0 < H + crx) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,228,184,0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5 * zoom, 7 * zoom]);
      ctx.lineDashOffset = -time * 6;
      ctx.beginPath(); ctx.ellipse(cx0, cy0, crx, crx / 2, 0, 0, TAU); ctx.stroke();
      ctx.restore();
    }
  }
  function heroAnim() {
    const key = 'hero_' + player.form;
    if (player.dead) { const A = flAnim(key, 'die'); return [key, 'die', A ? Math.min(A.n - 1, Math.floor(player.deadT / 0.8 * A.n)) : 0]; }
    if (player.swingT > 0) { const an = player.form === 'blade' ? 'swing' : 'cast'; const A = flAnim(key, an); return [key, an, A ? Math.floor((1 - player.swingT / player.swingDur) * A.n) : 0]; }
    if (player.hurtT > 0 && !player.moving) { const A = flAnim(key, 'hit'); return [key, 'hit', A ? Math.floor((1 - player.hurtT / 0.22) * A.n) : 0]; }
    if (player.moving) return [key, 'run', Math.floor(player.walkPhase * 8) % 8];
    const A = flAnim(key, 'stance');
    return [key, 'stance', A ? animIndex(A, player.anim) : 0];
  }
  function enemyKey(e) {
    if (e.type === 'goblin') return e.elite ? 'goblin_elite' : 'goblin';
    if (e.type === 'ant') return 'fire_ant';
    return e.cv ? 'zombie' : 'skeleton';
  }
  function enemyAnim(e) {
    const key = enemyKey(e);
    let an = 'stance', k = 0;
    if (e.dead) { an = 'die'; const A = flAnim(key, an); k = A ? Math.floor((1 - e.deathT / DIE_T) / 0.65 * A.n) : 0; }
    else if (e.lunge > 0) { an = 'swing'; const A = flAnim(key, an); k = A ? Math.floor((1 - e.lunge / LUNGE) * A.n) : 0; }
    else if (e.hitT > 0) { an = 'hit'; k = e.hitT > 0.06 ? 0 : 1; }
    else if (e.moving) { an = 'run'; const A = flAnim(key, an); k = A ? animIndex(A, e.anim * (e.type === 'ant' ? 1.4 : 1)) : 0; }
    else { const A = flAnim(key, an); k = A ? animIndex(A, e.anim) : 0; }
    return [key, an, k];
  }
  function drawFlames(x0, y0) {
    const z = zoom;
    const f1 = Math.sin(time * 13) * 0.08 + Math.sin(time * 7.7) * 0.06, f2 = Math.sin(time * 9.1 + 1) * 0.1;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const flame = (x, y, w, h, lean, c0, c1) => {
      const g = ctx.createLinearGradient(x, y, x, y - h);
      g.addColorStop(0, c0); g.addColorStop(1, c1);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x - w, y);
      ctx.bezierCurveTo(x - w, y - h * 0.45, x - w * 0.25 + lean, y - h * 0.75, x + lean, y - h);
      ctx.bezierCurveTo(x + w * 0.25 + lean, y - h * 0.75, x + w, y - h * 0.45, x + w, y);
      ctx.quadraticCurveTo(x, y + w * 0.4, x - w, y);
      ctx.closePath(); ctx.fill();
    };
    flame(x0 - 3 * z, y0 - 3 * z, 6 * z, 20 * z * (1 + f2), -2 * z, 'rgba(255,80,30,0.85)', 'rgba(255,60,20,0)');
    flame(x0 + 3 * z, y0 - 3 * z, 6 * z, 18 * z * (1 - f2), 2 * z, 'rgba(255,100,40,0.85)', 'rgba(255,60,20,0)');
    flame(x0, y0 - 2 * z, 8 * z, 28 * z * (1 + f1), f2 * 4 * z, 'rgba(255,150,50,0.9)', 'rgba(255,90,30,0)');
    flame(x0, y0 - 2 * z, 5 * z, 19 * z * (1 - f1 * 0.6), f2 * 2 * z, 'rgba(255,232,140,0.95)', 'rgba(255,180,80,0)');
    flame(x0, y0 - 2 * z, 2.6 * z, 10 * z, 0, 'rgba(255,255,236,1)', 'rgba(255,240,180,0)');
    ctx.restore();
    emis.push(['warm', x0, y0 - 12 * z, 46 * z, 0.5 + f1]);
  }
  function drawBannerCloth(x0, y0) {
    const z = zoom, t = time;
    const top = y0 - 74 * z, left = x0 + 2 * z, wd = 16 * z, len = 36 * z;
    const pts = [];
    for (let k = 0; k <= 6; k++) pts.push([left + wd + Math.sin(t * 3 + k * 0.8) * 2.6 * z * k / 6, top + len * k / 6]);
    const back = [];
    for (let k = 6; k >= 0; k--) back.push([left + Math.sin(t * 3 + k * 0.8 - 0.6) * 2.6 * z * k / 6, top + len * k / 6]);
    const g = ctx.createLinearGradient(left, top, left + wd, top + len);
    g.addColorStop(0, '#46a39a'); g.addColorStop(1, '#1d5458');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(left, top);
    for (const p of pts) ctx.lineTo(p[0], p[1]);
    ctx.lineTo(left + wd / 2 + Math.sin(t * 3 + 5) * 2.6 * z, top + len + 7 * z);
    for (const p of back) ctx.lineTo(p[0], p[1]);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 1.2 * z; ctx.stroke();
    const ex = left + wd / 2 + Math.sin(t * 3 + 3) * 1.3 * z, ey = top + len * 0.45;
    ctx.lineWidth = 1.5 * z;
    ctx.beginPath(); ctx.arc(ex - 2.5 * z, ey, 3.7 * z, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(ex + 2.5 * z, ey, 3.7 * z, 0, TAU); ctx.stroke();
  }
  function drawProp(p) {
    const x0 = isoX(p.x, p.y), y0 = isoY(p.x, p.y);
    switch (p.kind) {
      case 'tree': case 'spire': {
        const sp = p.kind === 'tree' ? SPR.trees[p.v] : SPR.spires[p.v];
        const z = zoom * p.s;
        const covers = (wx, wy, h) => {
          if (p.depth <= wx + wy) return false;
          const tx = isoX(wx, wy), ty = isoY(wx, wy) - h * zoom;
          return Math.abs(tx - x0) < 48 * z && ty < y0 - 18 * z && ty > y0 - 132 * z;
        };
        const tg = player.target;
        const near = (!player.dead && covers(player.x, player.y, 30)) || (tg && !tg.dead && covers(tg.x, tg.y, bodyH(tg)));
        const sway = p.kind === 'spire' ? 0 : Math.sin(time * 1.3 + p.ph) * 0.028 + Math.sin(time * 2.3 + p.ph * 2) * 0.01;
        ctx.save();
        ctx.translate(x0, y0);
        ctx.transform(1, 0, sway, 1, 0, 0);
        if (near) ctx.globalAlpha = 0.42;
        ctx.drawImage(sp.img, -sp.ax * z, -sp.ay * z, sp.w * z, sp.h * z);
        ctx.restore();
        break;
      }
      case 'bush': drawSpr(SPR.bushes[p.v], x0, y0, false, 1, p.s); break;
      case 'rock': drawSpr(SPR.rocks[p.v], x0, y0, false, 1, p.s); break;
      case 'tent': drawSpr(SPR.tent, x0, y0, false, 1, 1); break;
      case 'crate': drawSpr(SPR.crate, x0, y0, false, 1, 1); break;
      case 'barrel': drawSpr(SPR.barrel, x0, y0, false, 1, 1); break;
      case 'bench': drawSpr(SPR.bench, x0, y0, false, 1, 1); break;
      case 'banner': drawSpr(SPR.pole, x0, y0, false, 1, 1); drawBannerCloth(x0, y0); break;
      case 'fire': drawSpr(SPR.fireBase, x0, y0, false, 1, 1); drawFlames(x0, y0); break;
      case 'tomb': drawSpr(SPR.tombs[p.v], x0, y0, false, 1, p.s); break;
      case 'lamp': drawSpr(SPR.lamp, x0, y0, false, 1, 1); emis.push(['warm', x0, y0 - 72 * zoom, 22 * zoom, 0.7 + 0.1 * Math.sin(time * 7 + p.ph)]); break;
      case 'portal': drawSpr(SPR.portal, x0, y0, false, 1, 1); break;
      case 'npc': drawNpc(p, x0, y0); break;
      case 'crystal': drawSpr(SPR.crystals[p.v], x0, y0, false, 1, p.s); emis.push([p.v ? 'cyan' : 'violet', x0, y0 - 22 * zoom * p.s, 34 * zoom * p.s, 0.45 + 0.12 * Math.sin(time * 2 + p.ph)]); break;
    }
  }
  function drawEnemy(e) {
    const x0 = isoX(e.x, e.y), y0 = isoY(e.x, e.y);
    if (e.obj) { drawObj(e, x0, y0); return; }
    if (x0 < -90 || x0 > W + 90 || y0 < -20 || y0 > H + 110) return;
    const ea = enemyAnim(e);
    const sc = (EN_SCALE[ea[0]] || 0.8) * (e.final ? 2.6 : e.boss ? 1.75 : e.elite && e.type !== 'goblin' ? 1.18 : 1);
    const a = e.dead ? clamp(e.deathT / 0.3, 0, 1) : 1, sq = e.hitT > 0 && !e.dead ? 1 + e.hitT * 0.8 : 1;
    drawFlare(ea[0], ea[1], e.dir, ea[2], x0, y0, sc * sq, a);
    if (e.hitT > 0 && !e.dead) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      drawFlare(ea[0], ea[1], e.dir, ea[2], x0, y0, sc * sq, Math.min(1, 0.35 + e.hitT * 5));
      ctx.restore();
    }
    if (!e.dead) {
      elemDraw(e, x0, y0);
      if (e.aff || e.treasure || e.shieldT > 0) affixDraw(e, x0, y0);
      if (e.elite) emis.push(['gold', x0, y0 - bodyH(e) * zoom, 44 * zoom, 0.3 + Math.sin(time * 4 + e.anim) * 0.1]);
      if (e.type === 'ant' && envDark > 0.2) emis.push(['warm', x0, y0 - 14 * zoom, 30 * zoom, envDark * 0.3]);
    }
  }
  function drawHero() {
    const x0 = isoX(player.x, player.y), yb = isoY(player.x, player.y), rh = rideHeight(), y0 = yb - rh;
    if (rh) drawMount(x0, yb);
    const ha = rh && !player.swingT ? ['hero_' + player.form, 'stance', 0] : heroAnim();
    if (!player.dead) {
      const rc = player.form === 'blade' ? '255,196,90' : '176,146,255', pul = 0.5 + Math.sin(time * 3) * 0.12;
      ctx.save(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(' + rc + ',' + pul + ')';
      ctx.beginPath(); ctx.ellipse(x0, yb, 21 * zoom, 10.5 * zoom, 0, 0, TAU); ctx.stroke(); ctx.restore();
      emis.push([player.form === 'blade' ? 'amber' : 'violet', x0, yb, 30 * zoom, 0.28]);
    }
    drawFlare(ha[0], ha[1], player.dir, ha[2], x0, y0, HERO_SCALE, 1);
    if (player.form === 'arcane' && !player.dead) {
      for (let k = 0; k < 2; k++) {
        const a = time * 2.2 + k * Math.PI;
        const cx = x0 + Math.cos(a) * 22 * zoom, cy = y0 - 50 * zoom + Math.sin(a) * 7 * zoom + Math.sin(time * 3 + k) * 2 * zoom;
        drawSpr(SPR.crystal, cx, cy, false, 1, 0.8);
        emis.push(['violet', cx, cy, 14 * zoom, 0.55]);
      }
    }
    if (player.hurtT > 0) emis.push(['red', x0, y0 - 40 * zoom, 38 * zoom, player.hurtT / 0.22 * 0.7]);
  }
  function depthOf(o) { return o.kind ? o.depth : o.x + o.y; }
  function byDepth(a, b) { return depthOf(a) - depthOf(b); }
  function drawActors() {
    drawList.length = 0;
    const mx = 70 * zoom, my = 160 * zoom;
    for (const p of props) {
      const x0 = isoX(p.x, p.y), y0 = isoY(p.x, p.y);
      if (x0 < -mx || x0 > W + mx || y0 < -10 || y0 > H + my) continue;
      drawList.push(p);
    }
    for (const e of enemies) drawList.push(e);
    drawList.push(player);
    if (activePet() && !riding()) drawList.push(PET);
    drawList.sort(byDepth);
    for (const o of drawList) {
      if (o === player) drawHero();
      else if (o === PET) drawPet();
      else if (o.kind) drawProp(o);
      else drawEnemy(o);
    }
  }
  function drawParts(additive) {
    for (const p of parts) {
      const add = p.k !== 'leaf' && p.k !== 'dust' && p.k !== 'smoke';
      if (add !== additive) continue;
      const k = p.t / p.life, x0 = isoX(p.x, p.y), y0 = isoY(p.x, p.y) - p.z * zoom;
      if (x0 < -20 || x0 > W + 20 || y0 < -20 || y0 > H + 20) continue;
      if (p.k === 'leaf') {
        ctx.globalAlpha = Math.min(1, (1 - k) * 3);
        ctx.fillStyle = p.c;
        ctx.save(); ctx.translate(x0, y0); ctx.rotate(p.t * 3 + p.s * 6); ctx.scale(1, 0.45 + 0.55 * Math.abs(Math.sin(p.t * 4 + p.s * 5)));
        ctx.beginPath(); ctx.ellipse(0, 0, 3.2 * zoom, 1.7 * zoom, 0, 0, TAU); ctx.fill();
        ctx.restore();
      } else if (p.k === 'smoke') {
        ctx.globalAlpha = 0.28 * (1 - k) * Math.min(1, p.t * 6);
        ctx.fillStyle = '#3a3230';
        ctx.beginPath(); ctx.arc(x0, y0, (5 + k * 16) * zoom * p.s, 0, TAU); ctx.fill();
      } else if (p.k === 'dust') {
        ctx.globalAlpha = 0.32 * (1 - k);
        ctx.fillStyle = '#d6c29a';
        ctx.beginPath(); ctx.arc(x0, y0, (2 + k * 6) * zoom * p.s, 0, TAU); ctx.fill();
      } else {
        const sp = GLOW[p.c] || GLOW.gold;
        let r, a;
        if (p.k === 'firefly') { r = 9 * p.s * zoom; a = (0.45 + 0.55 * Math.sin(p.t * 4 + p.s * 7)) * Math.min(1, (1 - k) * 4, p.t * 2) * envDark; }
        else if (p.k === 'ember') { r = 7 * p.s * zoom; a = (1 - k) * (0.6 + 0.4 * Math.sin(p.t * 20 + p.s * 9)); }
        else if (p.k === 'spark') { r = 6 * p.s * zoom * (1 - k * 0.5); a = 1 - k; }
        else { r = 8 * p.s * zoom; a = Math.min(1, (1 - k) * 1.6); }
        if (a <= 0.01) continue;
        ctx.globalAlpha = a;
        ctx.drawImage(sp.img, x0 - r, y0 - r, r * 2, r * 2);
      }
    }
    ctx.globalAlpha = 1;
  }
  function addLight(x, y, r, key, a) {
    if (x + r < 0 || x - r > W || y + r < 0 || y - r > H) return;
    lights.push([x, y, r, key, a]);
  }
  function collectLights() {
    lights.length = 0;
    if (envDark < 0.02) return;
    const tw = HW * 2;
    const fl = 1 + Math.sin(time * 11) * 0.05 + Math.sin(time * 6.3) * 0.05;
    const fx0 = isoX(CAMP.x, CAMP.y), fy0 = isoY(CAMP.x, CAMP.y) - 8 * zoom;
    addLight(fx0, fy0, 5.6 * tw * fl, 'warm', 1);
    addLight(fx0, fy0, 2.4 * tw, 'white', 0.4 * fl);
    for (const p of props) {
      if (p.kind === 'tent') addLight(isoX(p.x, p.y) - 9 * zoom, isoY(p.x, p.y) + 2 * zoom, 1.5 * tw, 'warm', 0.7);
      else if (p.kind === 'lamp') addLight(isoX(p.x, p.y), isoY(p.x, p.y) - 72 * zoom, 2.4 * tw, 'warm', 0.95);
      else if (p.kind === 'crystal') addLight(isoX(p.x, p.y), isoY(p.x, p.y) - 20 * zoom, 2.6 * tw, p.v ? 'cyan' : 'violet', 0.9);
      else if (p.kind === 'portal') addLight(isoX(p.x, p.y), isoY(p.x, p.y) - 30 * zoom, 2.6 * tw, 'cyan', 0.95);
    }
    if (!player.dead) {
      const px = isoX(player.x, player.y), py = isoY(player.x, player.y) - 28 * zoom;
      if (player.form === 'arcane') addLight(px, py, 2.8 * tw, 'violet', 0.85);
      else addLight(px, py, 1.9 * tw, 'amber', 0.4);
    }
    for (const s of shots) addLight(isoX(s.x, s.y), isoY(s.x, s.y) - s.h * zoom, 1.5 * tw, 'violet', 0.9);
    for (const f of fx) {
      const k = f.t / f.life;
      if (f.k === 'chain') for (let n = 1; n < f.pts.length; n++) addLight(isoX(f.pts[n][0], f.pts[n][1]), isoY(f.pts[n][0], f.pts[n][1]) - 14 * zoom, 2.2 * tw, 'cyan', (1 - k) * 0.9);
      else if (f.k === 'spin') addLight(isoX(f.x, f.y), isoY(f.x, f.y) - 10 * zoom, 3 * tw, 'amber', (1 - k) * 0.9);
      else if (f.k === 'morph') addLight(isoX(f.x, f.y), isoY(f.x, f.y) - 20 * zoom, 4 * tw, f.c, 1 - k);
      else if (f.k === 'lvl') addLight(isoX(player.x, player.y), isoY(player.x, player.y) - 30 * zoom, 3.4 * tw, 'gold', 1 - k);
      else if (f.k === 'heal') addLight(isoX(player.x, player.y), isoY(player.x, player.y) - 20 * zoom, 2 * tw, 'mint', (1 - k) * 0.7);
      else if (f.k === 'slash') addLight(isoX(f.x, f.y), isoY(f.x, f.y) - 16 * zoom, 1.4 * tw, 'amber', (1 - k) * 0.6);
    }
    collectSkillLights(tw);
    collectLootLights(tw);
    for (const e of enemies) {
      if (e.dead) continue;
      if (e.type === 'ant') addLight(isoX(e.x, e.y), isoY(e.x, e.y) - 10 * zoom, 1.2 * tw, 'warm', 0.45);
      if (e.elite) addLight(isoX(e.x, e.y), isoY(e.x, e.y) - 14 * zoom, 1.7 * tw, 'gold', 0.5);
    }
    for (const p of parts) if (p.k === 'firefly') addLight(isoX(p.x, p.y), isoY(p.x, p.y) - p.z * zoom, 0.6 * tw, 'fly', 0.5 + 0.4 * Math.sin(p.t * 4 + p.s * 7));
  }
  function applyLighting() {
    const amb = env.amb;
    if (envDark < 0.02) {
      if (amb[1] < 251 || amb[2] < 244) {
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgb(' + Math.round(amb[0]) + ',' + Math.round(amb[1]) + ',' + Math.round(amb[2]) + ')';
        ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.restore();
      }
      return;
    }
    const lw = Math.max(1, Math.ceil(cv.width / 2)), lh = Math.max(1, Math.ceil(cv.height / 2));
    if (!lightCv || LW !== lw || LH !== lh) { lightCv = mk(lw, lh); lctx = lightCv.getContext('2d'); LW = lw; LH = lh; }
    lctx.setTransform(1, 0, 0, 1, 0, 0);
    lctx.globalCompositeOperation = 'source-over';
    lctx.globalAlpha = 1;
    lctx.fillStyle = 'rgb(' + Math.round(amb[0]) + ',' + Math.round(amb[1]) + ',' + Math.round(amb[2]) + ')';
    lctx.fillRect(0, 0, LW, LH);
    lctx.globalCompositeOperation = 'lighter';
    const k = LW / W;
    for (const L of lights) {
      const sp = GLOW[L[3]];
      if (!sp) continue;
      lctx.globalAlpha = clamp(L[4] * envDark, 0, 1);
      lctx.drawImage(sp.img, (L[0] - L[2]) * k, (L[1] - L[2]) * k, L[2] * 2 * k, L[2] * 2 * k);
    }
    lctx.globalAlpha = 1;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(lightCv, 0, 0, cv.width, cv.height);
    ctx.restore();
  }
  function drawEmissive() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const m of emis) {
      const sp = GLOW[m[0]];
      if (!sp) continue;
      ctx.globalAlpha = clamp(m[4], 0, 1);
      ctx.drawImage(sp.img, m[1] - m[3], m[2] - m[3], m[3] * 2, m[3] * 2);
    }
    ctx.globalAlpha = 1;
    drawPortals();
    const tg = player.target;
    if (tg && !tg.dead) drawGroundRing(RING[player.form], isoX(tg.x, tg.y), isoY(tg.x, tg.y), 0.55 * (tg.elite ? 1.25 : 1), time * 1.4, 0.85);
    if (marker) { const k = marker.t / 0.5; drawGroundRing(RING.white, isoX(marker.x, marker.y), isoY(marker.x, marker.y), 0.45 * (1 - k * 0.6), 0, 0.8 * (1 - k)); }
    for (const f of fx) {
      const k = f.t / f.life, a = 1 - k;
      if (f.k === 'mark' && f.e && !f.e.dead) drawGroundRing(RING.white, isoX(f.e.x, f.e.y), isoY(f.e.x, f.e.y), 0.9 - k * 0.35, 0, a);
      else if (f.k === 'morph' || f.k === 'lvl') {
        const x0 = isoX(f.k === 'lvl' ? player.x : f.x, f.k === 'lvl' ? player.y : f.y), y0 = isoY(f.k === 'lvl' ? player.x : f.x, f.k === 'lvl' ? player.y : f.y);
        drawGroundRing(f.k === 'lvl' ? RUNE.gold : RUNE[f.c] || RUNE.violet, x0, y0, 1.1 + k * 0.5, time * 1.6, a);
        const hgt = 150 * zoom, col = f.k === 'lvl' ? '255,214,90' : f.c === 'amber' ? '255,192,77' : '170,140,255';
        const g = ctx.createLinearGradient(0, y0 - hgt, 0, y0);
        g.addColorStop(0, 'rgba(' + col + ',0)'); g.addColorStop(1, 'rgba(' + col + ',' + (0.55 * a).toFixed(3) + ')');
        ctx.fillStyle = g;
        const w = 22 * zoom * (1 - k * 0.5);
        ctx.fillRect(x0 - w, y0 - hgt, w * 2, hgt);
      } else if (f.k === 'spin') {
        const x0 = isoX(f.x, f.y), y0 = isoY(f.x, f.y);
        const R = f.R * 45.25 * zoom * (0.55 + 0.45 * k);
        ctx.save(); ctx.translate(x0, y0 - 12 * zoom); ctx.scale(1, 0.5);
        const start = (f.left ? -1 : 1) * k * TAU * 1.1;
        for (let n = 0; n < 6; n++) {
          const aa = a * (1 - n / 6);
          ctx.strokeStyle = 'rgba(255,' + (210 - n * 12) + ',' + (140 - n * 14) + ',' + aa.toFixed(3) + ')';
          ctx.lineWidth = (10 - n * 1.2) * zoom;
          ctx.beginPath(); ctx.arc(0, 0, R - n * 2 * zoom, start - (f.left ? -1 : 1) * n * 0.3, start - (f.left ? -1 : 1) * (n * 0.3 + 0.5), !f.left); ctx.stroke();
        }
        ctx.restore();
        drawGroundRing(RING.blade, x0, y0, f.R * (0.4 + 0.6 * k), 0, a * 0.7);
      } else if (f.k === 'slash') {
        const x0 = isoX(f.x, f.y), y0 = isoY(f.x, f.y) - (f.h || 14) * zoom;
        ctx.save(); ctx.translate(x0, y0); if (f.left) ctx.scale(-1, 1); ctx.rotate(-0.35);
        const r = 22 * zoom, e1 = -2.2 + 3.0 * Math.min(1, k * 2.4);
        ctx.globalAlpha = a;
        const g = ctx.createLinearGradient(-r, -r, r, r);
        g.addColorStop(0, 'rgba(255,200,110,0)'); g.addColorStop(0.6, 'rgba(255,214,140,0.9)'); g.addColorStop(1, 'rgba(255,255,240,1)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, 0, r, -2.2, e1); ctx.arc(-4 * zoom, 3 * zoom, r * 0.74, e1, -2.2, true); ctx.closePath(); ctx.fill();
        ctx.restore();
      } else if (f.k === 'chain') {
        const step = Math.floor(f.t / 0.05);
        if (f.seed !== step || !f.jit) { f.seed = step; f.jit = []; for (let n = 0; n < 240; n++) f.jit.push((Math.random() - 0.5) * 12); }
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        for (let pass = 0; pass < 3; pass++) {
          ctx.strokeStyle = pass === 0 ? 'rgba(110,90,255,' + (0.45 * a).toFixed(3) + ')' : pass === 1 ? 'rgba(140,230,255,' + (0.7 * a).toFixed(3) + ')' : 'rgba(255,255,255,' + a.toFixed(3) + ')';
          ctx.lineWidth = (pass === 0 ? 12 : pass === 1 ? 4 : 1.6) * zoom;
          ctx.beginPath();
          for (let n = 0; n < f.pts.length; n++) {
            const p = f.pts[n], x1 = isoX(p[0], p[1]), y1 = isoY(p[0], p[1]) - p[2] * zoom;
            if (n === 0) { ctx.moveTo(x1, y1); continue; }
            const q = f.pts[n - 1], xq = isoX(q[0], q[1]), yq = isoY(q[0], q[1]) - q[2] * zoom;
            for (let s = 1; s <= 5; s++) { const tt = s / 6, ji = (n * 6 + s) % 120; ctx.lineTo(xq + (x1 - xq) * tt + f.jit[ji] * zoom, yq + (y1 - yq) * tt + f.jit[ji + 120] * zoom); }
            ctx.lineTo(x1, y1);
          }
          ctx.stroke();
        }
        for (let n = 1; n < f.pts.length; n++) { const p = f.pts[n]; const r = 26 * zoom * a; ctx.globalAlpha = a; ctx.drawImage(GLOW.cyan.img, isoX(p[0], p[1]) - r, isoY(p[0], p[1]) - p[2] * zoom - r, r * 2, r * 2); }
        ctx.globalAlpha = 1;
      } else if (f.k === 'heal') {
        const x0 = isoX(player.x, player.y), y0 = isoY(player.x, player.y);
        const r = 40 * zoom; ctx.globalAlpha = a * 0.6; ctx.drawImage(GLOW.mint.img, x0 - r, y0 - 24 * zoom - r, r * 2, r * 2); ctx.globalAlpha = 1;
      }
    }
    for (const s of shots) {
      for (let n = 0; n < s.trail.length; n++) {
        const p = s.trail[n], aa = (n + 1) / (s.trail.length + 1), r = (10 * aa + 2) * zoom;
        ctx.globalAlpha = 0.5 * aa;
        ctx.drawImage(GLOW[s.col || 'violet'].img, isoX(p[0], p[1]) - r, isoY(p[0], p[1]) - p[2] * zoom - r, r * 2, r * 2);
      }
      const x0 = isoX(s.x, s.y), y0 = isoY(s.x, s.y) - s.h * zoom, bz = s.big ? 1.6 : 1;
      ctx.globalAlpha = 1;
      ctx.drawImage(GLOW[s.col || 'violet'].img, x0 - 18 * zoom * bz, y0 - 18 * zoom * bz, 36 * zoom * bz, 36 * zoom * bz);
      ctx.drawImage(GLOW.white.img, x0 - 7 * zoom * bz, y0 - 7 * zoom * bz, 14 * zoom * bz, 14 * zoom * bz);
    }
    drawLootEmissive();
    drawSkillEmissive();
    drawParts(true);
    ctx.restore();
    vfxDraw();
    classDraw();
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
  function drawBars() {
    ctx.textAlign = 'center';
    for (const e of enemies) {
      if (e.dead || e.boss || !(e.hp < e.maxHp || player.target === e || e.elite || e.obj || e.bounty || e.treasure)) continue;
      const x0 = isoX(e.x, e.y), y0 = isoY(e.x, e.y);
      if (x0 < -40 || x0 > W + 40 || y0 < 0 || y0 > H + 80) continue;
      const sc = e.elite ? 1.18 : 1;
      const top = y0 - (e.type === 'ant' ? 46 : e.type === 'undead' ? 76 : 62) * zoom * sc;
      const bw = 32 * zoom, bh = 5;
      ctx.fillStyle = 'rgba(10,12,30,0.78)'; roundRect(x0 - bw / 2 - 2, top - 2, bw + 4, bh + 4, 3.5); ctx.fill();
      const f = clamp(e.hp / e.maxHp, 0, 1);
      if (f > 0) {
        const g = ctx.createLinearGradient(0, top, 0, top + bh);
        if (e.elite) { g.addColorStop(0, '#ffe9a0'); g.addColorStop(1, '#e0a020'); } else { g.addColorStop(0, '#ff8a96'); g.addColorStop(1, '#d0304b'); }
        ctx.fillStyle = g; roundRect(x0 - bw / 2, top, Math.max(bh, bw * f), bh, 2.5); ctx.fill();
      }
      // full names only for the target and objectives; other elites get a short tag (keeps crowds readable)
      const full = player.target === e || e.obj || e.bounty || e.treasure;
      if (full || e.elite) {
        ctx.font = '800 ' + Math.max(10, Math.round(11 * zoom)) + 'px ' + FONT;
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,12,30,0.8)'; ctx.lineJoin = 'round';
        const ttl = e.title && (player.target === e ? e.title : e.title.split(' ')[0]);
        const label = full && ttl ? ttl + (e.obj === 'chest' ? '' : ' Lv' + e.lvl) : (e.elite ? '★ ' : '') + 'Lv' + e.lvl;
        ctx.strokeText(label, x0, top - 5);
        ctx.fillStyle = e.treasure || e.obj === 'chest' ? '#ffe600' : e.bounty ? '#ff9a3a' : e.obj === 'seal' ? '#d9a6ff' : e.aff ? '#ff9ac2' : e.elite ? '#ffe27a' : '#ffffff'; ctx.fillText(label, x0, top - 5);
      }
    }
  }
  const TEXT_STYLE = { hit: ['#ffffff', 14, 'rgba(20,22,48,0.9)'], crit: ['#ffd36e', 23, 'rgba(80,24,0,0.95)'], hurt: ['#ff6b7a', 16, 'rgba(60,0,12,0.9)'], gold: ['#ffe27a', 14, 'rgba(70,46,0,0.9)'], heal: ['#8dffbf', 15, 'rgba(0,44,22,0.9)'], multi: ['#ffef9a', 24, 'rgba(90,20,0,0.95)'], react: ['#e6f6ff', 19, 'rgba(20,30,80,0.95)'] };
  function drawTexts() {
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    for (const t of texts) {
      const k = t.t / t.life, st = TEXT_STYLE[t.kind] || TEXT_STYLE.hit;
      const pop = t.kind === 'crit' || t.kind === 'multi' || t.kind === 'react' ? 1 + Math.max(0, 0.3 - k) * 3 : 1 + Math.max(0, 0.18 - k) * 2.2;
      const rise = t.vy ? t.vy * t.t - 0.5 * 190 * t.t * t.t + k * 8 : k * 24;
      const x0 = isoX(t.x, t.y) + (t.vx || 0) * t.t * zoom, y0 = isoY(t.x, t.y) - (t.h + rise) * zoom;
      const size = Math.round(st[1] * zoom * pop / 2) * 2;
      ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      ctx.font = '800 ' + size + 'px ' + FONT;
      ctx.lineWidth = Math.max(3, size * 0.24);
      ctx.strokeStyle = st[2];
      ctx.strokeText(t.s, x0, y0);
      if (t.kind === 'crit' || t.kind === 'multi') { const g = ctx.createLinearGradient(0, y0 - size, 0, y0); g.addColorStop(0, '#fff7c8'); g.addColorStop(0.5, '#ffc23d'); g.addColorStop(1, '#ff7a1a'); ctx.fillStyle = g; }
      else ctx.fillStyle = st[0];
      ctx.fillText(t.s, x0, y0);
    }
    ctx.globalAlpha = 1;
  }
  let userZoom = 1;
  try { const z = parseFloat(localStorage.getItem('twinsoul-zoom')); if (z > 0) userZoom = z; } catch (err) { /* ignore */ }
  function applyZoom() {
    const fit = clamp(Math.min(W, H) / 520, 0.6, 1.15);
    zoom = clamp(fit * userZoom, 0.42, 1.6);
    HW = 32 * zoom; HH = 16 * zoom;
  }
  function setUserZoom(z) {
    userZoom = clamp(z, 0.6, 1.8);
    applyZoom();
    try { localStorage.setItem('twinsoul-zoom', String(userZoom)); } catch (err) { /* ignore */ }
  }
  let mmBase = null, mmLast = -1;
  function buildMinimapBase() {
    const C = BIOMES[MAPS[curMap].biome].mm;
    mmBase = mk(MW, MH);
    const g = mmBase.getContext('2d'), img = g.createImageData(MW, MH), d = img.data;
    for (let k = 0; k < MW * MH; k++) {
      const t = tile[k], c = t === T_PIT ? [10, 8, 16] : t === T_WATER ? C.w : solid[k] ? C.s : t === T_PATH ? C.p : t === T_CAMP ? C.c : C.g;
      d[k * 4] = c[0]; d[k * 4 + 1] = c[1]; d[k * 4 + 2] = c[2]; d[k * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }
  function drawMinimap() {
    const c = $('minimap');
    if (!c || !mmBase) return;
    const w = c.width, h = c.height, g = c.getContext('2d'), k = w / (2 * MW), r = w / 60, oy0 = (h - MH * k) / 2;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, w, h);
    g.imageSmoothingEnabled = false;
    g.setTransform(k, k / 2, -k, k / 2, w / 2, oy0);
    g.drawImage(mmBase, 0, 0);
    g.setTransform(1, 0, 0, 1, 0, 0);
    const P = (x, y) => [w / 2 + (x - y) * k, oy0 + (x + y) * k / 2];
    let q = P(CAMP.x, CAMP.y);
    g.fillStyle = '#ffb04d'; g.beginPath(); g.arc(q[0], q[1], r * 1.1, 0, TAU); g.fill();
    g.fillStyle = '#8ff0ff';
    for (const p of portals) { q = P(p.x, p.y); g.beginPath(); g.arc(q[0], q[1], r * 1.3, 0, TAU); g.fill(); }
    for (const e of enemies) { if (e.dead) continue; q = P(e.x, e.y); const sp = e.obj || e.treasure || e.bounty, rr = sp ? r * 1.1 : r * 0.45; g.fillStyle = e.obj === 'chest' || e.treasure ? '#ffe600' : e.obj === 'seal' ? '#d080ff' : e.bounty ? '#ff9a3a' : '#ff5d6c'; g.fillRect(q[0] - rr, q[1] - rr, rr * 2, rr * 2); }
    q = P(player.x, player.y);
    g.fillStyle = '#ffffff'; g.strokeStyle = '#10142b'; g.lineWidth = r * 0.45;
    g.beginPath(); g.arc(q[0], q[1], r * 1.25, 0, TAU); g.fill(); g.stroke();
  }
  function drawPortals() {
    for (const p of portals) {
      const x0 = isoX(p.x, p.y), y0 = isoY(p.x, p.y);
      if (x0 < -80 || x0 > W + 80 || y0 < -20 || y0 > H + 120) continue;
      const cy = y0 - 34 * zoom, r = 40 * zoom;
      ctx.globalAlpha = 0.7 + 0.1 * Math.sin(time * 3);
      ctx.drawImage(GLOW.cyan.img, x0 - r * 0.6, cy - r, r * 1.2, r * 2);
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1.6 * zoom;
      for (let k = 0; k < 3; k++) {
        ctx.strokeStyle = 'rgba(200,250,255,' + (0.85 - k * 0.2).toFixed(2) + ')';
        ctx.setLineDash([6 * zoom, 7 * zoom]);
        ctx.lineDashOffset = -time * 24 * (k + 1);
        ctx.beginPath(); ctx.ellipse(x0, cy, (14 - k * 4) * zoom, (25 - k * 7) * zoom, 0, 0, TAU); ctx.stroke();
      }
      ctx.setLineDash([]);
      drawGroundRing(RUNE.cyan, x0, y0, 1.05, time * 0.6, 0.65);
    }
  }
  function drawPortalLabels() {
    ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    ctx.font = '800 ' + Math.round(12 * Math.max(0.9, zoom)) + 'px ' + FONT;
    for (const p of portals) {
      const x0 = isoX(p.x, p.y), y0 = isoY(p.x, p.y) - 96 * zoom;
      if (x0 < -80 || x0 > W + 80 || y0 < -20 || y0 > H + 40) continue;
      ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(8,10,28,0.85)'; ctx.strokeText(p.label, x0, y0);
      ctx.fillStyle = '#bff6ff'; ctx.fillText(p.label, x0, y0);
    }
  }
  function render() {
    const z0 = zoom;
    if (punchZ) { zoom = z0 * (1 + punchZ); HW = 32 * zoom; HH = 16 * zoom; }
    try { renderWorld(); } finally { if (zoom !== z0) { zoom = z0; HW = 32 * zoom; HH = 16 * zoom; } }
  }
  function renderWorld() {
    computeOrigin();
    ox += kickX; oy += kickY;
    env = envAt(((dayT / DAY_LEN) % 1 + 1) % 1);
    const BIr = BIOMES[MAPS[curMap].biome];
    env.amb = [env.amb[0] * BIr.tint[0], env.amb[1] * BIr.tint[1], env.amb[2] * BIr.tint[2]];
    env.dark = Math.min(0.96, Math.max(env.dark, BIr.minDark) + (curMap === 3 && FLOOR.mods.includes('dark') ? 0.1 : 0));
    envDark = env.dark;
    emis.length = 0;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    drawSky();
    drawChunks();
    drawWaterAnim();
    drawGroundFx();
    drawSkillGround();
    drawLootGround();
    drawDungeonGround();
    vfxGround();
    drawActors();
    drawParts(false);
    collectLights();
    applyLighting();
    drawEmissive();
    drawBossShots();
    if (!OP.capturing) drawBars();
    drawSkillOverlay();
    if (!OP.capturing) { drawPortalLabels(); drawNpcLabels(); }
    drawLootLabels();
    vfxScreen();
    drawTexts();
  }
