#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

CLAUDE_SKILLS="${HOME}/.claude/skills"
CLAUDE_AGENTS="${HOME}/.claude/agents"
OPENCODE_AGENT="${HOME}/.config/opencode/agent"
CURSOR_RULES="${HOME}/.cursor/rules"

AGENTS="bff-pipeline-bff bff-pipeline-client"
STAGE_SKILLS=(
  bff-schema-create-v2
  bff-datasource-create-v2
  bff-resolver-create-v2
  bff-e2e-verify-v2
  client-types-sync-v2
  client-apollo-create-v2
)

info() { printf '\033[1;34m==>\033[0m %s\n' "$1"; }
ok()   { printf '\033[1;32m  ✓\033[0m %s\n' "$1"; }

usage() {
  cat <<EOF
Установщик агентов и скилов из ai-agents-and-skills

Usage: ./install.sh [--claude] [--opencode] [--cursor] [--skills-only] [-h]

  --claude      Claude Code: агенты + скилы (~/.claude)
  --opencode    OpenCode: агенты (~/.config/opencode/agent)
  --cursor      Cursor: правила (~/.cursor/rules)
  --skills-only только скилы + runner (без агентов)
  -h, --help    эта справка

Без флагов ставит всё (Claude + OpenCode + Cursor).
EOF
}

install_claude_agents() {
  info "Claude Code: агенты → ${CLAUDE_AGENTS}"
  mkdir -p "${CLAUDE_AGENTS}"
  for a in ${AGENTS}; do
    cp "${REPO_DIR}/agents/${a}/claude-agent.md" "${CLAUDE_AGENTS}/${a}.md"
    ok "${a}"
  done
}

install_claude_skills() {
  info "Claude Code: скилы → ${CLAUDE_SKILLS}"
  mkdir -p "${CLAUDE_SKILLS}"
  rsync -a --delete --exclude .DS_Store "${REPO_DIR}/skills/bff-pipeline-v2/" "${CLAUDE_SKILLS}/bff-pipeline-v2/"
  ok "bff-pipeline-v2 (runner + tests)"
  for s in ${STAGE_SKILLS[@]}; do
    mkdir -p "${CLAUDE_SKILLS}/${s}"
    cp "${REPO_DIR}/skills/${s}/SKILL.md" "${CLAUDE_SKILLS}/${s}/SKILL.md"
    ok "${s}"
  done
}

install_opencode() {
  info "OpenCode: агенты → ${OPENCODE_AGENT}"
  mkdir -p "${OPENCODE_AGENT}"
  for a in ${AGENTS}; do
    cp "${REPO_DIR}/agents/${a}/opencode-agent.md" "${OPENCODE_AGENT}/${a}.md"
    ok "${a}"
  done
}

install_cursor() {
  info "Cursor: правила → ${CURSOR_RULES}"
  mkdir -p "${CURSOR_RULES}"
  for a in ${AGENTS}; do
    cp "${REPO_DIR}/agents/${a}/cursor-${a}.mdc" "${CURSOR_RULES}/${a}.mdc"
    ok "${a}"
  done
}

verify_runner() {
  local runner="${CLAUDE_SKILLS}/bff-pipeline-v2/scripts/bff-pipeline.mjs"
  info "Проверка runner"
  node "${runner}" test >/dev/null && ok "tests PASS" || { echo "runner tests FAIL" >&2; exit 1; }
  ok "runner: ${runner}"
}

DO_CLAUDE=1 DO_OPENCODE=1 DO_CURSOR=1 SKILLS_ONLY=0
for arg in "$@"; do
  case "${arg}" in
    --claude)     DO_CLAUDE=1; DO_OPENCODE=0; DO_CURSOR=0 ;;
    --opencode)   DO_CLAUDE=0; DO_OPENCODE=1; DO_CURSOR=0 ;;
    --cursor)     DO_CLAUDE=0; DO_OPENCODE=0; DO_CURSOR=1 ;;
    --skills-only) SKILLS_ONLY=1 ;;
    -h|--help)    usage; exit 0 ;;
    *)            usage; exit 1 ;;
  esac
done

if [[ ! -d "${REPO_DIR}/skills/bff-pipeline-v2" ]]; then
  echo "Запускай из корня репозитория ai-agents-and-skills" >&2
  exit 1
fi

if [[ "${DO_CLAUDE}" == 1 || "${SKILLS_ONLY}" == 1 ]]; then
  install_claude_skills
fi

if [[ "${DO_CLAUDE}" == 1 && "${SKILLS_ONLY}" == 0 ]]; then
  install_claude_agents
fi

if [[ "${DO_OPENCODE}" == 1 && "${SKILLS_ONLY}" == 0 ]]; then
  install_opencode
fi

if [[ "${DO_CURSOR}" == 1 && "${SKILLS_ONLY}" == 0 ]]; then
  install_cursor
fi

verify_runner

printf '\nГотово. Вызов: Claude — агент bff-pipeline-bff/client; OpenCode — @bff-pipeline-bff; Cursor — правило по триггеру.\n'
