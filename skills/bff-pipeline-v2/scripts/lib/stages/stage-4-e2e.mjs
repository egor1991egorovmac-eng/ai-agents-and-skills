import { resolveDataSourcePath } from '../datasource-path.mjs';
import { runE2eGate } from '../e2e-gate.mjs';
import { resolveGqlPath } from '../gql-path.mjs';
import { resolveResolverPath } from '../resolver-path.mjs';
import { resolveWorkspaceLinks } from '../workspace-links.mjs';

import { baseManifestSlice, baseMeta } from './shared.mjs';

const REQUIRED_FIELDS = ['e2eQuery', 'e2eVariables', 'assertions'];

export const stage4E2e = {
  id: 4,
  name: 'e2e',
  validateManifest(manifest) {
    const missing = REQUIRED_FIELDS.filter((field) => manifest[field] == null);

    if (missing.length > 0) {
      throw new Error(`stage 4 manifest missing required fields: ${missing.join(', ')}`);
    }

    if (!Array.isArray(manifest.assertions) || manifest.assertions.length === 0) {
      throw new Error('stage 4 manifest requires non-empty assertions array');
    }

    for (const [index, assertion] of manifest.assertions.entries()) {
      if (!assertion?.path) {
        throw new Error(`stage 4 assertion ${index + 1} missing required field: path`);
      }
    }
  },
  manifestSlice: (manifest) => ({
    ...baseManifestSlice(manifest),
    e2eQuery: manifest.e2eQuery,
    e2eVariables: manifest.e2eVariables,
    assertions: manifest.assertions,
    idempotencyKey: manifest.idempotencyKey ?? null,
    e2eMockApi: manifest.e2eMockApi ?? false,
  }),
  extraParts: (config, manifest) => [
    `bffTarget:${resolveWorkspaceLinks(config, manifest).bffTarget}`,
  ],
  files: (config, manifest) => {
    const { bffRoot } = resolveWorkspaceLinks(config, manifest);

    return [
      resolveGqlPath(bffRoot, manifest).absPath,
      resolveResolverPath(bffRoot, manifest).absPath,
      resolveDataSourcePath(bffRoot, manifest.service).absPath,
    ];
  },
  run: async (config, manifest) => {
    const { checks, e2eMeta } = await runE2eGate(config, manifest);

    return { checks, meta: { ...baseMeta(manifest), ...e2eMeta } };
  },
};
