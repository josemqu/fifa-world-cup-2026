import { useState } from "react";
import { INITIAL_GROUPS } from "@/data/initialData";
import { GroupCard } from "./GroupCard";
import { Group, Team } from "@/data/types";

export function GroupStage() {
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

  const handleMatchUpdate = (
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {groups.map((group) => (
        <GroupCard
          key={group.name}
          group={group}
          onMatchUpdate={handleMatchUpdate}
        />
      ))}
    </div>
  );
}
