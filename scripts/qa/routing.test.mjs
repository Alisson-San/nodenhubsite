// Run after npm run build. Reads the generated Vercel config only; sends no requests or writes.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const build = JSON.parse(await readFile(new URL('../../.vercel/output/config.json', import.meta.url), 'utf8'));
const vercel = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8'));

test('no user-agent redirect: one responsive start page for every device', () => {
  assert.equal(vercel.redirects, undefined);
  assert(!build.routes.some(route => route.has?.some(rule => rule.key === 'user-agent')));
});

test('legacy paths redirect permanently to the new division routes', () => {
  const expected = { '/home': '/noden-home', '/game': '/noden-game', '/data': '/noden-data', '/mobile': '/' };
  for (const [from, to] of Object.entries(expected)) {
    const route = build.routes.find(r => r.headers?.Location === to && new RegExp(r.src).test(from));
    assert(route, from);
    assert.equal(route.status, 301, from);
  }
});

test('generated server routes retain public, admin and dynamic destinations', () => {
  const rendered = build.routes.filter(route => route.dest === '_render' && !route.status);
  for (const path of ['/', '/noden-home', '/noden-game', '/noden-data', '/links', '/produtos/exemplo', '/admin', '/admin/settings', '/admin/pages/home', '/admin/catalog/game/prices', '/api/admin/pages/data', '/api/admin/editor/home']) {
    assert(rendered.some(route => route.src !== '^/.*$' && new RegExp(route.src).test(path)), path);
  }
  // @astrojs/vercel >= 11.0.18 sends unknown paths to the final catch-all without a
  // routing-level status; Astro answers 404 at runtime. Only that catch-all may match.
  const unknown = rendered.filter(route => new RegExp(route.src).test('/not-a-noden-page'));
  assert(unknown.every(route => route.src === '^/.*$'), JSON.stringify(unknown));
  assert.equal(build.routes.at(-1).src, '^/.*$');
});
