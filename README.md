# 🌿 Work&Play -- Mein persönliches Lern- und Hobbyprojekt

**Three.js • JavaScript • Vite • Web Development • UI/UX • Game
Mechanics**

**ENGLISH VERSION BELOW**

------------------------------------------------------------------------

# 🇩🇪 Deutsch

## 📌 Überblick

**Work&Play** ist ein persönliches Lern- und Hobbyprojekt.\
Ich nutze es, um Schritt für Schritt Webentwicklung, Three.js,
UI-Struktur und grundlegende Spielmechaniken zu üben.

Das Projekt ist nicht professionell gestartet -- sondern aus Spaß und
Neugier.\
Während echte Fokus- und Pausenblöcke ablaufen, entwickelt sich eine
kleine 3D-Welt:\
Pflanzen wachsen, der Tag-/Nachtzyklus schreitet voran und nach dem
Arbeiten kann man die Welt erkunden.

------------------------------------------------------------------------

## ✨ Features

### 🕒 Fokus- und Pausen-Timer

-   Erstellen eigener Fokus-/Pausenblöcke\
-   Individuell benennbare Phasen\
-   Farben für Fokus vs. Pause\
-   Drag & Drop zum Umordnen\
-   Kleiner Ton beim Ablauf eines Blocks\
-   Während laufender Timer ist das Spielen gesperrt

### 🌞 Tag-/Nachtzyklus

-   Fokus = Tag\
-   Pause = Nacht\
-   Übergänge: Sonnenaufgang → Mittag → Sonnenuntergang → Nacht\
-   Dynamisches Licht + Farbstimmung

### 🌱 Wachsendes Ökosystem

-   Jeder abgeschlossene Block = **1 Samen**\
-   Pflanzen haben feste Wachstumszeiten:
    -   Busch → 4 Blöcke\
    -   Großer Baum → 8 Blöcke\
-   Wachstum basiert auf echten Fokus-/Pausenzeiten\
-   Welt wächst dynamisch:
    -   Anfangs kleiner Bereich\
    -   Ab X gepflanzten Bäumen werden Zonen freigeschaltet\
-   Geplant: Steine, Materialien, Ressourcen

### 🏡 Persistente 3D-Welt

-   Welt basiert auf einem festen Seed\
-   Spieler + Haus spawnen immer am gleichen Ort\
-   Avatar als Sprite (z. B. Magier)

### 🎮 3D-Webtechnologie

-   Three.js (ES Modules)\
-   Low-Poly Stil\
-   Bewegung + Kollisionen\
-   Sprite-Animationen\
-   Dynamische Welt-Erweiterung

------------------------------------------------------------------------

## 🧱 Projektstruktur

    /src
      /core        → Timer, Pflanzenlogik, Tageszyklus
      /world       → Three.js-Szene, Welt, Spieler
      /ui          → Panels, Timer, Buttons, Interaktionen
      /utils       → kleine Helferfunktionen
      /assets      → öffentliche Assets (frei verwendbar)
    /public
      index.html
      styles.css

> 🎨 **Eigene Blender-Modelle, Texturen und private Assets liegen in
> einem separaten privaten Repository.**\
> Der öffentliche Teil enthält nur den Code und frei nutzbare Dateien.

------------------------------------------------------------------------

## 💡 Warum ich dieses Projekt mache

Ich nutze work-play-FocusTimer, um:

-   JavaScript besser zu verstehen\
-   Three.js zu lernen\
-   Struktur im Code aufzubauen\
-   Fehler zu finden und zu lösen\
-   zu experimentieren und Spaß zu haben

Ich arbeite dabei bewusst mit KI-Unterstützung:\
nicht, um „alles generieren zu lassen",\
sondern um aktiv zu lernen, umzubauen, zu verstehen.

Dieses Projekt wächst im gleichen Tempo wie meine eigenen Skills.

------------------------------------------------------------------------

## 🛠 Verwendete Technologien

-   Three.js\
-   JavaScript (ES Modules)\
-   Vite\
-   HTML/CSS\
-   Git & GitHub\
-   Blender (privat)

------------------------------------------------------------------------

## 🚀 Installation & Start

``` bash
git clone https://github.com/FlorianKreativLab/work-play-FocusTimer
cd work-and-play
npm install
npm run dev
```

------------------------------------------------------------------------

## 📝 Lizenz

Der Code ist öffentlich verfügbar.\
Modelle, Texturen und private Dateien befinden sich in einem separaten
**privaten Repository**.

------------------------------------------------------------------------

# 🇬🇧 English

## 📌 Overview

**Work&Play** is a personal learning and hobby project.\
I use it to practice Three.js, web development, UI structure, and simple
gameplay mechanics.

It's not meant to be a professional product --- just something I build
out of curiosity.\
As real focus and break intervals pass, a small 3D world evolves:\
plants grow, the sun moves, and after work, the player can explore the
environment.

------------------------------------------------------------------------

## ✨ Features

-   Custom focus/break timers\
-   Custom phase names\
-   Drag & drop ordering\
-   Day/night cycle\
-   Growth system (bush = 4 blocks, tree = 8 blocks)\
-   Expanding world\
-   Persistent world with fixed seed\
-   Low-poly environment in Three.js\
-   Private Blender assets stored in a separate repo

------------------------------------------------------------------------

## 💡 Motivation & Learning Goals

Work&Play helps me:

-   understand JavaScript more deeply\
-   practice Three.js\
-   learn structuring and debugging\
-   improve through experimentation

I use AI as a helper --- not as the creator.\
The goal is understanding and learning.

------------------------------------------------------------------------

## 🛠 Tech Stack

-   Three.js\
-   JavaScript (ESM)\
-   Vite\
-   HTML/CSS\
-   GitHub\
-   Blender (private assets)

------------------------------------------------------------------------

## 🚀 Run locally

``` bash
git clone https://github.com/FlorianKreativLab/work-play-FocusTimer
npm install
npm run dev
```

------------------------------------------------------------------------
