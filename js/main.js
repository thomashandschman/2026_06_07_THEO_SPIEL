// main.js — Einstiegspunkt: erstellt Viewport/Input/Screens/Game, verdrahtet
// die Menü-Buttons und Touch-Steuerung und startet die Spiel-Schleife.

import { Viewport } from './engine/viewport.js';
import { Input } from './engine/input.js';
import { Screens } from './ui/screens.js';
import { Game } from './engine/game.js';
import { startLoop } from './engine/loop.js';
import { runIntro } from './ui/loader.js';

function boot() {
  const canvas = document.getElementById('game');
  const viewport = new Viewport(canvas);
  const input = new Input();
  const screens = new Screens();
  const game = new Game(viewport, input, screens);

  // Beim Drehen des Geräts (Hoch-/Querformat) das Spiel neu ausrichten.
  viewport.onChange = () => game.onViewportChange();

  // Touch-Buttons binden (Pointer Events => Multi-Touch).
  input.bindTouchButtons({
    left: document.getElementById('btn-left'),
    right: document.getElementById('btn-right'),
    jump: document.getElementById('btn-jump'),
    throw: document.getElementById('btn-throw'),
  });

  // Menü-Navigation
  bind('btn-play', () => game.toSelect());
  bind('btn-start', () => game.start());
  bind('btn-back', () => game.toMenu());
  bind('btn-again', () => game.start());
  bind('btn-again2', () => game.start());
  bind('btn-menu', () => game.toMenu());
  bind('btn-menu2', () => game.toMenu());

  // Menü vorbereiten und Spiel-Schleife starten; das Ninja-Lade-Intro liegt
  // als Overlay darüber und blendet danach sanft ins Menü aus.
  game.toMenu();
  startLoop((dt) => game.update(dt), () => game.render());
  runIntro(() => game.toMenu());

  // Doppeltipp-Zoom / Scrollen auf iOS unterbinden.
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });

  // Service Worker für Offline / Add-to-Home-Screen.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => { /* egal, läuft auch ohne */ });
    });
  }
}

function bind(id, fn) {
  const el = document.getElementById(id);
  if (!el) return;
  // pointerup statt click => keine 300ms-Verzögerung auf iOS.
  el.addEventListener('click', fn);
}

boot();
