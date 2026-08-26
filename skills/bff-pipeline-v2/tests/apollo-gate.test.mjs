import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  checkHookName,
  checkNoDefaultExport,
  checkOperationName,
  checkPickUsage,
  checkSingleOperation,
  checkTypeOnlyImports,
  countGqlOperations,
  extractGqlTemplates,
  runApolloAstChecks,
} from '../scripts/lib/apollo-ast.mjs';
import {
  buildApolloCompactMeta,
  filterTscErrors,
  runApolloGate,
  runApolloLint,
  runClientTypeCheck,
} from '../scripts/lib/apollo-gate.mjs';
import {
  checkApolloFile,
  resolveApolloKind,
  validateApolloFilename,
} from '../scripts/lib/apollo-path.mjs';
import { STATUS } from '../scripts/lib/exit-codes.mjs';
import { loadManifest, validateManifestForStage } from '../scripts/lib/manifest.mjs';
import { aggregateStatus, buildResult } from '../scripts/lib/result.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures/apollo-gate');

function readFixture(relativePath) {
  return fs.readFileSync(path.join(fixturesDir, relativePath), 'utf8');
}

function readJsonFixture(relativePath) {
  return JSON.parse(readFixture(relativePath));
}

const validManifest = readJsonFixture('manifest-valid.json');
const mutationManifest = readJsonFixture('manifest-mutation.json');

function createClientFixture({ manifest, apolloFixtureName }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-gate-'));
  const apolloAbsPath = path.join(root, manifest.apolloPath);

  fs.mkdirSync(path.dirname(apolloAbsPath), { recursive: true });
  fs.copyFileSync(path.join(fixturesDir, 'package.json'), path.join(root, 'package.json'));
  fs.writeFileSync(apolloAbsPath, readFixture(`apollo/${apolloFixtureName}.ts`), 'utf8');

  return root;
}

function testConfig(clientRoot) {
  return {
    projects: { admin: clientRoot, mls: clientRoot, www: clientRoot },
    timeouts: { default: 1000 },
    runsDir: fs.mkdtempSync(path.join(os.tmpdir(), 'bff-runs-')),
  };
}

function mockExecSuccess() {
  return async (command, args) => {
    if (command === 'npm') {
      return { code: 0, stdout: 'type-check ok', stderr: '', timedOut: false };
    }

    if (command === 'npx' && args[0] === 'eslint') {
      return { code: 0, stdout: '', stderr: '', timedOut: false };
    }

    return { code: 0, stdout: '', stderr: '', timedOut: false };
  };
}

function mockExecTypeCheckFail(message) {
  return async (command) => {
    if (command === 'npm') {
      return { code: 1, stdout: '', stderr: message, timedOut: false };
    }

    return { code: 0, stdout: '', stderr: '', timedOut: false };
  };
}

function mockExecLintFail(message = 'eslint error') {
  return async (command, args) => {
    if (command === 'npx' && args[0] === 'eslint') {
      return { code: 1, stdout: message, stderr: '', timedOut: false };
    }

    if (command === 'npm') {
      return { code: 0, stdout: '', stderr: '', timedOut: false };
    }

    return { code: 0, stdout: '', stderr: '', timedOut: false };
  };
}

test('validateManifestForStage requires stage 6 apolloPath and hookName', () => {
  assert.throws(
    () => validateManifestForStage({ ...validManifest, apolloPath: undefined }, 6),
    /apolloPath/
  );
  assert.throws(
    () => validateManifestForStage({ ...validManifest, hookName: undefined }, 6),
    /hookName/
  );
  assert.doesNotThrow(() => validateManifestForStage(validManifest, 6));
});

test('validateApolloFilename PASS for query, mutation and fragment patterns', () => {
  assert.equal(validateApolloFilename('apollo-admin-demo-listing.query.ts', 'query').passed, true);
  assert.equal(
    validateApolloFilename('apollo-work-statuses-create-work-status.mutation.ts', 'mutation').passed,
    true
  );
  assert.equal(
    validateApolloFilename('apollo-reference-currency-rate.fragment.ts', 'fragment').passed,
    true
  );
});

