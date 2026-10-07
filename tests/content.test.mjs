import test from 'node:test';
import assert from 'node:assert/strict';
import { notesForLine, contextForLine } from '../js/content.mjs';

test('notesForLine finds glossary terms without caring about case/diacritics', () => {
  const result = notesForLine('Khách má hồng nhiều nỗi TRUÂN CHUYÊN.');
  assert.ok(result.glossary.some(note => note.term === 'má hồng'));
  assert.ok(result.glossary.some(note => note.term === 'truân chuyên'));
});

test('notesForLine returns curated simple meaning for a known opening line', () => {
  const result = notesForLine('Khách má hồng nhiều nỗi truân chuyên.');
  assert.match(result.meaning, /người phụ nữ/i);
});

test('contextForLine returns a readable narrative context for any valid line', () => {
  const context = contextForLine(205, 408);
  assert.ok(context.title);
  assert.ok(context.summary.length > 20);
});
