1:"$Sreact.fragment"
2:I[9766,[],""]
3:I[8924,[],""]
9:I[7150,[],""]
:HL["/_next/static/css/0c1f36824e34da8b.css","style"]
0:{"P":null,"b":"qqmlSSq-1-VLtjCEaAiCt","p":"","c":["",""],"i":false,"f":[[["",{"children":["__PAGE__",{}]},"$undefined","$undefined",true],["",["$","$1","c",{"children":[[["$","link","0",{"rel":"stylesheet","href":"/_next/static/css/0c1f36824e34da8b.css","precedence":"next","crossOrigin":"$undefined","nonce":"$undefined"}]],["$","html",null,{"lang":"ru","children":[["$","head",null,{"children":[["$","link",null,{"rel":"preconnect","href":"https://fonts.googleapis.com"}],["$","link",null,{"rel":"preconnect","href":"https://fonts.gstatic.com","crossOrigin":"anonymous"}],["$","link",null,{"href":"https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600&family=IBM+Plex+Sans:wght@400;500&family=IBM+Plex+Mono:wght@400;500&display=swap","rel":"stylesheet"}]]}],["$","body",null,{"className":"min-h-screen","children":["$","div",null,{"className":"m-3.5 min-h-[calc(100vh-28px)] border border-white/20 outline outline-1 outline-white/5 outline-offset-[5px]","children":[["$","header",null,{"className":"flex flex-wrap justify-between border-b border-white/20 font-mono text-xs uppercase tracking-wider text-ink-dim","children":[["$","div",null,{"className":"border-r border-white/20 px-6 py-3.5","children":[["$","strong",null,{"className":"block font-display text-[15px] font-semibold tracking-wide normal-case text-ink","children":"AI-AGENTS-AND-SKILLS"}],"агенты и скилы · Realt frontend"]}],["$","div",null,{"className":"ml-auto px-6 py-3.5 text-right","children":["REV main",["$","br",null,{}],"SHEET 1 OF 1"]}]]}],["$","main",null,{"children":["$","$L2",null,{"parallelRouterKey":"children","error":"$undefined","errorStyles":"$undefined","errorScripts":"$undefined","template":["$","$L3",null,{}],"templateStyles":"$undefined","templateScripts":"$undefined","notFound":[[["$","title",null,{"children":"404: This page could not be found."}],["$","div",null,{"style":{"fontFamily":"system-ui,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\"","height":"100vh","textAlign":"center","display":"flex","flexDirection":"column","alignItems":"center","justifyContent":"center"},"children":["$","div",null,{"children":[["$","style",null,{"dangerouslySetInnerHTML":{"__html":"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}"}}],["$","h1",null,{"className":"next-error-h1","style":{"display":"inline-block","margin":"0 20px 0 0","padding":"0 23px 0 0","fontSize":24,"fontWeight":500,"verticalAlign":"top","lineHeight":"49px"},"children":404}],["$","div",null,{"style":{"display":"inline-block"},"children":["$","h2",null,{"style":{"fontSize":14,"fontWeight":400,"lineHeight":"49px","margin":0},"children":"This page could not be found."}]}]]}]}]],[]],"forbidden":"$undefined","unauthorized":"$undefined"}]}],["$","footer",null,{"className":"mt-auto border-t border-white/20","children":["$","div",null,{"className":"flex flex-wrap justify-between gap-4 px-6 py-4.5 font-mono text-xs tracking-wider text-ink-dim","children":[["$","span",null,{"children":["github.com/",["$","a",null,{"className":"text-cyan hover:underline","href":"https://github.com/egor1991egorovmac-eng/ai-agents-and-skills","children":"egor1991egorovmac-eng/ai-agents-and-skills"}]]}],["$","span",null,{"children":"SSG · Next.js · Tailwind"}]]}]}]]}]}]]}]]}],{"children":["__PAGE__",["$","$1","c",{"children":[["$","div",null,{"className":"px-6 py-10","children":[["$","section",null,{"className":"pb-8","children":[["$","p",null,{"className":"font-mono text-[13px] uppercase tracking-[0.14em] text-cyan","children":"Claude Code · OpenCode · Cursor"}],["$","h1",null,{"className":"mt-3 max-w-[18ch] font-display text-[clamp(26px,5vw,44px)] font-normal leading-tight","children":"Два агента и десять скилов на каждый день"}],["$","p",null,{"className":"mt-3 max-w-[60ch] text-ink-dim","children":[["$","b",null,{"className":"text-ink","children":"bff-pipeline-bff"}]," и"," ",["$","b",null,{"className":"text-ink","children":"bff-pipeline-client"}]," ведут GraphQL-фичу по этапам 0–6,",["$","b",null,{"className":"text-ink","children":" realt-flow"}]," доводит сторю от YouTrack до готовых MR. Ставятся отдельной командой на каждого."]}]]}],["$","section",null,{"children":[["$","div",null,{"className":"mb-4 flex items-baseline gap-3","children":["$L4","$L5"]}],"$L6"]}]]}],null,"$L7"]}],{},null,false]},null,false],"$L8",false]],"m":"$undefined","G":["$9",[]],"s":false,"S":true}
a:I[5339,["974","static/chunks/app/page-646f0bdef7632534.js"],"SearchList"]
15:I[4431,[],"OutletBoundary"]
17:I[5278,[],"AsyncMetadataOutlet"]
19:I[4431,[],"ViewportBoundary"]
1b:I[4431,[],"MetadataBoundary"]
1c:"$Sreact.suspense"
4:["$","h2",null,{"className":"whitespace-nowrap font-display text-lg","children":"Каталог"}]
5:["$","span",null,{"className":"h-px flex-1 bg-white/20"}]
b:T1746,# BFF DataSource Create V2 — этап 2

Дирижёр pipeline: [bff-pipeline-v2/SKILL.md](../bff-pipeline-v2/SKILL.md)

Добавляет метод обращения к микросервису. Проект: `mls-project/bff-mls`, папка `src/data-sources/`.

## Вводные (доспрашивать точечно)

- Микросервис (определяет файл `{service}-api.ts`)
- Эндпоинт: метод (GET/POST/PUT/DELETE), путь `/api/rest/...`, path-параметры
- Тип ответа и тип body из `@realt-by/api-schema`

## Шаблон метода

```typescript
async getSavedSearchListing(body: SearchUserRequestProfListing) {
  const response = await this.post<ResponseShape<UserRequestProfListing>>(
    '/api/rest/v1/user-request-prof/listing',
    { body }
  );

  if (!response.success) {
    throw new ApiDataSourceError(response.errors);
  }

  return response;
}
```

Path-параметры — через плейсхолдеры и `pathnameData`:

```typescript
async deleteSavedSearch(uuid: string) {
  const response = await this.delete<ResponseShape<null>>(
    '/api/rest/v1/user-request-prof/:uuid',
    {
      pathnameData: { uuid },
    }
  );

  if (!response.success) {
    throw new ApiDataSourceError(response.errors);
  }

  return response;
}
```

## Правила

- **Типы только из `@realt-by/api-schema`** (включая глубокие пути: `@realt-by/api-schema/typescript/{service}/http/V1/...`). Самостоятельно `interface`/`type` для API-ответов не создавать. Типа нет → стоп, попросить обновить пакет.
- **Ошибки — здесь, а не в резолвере**: `!response.success` → `throw new ApiDataSourceError(response.errors)`. Резолвер получает уже чистый `response`.
- Класс наследует `ApiDataSourceRest`, host/port — из env (`process.env.{SERVICE}_HOST`, `{SERVICE}_PORT`).
- Request/Response memo работают автоматически в `ApiDataSourceRest` — дедупликацию руками не делать.

