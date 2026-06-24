import { Group, Team, Match } from "@/data/types";
import { sortGroupTeams } from "@/utils/groupSorting";
import {
  predictMatchScore,
  predictMatchScoreRemaining,
  recalculateGroupStats,
} from "@/utils/simulationUtils";

/**
 * For each team in a group, stores the probability of finishing in each position.
 * Index 0 = probability of 1st place, index 1 = 2nd, etc.
 */
export type PositionProbabilities = number[];

/**
 * Map from teamId -> [P(1st), P(2nd), P(3rd), P(4th)]
 */
export type GroupPositionProbMap = Map<string, PositionProbabilities>;

/**
 * Map from groupName -> GroupPositionProbMap
 */
export type AllGroupPositionProbs = Map<string, GroupPositionProbMap>;

function sortTeams(teams: Team[], matches: Match[]): Team[] {
  return sortGroupTeams(teams, matches);
}

/**
 * Runs a Monte Carlo simulation over the remaining matches of each group to
 * estimate how likely each team is to finish in each position (1st–4th).
 *
 * Already-played matches (homeScore != null && awayScore != null) are respected;
 * only unplayed matches are simulated via Poisson prediction.
 */
export function estimateGroupPositionProbabilities(
  groups: Group[],
  iterations: number = 1200
): AllGroupPositionProbs {
  const allProbs: AllGroupPositionProbs = new Map();

  for (const group of groups) {
    const teamCount = group.teams.length;
    // Counts: teamId -> position -> count
    const counts = new Map<string, number[]>();
    group.teams.forEach((t) => counts.set(t.id, new Array(teamCount).fill(0)));

    // Check if all matches are already finished
    const allFinished = group.matches.every(
      (m) => m.finished === true || m.status === "finished"
    );

    if (allFinished) {
      // Deterministic – just use the current standings
      const sorted = sortTeams(group.teams, group.matches);
      const probMap: GroupPositionProbMap = new Map();
      sorted.forEach((t, idx) => {
        const probs = new Array(teamCount).fill(0);
        probs[idx] = 1;
        probMap.set(t.id, probs);
      });
      allProbs.set(group.name, probMap);
      continue;
    }

    for (let i = 0; i < iterations; i++) {
      // Clone matches, simulating incomplete ones
      const simulatedMatches = group.matches.map((m) => {
        const isFinished = m.finished === true || m.status === "finished";
        if (isFinished) return { ...m, finished: true };

        const homeTeam = group.teams.find((t) => t.id === m.homeTeamId);
        const awayTeam = group.teams.find((t) => t.id === m.awayTeamId);

        const isLive = m.status === "live" || m.status === "halftime";
        let home: number;
        let away: number;

        if (isLive) {
          const currentHome = m.homeScore ?? 0;
          const currentAway = m.awayScore ?? 0;
          const elapsed = m.elapsed ?? (m.status === "halftime" ? 45 : 0);
          const remaining = predictMatchScoreRemaining(
            homeTeam ?? {},
            awayTeam ?? {},
            currentHome,
            currentAway,
            elapsed
          );
          home = remaining.home;
          away = remaining.away;
        } else {
          const simulated = predictMatchScore(
            homeTeam ?? {},
            awayTeam ?? {}
          );
          home = simulated.home;
          away = simulated.away;
        }

        return {
          ...m,
          homeScore: home,
          awayScore: away,
          finished: true,
        };
      });

      const clonedGroup: Group = {
        ...group,
        teams: group.teams.map((t) => ({ ...t })),
        matches: simulatedMatches,
      };

      const recalculated = recalculateGroupStats(clonedGroup);
      const sorted = sortTeams(recalculated.teams, recalculated.matches);

      sorted.forEach((team, position) => {
        const teamCounts = counts.get(team.id);
        if (teamCounts) {
          teamCounts[position]++;
        }
      });
    }

    // Convert counts to probabilities
    const probMap: GroupPositionProbMap = new Map();
    counts.forEach((positionCounts, teamId) => {
      probMap.set(
        teamId,
        positionCounts.map((c) => c / iterations)
      );
    });
    allProbs.set(group.name, probMap);
  }

  return allProbs;
}
