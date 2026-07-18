import { simulateTournament } from "../utils/simulationUtils";
import { Group, KnockoutMatch, Team, MatchupData, MatchupEntry } from "../data/types";
import { PredictionResult } from "../utils/monteCarlo";

interface MatchStats {
  homeTeamCounts: Map<string, number>;
  awayTeamCounts: Map<string, number>;
  matchupCounts: Map<string, number>;
  teamData: Map<string, Team>;
}

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
          runnerUpCount: 0,
          thirdPlaceCount: 0,
          thirdPlaceWinnerCount: 0,
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

    // 3. Initialize Knockout Bracket structures
    const matchStats = new Map<string, MatchStats>();
    const getStats = (matchId: string) => {
      if (!matchStats.has(matchId)) {
        matchStats.set(matchId, {
          homeTeamCounts: new Map(),
          awayTeamCounts: new Map(),
          matchupCounts: new Map(),
          teamData: new Map(),
        });
      }
      return matchStats.get(matchId)!;
    };

    // Run simulations in chunks
    const numChunks = 50;
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

        // Champion & Runner Up
        const finalMatch = result.knockoutMatches.find((m) => m.stage === "Final");
        if (finalMatch) {
          if (finalMatch.winner && !("placeholder" in finalMatch.winner)) {
            const champStats = stats.get(finalMatch.winner.id);
            if (champStats) {
              champStats.championCount++;
            }

            const homeTeam = finalMatch.homeTeam;
            const awayTeam = finalMatch.awayTeam;
            if (homeTeam && awayTeam && !("placeholder" in homeTeam) && !("placeholder" in awayTeam)) {
              const loser = homeTeam.id === finalMatch.winner.id ? awayTeam : homeTeam;
              const runnerUpStats = stats.get(loser.id);
              if (runnerUpStats) {
                runnerUpStats.runnerUpCount++;
              }
            }
          }
        }

        // Third Place Match
        const thirdPlaceMatch = result.knockoutMatches.find((m) => m.stage === "3rdPlace");
        if (thirdPlaceMatch) {
          // Reaching the third place match (participants)
          if (thirdPlaceMatch.homeTeam && !("placeholder" in thirdPlaceMatch.homeTeam)) {
            const hStats = stats.get(thirdPlaceMatch.homeTeam.id);
            if (hStats) {
              hStats.thirdPlaceCount++;
            }
          }
          if (thirdPlaceMatch.awayTeam && !("placeholder" in thirdPlaceMatch.awayTeam)) {
            const aStats = stats.get(thirdPlaceMatch.awayTeam.id);
            if (aStats) {
              aStats.thirdPlaceCount++;
            }
          }

          // Winner of third place match
          if (thirdPlaceMatch.winner && !("placeholder" in thirdPlaceMatch.winner)) {
            const winnerStats = stats.get(thirdPlaceMatch.winner.id);
            if (winnerStats) {
              winnerStats.thirdPlaceWinnerCount++;
            }
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

        // C. Accumulate Knockout Bracket Stats
        result.knockoutMatches.forEach((match) => {
          const stats = getStats(match.id);

          const hTeam = match.homeTeam as Team;
          const aTeam = match.awayTeam as Team;

          const hasHome = hTeam && !("placeholder" in hTeam);
          const hasAway = aTeam && !("placeholder" in aTeam);

          if (hasHome) {
            stats.homeTeamCounts.set(
              hTeam.id,
              (stats.homeTeamCounts.get(hTeam.id) || 0) + 1,
            );
            stats.teamData.set(hTeam.id, hTeam);
          }

          if (hasAway) {
            stats.awayTeamCounts.set(
              aTeam.id,
              (stats.awayTeamCounts.get(aTeam.id) || 0) + 1,
            );
            stats.teamData.set(aTeam.id, aTeam);
          }

          if (hasHome && hasAway) {
            const key = `${hTeam.id}-${aTeam.id}`;
            stats.matchupCounts.set(key, (stats.matchupCounts.get(key) || 0) + 1);
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
      if (b.runnerUpCount !== a.runnerUpCount) return b.runnerUpCount - a.runnerUpCount;
      if (b.thirdPlaceWinnerCount !== a.thirdPlaceWinnerCount) return b.thirdPlaceWinnerCount - a.thirdPlaceWinnerCount;
      if (b.thirdPlaceCount !== a.thirdPlaceCount) return b.thirdPlaceCount - a.thirdPlaceCount;
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

    // Format Knockout Probabilities
    const finalKnockoutProbs: Record<string, any> = {};
    matchStats.forEach((stats, matchId) => {
      let bestHomeId = "";
      let maxHomeCount = 0;
      stats.homeTeamCounts.forEach((count, id) => {
        if (count > maxHomeCount) {
          maxHomeCount = count;
          bestHomeId = id;
        }
      });

      let bestAwayId = "";
      let maxAwayCount = 0;
      stats.awayTeamCounts.forEach((count, id) => {
        if (count > maxAwayCount) {
          maxAwayCount = count;
          bestAwayId = id;
        }
      });

      const projectedMatchupKey = `${bestHomeId}-${bestAwayId}`;
      const matchupCount = stats.matchupCounts.get(projectedMatchupKey) || 0;

      const homeCandidates: { team: Team; probability: number }[] = [];
      stats.homeTeamCounts.forEach((count, id) => {
        const team = stats.teamData.get(id);
        if (team) {
          homeCandidates.push({
            team,
            probability: count / iterations,
          });
        }
      });
      homeCandidates.sort((a, b) => b.probability - a.probability);

      const awayCandidates: { team: Team; probability: number }[] = [];
      stats.awayTeamCounts.forEach((count, id) => {
        const team = stats.teamData.get(id);
        if (team) {
          awayCandidates.push({
            team,
            probability: count / iterations,
          });
        }
      });
      awayCandidates.sort((a, b) => b.probability - a.probability);

      const maxTeamCount = Math.max(maxHomeCount, maxAwayCount);
      const conditionalMatchupProb = maxTeamCount > 0 ? matchupCount / maxTeamCount : 0;

      finalKnockoutProbs[matchId] = {
        homeTeamProb: maxHomeCount / iterations,
        awayTeamProb: maxAwayCount / iterations,
        matchupProb: conditionalMatchupProb,
        projectedHomeTeam: bestHomeId ? stats.teamData.get(bestHomeId) : undefined,
        projectedAwayTeam: bestAwayId ? stats.teamData.get(bestAwayId) : undefined,
        homeCandidates,
        awayCandidates,
      };
    });

    const getDeterministicWinner = (match: KnockoutMatch): Team | null => {
      // Only return a deterministic winner if the match is fully finished
      const isFinished = match.finished === true || match.status === "finished";
      if (!isFinished) return null;

      if (
        !match.homeTeam ||
        !match.awayTeam ||
        "placeholder" in match.homeTeam ||
        "placeholder" in match.awayTeam
      ) {
        return null;
      }

      const home = match.homeScore;
      const away = match.awayScore;

      if (home == null || away == null) return null;

      if (home > away) return match.homeTeam as Team;
      if (away > home) return match.awayTeam as Team;

      const homePens = match.homePenalties;
      const awayPens = match.awayPenalties;
      if (homePens != null && awayPens != null && homePens !== awayPens) {
        return homePens > awayPens
          ? (match.homeTeam as Team)
          : (match.awayTeam as Team);
      }

      if (match.winner && !("placeholder" in match.winner)) {
        return match.winner as Team;
      }

      return null;
    };

    // Override probabilities for matches that are already decided by the user
    knockoutMatches.forEach((m: KnockoutMatch) => {
      const winner = getDeterministicWinner(m);
      if (!winner) return;

      if (
        !m.homeTeam ||
        !m.awayTeam ||
        "placeholder" in m.homeTeam ||
        "placeholder" in m.awayTeam
      ) {
        return;
      }

      const homeTeam = m.homeTeam as Team;
      const awayTeam = m.awayTeam as Team;

      finalKnockoutProbs[m.id] = {
        homeTeamProb: winner.id === homeTeam.id ? 1 : 0,
        awayTeamProb: winner.id === awayTeam.id ? 1 : 0,
        matchupProb: 1,
        projectedHomeTeam: homeTeam,
        projectedAwayTeam: awayTeam,
        homeCandidates: [{ team: homeTeam, probability: 1 }],
        awayCandidates: [{ team: awayTeam, probability: 1 }],
      };
    });

    self.postMessage({
      status: "success",
      predictions: finalPredictions,
      matchups: finalMatchups,
      knockoutProbabilities: finalKnockoutProbs,
      elapsedMs: end - start,
    });
  } catch (error: any) {
    self.postMessage({ status: "error", error: error.message || String(error) });
  }
};
