import { homedir } from "node:os";
import { join } from "node:path";

export type Repo = {
  name: string;
  path: string;
  targetBranch: string;
};

export const REPOS: Record<string, Repo> = {
  mls: { name: "mls", path: join(homedir(), "Documents/work/mls-project/mls"), targetBranch: "stage" },
  "bff-mls": { name: "bff-mls", path: join(homedir(), "Documents/work/mls-project/bff-mls"), targetBranch: "stage" },
  admin: { name: "admin", path: join(homedir(), "Documents/work/admin-project/admin"), targetBranch: "stage" },
  "bff-admin": { name: "bff-admin", path: join(homedir(), "Documents/work/admin-project/bff-admin"), targetBranch: "stage" },
  www: { name: "www", path: join(homedir(), "Documents/work/www-project/www"), targetBranch: "stage" },
  "bff-www": { name: "bff-www", path: join(homedir(), "Documents/work/www-project/bff"), targetBranch: "stage" },
};

export function resolveRepos(namesCsv: string): Repo[] {
  const names = namesCsv.split(",").map((n) => n.trim()).filter(Boolean);
  if (names.length === 0) fail("Не указаны репозитории. Доступные: " + Object.keys(REPOS).join(", "));
  return names.map((name) => {
    const repo = REPOS[name];
    if (!repo) fail(`Неизвестный репозиторий '${name}'. Доступные: ${Object.keys(REPOS).join(", ")}`);
    return repo;
  });
}

export function fail(message: string): never {
  console.error(`Ошибка: ${message}`);
  process.exit(1);
}
