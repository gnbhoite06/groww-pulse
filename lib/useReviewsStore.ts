"use client";

// Reviews and the generated pulse now live in Postgres (see lib/db.ts, /api/reviews,
// /api/classify) so they persist across browsers/devices. This hook only keeps small
// UI-only metadata (last-sourced timestamp, warnings) local to the browser.
import { useCallback, useEffect, useState } from "react";

const META_KEY = "groww-pulse-meta";

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
  const [meta, setMetaState] = useState<SourceMeta>(emptyMeta);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setMetaState(read(META_KEY, emptyMeta));
    setHydrated(true);
  }, []);

  const setMeta = useCallback((meta: Partial<SourceMeta>) => {
    const nextMeta: SourceMeta = { ...emptyMeta, ...meta, lastSourcedAt: new Date().toISOString() };
    setMetaState(nextMeta);
    localStorage.setItem(META_KEY, JSON.stringify(nextMeta));
  }, []);

  return { meta, setMeta, hydrated };
}
