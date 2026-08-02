"use client";

import { useState } from "react";
import Link from "next/link";
import { useReviewsStore } from "@/lib/useReviewsStore";

export default function PulsePage() {
  const { reviews, pulse, setPulse, hydrated } = useReviewsStore();
  const [loading, setLoading] = useState(false);
  const [editedActions, setEditedActions] = useState<string[] | null>(null);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviews, windowLabel: "last 8-12 weeks" }),
      });
      const data = await res.json();
      setPulse(data);
      setEditedActions(data.actionIdeas);
    } finally {
      setLoading(false);
    }
  }

  const actions = editedActions ?? pulse?.actionIdeas ?? [];

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Weekly Note</h1>
          <p className="text-sm text-sub mt-1">Top 3 themes, real quotes, action ideas — ≤250 words.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || reviews.length === 0}
          className="rounded-lg bg-brand-strong px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Generating…" : pulse ? "Regenerate" : "Generate note"}
        </button>
      </div>

      {reviews.length === 0 && (
        <p className="text-sm text-sub">
          No reviews imported yet. <Link href="/reviews" className="text-brand font-medium">Go import some →</Link>
        </p>
      )}

      {pulse && (
        <div className="rounded-xl border border-card-line bg-card p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-card-line pb-3">
            <div>
              <div className="text-lg font-bold">Groww — Weekly Review Pulse</div>
              <div className="text-xs text-sub tabular">{pulse.windowLabel} · n={pulse.totalReviews} reviews</div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wide bg-brand-soft text-brand px-2 py-1 rounded-full">
              GROWW
            </span>
          </div>

          <section>
            <h2 className="text-xs font-bold text-brand uppercase tracking-wide mb-3">Top Themes</h2>
            <div className="flex flex-col gap-2">
              {pulse.themes.map((t, i) => (
                <div key={t.theme} className="flex items-center gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-brand-soft text-brand text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="font-semibold">{t.theme}</span>
                  <span className="text-sub tabular">({t.count} reviews, avg {t.avgRating.toFixed(1)}★)</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold text-brand uppercase tracking-wide mb-3">Real User Quotes</h2>
            <div className="flex flex-col gap-2">
              {pulse.quotes.map((q, i) => (
                <blockquote key={i} className="rounded-lg bg-brand-soft px-4 py-3 text-sm">
                  <p className="mb-1">&ldquo;{q.review.text}&rdquo;</p>
                  <cite className="text-xs text-brand font-medium not-italic">
                    {q.review.source} · {q.review.rating}★
                  </cite>
                </blockquote>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-bold text-brand uppercase tracking-wide mb-3">Action Ideas</h2>
            <div className="flex flex-col gap-2">
              {actions.map((a, i) => (
                <textarea
                  key={i}
                  value={a}
                  onChange={(e) => {
                    const next = [...actions];
                    next[i] = e.target.value;
                    setEditedActions(next);
                  }}
                  className="w-full rounded-lg border border-card-line bg-bg px-3 py-2 text-sm resize-none"
                  rows={2}
                />
              ))}
            </div>
          </section>

          <p className="text-[11px] text-sub border-t border-card-line pt-3">
            No usernames, emails, or reviewer IDs included. Themes assigned by keyword classifier, ≤5 buckets.
          </p>
        </div>
      )}
    </div>
  );
}
