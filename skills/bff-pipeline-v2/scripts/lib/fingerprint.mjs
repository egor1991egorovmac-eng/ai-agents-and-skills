import crypto from 'node:crypto';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

import { resolveStackRoots } from './config.mjs';
import { getStage, STAGES, STAGE_COUNT } from './stages/index.mjs';

function hashParts(parts) {
  return crypto.createHash('sha256').update(parts.join('\0')).digest('hex');
}

function stableJson(value) {
  return JSON.stringify(value);
}

// ponytail: хэш только по содержимому — touch без изменения байтов не инвалидирует этап
function fileDigest(absPath) {
  if (!absPath || !fs.existsSync(absPath)) {
    return 'missing';
  }

  return crypto.createHash('sha256').update(fs.readFileSync(absPath)).digest('hex');
}

function gitDigest(cwd) {
  if (!cwd || !fs.existsSync(cwd)) {
    return 'no-repo';
  }

  const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' });

  if (head.status !== 0) {
    return 'no-repo';
  }

  const status = spawnSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' });

  return hashParts([head.stdout.trim(), status.stdout.trim()]);
}

function configDigest(config, stack) {
  const { bffRoot, clients } = resolveStackRoots(config, stack);

  return hashParts([
    bffRoot,
    ...clients.map((client) => config.projects?.[client] ?? ''),
    config.projects?.graphifyVault ?? '',
    stableJson(config.timeouts ?? {}),
    config.libSchemaRemote ?? '',
  ]);
}

export function computeStageFingerprint(stage, config, manifest) {
  const descriptor = getStage(stage);
  const { bffRoot } = resolveStackRoots(config, manifest.stack);

  return hashParts([
    `stage:${stage}`,
    stableJson(descriptor.manifestSlice(manifest)),
    configDigest(config, manifest.stack),
    gitDigest(bffRoot),
    ...descriptor.files(config, manifest).map(fileDigest),
    ...(descriptor.extraParts?.(config, manifest) ?? []),
  ]);
}

export function computeAllFingerprints(config, manifest) {
  const fingerprints = {};

  for (const stage of STAGES) {
    fingerprints[stage.id] = computeStageFingerprint(stage.id, config, manifest);
  }

  return fingerprints;
}

export function findInvalidatedFrom(fingerprints, savedStages, fromStage = 0) {
  for (let stage = fromStage; stage < STAGE_COUNT; stage += 1) {
    const saved = savedStages?.[stage];

    if (!saved || saved.status !== 'PASS') {
      return stage;
    }

    if (saved.fingerprint !== fingerprints[stage]) {
      return stage;
    }
  }

  return STAGE_COUNT;
}

export function canReuseStage(stage, fingerprints, savedStages, fromStage = 0) {
  if (stage < fromStage) {
    return savedStages?.[stage]?.status === 'PASS';
  }

  const invalidatedFrom = findInvalidatedFrom(fingerprints, savedStages, fromStage);

  if (stage >= invalidatedFrom) {
    return false;
  }

  const saved = savedStages?.[stage];

  return saved?.status === 'PASS' && saved?.fingerprint === fingerprints[stage];
}

export { STAGE_COUNT };
