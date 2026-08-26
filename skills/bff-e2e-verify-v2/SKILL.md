---
name: bff-e2e-verify-v2
description: "Этап 4 пайплайна bff-pipeline — e2e проверка новой операции против BFF Target из workspace .env. Используй всегда, когда нужно проверить, что query/mutation реально работает, прогнать GraphQL-запрос против уже живого BFF — даже если пользователь говорит просто «проверь, что отдаёт бэк». V2: проверка через bff-pipeline runner."
---

# BFF E2E Verify V2 — этап 4

Дирижёр pipeline: [bff-pipeline-v2/SKILL.md](../bff-pipeline-v2/SKILL.md)

Доказывает, что операция работает end-to-end: схема → резолвер → DataSource → микросервис → ответ. Цель — BFF Target (`BFF_PIPELINE_BFF_TARGET` в workspace `.env`), не Docker и не «всегда свой npm run dev».

## Проверка этапа — runner (единственный источник статуса)


AI **не** интерпретирует stdout команд — только результат runner (`PASS` / `FAIL` / `BLOCKED`). **Не читать** исходники runner (`scripts/`, `scripts/lib/**`, `*.mjs` гейты, AST-чекеры, фикстуры, внутренности SPEC): только вызов CLI и компактный JSON (`status`, `compact`, при FAIL/BLOCKED — `checks` и хвост `logPath` ~50 строк). При FAIL чинить продуктовый код по `checks`, не открывать runner, чтобы понять гейт. Разрешено: этот SKILL.md, код bff/client, `@realt-by/api-schema`.

```bash
V2="$HOME/.claude/skills/bff-pipeline-v2"
node "$V2/scripts/bff-pipeline.mjs" verify --stage 4 --manifest ~/Documents/work/mls-project/manifest.json
```

- **PASS** → сразу этап 5 (`client-types-sync-v2`).
- **FAIL** → чинить код по `checks`, повторить. Override **запрещён**. В `checks[].detail` должна быть ошибка из ответа, включая вложенную ошибку микроса (`extensions.errors`: code, errorCode, message), не только общую обёртку GraphQL.
- **BLOCKED** → сообщить пользователю.

Manifest: обязательны `e2eQuery`, `e2eVariables`, `assertions`; опционально `idempotencyKey`. В workspace `.env` обязательны `BFF_PIPELINE_BFF_ROOT` и `BFF_PIPELINE_BFF_TARGET`.

Порядок:

1. Ping GraphQL `{ __typename }` на BFF Target.
2. Если BFF отвечает — e2e-операция на тот же URL. `npm run dev` не запускать, процесс не гасить.
3. После ping сравнить fingerprint нормализованной live-схемы с локальными `.gql` из `BFF_PIPELINE_BFF_ROOT`. Несовпадение — BLOCKED: URL жив, но BFF чужой или устаревший.
4. Если ping не отвечает сетью — один раз `npm run dev` из `BFF_PIPELINE_BFF_ROOT`, ждать готовности повторным ping на тот же Target и проверить identity. Не парсить логи `🚀`. После e2e гасить только свой child.
5. Нет `BFF_PIPELINE_BFF_TARGET` — INVALID_INPUT. Ошибка TLS — BLOCKED, verify не отключать. Docker не используется.
5. Для запросов, которым нужен логин админки: `E2E_AUTH_TOKEN` в `.env` рядом с `manifest.json` (или в shell). Runner ставит `x-realt-auth-token`. Без переменной заголовок не ставится.


## Ponytail

Один реальный запрос по счастливому пути + один граничный — достаточно. Не гоняй матрицу кейсов руками: цель этапа — доказать сквозную связность, а не покрытие.

## Отрицательные примеры

❌ «Сервер поднялся, introspection отвечает» — и этап засчитан. Схема валидна ≠ операция работает: резолвер мог не зарегистрирован, DataSource может 404'ить.

✅ Реальный запрос к самой операции с реальными переменными.

❌ В ответе есть `data` — и поехали дальше, не глядя в `errors`.

✅ Смотреть оба дерева: частично заполненная `data` + непустой `errors` = этап НЕ пройден (ошибка вложенного поля — тоже ошибка).

## Провал

Провал → вернуться на этап, который виноват (ошибка схемы → этап 1, 4xx/5xx от микросервиса → этап 2, null в полях → этап 3), починить там, повторить e2e. Не чинить «сверху».

Зелёный → сразу этап 5 (`client-types-sync-v2`).
