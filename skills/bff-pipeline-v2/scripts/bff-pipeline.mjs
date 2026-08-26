#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadConfig } from './lib/config.mjs';
import { EXIT, exitCodeForStatus } from './lib/exit-codes.mjs';
import { loadEnvNextToManifest } from './lib/load-env.mjs';
import { loadManifest, validateManifestForStage } from './lib/manifest.mjs';
import { aggregateStatus, buildResult, printResult } from './lib/result.mjs';
import { runPreflightApply, runPreflightCheck } from './lib/preflight.mjs';
import { computeStageFingerprint } from './lib/fingerprint.mjs';
import { getStage } from './lib/stages/index.mjs';
import {
  FailOverrideError,
  runPipeline,
} from './lib/orchestrator.mjs';
import {
  createRunId,
  ensureRunDir,
  formatLogLines,
  writeStageLog,
  writeState,
} from './lib/run-state.mjs';

import { DEFAULT_CONFIG_PATH } from './lib/paths.mjs';

function printUsage() {
  console.log(`bff-pipeline v2

Usage:
  node bff-pipeline.mjs preflight check  --stack <bff-mls|bff-admin> [--config path] [--json]
  node bff-pipeline.mjs preflight apply  --stack <bff-mls|bff-admin> --confirm [--config path] [--json]
  node bff-pipeline.mjs verify --stage <0-6> [--manifest path] [--config path] [--json]
  node bff-pipeline.mjs run --manifest path [--from-stage N] [--run-id id] [--override-blocked --override-reason text] [--override-user name] [--config path] [--json]
  # manifest path: workspace root only — mls-project/manifest.json or admin-project/manifest.json
  node bff-pipeline.mjs test

Exit codes: 0 PASS, 1 FAIL, 2 BLOCKED, 3 invalid input
`);
}

function parseArgs(argv) {
  const args = {
    command: null,
    subcommand: null,
    stack: 'bff-mls',
    stage: null,
    manifest: null,
    config: DEFAULT_CONFIG_PATH,
    confirm: false,
    json: false,
    compact: true,
    runId: null,
    fromStage: 0,
    overrideBlocked: false,
    overrideReason: null,
    overrideUser: null,
  };

  const positional = [...argv];

  if (positional.length === 0) {
    return args;
  }

  args.command = positional.shift();

  if (args.command === 'preflight') {
    args.subcommand = positional.shift() ?? null;
  }

  while (positional.length > 0) {
    const token = positional.shift();

    if (token === '--stack') {
      args.stack = positional.shift();
      continue;
    }

    if (token === '--stage') {
      args.stage = Number(positional.shift());
      continue;
    }

    if (token === '--manifest') {
      args.manifest = positional.shift();
      continue;
    }

    if (token === '--config') {
      args.config = positional.shift();
      continue;
    }

    if (token === '--confirm') {
      args.confirm = true;
      continue;
    }

    if (token === '--json') {
      args.json = true;
      args.compact = false;
      continue;
    }

    if (token === '--run-id') {
      args.runId = positional.shift();
      continue;
    }

    if (token === '--from-stage') {
      args.fromStage = Number(positional.shift());
      continue;
    }

    if (token === '--override-blocked') {
      args.overrideBlocked = true;
      continue;
    }

    if (token === '--override-reason') {
      args.overrideReason = positional.shift();
      continue;
    }

    if (token === '--override-user') {
      args.overrideUser = positional.shift();
      continue;
    }

    throw new Error(`unknown argument: ${token}`);
  }

  return args;
}

async function runPreflight(mode, args) {
  const started = Date.now();
  const config = loadConfig(args.config);
  const runId = args.runId ?? createRunId();
  const runDir = ensureRunDir(config.runsDir, runId);

  const checks =
    mode === 'apply'
      ? await runPreflightApply(config, args.stack, { confirm: args.confirm })
      : await runPreflightCheck(config, args.stack);

  const status = aggregateStatus(checks);
  const logPath = writeStageLog(runDir, 0, formatLogLines(checks));
  const fingerprint = computeStageFingerprint(0, config, { stack: args.stack });

  const result = buildResult({
    runId,
    stage: 0,
    status,
    checks,
    durationMs: Date.now() - started,
    logPath,
    meta: { stack: args.stack, mode },
  });

  writeState(runDir, {
    runId,
    stage: 0,
    status,
    stack: args.stack,
    updatedAt: new Date().toISOString(),
    stages: { 0: { status, fingerprint } },
  });

  return result;
}

