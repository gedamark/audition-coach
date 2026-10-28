
/* Audition Coach — Scanned PDF support */
(() => {
  const $ = id => document.getElementById(id);

  function loadLibrary(url, name) {
    return new Promise((resolve, reject) => {
      if (window[name]) return resolve();
      const script = document.createElement("script");
      script.src = url;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Library unavailable"));
      document.head.appendChild(script);
    });
  }

  function status(message) {
    const el = $("scriptStatus");
    if (el) el.textContent = message;
  }

  async function extractPDF(file) {
    await loadLibrary(
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
      "pdfjsLib"
    );

    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    const pdf = await pdfjsLib.getDocument({
      data: await file.arrayBuffer()
    }).promise;

    let result = "";

    for (let page = 1; page <= pdf.numPages; page++) {
      status(`Reading page ${page} of ${pdf.numPages}...`);

      const p = await pdf.getPage(page);
      const content = await p.getTextContent();
      const text = content.items
        .map(item => item.str)
        .join(" ")
        .trim();

      if (text) {
        result += text + "\n\n";
        continue;
      }

      status(
        `Recognizing scanned page ${page} of ${pdf.numPages}...`
      );

      await loadLibrary(
        "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js",
        "Tesseract"
      );

      const viewport = p.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);

      try {
        await p.render({
          canvasContext: canvas.getContext("2d"),
          viewport
        }).promise;

        const recognized = await Tesseract.recognize(
          canvas,
          "eng"
        );

        result += recognized.data.text.trim() + "\n\n";
      } finally {
        canvas.width = 0;
        canvas.height = 0;
      }
    }

    return result.trim();
  }

  function install() {
    const input = $("scriptFile");
    const textarea = $("scriptText");

    if (!input || !textarea) return;

    input.addEventListener("change", async event => {
      const file = event.target.files[0];
      if (!file) return;

      const isPDF =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

      if (!isPDF) return;

      if (file.size > 15 * 1024 * 1024) {
        status("Choose a PDF smaller than 15 MB.");
        return;
      }

      status("Reading PDF. Please wait...");

      try {
        const text = await extractPDF(file);

        if (!text) {
          status("No text detected in this PDF.");
          return;
        }

        textarea.value = text;
        status(
          "Text extracted! Review it, then tap Save Monologue."
        );
      } catch (error) {
        status(
          "Could not recognize this PDF. Try another file."
        );
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install);
  } else {
    install();
  }
})();
