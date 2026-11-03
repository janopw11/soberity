import assert from 'node:assert/strict';
import test from 'node:test';
import { checkStaging } from './check-staging.mjs';

function healthyRequest(url, options) {
  const headers = {
    'strict-transport-security': 'max-age=31536000',
    'x-content-type-options': 'nosniff',
  };
  if (options.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers:
        options.headers.Origin === 'https://staging.example.org'
          ? { 'access-control-allow-origin': options.headers.Origin }
          : {},
    });
  }
  if (url.pathname.startsWith('/actuator/health/')) {
    return Response.json({ status: 'UP' });
  }
  if (url.pathname === '/api/v1/me') {
    return Response.json(
      { status: 401 },
      {
        status: 401,
        headers: { 'content-type': 'application/problem+json' },
      },
    );
  }
  if (['/actuator/env', '/v3/api-docs', '/.env'].includes(url.pathname)) {
    return new Response(null, { status: 404 });
  }
  return new Response('<html><body>Staging</body></html>', {
    headers: { ...headers, 'content-type': 'text/html' },
  });
}

test('healthy origin passes read-only smoke without consuming action codes', async () => {
  const requests = [];
  const checks = await checkStaging(
    'https://staging.example.org',
    (url, options) => {
      requests.push({ url, options });
      return healthyRequest(url, options);
    },
  );
  assert.equal(checks.length, 17);
  assert.ok(
    requests.every(
      ({ url, options }) =>
        !url.search &&
        (!options.method || options.method === 'OPTIONS') &&
        options.redirect === 'manual',
    ),
  );
});

test('rejects unsafe addresses before any network request', async () => {
  for (const address of [
    'http://staging.example.org',
    'https://user:password@staging.example.org',
    'https://staging.example.org/reset-password?oobCode=secret',
    'https://staging.example.org/#fragment',
  ]) {
    await assert.rejects(
      checkStaging(address, () => assert.fail('Unexpected request')),
    );
  }
});

test('fails on unavailable backend, login redirects, cookies or exposed internals', async () => {
  for (const broken of [
    (url, options) =>
      url.pathname.endsWith('/readiness')
        ? Response.json({ status: 'DOWN' }, { status: 503 })
        : healthyRequest(url, options),
    (url, options) =>
      url.pathname === '/sign-in'
        ? new Response(null, { status: 302, headers: { location: '/' } })
        : healthyRequest(url, options),
    (url, options) =>
      url.pathname === '/'
        ? new Response('<html>', {
            headers: { 'set-cookie': 'session=synthetic' },
          })
        : healthyRequest(url, options),
    (url, options) =>
      url.pathname === '/actuator/env'
        ? Response.json({})
        : healthyRequest(url, options),
    (url, options) =>
      url.pathname === '/api/v1/me' && !options.method
        ? Response.json({})
        : healthyRequest(url, options),
    (url, options) =>
      options.headers?.Origin === 'https://untrusted.invalid'
        ? new Response(null, {
            status: 204,
            headers: { 'access-control-allow-origin': '*' },
          })
        : healthyRequest(url, options),
  ]) {
    await assert.rejects(checkStaging('https://staging.example.org', broken));
  }
});
