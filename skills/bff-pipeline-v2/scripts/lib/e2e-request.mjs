import { createCheck } from './result.mjs';

const READONLY_MAX_RETRIES = 2;
const RETRY_DELAYS_MS = [500, 1000];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getValueAtPath(value, path) {
  if (!path) {
    return value;
  }

  const segments = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
  let current = value;

  for (const segment of segments) {
    if (current == null) {
      return undefined;
    }

    current = current[segment];
  }

  return current;
}

export function runAssertion(assertion, body, index) {
  const id = assertion.id ?? `assertion-${index + 1}`;
  const actual = getValueAtPath(body, assertion.path);

  if (assertion.exists) {
    if (actual === undefined || actual === null) {
      return createCheck(id, false, `missing path: ${assertion.path}`);
    }
  }

  if (assertion.notEmpty) {
    if (Array.isArray(actual) && actual.length === 0) {
      return createCheck(id, false, `empty array at ${assertion.path}`);
    }

    if (typeof actual === 'string' && actual.length === 0) {
      return createCheck(id, false, `empty string at ${assertion.path}`);
    }
  }

  if (Object.hasOwn(assertion, 'equals')) {
    const expected = JSON.stringify(assertion.equals);
    const received = JSON.stringify(actual);

    if (expected !== received) {
      return createCheck(id, false, `${assertion.path}: expected ${expected}, got ${received}`);
    }
  }

  if (assertion.type) {
    const actualType = Array.isArray(actual) ? 'array' : typeof actual;

    if (actualType !== assertion.type) {
      return createCheck(id, false, `${assertion.path}: expected type ${assertion.type}, got ${actualType}`);
    }
  }

  return createCheck(id, true, assertion.path);
}

export function runAssertions(body, assertions = []) {
  return assertions.map((assertion, index) => runAssertion(assertion, body, index));
}

export function hasGraphqlErrors(body) {
  if (!body || typeof body !== 'object') {
    return false;
  }

  if (!Array.isArray(body.errors)) {
    return false;
  }

  return body.errors.length > 0;
}

function collectNestedApiErrors(error) {
  const seen = new Set();
  const nested = [];

  for (const bucket of [error?.extensions?.errors, error?.errors]) {
    if (!Array.isArray(bucket)) {
      continue;
    }

    for (const item of bucket) {
      const key = JSON.stringify(item);

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      nested.push(item);
    }
  }

  return nested;
}

export function formatGraphqlError(error) {
  const nested = collectNestedApiErrors(error)
    .map((item) =>
      [item.code, item.errorCode, item.message].filter((part) => part != null && String(part).length > 0).join(' ')
    )
    .filter(Boolean);

  if (nested.length > 0) {
    return error?.message ? `${error.message}: ${nested.join('; ')}` : nested.join('; ');
  }

  return error?.message ?? 'GraphQL error';
}

export function formatGraphqlErrors(body) {
  return (body?.errors ?? []).map((error) => formatGraphqlError(error)).join('; ');
}

export const BFF_PING_QUERY = '{ __typename }';
export const REALT_AUTH_TOKEN_HEADER = 'x-realt-auth-token';

export function buildGraphqlHeaders(env = process.env) {
  const headers = { 'Content-Type': 'application/json' };
  const token = env.E2E_AUTH_TOKEN;

  if (token) {
    headers[REALT_AUTH_TOKEN_HEADER] = token;
  }

  return headers;
}

export function isTlsError(error) {
  const code = String(error?.code ?? error?.cause?.code ?? '');
  const message = String(error?.message ?? error?.cause?.message ?? error ?? '');

  return /UNABLE_TO_VERIFY|CERT_|ERR_TLS|self[- ]signed|certificate/i.test(`${code} ${message}`);
}

