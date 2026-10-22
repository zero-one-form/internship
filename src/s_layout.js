
  /* ================= abyss map layouts: caves, rooms, mazes, isles, rings, arenas, rifts ================= */
  const LAYOUT_POOL = [['field', 'caves'], ['caves', 'islands'], ['winding', 'rooms'], ['caves', 'maze'], ['rooms', 'maze'], ['arena', 'winding'], ['islands', 'caves'], ['rooms', 'ring'], ['islands', 'ring'], ['ring', 'arena']];
  const LAYOUT_NAME = { field: '開けた洞', caves: '入り組んだ洞窟', rooms: '石室と回廊', maze: '迷宮', islands: '浮島', ring: '環状回廊', arena: '闘技場', winding: '蛇行する裂け目', grand: '大闘技場', bossarena: '番人の間' };
  const LAYOUT_ALL = ['caves', 'rooms', 'maze', 'islands', 'ring', 'arena', 'winding'];
  const CAMP_SPOTS = [[12.5, 12.5], [43.5, 12.5], [12.5, 43.5], [43.5, 43.5]];
  function pickLayout(f) {
    if (f >= ABYSS_MAX) return 'grand';
    if (f % 5 === 0) return 'bossarena';
    const R = seeded(9000 + f * 131), r = R();
    if (r < 0.15) return LAYOUT_ALL[Math.floor(R() * LAYOUT_ALL.length)];
    const pool = LAYOUT_POOL[Math.min(9, Math.floor((f - 1) / 5))];
    return pool[r < 0.575 ? 0 : 1];
  }
  function layoutFloor(M, f) {
    M.layout = pickLayout(f);
    const c = f >= ABYSS_MAX || f % 5 === 0 ? CAMP_SPOTS[0] : CAMP_SPOTS[Math.floor(seeded(4400 + f * 17)() * 4)];
    M.camp = [c[0], c[1]];
    const sx = c[0] < 28 ? -1 : 1, sy = c[1] < 28 ? -1 : 1;
    M.portals[0].x = c[0] + sx * 5; M.portals[0].y = c[1] + sy * 5;
    M.extra = M.layout === 'field' ? [[46, 46], [46, 12], [12, 46], [30, 30]] : [];
  }
  function genLayout(kind, R, M) {
    const O = new Uint8Array(MW * MH), lo = 3, hi = MW - 4;
    const disk = (cx, cy, r) => { for (let j = Math.floor(cy - r - 1); j <= cy + r + 1; j++) for (let i = Math.floor(cx - r - 1); i <= cx + r + 1; i++) if (i >= lo && j >= lo && i <= hi && j <= hi && hyp(i + 0.5 - cx, j + 0.5 - cy) < r) O[idx(i, j)] = 1; };
    const line = (x0, y0, x1, y1, w) => { const n = Math.ceil(hyp(x1 - x0, y1 - y0) * 2) + 1; for (let k = 0; k <= n; k++) disk(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n, w / 2); };
    const lpath = (a, b, w) => { if (R() < 0.5) { line(a[0], a[1], b[0], a[1], w); line(b[0], a[1], b[0], b[1], w); } else { line(a[0], a[1], a[0], b[1], w); line(a[0], b[1], b[0], b[1], w); } };
    const mst = (pts, join) => { const inT = [0], rest = pts.map((_, i) => i).slice(1); while (rest.length) { let best = null, bd = 1e9; for (const a of inT) for (const b of rest) { const d = hyp(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1]); if (d < bd) { bd = d; best = [a, b]; } } join(pts[best[0]], pts[best[1]]); inT.push(best[1]); rest.splice(rest.indexOf(best[1]), 1); } };
    let fill = 'pit', rimP = 0.8;
    if (kind === 'caves') {
      for (let j = lo; j <= hi; j++) for (let i = lo; i <= hi; i++) O[idx(i, j)] = R() < 0.56 ? 1 : 0;
      for (let it = 0; it < 5; it++) {
        const N = O.slice();
        for (let j = lo; j <= hi; j++) for (let i = lo; i <= hi; i++) {
          let wl = 0;
          for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { if (!di && !dj) continue; const ii = i + di, jj = j + dj; if (ii < lo || jj < lo || ii > hi || jj > hi || !O[idx(ii, jj)]) wl++; }
          N[idx(i, j)] = wl >= 5 ? 0 : wl <= 3 ? 1 : O[idx(i, j)];
        }
        O.set(N);
      }
    } else if (kind === 'rooms') {
      const rooms = [];
      for (let t = 0; t < 400 && rooms.length < 11; t++) {
        const w = 6 + Math.floor(R() * 7), h = 6 + Math.floor(R() * 7), x = lo + Math.floor(R() * (hi - lo - w)), y = lo + Math.floor(R() * (hi - lo - h));
        if (rooms.some((r) => x < r[0] + r[2] + 3 && x + w + 3 > r[0] && y < r[1] + r[3] + 3 && y + h + 3 > r[1])) continue;
        rooms.push([x, y, w, h]);
      }
      for (const r of rooms) for (let j = r[1]; j < r[1] + r[3]; j++) for (let i = r[0]; i < r[0] + r[2]; i++) O[idx(i, j)] = 1;
      const ctr = rooms.map((r) => [r[0] + r[2] / 2, r[1] + r[3] / 2]);
      mst(ctr, (a, b) => lpath(a, b, 3));
      for (let k = 0; k < 2 && ctr.length > 3; k++) lpath(ctr[Math.floor(R() * ctr.length)], ctr[Math.floor(R() * ctr.length)], 3);
    } else if (kind === 'maze') {
      const n = 7, cell = 7, cx = (c) => lo + 1 + c * cell + 3, vis = new Uint8Array(n * n), st = [[0, 0]];
      for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) disk(cx(a), cx(b), 2.6);
      vis[0] = 1;
      while (st.length) {
        const [a, b] = st[st.length - 1], nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map((d) => [a + d[0], b + d[1]]).filter((q) => q[0] >= 0 && q[1] >= 0 && q[0] < n && q[1] < n && !vis[q[0] * n + q[1]]);
        if (!nb.length) { st.pop(); continue; }
        const q = nb[Math.floor(R() * nb.length)];
        vis[q[0] * n + q[1]] = 1; line(cx(a), cx(b), cx(q[0]), cx(q[1]), 3); st.push(q);
      }
      for (let k = 0; k < 7; k++) { const a = Math.floor(R() * (n - 1)), b = Math.floor(R() * n); if (R() < 0.5) line(cx(a), cx(b), cx(a + 1), cx(b), 3); else line(cx(b), cx(a), cx(b), cx(a + 1), 3); }
    } else if (kind === 'islands') {
      const pts = [];
      for (let t = 0; t < 300 && pts.length < 9; t++) { const p = [lo + 5 + R() * (hi - lo - 10), lo + 5 + R() * (hi - lo - 10)]; if (pts.some((q) => hyp(q[0] - p[0], q[1] - p[1]) < 11)) continue; pts.push(p); }
      for (const p of pts) { const r = 3.8 + R() * 2.6; disk(p[0], p[1], r); for (let k = 0; k < 3; k++) disk(p[0] + (R() - 0.5) * r, p[1] + (R() - 0.5) * r, r * 0.6); }
      mst(pts, (a, b) => line(a[0], a[1], b[0], b[1], 2.2));
      fill = MAPS[3].biome === 'ab_void' || MAPS[3].biome === 'ab_star' || MAPS[3].biome === 'cave' ? 'pit' : 'water';
      rimP = fill === 'water' ? 0.3 : 0.7;
    } else if (kind === 'ring') {
      const c = MW / 2;
      for (let j = lo; j <= hi; j++) for (let i = lo; i <= hi; i++) { const d = hyp(i + 0.5 - c, j + 0.5 - c); if (d > 11 && d < 21 + Math.sin(Math.atan2(j - c, i - c) * 5) * 1.5) O[idx(i, j)] = 1; }
      disk(c, c, 5.5);
      for (let k = 0; k < 3; k++) { const a = R() * TAU; line(c, c, c + Math.cos(a) * 15, c + Math.sin(a) * 15, 3); }
      for (let k = 0; k < 6; k++) { const a = R() * TAU; disk(c + Math.cos(a) * 15.5, c + Math.sin(a) * 15.5, 2 + R() * 2); }
    } else if (kind === 'arena') {
      const A = [[16, 16], [40, 16], [16, 40], [40, 40], [28, 28]].map((p) => [p[0] + (R() - 0.5) * 4, p[1] + (R() - 0.5) * 4, 6.5 + R() * 2]);
      for (const a of A) disk(a[0], a[1], a[2]);
      for (const [x, y] of [[0, 1], [1, 3], [3, 2], [2, 0], [4, 0], [4, 3]]) line(A[x][0], A[x][1], A[y][0], A[y][1], 3.5);
      M._pillars = A;
    } else if (kind === 'bossarena') {
      disk(30, 30, 13);
      M._pillars = [[30, 30, 13]];
    } else if (kind === 'grand') {
      disk(30, 30, 19);
      M._pillars = [[30, 30, 19]];
    } else if (kind === 'winding') {
      const s = [8, 8], e = [48, 48], ph = R() * TAU, amp = 8 + R() * 4, waves = 2.2 + R() * 1.2;
      let prev = null;
      for (let k = 0; k <= 120; k++) {
        const t = k / 120, bx = s[0] + (e[0] - s[0]) * t, by = s[1] + (e[1] - s[1]) * t, off = Math.sin(t * Math.PI * waves + ph) * amp, p = [bx + off * 0.707, by - off * 0.707];
        if (prev) line(prev[0], prev[1], p[0], p[1], 3.5 + Math.sin(t * 9 + ph) * 1.2 + 1.2);
        if (k % 14 === 7 && R() < 0.8) { const side = R() < 0.5 ? 1 : -1, q = [p[0] + side * 4, p[1] + side * 4]; line(p[0], p[1], q[0], q[1], 3); disk(q[0], q[1], 2.6 + R() * 2); }
        prev = p;
      }
      const mid = [28, 28], br = R() < 0.5 ? [46, 10] : [10, 46];
      line(mid[0], mid[1], br[0], br[1], 3.5); disk(br[0], br[1], 4);
    }
    return { open: O, fill, rimP };
  }
  function buildLayout(M, R) {
    if (!M.layout || M.layout === 'field') return null;
    M._pillars = null;
    const L = genLayout(M.layout, R, M), O = L.open;
    const force = (cx, cy, r) => { for (let j = Math.floor(cy - r - 1); j <= cy + r + 1; j++) for (let i = Math.floor(cx - r - 1); i <= cx + r + 1; i++) if (inB(i, j) && i >= 2 && j >= 2 && i < MW - 2 && j < MH - 2 && hyp(i + 0.5 - cx, j + 0.5 - cy) < r) O[idx(i, j)] = 1; };
    force(CAMP.x, CAMP.y, CAMP.r + 2.5);
    for (const p of portals) force(p.x, p.y, 2.6);
    const comp = new Int32Array(MW * MH);
    for (let pass = 0; pass < 16; pass++) {
      comp.fill(-1);
      const comps = [];
      for (let k = 0; k < MW * MH; k++) {
        if (!O[k] || comp[k] >= 0) continue;
        const id = comps.length, cells = [k];
        comp[k] = id;
        for (let h = 0; h < cells.length; h++) {
          const c = cells[h], ci = c % MW, cj = (c / MW) | 0;
          for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = ci + d[0], nj = cj + d[1]; if (!inB(ni, nj)) continue; const n = idx(ni, nj); if (O[n] && comp[n] < 0) { comp[n] = id; cells.push(n); } }
        }
        comps.push(cells);
      }
      const main = comp[idx(Math.floor(CAMP.x), Math.floor(CAMP.y))];
      if (comps.length <= 1) break;
      let merged = false;
      for (let id = 0; id < comps.length; id++) {
        if (id === main) continue;
        const cells = comps[id];
        if (cells.length < 14) { for (const c of cells) O[c] = 0; continue; }
        let best = null, bd = 1e9;
        const mainCells = comps[main], stepA = Math.max(1, Math.floor(cells.length / 60)), stepB = Math.max(1, Math.floor(mainCells.length / 400));
        for (let a = 0; a < cells.length; a += stepA) for (let b = 0; b < mainCells.length; b += stepB) {
          const ca = cells[a], cb = mainCells[b], d = hyp(ca % MW - cb % MW, ((ca / MW) | 0) - ((cb / MW) | 0));
          if (d < bd) { bd = d; best = [ca, cb]; }
        }
        const x0 = best[0] % MW + 0.5, y0 = ((best[0] / MW) | 0) + 0.5, x1 = best[1] % MW + 0.5, y1 = ((best[1] / MW) | 0) + 0.5, n = Math.ceil(bd * 2) + 1;
        for (let k = 0; k <= n; k++) force(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n, 1.6);
        merged = true;
        break;
      }
      if (!merged) break;
    }
    const dist = new Uint8Array(MW * MH).fill(255), q = [];
    for (let k = 0; k < MW * MH; k++) if (O[k]) { dist[k] = 0; q.push(k); }
    for (let h = 0; h < q.length; h++) {
      const c = q[h], ci = c % MW, cj = (c / MW) | 0;
      if (dist[c] >= 2) continue;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ni = ci + di, nj = cj + dj; if (!inB(ni, nj)) continue; const n = idx(ni, nj); if (dist[n] === 255) { dist[n] = dist[c] + 1; q.push(n); } }
    }
    const rim = new Uint8Array(MW * MH);
    for (let k = 0; k < MW * MH; k++) {
      if (O[k]) continue;
      if (dist[k] === 1) { rim[k] = 1; continue; }
      tile[k] = L.fill === 'water' ? T_WATER : T_PIT;
      solid[k] = 1;
    }
    return { open: O, rim, rimP: L.rimP };
  }
  function pillarProps(M, R) {
    if (!M._pillars) return;
    for (const a of M._pillars) {
      const n = a[2] > 12 ? 10 : 6, r = a[2] * 0.55;
      for (let k = 0; k < n; k++) {
        const an = k / n * TAU + R() * 0.2, x = a[0] + Math.cos(an) * r, y = a[1] + Math.sin(an) * r, i = Math.floor(x), j = Math.floor(y);
        if (!inB(i, j) || solid[idx(i, j)] || hyp(x - CAMP.x, y - CAMP.y) < CAMP.r + 2 || portals.some((p) => hyp(p.x - x, p.y - y) < 3)) continue;
        solid[idx(i, j)] = 1;
        props.push({ kind: 'spire', v: 2 + (k % 2), x: i + 0.5, y: j + 0.5, s: 0.95 + R() * 0.2, ph: 0 });
      }
    }
  }
