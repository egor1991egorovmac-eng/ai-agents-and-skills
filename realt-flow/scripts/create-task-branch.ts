import { execSync } from "node:child_process";
import { fail, resolveRepos, type Repo } from "./repos.ts";
import { slugify } from "./slugify.ts";

type Args = {
  id?: string;
  featureSlug?: string;
  task?: string;
  reposCsv?: string;
  fromStage: boolean;
  dryRun: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = { fromStage: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") args.dryRun = true;
    else if (argv[i] === "--from-stage") args.fromStage = true;
    else if (argv[i] === "--story") args.id = argv[++i];
    else if (argv[i] === "--feature-slug") args.featureSlug = argv[++i];
    else if (argv[i] === "--task") args.task = argv[++i];
    else if (argv[i] === "--repos") args.reposCsv = argv[++i];
  }
  return args;
}

function git(repo: Repo, command: string, dryRun: boolean): void {
  const full = `git -C "${repo.path}" ${command}`;
  console.log(`[${repo.name}] ${full}`);
  if (!dryRun) execSync(full, { stdio: "inherit" });
}

const args = parseArgs(process.argv.slice(2));
if (!args.id) fail("Укажите --story REALT-{id}");
if (!args.fromStage && !args.featureSlug) fail("Укажите --feature-slug (slug фичи) или --from-stage");
if (!args.task) fail("Укажите --task (описание таска)");

let taskSlug: string;
try {
  taskSlug = slugify(args.task);
} catch (e) {
  fail(e instanceof Error ? e.message : String(e));
}

const featureBranch = `feature/REALT-${args.id}-${args.featureSlug ?? ""}`;
const taskBranch = `REALT-${args.id}-${taskSlug}`;
const repos = resolveRepos(args.reposCsv ?? "");

if (args.fromStage) {
  console.log(`База:             origin/stage (свежая, с fetch)`);
} else {
  console.log(`Фича-ветка (база): ${featureBranch}`);
}
console.log(`Таск-ветка:        ${taskBranch}\n`);

for (const repo of repos) {
  if (args.fromStage) {
    git(repo, `fetch origin ${repo.targetBranch}`, args.dryRun);
    git(repo, `checkout -B ${taskBranch} origin/${repo.targetBranch}`, args.dryRun);
  } else {
    git(repo, `checkout ${featureBranch}`, args.dryRun);
    git(repo, `checkout -b ${taskBranch}`, args.dryRun);
  }
}

console.log(`\n${args.dryRun ? "DRY-RUN: ничего не выполнено" : "Готово."}`);
