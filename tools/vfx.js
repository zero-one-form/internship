const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: await chromium.executablePath(), args: chromium.args.concat(['--allow-file-access-from-files']), headless: true, defaultViewport: { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true } });
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.evaluateOnNewDocument(() => { window.__TEST__ = true; try { localStorage.clear(); } catch (e) {} });
  await p.goto('file:///home/claude/twinsoul15.html', { waitUntil: 'load', timeout: 120000 });
  await p.waitForFunction(() => !document.getElementById('startBtn').disabled, { timeout: 120000 });
  await p.click('#startBtn'); await sleep(400);
  const setup = async (dungeon) => p.evaluate((dg) => {
    const G = window.__G, pl = G.player;
    if (dg) G.enterDungeon(dg); else G.enterMap(1, null);
    G.paused = true; document.getElementById('banner').classList.remove('on');
    for (let k = 0; k < 30; k++) G.step(0.02);
    pl.x = G.CAMP.x + 8; pl.y = G.CAMP.y + 6; while (G.blockedAt(pl.x, pl.y, 0.3)) pl.x += 0.5;
    const es = G.enemies.filter((e) => !e.dead).slice(0, 6);
    es.forEach((e, i) => { const a = i / 6 * Math.PI * 2; e.x = pl.x + Math.cos(a) * 1.3; e.y = pl.y + Math.sin(a) * 1.3; e.state = 'idle'; e.hp = e.maxHp = 99999; });
    document.getElementById('pickNote').hidden = true; document.getElementById('toast').classList.remove('on');
    return es.length;
  }, dungeon);
  // A: blade crits + kills + spin
  await setup(0);
  await p.evaluate(() => { const G = window.__G, es = G.enemies.filter((e) => !e.dead).slice(0, 6); G.hitEnemy(es[0], 30); G.hitEnemy(es[1], 30); G.castSkill(0); es[2].hp = 1; G.killEnemy(es[2]); G.killEnemy(es[3]); es[4].elite = true; G.killEnemy(es[4]); for (let k = 0; k < 5; k++) G.step(0.016); });
  await sleep(500); await p.screenshot({ path: '/home/claude/br/vA.png' });
  await p.evaluate(() => { for (let k = 0; k < 14; k++) window.__G.step(0.016); });
  await sleep(500); await p.screenshot({ path: '/home/claude/br/vB.png' });
  // C: arcane explosion + chain in dungeon
  await setup(13);
  await p.evaluate(() => { const G = window.__G, pl = G.player; G.player.morphT = 0; G.morph(); const es = G.enemies.filter((e) => !e.dead).slice(0, 6); G.explode(es[0].x, es[0].y, 1.6, 50); G.castSkill(0); G.killEnemy(es[1]); for (let k = 0; k < 6; k++) G.step(0.016); });
  await sleep(500); await p.screenshot({ path: '/home/claude/br/vC.png' });
  // D: level up + frenzy
  await p.evaluate(() => { const G = window.__G; G.gainExp(G.expNeed(G.prog.level) + 1); G.player.frenzyT = 6; for (let k = 0; k < 10; k++) G.step(0.016); });
  await sleep(500); await p.screenshot({ path: '/home/claude/br/vD.png' });
  console.log('errors', errs);
  await b.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
