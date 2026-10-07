# Chinh Phụ Ngâm — Nguyên văn & Giải nghĩa

Static web reader for *Chinh phụ ngâm*: original Vietnamese text on the left, modern-language explanation and vocabulary on the right.

## Features

- Loads the poem at runtime from Vietnamese Wikisource (no guessed local full-text copy).
- 24 lines per page with previous/next/page picker navigation.
- Side-by-side original text and explanation on desktop, stacked layout on mobile.
- Curated explanations for representative lines plus contextual summaries for the rest.
- Archaic/Hán-Việt/allusion glossary displayed beside matching lines.
- Search ignores Vietnamese diacritics (`truong thanh` finds `Trường Thành`).
- Light/dark theme.
- Remembers the text after the first load, so later visits open instantly and work offline.
- Resume where you left off ("Đọc tiếp trang …").
- Bookmarks: ☆ beside a line saves it to the sidebar list.
- Read aloud: 🔊 for one line, or "Đọc trang" for the whole page (browser's Vietnamese voice).
- Verse images: 🖼 turns the line's four-line stanza into a square image to share or download (matches the light/dark theme).
- System fonts only, so Vietnamese glyphs do not depend on a webfont download.
- No framework, backend, build step, or external runtime dependency besides the Wikisource text request.

## Text source and attribution note

The original Classical Chinese work is by **Đặng Trần Côn**. This project loads the Vietnamese rendition from:

https://vi.wikisource.org/wiki/Chinh_phụ_ngâm_(Đoàn_Thị_Điểm_dịch)

That Wikisource edition says the Nôm rendition was traditionally considered to be by **Đoàn Thị Điểm**, while noting that there is also an attribution to **Phan Huy Ích**. This reader reproduces that caveat rather than taking a side in the textual-attribution debate.

The source text is fetched through the MediaWiki API with `origin=*` so it can run directly from GitHub Pages.

## Run locally

```bash
npm test
npm run serve
```

Then open `http://localhost:8000`.

Opening `index.html` directly with `file://` is not recommended because browser ES-module/CORS rules vary; use a tiny HTTP server instead.

## Deploy to GitHub Pages

This is a plain static site. Push the repository to GitHub, then in **Settings → Pages** choose **Deploy from a branch**, branch `main`, folder `/ (root)`.

## Project structure

```text
index.html
css/style.css
js/app.mjs          # UI/state/rendering
js/source.mjs       # Wikisource API + parser
js/content.mjs      # glossary + curated explanations + contexts
js/utils.mjs        # pagination/search helpers
tests/              # Node built-in tests
docs/superpowers/   # design + implementation plan
```

## Explanation coverage

Version 1 deliberately separates **source text** from **explanation data**. The full poem can load immediately from Wikisource while `js/content.mjs` can be expanded gradually with more per-line modern meanings without touching the reader engine.
