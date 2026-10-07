import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeText, paginate, searchLines } from '../js/utils.mjs';

test('normalizeText is Vietnamese-diacritic insensitive', () => {
  assert.equal(normalizeText('Truân chuyên – Đường mây'), 'truan chuyen duong may');
});

test('paginate creates fixed-size pages and keeps remainder', () => {
  const pages = paginate(['a','b','c','d','e'], 2);
  assert.deepEqual(pages, [['a','b'], ['c','d'], ['e']]);
});

test('searchLines returns line index and line text', () => {
  const lines = ['Khách má hồng nhiều nỗi truân chuyên.', 'Trống Trường Thành lung lay bóng nguyệt.'];
  assert.deepEqual(searchLines(lines, 'truân'), [{ index: 0, line: lines[0] }]);
  assert.deepEqual(searchLines(lines, 'truong thanh'), [{ index: 1, line: lines[1] }]);
});
