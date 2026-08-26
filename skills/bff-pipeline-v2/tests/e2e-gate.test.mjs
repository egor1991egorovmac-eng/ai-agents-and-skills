import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { startBff } from '../scripts/lib/bff-lifecycle.mjs';
import { resolveDataSourceKey } from '../scripts/lib/datasource-path.mjs';
import { executeOperationAgainstSchema } from '../scripts/lib/e2e-execute-operation.mjs';
import { runE2eGate, buildE2eCompactMeta } from '../scripts/lib/e2e-gate.mjs';
import {
  evaluateGraphqlResponse,
  executeGraphqlRequest,
  formatGraphqlErrors,
  getValueAtPath,
  hasGraphqlErrors,
  resolveRetryPolicy,
  runAssertion,
  runAssertions,
} from '../scripts/lib/e2e-request.mjs';
import { STATUS } from '../scripts/lib/exit-codes.mjs';
import { applyEnvFile, loadEnvNextToManifest, parseEnvFile } from '../scripts/lib/load-env.mjs';
import { loadManifest, validateManifestForStage } from '../scripts/lib/manifest.mjs';
import { aggregateStatus, buildResult } from '../scripts/lib/result.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures/e2e-gate');
const TEST_BFF_TARGET = 'http://127.0.0.1:4000/graphql';

function readFixture(relativePath) {
  return fs.readFileSync(path.join(fixturesDir, relativePath), 'utf8');
}

function readJsonFixture(relativePath) {
  return JSON.parse(readFixture(relativePath));
}

const queryManifest = readJsonFixture('manifest-query.json');
const mutationManifest = readJsonFixture('manifest-mutation.json');
const idempotentMutationManifest = readJsonFixture('manifest-mutation-idempotent.json');
const objectsSetCalledManifest = readJsonFixture('manifest-objects-set-called-by-realt-manager.json');
const happyResponse = readJsonFixture('responses/happy.json');
const partialErrorsResponse = readJsonFixture('responses/partial-errors.json');
const unauthorizedResponse = readJsonFixture('responses/unauthorized.json');
const objectsSetCalledResponse = readJsonFixture('responses/objects-set-called-by-realt-manager.json');

function testConfig(bffRoot) {
  process.env.BFF_PIPELINE_BFF_ROOT = bffRoot;
  process.env.BFF_PIPELINE_CLIENT_ROOT = bffRoot;
  process.env.BFF_PIPELINE_BFF_TARGET = TEST_BFF_TARGET;

  return {
    projects: { bffAdmin: bffRoot, bffMls: bffRoot },
    timeouts: { default: 1000, bffDev: 500, e2e: 500 },
    runsDir: fs.mkdtempSync(path.join(os.tmpdir(), 'bff-runs-')),
  };
}

function mockReadyLifecycle(url = 'http://127.0.0.1:4000/') {
  let stopped = false;

  return {
    ready: true,
    url: `${url}graphql`,
    stop: () => {
      stopped = true;
    },
    get stopped() {
      return stopped;
    },
  };
}

function jsonFetch(body, { status = 200, text } = {}) {
  return async () => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => text ?? JSON.stringify(body),
  });
}

async function passIdentityCheck() {
  return { id: 'bff-target-identity', passed: true, detail: 'schema fingerprint test' };
}

test('validateManifestForStage requires stage 4 operation fields but not BFF Target', () => {
  assert.throws(
    () => validateManifestForStage({ ...queryManifest, assertions: undefined }, 4),
    /assertions/
  );
  assert.throws(
    () => validateManifestForStage({ ...queryManifest, e2eQuery: undefined }, 4),
    /e2eQuery/
  );
  assert.equal(Object.hasOwn(queryManifest, 'schemaUrl'), false);
  assert.doesNotThrow(() => validateManifestForStage(queryManifest, 4));
});

test('getValueAtPath resolves nested paths with indexes', () => {
  assert.equal(getValueAtPath(happyResponse, 'data.demoListing.results[0].uuid'), '11111111-1111-1111-1111-111111111111');
});

