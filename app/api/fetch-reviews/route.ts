import { NextRequest, NextResponse } from "next/server";
import { fetchAppStoreReviews, fetchPlayStoreReviews } from "@/lib/fetchReviews";
import { ensureSchema, getSql } from "@/lib/db";
import { dedupeKey } from "@/lib/reviewsRepo";
import type { Review } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { appStoreId, playPackage, weeks, product } = await req.json();

  if (!appStoreId && !playPackage) {
    return NextResponse.json(
      { error: "Provide at least an App Store id or Play Store package name." },
      { status: 400 }
    );
  }

  const w = Number(weeks) || 10;
  const p = (product as string) || "Groww";
  const warnings: string[] = [];
  let appStore: Review[] = [];
  let playStore: Review[] = [];

  if (appStoreId) {
    try {
      appStore = await fetchAppStoreReviews(appStoreId, w, p);
      if (appStore.length === 0) {
        warnings.push(
          "App Store RSS returned 0 reviews for this id/window — Apple's public feed has a known indexing gap for some apps, not a request failure."
        );
      }
    } catch (e) {
      warnings.push(`App Store fetch failed: ${(e as Error).message}`);
    }
  }

  if (playPackage) {
    try {
      playStore = await fetchPlayStoreReviews(playPackage, w, p);
    } catch (e) {
      warnings.push(`Play Store fetch failed: ${(e as Error).message}`);
    }
  }

  const fetched = [...appStore, ...playStore];

  await ensureSchema();
  const sql = getSql();
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

  const totalRows = await sql`SELECT COUNT(*)::int AS count FROM reviews WHERE product = ${p}`;
  const total = (totalRows[0] as { count: number }).count;

  return NextResponse.json({
    fetchedCount: fetched.length,
    newCount: inserted,
    totalStored: total,
    warnings,
    counts: { appStore: appStore.length, playStore: playStore.length },
  });
}
