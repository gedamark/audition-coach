(() => {
  "use strict";

  function setupPrivacy() {
    const card = document.createElement("section");
    card.className = "card";
    card.innerHTML = `
      <h2>🔒 Family Privacy</h2>
      <p class="muted">Audition Coach saves performer profiles, scripts and practice progress in this browser on this device. It does not require an account or upload that information to an Audition Coach server.</p>
      <p class="muted">Use nicknames instead of children's full names. People sharing this browser may be able to see saved information. Avoid public or shared devices.</p>
      <p class="muted">Microphone recordings are temporary and are not uploaded by Audition Coach. They disappear when this page reloads. Document processing may load third-party software from external websites; avoid sensitive documents.</p>
      <button type="button" class="secondary" id="privacyDelete">🗑️ Delete All Saved Data</button>
      <p class="muted" id="privacyStatus" role="status"></p>
    `;
    (document.querySelector(".app") || document.body).appendChild(card);

    card.querySelector("#privacyDelete").addEventListener("click", () => {
      if (!confirm("Delete all Audition Coach profiles, scripts and progress saved in this browser? This cannot be undone.")) return;
      try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("audition_")) keys.push(key);
        }
        keys.forEach(key => localStorage.removeItem(key));
        location.reload();
      } catch (error) {
        card.querySelector("#privacyStatus").textContent = "Could not delete data. Check your browser settings.";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupPrivacy, { once: true });
  } else {
    setupPrivacy();
  }
})();
