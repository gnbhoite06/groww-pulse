import { createHash } from "crypto";
import { getSql } from "./db";
import type { Review } from "./types";

export function dedupeKey(r: Review): string {
  return createHash("sha256").update(`${r.product}|${r.source}|${r.date}|${r.rating}|${r.text}`).digest("hex");
}

const INSERT_CHUNK = 2000;

// Bulk insert via unnest — one round trip per chunk instead of one per row,
// which matters once a fetch pulls thousands of reviews (a high-volume app's
// "newest" feed burns through a review-count cap within days, so covering a
// full 8-12 week window means paginating deep and inserting a lot of rows).
export async function bulkInsertReviews(reviews: Review[]): Promise<number> {
  if (reviews.length === 0) return 0;
  const sql = getSql();
  let inserted = 0;

  for (let i = 0; i < reviews.length; i += INSERT_CHUNK) {
    const chunk = reviews.slice(i, i + INSERT_CHUNK);
    const sources = chunk.map((r) => r.source);
    const ratings = chunk.map((r) => r.rating);
    const titles = chunk.map((r) => r.title);
    const texts = chunk.map((r) => r.text);
    const dates = chunk.map((r) => r.date);
    const keys = chunk.map((r) => dedupeKey(r));
    const products = chunk.map((r) => r.product);

    const result = await sql`
      INSERT INTO reviews (source, rating, title, text, review_date, dedupe_key, product)
      SELECT * FROM unnest(
        ${sources}::text[],
        ${ratings}::int[],
        ${titles}::text[],
        ${texts}::text[],
        ${dates}::date[],
        ${keys}::text[],
        ${products}::text[]
      )
      ON CONFLICT (dedupe_key) DO NOTHING
      RETURNING id
    `;
    inserted += result.length;
  }

  return inserted;
}

export async function listReviews(product?: string): Promise<Review[]> {
  const sql = getSql();
  const rows = product
    ? await sql`
        SELECT source, rating, title, text, review_date::text AS date, product
        FROM reviews
        WHERE product = ${product}
        ORDER BY review_date DESC
      `
    : await sql`
        SELECT source, rating, title, text, review_date::text AS date, product
        FROM reviews
        ORDER BY review_date DESC
      `;
  return rows as unknown as Review[];
}

export async function listAllProducts(): Promise<string[]> {
  const sql = getSql();
  const rows = await sql`SELECT DISTINCT product FROM reviews ORDER BY product`;
  return (rows as { product: string }[]).map((r) => r.product);
}
