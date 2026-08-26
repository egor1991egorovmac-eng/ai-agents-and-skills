import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { loadConfig } from '../scripts/lib/config.mjs';
import { loadManifest } from '../scripts/lib/manifest.mjs';
import {
  resolveDefaultManifestPath,
  resolveWorkspaceRoot,
  validateManifestPath,
} from '../scripts/lib/manifest-path.mjs';

function createTempConfig(projects) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bff-pipeline-manifest-'));
  const configPath = path.join(dir, 'config.json');

  fs.writeFileSync(
    configPath,
    JSON.stringify(
      {
        projects,
        timeouts: { default: 1000 },
        runsDir: path.join(dir, 'runs'),
        libSchemaRemote: 'git@example.com/lib-schema.git',
      },
      null,
      2
    )
  );

  return loadConfig(configPath);
}

const baseProjects = {
  bffMls: '/tmp/work/mls-project/bff-mls',
  bffAdmin: '/tmp/work/admin-project/bff-admin',
  bffWww: '/tmp/work/www-project/bff',
  mls: '/tmp/work/mls-project/mls',
  admin: '/tmp/work/admin-project/admin',
  www: '/tmp/work/www-project/www/apps/main',
};

test('resolveWorkspaceRoot maps stack to parent of bff project', () => {
  const config = createTempConfig(baseProjects);

  assert.equal(resolveWorkspaceRoot(config, 'bff-mls'), path.resolve('/tmp/work/mls-project'));
  assert.equal(resolveWorkspaceRoot(config, 'bff-admin'), path.resolve('/tmp/work/admin-project'));
});

test('resolveDefaultManifestPath points to workspace manifest.json', () => {
  const config = createTempConfig(baseProjects);

  assert.equal(
    resolveDefaultManifestPath(config, 'bff-mls'),
    path.resolve('/tmp/work/mls-project/manifest.json')
  );
  assert.equal(
    resolveDefaultManifestPath(config, 'bff-admin'),
    path.resolve('/tmp/work/admin-project/manifest.json')
  );
});

test('validateManifestPath rejects manifest inside bff project', () => {
  const config = createTempConfig(baseProjects);

  assert.throws(
    () =>
      validateManifestPath('/tmp/work/admin-project/bff-admin/manifest.json', config, 'bff-admin'),
    /must not live inside project directory/
  );
});

test('validateManifestPath rejects manifest inside client project', () => {
  const config = createTempConfig(baseProjects);

  assert.throws(
    () => validateManifestPath('/tmp/work/mls-project/mls/manifest.json', config, 'bff-mls'),
    /must not live inside project directory/
  );
});

test('validateManifestPath accepts workspace root manifest', () => {
  const config = createTempConfig(baseProjects);

  assert.doesNotThrow(() =>
    validateManifestPath('/tmp/work/mls-project/manifest.json', config, 'bff-mls')
  );
});

test('loadManifest validates workspace location for production manifest.json', () => {
  const config = createTempConfig(baseProjects);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bff-pipeline-manifest-load-'));
  const manifestPath = path.join(dir, 'manifest.json');

  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        operation: 'demoListing',
        kind: 'query',
        domain: 'demo',
        stack: 'bff-mls',
      },
      null,
      2
    )
  );

  assert.throws(
    () => loadManifest(manifestPath, { config }),
    /manifest must be at workspace root/
  );
});

test('loadManifest skips location validation for test fixtures', () => {
  const config = createTempConfig(baseProjects);
  const fixturePath = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    'fixtures/e2e-gate/manifest-query.json'
  );

  const manifest = loadManifest(fixturePath, { config });

  assert.equal(manifest.operation, 'demoListing');
});
