import { Group, Team, Match } from "@/data/types";
import { recalculateGroupStats, predictMatchScore } from "@/utils/simulationUtils";

// Number of Monte Carlo simulations to run per group analysis.
// Higher = more accurate but slower. 1000 is a good balance for real-time UI.
const MONTE_CARLO_ITERATIONS = 1000;

export interface TeamAnalysis {
  minRank: number;
  maxRank: number;
  isQualified: boolean; // Guaranteed Top 2 (no counterexample found in N simulations)
  isPositionLocked: boolean; // Fixed position (e.g. guaranteed 1st, or guaranteed 4th)
  isGuaranteedQualified: boolean; // Guaranteed to qualify to R32 (Top 2 or Best Third)
}

export const analyzeGroup = (
  group: Group,
  iterations: number = MONTE_CARLO_ITERATIONS
): Record<string, TeamAnalysis> => {
  const playedMatches = group.matches.filter(
    (m) => m.homeScore != null && m.awayScore != null
  );

  if (playedMatches.length === 0) {
    const result: Record<string, TeamAnalysis> = {};
    const teamCount = group.teams.length;
    group.teams.forEach((t) => {
      result[t.id] = {
        minRank: 1,
        maxRank: teamCount,
        isQualified: false,
        isPositionLocked: false,
        isGuaranteedQualified: false,
      };
    });
    return result;
  }

  // Find unplayed matches
  const unplayedMatches = group.matches.filter(
    (m) => m.homeScore == null || m.awayScore == null
  );

  // If no matches are unplayed, the current standing is the final result
  if (unplayedMatches.length === 0) {
    const currentStandings = getStandings(group);
    const result: Record<string, TeamAnalysis> = {};
    currentStandings.forEach((team, index) => {
      const rank = index + 1;
      result[team.id] = {
        minRank: rank,
        maxRank: rank,
        isQualified: rank <= 2,
        isPositionLocked: true,
        isGuaranteedQualified: rank <= 2,
      };
    });
    return result;
  }

  // Build a team lookup map for the unplayed matches so we can pass
  // ranking/fifaPoints to predictMatchScore
  const teamMap = new Map<string, Team>();
  group.teams.forEach((t) => teamMap.set(t.id, t));

  // Track min/max rank for each team across all Monte Carlo simulations
  const teamStats: Record<string, { min: number; max: number }> = {};
  group.teams.forEach((t) => {
    teamStats[t.id] = { min: group.teams.length + 1, max: 0 };
  });

  for (let i = 0; i < iterations; i++) {
    // Generate a random scenario for all unplayed matches using Poisson model
    const scenarioMatches = generateMonteCarloScenario(unplayedMatches, teamMap);

    // Apply scenario and compute standings
    const simulatedGroup = applyScenario(group, scenarioMatches);
    const standings = getStandings(simulatedGroup);

    standings.forEach((team, index) => {
      const rank = index + 1;
      const stats = teamStats[team.id];
      if (rank < stats.min) stats.min = rank;
      if (rank > stats.max) stats.max = rank;
    });
  }

  const result: Record<string, TeamAnalysis> = {};
  group.teams.forEach((t) => {
    const stats = teamStats[t.id];
    result[t.id] = {
      minRank: stats.min,
      maxRank: stats.max,
      // Qualified only if the team never dropped below 2nd place
      // across ALL Monte Carlo simulations (no counterexample found)
      isQualified: stats.max <= 2,
      isPositionLocked: stats.min === stats.max,
      isGuaranteedQualified: stats.max <= 2,
    };
  });

  return result;
};

/**
 * Analyze ALL groups together via Monte Carlo to determine which third-place
 * teams are guaranteed to qualify as "best thirds" (top 8 of 12 thirds).
 *
 * Counterexample approach: a third-place team is only marked as qualified if
 * it finishes in the top 8 thirds in EVERY simulation. If there is even one
 * simulation where it falls outside the top 8, it is NOT marked as qualified.
 *
 * Returns a Set<string> of team IDs that are guaranteed to qualify as best thirds.
 */
