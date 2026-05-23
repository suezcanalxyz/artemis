import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function runGit(args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", args, {
      timeout: 10_000
    });
    return stdout.trim();
  } catch {
    return "";
  }
}

export type RepoAudit = {
  branch: string;
  changedFiles: string[];
  statusText: string;
};

export async function auditRepo(): Promise<RepoAudit> {
  const branch = await runGit(["branch", "--show-current"]);
  const statusText = await runGit(["status", "--short"]);
  const changedFiles = statusText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^.. /, ""));

  return {
    branch: branch || "unknown",
    changedFiles,
    statusText: statusText || "No git changes detected."
  };
}
