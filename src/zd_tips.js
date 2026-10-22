  /* ================= first-time tips: explain each system once, when it first matters ================= */
  // [id, condition, text]. Shown one at a time, never pausing the game; seen ids are saved in prog.tips.
  const TIPS = [
    ['auto', () => prog.level >= 3, '右の「AUTO」（Aキー）を押すと、主人公が自動で戦う。触るとしばらく手動に戻る'],
    ['daily', () => prog.level >= 4, 'メニューの「依頼」タブに「今日の依頼」が3つある。毎日入れ替わり、全部でレア装備がもらえる'],
    ['dodge', () => curMap === 3, '8番のボタン「回避」で素早く跳ぶ。敵の攻撃をぎりぎりでかわすと「見切り」で時間が遅くなり、しばらく全部会心'],
    ['elem', () => prog.level >= 5 && slv('fireball') + slv('frost') > 0, '術のスキルは敵に炎・氷・雷を残す。違う元素を重ねると元素反応。凍った敵を剣で殴ると「粉砕」で大ダメージ'],
    ['boss', () => curMap === 3 && curFloor % 5 === 0 && !!bossRef, 'ボスのHPの下にあるのがブレイクゲージ。満タンで4秒気絶して被ダメージ+50%。盾打ちは4倍たまる'],
    ['soul', () => soul().pts > 0, '「魂の欠片」は、キャンプの「魂の祭壇」で永続の特典に変えられる'],
    ['gem', () => GEM_IDS.some((g) => (gemBag()[g] || 0) > 0), 'サポート宝石を手に入れた。スキル画面でスキルにはめると性質が変わる（Lv5・Lv10で枠が増える）'],
    ['legend', () => (recs().legends || 0) > 0, 'レジェンド装備には固有効果（★の行）がある。装備画面の詳細で確かめよう'],
    ['party', () => pets().list.length > 0, '仲間は「仲間」タブで同行させる。訓練所でまとめて強化でき、閉じている間も狩りを続けてくれる'],
    ['streak', () => (recs().streak || 0) >= 10, '1.2秒以内に倒し続けると「殺戮」「蹂躙」…と連鎖し、切れたときに経験値ボーナス'],
    ['key', () => prog.level >= 32, 'スキルツリーの一番下に「極意」が開いた。強力だが代償がある。1つ1ポイント'],
    ['rebirth', () => prog.level >= 40, 'Lv40に達した。魂の祭壇で「転生」すると、装備はそのままに経験値ボーナスと魂の欠片を得て最初から育て直せる']
  ];
  let tipT = 3, tipShowT = 0;
  function tipsSeen() { if (!Array.isArray(prog.tips)) prog.tips = []; return prog.tips; }
  function tipTick(dt) {
    if (tipShowT > 0) { tipShowT -= dt; if (tipShowT <= 0) $('tip').classList.remove('on'); return; }
    tipT -= dt;
    if (tipT > 0 || paused || player.dead || !$('intro').hidden) return;
    tipT = 1;
    const seen = tipsSeen();
    for (const [id, cond, text] of TIPS) {
      if (seen.includes(id)) continue;
      let ok = false;
      try { ok = !!cond(); } catch (e) { ok = false; }
      if (!ok) continue;
      seen.push(id); save();
      showTip(text);
      tipT = 12;
      return;
    }
  }
  function showTip(text) {
    const el = $('tip');
    $('tipText').textContent = text;
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    tipShowT = 9;
    sfx('ui');
  }
  function tipClose() { tipShowT = 0.01; }
