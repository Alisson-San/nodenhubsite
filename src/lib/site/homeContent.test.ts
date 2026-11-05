import assert from 'node:assert/strict';
import { test } from 'node:test';
import { defaultHomeContent, homeContentFields, parseHomeContentForm, readHomeContent, splitHomeHighlights } from './homeContent';

test('existing identity without new fields keeps readable defaults', () => {
  assert.deepEqual(readHomeContent(undefined), defaultHomeContent);
});
test('saved content with accents survives reading without losing other defaults', () => {
  assert.equal(readHomeContent({ title: 'Tecnologia próxima de você' }).title, 'Tecnologia próxima de você');
  assert.equal(readHomeContent({ title: 'Novo título' }).aboutTitle, defaultHomeContent.aboutTitle);
});
test('form rejects missing, blank and overlong fields before saving', () => {
  const form = new FormData();
  assert.equal(parseHomeContentForm(form), null);
  for (const field of homeContentFields) form.set(`home_${field.key}`, defaultHomeContent[field.key]);
  assert.deepEqual(parseHomeContentForm(form), defaultHomeContent);
  form.set('home_title', '  '); assert.equal(parseHomeContentForm(form), null);
  form.set('home_title', 'á'.repeat(121)); assert.equal(parseHomeContentForm(form), null);
});

test('division summaries preserve accents and normalize list lines', () => {
  const form = new FormData();
  for (const field of homeContentFields) form.set(`home_${field.key}`, defaultHomeContent[field.key]);
  form.set('home_homeHighlights', ' Diagnóstico claro \r\n\r\n Memória e SSD ');
  const content = parseHomeContentForm(form);
  assert(content);
  assert.deepEqual(splitHomeHighlights(content.homeHighlights), ['Diagnóstico claro', 'Memória e SSD']);
  assert.equal(readHomeContent(content).homeHighlights, 'Diagnóstico claro\nMemória e SSD');
  form.set('home_homeHighlights', Array(7).fill('Item').join('\n'));
  assert.equal(parseHomeContentForm(form), null);
  form.set('home_homeHighlights', 'x'.repeat(101));
  assert.equal(parseHomeContentForm(form), null);
});

test('multipart CRLF does not reject six valid highlights at the length limit', async () => {
  const form = new FormData();
  for (const field of homeContentFields) form.set(`home_${field.key}`, defaultHomeContent[field.key]);
  form.set('home_homeHighlights', Array(6).fill('x'.repeat(100)).join('\n'));
  const received = await new Request('http://localhost/', { method: 'POST', body: form }).formData();
  assert.equal(parseHomeContentForm(received)?.homeHighlights.length, 605);
});
