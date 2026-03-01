import { NextRequest, NextResponse } from "next/server";

import { pool } from "@/lib/db";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

const SUPPORTED_SOURCES = [
  "ai_billing_logs",
  "user_action_logs",
  "user_usage_logs",
] as const;

type LogSource = (typeof SUPPORTED_SOURCES)[number];

function isLogSource(value: string): value is LogSource {
  return SUPPORTED_SOURCES.includes(value as LogSource);
}

export async function GET(request: NextRequest) {
  try {
    const sourceParam = request.nextUrl.searchParams.get("source") || "ai_billing_logs";
    const limitParam = Number.parseInt(
      request.nextUrl.searchParams.get("limit") || "50",
      10
    );
    const limit = Number.isNaN(limitParam) ? 50 : Math.min(Math.max(limitParam, 1), 200);

    if (!isLogSource(sourceParam)) {
      return NextResponse.json(
        { error: `source must be one of: ${SUPPORTED_SOURCES.join(", ")}` },
        { status: 400 }
      );
    }

    const db = pool();
    const rowsResult = await db.query(
      `SELECT * FROM "${sourceParam}" ORDER BY 1 DESC LIMIT $1`,
      [limit]
    );

    let redisStatus: "up" | "down" = "down";
    try {
      const pong = await getRedis().ping();
      redisStatus = pong === "PONG" ? "up" : "down";
    } catch {
      redisStatus = "down";
    }

    return NextResponse.json({
      source: sourceParam,
      redisStatus,
      rows: rowsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching app logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch app logs" },
      { status: 500 }
    );
  }
}
