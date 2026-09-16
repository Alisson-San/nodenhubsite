// Chromium launched by agent-browser; no database writes or authenticated session required.
// node scripts/qa/navigation.mjs http://127.0.0.1:PORT http://localhost:4322 /tmp/noden-evidence
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
const key = async (key, code = key, modifiers = 0) => {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, modifiers, text: key === 'Enter' ? '\r' : key === ' ' ? ' ' : undefined, windowsVirtualKeyCode: { Tab: 9, Escape: 27, Enter: 13, ' ': 32 }[key] });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, modifiers });
  await new Promise(r => setTimeout(r, 80));
};
const shot = async name => {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(`${out}/${name}.png`, Buffer.from(data, 'base64'));
};
const checks = [];
const check = (name, condition) => { assert(condition, name); checks.push(name); console.log(`PASS ${name}`); };
await mkdir(out, { recursive: true });
try {
  // Discard DOM-only fixtures left by a previous run before testing real content.
  await send('Page.navigate', { url: 'about:blank' });
  await send('Page.enable');
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Page.setLifecycleEventsEnabled', { enabled: true });
  for (const [w, h] of [[320,740],[390,844],[768,1024],[910,698],[1440,900],[844,390]]) {
    await viewport(w,h);
    await open('/#noden-home');
    await waitFor('getComputedStyle(document.querySelector("#noden-home")).opacity === "1"');
    const home = await evaluate('(()=>{const e=document.querySelector("#noden-home"),r=e.getBoundingClientRect();return {top:r.top,inert:e.inert,overflow:document.documentElement.scrollWidth>innerWidth};})()');
    check(`Home direct ${w}x${h}`, home.top >= 50 && home.top < h && !home.inert && !home.overflow);
    if (w === 390 || w === 1440) await shot(`home-${w}`);
    await open('/#contato');
    const contact = await evaluate('(()=>{const e=document.querySelector(".final-contact-link"),r=e.getBoundingClientRect();return {top:r.top,opacity:getComputedStyle(e).opacity};})()');
    check(`Contact direct ${w}x${h}`, contact.top >= 0 && contact.top < h && contact.opacity === '1');
    await shot(`contact-${w}x${h}`);
  }
  await viewport(1440,900); await open('/#noden-home');
  await viewport(390,844);
  await new Promise(r => setTimeout(r,350));
  check('Resize preserves direct section', await evaluate('location.hash === "#noden-home" && document.querySelector("#noden-home").getBoundingClientRect().top >= 50 && document.querySelector("#noden-home").getBoundingClientRect().top < innerHeight'));
  await viewport(1440,900);
  await new Promise(r => setTimeout(r,350));
  check('Resize restores animated section', await evaluate('document.documentElement.classList.contains("experience-animated") && !document.querySelector("#noden-home").inert'));
  await viewport(390,844);
  await open('/');
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  const touchPoint = await evaluate('(()=>{const r=document.querySelector("#menu-toggle").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()');
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touchPoint] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await waitFor('document.querySelector("#menu-toggle").getAttribute("aria-expanded")==="true"');
  check('Touch opens mobile menu', true);
  await key('Escape');
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await evaluate('document.querySelector("#menu-toggle").focus()');
  await key('Tab');
  check('Closed menu excluded from focus', await evaluate('!document.activeElement.closest("#site-navigation")'));
  await evaluate('document.querySelector("#menu-toggle").focus()');
  await key('Enter');
  check('Enter opens menu', await evaluate('document.querySelector("#menu-toggle").getAttribute("aria-expanded")==="true"'));
  await key('Tab');
  check('Open menu focus sequence', await evaluate('document.activeElement.getAttribute("href")==="#quem-somos"'));
  await key('Escape');
  check('Escape closes and returns focus', await evaluate('document.activeElement.id === "menu-toggle" && document.querySelector("#site-navigation").inert'));
  await key(' ', 'Space');
  check('Space opens menu', await evaluate('document.querySelector("#menu-toggle").getAttribute("aria-expanded")==="true"'));
  await key('Tab'); await key('Tab', 'Tab', 8);
  check('Shift Tab returns to trigger', await evaluate('document.activeElement.id === "menu-toggle"'));
  await evaluate('document.querySelectorAll("#site-navigation a")[1].click()');
  await waitFor('location.hash==="#noden-home"');
  check('Click updates hash', true);
  await evaluate('history.back()');
  await waitFor('location.hash===""');
  await evaluate('history.forward()');
  await waitFor('location.hash==="#noden-home"');
  check('Back and forward', true);
  await send('Emulation.setEmulatedMedia', { features: [{ name:'prefers-reduced-motion', value:'reduce' }] });
  await viewport(1440,900); await open('/#noden-data');
  check('Reduced motion normal flow', await evaluate('!document.documentElement.classList.contains("experience-animated") && document.querySelector("#noden-data").getBoundingClientRect().top >= 50'));
  await send('Emulation.setEmulatedMedia', { features: [] });
  await send('Emulation.setScriptExecutionDisabled', { value: true });
  for (const route of ['/#noden-home', '/mobile#noden-home']) {
    await viewport(390,844); await open(route);
    check(`No JS ${route}`, await evaluate('(()=>{const e=document.querySelector("#noden-home"),r=e.getBoundingClientRect();return getComputedStyle(e).opacity==="1" && r.top>=50 && r.top<844})()'));
    await shot(route.startsWith('/mobile') ? 'mobile-no-js' : 'index-no-js');
  }
  await send('Emulation.setScriptExecutionDisabled', { value: false });
  for (const [w,h] of [[320,740],[390,844],[768,1024],[910,698],[1440,900],[844,390]]) {
    await viewport(w,h);
    for (const route of ['/mobile','/home','/game','/data','/links']) {
      await open(route);
      check(`${route} ${w}x${h}`, await evaluate('!!document.querySelector("h1") && !document.querySelector("astro-error-overlay") && document.documentElement.scrollWidth<=innerWidth'));
      if (w===390 || w===1440) await shot(`${route.slice(1)}-${w}`);
    }
  }
  await viewport(390,844); await open('/home');
  await evaluate('document.querySelector(".site-header__mobile-menu summary").focus()'); await key('Enter'); await key('Escape');
  check('Division menu Escape', await evaluate('!document.querySelector(".site-header__mobile-menu").open && document.activeElement.tagName==="SUMMARY"'));
  for (const route of ['/home','/game','/data']) {
    await open(route);
    const initial = await evaluate('document.querySelector("[data-result-count]")?.textContent');
    if (!initial) continue;
    await evaluate('(()=>{const e=document.querySelector("[data-catalog-search]");e.value="zzzz-inexistente-noden";e.dispatchEvent(new Event("input",{bubbles:true}));})()');
    await waitFor('!document.querySelector("[data-catalog-empty]").hidden');
    check(`Empty search ${route}`, true);
    await evaluate('document.querySelector("[data-clear-search]").click()');
    check(`Clear search ${route}`, await evaluate('document.querySelector("[data-result-count]").textContent') === initial);
    check(`HTTPS contacts ${route}`, await evaluate('!document.querySelector(\'a[href^="whatsapp:"]\') && !!document.querySelector(\'a[href^="https://wa.me/"]\')'));
  }
  await send('Network.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1' });
  await viewport(1024,768,true); await open('/mobile#noden-home');
  check('Wide tablet keeps mobile route and fragment', await evaluate('location.pathname==="/mobile" && location.hash==="#noden-home" && document.querySelector("#noden-home").getBoundingClientRect().top<768'));
  await send('Network.setUserAgentOverride', { userAgent: '' });
  await viewport(1440,900); await open('/');
  await new Promise(r => setTimeout(r,1100));
  await shot('index-hero-desktop');
  await viewport(390,844); await open('/'); await shot('index-hero-mobile');
  await viewport(1440,900); await open('/#noden-home');
  const summaries = await evaluate('Array.from(document.querySelectorAll(".division-copy")).map(p=>({title:p.querySelector("h2").textContent,description:p.querySelector(".division-lead").textContent,items:Array.from(p.querySelectorAll("li")).map(li=>li.textContent)}))');
  await evaluate(`(() => {
    const p = document.querySelector('#noden-home');
    p.querySelector('h2').textContent = 'Suporte residencial e orientação para os equipamentos da sua casa. '.repeat(2).slice(0,100);
    p.querySelector('.division-lead').textContent = 'Atendimento residencial com diagnóstico claro e soluções para os equipamentos da sua casa. '.repeat(4).slice(0,260);
    p.querySelector('ul').replaceChildren(...Array.from({length:6}, () => {
      const li = document.createElement('li');
      li.textContent = 'Instalação e configuração de equipamentos com orientação sobre uso, manutenção e desempenho do sistema';
      return li;
    }));
  })()`);
  await waitFor('!document.documentElement.classList.contains("experience-animated")');
  await evaluate('document.querySelector("#noden-home a").focus(); document.querySelector("#noden-home a").scrollIntoView({block:"center"})');
  check('Long editorial summary keeps CTA visible and focusable', await evaluate('(()=>{const p=document.querySelector("#noden-home"),a=p.querySelector("a"),r=a.getBoundingClientRect();return !p.inert && document.activeElement===a && r.top>=80 && r.bottom<=innerHeight && document.documentElement.scrollWidth<=innerWidth})()'));
  await shot('long-summary-desktop');
  await viewport(390,844); await open('/mobile#noden-home');
  const mobileSummaries = await evaluate('Array.from(document.querySelectorAll(".service-copy")).map(p=>({title:p.querySelector("h3").textContent,description:p.querySelector("p").textContent,items:Array.from(p.querySelectorAll("li")).map(li=>li.textContent)}))');
  check('Initial and mobile share division summaries', JSON.stringify(summaries) === JSON.stringify(mobileSummaries));
  await shot('mobile-summary-390');
  if (base.includes(':4323')) {
    await viewport(1440,900);
    await send('Network.setBlockedURLs', { urls: ['*/_astro/*.js'] });
    await open('/?bundle=blocked#noden-home');
    await waitFor('document.documentElement.dataset.animationUnavailable === "true"');
    await new Promise(r => setTimeout(r,100));
    check('Failed animation bundle keeps direct content accessible', await evaluate('!document.documentElement.classList.contains("experience-animated") && document.querySelector("#noden-home").getBoundingClientRect().top >= 50 && document.querySelector("#noden-home").getBoundingClientRect().top < innerHeight'));
    await shot('failed-animation-bundle');
    await send('Network.setBlockedURLs', { urls: [] });
  }
  await open('/admin');
  check('Anonymous admin redirects to login', await evaluate('location.pathname==="/admin/login" && !!document.querySelector("input[type=password]")'));
  await writeFile(`${out}/results.json`, JSON.stringify({ checks },null,2));
} finally {
  await send('Emulation.setScriptExecutionDisabled', { value: false });
  await send('Network.setBlockedURLs', { urls: [] });
  await send('Network.setCacheDisabled', { cacheDisabled: false });
  ws.close();
}
