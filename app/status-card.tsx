"use client";

import type { SourceMeta } from "@/lib/useReviewsStore";

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function StatusCard({ meta, totalReviews }: { meta: SourceMeta; totalReviews: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-card-line bg-card px-4 py-3 text-xs text-sub">
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${meta.lastSourcedAt ? "bg-brand-strong" : "bg-danger"}`} />
        <span className="font-medium text-ink">Last sourced:</span> {timeAgo(meta.lastSourcedAt)}
      </div>
      <div>
        <span className="font-medium text-ink">Method:</span>{" "}
        {meta.method === "rss+play-scraper" ? "Live fetch (RSS + Play Store)" : meta.method === "csv-upload" ? "CSV upload" : "—"}
      </div>
      <div className="tabular">
        <span className="font-medium text-ink">Reviews:</span> {totalReviews}
        {meta.appStoreCount + meta.playStoreCount > 0 && (
          <span> ({meta.appStoreCount} App Store · {meta.playStoreCount} Play Store)</span>
        )}
      </div>
      {meta.warnings.length > 0 && (
        <div className="text-amber">{meta.warnings.length} warning{meta.warnings.length > 1 ? "s" : ""}</div>
      )}
    </div>
  );
}
