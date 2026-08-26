import path from 'node:path';

const FILE_LABELS = {
  'preflight.test.mjs': 'Этап 0 · Preflight',
  'schema-gate.test.mjs': 'Этап 1 · Schema',
  'datasource-gate.test.mjs': 'Этап 2 · DataSource',
  'resolver-gate.test.mjs': 'Этап 3 · Resolver',
  'e2e-gate.test.mjs': 'Этап 4 · e2e',
  'client-codegen-gate.test.mjs': 'Этап 5 · Client codegen',
  'apollo-gate.test.mjs': 'Этап 6 · Apollo',
  'orchestrator.test.mjs': 'Orchestrator',
  'stages-registry.test.mjs': 'Stage Registry',
  'manifest-path.test.mjs': 'Manifest path',
  'workspace-links.test.mjs': 'Workspace Links',
  'schema-identity.test.mjs': 'BFF Target identity',
  'process-tree.test.mjs': 'Process tree',
  'test-table.test.mjs': 'Репортер таблиц',
};

const FILE_INTROS = {
  'preflight.test.mjs':
    'Перед генерацией кода: pin @realt-by/api-schema свежий (иначе BLOCKED с вопросом об обновлении), graphify больше не проверяется, apply без --confirm ничего не ставит.',
  'schema-gate.test.mjs':
    'Этап .gql: файл по канону, имя операции совпадает с manifest, нет breaking changes, codegen и lint проходят.',
  'datasource-gate.test.mjs':
    'Этап DataSource: метод, endpoint и HTTP-глагол из manifest, ошибки API через ApiDataSourceError, новый сервис зарегистрирован.',
  'resolver-gate.test.mjs':
    'Этап резолвера: поле Query/Mutation = operation, файл в resolvers.ts, Boolean-мутация возвращает true.',
  'e2e-gate.test.mjs':
    'Этап e2e: ping BFF Target из workspace .env, живой BFF без spawn, иначе npm run dev; e2eMockApi использует executeOperation; assertions из manifest.',
  'client-codegen-gate.test.mjs':
    'Этап клиентских типов: codegen с нужного BFF, в graphql-types появились expectedTypes, чужой diff в Scalars/Query — BLOCKED.',
  'apollo-gate.test.mjs':
    'Этап Apollo-файла: одно имя, один gql, хук и Pick/fragment по правилам. Type-check только этого файла, eslint без --fix.',
  'orchestrator.test.mjs':
    'Склейка этапов 0–6: порядок, стоп на FAIL/BLOCKED, resume по fingerprint, override только для BLOCKED.',
  'stages-registry.test.mjs':
    'Реестр этапов: у каждого паспорта есть id/name/manifestSlice/files/run, этапы идут 0–6 без дыр, getStage ругается на неизвестный этап.',
  'manifest-path.test.mjs':
    'manifest.json только в корне workspace (mls-project/admin-project), не внутри bff/admin/mls репозиториев.',
  'workspace-links.test.mjs':
    'Связи workspace: корни BFF/клиента, BFF Target и graphify vault читаются из одного .env.',
  'schema-identity.test.mjs':
    'Identity gate сравнивает SHA-256 нормализованной локальной и live GraphQL-схемы до e2e и codegen.',
  'process-tree.test.mjs':
    'Остановка дерева процессов BFF: безопасно, если pid уже нет; fallback на child.kill.',
  'test-table.test.mjs':
    'Репортер skill-тестов: после каждого файла таблица со статусом и человеческим пояснением, в конце сводка.',
};