## Если микросервиса ещё нет

Создать `src/data-sources/{service}-api.ts`:

```typescript
import { ApiDataSourceError } from 'utils/errors';

import { ApiDataSourceRest } from './api-data-source-rest';

import type { ResponseShape } from '@realt-by/api-schema';

const host = process.env.MY_SERVICE_HOST || '';
const port = process.env.MY_SERVICE_PORT;

export class MyServiceApi extends ApiDataSourceRest {
  constructor(config: Pick<ApiDataSourceRest, 'req'>) {
    super({ ...config, host, port });
  }
}
```

Затем:

1. Зарегистрировать в `src/data-sources/index.ts` (в `getDataSources`)
2. Добавить env-переменные `{SERVICE}_HOST`, `{SERVICE}_PORT` (сообщить пользователю, что их нужно прописать в окружениях)

## Ponytail (сначала лестница)

1. Метод уже есть? `grep` по `src/data-sources/` — эндпоинт мог быть прокинут раньше.
2. Сервис уже есть? Не плоди новый `{service}-api.ts`, если метод логично ложится в существующий файл.
3. Хватает существующего типа из api-schema? Не создавай свой.

Минимальный метод лучше универсального: параметры — ровно те, что нужны текущей операции.

## Отрицательные примеры

❌ Свой интерфейс для ответа API:

```typescript
// Плохо
interface UserRequestProfListing {
  results: Array<{ uuid: string }>;
}
```

✅ `import type { UserRequestProfListing } from '@realt-by/api-schema'`. Типа нет → стоп, попросить обновить пакет.

❌ Вернуть ответ без проверки `success`:

```typescript
// Плохо — ошибки микросервиса молча поедут в резолвер как данные
async getListing(body: SearchInput) {
  return this.post<ResponseShape<Listing>>('/api/rest/v1/listing', { body });
}
```

✅ `if (!response.success) { throw new ApiDataSourceError(response.errors); }` — затем `return response`.

❌ Относительные импорты за пределы модуля (`../../../utils/errors`).

✅ Абсолютные: `utils/errors`, `./api-data-source-rest` для соседнего файла.

## Проверка этапа — runner (единственный источник статуса)


AI **не** интерпретирует stdout команд — только результат runner (`PASS` / `FAIL` / `BLOCKED`). **Не читать** исходники runner (`scripts/`, `scripts/lib/**`, `*.mjs` гейты, AST-чекеры, фикстуры, внутренности SPEC): только вызов CLI и компактный JSON (`status`, `compact`, при FAIL/BLOCKED — `checks` и хвост `logPath` ~50 строк). При FAIL чинить продуктовый код по `checks`, не открывать runner, чтобы понять гейт. Разрешено: этот SKILL.md, код bff/client, `@realt-by/api-schema`, соседние datasource как шаблоны.

```bash
V2="$HOME/.claude/skills/bff-pipeline-v2"
node "$V2/scripts/bff-pipeline.mjs" verify --stage 2 --manifest ~/Documents/work/mls-project/manifest.json
```

- **PASS** → сразу этап 3 (`bff-resolver-create-v2`).
- **FAIL** → чинить код по `checks`, повторить. Override **запрещён**.
- **BLOCKED** → сообщить пользователю.

Gate: метод, HTTP verb, endpoint, api-schema типы, error handling, регистрация.c:T1252,# BFF E2E Verify V2 — этап 4

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

Зелёный → сразу этап 5 (`client-types-sync-v2`).d:T1f01,Ты — агент BFF-стороны пайплайна bff-pipeline-v2. Отвечаешь за **этапы 0–4**: preflight, schema, datasource, resolver, e2e. Этапы 5–6 (client codegen, apollo) выполняет агент `bff-pipeline-client`.

**Единственный источник статуса этапов — runner.** Ты генерируешь код и принимаешь решения пользователя; ты **не** интерпретируешь stdout `codegen`/`eslint`/`curl` и **не** объявляешь этап успешным без `PASS` от runner.

V1 (`~/.claude/skills/bff-pipeline/SKILL.md`) остаётся для ручной отладки. Не смешивать V1 и V2 в одном прогоне.

## Этапы 0–4

| # | Runner gate | Stage skill V2 (генерация) | Команда проверки |
|---|-------------|----------------------------|------------------|
| 0 | preflight | — (только runner) | `preflight check` / `apply --confirm` |
| 1 | schema | [`bff-schema-create-v2`](../../.claude/skills/bff-schema-create-v2/SKILL.md) | `verify --stage 1` |
| 2 | datasource | [`bff-datasource-create-v2`](../../.claude/skills/bff-datasource-create-v2/SKILL.md) | `verify --stage 2` |
| 3 | resolver | [`bff-resolver-create-v2`](../../.claude/skills/bff-resolver-create-v2/SKILL.md) | `verify --stage 3` |
| 4 | e2e | [`bff-e2e-verify-v2`](../../.claude/skills/bff-e2e-verify-v2/SKILL.md) | `verify --stage 4` |

Порядок жёсткий: 0 → 1 → 2 → 3 → 4. Перепрыгивать можно только если этап уже **PASS** в текущем run (fingerprint совпадает).

## Шаг 0 — preflight

```bash
V2="$HOME/.claude/skills/bff-pipeline-v2"

# Только проверка (не меняет файлы)
node "$V2/scripts/bff-pipeline.mjs" preflight check --stack bff-mls

# Применить обновления — только после подтверждения пользователя
node "$V2/scripts/bff-pipeline.mjs" preflight apply --stack bff-mls --confirm
```

**PASS** → этап 1. **BLOCKED** (устаревший api-schema / сеть) → спросить про `--confirm apply` или `--override-blocked`. **FAIL** → чинить, override запрещён.

## Прогон этапов 0–4

```bash
# Этапы до 4 включительно не фильтруются отдельным флагом:
# запусти полный run или resume; после PASS этапа 4 передай управление агенту client.
node "$V2/scripts/bff-pipeline.mjs" run --manifest ~/Documents/work/mls-project/manifest.json

# Resume прерванного run
node "$V2/scripts/bff-pipeline.mjs" run --manifest ~/Documents/work/mls-project/manifest.json --run-id <id>

# Override BLOCKED (FAIL override запрещён)
node "$V2/scripts/bff-pipeline.mjs" run --manifest ~/Documents/work/mls-project/manifest.json --override-blocked

# JSON с деталями
node "$V2/scripts/bff-pipeline.mjs" run --manifest ~/Documents/work/mls-project/manifest.json --json
```

Отдельный этап (только отладка):

```bash
node "$V2/scripts/bff-pipeline.mjs" verify --stage N --manifest ~/Documents/work/mls-project/manifest.json
```

## Контракт результата

| status | exit | Действие |
|--------|------|----------|
| PASS | 0 | Следующий этап сразу, без подтверждения |
| FAIL | 1 | Исправить код, повторить. Override **запрещён**. Цитировать пользователю `checks[].detail` целиком, включая вложенную ошибку микроса |
| BLOCKED | 2 | Сообщить пользователю; override только явный |

