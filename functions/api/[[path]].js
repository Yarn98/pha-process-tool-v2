/**
 * Pages Function proxy — forwards /api/* to tars-api Worker.
 * Route: /api/<path> → https://tars-api.sorisem98.workers.dev/api/<path>
 */
const TARS_API = 'https://tars-api.sorisem98.workers.dev';

function isWriteMethod(method) {
  return method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
}

function attachWebAccessCode(headers, env, method) {
  if (!isWriteMethod(method)) return;
  if (headers.has('Authorization') || headers.has('X-TARS-Access-Code') || headers.has('X-TARS-Web-Code')) return;

  const code = env?.WEB_ACCESS_CODE || env?.TARS_WEB_ACCESS_CODE || env?.WEB_WRITE_CODE;
  if (typeof code === 'string' && code.trim()) {
    headers.set('X-TARS-Access-Code', code.trim());
  }
}

export async function onRequest(context) {
  const { request, params, env } = context;
  const path = params.path ? params.path.join('/') : '';
  const url = new URL(request.url);
  const target = `${TARS_API}/api/${path}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete('host');
  attachWebAccessCode(headers, env, request.method);

  const resp = await fetch(target, {
    method: request.method,
    headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
  });

  const respHeaders = new Headers(resp.headers);
  respHeaders.set('Access-Control-Allow-Origin', url.origin);
  respHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  respHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-TARS-Access-Code, X-TARS-Web-Code');

  return new Response(resp.body, { status: resp.status, headers: respHeaders });
}
