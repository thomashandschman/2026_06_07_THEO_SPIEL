// render.js — Alles Zeichnen passiert hier (prozedural, keine Bilddateien).
// Gameplay-Code ruft nie direkt ctx auf; so ließe sich die Optik später
// austauschen, ohne die Spiellogik anzufassen.

import { VIRT_W, VIRT_H, THEMES, ELEMENTS, NINJAS } from '../config.js';
import { hasShield, hasFire, hasSpeed } from '../entities/powerups.js';

// --- Sternenfeld (einmalig je Level erzeugt, cachebar auf world) ---------
export function makeStars(width, height) {
  const layers = [
    { count: Math.ceil(width / 12), p: 0.25, size: 1.2 }, // fern, langsam
    { count: Math.ceil(width / 20), p: 0.5,  size: 1.8 },
    { count: Math.ceil(width / 40), p: 0.8,  size: 2.6 }, // nah, schnell
  ];
  return layers.map(l => {
    const arr = [];
    for (let i = 0; i < l.count; i++) {
      arr.push({ x: Math.random() * width, y: Math.random() * height, s: l.size * (0.6 + Math.random()) });
    }
    return { stars: arr, p: l.p, size: l.size };
  });
}

export function drawBackground(ctx, theme, cam, stars) {
  const t = THEMES[theme] || THEMES.station;
  const g = ctx.createLinearGradient(0, 0, 0, VIRT_H);
  g.addColorStop(0, t.sky[0]);
  g.addColorStop(1, t.sky[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIRT_W, VIRT_H);

  // Parallax-Sterne: pro Schicht mit eigenem Faktor versetzt.
  ctx.fillStyle = t.star;
  for (const layer of stars) {
    for (const st of layer.stars) {
      let sx = st.x - cam.x * layer.p;
      let sy = st.y - cam.y * layer.p * 0.5;
      // horizontal wiederholen, damit das Feld immer gefüllt ist
      sx = ((sx % VIRT_W) + VIRT_W) % VIRT_W;
      ctx.globalAlpha = 0.5 + layer.p * 0.5;
      ctx.fillRect(sx, sy, st.s, st.s);
    }
  }
  ctx.globalAlpha = 1;
}

export function drawPlatforms(ctx, level) {
  const t = THEMES[level.theme] || THEMES.station;
  for (const p of level.platforms) {
    // Körper
    ctx.fillStyle = t.platform;
    roundRect(ctx, p.x, p.y, p.w, p.h, 8);
    ctx.fill();
    // Neon-Oberkante
    ctx.fillStyle = t.edge;
    ctx.globalAlpha = 0.9;
    roundRect(ctx, p.x, p.y, p.w, 5, 3);
    ctx.fill();
    ctx.globalAlpha = 0.18;
    ctx.fillRect(p.x, p.y + 5, p.w, 10);
    ctx.globalAlpha = 1;
  }
}

export function drawGoal(ctx, level, time) {
  const goal = level.goal;
  // Mast
  ctx.fillStyle = '#d7e3ff';
  ctx.fillRect(goal.x, goal.y, 6, goal.h);
  // Wehende Flagge
  const fx = goal.x + 6;
  const fy = goal.y + 6;
  const wave = Math.sin(time * 4) * 4;
  ctx.fillStyle = '#ff2e63';
  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(fx + 40, fy + 10 + wave);
  ctx.lineTo(fx, fy + 30);
  ctx.closePath();
  ctx.fill();
  ctx.font = '20px serif';
  ctx.textAlign = 'center';
  ctx.fillText('🚩', goal.x + goal.w / 2, goal.y - 8);
}

export function drawCoin(ctx, c, time) {
  const cx = c.x + c.w / 2;
  const cy = c.y + c.h / 2 + Math.sin(time * 3 + c.bob) * 4;
  const r = c.w / 2;
  // Münze mit Pulsieren der Breite (Drehung angedeutet)
  const wob = Math.abs(Math.cos(time * 4 + c.bob));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(0.4 + wob * 0.6, 1);
  ctx.fillStyle = '#ffcf33';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff1a8';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawDrop(ctx, d, time) {
  const el = ELEMENTS[d.element] || ELEMENTS.fire;
  const cx = d.x + d.w / 2;
  const cy = d.y + d.h / 2 + Math.sin(time * 4 + d.bob) * 3;
  // Glüh-Aura
  const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, d.w);
  grad.addColorStop(0, el.glow);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(cx, cy, d.w, 0, Math.PI * 2); ctx.fill();
  ctx.font = `${d.h}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(el.emoji, cx, cy + 1);
  ctx.textBaseline = 'alphabetic';
}

export function drawProjectile(ctx, p) {
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;
  if (p.type === 'player') {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(p.spin);
    ctx.fillStyle = p.fire ? '#ff7a1f' : '#7afcff';
    ctx.shadowColor = p.fire ? '#ffb061' : '#aef0ff';
    ctx.shadowBlur = 12;
    // Vierzackiger Wurfstern
    drawStar(ctx, p.w / 2);
    ctx.restore();
    ctx.shadowBlur = 0;
    return;
  }
  // Gegner-Geschosse
  if (p.kind === 'wave') {
    ctx.fillStyle = 'rgba(51,194,255,0.45)';
    ctx.beginPath(); ctx.ellipse(cx, cy, p.w / 2, p.h / 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.font = `${p.h}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🌊', cx, cy);
    ctx.textBaseline = 'alphabetic';
  } else if (p.kind === 'flame') {
    ctx.font = `${p.h + 8}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🔥', cx, cy);
    ctx.textBaseline = 'alphabetic';
  } else { // bolt
    ctx.fillStyle = '#ffe14d';
    ctx.shadowColor = '#fff3a0'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(cx, cy, p.w / 2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
}

export function drawEnemy(ctx, e, time) {
  const el = ELEMENTS[e.element] || ELEMENTS.fire;
  const cx = e.x + e.w / 2;
  const cy = e.y + e.h / 2;
  const hurt = e.flash > 0;

  // Glüh-Aura in Elementfarbe
  const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, e.w * 0.9);
  grad.addColorStop(0, el.glow);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(cx, cy, e.w * 0.9, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // Körper (Blob)
  ctx.fillStyle = hurt ? '#ffffff' : el.color;
  const squish = 1 + Math.sin(time * 6 + e.anim) * 0.06;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1 / squish, squish);
  ctx.beginPath(); ctx.arc(0, 0, e.w / 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Augen (Blickrichtung)
  const ex = e.facing * 5;
  ctx.fillStyle = '#0b0b1e';
  ctx.beginPath(); ctx.arc(cx - 7 + ex, cy - 4, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 7 + ex, cy - 4, 4, 0, Math.PI * 2); ctx.fill();

  // Element-Emoji als Krönchen
  ctx.font = '18px serif'; ctx.textAlign = 'center';
  ctx.fillText(el.emoji, cx, e.y - 4);

  // HP-Punkte
  for (let i = 0; i < e.maxHp; i++) {
    ctx.fillStyle = i < e.hp ? '#ffffff' : 'rgba(255,255,255,0.25)';
    ctx.fillRect(e.x + i * 8, e.y - 22, 6, 4);
  }
}

export function drawPlayer(ctx, player, time) {
  const skin = NINJAS[player.skin] || NINJAS.standard;
  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;
  const blink = player.invuln > 0 && Math.floor(time * 12) % 2 === 0;
  if (blink) ctx.globalAlpha = 0.4;

  // Speed-Schlieren
  if (hasSpeed(player) && Math.abs(player.vx) > 30) {
    ctx.fillStyle = ELEMENTS.speed.glow;
    ctx.globalAlpha = (blink ? 0.4 : 1) * 0.3;
    for (let i = 1; i <= 3; i++) {
      ctx.fillRect(player.x - player.facing * i * 8, player.y + 6, player.w, player.h - 12);
    }
    ctx.globalAlpha = blink ? 0.4 : 1;
  }

  const run = player.state === 'run';
  const bob = run ? Math.sin(time * 16) * 2 : 0;

  ctx.save();
  ctx.translate(cx, cy + bob);
  ctx.scale(player.facing, 1);

  // Beine
  ctx.fillStyle = skin.body;
  if (player.state === 'jump' || player.state === 'fall') {
    ctx.fillRect(-12, 8, 9, 12);
    ctx.fillRect(3, 4, 9, 14);
  } else {
    const step = run ? Math.sin(time * 16) * 5 : 0;
    ctx.fillRect(-11 + step, 8, 8, 14);
    ctx.fillRect(3 - step, 8, 8, 14);
  }

  // Körper (Rundrechteck)
  ctx.fillStyle = skin.body;
  roundRectC(ctx, -13, -16, 26, 28, 9);
  ctx.fill();

  // Schärpe / Akzent
  ctx.fillStyle = skin.accent;
  ctx.fillRect(-13, -4, 26, 6);
  // Stirnband-Band, das im Wind weht
  ctx.beginPath();
  ctx.moveTo(-13, -10);
  ctx.lineTo(-26, -10 + Math.sin(time * 10) * 4);
  ctx.lineTo(-26, -2 + Math.sin(time * 10) * 4);
  ctx.lineTo(-13, -2);
  ctx.fill();
  ctx.fillRect(-13, -12, 26, 5); // Stirnband vorne

  // Maske + Augen
  ctx.fillStyle = '#0b0b1e';
  roundRectC(ctx, -12, -8, 24, 8, 3);
  ctx.fill();
  ctx.fillStyle = skin.eye;
  ctx.fillRect(2, -7, 7, 4);

  // Arm beim Werfen / Lauf
  ctx.fillStyle = skin.body;
  if (player.throwCd > 0.18) ctx.fillRect(8, -6, 16, 6);
  else ctx.fillRect(8, -2, 10, 6);

  ctx.restore();

  // Wasser-Schild-Ring
  if (hasShield(player)) {
    ctx.strokeStyle = ELEMENTS.water.glow;
    ctx.lineWidth = 3;
    ctx.globalAlpha = (blink ? 0.4 : 1) * (0.6 + Math.sin(time * 8) * 0.2);
    ctx.beginPath();
    ctx.arc(cx, cy, player.w * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // Feuer-Aura
  if (hasFire(player)) {
    ctx.fillStyle = 'rgba(255,90,31,0.25)';
    ctx.beginPath(); ctx.arc(cx, cy, player.w * 0.8, 0, Math.PI * 2); ctx.fill();
  }

  ctx.globalAlpha = 1;
}

export function drawParticles(ctx, particles) {
  for (const p of particles) {
    const t = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = t;
    // Explosions-Partikel leuchten (additiv) und schrumpfen mit der Zeit.
    const additive = !!p.additive;
    if (additive) ctx.globalCompositeOperation = 'lighter';
    if (p.glow) { ctx.shadowColor = p.color; ctx.shadowBlur = p.glow; }
    ctx.fillStyle = p.color;
    if (p.glow || p.additive) {
      // runde, weiche Funken
      const r = (p.shrink ? p.size * (0.3 + 0.7 * t) : p.size) / 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, r), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    if (p.glow) ctx.shadowBlur = 0;
    if (additive) ctx.globalCompositeOperation = 'source-over';
  }
  ctx.globalAlpha = 1;
}

// Explosions-Schichten: Lichtblitz (gefüllter Radialverlauf) und
// expandierende Schockwellen-Ringe. Alles additiv für satten "Knall".
export function drawExplosions(ctx, explosions) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const x of explosions) {
    const t = Math.max(0, x.life / x.maxLife); // 1 → 0
    if (x.kind === 'flash') {
      ctx.globalAlpha = t * t; // schneller Abfall
      const grad = ctx.createRadialGradient(x.x, x.y, 0, x.x, x.y, x.r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, x.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x.x, x.y, x.r, 0, Math.PI * 2);
      ctx.fill();
    } else if (x.kind === 'shock') {
      const grow = 1 - t;                 // 0 → 1
      const ease = 1 - Math.pow(t, 2.2);  // schnell raus, dann bremsend
      const r = x.r0 + (x.r1 - x.r0) * ease;
      ctx.globalAlpha = Math.pow(t, 0.6); // verblasst zum Ende
      ctx.strokeStyle = x.color;
      ctx.lineWidth = Math.max(1, x.width * (1 - grow * 0.7));
      ctx.shadowColor = x.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(x.x, x.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

// --- kleine Zeichenhelfer ------------------------------------------------
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
// Zentrierte Variante (für bereits translatiertes ctx)
function roundRectC(ctx, x, y, w, h, r) { roundRect(ctx, x, y, w, h, r); }

function drawStar(ctx, r) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const rad = i % 2 === 0 ? r : r * 0.4;
    const x = Math.cos(ang) * rad;
    const y = Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}
