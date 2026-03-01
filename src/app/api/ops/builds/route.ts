import { NextRequest, NextResponse } from "next/server";

import { listWorkflowRuns } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    if (!owner || !repo) {
      return NextResponse.json(
        { error: "GITHUB_OWNER and GITHUB_REPO are required" },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Number.parseInt(searchParams.get("page") || "1", 10);
    const perPage = Number.parseInt(searchParams.get("perPage") || "20", 10);
    const status = searchParams.get("status") || undefined;
    const branch = searchParams.get("branch") || undefined;

    const data = await listWorkflowRuns({
      owner,
      repo,
      page: Number.isNaN(page) ? 1 : page,
      perPage: Number.isNaN(perPage) ? 20 : Math.min(perPage, 100),
      status,
      branch,
    });

    return NextResponse.json({
      total: data.total_count,
      runs: data.workflow_runs,
    });
  } catch (error) {
    console.error("Error fetching build runs:", error);
    return NextResponse.json(
      { error: "Failed to fetch build runs" },
      { status: 500 }
    );
  }
}
