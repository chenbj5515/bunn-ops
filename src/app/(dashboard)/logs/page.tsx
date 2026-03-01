import { Button } from "@/components/ui/button";
import { fetchAppLogs } from "@/lib/ops/app-logs";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  let containerName = "-";
  let rawLogs = "";
  let error: string | null = null;

  try {
    const result = await fetchAppLogs({ tail: 500 });
    containerName = result.container;
    rawLogs = result.raw;
  } catch (fetchError) {
    error = fetchError instanceof Error ? fetchError.message : "获取日志失败";
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex justify-between items-center p-4 border-b">
        <div>
          <h1 className="font-semibold text-xl">App Logs</h1>
          <p className="mt-1 text-muted-foreground text-xs">
            数据来源: Docker 容器 `{containerName}`
          </p>
        </div>
        <form method="get">
          <Button type="submit" variant="outline">
            刷新
          </Button>
        </form>
      </div>

      {error && <div className="bg-destructive/10 p-3 border-b text-destructive">{error}</div>}

      <div className="flex-1 p-4 min-h-0 overflow-auto">
        {!rawLogs.trim() ? (
          <div className="p-3 border rounded-md text-muted-foreground text-sm">
            暂无日志记录
          </div>
        ) : (
          <pre className="bg-muted/20 p-4 border rounded-md font-mono text-xs leading-5 whitespace-pre-wrap break-all">
            {rawLogs}
          </pre>
        )}
      </div>
    </div>
  );
}
