// Balance bot: boots the game headlessly (jsdom, no drawing), turns on AUTO and fast-forwards game time
// with a simple player policy. Prints a progression table and writes JSON for comparison.
// Usage: node tools/sim.js [hours=2] [out.json] [seed]
//   SIM_HEROES=1: start with Mina in the party so the other heroines join on their floors (the bot never visits camp for the main quests)
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const HOURS = +process.argv[2] || 2, OUT = process.argv[3] || '', SEED = +process.argv[4] || 1;
const html = fs.readFileSync(path.join(__dirname, '..', 'dist', 'twinsoul.html'), 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => errors.push(String(e.stack || e.message).slice(0, 300)));
vc.on('error', (e) => errors.push(String(e).slice(0, 300)));
let seed = SEED;
const dom = new JSDOM(html, {
  url: 'https://example.org/', runScripts: 'dangerously', virtualConsole: vc,
  beforeParse(window) {
    window.__TEST__ = true; window.__loadImage = () => Promise.resolve({ width: 2048, height: 2048 });
    window.Math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    window.requestAnimationFrame = () => 0; window.cancelAnimationFrame = () => {};
    const noop = () => {}, grad = { addColorStop: noop };
    const img = (w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)), width: w, height: h });
    const target = { createRadialGradient: () => grad, createLinearGradient: () => grad, createPattern: () => ({}), createImageData: img, getImageData: (x, y, w, h) => img(w, h), measureText: () => ({ width: 10 }), setLineDash: noop, getLineDash: () => [] };
    const ctx = new Proxy(target, { get(t, p) { return p in t ? t[p] : noop; }, set(t, p, v) { t[p] = v; return true; } });
    window.HTMLCanvasElement.prototype.getContext = function () { return ctx; };
    window.Element.prototype.getBoundingClientRect = function () { return { left: 0, top: 0, right: 390, bottom: 844, width: 390, height: 844, x: 0, y: 0 }; };
  }
});
const w = dom.window;
const $ = (id) => w.document.getElementById(id);
const ORDER = ['whirl', 'sword', 'sword', 'gale', 'gale', 'gale', 'whirl', 'whirl', 'iron', 'iron', 'rend', 'rend', 'rend', 'chain', 'chain', 'chain', 'amp', 'amp', 'fireball', 'fireball', 'fireball', 'frost', 'frost', 'frost', 'aura', 'aura', 'meteor', 'meteor', 'keen', 'keen', 'focus', 'focus', 'skyfall', 'skyfall', 'skyfall', 'storm', 'storm', 'storm', 'blades', 'gravity', 'k_soul'];

