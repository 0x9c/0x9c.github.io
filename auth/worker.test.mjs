import assert from 'node:assert/strict';
import test from 'node:test';
import worker from './worker.mjs';

const blog = 'https://blog.rom.kr';
const auth = 'https://blog-auth.rom.kr';
const env = {
  GITHUB_CLIENT_ID: 'test-client',
  GITHUB_CLIENT_SECRET: 'test-secret',
};

function request(path, { method = 'GET', cookie, origin = blog } = {}) {
  const headers = new Headers({ Origin: origin });
  if (cookie) headers.set('Cookie', cookie);
  return worker.fetch(new Request(new URL(path, auth), { method, headers }), env);
}

function cookiesFrom(response) {
  return response.headers.getSetCookie().map((value) => value.split(';', 1)[0]).join('; ');
}

async function getSession(cookie) {
  const response = await request('/auth/session', { cookie });
  assert.equal(response.status, 200);
  return response.json();
}

async function startLogin() {
  const response = await request('/auth/login');
  const redirect = new URL(response.headers.get('Location'));
  assert.equal(redirect.origin + redirect.pathname, 'https://github.com/login/oauth/authorize');
  assert.equal(redirect.searchParams.get('redirect_uri'), auth + '/auth/callback');
  assert.equal(redirect.searchParams.get('code_challenge_method'), 'S256');
  assert.ok(redirect.searchParams.get('code_challenge'));
  const state = redirect.searchParams.get('state');
  assert.ok(state);
  const cookie = cookiesFrom(response);
  assert.ok(cookie);
  return { callback: '/auth/callback?code=test-code&state=' + encodeURIComponent(state), cookie };
}

function mockGithub(t, { id = 43869400, login = '0x9c', admin = true } = {}) {
  return t.mock.method(globalThis, 'fetch', async (input) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
    if (url.href === 'https://github.com/login/oauth/access_token') {
      return Response.json({ access_token: 'github-test-token', token_type: 'bearer' });
    }
    if (url.href === 'https://api.github.com/user') return Response.json({ login, id });
    if (url.href === 'https://api.github.com/repos/0x9c/0x9c.github.io') {
      return Response.json({ owner: { id: 43869400 }, permissions: admin === null ? undefined : { admin } });
    }
    assert.fail('Unexpected GitHub request: ' + url.href);
  });
}

async function completeLogin() {
  const { callback, cookie } = await startLogin();
  return request(callback, { cookie });
}

test('the public blog can read its signed-out state without caching it', async () => {
  const response = await request('/auth/session');
  assert.equal((await response.json()).admin, false);
  assert.equal(response.headers.get('access-control-allow-origin'), blog);
  assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
  assert.match(response.headers.get('cache-control'), /no-store/i);
});

test('the GitHub administrator gets a private secure session', async (t) => {
  mockGithub(t, { id: 67890, login: 'administrator', admin: true });
  const callback = await completeLogin();
  assert.equal(callback.status, 302);
  assert.equal(callback.headers.get('location'), blog + '/');
  const cookie = cookiesFrom(callback);
  const session = await getSession(cookie);
  assert.equal(session.admin, true);
  const sessionCookie = callback.headers.getSetCookie().find((value) => value.startsWith('__Host-blog-admin='));
  assert.match(sessionCookie, /HttpOnly/i);
  assert.match(sessionCookie, /Secure/i);
  assert.match(sessionCookie, /Path=\/(?:;|$)/i);
  assert.doesNotMatch(sessionCookie, /Domain=/i);
  assert.ok(!cookie.includes('github-test-token'));
});

test('the repository owner gets a session even if permissions metadata is absent', async (t) => {
  mockGithub(t, { admin: null });
  const cookie = cookiesFrom(await completeLogin());
  assert.equal((await getSession(cookie)).admin, true);
});

test('an unprivileged account does not get a session', async (t) => {
  mockGithub(t, { id: 12345, login: 'reader', admin: false });
  const callback = await completeLogin();
  assert.equal(callback.status, 403);
  assert.equal((await getSession(cookiesFrom(callback))).admin, false);
});

test('a missing flow cookie or mismatched state fails before exchanging the code', async (t) => {
  const github = mockGithub(t);
  const { callback, cookie } = await startLogin();
  assert.equal((await request(callback)).status, 400);
  assert.equal((await request('/auth/callback?code=test-code&state=incorrect', { cookie })).status, 400);
  assert.equal(github.mock.callCount(), 0);
});

test('cancelling at GitHub leaves the visitor signed out', async (t) => {
  const github = mockGithub(t);
  const { callback, cookie } = await startLogin();
  const denied = new URL(callback, auth);
  denied.searchParams.delete('code');
  denied.searchParams.set('error', 'access_denied');
  const response = await request(denied, { cookie });
  assert.equal(response.status, 403);
  assert.equal(github.mock.callCount(), 0);
  assert.equal((await getSession(cookiesFrom(response))).admin, false);
});

test('an expired login grant no longer enables the admin button', async (t) => {
  mockGithub(t);
  const cookie = cookiesFrom(await completeLogin());
  const active = await getSession(cookie);
  assert.equal(active.admin, true);
  assert.ok(Number.isFinite(active.expiresAt) && active.expiresAt > Date.now());
  t.mock.method(Date, 'now', () => active.expiresAt + 1000);
  assert.equal((await getSession(cookie)).admin, false);
});

test('logout clears the cookie only on a request from the blog', async (t) => {
  mockGithub(t);
  const cookie = cookiesFrom(await completeLogin());
  const rejected = await request('/auth/logout', { method: 'POST', cookie, origin: 'https://other.example' });
  assert.equal(rejected.status, 403);
  assert.equal(rejected.headers.getSetCookie().length, 0);
  const loggedOut = await request('/auth/logout', { method: 'POST', cookie });
  assert.equal(loggedOut.status, 204);
  assert.ok(loggedOut.headers.getSetCookie().some((value) => value.startsWith('__Host-blog-admin=') && /max-age=0/i.test(value)));
  assert.equal((await getSession(cookiesFrom(loggedOut))).admin, false);
});

test('other origins are not allowed to read a credentialed session', async () => {
  const origin = 'https://other.example';
  const response = await request('/auth/session', { origin });
  assert.notEqual(response.headers.get('access-control-allow-origin'), origin);
  assert.notEqual(response.headers.get('access-control-allow-origin'), '*');
});
