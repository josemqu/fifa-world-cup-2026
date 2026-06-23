import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import LiveScore from "@/models/LiveScore";
import { IScorer } from "@/models/LiveScore";
import { API_TEAM_TO_ID, LOCAL_TEAM_TO_ID } from "@/services/teamMapping";

// ──────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────

interface GoalDetail {
  minute: string;
  isPenalty: boolean;
  matchId: string;
  opponent: string;
}

interface AggregatedScorer {
  name: string;
  team: string;
  goals: number;
  penalties: number;
  ownGoals: number;
  goalDetails: GoalDetail[];
}

// ──────────────────────────────────────────────────
// English → Spanish Team Name Translation
// ──────────────────────────────────────────────────

// Build a reverse map: Team ID → Spanish name
const ID_TO_SPANISH: Record<string, string> = {};
for (const [spanishName, teamId] of Object.entries(LOCAL_TEAM_TO_ID)) {
  ID_TO_SPANISH[teamId] = spanishName;
}

// Build a direct map: English name (lowercased) → Spanish name
const ENGLISH_TO_SPANISH: Record<string, string> = {};
for (const [englishName, teamId] of Object.entries(API_TEAM_TO_ID)) {
  const spanishName = ID_TO_SPANISH[teamId];
  if (spanishName) {
    ENGLISH_TO_SPANISH[englishName.toLowerCase()] = spanishName;
  }
}

/**
 * Translates an English team name to its Spanish equivalent.
 * Falls back to the original name if no translation is found.
 */
function translateTeamName(englishName: string): string {
  if (!englishName) return englishName;

  // Direct lookup (case-insensitive)
  const lower = englishName.toLowerCase();
  if (ENGLISH_TO_SPANISH[lower]) return ENGLISH_TO_SPANISH[lower];

  // Partial match (for edge cases like "Bosnia & Herzegovina" vs "Bosnia and Herzegovina")
  for (const [key, value] of Object.entries(ENGLISH_TO_SPANISH)) {
    if (lower.includes(key) || key.includes(lower)) {
      return value;
    }
  }

  // No translation found — return original
  return englishName;
}

// ──────────────────────────────────────────────────
// Player Name Normalization & Deduplication
// ──────────────────────────────────────────────────

/**
 * Normalizes a player name for consistent aggregation.
 */
function normalizePlayerName(name: string): string {
  return name
    .trim()
    .replace(/\u00A0/g, " ")  // replace non-breaking spaces
    .replace(/\s+/g, " ");     // collapse multiple spaces
}

/**
 * Extracts the surname (last word) from a player name.
 * Handles accented characters correctly.
 */
function extractSurname(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1].toLowerCase();
}

/**
 * Checks if a name looks like an abbreviated form (e.g., "K. Mbappé", "J. David").
 */
function isAbbreviatedName(name: string): boolean {
  return /^[A-ZÁÉÍÓÚÑÇÜ]\.\s/i.test(name.trim());
}

/**
 * Creates a deduplication key for a scorer.
 * Uses surname + team for matching abbreviated vs full names.
 */
function makeDedupKey(name: string, team: string): string {
  return `${extractSurname(name)}__${team.toLowerCase()}`;
}

/**
 * Standard aggregation key — uses full normalized name + team.
 */
function makeScorerKey(name: string, team: string): string {
  return `${normalizePlayerName(name).toLowerCase()}__${team.toLowerCase()}`;
}

// ──────────────────────────────────────────────────
// GET /api/scores/top-scorers
// ──────────────────────────────────────────────────

