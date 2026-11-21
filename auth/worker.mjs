const BLOG = 'https://blog.rom.kr';
const AUTH = 'https://blog-auth.rom.kr';
const CALLBACK = AUTH + '/auth/callback';
const FLOW = '__Host-blog-oauth';
const SESSION = '__Host-blog-admin';
const FLOW_SECONDS = 10 * 60;
const SESSION_SECONDS = 30 * 60;
const encoder = new TextEncoder();

function base64url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function decode(value) {
  return Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), ch => ch.charCodeAt(0));
}

function randomString() {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}

function cookie(headers, name, value, seconds) {
  headers.append('Set-Cookie', `${name}=${value}; Path=/; Max-Age=${seconds}; HttpOnly; Secure; SameSite=Lax`);
}

// The signed purpose separates a login transaction from an authorized session.
function signedBytes(name, payload) {
  return encoder.encode(`blog-auth.rom.kr/v1/${name}/${payload}`);
}

async function setSignedCookie(headers, key, name, data, seconds) {
  const payload = base64url(encoder.encode(JSON.stringify({ ...data, exp: Date.now() + seconds * 1000 })));
  const signature = await crypto.subtle.sign('HMAC', key, signedBytes(name, payload));
  cookie(headers, name, payload + '.' + base64url(signature), seconds);
}

async function readSignedCookie(request, key, name) {
  const item = (request.headers.get('Cookie') || '').split(';').map(part => part.trim())
    .find(part => part.startsWith(name + '='));
  if (!item || item.length > 2048) return null;
  const [payload, signature, extra] = item.slice(name.length + 1).split('.');
  if (!payload || !signature || extra !== undefined) return null;
  try {
    const signatureBytes = decode(signature);
    if (base64url(signatureBytes) !== signature) return null;
    if (!await crypto.subtle.verify('HMAC', key, signatureBytes, signedBytes(name, payload))) return null;
    const data = JSON.parse(new TextDecoder().decode(decode(payload)));
    return Number.isSafeInteger(data?.exp) && data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

function failure(headers, status, message) {
  headers.set('Content-Type', 'text/html; charset=utf-8');
  return new Response(`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>블로그 관리자 로그인</title><main><h1>블로그 관리자 로그인</h1><p>${message}</p>
<p><a href="/auth/login">다시 로그인</a> · <a href="${BLOG}/">블로그로 돌아가기</a></p></main></html>`, { headers, status });
}

function redirect(headers, url) {
  headers.set('Location', url);
  return new Response(null, { status: 302, headers });
}

async function login(headers, key, env) {
  const state = randomString();
  const verifier = randomString();
  const challenge = base64url(await crypto.subtle.digest('SHA-256', encoder.encode(verifier)));
  await setSignedCookie(headers, key, FLOW, { state, verifier }, FLOW_SECONDS);
  const url = new URL('https://github.com/login/oauth/authorize');
  url.search = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID, redirect_uri: CALLBACK, scope: '', state,
    code_challenge: challenge, code_challenge_method: 'S256',
  }).toString();
  return redirect(headers, url.href);
}

async function githubApi(path, token) {
  return fetch('https://api.github.com' + path, {
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'rom-blog-admin',
    },
    redirect: 'manual',
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });
}

async function callback(request, url, headers, key, env) {
  const flow = await readSignedCookie(request, key, FLOW);
  if (!flow || flow.state !== url.searchParams.get('state')) {
    return failure(headers, 400, '로그인 요청을 확인할 수 없습니다. 블로그에서 다시 시작해 주세요.');
  }
  cookie(headers, FLOW, '', 0);
  if (url.searchParams.get('error') === 'access_denied') {
    return failure(headers, 403, 'GitHub 로그인이 취소되었습니다.');
  }
  const code = url.searchParams.get('code');
  if (!code) return failure(headers, 400, 'GitHub에서 인증 코드를 받지 못했습니다.');

  const exchange = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET,
      redirect_uri: CALLBACK, code, code_verifier: flow.verifier,
    }),
    redirect: 'manual',
    signal: AbortSignal.timeout(10000),
  });
  if (!exchange.ok) throw new Error('Token exchange failed');
  const token = await exchange.json();
  if (token.error === 'bad_verification_code') return failure(headers, 400, '인증 코드가 만료되었습니다. 다시 로그인해 주세요.');
  if (typeof token.access_token !== 'string' || !token.access_token) throw new Error('Token unavailable');

  const [userResponse, repoResponse] = await Promise.all([
    githubApi('/user', token.access_token),
    githubApi('/repos/0x9c/0x9c.github.io', token.access_token),
  ]);
  if (!userResponse.ok || !repoResponse.ok) throw new Error('GitHub data unavailable');
  const [user, repo] = await Promise.all([userResponse.json(), repoResponse.json()]);
  if (!Number.isSafeInteger(user.id) || user.id <= 0) throw new Error('Missing GitHub identity');
  if (repo.owner?.id !== user.id && repo.permissions?.admin !== true) {
    cookie(headers, SESSION, '', 0);
    return failure(headers, 403, '이 저장소의 관리자 권한이 있는 GitHub 계정으로 로그인해 주세요.');
  }

  // GitHub's access token is used only for the permission check above.
  await setSignedCookie(headers, key, SESSION, { userId: user.id }, SESSION_SECONDS);
  return redirect(headers, BLOG + '/');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const headers = new Headers({
      'Cache-Control': 'private, no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
      Vary: 'Origin',
    });
    const api = url.pathname === '/auth/session' || url.pathname === '/auth/logout';
    if (url.origin !== AUTH) return new Response(null, { status: 404, headers });
    if (api && origin === BLOG) {
      headers.set('Access-Control-Allow-Origin', BLOG);
      headers.set('Access-Control-Allow-Credentials', 'true');
    }
    if (api && origin && origin !== BLOG) return new Response(null, { status: 403, headers });
    if (api && request.method === 'OPTIONS') {
      if (origin !== BLOG) return new Response(null, { status: 403, headers });
      headers.set('Access-Control-Allow-Methods', url.pathname === '/auth/logout' ? 'POST' : 'GET');
      headers.set('Access-Control-Allow-Headers', 'Content-Type');
      return new Response(null, { status: 204, headers });
    }
    if (url.pathname === '/auth/logout') {
      if (request.method !== 'POST') return new Response(null, { status: 405, headers });
      if (origin !== BLOG) return new Response(null, { status: 403, headers });
      cookie(headers, FLOW, '', 0);
      cookie(headers, SESSION, '', 0);
      return new Response(null, { status: 204, headers });
    }
    if (!['/auth/login', '/auth/callback', '/auth/session'].includes(url.pathname)) {
      return new Response(null, { status: 404, headers });
    }
    if (request.method !== 'GET') return new Response(null, { status: 405, headers });
    if (!env.GITHUB_CLIENT_SECRET || !env.GITHUB_CLIENT_ID) {
      return failure(headers, 503, '관리자 로그인 서비스가 준비되지 않았습니다.');
    }
    try {
      const key = await crypto.subtle.importKey('raw', encoder.encode(env.GITHUB_CLIENT_SECRET),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
      if (url.pathname === '/auth/login') return await login(headers, key, env);
      if (url.pathname === '/auth/callback') return await callback(request, url, headers, key, env);
      const session = await readSignedCookie(request, key, SESSION);
      const result = session ? { admin: true, expiresAt: session.exp } : { admin: false };
      return Response.json(result, { headers });
    } catch {
      return failure(headers, 502, '지금은 GitHub 인증을 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.');
    }
  },
};
