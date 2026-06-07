// projectile.js — Spieler-Wurfsterne/Energie-Discs und Gegner-Geschosse.
// Einheitliche Entity-Form { x,y,w,h,vx,vy,type,alive,... }.

import { PROJECTILE_SPEED, PROJECTILE_LIFE, PROJECTILE_DMG, FIRE_PROJECTILE_DMG } from '../config.js';

// Spieler-Geschoss in Blickrichtung. `fire` = Feuer-Buff aktiv (stärker/feurig).
export function makePlayerProjectile(player, fire) {
  const dir = player.facing;
  return {
    x: player.x + player.w / 2 - 8 + dir * 18,
    y: player.y + player.h / 2 - 8,
    w: 16, h: 16,
    vx: PROJECTILE_SPEED * dir,
    vy: 0,
    type: 'player',
    fire: !!fire,
    dmg: fire ? FIRE_PROJECTILE_DMG : PROJECTILE_DMG,
    life: PROJECTILE_LIFE,
    spin: 0,
    alive: true,
  };
}

// Gegner-Geschoss (Blitz, Welle, ...). kind steuert Optik/Verhalten.
export function makeEnemyProjectile(x, y, vx, vy, kind) {
  return {
    x, y,
    w: kind === 'wave' ? 40 : 14,
    h: kind === 'wave' ? 40 : 14,
    vx, vy,
    type: 'enemy',
    kind,                  // 'bolt' | 'wave' | 'flame'
    life: kind === 'flame' ? 1.6 : 2.2,
    spin: 0,
    alive: true,
  };
}

export function updateProjectile(p, dt) {
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.spin += dt * 14;
  p.life -= dt;
  if (p.life <= 0) p.alive = false;
}
