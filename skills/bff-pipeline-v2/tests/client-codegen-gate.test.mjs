import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  buildClientCodegenCompactMeta,
  buildCodegenEnv,
  buildTypesDiff,
  checkClientForStack,
  checkCodegenSchemaSource,
  extractTypeBlocks,
  findMissingTypes,
  findUnrelatedTypeChanges,
} from '../scripts/lib/client-types-diff.mjs';
import {
  runClientCodegen,
  runClientCodegenGate,
  runClientTypesChecks,
} from '../scripts/lib/client-codegen-gate.mjs';
import { STATUS } from '../scripts/lib/exit-codes.mjs';
import { loadManifest, validateManifestForStage } from '../scripts/lib/manifest.mjs';
import { aggregateStatus, buildResult } from '../scripts/lib/result.mjs';
import { formatLogLines } from '../scripts/lib/run-state.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures/client-codegen-gate');
const TEST_BFF_TARGET = 'http://127.0.0.1:4000/graphql';

function readFixture(relativePath) {
  return fs.readFileSync(path.join(fixturesDir, relativePath), 'utf8');
}

function readJsonFixture(relativePath) {
  return JSON.parse(readFixture(relativePath));
}

const validManifest = readJsonFixture('manifest-valid.json');
const beforeTypes = readFixture('types-before.ts');
const afterValidTypes = readFixture('types-after-valid.ts');
const afterMissingTypes = readFixture('types-after-missing.ts');
const afterUnrelatedTypes = readFixture('types-after-unrelated.ts');

function workspaceEnv(clientRoot, overrides = {}) {
  return {
    BFF_PIPELINE_BFF_ROOT: clientRoot,
    BFF_PIPELINE_CLIENT_ROOT: clientRoot,
    BFF_PIPELINE_BFF_TARGET: TEST_BFF_TARGET,
    ...overrides,
  };
}

function createClientFixture({ codegenFile = 'codegen-admin.js', typesFile = 'types-before.ts' } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'client-codegen-gate-'));

  fs.copyFileSync(path.join(fixturesDir, 'package.json'), path.join(root, 'package.json'));
  fs.copyFileSync(path.join(fixturesDir, codegenFile), path.join(root, 'codegen.js'));

  const envDir = path.join(root, 'src/config');
  fs.mkdirSync(envDir, { recursive: true });
  fs.copyFileSync(path.join(fixturesDir, 'env-admin.js'), path.join(envDir, 'env.js'));

  const typesDir = path.join(root, 'src/lib/graphql');
  fs.mkdirSync(typesDir, { recursive: true });
  fs.writeFileSync(path.join(typesDir, 'types.ts'), readFixture(typesFile), 'utf8');

  return root;
}

function testConfig(clientRoot) {
  Object.assign(process.env, workspaceEnv(clientRoot));

  return {
    projects: { admin: clientRoot, mls: clientRoot, www: clientRoot },
    timeouts: { default: 1000 },
    runsDir: fs.mkdtempSync(path.join(os.tmpdir(), 'bff-runs-')),
  };
}

function mockExecSuccess() {
  return async () => ({ code: 0, stdout: 'codegen ok', stderr: '', timedOut: false });
}

function mockExecFail(message = 'codegen failed') {
  return async () => ({ code: 1, stdout: '', stderr: message, timedOut: false });
}

function mockGitBaseline(source = beforeTypes) {
  return async () => ({ code: 0, stdout: source, stderr: '', timedOut: false });
}

async function passIdentityCheck() {
  return { id: 'bff-target-identity', passed: true, detail: 'schema fingerprint test' };
}

test('validateManifestForStage requires stage 5 client and expectedTypes but not BFF Target', () => {
  assert.throws(
    () => validateManifestForStage({ ...validManifest, expectedTypes: undefined }, 5),
    /expectedTypes/
  );
  assert.throws(
    () => validateManifestForStage({ ...validManifest, client: undefined }, 5),
    /client/
  );
  assert.equal(Object.hasOwn(validManifest, 'schemaUrl'), false);
  assert.doesNotThrow(() => validateManifestForStage(validManifest, 5));
});