export async function pingGraphql({ url, timeoutMs, headers }, { fetchFn = fetch } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchFn(url, {
      method: 'POST',
      headers: headers ?? buildGraphqlHeaders(),
      body: JSON.stringify({ query: BFF_PING_QUERY }),
      signal: controller.signal,
    });

    const text = await response.text();

    if (!response.ok) {
      return { ok: false, status: response.status, detail: `HTTP ${response.status}` };
    }

    JSON.parse(text);

    return { ok: true, status: response.status };
  } catch (error) {
    if (isTlsError(error)) {
      return { ok: false, tlsError: true, blocked: true, detail: error.message };
    }

    return {
      ok: false,
      networkError: error.name === 'AbortError' || isNetworkError(error),
      timedOut: error.name === 'AbortError',
      detail: error.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

export function isNetworkError(error) {
  const code = error?.code ?? error?.cause?.code;
  const message = String(error?.message ?? error ?? '');

  if (code && ['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'ETIMEDOUT', 'ECONNRESET'].includes(code)) {
    return true;
  }

  return /fetch failed|network|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(message);
}

export function buildGraphqlPayload(manifest) {
  const payload = {
    query: manifest.e2eQuery,
  };

  if (manifest.e2eVariables != null) {
    payload.variables = manifest.e2eVariables;
  }

  return payload;
}

export function resolveRetryPolicy(manifest) {
  if (manifest.kind === 'query') {
    return { maxRetries: READONLY_MAX_RETRIES };
  }

  if (manifest.idempotencyKey) {
    return { maxRetries: READONLY_MAX_RETRIES };
  }

  return { maxRetries: 0 };
}

export async function executeGraphqlRequest(
  { url, manifest, timeoutMs, headers },
  { fetchFn = fetch, attempt = 0, maxRetries = 0 } = {}
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const requestHeaders = headers ?? buildGraphqlHeaders();

  try {
    const response = await fetchFn(url, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(buildGraphqlPayload(manifest)),
      signal: controller.signal,
    });

    const text = await response.text();

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        text,
        networkError: false,
      };
    }

    let body;

    try {
      body = JSON.parse(text);
    } catch {
      return {
        ok: false,
        status: response.status,
        text,
        invalidJson: true,
        networkError: false,
      };
    }

    return {
      ok: true,
      status: response.status,
      body,
      text,
      networkError: false,
    };
  } catch (error) {
    const blocked = error.name === 'AbortError' || isNetworkError(error);

    if (blocked && attempt < maxRetries) {
      await sleep(RETRY_DELAYS_MS[attempt] ?? RETRY_DELAYS_MS.at(-1));
      return executeGraphqlRequest({ url, manifest, timeoutMs, headers: requestHeaders }, {
        fetchFn,
        attempt: attempt + 1,
        maxRetries,
      });
    }

    return {
      ok: false,
      networkError: blocked,
      timedOut: error.name === 'AbortError',
      tlsError: isTlsError(error),
      detail: error.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

export function evaluateGraphqlResponse(result, manifest) {
  const checks = [];

  if (result.networkError || result.timedOut || result.tlsError) {
    checks.push(
      createCheck(
        result.timedOut ? 'e2e-timeout' : result.tlsError ? 'e2e-tls' : 'e2e-network',
        false,
        result.detail ?? 'network unavailable',
        { blocked: true }
      )
    );
    return checks;
  }

  checks.push(
    createCheck('http-status', result.status >= 200 && result.status < 300, `HTTP ${result.status ?? 'unknown'}`)
  );

  if (!checks.at(-1).passed) {
    return checks;
  }

  if (result.invalidJson) {
    checks.push(createCheck('json-parse', false, 'response is not valid JSON'));
    return checks;
  }

  checks.push(createCheck('json-parse', true, 'valid JSON'));

  if (hasGraphqlErrors(result.body)) {
    checks.push(createCheck('graphql-errors', false, formatGraphqlErrors(result.body)));
    return checks;
  }

  checks.push(createCheck('graphql-errors', true, 'no GraphQL errors'));
  checks.push(...runAssertions(result.body, manifest.assertions ?? []));

  return checks;
}
