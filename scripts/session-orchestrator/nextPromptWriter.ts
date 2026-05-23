import { writeFile } from "node:fs/promises";
import { auditRepo } from "./repoAudit.js";
import { readSessionState } from "./sessionState.js";
import { buildNextPrompt } from "./templates.js";

export async function writeNextPrompt(): Promise<void> {
  const state = await readSessionState();
  const audit = await auditRepo();
  const prompt = buildNextPrompt({ state, audit });
  await writeFile(state.nextPromptPath, prompt, "utf8");
}
