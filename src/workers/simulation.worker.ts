import { simulateTournament } from "../utils/simulationUtils";
import { Group, KnockoutMatch, Team, MatchupData, MatchupEntry } from "../data/types";
import { PredictionResult } from "../utils/monteCarlo";

self.onmessage = async (e: MessageEvent) => {
  const { groups, knockoutMatches, iterations } = e.data;

  try {
    const start = performance.now();

    // 1. Initialize Predictions structures
    const stats = new Map<string, PredictionResult>();
    groups.forEach((g: Group) =>
      g.teams.forEach((t: Team) => {
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
      })
    );

    // 2. Initialize Matchups structures
    const matchupCounts = new Map<string, Map<string, number>>();
    const teamMeta = new Map<string, { name: string; ranking?: number }>();
    groups.forEach((g: Group) =>
      g.teams.forEach((t: Team) => {
        if (!matchupCounts.has(t.id)) {
          matchupCounts.set(t.id, new Map());
        }
        teamMeta.set(t.id, { name: t.name, ranking: t.ranking });
      })
    );

    // Group stage matchups (deterministic)
    const groupMatchups: { teamAId: string; teamBId: string }[] = [];
    groups.forEach((g: Group) => {
      g.matches.forEach((m) => {
        const key = [m.homeTeamId, m.awayTeamId].sort().join("-");
        if (!groupMatchups.some((gm) => [gm.teamAId, gm.teamBId].sort().join("-") === key)) {
          groupMatchups.push({ teamAId: m.homeTeamId, teamBId: m.awayTeamId });
        }
      });
    });

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

    // Run simulations in chunks
    const numChunks = 20;
    const chunkSize = Math.max(10, Math.ceil(iterations / numChunks));

    for (let chunkStart = 0; chunkStart < iterations; chunkStart += chunkSize) {
      const currentChunk = Math.min(chunkSize, iterations - chunkStart);

      for (let i = 0; i < currentChunk; i++) {
        const result = simulateTournament(groups, knockoutMatches);

        // A. Accumulate Predictions
        const processStagePredictions = (
          stageName: string,
          prop: keyof Omit<PredictionResult, "teamId" | "teamName" | "simulations" | "championCount">
        ) => {
          const matches = result.knockoutMatches.filter((m) => m.stage === stageName);
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

        processStagePredictions("R32", "r32Count");
        processStagePredictions("R16", "r16Count");
        processStagePredictions("QF", "quarterFinalistCount");
        processStagePredictions("SF", "semiFinalistCount");
        processStagePredictions("Final", "finalistCount");

        const finalMatch = result.knockoutMatches.find((m) => m.stage === "Final");
        if (finalMatch?.winner) {
          const winnerStats = stats.get(finalMatch.winner.id);
          if (winnerStats) {
            winnerStats.championCount++;
          }
        }

        // B. Accumulate Matchups
        result.knockoutMatches.forEach((match) => {
          const hTeam = match.homeTeam as Team;
          const aTeam = match.awayTeam as Team;

          const hasHome = hTeam && !("placeholder" in hTeam);
          const hasAway = aTeam && !("placeholder" in aTeam);

          if (hasHome && hasAway) {
            const stage = match.stage === "3rdPlace" ? "3rdPlace" : match.stage;
            
            // Register A vs B
            const keyAB = `${aTeam.id}|${stage}`;
            const mapA = matchupCounts.get(hTeam.id);
            if (mapA) {
              mapA.set(keyAB, (mapA.get(keyAB) || 0) + 1);
            }
            // Register B vs A
            const keyBA = `${hTeam.id}|${stage}`;
            const mapB = matchupCounts.get(aTeam.id);
            if (mapB) {
              mapB.set(keyBA, (mapB.get(keyBA) || 0) + 1);
            }
          }
        });
      }

      const currentCompleted = Math.min(iterations, chunkStart + currentChunk);
      self.postMessage({
        status: "progress",
        progress: Math.round((currentCompleted / iterations) * 100),
        currentIteration: currentCompleted,
      });

      // Yield
      await new Promise((resolve) => setTimeout(resolve, 5));
    }

    const end = performance.now();

    // Format Predictions
    const finalPredictions = Array.from(stats.values()).sort((a, b) => {
      if (b.championCount !== a.championCount) return b.championCount - a.championCount;
      if (b.finalistCount !== a.finalistCount) return b.finalistCount - a.finalistCount;
      if (b.semiFinalistCount !== a.semiFinalistCount) return b.semiFinalistCount - a.semiFinalistCount;
      if (b.quarterFinalistCount !== a.quarterFinalistCount) return b.quarterFinalistCount - a.quarterFinalistCount;
      if (b.r16Count !== a.r16Count) return b.r16Count - a.r16Count;
      return b.r32Count - a.r32Count;
    });

    // Format Matchups
    const finalMatchups: MatchupData[] = [];
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

      finalMatchups.push({
        teamId,
        teamName: meta.name,
        teamRanking: meta.ranking,
        matchups,
      });
    });

    self.postMessage({
      status: "success",
      predictions: finalPredictions,
      matchups: finalMatchups,
      elapsedMs: end - start,
    });
  } catch (error: any) {
    self.postMessage({ status: "error", error: error.message || String(error) });
  }
};
