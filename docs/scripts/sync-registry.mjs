import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(APP_ROOT, '..');
const OUT = path.join(APP_ROOT, 'data', 'registry.json');
const OWNER_REPO = 'egor1991egorovmac-eng/ai-agents-and-skills';

const SUMMARIES = {
  'bff-datasource-create-v2':
    'Этап 2 пайплайна bff-pipeline: метод обращения к микросервису — новый DataSource или REST-эндпоинт в bff-mls.',
  'bff-e2e-verify-v2':
    'Этап 4: проверка новой операции реальным запросом к BFF — прогнать GraphQL против живого сервиса.',
  'bff-pipeline-bff':
    'Агент BFF-стороны: ведёт GraphQL-фичу по этапам 0–4 — preflight, схема, DataSource, резолвер, e2e.',
  'bff-pipeline-client':
    'Агент клиентской стороны: этапы 5–6 — codegen типов и Apollo-файлы с gate-проверками runner.',
  'bff-pipeline-v2':
    'Дирижёр пайплайна с детерминированным runner — единственный источник PASS/FAIL/BLOCKED на этапах 0–6.',
  'bff-resolver-create-v2':
    'Этап 3: резолвер и трансформер в bff-mls, регистрация в resolvers.ts.',
  'bff-schema-create-v2':
    'Этап 1: .gql схема query/mutation в bff-mls — типы, input\u2019ы, enum\u2019ы.',
  'client-apollo-create-v2':
    'Этап 6: атомарные Apollo query/mutation/fragment файлы в mls, admin и www.',
  'client-types-sync-v2':
    'Этап 5: синхронизация типов клиента со схемой BFF через codegen.',
  'realt-flow':
    'Флоу задачи целиком: сторя YouTrack → фича-ветка → таск-ветки → MR, плюс хотфиксы hot-fix/* прямо в master. Всю механику делают скрипты.',
};

function cleanDescription(description) {
  const withoutExamples = description.split('Examples')[0];

  return withoutExamples
    .replace(/["«»]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

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

  if (!descMatch) {
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
    name: nameMatch ? unquote(nameMatch[1]) : null,
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
  const AGENT_FILES = ['claude-agent.md', 'opencode-agent.md'];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const agentFile = AGENT_FILES.map((name) => path.join(dir, entry.name, name)).find(
      (filePath) => fs.existsSync(filePath)
    );

    if (!agentFile) {
      continue;
    }

    const fm = parseFrontmatter(agentFile);

    if (!fm) {
      console.warn(`skip: invalid frontmatter in ${agentFile}`);
      continue;
    }

    const id = fm.name ?? entry.name;

    items.push({
      id,
      kind: 'agent',
      name: id,
      description: fm.description,
      source: path.relative(REPO_ROOT, agentFile),
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
  summary: SUMMARIES[item.id] ?? cleanDescription(item.description),
  install: `npx skills add ${OWNER_REPO} -g --skill ${item.id}`,
  source: item.source,
  body: item.body,
}));

registry.sort((a, b) => a.id.localeCompare(b.id));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(registry, null, 2) + '\n');

console.log(`registry: ${registry.length} items → ${path.relative(REPO_ROOT, OUT)}`);
