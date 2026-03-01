"use client";

import { use, useEffect, useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/tableman/data-table";
import { FilterBar } from "@/components/tableman/filter-bar";
import { incrementTableAccessCount } from "@/lib/table-access-counts";
import type { TableDataResponse } from "@/components/tableman/types";

const PAGE_SIZE = 50;

export default function TablePage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name: tableName } = use(params);
  const [tableData, setTableData] = useState<TableDataResponse | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tableName) return;

    async function fetchTableData() {
      try {
        setIsLoadingData(true);
        setError(null);
        const searchParams = new URLSearchParams();
        searchParams.set("page", String(page));
        searchParams.set("pageSize", String(PAGE_SIZE));
        Object.entries(filters).forEach(([key, value]) => {
          if (value) searchParams.set(key, value);
        });

        const url = `/api/tables/${encodeURIComponent(tableName)}?${searchParams.toString()}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("获取表数据失败");
        }
        const data = (await response.json()) as TableDataResponse;
        setTableData(data);
        incrementTableAccessCount(tableName);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "获取表数据失败");
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchTableData();
  }, [tableName, filters, page, refreshKey]);

  async function handleDelete(ids: (string | number)[]) {
    if (!tableName) return;
    try {
      const response = await fetch(`/api/tables/${encodeURIComponent(tableName)}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, confirm: true }),
      });
      if (!response.ok) {
        throw new Error("删除失败");
      }
      const result = (await response.json()) as { deleted: number };
      toast.success(`成功删除 ${result.deleted} 行数据`);
      incrementTableAccessCount(tableName);

      setRefreshKey((prev) => prev + 1);
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "删除失败");
    }
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {error && (
        <div className="border-b bg-destructive/10 p-3 text-destructive">{error}</div>
      )}

      <div className="border-b bg-muted/20 p-4">
        <h1 className="text-xl font-semibold">{tableName}</h1>
      </div>

      {tableData && (
        <FilterBar
          columns={tableData.columns}
          filters={filters}
          onFilterChange={(nextFilters) => {
            setFilters(nextFilters);
            setPage(1);
          }}
        />
      )}

      <DataTable
        columns={tableData?.columns ?? []}
        rows={tableData?.rows ?? []}
        total={tableData?.total ?? 0}
        page={page}
        pageSize={PAGE_SIZE}
        isLoading={isLoadingData}
        onDelete={handleDelete}
        onPageChange={setPage}
      />
    </div>
  );
}
