import { resolveStackRoots } from '../config.mjs';
import { resolveGqlPath } from '../gql-path.mjs';
import { runResolverGate } from '../resolver-gate.mjs';
import { resolveResolverPath, resolveResolversIndexPath } from '../resolver-path.mjs';

import { baseManifestSlice, baseMeta } from './shared.mjs';

export const stage3Resolver = {
  id: 3,
  name: 'resolver',
  manifestSlice: (manifest) => ({
    ...baseManifestSlice(manifest),
    service: manifest.service,
  }),
  files: (config, manifest) => {
    const { bffRoot } = resolveStackRoots(config, manifest.stack);

    return [
      resolveGqlPath(bffRoot, manifest).absPath,
      resolveResolverPath(bffRoot, manifest).absPath,
      resolveResolversIndexPath(bffRoot).absPath,
    ];
  },
  run: async (config, manifest) => ({
    checks: await runResolverGate(config, manifest),
    meta: baseMeta(manifest),
  }),
};
