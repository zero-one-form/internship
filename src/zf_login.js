  /* ================= login bonus: a 7-day cycle, handed over by a heroine ================= */
  const LOGIN_DAYS = [
    ['回復薬 ×3', () => { prog.potions = Math.min(potMax(), prog.potions + 3); }],
    ['ゴールド', () => { prog.gold += loginGold(1); }, () => loginGold(1).toLocaleString() + 'G'],
    ['魂の欠片 ×10', () => { gainSoul(10, 'ログイン報酬'); }],
    ['サポート宝石', () => { gainGem(Object.keys(GEMS)[Math.floor(Math.random() * Object.keys(GEMS).length)], true); }],
    ['ゴールド（多め）', () => { prog.gold += loginGold(2); }, () => loginGold(2).toLocaleString() + 'G'],
    ['レア装備', () => { if (prog.inv.length < INV_MAX) prog.inv.push(genItem(prog.level + 1, 2)); else prog.gold += loginGold(2); }],
    ['レジェンド装備＋宝石 ×2', () => { if (prog.inv.length < INV_MAX) prog.inv.push(genItem(prog.level + 2, 3)); else prog.gold += loginGold(4); for (let i = 0; i < 2; i++) gainGem(Object.keys(GEMS)[Math.floor(Math.random() * Object.keys(GEMS).length)], true); }]
  ];
  let loginChecked = false;
  function loginGold(k) { return Math.round(3000 * k * (1 + prog.level / 5)); }
  function loginState() {
    if (!prog.login || typeof prog.login !== 'object') prog.login = { last: 0, n: 0 };
    return prog.login;
  }
  // called from metaUpdate; shows once per calendar day after the title, opening and offline report are out of the way
  function loginTick(force) {
    if (TEST && !force) return; // automated runs (tests, screenshots, balance bot) only see it when asked
    if (loginChecked || paused || !$('intro').hidden || OP.on || transit || pendingOffline || !$('petDlg').hidden || talkCur) return;
    loginChecked = true;
    const L = loginState(), d = dayKey();
    if (L.last === d) return;
    L.last = d; L.n = (L.n || 0) + 1;
    const i = (L.n - 1) % LOGIN_DAYS.length, R = LOGIN_DAYS[i];
    R[1]();
    save();
    showLogin(L.n, i);
  }
  function showLogin(n, i) {
    const R = LOGIN_DAYS[i], out = HERO_IDS.filter((id) => heroJoined(id)), who = out.length ? out[(n - 1) % out.length] : null;
    paused = true;
    $('petTitle').textContent = 'ログインボーナス ' + n + '日目';
    $('petLine').textContent = '今日の贈り物：' + (R[2] ? R[0] + ' ' + R[2]() : R[0]);
    $('petDesc').textContent = LOGIN_DAYS.map((x, k) => (k === i ? '▶' : k < i ? '✓' : '・') + (k + 1)).join(' ') + '（7日目はレジェンド装備）' + (who ? '　' + HEROINES[who].name + '「また明日も、来てね」' : '');
    $('petOk').textContent = '受け取る';
    $('petDlg').hidden = false;
    const c = $('petCv'), g = c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height);
    if (who) drawBust(g, who, c.width, c.height, 'smile');
    sfx('quest');
  }
