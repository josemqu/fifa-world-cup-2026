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

// ─── worldcup26.ir Types ───────────────────────────────────────

interface WorldCupGame {
  _id: string;
  id: string; // "1" to "104"
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  home_scorers: string | null;
  away_scorers: string | null;
  group: string; // "A"-"L", "R32", "R16", "QF", "SF", "3RD", "FINAL"
  matchday: string;
  local_date: string;
  persian_date: string;
  stadium_id: string;
  finished: string; // "FALSE" or "TRUE"
  time_elapsed: string; // "notstarted", "live", "HT", "FT", or numeric string
  type: string; // "group", "r32", "r16", "qf", "sf", "third", "final"
  home_team_name_en: string;
  home_team_name_fa: string;
  away_team_name_en: string;
  away_team_name_fa: string;
  date?: string; // ISO format date
}

import { IScorer } from "@/models/LiveScore";

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
  homeScorers?: IScorer[];
  awayScorers?: IScorer[];
  status: MatchStatus;
  elapsed: number | null;
  stage: "group" | "knockout";
  groupId?: string;
}

/**
 * Normalizes a player name for consistent storage and aggregation.
 * Handles extra spaces, non-breaking spaces, and common formatting quirks.
 */
function normalizePlayerName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/\u00A0/g, " ")  // replace non-breaking spaces
    .replace(/\s+/g, " ");     // collapse multiple spaces into one

  // Correct API transliteration typos/errors
  const corrections: Record<string, string> = {
    "Jvlian Kviinvnz": "J. Quiñones",
    "Jvd Blingham": "J. Bellingham",
  };

  return corrections[cleaned] || cleaned;
}

/**
 * Parses scorer string from worldcup26.ir.
 * Example input: {"Nestory Irankunda 27'","C. Metcalfe 75'"} or {"J. Quiñones 9'","R. Jiménez 67'"}
 *
 * Names are normalized to ensure consistent aggregation across matches.
 */
export function parseScorerString(scorerStr: string | null): IScorer[] {
  if (!scorerStr || scorerStr === "null") return [];
  const matches: string[] = [];
  const regex = /["“”]([^"“”]+)["“”]/g;
  let match;
  while ((match = regex.exec(scorerStr)) !== null) {
    matches.push(match[1].trim());
  }

  if (matches.length === 0) {
    const clean = scorerStr.replace(/[{}]/g, "").trim();
    if (clean && clean !== "null") {
      matches.push(clean);
    }
  }

  return matches.map((s) => {
    // Regex matching minutes like 90' or 90'+5'
    const scorerRegex = /^(.*?)\s+(\d+(?:'?\+\d+)?')\s*(?:\((p|OG)\))?$/i;
    const parts = s.match(scorerRegex);
    if (parts) {
      return {
        name: normalizePlayerName(parts[1]),
        minute: parts[2],
        isPenalty: parts[3]?.toLowerCase() === "p",
        isOwnGoal: parts[3]?.toUpperCase() === "OG",
      };
    } else {
      return {
        name: normalizePlayerName(s),
        minute: "",
        isPenalty: false,
        isOwnGoal: false,
      };
    }
  });
}

// ─── JWT Authentication Caching ────────────────────────────────

// ─── Fetch with Retry Utility ──────────────────────────────────

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delayMs = 1000
): Promise<Response> {
  let lastError: any;
  const mergedHeaders = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    ...options.headers,
  };
  const mergedOptions = {
    ...options,
    headers: mergedHeaders,
  };
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

    try {
      const res = await fetch(url, {
        ...mergedOptions,
        signal: controller.signal,
      });
      return res;
    } catch (err: any) {
      lastError = err;
      const isTimeout = err.name === "AbortError";
      console.warn(
        `[liveScores] Fetch attempt ${attempt} failed for ${url}: ${
          isTimeout ? "Request timed out after 5000ms" : err.message || err
        }. Retrying in ${delayMs}ms...`
      );
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
  throw lastError;
}

// ─── JWT Authentication Caching ────────────────────────────────

let cachedToken: string | null = null;
let cachedTokenExpiry = 0; // Epoch timestamp in seconds

