---
name: bff-schema-create-v2
description: Этап 1 пайплайна bff-pipeline — создание .gql схемы query/mutation в bff-mls (декларация в Query/Mutation, типы, input'ы, enum'ы). Используй всегда, когда нужно объявить новое поле GraphQL в BFF, создать .gql файл, описать типы ответа микросервиса — даже если пользователь просто говорит «добавь query в bff» или «опиши схему». V2: проверка через bff-pipeline runner.
---

# BFF Schema Create V2 — этап 1

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

Gate: codegen, GraphQL lint, baseline, **все** поля `apiResponseType` из manifest (без урезания).
