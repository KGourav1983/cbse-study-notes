/* =========================================================================
   views.js — builds the HTML for every screen. Each render function is
   async: it paints a skeleton immediately, fetches what it needs from
   Data, then replaces the skeleton with real markup.
   ========================================================================= */

const Views = (() => {
  const RESOURCE_LABELS = {
    summary: "Chapter Summary & Notes",
    qna: "Top 25 Q&A",
    "mock-paper": "Mock Papers",
  };
  const RESOURCE_DESCRIPTIONS = {
    summary: "Clear, exam-ready notes for every topic in the chapter.",
    qna: "25 must-know questions as flip cards, with a study mode.",
    "mock-paper": "A full practice paper with a marking scheme and answer key.",
  };
  const CLASS_ACCENTS = {
    // Accent intensifies class-on-class — class 10 is the board-exam year,
    // so it borrows the "correction red" used for marks elsewhere on the site.
    "class-8": "var(--marigold)",
    "class-9": "var(--success-green)",
    "class-10": "var(--correction-red)",
  };

  function svg(inner, viewBox = "0 0 24 24") {
    return `<svg viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  }

  const SUBJECT_ICONS = {
    mathematics: svg('<circle cx="12" cy="7.5" r="2.2"/><path d="M6.5 19l4-9.2M17.5 19l-4-9.2M4.5 19h15"/>'),
    science: svg('<path d="M9 2.5h6M10 2.5v6.2L5.6 17a2 2 0 0 0 1.8 3h9.2a2 2 0 0 0 1.8-3L14 8.7V2.5"/><path d="M7.5 14.5h9"/>'),
    "social-science": svg('<circle cx="12" cy="12" r="8.5"/><path d="M3.7 9.5h16.6M3.7 14.5h16.6M12 3.5c2.4 2.3 3.6 5.3 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.3-3.6-8.5S9.6 5.8 12 3.5Z"/>'),
    english: svg('<path d="M4 19.5V6a2 2 0 0 1 2-2h5.5v15.5"/><path d="M11.5 4H18a2 2 0 0 1 2 2v13.5H6.2A2.2 2.2 0 0 0 4 19.7"/>'),
    hindi: svg('<path d="M5 4v16M5 4h11.5a2.5 2.5 0 0 1 0 5H5M5 12.5h10a2.5 2.5 0 0 1 0 5H5" /><path d="M3.5 20h3"/>'),
    generic: svg('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h5"/>'),
  };

  const RESOURCE_ICONS = {
    summary: svg('<rect x="4.5" y="3" width="15" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>'),
    qna: svg('<rect x="3.5" y="6" width="12" height="14" rx="2.2" transform="rotate(-8 9.5 13)"/><rect x="8.5" y="4" width="12" height="14" rx="2.2" fill="var(--paper-raised)"/><path d="M12 8.5h4.5M12 12h4.5M12 15.5h3" stroke="currentColor"/>', "0 0 24 24"),
    "mock-paper": svg('<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M9 2.5h6a1 1 0 0 1 1 1V5H8V3.5a1 1 0 0 1 1-1Z"/><path d="M8.5 11l2 2 4-4"/><path d="M8.5 16.5h7"/>'),
  };

  const CHEVRON = svg('<path d="M9 6l6 6-6 6"/>');
  const CHECK = svg('<path d="M5 13l4 4L19 7"/>');

  function subjectIcon(id) {
    return SUBJECT_ICONS[id] || SUBJECT_ICONS.generic;
  }

  /* ---------------- breadcrumb + page chrome ---------------- */

  function setBreadcrumb(crumbs) {
    const bar = document.getElementById("breadcrumb-bar");
    const nav = document.getElementById("breadcrumb");
    if (!crumbs || crumbs.length === 0) {
      bar.hidden = true;
      nav.innerHTML = "";
      return;
    }
    bar.hidden = false;
    nav.innerHTML = crumbs
      .map((c, i) => {
        const isLast = i === crumbs.length - 1;
        const sep = i > 0 ? '<span class="crumb-sep" aria-hidden="true">/</span>' : "";
        if (isLast) return `${sep}<span class="crumb-current" aria-current="page">${MD.escapeHtml(c.label)}</span>`;
        return `${sep}<a href="#${c.path}">${MD.escapeHtml(c.label)}</a>`;
      })
      .join("");
  }

  function backButtonHtml(label = "Back") {
    return `<button class="back-btn" type="button" data-back>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      ${label}
    </button>`;
  }

  function setTitle(parts) {
    document.title = [...parts, "CBSE Prep"].filter(Boolean).join(" · ");
  }

  /* ---------------- skeletons ---------------- */

  function paintSkeletonGrid(main, count = 6) {
    main.innerHTML = `
      <div class="view container">
        <div class="page-head">
          <div class="skeleton skeleton-line" style="width:160px"></div>
          <div class="skeleton skeleton-line" style="width:320px;height:30px;margin-top:14px"></div>
        </div>
        <div class="skeleton-grid">
          ${Array.from({ length: count }).map(() => '<div class="skeleton skeleton-card"></div>').join("")}
        </div>
      </div>`;
  }

  function paintSkeletonProse(main) {
    main.innerHTML = `
      <div class="view container">
        <div class="page-head">
          <div class="skeleton skeleton-line" style="width:160px"></div>
        </div>
        <div style="max-width:74ch">
          ${Array.from({ length: 7 }).map((_, i) => `<div class="skeleton skeleton-line" style="width:${90 - (i % 3) * 18}%"></div>`).join("")}
        </div>
      </div>`;
  }

  function emptyState(icon, title, message, actionHtml = "") {
    return `
      <div class="empty-state">
        <div class="card-icon" style="margin:0 auto 18px">${icon}</div>
        <h3>${title}</h3>
        <p>${message}</p>
        ${actionHtml}
      </div>`;
  }

  /* ---------------- HOME ---------------- */

  async function renderHome(main) {
    setTitle([]);
    setBreadcrumb([]);
    Protection.detach();

    let manifest;
    try {
      manifest = await Data.getManifest();
    } catch (err) {
      main.innerHTML = `<div class="view container section">${emptyState(
        SUBJECT_ICONS.generic,
        "Couldn't load the content manifest",
        "content/index.json failed to load. If you're browsing this project from disk, serve it with a local static server instead (see the README) — fetch() of local JSON is blocked by most browsers under file://."
      )}</div>`;
      return;
    }

    const totalChapters = manifest.classes.reduce(
      (sum, c) => sum + c.subjects.reduce((s2, sub) => s2 + sub.chapters.length, 0),
      0
    );

    main.innerHTML = `
      <div class="view">
        <section class="hero container">
          <div class="hero-grid">
            <div>
              <span class="hero-eyebrow">CBSE · Classes 8–10</span>
              <h1>Study smarter for the <em>board</em> that actually counts.</h1>
              <p class="hero-desc">
                Chapter-by-chapter notes, a Top 25 Q&amp;A flip-card set, and a full mock paper for every
                subject — written to match how CBSE actually marks, not just what's in the textbook.
              </p>
              <div class="hero-actions">
                <a class="btn btn-primary" href="#/class-10">Jump to Class 10</a>
                <a class="btn btn-outline" href="#/class-8">Browse all classes</a>
              </div>
              <div class="hero-stats">
                <div class="hero-stat"><div class="num">${manifest.classes.length}</div><div class="lbl">Classes covered</div></div>
                <div class="hero-stat"><div class="num">${totalChapters}</div><div class="lbl">Chapters mapped</div></div>
                <div class="hero-stat"><div class="num">3</div><div class="lbl">Resource types / chapter</div></div>
              </div>
            </div>
            <div class="exam-card" aria-hidden="true">
              <div class="exam-card-row"><span>Roll No. ____</span><span>Time: 3 Hrs</span></div>
              <h3>What you get, every chapter</h3>
              <ul class="exam-card-list">
                <li><span class="exam-tick">${CHECK}</span> Clean summary notes, exam-formatted</li>
                <li><span class="exam-tick">${CHECK}</span> Top 25 Q&amp;A as flip cards + study mode</li>
                <li><span class="exam-tick">${CHECK}</span> Full mock paper with answer key</li>
              </ul>
              <div class="exam-card-footer"><span>Max Marks: <strong>80</strong></span><span>Section A–D</span></div>
            </div>
          </div>
        </section>

        <section class="section container">
          <div class="section-title-row">
            <h2 class="section-title">Pick your class</h2>
            <span class="section-note">// updates automatically as chapters are added</span>
          </div>
          <div class="class-grid">
            ${manifest.classes
              .map((c) => {
                const chapterCount = c.subjects.reduce((s, sub) => s + sub.chapters.length, 0);
                return `
                <a class="class-card" href="#/${c.id}" style="--class-accent:${CLASS_ACCENTS[c.id] || "var(--marigold)"}">
                  <div class="class-num">${c.subjects.length} subjects · ${chapterCount} chapters</div>
                  <h3>${MD.escapeHtml(c.label)}</h3>
                  <p>${MD.escapeHtml(c.tagline || "Notes, Q&A and mock papers for every subject.")}</p>
                  <div class="class-cta">Explore ${MD.escapeHtml(c.label)} ${CHEVRON}</div>
                </a>`;
              })
              .join("")}
          </div>
        </section>
      </div>`;
  }

  /* ---------------- SUBJECTS ---------------- */

  async function renderSubjects(main, classId) {
    paintSkeletonGrid(main, 5);
    const cls = await Data.getClass(classId);
    if (!cls) return renderNotFound(main, "We couldn't find that class.");

    setTitle([cls.label]);
    setBreadcrumb([
      { label: "Home", path: "/" },
      { label: cls.label, path: `/${classId}` },
    ]);

    main.innerHTML = `
      <div class="view container">
        <div class="page-head">
          ${backButtonHtml()}
          <div class="page-eyebrow">${MD.escapeHtml(cls.label)}</div>
          <h1 class="page-title">Choose a subject</h1>
          <p class="page-sub">${MD.escapeHtml(cls.tagline || "Pick a subject to see its chapters.")}</p>
        </div>
        <div class="card-grid">
          ${cls.subjects
            .map(
              (s) => `
            <a class="subject-card" href="#/${classId}/${s.id}">
              <div class="card-icon">${subjectIcon(s.icon)}</div>
              <h3>${MD.escapeHtml(s.label)}</h3>
              <div class="meta">${s.chapters.length} chapter${s.chapters.length === 1 ? "" : "s"}</div>
            </a>`
            )
            .join("")}
        </div>
      </div>`;
  }

  /* ---------------- CHAPTERS ---------------- */

  async function renderChapters(main, classId, subjectId) {
    paintSkeletonGrid(main, 6);
    const cls = await Data.getClass(classId);
    const subject = cls && cls.subjects.find((s) => s.id === subjectId);
    if (!cls || !subject) return renderNotFound(main, "We couldn't find that subject.");

    setTitle([subject.label, cls.label]);
    setBreadcrumb([
      { label: "Home", path: "/" },
      { label: cls.label, path: `/${classId}` },
      { label: subject.label, path: `/${classId}/${subjectId}` },
    ]);

    const body = subject.chapters.length
      ? `<div class="chapter-list">
          ${subject.chapters
            .map(
              (ch) => `
            <a class="chapter-item" href="#/${classId}/${subjectId}/${ch.id}">
              <span class="chapter-num">${String(ch.number).padStart(2, "0")}</span>
              <h3>${MD.escapeHtml(ch.title)}</h3>
              <span class="chev">${CHEVRON}</span>
            </a>`
            )
            .join("")}
        </div>`
      : emptyState(
          subjectIcon(subject.icon),
          "Chapters coming soon",
          `${MD.escapeHtml(subject.label)} for ${MD.escapeHtml(cls.label)} hasn't been added to the manifest yet.`
        );

    main.innerHTML = `
      <div class="view container">
        <div class="page-head">
          ${backButtonHtml()}
          <div class="page-eyebrow">${MD.escapeHtml(cls.label)} · ${MD.escapeHtml(subject.label)}</div>
          <h1 class="page-title">Chapters</h1>
          <p class="page-sub">Pick a chapter to open its notes, Q&amp;A cards, or mock paper.</p>
        </div>
        ${body}
      </div>`;
  }

  /* ---------------- RESOURCE TYPES ---------------- */

  async function renderResourceTypes(main, classId, subjectId, chapterId) {
    paintSkeletonGrid(main, 3);
    const cls = await Data.getClass(classId);
    const subject = cls && cls.subjects.find((s) => s.id === subjectId);
    const chapter = subject && subject.chapters.find((c) => c.id === chapterId);
    if (!cls || !subject || !chapter) return renderNotFound(main, "We couldn't find that chapter.");

    setTitle([chapter.title, subject.label, cls.label]);
    setBreadcrumb([
      { label: "Home", path: "/" },
      { label: cls.label, path: `/${classId}` },
      { label: subject.label, path: `/${classId}/${subjectId}` },
      { label: chapter.title, path: `/${classId}/${subjectId}/${chapterId}` },
    ]);

    main.innerHTML = `
      <div class="view container">
        <div class="page-head">
          ${backButtonHtml()}
          <div class="page-eyebrow">${MD.escapeHtml(cls.label)} · ${MD.escapeHtml(subject.label)} · Ch. ${chapter.number}</div>
          <h1 class="page-title">${MD.escapeHtml(chapter.title)}</h1>
          <p class="page-sub">Choose how you'd like to study this chapter.</p>
        </div>
        <div class="card-grid">
          ${Object.keys(RESOURCE_LABELS)
            .map(
              (r) => `
            <a class="resource-card" href="#/${classId}/${subjectId}/${chapterId}/${r}">
              <div class="card-icon">${RESOURCE_ICONS[r]}</div>
              <h3>${RESOURCE_LABELS[r]}</h3>
              <p>${RESOURCE_DESCRIPTIONS[r]}</p>
            </a>`
            )
            .join("")}
        </div>
      </div>`;
  }

  /* ---------------- CONTENT DISPLAY ---------------- */

  function buildToc(proseEl) {
    const headings = proseEl.querySelectorAll("h2, h3");
    if (headings.length < 2) return null;
    const items = [];
    headings.forEach((h, i) => {
      const id = `sec-${i}-${h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
      h.id = id;
      items.push({ id, text: h.textContent, level: h.tagName === "H3" ? "toc-sub" : "" });
    });
    const nav = document.createElement("nav");
    nav.className = "toc";
    nav.setAttribute("aria-label", "Table of contents");
    nav.innerHTML = `<h4>On this page</h4><ul>${items
      .map((it) => `<li class="${it.level}"><a href="#${it.id}">${MD.escapeHtml(it.text)}</a></li>`)
      .join("")}</ul>`;
    return nav;
  }

  async function renderSummary(main, ctx, mdText) {
    main.innerHTML = `
      <div class="view container">
        <div class="page-head">
          ${backButtonHtml()}
          <div class="page-eyebrow">${ctx.eyebrow}</div>
          <h1 class="page-title">${MD.escapeHtml(ctx.chapter.title)} — Summary &amp; Notes</h1>
        </div>
        <div class="reading-layout">
          <div id="toc-slot"></div>
          <div class="content-shell">
            <article class="prose" id="prose-content"></article>
          </div>
        </div>
      </div>`;

    const proseEl = main.querySelector("#prose-content");
    proseEl.innerHTML = MD.renderProse(mdText);

    const toc = buildToc(proseEl);
    if (toc) main.querySelector("#toc-slot").appendChild(toc);

    Protection.attach(proseEl.closest(".content-shell"), "CBSE PREP");
  }

  async function renderQnA(main, ctx, mdText) {
    const items = MD.parseQnA(mdText);
    main.innerHTML = `
      <div class="view container">
        <div class="page-head">
          ${backButtonHtml()}
          <div class="page-eyebrow">${ctx.eyebrow}</div>
          <h1 class="page-title">${MD.escapeHtml(ctx.chapter.title)} — Top ${items.length || 25} Q&amp;A</h1>
        </div>
        <div class="content-shell"><div id="qna-slot"></div></div>
      </div>`;

    if (!items.length) {
      main.querySelector("#qna-slot").innerHTML = emptyState(
        RESOURCE_ICONS.qna,
        "Q&A coming soon",
        "This chapter's question set hasn't been written yet."
      );
      return;
    }

    const storageKey = `qna-progress:${ctx.classId}/${ctx.subjectId}/${ctx.chapterId}`;
    FlipCards.mount(main.querySelector("#qna-slot"), { items, storageKey, chapterTitle: ctx.chapter.title });
    Protection.attach(main.querySelector(".content-shell"), "CBSE PREP");
  }

  async function renderMockPaper(main, ctx, mdText) {
    const paper = MD.parseMockPaper(mdText);
    main.innerHTML = `
      <div class="view container">
        <div class="page-head">
          ${backButtonHtml()}
          <div class="page-eyebrow">${ctx.eyebrow}</div>
          <h1 class="page-title">${MD.escapeHtml(ctx.chapter.title)} — Mock Paper</h1>
        </div>
        <div class="content-shell"><div id="paper-slot"></div></div>
      </div>`;

    const slot = main.querySelector("#paper-slot");

    if (!paper.sections.length && !paper.answerKeyHtml) {
      slot.innerHTML = emptyState(
        RESOURCE_ICONS["mock-paper"],
        "Mock paper coming soon",
        "This chapter's mock paper hasn't been written yet."
      );
      return;
    }

    slot.innerHTML = `
      ${paper.meta.time || paper.meta.marks ? `
      <div class="exam-meta-bar">
        ${paper.meta.time ? `<div><span>Time Allowed</span>${MD.escapeHtml(paper.meta.time)}</div>` : ""}
        ${paper.meta.marks ? `<div><span>Maximum Marks</span>${MD.escapeHtml(paper.meta.marks)}</div>` : ""}
      </div>` : ""}
      ${paper.instructionsHtml ? `
      <div class="exam-instructions">
        <h4>General Instructions</h4>
        <div class="prose">${paper.instructionsHtml}</div>
      </div>` : ""}
      ${paper.sections
        .map(
          (s) => `
        <section class="exam-section">
          <div class="exam-section-head">
            <h3>${MD.escapeHtml(s.title)}</h3>
            ${s.marksLabel ? `<span class="marks-badge">${MD.escapeHtml(s.marksLabel)}</span>` : ""}
          </div>
          <div class="prose">${s.html}</div>
        </section>`
        )
        .join("")}
      ${paper.answerKeyHtml ? `
      <button class="btn btn-outline answer-key-toggle" id="answer-key-toggle" type="button" aria-expanded="false" aria-controls="answer-key-panel">
        <span id="answer-key-toggle-label">Show answers</span>
      </button>
      <div class="answer-key-panel" id="answer-key-panel">
        <div class="answer-key-inner prose">${paper.answerKeyHtml}</div>
      </div>` : ""}
    `;

    const toggle = slot.querySelector("#answer-key-toggle");
    if (toggle) {
      const panel = slot.querySelector("#answer-key-panel");
      const label = slot.querySelector("#answer-key-toggle-label");
      toggle.addEventListener("click", () => {
        const open = panel.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        label.textContent = open ? "Hide answers" : "Show answers";
      });
    }

    Protection.attach(main.querySelector(".content-shell"), "CBSE PREP");
  }

  async function renderContent(main, classId, subjectId, chapterId, resource) {
    if (!RESOURCE_LABELS[resource]) return renderNotFound(main, "That resource type doesn't exist.");
    paintSkeletonProse(main);

    const cls = await Data.getClass(classId);
    const subject = cls && cls.subjects.find((s) => s.id === subjectId);
    const chapter = subject && subject.chapters.find((c) => c.id === chapterId);
    if (!cls || !subject || !chapter) return renderNotFound(main, "We couldn't find that chapter.");

    setTitle([RESOURCE_LABELS[resource], chapter.title, subject.label]);
    setBreadcrumb([
      { label: "Home", path: "/" },
      { label: cls.label, path: `/${classId}` },
      { label: subject.label, path: `/${classId}/${subjectId}` },
      { label: chapter.title, path: `/${classId}/${subjectId}/${chapterId}` },
      { label: RESOURCE_LABELS[resource], path: `/${classId}/${subjectId}/${chapterId}/${resource}` },
    ]);

    const result = await Data.getMarkdown(classId, subjectId, chapterId, resource);
    const ctx = {
      classId, subjectId, chapterId, chapter,
      eyebrow: `${cls.label} · ${subject.label} · Ch. ${chapter.number}`,
    };

    if (!result.ok) {
      main.innerHTML = `
        <div class="view container">
          <div class="page-head">
            ${backButtonHtml()}
            <div class="page-eyebrow">${ctx.eyebrow}</div>
            <h1 class="page-title">${MD.escapeHtml(chapter.title)} — ${RESOURCE_LABELS[resource]}</h1>
          </div>
          ${emptyState(
            RESOURCE_ICONS[resource],
            "Content coming soon",
            `We haven't published the ${RESOURCE_LABELS[resource].toLowerCase()} for this chapter yet — check back soon.`,
            `<a class="btn btn-outline" href="#/${classId}/${subjectId}/${chapterId}" style="margin-top:18px">See other resources for this chapter</a>`
          )}
        </div>`;
      return;
    }

    if (resource === "summary") await renderSummary(main, ctx, result.text);
    else if (resource === "qna") await renderQnA(main, ctx, result.text);
    else await renderMockPaper(main, ctx, result.text);
  }

  /* ---------------- 404 ---------------- */

  function renderNotFound(main, message) {
    Protection.detach();
    setBreadcrumb([{ label: "Home", path: "/" }]);
    main.innerHTML = `
      <div class="view container section">
        ${emptyState(
          SUBJECT_ICONS.generic,
          "Page not found",
          message || "That page doesn't exist.",
          '<a class="btn btn-primary" href="#/" style="margin-top:18px">Go to homepage</a>'
        )}
      </div>`;
  }

  return { renderHome, renderSubjects, renderChapters, renderResourceTypes, renderContent, renderNotFound };
})();
