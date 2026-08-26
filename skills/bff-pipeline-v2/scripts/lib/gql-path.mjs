import fs from 'node:fs';
import path from 'node:path';

import { createCheck } from './result.mjs';

export function toKebabCase(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

export function operationDirName(kind, operation) {
  return `${kind}-${toKebabCase(operation)}`;
}

export function resolveGqlPath(bffRoot, { domain, kind, operation }) {
  const dirName = operationDirName(kind, operation);
  const fileName = `${dirName}.gql`;
  const relPath = path.join('src/graph', domain, dirName, fileName);
  const absPath = path.join(bffRoot, relPath);

  return { relPath, absPath, dirName, fileName };
}

export function checkPathConvention(bffRoot, manifest) {
  const { relPath, absPath } = resolveGqlPath(bffRoot, manifest);

  if (!fs.existsSync(absPath)) {
    return createCheck('path-convention', false, `expected gql file not found: ${relPath}`);
  }

  return createCheck('path-convention', true, relPath);
}
