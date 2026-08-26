import { spawn } from 'node:child_process';

import { pingGraphql } from './e2e-request.mjs';
import { killProcessTree } from './process-tree.mjs';

const PING_POLL_MS = 200;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function startBff(
  { bffRoot, timeoutMs, stack, schemaUrl },
  { spawnFn = spawn, env = process.env, pingFn, fetchFn } = {}
) {
  const ping = pingFn ?? ((args) => pingGraphql(args, { fetchFn }));
  const child = spawnFn('npm', ['run', 'dev'], {
    cwd: bffRoot,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  });

  const stop = () => killProcessTree(child);
  const drain = () => {};

  child.stdout?.on('data', drain);
  child.stderr?.on('data', drain);

  let spawnError = null;

  child.on?.('error', (error) => {
    spawnError = error;
  });

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (spawnError) {
      stop();

      return {
        ready: false,
        blocked: true,
        detail: spawnError.message,
        child,
        stop,
      };
    }

    const remaining = deadline - Date.now();
    const result = await ping({ url: schemaUrl, timeoutMs: Math.max(50, Math.min(2000, remaining)) });

    if (result.ok) {
      return {
        ready: true,
        url: schemaUrl,
        child,
        stop,
      };
    }

    if (result.tlsError) {
      stop();

      return {
        ready: false,
        blocked: true,
        detail: result.detail,
        child,
        stop,
      };
    }

    await sleep(Math.min(PING_POLL_MS, Math.max(0, deadline - Date.now())));
  }

  stop();

  return {
    ready: false,
    blocked: true,
    timedOut: true,
    detail: `bff readiness timeout after ${timeoutMs}ms (${stack})`,
    child,
    stop,
  };
}

export function resolveEnvironmentLabel(env = process.env) {
  return env.ENV ?? env.NODE_ENV ?? 'local';
}
