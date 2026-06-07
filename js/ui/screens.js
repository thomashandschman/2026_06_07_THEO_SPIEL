// screens.js — Steuert die DOM-Overlays (Menü, Charakterauswahl, HUD,
// Win-/Game-Over-Screen) und den Highscore in localStorage.

import { NINJAS, STRINGS, HIGHSCORE_KEY, ELEMENTS, BUFF_DURATION } from '../config.js';

export class Screens {
  constructor() {
    this.el = {
      menu: byId('screen-menu'),
      select: byId('screen-select'),
      win: byId('screen-win'),
      gameover: byId('screen-gameover'),
      hud: byId('hud'),
      touch: byId('touch'),
      cards: byId('char-cards'),
      // HUD-Felder
      score: byId('hud-score'),
      lives: byId('hud-lives'),
      world: byId('hud-world'),
      buffs: byId('hud-buffs'),
      best: byId('menu-best'),
      // Endbildschirm-Felder
      winScore: byId('win-score'),
      winBest: byId('win-best'),
      goScore: byId('go-score'),
      goBest: byId('go-best'),
      toast: byId('toast'),
    };
    this.selectedSkin = 'standard';
    this._buildCards();
  }

  _buildCards() {
    const wrap = this.el.cards;
    wrap.innerHTML = '';
    for (const [key, n] of Object.entries(NINJAS)) {
      const card = document.createElement('button');
      card.className = 'char-card';
      card.dataset.skin = key;
      card.innerHTML = `
        <canvas width="120" height="140" class="char-canvas"></canvas>
        <div class="char-name">${n.name}</div>
        <div class="char-desc">${n.desc}</div>`;
      card.addEventListener('click', () => {
        this.selectedSkin = key;
        this._highlightCards();
      });
      wrap.appendChild(card);
      drawCardNinja(card.querySelector('canvas'), n);
    }
    this._highlightCards();
  }

  _highlightCards() {
    for (const c of this.el.cards.children) {
      c.classList.toggle('selected', c.dataset.skin === this.selectedSkin);
    }
  }

  show(name) {
    const playing = name === 'play';
    for (const key of ['menu', 'select', 'win', 'gameover']) {
      this.el[key].classList.toggle('active', key === name);
    }
    this.el.hud.classList.toggle('active', playing);
    this.el.touch.classList.toggle('active', playing);
    if (name === 'menu') this.el.best.textContent = `${STRINGS.best}: ${getHighscore()}`;
  }

  updateHUD(world, player) {
    this.el.score.textContent = `⭐ ${world.score}`;
    this.el.world.textContent = world.level.name;
    // Leben als Herzen
    let hearts = '';
    for (let i = 0; i < player.lives; i++) hearts += '❤️';
    this.el.lives.textContent = hearts || '💀';

    // Buff-Balken
    const b = player.buffs;
    const bars = [];
    if (b.fire > 0)  bars.push(buffBar('fire', b.fire));
    if (b.water > 0) bars.push(buffBar('water', b.water));
    if (b.speed > 0) bars.push(buffBar('speed', b.speed));
    this.el.buffs.innerHTML = bars.join('');
  }

  toast(text) {
    const t = this.el.toast;
    t.textContent = text;
    t.classList.remove('show');
    // Reflow erzwingen, damit die Animation neu startet.
    void t.offsetWidth;
    t.classList.add('show');
  }

  showWin(score) {
    const isNew = saveHighscore(score);
    this.el.winScore.textContent = `${STRINGS.score}: ${score}`;
    this.el.winBest.innerHTML = isNew
      ? `<span class="new-best">${STRINGS.newHighscore}</span>`
      : `${STRINGS.best}: ${getHighscore()}`;
    this.show('win');
  }

  showGameOver(score) {
    const isNew = saveHighscore(score);
    this.el.goScore.textContent = `${STRINGS.score}: ${score}`;
    this.el.goBest.innerHTML = isNew
      ? `<span class="new-best">${STRINGS.newHighscore}</span>`
      : `${STRINGS.best}: ${getHighscore()}`;
    this.show('gameover');
  }
}

function buffBar(element, remaining) {
  const el = ELEMENTS[element];
  const pct = Math.max(0, Math.min(1, remaining / BUFF_DURATION)) * 100;
  return `<div class="buff"><span>${el.emoji}</span>
    <div class="buff-track"><div class="buff-fill" style="width:${pct}%;background:${el.color}"></div></div></div>`;
}

// --- Highscore (robust gegen Safari-Privatmodus) -------------------------
export function getHighscore() {
  try { return parseInt(localStorage.getItem(HIGHSCORE_KEY) || '0', 10) || 0; }
  catch { return 0; }
}

export function saveHighscore(score) {
  const best = getHighscore();
  if (score > best) {
    try { localStorage.setItem(HIGHSCORE_KEY, String(score)); } catch { /* ignore */ }
    return true;
  }
  return false;
}

// Mini-Ninja für die Auswahlkarten (eigenständig, ohne Spielkamera).
function drawCardNinja(canvas, n) {
  const ctx = canvas.getContext('2d');
  const cx = 60, cy = 80;
  // Glüh
  const g = ctx.createRadialGradient(cx, cy, 5, cx, cy, 60);
  g.addColorStop(0, n.accent + '55');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 120, 140);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1.6, 1.6);
  // Beine
  ctx.fillStyle = n.body;
  ctx.fillRect(-11, 8, 8, 14); ctx.fillRect(3, 8, 8, 14);
  // Körper
  ctx.fillStyle = n.body;
  rr(ctx, -13, -16, 26, 28, 9); ctx.fill();
  // Schärpe
  ctx.fillStyle = n.accent; ctx.fillRect(-13, -4, 26, 6);
  ctx.fillRect(-13, -12, 26, 5);
  // Maske + Auge
  ctx.fillStyle = '#0b0b1e'; rr(ctx, -12, -8, 24, 8, 3); ctx.fill();
  ctx.fillStyle = n.eye; ctx.fillRect(-9, -7, 7, 4); ctx.fillRect(2, -7, 7, 4);
  ctx.restore();
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function byId(id) { return document.getElementById(id); }
