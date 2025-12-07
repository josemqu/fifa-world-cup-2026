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
import {
  R16_MATCHES,
  QF_MATCHES,
  SF_MATCHES,
  FINAL_MATCHES,
} from "@/data/knockoutData";

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
  simulateAll: () => void;
  simulateKnockout: () => void;
}

const TournamentContext = createContext<TournamentContextType | undefined>(
  undefined
);

// Helper to create initial empty knockout structure
const getInitialKnockoutMatches = (): KnockoutMatch[] => {
  const matches: KnockoutMatch[] = [];

  // R16 (89-96)
  R16_MATCHES.forEach((m) => {
    matches.push({
      id: m.id,
      stage: "R16",
      homeTeam: { placeholder: `W${m.home.replace("W", "")}` },
      awayTeam: { placeholder: `W${m.away.replace("W", "")}` },
      nextMatchId: m.next,
    });
  });

  // QF (97-100)
  QF_MATCHES.forEach((m) => {
    matches.push({
      id: m.id,
      stage: "QF",
      homeTeam: { placeholder: `W${m.home.replace("W", "")}` },
      awayTeam: { placeholder: `W${m.away.replace("W", "")}` },
      nextMatchId: m.next,
    });
  });

  // SF (101-102)
  SF_MATCHES.forEach((m) => {
    matches.push({
      id: m.id,
      stage: "SF",
      homeTeam: { placeholder: `W${m.home.replace("W", "")}` },
      awayTeam: { placeholder: `W${m.away.replace("W", "")}` },
      nextMatchId: m.next,
    });
  });

  // Final & 3rd Place (103-104)
  FINAL_MATCHES.forEach((m) => {
    matches.push({
      id: m.id,
      stage: m.id === "103" ? "3rdPlace" : "Final",
      homeTeam: {
        placeholder: m.home.startsWith("W")
          ? `W${m.home.replace("W", "")}`
          : `L${m.home.replace("L", "")}`,
      },
      awayTeam: {
        placeholder: m.away.startsWith("W")
          ? `W${m.away.replace("W", "")}`
          : `L${m.away.replace("L", "")}`,
      },
      nextMatchId: m.next || undefined,
    });
  });

  return matches;
};

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [knockoutMatches, setKnockoutMatches] = useState<KnockoutMatch[]>([]);

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

  const recalculateGroupStats = (group: Group): Group => {
    // Reset stats for all teams
    const newTeams = group.teams.map((team) => ({
      ...team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      pts: 0,
    }));

    // Map for easy access
    const teamMap = new Map<string, Team>();
    newTeams.forEach((t) => teamMap.set(t.id, t));

    // Process matches
    group.matches.forEach((match) => {
      if (
        match.homeScore !== undefined &&
        match.homeScore !== null &&
        match.awayScore !== undefined &&
        match.awayScore !== null
      ) {
        const homeTeam = teamMap.get(match.homeTeamId);
        const awayTeam = teamMap.get(match.awayTeamId);

        if (homeTeam && awayTeam) {
          // Update Played
          homeTeam.played += 1;
          awayTeam.played += 1;

          // Update Goals
          homeTeam.gf += match.homeScore;
          homeTeam.ga += match.awayScore;
          awayTeam.gf += match.awayScore;
          awayTeam.ga += match.homeScore;

          // Update W/D/L and Points
          if (match.homeScore > match.awayScore) {
            homeTeam.won += 1;
            homeTeam.pts += 3;
            awayTeam.lost += 1;
          } else if (match.homeScore < match.awayScore) {
            awayTeam.won += 1;
            awayTeam.pts += 3;
            homeTeam.lost += 1;
          } else {
            homeTeam.drawn += 1;
            homeTeam.pts += 1;
            awayTeam.drawn += 1;
            awayTeam.pts += 1;
          }
        }
      }
    });

    return {
      ...group,
      teams: newTeams,
    };
  };

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

  const simulateAll = () => {
    setGroups((currentGroups) => {
      return currentGroups.map((group) => {
        const updatedMatches = group.matches.map((match) => {
          // Simple random score between 0 and 3
          const homeScore = Math.floor(Math.random() * 4);
          const awayScore = Math.floor(Math.random() * 4);
          return {
            ...match,
            homeScore,
            awayScore,
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
      const newMatches = [...currentMatches];
      // Sort by ID to ensure we process stages in order (R32 -> R16 -> ... -> Final)
      newMatches.sort((a, b) => Number(a.id) - Number(b.id));

      const allStaticMatches = [
        ...R16_MATCHES,
        ...QF_MATCHES,
        ...SF_MATCHES,
        ...FINAL_MATCHES,
      ];

      for (let i = 0; i < newMatches.length; i++) {
        const match = newMatches[i];

        // Only simulate if teams are present
        if (
          match.homeTeam &&
          !("placeholder" in match.homeTeam) &&
          match.awayTeam &&
          !("placeholder" in match.awayTeam)
        ) {
          // Generate random scores
          const homeScore = Math.floor(Math.random() * 4);
          const awayScore = Math.floor(Math.random() * 4);
          match.homeScore = homeScore;
          match.awayScore = awayScore;

          let winner: Team | null = null;
          match.homePenalties = null;
          match.awayPenalties = null;

          if (homeScore > awayScore) {
            winner = match.homeTeam as Team;
          } else if (awayScore > homeScore) {
            winner = match.awayTeam as Team;
          } else {
            // Penalties
            let homePens = 0;
            let awayPens = 0;
            do {
              homePens = Math.floor(Math.random() * 5) + 3;
              awayPens = Math.floor(Math.random() * 5) + 3;
            } while (homePens === awayPens);

            match.homePenalties = homePens;
            match.awayPenalties = awayPens;

            if (homePens > awayPens) winner = match.homeTeam as Team;
            else winner = match.awayTeam as Team;
          }
          match.winner = winner;

          // Propagate to next match
          if (match.nextMatchId) {
            const nextMatchIndex = newMatches.findIndex(
              (m) => m.id === match.nextMatchId
            );
            if (nextMatchIndex !== -1) {
              const nextMatch = newMatches[nextMatchIndex];
              const staticNextMatch = allStaticMatches.find(
                (m) => m.id === match.nextMatchId
              );

              if (staticNextMatch) {
                const isHomeSource =
                  staticNextMatch.home === `W${match.id}` ||
                  staticNextMatch.home === `L${match.id}`;
                const isAwaySource =
                  staticNextMatch.away === `W${match.id}` ||
                  staticNextMatch.away === `L${match.id}`;

                if (winner) {
                  if (isHomeSource) {
                    if (staticNextMatch.home === `L${match.id}`) {
                      const loser =
                        winner.id === (match.homeTeam as Team).id
                          ? match.awayTeam
                          : match.homeTeam;
                      nextMatch.homeTeam = loser as Team;
                    } else {
                      nextMatch.homeTeam = winner;
                    }
                  }
                  if (isAwaySource) {
                    if (staticNextMatch.away === `L${match.id}`) {
                      const loser =
                        winner.id === (match.homeTeam as Team).id
                          ? match.awayTeam
                          : match.homeTeam;
                      nextMatch.awayTeam = loser as Team;
                    } else {
                      nextMatch.awayTeam = winner;
                    }
                  }
                }

                // Reset next match scores for re-simulation (will be picked up later in loop if valid)
                // Actually, since we process in order, the next match is later in the array.
                // We should reset its scores so it can be freshly simulated when the loop reaches it.
                // BUT if we are simulating everything, the loop WILL reach it and overwrite the scores anyway.
                // So strictly speaking we don't need to reset scores here, BUT we need to ensure
                // that when the loop reaches it, it sees the updated teams.
                // Since `nextMatch` is a reference to an object in `newMatches`, modifying it here updates it for the loop.
              }
            }
          }

          // Special handling for SF matches propagating to 3rd Place match (103)
          if (match.id === "101" || match.id === "102") {
            const thirdPlaceMatchId = "103";
            const thirdPlaceIndex = newMatches.findIndex(
              (m) => m.id === thirdPlaceMatchId
            );
            if (thirdPlaceIndex !== -1) {
              const thirdPlaceMatch = newMatches[thirdPlaceIndex];
              const staticThirdPlace = FINAL_MATCHES.find(
                (m) => m.id === thirdPlaceMatchId
              );

              if (staticThirdPlace) {
                const isHomeSource = staticThirdPlace.home === `L${match.id}`;
                const isAwaySource = staticThirdPlace.away === `L${match.id}`;

                if (winner) {
                  const loser =
                    winner.id === (match.homeTeam as Team).id
                      ? match.awayTeam
                      : match.homeTeam;

                  if (isHomeSource) {
                    thirdPlaceMatch.homeTeam = loser as Team;
                  }
                  if (isAwaySource) {
                    thirdPlaceMatch.awayTeam = loser as Team;
                  }
                }
              }
            }
          }
        }
      }

      return newMatches;
    });
  };

  return (
    <TournamentContext.Provider
      value={{
        groups,
        knockoutMatches,
        updateMatch,
        updateKnockoutMatch,
        simulateAll,
        simulateKnockout,
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
