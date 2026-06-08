# 🥷 Ninja im Weltraum

Ein 2D-Plattform- und Parkour-Spiel im Weltall-Design – für Kinder leicht zu
verstehen, aber spannend zu spielen. Optimiert für das **iPhone** (Hochformat,
Touch-Steuerung, Vollbild als Web-App).

> *Landing On A Cloud* – springe von Plattform zu Plattform durch drei Welten,
> sammle Münzen, besiege die vier Elementar-Gegner und schnapp dir ihre Kräfte!

## Spielen

### Auf dem iPhone (empfohlen)
1. Die GitHub-Pages-URL des Projekts in **Safari** öffnen.
2. Über **Teilen → „Zum Home-Bildschirm"** als Vollbild-App hinzufügen.
3. App starten – läuft dann im Hochformat und auch offline.

### Lokal testen
ES-Module brauchen einen Webserver (nicht `file://`):

```bash
cd 2026_06_07_THEO_SPIEL
python3 -m http.server 8000
```

Dann `http://localhost:8000` öffnen. Am besten in der Geräteansicht der
Browser-DevTools ein iPhone im Hochformat wählen.

## Steuerung

| Aktion   | Touch (iPhone)      | Tastatur (Desktop)      |
|----------|---------------------|-------------------------|
| Laufen   | ◀ / ▶ (unten links) | Pfeiltasten / `A` `D`   |
| Springen | ▲ (unten rechts)    | `Leertaste` / `W` / ↑   |
| Werfen   | ✦ (unten rechts)    | `F` / `J` / `Enter`     |

Bewegen, Springen und Werfen funktionieren gleichzeitig (Multi-Touch).

## Spielinhalt

- **3 Welten:** Neon-Raumstation, Asteroidengürtel, Feuerplanet.
- **3 Ninja-Skins:** Standard-, Roboter- und Cyber-Ninja (leicht unterschiedliche
  Sprung-/Lauf-Werte).
- **4 Elementar-Gegner:** ⚡ Blitz, 🔥 Feuer, 💧 Wasser, 💨 Speed.
- **Kräfte:** Besiegte Gegner lassen ihr Element fallen. Eingesammelt gibt es
  kurzzeitig eine Spezialkraft – Feuer-Wurfgeschosse, Wasser-Schild oder
  Speed-Sprint.
- **Highscore:** Die besten Punkte werden lokal gespeichert.

## Technik

- Reines **HTML5 Canvas + Vanilla JavaScript** (ES-Module), **kein Build-Schritt**.
- **Alle Spielgrafiken prozedural** gezeichnet – die einzigen Asset-Dateien
  sind die App-Icons in `icons/`.
- **PWA:** `manifest.webmanifest` + `sw.js` für Offline-Betrieb und Vollbild,
  inkl. App-Icon fürs Home-Bildschirm-Symbol.

### Projektstruktur

```
index.html              Host: Canvas + DOM-Overlays + Touch-Buttons
styles.css              Layout, Safe-Area, Touch-Buttons, Screens
manifest.webmanifest    PWA-Manifest (Hochformat, Standalone)
sw.js                   Service Worker (Offline-Cache)
icons/                  App-Icon (SVG-Quelle + PNG 192/512 + Apple-Touch)
js/
  main.js               Einstieg, verdrahtet alles
  config.js             Alle Tunables, Farben und deutschen Texte
  engine/               loop, viewport, input, game (Zustandsautomat)
  world/                levels (Daten), physics (AABB), camera
  entities/             player, enemies, projectile, pickups, powerups
  ui/                   render (Zeichnen), screens (DOM/HUD/Highscore)
```

Zum Anpassen des Spielgefühls (Tempo, Sprungkraft, Farben, Texte) genügt meist
`js/config.js`. Neue Level werden als reine Daten in `js/world/levels.js` ergänzt.

## Deployment (GitHub Pages)

Repo-**Settings → Pages → Branch** auf den Spiel-Branch (Root) setzen. Danach ist
das Spiel unter der angezeigten URL erreichbar und auf dem iPhone spielbar.
