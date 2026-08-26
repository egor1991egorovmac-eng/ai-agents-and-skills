import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

import { runCommand } from './exec.mjs';
import { createCheck } from './result.mjs';

const require = createRequire(import.meta.url);

function buildEslintConfig(bffRoot) {
  const schemaGlob = path.join(bffRoot, 'src/graph/**/*.gql').replace(/\\/g, '/');
  const codestyleGraphql = require.resolve('@realt-by/codestyle/eslint/graphql', {
    paths: [bffRoot],
  });
  const graphqlRules = require(codestyleGraphql);

  const override = graphqlRules.overrides[0];

  return `module.exports = {
  root: true,
  overrides: [
    {
      files: ${JSON.stringify(override.files)},
      parser: ${JSON.stringify(override.parser)},
      plugins: ${JSON.stringify([...(override.plugins ?? []), 'prettier'])},
      parserOptions: {
        schema: ${JSON.stringify(schemaGlob)},
      },
      rules: ${JSON.stringify(override.rules, null, 2)},
    },
  ],
};
`;
}

export async function runGqlLint(
  { bffRoot, gqlAbsPath, timeoutMs, runsDir },
  { exec = runCommand } = {}
) {
  let configPath;

  try {
    const configContent = buildEslintConfig(bffRoot);
    const cacheDir = path.join(bffRoot, 'node_modules/.cache/bff-pipeline');
    fs.mkdirSync(cacheDir, { recursive: true });
    configPath = path.join(cacheDir, `eslint-gql-${Date.now()}.cjs`);
    fs.writeFileSync(configPath, configContent, 'utf8');

    const relGql = path.relative(bffRoot, gqlAbsPath);
    const result = await exec(
      'npx',
      [
        'eslint',
        '--no-eslintrc',
        '-c',
        configPath,
        '--resolve-plugins-relative-to',
        bffRoot,
        relGql,
      ],
      { cwd: bffRoot, timeoutMs }
    );

    if (result.timedOut) {
      return createCheck('graphql-lint', false, 'eslint timed out', { blocked: true });
    }

    if (result.code !== 0) {
      const excerpt = (result.stdout || result.stderr || 'eslint failed').trim().split('\n').slice(0, 5).join('\n');
      return createCheck('graphql-lint', false, excerpt);
    }

    return createCheck('graphql-lint', true, relGql);
  } catch (error) {
    return createCheck('graphql-lint', false, error.message);
  } finally {
    if (configPath && fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
  }
}

export async function runCodegen({ bffRoot, timeoutMs }, { exec = runCommand } = {}) {
  const result = await exec('npm', ['run', 'codegen'], { cwd: bffRoot, timeoutMs });

  if (result.timedOut) {
    return createCheck('codegen', false, 'npm run codegen timed out', { blocked: true });
  }

  if (result.code !== 0) {
    const excerpt = (result.stderr || result.stdout || 'codegen failed').trim().split('\n').slice(-8).join('\n');
    return createCheck('codegen', false, excerpt);
  }

  return createCheck('codegen', true, 'npm run codegen');
}
