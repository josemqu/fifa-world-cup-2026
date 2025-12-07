"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { Group, Team, KnockoutMatch } from "@/data/types";
import { INITIAL_GROUPS } from "@/data/initialData";
import { generateR32Matches } from "@/utils/knockoutUtils";
import { fetchFifaRankings, getRankingForTeam } from "@/utils/rankingUtils";
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
} from "@/utils/simulationUtils";

// Helper functions for simulation
const poisson = (lambda: number): number => {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
};

const predictMatchScore = (
  homeRank: number = 50,
  awayRank: number = 50
): { home: number; away: number } => {
  const diff = awayRank - homeRank; // Positive if home is better (lower rank)
  const factor = 0.02; // Tuning factor for strength difference

  // Base expected goals ~1.4 per team
  let homeLambda = 1.4 + diff * factor;
  let awayLambda = 1.4 - diff * factor;

  // Clamp values to be realistic
  homeLambda = Math.max(0.2, Math.min(5.0, homeLambda));
  awayLambda = Math.max(0.2, Math.min(5.0, awayLambda));

  return {
    home: poisson(homeLambda),
    away: poisson(awayLambda),
  };
};

interface TournamentContextType {
  groups: Group[];
  knockoutMatches: KnockoutMatch[];
  updateMatch: (
    groupId: string,
    matchId: string,
    homeScore: number | null,
    awayScore: number | null
  ) => void;
  updateKnockoutMatch: (
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    homePenalties?: number | null,
    awayPenalties?: number | null
  ) => void;
  simulateGroups: () => void;
  simulateKnockout: () => void;
  simulateAll: () => void;
}

const TournamentContext = createContext<TournamentContextType | undefined>(
  undefined
);

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [knockoutMatches, setKnockoutMatches] = useState<KnockoutMatch[]>([]);

  // Fetch live rankings
  useEffect(() => {
    const loadRankings = async () => {
      const rankings = await fetchFifaRankings();
      if (Object.keys(rankings).length > 0) {
        setGroups((currentGroups) =>
          currentGroups.map((group) => ({
            ...group,
            teams: group.teams.map((team) => {
              const newRank = getRankingForTeam(team.name, rankings);
              return newRank ? { ...team, ranking: newRank } : team;
            }),
          }))
        );
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
      const nonR32 = currentMatches.filter((m) => m.stage !== "R32");
      return [...updatedR32, ...nonR32].sort(
        (a, b) => Number(a.id) - Number(b.id)
      );
    });
  }, [groups]);

  const updateMatch = (
    groupId: string,
    matchId: string,
    homeScore: number | null,
    awayScore: number | null
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
    awayPenalties: number | null = null
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
          (m) => m.id === match.nextMatchId
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
            (m) => m.id === match.nextMatchId
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
          (m) => m.id === thirdPlaceMatchId
        );
        if (thirdPlaceIndex !== -1) {
          const thirdPlaceMatch = { ...newMatches[thirdPlaceIndex] };
          const staticThirdPlace = FINAL_MATCHES.find(
            (m) => m.id === thirdPlaceMatchId
          );

          if (staticThirdPlace) {
            const isHomeSource = staticThirdPlace.home === `L${matchId}`;
            const isAwaySource = staticThirdPlace.away === `L${matchId}`;

            if (winner) {
              const loser =
                winner.id === (match.homeTeam as Team).id
                  ? match.awayTeam
                  : match.homeTeam;

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
          // if (match.finished) return match; // Allow re-simulation

          const homeTeam = group.teams.find((t) => t.id === match.homeTeamId);
          const awayTeam = group.teams.find((t) => t.id === match.awayTeamId);

          const { home, away } = predictMatchScore(
            homeTeam?.ranking,
            awayTeam?.ranking
          );

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
    setKnockoutMatches([]);
  };

  const simulateKnockout = () => {
    setKnockoutMatches((currentMatches) => {
      return runKnockoutSimulation(currentMatches);
    });
  };

  const simulateAll = () => {
    // 1. Simulate Groups locally (respecting existing results)
    const simulatedGroups = groups.map((group) => {
      const updatedMatches = group.matches.map((match) => {
        // if (match.finished) return match; // Allow re-simulation

        const homeTeam = group.teams.find((t) => t.id === match.homeTeamId);
        const awayTeam = group.teams.find((t) => t.id === match.awayTeamId);

        const { home, away } = predictMatchScore(
          homeTeam?.ranking,
          awayTeam?.ranking
        );

        return {
          ...match,
          homeScore: home,
          awayScore: away,
          finished: true,
        };
      });

      return recalculateGroupStats({ ...group, matches: updatedMatches });
    });

    // 2. Generate R32 Matches
    const r32 = generateR32Matches(simulatedGroups).map((m) => ({
      ...m,
      stage: "R32" as const,
    }));

    // 3. Create Full Knockout Structure (R32 + initial empty R16-Final)
    const initialKnockout = getInitialKnockoutMatches();
    // Merge: R32 from generator + initial empty stages
    const allMatches = [...r32, ...initialKnockout].sort(
      (a, b) => Number(a.id) - Number(b.id)
    );

    // 4. Run Knockout Simulation
    // We also want to respect existing knockout matches if they are valid?
    // For simplicity in "Simulate All", we usually re-sim knockout because the tree might change significantly if groups changed.
    // However, if the user wants to "Simulate the Rest", we might want to keep finished knockout matches IF the teams match.
    // But since group results might change the teams in the bracket, it's safer to re-simulate knockout from scratch
    // OR at least re-evaluate the tree.
    // Given the requirement is about group dependency, ensuring groups are *complete* is key.
    // For now, we will re-simulate the knockout stage entirely to ensure consistency with the new group results.
    const simulatedKnockoutMatches = runKnockoutSimulation(allMatches);

    // 5. Update State
    setGroups(simulatedGroups);
    setKnockoutMatches(simulatedKnockoutMatches);
  };

  return (
    <TournamentContext.Provider
      value={{
        groups,
        knockoutMatches,
        updateMatch,
        updateKnockoutMatch,
        simulateGroups,
        simulateKnockout,
        simulateAll,
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
