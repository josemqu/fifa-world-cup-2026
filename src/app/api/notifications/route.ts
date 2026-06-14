import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import NotificationModel from "@/models/Notification";

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    if (!uid) {
      return NextResponse.json(
        { error: "uid query param is required" },
        { status: 400 }
      );
    }

    const filter: Record<string, unknown> = { firebaseUid: uid };
    if (unreadOnly) {
      filter.read = false;
    }

    const notifications = await NotificationModel.find(filter)
      .sort({ sentAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await NotificationModel.countDocuments({
      firebaseUid: uid,
      read: false,
    });

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { firebaseUid, notificationIds, markAllRead } = body;

    if (!firebaseUid) {
      return NextResponse.json(
        { error: "firebaseUid is required" },
        { status: 400 }
      );
    }

    if (markAllRead) {
      await NotificationModel.updateMany(
        { firebaseUid, read: false },
        { $set: { read: true } }
      );
    } else if (Array.isArray(notificationIds) && notificationIds.length > 0) {
      await NotificationModel.updateMany(
        { _id: { $in: notificationIds }, firebaseUid },
        { $set: { read: true } }
      );
    } else {
      return NextResponse.json(
        { error: "notificationIds or markAllRead is required" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
