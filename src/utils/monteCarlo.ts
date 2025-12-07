import { Group, Team } from "@/data/types";
import { simulateTournament } from "@/utils/simulationUtils";

export type PredictionResult = {
  teamId: string;
  teamName: string;
  teamRanking?: number;
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
  iterations: number = 1000
): Promise<PredictionResult[]> => {
  const stats: Record<string, PredictionResult> = {};

  // Initialize stats for all teams
  currentGroups.forEach((g) =>
    g.teams.forEach((t) => {
      stats[t.id] = {
        teamId: t.id,
        teamName: t.name,
        teamRanking: t.ranking,
        simulations: iterations,
        championCount: 0,
        finalistCount: 0,
        semiFinalistCount: 0,
        quarterFinalistCount: 0,
        r16Count: 0,
        r32Count: 0,
      };
    })
  );

  // We can run this in chunks to avoid blocking the main thread entirely,
  // but for now, we'll just run it in a loop.
  // Since we are in an async function, we can use setImmediate or equivalent if needed,
  // but simple loop is fine for < 1s execution time.

  for (let i = 0; i < iterations; i++) {
    const result = simulateTournament(currentGroups);

    // Helper to process stage
    const processStage = (
      stageName: string,
      prop: keyof Omit<
        PredictionResult,
        "teamId" | "teamName" | "simulations" | "championCount"
      >
    ) => {
      const matches = result.knockoutMatches.filter(
        (m) => m.stage === stageName
      );
      matches.forEach((m) => {
        if (m.homeTeam && !("placeholder" in m.homeTeam)) {
          const tId = (m.homeTeam as Team).id;
          if (stats[tId]) stats[tId][prop]++;
        }
        if (m.awayTeam && !("placeholder" in m.awayTeam)) {
          const tId = (m.awayTeam as Team).id;
          if (stats[tId]) stats[tId][prop]++;
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
      if (stats[finalMatch.winner.id]) {
        stats[finalMatch.winner.id].championCount++;
      }
    }
  }

  return Object.values(stats).sort((a, b) => {
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
