import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getSql } from "@/lib/db";
import { listReviews } from "@/lib/reviewsRepo";
import { groupByTheme } from "@/lib/classify";
import { ALL_PRODUCTS } from "@/lib/competitors";
import type { ProductSummary } from "@/lib/types";

async function fetchOfficialRating(playPackage: string): Promise<{ rating: number | null; count: number | null }> {
  try {
    const gplayModule = await import("google-play-scraper");
    const gplay = gplayModule.default;
    const app = await gplay.app({ appId: playPackage });
    return { rating: app.score ?? null, count: app.ratings ?? null };
  } catch {
    return { rating: null, count: null };
  }
}

export async function GET(req: NextRequest) {
  await ensureSchema();
  const sql = getSql();
  const weeksBack = Number(req.nextUrl.searchParams.get("weeks")) || 12;

  const known = new Map(ALL_PRODUCTS.map((p) => [p.product, p]));
  const rows = (await sql`SELECT DISTINCT product FROM reviews`) as { product: string }[];
  const products = rows.map((r) => r.product).filter((p) => known.has(p));

  const summaries: ProductSummary[] = [];
  for (const product of products) {
    const all = await listReviews(product);
    const since = new Date();
    since.setDate(since.getDate() - weeksBack * 7);
    const reviews = all.filter((r) => new Date(r.date) >= since);
    if (reviews.length === 0) continue;

    const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    const groups = groupByTheme(reviews);
    const worst = groups.length
      ? groups.reduce((a, b) => (a.avgRating < b.avgRating ? a : b))
      : null;

    const config = known.get(product)!;
    const official = await fetchOfficialRating(config.playPackage);

    summaries.push({
      product,
      totalReviews: reviews.length,
      avgRating: Math.round(avgRating * 100) / 100,
      officialRating: official.rating !== null ? Math.round(official.rating * 100) / 100 : null,
      officialRatingsCount: official.count,
      topTheme: worst?.theme ?? "—",
      topThemeCount: worst?.count ?? 0,
    });
  }

  summaries.sort((a, b) => {
    if (a.product === "Groww") return -1;
    if (b.product === "Groww") return 1;
    return b.avgRating - a.avgRating;
  });

  return NextResponse.json({ summaries });
}
