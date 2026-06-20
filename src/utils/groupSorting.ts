import { Team, Match } from "@/data/types";

/**
 * Sorts teams within a group according to Olympic (UEFA-style) tiebreaker rules:
 * 1. Points overall
 * 2. Points in head-to-head matches between tied teams
 * 3. Goal difference in head-to-head matches between tied teams
 * 4. Goals scored in head-to-head matches between tied teams
 * 5. Overall goal difference in all group matches
 * 6. Overall goals scored in all group matches
 * 7. Overall matches won in all group matches
 * 8. FIFA ranking (lower is better)
 * 9. Team ID alphabetical order (fallback)
 */
export function sortGroupTeams(teams: Team[], matches: Match[]): Team[] {
  // A recursive function to resolve a list of teams that are tied on overall points
  function resolveTies(teamsSubset: Team[], useH2H: boolean): Team[] {
    if (teamsSubset.length <= 1) return teamsSubset;

    if (useH2H) {
      // Create a mini-table between these teams
      const tiedIds = new Set(teamsSubset.map((t) => t.id));
      const h2hMatches = matches.filter(
        (m) =>
          (m.finished || (m.homeScore != null && m.awayScore != null)) &&
          tiedIds.has(m.homeTeamId) &&
          tiedIds.has(m.awayTeamId)
      );

      const h2hStats = new Map<string, { pts: number; gd: number; gf: number }>();
      teamsSubset.forEach((t) => h2hStats.set(t.id, { pts: 0, gd: 0, gf: 0 }));

      h2hMatches.forEach((m) => {
        const homeScore = m.homeScore ?? 0;
        const awayScore = m.awayScore ?? 0;
        const home = h2hStats.get(m.homeTeamId)!;
        const away = h2hStats.get(m.awayTeamId)!;

        home.gf += homeScore;
        home.gd += homeScore - awayScore;
        away.gf += awayScore;
        away.gd += awayScore - homeScore;

        if (homeScore > awayScore) {
          home.pts += 3;
        } else if (awayScore > homeScore) {
          away.pts += 3;
        } else {
          home.pts += 1;
          away.pts += 1;
        }
      });

      // Sort the subset using h2h stats
      const sorted = [...teamsSubset].sort((a, b) => {
        const statsA = h2hStats.get(a.id)!;
        const statsB = h2hStats.get(b.id)!;

        if (statsB.pts !== statsA.pts) return statsB.pts - statsA.pts;
        if (statsB.gd !== statsA.gd) return statsB.gd - statsA.gd;
        if (statsB.gf !== statsA.gf) return statsB.gf - statsA.gf;
        return 0;
      });

      // Group the sorted subset by their h2h stats to see if we still have ties
      const groupsByH2H = new Map<string, Team[]>();
      const keysOrder: string[] = [];

      sorted.forEach((t) => {
        const stats = h2hStats.get(t.id)!;
        const key = `${stats.pts}_${stats.gd}_${stats.gf}`;
        const list = groupsByH2H.get(key) || [];
        if (list.length === 0) {
          keysOrder.push(key);
        }
        list.push(t);
        groupsByH2H.set(key, list);
      });

      // If the tie was not broken at all (all teams have the same h2h stats), we proceed to overall stats
      if (keysOrder.length === 1 && groupsByH2H.get(keysOrder[0])!.length === teamsSubset.length) {
        return resolveTies(teamsSubset, false);
      }

      // Otherwise, resolve each subgroup recursively
      const result: Team[] = [];
      for (const key of keysOrder) {
        const subGroup = groupsByH2H.get(key)!;
        // Recurse on H2H only if we actually split the tie
        result.push(...resolveTies(subGroup, subGroup.length < teamsSubset.length));
      }
      return result;
    } else {
      // Fallback to overall stats
      const sorted = [...teamsSubset].sort((a, b) => {
        // Overall goal difference
        const gdA = a.gf - a.ga;
        const gdB = b.gf - b.ga;
        if (gdB !== gdA) return gdB - gdA;
        
        // Overall goals scored
        if (b.gf !== a.gf) return b.gf - a.gf;

        // Overall wins
        if (b.won !== a.won) return b.won - a.won;

        // FIFA ranking (lower is better)
        const rankA = a.ranking ?? 999;
        const rankB = b.ranking ?? 999;
        if (rankA !== rankB) return rankA - rankB;

        // Alphabetical/ID order as absolute last resort
        return a.id.localeCompare(b.id);
      });

      // Check if there are still ties on overall stats
      const groupsByOverall = new Map<string, Team[]>();
      const keysOrder: string[] = [];

      sorted.forEach((t) => {
        const key = `${t.gf - t.ga}_${t.gf}_${t.won}_${t.ranking}`;
        const list = groupsByOverall.get(key) || [];
        if (list.length === 0) {
          keysOrder.push(key);
        }
        list.push(t);
        groupsByOverall.set(key, list);
      });

      const result: Team[] = [];
      for (const key of keysOrder) {
        const subGroup = groupsByOverall.get(key)!;
        if (subGroup.length > 1) {
          // Still tied on all stats, sort alphabetically as absolute last resort
          const sortedAlphabetical = [...subGroup].sort((a, b) => a.id.localeCompare(b.id));
          result.push(...sortedAlphabetical);
        } else {
          result.push(subGroup[0]);
        }
      }
      return result;
    }
  }

  // Start by sorting by overall points
  const sortedByPts = [...teams].sort((a, b) => b.pts - a.pts);

  // Group by points
  const groupsByPts = new Map<number, Team[]>();
  const ptsOrder: number[] = [];

  sortedByPts.forEach((t) => {
    const list = groupsByPts.get(t.pts) || [];
    if (list.length === 0) {
      ptsOrder.push(t.pts);
    }
    list.push(t);
    groupsByPts.set(t.pts, list);
  });

  const finalSorted: Team[] = [];
  for (const pts of ptsOrder) {
    const subGroup = groupsByPts.get(pts)!;
    finalSorted.push(...resolveTies(subGroup, subGroup.length > 1));
  }

  return finalSorted;
}
