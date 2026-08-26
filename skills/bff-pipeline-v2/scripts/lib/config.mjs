import fs from 'node:fs';

import { DEFAULT_CONFIG_PATH, expandHome, resolveFromCwd } from './paths.mjs';

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function loadConfig(configPath = DEFAULT_CONFIG_PATH, env = process.env) {
  const resolvedPath = resolveFromCwd(configPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`config not found: ${resolvedPath}`);
  }

  const config = readJsonFile(resolvedPath);
  const projects = {
    ...config.projects,
    ...(env.BFF_PIPELINE_BFF_ROOT
      ? {
          bffAdmin: env.BFF_PIPELINE_BFF_ROOT,
          bffMls: env.BFF_PIPELINE_BFF_ROOT,
        }
      : {}),
    ...(env.BFF_PIPELINE_CLIENT_ROOT
      ? {
          admin: env.BFF_PIPELINE_CLIENT_ROOT,
          mls: env.BFF_PIPELINE_CLIENT_ROOT,
          www: env.BFF_PIPELINE_CLIENT_ROOT,
        }
      : {}),
    ...(env.BFF_PIPELINE_GRAPHIFY_VAULT
      ? { graphifyVault: env.BFF_PIPELINE_GRAPHIFY_VAULT }
      : {}),
  };

  return {
    ...config,
    runsDir: expandHome(config.runsDir),
    projects: Object.fromEntries(
      Object.entries(projects).map(([key, value]) => [key, expandHome(value)])
    ),
  };
}

export function resolveStackRoots(config, stack) {
  if (stack === 'bff-admin') {
    return {
      bffRoot: config.projects.bffAdmin,
      clients: ['admin'],
    };
  }

  if (stack === 'bff-mls') {
    return {
      bffRoot: config.projects.bffMls,
      clients: ['mls', 'admin', 'www'],
    };
  }

  throw new Error(`unknown stack: ${stack}`);
}
