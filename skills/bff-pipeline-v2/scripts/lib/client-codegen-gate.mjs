import fs from 'node:fs';
import path from 'node:path';

import {
  buildClientCodegenCompactMeta,
  buildTypesDiff,
  buildCodegenEnv,
  checkClientForStack,
  checkCodegenSchemaSource,
  CODEGEN_FILE,
  findMissingTypes,
  findUnrelatedTypeChanges,
  loadClientTypeScript,
  TYPES_FILE,
} from './client-types-diff.mjs';
import { buildGraphqlHeaders } from './e2e-request.mjs';
import { runCommand } from './exec.mjs';
import { createCheck } from './result.mjs';
import { checkBffTargetIdentity } from './schema-identity.mjs';
import { resolveWorkspaceLinks } from './workspace-links.mjs';

export { resolveClientRoot } from './workspace-links.mjs';

function allPassed(checks) {
  return checks.every((check) => check.passed);
}

export async function runClientCodegen(
  { clientRoot, timeoutMs, env },
  { exec = runCommand } = {}
) {
  const result = await exec('npm', ['run', 'codegen'], { cwd: clientRoot, timeoutMs, env });

  if (result.timedOut) {
    return createCheck('client-codegen', false, 'npm run codegen timed out', { blocked: true });
  }

  if (result.code !== 0) {
    const excerpt = (result.stderr || result.stdout || 'codegen failed')
      .trim()
      .split('\n')
      .slice(-8)
      .join('\n');

    return createCheck('client-codegen', false, excerpt);
  }

  return createCheck('client-codegen', true, 'npm run codegen');
}

export function runClientTypesChecks({
  beforeSource,
  afterSource,
  expectedTypes,
  operation,
  typescript = null,
}) {
  const checks = [];
  const missing = findMissingTypes(afterSource, expectedTypes, typescript);

  checks.push(
    missing.length === 0
      ? createCheck('expected-types', true, expectedTypes.join(', '))
      : createCheck(
          'expected-types',
          false,
          `missing types for ${operation}: ${missing.join(', ')}`
        )
  );

  if (!allPassed(checks)) {
    return checks;
  }

  const unrelated = findUnrelatedTypeChanges(beforeSource, afterSource, expectedTypes, {
    operation,
    typescript,
  });

  if (unrelated.length === 0) {
    checks.push(createCheck('types-diff', true, 'only expected types changed'));
    return checks;
  }

  const fullDiff = buildTypesDiff(beforeSource, afterSource, typescript);
  const preview = unrelated.slice(0, 5).join(', ');
  const suffix = unrelated.length > 5 ? ` (+${unrelated.length - 5} more)` : '';

  checks.push(
    createCheck(
      'types-diff',
      false,
      `unrelated type changes: ${preview}${suffix}`,
      { blocked: true, fullDiff }
    )
  );

  return checks;
}

export async function readClientTypesBaseline(
  { clientRoot, currentSource },
  { exec = runCommand } = {}
) {
  const result = await exec('git', ['show', `HEAD:${TYPES_FILE}`], {
    cwd: clientRoot,
    timeoutMs: 10000,
  });

  if (result.code !== 0) {
    return {
      ok: false,
      detail: result.stderr || `git show HEAD:${TYPES_FILE} failed`,
    };
  }

  return { ok: true, source: result.stdout || currentSource };
}

export async function runClientCodegenGate(config, manifest, deps = {}) {
  const exec = deps.exec ?? runCommand;
  const timeoutMs = config.timeouts?.default ?? 120000;
  const checks = [];
  const { client, expectedTypes, operation } = manifest;

  const clientScope = checkClientForStack(client, manifest.stack);

  checks.push(
    clientScope.passed
      ? createCheck('client-scope', true, clientScope.detail)
      : createCheck('client-scope', false, clientScope.detail)
  );

  if (!clientScope.passed) {
    return { checks, clientMeta: { client, expectedTypes, compactMeta: null } };
  }

  const workspaceLinks =
    deps.workspaceLinks ?? resolveWorkspaceLinks(config, manifest, deps.env ?? process.env);
  const { bffRoot, clientRoot, bffTarget, env } = workspaceLinks;
  const codegenPath = path.join(clientRoot, CODEGEN_FILE);
  const typesPath = path.join(clientRoot, TYPES_FILE);

  if (!fs.existsSync(codegenPath)) {
    checks.push(createCheck('schema-source', false, `${CODEGEN_FILE} not found in ${clientRoot}`));
    return { checks, clientMeta: { client, expectedTypes, compactMeta: null } };
  }

  const codegenSource = fs.readFileSync(codegenPath, 'utf8');
  const schemaSource = checkCodegenSchemaSource(codegenSource, client, manifest.stack);

  checks.push(
    schemaSource.passed
      ? createCheck('schema-source', true, schemaSource.detail)
      : createCheck('schema-source', false, schemaSource.detail)
  );

  let codegenEnv = env;

  if (!bffTarget) {
    checks.push(createCheck('codegen-target', false, 'BFF Target required for client codegen'));
  } else {
    try {
      codegenEnv = buildCodegenEnv(bffTarget, env);
      checks.push(createCheck('codegen-target', true, bffTarget));
    } catch (error) {
      checks.push(createCheck('codegen-target', false, error.message));
    }
  }

  if (!allPassed(checks)) {
    return { checks, clientMeta: { client, expectedTypes, compactMeta: null } };
  }

  const identityCheckFn = deps.identityCheck ?? checkBffTargetIdentity;
  const identityCheck = await identityCheckFn(
    {
      bffRoot,
      bffTarget,
      timeoutMs: config.timeouts?.e2e ?? timeoutMs,
      headers: buildGraphqlHeaders(env),
    },
    { fetchFn: deps.fetchFn }
  );

  checks.push(identityCheck);

  if (!identityCheck.passed) {
    return { checks, clientMeta: { client, expectedTypes, compactMeta: null } };
  }

  let typescript;

  try {
    typescript = Object.hasOwn(deps, 'typescript')
      ? deps.typescript
      : loadClientTypeScript(clientRoot);
  } catch (error) {
    checks.push(createCheck('client-types-parser', false, `TypeScript parser unavailable: ${error.message}`));
    return { checks, clientMeta: { client, expectedTypes, compactMeta: null } };
  }

  const currentSource = fs.existsSync(typesPath) ? fs.readFileSync(typesPath, 'utf8') : '';
  const baseline = await readClientTypesBaseline(
    { clientRoot, currentSource },
    { exec: deps.gitExec ?? runCommand }
  );

  if (!baseline.ok) {
    checks.push(createCheck('client-types-baseline', false, baseline.detail, { blocked: true }));
    return { checks, clientMeta: { client, expectedTypes, compactMeta: null } };
  }

  const beforeSource = baseline.source;

  if (deps.writeAfterCodegen) {
    await deps.writeAfterCodegen(typesPath, currentSource);
  } else if (!deps.skipCodegen) {
    checks.push(await runClientCodegen({ clientRoot, timeoutMs, env: codegenEnv }, { exec }));

    if (!allPassed(checks)) {
      return { checks, clientMeta: { client, expectedTypes, compactMeta: null } };
    }
  }

  const afterSource = fs.existsSync(typesPath) ? fs.readFileSync(typesPath, 'utf8') : beforeSource;

  checks.push(...runClientTypesChecks({
    beforeSource,
    afterSource,
    expectedTypes,
    operation,
    typescript,
  }));

  const compactMeta = buildClientCodegenCompactMeta({ client, expectedTypes });

  return {
    checks,
    clientMeta: { client, expectedTypes, compactMeta },
  };
}
