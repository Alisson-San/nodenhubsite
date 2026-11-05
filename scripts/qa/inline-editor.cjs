// Teste da edição no site com dados de fallback. Nada é gravado: as chamadas
// /api/admin/editor/* são interceptadas e os envios ficam em payloads.json.
// 1) DEV_EDITOR_FIXTURE=true npx astro dev --background
// 2) node scripts/qa/inline-editor.cjs [http://localhost:4321] [pasta-de-saída]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const base = process.argv[2] || 'http://localhost:4321';
const out = process.argv[3] || fs.mkdtempSync(path.join(require('os').tmpdir(), 'noden-editor-'));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = []; p.on('pageerror', e => errors.push(e.message)); p.on('console', m => m.type()==='error' && !/Failed to load resource/.test(m.text()) && errors.push(m.text()));
  const payloads = [];
  await p.route('**/api/admin/editor/**', async route => {
    const body = route.request().postDataJSON(); payloads.push({ url: route.request().url(), body });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ revision: 1, published: true }) });
  });
  const step = async (name, fn) => { try { await fn(); console.log('OK  ', name); } catch (e) { console.log('FAIL', name, e.message.split('\n')[0]); process.exitCode = 1; } };
  await p.goto(base + '/noden-home', { waitUntil: 'networkidle' });
  await p.screenshot({ path: path.join(out, 'edit-1.png') });

  await step('texto no lugar habilita salvar', async () => {
    const t = p.locator('[data-edit-field="hero_title"]');
    await t.click(); await p.keyboard.press('Control+End'); await p.keyboard.type(' Hoje.');
    await p.keyboard.press('Enter');
    if (await p.locator('[data-ne-save]').isDisabled()) throw new Error('save disabled');
    await Promise.all([p.waitForEvent('load'), p.click('[data-ne-save]')]);
    const doc = payloads.at(-1).body.document; if (!doc.page.hero_title.endsWith('Hoje.')) throw new Error(doc.page.hero_title);
  });

  await step('editar item no modal', async () => {
    await p.locator('.offer .ne-tools button', { hasText: 'Editar' }).first().click();
    await p.waitForSelector('dialog[open]'); await p.screenshot({ path: path.join(out, 'edit-2-modal.png') });
    await p.fill('dialog [name=price]', '120,50'); await p.fill('dialog [name=features]', 'Um\nDois');
    await Promise.all([p.waitForEvent('load'), p.click('dialog [data-ne-submit]')]);
    const it = payloads.at(-1).body.document.items[0]; if (it.price !== 120.5 || it.features.length !== 2) throw new Error(JSON.stringify(it));
  });

  await step('validação no modal (nome vazio)', async () => {
    await p.locator('.offer .ne-tools button', { hasText: 'Editar' }).first().click();
    await p.fill('dialog [name=name]', ''); await p.click('dialog [data-ne-submit]');
    const msg = await p.locator('[data-ne-error]').textContent(); if (!/Nome/.test(msg)) throw new Error(msg);
    await p.keyboard.press('Escape');
  });

  await step('nova solução', async () => {
    await p.click('.ne-add:has-text("Nova solução")'); await p.fill('dialog [name=title]', 'Instalação de câmeras'); await p.fill('dialog [name=description]', 'Câmeras configuradas e no celular.');
    await Promise.all([p.waitForEvent('load'), p.click('dialog [data-ne-submit]')]);
    const cards = payloads.at(-1).body.document.serviceCards; if (cards.at(-1).title !== 'Instalação de câmeras') throw new Error('missing');
  });

  await step('novo item na categoria', async () => {
    await p.locator('.ne-add-slot .ne-add').first().click(); await p.fill('dialog [name=name]', 'Teste'); await p.fill('dialog [name=description]', 'Desc'); await p.selectOption('dialog [name=price_type]', 'consultation');
    await Promise.all([p.waitForEvent('load'), p.click('dialog [data-ne-submit]')]);
    const it = payloads.at(-1).body.document.items.at(-1); if (it.name !== 'Teste' || it.price !== null) throw new Error(JSON.stringify(it));
  });

  await step('mover para baixo', async () => {
    await Promise.all([p.waitForEvent('load'), p.locator('.solution .ne-tools button[aria-label^="Mover"][aria-label$="para baixo"]').first().click()]);
    const c = payloads.at(-1).body.document.serviceCards; const first = c.find(x => x.sort_order === 0); if (first.title === 'Diagnóstico e suporte') throw new Error('not moved');
  });

  await step('ocultar', async () => {
    await Promise.all([p.waitForEvent('load'), p.locator('.offer .ne-tools button', { hasText: 'Ocultar' }).first().click()]);
    if (payloads.at(-1).body.document.items[0].is_active !== false) throw new Error('still active');
  });

  await step('excluir com confirmação', async () => {
    const before = 6;
    await p.locator('.solution .ne-tools button', { hasText: 'Excluir' }).first().click();
    await p.waitForSelector('dialog[open]'); await p.screenshot({ path: path.join(out, 'edit-3-delete.png') });
    await Promise.all([p.waitForEvent('load'), p.click('dialog [data-ne-submit]')]);
    if (payloads.at(-1).body.document.serviceCards.length !== before - 1) throw new Error('not deleted');
  });

  await step('editar promessas', async () => {
    await p.click('.ne-list-edit:has-text("promessas")'); await p.click('dialog [data-add-row]');
    const inputs = p.locator('dialog [data-row]:last-child input'); await inputs.nth(0).fill('Nova promessa'); await inputs.nth(1).fill('Texto');
    await Promise.all([p.waitForEvent('load'), p.click('dialog [data-ne-submit]')]);
    if (payloads.at(-1).body.document.extras.promises.length !== 5) throw new Error('count');
  });

  await step('textos e google', async () => {
    await p.click('[data-ne-page]'); await p.fill('dialog [name=seo_title]', 'Novo título SEO');
    await Promise.all([p.waitForEvent('load'), p.click('dialog [data-ne-submit]')]);
    if (payloads.at(-1).body.document.page.seo_title !== 'Novo título SEO') throw new Error('seo');
  });

  await step('preencher com textos sugeridos', async () => {
    await p.click('[data-ne-page]'); await p.fill('dialog [name=seo_title]', 'X'); await p.click('dialog [data-fill-suggested]');
    await Promise.all([p.waitForEvent('load'), p.click('dialog [data-ne-submit]')]);
    const page = payloads.at(-1).body.document.page; if (page.seo_title === 'X' || !/Noden Home/.test(page.seo_title) || page.hero_highlights.length !== 4) throw new Error(page.seo_title);
  });

  await step('publicar envia rascunho e publicação', async () => {
    await p.locator('[data-edit-field="cta_title"]').click(); await p.keyboard.type(' X');
    await p.click('[data-ne-publish]'); await Promise.all([p.waitForEvent('load'), p.click('dialog [data-ne-submit]')]);
    const urls = payloads.slice(-2).map(x => x.url.split('/').pop()); if (urls.join() !== 'drafts,publish') throw new Error(urls.join());
  });

  await step('ver como visitante desliga edição', async () => {
    await p.click('[data-ne-mode]');
    if (await p.locator('[contenteditable]').count()) throw new Error('still editable');
    await p.screenshot({ path: path.join(out, 'edit-4-visitor.png') });
  });

  await step('inicial: edição de texto e publicação', async () => {
    await p.goto(base + '/', { waitUntil: 'networkidle' });
    await p.locator('[data-home-field="title"]').click(); await p.keyboard.press('Control+End'); await p.keyboard.type('!'); await p.keyboard.press('Enter');
    await Promise.all([p.waitForEvent('load'), p.click('[data-ne-save]')]);
    const last = payloads.at(-1).body; if (last.action !== 'save' || !last.content.title.endsWith('!')) throw new Error(JSON.stringify(last).slice(0,200));
    await p.click('[data-home-list]'); await p.waitForSelector('dialog[open]'); await p.keyboard.press('Escape');
    await p.screenshot({ path: path.join(out, 'edit-5-home.png') });
  });

  fs.writeFileSync(path.join(out, 'payloads.json'), JSON.stringify(payloads));
  console.log('payloads', payloads.length, 'errors', JSON.stringify(errors), 'saída', out);
  if (errors.length) process.exitCode = 1;
  await b.close();
})();