export async function GET() {
  try {
    await connectDB();

    // Fetch all matches that have started (live, halftime, or finished)
    const matches = await LiveScore.find({
      status: { $in: ["live", "halftime", "finished"] },
    }).lean();

    // Phase 1: Aggregate scorers by exact name + team
    const scorersMap = new Map<string, AggregatedScorer>();
    let totalGoals = 0;
    let totalOwnGoals = 0;
    let matchesWithScorers = 0;

    const addScorer = (
      scorer: IScorer,
      teamName: string,
      opponentName: string,
      matchId: string
    ) => {
      if (!scorer.name) return;

      if (scorer.isOwnGoal) {
        totalOwnGoals++;
        totalGoals++;
        return;
      }

      totalGoals++;
      // Translate team names to Spanish
      const spanishTeam = translateTeamName(teamName);
      const spanishOpponent = translateTeamName(opponentName);

      const key = makeScorerKey(scorer.name, spanishTeam);
      const existing = scorersMap.get(key);

      const goalDetail: GoalDetail = {
        minute: scorer.minute || "",
        isPenalty: !!scorer.isPenalty,
        matchId,
        opponent: spanishOpponent,
      };

      if (existing) {
        existing.goals += 1;
        if (scorer.isPenalty) existing.penalties += 1;
        existing.goalDetails.push(goalDetail);
      } else {
        scorersMap.set(key, {
          name: normalizePlayerName(scorer.name),
          team: spanishTeam,
          goals: 1,
          penalties: scorer.isPenalty ? 1 : 0,
          ownGoals: 0,
          goalDetails: [goalDetail],
        });
      }
    };

    for (const match of matches) {
      const homeScorers: IScorer[] = match.homeScorers || [];
      const awayScorers: IScorer[] = match.awayScorers || [];

      if (homeScorers.length > 0 || awayScorers.length > 0) {
        matchesWithScorers++;
      }

      for (const scorer of homeScorers) {
        addScorer(scorer, match.homeTeamName, match.awayTeamName, match.matchId);
      }
      for (const scorer of awayScorers) {
        addScorer(scorer, match.awayTeamName, match.homeTeamName, match.matchId);
      }
    }

    // Phase 2: Merge entries that are the same player but with abbreviated vs full names.
    // E.g., "K. Mbappé" (France) and "Kylian Mbappé" (France) → "Kylian Mbappé" (France)
    const mergedScorers = new Map<string, AggregatedScorer>();

    // Group by dedup key (surname + team)
    const dedupGroups = new Map<string, AggregatedScorer[]>();
    for (const scorer of scorersMap.values()) {
      const dedupKey = makeDedupKey(scorer.name, scorer.team);
      const group = dedupGroups.get(dedupKey) || [];
      group.push(scorer);
      dedupGroups.set(dedupKey, group);
    }

    for (const [, group] of dedupGroups) {
      if (group.length === 1) {
        // No duplicates — keep as-is
        const s = group[0];
        mergedScorers.set(makeScorerKey(s.name, s.team), s);
        continue;
      }

      // Multiple entries with same surname + team — check if they can be merged
      // Find if there's a mix of abbreviated and full names
      const abbreviated = group.filter((s) => isAbbreviatedName(s.name));
      const full = group.filter((s) => !isAbbreviatedName(s.name));

      if (abbreviated.length > 0 && full.length > 0) {
        // Merge all into the longest (full) name
        // Pick the full name with the most goals as the "canonical" one
        const canonical = full.reduce((best, curr) =>
          curr.name.length > best.name.length ? curr : best
        , full[0]);

        // Merge all others into the canonical entry
        const merged: AggregatedScorer = {
          name: canonical.name,
          team: canonical.team,
          goals: 0,
          penalties: 0,
          ownGoals: 0,
          goalDetails: [],
        };

        for (const entry of group) {
          merged.goals += entry.goals;
          merged.penalties += entry.penalties;
          merged.ownGoals += entry.ownGoals;
          merged.goalDetails.push(...entry.goalDetails);
        }

        mergedScorers.set(makeScorerKey(merged.name, merged.team), merged);
      } else {
        // All are abbreviated or all are full names — can't safely merge
        // (Could be different players with same surname, e.g. two "García")
        for (const s of group) {
          mergedScorers.set(makeScorerKey(s.name, s.team), s);
        }
      }
    }

    // Sort by goals descending, then fewer penalties, then by name
    const topScorers = Array.from(mergedScorers.values()).sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      if (a.penalties !== b.penalties) return a.penalties - b.penalties;
      return a.name.localeCompare(b.name);
    });

    // Find latest sync time
    const latestMatch = matches.reduce(
      (latest, m) => {
        const syncTime = m.lastSyncAt ? new Date(m.lastSyncAt).getTime() : 0;
        return syncTime > latest ? syncTime : latest;
      },
      0
    );

    // Count live matches
    const liveCount = matches.filter(
      (m) => m.status === "live" || m.status === "halftime"
    ).length;

    return NextResponse.json({
      success: true,
      topScorers,
      meta: {
        totalGoals,
        totalOwnGoals,
        totalMatches: matches.length,
        matchesWithScorers,
        uniqueScorers: topScorers.length,
        liveCount,
        lastSync: latestMatch > 0 ? new Date(latestMatch).toISOString() : null,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[top-scorers] GET Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
