import { NextResponse } from "next/server";
import webpush from "web-push";
import connectDB from "@/lib/mongodb";
import PushSubscriptionModel from "@/models/PushSubscription";
import NotificationModel from "@/models/Notification";
import ProdePrediction from "@/models/ProdePrediction";
import LiveScore from "@/models/LiveScore";
import User from "@/models/User";
import { INITIAL_GROUPS } from "@/data/initialData";
import { KNOCKOUT_DETAILS } from "@/data/knockoutDetails";
import {
  R32_MATCHES,
  R16_MATCHES,
  QF_MATCHES,
  SF_MATCHES,
  FINAL_MATCHES,
} from "@/data/knockoutData";
import { calculatePoints } from "@/utils/prodeUtils";

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:mailjmq@gmail.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// Build match date map (same as predictions route)
function buildMatchDateMap(): Record<string, { utcDate: string; label: string }> {
  const map: Record<string, { utcDate: string; label: string }> = {};

  for (const group of INITIAL_GROUPS) {
    for (const match of group.matches) {
      const homeTeam = group.teams.find((t) => t.id === match.homeTeamId);
      const awayTeam = group.teams.find((t) => t.id === match.awayTeamId);
      map[match.id] = {
        utcDate: match.utcDate,
        label: `${homeTeam?.name || match.homeTeamId} vs ${awayTeam?.name || match.awayTeamId}`,
      };
    }
  }

  const allKnockout = [
    ...R32_MATCHES,
    ...R16_MATCHES,
    ...QF_MATCHES,
    ...SF_MATCHES,
    ...FINAL_MATCHES,
  ];

  for (const m of allKnockout) {
    const details = KNOCKOUT_DETAILS[m.id];
    if (details) {
      map[m.id] = {
        utcDate: details.utcDate,
        label: `${(m as Record<string, string>).home || "TBD"} vs ${(m as Record<string, string>).away || "TBD"}`,
      };
    }
  }

  return map;
}

const matchDateMap = buildMatchDateMap();

// Send push notification to a user, handling expired subscriptions
async function sendPushToUser(
  firebaseUid: string,
  payload: { title: string; body: string; icon?: string; url?: string }
) {
  const subscriptions = await PushSubscriptionModel.find({ firebaseUid });
  const pushPayload = JSON.stringify(payload);

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
        },
        pushPayload
      );
    } catch (err: unknown) {
      const error = err as { statusCode?: number };
      // Remove expired/invalid subscriptions
      if (error.statusCode === 410 || error.statusCode === 404) {
        await PushSubscriptionModel.deleteOne({ _id: sub._id });
      }
    }
  }
}

// ─── MISSING PREDICTIONS ────────────────────────────────────────
async function handleMissingPredictions() {
  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  // Find matches starting in the next 2 hours
  const upcomingMatchIds: string[] = [];
  const upcomingMatchLabels: Record<string, string> = {};

  for (const [matchId, info] of Object.entries(matchDateMap)) {
    const matchDate = new Date(info.utcDate);
    if (matchDate > now && matchDate <= twoHoursFromNow) {
      upcomingMatchIds.push(matchId);
      upcomingMatchLabels[matchId] = info.label;
    }
  }

  if (upcomingMatchIds.length === 0) {
    return { sent: 0, message: "No upcoming matches in the next 2 hours" };
  }

  // Get all users who have at least one prediction (active prode users)
  const activeUserUids = await ProdePrediction.distinct("firebaseUid");

  if (activeUserUids.length === 0) {
    return { sent: 0, message: "No active prode users" };
  }

  // For each upcoming match, find which users are missing predictions
  const existingPredictions = await ProdePrediction.find({
    matchId: { $in: upcomingMatchIds },
    firebaseUid: { $in: activeUserUids },
  });

  // Build a set of "uid:matchId" that already have predictions
  const hasPrediction = new Set(
    existingPredictions.map((p) => `${p.firebaseUid}:${p.matchId}`)
  );

  // Check which users have already been notified for these matches today
  // to avoid sending duplicate notifications
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingNotifications = await NotificationModel.find({
    type: "missing_prediction",
    sentAt: { $gte: today },
    "metadata.matchIds": { $in: upcomingMatchIds },
  });

  const alreadyNotified = new Set(
    existingNotifications.map((n) => {
      const matchIds = (n.metadata as Record<string, string[]>)?.matchIds || [];
      return matchIds.map((mid: string) => `${n.firebaseUid}:${mid}`);
    }).flat()
  );

  // Group missing predictions by user
  const missingByUser: Record<string, string[]> = {};

  for (const uid of activeUserUids) {
    for (const matchId of upcomingMatchIds) {
      const key = `${uid}:${matchId}`;
      if (!hasPrediction.has(key) && !alreadyNotified.has(key)) {
        if (!missingByUser[uid]) missingByUser[uid] = [];
        missingByUser[uid].push(matchId);
      }
    }
  }

  let sent = 0;

  for (const [uid, matchIds] of Object.entries(missingByUser)) {
    const matchLabels = matchIds
      .map((id) => upcomingMatchLabels[id] || id)
      .join(", ");

    const title = "⚽ ¡No te olvides de pronosticar!";
    const body =
      matchIds.length === 1
        ? `El partido ${matchLabels} comienza pronto y aún no cargaste tu pronóstico.`
        : `${matchIds.length} partidos comienzan pronto sin pronóstico: ${matchLabels}`;

    // Create in-app notification
    await NotificationModel.create({
      firebaseUid: uid,
      type: "missing_prediction",
      title,
      body,
      icon: "⚽",
      link: "/prode?tab=predictions",
      metadata: { matchIds },
    });

    // Send push notification
    await sendPushToUser(uid, {
      title,
      body,
      icon: "/icon.svg",
      url: "/prode?tab=predictions",
    });

    sent++;
  }

  return { sent, message: `Sent missing prediction notifications to ${sent} users` };
}

