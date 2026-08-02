"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useReviewsStore } from "@/lib/useReviewsStore";
import { groupByTheme } from "@/lib/classify";
import { StatusCard } from "./status-card";

export default function DashboardPage() {
  const { reviews, meta, hydrated } = useReviewsStore();
  const groups = useMemo(() => groupByTheme(reviews), [reviews]);
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";
  const maxCount = Math.max(1, ...groups.map((g) => g.count));

  if (hydrated && reviews.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center flex flex-col items-center gap-4">
        <h1 className="text-xl font-bold">No reviews yet</h1>
        <p className="text-sm text-sub">Import reviews to see the theme breakdown here.</p>
        <Link
          href="/reviews"
          className="rounded-lg bg-brand-strong px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Go to Reviews →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-sub mt-1">Theme breakdown across all imported reviews.</p>
      </div>

      {hydrated && <StatusCard meta={meta} totalReviews={reviews.length} />}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Total reviews" value={reviews.length} />
        <KpiCard label="Avg rating" value={`${avgRating}★`} />
        <KpiCard label="Themes found" value={groups.length} />
        <KpiCard
          label="Worst theme"
          value={groups.length ? groups.reduce((a, b) => (a.avgRating < b.avgRating ? a : b)).theme : "—"}
        />
      </div>

      <div className="rounded-xl border border-card-line bg-card p-5">
        <h2 className="text-sm font-bold text-brand uppercase tracking-wide mb-4">Reviews by theme</h2>
        <div className="flex flex-col gap-3">
          {groups.map((g) => (
            <div key={g.theme} className="flex items-center gap-3">
              <div className="w-28 text-sm font-medium shrink-0">{g.theme}</div>
              <div className="flex-1 h-6 rounded-full bg-brand-soft overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-strong flex items-center justify-end pr-2"
                  style={{ width: `${(g.count / maxCount) * 100}%` }}
                >
                  <span className="text-[10px] font-bold text-white tabular">{g.count}</span>
                </div>
              </div>
              <div className="w-16 text-right text-xs text-sub tabular shrink-0">{g.avgRating.toFixed(1)}★ avg</div>
            </div>
          ))}
        </div>
      </div>

      <Link
        href="/pulse"
        className="self-start rounded-lg border border-brand-strong text-brand px-4 py-2 text-sm font-semibold hover:bg-brand-soft transition-colors"
      >
        Generate weekly note →
      </Link>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-card-line bg-card p-4">
      <div className="text-xs text-sub">{label}</div>
      <div className="text-2xl font-bold tabular mt-1">{value}</div>
    </div>
  );
}
