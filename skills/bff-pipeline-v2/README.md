# bff-pipeline V2

Детерминированный pipeline с Node.js runner. **V1 не ломается** — см. [../bff-pipeline/SKILL.md](../bff-pipeline/SKILL.md).

| | V1 | V2 |
|---|---|---|
| Skill | `bff-pipeline/SKILL.md` | `bff-pipeline-v2/SKILL.md` |
| Источник статуса | AI + stdout команд | runner → `PASS` / `FAIL` / `BLOCKED` |
| Скрипты | `scripts/update-*.sh` | `scripts/bff-pipeline.mjs` |
| Состояние | нет | `~/.bff-pipeline/runs/` (checkpoint + fingerprint) |

## Быстрый старт

```bash
SKILL_V2="$HOME/.claude/skills/bff-pipeline-v2"

node "$SKILL_V2/scripts/bff-pipeline.mjs" preflight check --stack bff-mls
node "$SKILL_V2/scripts/bff-pipeline.mjs" run --manifest ~/Documents/work/mls-project/manifest.json
node "$SKILL_V2/scripts/bff-pipeline.mjs" test
```

Manifest — только `mls-project/manifest.json` или `admin-project/manifest.json`, не внутри `bff-mls` / `bff-admin` / клиентских репозиториев.

Рядом с manifest нужен workspace `.env`:

```dotenv
BFF_PIPELINE_BFF_ROOT=/absolute/path/to/workspace/bff
BFF_PIPELINE_CLIENT_ROOT=/absolute/path/to/workspace/client
BFF_PIPELINE_BFF_TARGET=https://api.realt.loc:8005/graphql
BFF_PIPELINE_GRAPHIFY_VAULT=/absolute/path/to/Obsidian Vault/Работа
E2E_AUTH_TOKEN=
```

Этапы 4 и 5 используют один `BFF_PIPELINE_BFF_TARGET`; codegen не берёт схему из `.env` клиента.

## Структура

```
bff-pipeline-v2/
├── SKILL.md                 # дирижёр V2 (единственный источник статуса)
├── README.md
├── config/default.config.json
├── scripts/
│   ├── bff-pipeline.mjs     # CLI: preflight, verify, run, test
│   └── lib/                 # gates 0–6, orchestrator, fingerprint
└── tests/
    ├── lib/                 # test reporter (test-table, test-table-reporter)
    ├── fixtures/            # gate fixtures
    └── *.test.mjs           # node:test (PASS/FAIL/BLOCKED)
```

## Контракт результата

```json
{
  "runId": "20260814-abc123",
  "stage": 1,
  "status": "PASS",
  "checksPassed": 6,
  "compact": "stage 1 PASS",
  "logPath": "/Users/.../.bff-pipeline/runs/.../stage-1.log"
}
```

При PASS массив `checks` не возвращается. При FAIL/BLOCKED `checks` содержит только упавшие/заблокированные проверки — `detail` обрезан (~800 символов), `fullDiff` — первые ~30 строк; полный текст всегда в `logPath`.

Exit codes: `0` PASS, `1` FAIL, `2` BLOCKED, `3` invalid input.

## Stage skills (генерация)

Runner проверяет; stage skills генерируют код:

| Этап | Skill V2 |
|------|----------|
| 1 | `bff-schema-create-v2` |
| 2 | `bff-datasource-create-v2` |
| 3 | `bff-resolver-create-v2` |
| 4 | `bff-e2e-verify-v2` |
| 5 | `client-types-sync-v2` |
| 6 | `client-apollo-create-v2` |

## Тикеты

[`.scratch/reliable-bff-pipeline/issues/`](../bff-pipeline/.scratch/reliable-bff-pipeline/issues/)

**MVP (tickets 01–09):** runner с gates 0–6, orchestrator `run`, отдельные V2 stage skills, 127 fixture-тестов.
