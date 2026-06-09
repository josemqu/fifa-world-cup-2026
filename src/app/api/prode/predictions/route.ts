import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ProdePrediction from "@/models/ProdePrediction";
import { hasMatchStarted } from "@/utils/prodeUtils";
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
    const firebaseUid = searchParams.get("uid");

    if (!firebaseUid) {
      return NextResponse.json(
        { error: "uid query param is required" },
        { status: 400 }
      );
    }

    const predictions = await ProdePrediction.find(
      { firebaseUid },
      { matchId: 1, homeScore: 1, awayScore: 1, homePenalties: 1, awayPenalties: 1, _id: 0 }
    );

    return NextResponse.json({ success: true, data: predictions });
  } catch (error) {
    console.error("Error fetching prode predictions:", error);
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
    const { firebaseUid, predictions } = body;

    if (!firebaseUid) {
      return NextResponse.json(
        { error: "firebaseUid is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(predictions) || predictions.length === 0) {
      return NextResponse.json(
        { error: "predictions array is required" },
        { status: 400 }
      );
    }

    let saved = 0;
    let locked = 0;

    const ops = [];
    for (const pred of predictions) {
      const utcDate = matchDateMap[pred.matchId];
      if (utcDate && hasMatchStarted(utcDate)) {
        locked++;
        continue;
      }

      if (pred.homeScore === null || pred.awayScore === null) {
        ops.push({
          deleteOne: {
            filter: { firebaseUid, matchId: pred.matchId },
          },
        });
      } else {
        ops.push({
          updateOne: {
            filter: { firebaseUid, matchId: pred.matchId },
            update: {
              $set: {
                homeScore: pred.homeScore,
                awayScore: pred.awayScore,
                homePenalties: pred.homePenalties,
                awayPenalties: pred.awayPenalties,
              },
            },
            upsert: true,
          },
        });
      }
      saved++;
    }

    if (ops.length > 0) {
      await ProdePrediction.bulkWrite(ops);
    }

    return NextResponse.json({ success: true, saved, locked });
  } catch (error) {
    console.error("Error saving prode predictions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
