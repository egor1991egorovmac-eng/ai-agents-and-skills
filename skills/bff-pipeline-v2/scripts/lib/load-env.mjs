import fs from 'node:fs';
import path from 'node:path';

import { resolveFromCwd } from './paths.mjs';

const MANAGED_WORKSPACE_ENV_KEYS = [
  'BFF_PIPELINE_BFF_ROOT',
  'BFF_PIPELINE_CLIENT_ROOT',
  'BFF_PIPELINE_BFF_TARGET',
  'BFF_PIPELINE_GRAPHIFY_VAULT',
  'E2E_AUTH_TOKEN',
];

export function parseEnvFile(text) {
  const parsed = {};

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separator = line.indexOf('=');

    if (separator <= 0) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

export function applyEnvFile(filePath, env = process.env) {
  for (const key of MANAGED_WORKSPACE_ENV_KEYS) {
    delete env[key];
  }

  if (!filePath || !fs.existsSync(filePath)) {
    return { loaded: false, path: filePath };
  }

  const parsed = parseEnvFile(fs.readFileSync(filePath, 'utf8'));

  for (const [key, value] of Object.entries(parsed)) {
    env[key] = value;
  }

  return { loaded: true, path: filePath };
}

export function loadEnvNextToManifest(manifestPath, env = process.env) {
  if (!manifestPath) {
    return { loaded: false, path: null };
  }

  const envPath = path.join(path.dirname(resolveFromCwd(manifestPath)), '.env');

  return applyEnvFile(envPath, env);
}
