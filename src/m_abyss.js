
  /* ================= abyss themes (10 strata × 5 floors) & the final boss ================= */
  const ABYSS_MAX = 50;
  const SCALES = [[0, 2, 3, 5, 7, 8, 10], [0, 2, 3, 5, 7, 9, 10], [0, 1, 3, 5, 7, 8, 10], [0, 2, 3, 5, 7, 8, 11], [0, 2, 3, 7, 8], [0, 2, 4, 6, 8, 10]];
  const THEMES = [
    { key: 'cave', name: '深淵の回廊', part: ['dust', '', 3], mus: [45, 100, 0] },
    { key: 'ab_moss', name: '苔むす地底湖', g: [40, 70, 50], d: [70, 78, 60], c: [80, 70, 56], st: ['rgba(140,200,120,0.3)', 'rgba(10,30,16,0.45)'], sky: ['#030806', '#0b1a12'], water: '#2f9a80', tuft: ['#1f3a26', '#2f5436', '#447a4a', '#6aa064'], fl: ['#b8ffb0', '#fff3a0'], tint: [0.7, 0.86, 0.74], dark: 0.72, mm: [[56, 92, 64], [92, 100, 80], [47, 154, 128], [26, 40, 30], [110, 100, 80]], ponds: 7,
      props: [['tree', 0.32, [5, 6]], ['bush', 0.2, [3, 4]], ['crystal', 0.12, [0]], ['spire', 0.18, [2, 3]], ['lamp', 0.04, [0]], ['rock', 0.14, [0, 1, 2]]], kinds: [['goblin', 0.45], ['ant', 0.3], ['undead', 0.25]], part: ['magic', 'mint', 6], mus: [50, 88, 1] },
    { key: 'ab_ember', name: '灼熱の坑道', g: [86, 40, 28], d: [100, 52, 34], c: [96, 60, 40], st: ['rgba(255,140,60,0.25)', 'rgba(30,8,4,0.5)'], sky: ['#0a0302', '#1e0806'], water: '#d0561e', tuft: ['#3a1a10', '#5a2814', '#7a3818', '#a04a1c'], fl: ['#ffb050', '#ff7030'], tint: [0.95, 0.7, 0.6], dark: 0.7, mm: [[120, 56, 40], [140, 72, 48], [220, 90, 40], [50, 20, 14], [150, 90, 60]], ponds: 5,
      props: [['spire', 0.42, [2, 3]], ['rock', 0.38, [0, 1, 2]], ['lamp', 0.08, [0]], ['crystal', 0.12, [1]]], kinds: [['ant', 0.55], ['goblin', 0.25], ['undead', 0.2]], part: ['ember', 'warm', 10], mus: [52, 108, 2] },
    { key: 'ab_frost', name: '氷晶の洞', g: [96, 120, 150], d: [120, 140, 164], c: [110, 120, 140], st: ['rgba(230,245,255,0.35)', 'rgba(30,50,80,0.35)'], sky: ['#06101c', '#14243a'], water: '#5ec8e8', tuft: ['#7a94b0', '#9ab4cc', '#c0d6e6', '#e6f2fa'], fl: ['#ffffff', '#bfe8ff'], tint: [0.78, 0.9, 1.08], dark: 0.58, mm: [[150, 180, 210], [170, 190, 210], [94, 200, 232], [60, 80, 110], [140, 150, 170]], ponds: 4,
      props: [['crystal', 0.45, [0]], ['spire', 0.25, [2, 3]], ['rock', 0.25, [0, 1, 2]], ['lamp', 0.05, [0]]], kinds: [['undead', 0.5], ['goblin', 0.3], ['ant', 0.2]], part: ['magic', 'white', -14], mus: [57, 76, 0] },
    { key: 'ab_bone', name: '骸の納骨堂', g: [76, 72, 64], d: [104, 98, 88], c: [92, 80, 68], st: ['rgba(230,220,200,0.25)', 'rgba(20,16,10,0.45)'], sky: ['#0a0806', '#1c1812'], water: '#5a6a50', tuft: ['#3a362e', '#55503f', '#706a56', '#948c74'], fl: ['#e8e0c8', '#c8b8ff'], tint: [0.86, 0.82, 0.76], dark: 0.76, mm: [[110, 104, 92], [140, 134, 120], [90, 106, 80], [40, 36, 30], [120, 100, 80]], ponds: 2,
      props: [['tomb', 0.45, [0, 1, 2]], ['lamp', 0.08, [0]], ['tree', 0.17, [5, 6]], ['rock', 0.3, [0, 1, 2]]], kinds: [['undead', 0.8], ['goblin', 0.1], ['ant', 0.1]], part: ['dust', '', 6], mus: [50, 66, 3] },
    { key: 'ab_sand', name: '砂に沈んだ神殿', g: [150, 120, 70], d: [170, 140, 90], c: [140, 110, 70], st: ['rgba(255,230,170,0.35)', 'rgba(80,50,20,0.35)'], sky: ['#0e0a04', '#241a0c'], water: '#3aa0a0', tuft: ['#7a6430', '#9a8040', '#c0a058', '#e0c47a'], fl: ['#ffd166', '#ff9a5a'], tint: [1.0, 0.9, 0.72], dark: 0.55, mm: [[200, 170, 110], [170, 130, 80], [58, 160, 160], [100, 80, 40], [180, 130, 90]], ponds: 2,
      props: [['spire', 0.4, [0, 1]], ['rock', 0.3, [0, 1, 2]], ['bush', 0.12, [3]], ['lamp', 0.06, [0]], ['tomb', 0.12, [2]]], kinds: [['goblin', 0.5], ['ant', 0.3], ['undead', 0.2]], part: ['dust', '', 8], mus: [55, 96, 4] },
    { key: 'ab_toxic', name: '毒霧の底', g: [60, 80, 30], d: [80, 90, 40], c: [70, 70, 40], st: ['rgba(200,255,100,0.25)', 'rgba(10,20,0,0.5)'], sky: ['#050800', '#121c04'], water: '#8acb2a', tuft: ['#2e3a10', '#465a18', '#68822a', '#9ab440'], fl: ['#d6ff5a', '#a0ff80'], tint: [0.8, 0.95, 0.6], dark: 0.72, mm: [[90, 120, 50], [110, 120, 60], [138, 203, 42], [30, 40, 10], [110, 100, 60]], ponds: 8,
      props: [['tree', 0.3, [5, 6]], ['bush', 0.25, [3, 4]], ['rock', 0.2, [0, 1, 2]], ['spire', 0.2, [2, 3]], ['lamp', 0.05, [0]]], kinds: [['ant', 0.45], ['undead', 0.35], ['goblin', 0.2]], part: ['magic', 'mint', 5], mus: [48, 84, 2] },
    { key: 'ab_blood', name: '血涙の回廊', g: [70, 24, 30], d: [90, 36, 40], c: [80, 40, 44], st: ['rgba(255,90,100,0.25)', 'rgba(20,0,4,0.5)'], sky: ['#0a0204', '#1e060a'], water: '#8a1424', tuft: ['#3a0e14', '#56141e', '#7a1e2a', '#a02a38'], fl: ['#ff5a6a', '#ffa0a8'], tint: [0.95, 0.6, 0.64], dark: 0.8, mm: [[120, 40, 50], [140, 60, 64], [160, 30, 46], [40, 10, 14], [140, 80, 80]], ponds: 4,
      props: [['spire', 0.35, [2, 3]], ['tomb', 0.2, [0, 1, 2]], ['lamp', 0.08, [0]], ['rock', 0.3, [0, 1, 2]], ['tree', 0.07, [6]]], kinds: [['undead', 0.45], ['goblin', 0.35], ['ant', 0.2]], part: ['magic', 'amber', 5], mus: [46, 116, 3] },
    { key: 'ab_void', name: '虚無の淵', g: [28, 20, 44], d: [40, 30, 60], c: [50, 36, 70], st: ['rgba(180,120,255,0.3)', 'rgba(0,0,0,0.5)'], sky: ['#020104', '#08040e'], water: '#4a2a8a', tuft: ['#1a1030', '#281a46', '#3a2864', '#5a40a0'], fl: ['#c9a6ff', '#9ff3ff'], tint: [0.7, 0.6, 1.0], dark: 0.9, mm: [[50, 40, 80], [70, 60, 100], [90, 60, 170], [16, 10, 26], [100, 80, 140]], ponds: 3,
      props: [['crystal', 0.4, [1]], ['spire', 0.35, [2, 3]], ['rock', 0.25, [0, 1, 2]]], kinds: [['goblin', 0.34], ['undead', 0.33], ['ant', 0.33]], part: ['magic', 'violet', 5], mus: [44, 92, 5] },
    { key: 'ab_star', name: '星の終わる場所', g: [20, 28, 50], d: [30, 40, 70], c: [44, 50, 90], st: ['rgba(200,230,255,0.45)', 'rgba(255,240,180,0.3)'], sky: ['#010208', '#060a1c'], water: '#2a6aca', tuft: ['#141c3a', '#1e2a54', '#2c3c76', '#4a5aa8'], fl: ['#ffffff', '#ffe27a'], tint: [0.7, 0.78, 1.05], dark: 0.82, mm: [[40, 50, 90], [60, 70, 120], [42, 106, 202], [10, 14, 30], [90, 90, 150]], ponds: 4,
      props: [['crystal', 0.4, [0, 1]], ['spire', 0.3, [2, 3]], ['lamp', 0.05, [0]], ['rock', 0.25, [0, 1, 2]]], kinds: [['undead', 0.34], ['goblin', 0.33], ['ant', 0.33]], part: ['magic', 'gold', 4], mus: [45, 104, 1] }
  ];
  const ABYSS_T = {};
  (function initThemes() {
    const ramp = (c) => [0.62, 0.8, 1, 1.2, 1.42].map((k) => c.map((v) => Math.min(255, Math.round(v * k))));
    THEMES.forEach((T, i) => {
      T.idx = i;
      if (T.key === 'cave') return;
      ABYSS_T[T.key] = T;
      TEX_PAL[T.key] = { grass: ramp(T.g), dirt: ramp(T.d), camp: ramp(T.c), strokes: [T.st[0], T.st[1], T.st[0], T.st[1]] };
      BIOMES[T.key] = { sky: T.sky, water: T.water, tuft: T.tuft, tuftN: 1, flowers: 0.04, flowerCols: T.fl, reeds: false, tint: T.tint, minDark: T.dark,
        mm: { g: T.mm[0], p: T.mm[1], w: T.mm[2], s: T.mm[3], c: T.mm[4] } };
    });
  })();
  function themeOf(f) { return THEMES[Math.min(THEMES.length - 1, Math.floor((Math.max(1, f) - 1) / 5))]; }
  function curTheme() { return curMap === 3 ? themeOf(curFloor) : null; }
  function abyssProp(T, edge, R, i, j) {
    let r = R() * T.props.reduce((a, p) => a + p[1], 0), pick = T.props[0];
    for (const p of T.props) { r -= p[1]; if (r <= 0) { pick = p; break; } }
    let kind = pick[0];
    if ((kind === 'crystal' || kind === 'lamp' || kind === 'tomb') && edge < 3) kind = 'rock';
    const v = kind === 'rock' ? Math.floor(R() * 3) : pick[2][Math.floor(R() * pick[2].length)];
    const ph = R() * TAU;
    if (kind === 'tree' || kind === 'bush') return { kind, v, x: i + 0.5 + (R() - 0.5) * 0.2, y: j + 0.5 + (R() - 0.5) * 0.2, s: 0.88 + R() * 0.28, ph };
    return { kind, v, x: i + 0.5, y: j + 0.5, s: kind === 'spire' ? 0.7 + R() * 0.35 : 0.85 + R() * 0.35, ph };
  }
  let ambT = 0;
  function abyssAmbient(dt) {
    const T = curTheme();
    if (!T || !T.part) return;
    if (Math.random() < dt * 3) { const x = Math.floor(cam.x + rand(-9, 9)), y = Math.floor(cam.y + rand(-9, 9)); if (tileAt(x, y) === T_PIT) addPart({ k: 'magic', x: x + Math.random(), y: y + Math.random(), z: -20, vx: 0, vy: 0, vz: rand(14, 26), t: 0, life: rand(1.6, 2.6), s: rand(0.6, 1.1), c: 'violet' }); }
    const P = T.part, fall = P[2] < 0;
    ambT -= dt * Math.abs(P[2]);
    while (ambT <= 0) {
      ambT += 1;
      addPart({ k: P[0], x: cam.x + rand(-8, 8), y: cam.y + rand(-8, 8), z: fall ? rand(60, 120) : rand(0, 24), vx: rand(-0.15, 0.15), vy: rand(-0.15, 0.15), vz: fall ? rand(-26, -14) : rand(5, 16), t: 0, life: rand(2, 4), s: rand(0.5, 1.05), c: P[1] });
    }
  }
  function moodDef(name) {
    if (MOODS[name]) return MOODS[name];
    if (name === 'final') {
      MOODS.final = Object.assign({}, MOODS.boss, { bpm: 148, key: 44, prog: [[44, MIN], [40, MAJ], [43, MAJ], [42, MIN]], scale: SCALES[3], pad: ['sawtooth', 1100, 0.03], arp: [0.95, 'sawtooth', 0.026, 2200, 12], mel: [0.3, 'square', 0.03], drum: 2, bass: [3, 'sawtooth', 0.08] });
      return MOODS.final;
    }
    const T = THEMES[+name.slice(5)] || THEMES[0], k = T.mus[0], i = T.idx;
    const prog = i % 2 ? [[k, MIN], [k - 4, MAJ], [k - 2, MAJ], [k - 5, MIN]] : [[k, MIN], [k + 1, MAJ], [k - 2, MAJ], [k - 5, MIN]];
    MOODS[name] = Object.assign({}, MOODS.abyss, { bpm: T.mus[1], key: k, prog, scale: SCALES[T.mus[2]],
      arp: i % 3 === 0 ? [0.7, 'square', 0.022, 1000, 12] : i % 3 === 1 ? [0.55, 'triangle', 0.04, 0, 24] : [0.6, 'sawtooth', 0.026, 1500, 12],
      pad: [i % 2 ? 'triangle' : 'sawtooth', i % 2 ? 1000 : 650, i % 2 ? 0.035 : 0.024], drum: T.mus[1] > 90 ? 1 : 0, bass: [T.mus[1] > 90 ? 3 : 1, T.mus[1] > 90 ? 'sawtooth' : 'triangle', T.mus[1] > 90 ? 0.06 : 0.1] });
    return MOODS[name];
  }

  /* ---------- the lord of the abyss (B50F) ---------- */
  const FINAL_NAME = '深淵の主';
  const FINAL_LINES = ['深淵の主「……ここまで辿り着くか、ふたつの魂を持つ者よ」', '深淵の主「ならば、底の底まで沈めてやろう」', '深淵の主「まだだ……星が落ちきるまでは！」', '深淵の主「おのれ……おのれぇぇ！」'];
  function bossName(e) { return e.world ? wbDef().name : e.final ? FINAL_NAME : (BOSS_NAMES[enemyKey(e)] || 'ボス'); }
  function spawnFinal() {
    const t = farTile();
    const e = makeEnemy('undead', t[0], t[1], MAPS[3].base + 8, ++packSeq, true);
    e.cv = 0; e.boss = true; e.final = true;
    e.maxHp = e.hp = Math.round(e.hp * 42); e.dmg *= 2.3; e.r = 0.8; e.aggro = 12; e.exp *= 40; e.armor = (e.armor || 0) * 1.5;
    e.speed *= 1.1; e.sumT = 12; e.cdA = 2.5; e.cdB = 5; e.cdC = 9; e.phase = 1;
    enemies.push(e);
    bossRef = e;
    toast(FINAL_NAME + 'がこの最下層のどこかで待っている……');
  }
  function finalPhaseOf(e) { const f = e.hp / e.maxHp; return f > 0.7 ? 1 : f > 0.4 ? 2 : f > 0.15 ? 3 : 4; }
  function starfall(e, n) {
    sfx('warn');
    for (let k = 0; k < n; k++) {
      const a = Math.random() * TAU, r = rand(1, 6), x = e.x + Math.cos(a) * r, y = e.y + Math.sin(a) * r;
      if (!blockedAt(x, y, 0.1)) slams.push({ x, y, t: -k * 0.07, at: 1.1, r: 1.1, dmg: e.dmg * 1.5 });
    }
    slams.push({ x: player.x, y: player.y, t: 0, at: 1.2, r: 1.2, dmg: e.dmg * 1.5 });
  }
  function finalThink(e, dt, dp) {
    const ph = finalPhaseOf(e);
    if (ph > e.phase) {
      e.phase = ph;
      if (!e.world) { toast(FINAL_LINES[ph - 1]); log(FINAL_LINES[ph - 1]); }
      addShake(14); sfx('cry'); flash();
      burst(e.x, e.y, 40, 'magic', 40, 'violet', 3);
      if (ph === 2) summonMinions(e, 4);
      if (ph === 3) fireRing(e, 24, 0);
      if (ph === 4) { e.enraged = true; e.speed *= 1.3; e.atkInt *= 0.75; starfall(e, 20); }
    }
    if (e.charge) return chargeStep(e, dt);
    const rate = ph === 4 ? 1.6 : ph === 3 ? 1.25 : 1;
    e.cdA -= dt * rate; e.cdB -= dt * rate; e.cdC -= dt * rate; e.sumT -= dt * rate;
    if (e.wave > 0) { e.wave -= dt; if (e.wave <= 0) fireRing(e, 18, Math.PI / 18); }
    if (e.state !== 'chase' || player.dead || dp > 13) return false;
    if (e.cdA <= 0) {
      e.cdA = 4;
      if (ph === 1) boneRain(e, 9); else { fireRing(e, ph >= 3 ? 20 : 16, Math.random() * TAU); if (ph >= 3) e.wave = 0.55; }
    }
    if (e.cdB <= 0) {
      e.cdB = 6.5;
      if (ph === 1) { sfx('warn'); slams.push({ x: player.x, y: player.y, t: 0, at: 1.25, r: 2.2, dmg: e.dmg * 2.4 }); }
      else if (ph === 2) fissures(e, 6);
      else { startCharge(e); return true; }
    }
    if (ph >= 2 && e.cdC <= 0) { e.cdC = ph >= 3 ? 8 : 10; if (ph >= 3) { starfall(e, 14); firePools(e, 3); } else boneRain(e, 12); }
    if (e.sumT <= 0) {
      e.sumT = 15;
      for (const ty of ['goblin', 'undead', 'ant']) {
        const a = Math.random() * TAU, x = e.x + Math.cos(a) * 2, y = e.y + Math.sin(a) * 2;
        if (blockedAt(x, y, 0.25)) continue;
        const m = makeEnemy(ty, x, y, MAPS[3].base + 2, e.pack, true);
        m.state = 'chase'; enemies.push(m);
      }
      burst(e.x, e.y, 20, 'magic', 24, 'violet', 2.4);
    }
    return false;
  }
  function finalVictory(e) {
    prog.cleared = (prog.cleared || 0) + 1;
    const nxRank = rankUnlock();
    for (let k = 0; k < 3; k++) {
      const it = genItem(e.lvl + 4, 3);
      it.isNew = true;
      loot.push({ x: e.x + rand(-0.8, 0.8), y: e.y + rand(-0.8, 0.8), it, t: 0, sx: e.x, sy: e.y });
    }
    prog.gold += 50000;
    save();
    hitStop = 0.6; addShake(22); flash(); sfx('legend');
    clearT = 1.8;
    clearMsg = () => playEnding(() => {
      $('clearText').textContent = '深淵の主を倒し、全50層の深淵を踏破した！ レジェンド装備3つと50000Gを手に入れた。（踏破' + prog.cleared + '回目／Lv' + prog.level + '）';
      $('clearNext').hidden = rankNow() >= 10;
      $('clearNext').textContent = '深淵の位階' + ROMAN[nxRank] + 'に挑む（敵Lv+' + nxRank * 25 + '）';
      $('clearDlg').hidden = false; paused = true;
    });
  }
