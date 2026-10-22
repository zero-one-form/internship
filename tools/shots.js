const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const W = +process.argv[2] || 390, H = +process.argv[3] || 844, tag = process.argv[4] || 'p';
(async () => {
  const b = await puppeteer.launch({ executablePath: await chromium.executablePath(), args: chromium.args.concat(['--allow-file-access-from-files']), headless: true, defaultViewport: { width: W, height: H, deviceScaleFactor: 2, isMobile: true, hasTouch: true } });
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.evaluateOnNewDocument(() => { window.__TEST__ = true; try { localStorage.clear(); } catch (e) {} });
  await p.goto('file:///home/claude/twinsoul8.html', { waitUntil: 'load', timeout: 120000 });
  await p.waitForFunction(() => !document.getElementById('startBtn').disabled, { timeout: 120000 });
  await p.click('#startBtn');
  await new Promise((r) => setTimeout(r, 2500));
  const hasG = await p.evaluate(() => !!window.__G);
  if (hasG) await p.evaluate(() => { const G = window.__G; G.prog.gold = 1234; G.prog.sp = 3; G.prog.kp = 2; G.learn && 0; });
  await new Promise((r) => setTimeout(r, 600));
  await p.screenshot({ path: '/home/claude/br/' + tag + '_hud.png' });
  if (hasG) {
    await p.evaluate(() => {
      const G = window.__G;
      for (let i = 0; i < 14; i++) { const it = G.genItem(3 + (i % 4), i % 4); if (i % 5 === 0) it.lock = true; G.prog.inv.push(it); }
      G.openSheet(); G.setTab('gear');
      const it = G.prog.inv.find((x) => x.type === 'sword' && x.rar >= 1) || G.prog.inv[0];
      G.selInv(it);
    });
    await new Promise((r) => setTimeout(r, 400));
    await p.screenshot({ path: '/home/claude/br/' + tag + '_gear.png' });
    await p.evaluate(() => { const G = window.__G; G.setBulk(true); G.bulkPick(1); });
    await new Promise((r) => setTimeout(r, 300));
    await p.evaluate(() => { const pn = document.querySelector('#sheet .panel'); pn.scrollTop = pn.scrollHeight; });
    await p.screenshot({ path: '/home/claude/br/' + tag + '_bulk.png' });
    await p.evaluate(() => { const G = window.__G; G.setBulk(false); G.setTab('opt'); });
    await p.screenshot({ path: '/home/claude/br/' + tag + '_opt.png' });
  }
  console.log('hasG', hasG, 'errors', errs.length, errs.slice(0, 5));
  await b.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
