
  /* ================= UI ================= */
  const dom = {};
  const lastV = {};
  function cacheDom() {
    const ids = ['altarBtn', 'ariaBtn', 'goldHud', 'xpLine', 'lvText', 'formName', 'hpFill', 'hpText', 'mpFill', 'mpText', 'xpFill', 'morphBtn', 'morphLabel', 'potionBtn', 'potionCount', 'shopBtn', 'shopGold', 'ptBadge', 'bagDot', 'bossBar', 'bossName', 'bossFill', 'bossStg'];
    for (const id of ids) dom[id] = $(id);
  }
  function setT(id, v) { if (lastV[id] !== v) { lastV[id] = v; dom[id].textContent = v; } }
  function setS(id, v) {
    const r = Math.round(clamp(v, 0, 1) * 300) / 300;
    if (lastV[id] !== r) { lastV[id] = r; dom[id].style.transform = 'scaleX(' + r + ')'; }
  }
  function setC(id, v) {
    const r = Math.round(clamp(v, 0, 1) * 60) / 60, key = id + ':cd';
    if (lastV[key] !== r) { lastV[key] = r; dom[id].style.setProperty('--cd', String(r)); }
  }
  function setH(id, hidden) {
    const key = id + ':h';
    if (lastV[key] !== hidden) { lastV[key] = hidden; dom[id].hidden = hidden; }
  }
  function updateHud() {
    const F = FORMS[player.form];

    setT('formName', F.name);
    setS('hpFill', player.hp / D.maxHp);
    setT('hpText', Math.ceil(player.hp) + ' / ' + D.maxHp);
    setS('mpFill', player.mp / D.maxMp);
    setT('mpText', Math.floor(player.mp) + ' / ' + D.maxMp);
    setS('xpFill', prog.exp / expNeed(prog.level));
    updateSkillButtons();
    if (time - mmLast > 0.15 || time < mmLast) { mmLast = time; drawMinimap(); }
    setC('morphBtn', player.morphT / (D.morphCd || MORPH_CD));
    setC('potionBtn', player.potT / POT_CD);
    setT('morphLabel', player.form === 'blade' ? '術へ変身' : '剣へ変身');
    setT('potionCount', String(prog.potions));
    setH('shopBtn', !(inCamp(player.x, player.y) && !player.dead));
    setH('altarBtn', !(curMap !== 3 && inCamp(player.x, player.y) && !player.dead));
    setH('ariaBtn', !(curMap !== 3 && inCamp(player.x, player.y) && !player.dead));
    setT('shopGold', '所持 ' + prog.gold + 'G');
    const pts = prog.sp + prog.kp;
    setH('ptBadge', pts <= 0);
    setT('ptBadge', String(pts));
    setH('bagDot', !prog.inv.some((i) => i.isNew));
    if (time - trackLast > 0.25 || time < trackLast) { trackLast = time; updateTracker(); floorHud(); }
    const bossOn = !!(bossRef && !bossRef.dead && curMap === 3);
    setH('bossBar', !bossOn);
    if (bossOn) { setT('bossName', bossName(bossRef) + '　Lv' + bossRef.lvl + (bossRef.brkT > 0 ? '　ブレイク！' : bossRef.enraged ? '　怒り' : bossRef.phase === 2 ? '　本気' : '')); setS('bossFill', bossRef.hp / bossRef.maxHp); setS('bossStg', bossRef.brkT > 0 ? bossRef.brkT / 4 : (bossRef.stg || 0) / 100); dom.bossBar.classList.toggle('brk', bossRef.brkT > 0); }
    if (curMap === 3) {
      const cap = WB.on ? '世界の裂け目' : 'B' + curFloor + 'F ' + (stairsOpen ? '門が開いた' : FLOOR.obj === 'boss' ? 'ボスを倒せ' : FLOOR.obj === 'kill' ? '撃破 ' + Math.min(floorKills, floorNeed) + '/' + floorNeed : FLOOR.obj === 'survive' ? '耐久 ' + Math.max(0, Math.ceil(FLOOR.timer)) + '秒' : OBJ_INFO[FLOOR.obj] + ' ' + FLOOR.done + '/' + FLOOR.goal);
      const mn = $('mapName');
      if (mn.textContent !== cap) mn.textContent = cap;
    }
  }
  function showBanner(name, rec) {
    $('mapName').textContent = name;
    $('bannerName').textContent = name;
    $('bannerRec').textContent = rec;
    const b = $('banner');
    b.classList.remove('on'); void b.offsetWidth; b.classList.add('on');
  }
  function drawPortrait() {
    const pc = $('portrait');
    const E = FL['hero_' + player.form];
    if (!pc || !E || !E.img) return;
    const p = pc.getContext('2d'), w = pc.width, h = pc.height;
    p.setTransform(1, 0, 0, 1, 0, 0);
    p.clearRect(0, 0, w, h);
    p.fillStyle = rad(p, w * 0.45, h * 0.3, w * 0.8, player.form === 'blade' ? [[0, '#4b5a96'], [1, '#141834']] : [[0, '#4a3a9a'], [1, '#120e34']]);
    p.fillRect(0, 0, w, h);
    // after the ending, the helmet comes off: the portrait shows who the traveller really was
    const me = prog.cleared > 0 && heroArt('yuya_bust_normal');
    if (me) { const iw = me.naturalWidth, s0 = iw * 0.62; p.drawImage(me, (iw - s0) / 2, me.naturalHeight * 0.02, s0, s0, 0, 0, w, h); return; }
    const fr = E.anims.stance.fr[6][0];
    const sz = Math.min(44, fr[2], fr[3]);
    const sx = clamp(fr[0] + fr[4] - sz / 2, fr[0], fr[0] + fr[2] - sz), sy = clamp(fr[1] + fr[5] - 112, fr[1], fr[1] + fr[3] - sz);
    p.drawImage(E.img, sx, sy, sz, sz, 0, 0, w, h);
  }
  let toastTimer = 0;
  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('on'), 1700);
  }
  function log(msg) {
    const box = $('log');
    const el = document.createElement('div');
    el.className = 'line';
    el.textContent = msg;
    box.appendChild(el);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    setTimeout(() => { el.classList.add('fade'); setTimeout(() => el.remove(), 650); }, 3500);
  }
  function flash() {
    const el = $('flash');
    el.classList.remove('on');
    void el.offsetWidth;
    el.classList.add('on');
  }
  function makeRow(name, hint, value, label, disabled, onPlus) {
    const li = document.createElement('li');
    const info = document.createElement('div');
    const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = name;
    const ht = document.createElement('span'); ht.className = 'hint'; ht.textContent = hint;
    info.append(nm, ht);
    const val = document.createElement('b'); val.className = 'val'; val.textContent = value;
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'plus'; btn.textContent = '＋';
    btn.setAttribute('aria-label', label);
    btn.disabled = disabled;
    btn.addEventListener('click', onPlus);
    li.append(info, val, btn);
    return li;
  }
  let sheetTab = 'stat';
  function renderSheetOld() {
    for (const bt of document.querySelectorAll('.tab')) { const on = bt.dataset.tab === sheetTab; bt.classList.toggle('on', on); bt.setAttribute('aria-selected', on ? 'true' : 'false'); }
    $('tabStat').hidden = sheetTab !== 'stat';
    $('tabQuest').hidden = true; $('tabOpt').hidden = true; $('tabPet').hidden = true;
    $('tabSkill').hidden = sheetTab !== 'blade' && sheetTab !== 'arcane';
    $('tabGear').hidden = sheetTab !== 'gear';
    $('sheetTitle').textContent = sheetTab === 'stat' ? 'ステータス' : sheetTab === 'gear' ? '装備と持ち物' : FORMS[sheetTab].name + 'のスキルツリー';
    if (sheetTab === 'gear') { renderGear(); return; }
    if (sheetTab !== 'stat') { renderTree(sheetTab); return; }
    $('spText').textContent = String(prog.sp);
    const sl = $('statList');
    sl.textContent = '';
    for (const k of STAT_KEYS) {
      sl.appendChild(makeRow(STAT_INFO[k].name, STAT_INFO[k].hint, String(prog.stats[k]), STAT_INFO[k].name + 'を1上げる', prog.sp <= 0, () => {
        if (prog.sp <= 0) return;
        prog.sp--; prog.stats[k]++;
        refreshD(); renderSheet(); save();
      }));
    }
    const b = derived('blade'), a = derived('arcane');
    const rows = [
      ['最大HP', String(b.maxHp)],
      ['最大MP', String(b.maxMp)],
      ['攻撃力（剣／術）', Math.round(b.atk) + ' ／ ' + Math.round(a.atk)],
      ['攻撃の間隔（剣／術）', b.interval.toFixed(2) + '秒 ／ ' + a.interval.toFixed(2) + '秒'],
      ['会心率', Math.round(b.crit * 100) + '%'],
      ['移動の速さ', b.speed.toFixed(2)]
    ];
    const dl = $('derived');
    dl.textContent = '';
    for (const r of rows) {
      const dt = document.createElement('dt'); dt.textContent = r[0];
      const dd = document.createElement('dd'); dd.textContent = r[1];
      dl.append(dt, dd);
    }
    $('goldText').textContent = prog.gold + 'G';
    $('potText').textContent = prog.potions + '個';
  }
  function openSheet() {
    if (player.dead || !$('intro').hidden) return;
    paused = true;
    drag.active = false;
    sheetTab = prog.kp > 0 && prog.sp === 0 ? player.form : 'stat';
    renderSheet();
    $('sheet').hidden = false;
    $('closeBtn').focus();
  }
  function closeSheet() {
    $('sheet').hidden = true;
    paused = false;
    save();
  }
  let resetArmed = false, resetTimer = 0;
  function onReset() {
    const btn = $('resetBtn');
    if (!resetArmed) {
      resetArmed = true;
      btn.textContent = 'もう一度押すと最初から';
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => { resetArmed = false; btn.textContent = '最初からやり直す'; }, 3000);
      return;
    }
    resetArmed = false;
    clearTimeout(resetTimer);
    btn.textContent = '最初からやり直す';
    const fresh = defaultProg();
    fresh.intro = true;
    Object.assign(prog, fresh);
    giveStarter(); loot.length = 0; selItem = null; refreshGear();
    player.form = 'blade';
    setFormAttr();
    player.x = SPAWN.x; player.y = SPAWN.y; cam.x = player.x; cam.y = player.y;
    player.target = null; player.path.length = 0;
    player.cd = {}; player.auraT = 0; player.shiftT = 0; player.morphT = 0; player.potT = 0; fields.length = 0; meteors.length = 0; dash = null;
    refreshD();
    player.hp = D.maxHp; player.mp = D.maxMp;
    enterMap(0, null);
    drawPortrait();
    save();
    renderSheet();
    log('最初からやり直した');
  }

  /* ================= input ================= */
  function localXY(ev) {
    const r = $('game').getBoundingClientRect();
    return [ev.clientX - r.left, ev.clientY - r.top];
  }
  function pickEnemy(px, py) {
    let best = null, bd = 36 * zoom;
    for (const e of enemies) {
      if (e.dead) continue;
      const x0 = isoX(e.x, e.y), y0 = isoY(e.x, e.y) - bodyH(e) * zoom;
      const d = hyp(px - x0, py - y0);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  const ptrs = new Map();
  let pinch = null;
  cv.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    ptrs.set(ev.pointerId, localXY(ev));
    if (ptrs.size === 2) { const a = [...ptrs.values()]; pinch = { d0: hyp(a[0][0] - a[1][0], a[0][1] - a[1][1]) || 1, z0: userZoom }; drag.active = false; return; }
    if (paused || player.dead || transit) return;
    pendingNpc = null;
    { const xy0 = localXY(ev); if (stickZone(xy0[0], xy0[1]) && !stick.active && ptrs.size <= 1) { stick.active = true; stick.id = ev.pointerId; stick.bx = xy0[0]; stick.by = xy0[1]; stick.dx = 0; stick.dy = 0; drag.active = false; player.target = null; try { cv.setPointerCapture(ev.pointerId); } catch (err) { /* ignore */ } return; } }
    try { cv.setPointerCapture(ev.pointerId); } catch (err) { /* not supported */ }
    const xy = localXY(ev);
    const np = pickNpc(xy[0], xy[1]);
    if (np) { talkTo(np); return; }
    const e = pickEnemy(xy[0], xy[1]);
    if (e) {
      player.target = e;
      player.path.length = 0;
      player.repathT = 0;
      drag.active = false;
      addFx({ k: 'mark', e, x: e.x, y: e.y, t: 0, life: 0.3 });
      return;
    }
    const lt = pickLoot(xy[0], xy[1]);
    if (lt) { player.target = null; drag.active = false; const lp = findPath(player.x, player.y, lt.x, lt.y); if (lp) { player.path = lp; marker = { x: lt.x, y: lt.y, t: 0 }; } return; }
    player.target = null;
    const w = toWorld(xy[0], xy[1]);
    drag.active = true; drag.id = ev.pointerId; drag.wx = w[0]; drag.wy = w[1]; drag.pending = false; drag.t = 0.14;
    const path = findPath(player.x, player.y, w[0], w[1]);
    if (path) { player.path = path; marker = { x: w[0], y: w[1], t: 0 }; }
  });
  cv.addEventListener('pointermove', (ev) => {
    if (ptrs.has(ev.pointerId)) ptrs.set(ev.pointerId, localXY(ev));
    if (stick.active && ev.pointerId === stick.id) { const xy = localXY(ev); let dx = xy[0] - stick.bx, dy = xy[1] - stick.by; const l = hyp(dx, dy); if (l > 56) { dx *= 56 / l; dy *= 56 / l; } stick.dx = dx; stick.dy = dy; return; }
    if (pinch && ptrs.size >= 2) { const a = [...ptrs.values()]; setUserZoom(pinch.z0 * (hyp(a[0][0] - a[1][0], a[0][1] - a[1][1]) / pinch.d0)); return; }
    if (!drag.active || ev.pointerId !== drag.id) return;
    const xy = localXY(ev), w = toWorld(xy[0], xy[1]);
    drag.wx = w[0]; drag.wy = w[1]; drag.pending = true;
  });
  const endDrag = (ev) => { ptrs.delete(ev.pointerId); if (stick.active && ev.pointerId === stick.id) { stick.active = false; stick.dx = 0; stick.dy = 0; player.moving = false; } if (ptrs.size < 2) pinch = null; if (ev.pointerId === drag.id) { drag.active = false; drag.pending = false; } };
  cv.addEventListener('pointerup', endDrag);
  cv.addEventListener('pointercancel', endDrag);
  cv.addEventListener('contextmenu', (ev) => ev.preventDefault());
  cv.addEventListener('wheel', (ev) => { ev.preventDefault(); setUserZoom(userZoom * Math.exp(-ev.deltaY * 0.0015)); }, { passive: false });
  $('zoomIn').addEventListener('click', () => setUserZoom(userZoom * 1.15));
  $('zoomOut').addEventListener('click', () => setUserZoom(userZoom / 1.15));

  for (let i = 0; i < 8; i++) $('sk' + i).addEventListener('click', () => castSkill(i));
  for (const bt of document.querySelectorAll('.tab')) bt.addEventListener('click', () => { sheetTab = bt.dataset.tab; renderSheet(); });
  $('morphBtn').addEventListener('click', morph);
  $('potionBtn').addEventListener('click', drinkPotion);
  $('shopBtn').addEventListener('click', buyPotion);
  $('menuBtn').addEventListener('click', openSheet);
  $('bagBtn').addEventListener('click', () => { openSheet(); if (!$('sheet').hidden) { sheetTab = 'gear'; renderSheet(); } });
  $('sellNormal').addEventListener('click', sellNormals);
  $('npcClose').addEventListener('click', closeNpc);
  bindUi2();
  $('qtrack').addEventListener('click', () => {
    if (paused || player.dead) return;
    if (curMap !== 0) { toast('報告は始まりの森のミーナへ'); return; }
    const m = props.find((p) => p.kind === 'npc' && p.role === 'quest');
    if (m) talkTo(m);
  });
  $('closeBtn').addEventListener('click', closeSheet);
  $('resetBtn').addEventListener('click', onReset);
  $('reviveBtn').addEventListener('click', respawn);
  $('startBtn').addEventListener('click', () => {
    prog.intro = true;
    save();
    $('intro').hidden = true;
    paused = false;
    showBanner(MAPS[curMap].name, MAPS[curMap].rec);
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.repeat) return;
    const k = (ev.key || '').toLowerCase();
    if (!$('npcDlg').hidden) { if (k === 'escape') closeNpc(); return; }
    if (!$('sheet').hidden) { if (k === 'escape' || k === 'c') closeSheet(); return; }
    if (paused) return;
    if (k >= '1' && k <= '8') castSkill(Number(k) - 1);
    else if (k === 'q') castSkill(0);
    else if (k === 'w') morph();
    else if (k === 'e') drinkPotion();
    else if (k === 'c') openSheet();
    else if (k === 'i') { openSheet(); if (!$('sheet').hidden) { sheetTab = 'gear'; renderSheet(); } }
  });

  /* ================= loop ================= */
  let lastTs = 0, frameErr = 0, slowT = 0, frameAvg = 1 / 60;
  function frame(ts) {
    requestAnimationFrame(frame);
    if (lastTs && ts - lastTs < 14) return; // 90/120Hz screens: simulate and draw at ~60fps
    const dt = lastTs ? Math.min(0.05, Math.max(0, (ts - lastTs) / 1000)) : 1 / 60;
    lastTs = ts;
    try {
      time += dt;
      if (!paused) { const sd = hitStop > 0 ? dt * 0.1 : slowMo > 0 ? dt * 0.3 : dt; hitStop = Math.max(0, hitStop - dt); slowMo = Math.max(0, slowMo - dt); update(sd); }
      if (!END && !OP.on && !OP.capturing && !ARIA.on) render();
      updateHud();
      feelFrame(dt);
    } catch (e) {
      if (frameErr++ < 3) console.error(e);
    }
    adaptResolution(dt);
  }
  // resizing clears the canvas: redraw right away so there is no blank frame
  function resizeAndDraw() { resize(); if (!END && !OP.on && !OP.capturing && !ARIA.on) try { render(); } catch (e) { /* next frame retries */ } }
  // drop render resolution one step at a time while frames stay slow (keeps phones above ~45fps)
  function adaptResolution(dt) {
    if (paused || document.hidden || OP.on) { slowT = 0; return; }
    frameAvg += (dt - frameAvg) * 0.05;
    slowT = frameAvg > 0.022 ? slowT + dt : 0;
    if (slowT > 3 && dprCap > 1.25 && (window.devicePixelRatio || 1) > 1.25) { dprCap -= 0.25; slowT = 0; frameAvg = 1 / 60; resizeAndDraw(); }
  }
  function boot() {
    load();
    if (prog.map === 3) { curFloor = clamp(prog.floor || 1, 1, 9999); prepFloor(); }
    buildMap(prog.map);
    for (const it of prog.inv.concat(SLOT_TYPES.map((t) => prog.eq[t]).filter(Boolean))) itemSeq = Math.max(itemSeq, it.id + 1);
    if (!prog.starter && !prog.eq.sword && !prog.eq.staff) giveStarter();
    refreshGear();
    player.form = prog.form;
    setFormAttr();
    refreshD();
    player.hp = D.maxHp;
    player.mp = D.maxMp;
    cacheDom();
    $('mapName').textContent = MAPS[curMap].name;
    resize();
    drawPortrait();
    let rq = 0;
    const onResize = () => { if (!rq) rq = requestAnimationFrame(() => { rq = 0; resizeAndDraw(); }); };
    if ('ResizeObserver' in window) new ResizeObserver(onResize).observe($('game'));
    window.addEventListener('resize', onResize);
    for (let k = 0; k < 9; k++) spawnPack();
    if (curMap === 3) { startFloor(); restoreDive(); }
    netInit();
    ariaBind();
    applySlots();
    if (!TEST) pendingOffline = offlineRewards(); else prog.seen = Date.now();
    $('autoBtn').addEventListener('click', autoToggle);
    $('tip').addEventListener('click', tipClose);
    $('talkDlg').addEventListener('click', talkAdvance);
    heroArtPreload();
    $('heroBtn').addEventListener('click', () => heroUlt($('heroBtn').dataset.id));
    document.addEventListener('keydown', (ev) => { if (!talkCur) return; const k = ev.key || ''; if (k === 'Enter' || k === ' ' || k === 'Escape') { ev.preventDefault(); ev.stopImmediatePropagation(); talkAdvance(); } }, true);
    document.addEventListener('keydown', (ev) => { if ((ev.key || '').toLowerCase() === 'a' && !ev.repeat && $('sheet').hidden && !ARIA.on) autoToggle(); });
    $('altarBtn').addEventListener('click', altarOpen);
    $('altarClose').addEventListener('click', altarClose);
    loadFlare(() => {
      makeNpcLooks();
      drawPortrait();
      const sb = $('startBtn');
      sb.disabled = false;
      sb.textContent = 'はじめる';
      if (!TEST && opt().op !== false) opBoot(); else afterOP();
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) return; save(); if (!TEST && !paused && !player.dead && !OP.on && !END && enemies.some((e) => !e.dead && e.state === 'chase')) openSheet(); });
    window.addEventListener('pagehide', () => save());
    if (TEST) {
      window.__G = {
        player, prog, enemies, fx, texts, shots, parts, cam, reachList, SPAWN, CAMP, FL, SPR,
        get flareReady() { return flareReady; },
        get D() { return D; },
        get paused() { return paused; }, set paused(v) { paused = v; },
        get envDark() { return envDark; },
        setDay(ph) { dayT = ph * DAY_LEN; },
        step(dt) { time += dt; update(dt); render(); updateHud(); feelFrame(dt); },
        // fast simulation without drawing (balance bot)
        get transit() { return transit; },
        simStep(dt) { time += dt; if (!paused) { const sd = hitStop > 0 ? dt * 0.1 : slowMo > 0 ? dt * 0.3 : dt; hitStop = Math.max(0, hitStop - dt); slowMo = Math.max(0, slowMo - dt); update(sd); } autoBless(dt); },
        useSkill, morph, drinkPotion, buyPotion, openSheet, closeSheet, respawn,
        genItem, equip, sell, sellNormals, enhance, dropLoot, loot, refreshGear, get GEAR() { return GEAR; },
        enterDungeon(f) { curFloor = f; enterMap(3, 0); }, get floor() { return curFloor; }, get stairsOpen() { return stairsOpen; }, get bossRef() { return bossRef; }, get floorNeed() { return floorNeed; }, killEnemy, slams, bshots, blines, bpools,
        get AU() { return AU; }, WB, NET, wbEnter, wbEnd, wbRefresh, lbRefresh, openWorld, wbLocal, wkLocal, weekMod, weekKey, pets, gainEgg, hatch, activePet, riding, toggleRide, PET, petUpdate, eggProgress, ULT, useUlt, openClassDlg, chooseClass, CLASSES, classUpdate, setRank, rankNow, rankUnlock, restoreDive, recs, pickLayout, get props() { return props; }, tile, T_PIT, reachList, FLOOR, setupFloor, offerBless, chooseBless, get BLESS() { return BLESS; }, spawnSpecial, floorUpdate, derived, vfx, addVfx, hitEnemy, explode, morph, startOP, opFinish, opCapture, OP, opLoadSong, opSeek(t) { OP.seek = t; }, opDraw, playEnding, endSkip, closeEnding, finalVictory, THEMES, themeOf, MAPS, get combo() { return combo; }, set combo(v) { combo = v; }, get hitStop() { return hitStop; }, finalPhaseOf, ABYSS_MAX, sfx, SFX, MOODS,
        genItem, openSheet, equipBest, attackNearest, bulkPick, bulkSell, upgradeDelta, setTab(t) { sheetTab = t; renderSheet(); }, setBulk(v) { bulk = v; renderGear(); }, selInv(it) { selItem = { where: 'inv', id: it.id }; renderGear(); }, stick,
        openNpc, closeNpc, qState, MAINQ, NPCS, mainDone, get npcOpen() { return npcOpen; },
        enterMap, setUserZoom, get portals() { return portals; }, get curMap() { return curMap; }, get zoom() { return zoom; },
        findPath, spawnPack, blockedAt, inCamp, gainExp, hurtPlayer, expNeed, chunkCache, castSkill, learn, SKD, fields, meteors,
        get dash() { return dash; },
        ARIA, ariaOpen, ariaStart, ariaHit, ariaTick, ariaClose, ariaChart, ariaState, ariaDiveStart,
        HEROINES, SCENES, heroS, heroOut, heroJoined, affLv, playScene, talkAdvance, get talkCur() { return talkCur; }, heroTick, heroUpdate, heroUlt, heroAtkMul, storySeen, heroEnt, heroGuard, drawBust, giveGift, giftCost, loginTick, loginState, get loginChecked() { return loginChecked; }, set loginChecked(v) { loginChecked = v; }, LOGIN_DAYS, memoList, MEMO,
        TIPS, tipTick, tipsSeen, showTip,
        partyList, partyAdd, partyRemove, partySlots, entOf, PET_SP, trainS, TRAIN, offlineRewards, showOffline, autoOn, autoToggle, autoBattle, expGapMul, autoRetreat, get autoWall() { return autoWall; }, set autoWall(v) { autoWall = v; }, petPower, partyGoldMul,
        soul, perkLv, PERKS, gainSoul, rebirth, altarOpen, altarClose, altarRender, streakOnKill, streakEnd, get streakN() { return streakN; }, potMax, GEMS, gainGem, gemFree, sockets, sockOf, makeCtx, castWithGems, applySlots, setSlot, SLOTS, keyOn, growthUpdate, skillCdMul, cdOf, skillMpMul,
        dailyState, dailyCheck, achCheck, DAILY_POOL, ACH, titleName, recAdd,
        withEl, recs, LPOW, hasPow, startDodge, perfectDodge, staggerAdd, get slowMo() { return slowMo; }, makeEnemy,
        save, load, cleanItem, genBounty, ABYSS_MAX_F: ABYSS_MAX, refreshD, makeTestElite() { const e = makeEnemy('goblin', player.x + 3, player.y, 5, ++packSeq, true); enemies.push(e); return e; }
      };
    }
    requestAnimationFrame(frame);
  }
