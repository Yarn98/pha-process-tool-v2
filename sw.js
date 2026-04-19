/* Bump this whenever index.html / tokens.css / overrides.css / precached JS changes.
   The activate handler deletes any cache whose name !== CACHE, so bumping the
   version string is how we force a full refresh of cached assets. Keep a short
   trailing token describing the change so the log is auditable. */
const CACHE = 'pha-cache-v10-compounding-copy';
const PRECACHE_URLS = [
  './',
  './index.html',
  './tokens.css',
  './overrides.css',
  './custom.js',
  './glossary.js',
  './anomaly-codes.js',
  './tars-batch-schema.js',
  './compounding-guide.js',
  './straw-guide.js',
  './pha-integration.js',
  './manifest.webmanifest',
  './data/grades/CA1180P_talc10_wax0p3.json'
];

/* Network-first for the HTML shell so users see new code on first load after a
   deploy. Cache-first for everything else (fonts, css, json, icons) so the app
   still works offline. Falling back to cache when network fails preserves PWA
   install behaviour. */
const HTML_URLS = new Set(['./', './index.html', '/', '/index.html']);

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});
self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
      /* Tell every page under our control that a new SW took over, so the
         page's update-prompt UI can decide to reload. DATA SAFETY: we only
         post a message — we do NOT clear localStorage / IndexedDB / cookies. */
      .then(()=>self.clients.matchAll({type:'window'}))
      .then(list=>list.forEach(c=>c.postMessage({type:'SW_ACTIVATED',cache:CACHE})))
  );
});
self.addEventListener('fetch', e=>{
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isHtml = req.mode === 'navigate' ||
                 (req.destination === 'document') ||
                 HTML_URLS.has(url.pathname) ||
                 HTML_URLS.has('.' + url.pathname);
  if (isHtml) {
    /* Network-first: guarantees the HTML shell is the freshest version. */
    e.respondWith(
      fetch(req).then(res=>{
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c=>c.put(req, clone)).catch(()=>{});
        }
        return res;
      }).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')))
    );
    return;
  }
  /* Cache-first for everything else (offline-friendly). */
  e.respondWith(caches.match(req).then(r=>r||fetch(req)));
});
