import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import LiveScore from "@/models/LiveScore";
import User from "@/models/User";
import {
  fetchFixtures,
  normalizeFixtures,
  hasLiveMatches,
  getTodayUTC,
} from "@/services/liveScores";
// Track last sync attempt time and result to prevent rapid retries on failure (especially when offline or domain is blocked)
let lastSyncAttemptTime = 0;
let lastSyncFailed = false;

/**
 * Shared sync logic — fetches from API-Football and upserts to MongoDB.
 * Called by both GET (Vercel Cron) and POST (manual trigger).
 */
async function syncScores(date?: string) {
  await connectDB();

  const isAll = !date || date === "all";
  const syncDate = isAll ? undefined : date;

  // 1. Fetch from API-Football
  const fixtures = await fetchFixtures(syncDate);

  if (fixtures.length === 0) {
    return {
      success: true,
      message: isAll ? "No fixtures found" : "No fixtures found for this date",
      date: date || getTodayUTC(),
      updated: 0,
      live: false,
    };
  }

  // 2. Normalize
  const normalized = normalizeFixtures(fixtures);

  // 3. Smart upsert — fetch all existing to optimize database reads
  let updatedCount = 0;
  const existingScores = await LiveScore.find({}).lean();
  const existingMap = new Map(existingScores.map((s) => [s.matchId, s]));

  for (const score of normalized) {
    const existing = existingMap.get(score.matchId);

    // If manualOverride is active, completely skip syncing this match from the external API
    // to preserve all manual updates (score, status, and elapsed time).
    if (existing?.manualOverride) {
      continue;
    }

    const scorersChanged =
      !existing ||
      JSON.stringify(existing.homeScorers || []) !== JSON.stringify(score.homeScorers || []) ||
      JSON.stringify(existing.awayScorers || []) !== JSON.stringify(score.awayScorers || []);

    const hasChanged =
      !existing ||
      existing.homeScore !== score.homeScore ||
      existing.awayScore !== score.awayScore ||
      existing.homePenalties !== score.homePenalties ||
      existing.awayPenalties !== score.awayPenalties ||
      existing.status !== score.status ||
      existing.elapsed !== score.elapsed ||
      scorersChanged;

    if (hasChanged) {
      await LiveScore.findOneAndUpdate(
        { matchId: score.matchId },
        {
          $set: {
            externalId: score.externalId,
            homeTeamName: score.homeTeamName,
            awayTeamName: score.awayTeamName,
            homeScore: score.homeScore,
            awayScore: score.awayScore,
            homePenalties: score.homePenalties,
            awayPenalties: score.awayPenalties,
            homeScorers: score.homeScorers || [],
            awayScorers: score.awayScorers || [],
            status: score.status,
            elapsed: score.elapsed,
            stage: score.stage,
            groupId: score.groupId,
            lastSyncAt: new Date(),
          },
        },
        { upsert: true, returnDocument: 'after' }
      );
      updatedCount++;
    }
  }

  const live = hasLiveMatches(normalized);

  return {
    success: true,
    date: date || "all",
    total: normalized.length,
    updated: updatedCount,
    live,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Verify authorization for sync triggers.
 * Vercel Cron sends an Authorization header with CRON_SECRET.
 */
function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // No secret configured = allow (dev mode)

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * GET /api/scores/sync
 *
 * Dual purpose:
 * 1. If ?action=cron → triggered by Vercel Cron, runs sync (requires auth)
 * 2. Otherwise → returns current scores from MongoDB (public, for frontend polling)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const mockParam = searchParams.get("mock");

  // ─── Mock simulation trigger ────────────────────────────────
  if (mockParam === "true") {
    if (process.env.NODE_ENV !== "development") {
      const adminEmail = request.headers.get("x-admin-email");
      if (!adminEmail) {
        return NextResponse.json(
          { error: "Mock simulation requires authorization in production." },
          { status: 401 }
        );
      }

      await connectDB();
      const user = await User.findOne({ email: adminEmail });
      const isAllowedEmail = adminEmail.toLowerCase().includes("mailjmq");
      const isAdmin = user?.role === "admin";

      if (!isAdmin && !isAllowedEmail) {
        return NextResponse.json(
          { error: "Unauthorized: only administrators can run simulation in production." },
          { status: 403 }
        );
      }
    }

    try {
      await connectDB();
      const mockMatchIds = ["MA1", "MA2", "MB1"];

      if (action === "clear") {
        await LiveScore.deleteMany({ matchId: { $in: mockMatchIds } });
        
        // Restore actual scores for all matches in the database
        await syncScores("all");
        
        const scores = await LiveScore.find({}).lean();
        const liveCount = scores.filter(
          (s) => s.status === "live" || s.status === "halftime"
        ).length;

        return NextResponse.json({
          success: true,
          scores,
          meta: {
            total: scores.length,
            liveCount,
            lastSync: scores.length > 0 ? scores[0].lastSyncAt : null,
          }
        });
      }

      if (action === "force-goal") {
        const currentScores = await LiveScore.find({ matchId: { $in: mockMatchIds } });
        if (currentScores.length > 0) {
          const activeMatches = currentScores.filter(s => s.status === "live" || s.status === "halftime");
          if (activeMatches.length > 0) {
            const randomMatch = activeMatches[Math.floor(Math.random() * activeMatches.length)];
            const isHome = Math.random() < 0.5;
            const scoreToUpdate = isHome ? "homeScore" : "awayScore";
            await LiveScore.findOneAndUpdate(
              { matchId: randomMatch.matchId },
              {
                $inc: { [scoreToUpdate]: 1 },
                $set: { lastSyncAt: new Date() }
              }
            );
          }
        }
      }

      let scores = await LiveScore.find({ matchId: { $in: mockMatchIds } }).lean();

      if (scores.length < 3 || action === "reset") {
        await LiveScore.deleteMany({ matchId: { $in: mockMatchIds } });
        
        const mockMatches = [
          {
            matchId: "MA1",
            externalId: 999001,
            homeTeamName: "México",
            awayTeamName: "Sudáfrica",
            homeScore: 0,
            awayScore: 0,
            homeScorers: [],
            awayScorers: [],
            status: "live",
            elapsed: 1,
            stage: "group",
            groupId: "A",
            lastSyncAt: new Date()
          },
          {
            matchId: "MA2",
            externalId: 999002,
            homeTeamName: "Corea del Sur",
            awayTeamName: "República Checa",
            homeScore: 0,
            awayScore: 0,
            homeScorers: [],
            awayScorers: [],
            status: "live",
            elapsed: 1,
            stage: "group",
            groupId: "A",
            lastSyncAt: new Date()
          },
          {
            matchId: "MB1",
            externalId: 999003,
            homeTeamName: "Canadá",
            awayTeamName: "Bosnia y Herzegovina",
            homeScore: 0,
            awayScore: 0,
            homeScorers: [],
            awayScorers: [],
            status: "live",
            elapsed: 1,
            stage: "group",
            groupId: "B",
            lastSyncAt: new Date()
          }
        ];

        await LiveScore.insertMany(mockMatches);
        scores = await LiveScore.find({ matchId: { $in: mockMatchIds } }).lean();
      } else {
        // Increment simulation tick
        for (const existing of scores) {
          if (existing.status === "finished") continue;

          let newStatus: "scheduled" | "live" | "halftime" | "finished" = existing.status;
          let newElapsed = (existing.elapsed || 0);
          let newHomeScore = existing.homeScore ?? 0;
          let newAwayScore = existing.awayScore ?? 0;
          let simulatedHomeScorers = [...(existing.homeScorers || [])];
          let simulatedAwayScorers = [...(existing.awayScorers || [])];

          if (existing.status === "live") {
            newElapsed += 5;
            if (newElapsed >= 45 && (existing.elapsed || 0) < 45) {
              newStatus = "halftime";
              newElapsed = 45;
            } else if (newElapsed >= 90) {
              newStatus = "finished";
              newElapsed = 90;
            }

            // Goal chance (12%)
            if (newStatus === "live" && Math.random() < 0.12) {
              const minStr = `${newElapsed}'`;
              if (Math.random() < 0.5) {
                newHomeScore += 1;
                simulatedHomeScorers.push({
                  name: getRandomPlayer(existing.homeTeamName),
                  minute: minStr,
                  isPenalty: Math.random() < 0.15,
                  isOwnGoal: false
                });
              } else {
                newAwayScore += 1;
                simulatedAwayScorers.push({
                  name: getRandomPlayer(existing.awayTeamName),
                  minute: minStr,
                  isPenalty: Math.random() < 0.15,
                  isOwnGoal: false
                });
              }
            }
          } else if (existing.status === "halftime") {
            newStatus = "live";
            newElapsed = 46;
          }

          await LiveScore.findOneAndUpdate(
            { matchId: existing.matchId },
            {
              $set: {
                elapsed: newElapsed,
                status: newStatus,
                homeScore: newHomeScore,
                awayScore: newAwayScore,
                homeScorers: simulatedHomeScorers,
                awayScorers: simulatedAwayScorers,
                lastSyncAt: new Date(),
              }
            }
          );
        }

        scores = await LiveScore.find({ matchId: { $in: mockMatchIds } }).lean();
      }

      function getRandomPlayer(teamName: string): string {
        const players: Record<string, string[]> = {
          "México": ["Santiago Giménez", "Hirving Lozano", "Edson Álvarez", "Luis Chávez", "Orbelín Pineda"],
          "Sudáfrica": ["Percy Tau", "Themba Zwane", "Teboho Mokoena", "Khuliso Mudau"],
          "Corea del Sur": ["Heung-min Son", "Hee-chan Hwang", "Kang-in Lee", "Gue-sung Cho"],
          "República Checa": ["Patrik Schick", "Tomas Soucek", "Adam Hlozek", "Vaclav Cerny"],
          "Canadá": ["Alphonso Davies", "Jonathan David", "Cyle Larin", "Tajon Buchanan"],
          "Bosnia y Herzegovina": ["Edin Džeko", "Miralem Pjanić", "Ermedin Demirović", "Luka Menalo"]
        };

        const resolved = resolveTeamNameMock(teamName);
        const teamPlayers = players[resolved];
        if (teamPlayers && teamPlayers.length > 0) {
          return teamPlayers[Math.floor(Math.random() * teamPlayers.length)];
        }
        return `Jugador ${teamName}`;
      }

      function resolveTeamNameMock(name: string): string {
        if (name.includes("México") || name.includes("Mexico")) return "México";
        if (name.includes("Sudáfrica") || name.includes("South Africa")) return "Sudáfrica";
        if (name.includes("Corea") || name.includes("Korea")) return "Corea del Sur";
        if (name.includes("Checa") || name.includes("Czech")) return "República Checa";
        if (name.includes("Canadá") || name.includes("Canada")) return "Canadá";
        if (name.includes("Bosnia")) return "Bosnia y Herzegovina";
        return name;
      }

      const liveCount = scores.filter(
        (s) => s.status === "live" || s.status === "halftime"
      ).length;

      return NextResponse.json({
        success: true,
        scores,
        meta: {
          total: scores.length,
          liveCount,
          lastSync: scores.length > 0 ? scores[0].lastSyncAt : null,
        },
      });
    } catch (error: any) {
      console.error("[scores/sync] Mock error:", error);
      return NextResponse.json(
        { error: error?.message || "Internal Server Error" },
        { status: 500 }
      );
    }
  }

  // ─── Cron trigger ──────────────────────────────────────────
  if (action === "cron") {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const result = await syncScores();
      return NextResponse.json(result);
    } catch (error: any) {
      console.error("[scores/sync] Cron error:", error);
      return NextResponse.json(
        { error: error?.message || "Internal Server Error" },
        { status: 500 }
      );
    }
  }

  // ─── Frontend read (with smart auto-sync) ──────────────────
  try {
    await connectDB();

    const statusFilter = searchParams.get("status");

    // ── Smart auto-sync: if data is stale and there are live matches,
    //    fetch fresh data from API-Football before returning results.
    //    This ensures real-time updates without relying on the cron alone.
    const STALE_THRESHOLD_MS = 25_000; // 25 seconds

    const latestScore = await LiveScore.findOne()
      .sort({ lastSyncAt: -1 })
      .lean();

    const lastSyncTime = latestScore?.lastSyncAt
      ? new Date(latestScore.lastSyncAt).getTime()
      : 0;
    const isStale = Date.now() - lastSyncTime > STALE_THRESHOLD_MS;

    // Check if there are any live/halftime matches or if we have no data at all
    const liveOrHalftimeCount = await LiveScore.countDocuments({
      status: { $in: ["live", "halftime"] },
    });
    const hasNoData = !latestScore;

    const today = getTodayUTC();
    const isDuringTournament = today >= "2026-06-10" && today <= "2026-07-20";

    const isDev = process.env.NODE_ENV === "development";
    // In local development, we don't want to auto-sync on GET requests by default unless explicitly allowed via env
    const disableDevAutoSync = isDev && process.env.ENABLE_DEV_AUTO_SYNC !== "true";

    const now = Date.now();
    const cooldown = lastSyncFailed ? 300_000 : 25_000; // 5 minutes on failure, 25 seconds on success
    const isCooldownActive = now - lastSyncAttemptTime < cooldown;

    // Auto-sync if: data is stale AND not on cooldown AND auto-sync is not disabled in dev
    // AND (there are live matches OR we have no data OR we are during the tournament dates)
    if (!disableDevAutoSync && isStale && !isCooldownActive && (liveOrHalftimeCount > 0 || hasNoData || isDuringTournament)) {
      lastSyncAttemptTime = now;
      try {
        await syncScores();
        lastSyncFailed = false;
      } catch (syncError) {
        lastSyncFailed = true;
        // Auto-sync failed — log and continue with stale data
        console.warn("[scores/sync] Auto-sync from API-Football failed:", syncError);
      }
    }

    // ── Now read (potentially freshly updated) scores from MongoDB
    const query: Record<string, any> = {};

    if (statusFilter === "live") {
      query.status = { $in: ["live", "halftime"] };
    } else if (statusFilter === "finished") {
      query.status = "finished";
    }

    const scores = await LiveScore.find(query)
      .sort({ lastSyncAt: -1 })
      .lean();

    const latestSync = scores.length > 0 ? scores[0].lastSyncAt : null;
    const liveCount = scores.filter(
      (s) => s.status === "live" || s.status === "halftime"
    ).length;

    return NextResponse.json({
      success: true,
      scores,
      meta: {
        total: scores.length,
        liveCount,
        lastSync: latestSync,
      },
    });
  } catch (error: any) {
    console.error("[scores/sync] GET Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scores/sync
 *
 * Manual sync trigger. Accepts optional { date: "YYYY-MM-DD" } in body.
 * Protected by CRON_SECRET.
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let date: string | undefined;
    try {
      const body = await request.json();
      if (body?.date) date = body.date;
    } catch {
      // No body — use today
    }

    const result = await syncScores(date);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[scores/sync] POST Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
