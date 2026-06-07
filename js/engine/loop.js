// loop.js — Fester Zeitschritt mit Akkumulator. Deterministische Physik
// unabhängig von 60Hz oder 120Hz (ProMotion), inklusive dt-Clamp gegen
// die "spiral of death" nach einem Hintergrund-Resume.

const STEP = 1 / 60;       // fester Physik-Schritt (Sekunden)
const MAX_FRAME = 0.25;    // maximale verarbeitete Zeit pro Frame

export function startLoop(update, render) {
  let last = performance.now() / 1000;
  let acc = 0;

  function frame(nowMs) {
    const now = nowMs / 1000;
    let dt = now - last;
    last = now;
    if (dt > MAX_FRAME) dt = MAX_FRAME;

    acc += dt;
    while (acc >= STEP) {
      update(STEP);
      acc -= STEP;
    }
    render(acc / STEP);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
