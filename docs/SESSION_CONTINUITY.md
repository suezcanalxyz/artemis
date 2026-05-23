# ARTEMIS Session Continuity

## Goal

This protocol allows Codex sessions to continue cleanly without re-explaining the project every time.

It does not bypass usage limits.

## Start of session

Run:

```bash
npm run session:start -- --milestone M12 --subtask "Deployment hardening"
```

Then give Codex the current `NEXT_CODEX_PROMPT.md`.

## During session

Codex should:

1. Read `AGENTS.md`
2. Read `ARTEMIS_CODEX_DEPLOYMENT_PIPELINE.md`
3. Read `docs/ROADMAP.md`
4. Read `HANDOFF.md` if present
5. Audit relevant files only
6. Implement the requested vertical patch
7. Run relevant checks

## End of session

Run or ask Codex to run:

```bash
npm run session:handoff -- --reason "context-low"
npm run session:next-prompt
```

This writes:

- `HANDOFF.md`
- `NEXT_CODEX_PROMPT.md`

## Usage limits

Allowed:

- save handoff
- generate next prompt
- track changed files
- manually record when to resume

Not allowed:

- automated login
- scraping Codex UI
- detecting hidden token balances
- automatic restart to evade limits
- bypassing OpenAI usage limits

## Manual resume

When usage is available again:

1. Open `NEXT_CODEX_PROMPT.md`
2. Paste it into Codex
3. Allow permissions as needed
4. Continue from the handoff
