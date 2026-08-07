"use client";

import { useEffect, useState } from "react";
import { useReviewsStore } from "@/lib/useReviewsStore";
import { parseReviewsCsv } from "@/lib/parseCsv";
import type { Review } from "@/lib/types";
import { StatusCard } from "../status-card";

export default function ReviewsPage() {
  const { meta, setMeta, hydrated } = useReviewsStore();
  const [reviews, setReviewsState] = useState<Review[]>([]);
  const [appStoreId, setAppStoreId] = useState("1404871702");
  const [playPackage, setPlayPackage] = useState("com.nextbillion.groww");
  const [weeks, setWeeks] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchWarnings, setFetchWarnings] = useState<string[]>([]);
  const [competitorLoading, setCompetitorLoading] = useState(false);
  const [competitorResult, setCompetitorResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => setReviewsState(data.reviews ?? []));
  }, []);

  async function handleFetch() {
    setLoading(true);
    setError(null);
    setFetchWarnings([]);
    try {
      const res = await fetch("/api/fetch-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appStoreId, playPackage, weeks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fetch failed");
      setMeta({
        method: "rss+play-scraper",
        appStoreCount: data.counts.appStore,
        playStoreCount: data.counts.playStore,
        warnings: data.warnings ?? [],
      });
      setFetchWarnings(data.warnings ?? []);
      const refreshed = await fetch("/api/reviews").then((r) => r.json());
      setReviewsState(refreshed.reviews ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFetchCompetitors() {
    setCompetitorLoading(true);
    setCompetitorResult(null);
    try {
      const res = await fetch("/api/fetch-competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fetch failed");
      const summary = (data.results as { product: string; inserted: number }[])
        .map((r) => `${r.product}: +${r.inserted}`)
        .join(" · ");
      setCompetitorResult(summary || "No new reviews.");
    } catch (e) {
      setCompetitorResult(`Error: ${(e as Error).message}`);
    } finally {
      setCompetitorLoading(false);
    }
  }

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const parsed = parseReviewsCsv(String(reader.result));
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviews: parsed }),
      });
      const data = await res.json();
      setMeta({
        method: "csv-upload",
        appStoreCount: parsed.filter((r) => r.source === "App Store").length,
        playStoreCount: parsed.filter((r) => r.source === "Play Store").length,
        warnings: [],
      });
      setReviewsState(data.reviews ?? []);
    };
    reader.readAsText(file);
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Reviews</h1>
        <p className="text-sm text-sub mt-1">
          Import App Store + Play Store reviews with one click, or upload a CSV as a fallback.
        </p>
      </div>

      {hydrated && <StatusCard meta={meta} totalReviews={reviews.length} />}

      <div className="rounded-xl border border-card-line bg-card p-5 flex flex-col gap-4">
        <h2 className="text-sm font-bold text-brand uppercase tracking-wide">One-click import</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="flex flex-col gap-1 text-xs text-sub">
            App Store ID
            <input
              value={appStoreId}
              onChange={(e) => setAppStoreId(e.target.value)}
              className="rounded-lg border border-card-line bg-bg px-3 py-2 text-sm text-ink"
              placeholder="e.g. 1404871702"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-sub">
            Play Store package
            <input
              value={playPackage}
              onChange={(e) => setPlayPackage(e.target.value)}
              className="rounded-lg border border-card-line bg-bg px-3 py-2 text-sm text-ink"
              placeholder="e.g. com.nextbillion.groww"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-sub">
            Weeks back
            <input
              type="number"
              min={1}
              max={26}
              value={weeks}
              onChange={(e) => setWeeks(Number(e.target.value))}
              className="rounded-lg border border-card-line bg-bg px-3 py-2 text-sm text-ink tabular"
            />
          </label>
        </div>
        <button
          onClick={handleFetch}
          disabled={loading}
          className="self-start rounded-lg bg-brand-strong px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Fetching…" : "Fetch latest reviews"}
        </button>
        {error && <p className="text-sm text-danger">{error}</p>}
        {fetchWarnings.map((w, i) => (
          <p key={i} className="text-xs text-amber">⚠ {w}</p>
        ))}
      </div>

      <div className="rounded-xl border border-card-line bg-card p-5 flex flex-col gap-3">
        <h2 className="text-sm font-bold text-brand uppercase tracking-wide">Competitor benchmark</h2>
        <p className="text-xs text-sub">
          Pulls the same {weeks}-week window for Zerodha Kite, Upstox, and Angel One, tagged by product, to power the
          dashboard&apos;s week-over-week and comparison views.
        </p>
        <button
          onClick={handleFetchCompetitors}
          disabled={competitorLoading}
          className="self-start rounded-lg border border-brand-strong text-brand px-4 py-2 text-sm font-semibold hover:bg-brand-soft transition-colors disabled:opacity-50 cursor-pointer"
        >
          {competitorLoading ? "Fetching competitors…" : "Fetch competitor reviews"}
        </button>
        {competitorResult && <p className="text-xs text-sub">{competitorResult}</p>}
      </div>

      <div className="rounded-xl border border-card-line bg-card p-5 flex flex-col gap-3">
        <h2 className="text-sm font-bold text-brand uppercase tracking-wide">Or upload a CSV</h2>
        <p className="text-xs text-sub">Columns: source, rating, title, text, date</p>
        <input
          type="file"
          accept=".csv"
          onChange={handleCsvUpload}
          className="text-sm text-sub file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand cursor-pointer"
        />
      </div>

      {hydrated && reviews.length > 0 && (
        <div className="rounded-xl border border-card-line bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-soft text-brand text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Source</th>
                  <th className="text-left px-4 py-2 font-semibold tabular">Rating</th>
                  <th className="text-left px-4 py-2 font-semibold">Title</th>
                  <th className="text-left px-4 py-2 font-semibold">Text</th>
                  <th className="text-left px-4 py-2 font-semibold tabular">Date</th>
                </tr>
              </thead>
              <tbody>
                {reviews.slice(0, 100).map((r, i) => (
                  <tr key={i} className="border-t border-card-line hover:bg-brand-soft/30">
                    <td className="px-4 py-2 text-sub whitespace-nowrap">{r.source}</td>
                    <td className="px-4 py-2 tabular">{r.rating}★</td>
                    <td className="px-4 py-2 text-sub max-w-[200px] truncate">{r.title || "—"}</td>
                    <td className="px-4 py-2 max-w-[360px] truncate">{r.text}</td>
                    <td className="px-4 py-2 text-sub tabular whitespace-nowrap">{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {reviews.length > 100 && (
            <div className="px-4 py-2 text-xs text-sub border-t border-card-line">
              Showing 100 of {reviews.length} reviews.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
