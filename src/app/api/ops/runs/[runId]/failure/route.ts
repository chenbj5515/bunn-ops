import { NextResponse } from "next/server";

import { listWorkflowRunJobs } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    if (!owner || !repo) {
      return NextResponse.json(
        { error: "GITHUB_OWNER and GITHUB_REPO are required" },
        { status: 400 }
      );
    }

    const { runId } = await params;
    const parsedRunId = Number.parseInt(runId, 10);
    if (Number.isNaN(parsedRunId)) {
      return NextResponse.json({ error: "Invalid runId" }, { status: 400 });
    }

    const jobsData = await listWorkflowRunJobs({
      owner,
      repo,
      runId: parsedRunId,
    });

    const failedJobs = jobsData.jobs
      .filter((job) => job.conclusion === "failure")
      .map((job) => ({
        id: job.id,
        name: job.name,
        htmlUrl: job.html_url,
        startedAt: job.started_at,
        completedAt: job.completed_at,
        failedSteps: (job.steps ?? []).filter((step) => step.conclusion === "failure"),
      }));

    return NextResponse.json({
      runId: parsedRunId,
      failedJobCount: failedJobs.length,
      failedJobs,
    });
  } catch (error) {
    console.error("Error fetching failure details:", error);
    return NextResponse.json(
      { error: "Failed to fetch failure details" },
      { status: 500 }
    );
  }
}