setTimeout(async () => {
  const G = w.__G;
  if (!G) { console.log('no hook'); process.exit(2); }
  $('startBtn').click();
  G.paused = false;
  G.prog.opt.auto = true;
  if (process.env.SIM_HEROES) { G.heroS('mina').j = true; G.storySeen().push('mina_join'); }
  const DT = 0.05, rows = [];
  let bestDeep = 0, deathsAtBest = 0, farmUntil = 0, nextShop = 600, doShop = false;
  let t = 0, nextRow = 0, deaths0 = 0, phase = 'forest', floorT = 0, lastFloor = 0;
  const floorTimes = [];
  const policy = () => {
    // learn skills in a fixed order, equip the best gear, sell junk, buy potions in camp, go dive when ready
    for (let k = 0; k < 4 && G.prog.kp > 0; k++) { const id = ORDER.find((x) => (G.prog.skill[x] || 0) < G.SKD[x].max && G.prog.level >= G.SKD[x].lv && (!G.SKD[x].pre || (G.prog.skill[G.SKD[x].pre[0]] || 0) >= G.SKD[x].pre[1])); if (!id) break; G.learn(id); }
    G.equipBest();
    if (G.prog.inv.length > 30) { try { G.sellNormals(); } catch (e) { /* ignore */ } }
    // spend like a player: altar perks, gear enhancement at the camp
    if (t > nextShop && !G.player.dead) { nextShop = t + 900; const wasDive = G.curMap === 3; if (wasDive) G.enterMap(0, null); G.player.x = G.SPAWN.x; G.player.y = G.SPAWN.y; doShop = true; if (wasDive) phase = 'abyss'; }
    if (doShop) { doShop = false;
      for (let k = 0; k < 20; k++) {
        const S = G.soul(), P = G.PERKS.filter((x) => G.perkLv(x.id) < x.max).sort((a, b) => a.cost * (G.perkLv(a.id) + 1) - b.cost * (G.perkLv(b.id) + 1))[0];
        if (!P || S.pts < P.cost * (G.perkLv(P.id) + 1)) break;
        S.pts -= P.cost * (G.perkLv(P.id) + 1); S.perks[P.id] = G.perkLv(P.id) + 1; G.refreshD();
      }
      for (const ty of ['sword', 'staff', 'head', 'body', 'acc']) { const it = G.prog.eq[ty]; for (let k = 0; k < 3 && it && it.plus < 10 && G.prog.gold > 20000; k++) G.enhance(it); }
    }
    if (phase === 'forest' && G.prog.level >= 6) { phase = 'abyss'; G.enterDungeon(Math.max(1, G.prog.deep ? Math.floor((G.prog.deep - 1) / 5) * 5 + 1 : 1)); }
    const dNow = G.recs().deaths || 0;
    if (G.prog.deep > bestDeep) { bestDeep = G.prog.deep; deathsAtBest = dNow; }
    if (dNow - deathsAtBest >= 4 && t > farmUntil) { farmUntil = t + 600; deathsAtBest = dNow; }
    const cp = Math.max(1, Math.floor(Math.max(0, G.prog.deep - 1) / 5) * 5 + 1 - (t < farmUntil ? 5 : 0));
    if (phase === 'abyss' && G.curMap !== 3 && !G.player.dead) G.enterDungeon(Math.max(1, cp));
  };
  const started = Date.now();
  const total = HOURS * 3600;
  while (t < total) {
    // close any dialog that would block a player who isn't there
    if (!$('petDlg').hidden) $('petOk').click();
    if (!$('npcDlg').hidden) G.closeNpc();
    if (!$('sheet').hidden) G.closeSheet();
    if (G.paused && $('blessDlg').hidden && $('clsDlg').hidden && !G.player.dead) G.paused = false;
    if (G.transit) { await new Promise((r) => setTimeout(r, 360)); continue; }
    if (process.env.SIM_HEROES) { // the frame loop that drives heroines does not run headless
      while (G.talkCur) G.talkAdvance();
      if (!G.paused) { G.heroTick(DT); G.heroUpdate(DT); }
    }
    G.simStep(DT); t += DT;
    if (G.curMap === 3 && G.floor !== lastFloor) { if (lastFloor) floorTimes.push({ f: lastFloor, t: Math.round(t - floorT) }); lastFloor = G.floor; floorT = t; }
    if (Math.floor(t * 20) % 100 === 0) policy();
    if (t >= nextRow) {
      nextRow += 300;
      const r = G.recs();
      if (process.env.DBG) console.log("DBG", JSON.stringify({ t: Math.round(t), dead: G.player.dead, paused: G.paused, deadOv: !$("dead").hidden, intro: !$("intro").hidden, map: G.curMap, tgt: !!G.player.target, path: G.player.path.length, auto: G.autoOn(), pos: [G.player.x.toFixed(1), G.player.y.toFixed(1)], hp: Math.round(G.player.hp), fl: G.floor, tb: G.player.target && !!G.player.target.boss, td: G.player.target ? +Math.hypot(G.player.target.x - G.player.x, G.player.target.y - G.player.y).toFixed(1) : -1, tobj: G.player.target && G.player.target.obj, stairs: G.stairsOpen, alive: G.enemies.filter((e) => !e.dead).length }));
      rows.push({ min: Math.round(t / 60), lvl: G.prog.level, deep: G.prog.deep, floor: G.curMap === 3 ? G.floor : 0, gold: G.prog.gold, kills: r.kills || 0, deaths: r.deaths || 0, pots: G.prog.potions, soul: G.soul().pts, legends: r.legends || 0, clr: G.prog.cleared || 0, her: G.heroOut().length, atk: Math.round(G.D.atk), hp: G.D.maxHp });
    }
  }
  const pad = (s, n) => String(s).padStart(n);
  console.log(' min  lvl deep  fl     gold  kills dth pot soul leg clr her   atk    hp');
  for (const r of rows) console.log([pad(r.min, 4), pad(r.lvl, 4), pad(r.deep, 4), pad(r.floor, 3), pad(r.gold, 8), pad(r.kills, 6), pad(r.deaths, 3), pad(r.pots, 3), pad(r.soul, 4), pad(r.legends, 3), pad(r.clr, 3), pad(r.her, 3), pad(r.atk, 5), pad(r.hp, 5)].join(' '));
  const ft = floorTimes.slice(-40);
  console.log('floor clear times (s):', ft.map((x) => 'B' + x.f + ':' + x.t).join(' '));
  console.log('sim', HOURS + 'h in', ((Date.now() - started) / 1000).toFixed(0) + 's; errors', errors.length);
  for (const e of errors.slice(0, 5)) console.log(' ', e);
  if (OUT) fs.writeFileSync(OUT, JSON.stringify({ rows, floorTimes, errors: errors.length }, null, 1));
  process.exit(0);
}, 50);
