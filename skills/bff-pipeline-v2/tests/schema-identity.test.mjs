import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  checkBffTargetIdentity,
  resolveLocalSchemaFingerprint,
  resolveRemoteSchemaFingerprint,
} from '../scripts/lib/schema-identity.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const identityArgs = {
  bffRoot: '/workspace/bff',
  bffTarget: 'https://workspace.test/graphql',
  timeoutMs: 1000,
  headers: { 'Content-Type': 'application/json' },
};

test('checkBffTargetIdentity PASS when live and local schema fingerprints match', async () => {
  const check = await checkBffTargetIdentity(identityArgs, {
    resolveLocalFingerprint: async () => 'same-fingerprint',
    resolveRemoteFingerprint: async () => ({ ok: true, fingerprint: 'same-fingerprint' }),
  });

  assert.equal(check.passed, true);
  assert.equal(check.id, 'bff-target-identity');
});

test('checkBffTargetIdentity BLOCKED when live schema differs from workspace schema', async () => {
  const check = await checkBffTargetIdentity(identityArgs, {
    resolveLocalFingerprint: async () => 'local-fingerprint',
    resolveRemoteFingerprint: async () => ({ ok: true, fingerprint: 'live-fingerprint' }),
  });

  assert.equal(check.passed, false);
  assert.equal(check.blocked, true);
  assert.match(check.detail, /identity mismatch/i);
  assert.match(check.detail, /restart BFF/i);
});

test('checkBffTargetIdentity distinguishes TLS failure from identity mismatch', async () => {
  const check = await checkBffTargetIdentity(identityArgs, {
    resolveLocalFingerprint: async () => 'local-fingerprint',
    resolveRemoteFingerprint: async () => ({
      ok: false,
      kind: 'tls',
      detail: 'unable to verify certificate',
    }),
  });

  assert.equal(check.blocked, true);
  assert.match(check.detail, /TLS/);
  assert.doesNotMatch(check.detail, /identity mismatch/i);
});

test('checkBffTargetIdentity distinguishes network failure from identity mismatch', async () => {
  const check = await checkBffTargetIdentity(identityArgs, {
    resolveLocalFingerprint: async () => 'local-fingerprint',
    resolveRemoteFingerprint: async () => ({
      ok: false,
      kind: 'network',
      detail: 'ECONNREFUSED',
    }),
  });

  assert.equal(check.blocked, true);
  assert.match(check.detail, /network/i);
  assert.doesNotMatch(check.detail, /identity mismatch/i);
});

test('local SDL and live introspection produce the same real schema fingerprint', async () => {
  const config = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../config/default.config.json'), 'utf8')
  );
  const requireFromBff = createRequire(path.join(config.projects.bffAdmin, 'package.json'));
  const runtime = {
    graphql: requireFromBff('graphql'),
    loadFilesSync: requireFromBff('@graphql-tools/load-files').loadFilesSync,
    mergeTypeDefs: requireFromBff('@graphql-tools/merge').mergeTypeDefs,
  };
  const bffRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bff-schema-identity-'));
  const sdl = 'type Query { health: String! }\n';

  fs.mkdirSync(path.join(bffRoot, 'src'), { recursive: true });
  fs.writeFileSync(path.join(bffRoot, 'src/schema.gql'), sdl);

  const localFingerprint = resolveLocalSchemaFingerprint(bffRoot, { runtime });
  const schema = runtime.graphql.buildSchema(sdl);
  const introspection = runtime.graphql.introspectionFromSchema(schema);
  const remote = await resolveRemoteSchemaFingerprint(
    {
      bffRoot,
      bffTarget: 'https://workspace.test/graphql',
      timeoutMs: 1000,
      headers: { 'Content-Type': 'application/json' },
    },
    {
      runtime,
      fetchFn: async () => ({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: introspection }),
      }),
    }
  );

  assert.equal(remote.ok, true);
  assert.equal(remote.fingerprint, localFingerprint);
});
