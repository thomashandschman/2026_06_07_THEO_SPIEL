// viewport.js — Skaliert das virtuelle Spielfeld (540×960 Hoch- bzw.
// 960×540 Querformat) auf den echten Bildschirm (Letterbox-Fit), kümmert
// sich um devicePixelRatio, Resize/Orientation und tauscht das Feld
// automatisch, sobald das Gerät gedreht wird.

import { VIRT_W, VIRT_H, setOrientation } from '../config.js';

export class Viewport {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scale = 1;        // virtuelle -> CSS Pixel
    this.offsetX = 0;      // Letterbox-Rand (CSS px)
    this.offsetY = 0;
    this.dpr = 1;
    this.landscape = false;       // aktuelle Orientierung
    this.onChange = null;         // Callback bei Orientierungswechsel (von main.js)

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

    // Orientierung erkennen und das virtuelle Feld passend drehen. Dadurch
    // füllt das Spiel im Querformat den Bildschirm (statt schmaler Strich).
    const landscape = vw > vh;
    const changed = landscape !== this.landscape;
    this.landscape = landscape;
    setOrientation(landscape);

    // Backing-Store füllt den ganzen Bildschirm (scharfe Retina-Darstellung).
    this.canvas.width = Math.round(vw * this.dpr);
    this.canvas.height = Math.round(vh * this.dpr);
    this.canvas.style.width = vw + 'px';
    this.canvas.style.height = vh + 'px';

    // Letterbox: virtuelles Feld so groß wie möglich, Seitenverhältnis halten.
    this.scale = Math.min(vw / VIRT_W, vh / VIRT_H);
    this.offsetX = (vw - VIRT_W * this.scale) / 2;
    this.offsetY = (vh - VIRT_H * this.scale) / 2;

    // Bei echtem Orientierungswechsel das Spiel benachrichtigen (Kamera neu
    // zentrieren, Menü-Sterne fürs neue Format erzeugen).
    if (changed && this.onChange) this.onChange();
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
