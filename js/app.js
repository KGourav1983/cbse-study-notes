/* =========================================================================
   app.js — entry point. Wires Router -> Views, plus the small bits of
   global chrome (back button delegation, theme, PWA install).
   ========================================================================= */

(function () {
  const main = document.getElementById("app-main");

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  async function handleRoute({ classId, subjectId, chapterId, resource }) {
    try {
      if (!classId) await Views.renderHome(main);
      else if (!subjectId) await Views.renderSubjects(main, classId);
      else if (!chapterId) await Views.renderChapters(main, classId, subjectId);
      else if (!resource) await Views.renderResourceTypes(main, classId, subjectId, chapterId);
      else await Views.renderContent(main, classId, subjectId, chapterId, resource);
    } catch (err) {
      console.error(err);
      Views.renderNotFound(main, "Something went wrong loading that page.");
    }
    scrollToTop();
  }

  // Every view's "Back" button uses [data-back]; delegate once instead of
  // rebinding a listener on every render.
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-back]");
    if (btn) history.back();
  });

  // Buttons that scroll to a section on the current page (e.g. "Browse all
  // classes" on Home) use [data-scroll-to="<element id>"] rather than a
  // "#id" href, so they don't get mistaken for a route change by the router.
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-scroll-to]");
    if (!btn) return;
    const target = document.getElementById(btn.getAttribute("data-scroll-to"));
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  Theme.init();
  PWA.init();
  Router.init(handleRoute);
})();
