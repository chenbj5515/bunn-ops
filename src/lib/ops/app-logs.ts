import "server-only";

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const DEFAULT_CONTAINER = process.env.DOCKER_LOG_CONTAINER || "bunn-app";

export interface FetchAppLogsParams {
  tail?: number;
  container?: string;
}

export interface AppLogsResult {
  container: string;
  raw: string;
}

function isSafeContainerName(value: string) {
  return /^[a-zA-Z0-9._-]+$/.test(value);
}

export async function fetchAppLogs(params: FetchAppLogsParams = {}): Promise<AppLogsResult> {
  if (process.env.SSH_DOCKER_LOGS_ENABLED !== "true") {
    throw new Error("SSH_DOCKER_LOGS_ENABLED is false. Enable it to fetch app logs.");
  }

  const host = process.env.VPS_HOST;
  const user = process.env.VPS_USER;
  const port = process.env.VPS_PORT || "22";
  const keyPath = process.env.VPS_SSH_KEY_PATH?.trim();
  if (!host || !user) {
    throw new Error("VPS_HOST and VPS_USER are required");
  }

  const rawTail = params.tail ?? 200;
  const tail = Number.isFinite(rawTail) ? Math.min(Math.max(rawTail, 1), 1000) : 200;
  const container = params.container?.trim() || DEFAULT_CONTAINER;

  if (!isSafeContainerName(container)) {
    throw new Error("Invalid container name");
  }

  const sshArgs = ["-p", port, "-o", "BatchMode=yes"];
  if (keyPath) {
    sshArgs.push("-i", keyPath);
  }

  const remoteCommand = `docker logs --timestamps --tail ${tail} ${container} 2>&1`;
  sshArgs.push(`${user}@${host}`, remoteCommand);

  const { stdout, stderr } = await execFileAsync("ssh", sshArgs, {
    timeout: 20_000,
    maxBuffer: 5 * 1024 * 1024,
  });

  const raw = [stdout, stderr].filter(Boolean).join("\n");

  return {
    container,
    raw,
  };
}
