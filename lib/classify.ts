import type { Review, ThemeGroup, WeeklyPulse } from "./types";

export const THEMES: Record<string, string[]> = {
  KYC: ["kyc", "verification", "aadhaar", "pan", "rejected", "re-kyc"],
  Onboarding: ["onboarding", "signup", "account opening", "document upload"],
  Payments: ["payment", "upi", "debited", "gateway", "autopay", "mandate", "sip"],
  Withdrawals: ["withdrawal", "redemption", "redeem", "processing", "credited"],
  Statements: ["statement", "capital gains", "holdings", "pdf", "tax"],
};

export function classify(review: Review): string {
  const blob = `${review.title} ${review.text}`.toLowerCase();
  for (const [theme, keywords] of Object.entries(THEMES)) {
    if (keywords.some((k) => blob.includes(k))) return theme;
  }
  return "Other";
}

export function groupByTheme(reviews: Review[]): ThemeGroup[] {
  const buckets = new Map<string, Review[]>();
  for (const r of reviews) {
    const theme = classify(r);
    if (!buckets.has(theme)) buckets.set(theme, []);
    buckets.get(theme)!.push(r);
  }
  const groups: ThemeGroup[] = [...buckets.entries()]
    .filter(([theme]) => theme !== "Other")
    .map(([theme, revs]) => ({
      theme,
      count: revs.length,
      avgRating: revs.reduce((s, r) => s + r.rating, 0) / revs.length,
      reviews: revs,
    }));
  return groups.sort((a, b) => b.count - a.count);
}

function pickQuote(revs: Review[]): Review | undefined {
  const withText = revs.filter((r) => r.text.trim().length > 0);
  withText.sort((a, b) => a.rating - b.rating);
  return withText[0];
}

const ACTION_TEMPLATES: Record<string, string> = {
  KYC: "Add a KYC failure-reason screen — surface the specific rejection reason instead of a generic 'verification pending' state.",
  Payments: "Add an idempotency check on SIP/UPI debits — detect and flag duplicate/incorrect charges within minutes, with proactive refund status.",
  Withdrawals: "Add a withdrawal SLA tracker — live status bar (submitted → processing → credited) with expected date.",
  Onboarding: "Streamline document upload — clearer failure reasons and fewer re-submission loops during signup.",
  Statements: "Reconcile statement totals with the in-app dashboard and speed up PDF generation.",
};

export function generateWeeklyPulse(reviews: Review[], windowLabel: string): WeeklyPulse {
  const groups = groupByTheme(reviews);
  const top3 = groups.slice(0, 3);
  return {
    windowLabel,
    totalReviews: reviews.length,
    themes: top3,
    quotes: top3
      .map((g) => {
        const q = pickQuote(g.reviews);
        return q ? { theme: g.theme, review: q } : null;
      })
      .filter((x): x is { theme: string; review: Review } => x !== null),
    actionIdeas: top3.map((g) => ACTION_TEMPLATES[g.theme] ?? `Investigate recurring issues in ${g.theme}.`),
    generatedAt: new Date().toISOString(),
  };
}
