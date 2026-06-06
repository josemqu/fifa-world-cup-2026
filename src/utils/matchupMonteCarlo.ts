import { Group, KnockoutMatch, Team, MatchupData, MatchupEntry } from "@/data/types";
import { simulateTournament } from "@/utils/simulationUtils";

/**
 * Matchup Monte Carlo Simulation
 *
 * Runs N simulations of the entire tournament and tracks which teams
 * face each other in each stage. Returns per-team matchup probability data.
 */
export const runMatchupMonteCarlo = async (
  currentGroups: Group[],
  currentKnockoutMatches: KnockoutMatch[] = [],
  iterations: number = 5000
): Promise<MatchupData[]> => {
  // Map<teamId, Map<"opponentId|stage", count>>
  const matchupCounts = new Map<string, Map<string, number>>();
  // Map<teamId, { name, ranking }>
  const teamMeta = new Map<string, { name: string; ranking?: number }>();

  // Initialize all teams
  currentGroups.forEach((g) =>
    g.teams.forEach((t) => {
      if (!matchupCounts.has(t.id)) {
        matchupCounts.set(t.id, new Map());
      }
      teamMeta.set(t.id, { name: t.name, ranking: t.ranking });
    })
  );

  // Helper: register a matchup between two teams at a given stage
  const registerMatchup = (
    teamAId: string,
    teamBId: string,
    stage: string
  ) => {
    // Register A vs B
    const keyAB = `${teamBId}|${stage}`;
    const mapA = matchupCounts.get(teamAId);
    if (mapA) {
      mapA.set(keyAB, (mapA.get(keyAB) || 0) + 1);
    }
    // Register B vs A
    const keyBA = `${teamAId}|${stage}`;
    const mapB = matchupCounts.get(teamBId);
    if (mapB) {
      mapB.set(keyBA, (mapB.get(keyBA) || 0) + 1);
    }
  };

  // Group stage matchups are deterministic (each team plays 3 others in their group)
  // We'll register them separately with probability = 1.0 (count = iterations)
  const groupMatchups: { teamAId: string; teamBId: string }[] = [];
  currentGroups.forEach((g) => {
    g.matches.forEach((m) => {
      // Avoid duplicates (each match is listed once)
      const key = [m.homeTeamId, m.awayTeamId].sort().join("-");
      if (!groupMatchups.some((gm) => [gm.teamAId, gm.teamBId].sort().join("-") === key)) {
        groupMatchups.push({ teamAId: m.homeTeamId, teamBId: m.awayTeamId });
      }
    });
  });

  // Register group matchups at full probability
  groupMatchups.forEach(({ teamAId, teamBId }) => {
    const keyAB = `${teamBId}|Grupos`;
    const mapA = matchupCounts.get(teamAId);
    if (mapA) {
      mapA.set(keyAB, iterations);
    }
    const keyBA = `${teamAId}|Grupos`;
    const mapB = matchupCounts.get(teamBId);
    if (mapB) {
      mapB.set(keyBA, iterations);
    }
  });

  // Run Monte Carlo for knockout stages
  for (let i = 0; i < iterations; i++) {
    const result = simulateTournament(currentGroups, currentKnockoutMatches);

    result.knockoutMatches.forEach((match) => {
      const hTeam = match.homeTeam as Team;
      const aTeam = match.awayTeam as Team;

      const hasHome = hTeam && !("placeholder" in hTeam);
      const hasAway = aTeam && !("placeholder" in aTeam);

      if (hasHome && hasAway) {
        const stage = match.stage === "3rdPlace" ? "3rdPlace" : match.stage;
        registerMatchup(hTeam.id, aTeam.id, stage);
      }
    });
  }

  // Build output
  const results: MatchupData[] = [];

  matchupCounts.forEach((countsMap, teamId) => {
    const meta = teamMeta.get(teamId);
    if (!meta) return;

    const matchups: MatchupEntry[] = [];

    countsMap.forEach((count, key) => {
      const [opponentId, stage] = key.split("|");
      const opponentMeta = teamMeta.get(opponentId);
      matchups.push({
        opponentId,
        opponentName: opponentMeta?.name || opponentId,
        stage,
        count,
      });
    });

    results.push({
      teamId,
      teamName: meta.name,
      teamRanking: meta.ranking,
      matchups,
    });
  });

  return results;
};
