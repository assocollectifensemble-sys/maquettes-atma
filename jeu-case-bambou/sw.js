const V='case-bambou-88077272',F=["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "img/hero.webp", "img/table.webp"];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(V).then(c=>c.addAll(F)).catch(()=>{}))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);
 if(u.origin===location.origin&&(e.request.mode==='navigate'||u.pathname.endsWith('.html'))){e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(V).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))));return}
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{if(n.ok&&(u.origin===location.origin||u.host.includes('fonts.g'))){const c=n.clone();caches.open(V).then(x=>x.put(e.request,c))}return n})))});
