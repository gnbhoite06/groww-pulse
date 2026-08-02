import { NextRequest, NextResponse } from "next/server";
import { fetchAppStoreReviews, fetchPlayStoreReviews } from "@/lib/fetchReviews";
import type { Review } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { appStoreId, playPackage, weeks } = await req.json();

  if (!appStoreId && !playPackage) {
    return NextResponse.json(
      { error: "Provide at least an App Store id or Play Store package name." },
      { status: 400 }
    );
  }

  const w = Number(weeks) || 10;
  const warnings: string[] = [];
  let appStore: Review[] = [];
  let playStore: Review[] = [];

  if (appStoreId) {
    try {
      appStore = await fetchAppStoreReviews(appStoreId, w);
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
      playStore = await fetchPlayStoreReviews(playPackage, w);
    } catch (e) {
      warnings.push(`Play Store fetch failed: ${(e as Error).message}`);
    }
  }

  const reviews = [...appStore, ...playStore];
  return NextResponse.json({ reviews, warnings, counts: { appStore: appStore.length, playStore: playStore.length } });
}
