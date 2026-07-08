import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ProdeGroup from "@/models/ProdeGroup";
import UserActivity from "@/models/UserActivity";

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { firebaseUid, code } = body;

    if (!firebaseUid) {
      return NextResponse.json(
        { error: "firebaseUid is required" },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "code is required" },
        { status: 400 }
      );
    }

    const group = await ProdeGroup.findOneAndUpdate(
      { code: code.toUpperCase() },
      { $addToSet: { members: firebaseUid } },
      { returnDocument: 'after' }
    );

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    // Track group joining activity
    try {
      await UserActivity.create({
        firebaseUid,
        action: "GROUP_JOINED",
        metadata: {
          groupId: group._id,
          name: group.name,
          code: group.code,
        },
      });
    } catch (logError) {
      console.error("Error logging GROUP_JOINED activity:", logError);
    }

    return NextResponse.json({ success: true, data: group });
  } catch (error) {
    console.error("Error joining prode group:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
