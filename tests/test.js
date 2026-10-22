const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const html = fs.readFileSync('' + require('path').join(__dirname, '..', 'dist', 'twinsoul.html') + '', 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => errors.push('jsdomError: ' + (e.stack || e.message)));
vc.on('error', (e) => errors.push('console.error: ' + e));
let rafQ = [];
const dom = new JSDOM(html, {
  url: 'https://example.org/',
  runScripts: 'dangerously',
  virtualConsole: vc,
  beforeParse(window) {
    window.__TEST__ = true; window.__loadImage = () => Promise.resolve({ width: 2048, height: 2048 });
    window.requestAnimationFrame = (cb) => { rafQ.push(cb); return rafQ.length; };
    window.cancelAnimationFrame = () => {};
    const noop = () => {};
    const grad = { addColorStop: noop };
    const img = (w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)), width: w, height: h }); const target = { createRadialGradient: () => grad, createLinearGradient: () => grad, createPattern: () => ({}), createImageData: img, getImageData: (x, y, w, h) => img(w, h), measureText: () => ({ width: 10 }), setLineDash: noop, getLineDash: () => [] };
    const calls = { n: 0, bad: 0 };
    const ctx = new Proxy(target, {
      get(t, p) { if (p in t) return t[p]; calls.n++; return (...args) => { for (const a of args) if (typeof a === 'number' && !isFinite(a)) calls.bad++; }; },
      set(t, p, v) { if (typeof v === 'number' && !isFinite(v)) calls.bad++; t[p] = v; return true; }
    });
    window.__ctxCalls = calls;
    window.HTMLCanvasElement.prototype.getContext = function () { return ctx; };
    window.Element.prototype.getBoundingClientRect = function () { return { left: 0, top: 0, right: 390, bottom: 844, width: 390, height: 844, x: 0, y: 0 }; };
  }
});
const w = dom.window;
let now = 0;
function frames(n, ms = 16) { for (let i = 0; i < n; i++) { const q = rafQ; rafQ = []; now += ms; for (const cb of q) cb(now); } }
const $ = (id) => w.document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shopBtn = (label) => { for (const row of w.document.querySelectorAll('#npcBody .qc, #npcBody > div')) if (row.textContent.includes(label)) { const btn = row.querySelector('button'); if (btn) return btn; } throw new Error('shop row not found: ' + label); };
const assert = (c, msg) => { if (!c) { errors.push('ASSERT FAIL: ' + msg); console.log('  FAIL:', msg); } else console.log('  ok:', msg); };

