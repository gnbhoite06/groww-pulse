import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getSql } from "@/lib/db";
import { dedupeKey, listReviews } from "@/lib/reviewsRepo";
import type { Review } from "@/lib/types";

export async function GET(req: NextRequest) {
  await ensureSchema();
  const productParam = req.nextUrl.searchParams.get("product");
  const product = productParam === "all" ? undefined : productParam || "Groww";
  const reviews = await listReviews(product);
  return NextResponse.json({ reviews });
}

export async function POST(req: NextRequest) {
  const { reviews } = (await req.json()) as { reviews: Review[] };
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return NextResponse.json({ error: "No reviews provided." }, { status: 400 });
  }

  await ensureSchema();
  const sql = getSql();
  let inserted = 0;
  for (const r of reviews) {
    if (!r.date) continue;
    const key = dedupeKey(r);
    const result = await sql`
      INSERT INTO reviews (source, rating, title, text, review_date, dedupe_key, product)
      VALUES (${r.source}, ${r.rating}, ${r.title}, ${r.text}, ${r.date}, ${key}, ${r.product || "Groww"})
      ON CONFLICT (dedupe_key) DO NOTHING
      RETURNING id
    `;
    if (result.length > 0) inserted += 1;
  }

  const all = await listReviews(reviews[0]?.product || "Groww");
  return NextResponse.json({ newCount: inserted, reviews: all });
}
