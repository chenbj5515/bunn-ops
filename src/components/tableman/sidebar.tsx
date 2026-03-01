"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, FileText, ListTree, Table2 } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface SidebarProps {
  tables: string[];
  selectedTable: string | null;
  isLoading?: boolean;
}

const CORE_NAV = [
  { href: "/", label: "Overview", icon: ListTree },
  { href: "/deployments", label: "Deployments", icon: FileText },
  { href: "/logs", label: "Logs", icon: FileText },
] as const;

export function Sidebar({ tables, selectedTable, isLoading }: SidebarProps) {
  const pathname = usePathname();
  const basePath = "/tables";

  return (
    <div className="flex h-full min-h-0 w-72 flex-col overflow-hidden border-r bg-muted/30">
      <div className="border-b p-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground transition-colors hover:text-foreground/80"
        >
          <Database className="size-5" />
          <h2 className="font-semibold">Bunn Ops</h2>
        </Link>
      </div>

      <div className="border-b p-2">
        {CORE_NAV.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mb-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="border-b p-3 text-xs text-muted-foreground">
        Tableman (CRUD)
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              加载中...
            </div>
          ) : tables.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              没有找到表
            </div>
          ) : (
            <div className="space-y-1">
              {tables.map((table) => {
                const href = `${basePath}/${encodeURIComponent(table)}`;
                const isActive = selectedTable === table || pathname === href;
                return (
                  <Link
                    key={table}
                    href={href}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <Table2 className="size-4 shrink-0" />
                    <span className="truncate">{table}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="border-t p-3 text-xs text-muted-foreground">
        共 {tables.length} 个表
      </div>
    </div>
  );
}
