import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  checkApiSchemaTypes,
  checkErrorHandling,
  checkHttpCall,
  checkMethodExists,
  checkServiceRegistration,
  extractMethodBody,
  runDataSourceAstChecks,
} from '../scripts/lib/datasource-ast.mjs';
import { checkDataSourceFile } from '../scripts/lib/datasource-path.mjs';
import { STATUS } from '../scripts/lib/exit-codes.mjs';
import { validateManifestForStage } from '../scripts/lib/manifest.mjs';
import { aggregateStatus } from '../scripts/lib/result.mjs';
import { runDataSourceGate } from '../scripts/lib/datasource-gate.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures/datasource-gate');
const schemaFixturesDir = path.join(__dirname, 'fixtures/schema-gate');

const baseManifest = {
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

function readFixture(relativePath) {
  return fs.readFileSync(path.join(fixturesDir, relativePath), 'utf8');
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

function createBffFixture({ datasourceName, indexName = 'registered.ts' }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bff-datasource-gate-'));
  const dataSourcesDir = path.join(root, 'src/data-sources');

  fs.mkdirSync(dataSourcesDir, { recursive: true });
  fs.writeFileSync(
    path.join(dataSourcesDir, 'demo-api.ts'),
    readFixture(`demo-api/${datasourceName}.ts`),
    'utf8'
  );
  fs.writeFileSync(
    path.join(dataSourcesDir, 'index.ts'),
    readFixture(`index/${indexName}`),
    'utf8'
  );
  fs.writeFileSync(
    path.join(dataSourcesDir, 'api-data-source-rest.ts'),
    readFixture('stubs/api-data-source-rest.ts'),
    'utf8'
  );
  fs.writeFileSync(path.join(root, 'package.json'), readFixture('package.json'), 'utf8');
  fs.mkdirSync(path.join(root, 'utils'), { recursive: true });
  fs.writeFileSync(path.join(root, 'utils/errors.ts'), readFixture('stubs/errors.ts'), 'utf8');

  copyDir(
    path.join(schemaFixturesDir, 'api-schema'),
    path.join(root, 'node_modules/@realt-by/api-schema')
  );

  return root;
}

function testConfig(bffRoot) {
  return {
    projects: { bffAdmin: bffRoot, bffMls: bffRoot },
    timeouts: { default: 1000 },
    runsDir: fs.mkdtempSync(path.join(os.tmpdir(), 'bff-runs-')),
  };
}

test('validateManifestForStage requires stage 2 fields', () => {
  assert.throws(
    () =>
      validateManifestForStage(
        {
          operation: 'x',
          kind: 'query',
          domain: 'd',
          stack: 'bff-admin',
          service: 'demo',
          endpoint: '/demo',
          apiResponseType: 'DemoItem',
        },
        2
      ),
    /stage 2 manifest missing required fields/
  );
});

test('validateManifestForStage requires dataSourceKey for newService', () => {
  assert.throws(
    () =>
      validateManifestForStage(
        {
          ...baseManifest,
          newService: true,
        },
        2
      ),
    /dataSourceKey/
  );
});

test('checkMethodExists PASS for valid datasource method', () => {
  const source = readFixture('demo-api/valid.ts');
  const check = checkMethodExists(source, 'getDemoListing');

  assert.equal(check.passed, true);
});

test('checkHttpCall FAIL for wrong endpoint', () => {
  const source = readFixture('demo-api/wrong-endpoint.ts');
  const body = extractMethodBody(source, 'getDemoListing');
  const check = checkHttpCall(body, 'POST', '/demo/listing');

  assert.equal(check.passed, false);
  assert.match(check.detail, /endpoint mismatch/);
});

test('checkErrorHandling FAIL when ApiDataSourceError missing', () => {
  const source = readFixture('demo-api/no-error-handling.ts');
  const body = extractMethodBody(source, 'getDemoListing');
  const check = checkErrorHandling(body);

  assert.equal(check.passed, false);
  assert.match(check.detail, /response\.success/);
});

test('checkApiSchemaTypes FAIL without @realt-by/api-schema import', () => {
  const source = readFixture('demo-api/no-error-handling.ts').replace(
    /@realt-by\/api-schema[^\n]*/g,
    ''
  );
  const body = extractMethodBody(source, 'getDemoListing');
  const check = checkApiSchemaTypes(source, body, 'DemoItem');

  assert.equal(check.passed, false);
  assert.match(check.detail, /@realt-by\/api-schema/);
});

test('checkServiceRegistration FAIL for unregistered new service', () => {
  const bffRoot = createBffFixture({ datasourceName: 'new-service', indexName: 'unregistered.ts' });
  const source = readFixture('demo-api/new-service.ts');
  const check = checkServiceRegistration(bffRoot, source, {
    ...baseManifest,
    newService: true,
    dataSourceKey: 'demoApi',
  });

  assert.equal(check.passed, false);
  assert.match(check.detail, /registered/);
});

test('runDataSourceGate PASS for valid datasource without type-check', async () => {
  const bffRoot = createBffFixture({ datasourceName: 'valid' });
  const config = testConfig(bffRoot);

  const checks = await runDataSourceGate(config, baseManifest, { skipTypeCheck: true });

  assert.equal(aggregateStatus(checks), STATUS.PASS);
});

test('runDataSourceGate FAIL for wrong endpoint', async () => {
  const bffRoot = createBffFixture({ datasourceName: 'wrong-endpoint' });
  const config = testConfig(bffRoot);

  const checks = await runDataSourceGate(config, baseManifest, { skipTypeCheck: true });

  assert.equal(aggregateStatus(checks), STATUS.FAIL);
  assert.ok(checks.some((check) => check.id === 'http-call' && !check.passed));
});

test('runDataSourceGate FAIL for missing error handling', async () => {
  const bffRoot = createBffFixture({ datasourceName: 'no-error-handling' });
  const config = testConfig(bffRoot);

  const checks = await runDataSourceGate(config, baseManifest, { skipTypeCheck: true });

  assert.equal(aggregateStatus(checks), STATUS.FAIL);
  assert.ok(checks.some((check) => check.id === 'error-handling' && !check.passed));
});

test('runDataSourceGate FAIL for unregistered new service', async () => {
  const bffRoot = createBffFixture({ datasourceName: 'new-service', indexName: 'unregistered.ts' });
  const config = testConfig(bffRoot);

  const checks = await runDataSourceGate(
    config,
    { ...baseManifest, newService: true, dataSourceKey: 'demoApi' },
    { skipTypeCheck: true }
  );

  assert.equal(aggregateStatus(checks), STATUS.FAIL);
  assert.ok(checks.some((check) => check.id === 'service-registration' && !check.passed));
});

test('runDataSourceGate FAIL when type-check fails', async () => {
  const bffRoot = createBffFixture({ datasourceName: 'valid' });
  const config = testConfig(bffRoot);

  const checks = await runDataSourceGate(config, baseManifest, {
    exec: async (command, args) => {
      if (command === 'npm' && args[0] === 'run' && args[1] === 'type-check') {
        return { code: 1, stdout: '', stderr: 'type error in demo-api.ts', timedOut: false };
      }

      return { code: 0, stdout: '', stderr: '', timedOut: false };
    },
  });

  assert.equal(aggregateStatus(checks), STATUS.FAIL);
  assert.ok(checks.some((check) => check.id === 'type-check' && !check.passed));
});

test('runDataSourceAstChecks returns multiple independent failures', () => {
  const bffRoot = createBffFixture({ datasourceName: 'no-error-handling' });
  const source = readFixture('demo-api/no-error-handling.ts');
  const checks = runDataSourceAstChecks(bffRoot, source, baseManifest);
  const failed = checks.filter((check) => !check.passed);

  assert.ok(failed.length >= 1);
  assert.ok(failed.some((check) => check.id === 'error-handling'));
});

test('checkDataSourceFile FAIL when service file missing', () => {
  const bffRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bff-datasource-gate-empty-'));
  const check = checkDataSourceFile(bffRoot, 'demo');

  assert.equal(check.passed, false);
  assert.match(check.detail, /not found/);
});
