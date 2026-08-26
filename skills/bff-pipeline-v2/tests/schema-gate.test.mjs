import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { checkApiTypeFields } from '../scripts/lib/api-type-fields.mjs';
import { detectBreakingChanges } from '../scripts/lib/gql-compat.mjs';
import { checkOperationAst, checkVoidMutation } from '../scripts/lib/gql-ast.mjs';
import { checkPathConvention, operationDirName } from '../scripts/lib/gql-path.mjs';
import { loadGraphql } from '../scripts/lib/graphql-loader.mjs';
import { validateManifestForStage } from '../scripts/lib/manifest.mjs';
import { STATUS } from '../scripts/lib/exit-codes.mjs';
import { aggregateStatus } from '../scripts/lib/result.mjs';
import { runSchemaGate } from '../scripts/lib/schema-gate.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures/schema-gate');
const bffAdminRoot =
  '/Users/egor1991egorovmacgmail.com/Documents/work/admin-project/bff-admin';

const baseManifest = {
  operation: 'demoListing',
  kind: 'query',
  domain: 'demo',
  stack: 'bff-admin',
  service: 'demo',
  endpoint: '/demo/listing',
  apiResponseType: 'DemoItem',
  graphqlType: 'DemoItem',
};

function readGql(name) {
  return fs.readFileSync(path.join(fixturesDir, 'gql', name), 'utf8');
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
      continue;
    }

    fs.copyFileSync(srcPath, destPath);
  }
}

function createBffFixture(gqlName, manifest) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bff-schema-gate-'));
  const dirName = operationDirName(manifest.kind, manifest.operation);
  const gqlDir = path.join(root, 'src/graph', manifest.domain, dirName);

  fs.mkdirSync(gqlDir, { recursive: true });
  fs.writeFileSync(path.join(gqlDir, `${dirName}.gql`), readGql(gqlName), 'utf8');

  copyDir(
    path.join(fixturesDir, 'api-schema'),
    path.join(root, 'node_modules/@realt-by/api-schema')
  );

  const graphqlTarget = path.join(bffAdminRoot, 'node_modules/graphql');
  const graphqlLink = path.join(root, 'node_modules/graphql');

  fs.mkdirSync(path.dirname(graphqlLink), { recursive: true });
  fs.symlinkSync(graphqlTarget, graphqlLink, 'dir');

  return root;
}

function testConfig(bffRoot) {
  return {
    projects: { bffAdmin: bffRoot, bffMls: bffRoot },
    timeouts: { default: 1000 },
    runsDir: fs.mkdtempSync(path.join(os.tmpdir(), 'bff-runs-')),
  };
}

test('validateManifestForStage requires stage 1 fields', () => {
  assert.throws(
    () => validateManifestForStage({ operation: 'x', kind: 'query', domain: 'd', stack: 'bff-admin' }, 1),
    /stage 1 manifest missing required fields/
  );
});

test('checkPathConvention PASS for valid layout', () => {
  const bffRoot = createBffFixture('valid-query.gql', baseManifest);
  const check = checkPathConvention(bffRoot, baseManifest);

  assert.equal(check.passed, true);
});

test('checkOperationAst FAIL for wrong operation name', async () => {
  const bffRoot = createBffFixture('wrong-name.gql', baseManifest);
  const source = readGql('wrong-name.gql');
  const graphql = await loadGraphql(bffRoot);
  const check = checkOperationAst(source, baseManifest, graphql);

  assert.equal(check.passed, false);
  assert.match(check.detail, /demoListing/);
});

test('checkVoidMutation FAIL for NullResponse', async () => {
  const manifest = {
    ...baseManifest,
    operation: 'demoArchive',
    kind: 'mutation',
  };
  const source = readGql('null-response.gql');
  const bffRoot = createBffFixture('null-response.gql', manifest);
  const graphql = await loadGraphql(bffRoot);
  const check = checkVoidMutation(source, manifest, graphql);

  assert.equal(check.passed, false);
  assert.match(check.detail, /NullResponse/);
});

