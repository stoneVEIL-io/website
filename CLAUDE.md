# stoneVEIL Operations — website

See **[AGENTS.md](./AGENTS.md)** for how the codebase works — architecture,
conventions, and commands. Read that first.

Project management lives **outside the repo** (kept separate from code guidance):

- **Google Drive** — "stoneVEIL — Project Status" (living status doc: changelog + next steps)
- **Linear** — the stoneVEIL website project (next steps tracked as issues)

## Deploy & verification

- **Host:** Google Cloud Run, service `stoneveil-web`, project `savvy-reach-496302-r2`,
  region `us-west1`. Live at stoneveil.io, fronted by Google Front End (no Cloudflare).
- **No CI/CD.** Merging to `main` does not deploy. Deploy is manual, from the repo root:
  ```
  gcloud run deploy stoneveil-web --source . --project savvy-reach-496302-r2 --region us-west1
  ```
- **Tests are the gate** (no CI): run the relevant `tests/*.mjs` before merging
  (e.g. `node tests/trust-proxy.test.mjs`).
- **Commits:** conventional style, e.g. `fix(server): ... (STO-59)`. Reference the Linear
  ID in the branch and PR ("Fixes STO-XX").
- **Prod-affecting security fixes are not Done at "deployed."** Verify the behavior live
  (e.g. trust-proxy/`req.ip` changes: confirm varied real client IPs in Cloud Run logs).

## Guardrails

- **Never load-test `/api/lead`.** An in-memory circuit breaker (20 paid API calls/min,
  STO-77) exists but is not persistent across restarts — don't rely on it as a safety net.
  Hammering the endpoint costs money and creates junk leads. Verify rate-limiting by
  logging `req.ip`, not by tripping that endpoint.
- **No secrets in the repo.** `.mcp.json` and configs reference `${ENV}` vars only.

## Cowork ↔ Claude Code coordination

Two agents, coordinating through shared surfaces (this repo, Linear, GitHub) — they do
not talk directly. See **[docs/cowork-claude-code-playbook.md](./docs/cowork-claude-code-playbook.md)**
for the full protocol. Short version:

- **Claude Code (you, local)** = execution: edit, test, push, open/merge PR, deploy.
  You have the real git/`gh`/`gcloud` credentials the cloud agents lack.
- **Cowork (cloud)** = planning, monitoring, and Linear ticket hygiene.
- Persist anything the other agent needs into a shared surface (commit / PR / Linear
  comment), never only in chat. Don't edit the working tree while Cowork is mid-edit.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **website** (463 symbols, 588 relationships, 12 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/website/context` | Codebase overview, check index freshness |
| `gitnexus://repo/website/clusters` | All functional areas |
| `gitnexus://repo/website/processes` | All execution flows |
| `gitnexus://repo/website/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
