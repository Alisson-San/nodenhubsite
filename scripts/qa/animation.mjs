// Chromium launched by agent-browser; no database writes or authenticated session required.
// node scripts/qa/animation.mjs http://127.0.0.1:PORT http://localhost:4322 /tmp/noden-evidence
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const [cdp, base = 'http://localhost:4322', out = '/tmp/noden-evidence'] = process.argv.slice(2);
assert(cdp, 'Provide the Chromium CDP HTTP endpoint (agent-browser get cdp-url).');
const targets = await (await fetch(`${cdp}/json/list`)).json();
const target = targets.find(t => t.type === 'page' && t.url.startsWith(base));
assert(target, 'Open the local site in the test browser first.');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let seq = 0;
const pending = new Map();
const loaded = new Set();
ws.addEventListener('message', e => {
  const data = JSON.parse(e.data);
  if (data.method === 'Page.lifecycleEvent' && data.params.name === 'load') loaded.add(data.params.loaderId);
  if (!data.id) return;
  const task = pending.get(data.id);
  pending.delete(data.id);
  if (data.error) task.reject(new Error(JSON.stringify(data.error))); else task.resolve(data.result);
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++seq; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
};
const waitFor = async expression => {
  for (let i = 0; i < 150; i++) {
    if (await evaluate(expression)) return;
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error(`Timeout: ${expression}`);
};
const open = async path => {
  const navigation = await send('Page.navigate', { url: `${base}${path}` });
  if (navigation.loaderId) {
    for (let i=0; i<150 && !loaded.has(navigation.loaderId); i++) await new Promise(r => setTimeout(r,100));
    assert(loaded.has(navigation.loaderId), `Navigation did not load: ${path}`);
  }
  await waitFor('document.readyState === "complete"');
  await new Promise(r => setTimeout(r, 250));
};
const viewport = (width, height, mobile = false) => send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
const shot = async name => {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(`${out}/${name}.png`, Buffer.from(data, 'base64'));
};
const checks = [];
const check = (name, condition) => { assert(condition, name); checks.push(name); console.log(`PASS ${name}`); };
await mkdir(out, { recursive: true });
const composition = `(() => {
 const rect = e => e.getBoundingClientRect();
 const copy = rect(document.querySelector('#inicio'));
 const rings = Array.from(document.querySelectorAll('.module-ring')).map(e => {
   const r=rect(e),m=e.getScreenCTM(),pad=parseFloat(getComputedStyle(e).strokeWidth)*Math.hypot(m.a,m.b)/2;
   return {left:r.left-pad,right:r.right+pad,top:r.top-pad,bottom:r.bottom+pad};
 });
 const slot=rect(document.querySelector('#brand-symbol-slot')), symbol=rect(document.querySelector('#brand-symbol'));
 const word=rect(document.querySelector('.brand-lockup')),scene=rect(document.querySelector('.scene'));
 return {clear:rings.every(r=>r.right<copy.left || r.left>copy.right || r.bottom<copy.top || r.top>copy.bottom),
   visible:rings.every(r=>r.left>=0 && r.right<=innerWidth && r.top>=64 && r.bottom<=innerHeight),
   aligned:Math.abs(slot.left-symbol.left)<1 && Math.abs(slot.top-symbol.top)<1 && Math.abs(slot.width-symbol.width)<1,
   centered:Math.abs(word.left+word.width/2-scene.left-scene.width/2)<1 && Math.abs(word.top+word.height/2-innerHeight/2)<2,
   complete:['.brand-letter-n','.brand-letter-den'].every(sel=>Number(getComputedStyle(document.querySelector(sel)).opacity)>.99),
   copyOpacity:Number(getComputedStyle(document.querySelector('#inicio')).opacity)};
})()`;
const scrollFraction = async fraction => {
 await evaluate(`scrollTo(0,(document.querySelector('.scroll-stage').offsetHeight-innerHeight)*${fraction})`);
 await new Promise(r=>setTimeout(r,400));
};
try {
 await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
 await send('Network.setCacheDisabled',{cacheDisabled:true}); await send('Page.setLifecycleEventsEnabled',{enabled:true});
 for(const [w,h] of [[1280,550],[1280,577],[1366,650],[1366,768],[1440,900],[1920,1080]]) {
  await viewport(w,h); await open(`/?composition=${w}-${h}`);
  await waitFor('document.documentElement.classList.contains("experience-animated") && !document.documentElement.classList.contains("experience-preparing")');
  await new Promise(r=>setTimeout(r,1200));
  const start=await evaluate(composition);
  check(`Opening text clear and three rings inside scene ${w}x${h}`,start.clear && start.visible);
  await shot(`opening-${w}x${h}`);
  for(const fraction of [.015,.03,.045]) {
   await scrollFraction(fraction);const state=await evaluate(composition);
   check(`Readable text stays clear during assembly ${w}x${h} ${fraction}`,state.copyOpacity<.2 || state.clear);
  }
  await scrollFraction(.24); const brand=await evaluate(composition);
  check(`Complete NODEN centered with symbol fitted ${w}x${h}`,brand.centered && brand.aligned && brand.complete);
  await shot(`brand-${w}x${h}`);
  await scrollFraction(.37);
  check(`Symbol stays fitted when word rises ${w}x${h}`,(await evaluate(composition)).aligned);
  await scrollFraction(0); await new Promise(r=>setTimeout(r,500));
  check(`Reversing preserves readable opening ${w}x${h}`,(await evaluate(composition)).clear);
 }
 await viewport(1366,650); await open('/?composition=resize'); await scrollFraction(.24);
 await viewport(1440,900); await new Promise(r=>setTimeout(r,700));
 const resized=await evaluate(composition);
 check('Resizing mid-sequence preserves centered complete logo',resized.centered && resized.aligned && resized.complete);
 await scrollFraction(0);
 check('Resizing then reversing preserves clear text',(await evaluate(composition)).clear);
 await writeFile(`${out}/results.json`,JSON.stringify({checks},null,2));
} finally { await send('Network.setCacheDisabled',{cacheDisabled:false});ws.close(); }
