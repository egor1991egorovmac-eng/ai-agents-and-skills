export const WORKSPACE_LINK_ENV = {
  bffRoot: 'BFF_PIPELINE_BFF_ROOT',
  clientRoot: 'BFF_PIPELINE_CLIENT_ROOT',
  bffTarget: 'BFF_PIPELINE_BFF_TARGET',
};

function requireEnv(env, key) {
  const value = env[key]?.trim();

  if (!value) {
    throw new Error(`workspace .env missing required field: ${key}`);
  }

  return value;
}

export function resolveClientRoot(config, client) {
  const clientRoot = config.projects?.[client];

  if (!clientRoot) {
    throw new Error(`config.projects.${client} is not configured`);
  }

  return clientRoot;
}

export function resolveWorkspaceLinks(config, manifest, env = process.env) {
  const bffRoot = requireEnv(env, WORKSPACE_LINK_ENV.bffRoot);
  const bffTarget = requireEnv(env, WORKSPACE_LINK_ENV.bffTarget);

  return {
    bffRoot,
    get clientRoot() {
      return manifest.client ? requireEnv(env, WORKSPACE_LINK_ENV.clientRoot) : null;
    },
    bffTarget,
    env,
  };
}
