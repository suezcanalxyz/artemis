# ARTEMIS Session Orchestrator

Safe local helper for Codex session continuity.

It does not bypass limits, automate login or restart Codex.

## Commands

```bash
npm run session:start -- --milestone M12 --subtask "Deployment hardening"
npm run session:audit
npm run session:handoff -- --reason "context-low"
npm run session:next-prompt
```

## Output

- `.artemis-session/session.json`
- `HANDOFF.md`
- `NEXT_CODEX_PROMPT.md`
