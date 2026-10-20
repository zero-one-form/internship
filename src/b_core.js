(() => {
  'use strict';
  const TEST = !!window.__TEST__;
  const mk = window.__makeCanvas || function (w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  const $ = (id) => document.getElementById(id);
  const rand = (a, b) => a + Math.random() * (b - a);
  const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const hyp = Math.hypot;
  const TAU = Math.PI * 2;
  const FONT = '"M PLUS Rounded 1c","Hiragino Maru Gothic ProN","Hiragino Sans","Noto Sans JP",sans-serif';
  const SAVE_KEY = 'twinsoul-save-v1';
  const MORPH_CD = 1.0, POT_CD = 1.5, POT_MAX = 30, POP_CAP = 85, POTION_PRICE = 20, DAY_LEN = 300;

  function seeded(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash2(i, j, s) {
    let h = Math.imul(i | 0, 374761393) ^ Math.imul(j | 0, 668265263) ^ Math.imul((s | 0) + 1, 2246822519);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function hash1(v) { const s = Math.sin(v * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mix(a, b, t) {
    const A = hexRgb(a), B = hexRgb(b);
    return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' + Math.round(A[1] + (B[1] - A[1]) * t) + ',' + Math.round(A[2] + (B[2] - A[2]) * t) + ')';
  }
  function shade(h, amt) { return amt >= 0 ? mix(h, '#ffffff', amt) : mix(h, '#000000', -amt); }
  function rgba(h, a) { const A = hexRgb(h); return 'rgba(' + A[0] + ',' + A[1] + ',' + A[2] + ',' + a + ')'; }
  function rad(g, x, y, r, stops) { const gr = g.createRadialGradient(x, y, 0, x, y, Math.max(0.01, r)); for (const s of stops) gr.addColorStop(s[0], s[1]); return gr; }
  function lin(g, x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); for (const s of stops) gr.addColorStop(s[0], s[1]); return gr; }

  /* ================= world ================= */
  const MW = 56, MH = 56;
  const CAMP = { x: 13.5, y: 13.5, r: 3.4 };
  const SPAWN = { x: CAMP.x + 1.7, y: CAMP.y + 1.5 };
  const T_GRASS = 0, T_PATH = 1, T_WATER = 2, T_CAMP = 3, T_PIT = 4;
  const tile = new Uint8Array(MW * MH);
  const solid = new Uint8Array(MW * MH);
  const reachable = new Uint8Array(MW * MH);
  const wdepth = new Uint8Array(MW * MH);
  const reachList = [], props = [], waterList = [], shoreSegs = [];
  const idx = (i, j) => j * MW + i;
  const inB = (i, j) => i >= 0 && j >= 0 && i < MW && j < MH;
  const tileAt = (i, j) => (inB(i, j) ? tile[idx(i, j)] : -1);
  const blockedTile = (i, j) => !inB(i, j) || solid[idx(i, j)] === 1;
  function blockedAt(x, y, r) {
    return blockedTile(Math.floor(x - r), Math.floor(y - r)) ||
      blockedTile(Math.floor(x + r), Math.floor(y - r)) ||
      blockedTile(Math.floor(x - r), Math.floor(y + r)) ||
      blockedTile(Math.floor(x + r), Math.floor(y + r));
  }
  const inCamp = (x, y) => hyp(x - CAMP.x, y - CAMP.y) < CAMP.r;

  const MAPS = [
    { name: '始まりの森', rec: '推奨Lv1〜', seed: 7331, biome: 'forest', base: 1, step: 7, ponds: 7, treeP: 0.065, elite: 0.16, camp: [13.5, 13.5],
      portals: [{ x: 49.5, y: 30.5, to: 1, arrive: 0, label: '赤砂の峡谷へ' }, { x: 19.5, y: 7.5, to: 3, arrive: 0, label: '深淵の回廊へ' }], extra: [[9, 51], [44, 48], [46, 9]] },
    { name: '赤砂の峡谷', rec: '推奨Lv7〜', seed: 9157, biome: 'canyon', base: 6, step: 6, ponds: 2, treeP: 0.045, elite: 0.2, camp: [11.5, 27.5],
      kinds: [['ant', 0.45], ['goblin', 0.3], ['undead', 0.25]],
      portals: [{ x: 5.5, y: 27.5, to: 0, arrive: 0, label: '始まりの森へ' }, { x: 44.5, y: 49.5, to: 2, arrive: 0, label: '霧の墓所へ' }], extra: [[48, 10], [28, 8]] },
    { name: '霧の墓所', rec: '推奨Lv13〜', seed: 4421, biome: 'grave', base: 12, step: 6, ponds: 4, treeP: 0.06, elite: 0.26, camp: [27.5, 12.5],
      kinds: [['undead', 0.75], ['ant', 0.15], ['goblin', 0.1]],
      portals: [{ x: 27.5, y: 5.5, to: 1, arrive: 1, label: '赤砂の峡谷へ' }], extra: [[10, 46], [48, 46], [28, 50]] },
    { name: '深淵の回廊', rec: '', seed: 1000, biome: 'cave', base: 4, step: 99, ponds: 3, treeP: 0.09, elite: 0.25, camp: [12.5, 12.5],
      kinds: [['undead', 0.5], ['ant', 0.3], ['goblin', 0.2]],
      portals: [{ x: 7.5, y: 7.5, to: 0, arrive: 1, label: '地上へ戻る' }], extra: [[46, 46], [46, 12], [12, 46], [30, 30]] }
  ];
  const BIOMES = {
    forest: { water: '#3f93a6', tuft: ['#2a5836', '#3d7944', '#5a9a51', '#8cc266'], tuftN: 4, flowers: 0.2, flowerCols: ['#ffffff', '#ffe27a', '#ffb3d1', '#b8c8ff'], reeds: true, tint: [1, 1, 1], minDark: 0,
      mm: { g: [70, 122, 72], p: [160, 128, 86], w: [64, 146, 176], s: [28, 70, 46], c: [196, 146, 96] } },
    canyon: { water: '#4aa59a', tuft: ['#6a5a2c', '#8f7a3a', '#b59d52', '#d8c27a'], tuftN: 2, flowers: 0.05, flowerCols: ['#ff7a5a', '#ffd166'], reeds: false, tint: [1, 0.95, 0.88], minDark: 0,
      mm: { g: [196, 140, 88], p: [150, 84, 56], w: [74, 165, 154], s: [110, 62, 34], c: [170, 120, 80] } },
    cave: { sky: ['#040308', '#0e0b18'], water: '#2a8f9a', tuft: ['#2a2838', '#3a3650', '#4c4868', '#6a6488'], tuftN: 1, flowers: 0.03, flowerCols: ['#9ff3ff', '#c9a6ff'], reeds: false, tint: [0.62, 0.64, 0.86], minDark: 0.82,
      mm: { g: [62, 60, 80], p: [96, 92, 110], w: [42, 143, 154], s: [30, 28, 40], c: [120, 100, 140] } },
    grave: { sky: ['#18202c', '#2e3a46'], water: '#3d6a5c', tuft: ['#1f2d27', '#2c3f36', '#3f5a4c', '#5f7a68'], tuftN: 3, flowers: 0.07, flowerCols: ['#e8e4ff', '#b9a6ff'], reeds: true, tint: [0.8, 0.85, 0.96], minDark: 0.38,
      mm: { g: [58, 76, 62], p: [112, 114, 122], w: [61, 106, 92], s: [26, 32, 30], c: [110, 94, 80] } }
  };
  let curMap = 0, portals = [], transit = false, portalLock = true;
  function biomeProp(biome, edge, R, i, j) {
    const x = i + 0.5 + (R() - 0.5) * 0.2, y = j + 0.5 + (R() - 0.5) * 0.2, s = 0.88 + R() * 0.28, ph = R() * TAU;
    if (ABYSS_T[biome]) return abyssProp(ABYSS_T[biome], edge, R, i, j);
    if (biome === 'canyon') {
      const r = R();
      if (r < 0.28) return { kind: 'spire', v: R() < 0.5 ? 0 : 1, x: i + 0.5, y: j + 0.5, s: 0.85 + R() * 0.35, ph };
      if (r < 0.75) return { kind: 'tree', v: 5, x, y, s, ph };
      return { kind: 'bush', v: 3, x, y, s, ph };
    }
    if (biome === 'cave') {
      const r = R();
      if (r < 0.5) return { kind: 'spire', v: R() < 0.5 ? 2 : 3, x: i + 0.5, y: j + 0.5, s: 0.7 + R() * 0.35, ph };
      if (r < 0.66 && edge >= 3) return { kind: 'crystal', v: R() < 0.5 ? 0 : 1, x: i + 0.5, y: j + 0.5, s: 0.8 + R() * 0.4, ph };
      if (r < 0.72 && edge >= 4) return { kind: 'lamp', v: 0, x: i + 0.5, y: j + 0.5, s: 1, ph };
      return { kind: 'rock', v: Math.floor(R() * 3), x: i + 0.5, y: j + 0.5, s: 0.9 + R() * 0.4, ph: 0 };
    }
    if (biome === 'grave') {
      const r = R();
      if (r < 0.4 && edge >= 3) return { kind: 'tomb', v: Math.floor(R() * 3), x: i + 0.5, y: j + 0.5, s: 0.9 + R() * 0.2, ph };
      if (r < 0.47 && edge >= 4) return { kind: 'lamp', v: 0, x: i + 0.5, y: j + 0.5, s: 1, ph };
      if (r < 0.86) return { kind: 'tree', v: R() < 0.5 ? 5 : 6, x, y, s, ph };
      return { kind: 'bush', v: 4, x, y, s, ph };
    }
    const zone = Math.sin(i * 0.17 + 0.8) + Math.cos(j * 0.15 - 1.1);
    const conifer = R() < (zone > 0.8 ? 0.75 : 0.14);
    const bush = !conifer && edge >= 3 && R() < 0.2;
    return { kind: bush ? 'bush' : 'tree', v: bush ? Math.floor(R() * 3) : conifer ? 3 + Math.floor(R() * 2) : Math.floor(R() * 3), x, y, s, ph };
  }
  function buildMap(id) {
    const M = MAPS[id];
    curMap = id;
    tile.fill(0); solid.fill(0); reachable.fill(0); wdepth.fill(0);
    reachList.length = 0; props.length = 0; waterList.length = 0; shoreSegs.length = 0;
    CAMP.x = M.camp[0]; CAMP.y = M.camp[1];
    SPAWN.x = CAMP.x + 1.7; SPAWN.y = CAMP.y + 1.5;
    portals = M.portals.map((p) => Object.assign({}, p));
    const R = seeded(M.seed);
    const sh = new Float32Array(MW * MH);
    for (let j = 0; j < MH; j++) {
      for (let i = 0; i < MW; i++) {
        sh[idx(i, j)] = (Math.sin(i * 0.37 + j * 0.21) + Math.sin(i * 0.13 - j * 0.41)) * 0.35 + (R() - 0.5) * 0.5;
        if (hyp(i + 0.5 - CAMP.x, j + 0.5 - CAMP.y) < CAMP.r) tile[idx(i, j)] = T_CAMP;
      }
    }
    const LAY = id === 3 ? buildLayout(M, R) : null;
    const ends = portals.map((p) => [p.x, p.y]).concat(M.extra);
    for (const end of ends) {
      let x = CAMP.x, y = CAMP.y;
      for (let st = 0; st < 700; st++) {
        const dx = end[0] - x, dy = end[1] - y, d = hyp(dx, dy);
        if (d < 0.8) break;
        x += dx / d * 0.55 + (R() - 0.5) * 0.6;
        y += dy / d * 0.55 + (R() - 0.5) * 0.6;
        const i = Math.floor(x), j = Math.floor(y);
        for (const o of [[0, 0], [1, 0], [0, 1]]) if (inB(i + o[0], j + o[1]) && tile[idx(i + o[0], j + o[1])] === T_GRASS && (!LAY || LAY.open[idx(i + o[0], j + o[1])])) tile[idx(i + o[0], j + o[1])] = T_PATH;
      }
    }
    for (const p of portals) {
      for (let j = Math.floor(p.y - 2); j <= p.y + 2; j++) for (let i = Math.floor(p.x - 2); i <= p.x + 2; i++) {
        if (inB(i, j) && hyp(i + 0.5 - p.x, j + 0.5 - p.y) < 1.9 && tile[idx(i, j)] === T_GRASS) tile[idx(i, j)] = T_PATH;
      }
    }
    for (let k = 0; k < (LAY ? 0 : M.ponds); k++) {
      let cx = 0, cy = 0;
      for (let t = 0; t < 80; t++) {
        cx = 7 + R() * (MW - 14); cy = 7 + R() * (MH - 14);
        if (hyp(cx - CAMP.x, cy - CAMP.y) > CAMP.r + 8 && !portals.some((p) => hyp(p.x - cx, p.y - cy) < 7)) break;
      }
      const rx = 1.6 + R() * 2.6, ry = 1.4 + R() * 2.4;
      for (let j = Math.floor(cy - ry - 1); j <= Math.ceil(cy + ry + 1); j++) {
        for (let i = Math.floor(cx - rx - 1); i <= Math.ceil(cx + rx + 1); i++) {
          if (!inB(i, j) || tile[idx(i, j)] !== T_GRASS) continue;
          const dx = (i + 0.5 - cx) / rx, dy = (j + 0.5 - cy) / ry;
          if (dx * dx + dy * dy < 1 + (R() - 0.5) * 0.3) { tile[idx(i, j)] = T_WATER; solid[idx(i, j)] = 1; }
        }
      }
    }
    for (let j = 0; j < MH; j++) {
      for (let i = 0; i < MW; i++) {
        if (tile[idx(i, j)] !== T_GRASS) continue;
        if (hyp(i + 0.5 - CAMP.x, j + 0.5 - CAMP.y) < CAMP.r + 1.6) continue;
        if (portals.some((p) => hyp(p.x - i - 0.5, p.y - j - 0.5) < 2.8)) continue;
        const edge = Math.min(i, j, MW - 1 - i, MH - 1 - j);
        const p = LAY && LAY.rim[idx(i, j)] ? LAY.rimP : edge < 2 ? 0.62 : edge < 3 ? 0.26 : LAY ? M.treeP * 0.3 : M.treeP + Math.max(0, sh[idx(i, j)]) * 0.07;
        const r = R();
        if (r < p) { solid[idx(i, j)] = 1; props.push(biomeProp(M.biome, edge, R, i, j)); }
        else if (r < p + (M.biome === 'canyon' ? 0.03 : 0.014)) { solid[idx(i, j)] = 1; props.push({ kind: 'rock', v: Math.floor(R() * 3), x: i + 0.5, y: j + 0.5, s: 0.85 + R() * 0.35, ph: 0 }); }
      }
    }
    if (LAY) pillarProps(M, R);
    const campProps = [['fire', 0, 0], ['tent', -1.6, -1.6], ['banner', 1.9, -1.5], ['crate', -2.3, 0.4], ['crate', -2.2, -0.6], ['barrel', -1.4, 2.0], ['bench', 0.3, -2.4]];
    if (M.biome === 'grave') campProps.push(['lamp', 2.5, 1.0], ['lamp', -0.6, 2.7]);
    if (M.biome === 'cave' || ABYSS_T[M.biome]) { campProps.splice(1); campProps.push(['lamp', 2.2, 1.0], ['lamp', -1.0, 2.4]); }
    for (const cp of campProps) {
      const x = CAMP.x + cp[1], y = CAMP.y + cp[2];
      props.push({ kind: cp[0], v: 0, x, y, s: 1, ph: R() * TAU });
      solid[idx(Math.floor(x), Math.floor(y))] = 1;
    }
    if (id === 0) for (const n of NPCS) { const x = CAMP.x + n.dx, y = CAMP.y + n.dy; props.push({ kind: 'npc', v: 0, role: n.role, x, y, s: 1, ph: R() * TAU }); solid[idx(Math.floor(x), Math.floor(y))] = 1; }
    for (const p of portals) props.push({ kind: 'portal', v: 0, x: p.x, y: p.y, s: 1, ph: 0 });
    for (const p of props) p.depth = p.x + p.y;
    const q = [];
    for (let j = 0; j < MH; j++) {
      for (let i = 0; i < MW; i++) {
        if (tile[idx(i, j)] !== T_WATER) continue;
        waterList.push(idx(i, j));
        const nearLand = tileAt(i + 1, j) !== T_WATER || tileAt(i - 1, j) !== T_WATER || tileAt(i, j + 1) !== T_WATER || tileAt(i, j - 1) !== T_WATER;
        if (nearLand) { wdepth[idx(i, j)] = 1; q.push(idx(i, j)); } else wdepth[idx(i, j)] = 255;
      }
    }
    for (let h = 0; h < q.length; h++) {
      const c = q[h], ci = c % MW, cj = (c / MW) | 0;
      for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = ci + d[0], nj = cj + d[1];
        if (tileAt(ni, nj) !== T_WATER) continue;
        const n = idx(ni, nj);
        if (wdepth[n] === 255) { wdepth[n] = wdepth[c] + 1; q.push(n); }
      }
    }
    const start = idx(Math.floor(SPAWN.x), Math.floor(SPAWN.y));
    const stack = [start];
    reachable[start] = 1;
    while (stack.length) {
      const c = stack.pop();
      reachList.push(c);
      const ci = c % MW, cj = (c / MW) | 0;
      for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = ci + d[0], nj = cj + d[1];
        if (!inB(ni, nj)) continue;
        const n = idx(ni, nj);
        if (reachable[n] || solid[n]) continue;
        reachable[n] = 1;
        stack.push(n);
      }
    }
    buildMinimapBase();
  }

  /* ================= pathfinding ================= */
  class Heap {
    constructor() { this.k = []; this.v = []; }
    get size() { return this.k.length; }
    push(key, val) {
      const k = this.k, v = this.v;
      let i = k.length;
      k.push(key); v.push(val);
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (v[p] <= val) break;
        k[i] = k[p]; v[i] = v[p];
        i = p;
      }
      k[i] = key; v[i] = val;
    }
    pop() {
      const k = this.k, v = this.v;
      const top = k[0];
      const lk = k.pop(), lv = v.pop();
      const n = k.length;
      if (n > 0) {
        let i = 0;
        for (;;) {
          const l = 2 * i + 1, r = l + 1;
          let m = i, mv = lv;
          if (l < n && v[l] < mv) { m = l; mv = v[l]; }
          if (r < n && v[r] < mv) { m = r; mv = v[r]; }
          if (m === i) break;
          k[i] = k[m]; v[i] = v[m];
          i = m;
        }
        k[i] = lk; v[i] = lv;
      }
      return top;
    }
  }
  const NB8 = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.4142], [1, -1, 1.4142], [-1, 1, 1.4142], [-1, -1, 1.4142]];
  const gS = new Float32Array(MW * MH);
  const from = new Int32Array(MW * MH);
  const stG = new Uint32Array(MW * MH);
  const stC = new Uint32Array(MW * MH);
  let stamp = 0;
  function octile(ai, aj, bi, bj) {
    const dx = Math.abs(ai - bi), dy = Math.abs(aj - bj);
    return dx + dy - 0.5858 * Math.min(dx, dy);
  }
  function nearestOpen(gi, gj) {
    let best = null, bd = 1e9;
    for (let r = 1; r <= 3; r++) {
      for (let dj = -r; dj <= r; dj++) {
        for (let di = -r; di <= r; di++) {
          const i = gi + di, j = gj + dj;
          if (!blockedTile(i, j) && reachable[idx(i, j)]) {
            const d = di * di + dj * dj;
            if (d < bd) { bd = d; best = [i, j]; }
          }
        }
      }
      if (best) return best;
    }
    return null;
  }
  function lineClear(ax, ay, bx, by) {
    const d = hyp(bx - ax, by - ay), n = Math.max(1, Math.ceil(d / 0.2));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      if (blockedAt(ax + (bx - ax) * t, ay + (by - ay) * t, 0.21)) return false;
    }
    return true;
  }
  function smoothPath(ax, ay, pts) {
    const out = [];
    let i = 0;
    while (i < pts.length) {
      let j = Math.min(pts.length - 1, i + 12);
      while (j > i && !lineClear(ax, ay, pts[j].x, pts[j].y)) j--;
      out.push(pts[j]);
      ax = pts[j].x; ay = pts[j].y;
      i = j + 1;
    }
    return out;
  }
  function findPath(sx0, sy0, gx, gy) {
    let gi = Math.floor(gx), gj = Math.floor(gy);
    if (blockedTile(gi, gj) || !reachable[idx(gi, gj)]) {
      const alt = nearestOpen(gi, gj);
      if (!alt) return null;
      gi = alt[0]; gj = alt[1]; gx = gi + 0.5; gy = gj + 0.5;
    } else if (blockedAt(gx, gy, 0.22)) {
      gx = gi + 0.5; gy = gj + 0.5;
    }
    const si = Math.floor(sx0), sj = Math.floor(sy0);
    if (si === gi && sj === gj) return [{ x: gx, y: gy }];
    stamp++;
    const start = idx(si, sj), goal = idx(gi, gj);
    const open = new Heap();
    gS[start] = 0; stG[start] = stamp; from[start] = -1;
    open.push(start, octile(si, sj, gi, gj));
    let found = false, guard = 0;
    while (open.size && guard++ < 9000) {
      const c = open.pop();
      if (stC[c] === stamp) continue;
      stC[c] = stamp;
      if (c === goal) { found = true; break; }
      const ci = c % MW, cj = (c / MW) | 0;
      for (const nb of NB8) {
        const ni = ci + nb[0], nj = cj + nb[1];
        if (blockedTile(ni, nj)) continue;
        if (nb[0] !== 0 && nb[1] !== 0 && (blockedTile(ci + nb[0], cj) || blockedTile(ci, cj + nb[1]))) continue;
        const q = idx(ni, nj);
        if (stC[q] === stamp) continue;
        const ng = gS[c] + nb[2];
        if (stG[q] !== stamp || ng < gS[q]) {
          stG[q] = stamp; gS[q] = ng; from[q] = c;
          open.push(q, ng + octile(ni, nj, gi, gj));
        }
      }
    }
    if (!found) return null;
    const pts = [];
    for (let c = goal; c !== start && c !== -1; c = from[c]) pts.push({ x: (c % MW) + 0.5, y: ((c / MW) | 0) + 0.5 });
    pts.reverse();
    pts[pts.length - 1] = { x: gx, y: gy };
    return smoothPath(sx0, sy0, pts);
  }

  /* ================= game state ================= */
  const STAT_KEYS = ['str', 'agi', 'vit', 'int', 'luk'];
  const STAT_INFO = {
    str: { name: '力', hint: '剣の型の攻撃力' },
    agi: { name: '素早さ', hint: '攻撃と移動の速さ' },
    vit: { name: '体力', hint: '最大HPと自然回復' },
    int: { name: '知力', hint: '術の型の攻撃力と最大MP' },
    luk: { name: '運', hint: '会心の出やすさ' }
  };
  const FORMS = {
    blade: { name: '剣の型', skill: '旋風斬', desc: '周りの敵をまとめて斬る', mp: 10, cd: 2.4 },
    arcane: { name: '術の型', skill: '連鎖雷', desc: '雷が近くの敵へ次々と跳ねる', mp: 14, cd: 3.0 }
  };
  const ETYPES = {
    goblin: { hp: 30, dmg: 5, sp: 1.6, exp: 8, aggro: 4.2, atk: 1.25, r: 0.32, armor: 0, vars: 1 },
    ant: { hp: 22, dmg: 6, sp: 2.6, exp: 10, aggro: 6.0, atk: 1.0, r: 0.34, armor: 0, vars: 1 },
    undead: { hp: 78, dmg: 9, sp: 1.15, exp: 19, aggro: 3.6, atk: 1.45, r: 0.38, armor: 2, vars: 2 }
  };
  function defaultProg() {
    return { level: 1, exp: 0, stats: { str: 5, agi: 5, vit: 5, int: 5, luk: 5 }, sp: 0, kp: 0, skill: { whirl: 1, chain: 1, sprint: 1 }, potions: 5, gold: 0, form: 'blade', intro: false, map: 0, deep: 0, floor: 1, q: { main: 0, mp: 0, ma: false, mn: false, act: [], board: [] }, opt: { autoPot: true, autoTarget: true, autoSell: false, stick: true, shake: true, op: true, bgm: 0.6, se: 0.8 }, cleared: 0, inv: [], eq: { sword: null, staff: null, head: null, body: null, acc: null }, starter: false, rank: 0, rankMax: 0, rankDeep: [], bless: [], phx: false, cls: { blade: null, arcane: null }, pets: null, rec: null, aria: null };
  }
  const prog = defaultProg();
  const player = {
    x: SPAWN.x, y: SPAWN.y, hp: 1, mp: 1, form: 'blade', path: [], target: null,
    atkT: 0, swingT: 0, swingDur: 0.2, faceLeft: false, back: false, dir: 6, deadT: 0, moving: false, anim: 0, walkPhase: 0,
    cd: {}, auraT: 0, auraLv: 0, shiftT: 0, morphT: 0, potT: 0, hurtT: 0, repathT: 0, dead: false
  };
  const cam = { x: SPAWN.x, y: SPAWN.y };
  const enemies = [], shots = [], fx = [], texts = [], parts = [];
  const drag = { active: false, pending: false, id: null, wx: 0, wy: 0, t: 0 };
  let marker = null, D = null, paused = true, time = 0, spawnT = 1.4, saveT = 8, packSeq = 0, goldPending = 0, goldT = 0;
  let dayT = DAY_LEN * 0.36, envDark = 0, emberT = 0, leafT = 0, dustT = 0, magicT = 0;
  const expNeed = (L) => Math.floor(22 * Math.pow(L, 1.6)) + 8;
  const DIR_OF_SECTOR = [5, 6, 7, 0, 1, 2, 3, 4];
  function dirFrom(dx, dy) { const k = ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8; return DIR_OF_SECTOR[k]; }
  const LUNGE = 0.36, DIE_T = 0.95;

  function derivedBase(form) {
    const s0 = prog.stats, G = GEAR, L = prog.level, blade = form === 'blade';
    const s = { str: s0.str + G.str, agi: s0.agi + G.agi, vit: s0.vit + G.vit, int: s0.int + G.int, luk: s0.luk + G.luk };
    const lv = (id) => slv(id);
    let atk = blade ? (8 + s.str * 2.2 + L * 1.6 + G.swordAtk) * (1 + 0.04 * lv('sword')) : (6 + s.int * 2.4 + L * 1.5 + G.staffAtk) * (1 + 0.04 * lv('amp'));
    atk *= 1 + G.atkPct / 100;
    const iv0 = blade ? 0.86 : 1.06, ivLo = blade ? 0.32 : 0.42, knee = (iv0 - ivLo) / 0.011;
    let interval = Math.max(ivLo, iv0 - s.agi * 0.011) / (1 + Math.max(0, s.agi - knee) * 0.004) / (1 + G.aspd / 100);
    interval = Math.max(interval, ivLo * 0.55);
    if (blade && player.auraT > 0) { atk *= 1.2 + 0.03 * player.auraLv; interval *= 0.8; }
    if (player.shiftT > 0) atk *= 1 + 0.03 * lv('shift');
    if (player.frenzyT > 0) { atk *= 1.25; interval *= 0.77; }
    return {
      maxHp: Math.round(90 + s.vit * 12 + L * 10 + 14 * lv('iron') + G.hp + G.hpB),
      maxMp: Math.round(30 + s.int * 5 + L * 3 + 8 * lv('medit') + G.mp + G.mpB),
      atk, interval,
      range: blade ? 1.15 : 5.2,
      crit: Math.min(0.75, 0.05 + s.luk * 0.006 + 0.015 * lv(blade ? 'keen' : 'focus') + G.crit / 100),
      critMul: 1.8 + 0.06 * lv(blade ? 'keen' : 'focus') + G.critDmg / 100,
      speed: (2.9 + s.agi * 0.025) * (player.sprintT > 0 ? 1.4 + 0.03 * lv('sprint') : 1) * (1 + G.mspd / 100) * (player.frenzyT > 0 ? 1.2 : 1),
      guard: Math.min(0.75, (blade ? 0.25 + 0.02 * lv('iron') : 0) + (player.cryT > 0 ? 0.1 : 0) + (G.dr + G.drB) / 100),
      dbl: blade ? 0.03 * lv('twin') : 0,
      steal: (blade ? 0.01 * lv('leech') : 0) + G.leech / 100,
      shield: blade ? 0 : 0.04 * lv('mshield'),
      cdr: Math.min(0.6, (blade ? 0 : 0.03 * lv('quick')) + G.cdr / 100),
      mpRegen: 0.35 * lv('medit') + G.mpr,
      morphCd: MORPH_CD * (1 - 0.05 * lv('shift'))
    };
  }
  function refreshD() { D = derived(player.form); }

  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(prog)); } catch (err) { /* storage unavailable */ }
  }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (!s || typeof s !== 'object') return;
      const num = (v, d, lo, hi) => (typeof v === 'number' && isFinite(v) ? clamp(Math.floor(v), lo, hi) : d);
      prog.level = num(s.level, 1, 1, 999);
      prog.exp = num(s.exp, 0, 0, 1e9);
      for (const k of STAT_KEYS) prog.stats[k] = num(s.stats && s.stats[k], 5, 1, 9999);
      prog.sp = num(s.sp, 0, 0, 9999);
      prog.kp = num(s.kp, 0, 0, 999);
      const sk = (s.skill && typeof s.skill === 'object') ? s.skill : {};
      const ids = SK.map((x) => x.id);
      prog.map = num(s.map, 0, 0, MAPS.length - 1);
      for (const id of ids) prog.skill[id] = num(sk[id], 0, 0, 10);
      if (typeof sk.blade === 'number') prog.skill.whirl = Math.max(prog.skill.whirl, num(sk.blade, 1, 1, 10));
      if (typeof sk.arcane === 'number') prog.skill.chain = Math.max(prog.skill.chain, num(sk.arcane, 1, 1, 10));
      prog.skill.whirl = Math.max(1, prog.skill.whirl);
      prog.skill.chain = Math.max(1, prog.skill.chain);
      prog.skill.sprint = Math.max(1, prog.skill.sprint);
      prog.potions = num(s.potions, 5, 0, 999);
      prog.gold = num(s.gold, 0, 0, 1e9);
      prog.form = s.form === 'arcane' ? 'arcane' : 'blade';
      prog.intro = !!s.intro;
      prog.starter = !!s.starter;
      prog.deep = num(s.deep, 0, 0, 9999);
      prog.floor = num(s.floor, 1, 1, 50);
      prog.rank = num(s.rank, 0, 0, 10); prog.rankMax = num(s.rankMax, 0, 0, 10); prog.rank = Math.min(prog.rank, prog.rankMax);
      prog.rankDeep = Array.isArray(s.rankDeep) ? s.rankDeep.slice(0, 11).map((v) => num(v, 0, 0, 50)) : [];
      prog.bless = Array.isArray(s.bless) ? s.bless.filter((v) => typeof v === 'string' && v.length < 12).slice(0, 60) : [];
      prog.phx = !!s.phx;
      { const pp = s.pets && typeof s.pets === 'object' ? s.pets : {}; const okSp = ['slime', 'fox', 'bird', 'wolf', 'dragon'];
        prog.pets = { eggs: Array.isArray(pp.eggs) ? pp.eggs.filter((e) => e && typeof e === 'object').slice(0, 5).map((e) => ({ p: num(e.p, 0, 0, 999), id: num(e.id, 1, 1, 1e15) })) : [],
          list: Array.isArray(pp.list) ? pp.list.filter((p) => p && okSp.includes(p.sp)).slice(0, 12).map((p) => ({ id: num(p.id, 1, 1, 1e15), sp: p.sp, lvl: num(p.lvl, 1, 1, 30), exp: num(p.exp, 0, 0, 1e6), shiny: !!p.shiny, name: String(p.name || 'ルル').slice(0, 12) })) : [],
          active: typeof pp.active === 'number' ? pp.active : null, ride: !!pp.ride }; }
      { const cc = s.cls && typeof s.cls === 'object' ? s.cls : {}; prog.cls = { blade: ['saint', 'guard'].includes(cc.blade) ? cc.blade : null, arcane: ['star', 'soul'].includes(cc.arcane) ? cc.arcane : null }; }
      { const rr = s.rec && typeof s.rec === 'object' ? s.rec : {}; prog.rec = {}; for (const k of ['kills', 'elites', 'bosses', 'legends', 'combo', 'chests', 'goblins', 'deaths', 'dodges', 'reacts', 'breaks', 'aria', 'floors']) prog.rec[k] = num(rr[k], 0, 0, 1e9); prog.rec.play = typeof rr.play === 'number' && isFinite(rr.play) ? Math.max(0, rr.play) : 0; }
      prog.cleared = typeof s.cleared === 'number' && isFinite(s.cleared) ? clamp(Math.floor(s.cleared), 0, 9999) : 0;
      if (typeof prog.deep === 'number') prog.deep = Math.min(50, prog.deep);
      const oo = s.opt && typeof s.opt === 'object' ? s.opt : {};
      prog.opt = { autoPot: oo.autoPot !== false, autoTarget: oo.autoTarget !== false, autoSell: !!oo.autoSell, stick: oo.stick !== false, lite: !!oo.lite, shake: oo.shake !== false, op: oo.op !== false, bgm: typeof oo.bgm === 'number' && isFinite(oo.bgm) ? clamp(oo.bgm, 0, 1) : 0.6, se: typeof oo.se === 'number' && isFinite(oo.se) ? clamp(oo.se, 0, 1) : 0.8, ariaOfs: typeof oo.ariaOfs === 'number' && isFinite(oo.ariaOfs) ? clamp(oo.ariaOfs, -0.3, 0.3) : 0 };
      const qq = s.q && typeof s.q === 'object' ? s.q : {};
      const okB = (b) => b && typeof b === 'object' && ['kill', 'elite', 'floor'].includes(b.k) && typeof b.n === 'number' && isFinite(b.n) && b.rew && typeof b.rew === 'object' && (b.k !== 'kill' || ['goblin', 'ant', 'undead'].includes(b.what));
      const fixB = (b) => ({ k: b.k, what: b.k === 'kill' ? b.what : undefined, n: num(b.n, 1, 1, 99), p: num(b.p, 0, 0, 99), nt: !!b.nt, rew: { gold: num(b.rew.gold, 0, 0, 1e7), exp: num(b.rew.exp, 0, 0, 1e9), pot: num(b.rew.pot, 0, 0, 99), item: num(b.rew.item, 0, 0, 3) } });
      prog.q = { main: num(qq.main, 0, 0, 99), mp: num(qq.mp, 0, 0, 1e6), ma: !!qq.ma, mn: !!qq.mn, act: Array.isArray(qq.act) ? qq.act.filter(okB).map(fixB).slice(0, 3) : [], board: Array.isArray(qq.board) ? qq.board.filter(okB).map(fixB).slice(0, 3) : [] };
      { const w = s.wb && typeof s.wb === 'object' ? s.wb : null;
        if (w) prog.wb = { wk: num(w.wk, 0, 0, 1e7), dmg: num(w.dmg, 0, 0, 5e9), claimed: !!w.claimed, day: num(w.day, 0, 0, 1e8), tries: num(w.tries, 0, 0, WB_TRIES), killed: !!w.killed };
        const k = s.wk && typeof s.wk === 'object' ? s.wk : null;
        if (k) prog.wk = { wk: num(k.wk, 0, 0, 1e7), deep: num(k.deep, 0, 0, 50), rank: num(k.rank, 0, 0, 10), score: num(k.score, 0, 0, 1050) }; }
      { const a = s.aria && typeof s.aria === 'object' ? s.aria : null;
        if (a) prog.aria = { day: num(a.day, 0, 0, 1e8), buff: !!a.buff, best: [0, 1, 2].map((k) => (Array.isArray(a.best) && typeof a.best[k] === 'number' && isFinite(a.best[k]) ? clamp(a.best[k], 0, 100) : 0)) }; }
      { const d = s.daily && typeof s.daily === 'object' ? s.daily : null;
        if (d && Array.isArray(d.ids) && d.base && typeof d.base === 'object') {
          const ids = d.ids.filter((id) => DAILY_POOL.some((m) => m.id === id)).slice(0, 3), base = {};
          for (const k of DAILY_KEYS) base[k] = num(d.base[k], 0, 0, 1e9);
          prog.daily = { day: num(d.day, 0, 0, 1e8), base, ids, done: ids.map((_, i) => !!(Array.isArray(d.done) && d.done[i])), all: !!d.all };
        }
        prog.dailyAll = num(s.dailyAll, 0, 0, 1e6);
        prog.ach = Array.isArray(s.ach) ? s.ach.filter((id) => ACH_IDS.includes(id)) : [];
        prog.title = ACH_IDS.includes(s.title) ? s.title : ''; }
      prog.inv = Array.isArray(s.inv) ? s.inv.map(cleanItem).filter(Boolean).slice(0, INV_MAX) : [];
      prog.eq = { sword: null, staff: null, head: null, body: null, acc: null };
      if (s.eq && typeof s.eq === 'object') for (const t of SLOT_TYPES) { const it = cleanItem(s.eq[t]); if (it && it.type === t) prog.eq[t] = it; }
    } catch (err) { /* ignore broken save */ }
  }

  /* ================= particles ================= */
  function addPart(o) { if (parts.length >= (prog.opt && prog.opt.lite ? 110 : 300)) parts.shift(); parts.push(o); }
  function burst(x, y, z, kind, n, color, spd) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * TAU, s = (spd || 2) * (0.35 + Math.random() * 0.8);
      addPart({ k: kind, x, y, z, vx: Math.cos(a) * s * 0.5, vy: Math.sin(a) * s * 0.5, vz: kind === 'spark' ? 30 + Math.random() * 50 : 14 + Math.random() * 26, t: 0, life: kind === 'spark' ? 0.3 + Math.random() * 0.25 : 0.6 + Math.random() * 0.6, s: 0.6 + Math.random() * 0.7, c: color });
    }
  }
  function updateParts(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt;
      if (p.t >= p.life) { parts.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.k === 'spark') { p.vz -= 170 * dt; if (p.z < 0) { p.z = 0; p.vz *= -0.3; p.vx *= 0.6; p.vy *= 0.6; } }
      else if (p.k === 'ember') { p.vx += (Math.random() - 0.5) * 2.4 * dt; p.vy += (Math.random() - 0.5) * 2.4 * dt; }
      else if (p.k === 'leaf') {
        if (p.z > 0) { p.vz = -11 + Math.sin(p.t * 3 + p.s * 10) * 6; p.vx = Math.sin(p.t * 2 + p.s * 7) * 0.45; }
        else { p.z = 0; p.vz = 0; p.vx = 0; p.vy = 0; }
      } else if (p.k === 'firefly') {
        p.vx = clamp(p.vx + (Math.random() - 0.5) * 2.4 * dt, -0.5, 0.5);
        p.vy = clamp(p.vy + (Math.random() - 0.5) * 2.4 * dt, -0.5, 0.5);
        p.vz = Math.sin(p.t * 1.7 + p.s * 9) * 5;
      } else if (p.k === 'dust') { p.vx *= 0.9; p.vy *= 0.9; p.vz *= 0.9; }
      else { p.vx *= 0.95; p.vy *= 0.95; }
    }
  }

  /* ================= enemies ================= */
  function makeEnemy(type, x, y, lvl, pack, elite) {
    const T = ETYPES[type];
    const hp = Math.round(T.hp * (1 + 0.38 * (lvl - 1)) * (elite ? 3 : 1));
    return {
      type, x, y, hx: x, hy: y, wx: x, wy: y, wT: rand(0, 3), lvl, pack, elite,
      maxHp: hp, hp,
      dmg: T.dmg * (1 + 0.26 * (lvl - 1)) * (elite ? 1.4 : 1),
      speed: T.sp * (elite ? 1.05 : 1),
      exp: T.exp * (1 + 0.45 * (lvl - 1)) * (1 + lvl / 150) * (elite ? 3 : 1),
      aggro: T.aggro, atkInt: T.atk, r: T.r * (elite ? 1.2 : 1),
      armor: T.armor + (type === 'undead' ? lvl * 0.6 : 0),
      cv: Math.floor(Math.random() * T.vars),
      state: 'idle', atkT: 0.5, hitT: 0, lunge: 0, anim: Math.random() * 10, moving: false, dir: (Math.random() * 8) | 0,
      faceLeft: Math.random() < 0.5, dead: false, deathT: 0
    };
  }
  function spawnPack() {
    if (!reachList.length) return false;
    for (let tries = 0; tries < 40; tries++) {
      const c = reachList[(Math.random() * reachList.length) | 0];
      const x = (c % MW) + 0.5, y = ((c / MW) | 0) + 0.5;
      if (Math.min(c % MW, (c / MW) | 0, MW - 1 - (c % MW), MH - 1 - ((c / MW) | 0)) < 4) continue;
      const dc = hyp(x - CAMP.x, y - CAMP.y);
      if (dc < CAMP.r + 4.5) continue;
      if (hyp(x - player.x, y - player.y) < 10) continue;
      if (portals.some((p) => hyp(p.x - x, p.y - y) < 5)) continue;
      const M = MAPS[curMap];
      const lvl = M.base + Math.floor(Math.max(0, dc - CAMP.r - 4) / M.step);
      const roll = Math.random();
      let type;
      if (!M.kinds) type = dc < 15 ? (roll < 0.75 ? 'goblin' : 'ant') : dc < 26 ? (roll < 0.45 ? 'goblin' : roll < 0.75 ? 'ant' : 'undead') : (roll < 0.25 ? 'goblin' : roll < 0.6 ? 'ant' : 'undead');
      else { let r = roll; type = M.kinds[M.kinds.length - 1][0]; for (const kd of M.kinds) { if (r < kd[1]) { type = kd[0]; break; } r -= kd[1]; } }
      const n = randi(4, 7), pack = ++packSeq;
      const eliteAt = Math.random() < M.elite ? 0 : -1;
      let made = 0;
      for (let k = 0; k < n * 4 && made < n; k++) {
        const ex = x + rand(-1.8, 1.8), ey = y + rand(-1.8, 1.8);
        if (blockedAt(ex, ey, 0.25) || inCamp(ex, ey)) continue;
        if (!reachable[idx(Math.floor(ex), Math.floor(ey))]) continue;
        enemies.push(makeEnemy(type, ex, ey, lvl, pack, made === eliteAt));
        made++;
      }
      if (made) return true;
    }
    return false;
  }
  function aliveCount() { let n = 0; for (const e of enemies) if (!e.dead) n++; return n; }
  function provoke(e) {
    if (player.dead || e.dead) return;
    e.state = 'chase';
    for (const o of enemies) {
      if (!o.dead && o.pack === e.pack && o.state !== 'chase' && hyp(o.x - e.x, o.y - e.y) < 7) o.state = 'chase';
    }
  }
  function moveEnemy(e, nx, ny) {
    const ox0 = e.x, oy0 = e.y;
    if (!blockedAt(nx, e.y, 0.2) && !inCamp(nx, e.y)) e.x = nx;
    if (!blockedAt(e.x, ny, 0.2) && !inCamp(e.x, ny)) e.y = ny;
    return e.x !== ox0 || e.y !== oy0;
  }
  function updateEnemies(dt) {
    const pSafe = player.dead || inCamp(player.x, player.y);
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.dead) {
        if (e.kbx) { const fk = Math.max(0, 1 - dt * 7); moveEnemy(e, e.x + e.kbx * dt, e.y + e.kby * dt); e.kbx *= fk; e.kby *= fk; if (Math.abs(e.kbx) + Math.abs(e.kby) < 0.05) e.kbx = 0; }
        e.deathT -= dt;
        if (e.deathT <= 0) enemies.splice(i, 1);
        continue;
      }
      if (!e._f) floorInitEnemy(e);
      if ((e.obj || e.treasure) && objThink(e, dt)) continue;
      if (e.aff || e.regen || e.shieldT) affixThink(e, dt);
      e.anim += dt;
      e.moving = false;
      e.hitT = Math.max(0, e.hitT - dt);
      e.atkT = Math.max(0, e.atkT - dt);
      e.lunge = Math.max(0, e.lunge - dt);
      e.stunT = Math.max(0, (e.stunT || 0) - dt);
      if (e.brkT) e.brkT = Math.max(0, e.brkT - dt);
      if (e.elT > 0) e.elT -= dt;
      e.slowT = Math.max(0, (e.slowT || 0) - dt);
      e.weakT = Math.max(0, (e.weakT || 0) - dt);
      if (e.stunT > 0) { e.moving = false; continue; }
      const dxp = player.x - e.x, dyp = player.y - e.y, dp = hyp(dxp, dyp);
      if (e.boss && bossThink(e, dt, dp)) continue;
      if (pSafe) { if (e.state === 'chase') e.state = 'return'; }
      else if (e.state !== 'chase' && dp < e.aggro) provoke(e);
      if (e.state === 'chase' && dp > 14) e.state = 'return';
      let tx, ty, sp = e.speed * (e.slowT > 0 ? 1 - (e.slowAmt || 0.4) : 1);
      if (e.state === 'chase') {
        if (dp <= e.r + 0.42) {
          e.faceLeft = (dxp - dyp) < 0;
          e.dir = dirFrom(dxp, dyp);
          if (e.atkT <= 0) { e.atkT = e.atkInt; e.lunge = LUNGE; hurtPlayer(e.dmg * (e.weakT > 0 ? 1 - (e.weakAmt || 0.2) : 1)); }
          continue;
        }
        tx = player.x; ty = player.y;
      } else if (e.state === 'return') {
        tx = e.hx; ty = e.hy; sp *= 1.25;
        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.25 * dt);
        if (hyp(tx - e.x, ty - e.y) < 0.4) e.state = 'idle';
      } else {
        e.wT -= dt;
        if (e.wT <= 0) { e.wT = rand(2, 5); e.wx = e.hx + rand(-2, 2); e.wy = e.hy + rand(-2, 2); }
        tx = e.wx; ty = e.wy; sp *= 0.35;
      }
      const dx = tx - e.x, dy = ty - e.y, d = hyp(dx, dy);
      if (d > 0.05) {
        const st = Math.min(d, sp * dt);
        e.moving = moveEnemy(e, e.x + dx / d * st, e.y + dy / d * st);
        if (e.moving) e.dir = dirFrom(dx, dy);
        if (Math.abs(dx - dy) > 0.01) e.faceLeft = (dx - dy) < 0;
      }
    }
    for (let a = 0; a < enemies.length; a++) {
      const A = enemies[a];
      if (A.dead) continue;
      for (let b = a + 1; b < enemies.length; b++) {
        const B = enemies[b];
        if (B.dead) continue;
        const dx = B.x - A.x, dy = B.y - A.y, d = hyp(dx, dy), m = A.r + B.r;
        if (d > 0.0001 && d < m) {
          const push = (m - d) * 0.5, ux = dx / d, uy = dy / d;
          moveEnemy(A, A.x - ux * push, A.y - uy * push);
          moveEnemy(B, B.x + ux * push, B.y + uy * push);
        }
      }
    }
  }

  /* ================= combat ================= */
  const bodyH = (e) => (e.type === 'ant' ? 20 : e.type === 'undead' ? 40 : 32) * (e.boss ? 1.75 : e.elite ? 1.18 : 1);
  function addFx(o) { fx.push(o); if (fx.length > 80) fx.shift(); }
  function addText(x, y, s, kind, h) {
    const j = kind === 'gold' || kind === 'heal' ? 0 : 0.16, arc = kind === 'hit' || kind === 'crit' || kind === 'hurt';
    texts.push({ x: x + rand(-j, j), y: y + rand(-j, j), s, kind, h: (h || 30) + rand(-4, 4), t: 0, life: kind === 'gold' ? 1.1 : kind === 'crit' ? 0.95 : 0.85,
      vx: arc ? rand(-1, 1) * (kind === 'crit' ? 46 : 34) : 0, vy: arc ? (kind === 'crit' ? 96 : 78) : 0 });
    if (texts.length > 60) texts.shift();
  }
  function hitEnemy(e, base) {
    if (e.dead) return;
    if (e.shieldT > 0) { addText(e.x, e.y, '無効', 'hit', bodyH(e) + 18); return; }
    const crit = player.critT > 0 || Math.random() < D.crit;
    const dmg = Math.max(1, Math.round(base * legendDmgMul(e) * elemOnHit(e) * rand(0.9, 1.1) * (crit ? D.critMul : 1) - e.armor));
    e.hp -= dmg;
    legendOnHit(e, dmg, crit);
    wbHit(e, dmg);
    e.hitT = 0.12;
    sfx(crit ? 'crit' : 'hit');
    onHitFeel(e, crit);
    if (D.steal > 0 && !player.dead) player.hp = Math.min(D.maxHp, player.hp + dmg * D.steal);
    addText(e.x, e.y, String(dmg), crit ? 'crit' : 'hit', bodyH(e) + 18);
    burst(e.x, e.y, bodyH(e), 'spark', crit ? 10 : 5, player.form === 'blade' ? (crit ? 'gold' : 'amber') : (crit ? 'white' : 'violet'), 2.4);
    provoke(e);
    if (e.hp <= 0) killEnemy(e);
  }
  function killEnemy(e) {
    e.dead = true; e.hp = 0; e.deathT = DIE_T;
    sfx('kill');
    onKillFeel(e);
    if (player.target === e) { player.target = null; autoRetarget(e); }
    burst(e.x, e.y, bodyH(e), 'soul', e.elite ? 10 : 4, e.elite ? 'gold' : 'cyan', 0.8);
    const exp = Math.max(1, Math.round(e.exp));
    if (e.elite || Math.random() < 0.65) {
      const g = Math.round((randi(1, 3) * e.lvl + (e.elite ? 12 : 0)) * (1 + GEAR.gold / 100) * comboMul() * floorGoldMul());
      prog.gold += g;
      goldPending += g;
      if (goldT <= 0) goldT = 0.35;
    }
    if (e.elite || Math.random() < 0.09) { if (gainPotion(1)) log('回復薬を拾った'); }
    if (e.elite) log('強い個体を倒した');
    dungeonKill(e);
    questKill(e);
    legendOnKill(e);
    dropLoot(e);
    gainExp(Math.round(exp * (1 + GEAR.exp / 100) * comboMul() * floorExpMul()));
  }
  function gainExp(n) {
    prog.exp += n;
    let up = false;
    while (prog.exp >= expNeed(prog.level)) {
      prog.exp -= expNeed(prog.level);
      prog.level++;
      prog.sp += 3;
      prog.kp += 2;
      up = true;
    }
    if (up) {
      refreshD();
      player.hp = D.maxHp; player.mp = D.maxMp;
      sfx('level');
      addFx({ k: 'lvl', x: player.x, y: player.y, t: 0, life: 1.3 }); zoomPunch(0.05); buzz(30);
      burst(player.x, player.y, 10, 'gold', 26, 'gold', 1.6);
      toast('レベル' + prog.level + '！ ステータスで振り分けよう');
      log('レベル' + prog.level + 'になった');
      save();
    }
  }
  function hurtPlayer(raw, cap) {
    if (player.dead || ULT.inv > 0) return;
    classOnHurt();
    let dmg = Math.max(1, Math.round(raw * rand(0.9, 1.1) * (1 - D.guard)));
    if (cap) dmg = Math.min(dmg, Math.round(D.maxHp * cap));
    dmg = legendOnHurt(dmg);
    if (dmg < 0) return;
    if (D.shield > 0 && player.mp > 0) { const ab = Math.min(player.mp, dmg * D.shield); player.mp -= ab; dmg = Math.max(0, Math.round(dmg - ab)); }
    player.hp -= dmg;
    onHurtFeel(dmg);
    player.hurtT = 0.22;
    sfx('hurt');
    addText(player.x, player.y, String(dmg), 'hurt', 58);
    if (player.hp <= 0) { if (phoenixSave()) return; player.hp = 0; die(); }
  }
  function die() {
    player.dead = true; player.deadT = 0; player.target = null; player.path.length = 0; player.moving = false; drag.active = false;
    log('倒れてしまった');
    sfx('death');
    recAdd('deaths');
    if (WB.on) { setTimeout(() => wbEnd('dead'), 1200); return; }
    setTimeout(() => { if (player.dead) $('dead').hidden = false; }, 800);
  }
  function respawn() {
    if (!player.dead) return;
    clearDive();
    const lost = Math.floor(prog.exp * 0.1);
    prog.exp -= lost;
    player.x = SPAWN.x; player.y = SPAWN.y; cam.x = player.x; cam.y = player.y;
    refreshD();
    player.hp = D.maxHp; player.mp = D.maxMp; player.dead = false; player.hurtT = 0;
    $('dead').hidden = true;
    if (lost > 0) log('経験値が ' + lost + ' 減った');
    save();
  }
  function basicAttack(e) {
    sfx(player.form === 'blade' ? 'swing' : 'bolt');
    classOnBasic(e);
    if (player.form === 'blade') {
      player.swingT = player.swingDur = 0.3;
      addFx({ k: 'slash', x: e.x, y: e.y, t: 0, life: 0.24, left: player.faceLeft, h: bodyH(e) });
      hitEnemy(e, D.atk);
      if (!e.dead && Math.random() < D.dbl) { hitEnemy(e, D.atk * 0.8); addFx({ k: 'slash', x: e.x, y: e.y, t: 0, life: 0.24, left: !player.faceLeft, h: bodyH(e) + 6 }); }
    } else {
      player.swingT = player.swingDur = 0.34;
      shots.push({ x: player.x, y: player.y, h: 34, tgt: e, dmg: D.atk, sp: 11, trail: [] });
    }
  }
  function updateShots(dt) {
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i], e = s.tgt;
      if (e.dead) { shots.splice(i, 1); if (s.onHit) explode(s.x, s.y, 1.2, 0); else burst(s.x, s.y, s.h, 'magic', 4, 'violet', 1); continue; }
      s.trail.push([s.x, s.y, s.h]);
      if (s.trail.length > 7) s.trail.shift();
      const dx = e.x - s.x, dy = e.y - s.y, d = hyp(dx, dy), st = s.sp * dt;
      s.h += (bodyH(e) - s.h) * Math.min(1, dt * 5);
      if (d <= st + 0.15) {
        shots.splice(i, 1);
        if (s.onHit) s.onHit(e, s); else hitEnemy(e, s.dmg);
        continue;
      }
      s.x += dx / d * st;
      s.y += dy / d * st;
      if (Math.random() < (s.big ? 0.9 : 0.5)) addPart({ k: s.big ? 'ember' : 'magic', x: s.x, y: s.y, z: s.h, vx: rand(-0.3, 0.3), vy: rand(-0.3, 0.3), vz: rand(-4, 8), t: 0, life: 0.35, s: s.big ? 0.8 : 0.5, c: s.col || 'violet' });
    }
  }
  function nearest(x, y, maxD, exclude) {
    let best = null, bd = maxD;
    for (const e of enemies) {
      if (e.dead || (exclude && exclude.has(e))) continue;
      const d = hyp(e.x - x, e.y - y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  function setFormAttr() { document.documentElement.setAttribute('data-form', player.form); }
  function morph() {
    if (paused || player.dead || player.morphT > 0) return;
    player.form = player.form === 'blade' ? 'arcane' : 'blade';
    prog.form = player.form;
    legendOnMorph();
    player.morphT = D.morphCd;
    if (prog.skill.shift) player.shiftT = 4;
    setFormAttr();
    refreshD();
    const col = player.form === 'blade' ? 'amber' : 'violet';
    addFx({ k: 'morph', x: player.x, y: player.y, t: 0, life: 0.7, c: col });
    burst(player.x, player.y, 24, 'magic', 26, col, 2.2);
    flash();
    sfx('morph');
    drawPortrait();
  }
  function drinkPotion() {
    if (paused || player.dead || player.potT > 0) return;
    if (prog.potions <= 0) { toast('回復薬がない'); return; }
    if (player.hp >= D.maxHp - 0.5) { toast('HPは満タン'); return; }
    prog.potions--;
    const amt = Math.round(D.maxHp * 0.4);
    player.hp = Math.min(D.maxHp, player.hp + amt);
    player.potT = POT_CD;
    sfx('potion');
    addText(player.x, player.y, '+' + amt, 'heal', 62);
    addFx({ k: 'heal', x: player.x, y: player.y, t: 0, life: 0.7 });
    burst(player.x, player.y, 6, 'heal', 14, 'mint', 1.2);
  }
  // carry limit: extra potions picked up at the limit are not kept
  function gainPotion(n) {
    const k = Math.max(0, Math.min(n, POT_MAX - prog.potions));
    prog.potions += k;
    return k;
  }
  function buyPotion() {
    if (paused || player.dead || !inCamp(player.x, player.y)) return;
    if (prog.potions >= POT_MAX) { toast('回復薬はこれ以上持てない（最大' + POT_MAX + '個）'); return; }
    if (prog.gold < POTION_PRICE) { toast('所持金が足りない'); return; }
    prog.gold -= POTION_PRICE;
    prog.potions++;
    log('回復薬を買った');
    save();
  }

  /* ================= player ================= */
  function faceToward(dx, dy) {
    const sx = dx - dy, sy = dx + dy;
    if (Math.abs(sx) > 0.02) player.faceLeft = sx < 0;
    if (Math.abs(sy) > 0.05) player.back = sy < 0;
    if (Math.abs(dx) + Math.abs(dy) > 0.02) player.dir = dirFrom(dx, dy);
  }
  function followPath(dt) {
    const p = player;
    if (!p.path.length) { p.moving = false; return; }
    let budget = D.speed * dt;
    p.walkPhase = (p.walkPhase + budget / 1.15) % 1;
    while (budget > 0 && p.path.length) {
      const wp = p.path[0];
      const dx = wp.x - p.x, dy = wp.y - p.y, d = hyp(dx, dy);
      if (d > 0.001) faceToward(dx, dy);
      if (d <= budget) { p.x = wp.x; p.y = wp.y; p.path.shift(); budget -= d; }
      else { p.x += dx / d * budget; p.y += dy / d * budget; budget = 0; }
    }
    p.moving = true;
  }
  function playerThink(dt) {
    const p = player;
    if (stickMove(dt)) return;
    if (drag.active && drag.pending && !p.target) {
      drag.t -= dt;
      if (drag.t <= 0) {
        drag.t = 0.14; drag.pending = false;
        const path = findPath(p.x, p.y, drag.wx, drag.wy);
        if (path) { p.path = path; marker = { x: drag.wx, y: drag.wy, t: 0.25 }; }
      }
    }
    const e = p.target;
    if (e) {
      if (e.dead) p.target = null;
      else {
        const d = hyp(e.x - p.x, e.y - p.y);
        if (d <= D.range + e.r) {
          p.path.length = 0;
          p.moving = false;
          faceToward(e.x - p.x, e.y - p.y);
          if (p.atkT <= 0) { basicAttack(e); p.atkT = D.interval; }
          return;
        }
        p.repathT -= dt;
        if (p.repathT <= 0 || !p.path.length) {
          p.repathT = 0.3;
          const path = findPath(p.x, p.y, e.x, e.y);
          if (path) p.path = path; else { p.target = null; p.path.length = 0; }
        }
      }
    }
    followPath(dt);
  }
  function regen(dt) {
    const m = inCamp(player.x, player.y) ? 8 : 1;
    player.hp = Math.min(D.maxHp, player.hp + (0.5 + prog.stats.vit * 0.06) * m * dt);
    player.mp = Math.min(D.maxMp, player.mp + (1.2 + prog.stats.int * 0.08 + D.mpRegen) * m * dt);
  }
  function updateFx(dt) {
    for (let i = fx.length - 1; i >= 0; i--) { fx[i].t += dt; if (fx[i].t >= fx[i].life) fx.splice(i, 1); }
    for (let i = texts.length - 1; i >= 0; i--) { texts[i].t += dt; if (texts[i].t >= texts[i].life) texts.splice(i, 1); }
    if (marker) { marker.t += dt; if (marker.t >= 0.5) marker = null; }
    if (goldT > 0) {
      goldT -= dt;
      if (goldT <= 0 && goldPending > 0) { addText(player.x, player.y, '+' + goldPending + 'G', 'gold', 74); goldPending = 0; }
    }
  }
  function ambientParticles(dt) {
    // embers from the campfire
    if (hyp(cam.x - CAMP.x, cam.y - CAMP.y) < 20) {
      emberT -= dt;
      while (emberT <= 0) {
        emberT += 0.06;
        addPart({ k: 'ember', x: CAMP.x + rand(-0.15, 0.15), y: CAMP.y + rand(-0.15, 0.15), z: 12, vx: rand(-0.08, 0.08), vy: rand(-0.08, 0.08), vz: rand(20, 38), t: 0, life: rand(0.9, 1.8), s: rand(0.35, 0.75), c: 'warm' });
      }
    }
    // fireflies at night
    if (envDark > 0.45) {
      let n = 0;
      for (const p of parts) if (p.k === 'firefly') n++;
      if (n < 18 && Math.random() < dt * 6) {
        const x = cam.x + rand(-7, 7), y = cam.y + rand(-7, 7);
        if (inB(Math.floor(x), Math.floor(y)) && tileAt(Math.floor(x), Math.floor(y)) !== T_WATER) addPart({ k: 'firefly', x, y, z: rand(6, 18), vx: rand(-0.3, 0.3), vy: rand(-0.3, 0.3), vz: 0, t: 0, life: rand(5, 9), s: rand(0.5, 1), c: 'fly' });
      }
    }
    // falling leaves by day
    if (envDark < 0.6) {
      leafT -= dt;
      if (leafT <= 0) {
        leafT = rand(0.4, 1.0);
        const cand = props[(Math.random() * props.length) | 0];
        if (cand && cand.kind === 'tree' && cand.v < 3 && hyp(cand.x - cam.x, cand.y - cam.y) < 9) {
          const cols = [['#5f9e4f', '#8fcf6e'], ['#3f8f80', '#82cdb0'], ['#d68a2a', '#ffc45a']][cand.v];
          addPart({ k: 'leaf', x: cand.x + rand(-0.5, 0.5), y: cand.y + rand(-0.5, 0.5), z: 70 * cand.s, vx: 0, vy: rand(-0.1, 0.1), vz: -11, t: 0, life: 8, s: Math.random(), c: cols[Math.random() < 0.5 ? 0 : 1] });
        }
      }
    }
    // dust from footsteps
    if (player.moving && !player.dead) {
      dustT -= dt;
      if (dustT <= 0) { dustT = 0.13; addPart({ k: 'dust', x: player.x + rand(-0.08, 0.08), y: player.y + rand(-0.08, 0.08), z: 1, vx: rand(-0.3, 0.3), vy: rand(-0.3, 0.3), vz: rand(3, 7), t: 0, life: 0.55, s: rand(0.7, 1.2), c: '' }); }
    }
    // arcane motes
    if (player.form === 'arcane' && !player.dead) {
      magicT -= dt;
      if (magicT <= 0) { magicT = 0.16; addPart({ k: 'magic', x: player.x + rand(-0.35, 0.35), y: player.y + rand(-0.35, 0.35), z: rand(10, 40), vx: 0, vy: 0, vz: rand(8, 18), t: 0, life: rand(0.6, 1.1), s: rand(0.3, 0.6), c: Math.random() < 0.5 ? 'violet' : 'cyan' }); }
    }
  }
  function update(dt) {
    refreshD();
    const p = player;
    dayT += dt;
    p.atkT = Math.max(0, p.atkT - dt);
    p.swingT = Math.max(0, p.swingT - dt);
    p.cd.blade = Math.max(0, p.cd.blade - dt);
    p.cd.arcane = Math.max(0, p.cd.arcane - dt);
    p.morphT = Math.max(0, p.morphT - dt);
    p.potT = Math.max(0, p.potT - dt);
    p.hurtT = Math.max(0, p.hurtT - dt);
    p.anim += dt;
    if (p.dead) p.deadT += dt;
    if (!p.dead) { if (!dash && !transit) playerThink(dt); regen(dt); checkPortals(); }
    updateEnemies(dt);
    updateShots(dt);
    skillsUpdate(dt);
    lootUpdate(dt);
    dungeonUpdate(dt);
    questUpdate(dt);
    autoUpdate();
    feelUpdate(dt);
    vfxUpdate(dt);
    floorUpdate(dt);
    metaUpdate(dt);
    updateHud2(dt);
    updateFx(dt);
    ambientParticles(dt);
    updateParts(dt);
    spawnT -= dt;
    if (spawnT <= 0) { spawnT = 0.85; if (!WB.on && aliveCount() < POP_CAP) spawnPack(); } // the world-boss arena holds only the boss and its adds
    const k = Math.min(1, dt * 7);
    cam.x += (p.x - cam.x) * k;
    cam.y += (p.y - cam.y) * k;
    saveT -= dt;
    if (saveT <= 0) { saveT = 8; save(); }
  }

  function enterMap(id, arrive) {
    const fromMap = curMap;
    if (id === 3) prepFloor();
    clearBossFx(); bossRef = null;
    buildMap(id);
    prog.map = id === 3 && WB.on ? 0 : id;
    rebuildBiome();
    enemies.length = 0; shots.length = 0; fx.length = 0; texts.length = 0; parts.length = 0; vfx.length = 0;
    fields.length = 0; meteors.length = 0; dash = null; dance = null; loot.length = 0; pendingNpc = null;
    let px = SPAWN.x, py = SPAWN.y;
    if (arrive != null && portals[arrive]) {
      const p = portals[arrive], dx = CAMP.x - p.x, dy = CAMP.y - p.y, d = hyp(dx, dy) || 1;
      px = p.x + dx / d * 1.6; py = p.y + dy / d * 1.6;
      if (blockedAt(px, py, 0.2) || !reachable[idx(Math.floor(px), Math.floor(py))]) { const o = nearestOpen(Math.floor(px), Math.floor(py)); if (o) { px = o[0] + 0.5; py = o[1] + 0.5; } }
    }
    player.x = px; player.y = py; cam.x = px; cam.y = py;
    player.path.length = 0; player.target = null; marker = null;
    portalLock = true;
    for (let k = 0; k < (id === 3 ? 18 : 15); k++) spawnPack();
    if (id === 3) { startFloor(); if (fromMap !== 3) ariaDiveStart(); } else { clearDive(); wbLeave(); }
    questEvent('map', id);
    sfx('portal');
    showBanner(MAPS[id].name, MAPS[id].rec);
    save();
  }
  function checkPortals() {
    if (transit || player.dead) return;
    let near = Infinity, hit = null;
    for (const p of portals) { const d = hyp(p.x - player.x, p.y - player.y); if (d < near) { near = d; hit = p; } }
    if (portalLock) { if (near > 1.4) portalLock = false; return; }
    if (hit && near < 0.6) {
      transit = true;
      player.path.length = 0;
      $('fade').classList.add('on');
      setTimeout(() => { if (hit.to === 3) curFloor = hit.next ? Math.min(ABYSS_MAX, curFloor + 1) : checkpointFloor(); enterMap(hit.to, hit.arrive); $('fade').classList.remove('on'); transit = false; }, 320);
    }
  }
