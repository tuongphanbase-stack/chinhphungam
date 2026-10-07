import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePoemExtract } from '../js/source.mjs';

const SAMPLE = `Thông tin ấn bản\nChữ Nôm  Tiếng Việt\n𨤧𡗶...\nNhẽ trời đất thường khi gió bụi,\nKhách má hồng nhiều nỗi truân chuyên[ 1 ].\nXanh kia thăm thẳm tầng trên,\nVì ai gây dựng cho nên nỗi này?\nTrống Trường Thành[ 2 ] lung lay bóng nguyệt, 5\nKhói Cam Tuyền[ 3 ] mờ mịt thức mây.\n\nChú thích\n1. Truân chuyên: Gian nan khốn khó\n2. Trường Thành: Vạn lý trường thành`;

test('parsePoemExtract keeps only Vietnamese verse lines', () => {
  assert.deepEqual(parsePoemExtract(SAMPLE), [
    'Nhẽ trời đất thường khi gió bụi,',
    'Khách má hồng nhiều nỗi truân chuyên.',
    'Xanh kia thăm thẳm tầng trên,',
    'Vì ai gây dựng cho nên nỗi này?',
    'Trống Trường Thành lung lay bóng nguyệt,',
    'Khói Cam Tuyền mờ mịt thức mây.'
  ]);
});

test('parsePoemExtract accepts the common Thuở opening variant', () => {
  const text = `Header\nThuở trời đất nổi cơn gió bụi,\nKhách má hồng nhiều nỗi truân chuyên.\nChú thích\n1. x`;
  assert.equal(parsePoemExtract(text).length, 2);
});

test('parsePoemExtract fails clearly when no poem opening is found', () => {
  assert.throws(() => parsePoemExtract('không có văn bản thơ'), /Không tìm thấy phần mở đầu/);
});

test('fetchPoem accepts an injected fetch implementation and parses API payload', async () => {
  const { fetchPoem, SOURCE_API } = await import('../js/source.mjs');
  assert.match(SOURCE_API, /origin=\*/);
  const fakeFetch = async () => ({
    ok: true,
    json: async () => ({ query: { pages: [{ extract: SAMPLE }] } })
  });
  const lines = await fetchPoem(fakeFetch);
  assert.equal(lines[0], 'Nhẽ trời đất thường khi gió bụi,');
  assert.equal(lines.at(-1), 'Khói Cam Tuyền mờ mịt thức mây.');
});
