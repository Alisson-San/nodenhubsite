import { test } from 'node:test';
import assert from 'node:assert/strict';
import { History, reorder, canReorder, dropPlacement } from './editorState';
test('undo and redo preserve snapshots instead of sharing mutable values', () => {
 const h = new History({title:'Antes'});
 h.commit({title:'Depois'}); const next = h.undo()!; next.title='mutated';
 assert.equal(h.redo()?.title, 'Depois');
 assert.equal(h.undo()?.title, 'Antes');
});
test('new edit discards redo branch and no-op preserves history', () => {
 const h=new History(1); h.commit(2); h.undo(); h.commit(3); assert.equal(h.redo(),null);
 h.commit(3); assert.equal(h.undo(),1);
});
test('reorder refuses items from different categories and does not mutate input', () => {
 const items=[{id:'a',category_id:'one'},{id:'b',category_id:'two'},{id:'c',category_id:'one'}];
 assert.deepEqual(reorder(items,'a','b'),items);
 assert.deepEqual(reorder(items,'c','a').map(x=>x.id),['c','b','a']);
 assert.equal(items[0].id,'a');
});

test('pointer drop honors before and after regardless of starting direction',()=>{
 const items=[{id:'a'},{id:'b'},{id:'c'}];
 assert.deepEqual(reorder(items,'a','c','before').map(x=>x.id),['b','a','c']);
 assert.deepEqual(reorder(items,'c','a','after').map(x=>x.id),['a','c','b']);
 assert.deepEqual(reorder(items,'a','c','after').map(x=>x.id),['b','c','a']);
 assert.deepEqual(reorder(items,'b','b','before'),items);
});
test('drop eligibility prevents foreign ids and category movement',()=>{
 const items=[{id:'a',category_id:'one'},{id:'b',category_id:'two'},{id:'c',category_id:'one'}];
 assert.equal(canReorder(items,'a','b'),false);
 assert.equal(canReorder(items,'a','c'),true);
 assert.equal(canReorder(items,'missing','c'),false);
 assert.equal(canReorder(items,'a','a'),false);
});
test('drop marker uses the target midpoint',()=>{
 assert.equal(dropPlacement(110,100,40),'before');
 assert.equal(dropPlacement(125,100,40),'after');
});
