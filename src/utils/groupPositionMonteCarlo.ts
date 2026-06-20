import { Group, Team, Match } from "@/data/types";
import { sortGroupTeams } from "@/utils/groupSorting";
import {
  predictMatchScore,
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

    // Check if all matches are already played
    const allPlayed = group.matches.every(
      (m) => m.homeScore != null && m.awayScore != null
    );

    if (allPlayed) {
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
      // Clone matches, simulating unplayed ones
      const simulatedMatches = group.matches.map((m) => {
        const isPlayed = m.homeScore != null && m.awayScore != null;
        if (isPlayed) return { ...m, finished: true };

        const homeTeam = group.teams.find((t) => t.id === m.homeTeamId);
        const awayTeam = group.teams.find((t) => t.id === m.awayTeamId);

        const { home, away } = predictMatchScore(
          homeTeam ?? {},
          awayTeam ?? {}
        );

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
