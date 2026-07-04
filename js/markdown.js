/* =========================================================================
   markdown.js
   - MD.renderProse(text): standard markdown -> HTML (for summary.md)
   - MD.renderInline(text): inline-only markdown -> HTML (for short strings)
   - MD.parseQnA(text): strict parser for the "### Q<n>: ..." pattern
   - MD.parseMockPaper(text): parser for the metadata + sections + answer key
     pattern used by mock-paper.md
   ========================================================================= */

const MD = (() => {
  // marked.min.js (vendored) attaches a global `marked` object with .parse/.parseInline
  marked.setOptions({ gfm: true, breaks: false });

  function renderProse(text) {
    return marked.parse(text || "");
  }

  function renderInline(text) {
    return marked.parseInline(text || "");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /**
   * Strict parser for qna.md:
   *   ### Q1: Question text
   *   Answer text (markdown, can span multiple paragraphs/lists)...
   *   ### Q2: ...
   * Returns [{ num, question, answerMarkdown, answerHtml }]
   */
  function parseQnA(text) {
    if (!text) return [];
    const lines = text.replace(/\r\n/g, "\n").split("\n");
    const headingRe = /^###\s*Q(\d+)\s*:\s*(.+?)\s*$/;
    const items = [];
    let current = null;

    for (const line of lines) {
      const match = line.match(headingRe);
      if (match) {
        if (current) items.push(current);
        current = { num: parseInt(match[1], 10), question: match[2], answerLines: [] };
      } else if (current) {
        current.answerLines.push(line);
      }
      // lines before the first "### Q" heading (e.g. a title) are ignored
    }
    if (current) items.push(current);

    return items.map((item) => {
      const answerMarkdown = item.answerLines.join("\n").trim();
      return {
        num: item.num,
        question: item.question,
        answerMarkdown,
        answerHtml: renderProse(answerMarkdown),
      };
    });
  }

  /**
   * Parser for mock-paper.md. The file is a sequence of "## Heading" blocks.
   * We classify blocks by heading text:
   *  - "Time Allowed: ..." / "Maximum Marks: ..."  -> meta bar
   *  - "General Instructions"                       -> instructions box
   *  - "Section ..." (anything starting with Section) -> exam sections
   *  - "Answer Key"                                  -> hidden-by-default panel
   * Any other heading is rendered as a generic section, in order, so the
   * format degrades gracefully rather than dropping content.
   */
  function parseMockPaper(text) {
    if (!text) return { meta: {}, instructionsHtml: "", sections: [], answerKeyHtml: "" };

    const raw = text.replace(/\r\n/g, "\n");
    const blockRe = /^##\s+(.+?)\s*$/gm;

    const blocks = [];
    let match;
    let lastIndex = 0;
    let lastHeading = null;

    while ((match = blockRe.exec(raw)) !== null) {
      if (lastHeading !== null) {
        blocks.push({ heading: lastHeading, body: raw.slice(lastIndex, match.index) });
      }
      lastHeading = match[1];
      lastIndex = blockRe.lastIndex;
    }
    if (lastHeading !== null) {
      blocks.push({ heading: lastHeading, body: raw.slice(lastIndex) });
    }

    const meta = {};
    let instructionsHtml = "";
    const sections = [];
    let answerKeyHtml = "";

    for (const block of blocks) {
      const heading = block.heading.trim();
      const body = block.body.trim();

      if (/^time allowed/i.test(heading)) {
        meta.time = heading.split(":").slice(1).join(":").trim() || heading;
      } else if (/^maximum marks/i.test(heading)) {
        meta.marks = heading.split(":").slice(1).join(":").trim() || heading;
      } else if (/^general instructions/i.test(heading)) {
        instructionsHtml = renderProse(body);
      } else if (/^answer key/i.test(heading)) {
        answerKeyHtml = renderProse(body);
      } else if (/^section/i.test(heading)) {
        // "Section A — 1 Mark Questions" -> title "Section A", marksLabel "1 Mark Questions"
        const dashMatch = heading.match(/^(.*?)\s*[—\-–]\s*(.+)$/);
        sections.push({
          title: dashMatch ? dashMatch[1].trim() : heading,
          marksLabel: dashMatch ? dashMatch[2].trim() : "",
          html: renderProse(body),
        });
      } else {
        // Unknown heading: still show it, so nothing silently disappears
        sections.push({ title: heading, marksLabel: "", html: renderProse(body) });
      }
    }

    return { meta, instructionsHtml, sections, answerKeyHtml };
  }

  return { renderProse, renderInline, escapeHtml, parseQnA, parseMockPaper };
})();