// ─── DAILY WINNERS ──────────────────────────────────────────────
async function handleDailyWinners() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  // Find matches that finished today
  const todayFinished = await LiveScore.find({
    status: "finished",
    updatedAt: { $gte: todayStart, $lte: todayEnd },
  });

  if (todayFinished.length === 0) {
    return { sent: 0, message: "No matches finished today" };
  }

  const finishedMatchIds = todayFinished.map((m) => m.matchId);

  const scoreMap: Record<
    string,
    { homeScore: number; awayScore: number; homePenalties: number | null; awayPenalties: number | null }
  > = {};
  for (const match of todayFinished) {
    if (match.homeScore !== null && match.awayScore !== null) {
      scoreMap[match.matchId] = {
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        homePenalties: match.homePenalties,
        awayPenalties: match.awayPenalties,
      };
    }
  }

  // Get all predictions for today's finished matches
  const predictions = await ProdePrediction.find({
    matchId: { $in: finishedMatchIds },
  });

  // Calculate points per user for today
  const pointsByUser: Record<string, { total: number; exact: number }> = {};

  for (const pred of predictions) {
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

    if (!pointsByUser[pred.firebaseUid]) {
      pointsByUser[pred.firebaseUid] = { total: 0, exact: 0 };
    }
    pointsByUser[pred.firebaseUid].total += pts;
    if (pts === 3) pointsByUser[pred.firebaseUid].exact++;
  }

  // Sort and get top 3
  const sorted = Object.entries(pointsByUser)
    .filter(([, v]) => v.total > 0)
    .sort((a, b) => b[1].total - a[1].total || b[1].exact - a[1].exact);

  if (sorted.length === 0) {
    return { sent: 0, message: "No users scored points today" };
  }

  const top3 = sorted.slice(0, 3);
  const topUids = top3.map(([uid]) => uid);

  // Get user names
  const users = await User.find(
    { firebaseUid: { $in: topUids } },
    { firebaseUid: 1, displayName: 1, nickname: 1 }
  );
  const nameMap: Record<string, string> = {};
  for (const u of users) {
    nameMap[u.firebaseUid] = u.nickname || u.displayName || u.firebaseUid;
  }

  // Check for existing daily_winner notifications today
  const existingWinnerNotifs = await NotificationModel.find({
    type: "daily_winner",
    sentAt: { $gte: todayStart },
  });

  if (existingWinnerNotifs.length > 0) {
    return { sent: 0, message: "Daily winner notifications already sent today" };
  }

  let sent = 0;
  const medals = ["🥇", "🥈", "🥉"];

  for (let i = 0; i < top3.length; i++) {
    const [uid, data] = top3[i];
    const medal = medals[i] || "🏆";
    const name = nameMap[uid] || "Jugador";

    const title = `${medal} ¡Top Global del día, ${name}!`;
    const body =
      i === 0
        ? `¡Fuiste el/la mejor del día a nivel global con ${data.total} puntos! (${data.exact} exactos)`
        : `Terminaste ${i + 1}° en el ranking global de hoy con ${data.total} puntos. ¡Seguí así!`;

    await NotificationModel.create({
      firebaseUid: uid,
      type: "daily_winner",
      title,
      body,
      icon: medal,
      link: "/prode?tab=leaderboard",
      metadata: { rank: i + 1, points: data.total, exactCount: data.exact },
    });

    await sendPushToUser(uid, {
      title,
      body,
      icon: "/icon.svg",
      url: "/prode?tab=leaderboard",
    });

    sent++;
  }

  // Also notify all participants about who won today
  const allParticipantUids = [...new Set(predictions.map((p) => p.firebaseUid))];
  const nonWinnerUids = allParticipantUids.filter((uid) => !topUids.includes(uid));

  const winnerNames = top3
    .map(([uid, data], i) => `${medals[i]} ${nameMap[uid] || "?"} (${data.total}pts)`)
    .join("  ");

  if (nonWinnerUids.length > 0) {
    const bulkNotifs = nonWinnerUids.map((uid) => ({
      firebaseUid: uid,
      type: "daily_winner" as const,
      title: "🏆 Ganadores globales del día",
      body: `Top global de hoy: ${winnerNames}`,
      icon: "🏆",
      link: "/prode?tab=leaderboard",
      metadata: { informational: true },
    }));

    await NotificationModel.insertMany(bulkNotifs);

    // Send push notifications to non-winners in batches
    for (const uid of nonWinnerUids) {
      await sendPushToUser(uid, {
        title: "🏆 Ganadores globales del día",
        body: `Top global de hoy: ${winnerNames}`,
        icon: "/icon.svg",
        url: "/prode?tab=leaderboard",
      });
      sent++;
    }
  }

  return { sent, message: `Sent daily winner notifications to ${sent} users` };
}

// ─── MAIN HANDLER ───────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    // Verify cron secret
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    // Allow both query param and body for secret
    let secret = searchParams.get("secret");
    if (!secret) {
      try {
        const body = await request.json();
        secret = body.secret;
      } catch {
        // No body, that's ok
      }
    }

    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && secret !== cronSecret) {
      // Also check Authorization header
      const authHeader = request.headers.get("authorization");
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    await connectDB();

    let result;

    switch (type) {
      case "missing_predictions":
        result = await handleMissingPredictions();
        break;
      case "daily_winners":
        result = await handleDailyWinners();
        break;
      default:
        return NextResponse.json(
          { error: "Invalid type. Use: missing_predictions | daily_winners" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Error sending notifications:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Also support GET for cron jobs that use GET requests
export async function GET(request: Request) {
  // Forward to POST handler
  return POST(request);
}
