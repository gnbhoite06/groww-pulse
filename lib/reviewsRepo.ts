import { createHash } from "crypto";
import { getSql } from "./db";
import type { Review } from "./types";

export function dedupeKey(r: Review): string {
  return createHash("sha256").update(`${r.source}|${r.date}|${r.rating}|${r.text}`).digest("hex");
}

export async function listReviews(): Promise<Review[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT source, rating, title, text, review_date::text AS date
    FROM reviews
    ORDER BY review_date DESC
  `;
  return rows as unknown as Review[];
}