test('checkClientForStack rejects unknown client on bff-admin', () => {
  const check = checkClientForStack('unknown', 'bff-admin');

  assert.equal(check.passed, false);
});

test('checkCodegenSchemaSource PASS for admin + bff-admin', () => {
  const source = readFixture('codegen-admin.js');
  const check = checkCodegenSchemaSource(source, 'admin', 'bff-admin');

  assert.equal(check.passed, true);
});

test('checkCodegenSchemaSource FAIL for wrong BFF env on mls client', () => {
  const source = readFixture('codegen-wrong-bff.js');
  const check = checkCodegenSchemaSource(source, 'mls', 'bff-mls');

  assert.equal(check.passed, false);
  assert.match(check.detail, /API_MLS_URL/);
});

test('buildCodegenEnv points codegen at BFF Target not client env', () => {
  const env = buildCodegenEnv('https://api.realt.loc:8005/graphql', {
    NEXT_PUBLIC_API_HOST: 'http://127.0.0.1',
    NEXT_PUBLIC_API_PORT: '4000',
  });

  assert.equal(env.NEXT_PUBLIC_API_HOST, 'https://api.realt.loc');
  assert.equal(env.NEXT_PUBLIC_API_PORT, '8005');
  assert.equal(env.GRAPHQL_URL, 'https://api.realt.loc:8005/graphql');
  assert.equal(env.API_MLS_URL, 'https://api.realt.loc:8005');
});

test('buildCodegenEnv FAIL for invalid BFF Target', () => {
  assert.throws(() => buildCodegenEnv('not-a-url'), /invalid BFF Target/);
});

test('findMissingTypes detects absent expected operation types', () => {
  const missing = findMissingTypes(afterMissingTypes, validManifest.expectedTypes);

  assert.deepEqual(missing, ['QueryDemoListingArgs']);
});

test('findUnrelatedTypeChanges BLOCKED when Scalars or Query drift', () => {
  const unrelated = findUnrelatedTypeChanges(beforeTypes, afterUnrelatedTypes, validManifest.expectedTypes);

  assert.ok(unrelated.includes('Query'));
  assert.ok(unrelated.includes('Scalars') || unrelated.length > 0);
});

test('findUnrelatedTypeChanges allows only the current operation field in Query', () => {
  const beforeWithoutOperation = beforeTypes.replace(
    "  demoListing?: Maybe<DemoListing>;\n",
    ''
  );
  const unrelated = findUnrelatedTypeChanges(
    beforeWithoutOperation,
    afterValidTypes,
    validManifest.expectedTypes,
    { operation: validManifest.operation }
  );

  assert.equal(unrelated.includes('Query'), false);
});

test('runClientTypesChecks PASS for valid diff', () => {
  const checks = runClientTypesChecks({
    beforeSource: beforeTypes,
    afterSource: afterValidTypes,
    expectedTypes: validManifest.expectedTypes,
    operation: validManifest.operation,
  });

  assert.equal(aggregateStatus(checks), STATUS.PASS);
});

test('runClientTypesChecks FAIL when expected types are missing', () => {
  const checks = runClientTypesChecks({
    beforeSource: beforeTypes,
    afterSource: afterMissingTypes,
    expectedTypes: validManifest.expectedTypes,
    operation: validManifest.operation,
  });

  assert.equal(aggregateStatus(checks), STATUS.FAIL);
  assert.ok(checks.some((check) => check.id === 'expected-types' && !check.passed));
});

