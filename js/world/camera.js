// camera.js — Folgt dem Spieler horizontal und vertikal, geklemmt an die
// Level-Grenzen, damit nie über den Rand der Welt geschaut wird.

import { VIRT_W, VIRT_H } from '../config.js';

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    // Bildschirm-Wackler (Screen-Shake) für wuchtige Treffer/Explosionen.
    this.shake = 0;     // aktuelle Stärke (klingt ab)
    this.shakeX = 0;    // pro Frame gewürfelter Versatz, im Render benutzt
    this.shakeY = 0;
  }

  // Stärke aufaddieren (gedeckelt), wird über update() abgebaut.
  addShake(amount) {
    this.shake = Math.min(36, this.shake + amount);
  }

  // Pro Frame: Wackel-Stärke abbauen und neuen Zufallsversatz würfeln.
  update(dt) {
    if (this.shake > 0.2) {
      this.shake = Math.max(0, this.shake - dt * 70);
      this.shakeX = (Math.random() * 2 - 1) * this.shake;
      this.shakeY = (Math.random() * 2 - 1) * this.shake;
    } else {
      this.shake = 0;
      this.shakeX = 0;
      this.shakeY = 0;
    }
  }

  follow(target, level, instant = false) {
    // Ziel: Spieler horizontal zentrieren, vertikal etwas oberhalb der Mitte.
    const tx = target.x + target.w / 2 - VIRT_W / 2;
    const ty = target.y + target.h / 2 - VIRT_H * 0.6;

    const maxX = Math.max(0, level.width - VIRT_W);
    const maxY = Math.max(0, level.height - VIRT_H);
    const cx = clamp(tx, 0, maxX);
    const cy = clamp(ty, 0, maxY);

    if (instant) {
      this.x = cx;
      this.y = cy;
    } else {
      // Sanftes Nachziehen (Lerp) für ruhige Kamera.
      this.x += (cx - this.x) * 0.18;
      this.y += (cy - this.y) * 0.18;
    }
  }
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}
