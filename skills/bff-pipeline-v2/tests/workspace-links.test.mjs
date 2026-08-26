import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { loadConfig } from '../scripts/lib/config.mjs';
import { resolveWorkspaceLinks } from '../scripts/lib/workspace-links.mjs';

const workspaceEnv = {
  BFF_PIPELINE_BFF_ROOT: '/workspace/bff-admin',
  BFF_PIPELINE_CLIENT_ROOT: '/workspace/admin',
  BFF_PIPELINE_BFF_TARGET: 'https://workspace.test/graphql',
  BFF_PIPELINE_GRAPHIFY_VAULT: '/workspace/vault',
  E2E_AUTH_TOKEN: 'workspace-token',
};

test('resolveWorkspaceLinks reads all stage links from workspace env', () => {
  const links = resolveWorkspaceLinks(
    {
      projects: {
        bffAdmin: '/config/bff-admin',
        admin: '/config/admin',
      },
    },
    {
      stack: 'bff-admin',
      client: 'admin',
      schemaUrl: 'https://manifest.test/graphql',
    },
    workspaceEnv
  );

  assert.equal(links.bffRoot, '/workspace/bff-admin');
  assert.equal(links.clientRoot, '/workspace/admin');
  assert.equal(links.bffTarget, 'https://workspace.test/graphql');
  assert.equal(links.env.E2E_AUTH_TOKEN, 'workspace-token');
});

test('resolveWorkspaceLinks rejects missing BFF Target', () => {
  assert.throws(
    () =>
      resolveWorkspaceLinks(
        { projects: {} },
        { stack: 'bff-admin', client: 'admin' },
        {
          BFF_PIPELINE_BFF_ROOT: '/workspace/bff-admin',
          BFF_PIPELINE_CLIENT_ROOT: '/workspace/admin',
        }
      ),
    /BFF_PIPELINE_BFF_TARGET/
  );
});

test('loadConfig overlays machine paths from workspace env', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bff-workspace-links-'));
  const configPath = path.join(dir, 'config.json');

  fs.writeFileSync(
    configPath,
    JSON.stringify({
      projects: {
        bffAdmin: '/config/bff-admin',
        bffMls: '/config/bff-mls',
        admin: '/config/admin',
        mls: '/config/mls',
        www: '/config/www',
        graphifyVault: '/config/vault',
      },
      runsDir: '~/.bff-pipeline/runs',
    })
  );

  const config = loadConfig(configPath, workspaceEnv);

  assert.equal(config.projects.bffAdmin, '/workspace/bff-admin');
  assert.equal(config.projects.bffMls, '/workspace/bff-admin');
  assert.equal(config.projects.admin, '/workspace/admin');
  assert.equal(config.projects.mls, '/workspace/admin');
  assert.equal(config.projects.www, '/workspace/admin');
  assert.equal(config.projects.graphifyVault, '/workspace/vault');
});
