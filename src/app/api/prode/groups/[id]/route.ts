import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ProdeGroup from "@/models/ProdeGroup";
import ProdePrediction from "@/models/ProdePrediction";
import LiveScore from "@/models/LiveScore";
import User from "@/models/User";
import { calculatePoints } from "@/utils/prodeUtils";

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
      firebaseUid: { $in: group.members },
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

    const leaderboard = group.members.map((uid: string) => {
      const preds = predictionsByUser[uid] || [];
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

    leaderboard.sort(
      (a: { totalPoints: number }, b: { totalPoints: number }) =>
        b.totalPoints - a.totalPoints
    );

    return NextResponse.json({
      success: true,
      data: { group, leaderboard },
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
