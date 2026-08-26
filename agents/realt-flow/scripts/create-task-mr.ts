import { execSync } from "node:child_process";
import { fail, resolveRepos, type Repo } from "./repos.ts";
import { slugify } from "./slugify.ts";

type Args = {
  id?: string;
  featureSlug?: string;
  task?: string;
  title?: string;
  description?: string;
  reposCsv?: string;
  toStage: boolean;
  dryRun: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = { toStage: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") args.dryRun = true;
    else if (argv[i] === "--to-stage") args.toStage = true;
    else if (argv[i] === "--story") args.id = argv[++i];
    else if (argv[i] === "--feature-slug") args.featureSlug = argv[++i];
    else if (argv[i] === "--task") args.task = argv[++i];
    else if (argv[i] === "--title") args.title = argv[++i];
    else if (argv[i] === "--description") args.description = argv[++i];
    else if (argv[i] === "--repos") args.reposCsv = argv[++i];
  }
  return args;
}

function run(repo: Repo, command: string, dryRun: boolean): void {
  console.log(`[${repo.name}] ${command}`);
  if (!dryRun) execSync(`cd "${repo.path}" && ${command}`, { stdio: "inherit", shell: "/bin/zsh" });
}

const args = parseArgs(process.argv.slice(2));
if (!args.id) fail("Укажите --story REALT-{id}");
if (!args.toStage && !args.featureSlug) fail("Укажите --feature-slug (slug фичи) или --to-stage");
if (!args.task) fail("Укажите --task (описание таска)");

let taskSlug: string;
try {
  taskSlug = slugify(args.task);
} catch (e) {
  fail(e instanceof Error ? e.message : String(e));
}

const featureBranch = `feature/REALT-${args.id}-${args.featureSlug ?? ""}`;
const taskBranch = `REALT-${args.id}-${taskSlug}`;
const mrTarget = args.toStage ? "stage" : featureBranch;
// Для таски и бага MR title = имя ветки (REALT-{id}-{issue})
const mrTitle = taskBranch;
const storyUrl = `https://youtrack.realt.by/issue/REALT-${args.id}`;
const description = `${args.description ?? ""}\n\nСторя: ${storyUrl}`;
const repos = resolveRepos(args.reposCsv ?? "");

// GUARD: push в stage запрещён на уровне скрипта. Проверяем сами, не доверяя аргументам.
// Push всегда идёт только в таск-ветку REALT-*.
// MR в stage разрешён ТОЛЬКО в режиме --to-stage (обычный MR бага/мелкой таски).
const FORBIDDEN_PUSH = ["stage", "master", "main", "develop"];
if (FORBIDDEN_PUSH.includes(taskBranch) || taskBranch.startsWith("feature/")) {
  fail(`ЗАПРЕЩЕНО: '${taskBranch}' не является таск-веткой — push заблокирован guard'ом`);
}
if (!FORBIDDEN_PUSH.includes(mrTarget)) {
  // target — фича-ветка: проверяем формат
  if (!mrTarget.startsWith("feature/")) fail(`ЗАПРЕЩЕНО: target MR '${mrTarget}' не stage и не feature/*`);
}

console.log(`MR title:   ${mrTitle}`);
console.log(`Source:     ${taskBranch}`);
console.log(`Target:     ${mrTarget}${args.toStage ? " (обычный)" : ""}\n`);

for (const repo of repos) {
  if (repo.targetBranch !== "stage") fail(`${repo.name}: неожиданная target-ветка в конфиге (${repo.targetBranch})`);
  const currentBranch = execSync(`git -C "${repo.path}" rev-parse --abbrev-ref HEAD`).toString().trim();
  if (currentBranch === repo.targetBranch || ["master", "main", "develop"].includes(currentBranch)) {
    fail(`${repo.name}: текущая ветка защищённая ('${currentBranch}') — оформление отменено`);
  }

  const push = `git push -u origin ${taskBranch}`;
  const createMr =
    `glab mr create ${args.toStage ? "" : "--draft "}--source-branch "${taskBranch}" --target-branch "${mrTarget}"` +
    ` --title "${mrTitle.replaceAll('"', '\\"')}" --description "${description.replaceAll('"', '\\"')}" --yes`;

  run(repo, push, args.dryRun);
  run(repo, createMr, args.dryRun);
}

console.log(`\n${args.dryRun ? "DRY-RUN: ничего не выполнено" : "Готово."}`);
