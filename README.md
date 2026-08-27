# ai-agents-and-skills

Агенты и скилы для AI-кодинговых инструментов (Claude Code, OpenCode, Cursor).

🔗 Страница: [ai-agents-and-skills.vercel.app](https://ai-agents-and-skills.vercel.app/)

## Сайт

Next.js (SSG, `output: export`) в папке [`docs/`](docs/): главная со списком и поиском по названию,
у каждого агента/скила своя страница с полным текстом SKILL.md. Vercel деплоит из `docs/`.

```bash
cd docs
npm run dev     # локальная разработка
npm run sync    # пересобрать data/registry.json из frontmatter SKILL.md
npm run build   # SSG-сборка в out/
```

Данные сайта — `docs/data/registry.json`, генерируется из `skills/*/SKILL.md` и `agents/*/claude-agent.md`
(script: `docs/scripts/sync-registry.mjs`). Новый скил = папка `skills/<name>/SKILL.md` → появится на сайте
после `npm run sync`. Деплой на Vercel — автоматически при пуше.

## Установка через npx skills

```bash
# все скилы, интерактивно (выбор скилов и агентов)
npx skills add egor1991egorovmac-eng/ai-agents-and-skills -g

# только пайплайн bff
npx skills add egor1991egorovmac-eng/ai-agents-and-skills -g \
  --skill bff-pipeline-v2 --skill bff-pipeline-bff --skill bff-pipeline-client

# только realt-flow
npx skills add egor1991egorovmac-eng/ai-agents-and-skills -g --skill realt-flow
```

Каталог скилов в [`skills/`](skills/) — 10 штук: `bff-pipeline-v2` (дирижёр + runner),
`bff-{schema,datasource,resolver,e2e}-create/verify-v2` (этапы 1–4),
`client-{types-sync,apollo-create}-v2` (этапы 5–6), `bff-pipeline-bff`, `bff-pipeline-client`, `realt-flow`.

## Агенты (subagent / правило)

Форматы агентов для ручной установки — в [`agents/`](agents/README.md) или через `./install.sh`:

```bash
./install.sh              # всё: Claude + OpenCode + Cursor
./install.sh --claude     # только Claude Code
```

Агенты — это обёртки над теми же скилами: `bff-pipeline-bff` (этапы 0–4) и
`bff-pipeline-client` (этапы 5–6) гоняют runner `~/.claude/skills/bff-pipeline-v2/scripts/bff-pipeline.mjs`.
