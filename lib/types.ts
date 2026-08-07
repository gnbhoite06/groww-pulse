export type Review = {
  source: "App Store" | "Play Store";
  rating: number;
  title: string;
  text: string;
  date: string; // ISO yyyy-mm-dd
  product: string; // e.g. "Groww", "Zerodha Kite"
};

export type WeekPoint = {
  week: string; // ISO week label, e.g. "2026-W30"
  weekStart: string; // ISO date, Monday of that week
  product: string;
  count: number;
  avgRating: number;
};

export type ProductSummary = {
  product: string;
  totalReviews: number;
  avgRating: number;
  topTheme: string;
  topThemeCount: number;
};

export type ThemeGroup = {
  theme: string;
  count: number;
  avgRating: number;
  reviews: Review[];
};

export type WeeklyPulse = {
  windowLabel: string;
  totalReviews: number;
  themes: ThemeGroup[]; // top 3
  quotes: { theme: string; review: Review }[];
  actionIdeas: string[];
  generatedAt: string;
};
