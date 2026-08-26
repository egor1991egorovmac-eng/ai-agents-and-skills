# Agents

## realt-flow

Флоу REALT-фичи под ключ: сторя YouTrack → фича-ветка + draft-MR → таск-ветки → MR. Скрипты в [`realt-flow/scripts/`](realt-flow/scripts/), варианты: `claude-SKILL.md`, `opencode-agent.md`, `cursor-realt-flow.mdc`.

## bff-pipeline

Агенты пайплайна bff-pipeline-v2, разбитые на BFF- и client-стороны. Runner: `~/.claude/skills/bff-pipeline-v2/scripts/bff-pipeline.mjs`.

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
