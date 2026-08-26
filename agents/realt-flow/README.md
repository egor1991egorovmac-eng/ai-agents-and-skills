# realt-flow

Агент-оркестратор флоу разработки REALT: ссылка на сторю YouTrack → фича-ветка от stage + draft-MR → таск-ветки → MR тасков → итоговое сообщение для команды. Поддерживает баги и мелкие таски без фичи.

## Структура

| Файл | Что это |
|---|---|
| `scripts/AGENT.md` | Единый источник инструкций агента (правь только его) |
| `scripts/sync-agent.ts` | Синк инструкций в opencode + Claude Code + Cursor |
| `scripts/*.ts` | Скрипты флоу (запуск через bun) |
| `opencode-agent.md` | Сгенерированная версия для opencode (`~/.config/opencode/agent/`) |
| `claude-SKILL.md` | Сгенерированная версия для Claude Code (`~/.claude/skills/realt-flow/`) |
| `cursor-realt-flow.mdc` | Сгенерированная версия для Cursor (`~/.cursor/rules/`) |

## Установка

```bash
# 1. Скопировать скрипты
cp -r scripts ~/.config/opencode/scripts/realt-flow

# 2. Токен YouTrack (Profile → Account Security → YouTrack Tokens)
cd ~/.config/opencode/scripts/realt-flow
cp .env.example .env && nano .env   # вставить YOUTRACK_TOKEN=...

# 3. Проверка окружения (6 репо + glab)
bun run check-env.ts

# 4. Раскладать агента по трём платформам
bun run sync-agent.ts
```

Требования: [bun](https://bun.sh), glab (авторизован в gitlab.realt.by), доступ к репо mls/bff-mls/admin/bff-admin/www/bff-www.

## Использование

Вызови агента `realt-flow` в opencode / Claude Code / Cursor и дай ссылку на сторю:
```
https://youtrack.realt.by/issue/REALT-10209/ispravit-zagolovki
```
Перед каждым реальным действием агент показывает план (`--dry-run`) — ничего не создаётся без подтверждения.

## Соглашения

| Что | Формат |
|---|---|
| Фича-ветка | `feature/REALT-{id}-{slug}` |
| Ветка таска/бага | `REALT-{id}-{описание}` |
| Title MR фичи | `[Title]-Realt-{id}-{slug}` (draft → stage) |
| Title MR таска/бага | `REALT-{id}-{описание}` |

**Безопасность:** push в `stage` заблокирован на уровне скриптов; MR в stage — только draft фичи или обычный MR бага (`--to-stage`).
