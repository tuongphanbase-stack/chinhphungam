# Chinh Phụ Ngâm Reader — Design

## Goal
Create a small static website for reading *Chinh phụ ngâm* with the original Vietnamese text on the left and plain-language explanations on the right, following the same practical reading pattern as the existing `truyenkieu` project without turning it into a larger literature platform.

## Scope
- Static HTML/CSS/JavaScript only; no framework or backend.
- Load the public-domain Vietnamese text from Vietnamese Wikisource at runtime through the MediaWiki API.
- Paginate the poem; default 24 verse lines per page.
- Show original text and explanations side by side on desktop; stacked on narrow screens.
- Search within loaded poem text and glossary terms.
- Highlight archaic, Hán-Việt, literary, and allusive terms that have curated glossary entries.
- Provide curated modern-language meanings for representative lines and contextual section summaries; lines without a curated note still show detected vocabulary plus the current narrative context.
- Use system fonts only to avoid Vietnamese glyph/font-loading failures.
- Explicitly identify the source edition and note that attribution of the popular Nôm rendition is disputed.

## Architecture
`index.html` provides the semantic shell. `js/source.mjs` owns Wikisource fetching and text parsing, `js/content.mjs` owns curated glossary/meanings/context, `js/utils.mjs` owns pure pagination/search helpers, and `js/app.mjs` owns state and rendering. CSS is self-contained in `css/style.css`.

## Data flow
1. Browser loads the static shell.
2. `source.mjs` fetches the Wikisource extract using `origin=*` CORS support.
3. Parser trims metadata, keeps the Vietnamese rendition, removes display-only numbering/footnote artifacts, and returns verse lines.
4. App paginates the line array and renders the current page.
5. Curated line notes are matched by normalized text; glossary entries are matched by phrase within each line.
6. Search filters matching lines and moves the reader to the first result.

## Error handling
If Wikisource cannot be reached or the expected text cannot be parsed, the page stays usable as a shell, shows a clear source-loading error, and links directly to the Wikisource edition instead of silently showing incomplete text.

## Testing
Node's built-in test runner validates source parsing, pagination, text normalization, glossary matching, and search behavior. Browser verification checks responsive layout and keyboard/button navigation.

## Non-goals for v1
- No audio.
- No user accounts/bookmarks sync.
- No full Hán text alignment.
- No attempt to settle the disputed Nôm translator attribution.
- No AI/API-generated explanations at runtime.
