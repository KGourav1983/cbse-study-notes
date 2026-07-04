/* =========================================================================
   protection.js
   -------------------------------------------------------------------------
   IMPORTANT — read before relying on this:
   These are casual-copy DETERRENTS only (disabled right-click, disabled
   text selection, blocked copy/save/print shortcuts, a faint watermark).
   They do NOT provide real content security. Anything rendered in a
   browser can still be captured — via the page's view-source / dev tools,
   a screen reader's text access, a screenshot, or simply retyping what's
   on screen. Do not present this to students/parents as making the notes
   un-copyable; it only raises the bar against casual copy-paste.

   Scope: listeners are only attached while a content view (.content-
   protected) is on screen, and removed when the user navigates away, so
   they never interfere with normal use of the rest of the site.
   ========================================================================= */

const Protection = (() => {
  let activeEl = null;
  let toastTimer = null;

  function showToast(message) {
    const toast = document.getElementById("toast");
    const msg = document.getElementById("toast-msg");
    if (!toast || !msg) return;
    msg.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  function onContextMenu(e) {
    e.preventDefault();
    showToast("Right-click is disabled on this page.");
  }

  function onCopyCut(e) {
    e.preventDefault();
    showToast("Copying is disabled on this page.");
  }

  function onDragStart(e) {
    if (e.target && e.target.tagName === "IMG") e.preventDefault();
  }

  function onKeyDown(e) {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    const key = e.key.toLowerCase();
    if (key === "c" || key === "s" || key === "p") {
      e.preventDefault();
      showToast(
        key === "p" ? "Printing is disabled on this page." : "Copying and saving are disabled on this page."
      );
    }
  }

  function makeWatermarkSVG(text) {
    const safe = MD.escapeHtml(text);
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='260' height='160'>
      <text x='0' y='90' transform='rotate(-24 130 80)' text-anchor='middle'
        font-family='IBM Plex Mono, monospace' font-size='16' fill='#1b2a4a'>${safe}</text>
    </svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  function attach(containerEl, watermarkText) {
    detach();
    if (!containerEl) return;
    activeEl = containerEl;
    activeEl.classList.add("content-protected");

    if (watermarkText) {
      const layer = document.createElement("div");
      layer.className = "watermark-layer";
      layer.style.setProperty("--watermark-svg", makeWatermarkSVG(watermarkText));
      layer.setAttribute("aria-hidden", "true");
      activeEl.style.position = activeEl.style.position || "relative";
      activeEl.prepend(layer);
    }

    activeEl.addEventListener("contextmenu", onContextMenu);
    activeEl.addEventListener("copy", onCopyCut);
    activeEl.addEventListener("cut", onCopyCut);
    activeEl.addEventListener("dragstart", onDragStart);
    document.addEventListener("keydown", onKeyDown, true);
  }

  function detach() {
    if (!activeEl) return;
    activeEl.removeEventListener("contextmenu", onContextMenu);
    activeEl.removeEventListener("copy", onCopyCut);
    activeEl.removeEventListener("cut", onCopyCut);
    activeEl.removeEventListener("dragstart", onDragStart);
    document.removeEventListener("keydown", onKeyDown, true);
    activeEl = null;
  }

  return { attach, detach, showToast };
})();
