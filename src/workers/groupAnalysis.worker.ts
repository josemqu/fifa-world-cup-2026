import { Group, Team, Match } from "../data/types";
import { predictMatchScore, predictMatchScoreRemaining, recalculateGroupStats } from "../utils/simulationUtils";
import { TeamAnalysis } from "../utils/groupAnalysis";
import { sortGroupTeams } from "../utils/groupSorting";

self.onmessage = async (e: MessageEvent) => {
  const { groups, iterations } = e.data;

  try {
    // Group team maps for quick lookup of Team objects by teamId
    const groupTeamMaps = new Map<string, Map<string, Team>>();
    // Overall team to group map so we can know which group a team belongs to
    const teamGroupNames = new Map<string, string>();
    // Check if groups are fully played (deterministic)
    const groupFullyPlayed = new Map<string, boolean>();

    groups.forEach((g: Group) => {
      const teamMap = new Map<string, Team>();
      g.teams.forEach((t) => {
        teamMap.set(t.id, t);
        teamGroupNames.set(t.id, g.name);
      });
      groupTeamMaps.set(g.name, teamMap);

      const allFinished = g.matches.every(
        (m: Match) => m.finished === true || m.status === "finished"
      );
      groupFullyPlayed.set(g.name, allFinished);
    });

    const teamMinRanks = new Map<string, number>();
    const teamMaxRanks = new Map<string, number>();
    const teamPositionCounts = new Map<string, number[]>();
    const teamEliminationCounts = new Map<string, number>();
    const bestThirdQualifyCounts = new Map<string, number>();

    groups.forEach((g: Group) => {
      g.teams.forEach((t) => {
        teamMinRanks.set(t.id, g.teams.length + 1);
        teamMaxRanks.set(t.id, 0);
        teamPositionCounts.set(t.id, new Array(g.teams.length).fill(0));
        teamEliminationCounts.set(t.id, 0);
        bestThirdQualifyCounts.set(t.id, 0);
      });
    });

    // Run Monte Carlo simulations
    for (let i = 0; i < iterations; i++) {
      const simulatedGroups: Group[] = [];
      const thirdPlaceTeams: Team[] = [];

      for (const group of groups) {
        const teamMap = groupTeamMaps.get(group.name)!;
        let simulatedGroup: Group;

        if (groupFullyPlayed.get(group.name)) {
          simulatedGroup = group;
        } else {
          // Find incomplete matches (not finished)
          const incompleteMatches = group.matches.filter(
            (m: Match) => !(m.finished === true || m.status === "finished")
          );
          // Simulate incomplete matches
          const scenarioMatches = incompleteMatches.map((m: Match) => {
            const homeTeam = teamMap.get(m.homeTeamId);
            const awayTeam = teamMap.get(m.awayTeamId);

            const isLive = m.status === "live" || m.status === "halftime";
            let home: number;
            let away: number;

            if (isLive) {
              const currentHome = m.homeScore ?? 0;
              const currentAway = m.awayScore ?? 0;
              const elapsed = m.elapsed ?? (m.status === "halftime" ? 45 : 0);
              const remaining = predictMatchScoreRemaining(
                homeTeam || {},
                awayTeam || {},
                currentHome,
                currentAway,
                elapsed
              );
              home = remaining.home;
              away = remaining.away;
            } else {
              const simulated = predictMatchScore(homeTeam || {}, awayTeam || {});
              home = simulated.home;
              away = simulated.away;
            }

            return {
              ...m,
              homeScore: home,
              awayScore: away,
              finished: true,
            };
          });

          const combinedMatches = group.matches.map((m: Match) => {
            const scenarioMatch = scenarioMatches.find((sm: Match) => sm.id === m.id);
            return scenarioMatch || m;
          });

          const groupWithMatches = {
            ...group,
            matches: combinedMatches,
          };

          simulatedGroup = recalculateGroupStats(groupWithMatches);
        }

        simulatedGroups.push(simulatedGroup);

        // Sort teams (standings) using Olympic tiebreaker
        const standings = sortGroupTeams(simulatedGroup.teams, simulatedGroup.matches);

        // Record standings for each team
        standings.forEach((team, index) => {
          const rank = index + 1;

          // Min / max rank
          const currentMin = teamMinRanks.get(team.id)!;
          if (rank < currentMin) teamMinRanks.set(team.id, rank);

          const currentMax = teamMaxRanks.get(team.id)!;
          if (rank > currentMax) teamMaxRanks.set(team.id, rank);

          // Position counts
          const posCounts = teamPositionCounts.get(team.id)!;
          if (posCounts[index] !== undefined) {
            posCounts[index]++;
          }
        });

        // Collect 3rd place team
        if (standings[2]) {
          thirdPlaceTeams.push(standings[2]);
        }
      }

      // Sort third-place teams across all groups
      const sortedThirds = [...thirdPlaceTeams].sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gf - b.ga !== a.gf - a.ga) return b.gf - b.ga - (a.gf - a.ga);
        if (b.gf !== a.gf) return b.gf - a.gf;
        return b.won - a.won;
      });

      // Mark qualified thirds and count eliminations
      simulatedGroups.forEach((g) => {
        const standings = sortGroupTeams(g.teams, g.matches);

        standings.forEach((team, index) => {
          if (index === 3) {
            // Finished 4th -> Eliminated!
            teamEliminationCounts.set(team.id, teamEliminationCounts.get(team.id)! + 1);
          } else if (index === 2) {
            // Finished 3rd -> check if in top 8 of sortedThirds
            const thirdIdx = sortedThirds.findIndex((t) => t.id === team.id);
            if (thirdIdx === -1 || thirdIdx >= 8) {
              // Not in top 8 -> Eliminated!
              teamEliminationCounts.set(team.id, teamEliminationCounts.get(team.id)! + 1);
            } else {
              // In top 8 -> Qualified as best third!
              bestThirdQualifyCounts.set(team.id, bestThirdQualifyCounts.get(team.id)! + 1);
            }
          }
        });
      });
    }

    // Format the outputs
    const groupAnalysisResult: Record<string, Record<string, TeamAnalysis>> = {};
    const groupPositionProbsResult: Record<string, Record<string, number[]>> = {};
    const thirdPlaceProbsResult: Record<string, number> = {};
    const qualifiedThirdIdsResult: string[] = [];

    groups.forEach((g: Group) => {
      groupAnalysisResult[g.name] = {};
      groupPositionProbsResult[g.name] = {};

      g.teams.forEach((t) => {
        const minRank = teamMinRanks.get(t.id)!;
        const maxRank = teamMaxRanks.get(t.id)!;
        const posCounts = teamPositionCounts.get(t.id)!;
        const elimCount = teamEliminationCounts.get(t.id)!;
        const qualifyCount = bestThirdQualifyCounts.get(t.id)!;

        const isGuaranteedQualified = elimCount === 0;

        groupAnalysisResult[g.name][t.id] = {
          minRank,
          maxRank,
          isQualified: maxRank <= 2,
          isPositionLocked: minRank === maxRank,
          isGuaranteedQualified,
        };

        // Convert position counts to probabilities
        groupPositionProbsResult[g.name][t.id] = posCounts.map((c) => c / iterations);

        // Convert best third qualification to probability
        thirdPlaceProbsResult[t.id] = qualifyCount / iterations;

        if (isGuaranteedQualified) {
          qualifiedThirdIdsResult.push(t.id);
        }
      });
    });

    self.postMessage({
      status: "success",
      groupAnalysis: groupAnalysisResult,
      groupPositionProbs: groupPositionProbsResult,
      thirdPlaceProbs: thirdPlaceProbsResult,
      qualifiedThirdIds: qualifiedThirdIdsResult,
    });
  } catch (error: any) {
    self.postMessage({
      status: "error",
      error: error.message || String(error),
    });
  }
};
