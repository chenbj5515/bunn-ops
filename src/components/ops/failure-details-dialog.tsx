"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FailedStep {
  name: string;
  status: string;
  conclusion: string | null;
  number: number;
}

interface FailedJob {
  id: number;
  name: string;
  htmlUrl: string;
  startedAt: string | null;
  completedAt: string | null;
  failedSteps: FailedStep[];
}

interface FailureDetailsResponse {
  runId: number;
  failedJobCount: number;
  failedJobs: FailedJob[];
}

interface FailureDetailsDialogProps {
  runId: number;
  statusText: string;
}

export function FailureDetailsDialog({
  runId,
  statusText,
}: FailureDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<FailureDetailsResponse | null>(null);

  const clickable = statusText === "failure";

  async function loadDetails() {
    if (!clickable) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/ops/runs/${runId}/failure`);
      if (!response.ok) {
        throw new Error("获取失败详情失败");
      }
      const data = (await response.json()) as FailureDetailsResponse;
      setDetails(data);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "获取失败详情失败");
    } finally {
      setLoading(false);
    }
  }

  if (!clickable) {
    return <span>{statusText}</span>;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen && !details && !loading) {
          loadDetails();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {statusText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Run #{runId} 失败详情</DialogTitle>
          <DialogDescription>
            展示 GitHub Actions 里 conclusion 为 failure 的 jobs 与 steps。
          </DialogDescription>
        </DialogHeader>

        {loading && <div className="text-sm text-muted-foreground">加载中...</div>}
        {error && <div className="text-sm text-destructive">{error}</div>}

        {!loading && !error && details && details.failedJobCount === 0 && (
          <div className="text-sm text-muted-foreground">未识别到失败 job。</div>
        )}

        {!loading && !error && details && details.failedJobs.length > 0 && (
          <div className="space-y-3">
            {details.failedJobs.map((job) => (
              <div key={job.id} className="rounded-md border p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{job.name}</p>
                  <a
                    href={job.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    打开 Job 日志
                  </a>
                </div>
                {job.failedSteps.length === 0 ? (
                  <p className="text-xs text-muted-foreground">未返回失败 step。</p>
                ) : (
                  <ul className="space-y-1">
                    {job.failedSteps.map((step) => (
                      <li key={`${job.id}-${step.number}`} className="text-xs">
                        Step {step.number}: {step.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
