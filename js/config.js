// config.js — Alle Tunables, Farben und deutschen Texte an einer zentralen Stelle.
// Wer das Spielgefühl ändern will, ändert (fast) nur diese Datei.

// --- Virtuelle Auflösung (Hochformat / Portrait) -------------------------
export const VIRT_W = 540;
export const VIRT_H = 960;

// --- Physik --------------------------------------------------------------
export const GRAVITY = 2000;        // px / s^2
export const MAX_FALL = 1300;       // maximale Fallgeschwindigkeit
export const MOVE_SPEED = 300;      // horizontale Laufgeschwindigkeit (Basis)
export const MOVE_ACCEL = 2600;     // Beschleunigung am Boden
export const AIR_ACCEL = 1800;      // Beschleunigung in der Luft
export const FRICTION = 2400;       // Bremsung am Boden ohne Eingabe
export const JUMP_VELOCITY = 760;   // Absprung-Geschwindigkeit (Basis)
export const COYOTE_TIME = 0.10;    // s — Sprung kurz nach Ledge noch erlaubt
export const JUMP_BUFFER = 0.12;    // s — Sprung kurz vor Landung gepuffert
export const JUMP_CUT = 0.45;       // vy-Faktor beim frühen Loslassen (variable Höhe)

// --- Kampf / Geschosse ---------------------------------------------------
export const PROJECTILE_SPEED = 620;
export const PROJECTILE_LIFE = 1.4;     // s
export const THROW_COOLDOWN = 0.28;     // s zwischen Würfen
export const PROJECTILE_DMG = 1;
export const FIRE_PROJECTILE_DMG = 2;   // mit Feuer-Buff

// --- Spieler -------------------------------------------------------------
export const PLAYER_W = 34;
export const PLAYER_H = 46;
export const START_LIVES = 3;
export const IFRAME_TIME = 1.2;         // s Unverwundbarkeit nach Treffer
export const KNOCKBACK = 360;           // px/s seitlicher Rückstoß bei Treffer

// --- Power-Ups -----------------------------------------------------------
export const BUFF_DURATION = 8;         // s
export const SPEED_BUFF_MULT = 1.6;     // Tempo-Multiplikator (Speed-Sprint)

// --- Punkte --------------------------------------------------------------
export const COIN_POINTS = 10;
export const ENEMY_POINTS = 50;
export const ELEMENT_POINTS = 25;
export const HIGHSCORE_KEY = 'theo_highscore';

// --- Ninja-Skins ---------------------------------------------------------
// speed/jump sind milde Multiplikatoren (±15 %), damit keine Wahl "falsch" ist.
export const NINJAS = {
  standard: { name: 'Standard-Ninja', body: '#2d2d44', accent: '#ff2e63', eye: '#7afcff', speed: 1.0,  jump: 1.0,  desc: 'Ausgewogen' },
  robot:    { name: 'Roboter-Ninja',  body: '#9aa6b2', accent: '#00e5ff', eye: '#ffffff', speed: 0.9,  jump: 1.15, desc: 'Springt höher' },
  cyber:    { name: 'Cyber-Ninja',    body: '#1a1a2e', accent: '#b400ff', eye: '#39ff14', speed: 1.15, jump: 0.95, desc: 'Läuft schneller' },
};

// --- Element-/Gegner-Farben ----------------------------------------------
export const ELEMENTS = {
  lightning: { color: '#ffe14d', glow: '#fff3a0', label: 'Blitz',  emoji: '⚡' },
  fire:      { color: '#ff5a1f', glow: '#ffb061', label: 'Feuer',  emoji: '🔥' },
  water:     { color: '#33c2ff', glow: '#aef0ff', label: 'Wasser', emoji: '💧' },
  speed:     { color: '#39ff14', glow: '#c6ffba', label: 'Speed',  emoji: '💨' },
};

// --- Welt-Themen (Parallax-Hintergrund) ----------------------------------
export const THEMES = {
  station:    { sky: ['#0b0b2e', '#1a0b3d'], accent: '#ff2e63', star: '#9ad7ff', platform: '#26264d', edge: '#00e5ff' },
  asteroids:  { sky: ['#06121f', '#0a2236'], accent: '#7afcff', star: '#ffffff', platform: '#3a3326', edge: '#caa15a' },
  fireplanet: { sky: ['#2a0606', '#4d1500'], accent: '#ffd24d', star: '#ffcaa0', platform: '#3a1410', edge: '#ff6a1f' },
};

// --- Deutsche Texte ------------------------------------------------------
export const STRINGS = {
  title: 'NINJA IM WELTRAUM',
  start: 'Spiel starten',
  selectChar: 'Wähle deinen Ninja',
  play: 'Los geht\'s!',
  back: 'Zurück',
  world: 'Welt',
  score: 'Punkte',
  lives: 'Leben',
  best: 'Rekord',
  win: 'Geschafft! 🎉',
  winSub: 'Du hast alle Welten gemeistert!',
  gameover: 'Game Over',
  gameoverSub: 'Versuch es nochmal, Ninja!',
  newHighscore: '🏆 Neuer Rekord!',
  again: 'Nochmal spielen',
  menu: 'Hauptmenü',
  levelComplete: 'Welt geschafft!',
  goalHint: 'Erreiche die Flagge 🚩',
  tapToStart: 'Tippe zum Starten',
};
