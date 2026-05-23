import { writeFile } from "node:fs/promises";
import { auditRepo } from "./repoAudit.js";
import { readSessionState, writeSessionState } from "./sessionState.js";
import { buildHandoffMarkdown } from "./templates.js";

export async function writeHandoff(reason: string): Promise<void> {
  const state = await readSessionState();
  const audit = await auditRepo();

  state.changedFiles = audit.changedFiles;
  state.lastHandoffAt = new Date().toISOString();

  const markdown = buildHandoffMarkdown({ state, audit, reason });
  await writeFile("HANDOFF.md", markdown, "utf8");
  await writeSessionState(state);
}
