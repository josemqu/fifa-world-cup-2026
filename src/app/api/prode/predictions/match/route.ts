import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ProdeGroup from "@/models/ProdeGroup";
import ProdePrediction from "@/models/ProdePrediction";
import LiveScore from "@/models/LiveScore";
import User from "@/models/User";
import { calculatePoints, hasMatchStarted } from "@/utils/prodeUtils";
import { INITIAL_GROUPS } from "@/data/initialData";
import {
  R32_MATCHES,
  R16_MATCHES,
  QF_MATCHES,
  SF_MATCHES,
  FINAL_MATCHES,
} from "@/data/knockoutData";

function buildMatchDateMap(): Record<string, string> {
  const map: Record<string, string> = {};

  for (const group of INITIAL_GROUPS) {
    for (const match of group.matches) {
      map[match.id] = match.utcDate;
    }
  }

  const knockoutArrays = [
    R32_MATCHES,
    R16_MATCHES,
    QF_MATCHES,
    SF_MATCHES,
    FINAL_MATCHES,
  ];
  for (const arr of knockoutArrays) {
    for (const match of arr) {
      if (match.utcDate) {
        map[match.id] = match.utcDate;
      }
    }
  }

  return map;
}

const matchDateMap = buildMatchDateMap();

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get("matchId");
    const uid = searchParams.get("uid");

    if (!matchId || !uid) {
      return NextResponse.json(
        { error: "matchId and uid query params are required" },
        { status: 400 }
      );
    }

    // Security: Check if match has started
    const utcDate = matchDateMap[matchId];
    const started = utcDate ? hasMatchStarted(utcDate) : true;
    if (!started) {
      return NextResponse.json(
        { error: "El partido aún no ha comenzado. Los pronósticos se revelarán al inicio del encuentro." },
        { status: 403 }
      );
    }

    // 1. Find all groups where the current user is a member
    const userGroups = await ProdeGroup.find({ members: uid });
    if (userGroups.length === 0) {
      return NextResponse.json({ success: true, groups: [] });
    }

    // 2. Gather all unique member IDs across all these groups
    const allMemberUids = new Set<string>();
    for (const g of userGroups) {
      for (const m of g.members) {
        allMemberUids.add(m);
      }
    }
    const memberUidsArray = Array.from(allMemberUids);

    // 3. Fetch user profiles for these members
    const users = await User.find(
      { firebaseUid: { $in: memberUidsArray } },
      { firebaseUid: 1, displayName: 1, nickname: 1, _id: 0 }
    );
    const userMap = new Map<string, { displayName: string; nickname?: string }>();
    for (const user of users) {
      userMap.set(user.firebaseUid, {
        displayName: user.displayName || user.firebaseUid,
        nickname: user.nickname,
      });
    }

    // 4. Fetch predictions for this matchId and these members
    const predictions = await ProdePrediction.find({
      matchId,
      firebaseUid: { $in: memberUidsArray },
    });
    const predictionMap = new Map<string, typeof predictions[0]>();
    for (const pred of predictions) {
      predictionMap.set(pred.firebaseUid, pred);
    }

    // 5. Fetch actual match score from LiveScore to calculate points
    const liveScore = await LiveScore.findOne({ matchId });
    const isFinished = liveScore?.status === "finished";
    const actualScore = isFinished && liveScore.homeScore !== null && liveScore.awayScore !== null
      ? {
          homeScore: liveScore.homeScore,
          awayScore: liveScore.awayScore,
          homePenalties: liveScore.homePenalties ?? undefined,
          awayPenalties: liveScore.awayPenalties ?? undefined,
        }
      : null;

    // 6. Construct response grouped by ProdeGroup
    const responseGroups = userGroups.map((group) => {
      const membersData = group.members.map((memberUid) => {
        const profile = userMap.get(memberUid) || { displayName: memberUid };
        const pred = predictionMap.get(memberUid);
        
        let points = null;
        if (actualScore && pred) {
          points = calculatePoints(
            pred.homeScore,
            pred.awayScore,
            actualScore.homeScore,
            actualScore.awayScore,
            pred.homePenalties ?? undefined,
            pred.awayPenalties ?? undefined,
            actualScore.homePenalties,
            actualScore.awayPenalties
          );
        }

        return {
          firebaseUid: memberUid,
          displayName: profile.displayName,
          nickname: profile.nickname || null,
          prediction: pred
            ? {
                homeScore: pred.homeScore,
                awayScore: pred.awayScore,
                homePenalties: pred.homePenalties ?? null,
                awayPenalties: pred.awayPenalties ?? null,
              }
            : null,
          points,
        };
      });

      // Sort group members by points or display name
      // Let's sort: current user first, then others alphabetically by display name
      membersData.sort((a, b) => {
        if (a.firebaseUid === uid) return -1;
        if (b.firebaseUid === uid) return 1;
        return a.displayName.localeCompare(b.displayName);
      });

      return {
        _id: group._id,
        name: group.name,
        code: group.code,
        members: membersData,
      };
    });

    return NextResponse.json({
      success: true,
      groups: responseGroups,
      actualScore,
    });
  } catch (error) {
    console.error("Error fetching rival match predictions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
