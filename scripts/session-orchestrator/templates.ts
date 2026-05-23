import type { RepoAudit } from "./repoAudit.js";
import type { SessionState } from "./sessionState.js";

export function buildHandoffMarkdown(args: {
  state: SessionState;
  audit: RepoAudit;
  reason: string;
}): string {
  const { state, audit, reason } = args;

  return `# ARTEMIS Handoff

## Reason

${reason}

## Current milestone

${state.currentMilestone}

## Current subtask

${state.currentSubtask}

## Branch

${audit.branch}

## Changed files

${
  audit.changedFiles.length
    ? audit.changedFiles.map((file) => `- ${file}`).join("\n")
    : "No changed files detected."
}

## Commands run

${
  state.commandsRun.length
    ? state.commandsRun.map((command) => `- \`${command}\``).join("\n")
    : "No commands recorded."
}

## Known issues

${
  state.knownIssues.length
    ? state.knownIssues.map((issue) => `- ${issue}`).join("\n")
    : "No known issues recorded."
}

## Passing checks

Not recorded automatically. Add manually if needed.

## Failing checks

Not recorded automatically. Add manually if needed.

## Usage note

${state.manualUsageNote}

## Next task

Continue from \`NEXT_CODEX_PROMPT.md\`.

## Safety note

This handoff does not bypass Codex/OpenAI usage limits. Resume manually when usage is available.
`;
}

export function buildNextPrompt(args: {
  state: SessionState;
  audit: RepoAudit;
}): string {
  const { state, audit } = args;

  return `You are continuing development of ARTEMIS.

First read:
- AGENTS.md
- ARTEMIS_CODEX_DEPLOYMENT_PIPELINE.md
- docs/ROADMAP.md
- HANDOFF.md if present
- NEXT_CODEX_PROMPT.md if present

Do not re-explain the whole product. Use those files as project memory.

Current milestone:
${state.currentMilestone}

Current subtask:
${state.currentSubtask}

Recent changed files:
${
  audit.changedFiles.length
    ? audit.changedFiles.map((file) => `- ${file}`).join("\n")
    : "No changed files detected."
}

Operating rules:
- Keep planning short.
- Audit only files relevant to this milestone.
- Implement immediately after the plan.
- Work in vertical slices.
- Do not create fake real-world data.
- Do not scrape uncontrolled sources.
- Do not commit .env, node_modules, uploads, logs or test results.
- No file should exceed 220 lines.
- Every new feature must include validation, tests and docs where relevant.
- If context/credits are running low, stop implementation and write HANDOFF.md and NEXT_CODEX_PROMPT.md.

Start by auditing the relevant files, then continue the current subtask.
`;
}
