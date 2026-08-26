import path from 'node:path';

import { V2_ROOT } from './paths.mjs';

const STACK_BFF_PROJECT_KEY = {
  'bff-mls': 'bffMls',
  'bff-admin': 'bffAdmin',
};

const PROJECT_ROOT_KEYS = ['bffMls', 'bffAdmin', 'bffWww', 'mls', 'admin', 'www'];

export function resolveWorkspaceRoot(config, stack) {
  const projectKey = STACK_BFF_PROJECT_KEY[stack];

  if (!projectKey) {
    throw new Error(`unknown stack: ${stack}`);
  }

  const bffRoot = config.projects?.[projectKey];

  if (!bffRoot) {
    throw new Error(`config.projects.${projectKey} is not set`);
  }

  return path.dirname(path.resolve(bffRoot));
}

export function resolveDefaultManifestPath(config, stack) {
  return path.join(resolveWorkspaceRoot(config, stack), 'manifest.json');
}

export function isManifestFixturePath(resolvedPath) {
  const normalized = path.resolve(resolvedPath);
  const testsRoot = path.join(V2_ROOT, 'tests');

  return (
    normalized.startsWith(`${testsRoot}${path.sep}`) || path.basename(normalized) !== 'manifest.json'
  );
}

export function validateManifestPath(resolvedPath, config, stack) {
  if (isManifestFixturePath(resolvedPath)) {
    return;
  }

  const normalized = path.resolve(resolvedPath);
  const expectedPath = path.resolve(resolveDefaultManifestPath(config, stack));

  if (normalized === expectedPath) {
    return;
  }

  for (const key of PROJECT_ROOT_KEYS) {
    const projectRoot = config.projects?.[key];

    if (!projectRoot) {
      continue;
    }

    const normalizedProject = path.resolve(projectRoot);

    if (normalized === normalizedProject || normalized.startsWith(`${normalizedProject}${path.sep}`)) {
      throw new Error(
        `manifest must not live inside project directory (${normalizedProject}). Use workspace manifest: ${expectedPath}`
      );
    }
  }

  throw new Error(`manifest must be at workspace root: ${expectedPath}`);
}
