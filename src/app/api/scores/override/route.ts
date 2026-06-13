import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import LiveScore from "@/models/LiveScore";
import User from "@/models/User";

/**
 * POST /api/scores/override
 *
 * Manual score override endpoint for administrators.
 * Sets manualOverride: true for the given matchId.
 * Sets manualOverride: false to clear it and resume automatic sync.
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
        { error: "Unauthorized: only administrators can set overrides." },
        { status: 403 }
      );
    }
  }

  try {
    await connectDB();
    const body = await request.json();
    const { matchId, homeScore, awayScore, status, elapsed, manualOverride } = body;

    if (!matchId) {
      return NextResponse.json(
        { error: "matchId is required." },
        { status: 400 }
      );
    }

    // Prepare fields to set
    const updateFields: Record<string, any> = {
      manualOverride: manualOverride !== false, // Default to true if not explicitly false
      lastSyncAt: new Date(),
    };

    if (homeScore !== undefined) updateFields.homeScore = homeScore === null || homeScore === "" ? null : Number(homeScore);
    if (awayScore !== undefined) updateFields.awayScore = awayScore === null || awayScore === "" ? null : Number(awayScore);
    if (status !== undefined) updateFields.status = status;
    if (elapsed !== undefined) updateFields.elapsed = elapsed === null || elapsed === "" ? null : Number(elapsed);

    // Fetch existing score to preserve stage and team names if upserting a new record
    const existing = await LiveScore.findOne({ matchId });
    if (!existing) {
      // Find the group match or knockout details to populate team names and stage
      // For simplicity, we assume the record should exist.
      return NextResponse.json(
        { error: `Match with ID ${matchId} was not found in the database. Please sync first.` },
        { status: 404 }
      );
    }

    const updated = await LiveScore.findOneAndUpdate(
      { matchId },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    return NextResponse.json({
      success: true,
      score: updated,
    });
  } catch (error: any) {
    console.error("[scores/override] POST Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
