// game.js — Zustandsautomat (MENU/SELECT/PLAY/WIN/GAMEOVER) und die
// gesamte Spielorchestrierung. Einziger Spiel-State liegt in this.world.

import { VIRT_W, VIRT_H, COIN_POINTS, ENEMY_POINTS, ELEMENT_POINTS, STRINGS } from '../config.js';
import { Camera } from '../world/camera.js';
import { aabb } from '../world/physics.js';
import { WORLDS } from '../world/levels.js';
import { makePlayer, updatePlayer, damagePlayer, canThrow, didThrow } from '../entities/player.js';
import { makeEnemy, updateEnemy, hitEnemy } from '../entities/enemies.js';
import { makePlayerProjectile, updateProjectile } from '../entities/projectile.js';
import { makeCoin, makeDrop, updateDrop } from '../entities/pickups.js';
import { applyElement, hasShield, hasFire } from '../entities/powerups.js';
import { ELEMENTS } from '../config.js';
import * as R from '../ui/render.js';

export class Game {
  constructor(viewport, input, screens) {
    this.vp = viewport;
    this.input = input;
    this.screens = screens;
    this.camera = new Camera();
    this.state = 'menu';
    this.world = null;
    this.menuStars = R.makeStars(VIRT_W * 2, VIRT_H);
    this.menuTime = 0;
  }

  // --- Ablaufsteuerung ---------------------------------------------------
  toMenu() { this.state = 'menu'; this.input.reset(); this.screens.show('menu'); }
  toSelect() { this.state = 'select'; this.input.reset(); this.screens.show('select'); }

  start() {
    // Frischer Lauf: Spieler mit gewähltem Skin, bei Level 0 beginnen.
    this.player = makePlayer(this.screens.selectedSkin, WORLDS[0].spawn);
    this.totalScore = 0;
    this.loadLevel(0);
    this.state = 'play';
    this.input.reset();
    this.screens.show('play');
    this.screens.toast(`${STRINGS.world} 1: ${WORLDS[0].name}`);
  }

  loadLevel(index) {
    const src = WORLDS[index];
    // Plattformen kopieren, damit bewegliche Plattformen gefahrlos mutiert
    // werden (Basis-Koordinaten merken).
    const platforms = src.platforms.map(p => ({
      ...p, baseX: p.x, baseY: p.y, phase: Math.random() * Math.PI * 2, _dx: 0, _dy: 0,
    }));
    const level = { ...src, platforms };

    const player = this.player;
    player.x = level.spawn.x;
    player.y = level.spawn.y;
    player.vx = 0; player.vy = 0;
    player.invuln = 1.0;

    this.world = {
      level,
      levelIndex: index,
      player,
      enemies: src.enemies.map(makeEnemy),
      projectiles: [],
      coins: src.coins.map(c => makeCoin(c.x, c.y)),
      drops: [],
      particles: [],
      score: this.totalScore,
      time: 0,
      stars: R.makeStars(level.width, level.height),
    };
    this.camera.follow(player, level, true);
  }

  // --- Update ------------------------------------------------------------
  update(dt) {
    if (this.state === 'play') this._updatePlay(dt);
    else this.menuTime += dt;
  }

  _updatePlay(dt) {
    const w = this.world;
    const lvl = w.level;
    const player = w.player;
    w.time += dt;

    this._updateMovingPlatforms(lvl, player, w.time);

    // Spieler
    const fell = updatePlayer(player, dt, this.input, lvl);
    if (fell) {
      damagePlayer(player, player.x); // Leben kostet
      if (player.alive) {
        player.x = lvl.spawn.x; player.y = lvl.spawn.y;
        player.vx = 0; player.vy = 0; player.invuln = 1.2;
        this.screens.toast('Aufgepasst! 😅');
      }
    }

    // Werfen
    if (this.input.consumeThrow() && canThrow(player) && player.alive) {
      w.projectiles.push(makePlayerProjectile(player, hasFire(player)));
      didThrow(player);
    }

    // Gegner
    for (const e of w.enemies) {
      if (!e.alive) continue;
      updateEnemy(e, dt, player, w.projectiles);
    }

    // Geschosse
    for (const p of w.projectiles) updateProjectile(p, dt);

    // Drops
    for (const d of w.drops) updateDrop(d, dt);

    // Partikel
    this._updateParticles(dt);

    this._collisions(w, player);

    // Tod?
    if (!player.alive) {
      this._end(false);
      return;
    }

    // Ziel erreicht?
    if (aabb(player, lvl.goal)) {
      this.totalScore = w.score;
      if (w.levelIndex + 1 < WORLDS.length) {
        const next = w.levelIndex + 1;
        this.loadLevel(next);
        this.screens.toast(`${STRINGS.levelComplete} → ${WORLDS[next].name}`);
      } else {
        this._end(true);
        return;
      }
    }

    this.camera.follow(player, lvl);
    this.screens.updateHUD(w, player);
  }

  _updateMovingPlatforms(lvl, player, time) {
    for (const p of lvl.platforms) {
      if (!p.move) continue;
      const prevX = p.x, prevY = p.y;
      const off = Math.sin(time * (p.move.speed / 60) + p.phase) * p.move.range;
      if (p.move.axis === 'x') p.x = p.baseX + off;
      else p.y = p.baseY + off;
      p._dx = p.x - prevX;
      p._dy = p.y - prevY;
      // Spieler mitnehmen, wenn er oben aufsteht.
      if (player.grounded &&
          player.x + player.w > p.x && player.x < p.x + p.w &&
          Math.abs((player.y + player.h) - prevY) < 4) {
        player.x += p._dx;
        player.y += p._dy;
      }
    }
  }

