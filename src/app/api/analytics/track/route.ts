import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import UserActivity, { ActivityAction } from "@/models/UserActivity";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { firebaseUid, action, metadata } = body as {
      firebaseUid: string;
      action: ActivityAction;
      metadata?: Record<string, any>;
    };

    if (!firebaseUid || !action) {
      return NextResponse.json(
        { error: "firebaseUid and action are required" },
        { status: 400 }
      );
    }

    // Record activity event
    await UserActivity.create({ firebaseUid, action, metadata });

    // Update user's lastActiveAt
    await User.findOneAndUpdate(
      { firebaseUid },
      { $set: { lastActiveAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error tracking activity:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
