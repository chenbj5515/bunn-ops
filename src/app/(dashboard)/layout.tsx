"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { Sidebar } from "@/components/tableman/sidebar";
import {
  getTableAccessCounts,
  getTableAccessEventName,
  sortTablesByAccessFrequency,
  type TableAccessCounts,
} from "@/lib/table-access-counts";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tables, setTables] = useState<string[]>([]);
  const [tableAccessCounts, setTableAccessCounts] = useState<TableAccessCounts>({});
  const [isLoadingTables, setIsLoadingTables] = useState(true);
  const pathname = usePathname();

  const selectedTable =
    pathname?.startsWith("/tables/") && pathname !== "/tables"
      ? decodeURIComponent(pathname.replace(/^\/tables\//, "").split("/")[0] ?? "")
      : null;

  useEffect(() => {
    setTableAccessCounts(getTableAccessCounts());
    const eventName = getTableAccessEventName();
    const handleAccessUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<TableAccessCounts>;
      if (customEvent.detail && typeof customEvent.detail === "object") {
        setTableAccessCounts(customEvent.detail);
        return;
      }
      setTableAccessCounts(getTableAccessCounts());
    };
    window.addEventListener(eventName, handleAccessUpdated as EventListener);
    return () => {
      window.removeEventListener(eventName, handleAccessUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    async function fetchTables() {
      try {
        setIsLoadingTables(true);
        const response = await fetch("/api/tables");
        if (!response.ok) {
          throw new Error("获取表列表失败");
        }
        const data = (await response.json()) as { tables: string[] };
        setTables(data.tables);
      } catch {
        setTables([]);
      } finally {
        setIsLoadingTables(false);
      }
    }

    fetchTables();
  }, []);

  const sortedTables = sortTablesByAccessFrequency(tables, tableAccessCounts);

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar
        tables={sortedTables}
        selectedTable={selectedTable}
        isLoading={isLoadingTables}
      />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
