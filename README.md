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
- **Installable app that works offline** (see below).
- Same look as its sister site, the [Truyện Kiều reader](https://tuongphanbase.github.io/truyenkieu/), with its own indigo accent; the footer links to it and to the [project list](https://tuongphanbase.github.io/emailer-dashboard/projects.html).

## Install on a phone

The site is a Progressive Web App, so it can be added to the home screen and opens full screen like an app:

- **Android (Chrome):** open the site, tap **⋮** → **Install app** / **Add to Home screen** (*Cài đặt ứng dụng* / *Thêm vào màn hình chính*).
- **iPhone / iPad (Safari):** tap **Share** → **Add to Home Screen** (*Thêm vào MH chính*).
- **Computer (Chrome / Edge):** click the install icon at the right of the address bar.

Open it once while online: the app itself is then cached by the service worker and the poem text is kept in the browser's storage, so it keeps working without a connection.

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
css/site.css          # shared look (tokens, header, footer, light/dark), same file as in truyenkieu
css/style.css         # this site's accent colour and reader components
js/site.js            # shared: theme before first paint, theme button, service-worker registration
js/app.mjs            # UI/state/rendering
js/source.mjs         # Wikisource API + parser
js/content.mjs        # glossary + curated explanations + contexts
js/extras.mjs         # bookmarks, resume, read aloud, verse images, saved text
js/utils.mjs          # pagination/search helpers
manifest.webmanifest  # installable app: name, colours, icons
sw.js                 # service worker (offline)
icons/                # app icons (192, 512, maskable 512, Apple touch, favicon)
tests/                # Node built-in tests
docs/superpowers/     # design + implementation plan
```

## Shared look and the offline app

- `css/site.css` and `js/site.js` are **identical copies** of the files in the `truyenkieu` repo. Edit both copies together; each site sets only its own accent colour at the top of its stylesheet (`css/style.css` here).
- `sw.js` serves the files listed in `SHELL` from its cache first, so bump `VERSION` in `sw.js` whenever you change any of them, or visitors keep the old copy. `tests/pwa.test.mjs` fails if a file the page loads (including modules imported by `app.mjs`) is missing from `SHELL`. Requests to Wikisource are never cached by the service worker; the reader keeps the text in `localStorage` itself.

## Explanation coverage

Version 1 deliberately separates **source text** from **explanation data**. The full poem can load immediately from Wikisource while `js/content.mjs` can be expanded gradually with more per-line modern meanings without touching the reader engine.
