# Session Orchestrator Usage

## Start

```bash
npm run session:start -- --milestone M12 --subtask "Deployment hardening"
```

## Audit

```bash
npm run session:audit
```

## Handoff

```bash
npm run session:handoff -- --reason "context-low"
```

## Next prompt

```bash
npm run session:next-prompt
```

## Output files

- `.artemis-session/session.json`
- `HANDOFF.md`
- `NEXT_CODEX_PROMPT.md`

## Important

The orchestrator does not know your real Codex usage balance.

Use `manualUsageNote` to record when to resume.