test('hasGraphqlErrors detects non-empty errors array', () => {
  assert.equal(hasGraphqlErrors(partialErrorsResponse), true);
  assert.equal(hasGraphqlErrors(happyResponse), false);
});

test('runAssertions PASS for happy response', () => {
  const checks = runAssertions(happyResponse, queryManifest.assertions);

  assert.ok(checks.every((check) => check.passed));
});

test('runAssertion FAIL for wrong type', () => {
  const check = runAssertion(
    { id: 'total-count', path: 'data.demoListing.pagination.totalCount', type: 'string' },
    happyResponse,
    0
  );

  assert.equal(check.passed, false);
});

test('evaluateGraphqlResponse PASS for happy path', () => {
  const checks = evaluateGraphqlResponse(
    { ok: true, status: 200, body: happyResponse },
    queryManifest
  );

  assert.equal(aggregateStatus(checks), STATUS.PASS);
});

test('evaluateGraphqlResponse FAIL for partial data with GraphQL errors', () => {
  const checks = evaluateGraphqlResponse(
    { ok: true, status: 200, body: partialErrorsResponse },
    queryManifest
  );

  assert.equal(aggregateStatus(checks), STATUS.FAIL);
  assert.ok(checks.some((check) => check.id === 'graphql-errors' && !check.passed));
});

test('formatGraphqlErrors includes nested microservice error from response', () => {
  const detail = formatGraphqlErrors(unauthorizedResponse);

  assert.match(detail, /401/);
  assert.match(detail, /common.unauthorized/);
  assert.match(detail, /Пользователь не авторизован/);
});

test('evaluateGraphqlResponse FAIL detail includes nested unauthorized error', () => {
  const checks = evaluateGraphqlResponse(
    { ok: true, status: 200, body: unauthorizedResponse },
    queryManifest
  );
  const graphqlCheck = checks.find((check) => check.id === 'graphql-errors');

  assert.equal(aggregateStatus(checks), STATUS.FAIL);
  assert.match(graphqlCheck.detail, /401/);
  assert.match(graphqlCheck.detail, /Пользователь не авторизован/);
});

test('evaluateGraphqlResponse FAIL for invalid JSON body', () => {
  const checks = evaluateGraphqlResponse(
    { ok: true, status: 200, invalidJson: true, text: readFixture('responses/invalid-json.txt') },
    queryManifest
  );

  assert.equal(aggregateStatus(checks), STATUS.FAIL);
  assert.ok(checks.some((check) => check.id === 'json-parse' && !check.passed));
});

test('evaluateGraphqlResponse BLOCKED for network failure', () => {
  const checks = evaluateGraphqlResponse(
    { ok: false, networkError: true, detail: 'fetch failed: ECONNREFUSED' },
    queryManifest
  );

  assert.equal(aggregateStatus(checks), STATUS.BLOCKED);
});

test('resolveRetryPolicy allows retries for query and idempotent mutation only', () => {
  assert.equal(resolveRetryPolicy(queryManifest).maxRetries, 2);
  assert.equal(resolveRetryPolicy(mutationManifest).maxRetries, 0);
  assert.equal(resolveRetryPolicy(idempotentMutationManifest).maxRetries, 2);
});

test('executeGraphqlRequest retries read-only requests on network failure', async () => {
  let attempts = 0;

  const result = await executeGraphqlRequest(
    { url: 'http://127.0.0.1:4000/graphql', manifest: queryManifest, timeoutMs: 200 },
    {
      maxRetries: 2,
      fetchFn: async () => {
        attempts += 1;

        if (attempts < 3) {
          throw Object.assign(new Error('fetch failed'), { code: 'ECONNREFUSED' });
        }

        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify(happyResponse),
        };
      },
    }
  );

  assert.equal(attempts, 3);
  assert.equal(result.ok, true);
});

test('executeGraphqlRequest does not retry mutation without idempotency key', async () => {
  let attempts = 0;

  const result = await executeGraphqlRequest(
    { url: 'http://127.0.0.1:4000/graphql', manifest: mutationManifest, timeoutMs: 200 },
    {
      maxRetries: 0,
      fetchFn: async () => {
        attempts += 1;
        throw Object.assign(new Error('fetch failed'), { code: 'ECONNREFUSED' });
      },
    }
  );

  assert.equal(attempts, 1);
  assert.equal(result.networkError, true);
});

