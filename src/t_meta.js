
  /* ================= meta: abyss ranks (new game+), dive persistence, records, help, lite mode ================= */
  const ROMAN = ['', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ'];
  function rankNow() { return prog.rank || 0; }
  function rankMul() { return curMap === 3 ? 1 + 0.3 * rankNow() : 1; }
  function bumpRar(r) { return curMap === 3 && rankNow() && r < 3 && Math.random() < rankNow() * 0.07 ? r + 1 : r; }
  function setRank(r) {
    r = clamp(Math.round(r), 0, prog.rankMax || 0);
    if (r === rankNow()) return;
    if (!Array.isArray(prog.rankDeep)) prog.rankDeep = [];
    prog.rankDeep[rankNow()] = prog.deep;
    prog.rank = r;
    prog.deep = prog.rankDeep[r] || 0;
    prog.floor = 1;
    save();
    toast(r ? '深淵の位階' + ROMAN[r] + 'に切り替えた（敵Lv+' + r * 25 + '・報酬+' + r * 30 + '%）' : '通常の深淵に切り替えた');
  }
  function rankUnlock() {
    const nx = Math.min(10, rankNow() + 1);
    if ((prog.rankMax || 0) < nx) prog.rankMax = nx;
    save();
    return nx;
  }
  function restoreDive() {
    if (curMap !== 3 || !Array.isArray(prog.bless)) return;
    BLESS = prog.bless.filter((id) => BLESSINGS.some((b) => b[0] === id)).slice(0, 60);
    phoenixUsed = !!prog.phx;
    if (BLESS.length) refreshD();
  }
  function recs() { if (!prog.rec || typeof prog.rec !== 'object') prog.rec = {}; return prog.rec; }
  function recKill(e) {
    const r = recs();
    r.kills = (r.kills || 0) + 1;
    if (e.elite) r.elites = (r.elites || 0) + 1;
    if (e.boss) r.bosses = (r.bosses || 0) + 1;
    if (e.obj === 'chest') r.chests = (r.chests || 0) + 1;
    if (e.treasure) r.goblins = (r.goblins || 0) + 1;
    if (combo > (r.combo || 0)) r.combo = combo;
  }
  function recAdd(k, n) { const r = recs(); r[k] = (r[k] || 0) + (n || 1); }
  function metaUpdate(dt) { const r = recs(); r.play = (r.play || 0) + dt; classUpdate(dt); petUpdate(dt); petHud(); wbUpdate(dt); dailyTick(dt); }
  function recordsCard() {
    const r = recs(), h = Math.floor((r.play || 0) / 3600), m = Math.floor(((r.play || 0) % 3600) / 60);
    const c = document.createElement('div'); c.className = 'qc';
    const rows = [['プレイ時間', h + '時間' + m + '分'], ['倒した魔物', (r.kills || 0) + '体'], ['倒した強い個体', (r.elites || 0) + '体'], ['倒したボス', (r.bosses || 0) + '体'], ['最大コンボ', (r.combo || 0)], ['見つけたレジェンド', (r.legends || 0) + '個'], ['開けた宝箱', (r.chests || 0) + '個'], ['倒した宝ゴブリン', (r.goblins || 0) + '体'], ['倒れた回数', (r.deaths || 0) + '回'], ['深淵踏破', (prog.cleared || 0) + '回'], ['到達した位階', prog.rankMax ? '位階' + ROMAN[prog.rankMax] : '―']];
    c.append(elP('qh', '冒険の記録'));
    const dl = document.createElement('dl'); dl.className = 'derived'; dl.style.margin = '6px 0 0';
    for (const [k, v] of rows) { const dt = document.createElement('dt'); dt.textContent = k; const dd = document.createElement('dd'); dd.textContent = String(v); dl.append(dt, dd); }
    c.append(dl);
    return c;
  }
  function rankRow(box) {
    if (!prog.rankMax) return;
    const row = document.createElement('div'); row.className = 'opt'; row.style.flexWrap = 'wrap';
    const tx = document.createElement('span');
    const n = document.createElement('span'); n.className = 'nm'; n.textContent = '深淵の位階';
    const hh = document.createElement('span'); hh.className = 'hint'; hh.textContent = '位階ごとに敵Lv+25・報酬+30%・レア度が上がりやすい。到達階は位階ごとに記録';
    tx.append(n, hh);
    const chips = document.createElement('div'); chips.className = 'gtools'; chips.style.margin = '6px 0 0';
    for (let r = 0; r <= prog.rankMax; r++) chips.append(elBtn(r ? '位階' + ROMAN[r] : '通常', 'chip' + (r === rankNow() ? ' on' : ''), () => { if (curMap === 3) { toast('位階の切り替えは地上で'); return; } setRank(r); renderOpt(); }));
    row.append(tx, chips);
    box.appendChild(row);
  }
