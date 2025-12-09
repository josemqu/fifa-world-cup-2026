import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Prediction from "@/models/Prediction";

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { firebaseUid, groupStage, knockoutStage, champion, isComplete } =
      body;

    if (!firebaseUid) {
      return NextResponse.json(
        { error: "firebaseUid is required" },
        { status: 400 }
      );
    }

    // Upsert prediction for the user
    const prediction = await Prediction.findOneAndUpdate(
      { firebaseUid },
      {
        $set: {
          groupStage,
          knockoutStage,
          champion,
          isComplete,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, data: prediction });
  } catch (error) {
    console.error("Error saving prediction:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const firebaseUid = searchParams.get("uid");

    if (!firebaseUid) {
      return NextResponse.json(
        { error: "firebaseUid query param is required" },
        { status: 400 }
      );
    }

    const prediction = await Prediction.findOne({ firebaseUid });

    if (!prediction) {
      // It's okay if no prediction exists yet, just return null data
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({ success: true, data: prediction });
  } catch (error) {
    console.error("Error fetching prediction:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
