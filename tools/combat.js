// Feel/VFX review: stages a fight in headless Chrome and captures a burst of frames mid-combat.
// Usage: node tools/combat.js [outDir] [width] [height]
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const OUT = path.resolve(process.argv[2] || 'shots');
const W = +process.argv[3] || 390, H = +process.argv[4] || 844;
const HTML = 'file://' + path.join(__dirname, '..', 'dist', 'twinsoul.html');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = () => process.env.CHROME || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : require('@sparticuz/chromium').executablePath());

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await puppeteer.launch({ executablePath: await chrome(), headless: true, args: ['--no-sandbox', '--allow-file-access-from-files'], defaultViewport: { width: W, height: H, deviceScaleFactor: 2, isMobile: true, hasTouch: true } });
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.evaluateOnNewDocument(() => { window.__TEST__ = true; try { localStorage.clear(); } catch (e) {} });
  await p.goto(HTML, { waitUntil: 'load', timeout: 120000 });
  await p.waitForFunction(() => !document.getElementById('startBtn').disabled, { timeout: 120000 });
  await p.click('#startBtn');
  await wait(1500);
  // a mid-game character in a dense abyss floor
  await p.evaluate(() => {
    const G = window.__G;
    G.prog.level = 30; G.prog.stats.str = 60; G.prog.stats.agi = 30; G.prog.stats.int = 50;
    for (const id of Object.keys(G.SKD)) G.prog.skill[id] = Math.max(G.prog.skill[id] || 0, 5);
    G.enterDungeon(7);
    G.refreshD(); G.player.hp = G.D.maxHp; G.player.mp = G.D.maxMp;
    for (let k = 0; k < 4; k++) G.spawnPack();
    for (const e of G.enemies) { const a = Math.random() * 6.28, r = 1.5 + Math.random() * 2.5; e.x = G.player.x + Math.cos(a) * r; e.y = G.player.y + Math.sin(a) * r; e.state = 'chase'; }
  });
  const shots = [
    ['00_engage', (G) => G.attackNearest()],
    ['01_swing', (G) => G.attackNearest()],
    ['02_skill', (G) => G.castSkill(0)],
    ['03_skill2', (G) => G.castSkill(1)],
    ['04_morph', (G) => G.morph()],
    ['05_arcane', (G) => G.castSkill(0)],
    ['06_arcane2', (G) => G.castSkill(2)],
    ['07_after', (G) => G.attackNearest()],
  ];
  for (const [name, fn] of shots) {
    await p.evaluate((src) => { const G = window.__G; G.player.hp = G.D.maxHp; G.player.mp = G.D.maxMp; G.player.cd = {}; (0, eval)('(' + src + ')')(G); }, fn.toString());
    await wait(name.endsWith('skill') || name.includes('arcane') ? 180 : 350);
    await p.screenshot({ path: path.join(OUT, `${W}x${H}_fx_${name}.png`) });
    console.log('shot', name);
  }
  console.log('errors', errs.length); for (const e of errs.slice(0, 10)) console.log(' ', e);
  await b.close();
  process.exit(errs.length ? 1 : 0);
})().catch((e) => { console.log('ERR', e.stack || e.message); process.exit(2); });
