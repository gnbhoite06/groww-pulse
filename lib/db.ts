import { neon } from "@neondatabase/serverless";

function createSql() {
  return neon(process.env.DATABASE_URL!);
}

let _sql: ReturnType<typeof createSql> | null = null;

export function getSql() {
  if (!_sql) _sql = createSql();
  return _sql;
}

let _initialized = false;

export async function ensureSchema() {
  if (_initialized) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id BIGSERIAL PRIMARY KEY,
      source TEXT NOT NULL,
      rating INT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      text TEXT NOT NULL DEFAULT '',
      review_date DATE NOT NULL,
      dedupe_key TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS pulses (
      id BIGSERIAL PRIMARY KEY,
      window_label TEXT NOT NULL,
      total_reviews INT NOT NULL,
      payload JSONB NOT NULL,
      generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  _initialized = true;
}