const TEST_DESCRIPTIONS = {
  'validateManifest rejects missing fields':
    'Не запускает pipeline, если в manifest нет обязательных полей — иначе дальше работали бы с битым входом.',
  'checkApiSchema PASS when pin equals latest remote tag':
    'Пропускает проверку api-schema, когда версия в package.json совпадает с последним git-тегом пакета.',
  'checkApiSchema BLOCKED when pin is stale and asks to update':
    'Ставит BLOCKED, если @realt-by/api-schema устарел, и в detail просит спросить пользователя, обновлять ли пакет.',
  'checkApiSchema BLOCKED on network failure':
    'Если git ls-remote недоступен, статус BLOCKED, а не FAIL: нет сети — нельзя судить о версии пакета.',
  'runPreflightCheck aggregates api-schema result':
    'Этап 0 состоит из одной проверки api-schema; graphify больше не проверяется.',
  'runPreflightApply without confirm returns BLOCKED':
    'apply без --confirm ничего не ставит: обновление api-schema только после явного согласия пользователя.',
  'exit codes map to PASS FAIL BLOCKED':
    'CLI отдаёт 0 / 1 / 2 по статусу, чтобы скрипты не парсили текст логов.',
  'applyApiSchema reports changedFiles when npm install fails':
    'Если npm install api-schema упал, в результате видны файлы, которые уже успели измениться.',
  'buildResult includes changedFiles on FAIL':
    'В JSON FAIL есть changedFiles — можно понять, что тронули, и откатить или добить установку.',

  'validateManifestForStage requires stage 1 fields':
    'Для этапа схемы в manifest должны быть operation, kind, domain и service.',
  'checkPathConvention PASS for valid layout':
    'Файл .gql лежит по канону graph/{domain}/{kind}-{kebab-operation}/.',
  'checkOperationAst FAIL for wrong operation name':
    'Имя query/mutation в .gql должно совпадать с manifest.operation.',
  'checkVoidMutation FAIL for NullResponse':
    'Мутация без полезной нагрузки не может быть NullResponse — в графе нужен Boolean.',
  'checkApiTypeFields FAIL when api field missing in GraphQL':
    'Поле из api-schema обязано быть в GraphQL-типе, иначе клиент это поле не получит.',
  'detectBreakingChanges FAIL when field removed':
    'Удаление уже существующего поля схемы — breaking change, этап красный.',
  'runSchemaGate PASS for valid schema without codegen/lint':
    'На валидной .gql весь gate схемы зелёный (codegen и lint в этом тесте отключены).',
  'runSchemaGate FAIL for wrong operation name':
    'Весь этап 1 красный, если имя операции в .gql не совпало с manifest.',
  'runSchemaGate FAIL for breaking change':
    'Весь этап 1 красный при breaking change, даже если остальное валидно.',
  'runSchemaGate FAIL when codegen fails':
    'Если gql-codegen упал, схему нельзя считать готовой.',
  'runSchemaGate FAIL when graphql lint fails':
    'GraphQL lint — часть этапа: синтаксис и стиль схемы тоже блокируют PASS.',

  'validateManifestForStage requires stage 2 fields':
    'Для DataSource в manifest нужны service, endpoint, httpMethod и datasourceMethod.',
  'validateManifestForStage requires dataSourceKey for newService':
    'Новый микросервис обязан указать dataSourceKey — иначе его некуда повесить в context.',
  'checkMethodExists PASS for valid datasource method':
    'В классе API есть метод с именем из manifest.datasourceMethod.',
  'checkHttpCall FAIL for wrong endpoint':
    'HTTP-вызов должен идти на endpoint из manifest, а не на другой путь.',
  'checkErrorHandling FAIL when ApiDataSourceError missing':
    'Ошибки микросервиса должны бросать ApiDataSourceError, а не теряться как success.',
  'checkApiSchemaTypes FAIL without @realt-by/api-schema import':
    'Тип ответа берётся из @realt-by/api-schema, голый ответ без контракта нельзя.',
  'checkServiceRegistration FAIL for unregistered new service':
    'Новый сервис должен появиться в data-sources/index.ts, иначе резолвер его не увидит.',
  'runDataSourceGate PASS for valid datasource without type-check':
    'На валидном DataSource этап 2 зелёный (type-check в этом тесте отключён).',
  'runDataSourceGate FAIL for wrong endpoint':
    'Весь этап 2 красный, если URL в коде не тот, что в manifest.',
  'runDataSourceGate FAIL for missing error handling':
    'Весь этап 2 красный, если ошибки API не пробрасываются.',
  'runDataSourceGate FAIL for unregistered new service':
    'Весь этап 2 красный, если новый API не зарегистрирован в index.',
  'runDataSourceGate FAIL when type-check fails':
    'Ошибки TypeScript в DataSource валят этап, даже если AST-проверки зелёные.',
  'runDataSourceAstChecks returns multiple independent failures':
    'Несколько проблем (метод, URL, ошибки) возвращаются сразу пачкой, а не по одной.',
  'checkDataSourceFile FAIL when service file missing':
    'Нет файла {service}-api.ts — сразу FAIL, дальше смотреть нечего.',

  'validateManifestForStage accepts stage 3 with stage 2 fields':
    'Этапу резолвера хватает тех же полей manifest, что уже были для DataSource.',
  'checkResolverFieldName PASS for valid query resolver':
    'Имя поля в createResolvers совпадает с manifest.operation.',
  'checkResolverFieldName FAIL for wrong field name':
    'Резолвер с чужим именем поля не принимается: клиент звал бы одну операцию, а код отвечал бы другой.',
  'checkResolverRegistration FAIL for unregistered resolver':
    'Резолвер должен быть импортирован в graph/resolvers.ts, иначе схема его не подхватит.',
  'checkResolverRegistration FAIL when resolver only mentioned in comment':
    'Комментарий в resolvers.ts — это не регистрация, такой резолвер не работает.',
  'checkVoidMutationReturn PASS for Boolean mutation with return true':
    'Boolean-мутация без полезной нагрузки должна явно вернуть true.',
  'checkVoidMutationReturn FAIL when Boolean mutation lacks return true':
    'Если Boolean-мутация не делает return true, клиент получит не то, что обещает схема.',
  'runResolverGate PASS for valid query resolver without type-check and lint':
    'Валидный query-резолвер проходит этап 3 (TS и lint в этом тесте отключены).',
  'runResolverGate FAIL for wrong field name':
    'Весь этап 3 красный при неверном имени поля в резолвере.',
  'runResolverGate FAIL for unregistered resolver':
    'Весь этап 3 красный, если резолвер не подключён в resolvers.ts.',
  'runResolverGate FAIL for void mutation without return true':
    'Весь этап 3 красный, если Boolean-мутация не возвращает true.',
  'runResolverGate FAIL when type-check fails':
    'Ошибки TypeScript в резолвере валят этап.',
  'runResolverGate FAIL when resolver lint fails':
    'ESLint резолвера тоже обязателен: красный lint = красный этап.',
  'runResolverAstChecks returns multiple independent failures':
    'Несколько AST-ошибок резолвера отдаются пачкой, чтобы чинить всё сразу.',
  'checkResolverFile FAIL when resolver file missing':
    'Нет файла резолвера — сразу FAIL.',

  'validateManifestForStage requires stage 4 operation fields but not BFF Target':
    'Для e2e в manifest нужны запрос и assertions; BFF Target живёт только в workspace .env.',
  'getValueAtPath resolves nested paths with indexes':
    'Assertion ходит в JSON по пути вроде data.items[0].uuid.',
  'hasGraphqlErrors detects non-empty errors array':
    'Ответ с errors[] — это ошибка GraphQL, даже если data частично пришла.',
  'runAssertions PASS for happy response':
    'Все assertions из manifest совпадают с успешным телом ответа.',
  'runAssertion FAIL for wrong type':
    'Assertion type: string падает, если в ответе не строка.',
  'evaluateGraphqlResponse PASS for happy path':
    'HTTP 200, data без errors и все assertions = PASS.',
  'evaluateGraphqlResponse FAIL for partial data with GraphQL errors':
    'Одновременно data и errors — FAIL, а не «почти получилось».',
  'formatGraphqlErrors includes nested microservice error from response':
    'В detail попадает вложенная ошибка микроса (код, errorCode, текст), не только общая обёртка.',
  'evaluateGraphqlResponse FAIL detail includes nested unauthorized error':
    '401 unauthorized из extensions.errors виден в статусе этапа 4.',
  'evaluateGraphqlResponse FAIL for invalid JSON body':
    'Если BFF вернул не JSON, этап нельзя считать пройденным.',
  'evaluateGraphqlResponse BLOCKED for network failure':
    'Сеть недоступна = BLOCKED: это не баг схемы и не баг резолвера.',
  'resolveRetryPolicy allows retries for query and idempotent mutation only':
    'Повторять можно query и мутацию с idempotencyKey. Обычную мутацию — нельзя.',
  'executeGraphqlRequest retries read-only requests on network failure':
    'Query при сетевом сбое ретраится: повторное чтение безопасно.',
  'executeGraphqlRequest does not retry mutation without idempotency key':
    'Мутацию без ключа идемпотентности не ретраим — иначе можно записать дважды.',
  'executeGraphqlRequest retries idempotent mutation on network failure':
    'С idempotencyKey повтор мутации безопасен, поэтому при сбое сети пробуем ещё раз.',
  'startBff BLOCKED on readiness timeout':
    'Если BFF не стал ready за timeout, статус BLOCKED, а не FAIL.',
  'runE2eGate PASS against live BFF Target without spawn':
    'Если BFF Target уже отвечает, e2e идёт туда без npm run dev и без kill.',
  'runE2eGate BLOCKED when live BFF schema identity differs':
    'Живой URL с другой GraphQL-схемой блокируется до выполнения e2e-операции.',
  'runE2eGate sends x-realt-auth-token from E2E_AUTH_TOKEN':
    'Для e2e из env E2E_AUTH_TOKEN ставится заголовок x-realt-auth-token.',
  'runE2eGate reads BFF Target, token and root from Workspace Links':
    'Этап 4 получает BFF Target, токен и корень BFF одной связкой Workspace Links.',
  'loadEnvNextToManifest reads E2E_AUTH_TOKEN from .env beside manifest':
    'Рядом с manifest.json читается .env — туда кладут E2E_AUTH_TOKEN для e2e.',
  'applyEnvFile makes workspace env override stale shell values':
    'Workspace .env — источник правды: его Target и токен перекрывают stale shell values.',
  'applyEnvFile removes stale managed values absent from workspace env':
    'Если managed key отсутствует в workspace .env, старое shell-значение удаляется.',
  'runE2eGate BLOCKED on TLS error without spawn':
    'Битый сертификат на BFF Target — BLOCKED, spawn не помогает.',
  'runE2eGate FAIL without spawn when ping is HTTP error not network':
    'HTTP-ошибка ping — FAIL, без npm run dev: spawn только если сеть не отвечает.',
  'runE2eGate rejects missing workspace BFF Target before spawn':
    'Без BFF_PIPELINE_BFF_TARGET этап не стартует и BFF не поднимается.',
  'runE2eGate e2eMockApi BLOCKED before executeOperation when BFF identity differs':
    'Даже executeOperation mock не обходит identity: чужой Target блокирует операцию.',
  'runE2eGate PASS for objectsSetCalledByRealtManager via executeOperation mock API':
    'При e2eMockApi операция гоняется через Apollo executeOperation: микросервис и заголовок X-User-Roles не нужны.',
  'resolveDataSourceKey reads key from data-sources index':
    'Ключ в context (например objectAPI) читается из new ClassName(...) в data-sources/index.ts.',
  'executeOperationAgainstSchema PASS when child prints GraphQL result':
    'Дочерний ts-node скрипт напечатал GraphQL JSON — запрос к схеме считаем успешным.',
  'runE2eGate FAIL when assertion does not match response':
    'Этап 4 красный, если assertion из manifest не совпал с телом ответа.',
  'runE2eGate spawns when ping is dead then PASS':
    'Мёртвый ping → spawn, затем e2e в тот же BFF Target; гасится только свой процесс.',
  'runE2eGate BLOCKED when BFF does not become ready':
    'Этап 4 BLOCKED, если BFF не поднялся: проверять GraphQL не на чем.',
  'runE2eGate BLOCKED on network failure after retries':
    'После ретраев сеть всё ещё лежит — BLOCKED, а не баг операции.',
  'buildResult compact includes e2e environment target and operation':
    'В коротком статусе видны env, куда ходили (fetch или executeOperation) и имя операции.',
  'loadManifest reads stage 4 fixture manifest':
    'Фикстурный manifest этапа 4 читается и проходит валидацию.',

  'validateManifestForStage requires stage 5 client and expectedTypes but not BFF Target':
    'Для codegen в manifest нужны client и expectedTypes; BFF Target живёт только в workspace .env.',
  'checkClientForStack rejects unknown client on bff-admin':
    'Неизвестный клиент нельзя использовать для codegen bff-admin.',
  'checkCodegenSchemaSource PASS for admin + bff-admin':
    'Codegen admin должен ходить в схему bff-admin, не в чужой BFF.',
  'checkCodegenSchemaSource FAIL for wrong BFF env on mls client':
    'Если mls codegen смотрит не в bff-mls, этап красный.',
  'buildCodegenEnv points codegen at BFF Target not client env':
    'Codegen ходит в BFF Target из workspace .env, даже если в .env клиента другой хост.',
  'buildCodegenEnv FAIL for invalid BFF Target':
    'Битый BFF Target нельзя скормить codegen.',
  'findMissingTypes detects absent expected operation types':
    'После codegen в graphql-types должны появиться имена из expectedTypes.',
  'findUnrelatedTypeChanges BLOCKED when Scalars or Query drift':
    'Если вне операции поплыли Scalars или Query, это чужой diff: BLOCKED, не FAIL фичи.',
  'findUnrelatedTypeChanges allows only the current operation field in Query':
    'В корневом Query разрешается только поле текущей операции; соседние поля остаются BLOCKED.',
  'runClientTypesChecks PASS for valid diff':
    'Дифф типов зелёный, когда нужные типы есть и нет посторонних изменений.',
  'runClientTypesChecks FAIL when expected types are missing':
    'Codegen отработал, но expectedTypes в файле нет — FAIL.',
  'runClientTypesChecks BLOCKED for unrelated generated type changes':
    'Посторонний diff сгенерированных типов останавливает этап как BLOCKED.',
  'formatLogLines includes full diff only in stage log payload':
    'Полный diff типов пишется в лог этапа, в короткий compact он не раздувается.',
  'runClientCodegenGate uses workspace BFF Target even if client env host differs':
    'Этап 5 не смотрит на GRAPHQL_URL проекта: в процесс codegen подставляется BFF Target workspace.',
  'runClientCodegenGate BLOCKED before codegen when BFF identity differs':
    'Этап 5 не запускает codegen, если live-схема не совпала со схемой BFF workspace.',
  'runClientCodegenGate reads target, env and client root from Workspace Links':
    'Этап 5 получает BFF Target, env и корень клиента одной связкой Workspace Links.',
  'runClientCodegenGate PASS with mocked codegen and valid types update':
    'Весь этап 5 зелёный, когда codegen отработал и expectedTypes появились.',
  'runClientCodegenGate FAIL for wrong BFF schema source':
    'Весь этап 5 красный, если codegen смотрит не в тот BFF.',
  'runClientCodegenGate FAIL when codegen succeeds but expected types stay missing':
    'Codegen не упал, но нужных типов всё ещё нет — FAIL, а не PASS.',
  'runClientCodegenGate BLOCKED on unrelated types diff':
    'Весь этап 5 BLOCKED на чужом diff типов.',
  'runClientCodegenGate keeps git HEAD as baseline across repeated blocked runs':
    'Повторный запуск сравнивает типы с git HEAD и не принимает старый BLOCKED drift за baseline.',
  'runClientCodegenGate BLOCKED when git HEAD baseline is unavailable':
    'Без читаемого git HEAD этап блокируется и не легализует текущий types.ts как baseline.',
  'runClientCodegenGate FAIL when npm run codegen fails':
    'Упавший npm run codegen валит этап 5.',
  'runClientCodegen BLOCKED on timeout':
    'Codegen завис по timeout — BLOCKED, а не ошибка схемы.',
  'buildResult compact includes client and expected types':
    'В коротком статусе этапа 5 видны клиент и список ожидаемых типов.',
  'extractTypeBlocks indexes exported type names':
    'Парсер graphql-types находит export type Имя, чтобы сравнить до/после.',
  'loadManifest reads stage 5 fixture manifest':
    'Фикстурный manifest этапа 5 читается и валиден.',
  'checkCodegenSchemaSource PASS for mls client on bff-mls':
    'Codegen mls должен ходить в схему bff-mls.',

  'validateManifestForStage requires stage 6 apolloPath and hookName':
    'Для Apollo-этапа в manifest нужны apolloPath и hookName.',
  'validateApolloFilename PASS for query, mutation and fragment patterns':
    'Имя файла совпадает с каноном: listing query, by-uuid, mutation или fragment.',
  'validateApolloFilename FAIL for listing without namespace and entity':
    'Listing обязан содержать и namespace, и entity — короткое apollo-demo-listing запрещено.',
  'validateApolloFilename FAIL for invalid or mismatched extension':
    'Неверное имя или расширение Apollo-файла — FAIL.',
  'resolveApolloKind infers fragment from apolloPath':
    'По пути файла понимает, это query, mutation или fragment.',
  'checkSingleOperation FAIL when gql contains multiple operations':
    'В одном Apollo-файле должна быть ровно одна gql-операция.',
  'checkOperationName and checkHookName validate manifest operation and hook':
    'Имя операции в gql и имя хука совпадают с manifest.',
  'checkPickUsage requires Pick for query and createApolloFragment for fragment kind':
    'Query берёт поля через Pick, fragment собирается createApolloFragment — не копипастой типов.',
  'checkTypeOnlyImports and checkNoDefaultExport enforce import/export rules':
    'Типы импортируются type-only, default export запрещён.',
  'extractGqlTemplates and countGqlOperations parse gql documents':
    'Из файла достаются gql`` шаблоны и считается число операций.',
  'runApolloAstChecks PASS for valid query fixture':
    'Валидный query Apollo-файл проходит все AST-проверки.',
  'checkApolloFile FAIL for missing file or wrong filename':
    'Нет файла или имя не по канону — сразу FAIL.',
  'runApolloGate PASS with mocked type-check and eslint':
    'Весь этап 6 зелёный на валидном файле, когда TS и eslint замоканы как успешные.',
  'runApolloGate FAIL for multiple operations without running expensive checks early':
    'Две операции в файле валят этап сразу, type-check и eslint даже не запускаются.',
  'filterTscErrors reads pretty tsc output after stripping ANSI':
    'Цветной tsc --pretty тоже разбираем: сначала снимаем ANSI, потом фильтруем по файлу.',
  'filterTscErrors keeps errors only for changed files':
    'Из лога tsc оставляем только строки error TS по файлу этапа, чужие ошибки отбрасываем.',
  'runClientTypeCheck PASS when pretty tsc fails only in unrelated files':
    'tsc --pretty с ANSI в чужих файлах не валит этап: после stripAnsi ошибки считаются, apollo чистый.',
  'runClientTypeCheck PASS when tsc fails only in unrelated files':
    'Если tsc красный, но в apollo-файле ошибок нет — этап зелёный, чужие ошибки только считаем.',
  'runApolloGate FAIL when type-check fails':
    'Ошибки TypeScript в самом apollo-файле валят этап 6. Чужой tsc по проекту — нет.',
  'runApolloGate FAIL when eslint fails':
    'ESLint Apollo-файла валит этап 6.',
  'runApolloGate cannot PASS when type-check and lint are skipped':
    'Нельзя объявить PASS, если TS и lint просто пропустили.',
  'runApolloGate PASS for valid mutation fixture':
    'Валидный mutation Apollo-файл проходит весь gate.',
  'runClientTypeCheck BLOCKED on timeout':
    'Type-check клиента завис — BLOCKED, не FAIL кода.',
  'runApolloLint uses eslint without --fix':
    'Линтер только проверяет, файлы сам не переписывает (--fix нет).',
  'buildResult compact includes apollo path and hook for stage 6':
    'В коротком статусе видны путь Apollo-файла и имя хука.',
  'loadManifest reads stage 6 fixture manifest':
    'Фикстурный manifest этапа 6 читается и валиден.',

  'runPipeline happy path executes stages 0-6 sequentially':
    'На зелёном пути runner идёт строго 0→6 и не перескакивает этапы.',
  'runPipeline rejects FAIL override with --override-blocked semantics':
    'FAIL нельзя обойти флагом override: чинить код, а не пропускать проверку.',
  'runPipeline stops on BLOCKED without override':
    'На BLOCKED pipeline останавливается, пока пользователь явно не разрешит override.',
  'runPipeline records BLOCKED override and continues':
    'После явного override BLOCKED фиксируется в run и этапы продолжаются.',
  'runPipeline resume reuses matching checkpoints':
    'Повторный run с тем же fingerprint не переигрывает уже зелёные этапы.',
  'runPipeline invalidates changed fingerprint and reruns dependent stages':
    'Если вход этапа изменился, этот этап и все поздние пересчитываются.',
  'findInvalidatedFrom detects earliest stale stage':
    'Находит самый ранний протухший этап, чтобы не резюмить поверх него.',
  'runPipeline includes changedFiles on FAIL':
    'При FAIL оркестратор прокидывает changedFiles в результат.',
  'verify checkpoint fingerprint enables resume reuse':
    'verify пишет fingerprint в checkpoint, и следующий run может его переиспользовать.',
  'computeStageFingerprint changes when manifest input changes':
    'Поля manifest входят в fingerprint: поменяли вход — этап больше не считается пройденным.',
  'stage 4 and 5 fingerprints change when workspace BFF Target changes':
    'Смена BFF Target в workspace .env инвалидирует checkpoints этапов 4 и 5.',
  'stage 4 and 5 fingerprints ignore legacy manifest schemaUrl':
    'Устаревший schemaUrl в manifest не становится вторым источником Target для этапов 4 и 5.',

  'resolveWorkspaceRoot maps stack to parent of bff project':
    'Workspace для manifest — родитель bff-репозитория (mls-project или admin-project).',
  'resolveDefaultManifestPath points to workspace manifest.json':
    'Канонический путь manifest: <workspace>/manifest.json.',
  'validateManifestPath rejects manifest inside bff project':
    'manifest.json внутри bff-admin/bff-mls запрещён — runner отклоняет.',
  'validateManifestPath rejects manifest inside client project':
    'manifest.json внутри admin/mls/www запрещён — runner отклоняет.',
  'validateManifestPath accepts workspace root manifest':
    'manifest.json в корне workspace проходит проверку расположения.',
  'loadManifest validates workspace location for production manifest.json':
    'loadManifest с config не принимает manifest.json вне workspace root.',
  'loadManifest skips location validation for test fixtures':
    'Фикстуры runner в tests/fixtures не проходят проверку workspace-пути.',

  'resolveWorkspaceLinks reads all stage links from workspace env':
    'Workspace Links игнорирует машинные пути config и URL manifest: все связи берёт из workspace .env.',
  'resolveWorkspaceLinks rejects missing BFF Target':
    'Без BFF_PIPELINE_BFF_TARGET runner останавливается как INVALID_INPUT.',
  'loadConfig overlays machine paths from workspace env':
    'Пути workspace из .env перекрывают абсолютные пути автора в default config.',

  'checkBffTargetIdentity PASS when live and local schema fingerprints match':
    'Одинаковый fingerprint нормализованной live и локальной схемы подтверждает identity Target.',
  'checkBffTargetIdentity BLOCKED when live schema differs from workspace schema':
    'Разные fingerprints означают чужой или устаревший BFF и дают BLOCKED с советом перезапустить.',
  'checkBffTargetIdentity distinguishes TLS failure from identity mismatch':
    'Ошибка TLS помечается отдельно и не маскируется как несовпадение схем.',
  'checkBffTargetIdentity distinguishes network failure from identity mismatch':
    'Сетевая недоступность помечается отдельно и не маскируется как чужой BFF.',
  'local SDL and live introspection produce the same real schema fingerprint':
    'Реальные GraphQL loader, introspection, normalization и SHA-256 дают один fingerprint для одной схемы.',

  'killProcessTree is safe for missing child':
    'Убийство дерева процессов не падает, если дочернего pid уже нет.',
  'killProcessTree calls child.kill when process group kill fails':
    'Если kill группы не сработал, останавливаем сам child-процесс.',

  'registry lists stages 0..6 in order without gaps':
    'Реестр покрывает этапы 0–6 по порядку: новый этап нельзя «потерять» или вставить мимо списка.',
  'every stage descriptor exposes the registry contract':
    'У каждого паспорта этапа есть обязательный набор: id, name, manifestSlice, files, run — иначе pipeline сломается в рантайме.',
  'getStage returns descriptor by id and throws on unknown stage':
    'Реестр отдаёт паспорт по номеру этапа и падает с понятной ошибкой на несуществующем номере.',
  'manifestSlice keeps base fields for every stage':
    'Хэш каждого этапа включает базовые поля manifest — resume не путает операции между собой.',
  'files returns a list of path strings for every stage':
    'Паспорт каждого этапа объявляет файлы для fingerprint — реестр контролирует это в одном месте.',

  'fileLabel maps stage test files':
    'Имя файла теста превращается в читаемый заголовок этапа.',
  'isLeafTest skips suites and file wrappers':
    'В таблицу попадают только сами тесты, не обёртка файла.',
  'formatFileTable lists passed tests and what they check':
    'После файла печатается таблица: статус и пояснение, что проверял тест.',
  'formatSummary totals files after a run':
    'В конце прогона сводка: сколько PASS/FAIL по каждому этапу.',
  'describeTest explains known tests and marks missing copy':
    'Для известного теста берётся готовое пояснение; если текста нет — в таблице это явно видно.',
};

