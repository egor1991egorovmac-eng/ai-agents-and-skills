import assert from 'node:assert/strict';
import test from 'node:test';

import {
  describeTest,
  fileIntro,
  fileLabel,
  formatFileTable,
  formatSummary,
  isLeafTest,
  toRow,
} from './lib/test-table.mjs';

test('fileLabel maps stage test files', () => {
  assert.equal(fileLabel('/tmp/e2e-gate.test.mjs'), 'Этап 4 · e2e');
  assert.equal(fileLabel('unknown.test.mjs'), 'unknown.test.mjs');
});

test('isLeafTest skips suites and file wrappers', () => {
  assert.equal(
    isLeafTest({
      type: 'test:pass',
      data: { name: 'checks manifest', file: '/tmp/preflight.test.mjs' },
    }),
    true
  );
  assert.equal(
    isLeafTest({
      type: 'test:pass',
      data: {
        name: 'preflight.test.mjs',
        file: '/tmp/preflight.test.mjs',
        details: { type: 'suite' },
      },
    }),
    false
  );
});

test('formatFileTable lists passed tests and what they check', () => {
  const table = formatFileTable('/tmp/preflight.test.mjs', [
    toRow({
      type: 'test:pass',
      data: { name: 'validateManifest rejects missing fields' },
    }),
    toRow({
      type: 'test:fail',
      data: {
        name: 'runPreflightApply without confirm returns BLOCKED',
        details: { error: { message: 'preflight apply requires --confirm flag' } },
      },
    }),
  ]);

  assert.match(table, /Этап 0 · Preflight/);
  assert.match(table, /1 PASS, 1 FAIL/);
  assert.match(table, /Перед генерацией кода/);
  assert.match(table, /\| Статус \| Что делает \|/);
  assert.match(table, /Не запускает pipeline, если в manifest нет обязательных полей/);
  assert.match(table, /apply без --confirm ничего не ставит/);
  assert.match(
    table,
    /FAIL runPreflightApply without confirm returns BLOCKED: preflight apply requires --confirm flag/
  );
});

test('formatSummary totals files after a run', () => {
  const summary = formatSummary([
    {
      file: 'preflight.test.mjs',
      rows: [{ status: 'PASS', name: 'a', error: null }],
    },
    {
      file: 'e2e-gate.test.mjs',
      rows: [
        { status: 'PASS', name: 'b', error: null },
        { status: 'FAIL', name: 'c', error: null },
      ],
    },
  ]);

  assert.match(summary, /## Итого — 2 PASS, 1 FAIL/);
  assert.match(summary, /Этап 0 · Preflight/);
  assert.match(summary, /Этап 4 · e2e/);
});

test('describeTest explains known tests and marks missing copy', () => {
  assert.match(
    describeTest('runE2eGate PASS for objectsSetCalledByRealtManager via executeOperation mock API'),
    /e2eMockApi/
  );
  assert.match(describeTest('нет такого теста'), /Нет описания в репортере/);
  assert.match(fileIntro('e2e-gate.test.mjs'), /executeOperation/);
});
