const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: await chromium.executablePath(), args: chromium.args.concat(['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required']), headless: true, defaultViewport: { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true } });
  const errs = [];
  const q = await b.newPage();
  q.on('pageerror', (e) => errs.push('flow: ' + e.message));
  await q.evaluateOnNewDocument(() => { window.__TEST__ = true; try { localStorage.clear(); } catch (e) {} });
  await q.goto('file:///home/claude/twinsoul14.html', { waitUntil: 'load', timeout: 120000 });
  await q.waitForFunction(() => !document.getElementById('startBtn').disabled, { timeout: 120000 });
  await q.evaluate(() => new Promise((res) => window.__G.opCapture(() => {}, res)));
  const dec = await q.evaluate(() => new Promise((res) => { const G = window.__G; G.opLoadSong(); const t0 = performance.now(); (function chk() { if (G.OP.song || G.OP.songFail || performance.now() - t0 > 15000) res({ ok: !!G.OP.song, fail: !!G.OP.songFail, dur: G.OP.song && G.OP.song.duration, ms: Math.round(performance.now() - t0) }); else setTimeout(chk, 100); })(); }));
  console.log('decode', JSON.stringify(dec));
  await q.evaluate(() => window.__G.startOP(null));
  await sleep(3000);
  console.log('playing', JSON.stringify(await q.evaluate(() => { const G = window.__G; return { audio: G.OP.audio, ctx: G.AU.ctx && G.AU.ctx.state, t: +(G.AU.ctx.currentTime - G.OP.t0).toFixed(2) }; })));
  await q.evaluate(() => window.__G.opFinish());
  const marks = [1.5, 4.5, 7.5, 9.6, 11.8, 13.3, 14.4, 16.1, 18.0, 19.9, 21.6, 23.3, 24.4, 26.0, 28.0, 30.5, 34.0, 38.6, 41.0, 44.8, 46.9, 49.0, 52.0, 54.0, 56.5, 58.6, 62.0, 66.0];
  await q.evaluate(() => { window.__G.startOP(null); window.__G.opSeek(0); });
  let i = 0;
  for (const m of marks) { await q.evaluate((t) => window.__G.opSeek(t), m); await sleep(300); await q.screenshot({ path: '/home/claude/br/s' + String(i++).padStart(2, '0') + '.png' }); }
  console.log('errors', errs);
  await b.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
