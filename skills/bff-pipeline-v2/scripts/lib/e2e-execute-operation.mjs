import fs from 'node:fs';
import path from 'node:path';

import { resolveE2eDataSource } from './datasource-path.mjs';
import { runCommand } from './exec.mjs';

export function buildExecuteOperationSource({
  className,
  importPath,
  dataSourceKey,
  httpMethod,
  e2eQuery,
  e2eVariables,
  e2eMockBody,
}) {
  const payload = JSON.stringify({
    dataSourceKey,
    httpMethod: String(httpMethod).toLowerCase(),
    e2eQuery,
    e2eVariables: e2eVariables ?? {},
    e2eMockBody: e2eMockBody ?? null,
  });

  return `import { ApolloServer } from '@apollo/server';

import { ${className} } from '${importPath}';
import { schema } from 'graph/schema';

const payload = ${payload} as {
  dataSourceKey: string;
  httpMethod: string;
  e2eQuery: string;
  e2eVariables: Record<string, unknown>;
  e2eMockBody: unknown;
};

async function main() {
  const api = new ${className}({ req: { headers: {} } as never }) as {
    [method: string]: unknown;
  };

  api[payload.httpMethod] = async () => ({
    success: true,
    errors: [],
    body: payload.e2eMockBody,
  });

  const dataSources = { [payload.dataSourceKey]: api };
  const server = new ApolloServer({ schema });

  await server.start();

  try {
    const result = await server.executeOperation(
      {
        query: payload.e2eQuery,
        variables: payload.e2eVariables,
      },
      {
        contextValue: { dataSources },
      }
    );

    if (result.body.kind !== 'single') {
      throw new Error('incremental GraphQL response is not supported');
    }

    process.stdout.write(JSON.stringify({
      ok: true,
      status: 200,
      body: result.body.singleResult,
    }));
  } finally {
    await server.stop();
  }
}

main().catch((error) => {
  process.stderr.write(String(error?.stack ?? error));
  process.exit(1);
});
`;
}

export async function executeOperationAgainstSchema(
  { bffRoot, manifest, timeoutMs },
  { exec = runCommand } = {}
) {
  const dataSource = resolveE2eDataSource(bffRoot, manifest);

  if (!dataSource) {
    return {
      ok: false,
      status: 0,
      text: 'cannot resolve dataSource for executeOperation',
      networkError: false,
    };
  }

  const cacheDir = path.join(bffRoot, '.bff-pipeline-cache');
  const scriptPath = path.join(cacheDir, 'e2e-execute-operation.ts');

  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(
    scriptPath,
    buildExecuteOperationSource({
      ...dataSource,
      httpMethod: manifest.httpMethod,
      e2eQuery: manifest.e2eQuery,
      e2eVariables: manifest.e2eVariables,
      e2eMockBody: manifest.e2eMockBody,
    })
  );

  try {
    const result = await exec(
      'node',
      [
        '--no-experimental-strip-types',
        '--require',
        'ts-node/register',
        '--require',
        'tsconfig-paths/register',
        scriptPath,
      ],
      {
        cwd: bffRoot,
        timeoutMs,
        env: {
          ...process.env,
          TS_NODE_TRANSPILE_ONLY: '1',
          NODE_PATH: path.join(bffRoot, 'node_modules'),
        },
      }
    );

    if (result.timedOut) {
      return {
        ok: false,
        networkError: true,
        timedOut: true,
        detail: `executeOperation timed out after ${timeoutMs}ms`,
      };
    }

    if (result.code !== 0) {
      return {
        ok: false,
        status: result.code ?? 1,
        text: (result.stderr || result.stdout || 'executeOperation failed').trim(),
        networkError: false,
      };
    }

    try {
      const parsed = JSON.parse(result.stdout);

      return {
        ok: true,
        status: parsed.status ?? 200,
        body: parsed.body,
        text: result.stdout,
        networkError: false,
      };
    } catch {
      return {
        ok: false,
        status: 200,
        text: result.stdout,
        invalidJson: true,
        networkError: false,
      };
    }
  } finally {
    fs.rmSync(scriptPath, { force: true });
  }
}
