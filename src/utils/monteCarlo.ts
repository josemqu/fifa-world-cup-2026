import { Group, KnockoutMatch, Team } from "@/data/types";
import { simulateTournament } from "@/utils/simulationUtils";

export type PredictionResult = {
  teamId: string;
  teamName: string;
  teamRanking?: number;
  teamFifaPoints?: number;
  simulations: number;
  championCount: number;
  finalistCount: number;
  semiFinalistCount: number;
  quarterFinalistCount: number;
  r16Count: number;
  r32Count: number; // Qualified from groups
};

export const runMonteCarloSimulation = async (
  currentGroups: Group[],
  currentKnockoutMatches: KnockoutMatch[] = [],
  iterations: number = 1000,
): Promise<PredictionResult[]> => {
  const stats = new Map<string, PredictionResult>();

  // Initialize stats for all teams
  currentGroups.forEach((g) =>
    g.teams.forEach((t) => {
      stats.set(t.id, {
        teamId: t.id,
        teamName: t.name,
        teamRanking: t.ranking,
        teamFifaPoints: t.fifaPoints,
        simulations: iterations,
        championCount: 0,
        finalistCount: 0,
        semiFinalistCount: 0,
        quarterFinalistCount: 0,
        r16Count: 0,
        r32Count: 0,
      });
    }),
  );

  for (let i = 0; i < iterations; i++) {
    const result = simulateTournament(currentGroups, currentKnockoutMatches);

    // Helper to process stage
    const processStage = (
      stageName: string,
      prop: keyof Omit<
        PredictionResult,
        "teamId" | "teamName" | "simulations" | "championCount"
      >,
    ) => {
      const matches = result.knockoutMatches.filter(
        (m) => m.stage === stageName,
      );
      matches.forEach((m) => {
        if (m.homeTeam && !("placeholder" in m.homeTeam)) {
          const tId = (m.homeTeam as Team).id;
          const teamStats = stats.get(tId);
          if (teamStats) {
            (teamStats[prop] as number)++;
          }
        }
        if (m.awayTeam && !("placeholder" in m.awayTeam)) {
          const tId = (m.awayTeam as Team).id;
          const teamStats = stats.get(tId);
          if (teamStats) {
            (teamStats[prop] as number)++;
          }
        }
      });
    };

    processStage("R32", "r32Count");
    processStage("R16", "r16Count");
    processStage("QF", "quarterFinalistCount");
    processStage("SF", "semiFinalistCount");
    processStage("Final", "finalistCount");

    // Champion
    const finalMatch = result.knockoutMatches.find((m) => m.stage === "Final");
    if (finalMatch?.winner) {
      const winnerStats = stats.get(finalMatch.winner.id);
      if (winnerStats) {
        winnerStats.championCount++;
      }
    }
  }

  return Array.from(stats.values()).sort((a, b) => {
    if (b.championCount !== a.championCount)
      return b.championCount - a.championCount;
    if (b.finalistCount !== a.finalistCount)
      return b.finalistCount - a.finalistCount;
    if (b.semiFinalistCount !== a.semiFinalistCount)
      return b.semiFinalistCount - a.semiFinalistCount;
    if (b.quarterFinalistCount !== a.quarterFinalistCount)
      return b.quarterFinalistCount - a.quarterFinalistCount;
    if (b.r16Count !== a.r16Count) return b.r16Count - a.r16Count;
    return b.r32Count - a.r32Count;
  });
};
