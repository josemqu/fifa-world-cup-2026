/**
 * Live Scores Service
 *
 * Fetches match data from API-Football, normalizes it,
 * and maps it to internal match IDs.
 *
 * Architecture:
 *   Vercel Cron → API Route → this service → MongoDB
 *   Frontend → API Route (GET) → MongoDB → TournamentContext
 */

import {
  resolveTeamId,
  getGroupFromTeamId,
  findGroupMatchId,
} from "./teamMapping";
import { INITIAL_GROUPS } from "@/data/initialData";

// ─── API-Football Types ───────────────────────────────────────

interface APIFootballFixture {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string; // NS, 1H, HT, 2H, ET, BT, P, FT, AET, PEN, etc.
      elapsed: number | null;
    };
    venue: {
      name: string | null;
      city: string | null;
    };
  };
  league: {
    id: number;
    name: string;
    round: string; // "Group A - 1", "Round of 32", etc.
  };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    penalty: {
      home: number | null;
      away: number | null;
    };
  };
}

interface APIFootballResponse {
  response: APIFootballFixture[];
  errors: Record<string, string>;
  results: number;
}

// ─── Normalized Types ─────────────────────────────────────────

export type MatchStatus = "scheduled" | "live" | "halftime" | "finished";

export interface NormalizedScore {
  matchId: string; // Internal ID: MA1, MB2, "73", etc.
  externalId: number;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
  status: MatchStatus;
  elapsed: number | null;
  stage: "group" | "knockout";
  groupId?: string;
}

// ─── Status Mapping ───────────────────────────────────────────

const LIVE_STATUSES = new Set(["1H", "2H", "ET", "BT", "P", "LIVE", "INT"]);
const HALFTIME_STATUSES = new Set(["HT"]);
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN", "AWD", "WO"]);

function normalizeStatus(short: string): MatchStatus {
  if (FINISHED_STATUSES.has(short)) return "finished";
  if (HALFTIME_STATUSES.has(short)) return "halftime";
  if (LIVE_STATUSES.has(short)) return "live";
  return "scheduled";
}

// ─── Round Parsing ────────────────────────────────────────────

interface ParsedRound {
  stage: "group" | "knockout";
  groupId?: string;
}

function parseRound(round: string): ParsedRound {
  // API-Football rounds look like:
  //   "Group A - 1", "Group B - 3"
  //   "Round of 32", "Round of 16", "Quarter-finals", etc.
  const groupMatch = round.match(/Group\s+([A-L])/i);
  if (groupMatch) {
    return { stage: "group", groupId: groupMatch[1] };
  }
  return { stage: "knockout" };
}

// ─── Core Functions ───────────────────────────────────────────

/**
 * Fetch today's World Cup fixtures from API-Football.
 * Uses a single request to get ALL matches for the given date.
 */
export async function fetchFixtures(
  date?: string
): Promise<APIFootballFixture[]> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    throw new Error("API_FOOTBALL_KEY environment variable is not set");
  }

  const baseUrl =
    process.env.API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io";
  const leagueId = process.env.FIFA_WC_LEAGUE_ID || "1";
  const season = process.env.FIFA_WC_SEASON || "2026";

  // If no date provided, fetch all matches for the season (or today's date)
  const params = new URLSearchParams({
    league: leagueId,
    season: season,
  });

  if (date) {
    params.set("date", date); // YYYY-MM-DD
  }

  const url = `${baseUrl}/fixtures?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `API-Football responded with ${response.status}: ${response.statusText}`
    );
  }

  const data: APIFootballResponse = await response.json();

  if (data.errors && Object.keys(data.errors).length > 0) {
    console.error("[liveScores] API-Football errors:", data.errors);
  }

  return data.response || [];
}

/**
 * Normalize API-Football fixtures into our internal format.
 * Maps team names to internal IDs and resolves match IDs.
 */
export function normalizeFixtures(
  fixtures: APIFootballFixture[]
): NormalizedScore[] {
  const results: NormalizedScore[] = [];

  // Build a flat list of all group matches for lookup
  const allGroupMatches = INITIAL_GROUPS.flatMap((g) =>
    g.matches.map((m) => ({
      id: m.id,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
    }))
  );

  for (const fixture of fixtures) {
    const homeTeamId = resolveTeamId(fixture.teams.home.name);
    const awayTeamId = resolveTeamId(fixture.teams.away.name);

    if (!homeTeamId || !awayTeamId) {
      console.warn(
        `[liveScores] Skipping fixture ${fixture.fixture.id}: could not resolve teams ` +
          `"${fixture.teams.home.name}" → ${homeTeamId}, "${fixture.teams.away.name}" → ${awayTeamId}`
      );
      continue;
    }

    const { stage, groupId } = parseRound(fixture.league.round);

    let matchId: string | null = null;

    if (stage === "group") {
      // Find the matching group match by home/away team IDs
      matchId = findGroupMatchId(homeTeamId, awayTeamId, allGroupMatches);
      if (!matchId) {
        // Try reversed (sometimes home/away is swapped)
        matchId = findGroupMatchId(awayTeamId, homeTeamId, allGroupMatches);
      }
    } else {
      // For knockout, we need to map by fixture structure
      // API-Football rounds: "Round of 32", "Round of 16", "Quarter-finals", etc.
      // For now, we try to match by external fixture ID stored in MongoDB
      // This will be populated during initial setup
      matchId = `ext_${fixture.fixture.id}`;
    }

    if (!matchId) {
      console.warn(
        `[liveScores] Could not resolve matchId for fixture ${fixture.fixture.id} ` +
          `(${fixture.teams.home.name} vs ${fixture.teams.away.name})`
      );
      continue;
    }

    results.push({
      matchId,
      externalId: fixture.fixture.id,
      homeTeamId,
      awayTeamId,
      homeTeamName: fixture.teams.home.name,
      awayTeamName: fixture.teams.away.name,
      homeScore: fixture.goals.home,
      awayScore: fixture.goals.away,
      homePenalties: fixture.score.penalty.home,
      awayPenalties: fixture.score.penalty.away,
      status: normalizeStatus(fixture.fixture.status.short),
      elapsed: fixture.fixture.status.elapsed,
      stage,
      groupId,
    });
  }

  return results;
}

/**
 * Check if there are any live matches today.
 * Used by the cron to decide polling frequency.
 */
export function hasLiveMatches(scores: NormalizedScore[]): boolean {
  return scores.some((s) => s.status === "live" || s.status === "halftime");
}

/**
 * Get today's date in YYYY-MM-DD format (UTC).
 */
export function getTodayUTC(): string {
  return new Date().toISOString().split("T")[0];
}
