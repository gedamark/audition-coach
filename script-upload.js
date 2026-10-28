
/* Audition Coach — Parent Script Upload
   Development version: PDF, photo, and text.
   Files are processed in the browser.
*/
(() => {
  const $ = id => document.getElementById(id);
  const key = () =>
    "audition_" +
    (localStorage.getItem("audition_family_active_v1") || "none") +
    "_scripts_v1";

  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(key())) || [];
    } catch {
      return [];
    }
  };

  let scripts = load();
  let current = 0;

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <h2>🎭 My Audition Scripts</h2>
    <p class="muted">
      Parents can add a monologue using a PDF,
      photo, or pasted text.
    </p>
    <div class="field">
      <label>Production</label>
      <input id="scriptShow"
        placeholder="e.g. The Lion King Jr.">
    </div>
    <div class="field">
      <label>Character or monologue title</label>
      <input id="scriptRole"
        placeholder="Character name">
    </div>
    <div class="field">
      <label>Upload PDF or photo</label>
      <input id="scriptFile" type="file"
        accept=".pdf,application/pdf,image/*">
    </div>
    <p class="muted" id="scriptStatus">
      Or paste the dialogue below.
    </p>
    <div class="field">
      <label>Review and edit the dialogue</label>
      <textarea id="scriptText" rows="9"
        style="width:100%;padding:12px;
        border:1px solid #e9e2f3;
        border-radius:13px;font:inherit"
        placeholder="Your monologue goes here...">
      </textarea>
    </div>
    <button class="save" id="scriptSave">
      Save Monologue ✨
    </button>
    <div class="field">
      <label>Saved monologues</label>
      <select id="scriptSelect"></select>
    </div>
    <button class="secondary" id="scriptPractice">
      Practice Selected Monologue 🎤
    </button>
    <button class="secondary" id="scriptDelete"
      style="margin-top:8px">
      Delete Selected Monologue
    </button>
    <p class="muted">
      Scripts are saved in this browser for the
      selected performer. No script account or
      cloud backup is provided.
    </p>
  `;

  $("parent").insertBefore(card, $("parent").firstChild);

  function setStatus(message) {
    $("scriptStatus").textContent = message;
  }

  function refresh() {
    scripts = load();
    const select = $("scriptSelect");
    select.replaceChildren();

    scripts.forEach((s, i) => {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = `${s.show} — ${s.role}`;
      select.appendChild(option);
    });

    if (scripts.length) {
      current = Math.min(current, scripts.length - 1);
      select.value = current;
    }
  }

  function showSelected() {
    const s = scripts[current];
    if (!s) return;
    $("scriptShow").value = s.show;
    $("scriptRole").value = s.role;
    $("scriptText").value = s.text;
  }

  $("scriptSelect").onchange = e => {
    current = Number(e.target.value);
    showSelected();
  };

  $("scriptSave").onclick = () => {
    const show = $("scriptShow").value.trim();
    const role = $("scriptRole").value.trim();
    const text = $("scriptText").value.trim();

    if (!text) {
      setStatus("Add or extract some dialogue first.");
      return;
    }

    scripts.push({
      show: show || "Audition",
      role: role || "Monologue",
      text
    });

    try {
      localStorage.setItem(key(), JSON.stringify(scripts));
      current = scripts.length - 1;
      refresh();
      setStatus("Saved! ✨");
    } catch {
      scripts.pop();
      setStatus("Device storage is full or unavailable.");
    }
  };

  $("scriptDelete").onclick = () => {
    if (!scripts.length) return;
    if (!confirm("Delete this saved monologue?")) return;
    scripts.splice(current, 1);
    localStorage.setItem(key(), JSON.stringify(scripts));
    current = 0;
    refresh();
    $("scriptText").value = "";
    setStatus("Monologue deleted.");
  };

  $("scriptPractice").onclick = () => {
    const s = scripts[Number($("scriptSelect").value)];
    if (!s) {
      setStatus("Save a monologue first.");
      return;
    }

    const words = s.text.trim().split(/\s+/);
    const starter = words.slice(0, 6).join(" ");

    localStorage.setItem(
      "audition_" +
      (localStorage.getItem("audition_family_active_v1") || "none") +
      "_starter",
      starter
    );

    if (typeof refreshHints === "function") refreshHints();
    document.querySelector('[data-view="practice"]').click();
  };

  function library(url, globalName) {
    return new Promise((resolve, reject) => {
      if (window[globalName]) return resolve();
      const tag = document.createElement("script");
      tag.src = url;
      tag.onload = resolve;
      tag.onerror = () => reject(new Error("Library unavailable"));
      document.head.appendChild(tag);
    });
  }

  async function readPDF(file) {
    await library(
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
      "pdfjsLib"
    );

    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    const pdf = await pdfjsLib.getDocument({
      data: await file.arrayBuffer()
    }).promise;

    let text = "";
    for (let page = 1; page <= pdf.numPages; page++) {
      const p = await pdf.getPage(page);
      const content = await p.getTextContent();
      text += content.items.map(x => x.str).join(" ") + "\n";
    }
    return text.trim();
  }

  async function readImage(file) {
    await library(
      "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js",
      "Tesseract"
    );
    const result = await Tesseract.recognize(file, "eng");
    return result.data.text.trim();
  }

  $("scriptFile").onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setStatus("Choose a file smaller than 15 MB.");
      return;
    }

    setStatus("Reading your script... Please wait.");

    try {
      let text;
      if (file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf")) {
        text = await readPDF(file);
        if (!text) {
          setStatus(
            "This may be a scanned PDF. Try a photo or paste the text."
          );
          return;
        }
      } else if (file.type.startsWith("image/")) {
        text = await readImage(file);
      } else {
        throw new Error("Unsupported file");
      }

      if (!text) throw new Error("No text detected");

      $("scriptText").value = text;
      setStatus(
        "Text extracted! Check it carefully, then tap Save Monologue."
      );
    } catch (err) {
      setStatus(
        "Could not read this file. Try another photo or paste the text."
      );
    }
  };

  refresh();
})();
