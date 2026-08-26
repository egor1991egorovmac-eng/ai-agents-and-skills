import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { loadGraphql } from '../scripts/lib/graphql-loader.mjs';
import { validateManifestForStage } from '../scripts/lib/manifest.mjs';
import { STATUS } from '../scripts/lib/exit-codes.mjs';
import { aggregateStatus } from '../scripts/lib/result.mjs';
import {
  checkResolverFieldName,
  checkResolverRegistration,
  checkVoidMutationReturn,
  extractResolverFieldName,
  runResolverAstChecks,
} from '../scripts/lib/resolver-ast.mjs';
import { operationDirName } from '../scripts/lib/gql-path.mjs';
import { checkResolverFile } from '../scripts/lib/resolver-path.mjs';
import { runResolverGate } from '../scripts/lib/resolver-gate.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures/resolver-gate');
const bffAdminRoot =
  '/Users/egor1991egorovmacgmail.com/Documents/work/admin-project/bff-admin';

const queryManifest = {
  operation: 'demoListing',
  kind: 'query',
  domain: 'demo',
  stack: 'bff-admin',
  service: 'demo',
  endpoint: '/demo/listing',
  apiResponseType: 'DemoItem',
  httpMethod: 'POST',
  datasourceMethod: 'getDemoListing',
};

const mutationManifest = {
  ...queryManifest,
  operation: 'demoArchive',
  kind: 'mutation',
  endpoint: '/demo/archive',
  datasourceMethod: 'archiveDemo',
};

function readFixture(relativePath) {
  return fs.readFileSync(path.join(fixturesDir, relativePath), 'utf8');
}

