"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DbSource = "ai_billing_logs" | "user_action_logs" | "user_usage_logs";
type Source = DbSource | "docker_logs";

interface DbLogsResponse {
  source: DbSource;
  redisStatus: "up" | "down";
  rows: Record<string, unknown>[];
}

interface DockerLogsResponse {
  source: "docker_logs";
  container: string;
  rows: string[];
}

const SOURCES: Source[] = [
  "ai_billing_logs",
  "user_action_logs",
  "user_usage_logs",
  "docker_logs",
];

export default function LogsPage() {
  const [source, setSource] = useState<Source>("ai_billing_logs");
  const [refreshTick, setRefreshTick] = useState(0);
  const [rows, setRows] = useState<Record<string, unknown>[] | string[]>([]);
  const [redisStatus, setRedisStatus] = useState<"up" | "down">("down");
  const [dockerContainer, setDockerContainer] = useState("bunn-app");
  const [dockerContainerInput, setDockerContainerInput] = useState("bunn-app");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        setError(null);

        if (source === "docker_logs") {
          const response = await fetch(
            `/api/ops/docker-logs?container=${encodeURIComponent(
              dockerContainer
            )}&lines=200`
          );
          if (!response.ok) {
            throw new Error("获取 docker 日志失败");
          }
          const data = (await response.json()) as DockerLogsResponse;
          setRows(data.rows);
          setRedisStatus("down");
          return;
        }

        const response = await fetch(`/api/ops/logs?source=${source}&limit=50`);
        if (!response.ok) {
          throw new Error("获取应用日志失败");
        }
        const data = (await response.json()) as DbLogsResponse;
        setRows(data.rows);
        setRedisStatus(data.redisStatus);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "获取日志失败");
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, [source, dockerContainer, refreshTick]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b p-4">
        <h1 className="text-xl font-semibold">App Logs</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {source === "docker_logs"
            ? "数据来源: VPS Docker logs (SSH)"
            : `Redis 状态: ${redisStatus === "up" ? "可用" : "不可用"}`}
        </p>
      </div>

      <div className="flex items-center gap-3 border-b p-4">
        <Select value={source} onValueChange={(value) => setSource(value as Source)}>
          <SelectTrigger className="w-[240px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOURCES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {source === "docker_logs" && (
          <input
            className="h-9 w-[240px] rounded-md border px-3 text-sm"
            value={dockerContainerInput}
            onChange={(event) => setDockerContainerInput(event.target.value)}
            placeholder="docker container name"
          />
        )}
        <Button
          variant="outline"
          onClick={() => {
            if (source === "docker_logs") {
              setDockerContainer(dockerContainerInput.trim() || "bunn-app");
            }
            setRefreshTick((prev) => prev + 1);
          }}
        >
          刷新
        </Button>
      </div>

      {error && <div className="border-b bg-destructive/10 p-3 text-destructive">{error}</div>}

      {loading ? (
        <div className="p-4 text-sm text-muted-foreground">加载中...</div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto p-4">
          <pre className="overflow-auto rounded-md border bg-muted/20 p-3 text-xs leading-5">
            {JSON.stringify(rows, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
