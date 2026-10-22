// Heroine artwork drawn as vector (SVG) and rendered to transparent PNG/WebP for the game.
// Usage: node tools/art/heroines.js [outDir]   (default: assets/heroines; needs Chromium + Python/Pillow for WebP)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const puppeteer = require('puppeteer-core');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'assets', 'heroines'));

const C = {
  mina: {
    hair: ['#f7dc94', '#e2b25a', '#b9822f'], hairLine: '#8a5a22', eye: ['#1f5a35', '#3fae62', '#b8f0c8'], skin: '#ffeee4', skinS: '#f6cdbd',
    cloth: ['#2f7a4c', '#1c4e31', '#123522'], trim: '#e9c25a', inner: '#f6efdc'
  },
  aria: {
    hair: ['#ffffff', '#ece6ff', '#b8a2f2'], hairLine: '#8c7ac8', eye: ['#a8661a', '#f2c23c', '#fff4b8'], skin: '#fff3ee', skinS: '#f4d4cc',
    cloth: ['#ffffff', '#f4ecdc', '#d9c9a8'], trim: '#e2b64a', inner: '#ffffff'
  }
};

/* ---------- shared face parts (bust coordinates: 768 x 1024, face centre x=384) ---------- */
function defs(id) {
  const P = C[id];
  return `<defs>
  <linearGradient id="hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.hair[0]}"/><stop offset=".55" stop-color="${P.hair[1]}"/><stop offset="1" stop-color="${P.hair[2]}"/></linearGradient>
  <linearGradient id="hairBack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.hair[1]}"/><stop offset="1" stop-color="${P.hair[2]}"/></linearGradient>
  <radialGradient id="iris" cx=".5" cy=".62" r=".62"><stop offset="0" stop-color="${P.eye[2]}"/><stop offset=".45" stop-color="${P.eye[1]}"/><stop offset="1" stop-color="${P.eye[0]}"/></radialGradient>
  <linearGradient id="cloth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.cloth[0]}"/><stop offset=".6" stop-color="${P.cloth[1]}"/><stop offset="1" stop-color="${P.cloth[2]}"/></linearGradient>
  <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.skin}"/><stop offset="1" stop-color="${P.skinS}"/></linearGradient>
  <radialGradient id="blush" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff8fa0" stop-opacity=".55"/><stop offset="1" stop-color="#ff8fa0" stop-opacity="0"/></radialGradient>
  <radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6c8" stop-opacity=".95"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient>
  <radialGradient id="halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f4eeff" stop-opacity=".75"/><stop offset=".6" stop-color="#d9ccff" stop-opacity=".25"/><stop offset="1" stop-color="#d9ccff" stop-opacity="0"/></radialGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
</defs>`;
}
function eye(cx, cy, flip, P, expr) {
  const s = flip ? -1 : 1, t = (x, y) => `${cx + s * x},${cy + y}`;
  if (expr === 'smile') {
    // happy closed eyes: thick arcs with a lash flick
    return `<path d="M${t(-40, 8)} Q${t(0, -30)} ${t(42, 6)}" fill="none" stroke="#2b1a22" stroke-width="9" stroke-linecap="round"/>
<path d="M${t(36, 2)} L${t(52, -6)}" stroke="#2b1a22" stroke-width="6" stroke-linecap="round"/>`;
  }
  const lidY = expr === 'sad' ? -14 : -26;
  return `<g>
<path d="M${t(-42, 2)} Q${t(-36, lidY - 12)} ${t(0, lidY - 14)} Q${t(38, lidY - 12)} ${t(46, -2)} Q${t(40, 40)} ${t(0, 44)} Q${t(-38, 40)} ${t(-42, 2)} Z" fill="#ffffff"/>
<clipPath id="ec${cx}"><path d="M${t(-42, 2)} Q${t(-36, lidY - 12)} ${t(0, lidY - 14)} Q${t(38, lidY - 12)} ${t(46, -2)} Q${t(40, 40)} ${t(0, 44)} Q${t(-38, 40)} ${t(-42, 2)} Z"/></clipPath>
<g clip-path="url(#ec${cx})">
  <ellipse cx="${cx + s * 2}" cy="${cy + 10}" rx="31" ry="40" fill="url(#iris)"/>
  <ellipse cx="${cx + s * 2}" cy="${cy + 12}" rx="14" ry="20" fill="${P.eye[0]}" opacity=".85"/>
  <path d="M${t(-34, -14)} Q${t(0, -30)} ${t(36, -14)} L${t(36, -2)} Q${t(0, -16)} ${t(-34, -2)} Z" fill="#000" opacity=".22"/>
  <ellipse cx="${cx + s * 14}" cy="${cy - 6}" rx="10" ry="12" fill="#fff"/>
  <circle cx="${cx - s * 12}" cy="${cy + 26}" r="5" fill="#fff" opacity=".9"/>
</g>
<path d="M${t(-46, 6)} Q${t(-38, lidY - 16)} ${t(0, lidY - 18)} Q${t(40, lidY - 16)} ${t(54, -10)}" fill="none" stroke="#2b1a22" stroke-width="9" stroke-linecap="round"/>
<path d="M${t(46, -4)} L${t(60, -14)}" stroke="#2b1a22" stroke-width="6" stroke-linecap="round"/>
<path d="M${t(-24, 46)} Q${t(0, 50)} ${t(24, 44)}" fill="none" stroke="#2b1a22" stroke-width="3" stroke-linecap="round" opacity=".6"/>
</g>`;
}
function face(id, expr) {
  const P = C[id];
  const brow = expr === 'sad'
    ? `<path d="M280 318 Q306 314 340 300" fill="none" stroke="${P.hairLine}" stroke-width="4" stroke-linecap="round" opacity=".8"/><path d="M488 318 Q462 314 428 300" fill="none" stroke="${P.hairLine}" stroke-width="4" stroke-linecap="round" opacity=".8"/>`
    : `<path d="M280 318 Q306 300 340 306" fill="none" stroke="${P.hairLine}" stroke-width="4" stroke-linecap="round" opacity=".8"/><path d="M488 318 Q462 300 428 306" fill="none" stroke="${P.hairLine}" stroke-width="4" stroke-linecap="round" opacity=".8"/>`;
  const mouth = expr === 'smile'
    ? `<path d="M356 506 Q384 548 412 506 Q384 516 356 506 Z" fill="#c0505e"/><path d="M366 522 Q384 540 402 522 Q384 528 366 522 Z" fill="#ff8f9c"/>`
    : expr === 'sad'
      ? `<path d="M368 520 Q384 510 400 520" fill="none" stroke="#a04654" stroke-width="5" stroke-linecap="round"/>`
      : id === 'aria'
        ? `<ellipse cx="384" cy="516" rx="9" ry="7" fill="#c0505e"/>`
        : `<path d="M364 512 Q384 526 404 512" fill="none" stroke="#a04654" stroke-width="5" stroke-linecap="round"/>`;
  return `
<path d="M246 360 Q246 252 384 242 Q522 252 522 360 Q522 462 470 516 Q424 566 384 570 Q344 566 298 516 Q246 462 246 360 Z" fill="url(#skin)"/>
<path d="M300 520 Q340 560 384 566 Q428 560 468 520 Q440 590 384 596 Q328 590 300 520 Z" fill="${P.skinS}" opacity=".0"/>
<ellipse cx="300" cy="470" rx="34" ry="18" fill="url(#blush)"/><ellipse cx="468" cy="470" rx="34" ry="18" fill="url(#blush)"/>
${eye(316, 412, true, P, expr)}${eye(452, 412, false, P, expr)}
${brow}
<path d="M386 458 Q392 470 384 474" fill="none" stroke="#d29a8a" stroke-width="4" stroke-linecap="round"/>
${mouth}`;
}
function neck(P) {
  return `<path d="M352 540 L352 628 Q384 646 416 628 L416 540 Z" fill="url(#skin)"/>
<path d="M352 548 Q384 596 416 548 L416 584 Q384 612 352 584 Z" fill="${P.skinS}" opacity=".75"/>`;
}

