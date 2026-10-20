
  /* ================= equipment & loot ================= */
  const INV_MAX = 36, IL_MAX = 400;
  const FLAT_OPTS = ['str', 'agi', 'vit', 'int', 'luk', 'hp', 'mp'];
  const SLOT_TYPES = ['sword', 'staff', 'head', 'body', 'acc'];
  const TYPE_INFO = {
    sword: { name: '剣', names: ['鉄の剣', '鋼の長剣', '銀翼の剣', '竜骨の大剣'], icon: 'ic-sword', base: (il) => 4 + il * 2.2, baseTxt: (v) => '剣の型の攻撃力 +' + v },
    staff: { name: '杖', names: ['樫の杖', '水晶の杖', '星詠みの杖', '天穹の杖'], icon: 'ic-staff', base: (il) => 4 + il * 2.2, baseTxt: (v) => '術の型の攻撃力 +' + v },
    head: { name: '頭', names: ['革の帽子', '鉄の兜', '騎士の兜', '天秤の冠'], icon: 'ic-head', base: (il) => 10 + il * 6, baseTxt: (v) => '最大HP +' + v },
    body: { name: '胴', names: ['旅人の服', '鎖かたびら', '騎士の鎧', '聖銀の鎧'], icon: 'ic-body', base: (il) => 3 + 27 * (1 - Math.exp(-il / 60)), baseTxt: (v) => '受けるダメージ -' + v + '%', dec: true },
    acc: { name: '装飾', names: ['銅の指輪', '翠玉の首飾り', '月長石の指輪', '星辰の護符'], icon: 'ic-acc', base: (il) => 8 + il * 3, baseTxt: (v) => '最大MP +' + v }
  };
  const RAR = [
    { name: 'ノーマル', col: '#e8eaf2', glow: 'white', n: [0, 0], price: 1 },
    { name: 'マジック', col: '#6fa8ff', glow: 'cyan', n: [1, 2], price: 2.5 },
    { name: 'レア', col: '#ffd34d', glow: 'gold', n: [3, 4], price: 6 },
    { name: 'レジェンド', col: '#ff8a3d', glow: 'warm', n: [4, 5], price: 15 }
  ];
  const EPI = ['暁', '黄昏', '嵐', '深淵', '不滅', '天啓', '紅蓮', '氷華', '流星', '月影'];
  const OPTS = {
    atkPct: { t: (v) => '攻撃力 +' + v + '%', r: (il) => [3 + il * 0.15, 8 + il * 0.3], p: '鋭き' },
    str: { t: (v) => '力 +' + v, r: (il) => [1 + il / 6, 3 + il / 3], p: '剛力の' },
    agi: { t: (v) => '素早さ +' + v, r: (il) => [1 + il / 6, 3 + il / 3], p: '俊敏な' },
    vit: { t: (v) => '体力 +' + v, r: (il) => [1 + il / 6, 3 + il / 3], p: '頑健な' },
    int: { t: (v) => '知力 +' + v, r: (il) => [1 + il / 6, 3 + il / 3], p: '賢者の' },
    luk: { t: (v) => '運 +' + v, r: (il) => [1 + il / 6, 3 + il / 3], p: '幸運の' },
    hp: { t: (v) => '最大HP +' + v, r: (il) => [10 + il * 3, 30 + il * 6], p: '頑強な' },
    mp: { t: (v) => '最大MP +' + v, r: (il) => [5 + il * 1.5, 15 + il * 3], p: '霊妙な' },
    crit: { t: (v) => '会心率 +' + v + '%', r: (il) => [1, 3 + il * 0.05], p: '必中の', d: 1 },
    critDmg: { t: (v) => '会心ダメージ +' + v + '%', r: (il) => [5, 15 + il * 0.4], p: '痛烈な' },
    aspd: { t: (v) => '攻撃の速さ +' + v + '%', r: (il) => [3, 8 + il * 0.1], p: '迅速の' },
    mspd: { t: (v) => '移動の速さ +' + v + '%', r: () => [3, 8], p: '疾き' },
    dr: { t: (v) => '受けるダメージ -' + v + '%', r: (il) => [2, 5 + il * 0.05], p: '堅牢な', d: 1 },
    leech: { t: (v) => 'HP吸収 +' + v + '%', r: () => [0.5, 2], p: '吸血の', d: 1 },
    mpr: { t: (v) => 'MP回復 +' + v + '/秒', r: (il) => [0.3, 1 + il * 0.03], p: '瞑想の', d: 1 },
    cdr: { t: (v) => 'スキルの再使用時間 -' + v + '%', r: () => [2, 6], p: '速詠の' },
    exp: { t: (v) => '経験値 +' + v + '%', r: () => [5, 15], p: '賢き' },
    gold: { t: (v) => 'ゴールド獲得 +' + v + '%', r: () => [10, 25], p: '富める' }
  };
  const loot = [];
  let itemSeq = 1, selItem = null, GEAR = emptyGear();
  function emptyGear() {
    const g = { swordAtk: 0, staffAtk: 0, hpB: 0, drB: 0, mpB: 0, sk: {}, pow: {} };
    for (const k in OPTS) g[k] = 0;
    return g;
  }
  function itemBase(it) {
    const T = TYPE_INFO[it.type], b = T.base(it.il) * (1 + 0.1 * it.plus);
    return T.dec ? Math.round(b * 10) / 10 : Math.round(b);
  }
  function optText(o) { return o.k === 'skill' ? '「' + SKD[o.sid].name + '」Lv +' + o.v + '（習得済みのとき）' : OPTS[o.k].t(o.v); }
  function rollRarity(elite) {
    const w = elite ? [20, 42, 29, 9] : [56, 31, 11, 2];
    let r = Math.random() * 100;
    for (let k = 0; k < 4; k++) { if (r < w[k]) return k; r -= w[k]; }
    return 0;
  }
  function genItem(il, rar, type) {
    type = type || SLOT_TYPES[(Math.random() * SLOT_TYPES.length) | 0];
    il = clamp(Math.round(il), 1, IL_MAX);
    const T = TYPE_INFO[type], R = RAR[rar];
    const n = R.n[0] + Math.floor(Math.random() * (R.n[1] - R.n[0] + 1));
    const keys = Object.keys(OPTS), used = new Set(), opts = [];
    const boost = rar === 3 ? 1.25 : 1;
    for (let k = 0; k < n; k++) {
      if (rar >= 2 && k === n - 1 && Math.random() < 0.45) {
        const form = type === 'sword' ? 'blade' : type === 'staff' ? 'arcane' : (Math.random() < 0.5 ? 'blade' : 'arcane');
        const pool = SK.filter((s) => s.form === form || s.form === 'both');
        opts.push({ k: 'skill', v: 1, sid: pool[(Math.random() * pool.length) | 0].id });
        continue;
      }
      let key;
      do { key = keys[(Math.random() * keys.length) | 0]; } while (used.has(key));
      used.add(key);
      const O = OPTS[key], rg = O.r(FLAT_OPTS.includes(key) ? il : Math.min(il, 99)), raw = (rg[0] + Math.random() * (rg[1] - rg[0])) * boost;
      opts.push({ k: key, v: O.d ? Math.round(raw * 10) / 10 : Math.max(1, Math.round(raw)) });
    }
    let name = T.names[il < 7 ? 0 : il < 13 ? 1 : il < 19 ? 2 : 3];
    if (il >= 100) name = ['真・', '極・', '神・'][Math.min(2, Math.floor((il - 100) / 100))] + name;
    if (rar === 3) name = '「' + EPI[(Math.random() * EPI.length) | 0] + '」' + name;
    else if (rar >= 1 && opts.length && opts[0].k !== 'skill') name = OPTS[opts[0].k].p + name;
    const it = { id: ++itemSeq, type, il, rar, name, opts, plus: 0, isNew: true };
    if (rar === 3) it.pow = rollPow();
    return it;
  }
  function cleanItem(it) {
    if (!it || typeof it !== 'object' || !TYPE_INFO[it.type]) return null;
    const num = (v, lo, hi, d) => (typeof v === 'number' && isFinite(v) ? clamp(v, lo, hi) : d);
    const own = (o, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
    const opts = Array.isArray(it.opts) ? it.opts.filter((o) => o && (o.k === 'skill' ? own(SKD, o.sid) : own(OPTS, o.k)) && typeof o.v === 'number' && isFinite(o.v)).slice(0, 6).map((o) => (o.k === 'skill' ? { k: 'skill', sid: o.sid, v: clamp(Math.round(o.v), 1, 3) } : { k: o.k, v: clamp(o.v, 0, 200) })) : [];
    return { id: Math.floor(num(it.id, 1, 1e12, ++itemSeq)), type: it.type, il: Math.round(num(it.il, 1, 999, 1)), rar: Math.round(num(it.rar, 0, 3, 0)), name: String(it.name || TYPE_INFO[it.type].names[0]).slice(0, 40), opts, plus: Math.round(num(it.plus, 0, 10, 0)), isNew: !!it.isNew, lock: !!it.lock, pow: own(LPOW, it.pow) ? it.pow : undefined };
  }
  function giveStarter() {
    prog.eq.sword = genItem(1, 0, 'sword');
    prog.eq.staff = genItem(1, 0, 'staff');
    prog.eq.sword.isNew = prog.eq.staff.isNew = false;
    prog.starter = true;
  }
  function refreshGear() {
    const g = emptyGear();
    for (const t of SLOT_TYPES) {
      const it = prog.eq[t];
      if (!it) continue;
      const b = itemBase(it);
      if (t === 'sword') g.swordAtk += b; else if (t === 'staff') g.staffAtk += b; else if (t === 'head') g.hpB += b; else if (t === 'body') g.drB += b; else g.mpB += b;
      for (const o of it.opts) { if (o.k === 'skill') g.sk[o.sid] = (g.sk[o.sid] || 0) + o.v; else g[o.k] += o.v; }
      if (it.pow) g.pow[it.pow] = 1;
    }
    GEAR = g;
    refreshD();
    player.hp = Math.min(player.hp, D.maxHp);
    player.mp = Math.min(player.mp, D.maxMp);
  }
  function dropLoot(e) {
    const n = e.boss ? 4 : e.elite ? (Math.random() < 0.4 ? 2 : 1) : (Math.random() < 0.13 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const it = genItem(e.lvl + (e.boss ? 3 : e.elite ? 1 : 0), bumpRar(e.boss ? Math.max(2, rollRarity(true)) : rollRarity(e.elite)));
      it.isNew = true;
      loot.push({ x: e.x + rand(-0.9, 0.9), y: e.y + rand(-0.9, 0.9), it, t: 0, sx: e.x, sy: e.y });
      if (it.rar >= 3) recAdd('legends');
      if (it.rar >= 2) addVfx({ k: 'drop', x: e.x, y: e.y, c: it.rar, life: it.rar >= 3 ? 1.1 : 0.7 });
      if (it.rar === 3) { toast('レジェンド装備が出た！「' + LPOW[it.pow].name + '」'); sfx('legend'); addShake(6); legendDropMoment(e); }
    }
  }
  function lootUpdate(dt) {
    for (let i = loot.length - 1; i >= 0; i--) {
      const L = loot[i];
      L.t += dt;
      if (L.t > 150) { loot.splice(i, 1); continue; }
      const ld = hyp(L.x - player.x, L.y - player.y);
      if (!player.dead && L.t > 0.5 && ld < 2 && ld > 0.05 && (prog.inv.length < INV_MAX || (opt().autoSell && L.it.rar === 0))) { const mv = Math.min(ld, dt * (3 + (2 - ld) * 4)); L.x += (player.x - L.x) / ld * mv; L.y += (player.y - L.y) / ld * mv; }
      if (player.dead || L.t < 0.4 || hyp(L.x - player.x, L.y - player.y) > 0.75) continue;
      if (autoSellPick(L.it)) { loot.splice(i, 1); continue; }
      if (prog.inv.length >= INV_MAX) { if (!L.warned) { toast('持ち物がいっぱい。装備画面で売ってください'); L.warned = true; } continue; }
      prog.inv.push(L.it);
      loot.splice(i, 1);
      onPickup(L.it);
      sfx(L.it.rar >= 3 ? 'legend' : L.it.rar >= 2 ? 'rare' : 'pick');
      log(RAR[L.it.rar].name + '：' + L.it.name + 'を拾った');
      if (L.it.rar >= 2) toast(RAR[L.it.rar].name + 'の装備を拾った！');
      burst(L.x, L.y, 8, 'magic', 8, RAR[L.it.rar].glow, 1.2);
      save();
    }
  }
  function enhanceCost(it) { return Math.round(40 * (it.plus + 1) * (1 + it.il / 4) * (1 + it.rar * 0.5)); }
  function enhanceRate(it) { return Math.max(0.3, 1 - it.plus * 0.08); }
  function sellPrice(it) { return Math.round((6 + it.il * 3) * RAR[it.rar].price * (1 + it.plus * 0.3)); }
  function equip(it) {
    const i = prog.inv.indexOf(it);
    if (i < 0) return;
    prog.inv.splice(i, 1);
    const old = prog.eq[it.type];
    if (old) prog.inv.push(old);
    it.isNew = false;
    prog.eq[it.type] = it;
    selItem = { where: 'eq', id: it.id, type: it.type };
    refreshGear(); save(); renderGear();
    toast(it.name + 'を装備した');
  }
  function unequip(type) {
    const it = prog.eq[type];
    if (!it) return;
    if (prog.inv.length >= INV_MAX) { toast('持ち物がいっぱい'); return; }
    prog.eq[type] = null;
    prog.inv.push(it);
    selItem = { where: 'inv', id: it.id };
    refreshGear(); save(); renderGear();
  }
  function sell(it) {
    sfx('coin');
    const i = prog.inv.indexOf(it);
    if (i < 0) return;
    prog.inv.splice(i, 1);
    const g = sellPrice(it);
    prog.gold += g;
    selItem = null;
    log(it.name + 'を' + g + 'Gで売った');
    save(); renderGear();
  }
  function sellNormals() {
    let g = 0, n = 0;
    for (let i = prog.inv.length - 1; i >= 0; i--) if (prog.inv[i].rar === 0) { g += sellPrice(prog.inv[i]); prog.inv.splice(i, 1); n++; }
    if (!n) { toast('売れるノーマル装備がない'); return; }
    prog.gold += g;
    selItem = null;
    log('ノーマル装備' + n + '個を' + g + 'Gで売った');
    save(); renderGear();
  }
  function enhance(it) {
    if (!inCamp(player.x, player.y) || it.plus >= 10) return;
    const cost = enhanceCost(it);
    if (prog.gold < cost) { toast('所持金が足りない'); return; }
    prog.gold -= cost;
    if (Math.random() < enhanceRate(it)) {
      it.plus++;
      toast('強化成功！ +' + it.plus);
      questEvent('plus');
      sfx('anvil');
      if (prog.eq[it.type] === it) refreshGear();
    } else { toast('強化失敗…（装備はそのまま）'); sfx('fail'); }
    save(); renderGear();
  }

  /* ---------- loot rendering ---------- */
  function drawLootGround() {
    for (const L of loot) {
      const x0 = isoX(L.x, L.y), y0 = isoY(L.x, L.y);
      if (x0 < -30 || x0 > W + 30 || y0 < -30 || y0 > H + 30) continue;
      const z = zoom, fk = L.sx !== undefined && L.t < 0.45 ? L.t / 0.45 : 1, ax = fk < 1 ? isoX(L.sx + (L.x - L.sx) * fk, L.sy + (L.y - L.sy) * fk) - x0 : 0, ay = fk < 1 ? isoY(L.sx + (L.x - L.sx) * fk, L.sy + (L.y - L.sy) * fk) - y0 - Math.sin(fk * Math.PI) * 34 * z : 0;
      const y1 = y0 - 9 * z + Math.sin(time * 3 + L.it.id) * 2 * z + ay;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(x0, y0, 7 * z, 3 * z, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.translate(ax, 0);
      ctx.fillStyle = RAR[L.it.rar].col; ctx.strokeStyle = 'rgba(10,12,30,0.85)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x0, y1 - 7 * z); ctx.lineTo(x0 + 5 * z, y1); ctx.lineTo(x0, y1 + 7 * z); ctx.lineTo(x0 - 5 * z, y1); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath(); ctx.moveTo(x0, y1 - 7 * z); ctx.lineTo(x0 + 2 * z, y1 - z); ctx.lineTo(x0 - 2 * z, y1 - z); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
  function drawLootEmissive() {
    for (const L of loot) {
      const x0 = isoX(L.x, L.y), y0 = isoY(L.x, L.y);
      if (x0 < -30 || x0 > W + 30 || y0 < -200 || y0 > H + 30) continue;
      const R = RAR[L.it.rar], h = [18, 60, 100, 150][L.it.rar] * zoom, rgb = hexRgb(R.col).join(',');
      const g = ctx.createLinearGradient(0, y0 - h, 0, y0);
      g.addColorStop(0, 'rgba(' + rgb + ',0)');
      g.addColorStop(1, 'rgba(' + rgb + ',' + (0.35 + 0.1 * Math.sin(time * 4)).toFixed(2) + ')');
      ctx.fillStyle = g;
      ctx.fillRect(x0 - 4 * zoom, y0 - h, 8 * zoom, h);
      const r = (14 + L.it.rar * 6) * zoom;
      ctx.globalAlpha = 0.6;
      ctx.drawImage(GLOW[R.glow].img, x0 - r, y0 - 9 * zoom - r, r * 2, r * 2);
      ctx.globalAlpha = 1;
    }
  }
  function drawLootLabels() {
    ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    ctx.font = '800 ' + Math.round(11 * Math.max(0.9, zoom)) + 'px ' + FONT;
    for (const L of loot) {
      if (L.it.rar < 1) continue;
      const x0 = isoX(L.x, L.y), y0 = isoY(L.x, L.y) - 26 * zoom;
      if (x0 < -60 || x0 > W + 60 || y0 < -20 || y0 > H + 20) continue;
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(8,10,28,0.85)'; ctx.strokeText(L.it.name, x0, y0);
      ctx.fillStyle = RAR[L.it.rar].col; ctx.fillText(L.it.name, x0, y0);
    }
  }
  function collectLootLights(tw) { for (const L of loot) if (L.it.rar >= 2) addLight(isoX(L.x, L.y), isoY(L.x, L.y) - 10 * zoom, 1.2 * tw, RAR[L.it.rar].glow, 0.8); }
  function pickLoot(px, py) {
    let best = null, bd = 30;
    for (const L of loot) { const d = hyp(px - isoX(L.x, L.y), py - (isoY(L.x, L.y) - 9 * zoom)); if (d < bd) { bd = d; best = L; } }
    return best;
  }

  /* ---------- gear UI ---------- */
  function elP(cls, text) { const p = document.createElement('p'); p.className = cls; p.textContent = text; return p; }
  function elBtn(text, cls, fn) { const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = text; b.addEventListener('click', fn); return b; }
  function itemCellOld(it, onClick, label) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'itc r' + it.rar + (selItem && selItem.id === it.id ? ' sel' : '');
    b.innerHTML = '<svg aria-hidden="true"><use href="#' + TYPE_INFO[it.type].icon + '"></use></svg>' + (it.plus ? '<i>+' + it.plus + '</i>' : '') + (it.isNew ? '<em></em>' : '');
    b.setAttribute('aria-label', (label ? label + '：' : '') + it.name);
    b.addEventListener('click', onClick);
    return b;
  }
  function findSel() {
    if (!selItem) return null;
    if (selItem.where === 'eq') { const it = prog.eq[selItem.type]; return it && it.id === selItem.id ? it : null; }
    return prog.inv.find((i) => i.id === selItem.id) || null;
  }
  function renderGearOld0() {
    if ($('tabGear').hidden) return;
    const row = $('eqRow');
    row.textContent = '';
    for (const t of SLOT_TYPES) {
      const cell = document.createElement('div'); cell.className = 'eqs';
      const it = prog.eq[t];
      if (it) cell.appendChild(itemCell(it, () => { selItem = { where: 'eq', id: it.id, type: t }; renderGear(); }, TYPE_INFO[t].name));
      else { const e = document.createElement('div'); e.className = 'itc empty'; e.innerHTML = '<svg aria-hidden="true"><use href="#' + TYPE_INFO[t].icon + '"></use></svg>'; cell.appendChild(e); }
      const cap = document.createElement('span'); cap.textContent = TYPE_INFO[t].name; cell.appendChild(cap);
      row.appendChild(cell);
    }
    $('invCount').textContent = prog.inv.length + ' / ' + INV_MAX;
    const grid = $('invGrid');
    grid.textContent = '';
    for (const it of prog.inv) grid.appendChild(itemCell(it, () => { it.isNew = false; selItem = { where: 'inv', id: it.id }; renderGear(); }));
    if (!prog.inv.length) grid.appendChild(elP('ith', '敵を倒すと装備が落ちることがあります'));
    const box = $('itemDetail');
    box.textContent = '';
    const it = findSel();
    box.hidden = !it;
    if (!it) return;
    const h = document.createElement('h4'); h.className = 'itn r' + it.rar; h.textContent = it.name + (it.plus ? ' +' + it.plus : '');
    box.append(h, elP('itm', RAR[it.rar].name + '／' + TYPE_INFO[it.type].name + '／アイテムLv' + it.il), elP('itb', TYPE_INFO[it.type].baseTxt(itemBase(it))));
    if (it.opts.length) { const ul = document.createElement('ul'); ul.className = 'ito'; for (const o of it.opts) { const li = document.createElement('li'); li.textContent = optText(o); ul.appendChild(li); } box.append(ul); }
    if (it.pow) { const pp = document.createElement('p'); pp.className = 'itp'; pp.textContent = powText(it); box.append(pp); }
    if (selItem.where === 'inv') {
      const cur = prog.eq[it.type], diff = Math.round((itemBase(it) - (cur ? itemBase(cur) : 0)) * 10) / 10;
      box.append(elP('cmp ' + (diff >= 0 ? 'up' : 'down'), (cur ? '装備中より' : '何も装備していない枠。') + '基本性能 ' + (diff >= 0 ? '+' : '') + diff));
    }
    const acts = document.createElement('div'); acts.className = 'ita';
    if (selItem.where === 'inv') acts.append(elBtn('装備する', 'primary small', () => equip(it)));
    else acts.append(elBtn('外す', 'ghost small', () => unequip(selItem.type)));
    const camp = inCamp(player.x, player.y), cost = enhanceCost(it);
    const eb = elBtn(it.plus >= 10 ? '強化は最大' : '強化 +' + (it.plus + 1) + '（' + cost + 'G／成功率' + Math.round(enhanceRate(it) * 100) + '%）', 'ghost small', () => enhance(it));
    eb.disabled = it.plus >= 10 || !camp || prog.gold < cost;
    acts.append(eb);
    if (selItem.where === 'inv') acts.append(elBtn('売る（' + sellPrice(it) + 'G）', 'ghost small', () => sell(it)));
    box.append(acts);
    if (!camp) box.append(elP('ith', '強化はキャンプの焚き火のそばでできます。失敗しても装備は壊れません'));
  }
