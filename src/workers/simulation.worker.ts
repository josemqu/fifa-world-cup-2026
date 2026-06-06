import { runMonteCarloSimulation, PredictionResult } from "../utils/monteCarlo";
import { runMatchupMonteCarlo } from "../utils/matchupMonteCarlo";
import { MatchupData } from "../data/types";

self.onmessage = async (e: MessageEvent) => {
  const { type, groups, knockoutMatches, iterations } = e.data;

  try {
    const start = performance.now();

    if (type === "predictions") {
      const numChunks = 20;
      const chunkSize = Math.max(10, Math.ceil(iterations / numChunks));
      const accumulatedStats = new Map<string, PredictionResult>();

      for (let i = 0; i < iterations; i += chunkSize) {
        const currentChunk = Math.min(chunkSize, iterations - i);
        const chunkData = await runMonteCarloSimulation(groups, knockoutMatches, currentChunk);

        // Merge statistics
        chunkData.forEach((teamRes) => {
          const existing = accumulatedStats.get(teamRes.teamId);
          if (!existing) {
            accumulatedStats.set(teamRes.teamId, { ...teamRes, simulations: currentChunk });
          } else {
            existing.simulations += currentChunk;
            existing.championCount += teamRes.championCount;
            existing.finalistCount += teamRes.finalistCount;
            existing.semiFinalistCount += teamRes.semiFinalistCount;
            existing.quarterFinalistCount += teamRes.quarterFinalistCount;
            existing.r16Count += teamRes.r16Count;
            existing.r32Count += teamRes.r32Count;
          }
        });

        const currentCompleted = Math.min(iterations, i + currentChunk);
        self.postMessage({
          status: "progress",
          progress: Math.round((currentCompleted / iterations) * 100),
          currentIteration: currentCompleted,
        });

        // Small yield to let UI thread catch up if needed
        await new Promise((resolve) => setTimeout(resolve, 5));
      }

      const end = performance.now();
      const finalData = Array.from(accumulatedStats.values()).sort((a, b) => {
        if (b.championCount !== a.championCount) return b.championCount - a.championCount;
        if (b.finalistCount !== a.finalistCount) return b.finalistCount - a.finalistCount;
        if (b.semiFinalistCount !== a.semiFinalistCount) return b.semiFinalistCount - a.semiFinalistCount;
        if (b.quarterFinalistCount !== a.quarterFinalistCount) return b.quarterFinalistCount - a.quarterFinalistCount;
        if (b.r16Count !== a.r16Count) return b.r16Count - a.r16Count;
        return b.r32Count - a.r32Count;
      });

      self.postMessage({
        status: "success",
        data: finalData,
        elapsedMs: end - start,
      });

    } else if (type === "matchups") {
      const numChunks = 20;
      const chunkSize = Math.max(10, Math.ceil(iterations / numChunks));
      const accumulatedMatchups = new Map<string, MatchupData>();

      for (let i = 0; i < iterations; i += chunkSize) {
        const currentChunk = Math.min(chunkSize, iterations - i);
        const chunkData = await runMatchupMonteCarlo(groups, knockoutMatches, currentChunk);

        // Merge matchup data
        chunkData.forEach((teamRes) => {
          const existing = accumulatedMatchups.get(teamRes.teamId);
          if (!existing) {
            accumulatedMatchups.set(teamRes.teamId, {
              ...teamRes,
              matchups: teamRes.matchups.map((m) => ({ ...m })),
            });
          } else {
            teamRes.matchups.forEach((chunkMatchup) => {
              const existingMatchup = existing.matchups.find(
                (m) => m.opponentId === chunkMatchup.opponentId && m.stage === chunkMatchup.stage
              );
              if (!existingMatchup) {
                existing.matchups.push({ ...chunkMatchup });
              } else {
                existingMatchup.count += chunkMatchup.count;
              }
            });
          }
        });

        const currentCompleted = Math.min(iterations, i + currentChunk);
        self.postMessage({
          status: "progress",
          progress: Math.round((currentCompleted / iterations) * 100),
          currentIteration: currentCompleted,
        });

        await new Promise((resolve) => setTimeout(resolve, 5));
      }

      const end = performance.now();
      self.postMessage({
        status: "success",
        data: Array.from(accumulatedMatchups.values()),
        elapsedMs: end - start,
      });
    }
  } catch (error: any) {
    self.postMessage({ status: "error", error: error.message || String(error) });
  }
};
