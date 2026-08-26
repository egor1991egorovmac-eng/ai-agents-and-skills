import { resolveStackRoots } from '../config.mjs';
import { resolveGqlPath } from '../gql-path.mjs';
import { readApiSchemaPin } from '../preflight.mjs';
import { runSchemaGate } from '../schema-gate.mjs';

import { baseManifestSlice, baseMeta } from './shared.mjs';

const REQUIRED_FIELDS = ['service', 'endpoint', 'apiResponseType'];

export const stage1Schema = {
  id: 1,
  name: 'schema',
  validateManifest(manifest) {
    const missing = REQUIRED_FIELDS.filter((field) => !manifest[field]);

    if (missing.length > 0) {
      throw new Error(`stage 1 manifest missing required fields: ${missing.join(', ')}`);
    }
  },
  manifestSlice: (manifest) => ({
    ...baseManifestSlice(manifest),
    service: manifest.service,
    endpoint: manifest.endpoint,
    apiResponseType: manifest.apiResponseType,
    graphqlType: manifest.graphqlType ?? null,
  }),
  files: (config, manifest) => {
    const { bffRoot } = resolveStackRoots(config, manifest.stack);

    return [resolveGqlPath(bffRoot, manifest).absPath];
  },
  extraParts: (config, manifest) => {
    const { bffRoot } = resolveStackRoots(config, manifest.stack);

    try {
      return [readApiSchemaPin(bffRoot)];
    } catch {
      return ['api-schema-missing'];
    }
  },
  run: async (config, manifest, ctx = {}) => ({
    checks: await runSchemaGate(config, manifest, { runsDir: ctx.runDir }),
    meta: baseMeta(manifest),
  }),
};
