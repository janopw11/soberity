import { pathToFileURL } from 'node:url';

/** Read-only transport/security smoke. Does not create accounts or consume action codes. */
export async function checkStaging(address, request = fetch) {
  const base = new URL(address);
  if (
    base.protocol !== 'https:' ||
    base.username ||
    base.password ||
    base.search ||
    base.hash ||
    base.pathname !== '/'
  ) {
    throw new Error(
      'Supply an HTTPS origin without credentials, path or query.',
    );
  }

  const checks = [];
  async function get(path, options = {}) {
    const response = await request(new URL(path, base), {
      redirect: 'manual',
      signal: AbortSignal.timeout(10_000),
      ...options,
    });
    if (response.headers.has('set-cookie')) {
      throw new Error(`Unexpected cookie at ${path}.`);
    }
    return response;
  }
  function require(condition, label) {
    if (!condition) throw new Error(`FAIL: ${label}`);
    checks.push(label);
  }

  for (const path of ['/', '/sign-in', '/verify-email', '/reset-password']) {
    const response = await get(path);
    require(response.status === 200 &&
      response.headers.get('content-type')?.includes('text/html') &&
      /<html[\s>]/i.test(await response.text()), `HTML route ${path}`);
    require(/max-age=[1-9]\d*/.test(
      response.headers.get('strict-transport-security') ?? '',
    ) &&
      response.headers.get('x-content-type-options') ===
        'nosniff', `security headers ${path}`);
  }
  for (const probe of ['liveness', 'readiness']) {
    const response = await get(`/actuator/health/${probe}`);
    require(response.status === 200 &&
      (await response.json()).status === 'UP', `${probe} UP`);
  }
  for (const headers of [{}, { Authorization: 'Bearer invalid-smoke-token' }]) {
    const response = await get('/api/v1/me', { headers });
    require(response.status === 401 &&
      response.headers
        .get('content-type')
        ?.includes('application/problem+json') &&
      (await response.json()).status ===
        401, 'protected API rejects missing/invalid token');
  }
  const preflight = (origin) =>
    get('/api/v1/me', {
      method: 'OPTIONS',
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'PATCH',
        'Access-Control-Request-Headers': 'Authorization,Content-Type',
      },
    });
  const allowed = await preflight(base.origin);
  require(allowed.ok &&
    allowed.headers.get('access-control-allow-origin') ===
      base.origin, 'configured origin CORS preflight');
  const denied = await preflight('https://untrusted.invalid');
  require(!denied.headers.has(
    'access-control-allow-origin',
  ), 'untrusted origin denied');
  for (const path of ['/actuator/env', '/v3/api-docs', '/.env']) {
    require((await get(path)).status === 404, `private path hidden ${path}`);
  }
  return checks;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const checks = await checkStaging(process.argv[2]);
    console.log(`PASS: ${checks.length} staging transport/security checks.`);
  } catch {
    // Avoid leaking URLs, response bodies, headers, action codes or credentials.
    console.error(
      'Staging smoke FAILED. Check HTTPS, routes, probes, ACL and CORS.',
    );
    process.exitCode = 1;
  }
}
