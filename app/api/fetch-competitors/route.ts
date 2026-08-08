import { NextRequest, NextResponse } from "next/server";
import { fetchAppStoreReviews, fetchPlayStoreReviews } from "@/lib/fetchReviews";
import { ensureSchema } from "@/lib/db";
import { bulkInsertReviews } from "@/lib/reviewsRepo";
import { COMPETITORS } from "@/lib/competitors";
import type { Review } from "@/lib/types";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const weeks = Number(body?.weeks) || 10;

  await ensureSchema();

  const results = await Promise.all(
    COMPETITORS.map(async (c) => {
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
      const inserted = await bulkInsertReviews(fetched);

      return { product: c.product, fetched: fetched.length, inserted, warnings };
    })
  );

  return NextResponse.json({ results });
}
