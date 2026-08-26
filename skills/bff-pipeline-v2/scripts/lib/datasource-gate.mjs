import fs from 'node:fs';

import { resolveStackRoots } from './config.mjs';
import { runDataSourceAstChecks } from './datasource-ast.mjs';
import { checkDataSourceFile, resolveDataSourcePath } from './datasource-path.mjs';
import { runCommand } from './exec.mjs';
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

export async function runDataSourceGate(config, manifest, deps = {}) {
  const exec = deps.exec ?? runCommand;
  const { bffRoot } = resolveStackRoots(config, manifest.stack);
  const timeoutMs = config.timeouts?.default ?? 120000;
  const checks = [];

  const fileCheck = checkDataSourceFile(bffRoot, manifest.service);
  checks.push(fileCheck);

  if (!fileCheck.passed) {
    return checks;
  }

  const { absPath } = resolveDataSourcePath(bffRoot, manifest.service);
  const source = fs.readFileSync(absPath, 'utf8');

  checks.push(...runDataSourceAstChecks(bffRoot, source, manifest));

  if (!allPassed(checks)) {
    return checks;
  }

  if (!deps.skipTypeCheck) {
    checks.push(await runTypeCheck({ bffRoot, timeoutMs }, { exec }));
  }

  return checks;
}
