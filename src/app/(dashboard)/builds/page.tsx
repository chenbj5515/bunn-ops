"use client";

import { useEffect, useState } from "react";

import { FailureDetailsDialog } from "@/components/ops/failure-details-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BuildRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  run_number: number;
  event: string;
  head_branch: string;
  created_at: string;
  updated_at: string;
  actor: { login: string } | null;
  head_commit: { id: string; message: string } | null;
}

export default function BuildsPage() {
  const [runs, setRuns] = useState<BuildRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRuns() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/ops/builds?perPage=30");
        if (!response.ok) {
          throw new Error("获取构建历史失败");
        }
        const data = (await response.json()) as { runs: BuildRun[] };
        setRuns(data.runs);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "获取构建历史失败");
      } finally {
        setLoading(false);
      }
    }

    fetchRuns();
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="p-4 border-b">
        <h1 className="font-semibold text-xl">Build History</h1>
        <p className="mt-1 text-muted-foreground text-xs">
          数据来源：GitHub Actions workflow runs
        </p>
      </div>

      {error && <div className="bg-destructive/10 p-3 border-b text-destructive">{error}</div>}

      {loading ? (
        <div className="p-4 text-muted-foreground text-sm">加载中...</div>
      ) : (
        <div className="flex-1 p-4 min-h-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run</TableHead>
                <TableHead>Workflow</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Commit</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>
                    <a
                      href={run.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      #{run.run_number}
                    </a>
                  </TableCell>
                  <TableCell>{run.name}</TableCell>
                  <TableCell>
                    <FailureDetailsDialog
                      runId={run.id}
                      statusText={run.conclusion ?? run.status}
                    />
                  </TableCell>
                  <TableCell>{run.head_branch}</TableCell>
                  <TableCell>{run.actor?.login ?? "-"}</TableCell>
                  <TableCell className="max-w-[260px] truncate">
                    {run.head_commit?.id.slice(0, 7)} {run.head_commit?.message ?? ""}
                  </TableCell>
                  <TableCell>{new Date(run.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
