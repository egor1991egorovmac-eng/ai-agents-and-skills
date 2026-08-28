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
  toMaster: boolean;
  dryRun: boolean;
};

// Префикс хотфикс-веток, идущих напрямую в master (как в create-task-branch.ts)
const HOTFIX_PREFIX = "hot-fix/";

function parseArgs(argv: string[]): Args {
  const args: Args = { toStage: false, toMaster: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") args.dryRun = true;
    else if (argv[i] === "--to-stage") args.toStage = true;
    else if (argv[i] === "--to-master") args.toMaster = true;
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
if (!args.toStage && !args.toMaster && !args.featureSlug)
  fail("Укажите --feature-slug (slug фичи), --to-stage или --to-master");
if (args.toStage && args.toMaster) fail("--to-stage и --to-master взаимоисключающие");
if ((args.toStage || args.toMaster) && args.featureSlug)
  fail(`--${args.toMaster ? "to-master" : "to-stage"} несовместим с --feature-slug`);
if (!args.task) fail("Укажите --task (описание таска)");

let taskSlug: string;
try {
  taskSlug = slugify(args.task);
} catch (e) {
  fail(e instanceof Error ? e.message : String(e));
}

const featureBranch = `feature/REALT-${args.id}-${args.featureSlug ?? ""}`;
// Хотфикс-ветка получает префикс hot-fix/ (должна совпадать с веткой из create-task-branch.ts)
const taskBranch = args.toMaster
  ? `${HOTFIX_PREFIX}REALT-${args.id}-${taskSlug}`
  : `REALT-${args.id}-${taskSlug}`;
const mrTarget = args.toMaster ? "master" : args.toStage ? "stage" : featureBranch;
// Для таски, бага и хотфикса MR title = имя ветки без префикса hot-fix/ (REALT-{id}-{issue})
const mrTitle = taskBranch.replace(HOTFIX_PREFIX, "");
const storyUrl = `https://youtrack.realt.by/issue/REALT-${args.id}`;
const description = `${args.description ?? ""}\n\nСторя: ${storyUrl}`;
const repos = resolveRepos(args.reposCsv ?? "");

// GUARD: push в stage/master запрещён на уровне скрипта. Проверяем сами, не доверяя аргументам.
// Push всегда идёт только в таск-ветку REALT-* или хотфикс-ветку hot-fix/*.
// MR разрешён: в stage (--to-stage), в master (--to-master) или в фича-ветку feature/*.
const FORBIDDEN_PUSH = ["stage", "master", "main", "develop"];
const isPushableBranch =
  (taskBranch.startsWith("REALT-") || taskBranch.startsWith(HOTFIX_PREFIX)) &&
  !FORBIDDEN_PUSH.includes(taskBranch);
if (!isPushableBranch) {
  fail(`ЗАПРЕЩЕНО: '${taskBranch}' не является таск- или хотфикс-веткой — push заблокирован guard'ом`);
}
if (mrTarget !== "stage" && mrTarget !== "master" && !mrTarget.startsWith("feature/")) {
  fail(`ЗАПРЕЩЕНО: target MR '${mrTarget}' должен быть stage, master или feature/*`);
}

console.log(`MR title:   ${mrTitle}`);
console.log(`Source:     ${taskBranch}`);
console.log(
  `Target:     ${mrTarget}${args.toStage || args.toMaster ? " (обычный)" : ""}\n`,
);

for (const repo of repos) {
  // В master-режиме target берём из аргументов, конфиг не участвует
  if (!args.toMaster && repo.targetBranch !== "stage")
    fail(`${repo.name}: неожиданная target-ветка в конфиге (${repo.targetBranch})`);
  const currentBranch = execSync(`git -C "${repo.path}" rev-parse --abbrev-ref HEAD`).toString().trim();
  if (currentBranch === repo.targetBranch || FORBIDDEN_PUSH.includes(currentBranch)) {
    fail(`${repo.name}: текущая ветка защищённая ('${currentBranch}') — оформление отменено`);
  }

  const push = `git push -u origin ${taskBranch}`;
  const createMr =
    `glab mr create ${args.toStage || args.toMaster ? "" : "--draft "}--source-branch "${taskBranch}" --target-branch "${mrTarget}"` +
    ` --title "${mrTitle.replaceAll('"', '\\"')}" --description "${description.replaceAll('"', '\\"')}" --yes`;

  run(repo, push, args.dryRun);
  run(repo, createMr, args.dryRun);
}

console.log(`\n${args.dryRun ? "DRY-RUN: ничего не выполнено" : "Готово."}`);
