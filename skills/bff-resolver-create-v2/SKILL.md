---
name: bff-resolver-create-v2
description: "Этап 3 пайплайна bff-pipeline — создание резолвера (+ трансформера) в bff-mls и регистрация в resolvers.ts. Используй всегда, когда нужно написать резолвер для query/mutation, обогатить ответ полями из другого API, замапить ответ микросервиса — даже если пользователь говорит просто «напиши резолвер» или «добавь поле в ответ». V2: проверка через bff-pipeline runner."
---

# BFF Resolver Create V2 — этап 3

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

Gate: имя поля, регистрация, void → `return true`, type-check, lint.