test('validateApolloFilename FAIL for listing without namespace and entity', () => {
  const result = validateApolloFilename('apollo-demo-listing.query.ts', 'query');

  assert.equal(result.passed, false);
});

test('validateApolloFilename FAIL for invalid or mismatched extension', () => {
  const invalid = validateApolloFilename('queries.ts', 'query');
  assert.equal(invalid.passed, false);

  const mismatch = validateApolloFilename('apollo-admin-demo-listing.mutation.ts', 'query');
  assert.equal(mismatch.passed, false);
  assert.match(mismatch.detail, /does not match apolloKind/);
});

test('resolveApolloKind infers fragment from apolloPath', () => {
  assert.equal(
    resolveApolloKind({
      kind: 'query',
      apolloPath: 'src/features/demo/apollo/apollo-demo.fragment.ts',
    }),
    'fragment'
  );
});

test('checkSingleOperation FAIL when gql contains multiple operations', () => {
  const source = readFixture('apollo/multiple-operations.ts');
  const check = checkSingleOperation(source);

  assert.equal(check.passed, false);
  assert.match(check.detail, /found 2/);
});

test('checkOperationName and checkHookName validate manifest operation and hook', () => {
  const validSource = readFixture('apollo/valid-query.ts');

  assert.equal(checkOperationName(validSource, validManifest).passed, true);
  assert.equal(checkHookName(validSource, validManifest).passed, true);

  const wrongHook = readFixture('apollo/wrong-hook.ts');
  assert.equal(checkHookName(wrongHook, validManifest).passed, false);
});

test('checkPickUsage requires Pick for query and createApolloFragment for fragment kind', () => {
  const validSource = readFixture('apollo/valid-query.ts');
  assert.equal(checkPickUsage(validSource, validManifest).passed, true);

  const noPick = validSource.replace("Pick<Query, 'demoListing'>", 'Query');
  assert.equal(checkPickUsage(noPick, validManifest).passed, false);
});

test('checkTypeOnlyImports and checkNoDefaultExport enforce import/export rules', () => {
  assert.equal(checkTypeOnlyImports(readFixture('apollo/valid-query.ts')).passed, true);
  assert.equal(checkTypeOnlyImports(readFixture('apollo/no-type-import.ts')).passed, false);
  assert.equal(checkNoDefaultExport(readFixture('apollo/default-export.ts')).passed, false);
});

test('extractGqlTemplates and countGqlOperations parse gql documents', () => {
  const source = readFixture('apollo/valid-query.ts');
  const templates = extractGqlTemplates(source);

  assert.equal(templates.length, 1);
  assert.equal(countGqlOperations(templates[0]), 1);
});

test('runApolloAstChecks PASS for valid query fixture', () => {
  const checks = runApolloAstChecks(readFixture('apollo/valid-query.ts'), validManifest);

  assert.equal(aggregateStatus(checks), STATUS.PASS);
});

test('checkApolloFile FAIL for missing file or wrong filename', () => {
  const clientRoot = createClientFixture({
    manifest: validManifest,
    apolloFixtureName: 'valid-query',
  });

  const missing = checkApolloFile(clientRoot, {
    ...validManifest,
    apolloPath: 'src/features/demo/apollo/apollo-missing.query.ts',
  });
  assert.equal(missing.id, 'apollo-file');
  assert.equal(missing.passed, false);

  const wrongApolloPath = 'src/features/demo/apollo/queries.ts';
  fs.writeFileSync(
    path.join(clientRoot, wrongApolloPath),
    readFixture('apollo/valid-query.ts')
  );

  const wrongName = checkApolloFile(clientRoot, {
    ...validManifest,
    apolloPath: wrongApolloPath,
  });
  assert.equal(wrongName.id, 'apollo-filename');
  assert.equal(wrongName.passed, false);
});

