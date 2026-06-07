// enemies.js — Die vier Elementar-Gegner. Bewusst sehr lesbare Muster
// (Timer + Vorzeichenwechsel), damit Kinder die Gegner "lesen" können.
// Gegner bewegen sich nur horizontal auf ihrer Plattform (keine Schwerkraft),
// das hält das Verhalten vorhersehbar und fair.

import { makeEnemyProjectile } from './projectile.js';

const SPEC = {
  lightning: { w: 38, h: 38, hp: 2, patrol: 60,  base: 70,  element: 'lightning' },
  fire:      { w: 42, h: 42, hp: 3, patrol: 40,  base: 40,  element: 'fire' },
  water:     { w: 44, h: 44, hp: 3, patrol: 80,  base: 60,  element: 'water' },
  speed:     { w: 36, h: 36, hp: 2, patrol: 120, base: 360, element: 'speed' },
};

export function makeEnemy(def) {
  const s = SPEC[def.type];
  return {
    x: def.x, y: def.y,
    w: s.w, h: s.h,
    vx: s.base,
    type: def.type,
    element: s.element,
    hp: s.hp,
    maxHp: s.hp,
    alive: true,
    homeX: def.x,
    range: def.range !== undefined ? def.range : s.patrol,
    baseSpeed: s.base,
    facing: 1,
    timer: Math.random() * 1.5,    // versetzt die Angriffe der Gegner
    flash: 0,                      // kurzes Aufblitzen bei Treffer
    anim: Math.random() * 10,
  };
}

// Bewegt den Gegner und füllt `out` mit neuen Gegner-Geschossen.
export function updateEnemy(e, dt, player, out) {
  e.anim += dt;
  if (e.flash > 0) e.flash -= dt;
  e.timer -= dt;

  switch (e.type) {
    case 'speed': {
      // Rast schnell zwischen homeX±range hin und her.
      e.x += e.vx * dt;
      if (e.x > e.homeX + e.range) { e.x = e.homeX + e.range; e.vx = -Math.abs(e.vx); }
      if (e.x < e.homeX - e.range) { e.x = e.homeX - e.range; e.vx = Math.abs(e.vx); }
      e.facing = e.vx >= 0 ? 1 : -1;
      break;
    }
    case 'lightning': {
      // Zackig: bewegt sich ruckartig und wechselt zufällig die Richtung.
      e.x += e.vx * dt;
      if (e.x > e.homeX + e.range || e.x < e.homeX - e.range || Math.random() < 0.01) {
        e.vx = -e.vx;
      }
      e.x = clamp(e.x, e.homeX - e.range, e.homeX + e.range);
      e.facing = player.x < e.x ? -1 : 1;
      if (e.timer <= 0) {
        e.timer = 1.6;
        const dir = e.facing;
        out.push(makeEnemyProjectile(e.x + e.w / 2, e.y + e.h / 2, 420 * dir, 0, 'bolt'));
      }
      break;
    }
    case 'water': {
      // Langsame Patrouille, sendet breite Wellen aus, die wegschieben.
      e.x += e.vx * dt;
      if (e.x > e.homeX + e.range) { e.x = e.homeX + e.range; e.vx = -Math.abs(e.vx); }
      if (e.x < e.homeX - e.range) { e.x = e.homeX - e.range; e.vx = Math.abs(e.vx); }
      e.facing = player.x < e.x ? -1 : 1;
      if (e.timer <= 0) {
        e.timer = 2.6;
        const dir = e.facing;
        out.push(makeEnemyProjectile(e.x + e.w / 2, e.y + e.h - 40, 150 * dir, 0, 'wave'));
      }
      break;
    }
    case 'fire': {
      // Steht weitgehend, lässt am Boden kurzlebige Flammen erscheinen.
      e.x += e.vx * dt;
      if (e.x > e.homeX + e.range) { e.x = e.homeX + e.range; e.vx = -Math.abs(e.vx); }
      if (e.x < e.homeX - e.range) { e.x = e.homeX - e.range; e.vx = Math.abs(e.vx); }
      e.facing = player.x < e.x ? -1 : 1;
      if (e.timer <= 0) {
        e.timer = 2.0;
        // zwei Flammen links/rechts vom Gegner
        out.push(makeEnemyProjectile(e.x - 16, e.y + e.h - 28, 0, 0, 'flame'));
        out.push(makeEnemyProjectile(e.x + e.w + 0, e.y + e.h - 28, 0, 0, 'flame'));
      }
      break;
    }
  }
}

export function hitEnemy(e, dmg) {
  e.hp -= dmg;
  e.flash = 0.15;
  if (e.hp <= 0) e.alive = false;
  return !e.alive;
}

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
