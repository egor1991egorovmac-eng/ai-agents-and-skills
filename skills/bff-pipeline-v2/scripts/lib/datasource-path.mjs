import fs from 'node:fs';
import path from 'node:path';

import { createCheck } from './result.mjs';

export function resolveDataSourcePath(bffRoot, service) {
  const relPath = path.join('src/data-sources', `${service}-api.ts`);
  const absPath = path.join(bffRoot, relPath);

  return { relPath, absPath };
}

export function resolveDataSourcesIndexPath(bffRoot) {
  const relPath = path.join('src/data-sources', 'index.ts');
  const absPath = path.join(bffRoot, relPath);

  return { relPath, absPath };
}

export function checkDataSourceFile(bffRoot, service) {
  const { relPath, absPath } = resolveDataSourcePath(bffRoot, service);

  if (!fs.existsSync(absPath)) {
    return createCheck('datasource-file', false, `expected datasource file not found: ${relPath}`);
  }

  return createCheck('datasource-file', true, relPath);
}

export function extractExportedClassName(source) {
  const match = source.match(/export\s+class\s+(\w+)/);

  return match?.[1] ?? null;
}

export function resolveDataSourceKey(indexSource, className) {
  if (!className) {
    return null;
  }

  const match = indexSource.match(new RegExp(`(\\w+)\\s*:\\s*new\\s+${className}\\s*\\(`));

  return match?.[1] ?? null;
}

export function resolveE2eDataSource(bffRoot, manifest) {
  const { absPath } = resolveDataSourcePath(bffRoot, manifest.service);

  if (!fs.existsSync(absPath)) {
    return null;
  }

  const className = extractExportedClassName(fs.readFileSync(absPath, 'utf8'));
  const { absPath: indexPath } = resolveDataSourcesIndexPath(bffRoot);
  const dataSourceKey = manifest.dataSourceKey
    ? manifest.dataSourceKey
    : fs.existsSync(indexPath)
      ? resolveDataSourceKey(fs.readFileSync(indexPath, 'utf8'), className)
      : null;

  if (!className || !dataSourceKey) {
    return null;
  }

  return {
    className,
    dataSourceKey,
    importPath: `data-sources/${manifest.service}-api`,
  };
}

export function resolveE2eDataSourceKey(bffRoot, manifest) {
  return resolveE2eDataSource(bffRoot, manifest)?.dataSourceKey ?? null;
}
