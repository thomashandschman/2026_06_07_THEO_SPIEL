// player.js — Der Ninja. Bewegung mit Beschleunigung/Reibung, vergebender
// Sprung (Coyote-Time + Jump-Buffer + variable Höhe), Zustandsautomat nur
// für die Pose (idle/run/jump/fall) und die Buff-/Leben-Verwaltung.

import {
  PLAYER_W, PLAYER_H, MOVE_SPEED, MOVE_ACCEL, AIR_ACCEL, FRICTION,
  JUMP_VELOCITY, COYOTE_TIME, JUMP_BUFFER, JUMP_CUT,
  THROW_COOLDOWN, START_LIVES, IFRAME_TIME, KNOCKBACK, SPEED_BUFF_MULT, NINJAS,
} from '../config.js';
import { moveAndCollide } from '../world/physics.js';
import { emptyBuffs, updateBuffs, hasSpeed } from './powerups.js';

export function makePlayer(skinKey, spawn) {
  return {
    x: spawn.x, y: spawn.y,
    w: PLAYER_W, h: PLAYER_H,
    vx: 0, vy: 0,
    skin: skinKey,
    facing: 1,
    grounded: false,
    state: 'idle',
    lives: START_LIVES,
    invuln: 0,
    coyote: 0,
    jumpBuffer: 0,
    jumpHeld: false,
    throwCd: 0,
    buffs: emptyBuffs(),
    anim: 0,
    alive: true,
  };
}

export function updatePlayer(player, dt, input, level) {
  const skin = NINJAS[player.skin] || NINJAS.standard;
  const a = input.actions;
  player.anim += dt;

  // --- Timer ---
  if (player.invuln > 0) player.invuln -= dt;
  if (player.throwCd > 0) player.throwCd -= dt;
  updateBuffs(player, dt);

  // Coyote-Time: kurz nach dem Verlassen einer Kante noch springbar.
  if (player.grounded) player.coyote = COYOTE_TIME;
  else player.coyote = Math.max(0, player.coyote - dt);

  // Jump-Buffer: kurz vor der Landung gedrückter Sprung wird gemerkt.
  if (input.consumeJump()) player.jumpBuffer = JUMP_BUFFER;
  else player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);

  // --- Horizontale Bewegung ---
  const maxSpeed = MOVE_SPEED * skin.speed * (hasSpeed(player) ? SPEED_BUFF_MULT : 1);
  let dir = 0;
  if (a.left) dir -= 1;
  if (a.right) dir += 1;

  const accel = player.grounded ? MOVE_ACCEL : AIR_ACCEL;
  if (dir !== 0) {
    player.vx += dir * accel * dt;
    player.vx = clamp(player.vx, -maxSpeed, maxSpeed);
    player.facing = dir;
  } else if (player.grounded) {
    // Reibung bremst sanft bis zum Stillstand.
    const f = FRICTION * dt;
    if (player.vx > f) player.vx -= f;
    else if (player.vx < -f) player.vx += f;
    else player.vx = 0;
  }

  // --- Sprung ---
  if (player.jumpBuffer > 0 && player.coyote > 0) {
    player.vy = -JUMP_VELOCITY * skin.jump;
    player.jumpBuffer = 0;
    player.coyote = 0;
    player.grounded = false;
  }
  // Variable Sprunghöhe: beim frühen Loslassen Aufstieg kappen.
  if (!a.jump && player.jumpHeld && player.vy < 0) {
    player.vy *= JUMP_CUT;
  }
  player.jumpHeld = a.jump;

  // --- Kollision & Bewegung ---
  moveAndCollide(player, level.platforms, dt);

  // In der Welt bleiben (Seitenränder).
  if (player.x < 0) { player.x = 0; if (player.vx < 0) player.vx = 0; }
  if (player.x + player.w > level.width) {
    player.x = level.width - player.w;
    if (player.vx > 0) player.vx = 0;
  }

  // --- Pose / Zustandsautomat (nur Optik) ---
  if (!player.grounded) player.state = player.vy < 0 ? 'jump' : 'fall';
  else if (Math.abs(player.vx) > 20) player.state = 'run';
  else player.state = 'idle';

  return player.y > level.height + 200; // true = ins Leere gefallen
}

// Treffer einstecken (Knockback Richtung sourceX -> weg). Gibt true zurück,
// wenn der Treffer "zählte" (nicht durch i-Frames/Schild geblockt).
export function damagePlayer(player, sourceX) {
  if (player.invuln > 0) return false;
  player.lives -= 1;
  player.invuln = IFRAME_TIME;
  const dir = (player.x + player.w / 2) < sourceX ? -1 : 1;
  player.vx = KNOCKBACK * dir;
  player.vy = -260;
  if (player.lives <= 0) player.alive = false;
  return true;
}

export function canThrow(player) { return player.throwCd <= 0; }
export function didThrow(player) { player.throwCd = THROW_COOLDOWN; }

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
