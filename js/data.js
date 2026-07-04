/* =========================================================================
   data.js — fetches the content manifest (content/index.json) and the
   individual markdown files it points to. Everything here is read-only
   fetch + in-memory caching; there is no backend involved.
   ========================================================================= */

const Data = (() => {
  let manifestPromise = null;
  const mdCache = new Map();

  function getManifest() {
    if (!manifestPromise) {
      manifestPromise = fetch("/content/index.json", { cache: "no-cache" })
        .then((res) => {
          if (!res.ok) throw new Error("Could not load content/index.json (status " + res.status + ")");
          return res.json();
        })
        .catch((err) => {
          manifestPromise = null; // allow retry
          throw err;
        });
    }
    return manifestPromise;
  }

  async function getClass(classId) {
    const manifest = await getManifest();
    return manifest.classes.find((c) => c.id === classId) || null;
  }

  async function getSubject(classId, subjectId) {
    const cls = await getClass(classId);
    if (!cls) return null;
    return cls.subjects.find((s) => s.id === subjectId) || null;
  }

  async function getChapter(classId, subjectId, chapterId) {
    const subject = await getSubject(classId, subjectId);
    if (!subject) return null;
    return subject.chapters.find((c) => c.id === chapterId) || null;
  }

  /**
   * Fetches a markdown file for a given chapter + resource type.
   * resourceType: 'summary' | 'qna' | 'mock-paper'
   * Returns { ok: true, text } or { ok: false, status }
   */
  async function getMarkdown(classId, subjectId, chapterId, resourceType) {
    const path = `/content/${classId}/${subjectId}/${chapterId}/${resourceType}.md`;
    if (mdCache.has(path)) return mdCache.get(path);

    const result = await fetch(path, { cache: "no-cache" })
      .then(async (res) => {
        if (!res.ok) return { ok: false, status: res.status };
        const text = await res.text();
        // Defense-in-depth: some static hosts (e.g. Cloudflare Pages without a
        // top-level 404.html) treat this as a single-page app and silently
        // rewrite ANY unmatched request — including a missing .md file — to
        // index.html with a 200 OK. Without this check, that HTML would get
        // rendered as if it were the chapter's markdown. A real .md file for
        // this site never starts with a doctype/html tag, so treat that shape
        // as "not actually found" rather than trusting the HTTP status alone.
        if (/^\s*<(!doctype html|html)/i.test(text)) return { ok: false, status: res.status };
        return { ok: true, text };
      })
      .catch(() => ({ ok: false, status: 0 }));

    mdCache.set(path, result);
    return result;
  }

  return { getManifest, getClass, getSubject, getChapter, getMarkdown };
})();
