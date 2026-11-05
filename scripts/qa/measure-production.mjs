// Local lab measurements, not Lighthouse scores or field Core Web Vitals.
// node scripts/qa/measure-production.mjs http://127.0.0.1:CDP_PORT
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const cdp = process.argv[2];
const targets = await (await fetch(`${cdp}/json/list`)).json();
const target = targets.find(t => t.type === 'page' && t.url.startsWith('http://127.0.0.1:4323'));
assert(target, 'Open the production preview in the test browser first.');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let seq=0;
const pending=new Map();
ws.addEventListener('message', e => {
  const data=JSON.parse(e.data), task=pending.get(data.id);
  if (task) { pending.delete(data.id); data.error ? task.reject(data.error) : task.resolve(data.result); }
});
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const results=[];
try {
  await send('Page.enable'); await send('Network.enable');
  await send('Network.setCacheDisabled',{cacheDisabled:true});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.lab={lcp:0,cls:0,longTasks:0};
    new PerformanceObserver(list=>{for(const e of list.getEntries())window.lab.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});
    new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.lab.cls+=e.value}).observe({type:'layout-shift',buffered:true});
    new PerformanceObserver(list=>{for(const e of list.getEntries())window.lab.longTasks+=Math.max(0,e.duration-50)}).observe({type:'longtask',buffered:true});`});
  for(const mobile of [false,true]) {
    await send('Emulation.setDeviceMetricsOverride',{width:mobile?390:1440,height:mobile?844:900,deviceScaleFactor:1,mobile});
    await send('Emulation.setCPUThrottlingRate',{rate:mobile?4:1});
    await send('Network.emulateNetworkConditions',{offline:false,latency:mobile?150:0,downloadThroughput:mobile?200000:-1,uploadThroughput:mobile?93750:-1});
    await send('Network.setUserAgentOverride',{userAgent:mobile?'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/153.0.0.0 Mobile Safari/537.36':''});
    for(let run=1;run<=3;run++) {
      await send('Page.navigate',{url:`http://127.0.0.1:4323/?lab=${mobile?'mobile':'desktop'}-${run}`});
      for(let i=0;i<300;i++) { if(await evaluate('document.readyState==="complete" && !!window.lab'))break; await pause(100); }
      await pause(1800);
      const data=await evaluate(`({...window.lab,path:location.pathname,fcp:performance.getEntriesByName('first-contentful-paint')[0]?.startTime,ttfb:performance.getEntriesByType('navigation')[0]?.responseStart,load:performance.getEntriesByType('navigation')[0]?.loadEventEnd,jsBytes:performance.getEntriesByType('resource').filter(e=>e.name.endsWith('.js')).reduce((sum,e)=>sum+e.encodedBodySize,0)})`);
      assert.equal(data.path,mobile?'/mobile':'/');
      results.push({mode:mobile?'390x844 CPU4x 1.6Mbps RTT150ms':'1440x900 unthrottled',run,...data});
      console.log(JSON.stringify(results.at(-1)));
    }
  }
  await writeFile('/tmp/noden-production-metrics.json',JSON.stringify(results,null,2));
} finally {
  await send('Emulation.setCPUThrottlingRate',{rate:1});
  await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
  await send('Network.setUserAgentOverride',{userAgent:''});
  await send('Network.setCacheDisabled',{cacheDisabled:false});
  ws.close();
}