С `--json` читай `status`, `compact`, `logPath`. При **PASS** массив `checks` не возвращается. При **FAIL**/**BLOCKED** из `logPath` читать только хвост (~50 строк), не весь файл.

## Manifest (минимум)

**Расположение:** только в корне workspace, не внутри git-репозиториев проекта.

| stack | workspace manifest |
|---|---|
| `bff-mls` | `mls-project/manifest.json` |
| `bff-admin` | `admin-project/manifest.json` |

Запрещено: `bff-mls/manifest.json`, `bff-admin/manifest.json` и любые вложенные пути внутри `config.projects`.

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
    { "id": "results-present", "path": "data.demoListing.results", "notEmpty": true }
  ],
  "idempotencyKey": "optional-for-mutation-retry"
}
```

Связи workspace задаются в `.env` рядом с `manifest.json`:

```dotenv
BFF_PIPELINE_BFF_ROOT=/absolute/path/to/workspace/bff
BFF_PIPELINE_CLIENT_ROOT=/absolute/path/to/workspace/client
BFF_PIPELINE_BFF_TARGET=https://api.realt.loc:8005/graphql
E2E_AUTH_TOKEN=
```

`BFF_PIPELINE_BFF_TARGET` обязателен для этапа 4. После ping runner сравнивает SHA-256 нормализованной live-схемы с локальными `.gql`: чужой или устаревший BFF даёт BLOCKED. Этап 4 делает e2e только после совпадения identity.

## Правила для агента

1. **Генерация кода** — ты (stage skills). **Проверки** — только runner.
2. Не интерпретировать stdout команд — только `status`/`compact`/`checks` из runner.
3. **FAIL** — исправить продуктовый код (схема / datasource / resolver), повторить тот же `--stage`. Override нельзя.
4. **BLOCKED** — сообщить пользователю; продолжение только после явного override или `--confirm apply`.
5. После **PASS** этапа N — короткий статус («Этап N PASS») и сразу следующий этап без подтверждения. Спрашивать пользователя только на **BLOCKED**, на развилке продукта (поля схемы, имя операции) до генерации. **FAIL** — чинить код, повторять этап.
6. Уже зелёный этап в V1 без fingerprint V2 — **не** считать пройденным для V2.
7. **Не читать реализацию runner.** Запрещено открывать `scripts/`, `scripts/lib/**`, `*.mjs` гейты, AST-чекеры, фикстуры тестов. Разрешено читать: SKILL.md, продуктовый код bff/client, типы `@realt-by/api-schema`, соседние резолверы/.gql как шаблоны генерации.

## Передача дальше

После **PASS этапа 4** сообщи: «Этапы 0–4 PASS. BFF-часть готова — передаю агенту bff-pipeline-client (этапы 5–6)». Если работаешь как subagent — верни результат вызывающему контексту; если основной — предложи вызвать агента client.e:T18d6,Ты — агент клиентской стороны пайплайна bff-pipeline-v2. Отвечаешь за **этапы 5–6**: client-codegen (синхронизация типов) и apollo (создание Apollo-файлов). Этапы 0–4 выполняет агент `bff-pipeline-bff` — считай их уже пройденными; если это не так, вернись к ним.

**Единственный источник статуса этапов — runner.** Ты генерируешь код; ты **не** интерпретируешь stdout `codegen`/`eslint`/`curl` и **не** объявляешь этап успешным без `PASS` от runner.

## Этапы 5–6

| # | Runner gate | Stage skill V2 (генерация) | Команда проверки |
|---|-------------|----------------------------|------------------|
| 5 | client-codegen | [`client-types-sync-v2`](../../.claude/skills/client-types-sync-v2/SKILL.md) | `verify --stage 5` |
| 6 | apollo | [`client-apollo-create-v2`](../../.claude/skills/client-apollo-create-v2/SKILL.md) | `verify --stage 6` |

## Прогон этапов 5–6

```bash
V2="$HOME/.claude/skills/bff-pipeline-v2"

# Начать с этапа 5 (ранние считаются пройденными)
node "$V2/scripts/bff-pipeline.mjs" run --manifest ~/Documents/work/mls-project/manifest.json --from-stage 5

# Resume прерванного run
node "$V2/scripts/bff-pipeline.mjs" run --manifest ~/Documents/work/mls-project/manifest.json --from-stage 5 --run-id <id>

# JSON с деталями
node "$V2/scripts/bff-pipeline.mjs" run --manifest ~/Documents/work/mls-project/manifest.json --from-stage 5 --json

# Override BLOCKED (FAIL override запрещён)
node "$V2/scripts/bff-pipeline.mjs" run --manifest ~/Documents/work/mls-project/manifest.json --from-stage 5 --override-blocked
```

Отдельный этап (только отладка):

```bash
node "$V2/scripts/bff-pipeline.mjs" verify --stage 5 --manifest ~/Documents/work/mls-project/manifest.json
node "$V2/scripts/bff-pipeline.mjs" verify --stage 6 --manifest ~/Documents/work/mls-project/manifest.json
```

**PASS** на обоих → «pipeline PASS (stages 5-6)». **FAIL** → исправить код, повторить. **BLOCKED** → сообщить пользователю; продолжение только с явным `--override-blocked`.

Resume переиспользует этап только при совпадении fingerprint; изменение входа инвалидирует этап и зависимые поздние.

## Контракт результата

| status | exit | Действие |
|--------|------|----------|
| PASS | 0 | Следующий этап сразу, без подтверждения |
| FAIL | 1 | Исправить код, повторить. Override **запрещён**. Цитировать пользователю `checks[].detail` целиком |
| BLOCKED | 2 | Сообщить пользователю; override только явный |

С `--json` читай `status`, `compact`, `logPath`. При **PASS** массив `checks` не возвращается. При **FAIL**/**BLOCKED** из `logPath` читать только хвост (~50 строк), не весь файл.

## Manifest (клиентские поля)

Manifest лежит в корне workspace (`mls-project/manifest.json`, `admin-project/manifest.json`). Полная структура — у агента `bff-pipeline-bff`. Клиентски значимые поля:

```json
{
  "stack": "bff-mls",
  "client": "mls"
}
```

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

`.env` рядом с manifest задаёт `BFF_PIPELINE_BFF_TARGET` — обязателен для этапа 5. Перед `npm run codegen` runner повторно проверяет SHA-256 live-схемы против локальных `.gql`; `.env` клиента не является источником схемы. Чужой или устаревший BFF даёт BLOCKED.

## Правила для агента

1. **Генерация кода** — ты (stage skills). **Проверки** — только runner.
2. Не интерпретировать stdout команд — только `status`/`compact`/`checks` из runner.
3. **FAIL** — исправить продуктовый код (types.ts / apolloPath), повторить тот же `--stage`. Override нельзя.
4. **BLOCKED** — сообщить пользователю; продолжение только после явного override.
5. После **PASS** этапа 5 — короткий статус и сразу генерировать этап 6 без подтверждения. Спрашивать пользователя только на **BLOCKED**, на развилке продукта (путь apolloPath, имя хука), и в конце пайплайна (после PASS этапа 6).
6. Уже зелёный этап в V1 без fingerprint V2 — **не** считать пройденным для V2.
7. **Не читать реализацию runner.** Запрещено открывать `scripts/`, `scripts/lib/**`, `*.mjs` гейты, AST-чекеры, фикстуры тестов. Разрешено читать: SKILL.md, продуктовый код клиента/BFF, типы `@realt-by/api-schema`, соседние apollo-файлы как шаблоны генерации.

