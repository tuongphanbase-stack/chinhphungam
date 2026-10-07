// Reader extras: saved text, reading position, bookmarks, read-aloud and
// verse images. Storage access is wrapped so a blocked localStorage
// (private mode, strict settings) never breaks the reader.

export const KEYS = {
  text: 'chinhphungam_text_v1',
  page: 'chinhphungam_last_page',
  marks: 'chinhphungam_bookmarks'
};

function defaultStorage() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

export function readJSON(key, fallback, storage = defaultStorage()) {
  try {
    const raw = storage?.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch { return fallback; }
}

export function writeJSON(key, value, storage = defaultStorage()) {
  try { storage?.setItem(key, JSON.stringify(value)); } catch { /* full or blocked */ }
}

/* ---------- Saved text ---------- */

// Returns the cached lines if they look like a real copy of the poem.
export function cachedLines(storage = defaultStorage()) {
  const cached = readJSON(KEYS.text, null, storage);
  return Array.isArray(cached?.lines) && cached.lines.length > 100 ? cached.lines : null;
}

export function cacheLines(lines, storage = defaultStorage()) {
  writeJSON(KEYS.text, { lines, savedAt: new Date().toISOString() }, storage);
}

/* ---------- Bookmarks (1-based line numbers) ---------- */

export function getBookmarks(storage = defaultStorage()) {
  const marks = readJSON(KEYS.marks, [], storage);
  return Array.isArray(marks) ? [...new Set(marks.filter(Number.isInteger))].sort((a, b) => a - b) : [];
}

export function toggleBookmark(lineNo, storage = defaultStorage()) {
  const marks = new Set(getBookmarks(storage));
  marks.has(lineNo) ? marks.delete(lineNo) : marks.add(lineNo);
  const next = [...marks].sort((a, b) => a - b);
  writeJSON(KEYS.marks, next, storage);
  return next;
}

/* ---------- Song thất lục bát stanzas: 7-7-6-8, four lines each ---------- */

export function stanzaRange(index, total) {
  const start = Math.floor(index / 4) * 4;
  return { start, end: Math.min(start + 4, total) };
}

/* ---------- Read aloud ---------- */

export function vietnameseVoice(synth = globalThis.speechSynthesis) {
  return synth?.getVoices?.().find(v => /^vi/i.test(v.lang)) || null;
}

// Speaks the lines in order. Returns false if the browser can't speak.
export function speakLines(lines, { onEnd, rate = 0.9 } = {}) {
  const synth = globalThis.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return false;
  synth.cancel();
  const voice = vietnameseVoice(synth);
  lines.forEach((text, i) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'vi-VN';
    if (voice) u.voice = voice;
    u.rate = rate;
    if (i === lines.length - 1 && onEnd) u.onend = onEnd;
    synth.speak(u);
  });
  return true;
}

export function stopSpeaking() {
  globalThis.speechSynthesis?.cancel();
}

/* ---------- Verse image ---------- */

// Greedy word wrap using a measure(text) -> width function.
export function wrapText(text, maxWidth, measure) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const out = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && measure(candidate) > maxWidth) {
      out.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) out.push(line);
  return out;
}

// Draws a square quote card and resolves a PNG Blob.
export function renderVerseImage(lines, { from, to, dark = false, size = 1080 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const c = dark
    ? { bg1: '#1b1d22', bg2: '#232a35', ink: '#eef1f6', muted: '#aab4c3', accent: '#9fb4d4' }
    : { bg1: '#f8f9fc', bg2: '#e4eaf3', ink: '#1b2230', muted: '#5f6b7d', accent: '#3b5478' };

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, c.bg1);
  grad.addColorStop(1, c.bg2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const pad = size * 0.11;
  ctx.fillStyle = c.accent;
  ctx.fillRect(pad, pad, size * 0.07, 6);
  ctx.font = `600 ${size * 0.024}px "Segoe UI", Tahoma, Arial, sans-serif`;
  ctx.fillStyle = c.accent;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('CHINH PHỤ NGÂM', pad, pad + size * 0.06);

  const serif = '"Noto Serif", "Times New Roman", Georgia, serif';
  let fontSize = size * 0.05;
  const maxWidth = size - pad * 2;
  let wrapped;
  // Shrink the type until the stanza fits in the middle of the card.
  for (;;) {
    ctx.font = `${fontSize}px ${serif}`;
    wrapped = lines.map(l => wrapText(l, maxWidth, t => ctx.measureText(t).width));
    const rows = wrapped.reduce((n, w) => n + w.length, 0);
    if (rows * fontSize * 1.55 + (lines.length - 1) * fontSize * 0.35 <= size * 0.55 || fontSize < size * 0.028) break;
    fontSize *= 0.92;
  }
  const lineH = fontSize * 1.55;
  const blockH = wrapped.reduce((n, w) => n + w.length, 0) * lineH + (lines.length - 1) * fontSize * 0.35;
  let y = (size - blockH) / 2 + fontSize;
  ctx.fillStyle = c.ink;
  wrapped.forEach(rows => {
    rows.forEach(row => { ctx.fillText(row, pad, y); y += lineH; });
    y += fontSize * 0.35;
  });

  ctx.font = `${size * 0.022}px "Segoe UI", Tahoma, Arial, sans-serif`;
  ctx.fillStyle = c.muted;
  const range = from === to ? `câu ${from}` : `câu ${from}–${to}`;
  ctx.fillText(`Đặng Trần Côn · ${range}`, pad, size - pad);

  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Không tạo được ảnh'))), 'image/png'));
}

// Shares the image where the device supports it, otherwise downloads it.
export async function shareOrDownload(blob, filename) {
  const file = typeof File !== 'undefined' ? new File([blob], filename, { type: 'image/png' }) : null;
  if (file && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Chinh phụ ngâm' }); return 'shared'; }
    catch (e) { if (e?.name === 'AbortError') return 'cancelled'; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
}