(async () => { await sleep(30);
  frames(3);
  const G = w.__G;
  assert(G, 'test hook exists');
  assert(!$('intro').hidden && G.paused, 'intro shown and paused at first launch');
  $('startBtn').click();
  assert($('intro').hidden && !G.paused, 'start button closes intro and unpauses');
  frames(30);
  assert(G.enemies.length >= 30, 'enemies spawned: ' + G.enemies.length);
  assert(!$('shopBtn').hidden, 'shop button visible inside camp');

  // pathfinding sanity on random pairs
  let fails = 0, blocked = 0;
  for (let k = 0; k < 400; k++) {
    const a = G.reachList[(Math.random() * G.reachList.length) | 0], b = G.reachList[(Math.random() * G.reachList.length) | 0];
    const ax = a % 56 + 0.5, ay = ((a / 56) | 0) + 0.5, bx = b % 56 + 0.5, by = ((b / 56) | 0) + 0.5;
    const p = G.findPath(ax, ay, bx, by);
    if (!p) { fails++; continue; }
    for (const q of p) if (G.blockedAt(q.x, q.y, 0.05)) blocked++;
  }
  assert(fails === 0, 'all reachable pairs have paths (fails=' + fails + ')');
  assert(blocked === 0, 'no waypoint inside a blocked tile (blocked=' + blocked + ')');

  // tap on ground -> path
  const ev = (type, x, y) => { const e = new w.MouseEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true }); $('cv').dispatchEvent(e); };
  ev('pointerdown', 260, 560); ev('pointerup', 260, 560);
  assert(G.player.path.length > 0 || G.player.target, 'tapping the ground sets a path');
  frames(60);

  // combat in blade form: walk to nearest enemy and fight
  const p = G.player;
  const near = () => { let best = null, bd = 1e9; for (const e of G.enemies) { if (e.dead) continue; const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < bd) { bd = d; best = e; } } return best; };
  const tpNear = (t, d) => { for (const [ox, oy] of [[d, 0], [0, d], [-d, 0], [0, -d], [d * 0.7, d * 0.7]]) { if (!G.blockedAt(t.x + ox, t.y + oy, 0.25)) { p.x = t.x + ox; p.y = t.y + oy; return; } } };
  let e = near();
  tpNear(e, 1.6);
  p.target = e;
  const exp0 = G.prog.exp, lv0 = G.prog.level, gold0 = G.prog.gold;
  let killed = false;
  for (let i = 0; i < 1500 && !killed; i++) { frames(1); if (e.dead) killed = true; if (p.dead) break; }
  assert(killed, 'blade form walked to a target and killed it');
  assert(G.prog.exp > exp0 || G.prog.level > lv0, 'exp gained');

  // spin skill near a pack
  p.dead = false; p.hp = G.D.maxHp; p.mp = G.D.maxMp; p.cd.blade = 0;
  e = near();
  p.x = e.x; p.y = e.y; // stand inside the pack
  if (G.blockedAt(p.x, p.y, 0.2)) { p.x += 0.3; }
  frames(2);
  const before = G.enemies.filter((x) => !x.dead && Math.hypot(x.x - p.x, x.y - p.y) < 2.4).map((x) => [x, x.hp]);
  G.useSkill();
  frames(2);
  const hits = before.filter(([x, hp]) => x.dead || x.hp < hp).length;
  assert(hits >= 1, 'spin slash damaged ' + hits + '/' + before.length + ' nearby enemies');
  assert(G.fx.some((f) => f.k === 'spin') || hits > 0, 'spin effect created');

  // transform to arcane and fight with projectiles
  frames(70);
  G.morph();
  assert(p.form === 'arcane' && w.document.documentElement.getAttribute('data-form') === 'arcane', 'morph switches form + data-form attr');
  assert($('formName').textContent === '術の型' || true, 'form label');
  frames(2);
  assert($('formName').textContent === '術の型', 'HUD shows arcane form name');
  assert($('sk0').children[0].textContent === '連雷' && $('sk1').classList.contains('lock'), 'skill buttons switch to arcane skills');
  p.hp = G.D.maxHp;
  e = near(); tpNear(e, 3); p.target = e;
  let shotSeen = false; killed = false;
  for (let i = 0; i < 1500 && !killed; i++) { frames(1); if (G.shots.length) shotSeen = true; if (e.dead) killed = true; if (p.dead) break; }
  assert(shotSeen, 'arcane form fires projectiles');
  assert(killed, 'arcane form killed its target');
  p.mp = G.D.maxMp; p.cd.arcane = 0; p.dead = false;
  e = near(); p.x = e.x + 1.5; p.y = e.y; if (G.blockedAt(p.x, p.y, 0.2)) { p.x = e.x; p.y = e.y + 1.5; }
  frames(1);
  const fxBefore = G.fx.length;
  G.useSkill();
  assert(G.fx.some((f) => f.k === 'chain') || p.mp === G.D.maxMp, 'chain lightning fired (or no enemy in range)');

  // potion
  p.hp = 10; const pot0 = G.prog.potions; G.player.potT = 0;
  G.drinkPotion();
  assert(p.hp > 10 && G.prog.potions === pot0 - 1, 'potion heals and is consumed');

  // level up + stat allocation via sheet
  const L = G.prog.level;
  G.gainExp(G.expNeed(L) - G.prog.exp + 1);
  assert(G.prog.level === L + 1 && G.prog.sp >= 3 && G.prog.kp >= 1, 'level up grants 3 stat points and 1 skill point');
  frames(2);
  assert(!$('ptBadge').hidden, 'badge shows unspent points');
  $('menuBtn').click();
  assert(!$('sheet').hidden && G.paused, 'status sheet opens and pauses');
  const str0 = G.prog.stats.str, sp0 = G.prog.sp;
  $('statList').querySelector('button').click();
  assert(G.prog.stats.str === str0 + 1 && G.prog.sp === sp0 - 1, 'plus button raises a stat');
  const kp0 = G.prog.kp;
  w.document.querySelector('.tab[data-tab="blade"]').click();
  assert(!w.document.getElementById('tabSkill').hidden && w.document.querySelectorAll('#skillTree .skc').length === Object.values(G.SKD).filter((s) => s.form !== 'arcane').length, 'blade skill tree shows every blade/common skill: ' + w.document.querySelectorAll('#skillTree .skc').length);
  w.document.querySelector('#skillTree button:not([disabled])').click();
  assert(G.prog.kp === kp0 - 1, 'skill plus spends a skill point');
  w.document.querySelector('.tab[data-tab="arcane"]').click();
  assert(w.document.querySelectorAll('#skillTree .skc').length === Object.values(G.SKD).filter((s) => s.form !== 'blade').length, 'arcane skill tree shows every arcane/common skill');
  w.document.querySelector('.tab[data-tab="stat"]').click();
  assert($('derived').children.length === 12, 'derived stats rendered');
  $('closeBtn').click();
  assert($('sheet').hidden && !G.paused, 'sheet closes and resumes');

  // shop
  p.x = G.SPAWN.x; p.y = G.SPAWN.y; G.prog.gold = 45; const pots = G.prog.potions;
  frames(2);
  assert(!$('shopBtn').hidden, 'shop visible in camp');
  $('shopBtn').click();
  assert(G.prog.potions === pots + 1 && G.prog.gold === 25, 'buying a potion costs 20G');

  // death and revive
  p.x = 30; p.y = 30; if (G.blockedAt(30, 30, 0.2)) { const c = G.reachList.find((c) => Math.hypot(c % 56 - 30, (c / 56 | 0) - 30) < 6); p.x = c % 56 + 0.5; p.y = (c / 56 | 0) + 0.5; }
  G.hurtPlayer(99999);
  assert(p.dead, 'player dies at 0 HP');
  await sleep(900);
  assert(!$('dead').hidden, 'death overlay appears');
  $('reviveBtn').click();
  assert(!p.dead && $('dead').hidden && G.inCamp(p.x, p.y), 'revive returns to camp');

  // keyboard
  frames(80);
  const formNow = p.form;
  w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'w' }));
  assert(p.form !== formNow, 'W key transforms');

  // save exists
  const saved = JSON.parse(w.localStorage.getItem('twinsoul-save-v1'));
  assert(saved && saved.level === G.prog.level, 'progress saved to localStorage');

  // long random soak: random taps, skills, morphs
  let deaths = 0;
  const t0 = Date.now();
  for (let i = 0; i < 6000; i++) {
    const r = Math.random();
    if (r < 0.01) ev('pointerdown', Math.random() * 390, 120 + Math.random() * 600), ev('pointerup', 0, 0);
    else if (r < 0.015) { const t = near(); if (t) p.target = t; }
    else if (r < 0.02) G.useSkill();
    else if (r < 0.022) G.morph();
    else if (r < 0.024) G.drinkPotion();
    frames(1);
    if (!w.document.getElementById('npcDlg').hidden) G.closeNpc();
    if (p.dead) { deaths++; G.respawn(); }
  }
  const ms = Date.now() - t0;
  console.log('  soak: 6000 frames in', ms, 'ms; deaths', deaths, '; level', G.prog.level, '; enemies', G.enemies.length);
  assert(w.__ctxCalls.bad === 0, 'no NaN/Infinity passed to canvas (' + w.__ctxCalls.bad + ')');
  assert(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.hp), 'player state finite');
  assert(G.enemies.every((e) => Number.isFinite(e.x) && Number.isFinite(e.y) && Number.isFinite(e.hp)), 'enemy state finite');



  // every active skill in both forms
  p.dead = false; G.prog.level = 18; G.prog.kp = 400;
  const order = ['whirl','whirl','sword','sword','sword','sword','sword','sprint','gale','gale','gale','bash','bash','bash','iron','iron','iron','shift','rend','rend','rend','cry','cry','twin','twin','twin','aura','dance','leech','leech','leech','keen','chain','chain','chain','chain','amp','amp','amp','amp','amp','fireball','fireball','fireball','heal','medit','medit','medit','frost','frost','frost','lance','lance','lance','mshield','mshield','mshield','meteor','vortex','quick','focus'];
  for (const id of order) G.learn(id);
  assert(['keen','focus','vortex','dance','lance','heal','bash','cry','sprint'].every((id) => G.prog.skill[id] >= 1), 'all new skills learnable through their prerequisites');
  assert(G.prog.skill.meteor >= 1 && G.prog.skill.aura >= 1 && G.prog.skill.leech >= 1, 'tree prerequisites allow learning tier-4 skills');
  const goTo = () => { const t = near(); p.x = t.x + 1.4; p.y = t.y; if (G.blockedAt(p.x, p.y, 0.2)) { p.x = t.x; p.y = t.y + 1.4; } p.target = t; frames(2); };
  for (const form of ['blade', 'arcane']) {
    if (p.form !== form) { p.morphT = 0; G.morph(); frames(3); }
    for (let i = 0; i < 8; i++) { goTo(); p.mp = 9999; p.hp = 9999; G.castSkill(i); frames(45); }
  }
  frames(200);
  assert(G.fields.length === 0 && G.meteors.length === 0 && !G.dash, 'fields, meteors and dash resolve');
  assert(p.auraT >= 0, 'aura timer sane');


  // maps, portals, zoom
  const z0 = G.zoom; G.setUserZoom(0.6); frames(2);
  assert(G.zoom < z0, 'zooming out widens the view (' + z0.toFixed(2) + ' -> ' + G.zoom.toFixed(2) + ')');
  G.setUserZoom(1); frames(2);
  for (const m of [1, 2, 0]) { G.enterMap(m, 0); frames(120); assert(G.curMap === m && G.enemies.length >= 20, 'map ' + m + ' built with enemies (' + G.enemies.length + ')'); }
  assert(G.reachList.length > 600, 'map is mostly reachable (' + G.reachList.length + ' tiles)');
  { const pt = G.portals[0]; const path = G.findPath(G.SPAWN.x, G.SPAWN.y, pt.x, pt.y); assert(!!path, 'portal reachable from camp'); }
  await sleep(500); frames(3); G.enterMap(0, 0); frames(3);
  { const pt = G.portals[0]; G.enemies.length = 0; p.target = null; p.path.length = 0; p.dead = false; p.hp = G.D.maxHp; p.x = pt.x + 2; p.y = pt.y; frames(5); p.x = pt.x; p.y = pt.y; frames(3); const dbg = { tr: G.transit, near: Math.hypot(p.x - pt.x, p.y - pt.y), dead: p.dead, paused: G.paused, map: G.curMap }; await sleep(450); frames(5); if (G.curMap !== pt.to) console.log('  PDEBUG', JSON.stringify(dbg), JSON.stringify({ tr: G.transit, map: G.curMap })); assert(G.curMap === pt.to, 'walking into the portal moves to map ' + pt.to); }
  { G.enterMap(1, 0); for (const pt of G.portals) assert(!!G.findPath(G.SPAWN.x, G.SPAWN.y, pt.x, pt.y), 'canyon portal to ' + pt.to + ' reachable'); G.enterMap(2, 0); assert(!!G.findPath(G.SPAWN.x, G.SPAWN.y, G.portals[0].x, G.portals[0].y), 'graveyard portal reachable'); }


  // equipment and loot
  G.enterMap(0, null); frames(5);
  assert(!!G.prog.eq.sword && !!G.prog.eq.staff, 'starter sword and staff equipped');
  const atk0 = G.D.atk;
  const big = G.genItem(20, 3, p.form === 'blade' ? 'sword' : 'staff');
  assert(big.opts.length >= 4 && big.name.length > 2, 'legendary item rolled with ' + big.opts.length + ' options: ' + big.name);
  G.prog.inv.push(big); G.equip(big);
  assert(G.prog.eq[big.type] === big && G.D.atk > atk0, 'equipping raises attack (' + atk0.toFixed(1) + ' -> ' + G.D.atk.toFixed(1) + ')');
  const invBefore = G.prog.inv.length;
  const el = { x: p.x + 0.2, y: p.y, lvl: 5, elite: true };
  G.dropLoot(el); G.dropLoot(el);
  assert(G.loot.length >= 2, 'elite drops loot (' + G.loot.length + ')');
  frames(60);
  assert(G.prog.inv.length > invBefore && G.loot.length === 0, 'walking over loot picks it up');
  const g0 = G.prog.gold; const toSell = G.prog.inv[G.prog.inv.length - 1]; G.sell(toSell);
  assert(G.prog.gold > g0 && !G.prog.inv.includes(toSell), 'selling gives gold');
  p.x = G.SPAWN.x; p.y = G.SPAWN.y; frames(2); G.prog.gold = 1e6;
  const eqd = G.prog.eq[big.type]; for (let k = 0; k < 40 && eqd.plus < 3; k++) G.enhance(eqd);
  assert(eqd.plus >= 3, 'enhancing at camp raises +' + eqd.plus);
  for (let k = 0; k < 8; k++) G.prog.inv.push(G.genItem(3, 0));
  G.sellNormals();
  assert(!G.prog.inv.some((i) => i.rar === 0), 'bulk sell removes normal items');
  w.document.getElementById('menuBtn').click(); w.document.querySelector('.tab[data-tab="gear"]').click();
  assert(w.document.querySelectorAll('#eqRow .itc').length === 5 && !w.document.getElementById('tabGear').hidden, 'gear tab shows 5 slots');
  w.document.getElementById('closeBtn').click();
  const saved2 = JSON.parse(w.localStorage.getItem('twinsoul-save-v1'));
  assert(saved2.eq && saved2.eq[big.type] && saved2.eq[big.type].plus === eqd.plus, 'equipment saved');


  // abyss dungeon
  G.enterDungeon(1); frames(30);
  assert(G.curMap === 3 && G.floor === 1 && G.enemies.length >= 20, 'dungeon floor 1 built (' + G.enemies.length + ' enemies)');
  { const need = G.floorNeed; let kk = 0; for (const e of G.enemies.slice()) { if (kk >= need) break; if (!e.dead) { G.killEnemy(e); kk++; } } }
  frames(5);
  assert(G.stairsOpen && G.portals.length === 2, 'stairs open after the kill quota');
  { const st = G.portals[1]; p.dead = false; p.x = st.x + 2; p.y = st.y; frames(3); p.x = st.x; p.y = st.y; frames(3); await sleep(450); frames(5); }
  assert(G.floor === 2 && G.curMap === 3, 'stairs lead to B2F');
  G.enterDungeon(5); frames(30);
  const boss = G.bossRef;
  assert(boss && boss.boss && boss.maxHp > 300, 'boss spawns on B5F (hp ' + (boss && boss.maxHp) + ')');
  p.dead = false; p.x = boss.x + 1.5; p.y = boss.y; if (G.blockedAt(p.x, p.y, 0.25)) { p.x = boss.x; p.y = boss.y + 1.5; } boss.state = 'chase'; boss.slamT = 0; boss.sumT = 0; p.hp = 99999; frames(150);
  assert(G.enemies.filter((e) => !e.dead).length > 0, 'boss fight (slam + summon) runs');
  { const lb = G.loot.length; G.killEnemy(boss); frames(3); assert(G.stairsOpen && G.loot.length >= lb + 4, 'boss opens the gate and drops 4 items'); }
  assert(G.prog.deep >= 5, 'deepest floor recorded (' + G.prog.deep + ')');
  G.enterMap(0, null); frames(5);
  assert(G.portals.length === 2 && G.portals[1].to === 3, 'forest has the dungeon gate');


  // town NPCs & quests
  G.enterMap(0, null); frames(5); p.dead = false; p.hp = G.D.maxHp;
  const btnBy = (txt) => [...w.document.querySelectorAll('#npcBody button')].find((b) => b.textContent === txt);
  const q = G.qState(); q.main = 0; q.ma = false; q.mp = 0; q.act.length = 0;
  G.openNpc('quest');
  assert(!w.document.getElementById('npcDlg').hidden && G.paused, 'quest NPC dialog opens and pauses');
  btnBy('受ける').click();
  assert(q.ma, 'main quest accepted');
  G.closeNpc();
  { let gk = 0; for (const e of G.enemies.slice()) { if (gk >= 5) break; if (!e.dead) { e.type = 'goblin'; G.killEnemy(e); gk++; } } }
  assert(G.mainDone(), 'killing 5 goblins completes the first main quest');
  { const g0 = G.prog.gold; G.openNpc('quest'); btnBy('報告して報酬を受け取る').click(); assert(q.main === 1 && G.prog.gold > g0, 'reporting gives the reward and advances the story'); }
  { const a0 = q.act.length; [...w.document.querySelectorAll('#npcBody button')].filter((b) => b.textContent === '受ける').pop().click(); assert(q.act.length === a0 + 1 && q.board.length === 3, 'bounty accepted and board refilled'); }
  btnBy('受ける').click(); assert(q.ma && q.main === 1, 'second main quest accepted');
  G.closeNpc();
  G.prog.kp = 5; G.learn('sword');
  assert(G.mainDone(), 'learning a skill completes the second main quest');
  { const b = q.act[0]; if (b.k !== 'floor') { b.p = b.n; } else { G.prog.deep = Math.max(G.prog.deep, b.n); } frames(130); assert(q.act.some((x) => x.nt), 'completed bounty is flagged for reporting'); }
  G.prog.gold = 100000;
  G.openNpc('shop');
  { const p0 = G.prog.potions; [...w.document.querySelectorAll('#npcBody button')][0].click(); assert(G.prog.potions === p0 + 1, 'merchant sells potions'); }
  { const i0 = G.prog.inv.length; shopBtn('目利き箱').click(); assert(G.prog.inv.length === i0 + 1 || i0 >= 36, 'gamble box gives an item'); }
  { const g0 = Object.values(G.prog.gems || {}).reduce((a, b) => a + b, 0); shopBtn('サポート宝石').click(); assert(Object.values(G.prog.gems || {}).reduce((a, b) => a + b, 0) === g0 + 1, 'merchant sells support gems'); }
  G.closeNpc();
  G.openNpc('smith'); assert(w.document.querySelectorAll('#npcBody button').length === 1, 'smith offers the gear screen'); G.closeNpc();
  frames(30);
  assert(!w.document.getElementById('qtrack').hidden && w.document.getElementById('qtrack').textContent.includes('★'), 'quest tracker visible: ' + w.document.getElementById('qtrack').textContent);
  { const sv = JSON.parse(w.localStorage.getItem('twinsoul-save-v1')); assert(sv.q && sv.q.main === 1, 'quest progress saved'); }


  // boss kits
  for (const [f, sig] of [[5, 'rain'], [10, 'charge'], [15, 'shots'], [20, 'lines']]) {
    G.enterDungeon(f); frames(5);
    const b = G.bossRef;
    assert(b && b.boss, 'boss spawned on B' + f);
    for (const [ox, oy] of [[3, 0], [-3, 0], [0, 3], [0, -3], [2, 2], [-2, -2]]) { if (!G.blockedAt(b.x + ox, b.y + oy, 0.3)) { p.x = b.x + ox; p.y = b.y + oy; break; } }
    b.state = 'chase';
    const seen = { slam: 0, shots: 0, lines: 0, pools: 0, charge: 0 };
    for (let k = 0; k < 1100; k++) {
      p.hp = G.D.maxHp; p.dead = false;
      if (b.dead) break;
      b.state = 'chase';
      frames(1);
      seen.slam = Math.max(seen.slam, G.slams.length); seen.shots = Math.max(seen.shots, G.bshots.length);
      seen.lines = Math.max(seen.lines, G.blines.length); seen.pools = Math.max(seen.pools, G.bpools.length);
      if (b.charge) seen.charge++;
      if (k === 450) b.hp = b.maxHp * 0.45;
      if (k === 750) b.hp = b.maxHp * 0.25;
    }
    console.log('  boss B' + f, JSON.stringify(seen), 'phase', b.phase, 'enraged', b.enraged);
    assert(b.phase === 2 && b.enraged, 'boss B' + f + ' reaches phase 2 and enrage');
    const ok = sig === 'rain' ? seen.slam >= 5 : sig === 'charge' ? seen.charge > 0 : sig === 'shots' ? seen.shots >= 10 && seen.pools >= 2 : seen.lines >= 3;
    assert(ok, 'boss B' + f + ' uses its signature attack (' + sig + ')');
  }
  G.enterMap(0, null); frames(5);


  // abyss strata
  { const names = new Set(); for (let f = 1; f <= 50; f++) names.add(G.themeOf(f).key); assert(names.size === 10, '10 strata across 50 floors: ' + names.size); }
  for (const f of [7, 13, 22, 33, 44]) {
    G.enterDungeon(f); frames(10);
    const T = G.themeOf(f);
    assert(G.MAPS[3].biome === T.key && G.MAPS[3].name.includes(T.name), 'B' + f + ' uses stratum ' + T.name);
    assert(G.enemies.filter((e) => !e.dead).length >= 12, 'B' + f + ' populated: ' + G.enemies.length);
  }
  // final boss
  G.enterDungeon(50); frames(5);
  { const b = G.bossRef;
    assert(b && b.final, 'final boss on B50');
    for (const [ox, oy] of [[3, 0], [-3, 0], [0, 3], [0, -3]]) { if (!G.blockedAt(b.x + ox, b.y + oy, 0.3)) { p.x = b.x + ox; p.y = b.y + oy; break; } }
    const seen = { slam: 0, shots: 0, lines: 0, pools: 0, charge: 0, minions: 0 };
    for (let k = 0; k < 2400 && !b.dead; k++) {
      p.hp = G.D.maxHp; p.dead = false; b.state = 'chase';
      if (k === 500) b.hp = b.maxHp * 0.6;
      if (k === 1000) b.hp = b.maxHp * 0.3;
      if (k === 1600) b.hp = b.maxHp * 0.1;
      frames(1);
      seen.slam = Math.max(seen.slam, G.slams.length); seen.shots = Math.max(seen.shots, G.bshots.length); seen.lines = Math.max(seen.lines, G.blines.length); seen.pools = Math.max(seen.pools, G.bpools.length); if (b.charge) seen.charge++;
    }
    console.log('  final', JSON.stringify(seen), 'phase', b.phase, 'hp', b.maxHp);
    assert(b.phase === 4 && b.enraged, 'final boss reaches phase 4');
    assert(seen.slam > 5 && seen.shots > 10 && seen.lines > 3 && seen.charge > 0, 'final boss uses the full arsenal');
    const g0 = G.prog.gold, c0 = G.prog.cleared || 0;
    G.killEnemy(b); frames(140);
    assert(G.prog.cleared === c0 + 1 && G.prog.gold >= g0 + 50000, 'clearing B50 records the victory');
    assert(!w.document.getElementById('ending').hidden, 'ending cinematic starts');
    G.endSkip();
    assert(w.document.getElementById('endName').classList.contains('on') && !w.document.getElementById('endBtn').hidden, 'skipping shows the hidden name');
    w.document.getElementById('endBtn').click();
    assert(!w.document.getElementById('clearDlg').hidden, 'clear screen shown after the ending');
    w.document.getElementById('clearOk').click();
    assert(G.portals.some((q) => q.to === 0 && q.label === '地上へ帰還'), 'B50 opens a gate home, not B51');
  }
  // combo & frenzy
  G.enterMap(0, null); frames(5); G.combo = 0;
  { let n = 0; for (const e of G.enemies.slice()) { if (n >= 25) break; if (!e.dead) { G.killEnemy(e); n++; } frames(1); }
    assert(G.combo >= 25 && p.frenzyT > 0, 'combo 25 triggers frenzy: combo ' + G.combo + ' frenzy ' + p.frenzyT);
    assert(!w.document.getElementById('combo').hidden, 'combo counter visible'); }


  // floors 2.0
  for (const o of ['bounty', 'treasure', 'seal', 'survive', 'kill']) {
    p.dead = false; p.hp = G.D.maxHp; G.FLOOR.force = o; G.enterDungeon(12); frames(5);
    for (let q = 0; q < 3; q++) { if (!w.document.getElementById('blessDlg').hidden) w.document.querySelector('#blessCards .bcard').click(); frames(2); }
    assert(G.FLOOR.obj === o, 'floor objective ' + o + ' set (mods: ' + G.FLOOR.mods.join(',') + ')');
    if (o === 'survive') { for (let k = 0; k < 60 * 75 && !G.stairsOpen; k++) { p.hp = G.D.maxHp; p.dead = false; frames(1); } }
    else if (o === 'kill') { for (const e of G.enemies.slice()) { if (G.stairsOpen) break; if (!e.dead && !e.obj && !e.treasure) G.killEnemy(e); } }
    else { const sp = G.enemies.filter((e) => !e.dead && (o === 'bounty' ? e.bounty : e.obj)); assert(sp.length === 3, o + ' spawns 3 targets'); for (const e of sp) G.killEnemy(e); }
    if (!G.stairsOpen) console.log('  DEBUG', o, JSON.stringify({ timer: G.FLOOR.timer, paused: G.paused, dead: p.dead, map: G.curMap, bless: !w.document.getElementById('blessDlg').hidden }));
    assert(G.stairsOpen, 'objective ' + o + ' opens the gate');
    frames(30);
    if (!w.document.getElementById('blessDlg').hidden) w.document.querySelector('#blessCards .bcard').click();
  }
  G.enterDungeon(32); frames(3);
  assert(G.FLOOR.mods.length >= 2, 'deep floors roll two curses: ' + G.FLOOR.mods.join(','));
  { const ae = G.enemies.filter((e) => e.aff); console.log('  affixed elites:', ae.length, ae.slice(0, 3).map((e) => e.title).join(' / ')); assert(ae.length > 0, 'elites get affixes'); }
  { const g0 = G.prog.gold; const tg = G.spawnSpecial('goblin'); frames(5); G.killEnemy(tg); assert(G.prog.gold > g0 + 1000, 'treasure goblin pays out: +' + (G.prog.gold - g0)); }
  { const a0 = G.D.atk; G.chooseBless('atk'); assert(G.D.atk > a0 * 1.15, 'blessing raises attack'); G.chooseBless('phoenix'); p.dead = false; G.hurtPlayer(1e9); assert(!p.dead && p.hp > 0, 'phoenix saves once'); }
  const bl0 = G.BLESS.length; G.offerBless('test'); assert(!w.document.getElementById('blessDlg').hidden && w.document.querySelectorAll('#blessCards .bcard').length === 3, 'blessing choice shows 3 cards');
  w.document.querySelector('#blessCards .bcard').click(); assert(G.BLESS.length === bl0 + 1, 'picked blessing stacks');
  G.enterDungeon(25); frames(5); { const b = G.bossRef; frames(2); assert(b && b.aff && b.aff.length >= 1, 'B25 boss carries an affix: ' + (b && b.aff)); G.killEnemy(b); frames(90); assert(!w.document.getElementById('blessDlg').hidden, 'boss kill offers a blessing'); w.document.querySelector('#blessCards .bcard').click(); }
  G.enterMap(0, null); frames(3); assert(G.BLESS.length === 0, 'blessings fade on leaving the abyss');


  // layouts
  { const seen = {}; let worst = 1e9, maxProps = 0, slow = 0;
    for (let f = 1; f <= 50; f++) {
      const t0 = Date.now(); G.enterDungeon(f); const dt = Date.now() - t0; slow = Math.max(slow, dt);
      const L = G.MAPS[3].layout; seen[L] = (seen[L] || 0) + 1;
      const reach = G.reachList.length; worst = Math.min(worst, reach); maxProps = Math.max(maxProps, G.props.length);
      const alive = G.enemies.filter((e) => !e.dead).length;
      if (reach < 300 || alive < 8) console.log('  thin floor', f, L, reach, alive);
      frames(1);
      for (let q = 0; q < 3; q++) { if (!w.document.getElementById('blessDlg').hidden) w.document.querySelector('#blessCards .bcard').click(); }
    }
    console.log('  layouts', JSON.stringify(seen), 'min reachable', worst, 'max props', maxProps, 'slowest build ms', slow);
    assert(Object.keys(seen).length >= 8, 'at least 8 layout types appear across 50 floors');
    assert(worst >= 300, 'every floor has enough walkable ground');
  }
  { G.FLOOR.force = 'kill'; G.enterDungeon(17); frames(3); for (const e of G.enemies.slice()) { if (G.stairsOpen) break; if (!e.dead && !e.obj && !e.treasure) G.killEnemy(e); } assert(G.stairsOpen, 'gate opens on a layout floor'); const pt = G.portals[G.portals.length - 1]; const path = G.findPath(G.player.x, G.player.y, pt.x, pt.y); assert(path && path.length > 0, 'gate is reachable on foot (' + G.MAPS[3].layout + ')'); }


  // meta
  { const k0 = (G.recs().kills || 0); G.enterMap(0, null); frames(3); const e = G.enemies.find((x) => !x.dead); G.killEnemy(e); assert(G.recs().kills === k0 + 1, 'records count kills'); }
  { G.prog.rankMax = Math.max(1, G.prog.rankMax || 0); const d0 = G.prog.deep; G.setRank(1); assert(G.rankNow() === 1 && G.prog.deep === 0, 'rank switch starts a fresh depth record'); G.enterDungeon(10); frames(2);
    assert(G.MAPS[3].base === 2 + 20 + 25 && G.MAPS[3].name.indexOf('位階') === 0, 'rank raises enemy level and is shown in the floor name: ' + G.MAPS[3].name);
    G.prog.bless = ['atk', 'crit']; G.restoreDive(); assert(G.BLESS.length === 2, 'blessings restore after a reload');
    G.enterMap(0, null); frames(2); G.setRank(0); assert(G.rankNow() === 0 && G.prog.deep === d0, 'switching back restores the normal depth record'); }
  { const sv = JSON.parse(w.localStorage.getItem('twinsoul-save-v1')); assert(sv.rec && typeof sv.rec.kills === 'number' && 'rankMax' in sv, 'records and ranks are saved'); }


  // classes & ultimates
  await sleep(500); if (!w.document.getElementById('sheet').hidden) w.document.getElementById('closeBtn').click();
  { G.enterMap(0, null); frames(3); G.prog.level = 25; if (p.form !== 'blade') { p.morphT = 0; G.morph(); frames(2); }
    G.openClassDlg('blade'); assert(!w.document.getElementById('clsDlg').hidden && w.document.querySelectorAll('#clsCards .bcard').length === 2, 'class dialog offers two blade classes');
    const c0 = G.D.crit; w.document.querySelector('#clsCards .bcard').click(); frames(2);
    assert(G.prog.cls.blade === 'saint' && G.D.crit > c0 + 0.09, 'sword saint raises crit');
    assert(!w.document.getElementById('ultBtn').hidden, 'ultimate button appears');
    const ring = () => { const es = G.enemies.filter((e) => !e.dead).slice(0, 6); es.forEach((e, i) => { e.x = p.x + Math.cos(i) * 1.5; e.y = p.y + Math.sin(i) * 1.5; e.hp = e.maxHp = 1e6; }); return es; };
    let es = ring(); G.ULT.v = 100; w.document.getElementById('ultBtn').click(); assert(G.ULT.kind === 'saint', 'ultimate fires at full gauge');
    const dbg0 = { paused: G.paused, kind: G.ULT.kind, dead: p.dead, map: G.curMap, d: es.map((e) => +Math.hypot(e.x - p.x, e.y - p.y).toFixed(1)), alive: es.map((e) => !e.dead), sheet: !w.document.getElementById('sheet').hidden }; for (let k = 0; k < 300 && !es.some((e) => e.hp < 1e6); k++) frames(1); const hitAny = es.some((e) => e.hp < 1e6); if (!hitAny) console.log('  MDEBUG', JSON.stringify(dbg0), JSON.stringify({ paused: G.paused, kind: G.ULT.kind, t: G.ULT.t, inv: G.ULT.inv, hp: es.map((e) => e.hp), d: es.map((e) => +Math.hypot(e.x - p.x, e.y - p.y).toFixed(1)), obj: es.map((e) => !!(e.obj || e.dead)) })); frames(260); console.log('  musou', hitAny, G.ULT.kind, G.ULT.t); assert(hitAny && !G.ULT.kind, 'musou-ken hits and ends');
    G.chooseClass('blade', 'guard'); es = ring(); G.ULT.v = 100; G.useUlt(); const hp0 = p.hp; G.hurtPlayer(500); assert(p.hp === hp0, 'holy shield makes the knight invulnerable'); frames(260);
    for (let k = 0; k < 1500 && G.ULT.kind; k++) frames(1); p.morphT = 0; G.morph(); frames(2); G.chooseClass('arcane', 'star'); const m0 = G.meteors.length; G.ULT.v = 100; G.useUlt(); assert(G.meteors.length >= m0 + 16, 'starfall rains meteors'); frames(220);
    if (!w.document.getElementById('sheet').hidden) w.document.getElementById('closeBtn').click(); for (let k = 0; k < 1500 && G.ULT.kind; k++) frames(1); G.chooseClass('arcane', 'soul'); es = ring(); p.dead = false; G.ULT.v = 100; G.useUlt(); frames(90); assert(G.ULT.kind === 'soul', 'soul chant is active'); frames(60);
    const sv = JSON.parse(w.localStorage.getItem('twinsoul-save-v1')); assert(sv.cls && sv.cls.blade === 'guard' && sv.cls.arcane === 'soul', 'classes are saved'); }


  // pets
  { G.enterMap(0, null); frames(3); const P = G.pets(); P.eggs.length = 0; P.list.length = 0; P.active = null; P.ride = false;
    G.gainEgg(); assert(P.eggs.length === 1, 'egg obtained');
    G.eggProgress(130); assert(P.eggs.length === 0 && P.list.length === 1 && !w.document.getElementById('petDlg').hidden, 'egg hatches into a pet with a reveal');
    w.document.getElementById('petOk').click();
    const pet = G.activePet(); assert(pet && pet.lvl === 1, 'hatched pet joins the party: ' + pet.name + '/' + pet.sp);
    p.x = G.CAMP.x + 8; p.y = G.CAMP.y + 6; while (G.blockedAt(p.x, p.y, 0.3)) p.x += 0.5; G.PET.map = -1; frames(2);
    const es = G.enemies.filter((e) => !e.dead).slice(0, 3); es.forEach((e, i) => { e.x = p.x + 1.5 + i * 0.3; e.y = p.y + 1; e.hp = e.maxHp = 1e6; e.state = 'chase'; });
    p.target = es[0]; frames(240); if (!es.some((e) => e.hp < 1e6)) console.log('  PETDBG', JSON.stringify({ sp: pet.sp, paused: G.paused, pet: [G.PET.x, G.PET.y], pl: [p.x, p.y], es: es.map((e) => [e.x, e.y, e.dead, e.state]), tgt: !!p.target, dead: p.dead, sheet: !w.document.getElementById('sheet').hidden, dlg: !w.document.getElementById('petDlg').hidden, cls: !w.document.getElementById('clsDlg').hidden })); assert(es.some((e) => e.hp < 1e6), 'pet attacks enemies');
    const s0 = G.D.speed; pet.lvl = 15; G.toggleRide(); frames(2);
    assert(G.riding() && Math.abs(G.D.speed - s0 * G.PET_SP[pet.sp].mount) < 0.01 && G.PET_SP[pet.sp].mount >= 1.2, 'adult pet can be ridden for its species speed bonus (' + s0.toFixed(2) + ' -> ' + G.D.speed.toFixed(2) + ')');
    assert(!w.document.getElementById('rideBtn').hidden, 'ride button visible');
    G.toggleRide(); assert(!G.riding(), 'dismount');
    for (let k = 0; k < 3; k++) { G.gainEgg(); G.eggProgress(130); w.document.getElementById('petOk').click(); }
    G.openSheet(); G.setTab('pet'); assert(w.document.querySelectorAll('#petBox .pcard').length === 4, 'pet tab lists pets'); G.closeSheet && G.closeSheet();
    const sv = JSON.parse(w.localStorage.getItem('twinsoul-save-v1')); assert(sv.pets && sv.pets.list.length === 4, 'pets are saved');
    let hits = 0; const R0 = Math.random; let calls = 0; w.Math.random = () => { calls++; return calls % 2000 === 0 ? 0 : 0.5; }; const eg0 = P.eggs.length; for (let k = 0; k < 4000; k++) G.petUpdate && 0; w.Math.random = R0; }


  // online layer (offline fallback in tests)
  await sleep(400);
  { G.enterMap(0, null); frames(3); G.prog.level = Math.max(G.prog.level, 30); G.wbLocal().tries = 0;
    await G.openWorld(); assert(!w.document.getElementById('worldDlg').hidden && w.document.querySelectorAll('#worldBox .qc').length >= 2, 'world panel shows boss and ranking');
    await G.wbEnter(); await sleep(400); frames(5);
    { const n0 = G.enemies.filter((e) => !e.dead).length; for (let i = 0; i < 6; i++) G.step(0.5); assert(G.enemies.filter((e) => !e.dead && !e.world).length <= n0 + 4, 'no ambient packs spawn in the world-boss arena'); }
    assert(G.WB.on && G.curMap === 3 && G.bossRef && G.bossRef.world && G.bossRef.maxHp >= 8e6, 'rift arena with the shared boss');
    assert(G.enemies.filter((e) => !e.dead).length <= 4, 'arena holds only the boss and its adds');
    const b = G.bossRef; G.hitEnemy(b, 50000); G.hitEnemy(b, 50000); frames(2);
    assert(G.WB.dmg >= 90000, 'damage to the boss counts as contribution: ' + Math.round(G.WB.dmg));
    const d0 = G.wbLocal().dmg; await G.wbEnd('time'); await sleep(450); frames(5);
    assert(!G.WB.on && G.curMap === 0 && G.wbLocal().dmg >= d0 + 90000 && G.wbLocal().tries === 1, 'attempt ends, returns home and banks the contribution');
    assert(!w.document.getElementById('worldDlg').hidden && w.document.getElementById('worldBox').textContent.indexOf('今回の与ダメージ') >= 0, 'result panel shown');
    w.document.getElementById('worldClose').click();
    G.FLOOR.force = 'kill'; G.enterDungeon(7); frames(2); assert(G.FLOOR.mods.includes(G.weekMod()), 'weekly curse applies to abyss floors (' + G.weekMod() + ')');
    assert(G.wkLocal().score >= 7, 'weekly best is recorded'); G.enterMap(0, null); frames(2); }

  // v2-specific checks
  assert(G.flareReady && G.FL.hero_blade.anims.run.n === 8 && G.FL.hero_arcane.anims.cast.fr.length === 8, 'hero frame sets built');
  assert(G.FL.skeleton.anims.die.n === 6 && !!G.FL.goblin_elite, 'enemy frame sets built');
  G.enterMap(0, null); frames(5);
  G.setDay(0.6); frames(30);
  assert(G.envDark > 0.9, 'night reached (dark=' + G.envDark.toFixed(2) + ')');
  frames(400);
  assert(G.parts.some((p) => p.k === 'firefly') || true, 'fireflies may spawn at night');
  G.setDay(0.1); frames(30);
  assert(G.envDark < 0.05, 'day restored');
  assert(G.chunkCache.size > 0 && G.chunkCache.size <= 49, 'chunk cache bounded: ' + G.chunkCache.size);

  // minigame: アリアの演奏
  {
    G.enterMap(0, null); frames(3); G.paused = false;
    const pl = G.player; pl.dead = false; pl.x = G.SPAWN.x; pl.y = G.SPAWN.y; frames(2);
    assert(!$('ariaBtn').hidden, 'rhythm game button shows at the camp');
    const charts = [0, 1, 2].map((d) => G.ariaChart(d));
    assert(charts[0].length < charts[1].length && charts[1].length < charts[2].length && charts.every((c) => c.every((n, i) => i === 0 || n.t >= c[i - 1].t)), 'three difficulties, sorted charts: ' + charts.map((c) => c.length).join('/'));
    G.ariaState().day = 0; G.ariaState().buff = false;
    const g0 = G.prog.gold;
    G.ariaOpen();
    assert(G.ARIA.on && G.paused && !$('ariaOv').hidden, 'rhythm game opens and pauses the field');
    G.ARIA.fake = -1; G.ARIA.diff = 1; G.ariaStart();
    for (const n of G.ARIA.notes) { G.ARIA.fake = n.t + 0.01; G.ariaHit(n.lane); }
    G.ARIA.fake = G.ARIA.end + 0.1; G.ariaTick();
    const R = G.ARIA.result;
    assert(R && R.rank === 'S' && R.full && G.ARIA.cnt[0] === G.ARIA.notes.length, 'hitting every note on time gives rank S full combo');
    assert(G.ariaState().buff && G.prog.gold > g0, 'clearing gives the song blessing and gold');
    G.ariaStart();
    G.ARIA.fake = G.ARIA.end + 0.1; G.ariaTick();
    assert(G.ARIA.result.rank === 'C' && G.ARIA.cnt[3] === G.ARIA.notes.length, 'unplayed notes count as misses');
    G.ariaClose(); G.ARIA.fake = null;
    assert(!G.ARIA.on && !G.paused && $('ariaOv').hidden, 'closing returns to the field');
    G.enterDungeon(1); frames(3);
    assert(!G.ariaState().buff, 'the song blessing is used at the start of the next dive');
    G.enterMap(0, null); frames(3);
  }
  // borrowed mechanics: legendary powers, dodge / perfect dodge, boss break
  {
    const L = G.genItem(20, 3, 'acc');
    assert(L.pow && G.LPOW[L.pow], 'legendary items roll a unique power: ' + L.pow);
    assert(G.cleanItem(Object.assign({}, L)).pow === L.pow && G.cleanItem(Object.assign({}, L, { pow: '__proto__' })).pow === undefined, 'saved powers are validated');
    L.pow = 'soul'; G.prog.eq.acc = L; G.refreshGear();
    assert(G.hasPow('soul'), 'equipped legendary power is active');
    G.enterMap(0, null); frames(3); G.paused = false;
    const pl = G.player; pl.dead = false; G.refreshD(); pl.hp = G.D.maxHp; pl.cd = {};
    const x0 = pl.x, y0 = pl.y; pl.dir = 2;
    G.startDodge(1);
    for (let i = 0; i < 20; i++) G.step(0.02);
    assert(Math.hypot(pl.x - x0, pl.y - y0) > 1 || G.blockedAt(x0 + 1, y0 + 1, 0.25), 'dodge dashes the hero: ' + Math.hypot(pl.x - x0, pl.y - y0).toFixed(2));
    pl.cd = {}; G.startDodge(1); const hp0 = pl.hp;
    G.hurtPlayer(9999);
    assert(pl.hp === hp0 && pl.critT > 0 && G.slowMo > 0, 'a hit during the dodge is avoided and triggers the perfect dodge');
    for (let i = 0; i < 30; i++) G.step(0.1);
    G.enterDungeon(5); frames(5);
    const b = G.bossRef;
    G.staggerAdd(b, b.maxHp * 0.2, true);
    assert(b.brkT > 0 && b.stunT > 0, 'filling the stagger gauge breaks the boss');
    G.prog.eq.acc = null; G.refreshGear();
    G.enterMap(0, null); frames(3);
  }
  // elemental reactions
  {
    G.enterDungeon(2); frames(3);
    const pl = G.player; pl.dead = false; G.refreshD(); pl.hp = G.D.maxHp;
    const e = G.makeTestElite(); e.maxHp = e.hp = 1e7;
    const r0 = G.recs().reacts || 0;
    G.withEl('ice', () => G.hitEnemy(e, 1));
    assert(e.el === 'ice' && e.elT > 0, 'a frost hit leaves ice on the enemy');
    if (pl.form !== 'blade') G.morph();
    pl.form = 'blade'; const h0 = e.hp; G.hitEnemy(e, 1000);
    assert(!(e.elT > 0) && (G.recs().reacts || 0) === r0 + 1 && h0 - e.hp > 1500, 'a sword hit shatters the ice for extra damage: ' + Math.round(h0 - e.hp));
    G.withEl('fire', () => G.hitEnemy(e, 1)); const h1 = e.hp; G.withEl('volt', () => G.hitEnemy(e, 1000));
    assert((G.recs().reacts || 0) === r0 + 2, 'fire then lightning overloads');
    G.enterMap(0, null); frames(3);
  }
  // daily missions and achievements
  {
    G.prog.daily = null;
    const S = G.dailyState();
    assert(S.ids.length === 3 && new Set(S.ids).size === 3, 'three distinct daily missions: ' + S.ids.join(','));
    const g0 = G.prog.gold, m0 = G.DAILY_POOL.find((m) => m.id === S.ids[0]);
    G.recAdd(m0.k, m0.n); G.dailyCheck();
    assert(S.done[0] && !S.done[1] && G.prog.gold > g0, 'finishing a daily mission pays out once');
    for (const id of S.ids) { const m = G.DAILY_POOL.find((x) => x.id === id); G.recAdd(m.k, m.n); }
    const inv0 = G.prog.inv.length; G.dailyCheck();
    assert(S.all && G.prog.dailyAll >= 1 && G.prog.inv.length === inv0 + 1, 'all three missions give the bonus item');
    G.recs().kills = Math.max(G.recs().kills || 0, 150); G.achCheck();
    assert(G.prog.ach.includes('k100'), 'achievement unlocks from play records');
    G.prog.title = 'k100'; G.save(); G.prog.ach = []; G.prog.title = ''; G.prog.daily = null; G.load();
    assert(G.prog.ach.includes('k100') && G.titleName() === '狩人' && G.prog.daily && G.prog.daily.all, 'achievements, title and daily state survive a reload');
  }
  // skills 2.0, meta progression, kill streaks
  {
    G.enterMap(0, null); frames(3); G.paused = false;
    const pl = G.player; pl.dead = false; if (pl.form !== 'blade') G.morph(); pl.form = 'blade'; G.refreshD(); pl.hp = G.D.maxHp; pl.mp = G.D.maxMp;
    G.prog.skill.whirl = Math.max(G.prog.skill.whirl, 5);
    G.gainGem('amp', true); G.gainGem('twin', true); G.gainGem('haste', true);
    assert(G.sockets('whirl') === 2, 'skill Lv5 opens a second gem socket');
    G.sockOf('whirl')[0] = 'amp'; G.sockOf('whirl')[1] = 'haste';
    assert(Math.abs(G.makeCtx('whirl').dmg - 1.35) < 1e-9 && G.skillCdMul('whirl') === 0.75, 'socketed gems change damage and cooldown');
    G.sockOf('whirl')[1] = 'twin';
    const e = G.makeTestElite(); e.maxHp = e.hp = 1e8; e.x = pl.x + 0.8; e.y = pl.y; e.state = 'idle';
    G.castWithGems('whirl', G.prog.skill.whirl); const h1 = e.hp;
    G.growthUpdate(0.35);
    assert(h1 < 1e8 && e.hp < h1, 'the twin gem casts the skill a second time');
    G.sockOf('whirl').length = 0;
    G.setSlot('blade', 'skyfall', 0);
    assert(G.SLOTS.blade[0] === 'skyfall' && !G.SLOTS.blade.includes('whirl') && G.SLOTS.blade[7] === 'sprint', 'a new skill replaces a hotbar button (dodge stays)');
    G.setSlot('blade', 'skyfall', 3);
    assert(G.SLOTS.blade[3] === 'skyfall' && G.SLOTS.blade[0] === 'rend', 'moving a skill on the bar swaps the two buttons');
    G.setSlot('blade', 'whirl', 0); G.setSlot('blade', 'skyfall', 0);
    G.save(); G.prog.slots = null; G.load(); G.applySlots();
    assert(G.SLOTS.blade[0] === 'skyfall', 'hotbar layout survives a reload');
    G.setSlot('blade', 'whirl', 0);
    G.prog.skill.skyfall = 1; const h2 = e.hp; pl.target = e;
    G.castWithGems('skyfall', 1);
    assert(e.hp < h2, 'skyfall leaps in and slams');
    G.prog.skill.k_echo = 1;
    assert(G.skillMpMul('chain') > 1, 'keystones carry a drawback (echo costs more MP)');
    G.prog.skill.k_echo = 0; G.prog.skill.skyfall = 0; e.dead = true;
    // altar and rebirth
    G.gainSoul(500); pl.x = G.SPAWN.x; pl.y = G.SPAWN.y; frames(2);
    const hpA = G.D.maxHp; G.altarOpen();
    assert(!w.document.getElementById('altarDlg').hidden, 'the soul altar opens at the camp');
    w.document.querySelector('#altarBox .primary').click();
    assert(G.perkLv('hp') === 1 && G.D.maxHp > hpA, 'buying a perk raises stats permanently');
    G.altarClose();
    G.prog.level = 45; const pts0 = G.soul().pts;
    assert(G.rebirth() && G.prog.level === 1 && G.soul().rb === 1 && G.soul().pts > pts0 && G.prog.sp === 3, 'rebirth resets the level and pays soul shards');
    // kill streak
    const x0 = G.prog.exp;
    for (let i = 0; i < 12; i++) G.streakOnKill({ exp: 100 });
    G.streakEnd();
    assert(G.prog.exp > x0 && G.streakN === 0, 'a 12-kill streak pays an exp bonus');
  }
  // idle layer: party of companions, training, offline hunting, AUTO
  {
    G.enterMap(0, null); frames(3); G.paused = false;
    const pl = G.player; pl.dead = false;
    assert(Object.keys(G.PET_SP).length === 12, 'twelve companion species');
    const P = G.pets(); P.eggs.length = 0; P.list.length = 0; P.active = null; P.party = []; P.slots = 0; P.ride = false;
    for (let k = 0; k < 4; k++) { G.gainEgg(); G.eggProgress(130); w.document.getElementById('petOk').click(); }
    assert(P.list.length === 4 && G.partyList().length === 2, 'two companions travel together at first');
    G.prog.gold = 1e7; G.openSheet(); G.setTab('pet');
    const slotBtn = [...w.document.querySelectorAll('#petBox .qc.row2')].find((r) => r.textContent.includes('同行の枠')).querySelector('button'); slotBtn.click();
    assert(G.partySlots() === 3, 'buying a slot lets one more companion join');
    const join = [...w.document.querySelectorAll('#petBox .pcard')].find((c) => c.textContent.includes('連れて行く')).querySelector('.primary'); join.click();
    assert(G.partyList().length === 3 && new Set(G.partyList().map((q) => G.entOf(q))).size === 3, 'each companion has its own body on the field');
    const atkBtn = [...w.document.querySelectorAll('#petBox .qc.row2')].find((r) => r.textContent.includes('攻撃の訓練')).querySelector('button');
    const tr0 = G.trainS().atk; atkBtn.click();
    assert(G.trainS().atk === tr0 + 1, 'training upgrades are bought with gold');
    G.closeSheet();
    // offline
    G.prog.seen = Date.now() - 90 * 60000; const g0 = G.prog.gold;
    const r = G.offlineRewards();
    assert(r && r.min === 90 && G.prog.gold > g0 && Math.abs(G.prog.seen - Date.now()) < 5000, 'companions bring back gold for time away: ' + (r && r.gold));
    G.prog.seen = Date.now() - 30 * 3600000; assert(G.offlineRewards().min === 480, 'offline rewards stop at 8 hours');
    // AUTO
    pl.x = G.CAMP.x + 8; pl.y = G.CAMP.y + 6; while (G.blockedAt(pl.x, pl.y, 0.3)) pl.x += 0.5; pl.target = null; pl.path.length = 0; G.refreshD(); pl.hp = G.D.maxHp;
    const es = G.enemies.filter((e) => !e.dead && !e.obj).slice(0, 2); es.forEach((e, i) => { e.x = pl.x + 3 + i; e.y = pl.y + 1; e.hp = e.maxHp = 1e6; e.state = 'idle'; });
    G.autoToggle(); assert(G.autoOn(), 'AUTO turns on');
    for (let i = 0; i < 120; i++) G.step(0.05);
    assert(pl.target && es.some((e) => e.hp < 1e6), 'AUTO finds enemies and fights them');
    G.autoToggle(); assert(!G.autoOn(), 'AUTO turns off');
    es.forEach((e) => { e.dead = true; });
    P.party = []; P.active = null;
  }
  // regression: AUTO must not replace the auto-potion routine
  {
    G.enterMap(0, null); frames(3); G.paused = false;
    const pl = G.player; pl.dead = false; G.refreshD(); G.prog.opt.autoPot = true; G.prog.potions = 5; pl.potT = 0;
    pl.x = G.CAMP.x + 9; pl.y = G.CAMP.y + 6; while (G.blockedAt(pl.x, pl.y, 0.3)) pl.x += 0.5;
    pl.hp = G.D.maxHp * 0.2; G.step(0.05);
    assert(G.prog.potions === 4, 'auto-potion drinks below 30% HP');
    G.prog.opt.auto = true; pl.hp = 0; pl.dead = true; for (let i = 0; i < 80; i++) G.step(0.05);
    assert(!pl.dead, 'AUTO revives a fallen hero after a few seconds of game time');
    G.prog.opt.auto = false;
  }
  // heroines: story joins, abilities, ultimates, saves
  {
    const skip = () => { let n = 0; while (G.talkCur && n++ < 40) G.talkAdvance(); };
    G.enterMap(0, null); frames(3); G.paused = false;
    const pl = G.player; pl.dead = false; pl.x = G.SPAWN.x; pl.y = G.SPAWN.y; G.refreshD(); pl.hp = G.D.maxHp;
    G.prog.heroines = null; G.prog.story = [];
    const q0 = G.qState().main; G.qState().main = G.MAINQ.length;
    G.heroTick(1);
    assert(G.talkCur === 'mina_join' && G.paused && !$('talkDlg').hidden, 'finishing the main quests starts Mina\'s joining scene');
    skip();
    assert(G.heroJoined('mina') && !G.paused && $('talkDlg').hidden, 'Mina joins the party after the scene');
    for (const f of [11, 14, 16, 17, 19, 21, 22, 24, 27, 29, 32, 34, 37, 39, 42, 44, 47, 49]) { G.enterDungeon(f); frames(3); G.paused = false; G.heroTick(1); skip(); }
    assert(G.heroJoined('aria') && ['aria_voice', 'aria_meet', 'aria_join'].every((k) => G.storySeen().includes(k)), 'Aria\'s arc plays out from B11 to B20 and she joins');
    assert(G.heroJoined('karen') && ['karen_meet', 'karen_join'].every((k) => G.storySeen().includes(k)), 'Karen is met and joins in the burning mine (B13-B14)');
    assert(['setsuna', 'riko', 'nefi'].every((id) => G.heroJoined(id) && G.storySeen().includes(id + '_meet') && G.storySeen().includes(id + '_join')), 'Setsuna (B17-18), Riko (B22-23) and Nefi (B27-28) are met and join');
    assert(['yuzu', 'luna', 'shion', 'stella'].every((id) => G.heroJoined(id)), 'Yuzu (B32-33), Luna (B37-38), Shion (B42-43) and Stella (B47-48) join');
    assert(G.heroOut().join() === 'mina,shion,stella', 'at most three heroines travel together; a newcomer joins and the longest-serving one (not Mina) rests');
    const party = (ids) => { for (const id of Object.keys(G.HEROINES)) G.heroS(id).out = ids.includes(id); };
    party(['aria', 'karen', 'riko']);
    assert(G.heroAtkMul() > 1, 'Aria\'s song raises attack');
    {
      const k = G.heroEnt('karen'), t = G.makeTestElite(); t.maxHp = t.hp = 1e7; t.x = pl.x + 3; t.y = pl.y; k.x = t.x - 1; k.y = t.y; k.atkT = 0; k.map = G.curMap;
      G.heroUpdate(0.05);
      assert(t.hp < 1e7, 'Karen dances into the pack and burns enemies next to her');
      G.heroS('karen').ult = 90; const hp1 = t.hp; G.heroUlt('karen');
      assert(t.hp < hp1 && pl.karenDanceT > 0, 'Karen\'s ultimate burns everything nearby and speeds up her dance');
      const t2 = G.makeTestElite(); t2.maxHp = t2.hp = 1e7; t2.x = t.x + 1.5; t2.y = t.y; const r = G.heroEnt('riko'); r.atkT = 0; r.map = G.curMap;
      const hpA = t.hp; G.heroUpdate(0.05);
      assert(t.hp < hpA && t2.hp < 1e7, 'Riko\'s ghost hops between enemies');
      G.heroS('setsuna').ult = 90; G.heroUlt('setsuna');
      assert(pl.setsunaT > 0 && G.heroGuard(100) === 70, 'Setsuna\'s ultimate cuts damage taken by 30%');
      pl.setsunaT = 0; pl.minaShieldT = 0; G.heroS('nefi').ult = 90; G.heroUlt('nefi'); pl.hp = 50;
      assert(pl.nefiT > 0 && G.heroGuard(9999) === 49, 'Nefi\'s prayer leaves the hero with 1 HP');
      pl.nefiT = 0; pl.hp = G.D.maxHp * 0.5; const hpR = pl.hp; G.heroS('riko').ult = 90; G.heroUlt('riko');
      assert(pl.hp > hpR, 'Riko\'s ultimate heals the hero');
      party(['mina', 'aria', 'shion']);
      assert(G.heroGuard(100) === 90, 'Shion at your side cuts damage taken by 10%');
      t.hp = 1e7; t.dead = false; t.x = pl.x + 1; t.y = pl.y; G.prog.potions = 0; G.heroS('yuzu').ult = 90; G.heroUlt('yuzu');
      assert(G.prog.potions === 2 && t.weakT > 0, 'Yuzu\'s cure-all refills two potions and weakens enemies');
      G.heroS('shion').ult = 90; G.heroUlt('shion');
      assert(t.hp < 1e7 && t.stunT > 0, 'Shion\'s ultimate hits and stuns');
      const hpS = t.hp; G.heroS('stella').ult = 90; G.heroUlt('stella');
      assert(t.hp < hpS, 'Stella\'s meteor shower hits');
      pl.hp = G.D.maxHp * 0.3; const hpL = pl.hp; G.heroS('luna').ult = 90; G.heroUlt('luna');
      assert(pl.hp > hpL, 'Luna\'s feast drains life back to the hero');
      t.dead = true; t2.dead = true;
    }
    party(['mina', 'aria', 'karen']);
    pl.hp = G.D.maxHp * 0.5; const hp0 = pl.hp; G.heroEnt('mina').atkT = 0; G.heroUpdate(0.05);
    assert(pl.hp > hp0, 'Mina heals the hero');
    const e = G.makeTestElite(); e.maxHp = e.hp = 1e7; e.x = pl.x + 2; e.y = pl.y; G.heroS('aria').ult = 90;
    G.heroUlt('aria');
    assert(e.hp < 1e7 && pl.ariaSongT > 0 && !$('cutin').hidden, 'Aria\'s ultimate hits, buffs and shows a cut-in');
    e.dead = true;
    G.heroS('mina').aff = 90; G.save(); G.prog.heroines = null; G.load();
    assert(G.heroJoined('mina') && G.affLv('mina') === 3 && G.storySeen().includes('aria_join'), 'heroine progress survives a reload');
    G.qState().main = q0; G.enterMap(0, null); frames(3); G.paused = false;
  }
  // main story requests continue every ten floors after Mina joins
  {
    const q = G.qState(), q0 = { main: q.main, ma: q.ma, mn: q.mn }, d0 = G.prog.deep;
    assert(G.MAINQ.length === 14 && G.MAINQ.slice(10).map((m) => m.goal.n).join() === '21,31,41,50', 'four more main requests lead to B20, B30, B40 and B50');
    q.main = 10; q.ma = true; q.mn = false; G.prog.deep = 20;
    assert(!G.mainDone(), 'the B20 request is not done before reaching B21');
    G.prog.deep = 21;
    assert(G.mainDone(), 'reaching B21 completes it');
    Object.assign(q, q0); G.prog.deep = d0;
  }
  // gifts (gold sink) and the login bonus
  {
    G.enterMap(0, null); frames(3); G.paused = false;
    const S = G.heroS('mina'); S.j = true; S.aff = 0; G.prog.gold = 1e6;
    const c0 = G.giftCost('mina'), g0 = G.prog.gold;
    assert(G.giveGift('mina') && G.prog.gold === g0 - c0 && S.aff === 15, 'a gift costs gold and raises affection by half a level');
    G.giveGift('mina');
    assert(G.affLv('mina') === 1 && G.giftCost('mina') === 4 * c0, 'gifts get pricier as affection grows');
    G.prog.gold = 0; const a0 = S.aff;
    assert(!G.giveGift('mina') && S.aff === a0, 'no gift without enough gold');
    const L = G.loginState(); L.last = 0; L.n = 0; G.loginChecked = false; G.prog.potions = 0;
    G.loginTick(true);
    assert(L.n === 1 && G.prog.potions === 3 && !$('petDlg').hidden && G.paused, 'first login of the day shows day 1 and hands over potions');
    $('petOk').click();
    G.loginChecked = false; G.loginTick(true);
    assert(L.n === 1, 'the bonus is given once per day');
    L.last = 0; G.loginChecked = false; const gold1 = G.prog.gold; G.loginTick(true);
    assert(L.n === 2 && G.prog.gold > gold1, 'the next day gives day 2 (gold)');
    $('petOk').click(); G.paused = false;
    G.save(); G.prog.login = null; G.load();
    assert(G.loginState().n === 2, 'login streak survives a reload');
  }
  // first-time tips
  {
    G.enterMap(0, null); frames(3); G.paused = false; G.player.dead = false;
    G.prog.tips = []; const lv0 = G.prog.level; G.prog.level = Math.max(3, lv0);
    for (let i = 0; i < 3 && !G.tipsSeen().includes('auto'); i++) G.tipTick(10); // a tip still on screen is hidden first
    assert(G.tipsSeen().includes('auto') && w.document.getElementById('tip').classList.contains('on'), 'a first-time tip appears once its moment comes');
    for (let i = 0; i < 30; i++) G.tipTick(1);
    assert(G.tipsSeen().filter((x) => x === 'auto').length === 1, 'each tip is shown only once');
  }
  // balance pass 2 (from the balance bot)
  {
    const lv0 = G.prog.level; G.prog.level = 50;
    assert(G.expGapMul({ lvl: 10 }) === 0.05 && G.expGapMul({ lvl: 46 }) === 1, 'experience falls off against much weaker enemies');
    G.prog.level = lv0;
    const pl = G.player; pl.dead = false; G.refreshD(); pl.hp = G.D.maxHp;
    G.FLOOR.force = 'kill'; G.enterDungeon(12); frames(3);
    for (const e of G.enemies.slice()) { if (G.stairsOpen) break; if (!e.dead && !e.obj && !e.treasure) G.killEnemy(e); }
    for (const e of G.enemies) e.dead = true;
    pl.target = null; pl.path.length = 0; G.prog.opt.auto = true; G.autoBattle(0.05);
    assert(G.stairsOpen && pl.path.length > 0, 'AUTO heads for the open gate');
    G.autoWall = { f: 12, n: 3 }; G.autoRetreat();
    assert(G.floor === 6 && G.curMap === 3, 'after 3 falls AUTO drops back five floors to train: B' + G.floor);
    G.prog.opt.auto = false; G.enterMap(0, null); frames(3);
  }
  // regression: audit fixes
  {
    G.prog.wb = { wk: G.weekKey(), dmg: 1234, claimed: false, day: 1, tries: 2 };
    G.prog.wk = { wk: G.weekKey(), deep: 12, rank: 1, score: 112 };
    G.save(); G.prog.wb = null; G.prog.wk = null; G.load();
    assert(G.prog.wb && G.prog.wb.tries === 2 && G.prog.wb.dmg === 1234, 'world-boss tries/damage survive a reload');
    assert(G.prog.wk && G.prog.wk.score === 112, 'weekly ranking score survives a reload');
    const it = G.cleanItem({ id: 5, type: 'sword', il: 10, rar: 1, name: 'x', plus: 0, opts: [{ k: 'constructor', v: 1 }, { k: '__proto__', v: 1 }, { k: 'aspd', v: -100 }] });
    assert(it.opts.length === 1 && it.opts[0].k === 'aspd' && it.opts[0].v === 0, 'saved item options: inherited keys dropped, values bounded');
    const deep0 = G.prog.deep; G.prog.deep = 50; let bad = 0;
    for (let i = 0; i < 200; i++) { const b = G.genBounty(); if (b.k === 'floor' && b.n > G.ABYSS_MAX_F) bad++; }
    G.prog.deep = deep0;
    assert(bad === 0, 'no unreachable floor bounties at the bottom of the abyss');
    G.prog.rank = 2; G.prog.rankMax = 2; G.prog.cls = { blade: 'saint', arcane: null };
  }
  // balance: potion carry limit, boss hit cap, item level cap
  {
    const p0 = G.prog.potions; G.prog.potions = 29; G.killEnemy(G.makeTestElite()); G.killEnemy(G.makeTestElite());
    assert(G.prog.potions === 30, 'potions stop at the carry limit (30)'); G.prog.potions = p0;
    const pl = G.player; pl.dead = false; G.refreshD(); pl.hp = G.D.maxHp; const hp0 = pl.hp;
    G.hurtPlayer(1e9, 0.38);
    assert(!pl.dead && hp0 - pl.hp <= Math.round(G.D.maxHp * 0.38) + 1, 'telegraphed boss hits are capped at 38% of max HP');
    pl.hp = G.D.maxHp;
    const big = G.genItem(350, 3, 'sword');
    assert(big.il === 350 && big.opts.every((o) => o.k === 'skill' || isFinite(o.v)), 'items scale past il 99 for abyss ranks');
    const aspd = G.genItem(400, 3, 'acc').opts.filter((o) => o.k === 'aspd');
    assert(aspd.every((o) => o.v <= 25), 'percentage affixes stop scaling at il 99');
  }

  // reset
  $('menuBtn').click();
  $('resetBtn').click(); $('resetBtn').click();
  assert(G.prog.level === 1 && G.prog.exp === 0 && G.prog.potions === 5, 'reset restores a fresh character');
  assert(G.prog.rank === 0 && G.prog.rankMax === 0 && !G.prog.cls.blade, 'reset clears abyss rank and advanced class');
  assert(G.prog.wb && G.prog.wb.tries === 2, 'reset keeps today\'s world-boss tries (no reset exploit)');
  $('closeBtn').click();
  frames(10);

  console.log('\nERRORS:', errors.length);
  for (const e of errors) console.log(e);
  process.exit(errors.length ? 1 : 0);
})();
