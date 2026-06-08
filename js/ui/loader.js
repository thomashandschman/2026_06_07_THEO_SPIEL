// loader.js — Cooler Ninja-Intro beim Laden des Spiels.
// Eigenständige Canvas-Animation (prozedural, keine Bilddateien):
// Ein Ninja macht einen Salto ins Bild, landet mit Schockwelle, wirft
// Wurfsterne und der Neon-Schriftzug + Ladebalken erscheinen.
// Tippen/Taste überspringt, `prefers-reduced-motion` wird respektiert.

import { VIRT_W, VIRT_H, THEMES, STRINGS } from '../config.js';

const DURATION = 3.0;   // s bis der Intro automatisch endet
const FADE = 0.45;      // s Ausblendzeit

// Ninja-Farben passend zum Neon-Logo (Pink-Akzent, Cyan-Augen).
const SKIN = { body: '#23233f', accent: '#ff2e63', eye: '#7afcff' };

export function runIntro(onDone) {
  const overlay = document.getElementById('screen-loading');
  const canvas = document.getElementById('loader-canvas');
  if (!overlay || !canvas) { onDone(); return; }

  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Letterbox-Transform wie im Spiel (virtuelles 540×960-Feld) --------
  let dpr = 1, scale = 1, offX = 0, offY = 0;
  function resize() {
    const vw = window.innerWidth, vh = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    canvas.style.width = vw + 'px';
    canvas.style.height = vh + 'px';
    scale = Math.min(vw / VIRT_W, vh / VIRT_H);
    offX = (vw - VIRT_W * scale) / 2;
    offY = (vh - VIRT_H * scale) / 2;
  }
  resize();
  window.addEventListener('resize', resize);

  // --- Sternenfeld + schwebende Funken -----------------------------------
  const stars = [];
  for (let i = 0; i < 90; i++) {
    stars.push({
      x: Math.random() * VIRT_W,
      y: Math.random() * VIRT_H,
      s: 0.6 + Math.random() * 2,
      tw: Math.random() * Math.PI * 2,
    });
  }
  const sparks = [];
  for (let i = 0; i < 26; i++) {
    sparks.push({
      x: Math.random() * VIRT_W,
      y: Math.random() * VIRT_H,
      vy: -8 - Math.random() * 24,
      r: 1 + Math.random() * 2.5,
      hue: Math.random() < 0.5 ? '#7afcff' : '#ff2e63',
      a: 0.3 + Math.random() * 0.5,
    });
  }
  const dust = [];       // Landungs-Partikel (einmalig)
  const shurikens = [];  // geworfene Wurfsterne
  let landed = false, threw = false;

  // Landeort des Ninjas.
  const groundY = VIRT_H * 0.66;
  const homeX = VIRT_W / 2;

  let t = 0;
  let fading = false, fadeT = 0;
  let last = performance.now();
  let raf = 0;

  function ease(p) { return p < 0 ? 0 : p > 1 ? 1 : 1 - Math.pow(1 - p, 3); }     // easeOutCubic
  function back(p) { const c = 1.7; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); }

  function startFade() { if (!fading) { fading = true; fadeT = 0; } }
  function skip() { if (reduce) { finish(); return; } t = DURATION; startFade(); }

  function finish() {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    overlay.removeEventListener('pointerdown', skip);
    window.removeEventListener('keydown', skip);
    overlay.classList.remove('active');
    overlay.style.opacity = '';
    onDone();
  }

  overlay.addEventListener('pointerdown', skip);
  window.addEventListener('keydown', skip);
  overlay.classList.add('active');

  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05; // Sprünge nach Tab-Wechsel begrenzen
    t += dt;

    // Reduzierte Bewegung: nur kurz schwarz zeigen, dann sanft raus.
    if (reduce && t > 0.3) startFade();
    if (!fading && t >= DURATION) startFade();

    draw(dt);

    if (fading) {
      fadeT += dt;
      overlay.style.opacity = String(Math.max(0, 1 - fadeT / FADE));
      if (fadeT >= FADE) { finish(); return; }
    }
    raf = requestAnimationFrame(frame);
  }

  function draw(dt) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const s = scale * dpr;
    ctx.setTransform(s, 0, 0, s, offX * dpr, offY * dpr);

    drawBackground(dt);

    // Warp-Streifen (nur ganz am Anfang) — Eintauchen ins Weltall.
    if (t < 0.85) {
      const k = 1 - t / 0.85;
      ctx.save();
      ctx.translate(homeX, VIRT_H / 2);
      ctx.strokeStyle = 'rgba(122,252,255,0.5)';
      for (let i = 0; i < 26; i++) {
        const ang = (i / 26) * Math.PI * 2 + i;
        const r0 = 40 + ((i * 53) % 220);
        const len = 120 * k;
        ctx.globalAlpha = k * 0.6;
        ctx.lineWidth = 1 + k * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0);
        ctx.lineTo(Math.cos(ang) * (r0 + len), Math.sin(ang) * (r0 + len));
        ctx.stroke();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // --- Ninja: Salto ins Bild ------------------------------------------
    const inT = (t - 0.2) / 1.05;            // Flugphase
    const p = ease(inT);
    if (inT >= 0) {
      // Sprungbogen von unten-links zur Landeposition.
      const sx = -90, sy = VIRT_H + 120;
      const x = sx + (homeX - sx) * p;
      const arc = Math.sin(Math.min(1, p) * Math.PI) * 260; // Bogenhöhe
      const y = sy + (groundY - sy) * p - arc;
      const spin = inT < 1 ? inT * Math.PI * 4 : 0;          // ~2 Saltos
      const sc = 0.55 + 0.65 * Math.min(1, p);

      // Nachzieh-Schatten (After-Images).
      if (inT < 1) {
        for (let g = 1; g <= 4; g++) {
          const gp = ease(Math.max(0, inT - g * 0.05) / 1.05);
          const gx = sx + (homeX - sx) * gp;
          const ga = Math.sin(Math.min(1, gp) * Math.PI) * 260;
          const gy = sy + (groundY - sy) * gp - ga;
          ctx.globalAlpha = 0.12 * (1 - g / 5);
          drawNinja(ctx, gx, gy, sc, gp * Math.PI * 4, 0, t);
        }
        ctx.globalAlpha = 1;
      }

      const poseThrow = threw && t < 1.95 ? 1 - (t - 1.6) / 0.35 : 0;
      drawNinja(ctx, x, y, sc, spin, Math.max(0, poseThrow), t);

      // Landung erkannt → Schockwelle + Staub.
      if (!landed && inT >= 1) {
        landed = true;
        spawnDust(homeX, groundY + 22);
      }
    }

    // Schockwellen-Ring nach der Landung.
    if (landed) {
      const lt = t - 1.25;
      if (lt < 0.5) {
        const r = lt / 0.5;
        ctx.globalAlpha = (1 - r) * 0.7;
        ctx.strokeStyle = '#7afcff';
        ctx.lineWidth = 4 * (1 - r) + 1;
        ctx.beginPath();
        ctx.ellipse(homeX, groundY + 24, 30 + r * 150, 10 + r * 40, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // Wurfsterne ausspucken.
    if (landed && !threw && t >= 1.6) {
      threw = true;
      for (let i = -1; i <= 1; i++) {
        const ang = -0.35 + i * 0.35;
        shurikens.push({
          x: homeX + 18, y: groundY - 6,
          vx: Math.cos(ang) * 520, vy: Math.sin(ang) * 520,
          spin: 0, life: 0,
        });
      }
      spawnDust(homeX + 24, groundY - 6, '#7afcff', 8);
    }
    updateShurikens(dt);

    updateDust(dt);
    drawTitle();
    drawLoadingBar();
  }

  function drawBackground(dt) {
    const th = THEMES.station;
    const g = ctx.createLinearGradient(0, 0, 0, VIRT_H);
    g.addColorStop(0, th.sky[0]);
    g.addColorStop(1, th.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIRT_W, VIRT_H);

    // sanfter Lichtschein hinter dem Ninja
    const halo = ctx.createRadialGradient(homeX, groundY - 20, 10, homeX, groundY - 20, 320);
    halo.addColorStop(0, 'rgba(180,0,255,0.22)');
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, VIRT_W, VIRT_H);

    // Sterne (funkeln)
    for (const st of stars) {
      ctx.globalAlpha = 0.4 + 0.5 * (0.5 + 0.5 * Math.sin(st.tw + t * 3));
      ctx.fillStyle = th.star;
      ctx.fillRect(st.x, st.y, st.s, st.s);
    }
    ctx.globalAlpha = 1;

    // schwebende Funken
    for (const sp of sparks) {
      sp.y += sp.vy * dt * 16;
      if (sp.y < -4) { sp.y = VIRT_H + 4; sp.x = Math.random() * VIRT_W; }
      ctx.globalAlpha = sp.a * (0.6 + 0.4 * Math.sin(t * 4 + sp.x));
      ctx.fillStyle = sp.hue;
      ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function spawnDust(x, y, color = '#cfd8ff', n = 16) {
    for (let i = 0; i < n; i++) {
      const a = (Math.random() - 0.5) * Math.PI;
      const sp = 80 + Math.random() * 220;
      dust.push({
        x, y,
        vx: Math.cos(a) * sp * (Math.random() < 0.5 ? -1 : 1),
        vy: -Math.abs(Math.sin(a)) * sp - 40,
        size: 2 + Math.random() * 3,
        color,
        life: 0.5 + Math.random() * 0.4, max: 0.9,
      });
    }
  }
  function updateDust(dt) {
    for (const d of dust) {
      d.vy += 700 * dt;
      d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt;
      ctx.globalAlpha = Math.max(0, d.life / d.max);
      ctx.fillStyle = d.color;
      ctx.fillRect(d.x, d.y, d.size, d.size);
    }
    ctx.globalAlpha = 1;
    for (let i = dust.length - 1; i >= 0; i--) if (dust[i].life <= 0) dust.splice(i, 1);
  }

  function updateShurikens(dt) {
    for (const sh of shurikens) {
      sh.x += sh.vx * dt; sh.y += sh.vy * dt; sh.spin += dt * 26; sh.life += dt;
      // Glüh-Schweif
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#aef0ff';
      ctx.beginPath(); ctx.arc(sh.x - sh.vx * 0.02, sh.y - sh.vy * 0.02, 6, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.translate(sh.x, sh.y);
      ctx.rotate(sh.spin);
      ctx.fillStyle = '#7afcff';
      ctx.shadowColor = '#aef0ff'; ctx.shadowBlur = 12;
      star4(ctx, 11);
      ctx.restore();
      ctx.shadowBlur = 0;
    }
    for (let i = shurikens.length - 1; i >= 0; i--) {
      const sh = shurikens[i];
      if (sh.x < -40 || sh.x > VIRT_W + 40 || sh.y < -40) shurikens.splice(i, 1);
    }
  }

  function drawTitle() {
    const ap = back(Math.min(1, Math.max(0, (t - 1.45) / 0.55)));
    if (ap <= 0) return;
    const sc = 0.6 + 0.4 * ap;
    const glow = 14 + Math.sin(t * 4) * 6;
    ctx.save();
    ctx.globalAlpha = Math.min(1, ap);
    ctx.translate(VIRT_W / 2, VIRT_H * 0.22);
    ctx.scale(sc, sc);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#7afcff'; ctx.shadowBlur = glow;
    ctx.font = '900 84px -apple-system, "Segoe UI", system-ui, sans-serif';
    ctx.fillText('NINJA', 0, -34);
    ctx.shadowColor = '#ff2e63'; ctx.shadowBlur = glow;
    ctx.font = '800 40px -apple-system, "Segoe UI", system-ui, sans-serif';
    ctx.fillText('IM WELTRAUM', 0, 30);
    ctx.restore();
    ctx.shadowBlur = 0;
  }

  function drawLoadingBar() {
    const w = 300, h = 12, x = (VIRT_W - w) / 2, y = VIRT_H * 0.86;
    const prog = Math.min(1, t / (DURATION - 0.3));
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    roundRect(ctx, x, y, w, h, 6); ctx.fill();
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, '#ff2e63'); g.addColorStop(1, '#7afcff');
    ctx.fillStyle = g;
    roundRect(ctx, x, y, Math.max(h, w * prog), h, 6); ctx.fill();
    // Glanzpunkt am Ende des Balkens
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x + Math.max(h, w * prog) - 4, y + h / 2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '700 18px -apple-system, "Segoe UI", system-ui, sans-serif';
    const label = prog >= 1 ? STRINGS.tapToStart : `Lädt … ${Math.round(prog * 100)}%`;
    ctx.fillText(label, VIRT_W / 2, y - 14);
  }

  raf = requestAnimationFrame(frame);
}

// --- Ninja zeichnen (zentriert am Ursprung), throw 0..1, rot Rotation ----
function drawNinja(ctx, x, y, sc, rot, throwAmt, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(sc, sc);

  // Beine
  ctx.fillStyle = SKIN.body;
  ctx.fillRect(-11, 8, 8, 16);
  ctx.fillRect(3, 8, 8, 16);

  // Körper
  ctx.fillStyle = SKIN.body;
  roundRect(ctx, -14, -18, 28, 30, 10); ctx.fill();

  // Schärpe + wehendes Stirnband
  ctx.fillStyle = SKIN.accent;
  ctx.fillRect(-14, -4, 28, 6);
  const wave = Math.sin(time * 10) * 5;
  ctx.beginPath();
  ctx.moveTo(-14, -11);
  ctx.lineTo(-30, -11 + wave);
  ctx.lineTo(-30, -3 + wave);
  ctx.lineTo(-14, -3);
  ctx.fill();
  ctx.fillRect(-14, -13, 28, 5);

  // Maske + Auge
  ctx.fillStyle = '#0b0b1e';
  roundRect(ctx, -13, -9, 26, 9, 3); ctx.fill();
  ctx.fillStyle = SKIN.eye;
  ctx.fillRect(2, -8, 8, 4);
  ctx.fillRect(-10, -8, 8, 4);

  // Arm (gestreckt beim Werfen)
  ctx.fillStyle = SKIN.body;
  if (throwAmt > 0) ctx.fillRect(8, -7, 14 + throwAmt * 8, 6);
  else ctx.fillRect(8, -2, 11, 6);

  ctx.restore();
}

function star4(ctx, r) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const rad = i % 2 === 0 ? r : r * 0.4;
    const px = Math.cos(ang) * rad, py = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
