import { Group, Team } from "@/data/types";
import {
  predictMatchScore,
  recalculateGroupStats,
} from "@/utils/simulationUtils";

function sortThirdPlaceTeams(thirdPlaceTeams: Team[]) {
  return [...thirdPlaceTeams].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gf - b.ga !== a.gf - a.ga) return b.gf - b.ga - (a.gf - a.ga);
    if (b.gf !== a.gf) return b.gf - a.gf;
    return b.won - a.won;
  });
}

export function estimateBestThirdQualificationProbabilities(
  groups: Group[],
  iterations: number = 1500
): Record<string, number> {
  const counts: Record<string, number> = {};

  // init counts
  groups.forEach((g) => g.teams.forEach((t) => (counts[t.id] = 0)));

  if (iterations <= 0) return counts;

  for (let i = 0; i < iterations; i++) {
    const simulatedGroups = groups.map((group) => {
      // Copy matches and simulate unplayed ones
      const simulatedMatches = group.matches.map((m) => {
        const isPlayed = m.homeScore != null && m.awayScore != null;
        if (isPlayed) {
          return { ...m, finished: true };
        }

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

      return recalculateGroupStats(clonedGroup);
    });

    const thirdPlaceTeams: Team[] = [];

    simulatedGroups.forEach((group) => {
      const sorted = [...group.teams].sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gf - b.ga !== a.gf - a.ga) return b.gf - b.ga - (a.gf - a.ga);
        if (b.gf !== a.gf) return b.gf - a.gf;
        return b.won - a.won;
      });

      if (sorted[2]) thirdPlaceTeams.push(sorted[2]);
    });

    const sortedThirds = sortThirdPlaceTeams(thirdPlaceTeams);
    const qualified = sortedThirds.slice(0, 8);

    qualified.forEach((t) => {
      counts[t.id] = (counts[t.id] ?? 0) + 1;
    });
  }

  const probs: Record<string, number> = {};
  Object.keys(counts).forEach((id) => {
    probs[id] = counts[id] / iterations;
  });

  return probs;
}
