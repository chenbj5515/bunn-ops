const GITHUB_API_BASE = "https://api.github.com";

interface WorkflowRunActor {
  login: string;
}

interface WorkflowRunHeadCommit {
  id: string;
  message: string;
}

export interface WorkflowRun {
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
  actor: WorkflowRunActor | null;
  head_commit: WorkflowRunHeadCommit | null;
}

interface WorkflowRunsResponse {
  total_count: number;
  workflow_runs: WorkflowRun[];
}

export interface WorkflowStep {
  name: string;
  status: string;
  conclusion: string | null;
  number: number;
}

export interface WorkflowJob {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  started_at: string | null;
  completed_at: string | null;
  steps: WorkflowStep[];
}

interface WorkflowJobsResponse {
  total_count: number;
  jobs: WorkflowJob[];
}

function getAuthHeaders() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN environment variable is not set");
  }

  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export async function listWorkflowRuns(params: {
  owner: string;
  repo: string;
  perPage?: number;
  page?: number;
  status?: string;
  branch?: string;
}) {
  const perPage = params.perPage ?? 20;
  const page = params.page ?? 1;

  const searchParams = new URLSearchParams({
    per_page: String(perPage),
    page: String(page),
  });

  if (params.status) {
    searchParams.set("status", params.status);
  }
  if (params.branch) {
    searchParams.set("branch", params.branch);
  }

  const url = `${GITHUB_API_BASE}/repos/${params.owner}/${params.repo}/actions/runs?${searchParams.toString()}`;
  const response = await fetch(url, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch workflow runs: ${response.status}`);
  }

  const data = (await response.json()) as WorkflowRunsResponse;
  return data;
}

export async function listWorkflowRunJobs(params: {
  owner: string;
  repo: string;
  runId: number;
}) {
  const url = `${GITHUB_API_BASE}/repos/${params.owner}/${params.repo}/actions/runs/${params.runId}/jobs?per_page=100`;
  const response = await fetch(url, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch workflow jobs: ${response.status}`);
  }

  const data = (await response.json()) as WorkflowJobsResponse;
  return data;
}