test('runApolloGate PASS with mocked type-check and eslint', async () => {
  const clientRoot = createClientFixture({
    manifest: validManifest,
    apolloFixtureName: 'valid-query',
  });
  const config = testConfig(clientRoot);

  const result = await runApolloGate(config, validManifest, { exec: mockExecSuccess() });

  assert.equal(aggregateStatus(result.checks), STATUS.PASS);
  assert.ok(result.checks.some((check) => check.id === 'client-type-check' && check.passed));
  assert.ok(result.checks.some((check) => check.id === 'apollo-lint' && check.passed));
  assert.match(result.apolloMeta.compactMeta, /client=admin/);
});

test('runApolloGate FAIL for multiple operations without running expensive checks early', async () => {
  const clientRoot = createClientFixture({
    manifest: validManifest,
    apolloFixtureName: 'multiple-operations',
  });
  const config = testConfig(clientRoot);
  let execCalls = 0;

  const result = await runApolloGate(config, validManifest, {
    exec: async () => {
      execCalls += 1;
      return { code: 0, stdout: '', stderr: '', timedOut: false };
    },
  });

  assert.equal(aggregateStatus(result.checks), STATUS.FAIL);
  assert.ok(result.checks.some((check) => check.id === 'apollo-single-operation' && !check.passed));
  assert.equal(execCalls, 0);
});

test('filterTscErrors reads pretty tsc output after stripping ANSI', () => {
  const output = `\u001B[96msrc/features/demo/apollo/apollo-admin-demo-listing.query.ts\u001B[0m:\u001B[93m4\u001B[0m:\u001B[93m3\u001B[0m - \u001B[91merror\u001B[0m\u001B[90m TS2322: \u001B[0mtype mismatch`;

  const scoped = filterTscErrors(output, [validManifest.apolloPath]);

  assert.equal(scoped.length, 1);
});

test('filterTscErrors keeps errors only for changed files', () => {
  const output = [
    "src/features/demo/apollo/apollo-admin-demo-listing.query.ts(4,3): error TS2322: type mismatch",
    "src/features/users/apollo/other.ts(1,1): error TS2305: missing export",
  ].join('\n');

  const scoped = filterTscErrors(output, [validManifest.apolloPath]);

  assert.equal(scoped.length, 1);
  assert.match(scoped[0], /apollo-admin-demo-listing\.query\.ts/);
});

test('runClientTypeCheck PASS when pretty tsc fails only in unrelated files', async () => {
  const pretty = `\u001B[96msrc/lib/graphql/types.ts\u001B[0m:\u001B[93m10\u001B[0m:\u001B[93m1\u001B[0m - \u001B[91merror\u001B[0m\u001B[90m TS2305: \u001B[0mmissing export`;
  const check = await runClientTypeCheck(
    {
      clientRoot: os.tmpdir(),
      timeoutMs: 1000,
      files: [validManifest.apolloPath],
    },
    {
      exec: async () => ({
        code: 1,
        stdout: pretty,
        stderr: '',
        timedOut: false,
      }),
    }
  );

  assert.equal(check.passed, true);
  assert.match(check.detail, /ignored 1 other tsc errors/);
});

test('runClientTypeCheck PASS when tsc fails only in unrelated files', async () => {
  const check = await runClientTypeCheck(
    {
      clientRoot: os.tmpdir(),
      timeoutMs: 1000,
      files: [validManifest.apolloPath],
    },
    {
      exec: async () => ({
        code: 1,
        stdout: '',
        stderr: 'src/features/users/apollo/other.ts(1,1): error TS2305: missing export',
        timedOut: false,
      }),
    }
  );

  assert.equal(check.passed, true);
  assert.match(check.detail, /ignored 1 other tsc errors/);
});

