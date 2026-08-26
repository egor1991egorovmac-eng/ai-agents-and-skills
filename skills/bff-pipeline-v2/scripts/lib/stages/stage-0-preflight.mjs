import path from 'node:path';

import { resolveStackRoots } from '../config.mjs';
import { runPreflightCheck } from '../preflight.mjs';

import { baseManifestSlice } from './shared.mjs';

export const stage0Preflight = {
  id: 0,
  name: 'preflight',
  manifestSlice: (manifest) => baseManifestSlice(manifest),
  files: (config, manifest) => {
    const { bffRoot } = resolveStackRoots(config, manifest.stack);

    return [path.join(bffRoot, 'package.json')];
  },
  run: async (config, manifest) => ({
    checks: await runPreflightCheck(config, manifest.stack),
    meta: { stack: manifest.stack, mode: 'check' },
  }),
};
