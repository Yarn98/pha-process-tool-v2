/* Bump this whenever index.html / tokens.css / overrides.css / precached JS changes.
   The activate handler deletes any cache whose name !== CACHE, so bumping the
   version string is how we force a full refresh of cached assets. Keep a short
   trailing token describing the change so the log is auditable. */
const CACHE = 'pha-cache-v35-crystal-measured-anchor';
/* Keep the ?v= token in sync with the asset links in index.html.
   netlify.toml serves css/js with a 1-year immutable cache, so the
   query token is what actually invalidates browser HTTP caches. */
const ASSET_V = '?v=35';
importScripts('./troubleshooting-visuals-sw.js' + ASSET_V);
const PRECACHE_URLS = [
  './',
  './index.html',
  './vendor/chart-4.4.0/chart.umd.min.js' + ASSET_V,
  './tokens.css' + ASSET_V,
  './overrides.css' + ASSET_V,
  './custom.js' + ASSET_V,
  './troubleshooting-data.js' + ASSET_V,
  './troubleshooting-visuals-data.js' + ASSET_V,
  './troubleshooting-visuals-sw.js' + ASSET_V,
  './vent-guide-data.js' + ASSET_V,
  './vent-guide.js' + ASSET_V,
  './vent-guide.css' + ASSET_V,
  './data/vent_guide.json' + ASSET_V,
  './assets/troubleshooting/vent-guide.glb' + ASSET_V,
  './assets/troubleshooting/vent-guide-without_reverse_full.webp' + ASSET_V,
  './assets/troubleshooting/vent-guide-upstream_reverse_full.webp' + ASSET_V,
  './flash-guide-data.js' + ASSET_V,
  './flash-guide.js' + ASSET_V,
  './flash-guide.css' + ASSET_V,
  './flash-mold-viewer.js' + ASSET_V,
  './assets/flash-control/mold-detail.glb' + ASSET_V,
  './assets/flash-control/normal.webp' + ASSET_V,
  './assets/flash-control/parting.webp' + ASSET_V,
  './assets/flash-control/vent.webp' + ASSET_V,
  './assets/flash-control/ejector.webp' + ASSET_V,
  './assets/flash-control/flash-comparison.png' + ASSET_V,
  './troubleshooting-visuals.js' + ASSET_V,
  './troubleshooting-viewer.js' + ASSET_V,
  './troubleshooting-visuals.css' + ASSET_V,
  ...self.PHA_TS_VISUAL_ASSETS.map(asset=>'./'+asset+ASSET_V),
  './glossary.js' + ASSET_V,
  './anomaly-codes.js' + ASSET_V,
  './tars-batch-schema.js' + ASSET_V,
  './compounding-guide.js' + ASSET_V,
  './straw-guide.js' + ASSET_V,
  './pha-integration.js' + ASSET_V,
  './process-evidence.js' + ASSET_V,
  './process-atlas.js' + ASSET_V,
  './process-atlas.css' + ASSET_V,
  './hmi-panel.js' + ASSET_V,
  './crystallization-data.js' + ASSET_V,
  './crystallization-engine.js' + ASSET_V,
  './crystallization-process.js' + ASSET_V,
  './crystallization-doe.js' + ASSET_V,
  './crystallization-panel.js' + ASSET_V,
  './crystallization-panel.css' + ASSET_V,
  './troubleshooting-tree.js' + ASSET_V,
  './grade-compare.js' + ASSET_V,
  './machine-viewer.js' + ASSET_V,
  './injection-motion.js' + ASSET_V,
  './equipment-models.js' + ASSET_V,
  './equipment-motion.js' + ASSET_V,
  './equipment-kinematics.js' + ASSET_V,
  './equipment-study.js' + ASSET_V,
  ...['injection','extrusion','sheet','castfilm','blownfilm','blowmolding','compounding','straw'].map(kind=>'./assets/equipment/unreal/'+kind+'.webp'+ASSET_V),
  ...['extrusion','compounding','sheet','castfilm','blownfilm','blowmolding','straw'].flatMap(kind=>[
    './assets/equipment/'+kind+'-motion.glb'+ASSET_V,
    './assets/equipment/'+kind+'-motion-poster.png'+ASSET_V
  ]),
  './assets/equipment/injection-motion.glb' + ASSET_V,
  './assets/equipment/injection-motion-poster.png' + ASSET_V,
  './vendor/three-0.185.1/build/three.module.js',
  './vendor/three-0.185.1/build/three.core.js',
  './vendor/three-0.185.1/examples/jsm/loaders/GLTFLoader.js',
  './vendor/three-0.185.1/examples/jsm/controls/OrbitControls.js',
  './vendor/three-0.185.1/examples/jsm/utils/BufferGeometryUtils.js',
  './vendor/three-0.185.1/examples/jsm/utils/SkeletonUtils.js',
  './assets/equipment/injection.png' + ASSET_V,
  './assets/equipment/extrusion.png' + ASSET_V,
  './assets/equipment/sheet.png' + ASSET_V,
  './assets/equipment/blownfilm.png' + ASSET_V,
  './assets/equipment/blowmolding.png' + ASSET_V,
  './assets/equipment/castfilm.png' + ASSET_V,
  './assets/equipment/compounding.png' + ASSET_V,
  './assets/equipment/straw.png' + ASSET_V,
  './assets/flash-example.png',
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
      .then(keys=>Promise.all(keys.filter(k=>k.startsWith('pha-cache-')&&k!==CACHE).map(k=>caches.delete(k))))
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
