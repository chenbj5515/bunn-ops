import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);
const DEFAULT_CONTAINER = process.env.DOCKER_LOG_CONTAINER || "bunn-app";

function isSafeContainerName(value: string) {
  return /^[a-zA-Z0-9._-]+$/.test(value);
}

export async function GET(request: NextRequest) {
  try {
    if (process.env.SSH_DOCKER_LOGS_ENABLED !== "true") {
      return NextResponse.json(
        {
          error:
            "SSH_DOCKER_LOGS_ENABLED is false. Enable it to fetch docker logs.",
        },
        { status: 400 }
      );
    }

    const host = process.env.VPS_HOST;
    const user = process.env.VPS_USER;
    const port = process.env.VPS_PORT || "22";
    const keyPath = process.env.VPS_SSH_KEY_PATH?.trim();
    if (!host || !user) {
      return NextResponse.json(
        { error: "VPS_HOST and VPS_USER are required" },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const container =
      searchParams.get("container")?.trim() || DEFAULT_CONTAINER;
    const linesParam = Number.parseInt(searchParams.get("lines") || "200", 10);
    const lines = Number.isNaN(linesParam)
      ? 200
      : Math.min(Math.max(linesParam, 20), 2000);

    if (!isSafeContainerName(container)) {
      return NextResponse.json(
        { error: "Invalid container name" },
        { status: 400 }
      );
    }

    const sshArgs = ["-p", port, "-o", "BatchMode=yes"];
    if (keyPath) {
      sshArgs.push("-i", keyPath);
    }

    const remoteCommand = `docker logs --tail ${lines} ${container} 2>&1`;
    sshArgs.push(`${user}@${host}`, remoteCommand);

    const { stdout, stderr } = await execFileAsync("ssh", sshArgs, {
      timeout: 20_000,
      maxBuffer: 5 * 1024 * 1024,
    });

    const merged = [stdout, stderr].filter(Boolean).join("\n");
    const logLines = merged
      .split("\n")
      .map((line) => line.trimEnd())
      .filter((line) => line.length > 0);

    return NextResponse.json({
      source: "docker_logs",
      container,
      linesRequested: lines,
      lineCount: logLines.length,
      rows: logLines,
    });
  } catch (error) {
    console.error("Error fetching docker logs over SSH:", error);
    return NextResponse.json(
      { error: "Failed to fetch docker logs over SSH" },
      { status: 500 }
    );
  }
}
