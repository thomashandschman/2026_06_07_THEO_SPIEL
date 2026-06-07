// pickups.js — Münzen und Element-Drops (fallen von besiegten Gegnern).

export function makeCoin(x, y) {
  return { x, y, w: 22, h: 22, type: 'coin', alive: true, bob: Math.random() * Math.PI * 2 };
}

// Element-Drop, das nach einem besiegten Gegner einen Buff verleiht.
export function makeDrop(x, y, element) {
  return {
    x, y, w: 28, h: 28,
    type: 'drop',
    element,            // 'lightning' | 'fire' | 'water' | 'speed'
    alive: true,
    vy: -260,           // hüpft beim Erscheinen kurz hoch
    bob: 0,
  };
}

export function updateDrop(d, dt) {
  // Leichte Schwebe-Animation, nachdem es gelandet ist.
  d.bob += dt * 4;
  if (d.vy !== 0) {
    d.vy += 900 * dt;
    d.y += d.vy * dt;
    if (d.vy > 0 && d._restY !== undefined && d.y >= d._restY) {
      d.y = d._restY; d.vy = 0;
    }
  }
}
