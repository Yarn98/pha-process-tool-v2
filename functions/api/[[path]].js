/**
 * Pages Function proxy — forwards /api/* to tars-api Worker.
 * Route: /api/<path> → https://tars-api.sorisem98.workers.dev/api/<path>
 */
const TARS_API = 'https://tars-api.sorisem98.workers.dev';

export async function onRequest(context) {
  const { request, params } = context;
  const path = params.path ? params.path.join('/') : '';
  const url = new URL(request.url);
  const target = `${TARS_API}/api/${path}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete('host');

  const resp = await fetch(target, {
    method: request.method,
    headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
  });

  const respHeaders = new Headers(resp.headers);
  respHeaders.set('Access-Control-Allow-Origin', url.origin);
  respHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  respHeaders.set('Access-Control-Allow-Headers', 'Content-Type');

  return new Response(resp.body, { status: resp.status, headers: respHeaders });
}
