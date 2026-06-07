// input.js — Vereinheitlichte Eingabe. Touch-Buttons (Pointer Events) und
// Tastatur schreiben in dasselbe abstrakte State-Objekt. Edge-Pulse für
// jump/throw werden vom Spieler einmalig konsumiert (consume*).

export class Input {
  constructor() {
    this.actions = { left: false, right: false, jump: false, throw: false };
    this._jumpEdge = false;
    this._throwEdge = false;
    // Tastatur kann mehrere Tasten gleichzeitig setzen -> Zähler je Action,
    // damit Touch + Tastatur sich nicht gegenseitig "ausschalten".
    this._keyLeft = false;
    this._keyRight = false;

    this._bindKeyboard();
  }

  // Bindet die DOM-Touch-Buttons (Pointer Events => sauberes Multi-Touch).
  bindTouchButtons(map) {
    for (const [name, el] of Object.entries(map)) {
      if (!el) continue;
      const press = (e) => {
        e.preventDefault();
        this.actions[name] = true;
        if (name === 'jump') this._jumpEdge = true;
        if (name === 'throw') this._throwEdge = true;
        el.classList.add('pressed');
      };
      const release = (e) => {
        if (e) e.preventDefault();
        this.actions[name] = false;
        el.classList.remove('pressed');
      };
      el.addEventListener('pointerdown', press);
      el.addEventListener('pointerup', release);
      el.addEventListener('pointercancel', release);
      el.addEventListener('pointerleave', release);
    }
  }

  _bindKeyboard() {
    const down = (e) => {
      switch (e.code) {
        case 'ArrowLeft': case 'KeyA': this._keyLeft = true; this.actions.left = true; break;
        case 'ArrowRight': case 'KeyD': this._keyRight = true; this.actions.right = true; break;
        case 'Space': case 'ArrowUp': case 'KeyW':
          if (!this.actions.jump) this._jumpEdge = true;
          this.actions.jump = true; e.preventDefault(); break;
        case 'KeyF': case 'KeyJ': case 'Enter':
          if (!this.actions.throw) this._throwEdge = true;
          this.actions.throw = true; break;
      }
    };
    const up = (e) => {
      switch (e.code) {
        case 'ArrowLeft': case 'KeyA': this._keyLeft = false; this.actions.left = false; break;
        case 'ArrowRight': case 'KeyD': this._keyRight = false; this.actions.right = false; break;
        case 'Space': case 'ArrowUp': case 'KeyW': this.actions.jump = false; break;
        case 'KeyF': case 'KeyJ': case 'Enter': this.actions.throw = false; break;
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
  }

  // Einmalige Abfrage des Sprung-Pulses (für Jump-Buffer im Spieler).
  consumeJump() {
    const v = this._jumpEdge;
    this._jumpEdge = false;
    return v;
  }

  consumeThrow() {
    const v = this._throwEdge;
    this._throwEdge = false;
    return v;
  }

  // Setzt flüchtige Zustände zurück (z. B. beim Screen-Wechsel).
  reset() {
    this.actions.left = this.actions.right = this.actions.jump = this.actions.throw = false;
    this._jumpEdge = this._throwEdge = false;
  }
}
