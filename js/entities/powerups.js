// powerups.js — Zeitlich begrenzte Buffs. Als Countdown-Map im Spieler
// gespeichert und pro Frame mit dt heruntergezählt (an die Game-Loop
// gebunden, pausiert also korrekt).

import { BUFF_DURATION } from '../config.js';

export function emptyBuffs() {
  return { fire: 0, water: 0, speed: 0 };
}

// Element einsammeln -> passender Buff (Blitz zählt als Bonus-Punkte/Speed-Kick).
export function applyElement(player, element) {
  switch (element) {
    case 'fire':  player.buffs.fire = BUFF_DURATION; break;
    case 'water': player.buffs.water = BUFF_DURATION; break;
    case 'speed': player.buffs.speed = BUFF_DURATION; break;
    case 'lightning': // Blitz gibt einen kurzen Speed-Schub
      player.buffs.speed = BUFF_DURATION * 0.6; break;
  }
}

export function updateBuffs(player, dt) {
  const b = player.buffs;
  if (b.fire > 0) b.fire = Math.max(0, b.fire - dt);
  if (b.water > 0) b.water = Math.max(0, b.water - dt);
  if (b.speed > 0) b.speed = Math.max(0, b.speed - dt);
}

export function hasShield(player) { return player.buffs.water > 0; }
export function hasFire(player) { return player.buffs.fire > 0; }
export function hasSpeed(player) { return player.buffs.speed > 0; }
