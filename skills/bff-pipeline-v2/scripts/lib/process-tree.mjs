export function killProcessTree(child) {
  if (!child?.pid) {
    return;
  }

  try {
    if (process.platform === 'win32') {
      child.kill('SIGKILL');
      return;
    }

    process.kill(-child.pid, 'SIGKILL');
  } catch {
    try {
      child.kill('SIGKILL');
    } catch {
      // process already exited
    }
  }
}
