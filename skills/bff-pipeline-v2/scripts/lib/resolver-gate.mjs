import fs from 'node:fs';
import path from 'node:path';

import { resolveStackRoots } from './config.mjs';
import { runCommand } from './exec.mjs';
import { loadGraphql } from './graphql-loader.mjs';
import { runResolverAstChecks } from './resolver-ast.mjs';
import { checkResolverFile, resolveResolverPath } from './resolver-path.mjs';
import { createCheck } from './result.mjs';

function allPassed(checks) {
  return checks.every((check) => check.passed);
}

export async function runTypeCheck({ bffRoot, timeoutMs }, { exec = runCommand } = {}) {
  const result = await exec('npm', ['run', 'type-check'], { cwd: bffRoot, timeoutMs });

  if (result.timedOut) {
    return createCheck('type-check', false, 'npm run type-check timed out', { blocked: true });
  }

  if (result.code !== 0) {
    const excerpt = (result.stderr || result.stdout || 'type-check failed')
      .trim()
      .split('\n')
      .slice(-8)
      .join('\n');

    return createCheck('type-check', false, excerpt);
  }

  return createCheck('type-check', true, 'npm run type-check');
}

export async function runResolverLint(
  { bffRoot, resolverAbsPath, timeoutMs },
  { exec = runCommand } = {}
) {
  const relPath = path.relative(bffRoot, resolverAbsPath);
  const result = await exec('npx', ['eslint', relPath], { cwd: bffRoot, timeoutMs });

  if (result.timedOut) {
    return createCheck('resolver-lint', false, 'eslint timed out', { blocked: true });
  }

  if (result.code !== 0) {
    const excerpt = (result.stdout || result.stderr || 'eslint failed')
      .trim()
      .split('\n')
      .slice(0, 5)
      .join('\n');

    return createCheck('resolver-lint', false, excerpt);
  }

  return createCheck('resolver-lint', true, relPath);
}

export async function runResolverGate(config, manifest, deps = {}) {
  const exec = deps.exec ?? runCommand;
  const { bffRoot } = resolveStackRoots(config, manifest.stack);
  const timeoutMs = config.timeouts?.default ?? 120000;
  const checks = [];

  const fileCheck = checkResolverFile(bffRoot, manifest);
  checks.push(fileCheck);

  if (!fileCheck.passed) {
    return checks;
  }

  const { absPath } = resolveResolverPath(bffRoot, manifest);
  const resolverSource = fs.readFileSync(absPath, 'utf8');
  const graphql = deps.graphql ?? (await loadGraphql(bffRoot));

  checks.push(...runResolverAstChecks(bffRoot, resolverSource, manifest, graphql));

  if (!allPassed(checks)) {
    return checks;
  }

  if (!deps.skipTypeCheck) {
    checks.push(await runTypeCheck({ bffRoot, timeoutMs }, { exec }));
  }

  if (!allPassed(checks)) {
    return checks;
  }

  if (!deps.skipLint) {
    checks.push(await runResolverLint({ bffRoot, resolverAbsPath: absPath, timeoutMs }, { exec }));
  }

  return checks;
}
