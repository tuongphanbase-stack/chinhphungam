export function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function paginate(lines, pageSize = 24) {
  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new RangeError('pageSize phải là số nguyên dương');
  }
  const pages = [];
  for (let i = 0; i < lines.length; i += pageSize) {
    pages.push(lines.slice(i, i + pageSize));
  }
  return pages;
}

export function searchLines(lines, query) {
  const needle = normalizeText(query);
  if (!needle) return [];
  return lines
    .map((line, index) => ({ index, line }))
    .filter(({ line }) => normalizeText(line).includes(needle));
}
