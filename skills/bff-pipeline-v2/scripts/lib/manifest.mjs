import fs from 'node:fs';

import { validateManifestPath } from './manifest-path.mjs';
import { resolveFromCwd } from './paths.mjs';
import { STAGES } from './stages/index.mjs';

const REQUIRED_FIELDS = ['operation', 'kind', 'domain', 'stack'];

export function loadManifest(manifestPath, { config } = {}) {
  if (!manifestPath) {
    return null;
  }

  const resolvedPath = resolveFromCwd(manifestPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`manifest not found: ${resolvedPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));

  validateManifest(manifest);

  if (config) {
    validateManifestPath(resolvedPath, config, manifest.stack);
  }

  return manifest;
}

export function validateManifest(manifest) {
  const missing = REQUIRED_FIELDS.filter((field) => !manifest[field]);

  if (missing.length > 0) {
    throw new Error(`manifest missing required fields: ${missing.join(', ')}`);
  }

  if (!['query', 'mutation'].includes(manifest.kind)) {
    throw new Error(`manifest.kind must be query or mutation, got: ${manifest.kind}`);
  }

  if (!['bff-mls', 'bff-admin'].includes(manifest.stack)) {
    throw new Error(`manifest.stack must be bff-mls or bff-admin, got: ${manifest.stack}`);
  }

  if (manifest.client && !['mls', 'admin', 'www'].includes(manifest.client)) {
    throw new Error(`manifest.client must be mls, admin or www, got: ${manifest.client}`);
  }
}

// Кумулятивно: для этапа N проверяются паспорта всех этапов 0..N.
export function validateManifestForStage(manifest, stage) {
  validateManifest(manifest);

  for (const descriptor of STAGES) {
    if (descriptor.id > stage) {
      break;
    }

    descriptor.validateManifest?.(manifest);
  }
}
