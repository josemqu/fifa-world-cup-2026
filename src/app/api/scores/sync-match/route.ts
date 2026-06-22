import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import LiveScore from "@/models/LiveScore";
import User from "@/models/User";
import { fetchFixtures, normalizeFixtures } from "@/services/liveScores";

/**
 * POST /api/scores/sync-match
 *
 * Forces downloading real data from API-Football/worldcup26.ir API for a specific match.
 * Clears manualOverride: false so automatic sync can continue.
 * Protected: only for administrators in production.
 */
export async function POST(request: Request) {
  // 1. Verify authorization (only for production, allow in dev mode)
  if (process.env.NODE_ENV !== "development") {
    const adminEmail = request.headers.get("x-admin-email");
    if (!adminEmail) {
      return NextResponse.json(
        { error: "Authorization is required in production." },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email: adminEmail });
    const isAllowedEmail = adminEmail.toLowerCase().includes("mailjmq");
    const isAdmin = user?.role === "admin";

    if (!isAdmin && !isAllowedEmail) {
      return NextResponse.json(
        { error: "Unauthorized: only administrators can sync matches." },
        { status: 403 }
      );
    }
  }

  try {
    await connectDB();
    const body = await request.json();
    const { matchId } = body;

    if (!matchId) {
      return NextResponse.json(
        { error: "matchId is required." },
        { status: 400 }
      );
    }

    // Fetch fixtures from API
    const fixtures = await fetchFixtures();
    const normalized = normalizeFixtures(fixtures);

    // Find the specific match
    const matchData = normalized.find((m) => m.matchId === matchId);
    if (!matchData) {
      return NextResponse.json(
        { error: `Match with ID ${matchId} was not found in the external API data.` },
        { status: 404 }
      );
    }

    // Force update the match and clear manual override
    const updated = await LiveScore.findOneAndUpdate(
      { matchId },
      {
        $set: {
          externalId: matchData.externalId,
          homeTeamName: matchData.homeTeamName,
          awayTeamName: matchData.awayTeamName,
          homeScore: matchData.homeScore,
          awayScore: matchData.awayScore,
          homePenalties: matchData.homePenalties,
          awayPenalties: matchData.awayPenalties,
          homeScorers: matchData.homeScorers || [],
          awayScorers: matchData.awayScorers || [],
          status: matchData.status,
          elapsed: matchData.elapsed,
          stage: matchData.stage,
          groupId: matchData.groupId,
          manualOverride: false, // Reset manual override to allow auto syncs
          lastSyncAt: new Date(),
        },
      },
      { upsert: true, new: true, returnDocument: 'after' }
    );

    return NextResponse.json({
      success: true,
      score: updated,
    });
  } catch (error: any) {
    console.error("[scores/sync-match] POST Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
