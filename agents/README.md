# Agents

## realt-flow

Флоу REALT-фичи под ключ: сторя YouTrack → фича-ветка + draft-MR → таск-ветки → MR. Скил со скриптами: [`../skills/realt-flow/`](../skills/realt-flow/) (ставится через `npx skills add ... --skill realt-flow`). Здесь только варианты для агентов: `opencode-agent.md` → `~/.config/opencode/agent/realt-flow.md`, `cursor-realt-flow.mdc` → `~/.cursor/rules/realt-flow.mdc`; скрипты им нужны в `~/.config/opencode/scripts/realt-flow/` (`./install.sh --opencode`).

## bff-pipeline

Агенты пайплайна bff-pipeline-v2, разбитые на BFF- и client-стороны.

Связанные скилы в [`../skills/`](../skills/):

| Скил | Что это |
|---|---|
| [`bff-pipeline-v2`](../skills/bff-pipeline-v2/) | Дирижёр + runner (`scripts/bff-pipeline.mjs`) — единственный источник PASS/FAIL/BLOCKED |
| [`bff-schema-create-v2`](../skills/bff-schema-create-v2/) | Этап 1 — .gql схема |
| [`bff-datasource-create-v2`](../skills/bff-datasource-create-v2/) | Этап 2 — DataSource |
| [`bff-resolver-create-v2`](../skills/bff-resolver-create-v2/) | Этап 3 — резолвер (+ трансформер) |
| [`bff-e2e-verify-v2`](../skills/bff-e2e-verify-v2/) | Этап 4 — e2e против BFF Target |
| [`client-types-sync-v2`](../skills/client-types-sync-v2/) | Этап 5 — codegen типов клиента |
| [`client-apollo-create-v2`](../skills/client-apollo-create-v2/) | Этап 6 — Apollo query/mutation файлы |

Runner: `~/.claude/skills/bff-pipeline-v2/scripts/bff-pipeline.mjs` (локальная копия — `skills/bff-pipeline-v2/scripts/`).

| Агент | Этапы | Stage skills |
|---|---|---|
| [bff-pipeline-bff](bff-pipeline-bff/) | 0–4: preflight → schema → datasource → resolver → e2e | `bff-schema-create-v2`, `bff-datasource-create-v2`, `bff-resolver-create-v2`, `bff-e2e-verify-v2` |
| [bff-pipeline-client](bff-pipeline-client/) | 5–6: client-codegen → apollo (`--from-stage 5`) | `client-types-sync-v2`, `client-apollo-create-v2` |

Preflight проверяет только pin `@realt-by/api-schema`; при устаревшей версии — BLOCKED, агент спрашивает пользователя и обновляет через `preflight apply --confirm`. Graphify не проверяется.

Файлы в каждой папке:

- `claude-agent.md` → `~/.claude/agents/<name>.md`
- `opencode-agent.md` → `~/.config/opencode/agent/<name>.md`
- `cursor-<name>.mdc` → `~/.cursor/rules/<name>.mdc`

Передача работы: после PASS этапа 4 BFF-агент передаёт управление client-агенту.