test('checkApiTypeFields FAIL when api field missing in GraphQL', async () => {
  const bffRoot = createBffFixture('missing-field.gql', baseManifest);
  const source = readGql('missing-field.gql');
  const graphql = await loadGraphql(bffRoot);
  const check = checkApiTypeFields({ bffRoot, source, manifest: baseManifest, graphql });

  assert.equal(check.passed, false);
  assert.match(check.detail, /count/);
});

test('detectBreakingChanges FAIL when field removed', async () => {
  const graphql = await loadGraphql(bffAdminRoot);
  const issues = detectBreakingChanges(
    readGql('breaking-baseline.gql'),
    readGql('breaking-current.gql'),
    baseManifest,
    graphql
  );

  assert.ok(issues.length > 0);
  assert.match(issues.join(' '), /count/);
});

test('runSchemaGate PASS for valid schema without codegen/lint', async () => {
  const bffRoot = createBffFixture('valid-query.gql', baseManifest);
  const config = testConfig(bffRoot);

  const checks = await runSchemaGate(config, baseManifest, {
    skipCodegen: true,
    skipLint: true,
    getBaseline: async () => ({ missing: true }),
  });

  assert.equal(aggregateStatus(checks), STATUS.PASS);
});

test('runSchemaGate FAIL for wrong operation name', async () => {
  const bffRoot = createBffFixture('wrong-name.gql', baseManifest);
  const config = testConfig(bffRoot);

  const checks = await runSchemaGate(config, baseManifest, {
    skipCodegen: true,
    skipLint: true,
    getBaseline: async () => ({ missing: true }),
  });

  assert.equal(aggregateStatus(checks), STATUS.FAIL);
  assert.ok(checks.some((check) => check.id === 'operation-ast' && !check.passed));
});

test('runSchemaGate FAIL for breaking change', async () => {
  const bffRoot = createBffFixture('breaking-current.gql', baseManifest);
  const config = testConfig(bffRoot);

  const checks = await runSchemaGate(config, baseManifest, {
    skipCodegen: true,
    skipLint: true,
    getBaseline: async () => ({ source: readGql('breaking-baseline.gql') }),
  });

  assert.equal(aggregateStatus(checks), STATUS.FAIL);
  assert.ok(checks.some((check) => check.id === 'breaking-change' && !check.passed));
});

test('runSchemaGate FAIL when codegen fails', async () => {
  const bffRoot = createBffFixture('valid-query.gql', baseManifest);
  const config = testConfig(bffRoot);

  const checks = await runSchemaGate(config, baseManifest, {
    skipLint: true,
    getBaseline: async () => ({ missing: true }),
    exec: async (command, args) => {
      if (command === 'npm' && args[0] === 'run' && args[1] === 'codegen') {
        return { code: 1, stdout: '', stderr: 'codegen syntax error', timedOut: false };
      }

      return { code: 0, stdout: '', stderr: '', timedOut: false };
    },
  });

  assert.equal(aggregateStatus(checks), STATUS.FAIL);
  assert.ok(checks.some((check) => check.id === 'codegen' && !check.passed));
});

test('runSchemaGate FAIL when graphql lint fails', async () => {
  const bffRoot = createBffFixture('valid-query.gql', baseManifest);
  const config = testConfig(bffRoot);

  const checks = await runSchemaGate(config, baseManifest, {
    skipCodegen: true,
    getBaseline: async () => ({ missing: true }),
    exec: async (command, args) => {
      if (command === 'npx' && args[0] === 'eslint') {
        return { code: 1, stdout: 'naming-convention error', stderr: '', timedOut: false };
      }

      return { code: 0, stdout: '', stderr: '', timedOut: false };
    },
  });

  assert.equal(aggregateStatus(checks), STATUS.FAIL);
  assert.ok(checks.some((check) => check.id === 'graphql-lint' && !check.passed));
});
