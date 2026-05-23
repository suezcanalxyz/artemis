import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

export type SessionState = {
  currentMilestone: string;
  currentSubtask: string;
  startedAt: string;
  lastHandoffAt: string | null;
  commandsRun: string[];
  changedFiles: string[];
  knownIssues: string[];
  nextPromptPath: string;
  estimatedResumeAt: string | null;
  manualUsageNote: string;
};

const sessionDir = ".artemis-session";
const sessionPath = path.join(sessionDir, "session.json");

export function defaultSessionState(): SessionState {
  return {
    currentMilestone: "unknown",
    currentSubtask: "unknown",
    startedAt: new Date().toISOString(),
    lastHandoffAt: null,
    commandsRun: [],
    changedFiles: [],
    knownIssues: [],
    nextPromptPath: "NEXT_CODEX_PROMPT.md",
    estimatedResumeAt: null,
    manualUsageNote: "Resume manually when Codex usage is available again."
  };
}

export async function readSessionState(): Promise<SessionState> {
  if (!existsSync(sessionPath)) {
    return defaultSessionState();
  }

  const raw = await readFile(sessionPath, "utf8");
  return JSON.parse(raw) as SessionState;
}

export async function writeSessionState(state: SessionState): Promise<void> {
  await mkdir(sessionDir, { recursive: true });
  await writeFile(sessionPath, JSON.stringify(state, null, 2), "utf8");
}

export async function startSession(args: {
  milestone?: string;
  subtask?: string;
}): Promise<SessionState> {
  const state = defaultSessionState();
  state.currentMilestone = args.milestone ?? "unspecified";
  state.currentSubtask = args.subtask ?? "unspecified";
  await writeSessionState(state);
  return state;
}
