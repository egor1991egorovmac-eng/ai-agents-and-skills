import { spawn } from 'node:child_process';

import { killProcessTree } from './process-tree.mjs';

export function runCommand(command, args, { cwd, timeoutMs, env = process.env } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env,
      shell: false,
      detached: process.platform !== 'win32',
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer =
      timeoutMs > 0
        ? setTimeout(() => {
            timedOut = true;
            killProcessTree(child);
          }, timeoutMs)
        : null;

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      if (timer) {
        clearTimeout(timer);
      }

      resolve({
        code: timedOut ? null : code,
        stdout,
        stderr,
        timedOut,
      });
    });

    child.on('error', (error) => {
      if (timer) {
        clearTimeout(timer);
      }

      resolve({
        code: null,
        stdout,
        stderr: `${stderr}\n${error.message}`.trim(),
        timedOut: false,
        error,
      });
    });
  });
}
