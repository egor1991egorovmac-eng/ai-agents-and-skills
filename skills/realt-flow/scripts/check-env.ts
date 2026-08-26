import { execSync } from "node:child_process";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { REPOS } from "./repos.ts";

let glabOk = false;
try {
  execSync("glab auth status", { stdio: "pipe" });
  glabOk = true;
} catch {
  glabOk = false;
}

let ytReachable = false;
try {
  const res = await fetch("https://youtrack.realt.by/api/admin/projects?fields=id", { headers: {} });
  ytReachable = true;
  void res;
} catch {
  ytReachable = false;
}
const ytToken = Boolean(process.env.YOUTRACK_TOKEN);

console.log("=== realt-flow check-env ===\n");

for (const repo of Object.values(REPOS)) {
  const gitDir = join(repo.path, ".git");
  const exists = existsSync(gitDir);
  let stage = false;
  if (exists) {
    try {
      execSync(`git -C "${repo.path}" rev-parse --verify origin/${repo.targetBranch}`, { stdio: "pipe" });
      stage = true;
    } catch {
      try {
        execSync(`git -C "${repo.path}" fetch origin ${repo.targetBranch}`, { stdio: "pipe" });
        execSync(`git -C "${repo.path}" rev-parse --verify origin/${repo.targetBranch}`, { stdio: "pipe" });
        stage = true;
      } catch {
        stage = false;
      }
    }
  }
  console.log(`[${exists && stage ? "OK" : "FAIL"}] ${repo.name.padEnd(9)} ${repo.path}${exists ? "" : " — нет .git"}${exists && !stage ? ` — нет origin/${repo.targetBranch}` : ""}`);
}

console.log("");
console.log(`[${glabOk ? "OK" : "FAIL"}] glab auth`);
console.log(`[${ytReachable ? "OK" : "FAIL"}] youtrack.realt.by доступен`);
console.log(`[${ytToken ? "OK" : "WARN"}] YOUTRACK_TOKEN ${ytToken ? "задан" : "не задан — get-story будет работать только в ручном режиме"}`);
