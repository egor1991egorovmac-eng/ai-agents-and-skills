import fs from 'node:fs';
import path from 'node:path';

import { createCheck } from './result.mjs';
import { operationDirName } from './gql-path.mjs';

export function resolveResolverPath(bffRoot, { domain, kind, operation }) {
  const dirName = operationDirName(kind, operation);
  const fileName = `${dirName}-resolver.ts`;
  const relPath = path.join('src/graph', domain, dirName, fileName);
  const absPath = path.join(bffRoot, relPath);

  return { relPath, absPath, dirName, fileName };
}

export function resolveResolversIndexPath(bffRoot) {
  const relPath = path.join('src/graph', 'resolvers.ts');
  const absPath = path.join(bffRoot, relPath);

  return { relPath, absPath };
}

export function checkResolverFile(bffRoot, manifest) {
  const { relPath, absPath } = resolveResolverPath(bffRoot, manifest);

  if (!fs.existsSync(absPath)) {
    return createCheck('resolver-file', false, `expected resolver file not found: ${relPath}`);
  }

  return createCheck('resolver-file', true, relPath);
}

export function extractExportedResolverName(source) {
  const match = source.match(/export\s+const\s+(\w+Resolver)\s*=/);

  return match?.[1] ?? null;
}
