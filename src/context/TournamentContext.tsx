"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Group, Team } from "@/data/types";
import { INITIAL_GROUPS } from "@/data/initialData";

interface TournamentContextType {
  groups: Group[];
  updateMatch: (
    groupId: string,
    matchId: string,
    homeScore: number | null,
    awayScore: number | null
  ) => void;
  simulateAll: () => void;
}

const TournamentContext = createContext<TournamentContextType | undefined>(
  undefined
);

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);

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
  };

  return (
    <TournamentContext.Provider value={{ groups, updateMatch, simulateAll }}>
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
