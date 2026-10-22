  /* ================= meta progression (Hades mirror): soul shards, altar perks, rebirth; kill streaks (Diablo massacre) ================= */
  // Shards come from bosses, cleared floors, dying in the abyss, beating the abyss lord, and rebirth.
  const PERKS = [
    { id: 'hp', name: '生命の灯', max: 10, cost: 4, d: (l) => '最大HP +' + 5 * l + '%' },
    { id: 'atk', name: '魂の刃', max: 10, cost: 5, d: (l) => '攻撃力 +' + 4 * l + '%' },
    { id: 'mp', name: '魔力の泉', max: 5, cost: 4, d: (l) => '最大MP +' + 6 * l + '%' },
    { id: 'crit', name: '研ぎ澄まし', max: 5, cost: 6, d: (l) => '会心率 +' + (1.5 * l).toFixed(1) + '%' },
    { id: 'exp', name: '学びの灯', max: 10, cost: 5, d: (l) => '経験値 +' + 6 * l + '%' },
    { id: 'gold', name: '金運', max: 5, cost: 4, d: (l) => 'ゴールド +' + 8 * l + '%' },
    { id: 'pot', name: '薬師の知恵', max: 5, cost: 5, d: (l) => '回復薬の回復量 +' + 4 * l + '%、持てる数 +' + 2 * l },
    { id: 'dodge', name: '疾風の心得', max: 5, cost: 6, d: (l) => '回避の待ち時間 -' + 6 * l + '%' },
    { id: 'bless', name: '祝福の先導', max: 1, cost: 30, d: () => '深淵に潜るたび、最初に祝福を1つ選べる' },
    { id: 'phoenix', name: '不死鳥の羽', max: 1, cost: 45, d: () => '潜行ごとに1度だけ、倒れてもHP40%で立ち上がる' }
  ];
  const EGG_SHARDS = 25;
  const PERK_IDS = PERKS.map((p) => p.id);
  const REBIRTH_LV = 40;
  const STREAK = [[10, '殺戮'], [20, '蹂躙'], [35, '虐殺'], [50, '壊滅'], [75, '鏖殺'], [100, '天災']];
  let streakN = 0, streakGap = 0, streakExp = 0, streakTier = -1, soulRevUsed = false;
  function soul() {
    if (!prog.soul || typeof prog.soul !== 'object') prog.soul = { pts: 0, total: 0, perks: {}, rb: 0 };
    return prog.soul;
  }
  function perkLv(id) { return soul().perks[id] || 0; }
  function perkCost(P) { return P.cost * (perkLv(P.id) + 1); }
  function gainSoul(n, why) {
    n = Math.max(0, Math.round(n));
    if (!n) return;
    const S = soul(); S.pts += n; S.total += n;
    addText(player.x, player.y, '魂の欠片 +' + n, 'gold', 96);
    if (why) log(why + '：魂の欠片 +' + n);
  }
  // stat hooks used by derived() and friends
  function soulMods(d) {
    d.maxHp = Math.round(d.maxHp * (1 + 0.05 * perkLv('hp')) * (keyOn('k_soul') ? 0.9 : 1));
    d.maxMp = Math.round(d.maxMp * (1 + 0.06 * perkLv('mp')));
    d.atk *= 1 + 0.04 * perkLv('atk');
    d.crit = Math.min(0.85, d.crit + 0.015 * perkLv('crit'));
    return d;
  }
  function soulExpMul() { return (1 + 0.06 * perkLv('exp')) * (1 + 0.1 * soul().rb); }
  function soulGoldMul() { return 1 + 0.08 * perkLv('gold'); }
  function potMax() { return POT_MAX + 2 * perkLv('pot'); }
  function potHealMul() { return (1 + 0.04 * perkLv('pot')) * (keyOn('k_blood') ? 0.5 : 1); }
  function dodgeCdMul() { return 1 - 0.06 * perkLv('dodge'); }
  function soulDiveStart() { soulRevUsed = false; if (perkLv('bless') && !WB.on) blessSoon('祝福の先導'); }
  function soulRevive() {
    if (!perkLv('phoenix') || soulRevUsed || curMap !== 3 || WB.on) return false;
    soulRevUsed = true;
    player.hp = Math.round(D.maxHp * 0.4);
    addText(player.x, player.y, '不死鳥の羽！', 'multi', 90);
    addVfx({ k: 'pillar', x: player.x, y: player.y, c: '255,140,60', life: 1.2 }); addVfx({ k: 'sflash', c: '255,170,90', a: 0.35, life: 0.5 });
    addSlowMo(0.6); sfx('aura');
    return true;
  }
  // shard sources
  function soulOnBoss(e) { gainSoul((e.final ? 60 : 3 + Math.floor(curFloor / 5)) * (1 + 0.5 * rankNow()), e.final ? '深淵の主を討伐' : 'ボス撃破'); }
  function soulOnFloor() { if (curFloor >= 6) gainSoul(1 + rankNow() * 0.5); }
  function soulOnDeath() { if (curMap === 3 && !WB.on) gainSoul(curFloor / 3 * (1 + 0.5 * rankNow()), '深淵で倒れた'); }
  function rebirthGain() { return Math.round(prog.level * 1.2 + 20 + 10 * soul().rb); }
  function rebirth() {
    if (prog.level < REBIRTH_LV || curMap === 3) return false;
    const S = soul(), g = rebirthGain();
    S.rb += 1; S.pts += g; S.total += g;
    prog.level = 1; prog.exp = 0;
    for (const k of STAT_KEYS) prog.stats[k] = 5;
    prog.sp = 3 * S.rb; prog.kp = 2 * S.rb;
    prog.skill = { whirl: 1, chain: 1, sprint: 1 };
    prog.cls = { blade: null, arcane: null };
    refreshGear(); refreshD();
    player.hp = D.maxHp; player.mp = D.maxMp;
    toast('転生した！（' + S.rb + '回目）魂の欠片 +' + g + '、経験値 +' + 10 * S.rb + '%、はじめからポイント');
    addVfx({ k: 'pillar', x: player.x, y: player.y, c: '200,170,255', life: 1.6 }); addVfx({ k: 'sflash', c: '220,200,255', a: 0.5, life: 0.8 });
    sfx('legend'); zoomPunch(0.08); buzz([60, 40, 120]);
    save();
    return true;
  }

  /* ---------- kill streaks: kills less than 1.2s apart chain into a massacre bonus ---------- */
  function streakOnKill(e) {
    if (streakGap > 1.2) streakEnd();
    streakN++; streakGap = 0; streakExp += (e.exp || 0) * (e.lvl ? expGapMul(e) : 1);
    let tier = -1;
    for (let i = 0; i < STREAK.length; i++) if (streakN >= STREAK[i][0]) tier = i;
    if (tier > streakTier) {
      streakTier = tier;
      const el = $('streak');
      el.textContent = STREAK[tier][1] + '！';
      el.className = 'streak t' + tier; void el.offsetWidth; el.classList.add('on');
      sfx(tier >= 3 ? 'legend' : 'rare'); zoomPunch(0.02 + tier * 0.006);
    }
  }
  function streakEnd() {
    if (streakN >= STREAK[0][0]) {
      const bonus = Math.round(streakExp * Math.min(0.6, 0.02 * streakN));
      gainExp(bonus);
      toast(STREAK[Math.max(0, streakTier)][1] + '！ ' + streakN + '体連続　経験値 +' + bonus);
      recs().streak = Math.max(recs().streak || 0, streakN);
    }
    streakN = 0; streakExp = 0; streakTier = -1;
  }
  function streakUpdate(dt) { if (streakN) { streakGap += dt; if (streakGap > 1.2) streakEnd(); } }

  /* ---------- the altar (camp) ---------- */
  function altarOpen() {
    if (paused || player.dead || curMap === 3 || !inCamp(player.x, player.y)) return;
    paused = true; drag.active = false;
    $('altarDlg').hidden = false;
    altarRender();
  }
  function altarClose() { $('altarDlg').hidden = true; paused = false; save(); }
  let rbArmed = false;
  function altarRender() {
    const S = soul(), box = $('altarBox');
    box.textContent = '';
    box.append(elP('lead', '魂の欠片は、ボス撃破・深淵の階の制覇（B6F〜）・深淵で倒れたとき・深淵の主の討伐・転生で手に入る。ここで永続の特典に変えられる。'));
    box.append(elP('qg', '魂の欠片 ' + S.pts + '　（これまでに ' + S.total + '）　転生 ' + S.rb + '回'));
    for (const P of PERKS) {
      const l = perkLv(P.id), c = document.createElement('div'); c.className = 'qc row2';
      const t = document.createElement('div');
      t.append(elP('qg', P.name + '　' + l + '/' + P.max), elP('qr', l ? P.d(l) + (l < P.max ? '　→ 次：' + P.d(l + 1) : '') : P.d(1)));
      const b = elBtn(l >= P.max ? '最大' : perkCost(P) + ' 欠片', 'primary small', () => {
        if (l >= P.max || S.pts < perkCost(P)) { toast('魂の欠片が足りない'); return; }
        S.pts -= perkCost(P); S.perks[P.id] = l + 1; refreshD(); sfx('quest'); save(); altarRender();
      });
      b.disabled = l >= P.max || S.pts < perkCost(P);
      c.append(t, b); box.append(c);
    }
    { const ec = document.createElement('div'); ec.className = 'qc row2'; const t = document.createElement('div');
      t.append(elP('qg', 'ふしぎなタマゴ'), elP('qr', '魂の欠片からタマゴをひとつ生み出す（仲間が生まれる）'));
      const b = elBtn(EGG_SHARDS + ' 欠片', 'primary small', () => { if (S.pts < EGG_SHARDS) { toast('魂の欠片が足りない'); return; } if (pets().eggs.length >= 5) { toast('タマゴはもう持てない（5個まで）'); return; } S.pts -= EGG_SHARDS; gainEgg(); altarRender(); });
      b.disabled = S.pts < EGG_SHARDS || pets().eggs.length >= 5; ec.append(t, b); box.append(ec); }
    const rc = document.createElement('div'); rc.className = 'qc';
    rc.append(elP('qh', '転生'), elP('qr', 'Lv' + REBIRTH_LV + '以上で、レベル・能力値・スキルをはじめに戻す。装備・お金・深淵の記録・魂の特典はそのまま。魂の欠片 +' + rebirthGain() + '、転生ごとに経験値 +10%、はじめから能力ポイント+3・スキルポイント+2（転生回数ぶん）。'));
    const rb = elBtn(prog.level < REBIRTH_LV ? 'Lv' + REBIRTH_LV + 'で転生できる（いまLv' + prog.level + '）' : rbArmed ? 'もう一度押すと転生する' : '転生する', 'ghost', () => {
      if (!rbArmed) { rbArmed = true; altarRender(); setTimeout(() => { rbArmed = false; if (!$('altarDlg').hidden) altarRender(); }, 3000); return; }
      rbArmed = false;
      if (rebirth()) altarRender();
    });
    rb.disabled = prog.level < REBIRTH_LV;
    rc.append(rb); box.append(rc);
  }
