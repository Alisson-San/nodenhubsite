// Run after npm run build. Compiles configuration only; sends no requests or writes.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { getTransformedRoutes } from '@vercel/routing-utils';
const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8'));

test('mobile redirect remains limited to the root and mobile user agents', () => {
  const { routes, error } = getTransformedRoutes(config);
  assert.equal(error, null);
  const redirect = routes.find(route => route.headers?.Location === '/mobile');
  assert(redirect);
  assert.equal(redirect.status, 307);
  const path = new RegExp(redirect.src);
  assert(path.test('/'));
  for (const url of ['/mobile', '/home', '/game', '/data', '/links', '/admin']) assert(!path.test(url));
  const condition = redirect.has.find(rule => rule.type === 'header' && rule.key === 'user-agent');
  assert(condition);
  const device = new RegExp(condition.value);
  for (const agent of ['iPhone Mobile', 'iPad', 'Android Mobile']) assert(device.test(agent));
  assert(!device.test('Mozilla/5.0 (X11; Linux x86_64) Chrome/153.0.0.0 Safari/537.36'));
});

test('generated server routes retain public, admin and dynamic destinations', async () => {
  const build = JSON.parse(await readFile(new URL('../../.vercel/output/config.json', import.meta.url), 'utf8'));
  const rendered = build.routes.filter(route => route.dest === '_render' && !route.status);
  for (const path of ['/', '/mobile', '/home', '/game', '/data', '/links', '/admin', '/admin/settings', '/admin/pages/home', '/admin/catalog/game/prices', '/api/admin/pages/data']) {
    assert(rendered.some(route => new RegExp(route.src).test(path)), path);
  }
  assert(!rendered.some(route => new RegExp(route.src).test('/not-a-noden-page')));
});
