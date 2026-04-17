const PASSWORD = '314';
const COOKIE_NAME = 'pha_process_auth';
const COOKIE_VALUE = 'v1_pha_process_access_granted';
const COOKIE_PATH = '/';

function hasAccessCookie(request) {
  const cookie = request.headers.get('cookie') || '';
  return cookie.includes(`${COOKIE_NAME}=${COOKIE_VALUE}`);
}

function renderLoginPage(returnTo = '/', error = '') {
  const safeReturnTo = String(returnTo || '/').replace(/"/g, '&quot;');
  const errorHtml = error
    ? `<div style="margin-top:12px;color:#b91c1c;font-size:13px;font-weight:700;">${error}</div>`
    : '<div style="min-height:20px;margin-top:12px;"></div>';
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PHA Process Access</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif;
      display: grid;
      place-items: center;
      padding: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #111827;
    }
    .card {
      width: min(420px, 100%);
      background: rgba(255,255,255,0.98);
      border: 1px solid rgba(255,255,255,0.7);
      border-radius: 20px;
      box-shadow: 0 24px 60px rgba(15,23,42,0.28);
      padding: 28px;
    }
    h1 { margin: 0 0 10px; font-size: 28px; }
    p { margin: 0 0 16px; color: #4b5563; line-height: 1.6; }
    input {
      width: 100%;
      padding: 14px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      font-size: 18px;
      letter-spacing: .18em;
      text-align: center;
    }
    input:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 4px rgba(37,99,235,.14);
    }
    button {
      width: 100%;
      margin-top: 12px;
      padding: 14px 16px;
      border: 0;
      border-radius: 10px;
      background: #2563eb;
      color: #fff;
      font-weight: 800;
      cursor: pointer;
    }
    .note { margin-top: 10px; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <main class="card">
    <h1>PHA Process Access</h1>
    <p>이 도구는 비밀번호를 입력해야 열립니다.</p>
    <form method="post" action="/__auth">
      <input type="hidden" name="returnTo" value="${safeReturnTo}" />
      <input type="password" name="password" inputmode="numeric" autocomplete="current-password" placeholder="비밀번호 입력" autofocus />
      <button type="submit">열기</button>
    </form>
    ${errorHtml}
    <div class="note">현재 설정된 접근 비밀번호를 입력하세요.</div>
  </main>
</body>
</html>`;
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  if (url.pathname === '/__auth' && request.method === 'POST') {
    const form = await request.formData();
    const password = String(form.get('password') || '').trim();
    const returnTo = String(form.get('returnTo') || '/');

    if (password === PASSWORD) {
      const headers = new Headers({
        Location: returnTo.startsWith('/') ? returnTo : '/',
        'Cache-Control': 'no-store',
      });
      headers.append(
        'Set-Cookie',
        `${COOKIE_NAME}=${COOKIE_VALUE}; Path=${COOKIE_PATH}; SameSite=Lax; Secure; Max-Age=43200`
      );
      return new Response(null, { status: 302, headers });
    }

    return new Response(renderLoginPage(returnTo, '비밀번호가 맞지 않습니다.'), {
      status: 401,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  if (url.pathname === '/__logout') {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/',
        'Set-Cookie': `${COOKIE_NAME}=; Path=${COOKIE_PATH}; SameSite=Lax; Secure; Max-Age=0`,
        'Cache-Control': 'no-store',
      },
    });
  }

  if (hasAccessCookie(request)) {
    return next();
  }

  const accept = request.headers.get('accept') || '';
  if (accept.includes('text/html')) {
    return new Response(renderLoginPage(url.pathname || '/'), {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
