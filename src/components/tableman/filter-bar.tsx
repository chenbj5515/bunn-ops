"use client";

import { useState } from "react";
import { Check, ChevronDown, Filter, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type { TableColumn } from "./types";

interface FilterCondition {
  id: string;
  column: string;
  operator: string;
  value: string;
}

interface FilterBarProps {
  columns: TableColumn[];
  filters: Record<string, string>;
  onFilterChange: (filters: Record<string, string>) => void;
}

const OPERATORS = [
  { value: "equals", label: "等于" },
  { value: "contains", label: "包含" },
  { value: "starts_with", label: "开头是" },
  { value: "ends_with", label: "结尾是" },
  { value: "is_null", label: "为 null" },
  { value: "is_not_null", label: "不为 null" },
];

const NO_VALUE_OPERATORS = ["is_null", "is_not_null"];

export function FilterBar({ columns, filters, onFilterChange }: FilterBarProps) {
  const [conditions, setConditions] = useState<FilterCondition[]>(() => {
    if (Object.keys(filters).length === 0) return [];
    return Object.entries(filters).map(([key, value], index) => {
      const parts = key.split("__");
      const column = parts[0];
      const operator = parts.length === 2 ? parts[1] : "equals";
      return {
        id: `filter-${index}-${Date.now()}`,
        column,
        operator,
        value,
      };
    });
  });
  const [showFilters, setShowFilters] = useState(Object.keys(filters).length > 0);
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({});

  const pkColumn = columns.find((col) => col.isPrimaryKey);

  function addCondition() {
    const defaultColumn = pkColumn?.name || columns[0]?.name || "";
    const newCondition: FilterCondition = {
      id: `filter-${Date.now()}`,
      column: defaultColumn,
      operator: "equals",
      value: "",
    };
    setConditions((prev) => [...prev, newCondition]);
  }

  function applyFilters(nextConditions: FilterCondition[] = conditions) {
    const activeFilters: Record<string, string> = {};
    nextConditions.forEach((condition) => {
      if (!condition.column) return;
      const key = `${condition.column}__${condition.operator}`;
      if (NO_VALUE_OPERATORS.includes(condition.operator)) {
        activeFilters[key] = "1";
        return;
      }
      if (condition.value) {
        activeFilters[key] = condition.value;
      }
    });
    onFilterChange(activeFilters);
  }

  function removeCondition(id: string) {
    const nextConditions = conditions.filter((item) => item.id !== id);
    setConditions(nextConditions);
    applyFilters(nextConditions);
  }

  function updateCondition(id: string, field: keyof FilterCondition, value: string) {
    setConditions((prev) =>
      prev.map((condition) =>
        condition.id === id ? { ...condition, [field]: value } : condition
      )
    );
  }

  function clearFilters() {
    setConditions([]);
    onFilterChange({});
  }

  function toggleFilters() {
    if (!showFilters && conditions.length === 0) {
      addCondition();
    }
    setShowFilters((prev) => !prev);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter") {
      applyFilters();
    }
  }

  const activeFilterCount = Object.values(filters).filter((value) => value !== "")
    .length;
  if (columns.length === 0) return null;

  return (
    <div className="border-b">
      <div className="flex items-center gap-2 p-3">
        <Button
          variant={showFilters ? "secondary" : "outline"}
          size="sm"
          onClick={toggleFilters}
        >
          <Filter className="size-4" />
          筛选
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="size-4" />
            清除筛选
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="space-y-2 px-3 pb-3">
          {conditions.map((condition, index) => (
            <div key={condition.id} className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                onClick={() => removeCondition(condition.id)}
              >
                <X className="size-4" />
              </Button>

              <span className="w-12 shrink-0 text-sm text-muted-foreground">
                {index === 0 ? "where" : "and"}
              </span>

              <Popover
                open={openPopovers[condition.id]}
                onOpenChange={(open) =>
                  setOpenPopovers((prev) => ({ ...prev, [condition.id]: open }))
                }
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openPopovers[condition.id]}
                    className="h-8 w-40 justify-between text-sm"
                  >
                    <span className="truncate">
                      {condition.column || "选择字段"}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="搜索字段..." />
                    <CommandList>
                      <CommandEmpty>未找到字段</CommandEmpty>
                      <CommandGroup>
                        {columns.map((column) => (
                          <CommandItem
                            key={column.name}
                            value={column.name}
                            onSelect={(value) => {
                              updateCondition(condition.id, "column", value);
                              setOpenPopovers((prev) => ({
                                ...prev,
                                [condition.id]: false,
                              }));
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                condition.column === column.name
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <span className="truncate">{column.name}</span>
                            {column.isPrimaryKey && (
                              <span className="ml-1 text-xs text-primary">(PK)</span>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Select
                value={condition.operator}
                onValueChange={(value) =>
                  updateCondition(condition.id, "operator", value)
                }
              >
                <SelectTrigger className="h-8 w-28 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATORS.map((operator) => (
                    <SelectItem key={operator.value} value={operator.value}>
                      {operator.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {!NO_VALUE_OPERATORS.includes(condition.operator) && (
                <Input
                  placeholder="输入值"
                  value={condition.value}
                  onChange={(event) =>
                    updateCondition(condition.id, "value", event.target.value)
                  }
                  onKeyDown={handleKeyDown}
                  className="h-8 min-w-32 flex-1 text-sm"
                />
              )}
            </div>
          ))}

          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={addCondition}
              className="text-muted-foreground"
            >
              <Plus className="size-4" />
              添加筛选
            </Button>
            {conditions.length > 0 && (
              <>
                <Button size="sm" onClick={() => applyFilters()}>
                  应用
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground"
                >
                  清除筛选
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
