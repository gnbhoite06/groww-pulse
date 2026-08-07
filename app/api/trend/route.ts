import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getSql } from "@/lib/db";

// ISO week label, e.g. 2026-W32, and the Monday date that starts it.
function isoWeek(d: Date): { label: string; weekStart: string } {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (date.getUTCDay() + 6) % 7; // 0 = Monday
  date.setUTCDate(date.getUTCDate() - day);
  const monday = new Date(date);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return {
    label: `${date.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`,
    weekStart: monday.toISOString().slice(0, 10),
  };
}

export async function GET(req: NextRequest) {
  await ensureSchema();
  const sql = getSql();
  const weeksBack = Number(req.nextUrl.searchParams.get("weeks")) || 12;

  const rows = (await sql`
    SELECT product, rating, review_date::text AS date
    FROM reviews
    WHERE review_date >= (CURRENT_DATE - ${weeksBack * 7}::int)
  `) as { product: string; rating: number; date: string }[];

  const buckets = new Map<string, { product: string; week: string; weekStart: string; count: number; sum: number }>();

  for (const r of rows) {
    const { label, weekStart } = isoWeek(new Date(r.date));
    const key = `${r.product}|${label}`;
    if (!buckets.has(key)) {
      buckets.set(key, { product: r.product, week: label, weekStart, count: 0, sum: 0 });
    }
    const b = buckets.get(key)!;
    b.count += 1;
    b.sum += r.rating;
  }

  const points = [...buckets.values()]
    .map((b) => ({
      product: b.product,
      week: b.week,
      weekStart: b.weekStart,
      count: b.count,
      avgRating: Math.round((b.sum / b.count) * 100) / 100,
    }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  return NextResponse.json({ points });
}
