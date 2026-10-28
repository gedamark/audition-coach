
/* Audition Coach — Full-Script Practice */
(() => {
  const $ = id => document.getElementById(id);

  function activeProfileKey() {
    const id =
      localStorage.getItem("audition_family_active_v1") ||
      "none";
    return `audition_${id}_scripts_v1`;
  }

  function getScripts() {
    try {
      const data = JSON.parse(
        localStorage.getItem(activeProfileKey()) || "[]"
      );
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <h2>📖 Full-Script Practice</h2>
    <p class="muted">
      Choose a saved monologue, then read,
      listen, or practice from memory.
    </p>

    <div class="field">
      <label for="fullScriptSelect">Monologue</label>
      <select id="fullScriptSelect"></select>
    </div>

    <div style="display:flex;flex-wrap:wrap;gap:8px">
      <button class="secondary" id="fullRead">
        📖 Read Along
      </button>
      <button class="secondary" id="fullListen">
        🔊 Listen & Learn
      </button>
      <button class="secondary" id="fullStop">
        ⏹ Stop Listening
      </button>
      <button class="secondary" id="fullMemory">
        🙈 Memory Challenge
      </button>
      <button class="secondary" id="fullReveal">
        👀 Reveal Words
      </button>
    </div>

    <p class="muted" id="fullScriptStatus"
       aria-live="polite">
      Select a saved monologue to begin.
    </p>

    <div id="fullScriptText"
         style="white-space:pre-wrap;
                line-height:1.8;
                padding:16px;
                border:1px solid #e9e2f3;
                border-radius:13px;
                min-height:100px;
                overflow-wrap:anywhere">
    </div>
  `;

  const select = card.querySelector("#fullScriptSelect");
  const display = card.querySelector("#fullScriptText");
  const status = card.querySelector("#fullScriptStatus");

  let scripts = [];
  let hidden = false;

  function stopSpeaking() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  function currentScript() {
    return scripts[Number(select.value)] || null;
  }

  function showText() {
    const script = currentScript();
    display.textContent = script
      ? script.text
      : "No saved monologues yet.";
    hidden = false;
  }

  function refreshScripts() {
    stopSpeaking();
    scripts = getScripts();
    select.replaceChildren();

    scripts.forEach((script, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent =
        `${script.show || "Audition"} — ` +
        `${script.role || "Monologue"}`;
      select.appendChild(option);
    });

    if (!scripts.length) {
      display.textContent =
        "Save a monologue in the Parent section first.";
      status.textContent = "No saved monologues yet.";
      return;
    }

    showText();
    status.textContent = "Ready to practice!";
  }

  select.addEventListener("change", () => {
    stopSpeaking();
    showText();
    status.textContent = "Monologue selected.";
  });

  card.querySelector("#fullRead").onclick = () => {
    stopSpeaking();
    showText();
    status.textContent = "Read along at your own pace.";
  };

  card.querySelector("#fullListen").onclick = () => {
    const script = currentScript();

    if (!script) {
      status.textContent = "Choose a monologue first.";
      return;
    }

    if (!("speechSynthesis" in window)) {
      status.textContent =
        "Speech playback is unavailable on this device.";
      return;
    }

    stopSpeaking();
    showText();

    const utterance = new SpeechSynthesisUtterance(
      script.text
    );
    utterance.rate = 0.85;

    utterance.onend = () => {
      status.textContent = "Finished reading.";
    };

    utterance.onerror = () => {
      status.textContent =
        "Speech stopped or could not play.";
    };

    status.textContent = "Reading your monologue aloud...";
    window.speechSynthesis.speak(utterance);
  };

  card.querySelector("#fullStop").onclick = () => {
    stopSpeaking();
    status.textContent = "Listening stopped.";
  };

  card.querySelector("#fullMemory").onclick = () => {
    const script = currentScript();

    if (!script) {
      status.textContent = "Choose a monologue first.";
      return;
    }

    stopSpeaking();
    hidden = true;
    display.textContent =
      "🎭 Your lines are hidden. " +
      "Perform from memory, then reveal them!";
    status.textContent = "Memory Challenge started.";
  };

  card.querySelector("#fullReveal").onclick = () => {
    if (!currentScript()) return;
    showText();
    status.textContent = "Your words are revealed!";
  };

  function install() {
    const practice = $("practice");
    if (!practice) return;

    practice.appendChild(card);

    const observer = new MutationObserver(() => {
      if (!practice.hidden &&
          getComputedStyle(practice).display !== "none") {
        const latest = JSON.stringify(getScripts());
        const current = JSON.stringify(scripts);

        if (latest !== current) {
          refreshScripts();
        }
      }
    });

    observer.observe(practice, {
      attributes: true,
      attributeFilter: ["style", "hidden", "class"]
    });

    document.querySelectorAll(
      '[data-view="practice"]'
    ).forEach(button => {
      button.addEventListener("click", () => {
        refreshScripts();
      });
    });

    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) stopSpeaking();
      }
    );

    refreshScripts();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install);
  } else {
    install();
  }
})();
