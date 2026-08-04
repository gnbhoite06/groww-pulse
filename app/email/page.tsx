"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { WeeklyPulse } from "@/lib/types";

function buildEmailBody(pulse: WeeklyPulse): string {
  const lines: string[] = [];
  lines.push(`Here's this week's user review pulse for Groww, based on ${pulse.totalReviews} App Store + Play Store reviews from the ${pulse.windowLabel}.`, "");
  lines.push("TOP THEMES");
  pulse.themes.forEach((t, i) => {
    lines.push(`${i + 1}. ${t.theme} (${t.count} reviews, avg ${t.avgRating.toFixed(1)}★)`);
  });
  lines.push("", "REAL USER QUOTES");
  pulse.quotes.forEach((q) => {
    lines.push(`- "${q.review.text}" (${q.review.source}, ${q.review.rating}★)`);
  });
  lines.push("", "ACTION IDEAS");
  pulse.actionIdeas.forEach((a, i) => lines.push(`${i + 1}. ${a}`));
  return lines.join("\n");
}

export default function EmailPage() {
  const [pulse, setPulse] = useState<WeeklyPulse | null>(null);
  const [to, setTo] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/pulse")
      .then((res) => res.json())
      .then((data) => setPulse(data.pulse ?? null));
  }, []);

  const body = useMemo(() => (pulse ? buildEmailBody(pulse) : ""), [pulse]);
  const subject = "Groww — Weekly Review Pulse";

  function handleCopy() {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const mailtoHref = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Send Email</h1>
        <p className="text-sm text-sub mt-1">Draft the weekly note as an email — nothing sends automatically, this opens your own mail client.</p>
      </div>

      {!pulse && (
        <p className="text-sm text-sub">
          No weekly note yet. <Link href="/pulse" className="text-brand font-medium">Generate one first →</Link>
        </p>
      )}

      {pulse && (
        <>
          <label className="flex flex-col gap-1 text-xs text-sub max-w-sm">
            To
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="you@groww.in"
              className="rounded-lg border border-card-line bg-card px-3 py-2 text-sm text-ink"
            />
          </label>

          <div className="rounded-xl border border-card-line bg-card p-5">
            <div className="text-xs text-sub mb-1">Subject</div>
            <div className="text-sm font-semibold mb-4">{subject}</div>
            <div className="text-xs text-sub mb-1">Body</div>
            <pre className="whitespace-pre-wrap text-sm font-sans">{body}</pre>
          </div>

          <div className="flex gap-3">
            <a
              href={mailtoHref}
              className="rounded-lg bg-brand-strong px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Open in mail client
            </a>
            <button
              onClick={handleCopy}
              className="rounded-lg border border-card-line px-4 py-2 text-sm font-semibold text-sub hover:text-ink transition-colors cursor-pointer"
            >
              {copied ? "Copied!" : "Copy text"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
