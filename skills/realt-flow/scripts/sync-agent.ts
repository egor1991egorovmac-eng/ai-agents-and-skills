import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const SCRIPTS_DIR = import.meta.dir;
const HOME = process.env.HOME ?? "";
if (!HOME) {
  console.error("Ошибка: не определена переменная HOME");
  process.exit(1);
}

const DESCRIPTION =
  "Ведёт флоу REALT-фичи под ключ: ссылка на сторю YouTrack → фича-ветка от stage + draft-MR → таск-ветки → MR тасков → итоговое сообщение. Триггеры: «новая сторя», «создай флоу по REALT-…», «оформи MR». Также баги и мелкие таски без фичи и срочные хотфиксы в master (ветка hot-fix/…).";

const body = readFileSync(join(SCRIPTS_DIR, "AGENT.md"), "utf8");

type Target = { label: string; path: string; content: string };

const targets: Target[] = [
  {
    label: "opencode agent",
    path: join(HOME, ".config/opencode/agent/realt-flow.md"),
    content: `---\ndescription: ${DESCRIPTION}\nmode: primary\n---\n\n${body}`,
  },
  {
    label: "Claude skill",
    path: join(HOME, ".claude/skills/realt-flow/SKILL.md"),
    content: `---\nname: realt-flow\ndescription: ${DESCRIPTION}\n---\n\n${body}`,
  },
  {
    label: "Cursor rule",
    path: join(HOME, ".cursor/rules/realt-flow.mdc"),
    content: `---\ndescription: ${DESCRIPTION}\nalwaysApply: false\n---\n\n${body}`,
  },
];

const dryRun = process.argv.includes("--dry-run");

for (const target of targets) {
  if (dryRun) {
    console.log(`[dry-run] ${target.label} -> ${target.path}`);
  } else {
    mkdirSync(join(target.path, ".."), { recursive: true });
    writeFileSync(target.path, target.content);
    console.log(`OK ${target.label}: ${target.path}`);
  }
}
