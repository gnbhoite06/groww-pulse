import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyPulse } from "@/lib/classify";
import type { Review } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { reviews, windowLabel } = (await req.json()) as {
    reviews: Review[];
    windowLabel?: string;
  };

  if (!Array.isArray(reviews) || reviews.length === 0) {
    return NextResponse.json({ error: "No reviews provided." }, { status: 400 });
  }

  const pulse = generateWeeklyPulse(reviews, windowLabel ?? "last 8-12 weeks");
  return NextResponse.json(pulse);
}
