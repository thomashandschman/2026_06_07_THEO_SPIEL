// viewport.js — Skaliert das virtuelle 540×960-Spielfeld auf den echten
// iPhone-Bildschirm (Letterbox-Fit), kümmert sich um devicePixelRatio,
// Resize/Orientation und stellt die Kamera bereit.

import { VIRT_W, VIRT_H } from '../config.js';

export class Viewport {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scale = 1;        // virtuelle -> CSS Pixel
    this.offsetX = 0;      // Letterbox-Rand (CSS px)
    this.offsetY = 0;
    this.dpr = 1;

    this._resizeQueued = false;
    const onResize = () => this.queueResize();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    this.resize();
  }

  queueResize() {
    if (this._resizeQueued) return;
    this._resizeQueued = true;
    requestAnimationFrame(() => {
      this._resizeQueued = false;
      this.resize();
    });
  }

  resize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Backing-Store füllt den ganzen Bildschirm (scharfe Retina-Darstellung).
    this.canvas.width = Math.round(vw * this.dpr);
    this.canvas.height = Math.round(vh * this.dpr);
    this.canvas.style.width = vw + 'px';
    this.canvas.style.height = vh + 'px';

    // Letterbox: virtuelles Feld so groß wie möglich, Seitenverhältnis halten.
    this.scale = Math.min(vw / VIRT_W, vh / VIRT_H);
    this.offsetX = (vw - VIRT_W * this.scale) / 2;
    this.offsetY = (vh - VIRT_H * this.scale) / 2;
  }

  // Setzt die Transform so, dass im Folgenden in virtuellen Koordinaten
  // (0..540 / 0..960) gezeichnet werden kann.
  begin() {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const s = this.scale * this.dpr;
    ctx.setTransform(s, 0, 0, s, this.offsetX * this.dpr, this.offsetY * this.dpr);
  }
}
