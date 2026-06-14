import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PushSubscriptionModel from "@/models/PushSubscription";

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { firebaseUid, subscription } = body;

    if (!firebaseUid || !subscription?.endpoint || !subscription?.keys) {
      return NextResponse.json(
        { error: "firebaseUid and subscription are required" },
        { status: 400 }
      );
    }

    await PushSubscriptionModel.findOneAndUpdate(
      { firebaseUid, endpoint: subscription.endpoint },
      {
        firebaseUid,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving push subscription:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { firebaseUid, endpoint } = body;

    if (!firebaseUid || !endpoint) {
      return NextResponse.json(
        { error: "firebaseUid and endpoint are required" },
        { status: 400 }
      );
    }

    await PushSubscriptionModel.deleteOne({ firebaseUid, endpoint });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting push subscription:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
