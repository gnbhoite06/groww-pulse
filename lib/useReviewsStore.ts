"use client";

import { useCallback, useEffect, useState } from "react";
import type { Review, WeeklyPulse } from "./types";

const REVIEWS_KEY = "groww-pulse-reviews";
const META_KEY = "groww-pulse-meta";
const PULSE_KEY = "groww-pulse-note";

export type SourceMeta = {
  lastSourcedAt: string | null; // ISO
  method: "rss+play-scraper" | "csv-upload" | null;
  appStoreCount: number;
  playStoreCount: number;
  warnings: string[];
};

const emptyMeta: SourceMeta = {
  lastSourcedAt: null,
  method: null,
  appStoreCount: 0,
  playStoreCount: 0,
  warnings: [],
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useReviewsStore() {
  const [reviews, setReviewsState] = useState<Review[]>([]);
  const [meta, setMetaState] = useState<SourceMeta>(emptyMeta);
  const [pulse, setPulseState] = useState<WeeklyPulse | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setReviewsState(read(REVIEWS_KEY, []));
    setMetaState(read(META_KEY, emptyMeta));
    setPulseState(read(PULSE_KEY, null));
    setHydrated(true);
  }, []);

  const setReviews = useCallback((reviews: Review[], meta: Partial<SourceMeta>) => {
    const nextMeta: SourceMeta = { ...emptyMeta, ...meta, lastSourcedAt: new Date().toISOString() };
    setReviewsState(reviews);
    setMetaState(nextMeta);
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
    localStorage.setItem(META_KEY, JSON.stringify(nextMeta));
  }, []);

  const setPulse = useCallback((pulse: WeeklyPulse) => {
    setPulseState(pulse);
    localStorage.setItem(PULSE_KEY, JSON.stringify(pulse));
  }, []);

  return { reviews, meta, pulse, setReviews, setPulse, hydrated };
}