function readGql(name) {
  return readFixture(`gql/${name}`);
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

function linkGraphql(root) {
  const graphqlTarget = path.join(bffAdminRoot, 'node_modules/graphql');
  const graphqlLink = path.join(root, 'node_modules/graphql');

  fs.mkdirSync(path.dirname(graphqlLink), { recursive: true });
  fs.symlinkSync(graphqlTarget, graphqlLink, 'dir');
}

function createBffFixture({
  manifest,
  resolverName,
  gqlName,
  indexName = 'registered.ts',
}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bff-resolver-gate-'));
  const dirName = operationDirName(manifest.kind, manifest.operation);
  const resolverDir = path.join(root, 'src/graph', manifest.domain, dirName);

  fs.mkdirSync(resolverDir, { recursive: true });
  fs.writeFileSync(
    path.join(resolverDir, `${dirName}-resolver.ts`),
    readFixture(`resolvers/${resolverName}.ts`),
    'utf8'
  );
  fs.writeFileSync(path.join(resolverDir, `${dirName}.gql`), readGql(gqlName), 'utf8');
  fs.writeFileSync(path.join(root, 'src/graph/resolvers.ts'), readFixture(`index/${indexName}`), 'utf8');
  fs.writeFileSync(path.join(root, 'package.json'), readFixture('package.json'), 'utf8');
  fs.mkdirSync(path.join(root, 'utils'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'utils/create-resolvers.ts'),
    readFixture('stubs/create-resolvers.ts'),
    'utf8'
  );

  linkGraphql(root);

  return root;
}

function testConfig(bffRoot) {
  return {
    projects: { bffAdmin: bffRoot, bffMls: bffRoot },
    timeouts: { default: 1000 },
    runsDir: fs.mkdtempSync(path.join(os.tmpdir(), 'bff-runs-')),
  };
}

test('validateManifestForStage accepts stage 3 with stage 2 fields', () => {
  assert.doesNotThrow(() => validateManifestForStage(queryManifest, 3));
});

test('checkResolverFieldName PASS for valid query resolver', () => {
  const source = readFixture('resolvers/query-valid.ts');
  const check = checkResolverFieldName(source, queryManifest);

  assert.equal(check.passed, true);
  assert.equal(extractResolverFieldName(source, 'query'), 'demoListing');
});

test('checkResolverFieldName FAIL for wrong field name', () => {
  const source = readFixture('resolvers/query-wrong-name.ts');
  const check = checkResolverFieldName(source, queryManifest);

  assert.equal(check.passed, false);
  assert.match(check.detail, /field name mismatch/);
});

test('checkResolverRegistration FAIL for unregistered resolver', () => {
  const bffRoot = createBffFixture({
    manifest: queryManifest,
    resolverName: 'query-valid',
    gqlName: 'valid-query.gql',
    indexName: 'unregistered.ts',
  });
  const source = readFixture('resolvers/query-valid.ts');
  const check = checkResolverRegistration(bffRoot, source);

  assert.equal(check.passed, false);
  assert.match(check.detail, /mergeResolvers/);
});

test('checkResolverRegistration FAIL when resolver only mentioned in comment', () => {
  const bffRoot = createBffFixture({
    manifest: queryManifest,
    resolverName: 'query-valid',
    gqlName: 'valid-query.gql',
    indexName: 'comment-only.ts',
  });
  const source = readFixture('resolvers/query-valid.ts');
  const check = checkResolverRegistration(bffRoot, source);

  assert.equal(check.passed, false);
});

test('checkVoidMutationReturn PASS for Boolean mutation with return true', async () => {
  const bffRoot = createBffFixture({
    manifest: mutationManifest,
    resolverName: 'mutation-valid',
    gqlName: 'void-mutation.gql',
  });
  const source = readFixture('resolvers/mutation-valid.ts');
  const graphql = await loadGraphql(bffRoot);
  const check = checkVoidMutationReturn(bffRoot, source, mutationManifest, graphql);

  assert.equal(check.passed, true);
});

test('checkVoidMutationReturn FAIL when Boolean mutation lacks return true', async () => {
  const bffRoot = createBffFixture({
    manifest: mutationManifest,
    resolverName: 'mutation-no-return-true',
    gqlName: 'void-mutation.gql',
  });
  const source = readFixture('resolvers/mutation-no-return-true.ts');
  const graphql = await loadGraphql(bffRoot);
  const check = checkVoidMutationReturn(bffRoot, source, mutationManifest, graphql);

  assert.equal(check.passed, false);
  assert.match(check.detail, /return true/);
});

test('runResolverGate PASS for valid query resolver without type-check and lint', async () => {
  const bffRoot = createBffFixture({
    manifest: queryManifest,
    resolverName: 'query-valid',
    gqlName: 'valid-query.gql',
  });
  const config = testConfig(bffRoot);

  const checks = await runResolverGate(config, queryManifest, {
    skipTypeCheck: true,
    skipLint: true,
  });

  assert.equal(aggregateStatus(checks), STATUS.PASS);
});

test('runResolverGate FAIL for wrong field name', async () => {
  const bffRoot = createBffFixture({
    manifest: queryManifest,
    resolverName: 'query-wrong-name',
    gqlName: 'valid-query.gql',
  });
  const config = testConfig(bffRoot);

  const checks = await runResolverGate(config, queryManifest, {
    skipTypeCheck: true,
    skipLint: true,
  });

  assert.equal(aggregateStatus(checks), STATUS.FAIL);
  assert.ok(checks.some((check) => check.id === 'resolver-field-name' && !check.passed));
});

test('runResolverGate FAIL for unregistered resolver', async () => {
  const bffRoot = createBffFixture({
    manifest: queryManifest,
    resolverName: 'query-valid',
    gqlName: 'valid-query.gql',
    indexName: 'unregistered.ts',
  });
  const config = testConfig(bffRoot);

  const checks = await runResolverGate(config, queryManifest, {
    skipTypeCheck: true,
    skipLint: true,
  });

  assert.equal(aggregateStatus(checks), STATUS.FAIL);
  assert.ok(checks.some((check) => check.id === 'resolver-registration' && !check.passed));
});

test('runResolverGate FAIL for void mutation without return true', async () => {
  const bffRoot = createBffFixture({
    manifest: mutationManifest,
    resolverName: 'mutation-no-return-true',
    gqlName: 'void-mutation.gql',
  });
  const config = testConfig(bffRoot);

  const checks = await runResolverGate(config, mutationManifest, {
    skipTypeCheck: true,
    skipLint: true,
  });

  assert.equal(aggregateStatus(checks), STATUS.FAIL);
  assert.ok(checks.some((check) => check.id === 'void-mutation-return' && !check.passed));
});

test('runResolverGate FAIL when type-check fails', async () => {
  const bffRoot = createBffFixture({
    manifest: queryManifest,
    resolverName: 'query-valid',
    gqlName: 'valid-query.gql',
  });
  const config = testConfig(bffRoot);

  const checks = await runResolverGate(config, queryManifest, {
    skipLint: true,
    exec: async (command, args) => {
      if (command === 'npm' && args[0] === 'run' && args[1] === 'type-check') {
        return { code: 1, stdout: '', stderr: 'type error in resolver', timedOut: false };
      }

      return { code: 0, stdout: '', stderr: '', timedOut: false };
    },
  });

  assert.equal(aggregateStatus(checks), STATUS.FAIL);
  assert.ok(checks.some((check) => check.id === 'type-check' && !check.passed));
});

test('runResolverGate FAIL when resolver lint fails', async () => {
  const bffRoot = createBffFixture({
    manifest: queryManifest,
    resolverName: 'query-valid',
    gqlName: 'valid-query.gql',
  });
  const config = testConfig(bffRoot);

  const checks = await runResolverGate(config, queryManifest, {
    skipTypeCheck: true,
    exec: async (command, args) => {
      if (command === 'npx' && args[0] === 'eslint') {
        return { code: 1, stdout: 'resolver lint failed', stderr: '', timedOut: false };
      }

      return { code: 0, stdout: '', stderr: '', timedOut: false };
    },
  });

  assert.equal(aggregateStatus(checks), STATUS.FAIL);
  assert.ok(checks.some((check) => check.id === 'resolver-lint' && !check.passed));
});

test('runResolverAstChecks returns multiple independent failures', async () => {
  const bffRoot = createBffFixture({
    manifest: mutationManifest,
    resolverName: 'mutation-no-return-true',
    gqlName: 'void-mutation.gql',
    indexName: 'unregistered.ts',
  });
  const source = readFixture('resolvers/mutation-no-return-true.ts');
  const graphql = await loadGraphql(bffRoot);
  const checks = runResolverAstChecks(bffRoot, source, mutationManifest, graphql);
  const failed = checks.filter((check) => !check.passed);

  assert.ok(failed.length >= 2);
});

test('checkResolverFile FAIL when resolver file missing', () => {
  const bffRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bff-resolver-gate-empty-'));
  const check = checkResolverFile(bffRoot, queryManifest);

  assert.equal(check.passed, false);
  assert.match(check.detail, /not found/);
});