test('executeGraphqlRequest retries idempotent mutation on network failure', async () => {
  let attempts = 0;

  const result = await executeGraphqlRequest(
    { url: 'http://127.0.0.1:4000/graphql', manifest: idempotentMutationManifest, timeoutMs: 200 },
    {
      maxRetries: 2,
      fetchFn: async () => {
        attempts += 1;

        if (attempts < 2) {
          throw Object.assign(new Error('fetch failed'), { code: 'ECONNREFUSED' });
        }

        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ data: { demoArchive: true } }),
        };
      },
    }
  );

  assert.equal(attempts, 2);
  assert.equal(result.ok, true);
});

test('startBff BLOCKED on readiness timeout', async () => {
  const lifecycle = await startBff(
    {
      bffRoot: os.tmpdir(),
      timeoutMs: 50,
      stack: 'bff-admin',
      schemaUrl: TEST_BFF_TARGET,
    },
    {
      spawnFn: () => ({
        stdout: { on: () => {} },
        stderr: { on: () => {} },
        on: () => {},
        kill: () => {},
      }),
      pingFn: async () => ({ ok: false, networkError: true, detail: 'ECONNREFUSED' }),
    }
  );

  assert.equal(lifecycle.ready, false);
  assert.equal(lifecycle.timedOut, true);
});

test('runE2eGate PASS against live BFF Target without spawn', async () => {
  const config = testConfig(os.tmpdir());
  let startedBff = false;

  const result = await runE2eGate(config, queryManifest, {
    environment: 'local',
    identityCheck: passIdentityCheck,
    startBff: async () => {
      startedBff = true;
      return mockReadyLifecycle();
    },
    fetchFn: jsonFetch(happyResponse),
  });

  assert.equal(startedBff, false);
  assert.equal(aggregateStatus(result.checks), STATUS.PASS);
  assert.match(
    result.e2eMeta.compactMeta,
    /env=local target=http:\/\/127\.0\.0\.1:4000\/graphql op=demoListing/
  );
});

test('runE2eGate BLOCKED when live BFF schema identity differs', async () => {
  const config = testConfig(os.tmpdir());
  let operationExecuted = false;

  const result = await runE2eGate(config, queryManifest, {
    environment: 'local',
    identityCheck: async () => ({
      id: 'bff-target-identity',
      passed: false,
      blocked: true,
      detail: 'BFF Target identity mismatch',
    }),
    fetchFn: async (_url, init) => {
      const query = JSON.parse(init.body).query;

      if (!query.includes('__typename')) {
        operationExecuted = true;
      }

      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify(happyResponse),
      };
    },
  });

  assert.equal(aggregateStatus(result.checks), STATUS.BLOCKED);
  assert.equal(operationExecuted, false);
  assert.ok(result.checks.some((check) => check.id === 'bff-target-identity' && check.blocked));
});

test('runE2eGate sends x-realt-auth-token from E2E_AUTH_TOKEN', async () => {
  const config = testConfig(os.tmpdir());
  let operationAuthHeader;

  const result = await runE2eGate(config, queryManifest, {
    environment: 'local',
    identityCheck: passIdentityCheck,
    env: {
      BFF_PIPELINE_BFF_ROOT: os.tmpdir(),
      BFF_PIPELINE_CLIENT_ROOT: os.tmpdir(),
      BFF_PIPELINE_BFF_TARGET: TEST_BFF_TARGET,
      E2E_AUTH_TOKEN: 'test-token',
    },
    startBff: async () => mockReadyLifecycle(),
    fetchFn: async (_url, init) => {
      const query = JSON.parse(init.body).query;

      if (!query.includes('__typename')) {
        operationAuthHeader = init.headers['x-realt-auth-token'];
      }

      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify(happyResponse),
      };
    },
  });

  assert.equal(operationAuthHeader, 'test-token');
  assert.equal(aggregateStatus(result.checks), STATUS.PASS);
});

test('runE2eGate reads BFF Target, token and root from Workspace Links', async () => {
  const config = testConfig('/config/bff');
  const bffTarget = 'http://workspace.test/graphql';
  let startArgs;
  let operationUrl;
  let operationAuthHeader;

  const result = await runE2eGate(
    config,
    { ...queryManifest, schemaUrl: 'http://manifest.test/graphql' },
    {
      environment: 'local',
      identityCheck: passIdentityCheck,
      workspaceLinks: {
        bffRoot: '/workspace/bff',
        bffTarget,
        env: { E2E_AUTH_TOKEN: 'workspace-token' },
      },
      startBff: async (args) => {
        startArgs = args;
        return mockReadyLifecycle('http://workspace.test/');
      },
      fetchFn: async (url, init) => {
        const query = JSON.parse(init.body).query;

        if (query.includes('__typename')) {
          throw Object.assign(new Error('fetch failed'), { code: 'ECONNREFUSED' });
        }

        operationUrl = url;
        operationAuthHeader = init.headers['x-realt-auth-token'];

        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify(happyResponse),
        };
      },
    }
  );

  assert.equal(startArgs.bffRoot, '/workspace/bff');
  assert.equal(startArgs.schemaUrl, bffTarget);
  assert.equal(operationUrl, bffTarget);
  assert.equal(operationAuthHeader, 'workspace-token');
  assert.equal(aggregateStatus(result.checks), STATUS.PASS);
});

test('loadEnvNextToManifest reads E2E_AUTH_TOKEN from .env beside manifest', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bff-e2e-env-'));
  const manifestPath = path.join(dir, 'manifest.json');
  const env = {};

  fs.writeFileSync(manifestPath, '{}');
  fs.writeFileSync(path.join(dir, '.env'), 'E2E_AUTH_TOKEN=from-file\n');

  const result = loadEnvNextToManifest(manifestPath, env);

  assert.equal(result.loaded, true);
  assert.equal(env.E2E_AUTH_TOKEN, 'from-file');
});

test('applyEnvFile makes workspace env override stale shell values', () => {
  const filePath = path.join(os.tmpdir(), `bff-e2e-env-${Date.now()}.env`);

  fs.writeFileSync(
    filePath,
    'BFF_PIPELINE_BFF_TARGET=https://workspace.test/graphql\nE2E_AUTH_TOKEN=from-file\n'
  );

  const env = {
    BFF_PIPELINE_BFF_TARGET: 'https://stale-shell.test/graphql',
    E2E_AUTH_TOKEN: 'from-shell',
  };
  applyEnvFile(filePath, env);

  assert.equal(env.BFF_PIPELINE_BFF_TARGET, 'https://workspace.test/graphql');
  assert.equal(env.E2E_AUTH_TOKEN, 'from-file');
  assert.equal(parseEnvFile('E2E_AUTH_TOKEN="quoted"\n').E2E_AUTH_TOKEN, 'quoted');
});

test('applyEnvFile removes stale managed values absent from workspace env', () => {
  const filePath = path.join(os.tmpdir(), `bff-e2e-exclusive-env-${Date.now()}.env`);
  const env = {
    BFF_PIPELINE_BFF_TARGET: 'https://stale-shell.test/graphql',
    E2E_AUTH_TOKEN: 'from-shell',
  };

  fs.writeFileSync(filePath, 'E2E_AUTH_TOKEN=from-file\n');
  applyEnvFile(filePath, env);

  assert.equal(Object.hasOwn(env, 'BFF_PIPELINE_BFF_TARGET'), false);
  assert.equal(env.E2E_AUTH_TOKEN, 'from-file');
});

test('runE2eGate BLOCKED on TLS error without spawn', async () => {
  const config = testConfig(os.tmpdir());
  let startedBff = false;

  const result = await runE2eGate(config, queryManifest, {
    environment: 'local',
    startBff: async () => {
      startedBff = true;
      return mockReadyLifecycle();
    },
    fetchFn: async () => {
      throw Object.assign(new Error('unable to verify the first certificate'), {
        code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
      });
    },
  });

  assert.equal(startedBff, false);
  assert.equal(aggregateStatus(result.checks), STATUS.BLOCKED);
  assert.ok(result.checks.some((check) => check.id === 'bff-readiness' && check.blocked));
});

test('runE2eGate FAIL without spawn when ping is HTTP error not network', async () => {
  const config = testConfig(os.tmpdir());
  let startedBff = false;

  const result = await runE2eGate(config, queryManifest, {
    environment: 'local',
    startBff: async () => {
      startedBff = true;
      return mockReadyLifecycle();
    },
    fetchFn: jsonFetch({ errors: [{ message: 'boom' }] }, { status: 500 }),
  });

  assert.equal(startedBff, false);
  assert.equal(aggregateStatus(result.checks), STATUS.FAIL);
});

test('runE2eGate rejects missing workspace BFF Target before spawn', async () => {
  const config = testConfig(os.tmpdir());
  let startedBff = false;

  await assert.rejects(
    () =>
      runE2eGate(config, queryManifest, {
        env: {
          BFF_PIPELINE_BFF_ROOT: os.tmpdir(),
          BFF_PIPELINE_CLIENT_ROOT: os.tmpdir(),
        },
        startBff: async () => {
          startedBff = true;
          return mockReadyLifecycle();
        },
        fetchFn: jsonFetch(happyResponse),
      }),
    /BFF_PIPELINE_BFF_TARGET/
  );
  assert.equal(startedBff, false);
});

test('runE2eGate e2eMockApi BLOCKED before executeOperation when BFF identity differs', async () => {
  const config = testConfig(os.tmpdir());
  let executeOperationCalled = false;

  const result = await runE2eGate(config, objectsSetCalledManifest, {
    pingFn: async () => ({ ok: true, status: 200 }),
    identityCheck: async () => ({
      id: 'bff-target-identity',
      passed: false,
      blocked: true,
      detail: 'BFF Target identity mismatch',
    }),
    executeOperationFn: async () => {
      executeOperationCalled = true;
      return {
        ok: true,
        status: 200,
        body: objectsSetCalledResponse,
      };
    },
  });

  assert.equal(aggregateStatus(result.checks), STATUS.BLOCKED);
  assert.equal(executeOperationCalled, false);
});

test('runE2eGate PASS for objectsSetCalledByRealtManager via executeOperation mock API', async () => {
  const config = testConfig(os.tmpdir());
  let startedBff = false;

  const result = await runE2eGate(config, objectsSetCalledManifest, {
    environment: 'local',
    pingFn: async () => ({ ok: true, status: 200 }),
    identityCheck: passIdentityCheck,
    startBff: async () => {
      startedBff = true;
      return mockReadyLifecycle();
    },
    executeOperationFn: async () => ({
      ok: true,
      status: 200,
      body: objectsSetCalledResponse,
    }),
  });

  assert.equal(startedBff, false);
  assert.equal(aggregateStatus(result.checks), STATUS.PASS);
  assert.match(
    result.e2eMeta.compactMeta,
    /env=local target=executeOperation op=objectsSetCalledByRealtManager/
  );
});

test('resolveDataSourceKey reads key from data-sources index', () => {
  const key = resolveDataSourceKey(
    'export const getDataSources = ({ req }) => ({ objectAPI: new ObjectApi({ req }) });',
    'ObjectApi'
  );

  assert.equal(key, 'objectAPI');
});

test('executeOperationAgainstSchema PASS when child prints GraphQL result', async () => {
  const bffRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bff-e2e-op-'));
  const dataSourcesDir = path.join(bffRoot, 'src/data-sources');

  fs.mkdirSync(dataSourcesDir, { recursive: true });
  fs.writeFileSync(
    path.join(dataSourcesDir, 'object-api.ts'),
    'export class ObjectApi {}\n'
  );
  fs.writeFileSync(
    path.join(dataSourcesDir, 'index.ts'),
    'export const getDataSources = ({ req }) => ({ objectAPI: new ObjectApi({ req }) });\n'
  );

  const result = await executeOperationAgainstSchema(
    { bffRoot, manifest: objectsSetCalledManifest, timeoutMs: 500 },
    {
      exec: async () => ({
        code: 0,
        stdout: JSON.stringify({ ok: true, status: 200, body: objectsSetCalledResponse }),
        stderr: '',
        timedOut: false,
      }),
    }
  );

  assert.equal(result.ok, true);
  assert.equal(result.body.data.objectsSetCalledByRealtManager, true);
});