async function getAuthToken(): Promise<string> {
  const email = process.env.WORLDCUP_API_EMAIL;
  const password = process.env.WORLDCUP_API_PASSWORD;

  if (!email || !password) {
    throw new Error("WORLDCUP_API_EMAIL or WORLDCUP_API_PASSWORD is not set");
  }

  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedTokenExpiry > now + 60) {
    return cachedToken;
  }

  const baseUrl = "https://worldcup26.ir";

  // 1. Try to authenticate
  try {
    const authRes = await fetchWithRetry(`${baseUrl}/auth/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    }, 3, 1000);

    if (authRes.ok) {
      const data = await authRes.json();
      if (data.token) {
        cachedToken = data.token;
        try {
          const payload = JSON.parse(Buffer.from(data.token.split(".")[1], "base64").toString());
          cachedTokenExpiry = payload.exp || (now + 3600);
        } catch {
          cachedTokenExpiry = now + 3600;
        }
        return data.token;
      }
    }
  } catch (err) {
    console.warn("[liveScores] Authentication failed, trying to register:", err);
  }

  // 2. If authentication fails, register the user (self-healing)
  try {
    const regRes = await fetchWithRetry(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Jose API", email, password }),
      cache: "no-store",
    }, 3, 1000);

    const data = await regRes.json();
    if (regRes.ok && data.token) {
      cachedToken = data.token;
      try {
        const payload = JSON.parse(Buffer.from(data.token.split(".")[1], "base64").toString());
        cachedTokenExpiry = payload.exp || (now + 3600);
      } catch {
        cachedTokenExpiry = now + 3600;
      }
      return data.token;
    } else {
      throw new Error(data.error || "Registration failed");
    }
  } catch (err: any) {
    throw new Error(`Authentication/Registration with worldcup26.ir failed: ${err.message}`);
  }
}

// ─── Status Mapping ───────────────────────────────────────────

function normalizeStatus(finished: string, timeElapsed: string): MatchStatus {
  const isFinished =
    finished?.toUpperCase() === "TRUE" ||
    timeElapsed?.toUpperCase() === "FT" ||
    timeElapsed?.toUpperCase() === "FINISHED";
  if (isFinished) return "finished";

  const isHalftime = timeElapsed?.toUpperCase() === "HT";
  if (isHalftime) return "halftime";

  const isLive =
    timeElapsed?.toUpperCase() === "LIVE" ||
    timeElapsed?.toUpperCase() === "1H" ||
    timeElapsed?.toUpperCase() === "2H" ||
    (timeElapsed !== "notstarted" && !isNaN(Number(timeElapsed)));
  if (isLive) return "live";

  return "scheduled";
}

// ─── Core Functions ───────────────────────────────────────────

/**
 * Fetch matches from worldcup26.ir.
 * Retrieves all matches and filters by the requested date if provided.
 */
export async function fetchFixtures(
  date?: string
): Promise<WorldCupGame[]> {
  const token = await getAuthToken();
  const baseUrl = "https://worldcup26.ir";

  const response = await fetchWithRetry(`${baseUrl}/get/games`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  }, 3, 1000);

  if (!response.ok) {
    throw new Error(
      `worldcup26.ir responded with ${response.status}: ${response.statusText}`
    );
  }

  const data = await response.json();
  const games: WorldCupGame[] = data.games || [];

  if (date) {
    // Filter games by date (date parameter is expected as YYYY-MM-DD)
    return games.filter((game) => {
      if (!game.local_date) return false;
      const datePart = game.local_date.split(" ")[0]; // "MM/DD/YYYY"
      const parts = datePart.split("/");
      if (parts.length === 3) {
        const formatted = `${parts[2]}-${parts[0]}-${parts[1]}`; // "YYYY-MM-DD"
        return formatted === date;
      }
      return false;
    });
  }

  return games;
}

/**
 * Normalize worldcup26.ir games into our internal format.
 * Maps team names to internal IDs and resolves match IDs.
 */
export function normalizeFixtures(
  fixtures: WorldCupGame[]
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

  for (const game of fixtures) {
    const homeTeamId = resolveTeamId(game.home_team_name_en);
    const awayTeamId = resolveTeamId(game.away_team_name_en);

    if (!homeTeamId || !awayTeamId) {
      const isPlaceholder =
        !game.home_team_name_en ||
        !game.away_team_name_en ||
        game.home_team_name_en === "undefined" ||
        game.away_team_name_en === "undefined" ||
        game.home_team_name_en === "null" ||
        game.away_team_name_en === "null";

      if (!isPlaceholder) {
        console.warn(
          `[liveScores] Skipping fixture ${game.id}: could not resolve teams ` +
            `"${game.home_team_name_en}" → ${homeTeamId}, "${game.away_team_name_en}" → ${awayTeamId}`
        );
      }
      continue;
    }

    // Determine stage
    const isGroup = game.type === "group";
    const stage = isGroup ? "group" : "knockout";
    const groupId = isGroup ? game.group : undefined;

    let matchId: string | null = null;

    if (stage === "group") {
      // Find the matching group match by home/away team IDs
      matchId = findGroupMatchId(homeTeamId, awayTeamId, allGroupMatches);
      if (!matchId) {
        // Try reversed (sometimes home/away is swapped)
        matchId = findGroupMatchId(awayTeamId, homeTeamId, allGroupMatches);
      }
    } else {
      // For knockout, the match ID maps directly (e.g. "73"-"104")
      matchId = game.id;
    }

    if (!matchId) {
      console.warn(
        `[liveScores] Could not resolve matchId for fixture ${game.id} ` +
          `(${game.home_team_name_en} vs ${game.away_team_name_en})`
      );
      continue;
    }

    // Parse scores and elapsed time
    const homeScore = game.home_score !== null && game.home_score !== "null" ? Number(game.home_score) : null;
    const awayScore = game.away_score !== null && game.away_score !== "null" ? Number(game.away_score) : null;
    
    // Penalties are not explicitly present in the main fields, default to null or parse if available
    const homePenalties = null;
    const awayPenalties = null;

    let elapsed: number | null = null;
    const elapsedUpper = game.time_elapsed?.toUpperCase();
    if (elapsedUpper === "FINISHED" || elapsedUpper === "FT") {
      elapsed = 90;
    } else if (elapsedUpper === "HT") {
      elapsed = 45;
    } else if (game.time_elapsed !== "notstarted" && !isNaN(Number(game.time_elapsed))) {
      elapsed = Number(game.time_elapsed);
    }

    // Parse scorers
    const homeScorers = parseScorerString(game.home_scorers);
    const awayScorers = parseScorerString(game.away_scorers);

    // Patch missing scorers from external API bugs
    if (matchId === "89") {
      const hasMbappe = awayScorers.some((s) => s.name.includes("Mbappé") || s.name.includes("Mbappe"));
      if (!hasMbappe) {
        awayScorers.push({
          name: "Kylian Mbappé",
          minute: "69'",
          isPenalty: true,
          isOwnGoal: false,
        });
      }
    } else if (matchId === "91") {
      const hasNeymar = homeScorers.some((s) => s.name.includes("Neymar"));
      if (!hasNeymar) {
        homeScorers.push({
          name: "Neymar",
          minute: "90+10'",
          isPenalty: true,
          isOwnGoal: false,
        });
      }
    } else if (matchId === "92") {
      const hasKane = awayScorers.some((s) => s.name.includes("Kane"));
      if (!hasKane) {
        awayScorers.push({
          name: "H. Kane",
          minute: "60'",
          isPenalty: true,
          isOwnGoal: false,
        });
      }
      const hasJimenez = homeScorers.some((s) => s.name.includes("Jiménez") || s.name.includes("Jimenez"));
      if (!hasJimenez) {
        homeScorers.push({
          name: "R. Jiménez",
          minute: "69'",
          isPenalty: true,
          isOwnGoal: false,
        });
      }
    }

    results.push({
      matchId,
      externalId: Number(game.id),
      homeTeamId,
      awayTeamId,
      homeTeamName: game.home_team_name_en,
      awayTeamName: game.away_team_name_en,
      homeScore,
      awayScore,
      homePenalties,
      awayPenalties,
      homeScorers,
      awayScorers,
      status: normalizeStatus(game.finished, game.time_elapsed),
      elapsed,
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

