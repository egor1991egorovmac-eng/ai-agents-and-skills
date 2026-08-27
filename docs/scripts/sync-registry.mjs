import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(APP_ROOT, '..');
const OUT = path.join(APP_ROOT, 'data', 'registry.json');
const OWNER_REPO = 'egor1991egorovmac-eng/ai-agents-and-skills';

function parseFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');

  if (!raw.startsWith('---\n')) {
    return null;
  }

  const end = raw.indexOf('\n---', 4);

  if (end === -1) {
    return null;
  }

  const fm = raw.slice(4, end);

  const nameMatch = fm.match(/^name:\s*(.+)$/m);
  const descMatch = fm.match(/^description:\s*(.*)$/m);

  if (!nameMatch || !descMatch) {
    return null;
  }

  const unquote = (value) => {
    const v = value.trim();

    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      return v.slice(1, -1);
    }

    return v;
  };

  return {
    name: unquote(nameMatch[1]),
    description: unquote(descMatch[1]),
    body: raw.slice(end + 4).trim(),
  };
}

function collectSkills() {
  const dir = path.join(REPO_ROOT, 'skills');
  const items = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const filePath = path.join(dir, entry.name, 'SKILL.md');

    if (!fs.existsSync(filePath)) {
      continue;
    }

    const fm = parseFrontmatter(filePath);

    if (!fm) {
      console.warn(`skip: invalid frontmatter in ${filePath}`);
      continue;
    }

    items.push({
      id: fm.name,
      kind: 'skill',
      name: fm.name,
      description: fm.description,
      source: path.relative(REPO_ROOT, filePath),
      body: fm.body,
    });
  }

  return items;
}

function collectAgents() {
  const dir = path.join(REPO_ROOT, 'agents');
  const items = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const filePath = path.join(dir, entry.name, 'claude-agent.md');

    if (!fs.existsSync(filePath)) {
      continue;
    }

    const fm = parseFrontmatter(filePath);

    if (!fm) {
      console.warn(`skip: invalid frontmatter in ${filePath}`);
      continue;
    }

    items.push({
      id: fm.name,
      kind: 'agent',
      name: fm.name,
      description: fm.description,
      source: path.relative(REPO_ROOT, filePath),
      body: fm.body,
    });
  }

  return items;
}

const skills = collectSkills();
const agents = collectAgents();

const byId = new Map();

for (const item of [...skills, ...agents]) {
  const existing = byId.get(item.id);

  if (!existing) {
    byId.set(item.id, { ...item, alsoAgent: false, alsoSkill: false });
    continue;
  }

  if (existing.kind === 'skill' && item.kind === 'agent') {
    existing.alsoAgent = true;
  } else if (existing.kind === 'agent' && item.kind === 'skill') {
    existing.kind = 'skill';
    existing.source = item.source;
    existing.body = item.body;
    existing.alsoAgent = true;
  }
}

const registry = [...byId.values()].map((item) => ({
  id: item.id,
  kind: item.kind,
  alsoAgent: item.alsoAgent,
  alsoSkill: item.alsoSkill,
  name: item.name,
  description: item.description,
  install: `npx skills add ${OWNER_REPO} -g --skill ${item.id}`,
  source: item.source,
  body: item.body,
}));

registry.sort((a, b) => a.id.localeCompare(b.id));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(registry, null, 2) + '\n');

console.log(`registry: ${registry.length} items → ${path.relative(REPO_ROOT, OUT)}`);
