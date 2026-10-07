const SOURCE_TITLE = 'Chinh_phụ_ngâm_(Đoàn_Thị_Điểm_dịch)';
export const SOURCE_PAGE = 'https://vi.wikisource.org/wiki/Chinh_ph%E1%BB%A5_ng%C3%A2m_(%C4%90o%C3%A0n_Th%E1%BB%8B_%C4%90i%E1%BB%83m_d%E1%BB%8Bch)';
export const SOURCE_API = `https://vi.wikisource.org/w/api.php?origin=*&action=query&prop=extracts&explaintext=1&redirects=1&format=json&formatversion=2&titles=${encodeURIComponent(SOURCE_TITLE)}`;

function cleanVerseLine(line) {
  return line
    .replace(/\[\s*\d+\s*\]/g, '')
    .replace(/\s+\d{1,3}\s*$/, '')
    .replace(/\s+([,.;!?])/g, '$1')
    .trim();
}

export function parsePoemExtract(extract) {
  if (typeof extract !== 'string' || !extract.trim()) {
    throw new Error('Nguồn văn bản trống');
  }

  const normalized = extract.replace(/\r\n?/g, '\n');
  const openings = ['Nhẽ trời đất', 'Thuở trời đất'];
  const starts = openings
    .map(marker => normalized.indexOf(marker))
    .filter(index => index >= 0);

  if (!starts.length) {
    throw new Error('Không tìm thấy phần mở đầu Chinh phụ ngâm trong nguồn');
  }

  const start = Math.min(...starts);
  const tail = normalized.slice(start);
  const noteMatch = tail.match(/\n\s*(?:=+\s*)?Chú thích(?:\s*=+)?\s*\n/i);
  const poemBlock = noteMatch ? tail.slice(0, noteMatch.index) : tail;

  const lines = poemBlock
    .split('\n')
    .map(cleanVerseLine)
    .filter(Boolean)
    .filter(line => !/^\d+[.)]\s/.test(line))
    .filter(line => !/^={2,}/.test(line));

  if (lines.length < 2) {
    throw new Error('Nguồn có phần mở đầu nhưng không tách được các câu thơ');
  }

  return lines;
}

export async function fetchPoem(fetchImpl = fetch) {
  const response = await fetchImpl(SOURCE_API, {
    headers: { Accept: 'application/json' }
  });
  if (!response.ok) {
    throw new Error(`Wikisource trả về HTTP ${response.status}`);
  }
  const data = await response.json();
  const page = data?.query?.pages?.[0];
  if (!page?.extract) {
    throw new Error('Wikisource không trả về nội dung văn bản');
  }
  return parsePoemExtract(page.extract);
}
