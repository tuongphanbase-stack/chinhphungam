import { fetchPoem, SOURCE_PAGE } from './source.mjs';
import { paginate, searchLines, normalizeText } from './utils.mjs';
import { GLOSSARY, CONTEXTS, notesForLine, contextForLine } from './content.mjs';
import {
  KEYS, readJSON, writeJSON, cachedLines, cacheLines, getBookmarks, toggleBookmark,
  stanzaRange, speakLines, stopSpeaking, vietnameseVoice, renderVerseImage, shareOrDownload
} from './extras.mjs';

const PAGE_SIZE = 24;
const state = { lines: [], pages: [], page: 0, speaking: false };

const $ = selector => document.querySelector(selector);
const els = {
  menuBtn: $('#menuBtn'), themeBtn: $('#themeBtn'), sidebar: $('#sidebar'),
  searchInput: $('#searchInput'), searchResults: $('#searchResults'),
  sourceStatus: $('#sourceStatus'), lineCount: $('#lineCount'), contextNav: $('#contextNav'),
  pageTitle: $('#pageTitle'), pageRange: $('#pageRange'), readerContent: $('#readerContent'),
  pagination: $('#pagination'), prevBtn: $('#prevBtn'), nextBtn: $('#nextBtn'),
  pageSelect: $('#pageSelect'), pagePosition: $('#pagePosition'),
  loadError: $('#loadError'), loadErrorText: $('#loadErrorText'),
  bookmarkNav: $('#bookmarkNav'), readPageBtn: $('#readPageBtn'), resumeLink: $('#resumeLink'),
  speechNote: $('#speechNote')
};

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem('chinhphungam_theme', theme);
}
applyTheme(localStorage.getItem('chinhphungam_theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

function glossaryMatches(line) {
  const normalized = normalizeText(line);
  return GLOSSARY
    .filter(entry => normalized.includes(normalizeText(entry.term)))
    .sort((a, b) => b.term.length - a.term.length);
}

function makeHighlightedLine(line) {
  const container = document.createElement('span');
  container.className = 'line-text';
  const matches = glossaryMatches(line);
  if (!matches.length) {
    container.textContent = line;
    return container;
  }

  const normalizedLine = normalizeText(line);
  // Map normalized matches approximately back to visible text by using a Unicode-aware regex.
  // Terms are curated and short; when a direct case-insensitive match exists, highlight it.
  const escapedTerms = matches.map(item => item.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escapedTerms.join('|')})`, 'giu');
  let last = 0;
  let matchedAny = false;
  for (const match of line.matchAll(pattern)) {
    matchedAny = true;
    container.append(document.createTextNode(line.slice(last, match.index)));
    const span = document.createElement('span');
    span.className = 'glossary-term';
    span.textContent = match[0];
    span.title = matches.find(item => normalizeText(item.term) === normalizeText(match[0]))?.meaning || '';
    container.append(span);
    last = match.index + match[0].length;
  }
  if (matchedAny) {
    container.append(document.createTextNode(line.slice(last)));
  } else {
    container.textContent = line;
  }
  return container;
}

function renderContextNav() {
  els.contextNav.replaceChildren();
  let previousEnd = 0;
  CONTEXTS.forEach((context, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'context-link';
    button.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span><b>${context.title}</b>`;
    const startRatio = previousEnd;
    previousEnd = context.end;
    button.addEventListener('click', () => {
      if (!state.lines.length) return;
      const targetIndex = Math.floor(startRatio * state.lines.length);
      goToLine(targetIndex);
      els.sidebar.classList.remove('open');
    });
    els.contextNav.append(button);
  });
}

function buildExplanation(line, absoluteIndex) {
  const notes = notesForLine(line);
  const box = document.createElement('div');
  box.className = 'explanation-cell';

  if (notes.meaning) {
    const p = document.createElement('p');
    p.className = 'simple-meaning';
    p.innerHTML = '<b>HIỂU ĐƠN GIẢN</b><br>';
    p.append(document.createTextNode(notes.meaning));
    box.append(p);
  } else {
    const p = document.createElement('p');
    p.className = 'line-pending';
    const context = contextForLine(absoluteIndex, state.lines.length);
    p.textContent = `Chưa có diễn nghĩa riêng cho câu này · đang thuộc mạch “${context.title}”.`;
    box.append(p);
  }

  if (notes.glossary.length) {
    const label = document.createElement('div');
    label.className = 'vocab-label';
    label.textContent = 'TỪ & ĐIỂN TÍCH';
    box.append(label);
    const list = document.createElement('div');
    list.className = 'vocab-list';
    notes.glossary.forEach(note => {
      const item = document.createElement('div');
      item.className = 'vocab-note';
      const term = document.createElement('strong');
      term.textContent = note.term;
      const meaning = document.createElement('span');
      meaning.textContent = note.meaning;
      item.append(term, meaning);
      list.append(item);
    });
    box.append(list);
  }
  return box;
}