## Завершение

После **PASS этапа 6** выведи итог: оба этапа PASS, какие файлы созданы (apolloPath, обновлённый types.ts), и предложи следующие шаги (коммит/MR).f:T2c88,# BFF Pipeline V2 — дирижёр с runner

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

Выбрал V2 — все gates через runner. Минимум этапов: resume с checkpoint, не переделывай пройденное.10:T1ebd,# BFF Resolver Create V2 — этап 3

Дирижёр pipeline: [bff-pipeline-v2/SKILL.md](../bff-pipeline-v2/SKILL.md)

Создаёт резолвер операции в bff-mls. Файл лежит рядом со схемой этапа 1:

```
src/graph/{domain}/query-{operation}/query-{operation}-resolver.ts
```

## Ponytail (сначала лестница)

Перед написанием кода остановись на первой ступени, которая держит:

1. Поле/операция вообще нужна? (YAGNI — лишнее поле = нагрузка на микросервис навсегда)
2. Уже есть в проекте? Проверь `src/data-transforms/`, `src/utils/`, соседние резолверы — переиспользуй, не переписывай.
3. Тривиальная склейка (`omitBy`, `??`, деструктуризация) делается инлайн — не плоди трансформер ради одной строки.

Резолвер — тонкий оркестратор: вызвал DataSource → отдал в трансформер → вернул. Если пишешь больше ~10 строк маппинга в резолвере — стоп, это трансформер. Удаление лучше добавления, скучное лучше умного.

Сознательное упрощение с известным потолком помечай `// ponytail: <потолок> — путь апгрейда`.

## Базовый шаблон

```typescript
import { createResolvers } from 'utils/create-resolvers';

export const queryOperationNameResolver = createResolvers({
  Query: {
    operationName: async (_, { data }, { dataSources }) => {
      const response = await dataSources.someAPI.getOperationData(data);

      return response.body;
    },
  },
});
```

После создания — **регистрация**: импорт в `src/graph/resolvers.ts` (в массив `mergeResolvers`). Без регистрации схема знает поле, а резолвить его некому.

## Поля, которых нет в ответе backend'а — паттерны A/B/C

**A. Поле из другого микросервиса, зависит от parent** → отдельный резолвер на вложенный тип. Поле запросится, только если клиент его запросил:

```typescript
AgenciesSearchResult: {
  viewData: async (parent, args, { dataSources }) => {
    const { uuid } = parent;

    if (!uuid) {
      return null;
    }

    return dataSources.viewsAPI.getAgencyViewData(uuid);
  },
},
```

**B. Поле вычисляется/мержится для всего списка** (второй запрос + склейка, напр. `fullAddress` из geo-справочника) → обогащение в корневом резолвере через `dataTransforms`, тип расширяется локально:

```typescript
interface ExtendedSearchItem extends MlsBaseAdvertisementSearchItem {
  fullAddress: FullAddress;
  imagesThumbs: string[];
}

// в резолвере
const withAddress = dataTransforms.elastic.setFullAddressInItem(response.results, geoResponse.body);

return {
  pagination: response.pagination,
  results: dataTransforms.object.getObjectsWithNormalizeImages(withAddress),
};
```

Несколько DataSource в корневом резолвере здесь допустимо — осознанное обогащение списка, а не скрытая зависимость. Независимые запросы — параллельно (`Promise.all`).

**C. Поля, дописываемые во вход мутации** (`uuid: uuidV1()`, `userUuid` из хедера) → маппинг прямо в резолвере:

```typescript
const leadInput = {
  ...input,
  uuid: uuidV1(),
  userUuid: getHeader(req, ServerHeaders.UserUuid),
};
```

## Трансформеры

Нетривиальный доменный маппинг выносится в `src/data-transforms/{domain}-transform.ts` (класс, регистрация в `index.ts`), даже при одном использовании — резолвер остаётся тонким.

## Батчинг (N+1)

Поле внутри массива, тянущее данные по каждому элементу, — через `batcher.createBatch`. Массив результатов обязан **индексно совпадать** с входными `keys`:

```typescript
const batch = batcher.createBatch(info, async (keys: readonly string[]) => {
  const response = await dataSources.elasticAPI.getCountByUuids(keys);

  return keys.map(uuid => {
    const found = response.body.find(item => item.uuid === uuid);
    return found ? found.data : [];
  });
});

return batch.load(parent.uuid);
```

## Отрицательные примеры

❌ Несколько DataSource в полевом резолвере (нарушает ленивость полей):

```typescript
// Плохо
DevelopersView: {
  tags: async (parent, _, { dataSources }) => {
    const tags = await dataSources.elasticAPI.getTags(parent.uuid);
    const extra = await dataSources.viewsAPI.getExtra(parent.uuid); // второй источник
    return { tags, extra };
  },
},
```

✅ Один резолвер — один DataSource; второе поле — второй резолвер.

❌ Ловить и глушить ошибки API в резолвере:

```typescript
// Плохо
try {
  return await dataSources.api.getData();
} catch {
  return null;
}
```

✅ Ошибки выброшены в DataSource (этап 2) и уезжают в дерево `errors`. Валидация уровня резолвера (лимиты, пустой вход) — через `throw new GQLResolverError(new MicrosError({...}).errors)`.

❌ Батч с фильтрацией результата (индексы разъезжаются с `keys`):

```typescript
// Плохо
return response.body.filter(item => keys.includes(item.uuid)).map(item => item.data);
```

✅ `keys.map(...)` — длина и порядок всегда совпадают с `keys`.

❌ Сорок строк маппинга инлайн в резолвере.

✅ Маппинг — в `dataTransforms.{domain}`, резолвер остаётся в 3 строки.

## Проверка этапа — runner (единственный источник статуса)


AI **не** интерпретирует stdout команд — только результат runner (`PASS` / `FAIL` / `BLOCKED`). **Не читать** исходники runner (`scripts/`, `scripts/lib/**`, `*.mjs` гейты, AST-чекеры, фикстуры, внутренности SPEC): только вызов CLI и компактный JSON (`status`, `compact`, при FAIL/BLOCKED — `checks` и хвост `logPath` ~50 строк). При FAIL чинить продуктовый код по `checks`, не открывать runner, чтобы понять гейт. Разрешено: этот SKILL.md, код bff/client, `@realt-by/api-schema`, соседние резолверы как шаблоны.

```bash
V2="$HOME/.claude/skills/bff-pipeline-v2"
node "$V2/scripts/bff-pipeline.mjs" verify --stage 3 --manifest ~/Documents/work/mls-project/manifest.json
```

- **PASS** → сразу этап 4 (`bff-e2e-verify-v2`).
- **FAIL** → чинить код по `checks`, повторить. Override **запрещён**.
- **BLOCKED** → сообщить пользователю.

Gate: имя поля, регистрация, void → `return true`, type-check, lint.11:T26d5,# BFF Schema Create V2 — этап 1

Дирижёр pipeline: [bff-pipeline-v2/SKILL.md](../bff-pipeline-v2/SKILL.md)

Создаёт `.gql` файл операции в bff-mls. Проект: `mls-project/bff-mls`.

## Вводные (доспрашивать точечно, чего не хватает)

