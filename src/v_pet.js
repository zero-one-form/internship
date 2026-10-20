
  /* ================= pets: rare eggs (1/2000), hatching, growing, fighting together, riding ================= */
  const PET_SP = {
    slime: { name: 'スライム', rar: 0, w: 40, col: ['#7be06a', '#3f9a44'], shc: ['#ffd36e', '#c08a14'], atk: 0.9, kind: 'melee', iv: 1.1, mount: 1.3, fly: 0, desc: '体当たりで攻撃する。騎乗すると移動+30%' },
    fox: { name: '炎狐', rar: 1, w: 28, col: ['#ff8a3a', '#c4501a'], shc: ['#9fe8ff', '#3a8ad0'], atk: 1.0, kind: 'melee', iv: 1.0, mount: 1.45, fly: 0, desc: '炎の牙で噛みつく。騎乗すると移動+45%' },
    bird: { name: '雷鳥', rar: 2, w: 18, col: ['#8fdcff', '#3a7ad0'], shc: ['#ffe27a', '#d08a20'], atk: 0.85, kind: 'ranged', iv: 1.2, mount: 1.4, fly: 26, desc: '離れた敵に雷を撃つ。騎乗すると移動+40%' },
    wolf: { name: '月狼', rar: 2, w: 10, col: ['#d4ddef', '#6e7ea0'], shc: ['#2a2a3a', '#0e0e18'], atk: 1.2, kind: 'melee', iv: 0.8, mount: 1.6, fly: 0, desc: '素早い牙で切り裂く。騎乗すると移動+60%' },
    dragon: { name: '幼竜', rar: 3, w: 4, col: ['#e8505e', '#8a1a2a'], shc: ['#b9a6ff', '#4a2a9a'], atk: 1.4, kind: 'breath', iv: 2.4, mount: 1.5, fly: 30, desc: '炎の吐息で焼き払う。騎乗すると移動+50%' }
  };
  const PET_NAMES = ['ルル', 'ソラ', 'コロ', 'ミミ', 'レオ', 'ヒカリ', 'ノア', 'ユキ', 'ハク', 'モモ', 'クウ', 'リン', 'テト', 'ナギ', 'アオ'];
  const PET_RAR = ['ふつう', 'めずらしい', 'とてもめずらしい', '伝説'];
  const EGG_NEED = 120, PET_MAX = 30, ADULT = 15;
  var PET = { x: 0, y: 0, isPet: true, atkT: 0, dir: 6, faceLeft: false, moving: false, anim: 0, map: -1, hop: 0 };
  function pets() { if (!prog.pets || typeof prog.pets !== 'object') prog.pets = { eggs: [], list: [], active: null, ride: false }; return prog.pets; }
  function activePet() { const P = pets(); return P.list.find((p) => p.id === P.active) || null; }
  function petAdult(p) { return p && p.lvl >= ADULT; }
  function riding() { const p = activePet(); return !!(p && pets().ride && petAdult(p) && !player.dead); }
  function petNeed(l) { return 15 + l * 8; }
  function petName(p) { return (p.shiny ? '★' : '') + p.name + '（' + PET_SP[p.sp].name + '）'; }
  function petMods(d) { if (riding()) d.speed *= PET_SP[activePet().sp].mount; return d; }

  /* ---------- eggs ---------- */
  function rollEgg(e) {
    if (e.obj || curMap === undefined) return;
    if (Math.random() < 1 / 2000) gainEgg(e.x, e.y);
  }
  function gainEgg(x, y) {
    const P = pets();
    if (P.eggs.length >= 5) { toast('タマゴを見つけたが、もう持ちきれない（5個まで）'); return; }
    P.eggs.push({ p: 0, id: Date.now() + Math.floor(Math.random() * 1000) });
    save();
    toast('ふしぎなタマゴを手に入れた！ 敵を倒すと孵る');
    log('ふしぎなタマゴを手に入れた');
    sfx('legend'); addShake(8);
    addVfx({ k: 'pillar', x: x || player.x, y: y || player.y, c: '255,240,200', life: 1.2 });
    addVfx({ k: 'drop', x: x || player.x, y: y || player.y, c: 3, life: 1.2 });
    addVfx({ k: 'sflash', c: '255,245,220', a: 0.3, life: 0.4 });
  }
  function eggProgress(n) {
    const P = pets();
    if (!P.eggs.length) return;
    const eg = P.eggs[0];
    eg.p += n;
    if (eg.p >= EGG_NEED) { P.eggs.shift(); hatch(); }
  }
  function hatch() {
    const P = pets();
    if (P.list.length >= 12) { toast('ペットがいっぱい（12匹まで）。タマゴは孵らなかった'); return; }
    let r = Math.random() * 100, sp = 'slime';
    for (const k of Object.keys(PET_SP)) { r -= PET_SP[k].w; if (r <= 0) { sp = k; break; } }
    const pet = { id: Date.now() + Math.floor(Math.random() * 1000), sp, lvl: 1, exp: 0, shiny: Math.random() < 0.05, name: PET_NAMES[randi(0, PET_NAMES.length - 1)] };
    P.list.push(pet);
    if (!P.active) P.active = pet.id;
    save();
    sfx('level'); addShake(6);
    addVfx({ k: 'pillar', x: player.x, y: player.y, c: '255,240,200', life: 1 });
    addVfx({ k: 'ring', x: player.x, y: player.y, R: 2.4, c: '255,240,200', w: 8, life: 0.6 });
    showHatch(pet);
  }
  function showHatch(pet) {
    const S = PET_SP[pet.sp];
    paused = true;
    $('petTitle').textContent = 'タマゴが孵った！';
    $('petLine').textContent = petName(pet) + '　' + PET_RAR[S.rar] + (pet.shiny ? '・色違い' : '');
    $('petDesc').textContent = S.desc + '。Lv' + ADULT + 'で成体になり、背中に乗れるようになる。';
    $('petDlg').hidden = false;
    const c = $('petCv'), g = c.getContext('2d');
    let t0 = performance.now();
    const loop = () => {
      if ($('petDlg').hidden) return;
      const t = (performance.now() - t0) / 1000;
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height);
      const gr = g.createRadialGradient(c.width / 2, c.height * 0.6, 0, c.width / 2, c.height * 0.6, c.width * 0.5); gr.addColorStop(0, 'rgba(255,230,160,0.45)'); gr.addColorStop(1, 'rgba(255,230,160,0)'); g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
      drawPetShape(g, pet.sp, pet.shiny, c.width / 2, c.height * 0.78, 2.6, t, false, false);
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ---------- growth & behaviour ---------- */
  function petOnKill(e) {
    rollEgg(e);
    eggProgress(e.boss ? 10 : e.elite ? 3 : 1);
    const p = activePet();
    if (!p || p.lvl >= PET_MAX) return;
    p.exp += e.boss ? 20 : e.elite ? 5 : 1;
    while (p.lvl < PET_MAX && p.exp >= petNeed(p.lvl)) {
      p.exp -= petNeed(p.lvl); p.lvl++;
      if (p.lvl === ADULT) { toast(petName(p) + 'が成体になった！ 「騎乗」で背中に乗れる'); sfx('level'); addVfx({ k: 'ring', x: PET.x, y: PET.y, R: 2, c: '255,240,200', w: 7, life: 0.5 }); }
      else toast(petName(p) + 'がLv' + p.lvl + 'になった');
      save();
    }
  }
  function petUpdate(dt) {
    const p = activePet();
    if (!p) return;
    const S = PET_SP[p.sp];
    PET.anim += dt; PET.hop += dt;
    if (PET.map !== curMap || hyp(PET.x - player.x, PET.y - player.y) > 12) { PET.map = curMap; PET.x = player.x + 0.8; PET.y = player.y + 0.8; }
    if (riding()) { PET.x = player.x; PET.y = player.y; PET.moving = player.moving; PET.faceLeft = player.faceLeft; PET.dir = player.dir; return; }
    PET.atkT = Math.max(0, PET.atkT - dt);
    let tx = player.x + (player.faceLeft ? 0.9 : -0.9), ty = player.y + 0.9, tg = null;
    if (!player.dead) {
      const pt = player.target;
      if (pt && !pt.dead && !pt.obj && hyp(pt.x - player.x, pt.y - player.y) < 8) tg = pt;
      else { let bd = 5.5; for (const e of enemies) { if (e.dead || e.obj) continue; const d = hyp(e.x - player.x, e.y - player.y); if (d < bd && e.state === 'chase') { bd = d; tg = e; } } }
    }
    const reach = S.kind === 'melee' ? 0.85 : 4.2;
    if (tg) { const d = hyp(tg.x - PET.x, tg.y - PET.y); if (d > reach) { tx = tg.x; ty = tg.y; } else { tx = PET.x; ty = PET.y; } }
    const dx = tx - PET.x, dy = ty - PET.y, d = hyp(dx, dy), sp = Math.max(3.6, D.speed * 1.25) * (S.fly ? 1.1 : 1);
    PET.moving = d > 0.15;
    if (PET.moving) {
      const st = Math.min(d, sp * dt), nx = PET.x + dx / d * st, ny = PET.y + dy / d * st;
      if (S.fly || !blockedAt(nx, ny, 0.15)) { PET.x = nx; PET.y = ny; } else { if (!blockedAt(nx, PET.y, 0.15)) PET.x = nx; else if (!blockedAt(PET.x, ny, 0.15)) PET.y = ny; }
      if (Math.abs(dx - dy) > 0.02) PET.faceLeft = (dx - dy) < 0;
    }
    if (tg && hyp(tg.x - PET.x, tg.y - PET.y) <= reach + 0.1 && PET.atkT <= 0) {
      PET.atkT = S.iv;
      if (Math.abs((tg.x - PET.x) - (tg.y - PET.y)) > 0.02) PET.faceLeft = ((tg.x - PET.x) - (tg.y - PET.y)) < 0;
      const dmg = D.atk * (0.3 + 0.025 * p.lvl) * S.atk * (petAdult(p) ? 1.3 : 1);
      if (S.kind === 'melee') { PET.hop = 0; hitEnemy(tg, dmg); if (p.sp === 'fox') burst(tg.x, tg.y, 14, 'ember', 6, 'warm', 2); }
      else if (S.kind === 'ranged') shots.push({ x: PET.x, y: PET.y, h: 40, tgt: tg, dmg, sp: 12, trail: [], col: 'cyan' });
      else { explode(tg.x, tg.y, 1.3, dmg * 1.6); addFx({ k: 'chain', pts: [[PET.x, PET.y, 30], [tg.x, tg.y, 14]], t: 0, life: 0.2 }); }
    }
  }
  function toggleRide() {
    const p = activePet();
    if (!p) { toast('ペットがいない'); return; }
    if (!petAdult(p)) { toast(petName(p) + 'はまだ幼い（Lv' + ADULT + 'で騎乗できる）'); return; }
    const P = pets();
    P.ride = !P.ride;
    refreshD(); save();
    addVfx({ k: 'ring', x: player.x, y: player.y, R: 1.6, c: '255,240,200', w: 6, life: 0.4 });
    sfx('morph');
    toast(P.ride ? petName(p) + 'に乗った（移動+' + Math.round((PET_SP[p.sp].mount - 1) * 100) + '%）' : '降りた');
  }

  /* ---------- drawing ---------- */
  function drawPetShape(g, sp, shiny, x, y, s, t, faceLeft, mount) {
    const S = PET_SP[sp], c = shiny ? S.shc : S.col, k = s;
    g.save(); g.translate(x, y); if (faceLeft) g.scale(-1, 1);
    const eye = (ex, ey, r) => { g.fillStyle = '#1a1420'; g.beginPath(); g.ellipse(ex, ey, r, r * 1.2, 0, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + r * 0.35, ey - r * 0.4, r * 0.4, 0, TAU); g.fill(); };
    const body = (grd) => { const gr = g.createLinearGradient(0, -20 * k, 0, 4 * k); gr.addColorStop(0, c[0]); gr.addColorStop(1, c[1]); return grd ? gr : c[0]; };
    g.lineJoin = 'round'; g.strokeStyle = 'rgba(20,14,30,0.55)'; g.lineWidth = 1.2 * k;
    if (sp === 'slime') {
      const sq = 1 + Math.sin(t * 6) * 0.08;
      g.fillStyle = body(true); g.beginPath(); g.moveTo(-13 * k * sq, 0); g.quadraticCurveTo(-14 * k * sq, -18 * k / sq, 0, -19 * k / sq); g.quadraticCurveTo(14 * k * sq, -18 * k / sq, 13 * k * sq, 0); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.ellipse(-5 * k, -13 * k / sq, 4 * k, 2.4 * k, -0.5, 0, TAU); g.fill();
      if (!mount) { eye(-4 * k, -9 * k / sq, 1.8 * k); eye(4 * k, -9 * k / sq, 1.8 * k); }
    } else if (sp === 'fox') {
      const w = Math.sin(t * 9) * 0.25;
      const tail = g.createLinearGradient(-20 * k, -16 * k, -8 * k, -2 * k); tail.addColorStop(0, '#fff2a0'); tail.addColorStop(1, c[0]);
      g.fillStyle = tail; g.beginPath(); g.moveTo(-8 * k, -6 * k); g.quadraticCurveTo(-24 * k, -10 * k + w * 8 * k, -18 * k, -24 * k); g.quadraticCurveTo(-12 * k, -12 * k, -6 * k, -9 * k); g.closePath(); g.fill();
      g.fillStyle = body(true); g.beginPath(); g.ellipse(0, -7 * k, 10 * k, 6 * k, 0, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = c[1]; for (const lx of [-6, -2, 3, 7]) g.fillRect((lx - 1) * k, -3 * k + (lx % 2 ? w : -w) * 2 * k, 2.2 * k, 4 * k);
      if (!mount) {
        g.fillStyle = body(true); g.beginPath(); g.arc(9 * k, -13 * k, 6 * k, 0, TAU); g.fill(); g.stroke();
        g.beginPath(); g.moveTo(6 * k, -17 * k); g.lineTo(7 * k, -24 * k); g.lineTo(10 * k, -18 * k); g.moveTo(10 * k, -18 * k); g.lineTo(13 * k, -24 * k); g.lineTo(13.5 * k, -16 * k); g.fill();
        g.fillStyle = '#fff6e0'; g.beginPath(); g.ellipse(13 * k, -11 * k, 3 * k, 2 * k, 0, 0, TAU); g.fill();
        eye(10.5 * k, -14 * k, 1.3 * k);
      }
    } else if (sp === 'bird') {
      const f = Math.sin(t * 14);
      g.fillStyle = c[1]; g.beginPath(); g.moveTo(-2 * k, -10 * k); g.lineTo(-16 * k, -14 * k - f * 8 * k); g.lineTo(-6 * k, -6 * k); g.closePath(); g.fill();
      g.fillStyle = body(true); g.beginPath(); g.ellipse(0, -9 * k, 8 * k, 7 * k, 0, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = c[0]; g.beginPath(); g.moveTo(2 * k, -10 * k); g.lineTo(14 * k, -16 * k - f * 8 * k); g.lineTo(4 * k, -5 * k); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#ffd36e'; g.beginPath(); g.moveTo(7 * k, -11 * k); g.lineTo(12 * k, -9.5 * k); g.lineTo(7 * k, -8 * k); g.fill();
      g.fillStyle = c[1]; g.beginPath(); g.moveTo(-7 * k, -8 * k); g.lineTo(-13 * k, -3 * k); g.lineTo(-6 * k, -5 * k); g.fill();
      if (!mount) eye(4 * k, -11 * k, 1.3 * k);
    } else if (sp === 'wolf') {
      const w = Math.sin(t * 10) * 0.3;
      g.fillStyle = c[1]; g.beginPath(); g.moveTo(-10 * k, -9 * k); g.quadraticCurveTo(-19 * k, -12 * k + w * 6 * k, -20 * k, -4 * k); g.quadraticCurveTo(-14 * k, -7 * k, -9 * k, -6 * k); g.fill();
      g.fillStyle = body(true); g.beginPath(); g.ellipse(-1 * k, -9 * k, 11 * k, 6 * k, 0, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = c[1]; for (const lx of [-8, -4, 3, 7]) g.fillRect((lx - 1) * k, -5 * k + (lx % 2 ? w : -w) * 3 * k, 2.4 * k, 6 * k);
      if (!mount) {
        g.fillStyle = body(true); g.beginPath(); g.ellipse(10 * k, -14 * k, 5.5 * k, 4.6 * k, -0.2, 0, TAU); g.fill(); g.stroke();
        g.beginPath(); g.moveTo(13 * k, -14 * k); g.lineTo(19 * k, -12 * k); g.lineTo(13 * k, -10.5 * k); g.fill();
        g.beginPath(); g.moveTo(7 * k, -17 * k); g.lineTo(8 * k, -23 * k); g.lineTo(11 * k, -18 * k); g.fill();
        g.fillStyle = '#7fe0ff'; g.beginPath(); g.arc(11.5 * k, -15 * k, 1.2 * k, 0, TAU); g.fill();
      }
    } else {
      const f = Math.sin(t * 8);
      g.fillStyle = c[1]; g.beginPath(); g.moveTo(-6 * k, -14 * k); g.lineTo(-20 * k, -26 * k - f * 7 * k); g.lineTo(-16 * k, -14 * k); g.lineTo(-22 * k, -12 * k - f * 4 * k); g.lineTo(-4 * k, -9 * k); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = c[1]; g.beginPath(); g.moveTo(-8 * k, -8 * k); g.quadraticCurveTo(-20 * k, -6 * k, -24 * k, -12 * k); g.quadraticCurveTo(-18 * k, -3 * k, -7 * k, -4 * k); g.fill();
      g.fillStyle = body(true); g.beginPath(); g.ellipse(0, -9 * k, 10 * k, 6.5 * k, 0, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = c[0]; g.beginPath(); g.moveTo(2 * k, -14 * k); g.lineTo(15 * k, -27 * k - f * 7 * k); g.lineTo(12 * k, -15 * k); g.lineTo(18 * k, -13 * k - f * 4 * k); g.lineTo(4 * k, -9 * k); g.closePath(); g.fill(); g.stroke();
      if (!mount) {
        g.fillStyle = body(true); g.beginPath(); g.moveTo(5 * k, -12 * k); g.quadraticCurveTo(9 * k, -20 * k, 13 * k, -20 * k); g.lineTo(18 * k, -17 * k); g.lineTo(13 * k, -14 * k); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = '#fff3c0'; g.beginPath(); g.moveTo(11 * k, -21 * k); g.lineTo(10 * k, -26 * k); g.lineTo(13 * k, -21 * k); g.fill();
        eye(13.5 * k, -18.5 * k, 1.1 * k);
      }
      g.fillStyle = 'rgba(255,240,200,0.6)'; g.beginPath(); g.ellipse(2 * k, -6 * k, 5 * k, 2 * k, 0, 0, TAU); g.fill();
    }
    g.restore();
  }
  function drawPet() {
    const p = activePet();
    if (!p || riding()) return;
    const S = PET_SP[p.sp], x0 = isoX(PET.x, PET.y), y0 = isoY(PET.x, PET.y);
    if (x0 < -60 || x0 > W + 60 || y0 < -60 || y0 > H + 60) return;
    const sc = (petAdult(p) ? 1.6 : 1.1) * zoom, hop = S.kind === 'melee' && PET.hop < 0.25 ? Math.sin(PET.hop / 0.25 * Math.PI) * 10 * zoom : 0;
    const hover = S.fly ? (S.fly + Math.sin(PET.anim * 3) * 4) * zoom : (PET.moving ? Math.abs(Math.sin(PET.anim * 10)) * 2 * zoom : 0);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x0, y0, 12 * sc, 5 * sc, 0, 0, TAU); ctx.fill();
    drawPetShape(ctx, p.sp, p.shiny, x0, y0 - hover - hop, sc, PET.anim, PET.faceLeft, false);
    if (p.shiny && Math.random() < 0.1) emis.push(['gold', x0 + rand(-12, 12) * zoom, y0 - hover - rand(4, 24) * zoom, 8 * zoom, 0.9]);
    if (S.fly) emis.push([p.sp === 'bird' ? 'cyan' : 'warm', x0, y0 - hover - 10 * zoom, 26 * zoom, 0.35]);
  }
  const MOUNT_K = 3.0;
  function rideHeight() { if (!riding()) return 0; const p = activePet(); return ((PET_SP[p.sp].fly ? PET_SP[p.sp].fly * 0.6 : 0) + (p.sp === 'slime' ? 17 : 12) * MOUNT_K) * zoom; }
  function drawMount(x0, y0) {
    const p = activePet(), S = PET_SP[p.sp], sc = MOUNT_K * zoom, hover = S.fly ? (S.fly * 0.6 + Math.sin(time * 3) * 3) * zoom : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.beginPath(); ctx.ellipse(x0, y0, 34 * zoom, 13 * zoom, 0, 0, TAU); ctx.fill();
    drawPetShape(ctx, p.sp, p.shiny, x0, y0 - hover + (player.moving ? Math.abs(Math.sin(time * 12)) * -2 * zoom : 0), sc, player.moving ? time : time * 0.3, player.faceLeft, false);
  }
  function renderPets() {
    const box = $('petBox'), P = pets();
    box.textContent = '';
    const eg = document.createElement('div'); eg.className = 'qc';
    eg.append(elP('qh', 'タマゴ（' + P.eggs.length + '/5）'));
    if (P.eggs.length) {
      eg.append(elP('qg', '温めているタマゴ：' + Math.floor(P.eggs[0].p / EGG_NEED * 100) + '%'));
      const bar = document.createElement('div'); bar.className = 'bar xp'; bar.style.display = 'block'; bar.style.height = '8px';
      const i = document.createElement('i'); i.style.background = 'linear-gradient(90deg,#ffe7a0,#e0a020)'; i.style.transform = 'scaleX(' + Math.min(1, P.eggs[0].p / EGG_NEED) + ')'; bar.append(i); eg.append(bar);
      eg.append(elP('qr', '敵を倒すと温まる（強い個体は3倍、ボスは10倍）'));
    } else eg.append(elP('qr', 'タマゴはどの敵からも2000分の1で落ちる。孵るとランダムなペットが生まれる'));
    box.append(eg);
    if (!P.list.length) { box.append(elP('ith', 'まだペットはいない')); return; }
    for (const p of P.list) {
      const S = PET_SP[p.sp], c = document.createElement('div'); c.className = 'qc pcard' + (P.active === p.id ? ' on' : '');
      const cv = document.createElement('canvas'); cv.width = 160; cv.height = 110; cv.className = 'pcv';
      drawPetShape(cv.getContext('2d'), p.sp, p.shiny, 82, 100, p.sp === 'slime' ? 3.4 : 2.9, 0.4, false, false);
      const info = document.createElement('div');
      info.append(elP('qg', petName(p)), elP('qh', PET_RAR[S.rar] + (p.shiny ? '・色違い' : '') + '　Lv' + p.lvl + (p.lvl >= PET_MAX ? '（最大）' : '') + '　' + (petAdult(p) ? '成体' : '幼体')), elP('qr', S.desc));
      if (p.lvl < PET_MAX) info.append(elP('qr', '次のLvまで ' + (petNeed(p.lvl) - p.exp) + '体'));
      const acts = document.createElement('div'); acts.className = 'ita';
      if (P.active === p.id) {
        acts.append(elBtn('休ませる', 'ghost small', () => { P.active = null; P.ride = false; refreshD(); save(); renderPets(); }));
        if (petAdult(p)) acts.append(elBtn(P.ride ? '降りる' : '騎乗する', 'primary small', () => { toggleRide(); renderPets(); }));
      } else acts.append(elBtn('連れて行く', 'primary small', () => { P.active = p.id; P.ride = false; PET.map = -1; refreshD(); save(); renderPets(); }));
      info.append(acts);
      c.append(cv, info);
      box.append(c);
    }
  }
  function petHud() {
    const b = $('rideBtn'), p = activePet(), show = !!(p && petAdult(p));
    if (b.hidden === show) b.hidden = !show;
    if (show) { const on = riding(); if (b.dataset.on !== String(on)) { b.dataset.on = String(on); $('rideLbl').textContent = on ? '降りる' : '騎乗'; b.classList.toggle('on', on); } }
  }
