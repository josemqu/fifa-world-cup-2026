"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
} from "react";
import { Group, Team, KnockoutMatch } from "@/data/types";
import { INITIAL_GROUPS } from "@/data/initialData";
import { generateR32Matches } from "@/utils/knockoutUtils";
import { fetchFifaRankings, getRankingDataForTeam } from "@/utils/rankingUtils";
import {
  R16_MATCHES,
  QF_MATCHES,
  SF_MATCHES,
  FINAL_MATCHES,
} from "@/data/knockoutData";
import {
  getInitialKnockoutMatches,
  runKnockoutSimulation,
  recalculateGroupStats,
  predictMatchScore,
  simulateTournament,
} from "@/utils/simulationUtils";

interface TournamentContextType {
  groups: Group[];
  knockoutMatches: KnockoutMatch[];
  updateMatch: (
    groupId: string,
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
  ) => void;
  updateKnockoutMatch: (
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    homePenalties?: number | null,
    awayPenalties?: number | null,
  ) => void;
  simulateGroups: () => void;
  simulateKnockout: () => void;
  simulateAll: () => void;
  resetTournament: () => void;
}

const TournamentContext = createContext<TournamentContextType | undefined>(
  undefined,
);

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [knockoutMatches, setKnockoutMatches] = useState<KnockoutMatch[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [probabilities, setProbabilities] = useState<Map<string, any>>(
    new Map(),
  );

  // Fetch live rankings
  useEffect(() => {
    const loadRankings = async () => {
      const rankings = await fetchFifaRankings();
      if (Object.keys(rankings).length > 0) {
        setGroups((currentGroups) => {
          // If we are resetting, we might want to preserve the ranking data?
          // The effect runs on mount.
          // When we reset, we setGroups(INITIAL_GROUPS).
          // But INITIAL_GROUPS doesn't have rankings if they were fetched dynamically.
          // We should probably re-apply rankings if possible, or just accept they might be lost until refresh?
          // Actually, we can just re-map rankings here if we want, or just rely on this effect not running again unless component remounts?
          // No, this effect runs ONCE on mount.
          // If I resetGroups(INITIAL_GROUPS), the new state won't have rankings.
          // I should fix resetTournament to re-apply rankings if I have them?
          // For now, let's just reset to INITIAL_GROUPS. The user can refresh if they strictly need live rankings again, or we can improve later.
          // actually, checking currentGroups is safe.
          return currentGroups.map((group) => ({
            ...group,
            teams: group.teams.map((team) => {
              const data = getRankingDataForTeam(team.name, rankings);
              return data
                ? { ...team, ranking: data.rank, fifaPoints: data.points }
                : team;
            }),
          }));
        });
      }
    };
    loadRankings();
  }, []);

  // Initialize/Update R32 matches when groups change
  useEffect(() => {
    const r32 = generateR32Matches(groups);

    setKnockoutMatches((prev) => {
      // If first run, merge with initial structure
      const currentMatches =
        prev.length > 0 ? prev : getInitialKnockoutMatches();

      // Update R32 matches
      // We need to preserve scores if the teams haven't changed
      const updatedR32 = r32.map((newMatch) => {
        const existing = prev.find((m) => m.id === newMatch.id);

        // Check if teams changed
        const homeChanged =
          JSON.stringify(existing?.homeTeam) !==
          JSON.stringify(newMatch.homeTeam);
        const awayChanged =
          JSON.stringify(existing?.awayTeam) !==
          JSON.stringify(newMatch.awayTeam);

        if (existing && !homeChanged && !awayChanged) {
          return {
            ...newMatch,
            ...existing,
            homeTeam: newMatch.homeTeam,
            awayTeam: newMatch.awayTeam,
          };
        }

        // If teams changed, reset score
        return {
          ...newMatch,
          stage: "R32",
          homeScore: null,
          awayScore: null,
          winner: null,
        } as KnockoutMatch;
      });

      // Filter out old R32s and add new ones
      const nonR32 = currentMatches
        .filter((m) => m.stage !== "R32")
        .map((m) => {
          const allDefs = [
            ...R16_MATCHES,
            ...QF_MATCHES,
            ...SF_MATCHES,
            ...FINAL_MATCHES,
          ];
          const def = allDefs.find((d) => d.id === m.id);
          if (def) {
            return {
              ...m,
              // @ts-ignore
              date: def.date,
              // @ts-ignore
              time: def.time,
              // @ts-ignore
              location: def.location,
            };
          }
          return m;
        });

      return [...updatedR32, ...nonR32].sort(
        (a, b) => Number(a.id) - Number(b.id),
      );
    });
  }, [groups]);

  // Probability Calculation Effect
  useEffect(() => {
    const runProbabilityCalc = async () => {
      // Import dynamically to avoid circular dependencies if any, though imports are top-level
      const { calculateKnockoutProbabilities } =
        await import("@/utils/probabilityUtils");

      // We run probability calculation if there are matches
      // The util handles skipping simulation for finished matches, effectively giving 100% prob
      if (groups.length > 0) {
        const newProbabilities = await calculateKnockoutProbabilities(
          groups,
          knockoutMatches,
        );
        setProbabilities(newProbabilities);
      }
    };

    const timer = setTimeout(runProbabilityCalc, 500);
    return () => clearTimeout(timer);
  }, [groups, knockoutMatches]);

  const updateMatch = (
    groupId: string,
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
  ) => {
    setGroups((currentGroups) => {
      return currentGroups.map((group) => {
        if (group.name !== groupId) return group;

        // Update match in the group
        const updatedMatches = group.matches.map((match) => {
          if (match.id !== matchId) return match;
          return {
            ...match,
            homeScore: homeScore,
            awayScore: awayScore,
            finished: homeScore !== null && awayScore !== null,
          };
        });

        const updatedGroup = { ...group, matches: updatedMatches };
        return recalculateGroupStats(updatedGroup);
      });
    });
  };

  const updateKnockoutMatch = (
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    homePenalties: number | null = null,
    awayPenalties: number | null = null,
  ) => {
    setKnockoutMatches((currentMatches) => {
      let newMatches = [...currentMatches];
      const matchIndex = newMatches.findIndex((m) => m.id === matchId);
      if (matchIndex === -1) return currentMatches;

      const match = { ...newMatches[matchIndex] };
      match.homeScore = homeScore;
      match.awayScore = awayScore;
      match.homePenalties = homePenalties;
      match.awayPenalties = awayPenalties;

      // Determine winner
      let winner: Team | null = null;
      if (homeScore !== null && awayScore !== null) {
        if (
          match.homeTeam &&
          !("placeholder" in match.homeTeam) &&
          match.awayTeam &&
          !("placeholder" in match.awayTeam)
        ) {
          if (homeScore > awayScore) {
            winner = match.homeTeam as Team;
          } else if (awayScore > homeScore) {
            winner = match.awayTeam as Team;
          } else if (homePenalties !== null && awayPenalties !== null) {
            // Penalties tie-breaker
            if (homePenalties > awayPenalties) {
              winner = match.homeTeam as Team;
            } else if (awayPenalties > homePenalties) {
              winner = match.awayTeam as Team;
            }
          }
        }
      }
      match.winner = winner;
      newMatches[matchIndex] = match;

      // Propagate to next match
      if (match.nextMatchId) {
        const nextMatchIndex = newMatches.findIndex(
          (m) => m.id === match.nextMatchId,
        );
        if (nextMatchIndex !== -1) {
          const nextMatch = { ...newMatches[nextMatchIndex] };
          const allStaticMatches = [
            ...R16_MATCHES,
            ...QF_MATCHES,
            ...SF_MATCHES,
            ...FINAL_MATCHES,
          ];
          const staticNextMatch = allStaticMatches.find(
            (m) => m.id === match.nextMatchId,
          );

          if (staticNextMatch) {
            const isHomeSource =
              staticNextMatch.home === `W${matchId}` ||
              staticNextMatch.home === `L${matchId}`;
            const isAwaySource =
              staticNextMatch.away === `W${matchId}` ||
              staticNextMatch.away === `L${matchId}`;

            if (winner) {
              if (isHomeSource) {
                if (staticNextMatch.home === `L${matchId}`) {
                  const loser =
                    winner.id === (match.homeTeam as Team).id
                      ? match.awayTeam
                      : match.homeTeam;
                  nextMatch.homeTeam = (loser as Team) || {
                    placeholder: `L${matchId}`,
                  };
                } else {
                  nextMatch.homeTeam = winner;
                }
              }
              if (isAwaySource) {
                if (staticNextMatch.away === `L${matchId}`) {
                  const loser =
                    winner.id === (match.homeTeam as Team).id
                      ? match.awayTeam
                      : match.homeTeam;
                  nextMatch.awayTeam = (loser as Team) || {
                    placeholder: `L${matchId}`,
                  };
                } else {
                  nextMatch.awayTeam = winner;
                }
              }
            } else {
              // Revert to placeholder if winner is removed
              if (isHomeSource) {
                const ph = staticNextMatch.home.startsWith("W")
                  ? `W${matchId}`
                  : `L${matchId}`;
                nextMatch.homeTeam = { placeholder: ph };
              }
              if (isAwaySource) {
                const ph = staticNextMatch.away.startsWith("W")
                  ? `W${matchId}`
                  : `L${matchId}`;
                nextMatch.awayTeam = { placeholder: ph };
              }
            }

            // Reset score/winner of next match if teams changed (or were reset)
            nextMatch.homeScore = null;
            nextMatch.awayScore = null;
            nextMatch.homePenalties = null;
            nextMatch.awayPenalties = null;
            nextMatch.winner = null;

            newMatches[nextMatchIndex] = nextMatch;
          }
        }
      }

      // Special handling for SF matches propagating to 3rd Place match (103)
      if (matchId === "101" || matchId === "102") {
        const thirdPlaceMatchId = "103";
        const thirdPlaceIndex = newMatches.findIndex(
          (m) => m.id === thirdPlaceMatchId,
        );
        if (thirdPlaceIndex !== -1) {
          const thirdPlaceMatch = { ...newMatches[thirdPlaceIndex] };
          const staticThirdPlace = FINAL_MATCHES.find(
            (m) => m.id === thirdPlaceMatchId,
          );

          if (staticThirdPlace) {
            const isHomeSource = staticThirdPlace.home === `L${matchId}`;
            const isAwaySource = staticThirdPlace.away === `L${matchId}`;

            if (winner) {
              const loser =
                winner.id === (match.homeTeam as Team).id
                  ? match.awayTeam
                  : match.homeTeam;

              // Debug log for 3rd place propagation
              console.log("[TournamentContext] 3rd Place Propagation:", {
                matchId: match.id,
                winner: winner.name,
                loser:
                  loser && !("placeholder" in loser)
                    ? (loser as Team).name
                    : "Placeholder",
                isHomeSource,
                isAwaySource,
              });

              if (isHomeSource) {
                thirdPlaceMatch.homeTeam = (loser as Team) || {
                  placeholder: `L${matchId}`,
                };
              }
              if (isAwaySource) {
                thirdPlaceMatch.awayTeam = (loser as Team) || {
                  placeholder: `L${matchId}`,
                };
              }
            } else {
              if (isHomeSource) {
                thirdPlaceMatch.homeTeam = { placeholder: `L${matchId}` };
              }
              if (isAwaySource) {
                thirdPlaceMatch.awayTeam = { placeholder: `L${matchId}` };
              }
            }

            // Reset score/winner of 3rd place match
            thirdPlaceMatch.homeScore = null;
            thirdPlaceMatch.awayScore = null;
            thirdPlaceMatch.homePenalties = null;
            thirdPlaceMatch.awayPenalties = null;
            thirdPlaceMatch.winner = null;

            newMatches[thirdPlaceIndex] = thirdPlaceMatch;
          }
        }
      }

      return newMatches;
    });
  };

  const simulateGroups = () => {
    setGroups((currentGroups) => {
      return currentGroups.map((group) => {
        const updatedMatches = group.matches.map((match) => {
          if (match.finished) return match;

          const homeTeam = group.teams.find((t) => t.id === match.homeTeamId);
          const awayTeam = group.teams.find((t) => t.id === match.awayTeamId);

          const { home, away } = predictMatchScore(homeTeam, awayTeam);

          return {
            ...match,
            homeScore: home,
            awayScore: away,
            finished: true,
          };
        });

        return recalculateGroupStats({ ...group, matches: updatedMatches });
      });
    });
  };

  const simulateKnockout = () => {
    setKnockoutMatches((currentMatches) => {
      return runKnockoutSimulation(currentMatches);
    });
  };

  const simulateAll = () => {
    const result = simulateTournament(groups, knockoutMatches);
    setGroups(result.groups);
    setKnockoutMatches(result.knockoutMatches);
  };

  const resetTournament = () => {
    setGroups((currentGroups) => {
      return currentGroups.map((group) => {
        // Reset matches
        const resetMatches = group.matches.map((match) => ({
          ...match,
          homeScore: null,
          awayScore: null,
          finished: false,
        }));
        // Recalculate stats (which will zero them out)
        return recalculateGroupStats({ ...group, matches: resetMatches });
      });
    });
    setKnockoutMatches([]);
  };

  const exposedKnockoutMatches = useMemo(() => {
    return knockoutMatches.map((m) => {
      const prob = probabilities.get(m.id);
      if (prob) {
        return { ...m, probabilisticData: prob };
      }
      return m;
    });
  }, [knockoutMatches, probabilities]);

  return (
    <TournamentContext.Provider
      value={{
        groups,
        knockoutMatches: exposedKnockoutMatches,
        updateMatch,
        updateKnockoutMatch,
        simulateGroups,
        simulateKnockout,
        simulateAll,
        resetTournament,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error("useTournament must be used within a TournamentProvider");
  }
  return context;
}
