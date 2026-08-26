import { startBff, resolveEnvironmentLabel } from './bff-lifecycle.mjs';
import { executeOperationAgainstSchema } from './e2e-execute-operation.mjs';
import {
  buildGraphqlHeaders,
  evaluateGraphqlResponse,
  executeGraphqlRequest,
  pingGraphql,
  resolveRetryPolicy,
} from './e2e-request.mjs';
import { createCheck } from './result.mjs';
import { checkBffTargetIdentity } from './schema-identity.mjs';
import { resolveWorkspaceLinks } from './workspace-links.mjs';

export function buildE2eCompactMeta({ environment, bffTarget, operation }) {
  return `env=${environment} target=${bffTarget} op=${operation}`;
}

function buildE2eMeta({ environment, bffTarget, operation, compactTarget = bffTarget }) {
  return {
    environment,
    bffTarget,
    operation,
    compactMeta: buildE2eCompactMeta({
      environment,
      bffTarget: compactTarget,
      operation,
    }),
  };
}

function blockedReadiness(detail, { environment, operation }) {
  return {
    checks: [
      createCheck('bff-readiness', false, detail, {
        blocked: true,
      }),
    ],
    e2eMeta: buildE2eMeta({
      environment,
      bffTarget: null,
      operation,
      compactTarget: 'unavailable',
    }),
  };
}

function identityResult(check, { bffTarget, environment, operation }) {
  return {
    checks: [createCheck('bff-readiness', true, bffTarget), check],
    e2eMeta: buildE2eMeta({ environment, bffTarget, operation }),
  };
}

async function runOperationAgainstUrl({
  url,
  manifest,
  timeoutMs,
  fetchFn,
  environment,
  headers,
  identityCheck,
}) {
  const { maxRetries } = resolveRetryPolicy(manifest);
  const result = await executeGraphqlRequest(
    { url, manifest, timeoutMs, headers },
    { fetchFn, maxRetries }
  );
  const checks = evaluateGraphqlResponse(result, manifest);

  checks.unshift(createCheck('bff-readiness', true, url), identityCheck);

  return {
    checks,
    e2eMeta: buildE2eMeta({
      environment,
      bffTarget: url,
      operation: manifest.operation,
    }),
  };
}

async function runOperationAgainstLocalSchema({
  bffRoot,
  manifest,
  timeoutMs,
  environment,
  identityCheck,
  executeOperationFn,
  exec,
}) {
  const result = await executeOperationFn(
    { bffRoot, manifest, timeoutMs },
    { exec }
  );

  if (!result.ok && result.text && (result.status == null || result.status < 100)) {
    return {
      checks: [
        createCheck('bff-readiness', true, 'executeOperation'),
        identityCheck,
        createCheck('execute-operation', false, result.text.slice(0, 800)),
      ],
      e2eMeta: buildE2eMeta({
        environment,
        bffTarget: 'executeOperation',
        operation: manifest.operation,
      }),
    };
  }

  const checks = evaluateGraphqlResponse(result, manifest);
  checks.unshift(createCheck('bff-readiness', true, 'executeOperation'), identityCheck);

  return {
    checks,
    e2eMeta: buildE2eMeta({
      environment,
      bffTarget: 'executeOperation',
      operation: manifest.operation,
    }),
  };
}

export async function runE2eGate(config, manifest, deps = {}) {
  const bffTimeoutMs = config.timeouts?.bffDev ?? 120000;
  const e2eTimeoutMs = config.timeouts?.e2e ?? 60000;
  const startBffFn = deps.startBff ?? startBff;
  const fetchFn = deps.fetchFn ?? fetch;
  const workspaceLinks =
    deps.workspaceLinks ?? resolveWorkspaceLinks(config, manifest, deps.env ?? process.env);
  const { bffRoot, bffTarget, env } = workspaceLinks;
  const requestHeaders = buildGraphqlHeaders(env);
  const pingFn = deps.pingFn ?? ((args) => pingGraphql({ ...args, headers: requestHeaders }, { fetchFn }));
  const identityCheckFn = deps.identityCheck ?? checkBffTargetIdentity;
  const executeOperationFn = deps.executeOperationFn ?? executeOperationAgainstSchema;
  const environment = deps.environment ?? resolveEnvironmentLabel(env);

  if (!bffTarget) {
    throw new Error('workspace links missing required field: BFF Target');
  }

  const ping = await pingFn({ url: bffTarget, timeoutMs: e2eTimeoutMs });

  if (ping.tlsError) {
    return blockedReadiness(ping.detail ?? 'tls error', {
      environment,
      operation: manifest.operation,
    });
  }

  if (ping.ok) {
    const identityCheck = await identityCheckFn(
      { bffRoot, bffTarget, timeoutMs: e2eTimeoutMs, headers: requestHeaders },
      { fetchFn }
    );

    if (!identityCheck.passed) {
      return identityResult(identityCheck, {
        bffTarget,
        environment,
        operation: manifest.operation,
      });
    }

    if (manifest.e2eMockApi) {
      return runOperationAgainstLocalSchema({
        bffRoot,
        manifest,
        timeoutMs: e2eTimeoutMs,
        environment,
        identityCheck,
        executeOperationFn,
        exec: deps.exec,
      });
    }

    return runOperationAgainstUrl({
      url: bffTarget,
      manifest,
      timeoutMs: e2eTimeoutMs,
      fetchFn,
      environment,
      headers: requestHeaders,
      identityCheck,
    });
  }

  if (!ping.networkError && !ping.timedOut) {
    return {
      checks: [
        createCheck('bff-readiness', false, ping.detail ?? 'ping failed'),
      ],
      e2eMeta: buildE2eMeta({
        environment,
        bffTarget,
        operation: manifest.operation,
      }),
    };
  }

  let lifecycle = null;

  try {
    lifecycle = await startBffFn(
      { bffRoot, timeoutMs: bffTimeoutMs, stack: manifest.stack, schemaUrl: bffTarget },
      { spawnFn: deps.spawnFn, env, pingFn, fetchFn }
    );

    if (!lifecycle.ready) {
      return blockedReadiness(lifecycle.detail ?? 'bff failed to start', {
        environment,
        operation: manifest.operation,
      });
    }

    const identityCheck = await identityCheckFn(
      { bffRoot, bffTarget, timeoutMs: e2eTimeoutMs, headers: requestHeaders },
      { fetchFn }
    );

    if (!identityCheck.passed) {
      return identityResult(identityCheck, {
        bffTarget,
        environment,
        operation: manifest.operation,
      });
    }

    if (manifest.e2eMockApi) {
      return await runOperationAgainstLocalSchema({
        bffRoot,
        manifest,
        timeoutMs: e2eTimeoutMs,
        environment,
        identityCheck,
        executeOperationFn,
        exec: deps.exec,
      });
    }

    return await runOperationAgainstUrl({
      url: bffTarget,
      manifest,
      timeoutMs: e2eTimeoutMs,
      fetchFn,
      environment,
      headers: requestHeaders,
      identityCheck,
    });
  } finally {
    lifecycle?.stop?.();
  }
}
