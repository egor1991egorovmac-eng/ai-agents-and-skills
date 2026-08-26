---
name: client-apollo-create-v2
description: Этап 6 пайплайна bff-pipeline — создание атомарных Apollo-файлов (query, mutation, fragment) в клиентских проектах mls, admin и www через createApolloQuery/createApolloMutation/createApolloFragment. Используй всегда, когда нужен новый apollo-запрос или мутация на клиенте, хук useQuery/useMutation под существующее поле схемы — даже если пользователь говорит просто «создай apollo query» или «добавь мутацию». V2: проверка через bff-pipeline runner.
---

# Client Apollo Create V2 — этап 6

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

Manifest: `client`, `apolloPath`, `hookName`. Type-check только ошибок в `apolloPath` (чужой `tsc` по проекту игнорируется). ESLint — только этот файл, без `--fix`.
