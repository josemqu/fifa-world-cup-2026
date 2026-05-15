"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTournament } from "@/context/TournamentContext";

interface LiveScoreData {
  matchId: string;
  homeScore: number | null;
  awayScore: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
  status: "scheduled" | "live" | "halftime" | "finished";
  elapsed: number | null;
  stage: "group" | "knockout";
  groupId?: string;
}

interface SyncResponse {
  success: boolean;
  scores: LiveScoreData[];
  meta: {
    total: number;
    liveCount: number;
    lastSync: string | null;
  };
}

// Polling intervals (milliseconds)
const POLL_LIVE = 30 * 1000; // 30 seconds during live matches
const POLL_IDLE = 5 * 60 * 1000; // 5 minutes when no live matches
const POLL_DISABLED = 0; // Disabled

/**
 * Hook that polls /api/scores/sync for live match updates
 * and applies them to the TournamentContext.
 *
 * Smart polling:
 * - Every 30s if there are live matches
 * - Every 5 min if no live matches (check if any started)
 * - Disabled if tournament hasn't started or is finished
 */
export function useLiveScores(enabled: boolean = true) {
  const { updateMatch, updateKnockoutMatch } = useTournament();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasLiveRef = useRef(false);

  const fetchAndApply = useCallback(async () => {
    try {
      const response = await fetch("/api/scores/sync");
      if (!response.ok) return;

      const data: SyncResponse = await response.json();
      if (!data.success || !data.scores.length) return;

      hasLiveRef.current = data.meta.liveCount > 0;

      // Apply each score to the tournament context
      for (const score of data.scores) {
        // Only apply if there's actual score data
        if (score.status === "scheduled") continue;

        if (score.stage === "group" && score.groupId) {
          updateMatch(
            score.groupId,
            score.matchId,
            score.homeScore,
            score.awayScore
          );
        } else if (score.stage === "knockout") {
          updateKnockoutMatch(
            score.matchId,
            score.homeScore,
            score.awayScore,
            score.homePenalties,
            score.awayPenalties
          );
        }
      }
    } catch (error) {
      // Silent fail — next poll will retry
      console.warn("[useLiveScores] Poll failed:", error);
    }
  }, [updateMatch, updateKnockoutMatch]);

  useEffect(() => {
    if (!enabled) return;

    // Check if we're in the tournament window
    const now = new Date();
    const tournamentStart = new Date("2026-06-11T00:00:00Z");
    const tournamentEnd = new Date("2026-07-20T00:00:00Z");

    if (now < tournamentStart || now > tournamentEnd) {
      // Outside tournament dates — no polling
      return;
    }

    // Initial fetch
    fetchAndApply();

    // Set up dynamic polling
    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);

      const interval = hasLiveRef.current ? POLL_LIVE : POLL_IDLE;

      intervalRef.current = setInterval(() => {
        fetchAndApply();
        // Re-evaluate polling speed after each fetch
        const newInterval = hasLiveRef.current ? POLL_LIVE : POLL_IDLE;
        if (
          newInterval !==
          (hasLiveRef.current ? POLL_LIVE : POLL_IDLE)
        ) {
          startPolling(); // Restart with new interval
        }
      }, interval);
    };

    startPolling();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, fetchAndApply]);

  return {
    hasLive: hasLiveRef.current,
    refresh: fetchAndApply,
  };
}
