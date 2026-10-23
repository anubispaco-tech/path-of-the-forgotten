/* 離線快取：模型與函式庫優先用快取（秒開），網頁與程式優先抓最新版（改版立即生效） */
const CACHE='pof-v0.5.0';
const CORE=['./','index.html','css/style.css','data/rules.js','data/enemies.js','data/stages.js','data/skills.js','data/gear.js','data/meta.js','js/engine.js','js/world.js','js/combat.js','js/run.js','js/meta.js','js/main.js','lib/three.min.js','lib/GLTFLoader.js','lib/SkeletonUtils.js','manifest.webmanifest','icons/icon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);
  const heavy=/\.(glb|png|svg)$/.test(u.pathname)||u.pathname.includes('/lib/')||u.hostname!==location.hostname;
  if(heavy){e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{if(res.ok||res.type==='opaque'){const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp))}return res})));return}
  e.respondWith(fetch(e.request).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return res}).catch(()=>caches.match(e.request)))});
