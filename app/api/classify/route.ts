import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyPulse } from "@/lib/classify";
import { ensureSchema, getSql } from "@/lib/db";
import type { Review } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { reviews, windowLabel } = (await req.json()) as {
    reviews: Review[];
    windowLabel?: string;
  };

  if (!Array.isArray(reviews) || reviews.length === 0) {
    return NextResponse.json({ error: "No reviews provided." }, { status: 400 });
  }

  const label = windowLabel ?? "last 8-12 weeks";
  const pulse = generateWeeklyPulse(reviews, label);

  await ensureSchema();
  const sql = getSql();
  await sql`
    INSERT INTO pulses (window_label, total_reviews, payload)
    VALUES (${label}, ${pulse.totalReviews}, ${JSON.stringify(pulse)}::jsonb)
  `;

  return NextResponse.json(pulse);
}
