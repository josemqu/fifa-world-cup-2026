import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ProdeGroup from "@/models/ProdeGroup";
import ProdePrediction from "@/models/ProdePrediction";
import LiveScore from "@/models/LiveScore";
import {
  generateGroupCode,
  calculatePoints,
  buildMatchDateMap,
  getLocalMidnightInUTC,
} from "@/utils/prodeUtils";

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const firebaseUid = searchParams.get("uid");
    const timezone = searchParams.get("timezone") || "America/Argentina/Buenos_Aires";

    if (!firebaseUid) {
      return NextResponse.json(
        { error: "uid query param is required" },
        { status: 400 }
      );
    }

    const groups = await ProdeGroup.find({ members: firebaseUid });

    if (groups.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const matchDateMap = buildMatchDateMap();
    const today = new Date();
    const todayStart = getLocalMidnightInUTC(today, timezone);

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

    const allMembers = Array.from(new Set(groups.flatMap((g) => g.members)));

    const allPredictions = await ProdePrediction.find({
      firebaseUid: { $in: allMembers },
      matchId: { $in: finishedMatchIds },
    });

    const predsByUser: Record<string, typeof allPredictions> = {};
    for (const pred of allPredictions) {
      if (!predsByUser[pred.firebaseUid]) {
        predsByUser[pred.firebaseUid] = [];
      }
      predsByUser[pred.firebaseUid].push(pred);
    }

    const groupsData = groups.map((group) => {
      const groupCreatedAt = new Date(group.createdAt);

      const leaderboard = group.members.map((uid) => {
        const preds = predsByUser[uid] || [];
        let totalPoints = 0;
        let exactCount = 0;
        let correctCount = 0;
        let yesterdayPoints = 0;
        let yesterdayExact = 0;
        let yesterdayCorrect = 0;

        for (const pred of preds) {
          const utcDateStr = matchDateMap[pred.matchId];
          if (utcDateStr && new Date(utcDateStr) <= groupCreatedAt) {
            continue;
          }

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
          if (pts === 3) exactCount++;
          else if (pts === 1) correctCount++;

          if (utcDateStr && new Date(utcDateStr) < todayStart) {
            yesterdayPoints += pts;
            if (pts === 3) yesterdayExact++;
            else if (pts === 1) yesterdayCorrect++;
          }
        }

        return {
          firebaseUid: uid,
          totalPoints,
          exactCount,
          correctCount,
          yesterdayPoints,
          yesterdayExact,
          yesterdayCorrect,
        };
      });

      // Sort for today standings
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

      const posToday = todayPosMap[firebaseUid];
      const posYesterday = yesterdayPosMap[firebaseUid];

      return {
        _id: group._id,
        name: group.name,
        code: group.code,
        ownerUid: group.ownerUid,
        members: group.members,
        createdAt: group.createdAt,
        userPosition: posToday,
        userPositionChange: posYesterday - posToday,
      };
    });

    return NextResponse.json({ success: true, data: groupsData });
  } catch (error) {
    console.error("Error fetching prode groups:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { firebaseUid, name } = body;

    if (!firebaseUid) {
      return NextResponse.json(
        { error: "firebaseUid is required" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    let code = generateGroupCode();
    let retries = 0;
    while (retries < 10) {
      const existing = await ProdeGroup.findOne({ code });
      if (!existing) break;
      code = generateGroupCode();
      retries++;
    }

    const group = await ProdeGroup.create({
      name,
      code,
      ownerUid: firebaseUid,
      members: [firebaseUid],
    });

    return NextResponse.json({ success: true, data: group });
  } catch (error) {
    console.error("Error creating prode group:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
