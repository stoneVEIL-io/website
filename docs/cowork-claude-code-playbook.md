# Cowork ↔ Claude Code — Integration Playbook

_How stoneVEIL runs two Claude agents together: Claude Cowork (cloud) for planning,
monitoring, and coordination; Claude Code (local) for execution with real credentials._

## The mental model: two agents, three shared surfaces

Cowork and Claude Code do **not** talk to each other directly. Cowork cannot inject
prompts into your running Claude Code process, and Claude Code cannot see Cowork's
chat. They coordinate by reading and writing the same **shared surfaces**:

1. **The repo / working folder** (`stoneveil-web-setup`) — code, `CLAUDE.md`,
   `.mcp.json`, this playbook. The primary handoff channel.
2. **Linear** — the source of truth for what needs doing and what's done. Both agents
   read tickets; both post comments/status.
3. **GitHub** — branches, PRs, merge state. The record of what actually shipped.

Rule of thumb: **if it needs to persist or be seen by the other agent, it goes into a
shared surface** (a commit, a Linear comment, a PR), never just into a chat.

## Why the split exists (and why it fixes the push-403 problem)

| | Claude Cowork (this app) | Claude Code (local CLI) |
|---|---|---|
| Runs in | Anthropic cloud sandbox | Your machine |
| Credentials | Connectors (Linear, Drive, GitHub-web, Slack…) | **Your** git, `gh`, `gcloud`, SSH keys |
| Can `git push` to GitHub | ❌ blocked (sandbox proxy 403 / credential guardrail — see STO-58, STO-65) | ✅ yes, native git with real creds |
| Can `gcloud run deploy` | ❌ no GCP auth | ✅ yes, uses your `gcloud auth login` |
| Can run scheduled/background checks | ✅ scheduled tasks, cloud-resident | ⚠️ only while your terminal is open |
| Best at | Planning, research, monitoring, ticket hygiene, drafting | Editing, testing, pushing, deploying |

The scheduled red/blue/green agents inherit Cowork's limitation: they detect and draft
well but structurally **cannot land** changes. Claude Code is the missing executor.

## Division of labor

**Execution → Claude Code.** Apply the fix, run tests, commit with conventional
messages, push, open the PR, merge, `gcloud run deploy`. It has the credentials; it does
the doing.

**Monitoring → Cowork.** Because it lives in the cloud, Cowork can watch things on a
schedule without your terminal open: PR/merge state, Cloud Run health, Linear ticket
drift, deploy verification still-pending. It reports and nudges.

**Efficiencies → Cowork authors, both consume.** Cowork generates the shared config
(`CLAUDE.md` conventions, `.mcp.json`, subagent/plugin definitions, runbooks) that make
Claude Code fast and consistent. Checked into git → every teammate's Claude Code
inherits it.

## The handoff loop (per ticket)

1. **Detect / draft** — a red/blue/green run (or Cowork) files a Linear issue with the
   diagnosis and proposed fix.
2. **Plan** — Cowork triages, confirms scope, writes the exact steps into the ticket.
3. **Execute** — you hand Claude Code the ticket: it edits, tests, pushes, opens the PR,
   merges, deploys. All local, all with your creds.
4. **Verify** — the human-only / live checks (e.g. two-network `req.ip` confirmation).
5. **Close** — Cowork posts the passing evidence to Linear and flips status to Done.

Cowork owns steps 1–2 and 5; Claude Code owns step 3; step 4 is you.

## Efficiency conventions

- **`CLAUDE.md`** encodes standing workflow (deploy command, verification checklist,
  guardrails) so Claude Code follows them every session without being told.
- **`.mcp.json`** (project scope, committed) gives every teammate's Claude Code the same
  connectors. Tokens are `${ENV}` references — never commit secrets.
- **Permissions** — pre-approve routine actions in `.claude/settings.json`
  (`Bash(git push *)`, `Bash(gcloud run deploy *)`) so execution flows but destructive
  actions still prompt.
- **Subagents / plugin** — mirror the red (security), blue (hardening), green
  (SEO/relevance) roles as Claude Code subagents, bundled into a shared plugin.
- **No double-editing** — never have Cowork and Claude Code edit the same file at once.
  Whoever is executing owns the working tree; the other coordinates via Linear.

## Guardrails (non-negotiable)

- **Do not load-test `/api/lead`.** Per STO-77 it has no spend cap on paid Gemini +
  Google Places calls — hammering it risks cost and junk leads. Verify rate-limiting by
  logging `req.ip`, not by tripping the limiter on that endpoint.
- **Prod-affecting security fixes verify live before Done.** e.g. STO-59: confirm
  `req.ip` resolves varied real client IPs in Cloud Run logs, not just "deployed."
- **No secrets in the repo.** Config references env vars; credentials stay per-developer.
