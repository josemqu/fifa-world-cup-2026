import { NextResponse } from "next/server";
import webpush from "web-push";
import connectDB from "@/lib/mongodb";
import PushSubscriptionModel from "@/models/PushSubscription";
import NotificationModel from "@/models/Notification";
import ProdePrediction from "@/models/ProdePrediction";
import LiveScore from "@/models/LiveScore";
import User from "@/models/User";
import ProdeGroup from "@/models/ProdeGroup";
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
async function handleDailyWinners(force = false) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  // Find matches that finished today to check if we should run the daily update
  const todayFinished = await LiveScore.find({
    status: "finished",
    updatedAt: { $gte: todayStart, $lte: todayEnd },
  });

  if (todayFinished.length === 0 && !force) {
    return { sent: 0, message: "No matches finished today (use force=true to bypass)" };
  }

  // Calculate accumulated points for all users globally using ALL finished matches up to now
  const finishedMatches = await LiveScore.find({ status: "finished" });
  const finishedMatchIds = finishedMatches.map((m) => m.matchId);

  const scoreMap: Record<
    string,
    { homeScore: number; awayScore: number; homePenalties: number | null; awayPenalties: number | null }
  > = {};
  for (const match of finishedMatches) {
    if (match.homeScore !== null && match.awayScore !== null) {
      scoreMap[match.matchId] = {
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        homePenalties: match.homePenalties,
        awayPenalties: match.awayPenalties,
      };
    }
  }

  // Load all predictions for finished matches
  const allPredictions = await ProdePrediction.find({
    matchId: { $in: finishedMatchIds },
  });

  // Calculate accumulated points per user
  const userPointsMap: Record<string, { totalPoints: number; exactCount: number }> = {};
  for (const pred of allPredictions) {
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

    if (!userPointsMap[pred.firebaseUid]) {
      userPointsMap[pred.firebaseUid] = { totalPoints: 0, exactCount: 0 };
    }
    userPointsMap[pred.firebaseUid].totalPoints += pts;
    if (pts === 3) userPointsMap[pred.firebaseUid].exactCount++;
  }

  // Get user display names/nicknames
  const users = await User.find({}, { firebaseUid: 1, displayName: 1, nickname: 1 });
  const userMap: Record<string, string> = {};
  for (const u of users) {
    userMap[u.firebaseUid] = u.nickname || u.displayName || u.firebaseUid;
  }

  // Check which notifications were already sent today to avoid duplicates
  const existingWinnerNotifs = await NotificationModel.find({
    type: "daily_winner",
    sentAt: { $gte: todayStart },
  });

  const alreadyNotifiedKeys = new Set(
    existingWinnerNotifs
      .map((n) => {
        const meta = n.metadata as Record<string, any>;
        if (meta?.groupId) {
          return `${n.firebaseUid}:${meta.groupId}`;
        }
        if (meta?.global) {
          return `${n.firebaseUid}:global`;
        }
        return "";
      })
      .filter(Boolean)
  );

  // Load all prode groups
  const groups = await ProdeGroup.find({});
  let sent = 0;
  const notifiedUsersThisRun = new Set<string>();

  // 1. Process Private Groups
  for (const group of groups) {
    const totalMembers = group.members.length;
    if (totalMembers <= 1) continue; // Skip groups with 1 or 0 members

    // Build the group leaderboard
    const groupLeaderboard = group.members.map((uid) => {
      const pointsData = userPointsMap[uid] || { totalPoints: 0, exactCount: 0 };
      return {
        firebaseUid: uid,
        totalPoints: pointsData.totalPoints,
        exactCount: pointsData.exactCount,
      };
    });

    // Sort by totalPoints desc, exactCount desc
    groupLeaderboard.sort((a, b) => b.totalPoints - a.totalPoints || b.exactCount - a.exactCount);

    const leaderPoints = groupLeaderboard[0]?.totalPoints || 0;

    for (let index = 0; index < groupLeaderboard.length; index++) {
      const member = groupLeaderboard[index];
      const uid = member.firebaseUid;
      const rank = index + 1;
      const points = member.totalPoints;

      // Skip if already notified for this group today
      const duplicateKey = `${uid}:${group._id}`;
      if (alreadyNotifiedKeys.has(duplicateKey)) {
        notifiedUsersThisRun.add(uid);
        continue;
      }

      let title = "";
      let body = "";
      let icon = "⚽";

      const name = userMap[uid] || "Jugador";

      if (rank === 1) {
        title = `🥇 Líder de ${group.name}`;
        body = `¡Felicitaciones, ${name}! Seguís en la punta del grupo con ${points} pts.`;
        icon = "🥇";
      } else if (rank <= 3) {
        const medal = rank === 2 ? "🥈" : "🥉";
        title = `${medal} Podio en ${group.name}`;
        body = `Estás ${rank}° con ${points} pts. ¡El líder tiene ${leaderPoints} pts, estás cerca!`;
        icon = medal;
      } else if (rank === totalMembers && totalMembers > 2) {
        title = `💪 ¡Fuerza en ${group.name}!`;
        body = `Estás último con ${points} pts. ¡No te desanimes, queda torneo para recuperarte!`;
        icon = "💪";
      } else if (rank >= totalMembers * 0.75 || (leaderPoints - points >= 8)) {
        title = `🔥 ¡A sumar en ${group.name}!`;
        body = `Estás ${rank}° de ${totalMembers} con ${points} pts. ¡Cargá tus predicciones para recortar distancia!`;
        icon = "🔥";
      } else {
        title = `⚽ En carrera en ${group.name}`;
        body = `Estás en el puesto ${rank}° de ${totalMembers} con ${points} pts. ¡Seguí así!`;
        icon = "⚽";
      }

      // Create in-app notification
      await NotificationModel.create({
        firebaseUid: uid,
        type: "daily_winner",
        title,
        body,
        icon,
        link: `/prode?tab=groups&groupId=${group._id}`,
        metadata: { groupId: group._id.toString(), rank, points, totalMembers },
      });

      // Send push
      await sendPushToUser(uid, {
        title,
        body,
        icon: "/icon.svg",
        url: `/prode?tab=groups&groupId=${group._id}`,
      });

      sent++;
      notifiedUsersThisRun.add(uid);
    }
  }

  // 2. Process Global Standings (for active users not in any private group)
  const activeUserUids = await ProdePrediction.distinct("firebaseUid");
  
  const globalLeaderboard = activeUserUids.map((uid) => {
    const pointsData = userPointsMap[uid] || { totalPoints: 0, exactCount: 0 };
    return {
      firebaseUid: uid,
      totalPoints: pointsData.totalPoints,
      exactCount: pointsData.exactCount,
    };
  });

  // Sort global standings
  globalLeaderboard.sort((a, b) => b.totalPoints - a.totalPoints || b.exactCount - a.exactCount);

  const totalGlobalUsers = globalLeaderboard.length;

  for (let index = 0; index < globalLeaderboard.length; index++) {
    const member = globalLeaderboard[index];
    const uid = member.firebaseUid;
    const rank = index + 1;
    const points = member.totalPoints;

    // Skip if they already received a group notification in this run
    if (notifiedUsersThisRun.has(uid)) continue;

    // Skip if already notified globally today
    const duplicateKey = `${uid}:global`;
    if (alreadyNotifiedKeys.has(duplicateKey)) continue;

    let title = "";
    let body = "";
    let icon = "⚽";

    const name = userMap[uid] || "Jugador";

    if (rank === 1) {
      title = `🥇 Líder Global del Prode`;
      body = `¡Felicitaciones, ${name}! Seguís en la punta del Ranking Global con ${points} pts.`;
      icon = "🥇";
    } else if (rank <= 3) {
      const medal = rank === 2 ? "🥈" : "🥉";
      title = `${medal} Podio Global del Prode`;
      body = `¡Excelente! Estás ${rank}° en el Ranking Global con ${points} pts.`;
      icon = medal;
    } else if (rank >= totalGlobalUsers * 0.75) {
      title = `💪 ¡A sumar en el Ranking Global!`;
      body = `Estás ${rank}° de ${totalGlobalUsers} con ${points} pts. ¡Queda mucho por jugar, a meterle garra!`;
      icon = "💪";
    } else {
      title = `⚽ Posición Global`;
      body = `Estás en el puesto ${rank}° de ${totalGlobalUsers} con ${points} pts. ¡Seguí sumando!`;
      icon = "⚽";
    }

    // Create in-app notification
    await NotificationModel.create({
      firebaseUid: uid,
      type: "daily_winner",
      title,
      body,
      icon,
      link: "/prode?tab=leaderboard",
      metadata: { global: true, rank, points, totalGlobalUsers },
    });

    // Send push
    await sendPushToUser(uid, {
      title,
      body,
      icon: "/icon.svg",
      url: "/prode?tab=leaderboard",
    });

    sent++;
  }

  return { sent, message: `Sent leaderboard standings notifications to ${sent} users` };
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
    const force = searchParams.get("force") === "true";

    switch (type) {
      case "missing_predictions":
        result = await handleMissingPredictions();
        break;
      case "daily_winners":
        result = await handleDailyWinners(force);
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
