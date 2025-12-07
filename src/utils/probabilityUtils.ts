import { Group, KnockoutMatch, Team } from "@/data/types";
import { simulateTournament } from "./simulationUtils";

interface MatchStats {
  homeTeamCounts: Map<string, number>; // teamId -> count
  awayTeamCounts: Map<string, number>; // teamId -> count
  matchupCounts: Map<string, number>; // "homeId-awayId" -> count
  teamData: Map<string, Team>; // teamId -> Team object (for referencing)
}

export const calculateKnockoutProbabilities = async (
  currentGroups: Group[],
  iterations: number = 200
): Promise<
  Map<
    string,
    {
      homeTeamProb: number;
      awayTeamProb: number;
      matchupProb: number;
      projectedHomeTeam?: Team;
      projectedAwayTeam?: Team;
      homeCandidates?: { team: Team; probability: number }[];
      awayCandidates?: { team: Team; probability: number }[];
    }
  >
> => {
  const matchStats = new Map<string, MatchStats>();

  // Helper to init stats for a match
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

  // Run Monte Carlo Simulation
  for (let i = 0; i < iterations; i++) {
    // We can run this synchronously as it's just math
    // But in a real app might want to yield to event loop if N is large
    const { knockoutMatches } = simulateTournament(currentGroups);

    knockoutMatches.forEach((match) => {
      const stats = getStats(match.id);

      const hTeam = match.homeTeam as Team;
      const aTeam = match.awayTeam as Team;

      // Check if teams are valid (not placeholders)
      // simulateTournament returns full Teams (or should).
      // Actually generateR32Matches might return placeholders if it couldn't resolve,
      // BUT simulateTournament first simulates groups so they ARE finished,
      // so generateR32Matches SHOULD resolve everything except maybe extreme edge cases
      // (like no valid 3rd place combo found? but we added fallback).

      const hasHome = hTeam && !("placeholder" in hTeam);
      const hasAway = aTeam && !("placeholder" in aTeam);

      if (hasHome) {
        stats.homeTeamCounts.set(
          hTeam.id,
          (stats.homeTeamCounts.get(hTeam.id) || 0) + 1
        );
        stats.teamData.set(hTeam.id, hTeam);
      }

      if (hasAway) {
        stats.awayTeamCounts.set(
          aTeam.id,
          (stats.awayTeamCounts.get(aTeam.id) || 0) + 1
        );
        stats.teamData.set(aTeam.id, aTeam);
      }

      if (hasHome && hasAway) {
        const key = `${hTeam.id}-${aTeam.id}`;
        stats.matchupCounts.set(key, (stats.matchupCounts.get(key) || 0) + 1);
      }
    });
  }

  // Aggregate Results
  const results = new Map<
    string,
    {
      homeTeamProb: number;
      awayTeamProb: number;
      matchupProb: number;
      projectedHomeTeam?: Team;
      projectedAwayTeam?: Team;
    }
  >();

  matchStats.forEach((stats, matchId) => {
    // Find most likely home team
    let bestHomeId = "";
    let maxHomeCount = 0;
    stats.homeTeamCounts.forEach((count, id) => {
      if (count > maxHomeCount) {
        maxHomeCount = count;
        bestHomeId = id;
      }
    });

    // Find most likely away team
    let bestAwayId = "";
    let maxAwayCount = 0;
    stats.awayTeamCounts.forEach((count, id) => {
      if (count > maxAwayCount) {
        maxAwayCount = count;
        bestAwayId = id;
      }
    });

    // Find most likely matchup
    // Note: The most likely matchup might not be BestHome vs BestAway
    // (e.g. if correlation is high).
    // But usually for display we want to show the specific matchup probability
    // of the Projected Home vs Projected Away.
    // OR we find the absolute most common pair.

    // Let's use the BestHome vs BestAway as the "Projected" visualization,
    // and calculate the probability of THAT specific matchup occurring.

    const projectedMatchupKey = `${bestHomeId}-${bestAwayId}`;
    const matchupCount = stats.matchupCounts.get(projectedMatchupKey) || 0;

    // Build Candidate Lists
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

    // Calculate Conditional Probability (Bayes)
    // P(Matchup | Team) = P(Matchup) / P(Team)
    // We condition on the most likely team to be conservative and consistent
    // This answers: "Given that the most confident projection is correct, what is the chance of this specific opponent?"
    const maxTeamCount = Math.max(maxHomeCount, maxAwayCount);
    const conditionalMatchupProb =
      maxTeamCount > 0 ? matchupCount / maxTeamCount : 0;

    results.set(matchId, {
      homeTeamProb: maxHomeCount / iterations,
      awayTeamProb: maxAwayCount / iterations,
      matchupProb: conditionalMatchupProb,
      projectedHomeTeam: bestHomeId
        ? stats.teamData.get(bestHomeId)
        : undefined,
      projectedAwayTeam: bestAwayId
        ? stats.teamData.get(bestAwayId)
        : undefined,
      homeCandidates,
      awayCandidates,
    });
  });

  return results;
};