export function fileLabel(filePath) {
  return FILE_LABELS[path.basename(filePath ?? '')] ?? path.basename(filePath ?? '');
}

export function fileIntro(filePath) {
  return FILE_INTROS[path.basename(filePath ?? '')] ?? '';
}

export function describeTest(name) {
  return TEST_DESCRIPTIONS[name] ?? `Нет описания в репортере. Техническое имя: ${name}`;
}

export function isLeafTest(event) {
  const data = event?.data;

  if (!data?.name) {
    return false;
  }

  if (data.details?.type === 'suite' || data.type === 'suite') {
    return false;
  }

  if (/\.(mjs|cjs|js|ts)$/.test(data.name)) {
    return false;
  }

  if (data.file && data.name === data.file) {
    return false;
  }

  return event.type === 'test:pass' || event.type === 'test:fail' || event.type === 'test:skip';
}

export function toRow(event) {
  const status =
    event.type === 'test:fail' ? 'FAIL' : event.type === 'test:skip' ? 'SKIP' : 'PASS';
  const error = event.data?.details?.error;

  return {
    name: event.data.name,
    description: describeTest(event.data.name),
    status,
    error: error ? error.message ?? String(error) : null,
  };
}

function escapeCell(value) {
  return String(value).replaceAll('|', '\\|');
}

