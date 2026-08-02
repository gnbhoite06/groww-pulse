export type Review = {
  source: "App Store" | "Play Store";
  rating: number;
  title: string;
  text: string;
  date: string; // ISO yyyy-mm-dd
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
