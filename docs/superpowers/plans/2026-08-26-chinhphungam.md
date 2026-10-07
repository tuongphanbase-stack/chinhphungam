# Chinh Phụ Ngâm Reader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deployable static reader for *Chinh phụ ngâm* with paginated source text, side-by-side explanation, glossary highlighting, search, and responsive design.

**Architecture:** The site fetches the poem from Vietnamese Wikisource at runtime, parses it into verse lines, and combines those lines with local curated explanation data. Pure helpers are split from DOM rendering so they can be tested with Node without a browser framework.

**Tech Stack:** HTML5, CSS3, ES modules, MediaWiki API, Node.js built-in test runner.

**Spec:** `docs/superpowers/specs/2026-08-26-chinhphungam-design.md`

## Global Constraints
- Static HTML/CSS/JavaScript only; no framework or backend.
- Use system fonts only.
- Default pagination is 24 verse lines per page.
- Wikisource is the runtime source of the poem text.
- Never silently substitute guessed poem text when source loading fails.

---

### Task 1: Source parser and pure reader helpers
**Files:** Create `js/source.mjs`, `js/utils.mjs`, `tests/source.test.mjs`, `tests/utils.test.mjs`.
**Produces:** `parsePoemExtract(text)`, `fetchPoem()`, `paginate(lines,size)`, `normalizeText(text)`, `searchLines(lines,query)`.
- [ ] Write parser/helper tests with representative fixture text.
- [ ] Run tests and confirm failure before implementation.
- [ ] Implement minimal pure functions and Wikisource fetch wrapper.
- [ ] Run tests and confirm pass.
- [ ] Commit.

### Task 2: Curated explanation content
**Files:** Create `js/content.mjs`, `tests/content.test.mjs`.
**Produces:** `GLOSSARY`, `LINE_MEANINGS`, `CONTEXTS`, `notesForLine(line)`.
- [ ] Write matching tests for diacritics and known archaic terms.
- [ ] Run tests and confirm failure.
- [ ] Add curated glossary, representative line meanings, and context lookup.
- [ ] Run tests and confirm pass.
- [ ] Commit.

### Task 3: Reader UI and responsive styling
**Files:** Create `index.html`, `css/style.css`, `js/app.mjs`.
**Consumes:** Task 1/2 interfaces.
- [ ] Build accessible semantic shell and source-status states.
- [ ] Render paginated two-column reader with glossary annotations.
- [ ] Add previous/next/select navigation, search, theme toggle, and mobile sidebar behavior.
- [ ] Add responsive CSS using system fonts only.
- [ ] Verify with local HTTP server and browser-independent smoke checks.
- [ ] Commit.

### Task 4: Documentation and deployability
**Files:** Create `README.md`, `package.json`, `.gitignore`.
- [ ] Document local run, data source, attribution caveat, and GitHub Pages deployment.
- [ ] Add `npm test` using `node --test`.
- [ ] Run full tests.
- [ ] Validate static files and module imports.
- [ ] Commit.
