import { auditRepo } from "./repoAudit.js";
import { startSession, readSessionState } from "./sessionState.js";
import { writeHandoff } from "./handoffWriter.js";
import { writeNextPrompt } from "./nextPromptWriter.js";

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function main(): Promise<void> {
  const command = process.argv[2];

  if (command === "start") {
    const milestone = getArg("milestone");
    const subtask = getArg("subtask");
    const state = await startSession({ milestone, subtask });
    console.log(
      `Started ARTEMIS session: ${state.currentMilestone} / ${state.currentSubtask}`
    );
    return;
  }

  if (command === "audit") {
    const audit = await auditRepo();
    console.log(`Branch: ${audit.branch}`);
    console.log(audit.statusText);
    return;
  }

  if (command === "handoff") {
    const reason = getArg("reason") ?? "manual handoff";
    await writeHandoff(reason);
    console.log("Wrote HANDOFF.md");
    return;
  }

  if (command === "next-prompt") {
    await writeNextPrompt();
    const state = await readSessionState();
    console.log(`Wrote ${state.nextPromptPath}`);
    return;
  }

  console.log(`Unknown command: ${command ?? "(none)"}`);
  console.log("Use: start | audit | handoff | next-prompt");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
