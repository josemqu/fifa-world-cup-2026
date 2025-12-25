import { Group, Team, Match } from "@/data/types";
import { recalculateGroupStats } from "@/utils/simulationUtils";

export interface TeamAnalysis {
  minRank: number;
  maxRank: number;
  isQualified: boolean; // Guaranteed Top 2
  isPositionLocked: boolean; // Fixed position (e.g. guaranteed 1st, or guaranteed 4th)
}

export const analyzeGroup = (group: Group): Record<string, TeamAnalysis> => {
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
      };
    });
    return result;
  }

  // Generate all scenarios (3^N)
  // Each match has 3 outcomes: Home Win, Draw, Away Win
  // We will assign provisional scores. To be safe/simple, we can use 1-0 for wins and 0-0 for draws.
  // Note: Goal difference matters for tie-breakers.
  // Strictly speaking, "Mathematically Secured" implies it holds even with extreme scores.
  // However, iterating over ALL scores is impossible.
  // Standard practice for "mathematical qualification" usually assumes "Points" primarily.
  // But GD is the second tie-breaker. A team could theoretically lose 0-100 and lose the GD advantage.
  // So, "Mathematically Secured" usually means "Points are enough such that even with worst case GD, you pass".
  // OR, we can just assume "worst reasonable case".
  // BUT, usually "Secured" implies POINTS are sufficient.
  // OR, we assume checking only W/D/L outcomes.
  // If we check only W/D/L outcomes with minimal margins (1-0), we might miss a scenario where a team loses on GD.
  // However, checking infinite scores is impossible.
  // A common approximation is to check W/D/L.
  // If a team is Top 2 in ALL W/D/L scenarios, they are qualified *barring* GD swings.
  // For strict mathematical certainty including GD, it's hard.
  // BUT, usually people care about Points.
  // Let's stick to the W/D/L permutation with minimal scores (1-0, 0-0, 0-1).
  // This covers the Points permutations.
  // For the "Locked" status, if minRank == maxRank in all W/D/L scenarios, it's pretty solid.

  const scenarios = generateScenarios(unplayedMatches);

  // Track min/max rank for each team across all scenarios
  const teamStats: Record<string, { min: number; max: number }> = {};
  group.teams.forEach((t) => {
    teamStats[t.id] = { min: 5, max: 0 }; // Initialize with inverted values
  });

  for (const scenario of scenarios) {
    // Apply scenario to a clone of the group
    const simulatedGroup = applyScenario(group, scenario);
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
      isQualified: stats.max <= 2,
      isPositionLocked: stats.min === stats.max,
    };
  });

  return result;
};

// Helper to generate 3^N outcomes
function generateScenarios(matches: Match[]): Match[][] {
  if (matches.length === 0) return [[]];

  const firstMatch = matches[0];
  const restMatches = matches.slice(1);
  const restScenarios = generateScenarios(restMatches);

  const scenarios: Match[][] = [];

  // Outcome 1: Home Win (1-0)
  const homeWin = { ...firstMatch, homeScore: 1, awayScore: 0, finished: true };

  // Outcome 2: Draw (0-0)
  const draw = { ...firstMatch, homeScore: 0, awayScore: 0, finished: true };

  // Outcome 3: Away Win (0-1)
  const awayWin = { ...firstMatch, homeScore: 0, awayScore: 1, finished: true };

  for (const rest of restScenarios) {
    scenarios.push([homeWin, ...rest]);
    scenarios.push([draw, ...rest]);
    scenarios.push([awayWin, ...rest]);
  }

  return scenarios;
}

function applyScenario(originalGroup: Group, scenarioMatches: Match[]): Group {
  // Create a deep copy of the group to avoid mutating the original
  // But we can optimize by only cloning teams and match list

  // We need to merge the scenario matches into the group's match list
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