test('runClientTypesChecks BLOCKED for unrelated generated type changes', () => {
  const checks = runClientTypesChecks({
    beforeSource: beforeTypes,
    afterSource: afterUnrelatedTypes,
    expectedTypes: validManifest.expectedTypes,
    operation: validManifest.operation,
  });

  assert.equal(aggregateStatus(checks), STATUS.BLOCKED);
  assert.ok(checks.some((check) => check.id === 'types-diff' && check.blocked));
  assert.ok(checks.some((check) => check.fullDiff));
});

test('formatLogLines includes full diff only in stage log payload', () => {
  const lines = formatLogLines([
    {
      id: 'types-diff',
      passed: false,
      blocked: true,
      detail: 'unrelated type changes: Query',
      fullDiff: buildTypesDiff(beforeTypes, afterUnrelatedTypes),
    },
  ]);

  assert.match(lines, /full diff/);
  assert.match(lines, /--- Query ---/);
});

test('runClientCodegenGate uses workspace BFF Target even if client env host differs', async () => {
  const clientRoot = createClientFixture();
  const config = testConfig(clientRoot);
  let capturedEnv;
  const bffTarget = 'https://workspace.test:8443/graphql';

  const result = await runClientCodegenGate(config, validManifest, {
    identityCheck: passIdentityCheck,
    typescript: null,
    gitExec: mockGitBaseline(),
    env: {
      BFF_PIPELINE_BFF_ROOT: '/workspace/bff',
      BFF_PIPELINE_CLIENT_ROOT: clientRoot,
      BFF_PIPELINE_BFF_TARGET: bffTarget,
      NEXT_PUBLIC_API_HOST: 'http://127.0.0.1',
      NEXT_PUBLIC_API_PORT: '9999',
    },
    exec: async (_command, _args, options) => {
      capturedEnv = options.env;
      fs.writeFileSync(path.join(clientRoot, 'src/lib/graphql/types.ts'), afterValidTypes, 'utf8');
      return { code: 0, stdout: 'codegen ok', stderr: '', timedOut: false };
    },
  });

  assert.equal(aggregateStatus(result.checks), STATUS.PASS);
  assert.equal(capturedEnv.NEXT_PUBLIC_API_HOST, 'https://workspace.test');
  assert.equal(capturedEnv.NEXT_PUBLIC_API_PORT, '8443');
  assert.equal(capturedEnv.GRAPHQL_URL, bffTarget);
  assert.ok(result.checks.some((check) => check.id === 'codegen-target' && check.passed));
});

test('runClientCodegenGate BLOCKED before codegen when BFF identity differs', async () => {
  const clientRoot = createClientFixture();
  const config = testConfig(clientRoot);
  let codegenStarted = false;

  const result = await runClientCodegenGate(config, validManifest, {
    identityCheck: async () => ({
      id: 'bff-target-identity',
      passed: false,
      blocked: true,
      detail: 'BFF Target identity mismatch',
    }),
    writeAfterCodegen: async (typesPath) => {
      codegenStarted = true;
      fs.writeFileSync(typesPath, afterValidTypes, 'utf8');
    },
  });

  assert.equal(aggregateStatus(result.checks), STATUS.BLOCKED);
  assert.equal(codegenStarted, false);
  assert.ok(result.checks.some((check) => check.id === 'bff-target-identity' && check.blocked));
});