/* ---------- Mina ---------- */
function minaBust(expr) {
  const P = C.mina;
  const braid = Array.from({ length: 8 }, (_, i) => {
    const y = 560 + i * 52, x = 560 + Math.sin(i * 0.6) * 10 + i * 4, w = 38 - i * 2;
    return `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="34" fill="url(#hair)" stroke="${P.hairLine}" stroke-width="3" transform="rotate(${-18 + (i % 2) * 22} ${x} ${y})"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="1024" viewBox="0 0 768 1024">${defs('mina')}
<!-- staff -->
<g><rect x="636" y="230" width="18" height="800" rx="9" fill="#8a5a2c" stroke="#5a3814" stroke-width="3"/>
<circle cx="645" cy="214" r="58" fill="url(#glow)"/><circle cx="645" cy="214" r="18" fill="#fff2b0" stroke="#d8a840" stroke-width="4"/>
<path d="M645 232 Q600 210 590 160 Q630 170 645 214 Z" fill="#7fd06a" stroke="#3c7a30" stroke-width="3"/><path d="M650 228 Q700 200 712 150 Q668 166 650 212 Z" fill="#9ae07e" stroke="#3c7a30" stroke-width="3"/></g>
<!-- back hair -->
<path d="M220 360 Q200 220 384 180 Q568 220 548 360 Q566 520 590 700 Q560 690 548 720 Q520 690 496 712 Q470 680 440 700 L328 700 Q298 680 272 712 Q248 690 220 720 Q208 690 178 700 Q202 520 220 360 Z" fill="url(#hairBack)"/>
<path d="M226 420 Q210 560 196 690 M542 420 Q556 560 572 690" fill="none" stroke="${P.hairLine}" stroke-width="3" opacity=".35"/>
<!-- robe -->
<path d="M120 1024 Q130 760 250 680 Q300 650 348 636 L384 690 L420 636 Q468 650 518 680 Q638 760 648 1024 Z" fill="url(#cloth)" stroke="#0f2a1a" stroke-width="4"/>
<path d="M250 680 Q200 600 260 590 Q330 600 348 636 Q300 660 250 680 Z" fill="${P.cloth[1]}" stroke="#0f2a1a" stroke-width="3"/>
<path d="M518 680 Q568 600 508 590 Q438 600 420 636 Q468 660 518 680 Z" fill="${P.cloth[1]}" stroke="#0f2a1a" stroke-width="3"/>
<path d="M348 636 L384 760 L420 636" fill="${P.inner}" stroke="${P.trim}" stroke-width="6" stroke-linejoin="round"/>
<path d="M348 636 L384 760 L420 636" fill="none" stroke="${P.trim}" stroke-width="8"/>
<path d="M384 760 L384 1024" stroke="${P.trim}" stroke-width="8"/>
<g fill="none" stroke="${P.trim}" stroke-width="4" opacity=".9">
  <path d="M220 860 q20 -30 40 0 q-20 30 -40 0"/><path d="M200 940 q20 -30 40 0 q-20 30 -40 0"/><path d="M528 860 q-20 -30 -40 0 q20 30 40 0"/><path d="M548 940 q-20 -30 -40 0 q20 30 40 0"/>
</g>
<circle cx="384" cy="700" r="16" fill="${P.trim}" stroke="#8a6a1a" stroke-width="3"/><circle cx="384" cy="700" r="7" fill="#7fd06a"/>
${neck(P)}
${face('mina', expr)}
<!-- side braid over the right shoulder -->
${braid}
<path d="M560 980 l-14 30 l28 0 Z" fill="${P.hair[2]}"/><circle cx="566" cy="975" r="12" fill="${P.trim}"/>
<!-- bangs -->
<path d="M232 380 Q214 230 384 208 Q554 230 536 380 Q520 330 492 300 Q486 350 452 372 Q446 318 420 290 Q404 344 368 360 Q376 310 352 286 Q326 340 290 360 Q300 318 288 300 Q252 330 232 380 Z" fill="url(#hair)" stroke="${P.hairLine}" stroke-width="3" stroke-linejoin="round"/>
<path d="M300 250 Q340 236 380 236" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".55"/>
<path d="M330 230 Q320 280 334 330 M404 224 Q398 280 412 330 M466 240 Q470 280 476 322" fill="none" stroke="${P.hairLine}" stroke-width="2.5" opacity=".4"/>
<path d="M232 380 Q220 470 240 560" fill="none" stroke="url(#hair)" stroke-width="26" stroke-linecap="round"/>
<path d="M536 380 Q550 470 532 540" fill="none" stroke="url(#hair)" stroke-width="26" stroke-linecap="round"/>
<!-- leaf hair pin -->
<path d="M262 292 Q236 262 250 232 Q280 254 262 292 Z" fill="#7fd06a" stroke="#3c7a30" stroke-width="3"/><path d="M270 290 Q300 262 330 270 Q306 298 270 290 Z" fill="#9ae07e" stroke="#3c7a30" stroke-width="3"/>
</svg>`;
}

/* ---------- Aria ---------- */
function ariaBust(expr) {
  const P = C.aria;
  const sparks = [[150, 300, 10], [620, 260, 14], [120, 640, 8], [660, 560, 11], [200, 860, 9], [590, 820, 12], [680, 420, 7]].map(([x, y, r]) =>
    `<path d="M${x} ${y - r * 2} L${x + r * 0.5} ${y - r * 0.5} L${x + r * 2} ${y} L${x + r * 0.5} ${y + r * 0.5} L${x} ${y + r * 2} L${x - r * 0.5} ${y + r * 0.5} L${x - r * 2} ${y} L${x - r * 0.5} ${y - r * 0.5} Z" fill="#fff6c8" opacity=".9"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="1024" viewBox="0 0 768 1024">${defs('aria')}
<circle cx="384" cy="440" r="380" fill="url(#halo)"/>
${sparks}
<!-- long back hair, fading to lavender -->
<path d="M206 360 Q190 210 384 172 Q578 210 562 360 Q600 600 640 1024 L128 1024 Q168 600 206 360 Z" fill="url(#hairBack)"/>
<path d="M200 600 Q180 820 150 1024 M568 600 Q590 820 618 1024 M240 700 Q230 860 222 1024 M528 700 Q540 860 548 1024" fill="none" stroke="${P.hairLine}" stroke-width="3" opacity=".35"/>
<!-- dress -->
<path d="M150 1024 Q160 770 262 690 Q312 652 350 640 Q384 664 418 640 Q456 652 506 690 Q608 770 618 1024 Z" fill="url(#cloth)" stroke="#b89a5a" stroke-width="4"/>
<path d="M300 660 Q384 720 468 660" fill="none" stroke="${P.trim}" stroke-width="10" stroke-linecap="round"/>
<g fill="none" stroke="${P.trim}" stroke-width="3" opacity=".75">
  <path d="M200 880 Q384 830 568 880"/><path d="M196 900 Q384 850 572 900"/><path d="M192 920 Q384 870 576 920"/><path d="M188 940 Q384 890 580 940"/><path d="M184 960 Q384 910 584 960"/>
</g>
<g fill="${P.trim}"><ellipse cx="280" cy="902" rx="11" ry="8" transform="rotate(-20 280 902)"/><rect x="288" y="862" width="3" height="40"/><ellipse cx="470" cy="922" rx="11" ry="8" transform="rotate(-20 470 922)"/><rect x="478" y="882" width="3" height="40"/></g>
<path d="M384 700 l14 22 l-14 22 l-14 -22 Z" fill="#b9a6ff" stroke="${P.trim}" stroke-width="4"/>
${neck(P)}
${face('aria', expr)}
<!-- side locks -->
<path d="M222 380 Q196 520 220 700 Q236 800 214 900" fill="none" stroke="url(#hair)" stroke-width="40" stroke-linecap="round"/>
<path d="M546 380 Q572 520 548 700 Q532 800 554 900" fill="none" stroke="url(#hair)" stroke-width="40" stroke-linecap="round"/>
<!-- bangs -->
<path d="M222 390 Q206 222 384 200 Q562 222 546 390 Q530 330 500 296 Q498 356 462 380 Q456 320 428 286 Q410 350 380 366 Q384 312 356 284 Q330 346 294 364 Q302 316 290 296 Q248 330 222 390 Z" fill="url(#hair)" stroke="${P.hairLine}" stroke-width="3" stroke-linejoin="round"/>
<path d="M296 242 Q340 226 390 228" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".8"/>
<path d="M334 226 Q322 284 340 340 M410 220 Q402 284 420 340 M470 240 Q476 290 482 330" fill="none" stroke="${P.hairLine}" stroke-width="2.5" opacity=".35"/>
<!-- glowing note ornament -->
<circle cx="520" cy="250" r="44" fill="url(#glow)"/>
<g fill="#ffd96a" stroke="#c99a2a" stroke-width="3"><ellipse cx="510" cy="268" rx="15" ry="11" transform="rotate(-20 510 268)"/><path d="M522 264 L522 214 Q544 218 552 236 Q538 228 528 230 L528 264 Z"/></g>
</svg>`;
}

/* ---------- chibi (512 x 512, 2.5 heads, three-quarter view facing right) ---------- */
function chibi(id) {
  const P = C[id], mina = id === 'mina';
  const eyeC = (cx, out) => `<ellipse cx="${cx}" cy="236" rx="21" ry="28" fill="#fff"/><ellipse cx="${cx}" cy="240" rx="18" ry="25" fill="url(#iris)"/><ellipse cx="${cx}" cy="244" rx="8" ry="12" fill="${P.eye[0]}"/><circle cx="${cx + 7}" cy="228" r="7" fill="#fff"/><circle cx="${cx - 6}" cy="254" r="3" fill="#fff"/><path d="M${cx - 22 * out} 218 Q${cx} 200 ${cx + 24 * out} 220 L${cx + 31 * out} 224" fill="none" stroke="#2b1a22" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
  const body = mina
    ? `<path d="M196 330 Q170 380 196 420" fill="none" stroke="${P.cloth[1]}" stroke-width="22" stroke-linecap="round"/><circle cx="198" cy="422" r="11" fill="url(#skin)"/>
       <path d="M168 480 Q178 350 256 330 Q334 350 344 480 Z" fill="url(#cloth)" stroke="#0f2a1a" stroke-width="4"/><path d="M316 336 Q344 360 340 404" fill="none" stroke="${P.cloth[1]}" stroke-width="22" stroke-linecap="round"/><circle cx="340" cy="408" r="11" fill="url(#skin)"/><path d="M240 344 L256 400 L272 344" fill="${P.inner}" stroke="${P.trim}" stroke-width="5"/><rect x="236" y="470" width="14" height="22" rx="6" fill="#5a3a22"/><rect x="262" y="470" width="14" height="22" rx="6" fill="#5a3a22"/>
       <rect x="338" y="170" width="10" height="320" rx="5" fill="#8a5a2c" stroke="#5a3814" stroke-width="3" transform="rotate(8 343 330)"/><circle cx="358" cy="168" r="34" fill="url(#glow)"/><circle cx="358" cy="168" r="11" fill="#fff2b0" stroke="#d8a840" stroke-width="3"/><path d="M356 180 Q326 168 322 136 Q348 144 356 168 Z" fill="#7fd06a" stroke="#3c7a30" stroke-width="2"/>`
    : `<path d="M158 486 Q172 350 256 328 Q340 350 354 486 Q256 506 158 486 Z" fill="url(#cloth)" stroke="#b89a5a" stroke-width="4"/><path d="M200 440 Q256 420 312 440 M196 456 Q256 436 316 456" fill="none" stroke="${P.trim}" stroke-width="3"/><path d="M256 360 l9 14 l-9 14 l-9 -14 Z" fill="#b9a6ff" stroke="${P.trim}" stroke-width="3"/>
       <path d="M184 380 Q140 350 120 300" fill="none" stroke="url(#skin)" stroke-width="16" stroke-linecap="round"/><path d="M328 380 Q372 350 392 300" fill="none" stroke="url(#skin)" stroke-width="16" stroke-linecap="round"/>`;
  const backHair = mina
    ? `<path d="M140 230 Q130 110 256 92 Q382 110 372 230 L376 330 Q256 350 136 330 Z" fill="url(#hairBack)"/>`
    : `<path d="M134 230 Q124 100 256 86 Q388 100 378 230 Q400 360 410 470 L102 470 Q112 360 134 230 Z" fill="url(#hairBack)"/>`;
  const extra = mina
    ? `${Array.from({ length: 4 }, (_, i) => `<ellipse cx="${330 + i * 4}" cy="${300 + i * 34}" rx="${22 - i * 2}" ry="22" fill="url(#hair)" stroke="${P.hairLine}" stroke-width="2"/>`).join('')}<path d="M166 160 Q150 136 160 116 Q182 132 166 160 Z" fill="#7fd06a" stroke="#3c7a30" stroke-width="2"/>`
    : `<circle cx="340" cy="120" r="30" fill="url(#glow)"/><g fill="#ffd96a" stroke="#c99a2a" stroke-width="2"><ellipse cx="334" cy="132" rx="10" ry="7" transform="rotate(-20 334 132)"/><path d="M342 130 L342 98 Q356 100 362 112 Q352 106 346 108 L346 130 Z"/></g>
       <path d="M90 150 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 Z M420 260 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3 Z" fill="#fff6c8"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">${defs(id)}
${backHair}${body}
<path d="M150 210 Q150 110 256 104 Q362 110 362 210 Q362 290 300 318 Q256 336 212 318 Q150 290 150 210 Z" fill="url(#skin)"/>
<ellipse cx="190" cy="278" rx="22" ry="12" fill="url(#blush)"/><ellipse cx="324" cy="278" rx="22" ry="12" fill="url(#blush)"/>
${eyeC(206, -1)}${eyeC(306, 1)}
<path d="M248 292 Q258 300 268 292" fill="none" stroke="#a04654" stroke-width="4" stroke-linecap="round"/>
<path d="M140 236 Q126 104 256 92 Q386 104 372 236 Q356 180 330 160 Q326 200 300 214 Q296 172 274 154 Q262 196 236 206 Q238 170 220 154 Q200 196 172 206 Q178 176 170 162 Q148 190 140 236 Z" fill="url(#hair)" stroke="${P.hairLine}" stroke-width="3" stroke-linejoin="round"/>
<path d="M190 124 Q226 112 262 112" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".7"/>
${extra}
</svg>`;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const jobs = [];
  for (const ex of ['normal', 'smile', 'sad']) { jobs.push(['mina_bust_' + ex, minaBust(ex), 768, 1024]); jobs.push(['aria_bust_' + ex, ariaBust(ex), 768, 1024]); }
  jobs.push(['mina_chibi', chibi('mina'), 512, 512], ['aria_chibi', chibi('aria'), 512, 512]);
  const exe = process.env.CHROME || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : require('@sparticuz/chromium').executablePath());
  const b = await puppeteer.launch({ executablePath: await exe, headless: true, args: ['--no-sandbox'] });
  const p = await b.newPage();
  for (const [name, svg, w, h] of jobs) {
    fs.writeFileSync(path.join(__dirname, name + '.svg'), svg);
    await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    const png = path.join(OUT, name + '.png');
    await p.screenshot({ path: png, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
    console.log('rendered', name);
  }
  await b.close();
  // PNG -> trimmed WebP via the same tool used for AI images (keeps transparency as-is)
  for (const [name] of jobs) {
    const png = path.join(OUT, name + '.png');
    execFileSync('python3', [path.join(ROOT, 'tools', 'cutout.py'), png], { stdio: 'inherit' });
    fs.unlinkSync(png);
  }
})().catch((e) => { console.error(e); process.exit(1); });
