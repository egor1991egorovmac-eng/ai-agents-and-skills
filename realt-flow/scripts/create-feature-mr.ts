import { execSync } from "node:child_process";
import { fail, resolveRepos, type Repo } from "./repos.ts";

type Args = {
  id?: string;
  slug?: string;
  title?: string;
  description?: string;
  reposCsv?: string;
  dryRun: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = { dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run") args.dryRun = true;
    else if (argv[i] === "--story") args.id = argv[++i];
    else if (argv[i] === "--slug") args.slug = argv[++i];
    else if (argv[i] === "--title") args.title = argv[++i];
    else if (argv[i] === "--description") args.description = argv[++i];
    else if (argv[i] === "--repos") args.reposCsv = argv[++i];
  }
  return args;
}

function run(repo: Repo, command: string, dryRun: boolean): void {
  const full = `cd "${repo.path}" && ${command}`;
  console.log(`[${repo.name}] ${command}`);
  if (!dryRun) execSync(full, { stdio: "inherit", shell: "/bin/zsh" });
}

const args = parseArgs(process.argv.slice(2));
if (!args.id) fail("Укажите --story REALT-{id}");
if (!args.slug) fail("Укажите --slug (из ссылки на сторю)");
if (!args.title) fail("Укажите --title (короткий понятный title для MR)");

const sourceBranch = `feature/REALT-${args.id}-${args.slug}`;
const mrTitle = `[${args.title}]-Realt-${args.id}-${args.slug}`;
const storyUrl = `https://youtrack.realt.by/issue/REALT-${args.id}`;
const description = `${args.description ?? ""}\n\nСторя: ${storyUrl}`;
const repos = resolveRepos(args.reposCsv ?? "");

console.log(`MR title:   ${mrTitle}`);
console.log(`Source:     ${sourceBranch}`);
console.log(`Target:     stage (draft)\n`);

for (const repo of repos) {
  const target = repo.targetBranch;

  // GUARD: единственный разрешённый MR на stage — draft фича-ветки.
  // Проверяем ref'ы сами, не доверяя аргументам.
  if (target !== "stage") fail(`${repo.name}: target-ветка в конфиге не 'stage' (${target}) — создание MR запрещено`);
  if (!sourceBranch.startsWith("feature/")) fail(`${repo.name}: source '${sourceBranch}' не является feature/* — создание MR запрещено`);

  const pushBranch = `git push -u origin ${sourceBranch}`;
  const createMr =
    `glab mr create --draft --source-branch "${sourceBranch}" --target-branch "${target}"` +
    ` --title "${mrTitle.replaceAll('"', '\\"')}" --description "${description.replaceAll('"', '\\"')}" --yes`;

  run(repo, pushBranch, args.dryRun);
  run(repo, createMr, args.dryRun);
}

console.log(`\n${args.dryRun ? "DRY-RUN: ничего не выполнено" : "Готово."}`);