function countByStatus(rows) {
  return rows.reduce(
    (acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;

      return acc;
    },
    { PASS: 0, FAIL: 0, SKIP: 0 }
  );
}

function formatCounts(rows) {
  const counts = countByStatus(rows);
  const parts = [`${counts.PASS} PASS`, `${counts.FAIL} FAIL`];

  if (counts.SKIP) {
    parts.push(`${counts.SKIP} SKIP`);
  }

  return parts.join(', ');
}

export function formatFileTable(filePath, rows) {
  const intro = fileIntro(filePath);
  const lines = [
    '',
    `### ${fileLabel(filePath)} (${path.basename(filePath)}) — ${formatCounts(rows)}`,
  ];

  if (intro) {
    lines.push('', intro);
  }

  lines.push(
    '',
    '| Статус | Что делает |',
    '|--------|------------|',
    ...rows.map((row) => `| ${row.status.padEnd(6)} | ${escapeCell(row.description)} |`)
  );

  const failures = rows.filter((row) => row.status === 'FAIL' && row.error);

  if (failures.length > 0) {
    lines.push('', 'Ошибки:');

    for (const row of failures) {
      lines.push(`- FAIL ${row.name}: ${row.error}`);
    }
  }

  lines.push('');

  return lines.join('\n');
}

export function formatSummary(files) {
  const allRows = files.flatMap((file) => file.rows);
  const lines = [
    '',
    `## Итого — ${formatCounts(allRows)}`,
    '',
    '| Этап | Файл | PASS | FAIL | SKIP |',
    '|------|------|------|------|------|',
  ];

  for (const file of files) {
    const counts = countByStatus(file.rows);

    lines.push(
      `| ${fileLabel(file.file)} | ${path.basename(file.file)} | ${counts.PASS} | ${counts.FAIL} | ${counts.SKIP} |`
    );
  }

  lines.push('');

  return lines.join('\n');
}
