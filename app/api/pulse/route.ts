import { NextResponse } from "next/server";
import { ensureSchema, getSql } from "@/lib/db";
import type { WeeklyPulse } from "@/lib/types";

export async function GET() {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT payload FROM pulses ORDER BY generated_at DESC LIMIT 1
  `;
  const pulse = rows.length > 0 ? ((rows[0] as { payload: WeeklyPulse }).payload) : null;
  return NextResponse.json({ pulse });
}
