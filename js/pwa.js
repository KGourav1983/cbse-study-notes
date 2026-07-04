/* =========================================================================
   pwa.js — service worker registration + "Install app" button.
   ========================================================================= */

const PWA = (() => {
  let deferredPrompt = null;

  function init() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js").catch((err) => {
          console.warn("Service worker registration failed:", err);
        });
      });
    }

    const installBtn = document.getElementById("install-btn");
    if (!installBtn) return;

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;
      installBtn.hidden = false;
      installBtn.classList.add("is-visible");
    });

    installBtn.addEventListener("click", async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      installBtn.hidden = true;
      installBtn.classList.remove("is-visible");
    });

    window.addEventListener("appinstalled", () => {
      installBtn.hidden = true;
      installBtn.classList.remove("is-visible");
    });
  }

  return { init };
})();
