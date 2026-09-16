import assert from 'node:assert/strict';
import { test } from 'node:test';
import { defaultHomeContent, homeContentFields, parseHomeContentForm, readHomeContent } from './homeContent';

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
