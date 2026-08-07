"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useReviewsStore } from "@/lib/useReviewsStore";
import { groupByTheme } from "@/lib/classify";
import type { Review, WeekPoint, ProductSummary } from "@/lib/types";
import { StatusCard } from "./status-card";

const PRODUCT_COLORS: Record<string, string> = {
  Groww: "#00b386",
  "Zerodha Kite": "#e6a668",
  Upstox: "#5b7fd6",
  "Angel One": "#b46bd6",
};

function colorFor(product: string) {
  return PRODUCT_COLORS[product] ?? "#888";
}

export default function DashboardPage() {
  const { meta, hydrated: metaHydrated } = useReviewsStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [trend, setTrend] = useState<WeekPoint[]>([]);
  const [summaries, setSummaries] = useState<ProductSummary[]>([]);
  const [metric, setMetric] = useState<"count" | "avgRating">("avgRating");

  useEffect(() => {
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => setReviews(data.reviews ?? []))
      .finally(() => setHydrated(true));
    fetch("/api/trend?weeks=12")
      .then((res) => res.json())
      .then((data) => setTrend(data.points ?? []));
    fetch("/api/products-summary?weeks=12")
      .then((res) => res.json())
      .then((data) => setSummaries(data.summaries ?? []));
  }, []);

  const groups = useMemo(() => groupByTheme(reviews), [reviews]);
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";
  const maxCount = Math.max(1, ...groups.map((g) => g.count));

  const products = useMemo(() => [...new Set(trend.map((p) => p.product))], [trend]);
  const chartData = useMemo(() => {
    const weeks = [...new Set(trend.map((p) => p.week))].sort();
    return weeks.map((week) => {
      const row: Record<string, string | number> = { week };
      for (const product of products) {
        const point = trend.find((p) => p.week === week && p.product === product);
        row[product] = point ? point[metric] : NaN;
      }
      return row;
    });
  }, [trend, products, metric]);

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

      {hydrated && metaHydrated && <StatusCard meta={meta} totalReviews={reviews.length} />}

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

      {chartData.length > 0 && (
        <div className="rounded-xl border border-card-line bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-brand uppercase tracking-wide">
              Week over week{products.length > 1 ? " · vs. competitors" : ""}
            </h2>
            <div className="flex rounded-lg border border-card-line overflow-hidden text-xs">
              <button
                onClick={() => setMetric("avgRating")}
                className={`px-3 py-1.5 font-semibold cursor-pointer ${
                  metric === "avgRating" ? "bg-brand-strong text-white" : "text-sub"
                }`}
              >
                Avg rating
              </button>
              <button
                onClick={() => setMetric("count")}
                className={`px-3 py-1.5 font-semibold cursor-pointer ${
                  metric === "count" ? "bg-brand-strong text-white" : "text-sub"
                }`}
              >
                Review volume
              </button>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-line)" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--sub)" }} />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--sub)" }}
                  domain={metric === "avgRating" ? [1, 5] : ["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--card-line)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {products.map((product) => (
                  <Line
                    key={product}
                    type="monotone"
                    dataKey={product}
                    stroke={colorFor(product)}
                    strokeWidth={2}
                    dot={{ r: 2.5 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {summaries.length > 0 && (
        <div className="rounded-xl border border-card-line bg-card p-5">
          <h2 className="text-sm font-bold text-brand uppercase tracking-wide mb-4">Competitor comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-sub uppercase tracking-wide">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Product</th>
                  <th className="text-left px-3 py-2 font-semibold tabular">Avg rating</th>
                  <th className="text-left px-3 py-2 font-semibold tabular">Reviews</th>
                  <th className="text-left px-3 py-2 font-semibold">Top complaint theme</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((s) => (
                  <tr key={s.product} className="border-t border-card-line">
                    <td className="px-3 py-2 font-medium flex items-center gap-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: colorFor(s.product) }}
                      />
                      {s.product}
                    </td>
                    <td className="px-3 py-2 tabular">{s.avgRating.toFixed(2)}★</td>
                    <td className="px-3 py-2 tabular">{s.totalReviews}</td>
                    <td className="px-3 py-2 text-sub">
                      {s.topTheme} {s.topThemeCount ? `(${s.topThemeCount})` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {summaries.length === 1 && (
            <p className="text-xs text-sub mt-3">
              Only Groww data found. Go to{" "}
              <Link href="/reviews" className="text-brand font-semibold">
                Reviews
              </Link>{" "}
              and click <span className="font-semibold">Fetch competitor reviews</span> to populate this table.
            </p>
          )}
        </div>
      )}

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
