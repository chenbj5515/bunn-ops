"use client";

const TABLE_ACCESS_COOKIE_KEY = "table_access_counts";
const TABLE_ACCESS_EVENT = "table-access-count-updated";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type TableAccessCounts = Record<string, number>;

function parseCookieValue(raw: string): TableAccessCounts {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const normalized: TableAccessCounts = {};
    Object.entries(parsed).forEach(([tableName, count]) => {
      const parsedCount = Number(count);
      if (tableName && Number.isFinite(parsedCount) && parsedCount > 0) {
        normalized[tableName] = Math.floor(parsedCount);
      }
    });
    return normalized;
  } catch {
    return {};
  }
}

export function getTableAccessCounts(): TableAccessCounts {
  if (typeof document === "undefined") return {};
  const cookiePair = document.cookie
    .split("; ")
    .find((pair) => pair.startsWith(`${TABLE_ACCESS_COOKIE_KEY}=`));
  if (!cookiePair) return {};
  return parseCookieValue(cookiePair.split("=").slice(1).join("="));
}

function writeTableAccessCounts(counts: TableAccessCounts) {
  if (typeof document === "undefined") return;
  const serialized = encodeURIComponent(JSON.stringify(counts));
  document.cookie = `${TABLE_ACCESS_COOKIE_KEY}=${serialized}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

export function incrementTableAccessCount(tableName: string) {
  if (!tableName || typeof window === "undefined") return;
  const counts = getTableAccessCounts();
  const nextCounts = {
    ...counts,
    [tableName]: (counts[tableName] ?? 0) + 1,
  };
  writeTableAccessCounts(nextCounts);
  window.dispatchEvent(
    new CustomEvent<TableAccessCounts>(TABLE_ACCESS_EVENT, { detail: nextCounts })
  );
}

export function sortTablesByAccessFrequency(
  tables: string[],
  counts: TableAccessCounts
): string[] {
  return [...tables].sort((left, right) => {
    const rightCount = counts[right] ?? 0;
    const leftCount = counts[left] ?? 0;
    if (rightCount !== leftCount) {
      return rightCount - leftCount;
    }
    return left.localeCompare(right, "zh-CN");
  });
}

export function getTableAccessEventName() {
  return TABLE_ACCESS_EVENT;
}
