---
name: bff-pipeline-v2
description: Дирижёр сквозного bff-pipeline с детерминированным Node.js runner — единственный источник PASS/FAIL/BLOCKED для этапов 0–6. Триггеры: «bff-pipeline v2», «новая graphql фича под ключ», «runner pipeline», «gate проверка graphql фичи».
---

# BFF Pipeline V2 — дирижёр с runner

**Единственный источник статуса этапов — runner.** AI генерирует код и принимает решения пользователя; AI **не** интерпретирует stdout `codegen`/`eslint`/`curl` и **не** объявляет этап успешным без `PASS` от runner.

V1 ([../bff-pipeline/SKILL.md](../bff-pipeline/SKILL.md)) остаётся для ручной отладки. Не смешивать V1 и V2 в одном прогоне.

## Этапы и stage skills

| # | Runner gate | Stage skill V2 (генерация) | Команда проверки |
|---|-------------|----------------------------|------------------|
| 0 | preflight | — (только runner) | `preflight check` / `apply --confirm` |
| 1 | schema | [`bff-schema-create-v2`](../bff-schema-create-v2/SKILL.md) | `verify --stage 1` |
| 2 | datasource | [`bff-datasource-create-v2`](../bff-datasource-create-v2/SKILL.md) | `verify --stage 2` |
| 3 | resolver | [`bff-resolver-create-v2`](../bff-resolver-create-v2/SKILL.md) | `verify --stage 3` |
| 4 | e2e | [`bff-e2e-verify-v2`](../bff-e2e-verify-v2/SKILL.md) | `verify --stage 4` |
| 5 | client-codegen | [`client-types-sync-v2`](../client-types-sync-v2/SKILL.md) | `verify --stage 5` |
| 6 | apollo | [`client-apollo-create-v2`](../client-apollo-create-v2/SKILL.md) | `verify --stage 6` |

Порядок жёсткий: 0 → 1 → 2 → 3 → 4 → 5 → 6. Перепрыгивать можно только если этап уже **PASS** в текущем run (fingerprint совпадает).

## Шаг 0 — preflight

```bash
V2="$HOME/.claude/skills/bff-pipeline-v2"

# Только проверка (не меняет файлы)
node "$V2/scripts/bff-pipeline.mjs" preflight check --stack bff-mls

# Применить обновления — только после подтверждения пользователя
node "$V2/scripts/bff-pipeline.mjs" preflight apply --stack bff-mls --confirm
```

**PASS** → этап 1. **BLOCKED** (устаревший api-schema / сеть) → спросить про `--confirm apply` или `--override-blocked`. **FAIL** → чинить, override запрещён.

## Полный pipeline

```bash
# Этапы 0→6 с checkpoint и fingerprint
node "$V2/scripts/bff-pipeline.mjs" run --manifest ~/Documents/work/mls-project/manifest.json

# Resume прерванного run
node "$V2/scripts/bff-pipeline.mjs" run --manifest ~/Documents/work/mls-project/manifest.json --run-id 20260814120000-abc123

# Начать с этапа N (ранние считаются пройденными)
node "$V2/scripts/bff-pipeline.mjs" run --manifest ~/Documents/work/mls-project/manifest.json --from-stage 3

# Override BLOCKED (FAIL override запрещён)
node "$V2/scripts/bff-pipeline.mjs" run --manifest ~/Documents/work/mls-project/manifest.json --override-blocked

# JSON с деталями
node "$V2/scripts/bff-pipeline.mjs" run --manifest ~/Documents/work/mls-project/manifest.json --json
```

**PASS** на всех этапах → `pipeline PASS (stages 0-6)`. **FAIL** → остановка, исправить код, повторить тот же этап. **BLOCKED** → остановка; продолжение только с `--override-blocked` после явного решения пользователя.

Resume переиспользует этап только при совпадении fingerprint; изменение входа инвалидирует этап и все зависимые поздние.

## Отдельный этап (отладка)

```bash
node "$V2/scripts/bff-pipeline.mjs" verify --stage 1 --manifest ~/Documents/work/mls-project/manifest.json
# stages 2–6 аналогично; stage 0 = preflight check
```

Для полного прогона используй `run`. Отдельные `verify --stage` — только отладка.

## Контракт результата

Runner возвращает exit code и короткий результат:

| status | exit | AI действие |
|--------|------|-------------|
| PASS | 0 | Следующий этап сразу, без подтверждения |
| FAIL | 1 | Исправить код, повторить. Override **запрещён**. В ответе пользователю цитировать `checks[].detail` целиком, включая вложенную ошибку микроса |
| BLOCKED | 2 | Сообщить пользователю; override только явный |