test('runClientCodegenGate reads target, env and client root from Workspace Links', async () => {
  const clientRoot = createClientFixture();
  const config = testConfig('/config/client');
  const bffTarget = 'https://workspace.test:8443/graphql';
  let capturedEnv;

  const result = await runClientCodegenGate(
    config,
    { ...validManifest, schemaUrl: 'https://manifest.test/graphql' },
    {
      identityCheck: passIdentityCheck,
      typescript: null,
      gitExec: mockGitBaseline(),
      workspaceLinks: {
        bffRoot: '/workspace/bff',
        clientRoot,
        bffTarget,
        env: {
          NEXT_PUBLIC_API_HOST: 'http://client-env.test',
          NEXT_PUBLIC_API_PORT: '9999',
        },
      },
      exec: async (_command, _args, options) => {
        capturedEnv = options.env;
        fs.writeFileSync(path.join(clientRoot, 'src/lib/graphql/types.ts'), afterValidTypes, 'utf8');
        return { code: 0, stdout: 'codegen ok', stderr: '', timedOut: false };
      },
    }
  );

  assert.equal(aggregateStatus(result.checks), STATUS.PASS);
  assert.equal(capturedEnv.GRAPHQL_URL, bffTarget);
  assert.equal(capturedEnv.NEXT_PUBLIC_API_HOST, 'https://workspace.test');
  assert.equal(capturedEnv.NEXT_PUBLIC_API_PORT, '8443');
});

test('runClientCodegenGate PASS with mocked codegen and valid types update', async () => {
  const clientRoot = createClientFixture();
  const config = testConfig(clientRoot);

  const result = await runClientCodegenGate(config, validManifest, {
    identityCheck: passIdentityCheck,
    typescript: null,
    gitExec: mockGitBaseline(),
    exec: mockExecSuccess(),
    writeAfterCodegen: async (typesPath) => {
      fs.writeFileSync(typesPath, afterValidTypes, 'utf8');
    },
    env: workspaceEnv(clientRoot, {
      NEXT_PUBLIC_API_HOST: '127.0.0.1',
      NEXT_PUBLIC_API_PORT: '4000',
    }),
  });

  assert.equal(aggregateStatus(result.checks), STATUS.PASS);
  assert.match(result.clientMeta.compactMeta, /client=admin types=QueryDemoListingArgs/);
});

test('runClientCodegenGate FAIL for wrong BFF schema source', async () => {
  const clientRoot = createClientFixture({ codegenFile: 'codegen-wrong-bff.js' });
  const mlsManifest = {
    ...validManifest,
    stack: 'bff-mls',
    client: 'mls',
  };
  const config = testConfig(clientRoot);

  const result = await runClientCodegenGate(config, mlsManifest, {
    exec: mockExecSuccess(),
    skipCodegen: true,
  });

  assert.equal(aggregateStatus(result.checks), STATUS.FAIL);
  assert.ok(result.checks.some((check) => check.id === 'schema-source' && !check.passed));
});

test('runClientCodegenGate FAIL when codegen succeeds but expected types stay missing', async () => {
  const clientRoot = createClientFixture();
  const config = testConfig(clientRoot);

  const result = await runClientCodegenGate(config, validManifest, {
    identityCheck: passIdentityCheck,
    typescript: null,
    gitExec: mockGitBaseline(),
    exec: mockExecSuccess(),
    writeAfterCodegen: async (typesPath) => {
      fs.writeFileSync(typesPath, afterMissingTypes, 'utf8');
    },
    env: workspaceEnv(clientRoot, {
      NEXT_PUBLIC_API_HOST: '127.0.0.1',
      NEXT_PUBLIC_API_PORT: '4000',
    }),
  });

  assert.equal(aggregateStatus(result.checks), STATUS.FAIL);
  assert.ok(result.checks.some((check) => check.id === 'expected-types' && !check.passed));
});

test('runClientCodegenGate BLOCKED on unrelated types diff', async () => {
  const clientRoot = createClientFixture();
  const config = testConfig(clientRoot);

  const result = await runClientCodegenGate(config, validManifest, {
    identityCheck: passIdentityCheck,
    typescript: null,
    gitExec: mockGitBaseline(),
    exec: mockExecSuccess(),
    writeAfterCodegen: async (typesPath) => {
      fs.writeFileSync(typesPath, afterUnrelatedTypes, 'utf8');
    },
    env: workspaceEnv(clientRoot, {
      NEXT_PUBLIC_API_HOST: '127.0.0.1',
      NEXT_PUBLIC_API_PORT: '4000',
    }),
  });

  assert.equal(aggregateStatus(result.checks), STATUS.BLOCKED);
});

