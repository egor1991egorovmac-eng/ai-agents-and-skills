import fs from 'node:fs';

import { checkApiTypeFields } from './api-type-fields.mjs';
import { resolveStackRoots } from './config.mjs';
import { checkBreakingChange } from './gql-compat.mjs';
import { checkOperationAst, checkVoidMutation } from './gql-ast.mjs';
import { runCodegen, runGqlLint } from './gql-lint.mjs';
import { checkPathConvention, resolveGqlPath } from './gql-path.mjs';
import { loadGraphql } from './graphql-loader.mjs';
import { runCommand } from './exec.mjs';

function allPassed(checks) {
  return checks.every((check) => check.passed);
}

export async function runSchemaGate(config, manifest, deps = {}) {
  const exec = deps.exec ?? runCommand;
  const { bffRoot } = resolveStackRoots(config, manifest.stack);
  const runsDir = deps.runsDir ?? config.runsDir;
  const timeoutMs = config.timeouts?.default ?? 120000;
  const checks = [];

  const pathCheck = checkPathConvention(bffRoot, manifest);
  checks.push(pathCheck);

  if (!pathCheck.passed) {
    return checks;
  }

  const { relPath, absPath } = resolveGqlPath(bffRoot, manifest);
  const source = fs.readFileSync(absPath, 'utf8');
  const graphql = deps.graphql ?? (await loadGraphql(bffRoot));

  checks.push(checkOperationAst(source, manifest, graphql));
  checks.push(checkVoidMutation(source, manifest, graphql));
  checks.push(checkApiTypeFields({ bffRoot, source, manifest, graphql }));

  checks.push(
    await checkBreakingChange(
      { bffRoot, relPath, currentSource: source, manifest, graphql },
      { exec: deps.getBaseline ? undefined : exec, getBaseline: deps.getBaseline }
    )
  );

  if (!allPassed(checks)) {
    return checks;
  }

  if (!deps.skipCodegen) {
    checks.push(await runCodegen({ bffRoot, timeoutMs }, { exec }));
  }

  if (!allPassed(checks)) {
    return checks;
  }

  if (!deps.skipLint) {
    checks.push(
      await runGqlLint({ bffRoot, gqlAbsPath: absPath, timeoutMs, runsDir }, { exec })
    );
  }

  return checks;
}
