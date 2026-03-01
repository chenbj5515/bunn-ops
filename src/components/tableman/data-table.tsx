"use client";

import { useState } from "react";
import { AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { TableColumn } from "./types";

interface DataTableProps {
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
  isLoading?: boolean;
  onDelete: (ids: (string | number)[]) => Promise<void>;
  onPageChange: (page: number) => void;
}

export function DataTable({
  columns,
  rows,
  total,
  page,
  pageSize,
  isLoading,
  onDelete,
  onPageChange,
}: DataTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const pkColumn = columns.find((column) => column.isPrimaryKey);
  const hasPrimaryKey = Boolean(pkColumn);

  function getRowId(row: Record<string, unknown>): string | number | null {
    if (!pkColumn) return null;
    const value = row[pkColumn.name];
    if (typeof value === "string" || typeof value === "number") {
      return value;
    }
    return null;
  }

  function toggleRowSelection(id: string | number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === rows.length) {
      setSelectedIds(new Set());
      return;
    }
    const allIds = rows
      .map(getRowId)
      .filter((id): id is string | number => id !== null);
    setSelectedIds(new Set(allIds));
  }

  async function handleDelete() {
    if (selectedIds.size === 0) return;
    const confirmed = window.confirm(
      `确定要删除选中的 ${selectedIds.size} 行数据吗？此操作不可撤销。`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    } finally {
      setIsDeleting(false);
    }
  }

  async function copyToClipboard(text: string, label?: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label ? `已复制: ${label}` : "已复制");
    } catch {
      toast.error("复制失败");
    }
  }

  function formatCellValue(value: unknown): string {
    if (value === null || value === undefined) {
      return "NULL";
    }
    if (typeof value === "object") {
      if (value instanceof Date) {
        return value.toLocaleString();
      }
      return JSON.stringify(value);
    }
    return String(value);
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        加载中...
      </div>
    );
  }

  if (columns.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 size-12 opacity-50" />
          <p>请选择一个表</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(total / pageSize);
  const startRow = (page - 1) * pageSize + 1;
  const endRow = Math.min(page * pageSize, total);

  function getPageNumbers() {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    if (page > 3) pages.push("ellipsis");
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);
    return pages;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b p-3">
        <div className="text-sm text-muted-foreground">
          共 {total} 行
          {total > 0 && `，显示第 ${startRow}-${endRow} 行`}
          {selectedIds.size > 0 && (
            <span className="ml-2 text-foreground">已选择 {selectedIds.size} 行</span>
          )}
        </div>
        {hasPrimaryKey && selectedIds.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="size-4" />
            {isDeleting ? "删除中..." : `删除 (${selectedIds.size})`}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {hasPrimaryKey && (
                <TableHead className="sticky top-0 z-10 w-10 min-w-10 max-w-10 bg-background">
                  <Checkbox
                    checked={rows.length > 0 && selectedIds.size === rows.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="全选"
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.name}
                  className="sticky top-0 z-10 bg-background text-foreground"
                >
                  <div className="flex items-center gap-1 truncate">
                    <span
                      className="cursor-pointer truncate transition-colors hover:text-primary"
                      onClick={() => copyToClipboard(column.name, column.name)}
                      title="点击复制列名"
                    >
                      {column.name}
                    </span>
                    {column.isPrimaryKey && (
                      <span className="shrink-0 text-xs text-primary">(PK)</span>
                    )}
                  </div>
                  <div className="truncate text-xs font-normal text-muted-foreground">
                    {column.type}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (hasPrimaryKey ? 1 : 0)}
                  className="min-w-0 max-w-none py-8 text-center text-muted-foreground"
                >
                  没有数据
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => {
                const rowId = getRowId(row);
                const isSelected = rowId !== null && selectedIds.has(rowId);
                return (
                  <TableRow
                    key={rowId !== null ? `${rowId}-${index}` : index}
                    data-state={isSelected ? "selected" : undefined}
                  >
                    {hasPrimaryKey && (
                      <TableCell className="w-10 min-w-10 max-w-10">
                        {rowId !== null && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleRowSelection(rowId)}
                            aria-label={`选择行 ${rowId}`}
                          />
                        )}
                      </TableCell>
                    )}
                    {columns.map((column) => {
                      const formatted = formatCellValue(row[column.name]);
                      return (
                        <TableCell
                          key={column.name}
                          title={formatted}
                          className="cursor-pointer transition-colors hover:bg-muted/50"
                          onClick={() => copyToClipboard(formatted)}
                        >
                          <span
                            className={
                              row[column.name] === null
                                ? "italic text-muted-foreground"
                                : ""
                            }
                          >
                            {formatted}
                          </span>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end border-t p-3">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={(event) => {
                    event.preventDefault();
                    if (page <= 1) return;
                    onPageChange(page - 1);
                  }}
                  aria-disabled={page <= 1}
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {getPageNumbers().map((pageNum, index) =>
                pageNum === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={pageNum === page}
                      onClick={() => onPageChange(pageNum)}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={(event) => {
                    event.preventDefault();
                    if (page >= totalPages) return;
                    onPageChange(page + 1);
                  }}
                  aria-disabled={page >= totalPages}
                  className={
                    page >= totalPages ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