test('runClientCodegenGate keeps git HEAD as baseline across repeated blocked runs', async () => {
  const clientRoot = createClientFixture({ typesFile: 'types-after-unrelated.ts' });
  const config = testConfig(clientRoot);
  const deps = {
    identityCheck: passIdentityCheck,
    typescript: null,
    skipCodegen: true,
    gitExec: async () => ({
      code: 0,
      stdout: beforeTypes,
      stderr: '',
      timedOut: false,
    }),
  };

  const first = await runClientCodegenGate(config, validManifest, deps);
  const second = await runClientCodegenGate(config, validManifest, deps);

  assert.equal(aggregateStatus(first.checks), STATUS.BLOCKED);
  assert.equal(aggregateStatus(second.checks), STATUS.BLOCKED);
});

test('runClientCodegenGate BLOCKED when git HEAD baseline is unavailable', async () => {
  const clientRoot = createClientFixture();
  const config = testConfig(clientRoot);

  const result = await runClientCodegenGate(config, validManifest, {
    identityCheck: passIdentityCheck,
    typescript: null,
    skipCodegen: true,
    gitExec: mockExecFail('not a git repository'),
  });

  assert.equal(aggregateStatus(result.checks), STATUS.BLOCKED);
  assert.ok(result.checks.some((check) => check.id === 'client-types-baseline' && check.blocked));
});

test('runClientCodegenGate FAIL when npm run codegen fails', async () => {
  const clientRoot = createClientFixture();
  const config = testConfig(clientRoot);

  const result = await runClientCodegenGate(config, validManifest, {
    identityCheck: passIdentityCheck,
    typescript: null,
    gitExec: mockGitBaseline(),
    exec: mockExecFail('introspection failed'),
    env: workspaceEnv(clientRoot, {
      NEXT_PUBLIC_API_HOST: '127.0.0.1',
      NEXT_PUBLIC_API_PORT: '4000',
    }),
  });

  assert.equal(aggregateStatus(result.checks), STATUS.FAIL);
  assert.ok(result.checks.some((check) => check.id === 'client-codegen' && !check.passed));
});

test('runClientCodegen BLOCKED on timeout', async () => {
  const check = await runClientCodegen(
    { clientRoot: os.tmpdir(), timeoutMs: 1000 },
    {
      exec: async () => ({ code: null, stdout: '', stderr: '', timedOut: true }),
    }
  );

  assert.equal(check.blocked, true);
});

test('buildResult compact includes client and expected types', () => {
  const result = buildResult({
    runId: 'run-1',
    stage: 5,
    status: STATUS.PASS,
    operation: 'demoListing',
    checks: [],
    meta: {
      compactMeta: buildClientCodegenCompactMeta({
        client: 'admin',
        expectedTypes: validManifest.expectedTypes,
      }),
    },
  });

  assert.match(result.compact, /stage 5 PASS \(client=admin types=QueryDemoListingArgs/);
});

test('extractTypeBlocks indexes exported type names', () => {
  const blocks = extractTypeBlocks(afterValidTypes);

  assert.ok(blocks.has('QueryDemoListingArgs'));
  assert.ok(blocks.has('DemoListing'));
});

test('loadManifest reads stage 5 fixture manifest', () => {
  const manifestPath = path.join(fixturesDir, 'manifest-valid.json');
  const manifest = loadManifest(manifestPath);

  assert.equal(manifest.client, 'admin');
  assert.deepEqual(manifest.expectedTypes, validManifest.expectedTypes);
  assert.equal(Object.hasOwn(manifest, 'schemaUrl'), false);
});

test('checkCodegenSchemaSource PASS for mls client on bff-mls', () => {
  const check = checkCodegenSchemaSource(readFixture('codegen-mls.js'), 'mls', 'bff-mls');

  assert.equal(check.passed, true);
});
