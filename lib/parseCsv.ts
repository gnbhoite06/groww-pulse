import type { Review } from "./types";

// Minimal RFC4180-ish CSV parser: handles quoted fields with embedded commas.
export function parseReviewsCsv(text: string): Review[] {
  const rows = parseCsvRows(text.trim());
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const iSource = idx("source");
  const iRating = idx("rating");
  const iTitle = idx("title");
  const iText = idx("text");
  const iDate = idx("date");

  return rows.slice(1).filter(r => r.length > 1).map((r) => ({
    source: (r[iSource]?.trim() as Review["source"]) ?? "Play Store",
    rating: Number(r[iRating]) || 0,
    title: r[iTitle]?.trim() ?? "",
    text: r[iText]?.trim() ?? "",
    date: r[iDate]?.trim() ?? "",
  }));
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
