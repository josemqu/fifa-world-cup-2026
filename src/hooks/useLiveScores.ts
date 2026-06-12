"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useTournament } from "@/context/TournamentContext";
import { useAuth } from "@/context/AuthContext";

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

/**
 * Hook that polls /api/scores/sync for live match updates
 * and applies them to the TournamentContext.
 *
 * Smart polling:
 * - Every 3s if mock simulation is active
 * - Every 30s if there are live matches
 * - Every 5 min if no live matches (check if any started)
 * - Disabled if tournament hasn't started or is finished (unless in dev/mock mode)
 */
export function useLiveScores(enabled: boolean = true) {
  const { updateMatch, updateKnockoutMatch } = useTournament();
  const { dbUser, user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [hasLive, setHasLive] = useState(false);
  const [mockActiveState, setMockActiveState] = useState(false);

  const isAdmin = dbUser?.role === "admin";
  const isAllowedEmail = !!(
    user?.email?.toLowerCase().includes("mailjmq") || 
    dbUser?.email?.toLowerCase().includes("mailjmq")
  );
  const isUserAuthorized = isAdmin || isAllowedEmail;

  // Sync state with localStorage on mount and when event fires
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDev = process.env.NODE_ENV === "development";
      const active = (isUserAuthorized || isDev) && window.localStorage.getItem("mock_simulation_active") === "true";
      const timer = setTimeout(() => {
        setMockActiveState(active);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isUserAuthorized]);

  const fetchAndApply = useCallback(async () => {
    try {
      const isDev = process.env.NODE_ENV === "development";
      const isMockActive = (isUserAuthorized || isDev) && typeof window !== "undefined" && window.localStorage.getItem("mock_simulation_active") === "true";
      const url = isMockActive ? "/api/scores/sync?mock=true" : "/api/scores/sync";

      const headers: Record<string, string> = {};
      if (isMockActive) {
        const email = dbUser?.email || user?.email;
        if (email) {
          headers["x-admin-email"] = email;
        }
      }

      const response = await fetch(url, { headers });
      if (!response.ok) return;

      const data: SyncResponse = await response.json();
      if (!data.success || !data.scores.length) return;

      setHasLive(data.meta.liveCount > 0);

      // Apply each score to the tournament context
      for (const score of data.scores) {
        // Only apply if there's actual score data
        if (score.status === "scheduled") continue;

        if (score.stage === "group" && score.groupId) {
          updateMatch(
            score.groupId,
            score.matchId,
            score.homeScore,
            score.awayScore,
            score.status === "finished"
          );
        } else if (score.stage === "knockout") {
          updateKnockoutMatch(
            score.matchId,
            score.homeScore,
            score.awayScore,
            score.homePenalties,
            score.awayPenalties,
            score.status === "finished"
          );
        }
      }
    } catch (error) {
      // Silent fail — next poll will retry
      console.warn("[useLiveScores] Poll failed:", error);
    }
  }, [updateMatch, updateKnockoutMatch, dbUser, user, isUserAuthorized]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleToggle = () => {
        const isDev = process.env.NODE_ENV === "development";
        const active = (isUserAuthorized || isDev) && window.localStorage.getItem("mock_simulation_active") === "true";
        setTimeout(() => {
          setMockActiveState(active);
        }, 0);
      };
      window.addEventListener("mock_sim_toggle", handleToggle);
      return () => {
        window.removeEventListener("mock_sim_toggle", handleToggle);
      };
    }
  }, [isUserAuthorized]);

  useEffect(() => {
    if (!enabled) return;

    // No date restriction, always fetch when enabled to allow mock/live simulation anytime

    // Initial fetch
    const fetchTimer = setTimeout(() => {
      fetchAndApply();
    }, 0);

    // Set up dynamic polling
    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);

      const isDev = process.env.NODE_ENV === "development";
      const currentMockActive = (isUserAuthorized || isDev) && typeof window !== "undefined" && window.localStorage.getItem("mock_simulation_active") === "true";
      const interval = currentMockActive ? 3000 : (hasLive ? POLL_LIVE : POLL_IDLE);

      intervalRef.current = setInterval(() => {
        fetchAndApply();
        
        // Re-evaluate polling speed after each fetch
        const isDev = process.env.NODE_ENV === "development";
        const nextMockActive = (isUserAuthorized || isDev) && typeof window !== "undefined" && window.localStorage.getItem("mock_simulation_active") === "true";
        const newInterval = nextMockActive ? 3000 : (hasLive ? POLL_LIVE : POLL_IDLE);
        if (newInterval !== (nextMockActive ? 3000 : (hasLive ? POLL_LIVE : POLL_IDLE))) {
          startPolling(); // Restart with new interval
        }
      }, interval);
    };

    startPolling();

    return () => {
      clearTimeout(fetchTimer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, fetchAndApply, mockActiveState, hasLive, isUserAuthorized]);

  return {
    hasLive: hasLive,
    refresh: fetchAndApply,
  };
}