- Операция: query или mutation, её имя (существительное, без `get`: `developersView`, `workStatusCreate`)
- Домен (папка в `graph/`): `objects`, `saved-search`, `pricing`, ...
- Микросервис и эндпоинт — чтобы найти тип ответа в `@realt-by/api-schema`

## Раскладка файлов

Папка на операцию, имя файла = имя операции:

```
src/graph/{domain}/query-{operation}/query-{operation}.gql
src/graph/{domain}/mutation-{operation}/mutation-{operation}.gql
```

Резолвер следующих этапов ляжет рядом (`{...}-resolver.ts`), поэтому одна папка = одна операция.

## Источник полей

Поля типа ответа берутся из пакета `@realt-by/api-schema` (`node_modules/@realt-by/api-schema/typescript/{service}/...`), а не придумываются. Прочитай нужный тип, замапь поля 1:1 в `.gql` и **покажи список пользователю для подтверждения** — он может урезать поля, которые клиенту не нужны (меньше полей = меньше нагрузка и трафик).

Если типа нет в `@realt-by/api-schema` — стоп: попроси обновить пакет, типы руками не создавать.

## Enum'ы

Codegen не конвертирует числовые enum'ы в GraphQL (значения enum'а в GraphQL не могут быть числами), поэтому:

**Строковый enum** (значения — валидные GraphQL-имена, напр. `GRANTED = 'granted'`) → настоящий `enum` блок, члены = **значения** TS-enum'а (не ключи):

```graphql
enum Consent {
  granted
  denied
}
```

**Числовой enum** (`OBJECT_PUBLICATION = 1`) → поле остаётся `Int`, enum описывается docstring'ом над полем со всеми значениями и пояснениями:

```graphql
  """
  enum OrderType:
  OBJECT_PUBLICATION = 1, простое объявление;
  OBJECT_HIGHLIGHT = 2, выделеное объявление;
  """
  type: Int!
```

Бонус: этот docstring codegen клиента переносит в `lib/graphql/types.ts` как JSDoc — клиент получает документацию бесплатно.

## Глобальные типы — не переобъявлять

Уже есть в `src/graph/schema.gql` и `src/graph/scalar/scalar.gql`:

- `Pagination`, `PaginationRes`, `SortInput`, `Order`, `PriceExtraFields`
- Скаляры: `StringNotEmpty`, `Date`, `Email`, `Phone`, `Html`, `UUID`, `JSON`

Поле/аргумент совпадает по смыслу — используй существующий тип.

`NullResponse` в `schema.gql` есть (legacy), но **новые мутации его не используют** — см. ниже.

## Возврат мутаций без payload

Если микросервис при успехе возвращает `null` / void (create / update / delete / archive — почти всегда) — в схеме мутация возвращает **только** `Boolean!`. Резолвер на следующем этапе отдаёт `return true`.

```graphql
extend type Mutation {
  "Архивирует рабочий статус"
  workStatusArchive(data: InputWorkStatusArchive!): Boolean!
}
```

❌ `NullResponse!` / `NullResponse` — запрещено для новых мутаций.

✅ Есть осмысленный payload (созданная сущность, url оплаты, …) — возвращай конкретный тип ответа, не `Boolean!`.

## Шаблон

```graphql
extend type Query {
  "Что возвращает операция"
  operationName(data: OperationInput!): OperationResponse!
}

input OperationInput {
  pagination: Pagination!
  where: OperationWhereInput!
}

input OperationWhereInput {
  uuids: [UUID!]
}

type OperationResponse {
  results: [OperationItem!]!
  pagination: PaginationRes!
}
```

Мутация без payload:

```graphql
extend type Mutation {
  "Что делает операция"
  operationName(data: OperationInput!): Boolean!
}
```

Правила типов:

- Поля non-null (`!`) только когда значение гарантировано
- Списки вместо единичных объектов, где данные — коллекция
- Скаляры (`UUID`, `Date`, ...) вместо примитивов, где поле совпадает по семантике
- Ошибки в схему НЕ включаются — они уезжают в отдельное дерево `errors`
- Документируй поля docstring'ом `"""..."""` — это доедет в клиентские типы
- Void-мутации → `Boolean!`, не `NullResponse!`

## Версионирование

Изменение существующего поля: старое помечается `@deprecated(reason: "YYYY-MM-DD. Используйте fieldNameV2")`, рядом создаётся `fieldNameV2`.

## Ponytail (сначала лестница)

1. Поле вообще нужно клиенту? (YAGNI — каждое поле в схеме это обязательство поддерживать его годами)
2. Тип/инпут уже есть в схеме? `grep` по `src/graph/**/*.gql` перед созданием нового типа — переиспользуй существующий.
3. Глобальный тип покрывает случай? (`Pagination`, `UUID`, ...)

Скучное лучше умного: плоский тип с очевидными полями выигрывает у глубокой вложенности «для гибкости».

## Отрицательные примеры

❌ Глагол в имени поля:

```graphql
# Плохо
extend type Query {
  getDevelopersView(slug: String!): DevelopersView
}
```

✅ Существительное: `developersView`, `workStatusCreate`.

❌ Переобъявление глобальных типов:

```graphql
# Плохо — дублирует Pagination/PaginationRes из schema.gql
input MyPagination {
  page: Int!
  pageSize: Int!
}
```

✅ `pagination: Pagination!` / `pagination: PaginationRes!`.

❌ Числовой enum как настоящий enum-блок (GraphQL не позволяет числовые значения, codegen упадёт):

```graphql
# Плохо
enum OrderType {
  OBJECT_PUBLICATION # а чему равен? потеряно
}
type Order {
  type: OrderType! # resolver отдаёт число 1 — рассинхрон типов
}
```

✅ `type: Int!` + docstring `enum OrderType: OBJECT_PUBLICATION = 1, ...;` над полем.

❌ Примитив вместо скаляра:

```graphql
# Плохо
uuid: String!
createdAt: String!
```

✅ `uuid: UUID!`, `createdAt: Date!`.

❌ Ошибки в модели данных (`type OperationResponse { errors: [...] }`).

✅ Ошибки не описываются в схеме — они уезжают в отдельное дерево `errors` ответа.

❌ Void-мутация через `NullResponse!`:

```graphql
# Плохо — NullResponse legacy, для новых мутаций нельзя
extend type Mutation {
  workStatusArchive(data: InputWorkStatusArchive!): NullResponse!
}
```

✅ `Boolean!` (резолвер вернёт `true`):

```graphql
extend type Mutation {
  workStatusArchive(data: InputWorkStatusArchive!): Boolean!
}
```

❌ `npx eslint файл.gql` без схемы в конфиге (до фикса `graphql.js`):

```bash
# Падало: Rule 'fields-on-correct-type' requires parserOptions.schema
npx eslint src/graph/work-statuses/mutation-work-status-archive/mutation-work-status-archive.gql
```

✅ В `packages/codestyle/eslint/graphql.js` задано `parserOptions.schema: 'src/graph/**/*.gql'` — голый `npx eslint файл.gql` достаточен.

## Проверка этапа — runner (единственный источник статуса)


AI **не** интерпретирует stdout команд — только результат runner (`PASS` / `FAIL` / `BLOCKED`). **Не читать** исходники runner (`scripts/`, `scripts/lib/**`, `*.mjs` гейты, AST-чекеры, фикстуры, внутренности SPEC): только вызов CLI и компактный JSON (`status`, `compact`, при FAIL/BLOCKED — `checks` и хвост `logPath` ~50 строк). При FAIL чинить продуктовый код по `checks`, не открывать runner, чтобы понять гейт. Разрешено: этот SKILL.md, код bff/client, `@realt-by/api-schema`, соседние `.gql` как шаблоны.

