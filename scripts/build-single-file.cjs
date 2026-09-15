#!/usr/bin/env node
'use strict';

/** Reproducible, network-free HTML packer. No bundler, server, extension or installation is required. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const DESTINATION = 'single-file/PHA-Process-Single.html';
const MANIFEST = 'single-file/manifest.json';
const MAX_BYTES = 100000000; // Stay below GitHub's 100 MiB limit, including base64 expansion.
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const order = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const files = new Map();
const assets = {};
const modules = new Set(['troubleshooting-viewer.js', 'flash-mold-viewer.js']);
const aliases = { three: 'vendor/three-0.185.1/build/three.module.js' };
const MIME = { '.glb': 'model/gltf-binary', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json', '.js': 'text/javascript', '.woff2': 'font/woff2' };
const textFile = file => /\.(?:html|css|[cm]?js|json|svg|txt|md)$/i.test(file) || path.basename(file) === 'LICENSE';
const canonical = (file, bytes) => textFile(file) ? Buffer.from(bytes.toString('utf8').replace(/\r\n?/g, '\n')) : bytes;

function read(file, role) {
  const absolute = path.resolve(ROOT, file);
  if (path.relative(ROOT, absolute).startsWith('..')) throw new Error('Asset escapes project: ' + file);
  const bytes = canonical(file, fs.readFileSync(absolute));
  files.set(file, { path: file, role, encoding: textFile(file) ? 'utf8-lf' : 'binary', bytes: bytes.length, sha256: hash(bytes) });
  return bytes;
}
function walk(folder, accept) {
  for (const entry of fs.readdirSync(path.join(ROOT, folder), { withFileTypes: true }).sort((a, b) => order(a.name, b.name))) {
    const file = folder + '/' + entry.name;
    if (entry.isDirectory()) walk(file, accept);
    else if (accept(file)) {
      const bytes = read(file, 'embedded-asset');
      assets[file] = { mime: MIME[path.extname(file)] || 'text/plain', base64: bytes.toString('base64') };
    }
  }
}
function resolveModule(file, specifier) {
  const clean = specifier.split(/[?#]/)[0];
  const key = aliases[clean] || path.posix.normalize(path.posix.join(path.posix.dirname(file), clean));
  if (!modules.has(key)) throw new Error('Unsupported module dependency: ' + file + ' -> ' + specifier);
  return 'pha-embedded:' + key;
}
function scriptCode(source, file, isModule = false) {
  // Current application module imports are explicit import/export-from declarations.
  // Fail the build if their local dependency closure changes rather than silently omit a module.
  if (isModule) source = source.replace(/^((?:import|export)\s+(?:\*[^;\r\n]*|\{[^;]*\}|[\w$]+)\s+from\s*)(['"])([^'"]+)\2/gm,
    (_, prefix, quote, specifier) => prefix + quote + resolveModule(file, specifier) + quote);
  source = source.replace(/\bimport\s*\(/g, 'window.PHASingleFile.importFrom(' + JSON.stringify(file) + ',');
  // Sourcemaps are not runtime dependencies and would otherwise refer outside the portable file.
  source = source.replace(/^\s*\/\/# sourceMappingURL=.*$/gm, '');
  return source;
}
const escapeScript = source => source.replace(/<\/script/gi, '<\\/script');

function build() {
  for (const filename of fs.readdirSync(path.join(ROOT, 'vendor/three-0.185.1/build'))) if (filename.endsWith('.js')) modules.add('vendor/three-0.185.1/build/' + filename);
  const threeAddons = ['loaders/GLTFLoader.js', 'controls/OrbitControls.js', 'utils/BufferGeometryUtils.js', 'utils/SkeletonUtils.js'];
  threeAddons.forEach(file => modules.add('vendor/three-0.185.1/examples/jsm/' + file));
  walk('assets', file => /\.(?:glb|png|webp|jpe?g|svg|ico)$/i.test(file));
  walk('icons', file => /\.(?:png|svg|ico)$/i.test(file));
  walk('data', file => file.endsWith('.json'));
  for (const file of ['vendor/three-0.185.1/LICENSE', 'vendor/chart-4.4.0/LICENSE']) assets[file] = { mime: 'text/plain', base64: read(file, 'license').toString('base64') };
  for (const file of modules) assets[file] = { mime: 'text/javascript', module: true, base64: Buffer.from(scriptCode(read(file, 'module').toString('utf8'), file, true)).toString('base64') };
  read('vendor/chart-4.4.0/provenance.json', 'provenance');
  read('vendor/three-0.185.1/provenance.json', 'provenance');
  read('scripts/build-single-file.cjs', 'generator');
  read('package.json', 'build-contract');
  const runtime = read('scripts/single-file-runtime.js', 'runtime').toString('utf8');
  new vm.Script(runtime);
  let html = read('index.html', 'entry').toString('utf8');
  let removedServiceWorkers = 0;
  let removedFontImports = 0;
  let scriptIndex = 0;

  html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi, (tag, attributes, body) => {
    if (/\btype\s*=\s*['"]importmap['"]/i.test(attributes)) return '';
    if (/navigator\.serviceWorker\.register\(['"]sw\.js['"]\)/.test(body)) { removedServiceWorkers++; return ''; }
    const src = attributes.match(/\bsrc\s*=\s*(['"])(.*?)\1/i);
    let file = 'index-inline-' + (++scriptIndex) + '.js';
    if (src) {
      if (src[2] === 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js') file = 'vendor/chart-4.4.0/chart.umd.min.js';
      else if (/^https?:/i.test(src[2])) throw new Error('Unembedded external script: ' + src[2]);
      else file = src[2].replace(/^\.\//, '').split(/[?#]/)[0];
      body = read(file, 'classic-script').toString('utf8');
    }
    const code = scriptCode(body, file);
    new vm.Script(code, { filename: file });
    return '<script data-pha-source="' + file + '">\n' + escapeScript(code) + '\n</script>';
  });
  if (removedServiceWorkers !== 1) throw new Error('Expected exactly one isolated service-worker registration block');

  html = html.replace(/<link\b[^>]*>/gi, tag => {
    const rel = tag.match(/\brel\s*=\s*(['"])(.*?)\1/i)?.[2];
    const href = tag.match(/\bhref\s*=\s*(['"])(.*?)\1/i)?.[2];
    if (rel === 'manifest') return ''; // A file:// edition installs no service worker or PWA.
    if (rel === 'stylesheet') {
      if (!href || /^https?:/i.test(href)) throw new Error('Unembedded stylesheet');
      const file = href.replace(/^\.\//, '').split(/[?#]/)[0];
      let css = read(file, 'stylesheet').toString('utf8');
      css = css.replace(/@import\s+url\(["']https:\/\/fonts\.googleapis\.com\/[^\r\n]+?\);/g, () => { removedFontImports++; return '/* Portable edition uses the existing system font fallbacks. */'; });
      if (/@import\s|url\(\s*['"]?https?:/i.test(css)) throw new Error('Unsupported external CSS dependency in ' + file);
      return '<style data-pha-source="' + file + '">\n' + css.replace(/<\/style/gi, '<\\/style') + '\n</style>';
    }
    if (href) {
      const key = href.replace(/^\.\//, '').split(/[?#]/)[0];
      if (assets[key]) return tag.replace(href, 'data:' + assets[key].mime + ';base64,' + assets[key].base64);
    }
    return tag;
  });

  const sources = [...files.values()].sort((a, b) => order(a.path, b.path));
  const sourceHash = hash(JSON.stringify(sources));
  const sortedAssets = Object.fromEntries(Object.entries(assets).sort(([a], [b]) => order(a, b)));
  const payload = JSON.stringify({ sourceHash, assets: sortedAssets }).replace(/</g, '\\u003c');
  html = html.replace(/<head\b[^>]*>/i, tag => tag + '\n<meta name="pha-distribution" content="standalone">\n<script type="application/json" id="pha-single-assets">' + payload + '</script>\n<script>\n' + escapeScript(runtime) + '\n</script>');
  const output = Buffer.from(html);
  if (output.length >= MAX_BYTES) throw new Error('Standalone HTML exceeds the 100 MB artifact budget');
  const manifest = {
    format: 1,
    artifact: DESTINATION,
    bytes: output.length,
    sha256: hash(output),
    source_sha256: sourceHash,
    hash_basis: 'SHA-256 of UTF-8 text normalized to LF; binary bytes unchanged. Artifact bytes and hash use LF.',
    embedded_assets: Object.keys(assets).length,
    embedded_glbs: Object.keys(assets).filter(file => file.endsWith('.glb')).length,
    transformations: { service_worker_blocks_removed: removedServiceWorkers, remote_font_imports_removed: removedFontImports },
    limitations: [
      'Remote TARS, MyAI provider requests and source links still require their configured network services.',
      'Existing system font fallbacks replace Google Fonts; layout is checked separately on the portable file.',
      'Browser file-origin storage is device/browser/path dependent. Export records before moving or renaming; no browser records or credentials are included.',
      'Interactive 3D requires browser WebGL. Embedded posters and guidance remain available when WebGL is unavailable.'
    ],
    sources
  };
  const manifestText = JSON.stringify(manifest, null, 2) + '\n';
  if (process.argv.includes('--check')) {
    const actual = canonical(DESTINATION, fs.readFileSync(path.join(ROOT, DESTINATION)));
    if (hash(actual) !== manifest.sha256 || canonical(MANIFEST, fs.readFileSync(path.join(ROOT, MANIFEST))).toString('utf8') !== manifestText) throw new Error('Standalone artifact is stale. Run npm run build:single after the final source changes.');
    console.log('SINGLE_FILE_CURRENT', JSON.stringify({ bytes: output.length, assets: manifest.embedded_assets, glbs: manifest.embedded_glbs, sourceHash }));
  } else {
    fs.mkdirSync(path.join(ROOT, 'single-file'), { recursive: true });
    fs.writeFileSync(path.join(ROOT, DESTINATION), output);
    fs.writeFileSync(path.join(ROOT, MANIFEST), manifestText);
    console.log('SINGLE_FILE_BUILT', JSON.stringify({ artifact: DESTINATION, bytes: output.length, assets: manifest.embedded_assets, glbs: manifest.embedded_glbs, sourceHash }));
  }
}
try { build(); } catch (error) { console.error('SINGLE_FILE_FAILED', error.message); process.exitCode = 1; }
