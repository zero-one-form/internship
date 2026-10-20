
  /* ================= VFX 2.0: impacts, swooshes, shatters, orbs, shockwaves ================= */
  const vfx = [];
  const VCOL = { blade: ['255,196,90', 'amber'], arcane: ['176,146,255', 'violet'] };
  function addVfx(o) { if (opt().lite && (o.k === 'orb' || o.k === 'speed' || o.k === 'scorch') && Math.random() < 0.7) return o; o.t = 0; vfx.push(o); if (vfx.length > 180) vfx.shift(); return o; }
  function formCol() { return VCOL[player.form] || VCOL.blade; }
  function vfxHit(e, crit) {
    const c = formCol(), h = bodyH(e);
    addVfx({ k: 'hit', x: e.x, y: e.y, h, a: Math.random() * Math.PI, c: c[0], g: c[1], crit, life: crit ? 0.26 : 0.17 });
    if (player.form === 'blade') addVfx({ k: 'swoosh', x: e.x, y: e.y, h: h * 0.9, a: (Math.random() - 0.5) * 1.6, dir: Math.random() < 0.5 ? 1 : -1, c: c[0], big: crit, life: crit ? 0.24 : 0.18 });
    burst(e.x, e.y, h, 'spark', crit ? 12 : 5, crit ? 'white' : c[1], crit ? 4.2 : 3);
    if (crit) addVfx({ k: 'speed', life: 0.18, a: 0.35 });
  }
  function vfxKill(e) {
    const c = e.boss ? ['255,120,200', 'violet'] : e.elite ? ['255,214,107', 'gold'] : formCol();
    const h = bodyH(e), big = e.boss ? 3 : e.elite ? 1.8 : 1;
    addVfx({ k: 'kill', x: e.x, y: e.y, h, c: c[0], g: c[1], big, life: 0.45 * Math.sqrt(big) });
    addVfx({ k: 'ring', x: e.x, y: e.y, R: 1.1 * big, c: c[0], w: 5 * big, life: 0.4 + 0.15 * big });
    burst(e.x, e.y, h, 'spark', Math.round(10 * big), 'white', 5 * Math.sqrt(big));
    burst(e.x, e.y, h * 0.7, 'magic', Math.round(8 * big), c[1], 3);
    const n = e.boss ? 18 : e.elite ? 8 : 3;
    for (let i = 0; i < n; i++) addVfx({ k: 'orb', sx: e.x + rand(-0.3, 0.3), sy: e.y + rand(-0.3, 0.3), sh: h, ox: rand(-1.4, 1.4), oy: rand(-1.4, 1.4), g: i % 3 === 2 || e.elite ? 'gold' : 'cyan', life: 0.55 + Math.random() * 0.35, d: i * 0.03 });
    if (e.boss) addVfx({ k: 'sflash', c: '255,240,255', a: 0.7, life: 0.5 });
    else if (e.elite) addVfx({ k: 'sflash', c: '255,230,150', a: 0.1, life: 0.22 });
  }
  function vfxExplode(x, y, r) {
    addVfx({ k: 'explode', x, y, R: r, life: 0.55 });
    addVfx({ k: 'ring', x, y, R: r * 1.5, c: '255,170,70', w: 7, life: 0.45 });
    addVfx({ k: 'scorch', x, y, R: r * 0.9, life: 3 });
    burst(x, y, 10, 'ember', 18, 'warm', 4.5);
    for (let i = 0; i < 6; i++) addPart({ k: 'smoke', x: x + rand(-0.4, 0.4) * r, y: y + rand(-0.4, 0.4) * r, z: rand(6, 20), vx: rand(-0.3, 0.3), vy: rand(-0.3, 0.3), vz: rand(10, 24), t: 0, life: rand(0.9, 1.5), s: rand(0.8, 1.4), c: '' });
  }
  function vfxScanFx() {
    for (const f of fx) {
      if (f._v) continue;
      f._v = 1;
      if (f.k === 'lvl') {
        addVfx({ k: 'pillar', x: player.x, y: player.y, c: '255,214,90', life: 1.1 });
        addVfx({ k: 'ring', x: player.x, y: player.y, R: 2.6, c: '255,214,90', w: 8, life: 0.7 });
        addVfx({ k: 'ring', x: player.x, y: player.y, R: 1.6, c: '255,255,230', w: 4, life: 0.5 });
        addVfx({ k: 'sflash', c: '255,224,140', a: 0.22, life: 0.4 });
        burst(player.x, player.y, 6, 'gold', 30, 'gold', 4);
      } else if (f.x == null) continue;
      else if (f.k === 'spin') { addVfx({ k: 'ring', x: f.x, y: f.y, R: (f.R || 1.6) * 1.15, c: '255,196,90', w: 6, life: 0.4 }); burst(f.x, f.y, 2, 'dust', 14, '', 3.5); }
      else if (f.k === 'morph') { const c = f.c === 'amber' ? '255,196,90' : '176,146,255'; addVfx({ k: 'ring', x: f.x, y: f.y, R: 2.4, c, w: 7, life: 0.55 }); addVfx({ k: 'pillar', x: f.x, y: f.y, c, life: 0.6 }); addVfx({ k: 'sflash', c, a: 0.14, life: 0.28 }); }
      else if (f.k === 'cry') addVfx({ k: 'ring', x: f.x, y: f.y, R: 3.2, c: '255,90,90', w: 9, life: 0.6 });
      else if (f.k === 'auraburst') { addVfx({ k: 'ring', x: f.x, y: f.y, R: 2.8, c: '255,214,90', w: 9, life: 0.6 }); addVfx({ k: 'pillar', x: f.x, y: f.y, c: '255,200,80', life: 0.8 }); addVfx({ k: 'sflash', c: '255,210,120', a: 0.16, life: 0.32 }); }
      else if (f.k === 'vortex') addVfx({ k: 'ring', x: f.x, y: f.y, R: 3, c: '176,146,255', w: 6, inv: true, life: 0.7 });
      else if (f.k === 'impact') addVfx({ k: 'ring', x: f.x, y: f.y, R: 1.4, c: '255,214,140', w: 6, life: 0.35 });
      else if (f.k === 'rend' && f.ux != null) { for (let i = 1; i <= 5; i++) { const u = i / 5 * (f.len || 3); burst(f.x + f.ux * u, f.y + f.uy * u, 3, 'dust', 4, '', 3); addVfx({ k: 'ring', x: f.x + f.ux * u, y: f.y + f.uy * u, R: 0.8, c: '255,170,80', w: 4, life: 0.3 + i * 0.04 }); } }
      else if (f.k === 'lance' && f.ux != null) { const L = f.len || 5; addVfx({ k: 'hit', x: f.x + f.ux * L, y: f.y + f.uy * L, h: 20, a: 0, c: '150,230,255', g: 'cyan', crit: true, life: 0.3 }); }
      else if (f.k === 'chain' && f.pts) for (let n = 1; n < f.pts.length; n++) addVfx({ k: 'ring', x: f.pts[n][0], y: f.pts[n][1], R: 0.9, c: '150,230,255', w: 4, life: 0.3 });
    }
  }
  function vfxUpdate(dt) {
    vfxScanFx();
    for (let i = vfx.length - 1; i >= 0; i--) {
      const v = vfx[i];
      v.t += dt;
      if (v.t >= v.life + (v.d || 0)) {
        vfx.splice(i, 1);
        if (v.k === 'orb' && !player.dead) addVfx({ k: 'pop', g: v.g, life: 0.22 });
      }
    }
  }
  function vfxGround() {
    ctx.save();
    for (const v of vfx) {
      const k = v.t / v.life;
      if (v.k === 'scorch') {
        const x0 = isoX(v.x, v.y), y0 = isoY(v.x, v.y), r = v.R * 45 * zoom;
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.38 * (1 - k);
        const g = ctx.createRadialGradient(x0, y0, 0, x0, y0, r); g.addColorStop(0, 'rgba(20,10,6,1)'); g.addColorStop(1, 'rgba(20,10,6,0)');
        ctx.fillStyle = g; ctx.save(); ctx.translate(x0, y0); ctx.scale(1, 0.5); ctx.translate(-x0, -y0); ctx.beginPath(); ctx.arc(x0, y0, r, 0, TAU); ctx.fill(); ctx.restore();
      }
    }
    ctx.restore();
  }
  function vfxDraw() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const v of vfx) {
      if (v.d && v.t < v.d) continue;
      const k = Math.min(1, (v.t - (v.d || 0)) / v.life), a = 1 - k;
      if (v.k === 'ring') {
        const x0 = isoX(v.x, v.y), y0 = isoY(v.x, v.y), e = v.inv ? 1 - (1 - Math.pow(1 - k, 3)) : 1 - Math.pow(1 - k, 3), r = v.R * 45.25 * zoom * (0.15 + 0.85 * e);
        ctx.globalAlpha = a;
        ctx.strokeStyle = 'rgba(' + v.c + ',1)'; ctx.lineWidth = Math.max(1, v.w * zoom * (1 - k * 0.7));
        ctx.beginPath(); ctx.ellipse(x0, y0, r, r * 0.5, 0, 0, TAU); ctx.stroke();
        ctx.globalAlpha = a * 0.5; ctx.strokeStyle = 'rgba(255,255,255,1)'; ctx.lineWidth = Math.max(1, v.w * zoom * 0.3 * (1 - k));
        ctx.beginPath(); ctx.ellipse(x0, y0, r * 0.97, r * 0.485, 0, 0, TAU); ctx.stroke();
      } else if (v.k === 'hit') {
        const x0 = isoX(v.x, v.y), y0 = isoY(v.x, v.y) - v.h * zoom, s = v.crit ? 1.7 : 1, pk = Math.sin(Math.min(1, k * 1.6) * Math.PI);
        const cr = 26 * zoom * s * (1 - k * 0.6);
        ctx.globalAlpha = a; ctx.drawImage(GLOW.white.img, x0 - cr, y0 - cr, cr * 2, cr * 2);
        ctx.globalAlpha = a * 0.8; const gr = cr * 1.8; ctx.drawImage(GLOW[v.g].img, x0 - gr, y0 - gr, gr * 2, gr * 2);
        const n = v.crit ? 8 : 4, L = (v.crit ? 58 : 34) * zoom * pk;
        for (let i = 0; i < n; i++) {
          const an = v.a + i / n * TAU, l = L * (i % 2 ? 0.55 : 1), w = (v.crit ? 3.4 : 2.4) * zoom * (1 - k);
          ctx.globalAlpha = a;
          ctx.fillStyle = 'rgba(255,255,255,1)';
          ctx.save(); ctx.translate(x0, y0); ctx.rotate(an);
          ctx.beginPath(); ctx.moveTo(0, -w); ctx.lineTo(l, 0); ctx.lineTo(0, w); ctx.closePath(); ctx.fill();
          ctx.restore();
        }
        ctx.globalAlpha = a * 0.9; ctx.strokeStyle = 'rgba(' + v.c + ',1)'; ctx.lineWidth = 2.5 * zoom * (1 - k);
        const rr = (6 + 34 * Math.sqrt(k)) * zoom * s; ctx.beginPath(); ctx.ellipse(x0, y0, rr, rr * 0.7, 0, 0, TAU); ctx.stroke();
      } else if (v.k === 'swoosh') {
        const x0 = isoX(v.x, v.y), y0 = isoY(v.x, v.y) - v.h * zoom, R = (v.big ? 44 : 34) * zoom, head = -1.3 + 2.8 * Math.min(1, k * 2.2);
        ctx.save(); ctx.translate(x0, y0); ctx.rotate(v.a); ctx.scale(v.dir, 0.55);
        for (let i = 0; i < 9; i++) {
          const t0 = head - i * 0.13, t1 = t0 - 0.16;
          if (t0 < -1.3) break;
          ctx.globalAlpha = a * (1 - i / 9);
          ctx.strokeStyle = i < 2 ? 'rgba(255,255,255,1)' : 'rgba(' + v.c + ',1)';
          ctx.lineWidth = (v.big ? 11 : 8) * zoom * (1 - i / 10);
          ctx.beginPath(); ctx.arc(0, 0, R, Math.max(-1.3, t1), t0); ctx.stroke();
        }
        ctx.restore();
      } else if (v.k === 'kill') {
        const x0 = isoX(v.x, v.y), y0 = isoY(v.x, v.y), hh = v.h * zoom, s = v.big;
        const fr = 40 * zoom * s * (0.6 + k);
        ctx.globalAlpha = a * a; ctx.drawImage(GLOW.white.img, x0 - fr, y0 - hh - fr, fr * 2, fr * 2);
        ctx.globalAlpha = a; ctx.drawImage(GLOW[v.g].img, x0 - fr * 1.6, y0 - hh - fr * 1.6, fr * 3.2, fr * 3.2);
        const ph = 120 * zoom * s * (0.4 + k), pw = 7 * zoom * s * (1 - k);
        const g = ctx.createLinearGradient(0, y0 - hh - ph, 0, y0);
        g.addColorStop(0, 'rgba(' + v.c + ',0)'); g.addColorStop(0.6, 'rgba(' + v.c + ',' + (0.7 * a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,255,255,' + (0.8 * a).toFixed(3) + ')');
        ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(x0 - pw, y0 - hh - ph, pw * 2, ph + hh * 0.6);
      } else if (v.k === 'explode') {
        const x0 = isoX(v.x, v.y), y0 = isoY(v.x, v.y) - 12 * zoom, e = 1 - Math.pow(1 - k, 3), r = v.R * 52 * zoom * (0.3 + 0.7 * e);
        const g = ctx.createRadialGradient(x0, y0, 0, x0, y0, r);
        g.addColorStop(0, 'rgba(255,255,230,' + (a * a).toFixed(3) + ')'); g.addColorStop(0.35, 'rgba(255,190,80,' + (0.85 * a).toFixed(3) + ')'); g.addColorStop(0.7, 'rgba(255,90,30,' + (0.5 * a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(120,20,0,0)');
        ctx.globalAlpha = 1; ctx.fillStyle = g;
        ctx.save(); ctx.translate(x0, y0); ctx.scale(1, 0.72); ctx.translate(-x0, -y0); ctx.beginPath(); ctx.arc(x0, y0, r, 0, TAU); ctx.fill(); ctx.restore();
      } else if (v.k === 'pillar') {
        const x0 = isoX(v.x, v.y), y0 = isoY(v.x, v.y), ph = 260 * zoom, pw = 30 * zoom * (1 - k * 0.7) * Math.min(1, k * 8);
        const g = ctx.createLinearGradient(0, y0 - ph, 0, y0);
        g.addColorStop(0, 'rgba(' + v.c + ',0)'); g.addColorStop(0.7, 'rgba(' + v.c + ',' + (0.55 * a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,255,255,' + (0.8 * a).toFixed(3) + ')');
        ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(x0 - pw, y0 - ph, pw * 2, ph);
        ctx.fillRect(x0 - pw * 0.25, y0 - ph, pw * 0.5, ph);
      } else if (v.k === 'orb') {
        const e = k * k * (3 - 2 * k), mx = v.sx + v.ox, my = v.sy + v.oy;
        const bx = (1 - e) * (1 - e) * v.sx + 2 * (1 - e) * e * mx + e * e * player.x, by = (1 - e) * (1 - e) * v.sy + 2 * (1 - e) * e * my + e * e * player.y;
        const hz = (1 - e) * v.sh + e * 30 + Math.sin(e * Math.PI) * 40;
        const x0 = isoX(bx, by), y0 = isoY(bx, by) - hz * zoom, r = 9 * zoom;
        ctx.globalAlpha = 0.9; ctx.drawImage(GLOW[v.g].img, x0 - r, y0 - r, r * 2, r * 2);
        ctx.globalAlpha = 1; ctx.drawImage(GLOW.white.img, x0 - r * 0.35, y0 - r * 0.35, r * 0.7, r * 0.7);
      } else if (v.k === 'pop') {
        const x0 = isoX(player.x, player.y), y0 = isoY(player.x, player.y) - 30 * zoom, r = (8 + 26 * k) * zoom;
        ctx.globalAlpha = a * 0.8; ctx.drawImage(GLOW[v.g].img, x0 - r, y0 - r, r * 2, r * 2);
      } else if (v.k === 'drop') {
        const x0 = isoX(v.x, v.y), y0 = isoY(v.x, v.y) - 10 * zoom, col = v.c >= 3 ? '255,122,42' : '227,180,44', L = (v.c >= 3 ? 90 : 60) * zoom * Math.sin(Math.min(1, k * 1.4) * Math.PI);
        for (let i = 0; i < 6; i++) { ctx.globalAlpha = a; ctx.fillStyle = 'rgba(' + col + ',1)'; ctx.save(); ctx.translate(x0, y0); ctx.rotate(i / 6 * TAU + k); ctx.beginPath(); ctx.moveTo(0, -3 * zoom); ctx.lineTo(L * (i % 2 ? 0.6 : 1), 0); ctx.lineTo(0, 3 * zoom); ctx.closePath(); ctx.fill(); ctx.restore(); }
        const r = 50 * zoom * (1 - k * 0.4); ctx.globalAlpha = a; ctx.drawImage(GLOW[v.c >= 3 ? 'warm' : 'gold'].img, x0 - r, y0 - r, r * 2, r * 2);
      }
    }
    ctx.restore();
  }
  function vfxScreen() {
    ctx.save();
    const px = isoX(player.x, player.y), py = isoY(player.x, player.y) - 30 * zoom;
    for (const v of vfx) {
      const k = v.t / v.life, a = 1 - k;
      if (v.k === 'sflash') { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = v.a * a * a; ctx.fillStyle = 'rgb(' + v.c + ')'; ctx.fillRect(0, 0, W, H); }
      else if (v.k === 'speed') {
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = v.a * a; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
        const R = Math.hypot(W, H) * 0.6;
        for (let i = 0; i < 28; i++) { const an = (i / 28) * TAU + (i * 7.3 % 1) * 0.2, r0 = R * (0.45 + ((i * 13) % 7) / 20); ctx.beginPath(); ctx.moveTo(px + Math.cos(an) * r0, py + Math.sin(an) * r0); ctx.lineTo(px + Math.cos(an) * R * 1.4, py + Math.sin(an) * R * 1.4); ctx.stroke(); }
      }
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    const R = Math.hypot(W, H) / 2;
    if (player.frenzyT > 0 && !player.dead) {
      const p = 0.5 + 0.5 * Math.sin(time * 6), g = ctx.createRadialGradient(W / 2, H / 2, R * 0.55, W / 2, H / 2, R);
      g.addColorStop(0, 'rgba(255,190,60,0)'); g.addColorStop(1, 'rgba(255,170,40,' + (0.18 + 0.12 * p) * Math.min(1, player.frenzyT) + ')');
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (D && player.hp < D.maxHp * 0.3 && !player.dead) {
      const p = 0.5 + 0.5 * Math.sin(time * 5), g = ctx.createRadialGradient(W / 2, H / 2, R * 0.5, W / 2, H / 2, R);
      g.addColorStop(0, 'rgba(160,0,20,0)'); g.addColorStop(1, 'rgba(160,0,20,' + (0.25 + 0.2 * p) + ')');
      ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }
