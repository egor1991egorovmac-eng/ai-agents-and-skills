import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { STATUS } from '../scripts/lib/exit-codes.mjs';
import { computeStageFingerprint, findInvalidatedFrom } from '../scripts/lib/fingerprint.mjs';
import {
  FailOverrideError,
  runPipeline,
} from '../scripts/lib/orchestrator.mjs';
import { readState } from '../scripts/lib/run-state.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

const baseManifest = {
  operation: 'demoListing',
  kind: 'query',
  domain: 'demo',
  stack: 'bff-mls',
  client: 'mls',
  service: 'demo',
  endpoint: '/demo/listing',
  apiResponseType: 'DemoItem',
  httpMethod: 'POST',
  datasourceMethod: 'getDemoListing',
  e2eQuery:
    'query demoListing($data: DemoListingInput!) { demoListing(data: $data) { results { uuid } } }',
  e2eVariables: { data: { page: 1, pageSize: 10 } },
  assertions: [{ path: 'data.demoListing.results', notEmpty: true }],
  expectedTypes: ['QueryDemoListingArgs', 'DemoListingInput', 'DemoListing'],
  apolloPath: 'src/features/demo/apollo/apollo-admin-demo-listing.query.ts',
  hookName: 'useApolloDemoListingQuery',
};

function createTestConfig() {
  const runsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bff-orchestrator-runs-'));
  const projectRoot = path.join(fixturesDir, 'bff-latest');

  Object.assign(process.env, {
    BFF_PIPELINE_BFF_ROOT: projectRoot,
    BFF_PIPELINE_CLIENT_ROOT: projectRoot,
    BFF_PIPELINE_BFF_TARGET: 'http://127.0.0.1:4000/graphql',
  });

  return {
    libSchemaRemote: 'git@example.com/lib-schema.git',
    timeouts: { default: 1000, gitRemote: 1000 },
    runsDir,
    projects: {
      bffMls: projectRoot,
      graphifyVault: path.join(fixturesDir, 'vault-with-graph'),
      mls: projectRoot,
      admin: projectRoot,
      www: projectRoot,
    },
  };
}

function passChecks(stage) {
  return [{ id: `stage-${stage}-check`, passed: true }];
}

function failChecks(stage, id = 'expected-fail') {
  return [{ id, passed: false }];
}

function blockedChecks(stage, id = 'expected-blocked') {
  return [{ id, passed: false, blocked: true }];
}

function mockRunStage(behavior) {
  return async (stage) => {
    const result = behavior(stage);

    if (typeof result === 'function') {
      return result(stage);
    }

    return result;
  };
}

test('runPipeline happy path executes stages 0-6 sequentially', async () => {
  const config = createTestConfig();
  const calls = [];

  const result = await runPipeline({
    config,
    manifest: baseManifest,
    runStage: async (stage) => {
      calls.push(stage);
      return { checks: passChecks(stage), meta: {} };
    },
  });

  assert.equal(result.status, STATUS.PASS);
  assert.deepEqual(calls, [0, 1, 2, 3, 4, 5, 6]);
  assert.match(result.compact, /pipeline PASS/);

  const state = readState(result.runDir);
  assert.equal(Object.keys(state.stages).length, 7);

  for (let stage = 0; stage <= 6; stage += 1) {
    assert.equal(state.stages[String(stage)].status, STATUS.PASS);
    assert.ok(state.stages[String(stage)].fingerprint);
  }
});

test('runPipeline rejects FAIL override with --override-blocked semantics', async () => {
  const config = createTestConfig();

  await assert.rejects(
    () =>
      runPipeline({
        config,
        manifest: baseManifest,
        overrideBlocked: true,
        runStage: async (stage) => ({
          checks: stage === 2 ? failChecks(stage) : passChecks(stage),
          meta: {},
        }),
      }),
    (error) => error instanceof FailOverrideError && error.stage === 2
  );
});

test('runPipeline stops on BLOCKED without override', async () => {
  const config = createTestConfig();
  const calls = [];

  const result = await runPipeline({
    config,
    manifest: baseManifest,
    runStage: async (stage) => {
      calls.push(stage);

      if (stage === 1) {
        return { checks: blockedChecks(stage), meta: {} };
      }

      return { checks: passChecks(stage), meta: {} };
    },
  });

  assert.equal(result.status, STATUS.BLOCKED);
  assert.deepEqual(calls, [0, 1]);
  assert.match(result.compact, /stage 1 BLOCKED/);

  const state = readState(result.runDir);
  assert.equal(state.overrides.length, 0);
});

test('runPipeline records BLOCKED override and continues', async () => {
  const config = createTestConfig();
  const calls = [];

  const result = await runPipeline({
    config,
    manifest: baseManifest,
    overrideBlocked: true,
    overrideReason: 'user approved stale schema',
    overrideUser: 'test-user',
    runStage: async (stage) => {
      calls.push(stage);

      if (stage === 1) {
        return { checks: blockedChecks(stage), meta: {} };
      }

      return { checks: passChecks(stage), meta: {} };
    },
  });

  assert.equal(result.status, STATUS.PASS);
  assert.deepEqual(calls, [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(result.stages[1].status, STATUS.BLOCKED);
  assert.equal(result.stages[1].overridden, true);

  const state = readState(result.runDir);
  assert.equal(state.overrides.length, 1);
  assert.equal(state.overrides[0].stage, 1);
  assert.equal(state.overrides[0].reason, 'user approved stale schema');
  assert.equal(state.overrides[0].user, 'test-user');
  assert.ok(state.overrides[0].at);
});

test('runPipeline resume reuses matching checkpoints', async () => {
  const config = createTestConfig();
  const calls = [];

  const runStage = async (stage) => {
    calls.push(stage);
    return { checks: passChecks(stage), meta: {} };
  };

  const first = await runPipeline({
    config,
    manifest: baseManifest,
    runStage,
  });

  assert.equal(first.status, STATUS.PASS);
  assert.equal(calls.length, 7);

  calls.length = 0;

  const second = await runPipeline({
    config,
    manifest: baseManifest,
    runId: first.runId,
    runStage,
  });

  assert.equal(second.status, STATUS.PASS);
  assert.equal(calls.length, 0);
  assert.match(second.compact, /reused/);

  for (let stage = 0; stage <= 6; stage += 1) {
    assert.equal(second.stages[stage].skipped, true);
  }
});

test('runPipeline invalidates changed fingerprint and reruns dependent stages', async () => {
  const config = createTestConfig();
  const calls = [];

  const runStage = async (stage) => {
    calls.push(stage);
    return { checks: passChecks(stage), meta: {} };
  };

  const manifestV1 = { ...baseManifest };
  const first = await runPipeline({
    config,
    manifest: manifestV1,
    runStage,
  });

  assert.equal(first.status, STATUS.PASS);
  assert.equal(calls.length, 7);

  calls.length = 0;

  const manifestV2 = {
    ...baseManifest,
    datasourceMethod: 'getDemoListingV2',
  };

  const second = await runPipeline({
    config,
    manifest: manifestV2,
    runId: first.runId,
    runStage,
  });

  assert.equal(second.status, STATUS.PASS);
  assert.deepEqual(calls, [2, 3, 4, 5, 6]);
  assert.equal(second.stages[0].skipped, true);
  assert.equal(second.stages[1].skipped, true);
  assert.equal(second.stages[2].skipped, false);
});

test('findInvalidatedFrom detects earliest stale stage', () => {
  const fingerprints = {
    0: 'fp-0',
    1: 'fp-1',
    2: 'fp-2-new',
  };

  const savedStages = {
    0: { status: STATUS.PASS, fingerprint: 'fp-0' },
    1: { status: STATUS.PASS, fingerprint: 'fp-1' },
    2: { status: STATUS.PASS, fingerprint: 'fp-2-old' },
  };

  assert.equal(findInvalidatedFrom(fingerprints, savedStages, 0), 2);
});

test('runPipeline includes changedFiles on FAIL', async () => {
  const config = createTestConfig();
  const packagePath = path.join(fixturesDir, 'bff-latest', 'package.json');

  const result = await runPipeline({
    config,
    manifest: baseManifest,
    runStage: async (stage) => {
      if (stage === 0) {
        return {
          checks: [
            {
              id: 'api-schema-apply',
              passed: false,
              changedFiles: [packagePath],
            },
          ],
          meta: {},
        };
      }

      return { checks: passChecks(stage), meta: {} };
    },
  });

  assert.equal(result.status, STATUS.FAIL);
  assert.deepEqual(result.changedFiles, [packagePath]);

  const state = readState(result.runDir);
  assert.deepEqual(state.stages['0'].changedFiles, [packagePath]);
});

test('verify checkpoint fingerprint enables resume reuse', async () => {
  const config = createTestConfig();
  const fingerprint = computeStageFingerprint(0, config, baseManifest);
  const calls = [];

  const first = await runPipeline({
    config,
    manifest: baseManifest,
    runStage: async (stage) => {
      calls.push(stage);
      return { checks: passChecks(stage), meta: {} };
    },
  });

  assert.equal(first.status, STATUS.PASS);
  assert.equal(calls.length, 7);

  const savedFingerprint = readState(first.runDir).stages['0'].fingerprint;
  assert.equal(savedFingerprint, fingerprint);

  calls.length = 0;

  const second = await runPipeline({
    config,
    manifest: baseManifest,
    runId: first.runId,
    runStage: async (stage) => {
      calls.push(stage);
      return { checks: passChecks(stage), meta: {} };
    },
  });

  assert.equal(second.status, STATUS.PASS);
  assert.equal(calls.length, 0);
  assert.equal(second.stages[0].skipped, true);
});

test('computeStageFingerprint changes when manifest input changes', () => {
  const config = createTestConfig();
  const first = computeStageFingerprint(2, config, baseManifest);
  const second = computeStageFingerprint(2, config, {
    ...baseManifest,
    endpoint: '/changed',
  });

  assert.notEqual(first, second);
});

test('stage 4 and 5 fingerprints change when workspace BFF Target changes', () => {
  const config = createTestConfig();

  for (const stage of [4, 5]) {
    process.env.BFF_PIPELINE_BFF_TARGET = 'http://127.0.0.1:4000/graphql';
    const first = computeStageFingerprint(stage, config, baseManifest);

    process.env.BFF_PIPELINE_BFF_TARGET = 'http://127.0.0.1:5000/graphql';
    const second = computeStageFingerprint(stage, config, baseManifest);

    assert.notEqual(first, second);
  }
});

test('stage 4 and 5 fingerprints ignore legacy manifest schemaUrl', () => {
  const config = createTestConfig();

  for (const stage of [4, 5]) {
    const withoutLegacyTarget = computeStageFingerprint(stage, config, baseManifest);
    const withLegacyTarget = computeStageFingerprint(stage, config, {
      ...baseManifest,
      schemaUrl: 'https://stale-manifest.test/graphql',
    });

    assert.equal(withoutLegacyTarget, withLegacyTarget);
  }
});
