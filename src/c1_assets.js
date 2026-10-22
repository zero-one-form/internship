
  /* ================= graphics: assets ================= */
  let S = 0, SG = 1;
  const SPR = { trees: [], bushes: [], rocks: [] };
  const HERO = {}, ENEMY = {}, GLOW = {}, RING = {}, RUNE = {};
  let TEX = null;
  const DIRS8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.71, 0.71], [-0.71, 0.71], [0.71, -0.71], [-0.71, -0.71]];

  const SCR = {};
  function scr(key, w, h) {
    let c = SCR[key];
    if (!c) c = SCR[key] = mk(w, h);
    c.width = w;
    c.height = h;
    return c;
  }
  function withOutline(src, hex, alpha, thick) {
    const w = src.width, h = src.height;
    const sil = scr('b', w, h), s = sil.getContext('2d');
    s.drawImage(src, 0, 0);
    s.globalCompositeOperation = 'source-in';
    s.fillStyle = hex;
    s.fillRect(0, 0, w, h);
    const ring = scr('c', w, h), r = ring.getContext('2d');
    const t = Math.max(1, thick * S);
    for (const d of DIRS8) r.drawImage(sil, d[0] * t, d[1] * t);
    r.globalCompositeOperation = 'destination-out';
    r.drawImage(sil, 0, 0);
    const out = mk(w, h), o = out.getContext('2d');
    o.globalAlpha = alpha;
    o.drawImage(ring, 0, 0);
    o.globalAlpha = 1;
    o.drawImage(src, 0, 0);
    return out;
  }
  function makeSprite(w, h, ax, ay, draw, outline) {
    const cw = Math.ceil(w * S), chh = Math.ceil(h * S);
    const base = outline ? scr('a', cw, chh) : mk(cw, chh);
    const g = base.getContext('2d');
    g.setTransform(S, 0, 0, S, ax * S, ay * S);
    draw(g);
    g.setTransform(1, 0, 0, 1, 0, 0);
    return { img: outline ? withOutline(base, outline[0], outline[1], outline[2]) : base, w, h, ax, ay };
  }

  /* ---------- textures (device pixels, tileable) ---------- */
  function tileNoise(size, cells, seed) {
    const R = seeded(seed);
    const grid = new Float32Array(cells * cells);
    for (let i = 0; i < grid.length; i++) grid[i] = R();
    const out = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
      const gy = y / size * cells, y0 = Math.floor(gy), fy = gy - y0, sy = fy * fy * (3 - 2 * fy), y1 = (y0 + 1) % cells;
      for (let x = 0; x < size; x++) {
        const gx = x / size * cells, x0 = Math.floor(gx), fx = gx - x0, sx = fx * fx * (3 - 2 * fx), x1 = (x0 + 1) % cells;
        const a = grid[y0 * cells + x0], b = grid[y0 * cells + x1], c = grid[y1 * cells + x0], d = grid[y1 * cells + x1];
        out[y * size + x] = a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
      }
    }
    return out;
  }
  function makeTexture(size, pal, seed, contrast, grain, extra) {
    const n1 = tileNoise(size, 4, seed), n2 = tileNoise(size, 8, seed + 1), n3 = tileNoise(size, 32, seed + 2);
    const c = mk(size, size), g = c.getContext('2d');
    const img = g.createImageData(size, size), d = img.data;
    const R = seeded(seed + 9);
    for (let i = 0; i < size * size; i++) {
      let v = n1[i] * 0.45 + n2[i] * 0.35 + n3[i] * 0.2;
      v = clamp((v - 0.5) * contrast + 0.5 + (R() - 0.5) * grain, 0, 0.999);
      const f = v * (pal.length - 1), k = Math.floor(f), t = f - k;
      const p0 = pal[k], p1 = pal[Math.min(pal.length - 1, k + 1)];
      d[i * 4] = p0[0] + (p1[0] - p0[0]) * t;
      d[i * 4 + 1] = p0[1] + (p1[1] - p0[1]) * t;
      d[i * 4 + 2] = p0[2] + (p1[2] - p0[2]) * t;
      d[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    if (extra) extra(g, size, R);
    return c;
  }
  function wrapDraw(size, x, y, fn) {
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
      const xx = x + ox, yy = y + oy;
      if (xx > -12 && xx < size + 12 && yy > -12 && yy < size + 12) fn(xx, yy);
    }
  }
  const TEX_PAL = {
    forest: { grass: [[34, 70, 46], [46, 92, 56], [62, 114, 64], [86, 136, 70], [118, 158, 82]], dirt: [[84, 62, 42], [108, 82, 56], [132, 104, 72], [156, 128, 92], [176, 150, 112]], camp: [[88, 60, 40], [112, 80, 52], [138, 102, 66], [164, 128, 86], [186, 152, 108]], strokes: ['rgba(150,190,96,0.45)', 'rgba(26,56,34,0.45)', 'rgba(176,206,112,0.35)', 'rgba(70,120,64,0.5)'] },
    canyon: { grass: [[150, 98, 58], [174, 118, 72], [196, 142, 90], [212, 164, 110], [228, 188, 136]], dirt: [[118, 62, 40], [140, 78, 50], [162, 96, 62], [182, 116, 78], [198, 136, 96]], camp: [[110, 72, 46], [134, 92, 60], [156, 112, 74], [178, 134, 92], [198, 156, 112]], strokes: ['rgba(240,210,160,0.35)', 'rgba(110,60,30,0.35)', 'rgba(220,180,120,0.3)', 'rgba(150,90,50,0.35)'] },
    cave: { grass: [[34, 32, 44], [46, 44, 58], [58, 56, 72], [74, 72, 90], [92, 90, 108]], dirt: [[50, 48, 60], [66, 64, 78], [84, 82, 96], [104, 102, 116], [124, 122, 136]], camp: [[60, 46, 70], [76, 60, 88], [94, 76, 106], [112, 92, 124], [130, 110, 142]], strokes: ['rgba(140,130,180,0.25)', 'rgba(10,8,20,0.45)', 'rgba(120,110,160,0.2)', 'rgba(40,36,60,0.4)'] },
    grave: { grass: [[30, 40, 36], [40, 54, 46], [52, 68, 56], [66, 84, 68], [84, 102, 82]], dirt: [[64, 66, 72], [82, 84, 90], [100, 102, 108], [120, 122, 128], [140, 142, 146]], camp: [[60, 50, 44], [78, 66, 56], [96, 82, 70], [114, 98, 84], [132, 116, 100]], strokes: ['rgba(120,150,120,0.3)', 'rgba(10,20,16,0.45)', 'rgba(150,170,140,0.25)', 'rgba(50,70,56,0.45)'] }
  };
  const TEXC = {};
  function biomeTextures(bk) {
    const P = TEX_PAL[bk], size = 256;
    const specks = (cols) => (g, n, R) => {
      for (let k = 0; k < 520; k++) {
        const x = R() * n, y = R() * n, r = 0.6 + R() * 1.6;
        g.fillStyle = cols[R() < 0.5 ? 0 : 1];
        wrapDraw(n, x, y, (xx, yy) => { g.beginPath(); g.ellipse(xx, yy, r * 1.3, r, 0, 0, TAU); g.fill(); });
      }
    };
    return {
      grass: makeTexture(size, P.grass, 11, 1.5, 0.1, (g, n, R) => {
        for (let k = 0; k < 1500; k++) {
          const x = R() * n, y = R() * n, L = 2.5 + R() * 4.5, a = (R() - 0.5) * 0.9;
          g.strokeStyle = P.strokes[(R() * P.strokes.length) | 0];
          g.lineWidth = 1;
          wrapDraw(n, x, y, (xx, yy) => { g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + Math.sin(a) * L, yy - Math.cos(a) * L); g.stroke(); });
        }
      }),
      dirt: makeTexture(size, P.dirt, 23, 1.35, 0.16, specks(['rgba(206,182,142,0.55)', 'rgba(60,42,26,0.45)'])),
      camp: makeTexture(size, P.camp, 37, 1.25, 0.14, specks(['rgba(210,180,140,0.5)', 'rgba(64,40,22,0.45)'])),
      rock: makeTexture(size, [[46, 46, 60], [70, 72, 88], [96, 98, 114], [124, 126, 140], [150, 150, 160]], 51, 1.7, 0.12, null)
    };
  }
  function buildTextures() {
    const bk = MAPS[curMap].biome;
    if (!TEXC[bk]) TEXC[bk] = biomeTextures(bk);
    TEX = TEXC[bk];
  }
  function rebuildBiome() { if (!assetKey) return; buildTextures(); chunkCache.clear(); }

  /* ---------- effect sprites ---------- */
  function glowSprite(hex, r) {
    return makeSprite(r * 2, r * 2, r, r, (g) => {
      g.fillStyle = rad(g, 0, 0, r, [[0, rgba(hex, 1)], [0.22, rgba(hex, 0.6)], [0.55, rgba(hex, 0.18)], [1, rgba(hex, 0)]]);
      g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
    });
  }
  function ringSprite(hex) {
    return makeSprite(70, 70, 35, 35, (g) => {
      g.strokeStyle = rgba(hex, 0.95); g.lineWidth = 2.4;
      g.beginPath(); g.arc(0, 0, 28, 0, TAU); g.stroke();
      g.strokeStyle = rgba(hex, 0.55); g.lineWidth = 1.2;
      g.beginPath(); g.arc(0, 0, 22.5, 0, TAU); g.stroke();
      for (let k = 0; k < 12; k++) {
        g.save(); g.rotate(k / 12 * TAU);
        g.fillStyle = rgba(hex, k % 3 === 0 ? 1 : 0.6);
        g.beginPath(); g.moveTo(0, -33); g.lineTo(2.6, -28.5); g.lineTo(0, -25.5); g.lineTo(-2.6, -28.5); g.closePath(); g.fill();
        g.restore();
      }
    });
  }
  function runeSprite(hex) {
    return makeSprite(104, 104, 52, 52, (g) => {
      g.strokeStyle = rgba(hex, 0.95); g.lineWidth = 1.8;
      g.beginPath(); g.arc(0, 0, 46, 0, TAU); g.stroke();
      g.strokeStyle = rgba(hex, 0.7); g.lineWidth = 1;
      g.beginPath(); g.arc(0, 0, 40, 0, TAU); g.stroke();
      g.beginPath(); g.arc(0, 0, 21, 0, TAU); g.stroke();
      g.strokeStyle = rgba(hex, 0.85); g.lineWidth = 1.3;
      for (let s = 0; s < 2; s++) {
        g.beginPath();
        for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + s * Math.PI / 4; const x = Math.cos(a) * 40, y = Math.sin(a) * 40; if (k === 0) g.moveTo(x, y); else g.lineTo(x, y); }
        g.closePath(); g.stroke();
      }
      g.fillStyle = rgba(hex, 0.95);
      for (let k = 0; k < 16; k++) {
        g.save(); g.rotate(k / 16 * TAU);
        if (k % 2) g.fillRect(-0.8, -45, 1.6, 4.4);
        else { g.beginPath(); g.arc(0, -43, 1.7, 0, TAU); g.fill(); }
        g.restore();
      }
      g.beginPath(); g.arc(0, 0, 3, 0, TAU); g.fill();
    });
  }

  /* ---------- environment sprites ---------- */
  const LEAF_PALS = [
    { d: '#1d4632', m: '#2f6b45', l: '#4f9a57', h: '#9ad672', bark: ['#7d5c40', '#5a3f2a', '#382616'] },
    { d: '#173f41', m: '#28625c', l: '#3d8f7e', h: '#8ad6b6', bark: ['#74604c', '#4f3e30', '#30251c'] },
    { d: '#4f2c12', m: '#94531a', l: '#d48526', h: '#ffd06a', bark: ['#7d5c40', '#5a3f2a', '#382616'] },
    { d: '#123530', m: '#1f5145', l: '#33775c', h: '#79b98d' },
    { d: '#173823', m: '#275536', l: '#3f7f4b', h: '#86c27c' }
  ];
  function broadleafSprite(P, seed) {
    const R = seeded(seed);
    return makeSprite(124, 150, 62, 138, (g) => {
      g.fillStyle = lin(g, -8, 0, 8, 0, [[0, P.bark[0]], [0.55, P.bark[1]], [1, P.bark[2]]]);
      g.beginPath();
      g.moveTo(-12, 1.5); g.quadraticCurveTo(-5.5, -1, -5.2, -16); g.lineTo(-4.2, -60); g.lineTo(4.6, -60); g.lineTo(5.4, -16); g.quadraticCurveTo(6, -1, 13, 2); g.quadraticCurveTo(0, 5, -12, 1.5);
      g.closePath(); g.fill();
      g.strokeStyle = 'rgba(28,16,8,0.45)'; g.lineWidth = 0.9;
      for (let k = 0; k < 4; k++) { const x = -3 + k * 2.2 + (R() - 0.5); g.beginPath(); g.moveTo(x, -4); g.quadraticCurveTo(x + (R() - 0.5) * 3, -22, x + (R() - 0.5) * 2, -44); g.stroke(); }
      g.strokeStyle = P.bark[1]; g.lineWidth = 3.2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-1, -46); g.quadraticCurveTo(-10, -58, -19, -63); g.moveTo(1.5, -50); g.quadraticCurveTo(10, -60, 18, -70); g.stroke();
      const cl = [];
      const layers = [[-108, 4, 20, 0.9], [-95, 6, 30, 0.95], [-81, 7, 36, 1], [-67, 6, 32, 1]];
      for (const L of layers) {
        for (let k = 0; k < L[1]; k++) {
          const t = L[1] === 1 ? 0 : k / (L[1] - 1) - 0.5;
          cl.push({ x: t * L[2] * 2 + (R() - 0.5) * 6, y: L[0] + (R() - 0.5) * 6 + Math.abs(t) * 12, r: 12 + R() * 6 - Math.abs(t) * 3, l: L[3] });
        }
      }
      cl.sort((a, b) => a.y - b.y);
      g.fillStyle = P.d;
      for (const c of cl) { g.beginPath(); g.arc(c.x + 1.6, c.y + 2.8, c.r + 1.4, 0, TAU); g.fill(); }
      for (const c of cl) {
        g.fillStyle = rad(g, c.x - c.r * 0.38, c.y - c.r * 0.46, c.r * 1.4, [[0, mix(P.l, P.h, 0.45 * c.l)], [0.5, mix(P.m, P.l, 0.45)], [1, P.d]]);
        g.beginPath(); g.arc(c.x, c.y, c.r, 0, TAU); g.fill();
      }
      for (let k = 0; k < 60; k++) {
        const c = cl[Math.floor(R() * cl.length)];
        const a = -2.5 + R() * 1.7, dd = c.r * (0.25 + R() * 0.6);
        g.fillStyle = rgba(P.h, 0.3 + R() * 0.45);
        g.beginPath(); g.ellipse(c.x + Math.cos(a) * dd, c.y + Math.sin(a) * dd, 2.2 + R() * 1.6, 1.1 + R() * 0.8, R() * 3, 0, TAU); g.fill();
      }
      for (let k = 0; k < 22; k++) {
        const c = cl[Math.floor(R() * cl.length)];
        const a = 0.3 + R() * 1.8, dd = c.r * (0.45 + R() * 0.4);
        g.fillStyle = rgba(P.d, 0.55);
        g.beginPath(); g.ellipse(c.x + Math.cos(a) * dd, c.y + Math.sin(a) * dd, 2 + R() * 1.4, 1.1, R() * 3, 0, TAU); g.fill();
      }
    }, ['#0c1a14', 0.55, 0.9]);
  }
  function coniferSprite(P, seed) {
    const R = seeded(seed);
    return makeSprite(100, 160, 50, 148, (g) => {
      g.fillStyle = lin(g, -4, 0, 4, 0, [[0, '#6e4c32'], [1, '#3a281a']]);
      g.fillRect(-3.6, -28, 7.2, 29);
      const tiers = 5;
      for (let t = 0; t < tiers; t++) {
        const k = t / (tiers - 1), y = -24 - t * 22, w = 31 - t * 5.4, h = 35 - t * 2.6;
        g.fillStyle = 'rgba(6,20,16,0.45)';
        g.beginPath(); g.ellipse(2, y + 1, w * 0.9, 4, 0, 0, TAU); g.fill();
        g.fillStyle = lin(g, -w, y - h, w, y, [[0, mix(P.l, P.h, 0.25 + k * 0.35)], [0.45, P.m], [1, P.d]]);
        g.beginPath(); g.moveTo(0, y - h);
        g.quadraticCurveTo(-w * 0.45, y - h * 0.45, -w, y);
        const n = 7;
        for (let s = 1; s <= n; s++) { const x = -w + 2 * w * s / n; g.lineTo(x - w / n, y + 2.5 + R() * 2.5); g.lineTo(x, y); }
        g.quadraticCurveTo(w * 0.45, y - h * 0.45, 0, y - h);
        g.closePath(); g.fill();
        g.strokeStyle = rgba(P.h, 0.4); g.lineWidth = 1;
        for (let s = 0; s < 4; s++) { const x0 = -w * (0.15 + s * 0.17); g.beginPath(); g.moveTo(x0 * 0.25, y - h * 0.82); g.lineTo(x0, y - 2); g.stroke(); }
      }
    }, ['#08160f', 0.55, 0.9]);
  }
  function bushSprite(P, seed, berry) {
    const R = seeded(seed);
    return makeSprite(70, 52, 35, 42, (g) => {
      const cl = [];
      for (let k = 0; k < 9; k++) { const a = -Math.PI + k / 8 * Math.PI; cl.push({ x: Math.cos(a) * 16 + (R() - 0.5) * 4, y: -8 + Math.sin(a) * 10 + (R() - 0.5) * 3, r: 7 + R() * 3.5 }); }
      cl.push({ x: -3, y: -17, r: 10 }, { x: 6, y: -15, r: 9 });
      cl.sort((a, b) => a.y - b.y);
      g.fillStyle = P.d;
      for (const c of cl) { g.beginPath(); g.arc(c.x + 1, c.y + 2, c.r + 1, 0, TAU); g.fill(); }
      for (const c of cl) {
        g.fillStyle = rad(g, c.x - c.r * 0.4, c.y - c.r * 0.45, c.r * 1.4, [[0, mix(P.l, P.h, 0.4)], [0.5, P.m], [1, P.d]]);
        g.beginPath(); g.arc(c.x, c.y, c.r, 0, TAU); g.fill();
      }
      for (let k = 0; k < 22; k++) {
        const c = cl[Math.floor(R() * cl.length)];
        const a = -2.4 + R() * 1.6, dd = c.r * (0.3 + R() * 0.5);
        g.fillStyle = rgba(P.h, 0.35 + R() * 0.35);
        g.beginPath(); g.ellipse(c.x + Math.cos(a) * dd, c.y + Math.sin(a) * dd, 1.8, 1, R() * 3, 0, TAU); g.fill();
      }
      if (berry) {
        for (let k = 0; k < 8; k++) {
          const c = cl[Math.floor(R() * cl.length)];
          const x = c.x + (R() - 0.5) * c.r, y = c.y + (R() - 0.3) * c.r * 0.8;
          g.fillStyle = berry; g.beginPath(); g.arc(x, y, 1.8, 0, TAU); g.fill();
          g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.arc(x - 0.5, y - 0.6, 0.6, 0, TAU); g.fill();
        }
      }
    }, ['#0c1a14', 0.5, 0.8]);
  }
  function rockSprite(seed, mossy) {
    const R = seeded(seed);
    return makeSprite(60, 48, 30, 36, (g) => {
      const pts = [];
      const n = 9;
      for (let k = 0; k < n; k++) { const a = Math.PI + k / (n - 1) * Math.PI; const r = 15 + R() * 5; pts.push([Math.cos(a) * r * 1.12, Math.sin(a) * r * (0.85 + R() * 0.3) - 2]); }
      g.fillStyle = lin(g, -14, -24, 14, 2, [[0, '#b4bac9'], [0.5, '#7d8498'], [1, '#474d61']]);
      g.beginPath(); g.moveTo(-18, 2); for (const p of pts) g.lineTo(p[0], p[1]); g.lineTo(18, 2); g.quadraticCurveTo(0, 5.5, -18, 2); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.18)';
      g.beginPath(); g.moveTo(pts[1][0], pts[1][1]); g.lineTo(pts[3][0], pts[3][1]); g.lineTo(pts[4][0] * 0.4, -7); g.lineTo(-11, -4); g.closePath(); g.fill();
      g.fillStyle = 'rgba(10,10,30,0.2)';
      g.beginPath(); g.moveTo(pts[5][0], pts[5][1]); g.lineTo(pts[7][0], pts[7][1]); g.lineTo(16, 1); g.lineTo(4, -2); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(28,30,44,0.55)'; g.lineWidth = 0.8;
      g.beginPath(); g.moveTo(-3, -16); g.lineTo(0, -9); g.lineTo(-2, -3); g.moveTo(6, -14); g.lineTo(9, -8); g.stroke();
      if (mossy) {
        g.fillStyle = 'rgba(108,158,78,0.85)'; g.beginPath(); g.ellipse(-5, -17.5, 8.5, 3.6, -0.2, 0, TAU); g.fill();
        g.fillStyle = 'rgba(166,206,112,0.7)'; g.beginPath(); g.ellipse(-7, -19, 4.2, 1.6, -0.2, 0, TAU); g.fill();
      }
    }, ['#10121e', 0.6, 0.9]);
  }
  function tentSprite() {
    return makeSprite(116, 96, 58, 74, (g) => {
      g.fillStyle = lin(g, 0, -52, 40, 12, [[0, '#2f6f73'], [1, '#18393d']]);
      g.beginPath(); g.moveTo(0, -54); g.lineTo(40, -31); g.lineTo(38, 4); g.lineTo(0, 17); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.1)'; g.lineWidth = 3;
      for (let k = 1; k < 4; k++) { const t = k / 4; g.beginPath(); g.moveTo(0, -54 + 71 * t); g.lineTo(40 - 2 * t, -31 + 35 * t); g.stroke(); }
      g.fillStyle = lin(g, -36, -42, 0, 17, [[0, '#6cc0b4'], [1, '#3a8580']]);
      g.beginPath(); g.moveTo(0, -54); g.lineTo(0, 17); g.lineTo(-36, 4); g.closePath(); g.fill();
      g.fillStyle = lin(g, -10, -26, -10, 14, [[0, '#24160f'], [1, '#5a3418']]);
      g.beginPath(); g.moveTo(-9, -25); g.lineTo(-2, 14); g.lineTo(-20, 8.4); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,196,96,0.45)'; g.beginPath(); g.ellipse(-9.5, 7, 6, 3, 0, 0, TAU); g.fill();
      g.fillStyle = '#ffcf6a'; g.beginPath(); g.arc(-9.5, 4, 1.6, 0, TAU); g.fill();
      g.fillStyle = '#8ad2c6'; g.beginPath(); g.moveTo(-9, -25); g.lineTo(-1, 14); g.lineTo(2.4, 9.6); g.lineTo(-5, -21); g.closePath(); g.fill();
      g.strokeStyle = '#6b4a2a'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(0, -54); g.lineTo(0, -63); g.stroke();
      g.fillStyle = '#ffd27a'; g.beginPath(); g.arc(0, -64, 1.9, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(232,222,192,0.75)'; g.lineWidth = 0.8;
      g.beginPath(); g.moveTo(0, -52); g.lineTo(-48, 11); g.moveTo(0, -52); g.lineTo(50, -4); g.stroke();
      g.fillStyle = '#5a3f2a'; g.fillRect(-49.5, 9, 2.4, 4.4); g.fillRect(49, -6, 2.4, 4.4);
    }, ['#0a181a', 0.6, 0.9]);
  }
  function crateSprite() {
    return makeSprite(46, 46, 23, 35, (g) => {
      g.fillStyle = lin(g, -18, -30, 18, -12, [[0, '#e0b273'], [1, '#b98a4e']]);
      g.beginPath(); g.moveTo(0, -31); g.lineTo(18, -22); g.lineTo(0, -13); g.lineTo(-18, -22); g.closePath(); g.fill();
      g.fillStyle = '#ab7a40'; g.beginPath(); g.moveTo(-18, -22); g.lineTo(0, -13); g.lineTo(0, 6); g.lineTo(-18, -3); g.closePath(); g.fill();
      g.fillStyle = '#7a532e'; g.beginPath(); g.moveTo(18, -22); g.lineTo(0, -13); g.lineTo(0, 6); g.lineTo(18, -3); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(58,34,14,0.65)'; g.lineWidth = 0.8;
      for (const t of [0.33, 0.66]) {
        g.beginPath(); g.moveTo(-18, -22 + 19 * t); g.lineTo(0, -13 + 19 * t); g.lineTo(18, -22 + 19 * t); g.stroke();
        g.beginPath(); g.moveTo(-18 + 18 * t, -22 - 9 * t); g.lineTo(18 * t, -13 - 9 * t); g.stroke();
      }
      g.strokeStyle = 'rgba(58,34,14,0.75)'; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(-17, -20); g.lineTo(-1, 4); g.moveTo(17, -20); g.lineTo(1, 4); g.stroke();
      g.strokeStyle = 'rgba(255,232,186,0.55)'; g.lineWidth = 0.8;
      g.beginPath(); g.moveTo(-18, -22); g.lineTo(0, -31); g.lineTo(18, -22); g.stroke();
    }, ['#1e1206', 0.65, 0.8]);
  }
  function barrelSprite() {
    return makeSprite(38, 48, 19, 39, (g) => {
      g.fillStyle = lin(g, -12, 0, 12, 0, [[0, '#ba8148'], [0.4, '#8f5d2e'], [1, '#4c3017']]);
      g.beginPath(); g.moveTo(-11, -28); g.quadraticCurveTo(-14.5, -13, -11, 2); g.quadraticCurveTo(0, 6.5, 11, 2); g.quadraticCurveTo(14.5, -13, 11, -28); g.closePath(); g.fill();
      g.strokeStyle = '#3b3f4f'; g.lineWidth = 2;
      for (const y of [-22, -4]) { g.beginPath(); g.ellipse(0, y, 12.9, 4, 0, 0, Math.PI); g.stroke(); }
      g.fillStyle = lin(g, -10, -32, 10, -24, [[0, '#dca664'], [1, '#9a6a34']]);
      g.beginPath(); g.ellipse(0, -28, 11, 4.2, 0, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(60,36,16,0.5)'; g.lineWidth = 0.6;
      g.beginPath(); g.moveTo(-6, -30.5); g.lineTo(-5, -25); g.moveTo(1, -32); g.lineTo(2, -24.4); g.stroke();
    }, ['#1e1206', 0.65, 0.8]);
  }
  function benchSprite() {
    return makeSprite(74, 36, 37, 22, (g) => {
      g.fillStyle = lin(g, 0, -15, 0, 6, [[0, '#a2703f'], [1, '#4c3017']]);
      g.beginPath(); g.moveTo(-27, -2); g.lineTo(21, -16); g.quadraticCurveTo(28, -12.5, 25, -6); g.lineTo(-23, 7.5); g.quadraticCurveTo(-31, 5, -27, -2); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(40,24,10,0.45)'; g.lineWidth = 0.8;
      for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(-22 + k * 4, 1 + k * 1.5); g.lineTo(18 + k * 2, -11 + k * 1.8); g.stroke(); }
      g.fillStyle = '#ddb47c'; g.beginPath(); g.ellipse(23, -11, 4, 5.4, -0.3, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(120,80,40,0.65)'; g.lineWidth = 0.6;
      g.beginPath(); g.ellipse(23, -11, 2.4, 3.3, -0.3, 0, TAU); g.stroke();
    }, ['#1e1206', 0.65, 0.8]);
  }
  function poleSprite() {
    return makeSprite(44, 96, 22, 86, (g) => {
      g.fillStyle = 'rgba(0,0,0,0)';
      g.fillStyle = lin(g, -2, 0, 2, 0, [[0, '#8f643a'], [1, '#4c3017']]);
      g.fillRect(-1.9, -78, 3.8, 80);
      g.fillRect(-1, -75, 20, 2.8);
      g.fillStyle = '#ffd27a'; g.beginPath(); g.arc(0, -80, 2.8, 0, TAU); g.fill();
      g.fillStyle = '#7d8498'; g.beginPath(); g.ellipse(0, 1, 6, 2.6, 0, 0, TAU); g.fill();
    }, ['#1e1206', 0.65, 0.8]);
  }
  function fireBaseSprite() {
    return makeSprite(60, 40, 30, 24, (g) => {
      const stones = [];
      for (let k = 0; k < 9; k++) { const a = k / 9 * TAU; stones.push([Math.cos(a) * 15.5, Math.sin(a) * 7.6]); }
      stones.sort((a, b) => a[1] - b[1]);
      const stone = (s) => {
        g.fillStyle = lin(g, s[0] - 3, s[1] - 4, s[0] + 3, s[1] + 2, [[0, '#a9afbf'], [1, '#4d5266']]);
        g.beginPath(); g.ellipse(s[0], s[1] - 1.6, 4.2, 3.2, 0, 0, TAU); g.fill();
      };
      for (const s of stones) if (s[1] < 0) stone(s);
      g.fillStyle = 'rgba(30,18,10,0.85)'; g.beginPath(); g.ellipse(0, 0, 11, 5.2, 0, 0, TAU); g.fill();
      g.lineCap = 'round';
      g.strokeStyle = '#5c3b22'; g.lineWidth = 4.2;
      g.beginPath(); g.moveTo(-11, 2.5); g.lineTo(11, -4); g.moveTo(-10, -4); g.lineTo(10, 2.5); g.stroke();
      g.strokeStyle = '#2a1a10'; g.lineWidth = 4.2;
      g.beginPath(); g.moveTo(-2, -1); g.lineTo(2, -1.8); g.stroke();
      g.fillStyle = '#ff9a3c';
      for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(-5 + k * 2, -1 + (k % 2), 0.8, 0, TAU); g.fill(); }
      for (const s of stones) if (s[1] >= 0) stone(s);
    }, ['#140c06', 0.6, 0.7]);
  }
  function crystalSprite() {
    return makeSprite(18, 26, 9, 13, (g) => {
      g.fillStyle = lin(g, -4, -10, 4, 10, [[0, '#ffffff'], [0.35, '#c9b8ff'], [0.7, '#7a5cf0'], [1, '#3a2496']]);
      g.beginPath(); g.moveTo(0, -10); g.lineTo(4.2, -2); g.lineTo(0, 10); g.lineTo(-4.2, -2); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 0.7;
      g.beginPath(); g.moveTo(-2, -2.5); g.lineTo(0, -8); g.stroke();
    }, ['#1a1040', 0.6, 0.6]);
  }

  LEAF_PALS.push({ d: '#4a3a1c', m: '#7a6430', l: '#a8914a', h: '#d8c27a' }, { d: '#16231f', m: '#273a33', l: '#3d5a4c', h: '#6f8f7c' });
  function deadTreeSprite(P, seed) {
    const R = seeded(seed);
    return makeSprite(124, 150, 62, 138, (g) => {
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.fillStyle = lin(g, -8, 0, 8, 0, [[0, P[0]], [0.6, P[1]], [1, P[2]]]);
      g.beginPath(); g.moveTo(-12, 2); g.quadraticCurveTo(-5, -1, -5, -14); g.lineTo(-3.6, -44); g.lineTo(3.8, -44); g.lineTo(5, -14); g.quadraticCurveTo(5.5, -1, 13, 2.5); g.quadraticCurveTo(0, 5, -12, 2); g.closePath(); g.fill();
      const branch = (x, y, a, len, w, d) => {
        const x2 = x + Math.sin(a) * len, y2 = y - Math.cos(a) * len;
        g.strokeStyle = d > 2 ? P[1] : P[0];
        g.lineWidth = w;
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo((x + x2) / 2 + (R() - 0.5) * len * 0.35, (y + y2) / 2, x2, y2); g.stroke();
        if (d > 0) { const n = 2 + (R() < 0.35 ? 1 : 0); for (let k = 0; k < n; k++) branch(x2, y2, a + (k - (n - 1) / 2) * (0.55 + R() * 0.3) + (R() - 0.5) * 0.25, len * (0.64 + R() * 0.14), w * 0.62, d - 1); }
      };
      branch(0, -42, -0.08, 28, 6.4, 4);
      branch(-2, -30, -0.9, 18, 3.4, 2);
      branch(2, -34, 0.85, 16, 3, 2);
      g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(-2.5, -2); g.lineTo(-2, -40); g.stroke();
    }, ['#0e0a08', 0.6, 0.9]);
  }
  function spireSprite(seed, pal) {
    pal = pal || ['#e8b077', '#cd8a50', '#9a5c33', '#6c3e22'];
    const R = seeded(seed);
    return makeSprite(84, 176, 42, 160, (g) => {
      const Hh = 112 + R() * 32, wB = 25 + R() * 5, wT = 11 + R() * 5, n = 9;
      const L = [], Rr = [];
      for (let k = 0; k <= n; k++) { const t = k / n, y = -t * Hh, w = wB + (wT - wB) * t; L.push([-w + (R() - 0.5) * 4, y]); Rr.push([w * 0.92 + (R() - 0.5) * 4, y]); }
      g.fillStyle = lin(g, -wB, 0, wB, 0, [[0, pal[0]], [0.42, pal[1]], [0.58, pal[2]], [1, pal[3]]]);
      g.beginPath(); g.moveTo(L[0][0], 2);
      for (const p of L) g.lineTo(p[0], p[1]);
      g.quadraticCurveTo(0, -Hh - 9, Rr[n][0], Rr[n][1]);
      for (let k = n; k >= 0; k--) g.lineTo(Rr[k][0], Rr[k][1]);
      g.lineTo(Rr[0][0], 2); g.quadraticCurveTo(0, 7, L[0][0], 2); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(80,38,16,0.38)'; g.lineWidth = 1.5;
      for (let y = -9; y > -Hh + 8; y -= 8 + R() * 7) { const t = -y / Hh, w = wB + (wT - wB) * t; g.beginPath(); g.moveTo(-w + 1, y); g.quadraticCurveTo(0, y + 3, w * 0.9 - 1, y - 1); g.stroke(); }
      g.fillStyle = 'rgba(255,226,180,0.4)'; g.beginPath(); g.ellipse(-2, -Hh + 1, wT * 0.8, 3.6, 0, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(50,22,8,0.5)'; g.lineWidth = 1;
      for (let k = 0; k < 3; k++) { const x = (R() - 0.5) * wB, y = -R() * Hh * 0.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 2, y + 10); g.lineTo(x - 1, y + 18); g.stroke(); }
    }, ['#1e0e06', 0.6, 0.9]);
  }
  function crystalClusterSprite(hex, seed) {
    const R = seeded(seed);
    return makeSprite(56, 72, 28, 62, (g) => {
      g.fillStyle = 'rgba(20,16,30,0.6)'; g.beginPath(); g.ellipse(0, 1, 16, 5, 0, 0, TAU); g.fill();
      for (const c of [[-9, 0.35, 26], [8, -0.3, 30], [-2, 0.05, 44], [13, -0.55, 20], [-14, 0.6, 18]]) {
        g.save(); g.translate(c[0], 2); g.rotate(c[1] * 0.6);
        const h = c[2] * (0.85 + R() * 0.3), w = 4 + h * 0.08;
        g.fillStyle = lin(g, -w, -h, w, 0, [[0, '#ffffff'], [0.3, shade(hex, 0.4)], [0.7, hex], [1, shade(hex, -0.5)]]);
        g.beginPath(); g.moveTo(-w, 0); g.lineTo(-w, -h * 0.75); g.lineTo(0, -h); g.lineTo(w, -h * 0.75); g.lineTo(w, 0); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.35)';
        g.beginPath(); g.moveTo(-w * 0.6, -2); g.lineTo(-w * 0.6, -h * 0.7); g.lineTo(0, -h * 0.92); g.lineTo(-w * 0.1, -h * 0.7); g.lineTo(-w * 0.1, -2); g.closePath(); g.fill();
        g.restore();
      }
    }, ['#120c22', 0.6, 0.8]);
  }
  function tombSprite(v) {
    return makeSprite(48, 60, 24, 48, (g) => {
      g.fillStyle = 'rgba(52,44,36,0.9)'; g.beginPath(); g.ellipse(0, 1, 15, 5.2, 0, 0, TAU); g.fill();
      g.fillStyle = lin(g, -12, -44, 12, 0, [[0, '#c3c8d2'], [0.5, '#8d93a2'], [1, '#585d6c']]);
      g.beginPath();
      if (v === 0) { g.moveTo(-10, 0); g.lineTo(-10, -26); g.quadraticCurveTo(-10, -40, 0, -40); g.quadraticCurveTo(10, -40, 10, -26); g.lineTo(10, 0); }
      else if (v === 1) { g.moveTo(-3.6, 0); g.lineTo(-3.6, -26); g.lineTo(-11, -26); g.lineTo(-11, -33); g.lineTo(-3.6, -33); g.lineTo(-3.6, -42); g.lineTo(3.6, -42); g.lineTo(3.6, -33); g.lineTo(11, -33); g.lineTo(11, -26); g.lineTo(3.6, -26); g.lineTo(3.6, 0); }
      else { g.moveTo(-8, 0); g.lineTo(-5.4, -40); g.lineTo(0, -46); g.lineTo(5.4, -40); g.lineTo(8, 0); }
      g.closePath(); g.fill();
      g.save(); g.clip(); g.fillStyle = 'rgba(10,10,30,0.24)'; g.fillRect(1.5, -50, 14, 52); g.restore();
      if (v === 0) { g.strokeStyle = 'rgba(40,42,56,0.6)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, -33); g.lineTo(0, -19); g.moveTo(-4.5, -28); g.lineTo(4.5, -28); g.stroke(); }
      g.strokeStyle = 'rgba(30,32,44,0.5)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-5, -10); g.lineTo(-2, -16); g.lineTo(-4, -22); g.stroke();
      g.fillStyle = 'rgba(96,140,90,0.75)'; g.beginPath(); g.ellipse(-5, -2, 5, 2.4, 0, 0, TAU); g.fill();
    }, ['#12141c', 0.65, 0.8]);
  }
  function lampSprite() {
    return makeSprite(36, 96, 18, 88, (g) => {
      g.fillStyle = '#3a3c48'; g.beginPath(); g.ellipse(0, 1, 5, 2.2, 0, 0, TAU); g.fill();
      g.fillStyle = '#2a2c36'; g.fillRect(-1.6, -64, 3.2, 66); g.fillRect(-6, -66, 12, 2.4);
      g.fillStyle = 'rgba(255,214,130,0.9)'; g.fillRect(-4.6, -78, 9.2, 11);
      g.strokeStyle = '#1e2028'; g.lineWidth = 1.4; g.strokeRect(-4.6, -78, 9.2, 11);
      g.beginPath(); g.moveTo(0, -78); g.lineTo(0, -67); g.stroke();
      g.fillStyle = '#1e2028'; g.beginPath(); g.moveTo(-6, -78); g.lineTo(0, -83); g.lineTo(6, -78); g.closePath(); g.fill();
    }, ['#0a0a10', 0.6, 0.7]);
  }
  function portalSprite() {
    return makeSprite(88, 100, 44, 92, (g) => {
      for (const x of [-24, 24]) {
        g.fillStyle = lin(g, x - 6, 0, x + 6, 0, [[0, '#c0c5d2'], [1, '#5f6475']]); g.fillRect(x - 6, -58, 12, 60);
        g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x + 1, -58, 5, 60);
        g.fillStyle = '#9da3b2'; g.fillRect(x - 7.5, -2, 15, 4);
        g.fillStyle = '#8ff0ff'; for (let k = 0; k < 3; k++) g.fillRect(x - 1.5, -48 + k * 14, 3, 6);
      }
      g.strokeStyle = '#8f95a6'; g.lineWidth = 9; g.beginPath(); g.arc(0, -56, 24, Math.PI, 0); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 2; g.beginPath(); g.arc(0, -56, 27.5, Math.PI * 1.05, Math.PI * 1.5); g.stroke();
      g.fillStyle = '#8ff0ff'; g.beginPath(); g.moveTo(0, -88); g.lineTo(4, -82); g.lineTo(0, -76); g.lineTo(-4, -82); g.closePath(); g.fill();
    }, ['#10121c', 0.6, 0.9]);
  }

  /* ---------- characters: Flare art (CC BY-SA 3.0), 8 directions ---------- */
  const FL = {};
  let flareReady = false;
  const HERO_SCALE = 0.8;
  const EN_SCALE = { goblin: 0.8, goblin_elite: 0.82, fire_ant: 0.42, skeleton: 0.66, zombie: 0.72 };
  function loadFlare(done) {
    const FD = window.FLARE_DATA || {};
    const keys = Object.keys(FD);
    let left = keys.length;
    const fin = () => { left--; if (left <= 0 && !flareReady) { flareReady = true; done(); } };
    if (!left) { flareReady = true; done(); return; }
    for (const k of keys) {
      const meta = FD[k];
      FL[k] = { img: null, sc: meta.sc || 1, anims: meta.anims };
      const ok = (im) => { FL[k].img = im; fin(); };
      if (window.__loadImage) window.__loadImage(meta.img).then(ok, fin);
      else { const im = new Image(); im.onload = () => ok(im); im.onerror = fin; im.src = meta.img; }
    }
  }
  function animIndex(A, t) {
    const n = A.n, per = Math.max(0.03, A.dur / 1000 / n);
    if (A.type === 'looped') return Math.floor(t / per) % n;
    if (A.type === 'back_forth') { const L = Math.max(1, 2 * n - 2); const k = Math.floor(t / per) % L; return k < n ? k : L - k; }
    return Math.min(n - 1, Math.floor(t / per));
  }
  function flAnim(key, an) { const E = FL[key]; return E && E.anims ? (E.anims[an] || E.anims.stance) : null; }
  function drawFlare(key, an, dir, idx, x, y, scale, alpha) {
    const E = FL[key];
    if (!E || !E.img) return false;
    const A = E.anims[an] || E.anims.stance;
    const fr = A.fr[dir][clamp(idx | 0, 0, A.n - 1)];
    const s = zoom * scale / E.sc;
    const a = alpha == null ? 1 : alpha;
    if (a !== 1) ctx.globalAlpha = a;
    ctx.drawImage(E.img, fr[0], fr[1], fr[2], fr[3], x - fr[4] * s, y - fr[5] * s, fr[2] * s, fr[3] * s);
    if (a !== 1) ctx.globalAlpha = 1;
    return true;
  }

  let assetKey = 0;
  function ensureAssets() {
    const target = Math.min(2.4, Math.max(0.6, DPR * 1.1));
    if (assetKey && Math.abs(target - S) / S < 0.05) return;
    S = target;
    SG = Math.min(1.4, DPR * 0.72);
    assetKey++;
    buildTextures();
    const glowCols = { warm: '#ffb36b', amber: '#ffc04d', violet: '#a184ff', gold: '#ffd66b', cyan: '#8ff0ff', mint: '#7dffb0', lime: '#d2ff7a', white: '#ffffff', red: '#ff5a6a', fly: '#e2ff8a' };
    for (const k in glowCols) GLOW[k] = glowSprite(glowCols[k], 18);
    RING.blade = ringSprite('#ffc04d'); RING.arcane = ringSprite('#b9a6ff'); RING.white = ringSprite('#ffffff');
    RUNE.amber = runeSprite('#ffc04d'); RUNE.violet = runeSprite('#b9a6ff'); RUNE.gold = runeSprite('#ffd66b'); RUNE.cyan = runeSprite('#8ff0ff');
    SPR.shadow = makeSprite(48, 24, 24, 12, (g) => {
      g.scale(1, 0.5);
      g.fillStyle = rad(g, 0, 0, 24, [[0, 'rgba(6,8,20,0.55)'], [0.55, 'rgba(6,8,20,0.28)'], [1, 'rgba(6,8,20,0)']]);
      g.beginPath(); g.arc(0, 0, 24, 0, TAU); g.fill();
    });
    SPR.trees = [broadleafSprite(LEAF_PALS[0], 101), broadleafSprite(LEAF_PALS[1], 202), broadleafSprite(LEAF_PALS[2], 303), coniferSprite(LEAF_PALS[3], 404), coniferSprite(LEAF_PALS[4], 505)];
    SPR.bushes = [bushSprite(LEAF_PALS[0], 11, '#e8475e'), bushSprite(LEAF_PALS[1], 22, null), bushSprite(LEAF_PALS[0], 33, '#ffffff')];
    SPR.rocks = [rockSprite(7, true), rockSprite(8, false), rockSprite(9, true)];
    SPR.tent = tentSprite();
    SPR.crate = crateSprite();
    SPR.barrel = barrelSprite();
    SPR.bench = benchSprite();
    SPR.pole = poleSprite();
    SPR.fireBase = fireBaseSprite();
    SPR.crystal = crystalSprite();
    SPR.trees.push(deadTreeSprite(['#8f806e', '#5f5244', '#382e26'], 606), deadTreeSprite(['#6a6876', '#44424f', '#25242d'], 707));
    SPR.bushes.push(bushSprite(LEAF_PALS[5], 44, null), bushSprite(LEAF_PALS[6], 55, '#b9a6ff'));
    SPR.spires = [spireSprite(31), spireSprite(57), spireSprite(83, ['#9a96b4', '#77738f', '#55516d', '#34314a']), spireSprite(97, ['#8e8aa8', '#6c6886', '#4c4864', '#2e2b42'])];
    SPR.crystals = [crystalClusterSprite('#9b7bff', 11), crystalClusterSprite('#4fd8e8', 12)];
    SPR.tombs = [tombSprite(0), tombSprite(1), tombSprite(2)];
    SPR.lamp = lampSprite();
    SPR.portal = portalSprite();
    chunkCache.clear();
  }
