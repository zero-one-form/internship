
  /* ================= advanced classes (Lv20+) & ultimate arts ================= */
  const CLASSES = {
    saint: { form: 'blade', name: '剣聖', desc: '会心と手数で斬り刻む、剣の極み', pas: ['会心率 +10%・会心ダメージ +30%', '攻撃速度 +15%', '通常攻撃4回ごとに周りを薙ぐ斬撃波'], ult: ['無双剣', '2秒間、無敵のまま周りの敵を高速で斬り続ける'] },
    guard: { form: 'blade', name: '守護騎士', desc: '倒れない盾となり、反撃で薙ぎ払う', pas: ['最大HP +30%・受けるダメージ -15%', '攻撃を受けると15%で聖なる衝撃波（反撃＋HP回復）'], ult: ['聖盾陣', '4秒間無敵。HPを35%回復し、周りを吹き飛ばして気絶させる'] },
    star: { form: 'arcane', name: '星詠み', desc: '星の力で戦場ごと焼き払う', pas: ['攻撃力 +15%・再使用時間 -10%', 'スキルのMP消費 -20%', '魔法弾が20%で3つに分かれる'], ult: ['星界崩落', '3秒間、周りに流星を降らせ続ける'] },
    soul: { form: 'arcane', name: '魂歌い', desc: '魂の歌で傷を癒し、精霊と共に戦う', pas: ['最大MP +30%・MP回復 +5/秒', 'HPが毎秒1%回復・HP吸収 +2%', '奥義ゲージが1.5倍たまる'], ult: ['魂の詠唱', '15秒間、3体の精霊が敵を撃ち、HPを回復し続ける'] }
  };
  var ULT = { v: 0, kind: '', t: 0, tick: 0, inv: 0, spirits: 0, sTick: 0, hTick: 0, promptT: 2, shown: -1 };
  function clsOf(form) { return prog.cls && prog.cls[form] && CLASSES[prog.cls[form]] ? prog.cls[form] : null; }
  function curCls() { return clsOf(player.form); }
  function classMods(d, form) {
    const c = clsOf(form);
    if (c === 'saint') { d.crit = Math.min(0.85, d.crit + 0.1); d.critMul += 0.3; d.interval /= 1.15; }
    else if (c === 'guard') { d.maxHp = Math.round(d.maxHp * 1.3); d.guard = Math.min(0.85, d.guard + 0.15); }
    else if (c === 'star') { d.atk *= 1.15; d.cdr = Math.min(0.7, d.cdr + 0.1); }
    else if (c === 'soul') { d.maxMp = Math.round(d.maxMp * 1.3); d.mpRegen += 5; d.steal += 0.02; }
    return d;
  }
  function classMpMul() { return curCls() === 'star' ? 0.8 : 1; }
  function ultGain(n) { const c = curCls(); if (!c || ULT.kind) return; ULT.v = Math.min(100, ULT.v + n * (c === 'soul' ? 1.5 : 1)); }
  function foes(x, y, r) { const out = []; for (const o of enemies) if (!o.dead && !o.obj && hyp(o.x - x, o.y - y) < r) out.push(o); return out; }
  function classOnBasic(e) {
    const c = curCls();
    if (c === 'saint') {
      player.basicN = (player.basicN || 0) + 1;
      if (player.basicN % 4 === 0) {
        for (const o of foes(e.x, e.y, 2.1)) if (o !== e) hitEnemy(o, D.atk * 0.6);
        addVfx({ k: 'ring', x: e.x, y: e.y, R: 2.1, c: '255,214,120', w: 7, life: 0.35 });
        addVfx({ k: 'swoosh', x: e.x, y: e.y, h: 26, a: Math.random() * 3, dir: 1, c: '255,236,170', big: true, life: 0.26 });
      }
    } else if (c === 'star' && Math.random() < 0.2) {
      const near = foes(player.x, player.y, 6).filter((o) => o !== e).slice(0, 2);
      for (const o of near) shots.push({ x: player.x, y: player.y, h: 34, tgt: o, dmg: D.atk * 0.7, sp: 11, trail: [] });
    }
  }
  function classOnHurt() {
    if (curCls() !== 'guard' || Math.random() > 0.15 || player.dead) return;
    for (const o of foes(player.x, player.y, 2.2)) hitEnemy(o, D.atk * 0.8);
    player.hp = Math.min(D.maxHp, player.hp + D.maxHp * 0.03);
    addVfx({ k: 'ring', x: player.x, y: player.y, R: 2.2, c: '255,230,150', w: 8, life: 0.4 });
    sfx('bash');
  }
  function classOnKill(e) {
    ultGain(e.boss ? 30 : e.elite ? 12 : e.obj ? 0 : 3);
  }
  function useUlt() {
    const c = curCls();
    if (paused || player.dead || transit) return;
    if (!c) { toast(prog.level >= 20 ? '上位職を選ぶと奥義が使える' : 'Lv20で上位職になると奥義が使える'); return; }
    if (ULT.kind) return;
    if (ULT.v < 100) { toast('奥義ゲージ ' + Math.floor(ULT.v) + '%（敵を倒すとたまる）'); return; }
    ULT.v = 0; ULT.kind = c; ULT.tick = 0;
    const C = CLASSES[c];
    toast('奥義「' + C.ult[0] + '」！');
    addVfx({ k: 'sflash', c: c === 'saint' || c === 'guard' ? '255,220,140' : '190,170,255', a: 0.35, life: 0.45 });
    addVfx({ k: 'pillar', x: player.x, y: player.y, c: c === 'saint' || c === 'guard' ? '255,214,120' : '180,150,255', life: 0.9 });
    addShake(10); sfx('aura'); hitStop = Math.max(hitStop, 0.15);
    if (c === 'saint') { ULT.t = 2.1; ULT.inv = 2.1; }
    else if (c === 'guard') {
      ULT.t = 4; ULT.inv = 4;
      player.hp = Math.min(D.maxHp, player.hp + D.maxHp * 0.35);
      for (const o of foes(player.x, player.y, 3.6)) { hitEnemy(o, D.atk * 2.5); if (!o.dead && !o.boss) { o.stunT = 2; const dx = o.x - player.x, dy = o.y - player.y, d = hyp(dx, dy) || 1; o.kbx = dx / d * 4; o.kby = dy / d * 4; moveEnemy(o, o.x + dx / d * 0.8, o.y + dy / d * 0.8); } }
      addVfx({ k: 'ring', x: player.x, y: player.y, R: 3.8, c: '255,230,150', w: 12, life: 0.6 });
    } else if (c === 'star') {
      ULT.t = 3.2;
      for (let k = 0; k < 16; k++) {
        const t = foes(player.x, player.y, 7);
        const tg = t.length && Math.random() < 0.7 ? t[randi(0, t.length - 1)] : null, a = Math.random() * TAU, r = rand(1, 5);
        meteors.push({ x: tg ? tg.x + rand(-0.5, 0.5) : player.x + Math.cos(a) * r, y: tg ? tg.y + rand(-0.5, 0.5) : player.y + Math.sin(a) * r, at: 0.3 + k * 0.18, t: 0, dmg: D.atk * 2.2 });
      }
    } else { ULT.t = 15; ULT.spirits = 15; ULT.sTick = 0.3; ULT.hTick = 1; }
  }
  function classUpdate(dt) {
    if (ULT.inv > 0) ULT.inv = Math.max(0, ULT.inv - dt);
    if (curCls() === 'soul' && !player.dead && player.hp < D.maxHp) player.hp = Math.min(D.maxHp, player.hp + D.maxHp * 0.01 * dt);
    if (ULT.kind) {
      ULT.t -= dt;
      if (ULT.kind === 'saint' && !player.dead) {
        ULT.tick -= dt;
        if (ULT.tick <= 0) {
          ULT.tick = 0.12;
          const t = foes(player.x, player.y, 4.5);
          if (t.length) {
            const e = t[randi(0, t.length - 1)], a = Math.random() * TAU, nx = e.x + Math.cos(a) * 0.7, ny = e.y + Math.sin(a) * 0.7;
            if (!blockedAt(nx, ny, 0.2)) { player.x = nx; player.y = ny; }
            faceToward(e.x - player.x, e.y - player.y); player.swingT = player.swingDur = 0.12;
            hitEnemy(e, D.atk * 1.3);
            addVfx({ k: 'speed', life: 0.12, a: 0.3 });
            sfx('swing');
          }
        }
      }
      if (ULT.kind === 'guard' && Math.random() < dt * 4) addVfx({ k: 'ring', x: player.x, y: player.y, R: 1.4, c: '255,230,150', w: 4, life: 0.5 });
      if (ULT.kind === 'soul' && !player.dead) {
        ULT.sTick -= dt; ULT.hTick -= dt;
        if (ULT.sTick <= 0) {
          ULT.sTick = 0.7;
          for (let i = 0; i < 3; i++) {
            const a = time * 2 + i * TAU / 3, sx = player.x + Math.cos(a), sy = player.y + Math.sin(a);
            const t = foes(sx, sy, 7);
            if (!t.length) continue;
            let b = t[0], bd = 1e9; for (const o of t) { const d = hyp(o.x - sx, o.y - sy); if (d < bd) { bd = d; b = o; } }
            shots.push({ x: sx, y: sy, h: 50, tgt: b, dmg: D.atk * 0.75, sp: 10, trail: [], col: 'cyan' });
          }
        }
        if (ULT.hTick <= 0) { ULT.hTick = 1; player.hp = Math.min(D.maxHp, player.hp + D.maxHp * 0.015); }
      }
      if (ULT.t <= 0) {
        if (ULT.kind === 'saint') { for (const o of foes(player.x, player.y, 3)) hitEnemy(o, D.atk * 1.5); addVfx({ k: 'ring', x: player.x, y: player.y, R: 3, c: '255,214,120', w: 10, life: 0.5 }); addShake(12); sfx('slam'); }
        ULT.kind = ''; ULT.spirits = 0;
      }
    }
    ULT.promptT -= dt;
    if (ULT.promptT <= 0) {
      ULT.promptT = 1.5;
      if (!TEST && prog.level >= 20 && !curCls() && !paused && !player.dead && $('clsDlg').hidden && $('blessDlg').hidden) openClassDlg(player.form);
    }
    const btn = $('ultBtn');
    const show = !!curCls();
    if (btn.hidden === show) btn.hidden = !show;
    if (show) {
      const v = Math.floor(ULT.v), key = v + (ULT.kind ? 'a' : '');
      if (ULT.shown !== key) { ULT.shown = key; btn.style.setProperty('--ult', String(ULT.kind ? 1 : ULT.v / 100)); $('ultPct').textContent = ULT.kind ? '発動中' : v + '%'; btn.classList.toggle('ready', v >= 100 && !ULT.kind); }
    }
  }
  function classDraw() {
    if (ULT.kind === 'soul') {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const a = time * 2 + i * TAU / 3, sx = player.x + Math.cos(a), sy = player.y + Math.sin(a), x0 = isoX(sx, sy), y0 = isoY(sx, sy) - (50 + Math.sin(time * 4 + i) * 6) * zoom, r = 16 * zoom;
        ctx.globalAlpha = 0.9; ctx.drawImage(GLOW.cyan.img, x0 - r * 1.6, y0 - r * 1.6, r * 3.2, r * 3.2);
        ctx.globalAlpha = 1; ctx.drawImage(GLOW.white.img, x0 - r * 0.5, y0 - r * 0.5, r, r);
      }
      ctx.restore();
    }
    if (ULT.inv > 0 && ULT.kind === 'guard') {
      const x0 = isoX(player.x, player.y), y0 = isoY(player.x, player.y);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 + 0.15 * Math.sin(time * 10);
      ctx.strokeStyle = 'rgba(255,230,150,1)'; ctx.lineWidth = 3 * zoom;
      ctx.beginPath(); ctx.ellipse(x0, y0 - 30 * zoom, 46 * zoom, 56 * zoom, 0, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 0.6; ctx.drawImage(GLOW.gold.img, x0 - 60 * zoom, y0 - 90 * zoom, 120 * zoom, 120 * zoom);
      ctx.restore();
    }
  }
  function openClassDlg(form) {
    if (prog.level < 20) { toast('上位職はLv20から'); return; }
    paused = true; drag.active = false;
    $('clsTitle').textContent = (form === 'blade' ? '剣の型' : '術の型') + 'の上位職を選ぶ';
    const box = $('clsCards');
    box.textContent = '';
    for (const id of Object.keys(CLASSES)) {
      const C = CLASSES[id];
      if (C.form !== form) continue;
      const card = document.createElement('button'); card.type = 'button'; card.className = 'bcard' + (clsOf(form) === id ? ' cur' : '');
      const b = document.createElement('b'); b.textContent = C.name + (clsOf(form) === id ? '（いまの上位職）' : '');
      const d = document.createElement('span'); d.textContent = C.desc;
      card.append(b, d);
      for (const p of C.pas) { const s = document.createElement('small'); s.textContent = '・' + p; card.append(s); }
      const u = document.createElement('small'); u.className = 'ultl'; u.textContent = '奥義「' + C.ult[0] + '」' + C.ult[1]; card.append(u);
      card.addEventListener('click', () => chooseClass(form, id));
      box.appendChild(card);
    }
    $('clsDlg').hidden = false;
    sfx('quest');
  }
  function chooseClass(form, id) {
    if (!prog.cls || typeof prog.cls !== 'object') prog.cls = {};
    prog.cls[form] = id;
    save(); refreshD();
    $('clsDlg').hidden = true;
    paused = !$('sheet').hidden;
    if (!$('sheet').hidden) renderSheet();
    toast(CLASSES[id].name + 'になった！ 奥義ゲージをためて右の「奥義」で発動');
    addVfx({ k: 'pillar', x: player.x, y: player.y, c: form === 'blade' ? '255,196,90' : '176,146,255', life: 1.1 });
    addVfx({ k: 'ring', x: player.x, y: player.y, R: 2.8, c: form === 'blade' ? '255,196,90' : '176,146,255', w: 9, life: 0.6 });
    sfx('level');
  }
  function renderClsInfo() {
    const box = $('clsInfo');
    if (!box) return;
    box.textContent = '';
    const c = document.createElement('div'); c.className = 'qc';
    c.append(elP('qh', '上位職（Lv20から）'));
    for (const f of ['blade', 'arcane']) { const id = clsOf(f); c.append(elP('qg', (f === 'blade' ? '剣の型：' : '術の型：') + (id ? CLASSES[id].name + '（奥義「' + CLASSES[id].ult[0] + '」）' : prog.level >= 20 ? '未選択' : 'Lv20で解放'))); }
    if (prog.level >= 20) {
      const camp = inCamp(player.x, player.y);
      const btn = elBtn('いまの型の上位職を選び直す', 'ghost small', () => { if (!inCamp(player.x, player.y)) { toast('選び直しはキャンプでできる'); return; } openClassDlg(player.form); });
      btn.disabled = !camp;
      c.append(btn);
      if (!camp) c.append(elP('ith', '選び直しはキャンプの焚き火のそばでできる（無料）'));
    }
    box.appendChild(c);
  }
