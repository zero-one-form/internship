  /* ================= daily missions (mobile-game dailies) and achievements with titles ================= */
  // Daily progress = play records now minus a snapshot taken when the day's missions were rolled.
  const DAILY_POOL = [
    { id: 'kills', k: 'kills', n: 80, t: '魔物を80体倒す' },
    { id: 'elites', k: 'elites', n: 6, t: '強い個体を6体倒す' },
    { id: 'reacts', k: 'reacts', n: 12, t: '元素反応を12回起こす' },
    { id: 'dodges', k: 'dodges', n: 5, t: '見切り（ぎりぎりの回避）を5回決める' },
    { id: 'chests', k: 'chests', n: 2, t: '深淵の宝箱を2つ開ける' },
    { id: 'floors', k: 'floors', n: 5, t: '深淵の階の目標を5回果たす', deep: 1 },
    { id: 'bosses', k: 'bosses', n: 1, t: 'ボスを1体倒す', deep: 5 },
    { id: 'breaks', k: 'breaks', n: 2, t: 'ボスを2回ブレイクする', deep: 5 },
    { id: 'aria', k: 'aria', n: 1, t: 'アリアの演奏でランクB以上を取る' }
  ];
  const DAILY_KEYS = ['kills', 'elites', 'reacts', 'dodges', 'chests', 'floors', 'bosses', 'breaks', 'aria'];
  const ACH = [
    ['k100', '狩人', '魔物を100体倒す', () => recs().kills >= 100],
    ['k1000', '千の刃', '魔物を1000体倒す', () => recs().kills >= 1000],
    ['k10000', '万夫不当', '魔物を10000体倒す', () => recs().kills >= 10000],
    ['e50', '強者狩り', '強い個体を50体倒す', () => recs().elites >= 50],
    ['b5', 'ボス殺し', 'ボスを5体倒す', () => recs().bosses >= 5],
    ['b30', '王殺し', 'ボスを30体倒す', () => recs().bosses >= 30],
    ['leg1', '伝説の始まり', 'レジェンド装備を見つける', () => recs().legends >= 1],
    ['leg10', '伝説の収集家', 'レジェンド装備を10個見つける', () => recs().legends >= 10],
    ['d10', '深淵の旅人', '深淵 B10F に到達する', () => prog.deep >= 10 || prog.rankMax > 0],
    ['d25', '深淵の探索者', '深淵 B25F に到達する', () => prog.deep >= 25 || prog.rankMax > 0],
    ['clear', '深淵を越えし者', '深淵の主を倒す', () => prog.cleared >= 1],
    ['rank3', '位階の挑戦者', '位階Ⅲに到達する', () => prog.rankMax >= 3],
    ['c100', '百連', '100コンボを決める', () => recs().combo >= 100],
    ['r50', '元素使い', '元素反応を50回起こす', () => recs().reacts >= 50],
    ['dg20', '見切りの達人', '見切りを20回決める', () => recs().dodges >= 20],
    ['br10', '崩しの名手', 'ボスを10回ブレイクする', () => recs().breaks >= 10],
    ['ariaS', 'アリアの歌い手', 'アリアの演奏でランクSを取る', () => ariaState().best.some((v) => v >= 95)],
    ['pet', 'ともだち', 'ペットを孵す', () => pets().list.length > 0],
    ['daily10', '働き者', '今日の依頼を10回すべて達成する', () => (prog.dailyAll || 0) >= 10],
    ['fish5', '釣り好き', '魚を5種類釣る', () => FISH.filter((f) => f.id !== 'boot' && fishState().got[f.id]).length >= 5],
    ['fishAll', '池の主', '釣りの図鑑をすべて埋める', () => FISH.every((f) => fishState().got[f.id])],
    ['lord', '深淵の釣り人', '深淵のヌシを釣り上げる', () => !!fishState().got.lord],
    ['forge', '名工', '鍛冶の打ち込みで3回ともPERFECTを出す', () => (recs().forgeP || 0) >= 1],
    ['heroes', '十人十色', 'ヒロイン10人全員を仲間にする', () => HERO_IDS.every((id) => heroJoined(id))],
    ['bond', '絆', 'ヒロインの好感度をLv10にする', () => HERO_IDS.some((id) => affLv(id) >= AFF_MAX)],
    ['yukata', '夏祭り', '浴衣を3着そろえる', () => HERO_IDS.filter((id) => (heroS(id).cos || []).includes('yukata')).length >= 3],
    ['memo', 'その名は', '記憶のかけらを6つ集める', () => memoList().length >= MEMO_N],
    ['date', '夏祭りの約束', 'ヒロインと夏祭りを過ごす', () => HERO_IDS.some((id) => storySeen().includes('date_' + id))]
  ];
  const ACH_IDS = ACH.map((a) => a[0]);
  let dailyTickT = 0;
  function recSnap() { const r = recs(), o = {}; for (const k of DAILY_KEYS) o[k] = r[k] || 0; return o; }
  function dailyState() {
    const day = dayKey();
    if (!prog.daily || prog.daily.day !== day) {
      const R = seeded(day % 100000 + 7), pool = DAILY_POOL.filter((m) => !m.deep || prog.deep >= m.deep), ids = [];
      while (ids.length < 3 && pool.length) ids.push(pool.splice(Math.floor(R() * pool.length), 1)[0].id);
      prog.daily = { day, base: recSnap(), ids, done: ids.map(() => false), all: false };
    }
    return prog.daily;
  }
  function dailyProg(m) { const S = dailyState(); return Math.max(0, (recs()[m.k] || 0) - (S.base[m.k] || 0)); }
  function dailyCheck() {
    const S = dailyState();
    S.ids.forEach((id, i) => {
      if (S.done[i]) return;
      const m = DAILY_POOL.find((x) => x.id === id);
      if (!m || dailyProg(m) < m.n) return;
      S.done[i] = true;
      const g = 40 * prog.level;
      prog.gold += g; gainExp(Math.round(expNeed(prog.level) * 0.2));
      toast('今日の依頼を達成：' + m.t + '（' + g + 'G・経験値）'); sfx('quest');
    });
    if (!S.all && S.done.length && S.done.every(Boolean)) {
      S.all = true; prog.dailyAll = (prog.dailyAll || 0) + 1;
      const it = genItem(prog.level + 2, Math.max(2, rollRarity(true)));
      if (prog.inv.length < INV_MAX) prog.inv.push(it); else loot.push({ x: player.x + 0.5, y: player.y, it, t: 0 });
      gainPotion(3); gainGem(null, true);
      toast('今日の依頼をすべて達成！ ' + RAR[it.rar].name + '装備・回復薬×3・サポート宝石'); sfx('legend');
      addVfx({ k: 'pillar', x: player.x, y: player.y, c: '255,214,90', life: 1 });
    }
  }
  function achCheck() {
    if (!Array.isArray(prog.ach)) prog.ach = [];
    for (const a of ACH) {
      if (prog.ach.includes(a[0])) continue;
      let ok = false;
      try { ok = !!a[3](); } catch (e) { ok = false; }
      if (!ok) continue;
      prog.ach.push(a[0]);
      const g = 300 + prog.level * 20;
      prog.gold += g;
      toast('実績解除！「' + a[1] + '」 ' + a[2] + '（' + g + 'G、称号を選べる）'); sfx('legend'); buzz(30);
    }
  }
  function dailyTick(dt) {
    dailyTickT -= dt;
    if (dailyTickT > 0) return;
    dailyTickT = 1;
    dailyCheck();
    achCheck();
  }
  function titleName() { const a = ACH.find((x) => x[0] === prog.title); return a && Array.isArray(prog.ach) && prog.ach.includes(a[0]) ? a[1] : ''; }
  function dailyCards(box) {
    const S = dailyState();
    const c = document.createElement('div'); c.className = 'qc';
    c.append(elP('qh', '今日の依頼（毎日0時に入れ替わり）'));
    S.ids.forEach((id, i) => {
      const m = DAILY_POOL.find((x) => x.id === id);
      if (!m) return;
      c.append(elP('qg', (S.done[i] ? '✓ ' : '・') + m.t + '（' + Math.min(m.n, dailyProg(m)) + '/' + m.n + '）'));
    });
    c.append(elP('qr', '1つごとにゴールドと経験値。3つすべてでレア以上の装備と回復薬×3'));
    box.append(c);
  }
  function achCards(box) {
    if (!Array.isArray(prog.ach)) prog.ach = [];
    const c = document.createElement('div'); c.className = 'qc';
    c.append(elP('qh', '実績と称号（' + prog.ach.length + '/' + ACH.length + '）　いまの称号：' + (titleName() || 'なし')));
    const list = document.createElement('div'); list.className = 'achs';
    for (const a of ACH) {
      const got = prog.ach.includes(a[0]);
      const b = document.createElement('button'); b.type = 'button'; b.className = 'ach' + (got ? ' got' : '') + (prog.title === a[0] ? ' on' : '');
      b.disabled = !got;
      b.innerHTML = '<b></b><small></small>';
      b.children[0].textContent = got ? a[1] : '？？？';
      b.children[1].textContent = a[2];
      b.addEventListener('click', () => { prog.title = prog.title === a[0] ? '' : a[0]; save(); renderQuestLog(); });
      list.append(b);
    }
    c.append(list);
    box.append(c);
  }
