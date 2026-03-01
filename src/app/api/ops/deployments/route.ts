import { NextResponse } from "next/server";

import { listWorkflowRuns } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    if (!owner || !repo) {
      return NextResponse.json(
        { error: "GITHUB_OWNER and GITHUB_REPO are required" },
        { status: 400 }
      );
    }

    const data = await listWorkflowRuns({
      owner,
      repo,
      perPage: 50,
      page: 1,
    });

    const deployRuns = data.workflow_runs
      .filter((run) => run.name.toLowerCase().includes("deploy"))
      .slice(0, 20)
      .map((run) => ({
        id: run.id,
        workflow: run.name,
        status: run.status,
        conclusion: run.conclusion,
        branch: run.head_branch,
        actor: run.actor?.login ?? "unknown",
        runNumber: run.run_number,
        url: run.html_url,
        createdAt: run.created_at,
        updatedAt: run.updated_at,
      }));

    return NextResponse.json({ deployments: deployRuns });
  } catch (error) {
    console.error("Error fetching deployments:", error);
    return NextResponse.json(
      { error: "Failed to fetch deployments" },
      { status: 500 }
    );
  }
}
