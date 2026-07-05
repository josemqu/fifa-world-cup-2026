"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useTournament } from "@/context/TournamentContext";
import { useAuth } from "@/context/AuthContext";

import { Scorer } from "@/data/types";

interface LiveScoreData {
  matchId: string;
  homeScore: number | null;
  awayScore: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
  homeScorers?: Scorer[];
  awayScorers?: Scorer[];
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
export interface GoalNotificationInfo {
  id: string;
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  scoringTeam: "home" | "away";
  newScore: { home: number; away: number };
  scorerName?: string;
  minute?: string;
  isPenalty?: boolean;
  isOwnGoal?: boolean;
}

// Helper to find the scorer that was just added
const getNewScorer = (newScorers?: Scorer[], oldScorers?: Scorer[]): Scorer | undefined => {
  if (!newScorers || newScorers.length === 0) return undefined;
  if (!oldScorers || oldScorers.length === 0) return newScorers[newScorers.length - 1];
  
  const newOne = newScorers.find(ns => 
    !oldScorers.some(os => os.name === ns.name && os.minute === ns.minute)
  );
  return newOne || newScorers[newScorers.length - 1];
};

function getTeamNameFromKnockout(team: any): string {
  if (!team) return "Por definir";
  if ("placeholder" in team) return team.placeholder;
  return team.name;
}

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
export function useLiveScores(
  enabled: boolean = true,
  onGoalScored?: (info: GoalNotificationInfo) => void
) {
  const { updateMatch, updateKnockoutMatch, groups, knockoutMatches } = useTournament();
  const { dbUser, user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [hasLive, setHasLive] = useState(false);
  const [mockActiveState, setMockActiveState] = useState(false);

  const stateRef = useRef({ groups, knockoutMatches });
  useEffect(() => {
    stateRef.current = { groups, knockoutMatches };
  }, [groups, knockoutMatches]);

  const onGoalScoredRef = useRef(onGoalScored);
  useEffect(() => {
    onGoalScoredRef.current = onGoalScored;
  }, [onGoalScored]);

  const previousScoresRef = useRef<Record<string, {
    home: number;
    away: number;
    homeScorers: Scorer[];
    awayScorers: Scorer[];
  }>>({});

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

  const findTeamNames = useCallback((matchId: string, stage: "group" | "knockout", groupId?: string) => {
    let homeTeamName = "Local";
    let awayTeamName = "Visitante";

    if (stage === "group" && groupId) {
      const group = stateRef.current.groups.find(g => g.name === groupId);
      const match = group?.matches.find(m => m.id === matchId);
      if (match) {
        const homeTeam = group?.teams.find(t => t.id === match.homeTeamId);
        const awayTeam = group?.teams.find(t => t.id === match.awayTeamId);
        homeTeamName = homeTeam?.name || match.homeTeamId;
        awayTeamName = awayTeam?.name || match.awayTeamId;
      }
    } else {
      const match = stateRef.current.knockoutMatches.find(m => m.id === matchId);
      if (match) {
        homeTeamName = getTeamNameFromKnockout(match.homeTeam);
        awayTeamName = getTeamNameFromKnockout(match.awayTeam);
      }
    }

    return { homeTeamName, awayTeamName };
  }, []);

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

        const currentHome = score.homeScore ?? 0;
        const currentAway = score.awayScore ?? 0;
        const prev = previousScoresRef.current[score.matchId];

        if (!prev) {
          // Initialize for this match
          previousScoresRef.current[score.matchId] = {
            home: currentHome,
            away: currentAway,
            homeScorers: score.homeScorers || [],
            awayScorers: score.awayScorers || [],
          };
        } else {
          const prevHome = prev.home;
          const prevAway = prev.away;
          
          let goalScored = false;
          let scoringTeam: "home" | "away" | null = null;
          
          if (currentHome > prevHome) {
            goalScored = true;
            scoringTeam = "home";
          } else if (currentAway > prevAway) {
            goalScored = true;
            scoringTeam = "away";
          }
          
          if (goalScored && scoringTeam) {
            const { homeTeamName, awayTeamName } = findTeamNames(score.matchId, score.stage, score.groupId);
            
            // Get scorer info
            const newScorers = scoringTeam === "home" ? score.homeScorers : score.awayScorers;
            const oldScorers = scoringTeam === "home" ? prev.homeScorers : prev.awayScorers;
            const newScorer = getNewScorer(newScorers, oldScorers);
            
            if (onGoalScoredRef.current) {
              onGoalScoredRef.current({
                id: `${score.matchId}-${Date.now()}-${Math.random()}`,
                matchId: score.matchId,
                homeTeamName,
                awayTeamName,
                scoringTeam,
                newScore: { home: currentHome, away: currentAway },
                scorerName: newScorer?.name,
                minute: newScorer?.minute || (score.elapsed ? `${score.elapsed}'` : undefined),
                isPenalty: newScorer?.isPenalty,
                isOwnGoal: newScorer?.isOwnGoal,
              });
            }
          }
          
          // Update ref
          previousScoresRef.current[score.matchId] = {
            home: currentHome,
            away: currentAway,
            homeScorers: score.homeScorers || [],
            awayScorers: score.awayScorers || [],
          };
        }

        if (score.stage === "group" && score.groupId) {
          updateMatch(
            score.groupId,
            score.matchId,
            score.homeScore,
            score.awayScore,
            score.status === "finished",
            score.status,
            score.elapsed,
            score.homeScorers,
            score.awayScorers,
            true // isLiveUpdate
          );
        } else if (score.stage === "knockout") {
          updateKnockoutMatch(
            score.matchId,
            score.homeScore,
            score.awayScore,
            score.homePenalties,
            score.awayPenalties,
            score.status === "finished",
            score.status,
            score.elapsed,
            score.homeScorers,
            score.awayScorers,
            true // isLiveUpdate
          );
        }
      }
    } catch (error) {
      // Silent fail — next poll will retry
      console.warn("[useLiveScores] Poll failed:", error);
    }
  }, [updateMatch, updateKnockoutMatch, dbUser, user, isUserAuthorized, findTeamNames]);

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
