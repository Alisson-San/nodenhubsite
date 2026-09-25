/** Snapshots are cloned at every boundary so undo is never modified by a form. */
export class History<T> {
 private past:T[]=[]; private future:T[]=[]; private current:T;
 constructor(value:T){this.current=structuredClone(value);}
 commit(value:T){if(JSON.stringify(value)===JSON.stringify(this.current))return;
 this.past.push(structuredClone(this.current)); if(this.past.length>50)this.past.shift();
 this.current=structuredClone(value);this.future=[];}
 undo():T|null {if(!this.past.length)return null;this.future.push(this.current);this.current=this.past.pop()!;return structuredClone(this.current);}
 redo():T|null {if(!this.future.length)return null;this.past.push(this.current);this.current=this.future.pop()!;return structuredClone(this.current);}
 get canUndo(){return this.past.length>0;} get canRedo(){return this.future.length>0;}
}
export function reorder<T extends {id:string;category_id?:string|null}>(items:T[],from:string,to:string):T[]{
 const a=items.find(x=>x.id===from), b=items.find(x=>x.id===to);
 if(!a||!b||a.category_id!==b.category_id)return [...items];
 const group=items.filter(x=>x.category_id===a.category_id);group.splice(group.indexOf(a),1);group.splice(group.indexOf(b)+(items.indexOf(a)<items.indexOf(b)?1:0),0,a);
 let i=0;return items.map(x=>x.category_id===a.category_id?group[i++]:x);
}
