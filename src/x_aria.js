  /* ================= minigame: アリアの演奏 (two-lane rhythm game on the theme song) ================= */
  // Notes come from the theme song's beat map (OP_BEATS). Left lane = 剣, right lane = 術.
  // Clock: AudioContext time minus output latency plus the player's offset; falls back to performance.now without audio.
  const ARIA_DIFF = [
    { id: 'normal', name: 'ふつう', speed: 1.7 },
    { id: 'hard', name: 'むずかしい', speed: 1.35 },
    { id: 'master', name: '達人', speed: 1.1 }
  ];
  const ARIA_WIN = [[0.05, 'PERFECT', 1], [0.1, 'GREAT', 0.7], [0.15, 'GOOD', 0.4]];
  const ARIA_LANE = [{ c: '255,180,90', name: '剣' }, { c: '170,130,255', name: '術' }];
  var ARIA = { on: false, playing: false, diff: 0, notes: [], t0: 0, src: null, bus: null, raf: 0, fake: null, judge: null, combo: 0, maxCombo: 0, cnt: [0, 0, 0, 0], fx: [], end: 0, result: null };
  function ariaState() {
    if (!prog.aria || typeof prog.aria !== 'object') prog.aria = { day: 0, buff: false, best: [0, 0, 0] };
    return prog.aria;
  }
  function ariaChart(d) {
    const R = seeded(31 + d * 17), out = [];
    let run = 0, last = -1;
    const lane = () => {
      let l = R() < 0.5 ? 0 : 1;
      if (l === last && run >= 2) l = 1 - l;
      run = l === last ? run + 1 : 1; last = l;
      return l;
    };
    OP_BEATS.forEach((t, i) => {
      if (d === 0 && i % 2) return;
      out.push({ t, lane: lane() });
      // 達人: chord on phrase starts, off-beats in the chorus
      if (d === 2 && i % 16 === 0) out.push({ t, lane: 1 - last });
      if (d === 2 && t > 25 && i + 1 < OP_BEATS.length && i % 2 === 1) out.push({ t: (t + OP_BEATS[i + 1]) / 2, lane: lane() });
    });
    return out.map((n) => ({ t: n.t, lane: n.lane, hit: null }));
  }
  function ariaOfs() { return clamp(+(opt().ariaOfs || 0), -0.3, 0.3); }
  function ariaClock() {
    if (ARIA.fake != null) return ARIA.fake;
    if (ARIA.src && AU.ctx) return AU.ctx.currentTime - ARIA.t0 - (AU.ctx.outputLatency || AU.ctx.baseLatency || 0) + ariaOfs();
    return (performance.now() - ARIA.t0) / 1000 + ariaOfs();
  }
  function ariaOpen() {
    if (paused || player.dead || curMap === 3 || !inCamp(player.x, player.y)) return;
    ARIA.on = true; paused = true; drag.active = false;
    opLoadSong();
    $('ariaOv').hidden = false;
    ariaMenu();
  }
  function ariaMenu() {
    ARIA.playing = false; ARIA.result = null; $('ariaStop').hidden = true;
    const S = ariaState(), today = S.day === dayKey();
    const box = $('ariaPanel');
    box.hidden = false;
    $('ariaTitle').textContent = 'アリアの演奏';
    $('ariaLead').textContent = '主題歌に合わせて、左（剣）と右（術）をタップ。キーボードは D/F と J/K。' + (today ? '今日の「歌の加護」は受け取り済み。' : 'ランクB以上で、次に深淵へ潜るとき最初に祝福を1つ選べる「歌の加護」（1日1回）。');
    ariaChips();
    $('ariaOfsVal').textContent = (ariaOfs() >= 0 ? '+' : '') + Math.round(ariaOfs() * 1000) + 'ms';
    const ready = !!(OP.song || OP.songFail || TEST);
    $('ariaGo').disabled = !ready;
    $('ariaGo').textContent = ready ? 'はじめる' : '曲を読み込み中…';
    if (!ready) setTimeout(() => { if (ARIA.on && !ARIA.playing && !ARIA.result) ariaMenu(); }, 300);
    $('ariaRes').hidden = true;
  }
  function ariaChips() {
    const S = ariaState(), row = $('ariaDiffs');
    row.textContent = '';
    ARIA_DIFF.forEach((D0, k) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip' + (ARIA.diff === k ? ' on' : '');
      b.textContent = D0.name + (S.best[k] ? '（' + S.best[k] + '%）' : '');
      b.addEventListener('click', () => { ARIA.diff = k; ariaMenu(); });
      row.appendChild(b);
    });
  }
  function ariaStart() {
    $('ariaPanel').hidden = true; $('ariaStop').hidden = false;
    const d = ARIA.diff;
    ARIA.notes = ariaChart(d);
    ARIA.combo = 0; ARIA.maxCombo = 0; ARIA.cnt = [0, 0, 0, 0]; ARIA.fx.length = 0; ARIA.judge = null;
    ARIA.end = ARIA.notes[ARIA.notes.length - 1].t + 1.6;
    AU.force = '';
    audioInit();
    if (AU.ctx && OP.song && ARIA.fake == null) {
      if (!ARIA.bus) { ARIA.bus = AU.ctx.createGain(); ARIA.bus.connect(AU.master); }
      ARIA.bus.gain.value = Math.min(1, opt().bgm * 1.5 + 0.1);
      ariaStopSong();
      ARIA.src = AU.ctx.createBufferSource();
      ARIA.src.buffer = OP.song;
      ARIA.src.connect(ARIA.bus);
      ARIA.t0 = AU.ctx.currentTime + 1.2;
      ARIA.src.start(ARIA.t0);
    } else { ARIA.src = null; ARIA.t0 = performance.now() + 1200; }
    ARIA.playing = true;
    cancelAnimationFrame(ARIA.raf);
    ARIA.raf = requestAnimationFrame(ariaLoop);
  }
  function ariaStopSong() { const s = ARIA.src; ARIA.src = null; if (s) { try { s.stop(); } catch (e) { /* already stopped */ } } }
  function ariaClose() {
    ariaStopSong();
    cancelAnimationFrame(ARIA.raf);
    ARIA.on = false; ARIA.playing = false; AU.force = null;
    $('ariaOv').hidden = true;
    paused = false;
    save();
  }
  function ariaHit(lane) {
    if (!ARIA.playing) return;
    const t = ariaClock();
    let best = null;
    for (const n of ARIA.notes) {
      if (n.hit || n.lane !== lane) continue;
      if (n.t - t > ARIA_WIN[2][0]) break;
      if (Math.abs(n.t - t) <= ARIA_WIN[2][0]) { best = n; break; }
    }
    ARIA.fx.push({ k: 'tap', lane, t: 0 });
    if (!best) return;
    const dt = Math.abs(best.t - t);
    const j = ARIA_WIN.findIndex((w) => dt <= w[0]);
    best.hit = j;
    ARIA.cnt[j]++;
    ARIA.combo++; ARIA.maxCombo = Math.max(ARIA.maxCombo, ARIA.combo);
    ARIA.judge = { j, t: 0, early: best.t > t };
    ARIA.fx.push({ k: 'ring', lane, t: 0, j });
    sfx(j === 0 ? 'coin' : 'ui');
  }
  function ariaTick() {
    const t = ariaClock();
    for (const n of ARIA.notes) {
      if (n.hit != null) continue;
      if (t - n.t > ARIA_WIN[2][0]) { n.hit = 3; ARIA.cnt[3]++; ARIA.combo = 0; ARIA.judge = { j: 3, t: 0 }; }
      else break;
    }
    if (t > ARIA.end) ariaFinish();
  }
  function ariaAcc() {
    const n = ARIA.notes.length || 1;
    return Math.round((ARIA.cnt[0] + ARIA.cnt[1] * ARIA_WIN[1][2] + ARIA.cnt[2] * ARIA_WIN[2][2]) / n * 1000) / 10;
  }
  function ariaRank(acc) { return acc >= 95 ? 'S' : acc >= 85 ? 'A' : acc >= 70 ? 'B' : 'C'; }
  function ariaFinish() {
    if (!ARIA.playing) return;
    ARIA.playing = false;
    cancelAnimationFrame(ARIA.raf);
    if (ARIA.bus && AU.ctx) ARIA.bus.gain.setTargetAtTime(0.0001, AU.ctx.currentTime, 0.4);
    setTimeout(ariaStopSong, 1500);
    const S = ariaState(), acc = ariaAcc(), rank = ariaRank(acc), full = ARIA.cnt[3] === 0;
    const isBest = acc > S.best[ARIA.diff];
    if (isBest) S.best[ARIA.diff] = acc;
    if (rank !== 'C') recAdd('aria');
    const lines = [];
    if (rank !== 'C' && S.day !== dayKey()) {
      S.day = dayKey(); S.buff = true;
      const g = Math.round(prog.level * 30 * (1 + ARIA.diff * 0.5) * (rank === 'S' ? 2 : rank === 'A' ? 1.5 : 1));
      prog.gold += g;
      lines.push('「歌の加護」を得た（次に深淵へ潜るとき、最初に祝福を1つ選べる）', g + 'G を得た');
      sfx('quest');
    } else if (rank === 'C') lines.push('ランクB以上で「歌の加護」を受け取れる');
    else lines.push('今日の「歌の加護」は受け取り済み');
    if (isBest) lines.unshift('自己ベスト更新！');
    ARIA.result = { acc, rank, full, lines }; $('ariaStop').hidden = true;
    save();
    const box = $('ariaPanel');
    box.hidden = false;
    $('ariaTitle').textContent = 'ランク ' + rank + (full ? '　フルコンボ！' : '');
    $('ariaLead').textContent = ARIA_DIFF[ARIA.diff].name + '　正確さ ' + acc + '%　最大コンボ ' + ARIA.maxCombo;
    const res = $('ariaRes');
    res.hidden = false; res.textContent = '';
    const cnt = document.createElement('p');
    cnt.textContent = 'PERFECT ' + ARIA.cnt[0] + '／GREAT ' + ARIA.cnt[1] + '／GOOD ' + ARIA.cnt[2] + '／MISS ' + ARIA.cnt[3];
    res.appendChild(cnt);
    for (const l of lines) { const p = document.createElement('p'); p.textContent = l; res.appendChild(p); }
    $('ariaGo').textContent = 'もう一度';
    ariaChips();
    ariaDraw();
  }
  function ariaDiveStart() {
    if (WB.on) return;
    const S = ariaState();
    if (S.buff) { S.buff = false; blessSoon('歌の加護'); save(); }
  }
  function ariaLoop() {
    if (!ARIA.on || !ARIA.playing) return;
    ARIA.raf = requestAnimationFrame(ariaLoop);
    try { ariaTick(); ariaDraw(); } catch (e) { console.error(e); ariaClose(); }
  }
  let ariaBg = null, ariaLast = 0;
  function ariaDraw() {
    const cvs = $('ariaCv'), d = Math.min(1.5, window.devicePixelRatio || 1);
    const W2 = Math.max(1, cvs.clientWidth), H2 = Math.max(1, cvs.clientHeight);
    if (cvs.width !== Math.round(W2 * d) || cvs.height !== Math.round(H2 * d)) { cvs.width = Math.round(W2 * d); cvs.height = Math.round(H2 * d); ariaBg = null; }
    const g = cvs.getContext('2d');
    g.setTransform(d, 0, 0, d, 0, 0);
    const now = performance.now() / 1000, fdt = Math.min(0.05, ariaLast ? now - ariaLast : 0); ariaLast = now;
    if (!ariaBg) { ariaBg = g.createLinearGradient(0, 0, 0, H2); ariaBg.addColorStop(0, '#0b0820'); ariaBg.addColorStop(0.6, '#171034'); ariaBg.addColorStop(1, '#2a1a0a'); }
    g.fillStyle = ariaBg; g.fillRect(0, 0, W2, H2);
    const t = ariaClock(), sp = ARIA_DIFF[ARIA.diff].speed;
    const lw = Math.min(W2 * 0.34, 150), gap = Math.min(W2 * 0.04, 18), cx = W2 / 2;
    const top = H2 * 0.12, hitY = H2 * 0.78;
    const pulse = beatK(t, 0.25);
    for (let L = 0; L < 2; L++) {
      const x = L === 0 ? cx - gap / 2 - lw : cx + gap / 2, c = ARIA_LANE[L].c;
      const lg = g.createLinearGradient(0, top, 0, hitY);
      lg.addColorStop(0, 'rgba(' + c + ',0)'); lg.addColorStop(1, 'rgba(' + c + ',' + (0.14 + pulse * 0.12) + ')');
      g.fillStyle = lg; g.fillRect(x, top, lw, hitY - top);
      g.strokeStyle = 'rgba(' + c + ',0.9)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(x + 6, hitY); g.lineTo(x + lw - 6, hitY); g.stroke();
      g.fillStyle = 'rgba(' + c + ',0.85)'; g.font = '800 18px "Noto Sans JP", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(ARIA_LANE[L].name, x + lw / 2, hitY + 30);
      g.fillStyle = 'rgba(255,255,255,0.4)'; g.font = '700 11px sans-serif';
      g.fillText(L === 0 ? 'D / F' : 'J / K', x + lw / 2, hitY + 52);
    }
    for (const n of ARIA.notes) {
      if (n.hit != null && n.hit !== 3) continue;
      const k = (n.t - t) / sp;
      if (k > 1.05) break;
      if (k < -0.25) continue;
      const y = hitY - k * (hitY - top), x = (n.lane === 0 ? cx - gap / 2 - lw : cx + gap / 2) + lw / 2, c = ARIA_LANE[n.lane].c;
      const a = n.hit === 3 ? 0.25 : 1, r = Math.min(lw * 0.36, 30);
      g.globalAlpha = a;
      g.fillStyle = 'rgba(' + c + ',0.35)'; g.beginPath(); g.ellipse(x, y, r * 1.35, r * 0.62, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(' + c + ',1)'; g.beginPath(); g.ellipse(x, y, r, r * 0.42, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.ellipse(x - r * 0.25, y - r * 0.12, r * 0.35, r * 0.12, 0, 0, TAU); g.fill();
      g.globalAlpha = 1;
    }
    for (let i = ARIA.fx.length - 1; i >= 0; i--) {
      const f = ARIA.fx[i]; f.t += fdt;
      const x = (f.lane === 0 ? cx - gap / 2 - lw : cx + gap / 2) + lw / 2, c = ARIA_LANE[f.lane].c;
      if (f.k === 'tap') {
        if (f.t > 0.15) { ARIA.fx.splice(i, 1); continue; }
        g.fillStyle = 'rgba(' + c + ',' + (0.25 * (1 - f.t / 0.15)) + ')'; g.fillRect(x - lw / 2, top, lw, hitY - top);
      } else {
        if (f.t > 0.35) { ARIA.fx.splice(i, 1); continue; }
        const k = f.t / 0.35;
        g.strokeStyle = 'rgba(' + (f.j === 0 ? '255,240,200' : c) + ',' + (1 - k) + ')'; g.lineWidth = 4 * (1 - k) + 1;
        g.beginPath(); g.ellipse(x, hitY, lw * (0.3 + k * 0.4), lw * (0.13 + k * 0.17), 0, 0, TAU); g.stroke();
      }
    }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (ARIA.judge) {
      ARIA.judge.t += fdt;
      const J = ARIA.judge, a = Math.max(0, 1 - J.t / 0.6);
      if (a > 0) {
        g.globalAlpha = a;
        g.fillStyle = ['#ffe9a8', '#9fe3ff', '#b8f0b0', '#ff8a8a'][J.j];
        g.font = '800 ' + Math.round(Math.min(34, W2 * 0.08) * (1 + Math.max(0, 0.15 - J.t))) + 'px sans-serif';
        g.fillText(J.j === 3 ? 'MISS' : ARIA_WIN[J.j][1], cx, H2 * 0.5);
        if (J.j > 0 && J.j < 3) { g.font = '700 12px sans-serif'; g.fillText(J.early ? 'はやい' : 'おそい', cx, H2 * 0.5 + 26); }
        g.globalAlpha = 1;
      }
    }
    if (ARIA.combo >= 5) {
      g.fillStyle = 'rgba(255,255,255,0.92)'; g.font = '800 ' + Math.round(Math.min(44, W2 * 0.1)) + 'px sans-serif';
      g.fillText(String(ARIA.combo), cx, H2 * 0.38);
      g.font = '700 11px sans-serif'; g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillText('COMBO', cx, H2 * 0.38 + 28);
    }
    const prog01 = clamp(t / ARIA.end, 0, 1);
    const pw = W2 - 140;
    g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(16, 30, pw, 4);
    g.fillStyle = '#d9b25a'; g.fillRect(16, 30, pw * prog01, 4);
    for (const L of OP_LYR) {
      if (t < L[0] || t >= L[1]) continue;
      g.fillStyle = L[3] ? 'rgba(201,207,230,0.85)' : 'rgba(255,247,230,0.9)';
      g.font = '700 ' + Math.round(Math.min(17, W2 * 0.042)) + 'px "Shippori Mincho", serif';
      g.fillText(L[2], cx, top - 26);
    }
    if (t < 0) {
      g.fillStyle = 'rgba(255,255,255,0.9)'; g.font = '800 40px sans-serif';
      g.fillText(String(Math.ceil(-t)), cx, H2 * 0.45);
    }
  }
  function ariaBind() {
    $('ariaBtn').addEventListener('click', ariaOpen);
    $('ariaGo').addEventListener('click', ariaStart);
    $('ariaQuit').addEventListener('click', ariaClose);
    $('ariaStop').addEventListener('click', () => { if (ARIA.playing) { ARIA.playing = false; ariaStopSong(); cancelAnimationFrame(ARIA.raf); AU.force = ''; ariaMenu(); } });
    const ofs = (v) => { opt().ariaOfs = Math.round(clamp(ariaOfs() + v, -0.3, 0.3) * 1000) / 1000; save(); ariaMenu(); };
    $('ariaOfsDn').addEventListener('click', () => ofs(-0.01));
    $('ariaOfsUp').addEventListener('click', () => ofs(0.01));
    $('ariaCv').addEventListener('pointerdown', (ev) => {
      if (!ARIA.playing) return;
      ev.preventDefault();
      const r = $('ariaCv').getBoundingClientRect();
      ariaHit(ev.clientX - r.left < r.width / 2 ? 0 : 1);
    });
    document.addEventListener('keydown', (ev) => {
      if (!ARIA.on) return;
      ev.stopImmediatePropagation();
      if (ev.repeat) return;
      const k = (ev.key || '').toLowerCase();
      if (k === 'escape') { if (ARIA.playing) $('ariaStop').click(); else ariaClose(); return; }
      if (k === 'd' || k === 'f' || k === 'arrowleft') ariaHit(0);
      else if (k === 'j' || k === 'k' || k === 'arrowright') ariaHit(1);
    }, true);
    document.addEventListener('visibilitychange', () => { if (document.hidden && ARIA.playing) $('ariaStop').click(); });
  }
