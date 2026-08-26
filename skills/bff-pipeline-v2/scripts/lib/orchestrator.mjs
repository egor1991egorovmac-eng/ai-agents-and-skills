import { canReuseStage, computeAllFingerprints } from './fingerprint.mjs';
import { validateManifestForStage } from './manifest.mjs';
import { getStage, STAGE_COUNT } from './stages/index.mjs';
import { STATUS } from './exit-codes.mjs';
import { aggregateStatus, collectChangedFiles } from './result.mjs';
import {
  createRunId,
  ensureRunDir,
  formatLogLines,
  mergeState,
  readState,
  writeStageLog,
  writeState,
} from './run-state.mjs';

export class FailOverrideError extends Error {
  constructor(stage) {
    super(`stage ${stage} FAIL cannot be overridden`);
    this.stage = stage;
  }
}

async function defaultRunStage(stage, config, manifest, runDir) {
  validateManifestForStage(manifest, stage);

  return getStage(stage).run(config, manifest, { runDir });
}

function computeFinalStatus(stageResults) {
  const entries = Object.values(stageResults);

  if (entries.some((entry) => entry.status === STATUS.FAIL)) {
    return STATUS.FAIL;
  }

  if (entries.some((entry) => entry.status === STATUS.BLOCKED && !entry.overridden)) {
    return STATUS.BLOCKED;
  }

  return STATUS.PASS;
}

function buildPipelineCompact(status, stage, stageResults) {
  if (status === STATUS.PASS) {
    const skipped = Object.values(stageResults).filter((entry) => entry.skipped).length;

    return skipped > 0
      ? `pipeline PASS (stages 0-6, ${skipped} reused)`
      : 'pipeline PASS (stages 0-6)';
  }

  const current = stageResults[stage];
  const suffix = current?.compactMeta ? ` (${current.compactMeta})` : '';

  return `pipeline stopped at stage ${stage} ${status}: ${current?.primaryCheckId ?? 'unknown'}${suffix}`;
}

function buildPipelineResult({
  runId,
  status,
  stage,
  stageResults,
  durationMs,
  runDir,
  manifest,
}) {
  const stages = Object.fromEntries(
    Object.entries(stageResults).map(([key, value]) => [
      key,
      {
        status: value.status,
        skipped: value.skipped,
        fingerprint: value.fingerprint,
        logPath: value.logPath,
        overridden: value.overridden ?? false,
      },
    ])
  );

  return {
    runId,
    stage,
    status,
    operation: manifest.operation,
    stages,
    durationMs,
    runDir,
    compact: buildPipelineCompact(status, stage, stageResults),
    meta: {
      stack: manifest.stack,
      operation: manifest.operation,
    },
    ...(status === STATUS.PASS
      ? {}
      : {
          changedFiles: stageResults[stage]?.changedFiles ?? [],
        }),
  };
}

export async function runPipeline({
  config,
  manifest,
  manifestPath = null,
  fromStage = 0,
  runId: requestedRunId = null,
  overrideBlocked = false,
  overrideReason = null,
  overrideUser = 'unknown',
  runStage = defaultRunStage,
} = {}) {
  if (!Number.isInteger(fromStage) || fromStage < 0 || fromStage >= STAGE_COUNT) {
    throw new Error(`fromStage must be an integer between 0 and ${STAGE_COUNT - 1}`);
  }

  const started = Date.now();
  const runId = requestedRunId ?? createRunId();
  const runDir = ensureRunDir(config.runsDir, runId);
  const previousState = requestedRunId ? readState(runDir) : null;
  const fingerprints = computeAllFingerprints(config, manifest);
  const savedStages = previousState?.stages ?? {};
  const stageResults = {};
  const overrides = [...(previousState?.overrides ?? [])];

  let state = {
    runId,
    manifestPath,
    stack: manifest.stack,
    operation: manifest.operation,
    updatedAt: new Date().toISOString(),
    stages: { ...savedStages },
    overrides,
  };

  writeState(runDir, state);

  let stopStage = STAGE_COUNT - 1;

  for (let stage = fromStage; stage < STAGE_COUNT; stage += 1) {
    const fingerprint = fingerprints[stage];

    if (canReuseStage(stage, fingerprints, savedStages, fromStage)) {
      const reused = savedStages[stage];

      stageResults[stage] = {
        status: reused.status,
        skipped: true,
        fingerprint: reused.fingerprint,
        logPath: reused.logPath ?? null,
        compactMeta: reused.compactMeta ?? null,
        primaryCheckId: reused.primaryCheckId ?? null,
      };

      state = mergeState(state, {
        updatedAt: new Date().toISOString(),
        stages: {
          [stage]: {
            ...reused,
            fingerprint,
            reused: true,
          },
        },
      });
      writeState(runDir, state);
      continue;
    }

    const { checks, meta = {} } = await runStage(stage, config, manifest, runDir);
    const status = aggregateStatus(checks);
    const logPath = writeStageLog(runDir, stage, formatLogLines(checks));
    const failedChecks = checks.filter((check) => !check.passed);
    const blockedChecks = checks.filter((check) => check.blocked);
    const primary = blockedChecks[0] ?? failedChecks[0];
    const changedFiles = collectChangedFiles(checks);

    const stageEntry = {
      status,
      skipped: false,
      fingerprint,
      logPath,
      compactMeta: meta.compactMeta ?? null,
      primaryCheckId: primary?.id ?? null,
      updatedAt: new Date().toISOString(),
      ...(changedFiles.length ? { changedFiles } : {}),
    };

    stageResults[stage] = stageEntry;

    if (status === STATUS.PASS) {
      state = mergeState(state, {
        updatedAt: new Date().toISOString(),
        stages: { [stage]: stageEntry },
      });
      writeState(runDir, state);
      continue;
    }

    if (status === STATUS.FAIL) {
      if (overrideBlocked) {
        throw new FailOverrideError(stage);
      }

      stopStage = stage;
      state = mergeState(state, {
        updatedAt: new Date().toISOString(),
        stages: { [stage]: stageEntry },
      });
      writeState(runDir, state);
      break;
    }

    if (status === STATUS.BLOCKED && overrideBlocked) {
      const overrideEntry = {
        stage,
        status: STATUS.BLOCKED,
        at: new Date().toISOString(),
        user: overrideUser,
        reason: overrideReason,
      };

      overrides.push(overrideEntry);
      stageEntry.overridden = true;

      state = mergeState(state, {
        updatedAt: new Date().toISOString(),
        overrides,
        stages: { [stage]: stageEntry },
      });
      writeState(runDir, state);
      continue;
    }

    stopStage = stage;
    state = mergeState(state, {
      updatedAt: new Date().toISOString(),
      stages: { [stage]: stageEntry },
    });
    writeState(runDir, state);
    break;
  }

  const finalStatus = computeFinalStatus(stageResults);

  return buildPipelineResult({
    runId,
    status: finalStatus,
    stage: stopStage,
    stageResults,
    durationMs: Date.now() - started,
    runDir,
    manifest,
  });
}
