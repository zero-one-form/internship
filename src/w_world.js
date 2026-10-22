
  /* ================= online: weekly world boss (shared HP) & weekly abyss ranking ================= */
  const WB_BOSSES = [
    { name: '星喰らいの巨骸', type: 'undead', cv: 0, biome: 'ab_star' },
    { name: '紅蓮の女帝', type: 'ant', cv: 0, biome: 'ab_ember' },
    { name: '虚ろなる王', type: 'undead', cv: 1, biome: 'ab_void' },
    { name: '血塗れの大将軍', type: 'goblin', cv: 0, biome: 'ab_blood' }
  ];
  const WEEK_MODS = ['frenzy', 'armored', 'horde', 'elite', 'blast', 'regen', 'burning', 'dark'];
  const WB_TIME = 90, WB_TRIES = 3, WB_HP = 8e6, WB_DMG_CAP = 3e6; // one player's weekly contribution can't exceed this
  var NET = { ready: false, db: null, user: null, me: null, canWrite: false, note: 'オフライン（このページだけで遊べる）' };
  var WB = { on: false, t: 0, dmg: 0, boss: null, global: null };
  function weekKey() { const d = new Date(); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000 + 3) / 7); }
  function dayKey() { const d = new Date(); return d.getFullYear() * 1000 + d.getMonth() * 40 + d.getDate(); }
  function wbDef() { return WB_BOSSES[weekKey() % WB_BOSSES.length]; }
  function weekMod() { return WEEK_MODS[weekKey() % WEEK_MODS.length]; }
  function wbLocal() {
    const wk = weekKey();
    if (!prog.wb || prog.wb.wk !== wk) prog.wb = { wk, dmg: 0, claimed: false, day: 0, tries: 0 };
    if (prog.wb.day !== dayKey()) { prog.wb.day = dayKey(); prog.wb.tries = 0; }
    return prog.wb;
  }
  function wkLocal() { const wk = weekKey(); if (!prog.wk || prog.wk.wk !== wk) prog.wk = { wk, deep: 0, rank: 0, score: 0 }; return prog.wk; }
  async function netInit() {
    try {
      if (!window.claude || typeof window.claude.use !== 'function') return;
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!db || !user) { NET.note = 'オフライン（サインインすると参加できる）'; return; }
      NET.db = db; NET.user = user;
      NET.me = await user.id();
      const cw = await user.can('data.write');
      NET.canWrite = cw !== false && !!NET.me;
      NET.ready = true;
      NET.note = NET.canWrite ? 'オンライン' : '閲覧のみ（参加するには共有設定で「投稿者」以上の権限が必要）';
      wbRefresh();
    } catch (e) { NET.note = 'オフライン（通信できなかった）'; }
  }
  async function netWrite(col, data) {
    if (!NET.ready || !NET.canWrite || !NET.me) return false;
    try { await NET.db.collection(col).doc(NET.me).set(Object.assign({ uid: NET.me }, data)); return true; } catch (e) { return false; }
  }
  async function netQuery(col, field, val) {
    if (!NET.ready) return [];
    try { const s = await NET.db.collection(col).where(field, '==', val).limit(500).get(); return s.docs.map((d) => ({ id: d.id, x: d.data() })).filter((r) => r.x && typeof r.x.uid === 'string' && r.x.uid === r.id).map((r) => r.x); } catch (e) { return []; }
  }
  async function names(ids) {
    const out = {};
    if (!NET.user || !ids.length) return out;
    try { const ps = await NET.user.profiles(ids); for (const id of ids) out[id] = (ps && ps[id] && ps[id].name) || ''; } catch (e) { /* ignore */ }
    return out;
  }
  async function wbRefresh() {
    const L = wbLocal(), wk = weekKey();
    let rows = await netQuery('wb', 'boss', wk);
    rows = rows.filter((r) => typeof r.dmg === 'number' && isFinite(r.dmg) && r.dmg >= 0).map((r) => ({ uid: r.uid, dmg: Math.min(r.dmg, WB_DMG_CAP), lvl: clamp(Math.floor(+r.lvl || 1), 1, 999), killed: r.killed === true }));
    if (!rows.some((r) => r.uid === NET.me)) rows.push({ uid: NET.me || 'me', dmg: L.dmg, lvl: prog.level, killed: false });
    else for (const r of rows) if (r.uid === NET.me) { L.dmg = Math.max(L.dmg, r.dmg); r.dmg = L.dmg; }
    const n = rows.filter((r) => r.dmg > 0).length || 1, hpMax = Math.round(WB_HP * Math.pow(n, 0.8)), sum = rows.reduce((a, r) => a + r.dmg, 0);
    rows.sort((a, b) => b.dmg - a.dmg);
    WB.global = { hpMax, left: rows.some((r) => r.killed) || L.killed ? 0 : Math.max(0, hpMax - sum), n, rows, wk };
    return WB.global;
  }
  async function lbRefresh() {
    const W = wkLocal();
    let rows = await netQuery('lb', 'week', weekKey());
    rows = rows.filter((r) => [r.score, r.deep, r.rank].every((v) => typeof v === 'number' && isFinite(v)) && r.rank >= 0 && r.rank <= 10 && r.deep >= 1 && r.deep <= 50 && r.score === r.rank * 100 + r.deep).map((r) => ({ uid: r.uid, score: r.score, deep: r.deep, rank: r.rank, lvl: clamp(Math.floor(+r.lvl || 1), 1, 999) }));
    if (!rows.some((r) => r.uid === NET.me) && W.score > 0) rows.push({ uid: NET.me || 'me', score: W.score, deep: W.deep, rank: W.rank, lvl: prog.level });
    rows.sort((a, b) => b.score - a.score);
    return rows;
  }
  function lbOnFloor(f) {
    if (WB.on || curMap !== 3) return;
    const W = wkLocal(), sc = rankNow() * 100 + f;
    if (sc <= W.score) return;
    W.score = sc; W.deep = f; W.rank = rankNow(); save();
    netWrite('lb', { week: weekKey(), score: sc, deep: f, rank: rankNow(), lvl: prog.level });
  }

  /* ---------- the rift arena ---------- */
  function wbPrep(M) {
    const d = wbDef();
    M.name = '世界の裂け目'; M.seed = 777 + weekKey(); M.base = Math.max(10, prog.level + 5); M.elite = 0;
    M.kinds = [['undead', 1]]; M.biome = d.biome; M.layout = 'grand'; M.camp = [12.5, 12.5];
    M.portals[0].x = 7.5; M.portals[0].y = 7.5; M.extra = []; M.ponds = 0;
    M.rec = '共闘ボス「' + d.name + '」　制限時間' + WB_TIME + '秒';
  }
  function wbStart() {
    floorKills = 0; stairsOpen = false; bossRef = null; clearBossFx();
    FLOOR.obj = 'boss'; FLOOR.mods = []; FLOOR.bonus = 0;
    enemies.length = 0;
    const d = wbDef(), G = WB.global || { hpMax: WB_HP, left: WB_HP };
    const e = makeEnemy(d.type, 30, 30, MAPS[3].base + 4, ++packSeq, true);
    e.cv = d.cv; e.boss = true; e.final = true; e.world = true; e._f = 1;
    e.maxHp = G.hpMax; e.hp = Math.max(1, G.left); e.dmg *= 2; e.r = 0.8; e.aggro = 30; e.exp = 0; e.speed *= 1.1; e.sumT = 12; e.cdA = 2.5; e.cdB = 5; e.cdC = 8; e.phase = finalPhaseOf(e); e.state = 'chase';
    enemies.push(e); bossRef = e;
    WB.boss = e; WB.t = WB_TIME; WB.dmg = 0;
    toast('「' + d.name + '」に挑む！ ' + WB_TIME + '秒で与えたダメージが全員の討伐に加算される');
  }
  async function wbEnter() {
    const L = wbLocal();
    if (WB.on) return;
    if (L.tries >= WB_TRIES) { toast('今日の挑戦回数を使い切った（毎日' + WB_TRIES + '回）'); return; }
    if (curMap === 3) { toast('深淵の中からは挑めない。地上から挑もう'); return; }
    if (player.dead || WB.entering) return;
    WB.entering = true;
    try { await wbRefresh(); } finally { WB.entering = false; }
    if (WB.on || curMap === 3 || player.dead || transit || L.tries >= WB_TRIES) return;
    if (WB.global.left <= 0) { toast('今週の共闘ボスはすでに討伐された！'); return; }
    L.tries++; save();
    $('worldDlg').hidden = true; paused = false;
    WB.on = true;
    transit = true; $('fade').classList.add('on');
    setTimeout(() => { enterMap(3, null); $('fade').classList.remove('on'); transit = false; }, 320);
  }
  function wbUpdate(dt) {
    if (!WB.on || curMap !== 3 || paused) return;
    WB.t -= dt;
    if (WB.t <= 0) wbEnd('time');
  }
  function wbLeave() { if (!WB.on) return; WB.on = false; const L = wbLocal(); L.dmg += Math.round(WB.dmg); WB.dmg = 0; save(); netWrite('wb', { boss: weekKey(), dmg: L.dmg, lvl: prog.level, killed: !!L.killed }); }
  function wbHit(e, dmg) { if (e.world && WB.on) WB.dmg += dmg; }
  async function wbEnd(reason) {
    if (!WB.on) return;
    WB.on = false;
    const L = wbLocal(), got = Math.round(WB.dmg);
    L.dmg += got; save();
    const gold = Math.round(got / 40), exp = Math.round(got / 12);
    prog.gold += gold;
    player.dead = false; player.hp = D.maxHp; $('dead').hidden = true;
    gainExp(exp);
    if (reason === 'kill') L.killed = true;
    transit = true; $('fade').classList.add('on');
    setTimeout(() => { enterMap(0, null); $('fade').classList.remove('on'); transit = false; openWorld({ dmg: got, gold, exp, reason }); }, 320);
    netWrite('wb', { boss: weekKey(), dmg: L.dmg, lvl: prog.level, killed: !!L.killed });
  }
  function wbKilled() {
    WB.global && (WB.global.left = 0);
    toast('とどめを刺した！ 今週の共闘ボスを討伐した！');
    addVfx({ k: 'sflash', c: '255,240,200', a: 0.6, life: 0.6 }); addShake(18);
    setTimeout(() => wbEnd('kill'), 1500);
  }
  function wbClaim() {
    const L = wbLocal();
    if (L.claimed || L.dmg <= 0 || !WB.global || WB.global.left > 0) return;
    L.claimed = true;
    for (let k = 0; k < 2; k++) { const it = genItem(prog.level + 5, 3); if (prog.inv.length < INV_MAX) prog.inv.push(it); }
    prog.gold += 30000;
    save(); sfx('legend');
    toast('討伐報酬：レジェンド装備×2と30000Gを受け取った');
    openWorld();
  }

  /* ---------- panel ---------- */
  function fmtN(n) { return n >= 1e8 ? (n / 1e8).toFixed(2) + '億' : n >= 1e4 ? (n / 1e4).toFixed(1) + '万' : String(Math.round(n)); }
  async function openWorld(result) {
    const dlg = $('worldDlg'), box = $('worldBox');
    paused = true; dlg.hidden = false;
    box.textContent = '';
    box.append(elP('ith', '通信：' + NET.note));
    if (result) {
      const r = document.createElement('div'); r.className = 'qc';
      r.append(elP('qh', result.reason === 'kill' ? '討伐成功！' : result.reason === 'dead' ? '倒れてしまった' : '時間切れ'), elP('qg', '今回の与ダメージ ' + fmtN(result.dmg)), elP('qr', '報酬：' + result.gold + 'G・経験値' + result.exp));
      box.append(r);
    }
    const wait = elP('ith', '読み込み中…'); box.append(wait);
    const [G, lb] = await Promise.all([wbRefresh(), lbRefresh()]);
    wait.remove();
    const ids = Array.from(new Set(G.rows.slice(0, 5).map((r) => r.uid).concat(lb.slice(0, 10).map((r) => r.uid)))).filter((id) => id !== 'me');
    const nm = await names(ids);
    const who = (uid) => uid === NET.me || uid === 'me' ? 'あなた' : (nm[uid] || '冒険者');
    const L = wbLocal(), d = wbDef();
    const c1 = document.createElement('div'); c1.className = 'qc';
    c1.append(elP('qh', '世界の裂け目　今週の共闘ボス'), elP('qg', d.name));
    const bar = document.createElement('div'); bar.className = 'wbar'; const fill = document.createElement('i'); fill.style.transform = 'scaleX(' + (G.left / G.hpMax) + ')'; bar.append(fill); c1.append(bar);
    c1.append(elP('qr', '残りHP ' + fmtN(G.left) + ' / ' + fmtN(G.hpMax) + '　参加 ' + G.n + '人'));
    c1.append(elP('qr', 'あなたの貢献 ' + fmtN(L.dmg) + '　今日の挑戦 残り' + Math.max(0, WB_TRIES - L.tries) + '回'));
    const acts = document.createElement('div'); acts.className = 'ita';
    if (G.left <= 0) {
      if (L.dmg > 0 && !L.claimed) acts.append(elBtn('討伐報酬を受け取る', 'primary small', wbClaim));
      else c1.append(elP('ith', L.claimed ? '報酬は受け取り済み。来週の共闘ボスを待とう' : '今週は討伐済み。来週は参加しよう'));
    } else { const b = elBtn('挑む（' + WB_TIME + '秒）', 'primary small', wbEnter); b.disabled = L.tries >= WB_TRIES || curMap === 3; acts.append(b); }
    c1.append(acts);
    if (G.rows.length) { c1.append(elP('qh', '貢献ランキング')); G.rows.slice(0, 5).forEach((r, i) => c1.append(elP('lbr' + (r.uid === NET.me || r.uid === 'me' ? ' me' : ''), (i + 1) + '. ' + who(r.uid) + '　' + fmtN(r.dmg)))); }
    box.append(c1);
    const W = wkLocal();
    const c2 = document.createElement('div'); c2.className = 'qc';
    c2.append(elP('qh', '週間深淵ランキング'), elP('qg', '今週の呪い：' + MODS[weekMod()][0] + '（' + MODS[weekMod()][1] + '）'), elP('qr', '今週はすべての階にこの呪いがかかる。今週いちばん深く到達した階で競う（位階が高いほど上位）'));
    c2.append(elP('qr', 'あなたの今週の記録：' + (W.score ? (W.rank ? '位階' + ROMAN[W.rank] + '・' : '') + 'B' + W.deep + 'F' : 'まだなし')));
    if (lb.length) lb.slice(0, 10).forEach((r, i) => c2.append(elP('lbr' + (r.uid === NET.me || r.uid === 'me' ? ' me' : ''), (i + 1) + '. ' + who(r.uid) + '　' + (r.rank ? '位階' + ROMAN[r.rank] + '・' : '') + 'B' + r.deep + 'F　Lv' + (r.lvl || '?'))));
    else c2.append(elP('ith', 'まだ誰も記録していない'));
    box.append(c2);
  }
