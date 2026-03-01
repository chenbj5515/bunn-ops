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

interface Deployment {
  id: number;
  workflow: string;
  status: string;
  conclusion: string | null;
  branch: string;
  actor: string;
  runNumber: number;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDeployments() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/ops/deployments");
        if (!response.ok) {
          throw new Error("获取部署日志失败");
        }
        const data = (await response.json()) as { deployments: Deployment[] };
        setDeployments(data.deployments);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "获取部署日志失败");
      } finally {
        setLoading(false);
      }
    }

    fetchDeployments();
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b p-4">
        <h1 className="text-xl font-semibold">Deployments</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          当前来源：GitHub Actions 中 workflow 名称包含 deploy 的运行记录
        </p>
      </div>

      {error && <div className="border-b bg-destructive/10 p-3 text-destructive">{error}</div>}

      {loading ? (
        <div className="p-4 text-sm text-muted-foreground">加载中...</div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run</TableHead>
                <TableHead>Workflow</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deployments.map((deployment) => (
                <TableRow key={deployment.id}>
                  <TableCell>
                    <a
                      href={deployment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      #{deployment.runNumber}
                    </a>
                  </TableCell>
                  <TableCell>{deployment.workflow}</TableCell>
                  <TableCell>
                    <FailureDetailsDialog
                      runId={deployment.id}
                      statusText={deployment.conclusion ?? deployment.status}
                    />
                  </TableCell>
                  <TableCell>{deployment.branch}</TableCell>
                  <TableCell>{deployment.actor}</TableCell>
                  <TableCell>{new Date(deployment.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