function renderPage() {
  if (!state.pages.length) return;
  state.page = Math.max(0, Math.min(state.page, state.pages.length - 1));
  const lines = state.pages[state.page];
  const start = state.page * PAGE_SIZE;
  const end = start + lines.length;
  const context = contextForLine(start, state.lines.length);

  els.pageTitle.textContent = `Trang ${state.page + 1} · ${context.title}`;
  els.pageRange.textContent = `Câu ${start + 1}–${end}`;
  els.pagePosition.textContent = `${state.page + 1} / ${state.pages.length}`;
  els.prevBtn.disabled = state.page === 0;
  els.nextBtn.disabled = state.page === state.pages.length - 1;
  els.pageSelect.value = String(state.page);

  const fragment = document.createDocumentFragment();
  const banner = document.createElement('div');
  banner.className = 'context-banner';
  banner.innerHTML = `<b>${String(CONTEXTS.indexOf(context) + 1).padStart(2, '0')}</b><div><strong>${context.title}</strong><p>${context.summary}</p></div>`;
  fragment.append(banner);

  const head = document.createElement('div');
  head.className = 'column-head';
  head.innerHTML = '<div>NGUYÊN VĂN</div><div>GIẢI NGHĨA</div>';
  fragment.append(head);

  const marks = new Set(getBookmarks());
  lines.forEach((line, localIndex) => {
    const absoluteIndex = start + localIndex;
    const row = document.createElement('article');
    row.className = 'verse-row';
    row.id = `line-${absoluteIndex + 1}`;

    const verse = document.createElement('div');
    verse.className = 'verse-cell';
    const no = document.createElement('span');
    no.className = 'line-no';
    no.textContent = String(absoluteIndex + 1);
    verse.append(no, makeHighlightedLine(line), lineActions(absoluteIndex + 1, marks.has(absoluteIndex + 1)));

    row.append(verse, buildExplanation(line, absoluteIndex));
    fragment.append(row);
  });

  els.readerContent.replaceChildren(fragment);
  history.replaceState(null, '', `#page-${state.page + 1}`);
  writeJSON(KEYS.page, state.page);
}

function populatePageSelect() {
  els.pageSelect.replaceChildren();
  state.pages.forEach((page, index) => {
    const start = index * PAGE_SIZE + 1;
    const end = start + page.length - 1;
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = `Trang ${index + 1} · câu ${start}–${end}`;
    els.pageSelect.append(option);
  });
}

function goToPage(index, scroll = true) {
  state.page = Math.max(0, Math.min(index, state.pages.length - 1));
  renderPage();
  if (scroll) $('#reader').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function goToLine(index) {
  const pageIndex = Math.floor(index / PAGE_SIZE);
  goToPage(pageIndex, false);
  requestAnimationFrame(() => {
    const row = document.getElementById(`line-${index + 1}`);
    if (!row) return;
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    row.classList.add('flash');
    setTimeout(() => row.classList.remove('flash'), 1300);
  });
}

function renderSearch(query) {
  const results = searchLines(state.lines, query).slice(0, 12);
  els.searchResults.replaceChildren();
  if (!query.trim()) {
    els.searchResults.hidden = true;
    return;
  }
  els.searchResults.hidden = false;
  if (!results.length) {
    const empty = document.createElement('div');
    empty.className = 'search-empty';
    empty.textContent = 'Không tìm thấy câu phù hợp.';
    els.searchResults.append(empty);
    return;
  }
  results.forEach(result => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'search-result';
    button.innerHTML = `<span>${result.index + 1}</span>`;
    const text = document.createElement('div');
    text.textContent = result.line;
    button.append(text);
    button.addEventListener('click', () => {
      els.searchResults.hidden = true;
      goToLine(result.index);
    });
    els.searchResults.append(button);
  });
}

