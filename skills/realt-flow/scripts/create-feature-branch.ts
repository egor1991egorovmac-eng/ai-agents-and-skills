import { execSync } from "node:child_process";
import { fail, resolveRepos, type Repo } from "./repos.ts";

type Args = {
  id?: string;
  slug?: string;
  reposCsv?: string;
  dryRun: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = { dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") args.dryRun = true;
    else if (argv[i] === "--story") args.id = argv[++i];
    else if (argv[i] === "--slug") args.slug = argv[++i];
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
if (!args.slug) fail("Укажите --slug (из ссылки на сторю)");

const branchName = `feature/REALT-${args.id}-${args.slug}`;
const repos = resolveRepos(args.reposCsv ?? "");

console.log(`Фича-ветка: ${branchName}\n`);

for (const repo of repos) {
  git(repo, `fetch origin ${repo.targetBranch}`, args.dryRun);
  git(repo, `checkout -B ${branchName} origin/${repo.targetBranch}`, args.dryRun);
}

console.log(`\n${args.dryRun ? "DRY-RUN: ничего не выполнено" : "Готово."}`);
