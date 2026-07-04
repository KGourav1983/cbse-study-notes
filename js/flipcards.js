/* =========================================================================
   flipcards.js — Top 25 Q&A flip-card grid + Study Mode.
   Reviewed progress is kept in localStorage per chapter, purely client-side
   (this is a static site — there is no account or server to sync to).
   ========================================================================= */

const FlipCards = (() => {
  function loadReviewed(storageKey) {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  }

  function saveReviewed(storageKey, set) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(set)));
    } catch {
      /* ignore quota / privacy-mode errors — progress just won't persist */
    }
  }

  function buildCardEl(item, isReviewed, onFlip) {
    const card = document.createElement("div");
    card.className = "flip-card" + (isReviewed ? " is-flipped" : "");
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-pressed", isReviewed ? "true" : "false");
    card.setAttribute("aria-label", `Question ${item.num}. Tap to reveal the answer.`);

    card.innerHTML = `
      <div class="flip-card-inner">
        <div class="flip-card-face flip-card-front">
          <div class="flip-qnum">Q${item.num}</div>
          <p>${MD.renderInline(item.question)}</p>
          <div class="flip-hint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12a8 8 0 0 1 14.5-4.7M20 12a8 8 0 0 1-14.5 4.7M15 4v4h4M9 20v-4H5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Tap to reveal
          </div>
        </div>
        <div class="flip-card-face flip-card-back">
          <div class="flip-qnum">Answer</div>
          <div class="answer-body">${item.answerHtml}</div>
          <div class="reviewed-stamp" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>
      </div>`;

    function flip() {
      const flipped = card.classList.toggle("is-flipped");
      card.setAttribute("aria-pressed", flipped ? "true" : "false");
      onFlip(flipped);
    }

    card.addEventListener("click", flip);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        flip();
      }
    });

    return card;
  }

  function mount(container, { items, storageKey, chapterTitle }) {
    container.innerHTML = "";
    if (!items.length) return;

    const reviewed = loadReviewed(storageKey);

    const toolbar = document.createElement("div");
    toolbar.className = "qna-toolbar";
    toolbar.innerHTML = `
      <div class="qna-progress">
        <span id="qna-progress-text">${reviewed.size} of ${items.length} reviewed</span>
        <span class="qna-progress-track"><span class="qna-progress-fill" id="qna-progress-fill" style="width:${(reviewed.size / items.length) * 100}%"></span></span>
      </div>
      <div class="qna-actions">
        <button class="btn btn-outline" id="qna-shuffle" type="button">Shuffle</button>
        <button class="btn btn-primary" id="qna-study" type="button">Study mode</button>
      </div>`;
    container.appendChild(toolbar);

    const grid = document.createElement("div");
    grid.className = "flip-grid";
    container.appendChild(grid);

    const progressText = toolbar.querySelector("#qna-progress-text");
    const progressFill = toolbar.querySelector("#qna-progress-fill");

    function updateProgress() {
      progressText.textContent = `${reviewed.size} of ${items.length} reviewed`;
      progressFill.style.width = `${(reviewed.size / items.length) * 100}%`;
    }

    function renderGrid(order) {
      grid.innerHTML = "";
      order.forEach((item) => {
        const card = buildCardEl(item, reviewed.has(item.num), (flipped) => {
          if (flipped) reviewed.add(item.num);
          saveReviewed(storageKey, reviewed);
          updateProgress();
        });
        grid.appendChild(card);
      });
    }

    renderGrid(items);

    toolbar.querySelector("#qna-shuffle").addEventListener("click", () => {
      const shuffled = [...items].sort(() => Math.random() - 0.5);
      renderGrid(shuffled);
    });

    toolbar.querySelector("#qna-study").addEventListener("click", (e) => {
      openStudyMode(items, { storageKey, chapterTitle, reviewed, onProgress: updateProgress, trigger: e.currentTarget });
    });
  }

  function openStudyMode(items, { storageKey, chapterTitle, reviewed, onProgress, trigger }) {
    let order = [...items];
    let index = 0;

    const overlay = document.createElement("div");
    overlay.className = "study-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", `Study mode — ${chapterTitle || "Q&A"}`);
    overlay.innerHTML = `
      <button class="icon-btn study-close" id="study-close" type="button" aria-label="Close study mode">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18" stroke-linecap="round"/></svg>
      </button>
      <div class="study-progress-label" id="study-progress-label"></div>
      <div class="study-card-wrap" id="study-card-wrap"></div>
      <div class="study-nav">
        <button class="icon-btn" id="study-prev" type="button" aria-label="Previous card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="btn btn-outline" id="study-shuffle" type="button">Shuffle</button>
        <button class="icon-btn" id="study-next" type="button" aria-label="Next card">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>`;
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    const wrap = overlay.querySelector("#study-card-wrap");
    const label = overlay.querySelector("#study-progress-label");

    function renderCurrent() {
      wrap.innerHTML = "";
      const item = order[index];
      const card = buildCardEl(item, reviewed.has(item.num), (flipped) => {
        if (flipped) reviewed.add(item.num);
        saveReviewed(storageKey, reviewed);
        onProgress();
        label.textContent = `Card ${index + 1} of ${order.length} · ${reviewed.size} of ${items.length} reviewed`;
      });
      wrap.appendChild(card);
      card.focus();
      label.textContent = `Card ${index + 1} of ${order.length} · ${reviewed.size} of ${items.length} reviewed`;
    }

    function go(delta) {
      index = (index + delta + order.length) % order.length;
      renderCurrent();
    }

    overlay.querySelector("#study-prev").addEventListener("click", () => go(-1));
    overlay.querySelector("#study-next").addEventListener("click", () => go(1));
    overlay.querySelector("#study-shuffle").addEventListener("click", () => {
      order = [...items].sort(() => Math.random() - 0.5);
      index = 0;
      renderCurrent();
    });

    function close() {
      document.body.style.overflow = "";
      overlay.remove();
      document.removeEventListener("keydown", onKeyDown);
      if (trigger) trigger.focus();
    }

    function onKeyDown(e) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    }

    overlay.querySelector("#study-close").addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", onKeyDown);

    renderCurrent();
  }

  return { mount };
})();
