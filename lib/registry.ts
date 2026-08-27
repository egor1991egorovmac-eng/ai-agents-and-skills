import fs from 'node:fs';
import path from 'node:path';

export interface RegistryItem {
  id: string;
  kind: 'skill' | 'agent';
  alsoAgent: boolean;
  alsoSkill: boolean;
  name: string;
  description: string;
  install: string;
  source: string;
  body: string;
}

const cache: RegistryItem[] | null = null;

export function loadRegistry(): RegistryItem[] {
  const file = path.join(process.cwd(), 'data', 'registry.json');

  return JSON.parse(fs.readFileSync(file, 'utf8')) as RegistryItem[];
}

export function getItem(id: string): RegistryItem | undefined {
  return loadRegistry().find((item) => item.id === id);
}
