#!/usr/bin/env node
/**
 * tools/generate-index.mjs
 * -------------------------------------------------------------------------
 * OPTIONAL convenience script — the site does NOT need this to run.
 * content/index.json is the hand-maintained source of truth (see README).
 *
 * What this does: scans /content/<class>/<subject>/<chapter> folders and
 * makes sure every folder that exists on disk also has an entry in
 * index.json, inferring a title from the folder slug. It never deletes or
 * overwrites an existing entry — it only ADDS entries for folders it finds
 * that aren't listed yet, so it's safe to run at any time.
 *
 * Usage:  node tools/generate-index.mjs
 * Requires: Node.js (no npm packages needed)
 */

import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(new URL(".", import.meta.url).pathname, "..");
const CONTENT_DIR = join(ROOT, "content");
const INDEX_PATH = join(CONTENT_DIR, "index.json");

function isDir(path) {
  try { return statSync(path).isDirectory(); } catch { return false; }
}

function titleFromSlug(slug) {
  // "chapter-01-rational-numbers" -> { number: 1, title: "Rational Numbers" }
  const match = slug.match(/^chapter-(\d+)-(.+)$/);
  const rest = match ? match[2] : slug;
  const number = match ? parseInt(match[1], 10) : null;
  const title = rest
    .split("-")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
  return { number, title };
}

function labelFromSlug(slug) {
  return slug
    .split("-")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function main() {
  if (!existsSync(INDEX_PATH)) {
    console.error("content/index.json not found — nothing to sync against.");
    process.exit(1);
  }
  const manifest = JSON.parse(readFileSync(INDEX_PATH, "utf8"));
  let added = 0;

  for (const classDirName of readdirSync(CONTENT_DIR)) {
    const classPath = join(CONTENT_DIR, classDirName);
    if (!isDir(classPath) || !classDirName.startsWith("class-")) continue;

    let classEntry = manifest.classes.find((c) => c.id === classDirName);
    if (!classEntry) {
      classEntry = { id: classDirName, label: labelFromSlug(classDirName), tagline: "", subjects: [] };
      manifest.classes.push(classEntry);
      console.log(`+ class  ${classDirName}`);
      added++;
    }

    for (const subjectDirName of readdirSync(classPath)) {
      const subjectPath = join(classPath, subjectDirName);
      if (!isDir(subjectPath)) continue;

      let subjectEntry = classEntry.subjects.find((s) => s.id === subjectDirName);
      if (!subjectEntry) {
        subjectEntry = { id: subjectDirName, label: labelFromSlug(subjectDirName), icon: "generic", chapters: [] };
        classEntry.subjects.push(subjectEntry);
        console.log(`  + subject ${classDirName}/${subjectDirName}`);
        added++;
      }

      for (const chapterDirName of readdirSync(subjectPath)) {
        const chapterPath = join(subjectPath, chapterDirName);
        if (!isDir(chapterPath) || !chapterDirName.startsWith("chapter-")) continue;

        const exists = subjectEntry.chapters.some((c) => c.id === chapterDirName);
        if (!exists) {
          const { number, title } = titleFromSlug(chapterDirName);
          subjectEntry.chapters.push({
            id: chapterDirName,
            number: number ?? subjectEntry.chapters.length + 1,
            title,
          });
          console.log(`    + chapter ${classDirName}/${subjectDirName}/${chapterDirName} -> "${title}"`);
          added++;
        }
      }

      subjectEntry.chapters.sort((a, b) => a.number - b.number);
    }
  }

  if (added === 0) {
    console.log("Nothing to add — index.json already covers every folder on disk.");
    return;
  }

  writeFileSync(INDEX_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\nUpdated content/index.json (${added} new entr${added === 1 ? "y" : "ies"} added).`);
  console.log("Auto-generated titles are a rough guess from the folder name — please tidy them up by hand.");
}

main();
