import fs from "fs";
import path from "path";

// ── Manual Environment Loading ─────────────────────────────────
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, "utf-8");
    for (const line of envFile.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key, ...valueParts] = trimmed.split("=");
        const val = valueParts.join("=").replace(/(^['"]|['"]$)/g, ""); // strip quotes
        process.env[key.trim()] = val.trim();
      }
    }
    console.log("✅ .env.local loaded manually.");
  } else {
    console.warn("⚠️ .env.local not found at process.cwd(). Using existing environment variables.");
  }
} catch (e) {
  console.error("❌ Failed to load .env.local manually:", e);
}

import webpush from "web-push";

// Ensure MONGODB_URI is present
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in the environment.");
  process.exit(1);
}

async function run() {
  try {
    console.log("Connecting to database...");
    const connectDB = (await import("../lib/mongodb")).default;
    const ProdePrediction = (await import("../models/ProdePrediction")).default;
    const User = (await import("../models/User")).default;
    const NotificationModel = (await import("../models/Notification")).default;
    const PushSubscriptionModel = (await import("../models/PushSubscription")).default;

    await connectDB();
    console.log("✅ Connected to database.");

    // 1. Purge predictions for knockout stage (matchId: 73 to 104)
    // We match any numeric string for matchId as knockout matches are string-encoded integers (73-104)
    console.log("Purging knockout predictions from database...");
    const deleteResult = await ProdePrediction.deleteMany({
      matchId: { $regex: /^\d+$/ }
    });
    console.log(`✅ Deleted ${deleteResult.deletedCount} hypothetical knockout predictions.`);

    // 2. Fetch all users
    console.log("Fetching registered users to notify...");
    const users = await User.find({}, { firebaseUid: 1, displayName: 1 });
    console.log(`Found ${users.length} users to notify.`);

    if (users.length === 0) {
      console.log("No users found. Exiting.");
      process.exit(0);
    }

    // 3. Create in-app notifications
    console.log("Inserting general notifications...");
    const title = "⚠️ Pronósticos de fase eliminatoria reiniciados";
    const body = "Se han inhabilitado y limpiado los pronósticos de la segunda fase. Deberás volver a cargarlos una vez finalice la fase de grupos y estén definidas las llaves reales.";
    
    const notificationData = users.map((user) => ({
      firebaseUid: user.firebaseUid,
      type: "general",
      title,
      body,
      icon: "⚠️",
      link: "/prode?tab=predictions",
      read: false,
      sentAt: new Date(),
    }));

    // Perform bulk insertion
    const notifResult = await NotificationModel.insertMany(notificationData);
    console.log(`✅ Inserted ${notifResult.length} in-app notifications.`);

    // 4. Configure web-push with VAPID keys
    const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
    const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
    const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:mailjmq@gmail.com";

    let pushCount = 0;
    if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
      console.log("Configuring web-push notifications...");
      webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

      interface IPushSub {
        _id: unknown;
        firebaseUid: string;
        endpoint: string;
        keys: {
          p256dh: string;
          auth: string;
        };
      }

      // Fetch all push subscriptions
      const subscriptions = (await PushSubscriptionModel.find({})) as unknown as IPushSub[];
      console.log(`Found ${subscriptions.length} push subscriptions.`);

      // Group subscriptions by user to avoid duplicate push calls to the same user
      const subMap = new Map<string, IPushSub[]>();
      for (const sub of subscriptions) {
        if (!subMap.has(sub.firebaseUid)) {
          subMap.set(sub.firebaseUid, []);
        }
        subMap.get(sub.firebaseUid)!.push(sub);
      }

      const payload = JSON.stringify({
        title: "⚠️ Pronósticos de fase eliminatoria",
        body: "Se limpiaron los pronósticos de segunda fase. Deberás cargarlos cuando termine la fase de grupos.",
        icon: "/icon.svg",
        url: "/prode?tab=predictions"
      });

      console.log("Sending push notifications...");
      for (const [uid, userSubs] of subMap.entries()) {
        for (const sub of userSubs) {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
              },
              payload
            );
            pushCount++;
          } catch (err) {
            const errorObj = err as { message?: string; statusCode?: number };
            console.error(`Error sending push to ${uid}:`, errorObj?.message || err);
            // Remove expired/invalid subscriptions
            if (errorObj?.statusCode === 410 || errorObj?.statusCode === 404) {
              console.log(`Removing expired subscription: ${sub._id}`);
              await PushSubscriptionModel.deleteOne({ _id: sub._id });
            }
          }
        }
      }
      console.log(`✅ Sent push notifications to ${pushCount} active subscriptions.`);
    } else {
      console.log("⚠️ VAPID keys not configured. Skipping push notifications.");
    }

    console.log("🎉 Cleanup and notification process finished successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Fatal error in script execution:", error);
    process.exit(1);
  }
}

run();
