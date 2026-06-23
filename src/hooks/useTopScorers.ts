"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ──────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────

export interface GoalDetail {
  minute: string;
  isPenalty: boolean;
  matchId: string;
  opponent: string;
}

export interface TopScorer {
  name: string;
  team: string;
  goals: number;
  penalties: number;
  ownGoals: number;
  goalDetails: GoalDetail[];
}

interface TopScorersMeta {
  totalGoals: number;
  totalOwnGoals: number;
  totalMatches: number;
  matchesWithScorers: number;
  uniqueScorers: number;
  liveCount: number;
  lastSync: string | null;
  timestamp: string;
}

interface TopScorersResponse {
  success: boolean;
  topScorers: TopScorer[];
  meta: TopScorersMeta;
}

// ──────────────────────────────────────────────────
// Polling intervals
// ──────────────────────────────────────────────────

const POLL_LIVE = 30 * 1000; // 30 seconds during live matches
const POLL_IDLE = 5 * 60 * 1000; // 5 minutes when no live matches

// ──────────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────────

/**
 * Hook that polls /api/scores/top-scorers for live top scorer updates.
 *
 * Smart polling:
 * - Every 30s if there are live matches
 * - Every 5 min if no live matches
 * - Returns cached data between polls
 */
export function useTopScorers() {
  const [topScorers, setTopScorers] = useState<TopScorer[]>([]);
  const [meta, setMeta] = useState<TopScorersMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLive, setHasLive] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchTopScorers = useCallback(async () => {
    try {
      const response = await fetch("/api/scores/top-scorers");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: TopScorersResponse = await response.json();

      if (!isMountedRef.current) return;

      if (data.success) {
        setTopScorers(data.topScorers);
        setMeta(data.meta);
        setHasLive(data.meta.liveCount > 0);
        setError(null);
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      console.warn("[useTopScorers] Fetch failed:", err);
      setError(err?.message || "Failed to fetch top scorers");
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Initial fetch
    fetchTopScorers();

    // Set up polling
    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const interval = hasLive ? POLL_LIVE : POLL_IDLE;

      intervalRef.current = setInterval(() => {
        fetchTopScorers();
      }, interval);
    };

    startPolling();

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchTopScorers, hasLive]);

  return {
    topScorers,
    meta,
    isLoading,
    error,
    hasLive,
    refresh: fetchTopScorers,
  };
}
