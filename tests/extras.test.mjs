import test from 'node:test';
import assert from 'node:assert/strict';
import { KEYS, cachedLines, cacheLines, getBookmarks, toggleBookmark, stanzaRange, wrapText, readJSON } from '../js/extras.mjs';

function memoryStorage() {
  const data = {};
  return { getItem: k => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); }, data };
}

test('bookmarks toggle on and off, stay sorted and unique', () => {
  const s = memoryStorage();
  assert.deepEqual(getBookmarks(s), []);
  toggleBookmark(40, s); toggleBookmark(3, s); toggleBookmark(40, s); toggleBookmark(17, s);
  assert.deepEqual(getBookmarks(s), [3, 17]);
});

test('corrupt or blocked storage never throws', () => {
  const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
  assert.deepEqual(getBookmarks(broken), []);
  assert.doesNotThrow(() => toggleBookmark(1, broken));
  const garbage = { getItem: () => '{not json', setItem() {} };
  assert.equal(readJSON(KEYS.page, 0, garbage), 0);
  assert.equal(cachedLines(garbage), null);
});

test('text cache only returns a plausible copy of the poem', () => {
  const s = memoryStorage();
  cacheLines(['quá ngắn'], s);
  assert.equal(cachedLines(s), null);
  const lines = Array.from({ length: 412 }, (_, i) => `câu ${i + 1}`);
  cacheLines(lines, s);
  assert.equal(cachedLines(s).length, 412);
});

test('stanzaRange groups song thất lục bát lines in fours', () => {
  assert.deepEqual(stanzaRange(0, 412), { start: 0, end: 4 });
  assert.deepEqual(stanzaRange(6, 412), { start: 4, end: 8 });
  assert.deepEqual(stanzaRange(411, 410), { start: 408, end: 410 });
});

test('wrapText breaks on words to fit the width', () => {
  const measure = t => t.length * 10;
  assert.deepEqual(wrapText('Nhẽ trời đất thường khi gió bụi', 120, measure), ['Nhẽ trời đất', 'thường khi', 'gió bụi']);
  assert.deepEqual(wrapText('một', 5, measure), ['một']);
});
