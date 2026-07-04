/* =========================================================================
   router.js — tiny hash router.
   Routes (all optional trailing segments):
     #/                                                        -> home
     #/:classId                                                -> subjects
     #/:classId/:subjectId                                     -> chapters
     #/:classId/:subjectId/:chapterId                          -> resource types
     #/:classId/:subjectId/:chapterId/:resource                -> content
   Hash routing needs zero server rewrite rules, so it works unmodified on
   GitHub Pages, Netlify, Vercel or any plain static host, and the browser's
   native Back/Forward buttons work for free via the "hashchange" event.
   ========================================================================= */

const Router = (() => {
  let onChange = () => {};

  function parseHash() {
    const raw = window.location.hash.replace(/^#\/?/, "").replace(/\/$/, "");
    const parts = raw.split("/").filter(Boolean).map(decodeURIComponent);
    const [classId, subjectId, chapterId, resource] = parts;
    return { classId, subjectId, chapterId, resource };
  }

  function navigate(path) {
    window.location.hash = path.startsWith("/") ? path : "/" + path;
  }

  function init(callback) {
    onChange = callback;
    window.addEventListener("hashchange", () => onChange(parseHash()));
    if (!window.location.hash) window.location.hash = "#/";
    onChange(parseHash());
  }

  return { init, navigate, parseHash };
})();
