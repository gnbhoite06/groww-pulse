import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";
import { bulkInsertReviews, listReviews } from "@/lib/reviewsRepo";
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
  const withDates = reviews.filter((r) => r.date).map((r) => ({ ...r, product: r.product || "Groww" }));
  const inserted = await bulkInsertReviews(withDates);

  const all = await listReviews(withDates[0]?.product || "Groww");
  return NextResponse.json({ newCount: inserted, reviews: all });
}
