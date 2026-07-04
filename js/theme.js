/* =========================================================================
   theme.js — light mode / "Night Study" mode toggle.
   ========================================================================= */

const Theme = (() => {
  const STORAGE_KEY = "cbse-prep-theme";
  const sunIcon = '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" stroke-linejoin="round"/>';
  const moonIcon = '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" stroke-linecap="round"/>';

  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const btn = document.getElementById("theme-toggle");
    const icon = document.getElementById("theme-icon");
    if (btn) btn.setAttribute("aria-pressed", theme === "night" ? "true" : "false");
    if (btn) btn.setAttribute("aria-label", theme === "night" ? "Switch to day mode" : "Switch to night study mode");
    if (icon) icon.innerHTML = theme === "night" ? moonIcon : sunIcon;
  }

  function init() {
    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch {}
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    apply(saved || (prefersDark ? "night" : "day"));

    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.addEventListener("click", () => {
        const next = document.documentElement.getAttribute("data-theme") === "night" ? "day" : "night";
        apply(next);
        try { localStorage.setItem(STORAGE_KEY, next); } catch {}
      });
    }
  }

  return { init };
})();
