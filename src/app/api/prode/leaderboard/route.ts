import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ProdePrediction from "@/models/ProdePrediction";
import LiveScore from "@/models/LiveScore";
import User from "@/models/User";
import { calculatePoints } from "@/utils/prodeUtils";

export async function GET() {
  try {
    await connectDB();

    const finishedMatches = await LiveScore.find({ status: "finished" });
    const finishedMatchIds = finishedMatches.map((m) => m.matchId);

    const scoreMap: Record<string, { homeScore: number; awayScore: number }> =
      {};
    for (const match of finishedMatches) {
      if (match.homeScore !== null && match.awayScore !== null) {
        scoreMap[match.matchId] = {
          homeScore: match.homeScore,
          awayScore: match.awayScore,
        };
      }
    }

    const allPredictions = await ProdePrediction.find({
      matchId: { $in: finishedMatchIds },
    });

    const predictionsByUser: Record<
      string,
      Array<{ matchId: string; homeScore: number; awayScore: number }>
    > = {};
    for (const pred of allPredictions) {
      if (!predictionsByUser[pred.firebaseUid]) {
        predictionsByUser[pred.firebaseUid] = [];
      }
      predictionsByUser[pred.firebaseUid].push(pred);
    }

    const uids = Object.keys(predictionsByUser);

    const users = await User.find(
      { firebaseUid: { $in: uids } },
      { firebaseUid: 1, displayName: 1, nickname: 1, _id: 0 }
    );
    const userMap: Record<
      string,
      { displayName: string; nickname?: string }
    > = {};
    for (const user of users) {
      userMap[user.firebaseUid] = {
        displayName: user.displayName,
        nickname: user.nickname,
      };
    }

    const leaderboard = uids.map((uid) => {
      const preds = predictionsByUser[uid];
      let totalPoints = 0;
      let exactCount = 0;
      let correctCount = 0;

      for (const pred of preds) {
        const actual = scoreMap[pred.matchId];
        if (!actual) continue;
        const pts = calculatePoints(
          pred.homeScore,
          pred.awayScore,
          actual.homeScore,
          actual.awayScore
        );
        totalPoints += pts;
        if (pts === 3) exactCount++;
        if (pts === 1) correctCount++;
      }

      const profile = userMap[uid] || {};
      return {
        firebaseUid: uid,
        displayName: profile.displayName || uid,
        nickname: profile.nickname || null,
        totalPoints,
        exactCount,
        correctCount,
        totalPredictions: preds.length,
      };
    });

    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

    return NextResponse.json({
      success: true,
      data: leaderboard.slice(0, 100),
    });
  } catch (error) {
    console.error("Error fetching global leaderboard:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
