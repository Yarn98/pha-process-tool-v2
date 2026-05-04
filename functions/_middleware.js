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
  const errorBlock = error
    ? `<div class="error" role="alert">${error}</div>`
    : '<div class="error-spacer" aria-hidden="true"></div>';
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#2C5D3F" />
  <title>PHA Process Access — TARS Biopolymer Studio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..700,0..100;1,9..144,300..700,0..100&family=Newsreader:ital,opsz,wght@0,6..72,300..600;1,6..72,300..600&family=JetBrains+Mono:wght@300..700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      color-scheme: light;
      --paper:        #F5F1E8;
      --paper-2:      #EDE7D8;
      --paper-50:     #FAF7EE;
      --ink:          #1A1814;
      --ink-soft:     #3A352D;
      --muted:        #6B6256;
      --rule:         #D8D0BE;
      --rule-strong:  #B8AF99;
      --accent:       #2C5D3F;
      --err:          #8E2B2B;
      --serif-display:"Fraunces", "Noto Sans KR", Georgia, serif;
      --serif-body:   "Newsreader", "Noto Sans KR", Georgia, serif;
      --mono:         "JetBrains Mono", "SF Mono", Menlo, monospace;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      font-family: var(--serif-body);
      font-size: 16px;
      line-height: 1.55;
      color: var(--ink);
      background-color: var(--paper);
      background-image: radial-gradient(circle at 1px 1px, rgba(26,24,20,.06) 1px, transparent 1.4px);
      background-size: 24px 24px;
      display: grid;
      place-items: center;
      padding: 24px;
    }
    .folio {
      width: min(520px, 100%);
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-family: var(--mono);
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .folio span { display: inline-block; }
    .folio .num { color: var(--ink-soft); }
    .card {
      width: min(520px, 100%);
      background: var(--paper-50);
      border: 1px solid var(--rule-strong);
      border-radius: 2px;
      padding: 40px 36px 32px;
    }
    .kicker {
      font-family: var(--mono);
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--muted);
      margin: 0 0 14px;
    }
    h1 {
      margin: 0 0 12px;
      font-family: var(--serif-display);
      font-weight: 400;
      font-size: 34px;
      letter-spacing: -0.01em;
      line-height: 1.1;
      font-variation-settings: "opsz" 48, "SOFT" 40;
    }
    h1 em {
      color: var(--accent);
      font-style: italic;
      font-weight: 500;
      font-variation-settings: "opsz" 48, "SOFT" 90;
    }
    .lede {
      margin: 0 0 24px;
      color: var(--ink-soft);
      font-size: 15px;
      max-width: 62ch;
    }
    hr.rule {
      border: 0;
      border-top: 1px solid var(--rule);
      margin: 20px 0;
    }
    form { margin: 0; }
    label.field {
      display: block;
      font-family: var(--mono);
      font-size: 10px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 8px;
    }
    input[type="password"] {
      width: 100%;
      padding: 14px 16px;
      border: 1px solid var(--rule-strong);
      border-radius: 2px;
      font-size: 18px;
      letter-spacing: 0.24em;
      text-align: center;
      font-family: var(--mono);
      background: var(--paper);
      color: var(--ink);
      outline: none;
      transition: border-color 160ms ease, box-shadow 160ms ease;
    }
    input[type="password"]:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 2px rgba(44,93,63,0.18);
    }
    button {
      width: 100%;
      margin-top: 14px;
      padding: 14px 16px;
      border: 0;
      border-radius: 2px;
      background: var(--ink);
      color: var(--paper);
      font-family: var(--mono);
      font-size: 12px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 160ms ease;
    }
    button:hover,
    button:focus-visible {
      background: var(--accent);
      outline: none;
    }
    .error {
      margin-top: 14px;
      color: var(--err);
      font-size: 13px;
      font-weight: 500;
      font-family: var(--mono);
      letter-spacing: 0.06em;
    }
    .error-spacer {
      min-height: 20px;
      margin-top: 14px;
    }
    .note {
      margin-top: 18px;
      font-family: var(--mono);
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .colophon {
      width: min(520px, 100%);
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      font-family: var(--mono);
      font-size: 10px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--muted);
    }
    html[lang="ko"] body {
      font-feature-settings: "tnum";
    }
    html[lang="ko"] .lede,
    html[lang="ko"] .kicker,
    html[lang="ko"] .note {
      letter-spacing: 0.04em;
    }
    @media (max-width: 420px) {
      .card { padding: 32px 24px 28px; }
      h1 { font-size: 28px; }
    }
  </style>
</head>
<body>
  <div class="folio" aria-hidden="true">
    <span>TARS Biopolymer Studio</span>
    <span class="num">PHA ·01</span>
  </div>
  <main class="card" aria-labelledby="gateTitle">
    <p class="kicker">Access gate · 접근 인증</p>
    <h1 id="gateTitle">PHA Process, <em>비밀번호</em>를 입력하세요</h1>
    <p class="lede">이 도구는 승인된 엔지니어용입니다. 현장에서 사용 중인 접근 비밀번호를 입력해 세션을 시작해 주세요.</p>
    <hr class="rule" />
    <form method="post" action="/__auth" autocomplete="off">
      <input type="hidden" name="returnTo" value="${safeReturnTo}" />
      <label class="field" for="password">PASSWORD · 비밀번호</label>
      <input id="password" type="password" name="password" inputmode="numeric" autocomplete="current-password" placeholder="••••" autofocus />
      <button type="submit">열기 · Unlock</button>
    </form>
    ${errorBlock}
    <p class="note">Session 12h · cookie-based</p>
  </main>
  <div class="colophon" aria-hidden="true">
    <span>pha-process.tarspolymer.com</span>
    <span>v2</span>
  </div>
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
