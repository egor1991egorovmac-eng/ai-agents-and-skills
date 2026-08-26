import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export function createRunId() {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const suffix = crypto.randomBytes(3).toString('hex');

  return `${stamp}-${suffix}`;
}

export function ensureRunDir(runsDir, runId) {
  const runDir = path.join(runsDir, runId);

  fs.mkdirSync(runDir, { recursive: true });

  return runDir;
}

export function writeStageLog(runDir, stage, content) {
  const logPath = path.join(runDir, `stage-${stage}.log`);

  fs.writeFileSync(logPath, content, 'utf8');

  return logPath;
}

export function writeState(runDir, state) {
  const statePath = path.join(runDir, 'state.json');

  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');

  return statePath;
}

export function readState(runDir) {
  const statePath = path.join(runDir, 'state.json');

  if (!fs.existsSync(statePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(statePath, 'utf8'));
}

export function mergeState(existing, patch) {
  return {
    ...existing,
    ...patch,
    stages: {
      ...(existing?.stages ?? {}),
      ...(patch.stages ?? {}),
    },
    overrides: patch.overrides ?? existing?.overrides ?? [],
  };
}

export function formatLogLines(entries) {
  return entries
    .map((entry) => {
      const header = `[${entry.id}] ${entry.passed ? 'PASS' : entry.blocked ? 'BLOCKED' : 'FAIL'}`;

      if (!entry.detail && !entry.fullDiff) {
        return header;
      }

      const body = [entry.detail, entry.fullDiff ? `--- full diff ---\n${entry.fullDiff}` : null]
        .filter(Boolean)
        .join('\n');

      return `${header}\n${body}`;
    })
    .join('\n\n');
}
