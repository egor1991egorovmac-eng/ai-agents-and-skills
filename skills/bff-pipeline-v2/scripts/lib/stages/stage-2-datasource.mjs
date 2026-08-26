import { resolveStackRoots } from '../config.mjs';
import { resolveDataSourcePath, resolveDataSourcesIndexPath } from '../datasource-path.mjs';
import { runDataSourceGate } from '../datasource-gate.mjs';
import { resolveGqlPath } from '../gql-path.mjs';

import { baseManifestSlice, baseMeta } from './shared.mjs';

const REQUIRED_FIELDS = ['httpMethod', 'datasourceMethod'];
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

export const stage2Datasource = {
  id: 2,
  name: 'datasource',
  validateManifest(manifest) {
    const missing = REQUIRED_FIELDS.filter((field) => !manifest[field]);

    if (missing.length > 0) {
      throw new Error(`stage 2 manifest missing required fields: ${missing.join(', ')}`);
    }

    if (!HTTP_METHODS.includes(String(manifest.httpMethod).toUpperCase())) {
      throw new Error(
        `manifest.httpMethod must be one of ${HTTP_METHODS.join(', ')}, got: ${manifest.httpMethod}`
      );
    }

    if (manifest.newService && !manifest.dataSourceKey) {
      throw new Error(
        'stage 2 manifest missing required field: dataSourceKey (when newService is true)'
      );
    }
  },
  manifestSlice: (manifest) => ({
    ...baseManifestSlice(manifest),
    service: manifest.service,
    endpoint: manifest.endpoint,
    httpMethod: manifest.httpMethod,
    datasourceMethod: manifest.datasourceMethod,
    newService: manifest.newService ?? false,
    dataSourceKey: manifest.dataSourceKey ?? null,
  }),
  files: (config, manifest) => {
    const { bffRoot } = resolveStackRoots(config, manifest.stack);

    return [
      resolveGqlPath(bffRoot, manifest).absPath,
      resolveDataSourcePath(bffRoot, manifest.service).absPath,
      resolveDataSourcesIndexPath(bffRoot).absPath,
    ];
  },
  run: async (config, manifest) => ({
    checks: await runDataSourceGate(config, manifest),
    meta: baseMeta(manifest),
  }),
};