```bash
V2="$HOME/.claude/skills/bff-pipeline-v2"
node "$V2/scripts/bff-pipeline.mjs" verify --stage 1 --manifest ~/Documents/work/mls-project/manifest.json
```

- **PASS** → сразу этап 2 (`bff-datasource-create-v2`).
- **FAIL** → чинить код по `checks`, повторить. Override **запрещён**.
- **BLOCKED** → сообщить пользователю.

Gate: codegen, GraphQL lint, baseline, **все** поля `apiResponseType` из manifest (без урезания).12:T1f76,# Client Apollo Create V2 — этап 6

Дирижёр pipeline: [bff-pipeline-v2/SKILL.md](../bff-pipeline-v2/SKILL.md)

Создаёт атомарные apollo-файлы в клиенте. Корни проектов: mls — `mls/src`, admin — `admin/src`, www — `www/apps/main/src`.

## Вводные (доспрашивать точечно, чего не хватает)

- Целевой проект и feature-папка (`features/{feature}/apollo/`)
- Список операций: GraphQL-имя каждой и её аргументы (`savedSearchCreate($data: ...)`)
- Поля ответа — что клиент реально будет читать

## Предусловие

Типы должны существовать в `lib/graphql/types.ts`. Нет типа → стоп, предложить `client-types-sync` (этап 5). Руками типы не создавать.

## Именование файлов

Один файл = одна операция. Папка `apollo/` внутри feature-папки:

```
apollo-{namespace}-{action}-{entity}.mutation.ts   # apollo-pricing-create-r-points-package.mutation.ts
apollo-{namespace}-{entity}-listing.query.ts       # apollo-pricing-r-points-packages-listing.query.ts
apollo-{namespace}-{entity}-by-uuid.query.ts       # apollo-pricing-r-points-package-by-uuid.query.ts
apollo-{namespace}-{entity}.fragment.ts            # apollo-reference-currency-rate.fragment.ts
```

## Именование хуков (строго)

| Операция | Паттерн | Пример |
|----------|---------|--------|
| mutation | `useApollo{Namespace}{Action}{Entity}Mutation` | `useApolloPricingCreateRPointsPackageMutation` |
| query listing | `useApollo{Namespace}{Entity}ListingQuery` | `useApolloPricingRPointsPackagesListingQuery` |
| query by uuid | `useApollo{Namespace}{Entity}ByUuidQuery` | `useApolloPricingRPointsPackageByUuidQuery` |
| fragment | `useApollo{Namespace}{Entity}Fragment` | `useApolloReferenceSearchCurrencyRatesFragment` |

Имя операции внутри `gql` = имя поля схемы (camelCase, как в BFF).

## Шаблоны

### Query — listing

```typescript
import { gql } from '@apollo/client';

import { createApolloQuery } from 'lib/apollo/create-apollo-bindings';
import type { Query, QueryPricingRPointsPackagesListingArgs } from 'lib/graphql/types';

export const { useQuery: useApolloPricingRPointsPackagesListingQuery } = createApolloQuery<
  Pick<Query, 'pricingRPointsPackagesListing'>,
  QueryPricingRPointsPackagesListingArgs
>(gql`
  query pricingRPointsPackagesListing($data: PricingRPointsPackagesInput!) {
    pricingRPointsPackagesListing(data: $data) {
      pagination {
        totalCount
      }
      results {
        uuid
        title
        createdAt
      }
    }
  }
`);
```

### Mutation

```typescript
import { gql } from '@apollo/client';

import { createApolloMutation } from 'lib/apollo/create-apollo-bindings';
import type { Mutation, MutationWorkStatusCreateArgs } from 'lib/graphql/types';

export const { useMutation: useApolloWorkStatusCreateMutation } = createApolloMutation<
  Pick<Mutation, 'workStatusCreate'>,
  MutationWorkStatusCreateArgs
>(gql`
  mutation workStatusCreate($data: InputWorkStatusCreate!) {
    workStatusCreate(data: $data)
  }
`);
```

### Fragment

```typescript
import { gql } from '@apollo/client';

import { createApolloFragment } from 'lib/apollo/create-apollo-bindings';
import type { ReferenceSearchCurrencyRate } from 'lib/graphql/types';

export const { useFragment: useApolloReferenceSearchCurrencyRatesFragment } =
  createApolloFragment<ReferenceSearchCurrencyRate>(gql`
    fragment useApolloReferenceSearchCurrencyRatesFragment on ReferenceSearchCurrencyRate {
      rate
    }
  `);
```

## Enum'ы (пассивное правило)

- Тип переменной в gql-документе копируется из схемы как есть: enum остаётся enum (`$order: Order!`), `Int` остаётся `Int` — смотри `QueryXxxArgs`/`MutationXxxArgs`, не угадывай.
- Числовые enum'ы (BFF отдал `Int`) — ничего не делаем: docstring со значениями уже доехал в `types.ts` как JSDoc над полем.
- Строковые enum'ы — значения передаются через TS-enum из `lib/graphql/types` (`Order.Asc`), а не строками. Это про место вызова хука, не про apollo-файл.

## Ponytail (сначала лестница)

1. Операция уже прокинута? `grep` по `**/apollo/*.ts` — файл мог существовать.
2. Экспортируй только нужные хуки: `createApolloQuery` возвращает и `useLazyQuery`, и `writeQuery` — если вызывающему коду нужен только `useQuery`, деструктурируй только его (YAGNI).
3. Поля в выборке — только те, что читает UI. `// ... все поля на всякий случай` = трафик и кеш-инвалидация на пустом месте.
4. Fragment — только когда одна и та же выборка нужна в 2+ операциях; до этого поля пишутся инлайн.

## Отрицательные примеры

❌ Общий файл с несколькими операциями (`queries.ts`, `mutations.ts`):

```typescript
// Плохо — нарушает атомарность, не находится grep'ом по имени операции
export const useA = createApolloQuery(...);
export const useB = createApolloQuery(...);
```

✅ Один файл = одна операция, имя файла по шаблону.

❌ Полный тип вместо `Pick`:

```typescript
// Плохо
createApolloQuery<Query, QueryXxxArgs>
```

✅ `createApolloQuery<Pick<Query, 'operationName'>, QueryOperationNameArgs>`.

❌ Импорт типов без `type` / относительные импорты / default export:

```typescript
// Плохо
import { Query } from '../../../lib/graphql/types';
export default ...;
```

✅ `import type { Query, ... } from 'lib/graphql/types'`, именованный `export const`.

❌ Значения enum'а строками в вызове: `order: 'ASC'`.

✅ `order: Order.Asc` (enum из `lib/graphql/types`).

❌ Запускать `tsc`/линтеры молча после генерации.

## Проверка этапа — runner (единственный источник статуса)


AI **не** интерпретирует stdout команд — только результат runner (`PASS` / `FAIL` / `BLOCKED`). **Не читать** исходники runner (`scripts/`, `scripts/lib/**`, `*.mjs` гейты, AST-чекеры, фикстуры, внутренности SPEC): только вызов CLI и компактный JSON (`status`, `compact`, при FAIL/BLOCKED — `checks` и хвост `logPath` ~50 строк). При FAIL чинить продуктовый код по `checks`, не открывать runner, чтобы понять гейт. Разрешено: этот SKILL.md, код bff/client, `@realt-by/api-schema`, соседние apollo-файлы как шаблоны.

