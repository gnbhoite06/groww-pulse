import { NextRequest, NextResponse } from "next/server";
import { fetchAppStoreReviews, fetchPlayStoreReviews } from "@/lib/fetchReviews";
import { ensureSchema, getSql } from "@/lib/db";
import { dedupeKey } from "@/lib/reviewsRepo";
import { COMPETITORS } from "@/lib/competitors";
import type { Review } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const weeks = Number(body?.weeks) || 10;

  await ensureSchema();
  const sql = getSql();

  const results: { product: string; fetched: number; inserted: number; warnings: string[] }[] = [];

  for (const c of COMPETITORS) {
    const warnings: string[] = [];
    let appStore: Review[] = [];
    let playStore: Review[] = [];

    try {
      appStore = await fetchAppStoreReviews(c.appStoreId, weeks, c.product);
    } catch (e) {
      warnings.push(`App Store fetch failed: ${(e as Error).message}`);
    }
    try {
      playStore = await fetchPlayStoreReviews(c.playPackage, weeks, c.product);
    } catch (e) {
      warnings.push(`Play Store fetch failed: ${(e as Error).message}`);
    }

    const fetched = [...appStore, ...playStore];
    let inserted = 0;
    for (const r of fetched) {
      const key = dedupeKey(r);
      const result = await sql`
        INSERT INTO reviews (source, rating, title, text, review_date, dedupe_key, product)
        VALUES (${r.source}, ${r.rating}, ${r.title}, ${r.text}, ${r.date}, ${key}, ${r.product})
        ON CONFLICT (dedupe_key) DO NOTHING
        RETURNING id
      `;
      if (result.length > 0) inserted += 1;
    }

    results.push({ product: c.product, fetched: fetched.length, inserted, warnings });
  }

  return NextResponse.json({ results });
}
