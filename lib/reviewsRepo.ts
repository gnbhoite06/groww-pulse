import { createHash } from "crypto";
import { getSql } from "./db";
import type { Review } from "./types";

export function dedupeKey(r: Review): string {
  return createHash("sha256").update(`${r.product}|${r.source}|${r.date}|${r.rating}|${r.text}`).digest("hex");
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