```bash
V2="$HOME/.claude/skills/bff-pipeline-v2"
node "$V2/scripts/bff-pipeline.mjs" verify --stage 6 --manifest ~/Documents/work/admin-project/manifest.json
```

- **PASS** → pipeline завершён (этапы 0–6); сообщить пользователю.
- **FAIL** → чинить код по `checks`, повторить. Override **запрещён**.
- **BLOCKED** → сообщить пользователю.

Manifest: `client`, `apolloPath`, `hookName`. Type-check только ошибок в `apolloPath` (чужой `tsc` по проекту игнорируется). ESLint — только этот файл, без `--fix`.13:T844,# Client Types Sync V2 — этап 5

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

Manifest: `client`, `expectedTypes`. Workspace `.env`: `BFF_PIPELINE_CLIENT_ROOT`, `BFF_PIPELINE_BFF_TARGET`.14:T16a7,Ты — оркестратор флоу разработки REALT. Всю механику выполняют скрипты из `scripts/` рядом с этим скилом (запуск: `bun run <скрипт>` с workdir этой папки). Ты НЕ выполняешь git/glab команды руками — только через скрипты.

# Абсолютные правила

1. **НИКОГДА не пушить в stage.** Push только в фича-ветки (`feature/*`) и таск-ветки (`REALT-*`). Скрипты имеют guard — при отказе не пытайся обойти его другими командами.
2. MR бывают трёх видов: draft фича→stage (title `[Title]-Realt-{id}-{slug}`), таск→фича-ветка и баг/мелкая таска→stage — у обоих title = `REALT-{id}-{описание}` (равен имени ветки).
3. Ветки всегда отводятся от свежего base: фича — от свежего stage (fetch перед созданием); таск — от фича-ветки или от свежего stage (`--from-stage`).
4. Не выполняй скрипты без `--dry-run`, если пользователь не подтвердил реальное выполнение.

# Выбор режима: фича vs баг/мелкая таска

Если задача — баг или мелкая таска, **фича-ветку создавать не нужно**. Спроси пользователя:
- Фича для этой стори уже идёт → таск от фича-ветки, MR в фича-ветку (шаги 3–4).
- Фичи нет → ветка сразу от stage (`--from-stage`) и один обычный MR прямо в stage (`--to-stage`, не draft). Шаги 2 и 3 пропускаются.

# Шаги флоу

## 1. Сторя
Пользователь даёт ссылку вида `https://youtrack.realt.by/issue/REALT-{id}/{slug}`.
Запусти: `bun run get-story.ts "<ссылка>"`.
- Успех → получишь id, slug, title.
- Ошибка (YouTrack недоступен / нет YOUTRACK_TOKEN) → **ручной режим**: запроси у пользователя в чате недостающие данные (id известен из ссылки; slug обычно тоже; попроси короткий понятный title) и продолжай флоу без YouTrack.

## 2. Фича-ветка + draft-MR
Спроси, какие репозитории нужны (доступные: mls, bff-mls, admin, bff-admin, www, bff-www).
Сначала dry-run:
```
bun run create-feature-branch.ts --story <id> --slug <slug> --repos <csv> --dry-run
bun run create-feature-mr.ts --story <id> --slug <slug> --title "<title>" --repos <csv> --dry-run
```
Покажи план пользователю. После подтверждения — те же команды без `--dry-run`.

## 3. Таски / баги / мелкие таски
Пользователь перечисляет задачи списком в чате: для каждой — описание и репозитории.

**Если фича уже идёт** — таск от фича-ветки:
```
bun run create-task-branch.ts --story <id> --feature-slug <slug> --task "<описание>" --repos <csv> --dry-run
```

**Если это баг/мелкая таска без фичи** — ветка сразу от свежего stage:
```
bun run create-task-branch.ts --story <id> --task "<описание>" --repos <csv> --from-stage --dry-run
```
Подтверждение → реальный запуск. Пользователь пишет код обычным образом в этих ветках.

## 4. «Оформи MR»
По команде пользователя для готовой задачи:

Таск внутри фичи (MR в фича-ветку):
```
bun run create-task-mr.ts --story <id> --feature-slug <slug> --task "<описание>" --repos <csv> --dry-run
```

Баг/мелкая таска без фичи (обычный MR сразу в stage):
```
bun run create-task-mr.ts --story <id> --task "<описание>" --repos <csv> --to-stage --dry-run
```
Подтверждение → реальный запуск. Скрипт сам пушит ветку и создаёт MR. Title MR = `REALT-{id}-{описание}` (равен имени ветки), `--title` не нужен.

Если скрипт упал с «текущая ветка защищённая» — скажи пользователю переключиться на нужную таск-ветку (код коммитится там) и повтори.

## 5. Итоговое сообщение
Когда все MR оформлены, выведи в чат:

```
Готово по REALT-{id}:

MR:
- <ссылки на все MR>

Что сделано:
<краткое описание по каждому таску>

Сторя: https://youtrack.realt.by/issue/REALT-{id}
```

Ссылки на MR бери из вывода glab (или собери по шаблону `https://gitlab.realt.by/frontend/<repo>/-/merge_requests` — уточни номер из вывода скрипта).

