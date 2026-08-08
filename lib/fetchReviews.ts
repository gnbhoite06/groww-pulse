import type { Review } from "./types";

type AppleEntry = {
  "im:rating"?: { label: string };
  title?: { label: string };
  content?: { label: string };
  updated?: { label: string };
};

export async function fetchAppStoreReviews(
  appId: string,
  weeks: number,
  product: string,
  countries: string[] = ["in", "us"]
): Promise<Review[]> {
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);

  const rows: Review[] = [];
  for (const country of countries) {
    for (let page = 1; page <= 10; page++) {
      const url = `https://itunes.apple.com/${country}/rss/customerreviews/id=${appId}/sortBy=mostRecent/page=${page}/json`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) break;
      const data = await res.json();
      const entries: AppleEntry[] = data?.feed?.entry ?? [];
      if (entries.length === 0) break;

      for (const e of entries) {
        const ratingLabel = e["im:rating"]?.label;
        if (!ratingLabel) continue;
        const dateLabel = e.updated?.label;
        const date = dateLabel ? new Date(dateLabel) : null;
        if (!date || isNaN(date.getTime()) || date < since) continue;
        rows.push({
          source: "App Store",
          rating: Number(ratingLabel),
          title: (e.title?.label ?? "").trim(),
          text: (e.content?.label ?? "").trim(),
          date: date.toISOString().slice(0, 10),
          product,
        });
      }
    }
  }
  return rows;
}

export async function fetchPlayStoreReviews(
  packageName: string,
  weeks: number,
  product: string,
  pageSize = 150,
  maxPages = 120
): Promise<Review[]> {
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);

  // google-play-scraper reads the same public review page a browser would --
  // no login, but an unofficial client. Treat as best-effort.
  const gplayModule = await import("google-play-scraper");
  const gplay = gplayModule.default;
  // google-play-scraper's shipped .d.ts mistypes `sort` as the enum type
  // itself rather than the value object, even though `gplay.sort.NEWEST`
  // resolves fine at runtime (verified: { NEWEST: 2, RATING: 3, HELPFULNESS: 1 }).
  const NEWEST = (gplay.sort as unknown as { NEWEST: number }).NEWEST;

  type GPlayReview = { date?: string; score?: number; text?: string };
  const collected: GPlayReview[] = [];
  let nextPaginationToken: unknown = undefined;

  // High-volume apps burn through a single page of "newest" reviews within
  // days, so pull more pages until we cross the requested window (or hit
  // maxPages, to keep this from running unbounded against very active apps).
  for (let page = 0; page < maxPages; page++) {
    const result = await gplay.reviews({
      appId: packageName,
      lang: "en",
      country: "in",
      sort: NEWEST as unknown as typeof gplay.sort,
      num: pageSize,
      paginate: true,
      nextPaginationToken: nextPaginationToken as string | undefined,
    });
    const batch: GPlayReview[] = result.data ?? [];
    if (batch.length === 0) break;
    collected.push(...batch);

    const oldest = batch[batch.length - 1]?.date;
    if (oldest && new Date(oldest) < since) break;

    nextPaginationToken = result.nextPaginationToken;
    if (!nextPaginationToken) break;
  }

  return collected
    .filter((r) => r.date && new Date(r.date) >= since)
    .map((r) => ({
      source: "Play Store" as const,
      rating: r.score ?? 0,
      title: "",
      text: (r.text ?? "").trim(),
      date: new Date(r.date!).toISOString().slice(0, 10),
      product,
    }));
}
