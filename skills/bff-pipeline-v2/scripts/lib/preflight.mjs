import fs from 'node:fs';
import path from 'node:path';

import { runCommand } from './exec.mjs';
import { createCheck } from './result.mjs';

const API_SCHEMA_RE = /lib-schema#([0-9.]+)/;

export function readApiSchemaPin(bffRoot) {
  const packagePath = path.join(bffRoot, 'package.json');

  if (!fs.existsSync(packagePath)) {
    throw new Error(`package.json not found: ${packagePath}`);
  }

  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const dep =
    pkg.devDependencies?.['@realt-by/api-schema'] ?? pkg.dependencies?.['@realt-by/api-schema'];

  if (!dep) {
    throw new Error('@realt-by/api-schema dependency not found in package.json');
  }

  const match = dep.match(API_SCHEMA_RE);

  return match?.[1] ?? '';
}

export async function fetchLatestApiSchemaTag(remote, timeoutMs, exec = runCommand) {
  const result = await exec(
    'git',
    ['ls-remote', '--tags', '--refs', remote],
    { timeoutMs }
  );

  if (result.timedOut) {
    return { ok: false, reason: 'timeout', detail: 'git ls-remote timed out' };
  }

  if (result.code !== 0) {
    return {
      ok: false,
      reason: 'network',
      detail: (result.stderr || result.stdout || 'git ls-remote failed').trim(),
    };
  }

  const tags = result.stdout
    .split('\n')
    .map((line) => line.trim().split('/').pop())
    .filter((tag) => /^[0-9]+\.[0-9]+\.[0-9]+$/.test(tag))
    .sort((a, b) => compareSemver(a, b));

  const latest = tags.at(-1);

  if (!latest) {
    return { ok: false, reason: 'parse', detail: 'no semver tags found in lib-schema remote' };
  }

  return { ok: true, latest };
}

export async function checkApiSchema({ bffRoot, remote, timeoutMs }, { exec = runCommand } = {}) {
  const current = readApiSchemaPin(bffRoot);
  const remoteResult = await fetchLatestApiSchemaTag(remote, timeoutMs, exec);

  if (!remoteResult.ok) {
    return createCheck(
      'api-schema',
      false,
      `cannot verify api-schema remotely: ${remoteResult.detail}`,
      { blocked: remoteResult.reason === 'network' || remoteResult.reason === 'timeout' }
    );
  }

  const { latest } = remoteResult;

  if (current === latest) {
    return createCheck('api-schema', true, `api-schema: ${current} (latest)`);
  }

  return createCheck(
    'api-schema',
    false,
    `api-schema stale: ${current} → ${latest}. Ask the user whether to update; if yes, run preflight apply --confirm.`,
    { blocked: true }
  );
}

export async function applyApiSchema({ bffRoot, remote, timeoutMs }, { exec = runCommand } = {}) {
  const current = readApiSchemaPin(bffRoot);
  const remoteResult = await fetchLatestApiSchemaTag(remote, timeoutMs, exec);

  if (!remoteResult.ok) {
    return createCheck(
      'api-schema-apply',
      false,
      `cannot update api-schema: ${remoteResult.detail}`,
      { blocked: remoteResult.reason === 'network' || remoteResult.reason === 'timeout' }
    );
  }

  const { latest } = remoteResult;

  if (current === latest) {
    return createCheck('api-schema-apply', true, `api-schema already latest (${current})`);
  }

  const packagePath = path.join(bffRoot, 'package.json');
  const original = fs.readFileSync(packagePath, 'utf8');
  const updated = original.replace(/lib-schema#[0-9.]+/, `lib-schema#${latest}`);

  fs.writeFileSync(packagePath, updated, 'utf8');

  const install = await exec('npm', ['install'], {
    cwd: bffRoot,
    timeoutMs: Math.max(timeoutMs, 600000),
  });

  if (install.timedOut || install.code !== 0) {
    return createCheck(
      'api-schema-apply',
      false,
      `npm install failed after pin update:\n${install.stderr || install.stdout}`.trim(),
      { changedFiles: [packagePath] }
    );
  }

  return createCheck('api-schema-apply', true, `api-schema updated: ${current} → ${latest}`);
}

export async function runPreflightCheck(config, stack, deps = {}) {
  const exec = deps.exec ?? runCommand;
  const { bffRoot } = resolveStack(config, stack);

  return [
    await checkApiSchema(
      {
        bffRoot,
        remote: config.libSchemaRemote,
        timeoutMs: config.timeouts.gitRemote,
      },
      { exec }
    ),
  ];
}

export async function runPreflightApply(config, stack, { confirm = false } = {}, deps = {}) {
  if (!confirm) {
    return [
      createCheck(
        'preflight-apply',
        false,
        'preflight apply requires --confirm flag after user approval',
        { blocked: true }
      ),
    ];
  }

  const exec = deps.exec ?? runCommand;
  const { bffRoot } = resolveStack(config, stack);

  return [
    applyApiSchema(
      {
        bffRoot,
        remote: config.libSchemaRemote,
        timeoutMs: config.timeouts.gitRemote,
      },
      { exec }
    ),
  ];
}

function resolveStack(config, stack) {
  if (stack === 'bff-admin') {
    return { bffRoot: config.projects.bffAdmin };
  }

  if (stack === 'bff-mls') {
    return { bffRoot: config.projects.bffMls };
  }

  throw new Error(`unknown stack: ${stack}`);
}

function compareSemver(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);

  for (let i = 0; i < 3; i += 1) {
    if (pa[i] !== pb[i]) {
      return pa[i] - pb[i];
    }
  }

  return 0;
}
