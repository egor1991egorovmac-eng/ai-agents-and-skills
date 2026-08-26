# ai-agents-and-skills

Агенты и скилы для AI-кодинговых инструментов (Claude Code, OpenCode, Cursor).

🔗 Страница: [ai-agents-and-skills.vercel.app](https://ai-agents-and-skills.vercel.app/)

## Установка через npx skills

> Репозиторий приватный — используй SSH-URL (нужен настроенный SSH-ключ):
> `npx skills add git@github.com:egor1991egorovmac-eng/ai-agents-and-skills.git -g`
> Шорткат `owner/repo` ходит по HTTPS и в приватный репо не пустит без токена.

```bash
# все скилы, интерактивно (выбор скилов и агентов)
npx skills add git@github.com:egor1991egorovmac-eng/ai-agents-and-skills.git -g

# только пайплайн bff
npx skills add git@github.com:egor1991egorovmac-eng/ai-agents-and-skills.git -g \
  --skill bff-pipeline-v2 --skill bff-pipeline-bff --skill bff-pipeline-client

# только realt-flow
npx skills add git@github.com:egor1991egorovmac-eng/ai-agents-and-skills.git -g --skill realt-flow
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
