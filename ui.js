// ui.js

  // ---------- Panel öffnen / schließen ----------
function initHudPanel() {
  const panel = document.getElementById("hud-panel");
  const toggleBtn = document.getElementById("hud-panel-toggle");
  const closeBtn = document.getElementById("hud-panel-close");
  
  if (!panel || !toggleBtn || !closeBtn) {
    return; // HUD nicht vorhanden
  }

  toggleBtn.addEventListener("click", () => {
    panel.classList.toggle("open");
  });

  closeBtn.addEventListener("click", () => {
    panel.classList.remove("open");
  });
}


window.addEventListener("DOMContentLoaded", () => {
  // ---------- Panel öffnen / schließen ----------
  initHudPanel();
  // Initialisierung der Reminder (Aufstehen, Trinken, Stretching)
  initReminders();

  // Initialisierung der Focus-/Pausen-Sequenz
  initFocusSequence();

  function initReminders() {
    // ---------- kleiner Ton für Reminder ----------
    function playPing() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.value = 880; // hoher kurzer Ping
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);
      } catch (e) {
        // Wenn AudioContext geblockt wird, einfach ignorieren
      }
    }

    // ---------- Reminder-Indikatoren ----------
    const indicatorStand = document.getElementById("indicator-stand");
    const indicatorDrink = document.getElementById("indicator-drink");
    const indicatorStretch = document.getElementById("indicator-stretch");

    const indicatorStandText = document.getElementById("indicator-stand-text");
    const indicatorDrinkText = document.getElementById("indicator-drink-text");
    const indicatorStretchText = document.getElementById(
      "indicator-stretch-text"
    );

    const selectStand = document.getElementById("interval-stand");
    const selectDrink = document.getElementById("interval-drink");
    const selectStretch = document.getElementById("interval-stretch");

    let standIntervalMinutes = 0;
    let drinkIntervalMinutes = 0;
    let stretchIntervalMinutes = 0;

    let nextStand = null;
    let nextDrink = null;
    let nextStretch = null;

    function updateIndicatorBaseText() {
      if (standIntervalMinutes === 0 && indicatorStandText) {
        indicatorStandText.textContent = "aus";
      }
      if (drinkIntervalMinutes === 0 && indicatorDrinkText) {
        indicatorDrinkText.textContent = "aus";
      }
      if (stretchIntervalMinutes === 0 && indicatorStretchText) {
        indicatorStretchText.textContent = "aus";
      }
    }

    function flashIndicator(el) {
      if (!el) return;
      el.classList.remove("indicator-flash");
      void el.offsetWidth; // reflow, damit Animation neu startet
      el.classList.add("indicator-flash");
    }

    if (selectStand) {
      selectStand.addEventListener("change", () => {
        standIntervalMinutes = Number(selectStand.value) || 0;
        nextStand =
          standIntervalMinutes > 0
            ? Date.now() + standIntervalMinutes * 60 * 1000
            : null;
        updateIndicatorBaseText();
      });
    }

    if (selectDrink) {
      selectDrink.addEventListener("change", () => {
        drinkIntervalMinutes = Number(selectDrink.value) || 0;
        nextDrink =
          drinkIntervalMinutes > 0
            ? Date.now() + drinkIntervalMinutes * 60 * 1000
            : null;
        updateIndicatorBaseText();
      });
    }

    if (selectStretch) {
      selectStretch.addEventListener("change", () => {
        stretchIntervalMinutes = Number(selectStretch.value) || 0;
        nextStretch =
          stretchIntervalMinutes > 0
            ? Date.now() + stretchIntervalMinutes * 60 * 1000
            : null;
        updateIndicatorBaseText();
      });
    }

    updateIndicatorBaseText();

    // Reminder-Check-Loop mit Countdown in den Feldern
    setInterval(() => {
      const now = Date.now();

      // Helper-Funktion für Countdown
      function updateCountdown(intervalMinutes, nextTime, textEl, indicatorEl) {
        if (!intervalMinutes || !nextTime || !textEl) return nextTime;

        const diff = nextTime - now;
        if (diff <= 0) {
          // Reminder feuern
          flashIndicator(indicatorEl);
          playPing();
          return now + intervalMinutes * 60 * 1000; // neues Ziel
        }

        const totalSeconds = Math.floor(diff / 1000);
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
        const seconds = String(totalSeconds % 60).padStart(2, "0");
        textEl.textContent = `${minutes}:${seconds}`;
        return nextTime;
      }

      if (standIntervalMinutes > 0) {
        nextStand = updateCountdown(
          standIntervalMinutes,
          nextStand,
          indicatorStandText,
          indicatorStand
        );
      }

      if (drinkIntervalMinutes > 0) {
        nextDrink = updateCountdown(
          drinkIntervalMinutes,
          nextDrink,
          indicatorDrinkText,
          indicatorDrink
        );
      }

      if (stretchIntervalMinutes > 0) {
        nextStretch = updateCountdown(
          stretchIntervalMinutes,
          nextStretch,
          indicatorStretchText,
          indicatorStretch
        );
      }
    }, 1000);
  }

  function initFocusSequence() {
    // ---------- Focus-/Pausen-Sequenz & Timer ----------
    const timerEl = document.getElementById("hud-timer");

    const phaseNameInput = document.getElementById("phase-name");
    const focusMinutesSelect = document.getElementById("phase-focus-minutes");
    const pauseMinutesSelect = document.getElementById("phase-pause-minutes");
    const phaseAddBtn = document.getElementById("phase-add");
    const sequenceListEl = document.getElementById("focus-sequence-list");
    const sequenceStartBtn = document.getElementById("focus-sequence-start");

    // Jeder Eintrag ist jetzt ein Block mit Fokus + Pause
    let sequence = []; // { focusMinutes: number, pauseMinutes: number, name: string }
    let currentBlockIndex = -1;
    let currentPart = 0; // 0 = Fokus, 1 = Pause
    let phaseEndTime = null;
    let timerIntervalId = null;
    let sequenceRunning = false;

    // Bäume
    const treeCountEl = document.getElementById("tree-count");
    let treeCount = 0;

    function updateTreeCount() {
      if (!treeCountEl) return;
      treeCountEl.textContent =
        treeCount + " " + (treeCount === 1 ? "Baum" : "Bäume");
    }
    updateTreeCount();

    function setTimerText(text) {
      if (timerEl) {
        timerEl.textContent = text;
      }
    }

    // Drag & Drop + Farben in einer Funktion rendern
    function renderSequence() {
      if (!sequenceListEl) return;
      sequenceListEl.innerHTML = "";

      sequence.forEach((p, index) => {
        const li = document.createElement("li");
        const labelSpan = document.createElement("span");
        const labelName = p.name || `Block ${index + 1}`;
        labelSpan.textContent = `${labelName} – Fokus: ${p.focusMinutes} Min · Pause: ${p.pauseMinutes} Min`;

        // Farb-Klasse für Block
        li.classList.add("phase-block");

        // Index merken für Drag & Drop
        li.dataset.index = String(index);

        // Entfernen-Button
        const removeBtn = document.createElement("button");
        removeBtn.className = "sequence-remove";
        removeBtn.type = "button";
        removeBtn.textContent = "✕";
        removeBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (sequenceRunning) return; // während Lauf nicht editieren
          sequence.splice(index, 1);
          renderSequence();
        });

        li.appendChild(labelSpan);
        li.appendChild(removeBtn);

        // Nur ziehbar, wenn Sequenz nicht läuft
        li.draggable = !sequenceRunning;

        // ---- Drag & Drop Events ----
        li.addEventListener("dragstart", (e) => {
          if (sequenceRunning) {
            e.preventDefault();
            return;
          }
          li.classList.add("dragging");
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", String(index));
        });

        li.addEventListener("dragend", () => {
          li.classList.remove("dragging");
        });

        li.addEventListener("dragover", (e) => {
          if (sequenceRunning) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          li.classList.add("drag-over");
        });

        li.addEventListener("dragleave", () => {
          li.classList.remove("drag-over");
        });

        li.addEventListener("drop", (e) => {
          if (sequenceRunning) return;
          e.preventDefault();
          li.classList.remove("drag-over");

          const fromIndex = parseInt(
            e.dataTransfer.getData("text/plain"),
            10
          );
          const toIndex = index;

          if (isNaN(fromIndex) || fromIndex === toIndex) return;

          // Element im Array verschieben
          const [moved] = sequence.splice(fromIndex, 1);
          sequence.splice(toIndex, 0, moved);

          // Liste neu zeichnen
          renderSequence();
        });

        sequenceListEl.appendChild(li);
      });
    }

    // Block (Fokus + Pause) hinzufügen
    if (phaseAddBtn && focusMinutesSelect && pauseMinutesSelect) {
      phaseAddBtn.type = "button";
      phaseAddBtn.addEventListener("click", (e) => {
        e.preventDefault();

        let focusMinutes = parseInt(focusMinutesSelect.value, 10);
        let pauseMinutes = parseInt(pauseMinutesSelect.value, 10);

        if (isNaN(focusMinutes) || focusMinutes <= 0) {
          focusMinutes = 1; // Fallback
        }
        if (isNaN(pauseMinutes) || pauseMinutes < 0) {
          pauseMinutes = 0; // Pause darf notfalls 0 sein
        }

        const fallbackName = `Block ${sequence.length + 1}`;
        const name =
          (phaseNameInput && phaseNameInput.value.trim()) || fallbackName;

        sequence.push({
          focusMinutes,
          pauseMinutes,
          name,
        });

        // Eingabefeld optional leeren
        if (phaseNameInput) {
          phaseNameInput.value = "";
        }

        renderSequence();
      });
    }

    function stopTimer() {
      if (timerIntervalId) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
      }
      sequenceRunning = false;
      currentBlockIndex = -1;
      currentPart = 0;
      phaseEndTime = null;
      setTimerText("bereit");
      if (sequenceStartBtn) {
        sequenceStartBtn.textContent = "Sequenz starten";
      }
      // Nach Stopp Drag & Drop wieder aktivieren
      renderSequence();
    }

    function startSequence() {
      if (sequence.length === 0) return;
      stopTimer(); // alles resetten
      sequenceRunning = true;
      currentBlockIndex = 0;
      currentPart = 0; // zuerst Fokus
      if (sequenceStartBtn) {
        sequenceStartBtn.textContent = "Stoppen";
      }
      // Während Lauf Drag & Drop deaktivieren
      renderSequence();
      startCurrentPhase();
    }

    function startCurrentPhase() {
      if (currentBlockIndex < 0 || currentBlockIndex >= sequence.length) {
        stopTimer();
        return;
      }

      const block = sequence[currentBlockIndex];
      const isFocus = currentPart === 0;
      const minutes = isFocus ? block.focusMinutes : block.pauseMinutes;

      // Wenn die aktuelle Phase 0 Minuten hätte, direkt zur nächsten springen
      if (!minutes || minutes <= 0) {
        if (isFocus) {
          // Direkt zur Pause des Blocks
          currentPart = 1;
          startCurrentPhase();
        } else {
          // Nächster Block
          currentBlockIndex++;
          currentPart = 0;
          startCurrentPhase();
        }
        return;
      }

      const durationMs = minutes * 60 * 1000;
      phaseEndTime = Date.now() + durationMs;

      if (timerIntervalId) {
        clearInterval(timerIntervalId);
      }

      const baseName = block.name || `Block ${currentBlockIndex + 1}`;
      const phaseLabel = isFocus ? `${baseName} – Fokus` : `${baseName} – Pause`;

      function updateTimerDisplay() {
        const remaining = phaseEndTime - Date.now();
        if (remaining <= 0) {
          setTimerText(phaseLabel + " – 00:00");
          clearInterval(timerIntervalId);
          timerIntervalId = null;

          // Baum pflanzen nach abgeschlossener Fokusphase
          if (isFocus) {
            treeCount++;
            updateTreeCount();
          }

          // zur nächsten Phase wechseln
          if (isFocus) {
            // Von Fokus zu Pause
            currentPart = 1;
          } else {
            // Von Pause zum nächsten Block
            currentBlockIndex++;
            currentPart = 0;
          }

          if (currentBlockIndex < sequence.length) {
            startCurrentPhase();
          } else {
            stopTimer();
          }
          return;
        }

        const totalSeconds = Math.floor(remaining / 1000);
        const minutesLeft = String(
          Math.floor(totalSeconds / 60)
        ).padStart(2, "0");
        const secondsLeft = String(totalSeconds % 60).padStart(2, "0");
        setTimerText(`${phaseLabel} – ${minutesLeft}:${secondsLeft}`);
      }

      updateTimerDisplay();
      timerIntervalId = setInterval(updateTimerDisplay, 1000);
    }

    if (sequenceStartBtn) {
      sequenceStartBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (sequenceRunning) {
          stopTimer();
        } else {
          startSequence();
        }
      });
    }

    // Timer initial
    setTimerText("bereit");
  }
});