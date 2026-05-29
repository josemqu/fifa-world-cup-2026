import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import LiveScore from "@/models/LiveScore";
import {
  fetchFixtures,
  normalizeFixtures,
  hasLiveMatches,
  getTodayUTC,
} from "@/services/liveScores";

/**
 * Shared sync logic — fetches from API-Football and upserts to MongoDB.
 * Called by both GET (Vercel Cron) and POST (manual trigger).
 */
async function syncScores(date?: string) {
  await connectDB();

  const syncDate = date || getTodayUTC();

  // 1. Fetch from API-Football
  const fixtures = await fetchFixtures(syncDate);

  if (fixtures.length === 0) {
    return {
      success: true,
      message: "No fixtures found for this date",
      date: syncDate,
      updated: 0,
      live: false,
    };
  }

  // 2. Normalize
  const normalized = normalizeFixtures(fixtures);

  // 3. Smart upsert — only update if scores changed
  let updatedCount = 0;
  for (const score of normalized) {
    const existing = await LiveScore.findOne({ matchId: score.matchId });

    const hasChanged =
      !existing ||
      existing.homeScore !== score.homeScore ||
      existing.awayScore !== score.awayScore ||
      existing.homePenalties !== score.homePenalties ||
      existing.awayPenalties !== score.awayPenalties ||
      existing.status !== score.status ||
      existing.elapsed !== score.elapsed;

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
            status: score.status,
            elapsed: score.elapsed,
            stage: score.stage,
            groupId: score.groupId,
            lastSyncAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );
      updatedCount++;
    }
  }

  const live = hasLiveMatches(normalized);

  return {
    success: true,
    date: syncDate,
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
      return NextResponse.json(
        { error: "Mock simulation is only allowed in the development environment." },
        { status: 403 }
      );
    }

    try {
      await connectDB();
      const mockMatchIds = ["MA1", "MA2", "MB1"];

      if (action === "clear") {
        await LiveScore.deleteMany({ matchId: { $in: mockMatchIds } });
        return NextResponse.json({
          success: true,
          scores: [],
          meta: { total: 0, liveCount: 0, lastSync: null }
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
            awayTeamName: "Chequia",
            homeScore: 0,
            awayScore: 0,
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
              if (Math.random() < 0.5) {
                newHomeScore += 1;
              } else {
                newAwayScore += 1;
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
                lastSyncAt: new Date(),
              }
            }
          );
        }

        scores = await LiveScore.find({ matchId: { $in: mockMatchIds } }).lean();
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

  // ─── Frontend read ─────────────────────────────────────────
  try {
    await connectDB();

    const statusFilter = searchParams.get("status");

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