async function boot() {
  renderContextNav();
  try {
    const saved = cachedLines();
    state.lines = saved || await fetchPoem();
    if (!saved) cacheLines(state.lines);
    state.pages = paginate(state.lines, PAGE_SIZE);
    els.lineCount.textContent = state.lines.length.toLocaleString('vi-VN');
    els.sourceStatus.innerHTML = `${saved ? 'Đã mở' : 'Đã tải'} ${state.lines.length.toLocaleString('vi-VN')} câu · <a href="${SOURCE_PAGE}" target="_blank" rel="noopener">Wikisource ↗</a>`;
    renderBookmarks();
    populatePageSelect();
    els.pagination.hidden = false;

    const hashMatch = location.hash.match(/^#page-(\d+)$/);
    const lastPage = Number(readJSON(KEYS.page, 0)) || 0;
    state.page = hashMatch ? Math.max(0, Number(hashMatch[1]) - 1) : lastPage;
    if (!hashMatch && lastPage > 0 && lastPage < state.pages.length) {
      els.resumeLink.hidden = false;
      els.resumeLink.textContent = `Đọc tiếp trang ${lastPage + 1} →`;
    }
    renderPage();
  } catch (error) {
    els.sourceStatus.textContent = 'Không tải được nguồn văn bản.';
    els.pageTitle.textContent = 'Không tải được văn bản';
    els.readerContent.innerHTML = '<div class="loading">Nguồn văn bản hiện không khả dụng.</div>';
    els.loadError.hidden = false;
    els.loadErrorText.textContent = error instanceof Error ? error.message : String(error);
  }
}

els.menuBtn.addEventListener('click', () => els.sidebar.classList.toggle('open'));
els.themeBtn.addEventListener('click', () => applyTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark'));
els.prevBtn.addEventListener('click', () => goToPage(state.page - 1));
els.nextBtn.addEventListener('click', () => goToPage(state.page + 1));
els.pageSelect.addEventListener('change', event => goToPage(Number(event.target.value)));
els.searchInput.addEventListener('input', event => renderSearch(event.target.value));
els.searchInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    const first = searchLines(state.lines, event.target.value)[0];
    if (first) { event.preventDefault(); els.searchResults.hidden = true; goToLine(first.index); }
  }
  if (event.key === 'Escape') els.searchResults.hidden = true;
});
document.addEventListener('click', event => {
  if (!event.target.closest('.search-wrap')) els.searchResults.hidden = true;
});
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault(); els.searchInput.focus(); els.searchInput.select();
  }
  if (event.target.matches('input,select,textarea')) return;
  if (event.key === 'ArrowLeft' && state.pages.length) goToPage(state.page - 1);
  if (event.key === 'ArrowRight' && state.pages.length) goToPage(state.page + 1);
});

/* ---------- Line actions: bookmark, read aloud, image ---------- */

function lineActions(lineNo, marked) {
  const wrap = document.createElement('span');
  wrap.className = 'line-actions';
  const make = (action, label, text, pressed) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.action = action;
    b.dataset.line = String(lineNo);
    b.title = label;
    b.setAttribute('aria-label', `${label} câu ${lineNo}`);
    if (pressed !== undefined) b.setAttribute('aria-pressed', String(pressed));
    b.textContent = text;
    return b;
  };
  const mark = make('mark', marked ? 'Bỏ đánh dấu' : 'Đánh dấu', marked ? '★' : '☆', marked);
  if (marked) mark.classList.add('on');
  wrap.append(mark, make('say', 'Nghe đọc', '🔊'), make('image', 'Tạo ảnh khổ thơ', '🖼'));
  return wrap;
}

function renderBookmarks() {
  const marks = getBookmarks().filter(n => n <= state.lines.length);
  els.bookmarkNav.replaceChildren();
  if (!marks.length) {
    const empty = document.createElement('p');
    empty.className = 'bookmark-empty';
    empty.textContent = 'Bấm ☆ cạnh một câu để lưu lại.';
    els.bookmarkNav.append(empty);
    return;
  }
  marks.forEach(n => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'bookmark-link';
    const no = document.createElement('span');
    no.textContent = String(n);
    const text = document.createElement('b');
    text.textContent = state.lines[n - 1];
    b.append(no, text);
    b.addEventListener('click', () => { goToLine(n - 1); els.sidebar.classList.remove('open'); });
    els.bookmarkNav.append(b);
  });
}

function setSpeaking(on) {
  state.speaking = on;
  els.readPageBtn.textContent = on ? '⏹ Dừng đọc' : '🔊 Đọc trang';
}

function speak(lines) {
  if (!vietnameseVoice()) {
    els.speechNote.hidden = false;
    els.speechNote.textContent = 'Máy của bạn chưa có giọng đọc tiếng Việt nên giọng đọc có thể không chuẩn. Có thể cài thêm giọng tiếng Việt trong cài đặt ngôn ngữ của máy.';
  }
  setSpeaking(true);
  if (!speakLines(lines, { onEnd: () => setSpeaking(false) })) {
    setSpeaking(false);
    els.speechNote.hidden = false;
    els.speechNote.textContent = 'Trình duyệt này không hỗ trợ đọc to.';
  }
}

els.readerContent.addEventListener('click', async event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const lineNo = Number(button.dataset.line);
  if (button.dataset.action === 'mark') {
    toggleBookmark(lineNo);
    renderPage();
    renderBookmarks();
  } else if (button.dataset.action === 'say') {
    speak([state.lines[lineNo - 1]]);
  } else if (button.dataset.action === 'image') {
    const { start, end } = stanzaRange(lineNo - 1, state.lines.length);
    button.disabled = true;
    try {
      const blob = await renderVerseImage(state.lines.slice(start, end), {
        from: start + 1, to: end, dark: document.documentElement.classList.contains('dark')
      });
      await shareOrDownload(blob, `chinh-phu-ngam-cau-${start + 1}-${end}.png`);
    } finally {
      button.disabled = false;
    }
  }
});

els.readPageBtn.addEventListener('click', () => {
  if (state.speaking) { stopSpeaking(); setSpeaking(false); return; }
  if (state.pages.length) speak(state.pages[state.page]);
});

els.resumeLink.addEventListener('click', event => {
  event.preventDefault();
  els.resumeLink.hidden = true;
  goToPage(Number(readJSON(KEYS.page, 0)) || 0);
});

boot();
