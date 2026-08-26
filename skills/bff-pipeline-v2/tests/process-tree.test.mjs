import assert from 'node:assert/strict';
import test from 'node:test';

import { killProcessTree } from '../scripts/lib/process-tree.mjs';

test('killProcessTree is safe for missing child', () => {
  assert.doesNotThrow(() => killProcessTree(null));
  assert.doesNotThrow(() => killProcessTree(undefined));
  assert.doesNotThrow(() => killProcessTree({}));
});

test('killProcessTree calls child.kill when process group kill fails', () => {
  let killed = false;

  killProcessTree({
    pid: 999_999_999,
    kill: () => {
      killed = true;
    },
  });

  assert.equal(killed, true);
});
