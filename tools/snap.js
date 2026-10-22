// Visual QA: boots dist/twinsoul.html in headless Chrome and captures key screens.
// Usage: node tools/snap.js [outDir] [width] [height]
//   CHROME=/path/to/chrome overrides the browser (defaults: /opt/pw-browsers/chromium, then @sparticuz/chromium)
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const OUT = path.resolve(process.argv[2] || 'shots');
const W = +process.argv[3] || 390, H = +process.argv[4] || 844;
const HTML = 'file://' + path.join(__dirname, '..', 'dist', 'twinsoul.html');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function browserPath() {
  if (process.env.CHROME) return process.env.CHROME;
  if (fs.existsSync('/opt/pw-browsers/chromium')) return '/opt/pw-browsers/chromium';
  return require('@sparticuz/chromium').executablePath();
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await puppeteer.launch({ executablePath: await browserPath(), headless: true, args: ['--no-sandbox', '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'], defaultViewport: { width: W, height: H, deviceScaleFactor: 2, isMobile: true, hasTouch: true } });
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.evaluateOnNewDocument(() => { window.__TEST__ = true; try { localStorage.clear(); } catch (e) {} });
  await p.goto(HTML, { waitUntil: 'load', timeout: 120000 });
  await p.waitForFunction(() => !document.getElementById('startBtn').disabled, { timeout: 120000 });
  const shot = async (name) => { await p.screenshot({ path: path.join(OUT, `${W}x${H}_${name}.png`) }); console.log('shot', name); };
  await shot('title');
  await p.click('#startBtn');
  await wait(2500);
  await shot('town');
  const steps = [
    ['forest', (G) => { G.enterMap(0, 0); }],
    ['abyss_b1', (G) => { G.enterDungeon(1); }],
    ['abyss_b5_boss', (G) => { G.enterDungeon(5); }],
    ['boss_break', (G) => { const b = G.bossRef; G.player.x = b.x + 2; G.player.y = b.y; b.state = 'chase'; G.staggerAdd(b, b.maxHp * 0.06, false); G.hitEnemy(b, 500); }],
    ['boss_broken', (G) => { const b = G.bossRef; G.staggerAdd(b, b.maxHp * 0.2, true); }],
    ['abyss_b23', (G) => { G.enterDungeon(23); }],
    ['abyss_b50', (G) => { G.enterDungeon(50); }],
    ['camp', (G) => { G.enterMap(0, null); G.player.x = G.SPAWN.x; G.player.y = G.SPAWN.y; }],
    ['aria_menu', (G) => { G.ariaOpen(); }],
    ['aria_play', (G) => { G.ARIA.fake = 29.6; G.ARIA.diff = 1; G.ariaStart(); G.ARIA.fake = 29.6; for (const n of G.ARIA.notes) if (n.t < 29.5) n.hit = 0; G.ARIA.combo = 42; G.ariaHit(0); }],
    ['aria_result', (G) => { G.ARIA.fake = 99; G.ariaTick(); }],
    ['sheet_gear', (G) => { G.ariaClose(); G.ARIA.fake = null; G.enterMap(0, 0); for (let i = 0; i < 10; i++) G.prog.inv.push(G.genItem(3 + (i % 4), i % 4)); G.openSheet(); G.setTab('gear'); }],
    ['sheet_quest', (G) => { G.closeSheet(); G.recs().kills = 1200; G.recs().legends = 2; G.achCheck(); G.prog.title = 'k1000'; G.openSheet(); G.setTab('quest'); }],
    ['sheet_quest_ach', (G) => { G.openSheet(); G.setTab('quest'); const pn = document.querySelector('#sheet .panel'); pn.scrollTop = pn.scrollHeight; }],
    ['sheet_skill', (G) => { G.prog.level = 40; G.prog.skill.whirl = 10; G.prog.skill.skyfall = 2; G.gainGem('amp', true); G.gainGem('ice', true); G.sockOf('whirl')[0] = 'amp'; G.openSheet(); G.setTab('blade'); }],
    ['sheet_skill_end', (G) => { G.openSheet(); G.setTab('blade'); const pn = document.querySelector('#sheet .panel'); pn.scrollTop = pn.scrollHeight; }],
    ['altar', (G) => { G.enterMap(0, null); G.player.x = G.SPAWN.x; G.player.y = G.SPAWN.y; G.gainSoul(120); G.paused = false; G.altarOpen(); }],
    ['streak', (G) => { G.altarClose(); for (let i = 0; i < 22; i++) G.streakOnKill({ exp: 10 }); }],
    ['party', (G) => { G.closeSheet(); const P = G.pets(); P.list.length = 0; P.party = []; P.active = null; P.slots = 4; let id = 1;
      for (const sp of ['golem', 'fairy', 'mimic', 'phoenix', 'kirin', 'frost']) { P.list.push({ id: id, sp, lvl: 20 + id * 3, exp: 0, shiny: id === 4, name: 'テスト' + id }); G.partyAdd(id, true); id++; }
      G.enterMap(0, 0); G.prog.opt.auto = true; for (let k = 0; k < 3; k++) G.spawnPack(); }],
    ['party_fight', (G) => { }],
    ['pet_tab', (G) => { G.prog.opt.auto = false; G.prog.gold = 50000; G.openSheet(); G.setTab('pet'); }],
    ['offline', (G) => { G.prog.seen = Date.now() - 200 * 60000; G.showOffline(G.offlineRewards()); }],
    ['tip', (G) => { G.closeSheet(); document.getElementById('petOk').click(); G.paused = false; G.showTip(G.TIPS[3][2]); }],
    ['talk', (G) => { document.getElementById('tip').classList.remove('on'); G.enterMap(0, null); G.player.x = G.SPAWN.x; G.player.y = G.SPAWN.y; G.prog.story = []; G.heroS('mina').j = false; G.qState().main = G.MAINQ.length; G.paused = false; G.heroTick(1); G.talkAdvance(); }],
    ['talk_aria', (G) => { while (G.talkCur) G.talkAdvance(); G.playScene('aria_join'); G.talkAdvance(); G.talkAdvance(); }],
    ['talk_karen', (G) => { while (G.talkCur) G.talkAdvance(); G.playScene('karen_join'); G.talkAdvance(); }],
    ['heroines_field', (G) => { while (G.talkCur) G.talkAdvance(); G.heroS('aria').j = true; G.heroS('mina').j = true; G.heroS('karen').j = true; G.enterDungeon(21); G.prog.opt.auto = true; }],
    ['cutin', (G) => { G.heroS('karen').ult = 60; G.heroUlt('karen'); }],
    ['hero_tab', (G) => { G.prog.opt.auto = false; G.heroS('mina').aff = 70; G.openSheet(); G.setTab('pet'); }],
  ];
  for (const [name, fn] of steps) {
    const ok = await p.evaluate((src) => { const G = window.__G; if (!G) return false; try { G.closeSheet && G.closeSheet(); } catch (e) {} (0, eval)('(' + src + ')')(G); return true; }, fn.toString());
    if (!ok) { console.log('no test hook; skipping', name); continue; }
    await wait(name === 'cutin' ? 350 : 1500);
    await shot(name);
  }
  console.log('errors', errs.length);
  for (const e of errs.slice(0, 20)) console.log(' ', e);
  await b.close();
  process.exit(errs.length ? 1 : 0);
})().catch((e) => { console.log('ERR', e.stack || e.message); process.exit(2); });
