
  /* ================= pets: rare eggs (1/2000), hatching, growing, fighting together, riding ================= */
  const PET_SP = {
    slime: { name: 'スライム', rar: 0, w: 26, col: ['#7be06a', '#3f9a44'], shc: ['#ffd36e', '#c08a14'], atk: 0.9, kind: 'melee', iv: 1.1, mount: 1.3, fly: 0, desc: '体当たりで攻撃する。騎乗すると移動+30%' },
    fox: { name: '炎狐', rar: 1, w: 14, col: ['#ff8a3a', '#c4501a'], shc: ['#9fe8ff', '#3a8ad0'], atk: 1.0, kind: 'melee', el: 'fire', iv: 1.0, mount: 1.45, fly: 0, desc: '炎の牙で噛みつく。騎乗すると移動+45%' },
    bird: { name: '雷鳥', rar: 2, w: 8, col: ['#8fdcff', '#3a7ad0'], shc: ['#ffe27a', '#d08a20'], atk: 0.85, kind: 'ranged', el: 'volt', iv: 1.2, mount: 1.4, fly: 26, desc: '離れた敵に雷を撃つ。騎乗すると移動+40%' },
    wolf: { name: '月狼', rar: 2, w: 5, col: ['#d4ddef', '#6e7ea0'], shc: ['#2a2a3a', '#0e0e18'], atk: 1.2, kind: 'melee', iv: 0.8, mount: 1.6, fly: 0, desc: '素早い牙で切り裂く。騎乗すると移動+60%' },
    dragon: { name: '幼竜', rar: 3, w: 1.6, col: ['#e8505e', '#8a1a2a'], shc: ['#b9a6ff', '#4a2a9a'], atk: 1.4, kind: 'breath', iv: 2.4, mount: 1.5, fly: 30, desc: '炎の吐息で焼き払う。騎乗すると移動+50%' },
    bat: { name: '夜蝙蝠', rar: 0, base: 'bird', w: 16, col: ['#6a5a8a', '#2a2040'], shc: ['#ff9ac2', '#a03a6a'], atk: 0.7, kind: 'melee', iv: 0.6, mount: 1.3, fly: 22, desc: '素早く何度も噛みつく。騎乗すると移動+30%' },
    golem: { name: '岩ゴーレム', rar: 1, base: 'golem', w: 10, col: ['#a8a090', '#5e5848'], shc: ['#ffe9a0', '#b08a20'], atk: 1.5, kind: 'melee', iv: 1.6, mount: 1.2, fly: 0, desc: '重い拳で殴る。騎乗すると移動+20%' },
    fairy: { name: '花の妖精', rar: 1, base: 'fairy', w: 8, col: ['#ffb8e0', '#e060a8'], shc: ['#b8ffe0', '#40c080'], atk: 0.5, kind: 'heal', iv: 1.4, mount: 1.3, fly: 24, desc: '主人のHPを少しずつ癒やし、花粉で攻撃する。騎乗すると移動+30%' },
    frost: { name: '氷精', rar: 2, base: 'slime', w: 5, col: ['#c8f4ff', '#5ab0e0'], shc: ['#e0d0ff', '#8a6ad0'], atk: 0.9, kind: 'ranged', el: 'ice', iv: 1.3, mount: 1.35, fly: 0, desc: '氷の礫を撃ち、敵を凍らせる（元素反応に使える）。騎乗すると移動+35%' },
    mimic: { name: 'ミミック', rar: 2, base: 'mimic', w: 4, col: ['#c08a40', '#6a4418'], shc: ['#e0e0f0', '#7a7a90'], atk: 1.1, kind: 'melee', iv: 1.0, mount: 1.25, fly: 0, gold: 0.12, desc: '噛みつく宝箱。仲間にいるとゴールド+12%。騎乗すると移動+25%' },
    phoenix: { name: '不死鳥', rar: 3, base: 'bird', w: 0.8, col: ['#ffb040', '#e0401a'], shc: ['#a0f0ff', '#3a80e0'], atk: 1.3, kind: 'breath', el: 'fire', iv: 2.0, mount: 1.55, fly: 34, desc: '炎の翼で焼き払う。騎乗すると移動+55%' },
    kirin: { name: '麒麟', rar: 3, base: 'wolf', w: 0.6, col: ['#ffe9a0', '#d0a030'], shc: ['#e8e8ff', '#8a8ac0'], atk: 1.35, kind: 'ranged', el: 'volt', iv: 1.1, mount: 1.65, fly: 0, desc: '雷をまとい、遠くの敵を撃つ。騎乗すると移動+65%' }
  };
  const PET_NAMES = ['ルル', 'ソラ', 'コロ', 'ミミ', 'レオ', 'ヒカリ', 'ノア', 'ユキ', 'ハク', 'モモ', 'クウ', 'リン', 'テト', 'ナギ', 'アオ'];
  const PET_RAR = ['ふつう', 'めずらしい', 'とてもめずらしい', '伝説'];
  const EGG_NEED = 120, PET_MAX = 99, ADULT = 15, PET_KEEP = 40, PARTY_MAX = 6;
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
    if (P.list.length >= PET_KEEP) { toast('仲間がいっぱい（' + PET_KEEP + '匹まで）。タマゴは孵らなかった'); return; }
    let r = Math.random() * 100, sp = 'slime';
    for (const k of Object.keys(PET_SP)) { r -= PET_SP[k].w; if (r <= 0) { sp = k; break; } }
    const pet = { id: Date.now() + Math.floor(Math.random() * 1000), sp, lvl: 1, exp: 0, shiny: Math.random() < 0.05, name: PET_NAMES[randi(0, PET_NAMES.length - 1)] };
    P.list.push(pet);
    if (!P.active) P.active = pet.id; else partyAdd(pet.id, true);
    save();
    sfx('level'); addShake(6);
    addVfx({ k: 'pillar', x: player.x, y: player.y, c: '255,240,200', life: 1 });
    addVfx({ k: 'ring', x: player.x, y: player.y, R: 2.4, c: '255,240,200', w: 8, life: 0.6 });
    showHatch(pet);
  }
  function showHatch(pet) {
    const S = PET_SP[pet.sp];
    paused = true;
    $('petTitle').textContent = 'タマゴが孵った！'; $('petOk').textContent = 'いっしょに行こう';
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

  /* ---------- growth & behaviour: a party of companions ---------- */
  const PARTY_E = {};
  function trainS() { const P = pets(); if (!P.train || typeof P.train !== 'object') P.train = { atk: 0, spd: 0, exp: 0 }; return P.train; }
  function partySlots() { return Math.min(PARTY_MAX, 2 + (pets().slots || 0)); }
  function partyList() {
    const P = pets(), lead = activePet(), out = lead ? [lead] : [];
    if (!Array.isArray(P.party)) P.party = [];
    for (const id of P.party) { if (out.length >= partySlots()) break; const q = P.list.find((x) => x.id === id); if (q && !out.includes(q)) out.push(q); }
    return out;
  }
  function partyAdd(id, quiet) {
    const P = pets();
    if (!Array.isArray(P.party)) P.party = [];
    if (!P.active) { P.active = id; return true; }
    if (P.active === id || P.party.includes(id)) return true;
    if (partyList().length >= partySlots()) { if (!quiet) toast('仲間の枠がいっぱい（' + partySlots() + '枠）。枠は訓練所で増やせる'); return false; }
    P.party.push(id); PARTY_E[id] = null;
    return true;
  }
  function partyRemove(id) {
    const P = pets();
    P.party = (P.party || []).filter((x) => x !== id);
    if (P.active === id) { P.active = P.party.shift() || null; P.ride = false; PET.map = -1; refreshD(); }
  }
  function entOf(p) {
    if (p.id === pets().active) return PET;
    let E = PARTY_E[p.id];
    if (!E) E = PARTY_E[p.id] = { x: player.x, y: player.y, isPet: true, pid: p.id, atkT: Math.random(), dir: 6, faceLeft: false, moving: false, anim: Math.random() * 5, map: -1, hop: 0 };
    return E;
  }
  function petDmgMul() { return 1 + 0.08 * trainS().atk; }
  function petIvMul() { return 1 / (1 + 0.04 * trainS().spd); }
  function partyGoldMul() { let m = 1; for (const q of partyList()) m += PET_SP[q.sp].gold || 0; return m; }
  function petPower(q) { const S = PET_SP[q.sp]; return (0.3 + 0.025 * q.lvl) * S.atk * (petAdult(q) ? 1.3 : 1) * petDmgMul() / (S.iv * petIvMul()); }
  function petGainExp(q, n) {
    if (q.lvl >= PET_MAX) return;
    q.exp += n * (1 + 0.2 * trainS().exp);
    while (q.lvl < PET_MAX && q.exp >= petNeed(q.lvl)) {
      q.exp -= petNeed(q.lvl); q.lvl++;
      if (q.lvl === ADULT) { toast(petName(q) + 'が成体になった！ リーダーにすると背中に乗れる'); sfx('level'); }
      else if (q.lvl % 10 === 0) toast(petName(q) + 'がLv' + q.lvl + 'になった');
    }
  }
  function petOnKill(e) {
    rollEgg(e);
    eggProgress(e.boss ? 10 : e.elite ? 3 : 1);
    for (const q of partyList()) petGainExp(q, e.boss ? 20 : e.elite ? 5 : 1);
  }
  function petUpdate(dt) {
    const list = partyList(), auto = autoOn();
    list.forEach((q, i) => petStep(q, entOf(q), i, dt, auto));
  }
  function petStep(p, E, idx, dt, auto) {
    const S = PET_SP[p.sp];
    E.anim += dt; E.hop += dt;
    if (E.map !== curMap || hyp(E.x - player.x, E.y - player.y) > 15) { E.map = curMap; const a = idx * 1.3; E.x = player.x + Math.cos(a) * 0.9; E.y = player.y + Math.sin(a) * 0.9; }
    if (E === PET && riding()) { E.x = player.x; E.y = player.y; E.moving = player.moving; E.faceLeft = player.faceLeft; E.dir = player.dir; return; }
    E.atkT = Math.max(0, E.atkT - dt);
    const ang = idx * 2.1 + 0.6;
    let tx = player.x + Math.cos(ang) * 1.1, ty = player.y + Math.sin(ang) * 1.1, tg = null;
    if (!player.dead && !inCamp(player.x, player.y)) {
      const pt = player.target, range = auto ? 11 : 5.5;
      if (pt && !pt.dead && !pt.obj && hyp(pt.x - player.x, pt.y - player.y) < 8 && idx === 0) tg = pt;
      else {
        // spread out: each companion prefers the nearest enemy to itself that is not too far from the hero
        let bd = 1e9;
        for (const e of enemies) {
          if (e.dead || e.obj) continue;
          const dp = hyp(e.x - player.x, e.y - player.y);
          if (dp > range || (!auto && e.state !== 'chase')) continue;
          const d = hyp(e.x - E.x, e.y - E.y) + (e.petTg && e.petTg !== E ? 2.5 : 0);
          if (d < bd) { bd = d; tg = e; }
        }
      }
    }
    if (tg) tg.petTg = E;
    const reach = S.kind === 'melee' ? 0.85 : 4.2;
    if (tg) { const d = hyp(tg.x - E.x, tg.y - E.y); if (d > reach) { tx = tg.x; ty = tg.y; } else { tx = E.x; ty = E.y; } }
    const dx = tx - E.x, dy = ty - E.y, d = hyp(dx, dy), sp = Math.max(3.6, D.speed * 1.25) * (S.fly ? 1.1 : 1);
    E.moving = d > 0.15;
    if (E.moving) {
      const st = Math.min(d, sp * dt), nx = E.x + dx / d * st, ny = E.y + dy / d * st;
      if (S.fly || !blockedAt(nx, ny, 0.15)) { E.x = nx; E.y = ny; } else { if (!blockedAt(nx, E.y, 0.15)) E.x = nx; else if (!blockedAt(E.x, ny, 0.15)) E.y = ny; }
      if (Math.abs(dx - dy) > 0.02) E.faceLeft = (dx - dy) < 0;
    }
    if (S.kind === 'heal' && E.atkT <= 0 && !player.dead && player.hp < D.maxHp) {
      if (!tg || hyp(tg.x - E.x, tg.y - E.y) > reach + 0.1) { E.atkT = S.iv * petIvMul() * 2; player.hp = Math.min(D.maxHp, player.hp + D.maxHp * 0.025 * (petAdult(p) ? 1.4 : 1)); burst(player.x, player.y, 20, 'heal', 4, 'mint', 1); return; }
    }
    if (tg && hyp(tg.x - E.x, tg.y - E.y) <= reach + 0.1 && E.atkT <= 0) {
      E.atkT = S.iv * petIvMul();
      if (Math.abs((tg.x - E.x) - (tg.y - E.y)) > 0.02) E.faceLeft = ((tg.x - E.x) - (tg.y - E.y)) < 0;
      const dmg = D.atk * (0.3 + 0.025 * p.lvl) * S.atk * (petAdult(p) ? 1.3 : 1) * petDmgMul();
      const hit = () => {
        if (S.kind === 'melee') { E.hop = 0; hitEnemy(tg, dmg); if (p.sp === 'fox') burst(tg.x, tg.y, 14, 'ember', 6, 'warm', 2); }
        else if (S.kind === 'ranged' || S.kind === 'heal') shots.push({ x: E.x, y: E.y, h: 40, tgt: tg, dmg, sp: 12, trail: [], col: S.el === 'ice' ? 'cyan' : S.kind === 'heal' ? 'mint' : 'cyan', ctx: S.el ? { dmg: 1, crit: 0, leech: 0, el: S.el } : null });
        else { explode(tg.x, tg.y, 1.3, dmg * 1.6); addFx({ k: 'chain', pts: [[E.x, E.y, 30], [tg.x, tg.y, 14]], t: 0, life: 0.2 }); }
      };
      if (S.el && S.kind === 'melee') withEl(S.el, hit); else hit();
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
    const sh = S.base || sp;
    const eye = (ex, ey, r) => { g.fillStyle = '#1a1420'; g.beginPath(); g.ellipse(ex, ey, r, r * 1.2, 0, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + r * 0.35, ey - r * 0.4, r * 0.4, 0, TAU); g.fill(); };
    const body = (grd) => { const gr = g.createLinearGradient(0, -20 * k, 0, 4 * k); gr.addColorStop(0, c[0]); gr.addColorStop(1, c[1]); return grd ? gr : c[0]; };
    g.lineJoin = 'round'; g.strokeStyle = 'rgba(20,14,30,0.55)'; g.lineWidth = 1.2 * k;
    if (sh === 'golem' || sh === 'fairy' || sh === 'mimic') drawPetExtra(g, sh, c, k, t, mount);
    else if (sh === 'slime') {
      const sq = 1 + Math.sin(t * 6) * 0.08;
      g.fillStyle = body(true); g.beginPath(); g.moveTo(-13 * k * sq, 0); g.quadraticCurveTo(-14 * k * sq, -18 * k / sq, 0, -19 * k / sq); g.quadraticCurveTo(14 * k * sq, -18 * k / sq, 13 * k * sq, 0); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.ellipse(-5 * k, -13 * k / sq, 4 * k, 2.4 * k, -0.5, 0, TAU); g.fill();
      if (!mount) { eye(-4 * k, -9 * k / sq, 1.8 * k); eye(4 * k, -9 * k / sq, 1.8 * k); }
    } else if (sh === 'fox') {
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
    } else if (sh === 'bird') {
      const f = Math.sin(t * 14);
      g.fillStyle = c[1]; g.beginPath(); g.moveTo(-2 * k, -10 * k); g.lineTo(-16 * k, -14 * k - f * 8 * k); g.lineTo(-6 * k, -6 * k); g.closePath(); g.fill();
      g.fillStyle = body(true); g.beginPath(); g.ellipse(0, -9 * k, 8 * k, 7 * k, 0, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = c[0]; g.beginPath(); g.moveTo(2 * k, -10 * k); g.lineTo(14 * k, -16 * k - f * 8 * k); g.lineTo(4 * k, -5 * k); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#ffd36e'; g.beginPath(); g.moveTo(7 * k, -11 * k); g.lineTo(12 * k, -9.5 * k); g.lineTo(7 * k, -8 * k); g.fill();
      g.fillStyle = c[1]; g.beginPath(); g.moveTo(-7 * k, -8 * k); g.lineTo(-13 * k, -3 * k); g.lineTo(-6 * k, -5 * k); g.fill();
      if (!mount) eye(4 * k, -11 * k, 1.3 * k);
    } else if (sh === 'wolf') {
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
  function drawPet(E) {
    E = E || PET;
    const p = E === PET ? activePet() : pets().list.find((q) => q.id === E.pid);
    if (!p || (E === PET && riding())) return;
    const S = PET_SP[p.sp], x0 = isoX(E.x, E.y), y0 = isoY(E.x, E.y);
    if (x0 < -60 || x0 > W + 60 || y0 < -60 || y0 > H + 60) return;
    const sc = (petAdult(p) ? 1.6 : 1.1) * zoom, hop = S.kind === 'melee' && E.hop < 0.25 ? Math.sin(E.hop / 0.25 * Math.PI) * 10 * zoom : 0;
    const hover = S.fly ? (S.fly + Math.sin(E.anim * 3) * 4) * zoom : (E.moving ? Math.abs(Math.sin(E.anim * 10)) * 2 * zoom : 0);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x0, y0, 12 * sc, 5 * sc, 0, 0, TAU); ctx.fill();
    drawPetShape(ctx, p.sp, p.shiny, x0, y0 - hover - hop, sc, E.anim, E.faceLeft, false);
    { ctx.font = '800 ' + Math.max(9, Math.round(10 * zoom)) + 'px ' + FONT; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,12,30,0.7)'; const tag = 'Lv' + p.lvl; ctx.strokeText(tag, x0, y0 - hover - 30 * sc); ctx.fillStyle = '#d8ffe8'; ctx.fillText(tag, x0, y0 - hover - 30 * sc); }
    if (p.shiny && Math.random() < 0.1) emis.push(['gold', x0 + rand(-12, 12) * zoom, y0 - hover - rand(4, 24) * zoom, 8 * zoom, 0.9]);
    if (S.fly) emis.push([S.el === 'volt' || p.sp === 'bird' ? 'cyan' : S.kind === 'heal' ? 'mint' : 'warm', x0, y0 - hover - 10 * zoom, 26 * zoom, 0.35]);
  }
  const MOUNT_K = 3.0;
  function rideHeight() { if (!riding()) return 0; const p = activePet(); return ((PET_SP[p.sp].fly ? PET_SP[p.sp].fly * 0.6 : 0) + (p.sp === 'slime' ? 17 : 12) * MOUNT_K) * zoom; }
  function drawMount(x0, y0) {
    const p = activePet(), S = PET_SP[p.sp], sc = MOUNT_K * zoom, hover = S.fly ? (S.fly * 0.6 + Math.sin(time * 3) * 3) * zoom : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.beginPath(); ctx.ellipse(x0, y0, 34 * zoom, 13 * zoom, 0, 0, TAU); ctx.fill();
    drawPetShape(ctx, p.sp, p.shiny, x0, y0 - hover + (player.moving ? Math.abs(Math.sin(time * 12)) * -2 * zoom : 0), sc, player.moving ? time : time * 0.3, player.faceLeft, false);
  }
  function petHud() {
    const b = $('rideBtn'), p = activePet(), show = !!(p && petAdult(p));
    if (b.hidden === show) b.hidden = !show;
    if (show) { const on = riding(); if (b.dataset.on !== String(on)) { b.dataset.on = String(on); $('rideLbl').textContent = on ? '降りる' : '騎乗'; b.classList.toggle('on', on); } }
  }