# Ошибки скриптов
Скрипты пишут ошибки по-человечески и завершаются exit 1. Не ретраи вслепую — покажи ошибку пользователю и предложи решение (например, «нет origin/stage» → предложить git fetch; «защищённая ветка» → переключиться на таск-ветку).6:["$","$La",null,{"items":[{"id":"bff-datasource-create-v2","kind":"skill","alsoAgent":false,"alsoSkill":false,"name":"bff-datasource-create-v2","description":"Этап 2 пайплайна bff-pipeline — создание/расширение DataSource к микросервису в bff-mls (src/data-sources). Используй всегда, когда нужно добавить метод обращения к микросервису API, новый DataSource, REST-эндпоинт в BFF — даже если пользователь говорит просто «добавь метод в апи» или «прокинь эндпоинт». V2: проверка через bff-pipeline runner.","install":"npx skills add egor1991egorovmac-eng/ai-agents-and-skills -g --skill bff-datasource-create-v2","source":"skills/bff-datasource-create-v2/SKILL.md","body":"$b"},{"id":"bff-e2e-verify-v2","kind":"skill","alsoAgent":false,"alsoSkill":false,"name":"bff-e2e-verify-v2","description":"Этап 4 пайплайна bff-pipeline — e2e проверка новой операции против BFF Target из workspace .env. Используй всегда, когда нужно проверить, что query/mutation реально работает, прогнать GraphQL-запрос против уже живого BFF — даже если пользователь говорит просто «проверь, что отдаёт бэк». V2: проверка через bff-pipeline runner.","install":"npx skills add egor1991egorovmac-eng/ai-agents-and-skills -g --skill bff-e2e-verify-v2","source":"skills/bff-e2e-verify-v2/SKILL.md","body":"$c"},{"id":"bff-pipeline-bff","kind":"skill","alsoAgent":true,"alsoSkill":false,"name":"bff-pipeline-bff","description":"BFF-часть пайплайна bff-pipeline-v2: этапы 0–4 (preflight → schema → datasource → resolver → e2e) через детерминированный Node.js runner. Используй для создания .gql схемы, DataSource и резолвера в bff-mls/bff-admin с e2e-проверкой.\\n\\nExamples:\\n<example>\\nuser: \\\"добавь query demoListing в bff-mls под ключ\\\"\\nassistant: \\\"Запускаю агента bff-pipeline-bff для этапов 0–4 пайплайна\\\"\\n<commentary>Новая GraphQL операция на стороне BFF — этапы 0–4.</commentary></example>\\n<example>\\nuser: \\\"прокинь эндпоинт pricing в bff-admin\\\"\\nassistant: \\\"Запускаю агента bff-pipeline-bff для схемы, datasource и резолвера с e2e\\\"\\n<commentary>Новый DataSource + resolver в BFF — этапы 0–4.</commentary></example>","install":"npx skills add egor1991egorovmac-eng/ai-agents-and-skills -g --skill bff-pipeline-bff","source":"skills/bff-pipeline-bff/SKILL.md","body":"$d"},{"id":"bff-pipeline-client","kind":"skill","alsoAgent":true,"alsoSkill":false,"name":"bff-pipeline-client","description":"Client-часть пайплайна bff-pipeline-v2: этапы 5–6 (client-codegen → apollo) через детерминированный Node.js runner. Используй для синхронизации типов клиента (mls, admin, www) со схемой BFF и создания Apollo query/mutation файлов.\\n\\nExamples:\\n<example>\\nuser: \\\"обнови типы в mls и сделай apollo мутацию\\\"\\nassistant: \\\"Запускаю агента bff-pipeline-client для этапов 5–6\\\"\\n<commentary>Codegen + Apollo-файлы на клиенте — этапы 5–6.</commentary></example>\\n<example>\\nuser: \\\"прокинь фичу на клиент mls после bff-этапов\\\"\\nassistant: \\\"Запускаю агента bff-pipeline-client — codegen и apollo с gate-проверками runner\\\"\\n<commentary>BFF готов (этапы 0–4 PASS), нужна клиентская часть.</commentary></example>","install":"npx skills add egor1991egorovmac-eng/ai-agents-and-skills -g --skill bff-pipeline-client","source":"skills/bff-pipeline-client/SKILL.md","body":"$e"},{"id":"bff-pipeline-v2","kind":"skill","alsoAgent":false,"alsoSkill":false,"name":"bff-pipeline-v2","description":"Дирижёр сквозного bff-pipeline с детерминированным Node.js runner — единственный источник PASS/FAIL/BLOCKED для этапов 0–6. Триггеры: «bff-pipeline v2», «новая graphql фича под ключ», «runner pipeline», «gate проверка graphql фичи».","install":"npx skills add egor1991egorovmac-eng/ai-agents-and-skills -g --skill bff-pipeline-v2","source":"skills/bff-pipeline-v2/SKILL.md","body":"$f"},{"id":"bff-resolver-create-v2","kind":"skill","alsoAgent":false,"alsoSkill":false,"name":"bff-resolver-create-v2","description":"Этап 3 пайплайна bff-pipeline — создание резолвера (+ трансформера) в bff-mls и регистрация в resolvers.ts. Используй всегда, когда нужно написать резолвер для query/mutation, обогатить ответ полями из другого API, замапить ответ микросервиса — даже если пользователь говорит просто «напиши резолвер» или «добавь поле в ответ». V2: проверка через bff-pipeline runner.","install":"npx skills add egor1991egorovmac-eng/ai-agents-and-skills -g --skill bff-resolver-create-v2","source":"skills/bff-resolver-create-v2/SKILL.md","body":"$10"},{"id":"bff-schema-create-v2","kind":"skill","alsoAgent":false,"alsoSkill":false,"name":"bff-schema-create-v2","description":"Этап 1 пайплайна bff-pipeline — создание .gql схемы query/mutation в bff-mls (декларация в Query/Mutation, типы, input'ы, enum'ы). Используй всегда, когда нужно объявить новое поле GraphQL в BFF, создать .gql файл, описать типы ответа микросервиса — даже если пользователь просто говорит «добавь query в bff» или «опиши схему». V2: проверка через bff-pipeline runner.","install":"npx skills add egor1991egorovmac-eng/ai-agents-and-skills -g --skill bff-schema-create-v2","source":"skills/bff-schema-create-v2/SKILL.md","body":"$11"},{"id":"client-apollo-create-v2","kind":"skill","alsoAgent":false,"alsoSkill":false,"name":"client-apollo-create-v2","description":"Этап 6 пайплайна bff-pipeline — создание атомарных Apollo-файлов (query, mutation, fragment) в клиентских проектах mls, admin и www через createApolloQuery/createApolloMutation/createApolloFragment. Используй всегда, когда нужен новый apollo-запрос или мутация на клиенте, хук useQuery/useMutation под существующее поле схемы — даже если пользователь говорит просто «создай apollo query» или «добавь мутацию». V2: проверка через bff-pipeline runner.","install":"npx skills add egor1991egorovmac-eng/ai-agents-and-skills -g --skill client-apollo-create-v2","source":"skills/client-apollo-create-v2/SKILL.md","body":"$12"},{"id":"client-types-sync-v2","kind":"skill","alsoAgent":false,"alsoSkill":false,"name":"client-types-sync-v2","description":"Этап 5 пайплайна bff-pipeline — синхронизация типов клиента (mls, admin, www) со схемой BFF через codegen. Используй всегда, когда в lib/graphql/types.ts не хватает типов для новой операции, нужно подтянуть свежую GraphQL-схему в клиент — даже если пользователь говорит просто «обнови типы» или «почему нет QueryXxxArgs». V2: проверка через bff-pipeline runner.","install":"npx skills add egor1991egorovmac-eng/ai-agents-and-skills -g --skill client-types-sync-v2","source":"skills/client-types-sync-v2/SKILL.md","body":"$13"},{"id":"realt-flow","kind":"skill","alsoAgent":false,"alsoSkill":false,"name":"realt-flow","description":"Ведёт флоу REALT-фичи под ключ: ссылка на сторю YouTrack → фича-ветка от stage + draft-MR → таск-ветки → MR тасков → итоговое сообщение. Триггеры: «новая сторя», «создай флоу по REALT-…», «оформи MR». Также баги и мелкие таски без фичи.","install":"npx skills add egor1991egorovmac-eng/ai-agents-and-skills -g --skill realt-flow","source":"skills/realt-flow/SKILL.md","body":"$14"}]}]
7:["$","$L15",null,{"children":["$L16",["$","$L17",null,{"promise":"$@18"}]]}]
8:["$","$1","h",{"children":[null,[["$","$L19",null,{"children":"$L1a"}],null],["$","$L1b",null,{"children":["$","div",null,{"hidden":true,"children":["$","$1c",null,{"fallback":null,"children":"$L1d"}]}]}]]}]
1a:[["$","meta","0",{"charSet":"utf-8"}],["$","meta","1",{"name":"viewport","content":"width=device-width, initial-scale=1"}]]
16:null
18:{"metadata":[["$","title","0",{"children":"ai-agents-and-skills — агенты и скилы"}],["$","meta","1",{"name":"description","content":"Два агента и десять скилов на каждый день: bff-pipeline-bff, bff-pipeline-client, realt-flow и stage-скилы для Claude Code, OpenCode, Cursor."}]],"error":null,"digest":"$undefined"}
1d:"$18:metadata"