  _collisions(w, player) {
    // Spieler-Geschosse vs. Gegner
    for (const proj of w.projectiles) {
      if (!proj.alive || proj.type !== 'player') continue;
      for (const e of w.enemies) {
        if (!e.alive) continue;
        if (aabb(proj, e)) {
          proj.alive = false;
          const killed = hitEnemy(e, proj.dmg);
          this._spawnParticles(e.x + e.w / 2, e.y + e.h / 2, ELEMENTS[e.element].color, killed ? 14 : 5);
          if (killed) {
            w.score += ENEMY_POINTS;
            const drop = makeDrop(e.x + e.w / 2 - 14, e.y, e.element);
            drop._restY = e.y + e.h - 28;
            w.drops.push(drop);
          }
          break;
        }
      }
    }

    // Gegner-Geschosse vs. Spieler
    for (const proj of w.projectiles) {
      if (!proj.alive || proj.type !== 'enemy') continue;
      if (!aabb(proj, player)) continue;
      if (proj.kind === 'wave') {
        // Welle: schiebt weg, kein Schaden.
        const dir = (player.x + player.w / 2) < (proj.x + proj.w / 2) ? -1 : 1;
        player.vx = 420 * dir;
        proj.alive = false;
      } else {
        // Blitz/Flamme: Schaden, außer Wasser-Schild fängt ihn ab.
        if (hasShield(player)) {
          player.buffs.water = 0; // Schild verbraucht
          this._spawnParticles(player.x + player.w / 2, player.y + player.h / 2, ELEMENTS.water.glow, 10);
        } else {
          damagePlayer(player, proj.x + proj.w / 2);
        }
        proj.alive = false;
      }
    }

    // Gegner-Körper vs. Spieler (Kontaktschaden)
    for (const e of w.enemies) {
      if (!e.alive) continue;
      if (aabb(e, player)) {
        if (hasShield(player)) {
          player.buffs.water = 0;
          this._spawnParticles(player.x + player.w / 2, player.y + player.h / 2, ELEMENTS.water.glow, 10);
          // Gegner leicht zurückstoßen
          e.vx = -e.vx;
        } else {
          damagePlayer(player, e.x + e.w / 2);
        }
      }
    }

    // Münzen
    for (const c of w.coins) {
      if (c.alive && aabb(c, player)) {
        c.alive = false;
        w.score += COIN_POINTS;
        this._spawnParticles(c.x + c.w / 2, c.y + c.h / 2, '#ffcf33', 8);
      }
    }

    // Element-Drops
    for (const d of w.drops) {
      if (d.alive && aabb(d, player)) {
        d.alive = false;
        applyElement(player, d.element);
        w.score += ELEMENT_POINTS;
        this._spawnParticles(d.x + d.w / 2, d.y + d.h / 2, ELEMENTS[d.element].glow, 12);
        this.screens.toast(`${ELEMENTS[d.element].emoji} ${ELEMENTS[d.element].label}-Kraft!`);
      }
    }

    // Tote Objekte entfernen
    w.projectiles = w.projectiles.filter(p => p.alive);
    w.coins = w.coins.filter(c => c.alive);
    w.drops = w.drops.filter(d => d.alive);
  }

  _spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 180;
      this.world.particles.push({
        x, y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 60,
        size: 2 + Math.random() * 3,
        color,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9,
      });
    }
  }

  _updateParticles(dt) {
    const ps = this.world.particles;
    for (const p of ps) {
      p.vy += 600 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.world.particles = ps.filter(p => p.life > 0);
  }

  _end(won) {
    this.state = won ? 'win' : 'gameover';
    this.input.reset();
    const score = this.world.score;
    if (won) this.screens.showWin(score);
    else this.screens.showGameOver(score);
  }

  // --- Render ------------------------------------------------------------
  render() {
    const ctx = this.vp.ctx;
    this.vp.begin();

    if (this.state === 'play' || this.state === 'win' || this.state === 'gameover') {
      const w = this.world;
      if (!w) return;
      R.drawBackground(ctx, w.level.theme, this.camera, w.stars);
      ctx.save();
      ctx.translate(-Math.round(this.camera.x), -Math.round(this.camera.y));
      R.drawPlatforms(ctx, w.level);
      R.drawGoal(ctx, w.level, w.time);
      for (const c of w.coins) R.drawCoin(ctx, c, w.time);
      for (const d of w.drops) R.drawDrop(ctx, d, w.time);
      for (const e of w.enemies) if (e.alive) R.drawEnemy(ctx, e, w.time);
      for (const p of w.projectiles) R.drawProjectile(ctx, p);
      if (w.player.alive) R.drawPlayer(ctx, w.player, w.time);
      R.drawParticles(ctx, w.particles);
      ctx.restore();
    } else {
      // Menü-/Auswahl-Hintergrund: ruhiges driftendes Sternenfeld.
      const driftCam = { x: this.menuTime * 30, y: 0 };
      R.drawBackground(ctx, 'station', driftCam, this.menuStars);
    }
  }
}
