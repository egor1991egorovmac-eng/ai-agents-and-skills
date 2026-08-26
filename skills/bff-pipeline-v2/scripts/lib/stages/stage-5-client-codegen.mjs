import path from 'node:path';

import { runClientCodegenGate } from '../client-codegen-gate.mjs';
import { CODEGEN_FILE, TYPES_FILE } from '../client-types-diff.mjs';
import { resolveWorkspaceLinks } from '../workspace-links.mjs';

import { baseManifestSlice, baseMeta } from './shared.mjs';

const REQUIRED_FIELDS = ['client', 'expectedTypes'];

export const stage5ClientCodegen = {
  id: 5,
  name: 'client-codegen',
  validateManifest(manifest) {
    const missing = REQUIRED_FIELDS.filter((field) => manifest[field] == null);

    if (missing.length > 0) {
      throw new Error(`stage 5 manifest missing required fields: ${missing.join(', ')}`);
    }

    if (!Array.isArray(manifest.expectedTypes) || manifest.expectedTypes.length === 0) {
      throw new Error('stage 5 manifest requires non-empty expectedTypes array');
    }

    for (const [index, typeName] of manifest.expectedTypes.entries()) {
      if (typeof typeName !== 'string' || !typeName.trim()) {
        throw new Error(`stage 5 expectedTypes[${index}] must be a non-empty string`);
      }
    }
  },
  manifestSlice: (manifest) => ({
    ...baseManifestSlice(manifest),
    client: manifest.client,
    expectedTypes: manifest.expectedTypes,
  }),
  extraParts: (config, manifest) => [
    `bffTarget:${resolveWorkspaceLinks(config, manifest).bffTarget}`,
  ],
  files: (config, manifest) => {
    const { clientRoot } = resolveWorkspaceLinks(config, manifest);

    return [path.join(clientRoot, TYPES_FILE), path.join(clientRoot, CODEGEN_FILE)];
  },
  run: async (config, manifest) => {
    const { checks, clientMeta } = await runClientCodegenGate(config, manifest);

    return { checks, meta: { ...baseMeta(manifest), ...clientMeta } };
  },
};
