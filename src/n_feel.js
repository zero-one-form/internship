
  /* ================= hunting feel: hit-stop, shake, knockback, combos, frenzy ================= */
  let clearT = 0, clearMsg = null;
  let hitStop = 0, shakeA = 0, combo = 0, comboT = 0, comboBest = 0, mkN = 0, mkT = 0, comboShown = -1;
  const reduceMotion = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
  function addShake(n) { if (opt().shake && !reduceMotion) shakeA = Math.max(shakeA, n); }
  function comboMul() { return 1 + Math.min(0.5, combo * 0.01); }
  function onHitFeel(e, crit) {
    vfxHit(e, crit);
    ultGain(crit ? 0.8 : 0.4);
    if (BLESS.length) blessOnHit(e);
    if (crit) { hitStop = Math.max(hitStop, 0.035); addShake(3); }
    if (!e.boss && !e.dead) {
      const dx = e.x - player.x, dy = e.y - player.y, d = hyp(dx, dy) || 1, k = crit ? 0.2 : 0.09;
      moveEnemy(e, e.x + dx / d * k, e.y + dy / d * k);
    }
  }
  function onKillFeel(e) {
    vfxKill(e);
    recKill(e);
    classOnKill(e);
    petOnKill(e);
    const dx = e.x - player.x, dy = e.y - player.y, d = hyp(dx, dy) || 1;
    if (!e.boss) { e.kbx = dx / d * 2.6; e.kby = dy / d * 2.6; }
    combo++; comboT = 3.5; comboBest = Math.max(comboBest, combo);
    AU.pm = 1 + Math.min(combo, 40) * 0.015;
    mkN++; mkT = 0.35;
    hitStop = Math.max(hitStop, e.final ? 0.6 : e.boss ? 0.3 : e.elite ? 0.06 : 0.025);
    addShake(e.boss ? 16 : e.elite ? 7 : 3.5);
    if (combo % 25 === 0) {
      player.frenzyT = 8; refreshD();
      toast('覚醒！ ' + combo + 'コンボ（攻撃・速さが上がる）');
      addVfx({ k: 'pillar', x: player.x, y: player.y, c: '255,214,90', life: 1 }); addVfx({ k: 'ring', x: player.x, y: player.y, R: 3.2, c: '255,214,90', w: 10, life: 0.7 }); addVfx({ k: 'sflash', c: '255,220,140', a: 0.28, life: 0.45 }); sfx('aura'); flash(); addShake(10);
      burst(player.x, player.y, 20, 'gold', 30, 'gold', 2.6);
    }
  }
  function feelUpdate(dt) {
    if (comboT > 0) { comboT -= dt; if (comboT <= 0) { if (combo >= 10) log(combo + 'コンボで途切れた'); combo = 0; AU.pm = 1; } }
    if (mkT > 0) {
      mkT -= dt;
      if (mkT <= 0) {
        if (mkN >= 3) { addVfx({ k: 'speed', life: 0.3, a: 0.5 }); addVfx({ k: 'ring', x: player.x, y: player.y, R: 2 + mkN * 0.25, c: '255,236,170', w: 6, life: 0.45 }); addText(player.x, player.y, mkN + '体まとめて撃破！', 'multi', 92); sfx(mkN >= 6 ? 'legend' : 'rare'); addShake(5 + mkN); }
        mkN = 0;
      }
    }
    if (player.frenzyT > 0 && !player.dead && Math.random() < dt * 18) addPart({ k: 'gold', x: player.x + rand(-0.35, 0.35), y: player.y + rand(-0.35, 0.35), z: rand(2, 30), vx: 0, vy: 0, vz: rand(24, 40), t: 0, life: 0.6, s: 0.7, c: Math.random() < 0.5 ? 'gold' : 'amber' });
  }
  function feelFrame(dt) {
    if (clearT > 0) { clearT -= dt; if (clearT <= 0 && clearMsg) { clearMsg(); clearMsg = null; } }
    const cvEl = $('cv');
    if (shakeA > 0.25) {
      shakeA *= Math.pow(0.0025, dt);
      cvEl.style.transform = 'translate(' + (Math.random() * 2 - 1) * shakeA + 'px,' + (Math.random() * 2 - 1) * shakeA + 'px)';
    } else if (shakeA) { shakeA = 0; cvEl.style.transform = ''; }
    const el = $('combo');
    if (combo >= 3) {
      if (comboShown !== combo) {
        comboShown = combo;
        $('comboN').textContent = String(combo);
        el.className = 'combo' + (combo >= 100 ? ' t4' : combo >= 50 ? ' t3' : combo >= 25 ? ' t2' : combo >= 10 ? ' t1' : '');
        el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
        $('comboBonus').textContent = '経験値・ゴールド +' + Math.round((comboMul() - 1) * 100) + '%';
      }
      el.hidden = false;
      $('comboBar').style.transform = 'scaleX(' + clamp(comboT / 3.5, 0, 1) + ')';
    } else if (!el.hidden) { el.hidden = true; comboShown = -1; }
  }
