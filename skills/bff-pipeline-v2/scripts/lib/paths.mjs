import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const V2_ROOT = path.resolve(__dirname, '../..');
export const V1_SCRIPTS_DIR = path.resolve(V2_ROOT, '../bff-pipeline/scripts');
export const DEFAULT_CONFIG_PATH = path.join(V2_ROOT, 'config/default.config.json');

export function expandHome(inputPath) {
  if (!inputPath || typeof inputPath !== 'string') {
    return inputPath;
  }

  if (inputPath === '~') {
    return homedir();
  }

  if (inputPath.startsWith('~/')) {
    return path.join(homedir(), inputPath.slice(2));
  }

  return inputPath;
}

export function resolveFromCwd(inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(process.cwd(), inputPath);
}
