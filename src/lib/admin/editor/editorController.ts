import { History, reorder, canReorder, dropPlacement } from './editorState';
import type { CatalogDocument, CatalogDraft, ProductDetail } from '../../catalog/editorTypes';

type Choice={id:string;name:string};
type StateResponse={ready:boolean;draft:CatalogDraft|null;published:CatalogDocument;sourceRevision:number;categories?:Choice[];tiers?:Choice[];badges?:Choice[];pageId?:string;error?:string};
const esc=(value:unknown)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const lines=(v:unknown)=>Array.isArray(v)?v.join('\n'):'';
const split=(v:string)=>v.split('\n').map(x=>x.trim()).filter(Boolean);
const q=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
export function startEditor(){
 if(!q('visual-editor'))return;
 let doc:CatalogDocument, history:History<CatalogDocument>, response:StateResponse;
 let division='home', kind:'items'|'serviceCards'='items', selected='', ready=false, revision=0, baseRevision=0, saved='', busy=false, preview=false, previewAbort:AbortController|null=null;
 let cancelDrag:(()=>void)|null=null;
 const notice=(message:string)=>{q('ev-notice').textContent=message;};
 const error=(message='')=>{q('ev-errors').textContent=message;q('ev-errors').hidden=!message;};
 const dirty=()=>!!doc&&JSON.stringify(doc)!==saved;
 const items=()=>doc?.[kind]??[];
 const current=()=>items().find(x=>x.id===selected);
 const updateButtons=()=>{
  document.querySelector<HTMLElement>('.ev-workspace')!.inert=busy;
  q<HTMLSelectElement>('ev-division').disabled=busy;
  document.querySelectorAll<HTMLButtonElement>('[data-kind]').forEach(b=>b.disabled=busy||!doc);
  (q('ev-discard') as HTMLButtonElement).disabled=busy||!doc;
  (q('ev-save') as HTMLButtonElement).disabled=!ready||busy||!dirty();
  (q('ev-publish') as HTMLButtonElement).disabled=!ready||busy||dirty()||!revision;
  (q('ev-add') as HTMLButtonElement).disabled=!doc||busy;
  (q('ev-undo') as HTMLButtonElement).disabled=!history?.canUndo||busy;
  (q('ev-redo') as HTMLButtonElement).disabled=!history?.canRedo||busy;
 };
 function changed(){history.commit(doc);updateButtons();notice(ready?'Alterações locais. Salve o rascunho para preservar seu trabalho.':'Prévia local: persistência ainda não habilitada. Alterações desta sessão não serão salvas.');}
 function setItem(key:string,value:unknown){
  const item=current();if(!item)return;Object.assign(item,{[key]:value});changed();
 }
 function setDetail(key:string,value:unknown){
  if(!doc.details[selected])return;Object.assign(doc.details[selected],{[key]:value,updatedAt:new Date().toISOString()});changed();
 }
 async function request(path:string,payload?:unknown){
  const res=await fetch(path,{method:payload?'POST':'GET',headers:payload?{'Content-Type':'application/json'}:{},body:payload?JSON.stringify(payload):undefined});
  const result=await res.json();if(!res.ok&&!(res.status===503&&result.published))throw new Error(res.status===409?'Outra edição modificou esta divisão. Seu trabalho continua aqui; copie as alterações importantes e recarregue antes de publicar.':formatError(result));
  return result;
 }
 function formatError(result:{error?:string;errors?:unknown;message?:string}){
  const details=result.errors;
  return [result.error||result.message||'Não foi possível concluir a operação.',details?typeof details==='string'?details:JSON.stringify(details,null,2):''].filter(Boolean).join('\n');
 }
 async function load(){
  busy=true;ready=false;updateButtons();error();notice('Carregando conteúdo…');
  try{
   response=await request('/api/admin/editor/drafts?division='+division);
   doc=structuredClone(response.draft?.document??response.published);
   if(!doc)throw new Error(response.error||'Catálogo indisponível. Recarregue para tentar novamente.');
   revision=response.draft?.revision??0;baseRevision=response.draft?.baseRevision??response.sourceRevision;
   saved=JSON.stringify(doc);history=new History(doc);ready=response.ready;
   selected=items()[0]?.id??'';
   notice(ready?(response.draft?'Rascunho recuperado. O site público ainda usa a versão publicada.':'Conteúdo publicado carregado. Edite e salve seu primeiro rascunho.'):'Prévia disponível. O novo armazenamento editorial ainda precisa ser habilitado; salvar e publicar estão desativados.');
   render();
  }catch(e){error((e as Error).message);notice('Não foi possível carregar a divisão.');}
  finally{busy=false;updateButtons();}
 }
 function renderList(){
  cancelDrag?.();
  if(!doc)return;
  const search=q<HTMLInputElement>('ev-search').value.toLocaleLowerCase('pt-BR');
  q('ev-list').innerHTML=items().filter(x=>('name'in x?x.name:x.title).toLocaleLowerCase('pt-BR').includes(search)).map(x=>{
   const title='name'in x?x.name:x.title;
   return '<div class="ev-list-row" data-id="'+esc(x.id)+'" data-selected="'+(selected===x.id)+'"><button class="ev-grip" draggable="false" title="Arraste pela alça para ordenar dentro da categoria" data-drag="'+esc(x.id)+'" aria-label="Arrastar '+esc(title)+'" '+(search?'disabled':'')+'>⠿</button><button data-select="'+esc(x.id)+'">'+esc(title)+(x.is_active?'':' · oculto')+'</button></div>';
  }).join('')||'<p class="ev-hint">Nenhum card encontrado.</p>';
  q('ev-list').querySelectorAll<HTMLButtonElement>('[data-select]').forEach(b=>b.onclick=()=>{selected=b.dataset.select!;render();});

  q('ev-list').querySelectorAll<HTMLButtonElement>('[data-drag]').forEach(handle=>{
   let suppressClick=false;
   handle.onclick=()=>{if(suppressClick){suppressClick=false;return;}notice(search?'Limpe a busca para reorganizar os cards.':'Segure a alça e arraste até a linha indicada. As setas também permitem ordenar.');};
   handle.onpointerdown=event=>{
    if(search||busy||event.button!==0||!event.isPrimary)return;
    cancelDrag?.();
    const from=handle.dataset.drag!,pointerId=event.pointerId;
    const source=handle.closest<HTMLElement>('[data-id]')!;
    let x=event.clientX,y=event.clientY,active=false,target='',placement:'before'|'after'='before',frame=0;
    const originX=x,originY=y,list=q('ev-list');
    const clearMarkers=()=>list.querySelectorAll<HTMLElement>('[data-drop]').forEach(row=>delete row.dataset.drop);
    const updateTarget=()=>{
     clearMarkers();target='';
     const row=document.elementFromPoint(x,y)?.closest<HTMLElement>('.ev-list-row');
     if(!row||!list.contains(row)||row.dataset.id===from)return;
     if(!canReorder(items(),from,row.dataset.id!)){
      row.dataset.drop='blocked';const message='Este card pertence a outra categoria. Reordene dentro da mesma categoria.';if(q('ev-notice').textContent!==message)notice(message);return;
     }
     const rect=row.getBoundingClientRect();placement=dropPlacement(y,rect.top,rect.height);target=row.dataset.id!;
     row.dataset.drop=placement;
    };
    const tick=()=>{
     if(!active)return;
     const rect=list.getBoundingClientRect();
     if(list.scrollHeight>list.clientHeight+1){
      if(y<rect.top+32)list.scrollTop-=8;
      else if(y>rect.bottom-32)list.scrollTop+=8;
     }else{
      if(y<65)window.scrollBy(0,-10);
      else if(y>window.innerHeight-65)window.scrollBy(0,10);
     }
     updateTarget();frame=requestAnimationFrame(tick);
    };
    const cleanup=()=>{
     cancelAnimationFrame(frame);clearMarkers();delete source.dataset.dragging;list.classList.remove('is-dragging');
     window.removeEventListener('pointermove',pointerMove);window.removeEventListener('pointerup',pointerUp);
     window.removeEventListener('pointercancel',pointerCancel);window.removeEventListener('keydown',keyDown);
     window.removeEventListener('blur',lostPointer);handle.removeEventListener('lostpointercapture',lostPointer);
     if(handle.hasPointerCapture(pointerId))handle.releasePointerCapture(pointerId);cancelDrag=null;
    };
    const pointerMove=(e:PointerEvent)=>{
     if(e.pointerId!==pointerId)return;x=e.clientX;y=e.clientY;
     if(!active&&Math.hypot(x-originX,y-originY)>=6){
      active=true;source.dataset.dragging='true';list.classList.add('is-dragging');
      notice('Arrastando. Solte na linha azul para confirmar; Escape cancela.');tick();
     }
     if(active){e.preventDefault();updateTarget();}
    };
    const pointerUp=(e:PointerEvent)=>{
     if(e.pointerId!==pointerId)return;
     if(active){x=e.clientX;y=e.clientY;updateTarget();}
     const wasActive=active,destination=target,position=placement;suppressClick=active;cleanup();
     if(wasActive){e.preventDefault();if(destination){selected=from;move(from,destination,position);q('ev-list').querySelector<HTMLButtonElement>('[data-drag="'+from+'"]')?.focus();}else notice('Nenhuma mudança. Solte sobre outro card da mesma categoria.');}
    };
    const pointerCancel=(e:PointerEvent)=>{if(e.pointerId===pointerId){cleanup();notice('Arraste cancelado. A ordem foi preservada.');}};
    const lostPointer=()=>{cleanup();notice('Arraste cancelado. A ordem foi preservada.');};
    const keyDown=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();cleanup();notice('Arraste cancelado. A ordem foi preservada.');}};
    event.preventDefault();handle.setPointerCapture(pointerId);cancelDrag=cleanup;
    window.addEventListener('pointermove',pointerMove,{passive:false});window.addEventListener('pointerup',pointerUp);
    window.addEventListener('pointercancel',pointerCancel);window.addEventListener('keydown',keyDown);
    window.addEventListener('blur',lostPointer);handle.addEventListener('lostpointercapture',lostPointer);
   };
  });
 }
 function move(from:string,to:string,placement?:'before'|'after'){
  if(q<HTMLInputElement>('ev-search').value){notice('Limpe a busca para reorganizar os cards.');return;}
  if(!canReorder(items(),from,to)){notice('Reordene os cards dentro da mesma categoria.');return;}
  const before=items().map(x=>x.id).join(',');
  if(kind==='items')doc.items=reorder(doc.items,from,to,placement);else doc.serviceCards=reorder(doc.serviceCards,from,to,placement);
  if(items().map(x=>x.id).join(',')===before){notice('O card já está nessa posição.');return;}
  items().forEach((x,i)=>x.sort_order=i*10);changed();render();
  notice('Card movido para a posição '+(items().findIndex(x=>x.id===from)+1)+'. Salve o rascunho para preservar a nova ordem.');
 }

 const field=(label:string,key:string,value:unknown,type='text')=>'<label>'+esc(label)+'<input data-field="'+key+'" type="'+type+'" value="'+esc(value)+'"></label>';
 const text=(label:string,key:string,value:unknown)=>'<label>'+esc(label)+'<textarea data-field="'+key+'">'+esc(value)+'</textarea></label>';
 const select=(label:string,key:string,value:unknown,options:[string,string][])=>'<label>'+esc(label)+'<select data-field="'+key+'">'+options.map(([v,l])=>'<option value="'+esc(v)+'" '+(v===value?'selected':'')+'>'+esc(l)+'</option>').join('')+'</select></label>';
 function render(){
  if(!doc)return;
  renderList();updateButtons();
  const item=current();
  q('ev-frame').hidden=!preview;q('ev-canvas').hidden=preview;
  if(!item){q('ev-canvas').innerHTML='<div class="ev-empty">Nenhum card nesta divisão. Use Novo card para começar.</div>';q('ev-properties').innerHTML='';return;}
  const commercial='name'in item, detail=doc.details[selected];
  const title=commercial?item.name:item.title;
  const price=commercial?(item.price===null?(item.price_type==='free'?'Sem custo':'Sob consulta'):new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(item.price)):'';
  q('ev-canvas').innerHTML='<article class="ev-card"><span class="ev-tag">Noden '+esc(division)+' · '+(commercial?'Catálogo':'Solução')+'</span><label>Nome<input class="ev-title" data-inline="'+(commercial?'name':'title')+'" value="'+esc(title)+'"></label><label>Descrição<textarea class="ev-description" data-inline="description">'+esc(item.description)+'</textarea></label><label>Destaques · um por linha<textarea data-inline="features">'+esc(lines(item.features))+'</textarea></label>'+(commercial?'<p class="ev-price">'+esc(price)+'</p><label>Texto do botão<input data-inline="cta_label" value="'+esc(item.cta_label??'')+'" placeholder="Consultar pelo WhatsApp"></label>':'')+'<p class="ev-hint">Clique nos campos para editar. Use Prévia real para ver o componente público.</p></article>';
  q('ev-canvas').querySelectorAll<HTMLInputElement|HTMLTextAreaElement>('[data-inline]').forEach(el=>{
   el.oninput=()=>{const key=el.dataset.inline!;Object.assign(item,{[key]:key==='features'?split(el.value):el.value});updateButtons();};
   el.onchange=()=>{changed();renderList();};
  });
  const choices=(list:Choice[]|undefined)=>[['','Sem classificação'],...(list??[]).map(x=>[x.id,x.name])] as [string,string][];
  let html='<h2>Propriedades</h2><div class="ev-actions"><button data-up>↑ Subir</button><button data-down>↓ Descer</button></div><label class="ev-check"><input type="checkbox" data-active '+(item.is_active?'checked':'')+'>Visível após publicar</label>';
  if(commercial){
   html+='<details open><summary>Classificação e preço</summary>'+select('Tipo','item_kind',item.item_kind,[['service','Serviço'],['package','Pacote'],['product','Produto'],['consulting','Consultoria']])+select('Categoria','category_id',item.category_id??'',choices(response.categories))+select('Nível','tier_id',item.tier_id??'',choices(response.tiers))+select('Formato de preço','price_type',item.price_type,[['fixed','Preço fixo'],['starting_at','A partir de'],['free','Gratuito'],['consultation','Sob consulta']])+(item.price_type==='fixed'||item.price_type==='starting_at'?field('Valor (R$)','price',item.price,'number')+field('Preço anterior (R$)','compare_at_price',item.compare_at_price,'number'):'')+field('Rótulo do preço','price_label',item.price_label)+field('Prefixo','price_prefix',item.price_prefix)+field('Sufixo','price_suffix',item.price_suffix)+text('Ressalvas','note',item.note)+text('Mensagem de contato','cta_message',item.cta_message)+'<label class="ev-check"><input type="checkbox" data-featured '+(item.is_featured?'checked':'')+'>Destacar card</label><h3>Selos</h3>'+(response.badges??[]).map(b=>'<label class="ev-check"><input type="checkbox" data-badge="'+esc(b.id)+'" '+(item.badge_ids.includes(b.id)?'checked':'')+'>'+esc(b.name)+'</label>').join('')+'</details>';
   html+='<details '+(detail?'open':'')+'><summary>Página, galeria e ajuda</summary>';
   if(!detail)html+='<p class="ev-hint">Adicione uma apresentação completa com URL própria.</p><button data-enable-detail>Criar apresentação</button>';
   else html+=field('Endereço /produtos/','detail.slug',detail.slug)+text('Resumo','detail.summary',detail.summary)+text('Apresentação','detail.body',detail.body)+select('Modalidade','detail.modality',detail.modality,[['physical','Produto físico'],['digital','Produto digital'],['service','Serviço']])+select('Disponibilidade','detail.status',detail.status,[['available','Disponível'],['reserved','Reservado'],['sold','Vendido'],['unavailable','Indisponível']])+select('Destino do botão','detail.ctaKind',detail.ctaKind,[['contact','Contato'],['microsoft','Catálogo Microsoft'],['external','Link externo']])+(detail.ctaKind==='microsoft'?field('URL Microsoft','detail.microsoftUrl',detail.microsoftUrl):detail.ctaKind==='external'?field('URL externa HTTPS','detail.externalUrl',detail.externalUrl):'')+field('Versão','detail.version',detail.version)+text('Recursos · um por linha','detail.features',lines(detail.features))+'<h3>Como usar</h3>'+detail.steps.map((s,i)=>field('Etapa '+(i+1),'stepTitle.'+i,s.title)+text('Instruções','stepBody.'+i,s.body)+'<button data-remove-step="'+i+'">Remover etapa</button>').join('')+'<button data-add-step>＋ Etapa</button><h3>Perguntas frequentes</h3>'+detail.faq.map((s,i)=>field('Pergunta','faqQuestion.'+i,s.question)+text('Resposta','faqAnswer.'+i,s.answer)+'<button data-remove-faq="'+i+'">Remover pergunta</button>').join('')+'<button data-add-faq>＋ Pergunta</button>';
   html+='</details>';
   if(detail)html+='<details open><summary>Imagens e vídeos</summary><p class="ev-hint">JPEG, PNG ou WebP até 8 MB. Até 12 mídias. Vídeos por link YouTube ou Vimeo.</p><label>Enviar imagem<input type="file" data-upload accept="image/jpeg,image/png,image/webp" '+(!ready?'disabled':'')+'></label>'+detail.media.map((m,i)=>'<div class="ev-media">'+select('Tipo','mediaType.'+i,m.type,[['image','Imagem'],['youtube','YouTube'],['vimeo','Vimeo']])+field('URL','mediaUrl.'+i,m.url)+field('Texto alternativo / título','mediaAlt.'+i,m.alt)+field('Legenda','mediaCaption.'+i,m.caption??'')+'<div class="ev-actions"><button data-media-up="'+i+'">↑</button><button data-media-down="'+i+'">↓</button><button data-media-remove="'+i+'">Remover</button></div></div>').join('')+'<button data-add-media '+(detail.media.length>=12?'disabled':'')+'>＋ Vídeo ou imagem por URL</button></details>';
  }else html+=field('Selo','badge',item.badge);
  q('ev-properties').innerHTML=html;
  const slugInput=q('ev-properties').querySelector<HTMLInputElement>('[data-field="detail.slug"]');
  if(slugInput&&response.published.details[selected]){slugInput.readOnly=true;slugInput.title='Endereços publicados são preservados para manter links existentes.';}
  q('ev-properties').querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>('[data-field]').forEach(el=>el.onchange=()=>{
   const key=el.dataset.field!;
   if(key.startsWith('detail.'))setDetail(key.slice(7),key==='detail.features'?split(el.value):el.value);
   else if(/^(stepTitle|stepBody|faqQuestion|faqAnswer|mediaType|mediaUrl|mediaAlt|mediaCaption)\./.test(key)){
    const [group,n]=key.split('.'), i=Number(n), d=doc.details[selected];if(!d)return;
    if(group==='stepTitle')d.steps[i].title=el.value;if(group==='stepBody')d.steps[i].body=el.value;
    if(group==='faqQuestion')d.faq[i].question=el.value;if(group==='faqAnswer')d.faq[i].answer=el.value;
    if(group==='mediaType')d.media[i].type=el.value as 'image'|'youtube'|'vimeo';
    if(group==='mediaUrl')d.media[i].url=el.value;if(group==='mediaAlt')d.media[i].alt=el.value;if(group==='mediaCaption')d.media[i].caption=el.value;changed();
   }else{
    const v=['price','compare_at_price'].includes(key)?el.value===''?null:Number(el.value):['category_id','tier_id'].includes(key)?el.value||null:el.value;
    setItem(key,v);
    if(key==='price_type'&&commercial){if(['free','consultation'].includes(el.value)){item.price=null;item.compare_at_price=null;}else if(item.price===null)item.price=0;changed();}
   }render();
  });
  const on=(selector:string,fn:(e:HTMLElement)=>void)=>q('ev-properties').querySelectorAll<HTMLElement>(selector).forEach(el=>el.onclick=()=>fn(el));
  on('[data-active]',el=>{setItem('is_active',(el as HTMLInputElement).checked);renderList();});
  on('[data-featured]',el=>setItem('is_featured',(el as HTMLInputElement).checked));
  on('[data-badge]',el=>{if(!commercial)return;const id=el.dataset.badge!;item.badge_ids=(el as HTMLInputElement).checked?[...item.badge_ids,id]:item.badge_ids.filter(x=>x!==id);changed();});
  for(const direction of ['up','down'])on('[data-'+direction+']',()=>{const group=items().filter(x=>!commercial||('category_id'in x&&x.category_id===item.category_id));const target=group[group.findIndex(x=>x.id===selected)+(direction==='up'?-1:1)];if(target)move(selected,target.id);});
  on('[data-enable-detail]',()=>{
   doc.details[selected]={slug:'produto-'+selected.slice(0,8),summary:item.description,body:'',media:[],features:[],steps:[],faq:[],version:'',updatedAt:new Date().toISOString(),status:'available',modality:division==='data'?'digital':'physical',ctaKind:division==='data'?'microsoft':'contact',microsoftUrl:'',externalUrl:''} as ProductDetail;
   changed();render();
  });
  if(detail){
   on('[data-add-step]',()=>{detail.steps.push({title:'Nova etapa',body:''});changed();render();});
   on('[data-remove-step]',el=>{detail.steps.splice(Number(el.dataset.removeStep),1);changed();render();});
   on('[data-add-faq]',()=>{detail.faq.push({question:'Nova pergunta',answer:''});changed();render();});
   on('[data-remove-faq]',el=>{detail.faq.splice(Number(el.dataset.removeFaq),1);changed();render();});
   on('[data-add-media]',()=>{detail.media.push({id:crypto.randomUUID(),type:'youtube',url:'',alt:''});changed();render();});
   on('[data-media-remove]',el=>{detail.media.splice(Number(el.dataset.mediaRemove),1);changed();render();});
   for(const dir of ['up','down'])on('[data-media-'+dir+']',el=>{const i=Number(el.dataset[dir==='up'?'mediaUp':'mediaDown']),j=i+(dir==='up'?-1:1);if(j<0||j>=detail.media.length)return;[detail.media[i],detail.media[j]]=[detail.media[j],detail.media[i]];changed();render();});
   const upload=q('ev-properties').querySelector<HTMLInputElement>('[data-upload]');
   if(upload)upload.onchange=async()=>{
    const file=upload.files?.[0];if(!file)return;
    if(detail.media.length>=12){error('Limite de 12 mídias.');return;}
    if(file.size>8*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type)){error('Use JPEG, PNG ou WebP de até 8 MB.');return;}
    const form=new FormData();form.set('file',file);form.set('alt',file.name.replace(/\.[^.]+$/,''));
    upload.disabled=true;notice('Enviando imagem…');
    try{const res=await fetch('/api/admin/editor/media',{method:'POST',body:form});const body=await res.json();if(!res.ok)throw new Error(body.error||'Falha no envio.');detail.media.push(body.media);changed();render();}
    catch(e){error((e as Error).message);upload.disabled=false;}
   };
  }
  if(preview)void renderPreview();
 }
 async function renderPreview(){
  if(!doc)return;previewAbort?.abort();previewAbort=new AbortController();notice('Atualizando prévia…');
  try{
   const res=await fetch('/admin/editor/preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({document:doc,selected,kind}),signal:previewAbort.signal});
   if(!res.ok)throw new Error(await res.text());
   q<HTMLIFrameElement>('ev-frame').srcdoc=await res.text();notice('Prévia do conteúdo atual, sem publicação. Links externos abrem em outra aba.');
  }catch(e){if((e as Error).name!=='AbortError')error('Não foi possível montar a prévia. '+(e as Error).message);}
 }
 q<HTMLSelectElement>('ev-division').onchange=async e=>{
  const next=(e.target as HTMLSelectElement).value;if(dirty()&&!confirm('Descartar alterações locais desta divisão?')){q<HTMLSelectElement>('ev-division').value=division;return;}
  division=next;await load();
 };
 document.querySelectorAll<HTMLButtonElement>('[data-kind]').forEach(b=>b.onclick=()=>{if(!doc)return;kind=b.dataset.kind as typeof kind;selected=items()[0]?.id??'';document.querySelectorAll('[data-kind]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();});
 q<HTMLInputElement>('ev-search').oninput=renderList;
 q('ev-undo').onclick=()=>{if(!history)return;const next=history.undo();if(next){doc=next;if(!current())selected=items()[0]?.id??'';render();notice('Alteração desfeita.');}};
 q('ev-redo').onclick=()=>{if(!history)return;const next=history.redo();if(next){doc=next;if(!current())selected=items()[0]?.id??'';render();notice('Alteração refeita.');}};
 q('ev-edit').onclick=()=>{preview=false;q('ev-edit').setAttribute('aria-pressed','true');q('ev-preview').setAttribute('aria-pressed','false');render();};
 q('ev-preview').onclick=()=>{preview=true;q('ev-edit').setAttribute('aria-pressed','false');q('ev-preview').setAttribute('aria-pressed','true');render();};
 document.querySelectorAll<HTMLButtonElement>('[data-size]').forEach(b=>b.onclick=()=>{document.querySelector<HTMLElement>('.ev-main')!.dataset.size=b.dataset.size;document.querySelectorAll('[data-size]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
 q('ev-save').onclick=async()=>{busy=true;updateButtons();error();try{const snapshot=structuredClone(doc);const result=await request('/api/admin/editor/drafts',{division,expectedRevision:revision,baseRevision,document:snapshot});revision=result.draft?.revision??result.revision;saved=JSON.stringify(snapshot);notice('Rascunho salvo. O site público não mudou.');}catch(e){error((e as Error).message);}finally{busy=false;updateButtons();}};
 q('ev-discard').onclick=async()=>{
  if(!confirm('Excluir o rascunho SALVO desta divisão e todas as alterações locais? Produtos criados apenas no rascunho também serão removidos. Esta ação não é uma atualização da página. Para manter o rascunho, cancele.'))return;
  busy=true;updateButtons();error();
  try{if(ready&&revision)await request('/api/admin/editor/drafts',{action:'discard',division,expectedRevision:revision});await load();notice('Versão publicada carregada.');}
  catch(e){error((e as Error).message);}finally{busy=false;updateButtons();}
 };
 q('ev-publish').onclick=()=>q<HTMLDialogElement>('ev-confirm').showModal();
 q<HTMLDialogElement>('ev-confirm').onclose=async()=>{if(q<HTMLDialogElement>('ev-confirm').returnValue!=='publish')return;busy=true;updateButtons();error();try{await request('/api/admin/editor/publish',{division,expectedRevision:revision});await load();notice('Divisão publicada. O conteúdo já pode ser conferido no site.');}catch(e){error((e as Error).message);}finally{busy=false;updateButtons();}};
 q('ev-add').onclick=()=>{
  if(!doc)return;const id=crypto.randomUUID(),now=new Date().toISOString();
  const pageId=response.pageId??doc.items[0]?.service_page_id??doc.serviceCards[0]?.service_page_id;
  if(!pageId){error('A divisão precisa de uma página de serviço antes de receber cards.');return;}
  const common={id,service_page_id:pageId,created_at:now,updated_at:now,updated_by:null,sort_order:items().length*10,is_active:false,description:'Descreva o benefício e o que está incluído.',features:[],badge:null};
  if(kind==='items')doc.items.push({...common,name:'Novo produto',item_kind:'product',price_type:'consultation',price:null,compare_at_price:null,price_label:null,price_prefix:null,price_suffix:null,category_id:null,tier_id:null,note:null,is_featured:false,cta_label:null,cta_message:null,badge_ids:[]});
  else doc.serviceCards.push({...common,title:'Nova solução'});
  selected=id;changed();render();
 };
 window.addEventListener('beforeunload',e=>{if(dirty()){e.preventDefault();}});
 void load();
}
