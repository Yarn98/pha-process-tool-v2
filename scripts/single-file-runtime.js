/* Standalone-only resource adapter. Source application logic and stored data are unchanged. */
(function () {
  'use strict';
  const payloadNode = document.getElementById('pha-single-assets');
  const payload = JSON.parse(payloadNode.textContent);
  payloadNode.remove();
  const assets = payload.assets;
  const urls = new Map();
  const base = new URL('.', document.baseURI);
  const nativeFetch = window.fetch.bind(window);
  const modulePrefix = 'pha-embedded:';
  const aliases = { three: 'vendor/three-0.185.1/build/three.module.js' };

  function keyFor(value, source = 'index.html') {
    if (value instanceof Request) value = value.url;
    if (value instanceof URL) value = value.href;
    if (typeof value !== 'string' || /^(?:blob:|data:|#)/i.test(value)) return null;
    if (Object.hasOwn(aliases, value)) return aliases[value];
    if (value.startsWith(modulePrefix)) return value.slice(modulePrefix.length);
    let key;
    try {
      if (/^[a-z][a-z\d+.-]*:/i.test(value)) {
        const url = new URL(value);
        if (url.protocol !== base.protocol || url.host !== base.host || !url.pathname.startsWith(base.pathname)) return null;
        key = decodeURIComponent(url.pathname.slice(base.pathname.length));
      } else {
        key = decodeURIComponent(new URL(value, 'https://embedded.invalid/' + source).pathname.slice(1));
      }
    } catch (_) { return null; }
    return Object.hasOwn(assets, key) ? key : null;
  }

  function assetURL(key) {
    if (!Object.hasOwn(assets, key)) throw new Error('Embedded asset is missing: ' + key);
    if (!urls.has(key)) {
      const entry = assets[key];
      const binary = atob(entry.base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      urls.set(key, URL.createObjectURL(new Blob([bytes], { type: entry.mime })));
    }
    return urls.get(key);
  }

  function resourceURL(value) {
    const key = keyFor(value);
    return key ? assetURL(key) : value;
  }

  // Static imports inside embedded modules use stable bare names, resolved before any import runs.
  const imports = {};
  for (const [key, entry] of Object.entries(assets)) if (entry.module) imports[modulePrefix + key] = assetURL(key);
  for (const [alias, key] of Object.entries(aliases)) imports[alias] = assetURL(key);
  const importMap = document.createElement('script');
  importMap.type = 'importmap';
  importMap.textContent = JSON.stringify({ imports });
  document.head.appendChild(importMap);

  const api = Object.freeze({
    sourceHash: payload.sourceHash,
    assetKeys: Object.freeze(Object.keys(assets)),
    assetURL,
    loadedKeys: () => [...urls.keys()],
    importFrom(source, specifier) {
      const key = keyFor(specifier, source);
      if (!key || !assets[key].module) return Promise.reject(new Error('Embedded module is missing: ' + specifier));
      return import(assetURL(key));
    }
  });
  Object.defineProperty(window, 'PHASingleFile', { value: api });

  // GLTFLoader creates Request objects, while the knowledge loader passes a relative string.
  window.fetch = function (input, options) {
    const method = String(options?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const key = (method === 'GET' || method === 'HEAD') && keyFor(input);
    if (!key) return nativeFetch(input, options); // Explicit remote TARS/MyAI behavior is preserved.
    const mapped = input instanceof Request ? new Request(assetURL(key), input) : assetURL(key);
    return nativeFetch(mapped, options);
  };

  // Guide templates create images at runtime. Resolve known local assets before the browser loads them.
  const resourceAttributes = new Set(['src', 'poster', 'href']);
  const nativeSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, value) {
    return nativeSetAttribute.call(this, name, resourceAttributes.has(String(name).toLowerCase()) ? resourceURL(value) : value);
  };
  for (const [prototype, property] of [[HTMLImageElement.prototype, 'src'], [HTMLSourceElement.prototype, 'src'], [HTMLVideoElement.prototype, 'poster']]) {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, property);
    if (descriptor?.set) Object.defineProperty(prototype, property, { ...descriptor, set(value) { descriptor.set.call(this, resourceURL(value)); } });
  }
  function mapHTML(markup) {
    if (typeof markup !== 'string') return markup;
    return markup.replace(/(\s(?:src|poster|href)\s*=\s*)(["'])(.*?)\2/gi, (all, prefix, quote, value) => prefix + quote + resourceURL(value) + quote);
  }
  const innerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  Object.defineProperty(Element.prototype, 'innerHTML', { ...innerHTML, set(markup) { innerHTML.set.call(this, mapHTML(markup)); } });
  const insertHTML = Element.prototype.insertAdjacentHTML;
  Element.prototype.insertAdjacentHTML = function (position, markup) { return insertHTML.call(this, position, mapHTML(markup)); };
})();
