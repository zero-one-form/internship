
  /* ================= sound: procedural effects + generative music ================= */
  const AU = { ctx: null, last: {}, mood: '', step: 0, nextT: 0, mel: 0, switchAt: 0, timer: 0 };
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function audioInit() {
    if (AU.ctx) { if (AU.ctx.state !== 'running' && !document.hidden) AU.ctx.resume().catch(() => {}); return; }
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* unsupported */ }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    let c;
    try { c = new AC(); } catch (e) { return; }
    AU.ctx = c;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    comp.connect(c.destination);
    AU.master = c.createGain(); AU.master.connect(comp);
    AU.se = c.createGain(); AU.se.connect(AU.master);
    AU.bgm = c.createGain(); AU.bgm.connect(AU.master);
    AU.mus = c.createGain(); AU.mus.gain.value = 0.0001; AU.mus.connect(AU.bgm);
    const rv = c.createConvolver();
    rv.buffer = makeIR(c, 2.4);
    rv.connect(AU.master);
    const rs = c.createGain(); rs.gain.value = 0.3; AU.bgm.connect(rs); rs.connect(rv);
    const ss = c.createGain(); ss.gain.value = 0.12; AU.se.connect(ss); ss.connect(rv);
    const n = c.sampleRate, nb = c.createBuffer(1, n, n), d = nb.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    AU.nb = nb;
    applyVolume();
    AU.nextT = c.currentTime + 0.1;
    AU.timer = setInterval(musicTick, 60);
    if (c.state === 'suspended') c.resume().catch(() => {});
  }
  function makeIR(c, sec) {
    const n = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); }
    return b;
  }
  function applyVolume() {
    if (!AU.ctx) return;
    const o = opt(), t = AU.ctx.currentTime;
    AU.bgm.gain.setTargetAtTime(Math.max(0.0001, o.bgm * 0.55), t, 0.1);
    AU.se.gain.setTargetAtTime(Math.max(0.0001, o.se * 0.8), t, 0.05);
  }
  function vc(t, f, d, type, v, f2, lp, dest) {
    const c = AU.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    let nd = o;
    if (lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); nd = fl; }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + Math.min(0.012, d * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    nd.connect(g); g.connect(dest || AU.se);
    o.start(t); o.stop(t + d + 0.03);
  }
  function nz(t, d, v, ft, f, f2, q, dest) {
    const c = AU.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = AU.nb; s.loop = true;
    fl.type = ft; fl.frequency.setValueAtTime(f, t);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + d);
    fl.Q.value = q || 0.9;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + Math.min(0.01, d * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(fl); fl.connect(g); g.connect(dest || AU.se);
    s.start(t, Math.random() * 0.5); s.stop(t + d + 0.03);
  }
  function pad(t, f, d, v, type, lp) {
    const c = AU.ctx, o = c.createOscillator(), o2 = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain();
    o.type = o2.type = type;
    o.frequency.value = f; o2.frequency.value = f; o2.detune.value = 8;
    fl.type = 'lowpass'; fl.frequency.value = lp;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + Math.min(0.8, d * 0.35));
    g.gain.setValueAtTime(v, t + d * 0.7);
    g.gain.linearRampToValueAtTime(0.0001, t + d);
    o.connect(fl); o2.connect(fl); fl.connect(g); g.connect(AU.mus);
    o.start(t); o2.start(t); o.stop(t + d + 0.05); o2.stop(t + d + 0.05);
  }
  const SFX = {
    ui: (t) => vc(t, 1800, 0.035, 'sine', 0.05),
    swing: (t) => nz(t, 0.13, 0.22, 'bandpass', 2400, 700, 1.2),
    bolt: (t) => { vc(t, 520, 0.14, 'triangle', 0.12, 1100); vc(t + 0.02, 1040, 0.1, 'sine', 0.05, 1600); },
    hit: (t) => { nz(t, 0.07, 0.24, 'lowpass', 2200, 400); vc(t, 170, 0.09, 'sine', 0.28, 60); },
    crit: (t) => { SFX.hit(t); vc(t, 1400, 0.16, 'square', 0.05, 900, 3000); nz(t, 0.12, 0.14, 'highpass', 5000); },
    kill: (t) => { const m = AU.pm || 1; nz(t, 0.25, 0.13, 'lowpass', 1600 * m, 200); vc(t, 300 * m, 0.22, 'triangle', 0.08, 90 * m); vc(t + 0.02, 880 * m, 0.12, 'sine', 0.035); },
    coin: (t) => { vc(t, 1976, 0.09, 'square', 0.035, 0, 4000); vc(t + 0.07, 2637, 0.18, 'square', 0.035, 0, 4000); },
    pick: (t) => { vc(t, 880, 0.08, 'triangle', 0.1); vc(t + 0.06, 1320, 0.14, 'triangle', 0.1); },
    rare: (t) => { [880, 1109, 1319, 1760].forEach((f, i) => vc(t + i * 0.06, f, 0.32, 'triangle', 0.09)); },
    legend: (t) => { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => vc(t + i * 0.07, f, 0.7, 'triangle', 0.1)); nz(t, 0.9, 0.06, 'highpass', 6000); },
    level: (t) => { [[523, 0], [659, 0.1], [784, 0.2], [1047, 0.32]].forEach(([f, d]) => { vc(t + d, f, d > 0.3 ? 0.8 : 0.14, 'square', 0.06, 0, 2400); vc(t + d, f / 2, 0.3, 'triangle', 0.08); }); nz(t + 0.32, 0.8, 0.05, 'highpass', 7000); },
    hurt: (t) => { nz(t, 0.1, 0.2, 'lowpass', 900, 200); vc(t, 220, 0.12, 'square', 0.05, 110, 900); },
    death: (t) => { [440, 415, 370, 330].forEach((f, i) => vc(t + i * 0.22, f, 0.5, 'triangle', 0.1)); },
    morph: (t) => { vc(t, 300, 0.45, 'sawtooth', 0.06, 1200, 1800); [660, 990, 1320].forEach((f, i) => vc(t + 0.1 + i * 0.05, f, 0.4, 'sine', 0.06)); nz(t, 0.4, 0.08, 'bandpass', 800, 5000, 2); },
    potion: (t) => { for (let i = 0; i < 3; i++) vc(t + i * 0.08, 300 + i * 120, 0.09, 'sine', 0.12, 700 + i * 200); },
    heal: (t) => { [784, 988, 1175, 1568].forEach((f, i) => vc(t + i * 0.08, f, 0.6, 'sine', 0.08)); },
    portal: (t) => { vc(t, 180, 0.7, 'sine', 0.15, 900); vc(t, 270, 0.7, 'triangle', 0.06, 1350); nz(t, 0.7, 0.07, 'bandpass', 400, 3000, 3); },
    warn: (t) => { for (let i = 0; i < 3; i++) vc(t + i * 0.2, 110, 0.16, 'sawtooth', 0.09, 0, 600); },
    anvil: (t) => { vc(t, 1480, 0.5, 'square', 0.05, 0, 3500); vc(t, 2230, 0.4, 'sine', 0.05); nz(t, 0.05, 0.2, 'highpass', 3000); SFX.rare(t + 0.15); },
    fail: (t) => { vc(t, 160, 0.3, 'square', 0.08, 90, 600); nz(t, 0.12, 0.15, 'lowpass', 600); },
    quest: (t) => { [659, 784, 1047, 1319].forEach((f, i) => vc(t + i * 0.09, f, 0.5, 'triangle', 0.09)); },
    slam: (t) => { vc(t, 130, 0.4, 'sine', 0.35, 40); nz(t, 0.35, 0.25, 'lowpass', 1200, 120); },
    whoosh: (t) => nz(t, 0.25, 0.25, 'bandpass', 500, 3500, 1.5),
    bash: (t) => { nz(t, 0.08, 0.3, 'lowpass', 1500, 300); vc(t, 240, 0.12, 'square', 0.08, 120, 1200); vc(t, 900, 0.18, 'sine', 0.05); },
    cry: (t) => { vc(t, 196, 0.6, 'sawtooth', 0.09, 147, 1200); vc(t, 294, 0.6, 'sawtooth', 0.06, 220, 1200); },
    aura: (t) => { vc(t, 110, 0.9, 'sawtooth', 0.08, 440, 1600); [440, 554, 659].forEach((f) => vc(t + 0.3, f, 0.8, 'triangle', 0.05)); },
    zap: (t) => { vc(t, 1600, 0.18, 'sawtooth', 0.07, 200, 5000); nz(t, 0.2, 0.18, 'highpass', 3000); },
    fire: (t) => { nz(t, 0.3, 0.2, 'bandpass', 600, 1800, 0.8); vc(t, 200, 0.25, 'triangle', 0.08, 500); },
    boom: (t) => { vc(t, 90, 0.6, 'sine', 0.4, 30); nz(t, 0.7, 0.3, 'lowpass', 1400, 100); },
    ice: (t) => { [2093, 2637, 3136].forEach((f, i) => vc(t + i * 0.04, f, 0.4, 'sine', 0.05)); nz(t, 0.4, 0.1, 'highpass', 4000, 9000); },
    vortex: (t) => { vc(t, 600, 0.9, 'sawtooth', 0.05, 80, 900); nz(t, 0.9, 0.12, 'bandpass', 3000, 300, 2); }
  };
  const SK_SFX = { skyfall: 'slam', blades: 'whoosh', storm: 'zap', gravity: 'vortex', whirl: 'slam', sprint: 'whoosh', gale: 'whoosh', bash: 'bash', rend: 'slam', cry: 'cry', aura: 'aura', dance: 'whoosh', chain: 'zap', fireball: 'fire', heal: 'heal', frost: 'ice', lance: 'zap', meteor: 'fire', vortex: 'vortex' };
  function sfx(name) {
    const c = AU.ctx;
    if (!c || c.state !== 'running' || opt().se <= 0 || !SFX[name]) return;
    const now = c.currentTime;
    if (now - (AU.last[name] || 0) < 0.045) return;
    AU.last[name] = now;
    try { SFX[name](now + 0.005); } catch (e) { /* ignore */ }
  }

  /* ---------- music ---------- */
  const MAJ = [0, 4, 7], MIN = [0, 3, 7];
  const MOODS = {
    forest: { bpm: 82, prog: [[62, MAJ], [59, MIN], [55, MAJ], [57, MAJ]], scale: [0, 2, 4, 7, 9], key: 62, pad: ['triangle', 1400, 0.035], arp: [0.5, 'triangle', 0.045, 0, 12], mel: [0.3, 'sine', 0.05], bass: [1, 'triangle', 0.09], drum: 0 },
    night: { bpm: 64, prog: [[57, MIN], [53, MAJ], [48, MAJ], [55, MAJ]], scale: [0, 3, 5, 7, 10], key: 57, pad: ['sine', 900, 0.045], arp: [0.25, 'sine', 0.04, 0, 12], mel: [0.15, 'sine', 0.045], bass: [1, 'sine', 0.08], drum: 0 },
    canyon: { bpm: 92, prog: [[52, MIN], [53, MAJ], [52, MIN], [50, MIN]], scale: [0, 1, 4, 5, 7, 8, 10], key: 52, pad: ['sawtooth', 800, 0.03], arp: [0.5, 'sawtooth', 0.04, 1700, 12], mel: [0.32, 'triangle', 0.06], bass: [2, 'triangle', 0.12], drum: 1 },
    grave: { bpm: 58, prog: [[50, MIN], [46, MAJ], [48, MAJ], [45, MIN]], scale: [0, 2, 3, 5, 7, 8, 10], key: 50, pad: ['triangle', 800, 0.04], arp: [0.18, 'sine', 0.045, 0, 24], mel: [0.1, 'triangle', 0.04], bass: [1, 'sine', 0.08], drum: 0 },
    abyss: { bpm: 100, prog: [[45, MIN], [41, MAJ], [43, MAJ], [40, MIN]], scale: [0, 2, 3, 5, 7, 8, 10], key: 45, pad: ['sawtooth', 600, 0.022], arp: [0.7, 'square', 0.022, 1000, 12], mel: [0.15, 'triangle', 0.04], bass: [3, 'sawtooth', 0.06], drum: 1 },
    boss: { bpm: 132, prog: [[45, MIN], [46, MAJ], [45, MIN], [44, MAJ]], scale: [0, 1, 4, 5, 7, 8, 10], key: 45, pad: ['sawtooth', 900, 0.025], arp: [0.9, 'sawtooth', 0.022, 1800, 12], mel: [0.2, 'square', 0.028], bass: [3, 'sawtooth', 0.07], drum: 2 }
  };
  function curMood() {
    if (AU.force != null) return AU.force;
    if (curMap === 3) { const b = enemies.find((e) => e.boss && !e.dead); return b ? (b.final ? 'final' : 'boss') : 'abyss' + themeOf(curFloor).idx; }
    if (curMap === 2) return 'grave';
    if (curMap === 1) return 'canyon';
    return envDark > 0.45 ? 'night' : 'forest';
  }
  function musicTick() {
    const c = AU.ctx;
    if (!c || c.state !== 'running') return;
    const want = opt().bgm > 0 ? curMood() : '';
    if (want !== AU.mood) {
      if (!AU.switchAt) { AU.switchAt = c.currentTime + (AU.mood ? 0.9 : 0.2); AU.mus.gain.setTargetAtTime(0.0001, c.currentTime, 0.35); }
      if (c.currentTime >= AU.switchAt) {
        AU.mood = want; AU.switchAt = 0; AU.step = 0; AU.mel = 0; AU.nextT = c.currentTime + 0.08;
        if (want) { AU.mus.gain.cancelScheduledValues(c.currentTime); AU.mus.gain.setTargetAtTime(1, c.currentTime, 0.6); }
      }
    } else if (AU.switchAt) { AU.switchAt = 0; AU.mus.gain.cancelScheduledValues(c.currentTime); AU.mus.gain.setTargetAtTime(1, c.currentTime, 0.4); }
    if (!AU.mood) return;
    if (AU.nextT < c.currentTime - 0.3) AU.nextT = c.currentTime + 0.05;
    const M = moodDef(AU.mood), sd = 60 / M.bpm / 2;
    while (AU.nextT < c.currentTime + 0.25) { playStep(M, AU.step, AU.nextT, sd); AU.step++; AU.nextT += sd; }
  }
  function playStep(M, s, t, sd) {
    const pos = s % 8, ch = M.prog[Math.floor(s / 8) % M.prog.length], root = ch[0], iv = ch[1];
    if (pos === 0) for (const k of iv) pad(t, mtof(root + 12 + k), sd * 8 * 1.03, M.pad[2], M.pad[0], M.pad[1]);
    const bm = M.bass[0];
    if (bm === 3 || pos === 0 || pos === 4 || (bm === 2 && (pos === 3 || pos === 6))) vc(t, mtof(root - 12), bm === 3 ? sd * 0.9 : sd * 1.8, M.bass[1], M.bass[2], 0, bm === 3 ? 500 : 900, AU.mus);
    if (Math.random() < M.arp[0]) { const tones = [iv[0], iv[1], iv[2], 12, iv[1] + 12]; vc(t, mtof(root + 12 + M.arp[4] + tones[randi(0, tones.length - 1)]), sd * 1.6, M.arp[1], M.arp[2], 0, M.arp[3], AU.mus); }
    if (pos % 2 === 0 && Math.random() < M.mel[0]) {
      AU.mel = clamp(AU.mel + randi(-2, 2), -2, 9);
      const sc = M.scale, n = sc.length, deg = ((AU.mel % n) + n) % n, oct = Math.floor(AU.mel / n);
      vc(t, mtof(M.key + 24 + sc[deg] + 12 * oct), sd * rand(1.8, 3.2), M.mel[1], M.mel[2], 0, 2600, AU.mus);
    }
    if (M.drum >= 1 && (pos === 0 || pos === 4)) vc(t, 140, 0.22, 'sine', M.drum === 2 ? 0.3 : 0.18, 45, 0, AU.mus);
    if (M.drum === 2 && (pos === 2 || pos === 6)) { vc(t, 150, 0.12, 'sine', 0.2, 50, 0, AU.mus); nz(t, 0.14, 0.12, 'bandpass', 1800, 900, 0.8, AU.mus); }
    if (M.drum >= 1 && pos % 2 === 1) nz(t, 0.04, M.drum === 2 ? 0.05 : 0.03, 'highpass', 7000, 0, 0.7, AU.mus);
  }
  function audioBind() {
    const unlock = () => audioInit();
    for (const ev of ['pointerdown', 'touchend', 'click', 'keydown']) document.addEventListener(ev, unlock, { capture: true, passive: true });
    document.addEventListener('visibilitychange', () => { if (!AU.ctx) return; if (document.hidden) AU.ctx.suspend().catch(() => {}); else AU.ctx.resume().catch(() => {}); });
    document.addEventListener('click', (ev) => { const b = ev.target && ev.target.closest ? ev.target.closest('.overlay button, .tr button, .zoom button') : null; if (b) sfx('ui'); });
  }