С `--json` читай `status`, `compact`, `logPath`. При **PASS** массив `checks` не возвращается — только `checksPassed`; полный log не загружай. При **FAIL**/**BLOCKED** `checks` содержит только упавшие/заблокированные проверки (detail и fullDiff обрезаны); полный текст — в `logPath`, читай из него только хвост (~50 строк), не весь файл.

## Manifest (минимум)

**Расположение:** только в корне workspace, не внутри git-репозиториев проекта.

| stack | workspace manifest |
|---|---|
| `bff-mls` | `mls-project/manifest.json` |
| `bff-admin` | `admin-project/manifest.json` |

Запрещено: `bff-mls/manifest.json`, `bff-admin/manifest.json`, `admin/manifest.json`, `mls/manifest.json` и любые вложенные пути внутри `config.projects`.

Runner отклонит `manifest.json` вне workspace root. Фикстуры runner (`tests/fixtures/**`) — исключение.

```bash
# bff-admin
node "$V2/scripts/bff-pipeline.mjs" run --manifest ~/Documents/work/admin-project/manifest.json

# bff-mls
node "$V2/scripts/bff-pipeline.mjs" run --manifest ~/Documents/work/mls-project/manifest.json
```

Содержимое:

```json
{
  "operation": "workStatusCreate",
  "kind": "mutation",
  "domain": "work-statuses",
  "stack": "bff-mls",
  "client": "mls",
  "service": "pricing",
  "endpoint": "/r-points-packages",
  "apiResponseType": "PricingRPointsPackage",
  "httpMethod": "POST",
  "datasourceMethod": "createRPointsPackage",
  "newService": false
}
```

Для нового микросервиса: `"newService": true`, `"dataSourceKey": "pricingApi"`.

Этап 4 — e2e:

```json
{
  "e2eQuery": "query demoListing($data: DemoListingInput!) { demoListing(data: $data) { results { uuid } } }",
  "e2eVariables": { "data": { "page": 1, "pageSize": 10 } },
  "assertions": [
    { "id": "results-present", "path": "data.demoListing.results", "notEmpty": true },
    { "id": "uuid-type", "path": "data.demoListing.results[0].uuid", "type": "string" }
  ],
  "idempotencyKey": "optional-for-mutation-retry"
}
```

Связи workspace задаются в `.env` рядом с `manifest.json`:

```dotenv
BFF_PIPELINE_BFF_ROOT=/absolute/path/to/workspace/bff
BFF_PIPELINE_CLIENT_ROOT=/absolute/path/to/workspace/client
BFF_PIPELINE_BFF_TARGET=https://api.realt.loc:8005/graphql
BFF_PIPELINE_GRAPHIFY_VAULT=/absolute/path/to/Obsidian Vault/Работа
E2E_AUTH_TOKEN=
```

`BFF_PIPELINE_BFF_TARGET` обязателен для этапов 4 и 5. После ping runner сравнивает SHA-256 нормализованной live-схемы с локальными `.gql` из `BFF_PIPELINE_BFF_ROOT`: чужой или устаревший BFF даёт BLOCKED. Этап 4 делает e2e только после совпадения identity. Этап 5 повторяет ту же проверку перед `npm run codegen`; `.env` клиента не является источником схемы.

Этап 5 — client codegen:

```json
{
  "client": "mls",
  "expectedTypes": ["QueryDemoListingArgs", "DemoListingInput", "DemoListing"]
}
```

Этап 6 — apollo:

```json
{
  "client": "admin",
  "apolloPath": "src/features/work-statuses/apollo/apollo-work-statuses-create-work-status.mutation.ts",
  "hookName": "useApolloWorkStatusesCreateWorkStatusMutation"
}
```

Type-check смотрит только ошибки в `apolloPath`. Чужие падения `tsc` в проекте этап не валят. ESLint — только этот файл, без `--fix`.

Полная спека: [SPEC.md](../bff-pipeline/SPEC.md). Решения: [CONTEXT.md](../bff-pipeline/CONTEXT.md) #19–#58.

## Правила для AI

1. **Генерация кода** — AI (stage skills). **Проверки** — только runner.
2. Не интерпретировать stdout команд — только `status`/`compact`/`checks` из runner.
3. **FAIL** — исправить код, повторить тот же `--stage`. Override нельзя.
4. **BLOCKED** — сообщить пользователю; продолжение только после явного override или `--confirm apply`.
5. При **PASS** не загружать полный log в контекст. При **FAIL**/**BLOCKED** из `logPath` читать только хвост (~50 строк), не весь файл.
6. После **PASS** этапа N — короткий статус («Этап N PASS») и **сразу** генерировать/вызывать этап N+1 без подтверждения. Спрашивать пользователя только на **BLOCKED**, на развилке продукта (поля схемы, имя операции) до генерации, и в конце пайплайна (после этапа 6 PASS). **FAIL** — чинить код, повторить тот же этап.
7. Уже зелёный этап в V1 без fingerprint V2 — **не** считать пройденным для V2.
8. **Не читать реализацию runner.** Запрещено открывать `scripts/`, `scripts/lib/**`, `*.mjs` гейты, AST-чекеры, фикстуры тестов и внутренности SPEC, чтобы понять, как устроена проверка. AI только **вызывает** CLI (`preflight` / `verify --stage` / `run`) и читает компактный JSON: `status`, `compact`, при FAIL/BLOCKED — `checks` и хвост `logPath` (~50 строк). При FAIL чинить **продуктовый код** (схема / datasource / resolver / apollo) по detail упавших `checks` — не исходники runner. Разрешено читать: этот SKILL.md, продуктовый код bff/client, типы `@realt-by/api-schema`, соседние резолверы/.gql как шаблоны генерации.

## Config и тесты

Пути проектов: `config/default.config.json` (переопределение `--config`).

```bash
node "$V2/scripts/bff-pipeline.mjs" test
```

После каждого тестового файла — таблица: статус и пояснение, **что именно проверяет** тест. В конце прогона — сводка PASS/FAIL по этапам.

## Ponytail

Выбрал V2 — все gates через runner. Минимум этапов: resume с checkpoint, не переделывай пройденное.
