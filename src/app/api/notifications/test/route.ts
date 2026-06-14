import { NextResponse } from "next/server";
import webpush from "web-push";
import connectDB from "@/lib/mongodb";
import PushSubscriptionModel from "@/models/PushSubscription";
import NotificationModel from "@/models/Notification";
import User from "@/models/User";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:mailjmq@gmail.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

async function sendPushToUser(
  firebaseUid: string,
  payload: { title: string; body: string; icon?: string; url?: string }
) {
  const subscriptions = await PushSubscriptionModel.find({ firebaseUid });
  const pushPayload = JSON.stringify(payload);
  let successCount = 0;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
        },
        pushPayload
      );
      successCount++;
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await PushSubscriptionModel.deleteOne({ _id: sub._id });
      }
    }
  }
  return successCount;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Missing email parameter" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const title = "⚽ Prueba de Notificación";
    const body = "¡Tu sistema de notificaciones está configurado y funcionando correctamente!";

    // Create in-app notification
    await NotificationModel.create({
      firebaseUid: user.firebaseUid,
      type: "general",
      title,
      body,
      icon: "⚽",
      link: "/prode",
    });

    // Send push notification
    const pushSentCount = await sendPushToUser(user.firebaseUid, {
      title,
      body,
      icon: "/icon.svg",
      url: "/prode",
    });

    return NextResponse.json({
      success: true,
      message: `Test notification sent to ${user.displayName || email}`,
      firebaseUid: user.firebaseUid,
      inAppCreated: true,
      pushSentCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
