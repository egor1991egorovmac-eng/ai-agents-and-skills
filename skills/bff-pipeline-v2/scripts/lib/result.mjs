import { STATUS } from './exit-codes.mjs';

export function createCheck(
  id,
  passed,
  detail = '',
  { blocked = false, fullDiff = null, changedFiles = null } = {}
) {
  return {
    id,
    passed,
    ...(blocked ? { blocked: true } : {}),
    ...(detail ? { detail } : {}),
    ...(fullDiff ? { fullDiff } : {}),
    ...(changedFiles?.length ? { changedFiles } : {}),
  };
}

export function collectChangedFiles(checks, extra = []) {
  const fromChecks = checks.flatMap((check) => check.changedFiles ?? []);
  return [...new Set([...extra, ...fromChecks])];
}

export function aggregateStatus(checks) {
  if (checks.some((check) => check.blocked)) {
    return STATUS.BLOCKED;
  }

  if (checks.some((check) => !check.passed)) {
    return STATUS.FAIL;
  }

  return STATUS.PASS;
}

const DETAIL_MAX_CHARS = 800;
const FULL_DIFF_MAX_LINES = 30;

function capText(text, maxChars = DETAIL_MAX_CHARS) {
  if (!text || text.length <= maxChars) {
    return text;
  }

  return `${text.slice(0, maxChars)}… [truncated, see log]`;
}

function capDiff(diff) {
  if (!diff) {
    return null;
  }

  const lines = diff.split('\n');

  if (lines.length <= FULL_DIFF_MAX_LINES) {
    return diff;
  }

  return `${lines.slice(0, FULL_DIFF_MAX_LINES).join('\n')}\n… [${lines.length - FULL_DIFF_MAX_LINES} more lines in log]`;
}

function slimCheck(check) {
  return {
    id: check.id,
    passed: check.passed,
    ...(check.blocked ? { blocked: true } : {}),
    ...(check.detail ? { detail: capText(check.detail) } : {}),
    ...(check.fullDiff ? { fullDiff: capDiff(check.fullDiff) } : {}),
    ...(check.changedFiles?.length ? { changedFiles: check.changedFiles } : {}),
  };
}

export function buildResult({
  runId,
  stage,
  status,
  operation = null,
  checks = [],
  durationMs = 0,
  logPath = null,
  meta = {},
  changedFiles = null,
}) {
  const failedChecks = checks.filter((check) => !check.passed);
  const blockedChecks = checks.filter((check) => check.blocked);
  const primary = blockedChecks[0] ?? failedChecks[0];
  const resolvedChangedFiles =
    changedFiles ?? (status === STATUS.PASS ? [] : collectChangedFiles(checks));
  const e2eSuffix = meta.compactMeta ? ` (${meta.compactMeta})` : '';
  const compact =
    status === STATUS.PASS
      ? `stage ${stage} PASS${e2eSuffix}`
      : `stage ${stage} ${status}: ${primary?.id ?? 'unknown'}${e2eSuffix}`;

  const base = {
    runId,
    stage,
    status,
    operation,
    durationMs,
    logPath,
    compact,
    meta,
  };

  if (status === STATUS.PASS) {
    return { ...base, checksPassed: checks.length };
  }

  return {
    ...base,
    checks: checks.filter((check) => !check.passed || check.blocked).map(slimCheck),
    checksPassed: checks.filter((check) => check.passed).length,
    changedFiles: resolvedChangedFiles,
    diagnostic: buildDiagnostic(primary, resolvedChangedFiles),
  };
}

function buildDiagnostic(check, changedFiles = []) {
  if (!check) {
    return { id: 'unknown', excerpt: 'no diagnostic available', changedFiles };
  }

  return {
    id: check.id,
    excerpt: capText(check.detail || check.id),
    ...(changedFiles.length ? { changedFiles } : {}),
  };
}

export function printResult(result, { json = false, compact = false } = {}) {
  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (compact || result.status === STATUS.PASS) {
    console.log(result.compact);
    return;
  }

  console.log(result.compact);

  if (result.diagnostic) {
    console.error(`diagnostic: ${result.diagnostic.excerpt}`);
  }

  if (result.logPath) {
    console.error(`log: ${result.logPath}`);
  }
}
