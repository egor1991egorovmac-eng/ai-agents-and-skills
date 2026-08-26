import fs from 'node:fs';
import path from 'node:path';

import { resolveClientRoot } from './client-codegen-gate.mjs';
import { runCommand } from './exec.mjs';
import { runApolloAstChecks } from './apollo-ast.mjs';
import { checkApolloFile, resolveApolloPath } from './apollo-path.mjs';
import { createCheck } from './result.mjs';

const TSC_ERROR_LINE_RE = /error TS\d+/;
const ANSI_RE = /\u001B\[[0-9;]*m/g;

function allPassed(checks) {
  return checks.every((check) => check.passed);
}

export function stripAnsi(text) {
  return String(text ?? '').replace(ANSI_RE, '');
}

export function buildApolloCompactMeta({ client, apolloPath, hookName }) {
  return `client=${client} apollo=${apolloPath} hook=${hookName}`;
}

export function normalizeRelPath(filePath) {
  return String(filePath ?? '')
    .replaceAll('\\', '/')
    .replace(/^\.\//, '');
}

export function filterTscErrors(output, files) {
  const needles = (files ?? []).map(normalizeRelPath).filter(Boolean);
  const lines = stripAnsi(output).split(/\r?\n/);
  const errorLines = lines.filter((line) => TSC_ERROR_LINE_RE.test(line));

  if (needles.length === 0) {
    return errorLines;
  }

  return errorLines.filter((line) => {
    const normalized = line.replaceAll('\\', '/');

    return needles.some((file) => normalized.includes(file));
  });
}

export async function runClientTypeCheck(
  { clientRoot, timeoutMs, files = [] },
  { exec = runCommand } = {}
) {
  const result = await exec('npm', ['run', 'type-check'], { cwd: clientRoot, timeoutMs });

  if (result.timedOut) {
    return createCheck('client-type-check', false, 'npm run type-check timed out', { blocked: true });
  }

  const output = stripAnsi(`${result.stdout ?? ''}\n${result.stderr ?? ''}`);

  if (result.code === 0) {
    return createCheck('client-type-check', true, 'npm run type-check');
  }

  const scopedFiles = (files ?? []).map(normalizeRelPath).filter(Boolean);
  const scopedErrors = filterTscErrors(output, scopedFiles);

  if (scopedFiles.length > 0 && scopedErrors.length === 0) {
    const ignored = filterTscErrors(output, []).length;

    return createCheck(
      'client-type-check',
      true,
      `${scopedFiles.join(', ')} clean; ignored ${ignored} other tsc errors`
    );
  }

  const excerpt = (scopedErrors.length ? scopedErrors : output.trim().split('\n'))
    .slice(0, 8)
    .join('\n');

  return createCheck('client-type-check', false, excerpt || 'type-check failed');
}

export async function runApolloLint(
  { clientRoot, apolloAbsPath, timeoutMs },
  { exec = runCommand } = {}
) {
  const relPath = path.relative(clientRoot, apolloAbsPath);
  const result = await exec('npx', ['eslint', relPath], { cwd: clientRoot, timeoutMs });

  if (result.timedOut) {
    return createCheck('apollo-lint', false, 'eslint timed out', { blocked: true });
  }

  if (result.code !== 0) {
    const excerpt = (result.stdout || result.stderr || 'eslint failed')
      .trim()
      .split('\n')
      .slice(0, 5)
      .join('\n');

    return createCheck('apollo-lint', false, excerpt);
  }

  return createCheck('apollo-lint', true, relPath);
}

export async function runApolloGate(config, manifest, deps = {}) {
  const exec = deps.exec ?? runCommand;
  const timeoutMs = config.timeouts?.default ?? 120000;
  const checks = [];
  let typeCheckRan = false;
  let lintRan = false;

  const clientRoot = deps.clientRoot ?? resolveClientRoot(config, manifest.client);
  const fileCheck = checkApolloFile(clientRoot, manifest);

  checks.push(fileCheck);

  if (!fileCheck.passed) {
    return { checks, apolloMeta: buildApolloMeta(manifest, null) };
  }

  const { relPath, absPath } = resolveApolloPath(clientRoot, manifest);
  const apolloSource = fs.readFileSync(absPath, 'utf8');

  checks.push(...runApolloAstChecks(apolloSource, manifest));

  if (!allPassed(checks)) {
    return { checks, apolloMeta: buildApolloMeta(manifest, absPath) };
  }

  if (!deps.skipTypeCheck) {
    typeCheckRan = true;
    checks.push(await runClientTypeCheck({ clientRoot, timeoutMs, files: [relPath] }, { exec }));
  }

  if (!allPassed(checks)) {
    return { checks: finalizeChecks(checks, typeCheckRan, lintRan), apolloMeta: buildApolloMeta(manifest, absPath) };
  }

  if (!deps.skipLint) {
    lintRan = true;
    checks.push(await runApolloLint({ clientRoot, apolloAbsPath: absPath, timeoutMs }, { exec }));
  }

  return {
    checks: finalizeChecks(checks, typeCheckRan, lintRan),
    apolloMeta: buildApolloMeta(manifest, absPath),
  };
}

function buildApolloMeta(manifest, absPath) {
  return {
    client: manifest.client,
    apolloPath: manifest.apolloPath,
    hookName: manifest.hookName,
    compactMeta: buildApolloCompactMeta({
      client: manifest.client,
      apolloPath: manifest.apolloPath,
      hookName: manifest.hookName,
    }),
    absPath,
  };
}

function finalizeChecks(checks, typeCheckRan, lintRan) {
  const finalized = [...checks];

  if (!typeCheckRan) {
    finalized.push(createCheck('client-type-check', false, 'client type-check did not run'));
  }

  if (!lintRan) {
    finalized.push(createCheck('apollo-lint', false, 'apollo lint did not run'));
  }

  return finalized;
}
