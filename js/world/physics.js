// physics.js — AABB-Kollision mit achsen-getrennter Auflösung.
// Erst X bewegen + auflösen, dann Gravitation, dann Y bewegen + auflösen.
// Das verhindert Eck-Hänger und Tunneling und ist trotzdem einfach.

import { GRAVITY, MAX_FALL } from '../config.js';

export function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// Bewegt eine Entity mit vx/vy durch die Plattformwelt und löst Kollisionen.
// Setzt e.grounded und e.hitWall. Gibt nichts zurück (mutiert e).
export function moveAndCollide(e, platforms, dt) {
  e.grounded = false;
  e.hitWall = false;

  // --- X-Achse ---
  e.x += e.vx * dt;
  for (const p of platforms) {
    if (!aabb(e, p)) continue;
    if (e.vx > 0) { e.x = p.x - e.w; e.hitWall = true; }
    else if (e.vx < 0) { e.x = p.x + p.w; e.hitWall = true; }
    e.vx = 0;
  }

  // --- Gravitation ---
  e.vy += GRAVITY * dt;
  if (e.vy > MAX_FALL) e.vy = MAX_FALL;

  // --- Y-Achse ---
  e.y += e.vy * dt;
  for (const p of platforms) {
    if (!aabb(e, p)) continue;
    if (e.vy > 0) {           // fällt -> landet oben auf der Plattform
      e.y = p.y - e.h;
      e.grounded = true;
    } else if (e.vy < 0) {    // springt -> stößt mit dem Kopf an
      e.y = p.y + p.h;
    }
    e.vy = 0;
  }
}

// Hält eine Entity (z. B. Patrouillen-Gegner) innerhalb der Level-Breite.
export function clampToLevel(e, level) {
  if (e.x < 0) { e.x = 0; e.vx = Math.abs(e.vx); }
  if (e.x + e.w > level.width) { e.x = level.width - e.w; e.vx = -Math.abs(e.vx); }
}
