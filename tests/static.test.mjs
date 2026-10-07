import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('index wires the reader module and required UI anchors', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  for (const id of ['readerContent','pageSelect','prevBtn','nextBtn','searchInput','sourceStatus']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /type="module" src="js\/app\.mjs"/);
});

test('stylesheet uses system fonts and no remote font loading', async () => {
  const css = await readFile(new URL('css/style.css', root), 'utf8');
  assert.match(css, /Segoe UI/);
  assert.doesNotMatch(css, /@font-face|fonts\.googleapis|fonts\.gstatic/i);
});
