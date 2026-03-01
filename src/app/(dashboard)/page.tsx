export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Ops Observatory</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        左侧可进入 tableman 全库 CRUD，以及部署日志和应用日志模块。
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium">Tableman CRUD</p>
          <p className="mt-1 text-xs text-muted-foreground">
            浏览 public schema 表、筛选、分页、主键批量删除。
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium">Deploy/App Logs</p>
          <p className="mt-1 text-xs text-muted-foreground">
            查看部署记录与应用日志表数据，附 Redis 可用性状态。
          </p>
        </div>
      </div>
    </div>
  );
}
