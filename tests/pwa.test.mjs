// Installable app checks: manifest + icons, the service worker's precache list,
// and the service worker's caching behaviour (run in a sandbox with fake caches).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = file => readFileSync(new URL(file, root), 'utf8');

function pngSize(file) {
  const buf = readFileSync(new URL(file, root));
  assert.equal(buf.toString('ascii', 1, 4), 'PNG', `${file} must be a PNG`);
  return `${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}`;
}

const swSource = read('sw.js');
const SHELL = vm.runInNewContext(swSource.match(/const SHELL = (\[[\s\S]*?\]);/)[1]);

test('manifest uses relative URLs, standalone display and valid icons', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.name && manifest.short_name && manifest.description);
  assert.match(manifest.theme_color, /^#[0-9a-f]{6}$/i);
  assert.match(manifest.background_color, /^#[0-9a-f]{6}$/i);
  for (const icon of manifest.icons) {
    assert.ok(!icon.src.startsWith('/') && !/^https?:/.test(icon.src), `icon path must be relative: ${icon.src}`);
    assert.equal(pngSize(icon.src), icon.sizes, `${icon.src} size`);
  }
  for (const size of ['192x192', '512x512']) {
    assert.ok(manifest.icons.some(i => i.sizes === size && (i.purpose || 'any').includes('any')), `missing ${size} icon`);
  }
  assert.ok(manifest.icons.some(i => (i.purpose || '').includes('maskable')), 'missing maskable icon');
  assert.equal(pngSize('icons/apple-touch-icon.png'), '180x180');
});

test('index links the manifest, theme colour and touch icon', () => {
  const html = read('index.html');
  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/);
  assert.match(html, /<meta name="theme-color" content="#[0-9a-f]{6}">/i);
  assert.match(html, /<link rel="apple-touch-icon" href="icons\/apple-touch-icon\.png">/);
});

test('the service worker precaches every file the page loads, and only existing files', () => {
  const html = read('index.html');
  const needed = new Set([...html.matchAll(/<(?:link|script)\b[^>]*?\b(?:href|src)="([^"]+)"/g)]
    .map(m => m[1]).filter(u => !/^(https?:)?\/\//.test(u)));
  // Follow the ES module imports from app.mjs.
  const queue = ['js/app.mjs'];
  while (queue.length) {
    const file = queue.pop();
    for (const [, spec] of read(file).matchAll(/\bfrom\s+'(\.\/[^']+)'/g)) {
      const dep = new URL(spec, new URL(file, 'https://x/')).pathname.slice(1);
      if (!needed.has(dep)) { needed.add(dep); queue.push(dep); }
    }
  }
  for (const file of needed) assert.ok(SHELL.includes(file), `sw.js SHELL is missing ${file}`);
  for (const entry of SHELL) {
    if (entry !== './') assert.ok(existsSync(new URL(entry.split('?')[0], root)), `SHELL lists a missing file: ${entry}`);
  }
});

test('service worker: cache-first shell, network-first fallback, leaves Wikisource and other projects alone', async () => {
  const ORIGIN = 'https://tuongphanbase-stack.github.io';
  const SCOPE = `${ORIGIN}/chinhphungam/`;
  const net = { online: true, calls: [], files: new Map() };
  for (const entry of SHELL) net.files.set(new URL(entry, SCOPE).pathname, `body of ${entry}`);
  net.files.set('/chinhphungam/extra.json', '{"ok":true}');

  const fakeFetch = request => {
    const url = new URL(typeof request === 'string' ? request : request.url);
    net.calls.push(url.href);
    if (!net.online) return Promise.reject(new TypeError('offline'));
    const body = url.origin === ORIGIN ? net.files.get(url.pathname) : 'remote';
    return Promise.resolve(new Response(body || 'not found', { status: body ? 200 : 404 }));
  };

  const stores = new Map();
  const keyOf = (req, ignoreSearch) => {
    const u = new URL(typeof req === 'string' ? req : req.url);
    if (ignoreSearch) u.search = '';
    return u.href;
  };
  const openCache = name => {
    if (!stores.has(name)) stores.set(name, new Map());
    const entries = stores.get(name);
    return {
      async match(req, opts = {}) {
        for (const [url, res] of entries) if (keyOf(url, opts.ignoreSearch) === keyOf(req, opts.ignoreSearch)) return res.clone();
        return undefined;
      },
      async put(req, res) { entries.set(keyOf(req), res); },
      async addAll(reqs) {
        for (const req of reqs) {
          const res = await fakeFetch(req);
          if (!res.ok) throw new TypeError(`precache failed: ${req.url}`);
          entries.set(keyOf(req), res);
        }
      }
    };
  };
  const caches = { open: async name => openCache(name), keys: async () => [...stores.keys()], delete: async name => stores.delete(name) };

  const listeners = {};
  const self = {
    location: new URL(`${SCOPE}sw.js`),
    registration: { scope: SCOPE },
    addEventListener: (type, fn) => { listeners[type] = fn; },
    skipWaiting: async () => {},
    clients: { claim: async () => {} }
  };
  vm.runInNewContext(swSource, { self, caches, fetch: fakeFetch, Request, Response, URL, console });

  const dispatch = (type, request) => {
    const waits = [];
    const event = { request, responded: null, waitUntil: p => waits.push(p), respondWith: p => { event.responded = p; } };
    listeners[type](event);
    return { event, settle: () => Promise.all(waits) };
  };
  const respond = async request => {
    const { event, settle } = dispatch('fetch', request);
    if (!event.responded) return null;
    const res = await event.responded;
    await settle();
    return res;
  };
  const get = url => new Request(url);

  await caches.open('chinhphungam-shell-old');
  await caches.open('truyenkieu-shell-x');
  await caches.open('emailer-dashboard-v3');

  await dispatch('install').settle();
  const shellName = [...stores.keys()].find(k => /^chinhphungam-shell-(?!old)/.test(k));
  assert.ok(shellName, 'install creates a versioned shell cache');
  assert.equal(stores.get(shellName).size, SHELL.length, 'install precaches the whole shell');

  await dispatch('activate').settle();
  assert.ok(!stores.has('chinhphungam-shell-old'), 'activate removes this site\'s old caches');
  assert.ok(stores.has('truyenkieu-shell-x') && stores.has('emailer-dashboard-v3'), 'activate keeps other projects\' caches');

  net.calls.length = 0;
  assert.equal(await (await respond(get(`${SCOPE}js/app.mjs`))).text(), 'body of js/app.mjs');
  const page = await respond({ url: `${SCOPE}index.html?x=1`, method: 'GET', mode: 'navigate', cache: 'default' });
  assert.equal(await page.text(), 'body of ./');
  assert.deepEqual(net.calls, [], 'shell files come from the cache');

  assert.equal(await respond(get('https://vi.wikisource.org/w/api.php?origin=*&action=query')), null);
  assert.equal(await respond(get(`${ORIGIN}/truyenkieu/sw.js`)), null);
  assert.equal(await respond(new Request(`${SCOPE}x`, { method: 'POST', body: 'x' })), null);

  assert.equal(await (await respond(get(`${SCOPE}extra.json`))).text(), '{"ok":true}');
  assert.equal((await respond(get(`${SCOPE}missing.json`))).status, 404);
  net.online = false;
  assert.equal(await (await respond(get(`${SCOPE}extra.json`))).text(), '{"ok":true}', 'offline: cached copy');
  assert.equal((await respond(get(`${SCOPE}missing.json`))).type, 'error', 'errors are never cached');
});
