import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { EXIT, exitCodeForStatus, STATUS } from '../scripts/lib/exit-codes.mjs';
import { validateManifest } from '../scripts/lib/manifest.mjs';
import {
  checkApiSchema,
  applyApiSchema,
  runPreflightApply,
  runPreflightCheck,
} from '../scripts/lib/preflight.mjs';
import { aggregateStatus, buildResult } from '../scripts/lib/result.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

function mockExec(responses) {
  const calls = [];

  return {
    calls,
    fn: async (command, args) => {
      calls.push({ command, args });

      const key = `${command} ${args.join(' ')}`;

      if (responses[key]) {
        return responses[key];
      }

      return { code: 1, stdout: '', stderr: `unexpected command: ${key}`, timedOut: false };
    },
  };
}

test('validateManifest rejects missing fields', () => {
  assert.throws(
    () => validateManifest({ operation: 'x', kind: 'query' }),
    /missing required fields/
  );
});

test('checkApiSchema PASS when pin equals latest remote tag', async () => {
  const bffRoot = path.join(fixturesDir, 'bff-latest');
  const exec = mockExec({
    'git ls-remote --tags --refs git@example.com/lib-schema.git': {
      code: 0,
      stdout: 'abc\trefs/tags/9.9.9\n',
      stderr: '',
      timedOut: false,
    },
  });

  const check = await checkApiSchema(
    { bffRoot, remote: 'git@example.com/lib-schema.git', timeoutMs: 1000 },
    { exec: exec.fn }
  );

  assert.equal(check.passed, true);
  assert.equal(check.id, 'api-schema');
});

test('checkApiSchema BLOCKED when pin is stale and asks to update', async () => {
  const bffRoot = path.join(fixturesDir, 'bff-stale');
  const exec = mockExec({
    'git ls-remote --tags --refs git@example.com/lib-schema.git': {
      code: 0,
      stdout: 'abc\trefs/tags/9.9.9\n',
      stderr: '',
      timedOut: false,
    },
  });

  const check = await checkApiSchema(
    { bffRoot, remote: 'git@example.com/lib-schema.git', timeoutMs: 1000 },
    { exec: exec.fn }
  );

  assert.equal(check.passed, false);
  assert.equal(check.blocked, true);
  assert.match(check.detail, /stale/);
  assert.match(check.detail, /Ask the user whether to update/);
});

test('checkApiSchema BLOCKED on network failure', async () => {
  const bffRoot = path.join(fixturesDir, 'bff-latest');
  const exec = mockExec({
    'git ls-remote --tags --refs git@example.com/lib-schema.git': {
      code: 128,
      stdout: '',
      stderr: 'Could not resolve host',
      timedOut: false,
    },
  });

  const check = await checkApiSchema(
    { bffRoot, remote: 'git@example.com/lib-schema.git', timeoutMs: 1000 },
    { exec: exec.fn }
  );

  assert.equal(check.passed, false);
  assert.equal(check.blocked, true);
});

test('runPreflightCheck aggregates api-schema result', async () => {
  const config = {
    libSchemaRemote: 'git@example.com/lib-schema.git',
    timeouts: { gitRemote: 1000 },
    projects: {
      bffMls: path.join(fixturesDir, 'bff-latest'),
      graphifyVault: path.join(fixturesDir, 'vault-with-graph'),
    },
  };

  const exec = mockExec({
    'git ls-remote --tags --refs git@example.com/lib-schema.git': {
      code: 0,
      stdout: 'abc\trefs/tags/9.9.9\n',
      stderr: '',
      timedOut: false,
    },
  });

  const checks = await runPreflightCheck(config, 'bff-mls', { exec: exec.fn });

  assert.equal(checks.length, 1);
  assert.equal(checks[0].id, 'api-schema');
  assert.equal(aggregateStatus(checks), STATUS.PASS);
});

test('runPreflightApply without confirm returns BLOCKED', async () => {
  const config = {
    libSchemaRemote: 'git@example.com/lib-schema.git',
    timeouts: { gitRemote: 1000, graphifyUpdate: 1000 },
    projects: {
      bffMls: path.join(fixturesDir, 'bff-latest'),
      graphifyVault: path.join(fixturesDir, 'vault-with-graph'),
    },
  };

  const checks = await runPreflightApply(config, 'bff-mls', { confirm: false });

  assert.equal(checks.length, 1);
  assert.equal(checks[0].blocked, true);
  assert.match(checks[0].detail, /--confirm/);
});

test('exit codes map to PASS FAIL BLOCKED', () => {
  assert.equal(exitCodeForStatus(STATUS.PASS), EXIT.PASS);
  assert.equal(exitCodeForStatus(STATUS.FAIL), EXIT.FAIL);
  assert.equal(exitCodeForStatus(STATUS.BLOCKED), EXIT.BLOCKED);
});

test('applyApiSchema reports changedFiles when npm install fails', async () => {
  const sourceRoot = path.join(fixturesDir, 'bff-stale');
  const bffRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bff-apply-fail-'));
  fs.cpSync(sourceRoot, bffRoot, { recursive: true });

  const packagePath = path.join(bffRoot, 'package.json');

  const exec = mockExec({
    'git ls-remote --tags --refs git@example.com/lib-schema.git': {
      code: 0,
      stdout: 'abc\trefs/tags/9.9.9\n',
      stderr: '',
      timedOut: false,
    },
    'npm install': {
      code: 1,
      stdout: '',
      stderr: 'install failed',
      timedOut: false,
    },
  });

  const check = await applyApiSchema(
    { bffRoot, remote: 'git@example.com/lib-schema.git', timeoutMs: 1000 },
    { exec: exec.fn }
  );

  assert.equal(check.passed, false);
  assert.deepEqual(check.changedFiles, [packagePath]);
});

test('buildResult includes changedFiles on FAIL', () => {
  const packagePath = '/tmp/package.json';
  const result = buildResult({
    runId: 'test',
    stage: 0,
    status: STATUS.FAIL,
    checks: [
      {
        id: 'api-schema-apply',
        passed: false,
        changedFiles: [packagePath],
      },
    ],
  });

  assert.deepEqual(result.changedFiles, [packagePath]);
  assert.deepEqual(result.diagnostic.changedFiles, [packagePath]);
});
