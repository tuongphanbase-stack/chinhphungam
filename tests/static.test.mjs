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

test('stylesheets use system fonts and no remote font loading', async () => {
  const shared = await readFile(new URL('css/site.css', root), 'utf8');
  const site = await readFile(new URL('css/style.css', root), 'utf8');
  assert.match(shared, /--font:"Segoe UI"/);
  for (const css of [shared, site]) assert.doesNotMatch(css, /@font-face|fonts\.googleapis|fonts\.gstatic/i);
});

test('index loads the shared look before the site stylesheet, and links the sister site', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  const order = ['src="js/site.js"', 'href="css/site.css"', 'href="css/style.css"'].map(s => html.indexOf(s));
  assert.ok(order.every(i => i > 0) && order[0] < order[1] && order[1] < order[2], 'site.js, site.css, style.css in order');
  assert.ok(html.indexOf('src="js/site.js"') < html.indexOf('</head>'), 'site.js runs in <head> (theme before first paint)');
  assert.match(html, /data-theme-key="chinhphungam_theme"/);
  assert.match(html, /href="https:\/\/tuongphanbase-stack\.github\.io\/truyenkieu\/"/);
  assert.match(html, /href="https:\/\/tuongphanbase-stack\.github\.io\/emailer-dashboard\/projects\.html"/);
});
