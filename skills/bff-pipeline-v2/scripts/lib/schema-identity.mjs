import crypto from 'node:crypto';
import path from 'node:path';
import { createRequire } from 'node:module';

import { isNetworkError, isTlsError } from './e2e-request.mjs';
import { createCheck } from './result.mjs';

function loadRuntime(bffRoot) {
  const requireFromBff = createRequire(path.join(bffRoot, 'package.json'));

  return {
    graphql: requireFromBff('graphql'),
    loadFilesSync: requireFromBff('@graphql-tools/load-files').loadFilesSync,
    mergeTypeDefs: requireFromBff('@graphql-tools/merge').mergeTypeDefs,
  };
}

function fingerprintSchema(schema, graphql) {
  const normalized = graphql.printSchema(graphql.lexicographicSortSchema(schema));
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export function resolveLocalSchemaFingerprint(bffRoot, { runtime = loadRuntime(bffRoot) } = {}) {
  const { graphql, loadFilesSync, mergeTypeDefs } = runtime;
  const documents = loadFilesSync(path.join(bffRoot, 'src/**/*.gql'));
  const schema = graphql.buildASTSchema(mergeTypeDefs(documents));

  return fingerprintSchema(schema, graphql);
}

export async function resolveRemoteSchemaFingerprint(
  { bffRoot, bffTarget, timeoutMs, headers },
  { fetchFn = fetch, runtime = loadRuntime(bffRoot) } = {}
) {
  const { graphql } = runtime;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchFn(bffTarget, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: graphql.getIntrospectionQuery() }),
      signal: controller.signal,
    });
    const text = await response.text();

    if (!response.ok) {
      return { ok: false, kind: 'http', detail: `HTTP ${response.status}` };
    }

    let body;

    try {
      body = JSON.parse(text);
    } catch {
      return { ok: false, kind: 'response', detail: 'introspection response is not JSON' };
    }

    if (body.errors?.length) {
      const detail = body.errors.map((error) => error.message ?? 'GraphQL error').join('; ');
      return { ok: false, kind: 'introspection', detail };
    }

    if (!body.data?.__schema) {
      return { ok: false, kind: 'introspection', detail: 'response has no __schema' };
    }

    const schema = graphql.buildClientSchema(body.data);
    return { ok: true, fingerprint: fingerprintSchema(schema, graphql) };
  } catch (error) {
    if (isTlsError(error)) {
      return { ok: false, kind: 'tls', detail: error.message };
    }

    if (error.name === 'AbortError') {
      return { ok: false, kind: 'timeout', detail: `timeout after ${timeoutMs}ms` };
    }

    return {
      ok: false,
      kind: isNetworkError(error) ? 'network' : 'request',
      detail: error.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

function shortFingerprint(fingerprint) {
  return String(fingerprint).slice(0, 12);
}

export async function checkBffTargetIdentity(
  args,
  {
    fetchFn = fetch,
    resolveLocalFingerprint = resolveLocalSchemaFingerprint,
    resolveRemoteFingerprint = resolveRemoteSchemaFingerprint,
  } = {}
) {
  let localFingerprint;

  try {
    localFingerprint = await resolveLocalFingerprint(args.bffRoot);
  } catch (error) {
    return createCheck(
      'bff-target-identity',
      false,
      `local BFF schema fingerprint failed: ${error.message}`
    );
  }

  const remote = await resolveRemoteFingerprint(args, { fetchFn });

  if (!remote.ok) {
    const label = {
      tls: 'TLS',
      network: 'network',
      timeout: 'timeout',
      http: 'HTTP',
      introspection: 'introspection',
      response: 'response',
      request: 'request',
    }[remote.kind] ?? 'request';

    return createCheck(
      'bff-target-identity',
      false,
      `BFF Target identity ${label} error: ${remote.detail}`,
      { blocked: true }
    );
  }

  if (remote.fingerprint !== localFingerprint) {
    return createCheck(
      'bff-target-identity',
      false,
      `BFF Target identity mismatch: live schema ${shortFingerprint(remote.fingerprint)} does not match local schema ${shortFingerprint(localFingerprint)}. Restart BFF from ${args.bffRoot}`,
      { blocked: true }
    );
  }

  return createCheck(
    'bff-target-identity',
    true,
    `schema fingerprint ${shortFingerprint(localFingerprint)}`
  );
}