async function runStageVerify(args) {
  const started = Date.now();
  loadEnvNextToManifest(args.manifest);
  const config = loadConfig(args.config);
  const manifest = loadManifest(args.manifest, { config });

  validateManifestForStage(manifest, args.stage);

  const runId = args.runId ?? createRunId();
  const runDir = ensureRunDir(config.runsDir, runId);

  const { checks, meta: stageMeta } = await getStage(args.stage).run(config, manifest, { runDir });

  const status = aggregateStatus(checks);
  const logPath = writeStageLog(runDir, args.stage, formatLogLines(checks));
  const fingerprint = computeStageFingerprint(args.stage, config, manifest);

  const result = buildResult({
    runId,
    stage: args.stage,
    status,
    operation: manifest.operation,
    checks,
    durationMs: Date.now() - started,
    logPath,
    meta: stageMeta,
  });

  writeState(runDir, {
    runId,
    stage: args.stage,
    status,
    stack: manifest.stack,
    operation: manifest.operation,
    updatedAt: new Date().toISOString(),
    stages: { [args.stage]: { status, fingerprint } },
  });

  return result;
}

async function runVerify(args) {
  if (args.stage === 0) {
    return runPreflight('check', args);
  }

  if (!args.manifest) {
    throw new Error('verify requires --manifest for stages > 0');
  }

  return runStageVerify(args);
}

async function runPipelineCommand(args) {
  if (!args.manifest) {
    throw new Error('run requires --manifest');
  }

  loadEnvNextToManifest(args.manifest);
  const config = loadConfig(args.config);
  const manifest = loadManifest(args.manifest, { config });

  if (args.overrideBlocked && !args.overrideReason) {
    throw new Error('run with --override-blocked requires --override-reason');
  }

  const overrideUser =
    args.overrideUser ?? process.env.BFF_PIPELINE_USER ?? process.env.USER ?? 'unknown';

  return runPipeline({
    config,
    manifest,
    manifestPath: args.manifest,
    fromStage: args.fromStage,
    runId: args.runId,
    overrideBlocked: args.overrideBlocked,
    overrideReason: args.overrideReason,
    overrideUser,
  });
}

async function runTestCommand() {
  const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const testDir = path.join(skillRoot, 'tests');
  const reporter = path.join(skillRoot, 'tests/lib/test-table-reporter.mjs');
  const { spawnSync } = await import('node:child_process');

  const result = spawnSync(
    process.execPath,
    ['--test', '--test-reporter', reporter, `${testDir}/*.test.mjs`],
    {
      stdio: 'inherit',
      shell: true,
      cwd: skillRoot,
    }
  );

  process.exit(result.status ?? 1);
}

async function main() {
  let args;

  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    printUsage();
    process.exit(EXIT.INVALID_INPUT);
  }

  if (!args.command) {
    printUsage();
    process.exit(EXIT.INVALID_INPUT);
  }

  if (args.command === 'test') {
    await runTestCommand();
    return;
  }

  try {
    let result;

    if (args.command === 'preflight') {
      if (args.subcommand !== 'check' && args.subcommand !== 'apply') {
        throw new Error('preflight requires subcommand: check or apply');
      }

      result = await runPreflight(args.subcommand, args);
    } else if (args.command === 'verify') {
      if (!Number.isInteger(args.stage)) {
        throw new Error('verify requires --stage <number>');
      }

      result = await runVerify(args);
    } else if (args.command === 'run') {
      result = await runPipelineCommand(args);
    } else {
      throw new Error(`unknown command: ${args.command}`);
    }

    printResult(result, { json: args.json, compact: args.compact });
    process.exit(exitCodeForStatus(result.status));
  } catch (error) {
    if (error instanceof FailOverrideError) {
      console.error(error.message);
      process.exit(EXIT.INVALID_INPUT);
    }

    console.error(error.message);
    process.exit(EXIT.INVALID_INPUT);
  }
}

main();
