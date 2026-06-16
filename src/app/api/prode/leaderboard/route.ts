import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ProdePrediction from "@/models/ProdePrediction";
import LiveScore from "@/models/LiveScore";
import User from "@/models/User";
import { calculatePoints } from "@/utils/prodeUtils";

interface LeaderboardMatchInfo {
  matchId: string;
  homeScore: number;
  awayScore: number;
  homePenalties?: number;
  awayPenalties?: number;
  actualHomeScore: number;
  actualAwayScore: number;
  actualHomePenalties: number | null;
  actualAwayPenalties: number | null;
}

export async function GET() {
  try {
    await connectDB();

    const finishedMatches = await LiveScore.find({ status: "finished" });
    const finishedMatchIds = finishedMatches.map((m) => m.matchId);

    const scoreMap: Record<
      string,
      { homeScore: number; awayScore: number; homePenalties: number | null; awayPenalties: number | null }
    > = {};
    for (const match of finishedMatches) {
      if (match.homeScore !== null && match.awayScore !== null) {
        scoreMap[match.matchId] = {
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          homePenalties: match.homePenalties,
          awayPenalties: match.awayPenalties,
        };
      }
    }

    const allPredictions = await ProdePrediction.find({
      matchId: { $in: finishedMatchIds },
    });

    const predictionsByUser: Record<
      string,
      Array<{
        matchId: string;
        homeScore: number;
        awayScore: number;
        homePenalties?: number;
        awayPenalties?: number;
      }>
    > = {};
    for (const pred of allPredictions) {
      if (!predictionsByUser[pred.firebaseUid]) {
        predictionsByUser[pred.firebaseUid] = [];
      }
      predictionsByUser[pred.firebaseUid].push(pred);
    }

    const uids = Object.keys(predictionsByUser);

    const users = await User.find(
      { firebaseUid: { $in: uids }, excludeFromStats: { $ne: true } },
      { firebaseUid: 1, displayName: 1, nickname: 1, _id: 0 }
    );

    const leaderboard = users.map((user) => {
      const uid = user.firebaseUid;
      const preds = predictionsByUser[uid] || [];
      let totalPoints = 0;
      let exactCount = 0;
      let correctCount = 0;
      const exactMatches: LeaderboardMatchInfo[] = [];
      const correctMatches: LeaderboardMatchInfo[] = [];

      for (const pred of preds) {
        const actual = scoreMap[pred.matchId];
        if (!actual) continue;
        const pts = calculatePoints(
          pred.homeScore,
          pred.awayScore,
          actual.homeScore,
          actual.awayScore,
          pred.homePenalties,
          pred.awayPenalties,
          actual.homePenalties ?? undefined,
          actual.awayPenalties ?? undefined
        );
        totalPoints += pts;

        const matchInfo = {
          matchId: pred.matchId,
          homeScore: pred.homeScore,
          awayScore: pred.awayScore,
          homePenalties: pred.homePenalties,
          awayPenalties: pred.awayPenalties,
          actualHomeScore: actual.homeScore,
          actualAwayScore: actual.awayScore,
          actualHomePenalties: actual.homePenalties,
          actualAwayPenalties: actual.awayPenalties,
        };

        if (pts === 3) {
          exactCount++;
          exactMatches.push(matchInfo);
        } else if (pts === 1) {
          correctCount++;
          correctMatches.push(matchInfo);
        }
      }

      return {
        firebaseUid: uid,
        displayName: user.displayName || uid,
        nickname: user.nickname || null,
        totalPoints,
        exactCount,
        correctCount,
        totalPredictions: preds.length,
        exactMatches,
        correctMatches,
      };
    });

    leaderboard.sort(
      (a, b) =>
        b.totalPoints - a.totalPoints ||
        b.exactCount - a.exactCount ||
        b.correctCount - a.correctCount
    );

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
