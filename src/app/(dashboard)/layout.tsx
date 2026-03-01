"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { Sidebar } from "@/components/tableman/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tables, setTables] = useState<string[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(true);
  const pathname = usePathname();

  const selectedTable =
    pathname?.startsWith("/tables/") && pathname !== "/tables"
      ? decodeURIComponent(pathname.replace(/^\/tables\//, "").split("/")[0] ?? "")
      : null;

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

  return (
    <div className="flex h-screen">
      <Sidebar
        tables={tables}
        selectedTable={selectedTable}
        isLoading={isLoadingTables}
      />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