test('runApolloGate FAIL when type-check fails', async () => {
  const clientRoot = createClientFixture({
    manifest: validManifest,
    apolloFixtureName: 'valid-query',
  });
  const config = testConfig(clientRoot);

  const result = await runApolloGate(config, validManifest, {
    exec: mockExecTypeCheckFail(
      `${validManifest.apolloPath}(4,3): error TS2322: type mismatch`
    ),
  });

  assert.equal(aggregateStatus(result.checks), STATUS.FAIL);
  assert.ok(result.checks.some((check) => check.id === 'client-type-check' && !check.passed));
});

test('runApolloGate FAIL when eslint fails', async () => {
  const clientRoot = createClientFixture({
    manifest: validManifest,
    apolloFixtureName: 'valid-query',
  });
  const config = testConfig(clientRoot);

  const result = await runApolloGate(config, validManifest, {
    exec: mockExecLintFail('import/order error'),
  });

  assert.equal(aggregateStatus(result.checks), STATUS.FAIL);
  assert.ok(result.checks.some((check) => check.id === 'apollo-lint' && !check.passed));
});

test('runApolloGate cannot PASS when type-check and lint are skipped', async () => {
  const clientRoot = createClientFixture({
    manifest: validManifest,
    apolloFixtureName: 'valid-query',
  });
  const config = testConfig(clientRoot);

  const result = await runApolloGate(config, validManifest, {
    skipTypeCheck: true,
    skipLint: true,
  });

  assert.equal(aggregateStatus(result.checks), STATUS.FAIL);
  assert.ok(
    result.checks.some((check) => check.id === 'client-type-check' && check.detail.includes('did not run'))
  );
  assert.ok(result.checks.some((check) => check.id === 'apollo-lint' && check.detail.includes('did not run')));
});

test('runApolloGate PASS for valid mutation fixture', async () => {
  const clientRoot = createClientFixture({
    manifest: mutationManifest,
    apolloFixtureName: 'valid-mutation',
  });
  const config = testConfig(clientRoot);

  const result = await runApolloGate(config, mutationManifest, { exec: mockExecSuccess() });

  assert.equal(aggregateStatus(result.checks), STATUS.PASS);
});

test('runClientTypeCheck BLOCKED on timeout', async () => {
  const check = await runClientTypeCheck(
    { clientRoot: os.tmpdir(), timeoutMs: 1000 },
    {
      exec: async () => ({ code: null, stdout: '', stderr: '', timedOut: true }),
    }
  );

  assert.equal(check.blocked, true);
});

test('runApolloLint uses eslint without --fix', async () => {
  const clientRoot = createClientFixture({
    manifest: validManifest,
    apolloFixtureName: 'valid-query',
  });
  const apolloAbsPath = path.join(clientRoot, validManifest.apolloPath);
  const calls = [];

  const check = await runApolloLint(
    { clientRoot, apolloAbsPath, timeoutMs: 1000 },
    {
      exec: async (command, args) => {
        calls.push({ command, args });
        return { code: 0, stdout: '', stderr: '', timedOut: false };
      },
    }
  );

  assert.equal(check.passed, true);
  assert.deepEqual(calls[0].args, ['eslint', validManifest.apolloPath]);
});

test('buildResult compact includes apollo path and hook for stage 6', () => {
  const result = buildResult({
    runId: 'run-1',
    stage: 6,
    status: STATUS.PASS,
    operation: validManifest.operation,
    checks: [],
    meta: {
      compactMeta: buildApolloCompactMeta({
        client: validManifest.client,
        apolloPath: validManifest.apolloPath,
        hookName: validManifest.hookName,
      }),
    },
  });

  assert.match(result.compact, /stage 6 PASS \(client=admin apollo=src\/features\/demo\/apollo/);
  assert.match(result.compact, /hook=useApolloDemoListingQuery/);
});

test('loadManifest reads stage 6 fixture manifest', () => {
  const manifest = loadManifest(path.join(fixturesDir, 'manifest-valid.json'));

  assert.equal(manifest.apolloPath, validManifest.apolloPath);
  assert.equal(manifest.hookName, validManifest.hookName);
});