export function analyzeQualifiedThirds(
  groups: Group[],
  iterations: number = MONTE_CARLO_ITERATIONS
): Set<string> {
  // If no groups have any matches played, nobody qualifies
  const anyPlayed = groups.some((g) =>
    g.matches.some((m) => m.homeScore != null && m.awayScore != null)
  );
  if (!anyPlayed) return new Set<string>();

  // Build team lookup maps per group
  const groupTeamMaps = new Map<string, Map<string, Team>>();
  groups.forEach((g) => {
    const teamMap = new Map<string, Team>();
    g.teams.forEach((t) => teamMap.set(t.id, t));
    groupTeamMaps.set(g.name, teamMap);
  });

  // Track: for each team, the worst ranking among thirds across all simulations
  // A team qualifies only if it's ALWAYS in top 8 (worstThirdRank <= 8)
  const worstThirdRank = new Map<string, number>();
  // Also track if a team ever fails to be 3rd in its group (then it's not a "third")
  const everNotThird = new Set<string>();
  // Track all team IDs that were ever 3rd in their group
  const allThirdCandidates = new Set<string>();

  // Check which groups are fully played (deterministic results)
  const groupFullyPlayed = new Map<string, boolean>();
  groups.forEach((g) => {
    const allPlayed = g.matches.every(
      (m) => m.homeScore != null && m.awayScore != null
    );
    groupFullyPlayed.set(g.name, allPlayed);
  });

  for (let i = 0; i < iterations; i++) {
    // Simulate all groups
    const thirdPlaceTeams: Team[] = [];

    for (const group of groups) {
      const teamMap = groupTeamMaps.get(group.name)!;
      let simulatedGroup: Group;

      if (groupFullyPlayed.get(group.name)) {
        // No simulation needed — use actual results
        simulatedGroup = group;
      } else {
        const unplayedMatches = group.matches.filter(
          (m) => m.homeScore == null || m.awayScore == null
        );
        const scenarioMatches = generateMonteCarloScenario(unplayedMatches, teamMap);
        simulatedGroup = applyScenario(group, scenarioMatches);
      }

      const standings = getStandings(simulatedGroup);
      if (standings[2]) {
        thirdPlaceTeams.push(standings[2]);
        allThirdCandidates.add(standings[2].id);
      }
    }

    // Sort thirds and determine top 8
    const sortedThirds = sortThirdPlaceTeams(thirdPlaceTeams);

    // Record the rank for each third-place team in this simulation
    sortedThirds.forEach((team, idx) => {
      const thirdRank = idx + 1; // 1 = best third, 12 = worst third
      const current = worstThirdRank.get(team.id) ?? 0;
      if (thirdRank > current) {
        worstThirdRank.set(team.id, thirdRank);
      }
    });
  }

  // A team is a guaranteed "best third" if:
  // - It was ALWAYS 3rd in its group (handled by worstThirdRank being set)
  // - Its worst ranking among thirds across all simulations is <= 8
  const qualifiedIds = new Set<string>();
  worstThirdRank.forEach((worst, teamId) => {
    if (worst <= 8) {
      qualifiedIds.add(teamId);
    }
  });

  return qualifiedIds;
}

/**
 * Generate a single Monte Carlo scenario for all unplayed matches.
 * Uses Poisson-based predictMatchScore which considers FIFA rankings
 * and produces realistic goal distributions (0-0, 1-0, 2-1, 3-0, etc.)
 * so that goal-difference tiebreakers are properly exercised.
 */
function generateMonteCarloScenario(
  unplayedMatches: Match[],
  teamMap: Map<string, Team>
): Match[] {
  return unplayedMatches.map((match) => {
    const homeTeam = teamMap.get(match.homeTeamId);
    const awayTeam = teamMap.get(match.awayTeamId);

    // predictMatchScore returns Poisson-sampled goals based on FIFA points
    const score = predictMatchScore(
      homeTeam || {},
      awayTeam || {}
    );

    return {
      ...match,
      homeScore: score.home,
      awayScore: score.away,
      finished: true,
    };
  });
}

function applyScenario(originalGroup: Group, scenarioMatches: Match[]): Group {
  // Merge the scenario matches into the group's match list
  const combinedMatches = originalGroup.matches.map((m) => {
    const scenarioMatch = scenarioMatches.find((sm) => sm.id === m.id);
    return scenarioMatch || m;
  });

  const groupWithMatches = {
    ...originalGroup,
    matches: combinedMatches,
  };

  // Recalculate stats using the existing utility
  return recalculateGroupStats(groupWithMatches);
}

function getStandings(group: Group): Team[] {
  // Use the same sort logic as GroupCard
  return [...group.teams].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gf - b.ga !== a.gf - a.ga) return b.gf - b.ga - (a.gf - a.ga);
    if (b.gf !== a.gf) return b.gf - a.gf;
    return b.won - a.won; // 4th tiebreaker: wins
  });
}

function sortThirdPlaceTeams(teams: Team[]): Team[] {
  return [...teams].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gf - b.ga !== a.gf - a.ga) return b.gf - b.ga - (a.gf - a.ga);
    if (b.gf !== a.gf) return b.gf - a.gf;
    return b.won - a.won;
  });
}
