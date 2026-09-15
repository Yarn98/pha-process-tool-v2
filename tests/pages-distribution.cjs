'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const { createRequire } = require('node:module');
const { test } = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const LIMIT = 25 * 1024 * 1024;
const read = file => fs.readFileSync(path.join(ROOT, file));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const posix = file => file.split(path.sep).join('/');
function filesUnder(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    assert.equal(entry.isSymbolicLink(), false, 'Distribution must not follow symlinks');
    return entry.isDirectory() ? filesUnder(file) : [file];
  });
}
function localFile(url, importer = 'index.html', aliases = {}) {
  if (Object.hasOwn(aliases, url)) { url = aliases[url]; importer = 'index.html'; }
  assert.doesNotMatch(url, /^(?:[a-z][a-z\d+.-]*:|\/\/)/i, 'Expected a bundled local dependency');
  const name = decodeURIComponent(url.split(/[?#]/)[0]);
  const resolved = path.posix.normalize(name.startsWith('/') ? name.slice(1) : path.posix.join(path.posix.dirname(importer), name));
  assert.ok(resolved !== '..' && !resolved.startsWith('../'), 'Dependency escapes deployment root');
  return resolved === '.' || resolved === './' ? 'index.html' : resolved;
}
function assertSourceMatch(file) {
  const source = read(file), target = fs.readFileSync(path.join(DIST, file));
  assert.equal(digest(target), digest(source), 'Missing or stale deployed dependency: ' + file);
}

test('Cloudflare publishes the built dist directory and leaves Pages Functions at project root', () => {
  const config = read('wrangler.toml').toString('utf8');
  const output = config.match(/^pages_build_output_dir\s*=\s*['"]([^'"]+)['"]/m)?.[1];
  assert.equal(output && path.resolve(ROOT, output), DIST, 'Publishing project root includes the oversized portable HTML');
  for (const file of ['functions/_middleware.js', 'functions/api/[[path]].js']) {
    assert.ok(fs.statSync(path.join(ROOT, file)).isFile());
    assert.equal(fs.existsSync(path.join(DIST, file)), false, 'Functions must not be uploaded as static source');
  }
  assertSourceMatch('_headers');
  assert.match(read('_headers').toString('utf8'), /Content-Security-Policy:/);
});

test('Every deployable file is within 25 MiB and no local-only files leak into dist', () => {
  const files = filesUnder(DIST);
  assert.ok(files.length > 0);
  for (const file of files) {
    const relative = posix(path.relative(DIST, file));
    assert.ok(fs.statSync(file).size <= LIMIT, 'Cloudflare Pages rejects files over 25 MiB: ' + relative);
    assert.doesNotMatch(relative, /(?:^|\/)(?:single-file|art|output|docs|tests|scripts|functions|node_modules|\.git|\.codex|secrets)(?:\/|$)/i);
    assert.doesNotMatch(relative, /(?:^|\/)(?:\.env(?:\..*)?|credentials(?:\..*)?|id_rsa|_middleware\.js|_worker\.js|wrangler\.toml)$/i);
    assert.doesNotMatch(relative, /\.(?:blend\d?|fbx|uasset|umap|pdf|pem|key)$/i);
    assertSourceMatch(relative);
  }
  assert.equal(fs.existsSync(path.join(DIST, 'PHA-Process-Single.html')), false);
});

test('HTML, service-worker precache, manifest icons and module imports have complete source-matching assets', () => {
  const required = new Set(['index.html', 'sw.js', '_headers', 'data/troubleshooting_kb.json', 'data/material_cards.json']);
  const html = read('index.html').toString('utf8');
  const aliases = JSON.parse(html.match(/<script\s+type=['"]importmap['"]>([\s\S]*?)<\/script>/i)[1]).imports;
  for (const match of html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)\s*=\s*['"]([^'"]+)['"][^>]*>/gi)) required.add(localFile(match[1]));
  const scope = { self: { addEventListener() {} } };
  const context = vm.createContext(scope);
  scope.importScripts = url => {
    const file = localFile(url, 'sw.js');
    required.add(file);
    vm.runInContext(fs.readFileSync(path.join(DIST, file), 'utf8'), context, { filename: file, timeout: 1000 });
  };
  vm.runInContext(fs.readFileSync(path.join(DIST, 'sw.js'), 'utf8') + '\nglobalThis.precache = PRECACHE_URLS;', context, { timeout: 1000 });
  for (const url of scope.precache) required.add(localFile(url));
  for (const icon of JSON.parse(read('manifest.webmanifest')).icons) required.add(localFile(icon.src));
  // Includes the new guides explicitly even if a future edit accidentally drops their precache entries.
  for (const file of ['flash-guide.js', 'flash-guide-data.js', 'flash-guide.css', 'flash-mold-viewer.js', 'assets/flash-control/mold-detail.glb', 'assets/flash-control/flash-comparison.png', 'vent-guide.js', 'vent-guide-data.js', 'vent-guide.css', 'data/vent_guide.json', 'assets/troubleshooting/vent-guide.glb']) required.add(file);
  for (const state of ['normal', 'parting', 'vent', 'ejector']) required.add('assets/flash-control/' + state + '.webp');
  for (const file of filesUnder(DIST).filter(file => file.endsWith('.js'))) {
    const importer = posix(path.relative(DIST, file)), code = fs.readFileSync(file, 'utf8');
    for (const match of code.matchAll(/^(?:import|export)\s+(?:\*[^;\r\n]*|\{[^;]*\}|[\w$]+)\s+from\s*['"]([^'"]+)['"]/gm)) required.add(localFile(match[1], importer, aliases));
    for (const match of code.matchAll(/\bimport\(\s*['"]([^'"]+\.js(?:\?[^'"]*)?|three)['"]/g)) required.add(localFile(match[1], importer, aliases));
  }
  for (const file of required) assertSourceMatch(file);
  console.log('PAGES_ASSET_CLOSURE_OK', required.size, 'runtime resources');
});

test('The real build accepts a 25 MiB fixture and rejects one byte more without changing deployed files', () => {
  const buildPath = path.join(ROOT, 'build.js'), code = fs.readFileSync(buildPath, 'utf8');
  const requireFromBuild = createRequire(buildPath);
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'pha-pages-distribution-'));
  const fixtureAsset = path.join(temporary, 'dist/assets/flash-control/mold-detail.glb');
  const deployedBefore = digest(fs.readFileSync(path.join(DIST, 'assets/flash-control/mold-detail.glb')));
  function run(size) {
    let exit, inspected = false;
    const messages = [];
    const fixtureFS = { ...fs, statSync(file, options) {
      const stat = fs.statSync(file, options);
      if (path.resolve(file) !== fixtureAsset) return stat;
      inspected = true;
      return Object.assign(Object.create(Object.getPrototypeOf(stat)), stat, { size });
    } };
    vm.runInNewContext(code, {
      __dirname: temporary,
      require: name => name === 'fs' || name === 'node:fs' ? fixtureFS : requireFromBuild(name),
      process: { exit(code) { exit = code; } },
      console: { log() {}, warn(message) { messages.push(message); }, error(...parts) { messages.push(parts.join(' ')); } }
    }, { filename: buildPath, timeout: 30000 });
    assert.equal(inspected, true, 'The real build must inspect the copied fixture asset');
    return { exit, messages };
  }
  try {
    assert.equal(run(LIMIT).exit, 0, 'The documented maximum is allowed');
    const oversized = run(LIMIT + 1);
    assert.equal(oversized.exit, 1, 'Build must fail before uploading an oversized asset');
    assert.ok(oversized.messages.some(message => /mold-detail\.glb/.test(message)), 'Failure identifies the oversized asset');
    assert.equal(digest(fs.readFileSync(path.join(DIST, 'assets/flash-control/mold-detail.glb'))), deployedBefore);
  } finally {
    const relative = path.relative(path.resolve(os.tmpdir()), path.resolve(temporary));
    assert.ok(relative.startsWith('pha-pages-distribution-') && !relative.startsWith('..'));
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