test('runE2eGate FAIL when assertion does not match response', async () => {
  const config = testConfig(os.tmpdir());
  const brokenManifest = {
    ...queryManifest,
    assertions: [{ id: 'missing', path: 'data.demoListing.missing', exists: true }],
  };
  let startedBff = false;

  const result = await runE2eGate(config, brokenManifest, {
    identityCheck: passIdentityCheck,
    startBff: async () => {
      startedBff = true;
      return mockReadyLifecycle();
    },
    fetchFn: jsonFetch(happyResponse),
  });

  assert.equal(startedBff, false);
  assert.equal(aggregateStatus(result.checks), STATUS.FAIL);
});

test('runE2eGate spawns when ping is dead then PASS', async () => {
  const lifecycle = mockReadyLifecycle();
  const config = testConfig(os.tmpdir());
  let pingCalls = 0;

  const result = await runE2eGate(config, queryManifest, {
    environment: 'local',
    identityCheck: passIdentityCheck,
    startBff: async () => lifecycle,
    fetchFn: async (_url, init) => {
      const query = JSON.parse(init.body).query;
      pingCalls += 1;

      if (query.includes('__typename')) {
        throw Object.assign(new Error('fetch failed'), { code: 'ECONNREFUSED' });
      }

      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify(happyResponse),
      };
    },
  });

  assert.equal(pingCalls >= 1, true);
  assert.equal(aggregateStatus(result.checks), STATUS.PASS);
  assert.equal(lifecycle.stopped, true);
  assert.match(
    result.e2eMeta.compactMeta,
    /env=local target=http:\/\/127\.0\.0\.1:4000\/graphql op=demoListing/
  );
});

test('runE2eGate BLOCKED when BFF does not become ready', async () => {
  const config = testConfig(os.tmpdir());

  const result = await runE2eGate(config, queryManifest, {
    startBff: async () => ({
      ready: false,
      blocked: true,
      detail: 'bff readiness timeout after 500ms (bff-admin)',
      stop: () => {},
    }),
    fetchFn: async () => {
      throw Object.assign(new Error('fetch failed'), { code: 'ECONNREFUSED' });
    },
  });

  assert.equal(aggregateStatus(result.checks), STATUS.BLOCKED);
  assert.ok(result.checks.some((check) => check.id === 'bff-readiness' && check.blocked));
});

test('runE2eGate BLOCKED on network failure after retries', async () => {
  const lifecycle = mockReadyLifecycle();
  const config = testConfig(os.tmpdir());

  const result = await runE2eGate(config, queryManifest, {
    identityCheck: passIdentityCheck,
    startBff: async () => lifecycle,
    fetchFn: async () => {
      throw Object.assign(new Error('fetch failed'), { code: 'ECONNREFUSED' });
    },
  });

  assert.equal(aggregateStatus(result.checks), STATUS.BLOCKED);
  assert.equal(lifecycle.stopped, true);
});

test('buildResult compact includes e2e environment target and operation', () => {
  const result = buildResult({
    runId: 'run-1',
    stage: 4,
    status: STATUS.PASS,
    operation: 'demoListing',
    checks: [],
    meta: {
      compactMeta: buildE2eCompactMeta({
        environment: 'local',
        bffTarget: 'http://127.0.0.1:4000/graphql',
        operation: 'demoListing',
      }),
    },
  });

  assert.match(result.compact, /stage 4 PASS \(env=local target=http:\/\/127\.0\.0\.1:4000\/graphql op=demoListing\)/);
});

test('loadManifest reads stage 4 fixture manifest', () => {
  const manifestPath = path.join(fixturesDir, 'manifest-query.json');
  const manifest = loadManifest(manifestPath);

  assert.equal(manifest.operation, 'demoListing');
  assert.ok(Array.isArray(manifest.assertions));
  assert.equal(Object.hasOwn(manifest, 'schemaUrl'), false);
});
