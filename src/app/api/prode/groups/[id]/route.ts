import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ProdeGroup from "@/models/ProdeGroup";
import ProdePrediction from "@/models/ProdePrediction";
import LiveScore from "@/models/LiveScore";
import User from "@/models/User";
import { calculatePoints, buildMatchDateMap } from "@/utils/prodeUtils";

const matchDateMap = buildMatchDateMap();

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const group = await ProdeGroup.findById(id);
    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    const groupCreatedAt = new Date(group.createdAt);
    const finishedMatches = await LiveScore.find({ status: "finished" });
    
    const filteredFinishedMatches = finishedMatches.filter((m) => {
      const utcDateStr = matchDateMap[m.matchId];
      if (!utcDateStr) return true;
      return new Date(utcDateStr) > groupCreatedAt;
    });

    const finishedMatchIds = filteredFinishedMatches.map((m) => m.matchId);

    const scoreMap: Record<
      string,
      { homeScore: number; awayScore: number; homePenalties: number | null; awayPenalties: number | null }
    > = {};
    for (const match of filteredFinishedMatches) {
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
      firebaseUid: { $in: group.members },
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

    const users = await User.find(
      { firebaseUid: { $in: group.members } },
      { firebaseUid: 1, displayName: 1, nickname: 1, photoURL: 1, _id: 0 }
    );
    const userMap: Record<
      string,
      { displayName: string; nickname?: string; photoURL?: string }
    > = {};
    for (const user of users) {
      userMap[user.firebaseUid] = {
        displayName: user.displayName,
        nickname: user.nickname,
      };
    }

    const today = new Date();
    const todayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    const leaderboard = group.members.map((uid: string) => {
      const preds = predictionsByUser[uid] || [];
      let totalPoints = 0;
      let exactCount = 0;
      let correctCount = 0;
      let yesterdayPoints = 0;
      let yesterdayExact = 0;
      let yesterdayCorrect = 0;
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

        // Calculate yesterday stats
        const utcDateStr = matchDateMap[pred.matchId];
        if (utcDateStr && new Date(utcDateStr) < todayStart) {
          yesterdayPoints += pts;
          if (pts === 3) {
            yesterdayExact++;
          } else if (pts === 1) {
            yesterdayCorrect++;
          }
        }
      }

      const profile = userMap[uid] || {};
      return {
        firebaseUid: uid,
        displayName: profile.displayName || uid,
        nickname: profile.nickname || null,
        totalPoints,
        exactCount,
        correctCount,
        yesterdayPoints,
        yesterdayExact,
        yesterdayCorrect,
        totalPredictions: preds.length,
        exactMatches,
        correctMatches,
      };
    });

    // Sort for current standings
    const todaySorted = [...leaderboard].sort(
      (a, b) =>
        b.totalPoints - a.totalPoints ||
        b.exactCount - a.exactCount ||
        b.correctCount - a.correctCount
    );

    const todayPosMap: Record<string, number> = {};
    todaySorted.forEach((user, idx) => {
      todayPosMap[user.firebaseUid] = idx + 1;
    });

    // Sort for yesterday standings
    const yesterdaySorted = [...leaderboard].sort(
      (a, b) =>
        b.yesterdayPoints - a.yesterdayPoints ||
        b.yesterdayExact - a.yesterdayExact ||
        b.yesterdayCorrect - a.yesterdayCorrect
    );

    const yesterdayPosMap: Record<string, number> = {};
    yesterdaySorted.forEach((user, idx) => {
      yesterdayPosMap[user.firebaseUid] = idx + 1;
    });

    const finalLeaderboard = todaySorted.map((user) => {
      const posToday = todayPosMap[user.firebaseUid];
      const posYesterday = yesterdayPosMap[user.firebaseUid];
      return {
        firebaseUid: user.firebaseUid,
        displayName: user.displayName,
        nickname: user.nickname,
        totalPoints: user.totalPoints,
        exactCount: user.exactCount,
        correctCount: user.correctCount,
        totalPredictions: user.totalPredictions,
        exactMatches: user.exactMatches,
        correctMatches: user.correctMatches,
        positionChange: posYesterday - posToday,
      };
    });

    return NextResponse.json({
      success: true,
      data: { group, leaderboard: finalLeaderboard },
    });
  } catch (error) {
    console.error("Error fetching prode group:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const ownerUid = searchParams.get("ownerUid");

    if (!ownerUid) {
      return NextResponse.json(
        { error: "ownerUid is required" },
        { status: 400 }
      );
    }

    const group = await ProdeGroup.findById(id);
    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    if (group.ownerUid !== ownerUid) {
      return NextResponse.json(
        { error: "Only the owner can delete this group" },
        { status: 403 }
      );
    }

    await ProdeGroup.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting prode group:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
