---
name: client-types-sync-v2
description: Этап 5 пайплайна bff-pipeline — синхронизация типов клиента (mls, admin, www) со схемой BFF через codegen. Используй всегда, когда в lib/graphql/types.ts не хватает типов для новой операции, нужно подтянуть свежую GraphQL-схему в клиент — даже если пользователь говорит просто «обнови типы» или «почему нет QueryXxxArgs». V2: проверка через bff-pipeline runner.
---

# Client Types Sync V2 — этап 5

Дирижёр pipeline: [bff-pipeline-v2/SKILL.md](../bff-pipeline-v2/SKILL.md)

Обновляет `src/lib/graphql/types.ts` в клиенте из схемы BFF Target (`BFF_PIPELINE_BFF_TARGET` в workspace `.env`). Файл генерируется codegen'ом и перезаписывается целиком — **руками его не править никогда**.

## Предусловие

Codegen запускается в `BFF_PIPELINE_CLIENT_ROOT`, но URL схемы берётся из `BFF_PIPELINE_BFF_TARGET`, не из `admin/.env` / `GRAPHQL_URL`. Перед codegen runner сравнивает fingerprint live-схемы с локальными `.gql` из `BFF_PIPELINE_BFF_ROOT`; несовпадение даёт BLOCKED и codegen не запускается.

## Проверка этапа — runner (единственный источник статуса)


AI **не** интерпретирует stdout команд — только результат runner (`PASS` / `FAIL` / `BLOCKED`). **Не читать** исходники runner (`scripts/`, `scripts/lib/**`, `*.mjs` гейты, AST-чекеры, фикстуры, внутренности SPEC): только вызов CLI и компактный JSON (`status`, `compact`, при FAIL/BLOCKED — `checks` и хвост `logPath` ~50 строк). При FAIL чинить продуктовый код по `checks`, не открывать runner, чтобы понять гейт. Разрешено: этот SKILL.md, код bff/client, `@realt-by/api-schema`.

```bash
V2="$HOME/.claude/skills/bff-pipeline-v2"
node "$V2/scripts/bff-pipeline.mjs" verify --stage 5 --manifest ~/Documents/work/mls-project/manifest.json
```

- **PASS** → сразу этап 6 (`client-apollo-create-v2`).
- **FAIL** → чинить код по `checks`, повторить. Override **запрещён**.
- **BLOCKED** → сообщить пользователю.

Manifest: `client`, `expectedTypes`. Workspace `.env`: `BFF_PIPELINE_CLIENT_ROOT`, `BFF_PIPELINE_BFF_TARGET`.
