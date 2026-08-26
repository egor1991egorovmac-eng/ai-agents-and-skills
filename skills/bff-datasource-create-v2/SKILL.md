---
name: bff-datasource-create-v2
description: "Этап 2 пайплайна bff-pipeline — создание/расширение DataSource к микросервису в bff-mls (src/data-sources). Используй всегда, когда нужно добавить метод обращения к микросервису API, новый DataSource, REST-эндпоинт в BFF — даже если пользователь говорит просто «добавь метод в апи» или «прокинь эндпоинт». V2: проверка через bff-pipeline runner."
---

# BFF DataSource Create V2 — этап 2

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

Gate: метод, HTTP verb, endpoint, api-schema типы, error handling, регистрация.
