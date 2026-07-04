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

  Theme.init();
  PWA.init();
  Router.init(handleRoute);
})();
