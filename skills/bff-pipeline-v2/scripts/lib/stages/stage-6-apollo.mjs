import path from 'node:path';

import { runApolloGate } from '../apollo-gate.mjs';
import { resolveApolloPath } from '../apollo-path.mjs';
import { resolveClientRoot } from '../client-codegen-gate.mjs';
import { TYPES_FILE } from '../client-types-diff.mjs';

import { baseManifestSlice, baseMeta } from './shared.mjs';

const REQUIRED_FIELDS = ['apolloPath', 'hookName'];
const APOLLO_KINDS = ['query', 'mutation', 'fragment'];

export const stage6Apollo = {
  id: 6,
  name: 'apollo',
  validateManifest(manifest) {
    const missing = REQUIRED_FIELDS.filter((field) => !manifest[field]);

    if (missing.length > 0) {
      throw new Error(`stage 6 manifest missing required fields: ${missing.join(', ')}`);
    }

    if (typeof manifest.apolloPath !== 'string' || !manifest.apolloPath.trim()) {
      throw new Error('stage 6 manifest apolloPath must be a non-empty string');
    }

    if (typeof manifest.hookName !== 'string' || !manifest.hookName.trim()) {
      throw new Error('stage 6 manifest hookName must be a non-empty string');
    }

    if (manifest.apolloKind && !APOLLO_KINDS.includes(manifest.apolloKind)) {
      throw new Error(
        `manifest.apolloKind must be one of ${APOLLO_KINDS.join(', ')}, got: ${manifest.apolloKind}`
      );
    }
  },
  manifestSlice: (manifest) => ({
    ...baseManifestSlice(manifest),
    client: manifest.client,
    apolloPath: manifest.apolloPath,
    hookName: manifest.hookName,
    apolloKind: manifest.apolloKind ?? null,
  }),
  files: (config, manifest) => {
    const clientRoot = resolveClientRoot(config, manifest.client);

    return [
      resolveApolloPath(clientRoot, manifest).absPath,
      path.join(clientRoot, TYPES_FILE),
    ];
  },
  run: async (config, manifest) => {
    const { checks, apolloMeta } = await runApolloGate(config, manifest);

    return { checks, meta: { ...baseMeta(manifest), ...apolloMeta } };
  },
};
