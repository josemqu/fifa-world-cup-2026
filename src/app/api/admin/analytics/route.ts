import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import UserActivity from "@/models/UserActivity";
import ProdePrediction from "@/models/ProdePrediction";

function isAdminEmail(email: string | null) {
  const adminEmails = ["mailjmq@gmail.com"];
  return email && adminEmails.includes(email);
}

export async function GET(request: Request) {
  try {
    const adminEmail = request.headers.get("x-admin-email");

    if (!isAdminEmail(adminEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const last30Days = new Date(now);
    last30Days.setDate(last30Days.getDate() - 30);

    const last7Days = new Date(now);
    last7Days.setDate(last7Days.getDate() - 7);

    // ── Summary KPIs ──────────────────────────────────────────────────────────
    const [
      totalUsers,
      newUsersToday,
      activeToday,
      activeThisWeek,
      totalPredictions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      User.countDocuments({ lastActiveAt: { $gte: todayStart } }),
      User.countDocuments({ lastActiveAt: { $gte: last7Days } }),
      ProdePrediction.countDocuments(),
    ]);

    // ── Daily registrations (last 30 days) ───────────────────────────────────
    const dailyRegistrations = await User.aggregate([
      { $match: { createdAt: { $gte: last30Days } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", count: 1, _id: 0 } },
    ]);

    // ── Daily active users (last 30 days) ─────────────────────────────────────
    const dailyActiveUsers = await User.aggregate([
      { $match: { lastActiveAt: { $gte: last30Days } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$lastActiveAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", count: 1, _id: 0 } },
    ]);

    // ── Activity by action type (last 30 days) ────────────────────────────────
    const activityByType = await UserActivity.aggregate([
      { $match: { createdAt: { $gte: last30Days } } },
      { $group: { _id: "$action", count: { $sum: 1 } } },
      { $project: { action: "$_id", count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);

    // ── Daily login events (last 30 days) ─────────────────────────────────────
    const dailyLogins = await UserActivity.aggregate([
      { $match: { action: "LOGIN", createdAt: { $gte: last30Days } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", count: 1, _id: 0 } },
    ]);

    // ── Top pages viewed ──────────────────────────────────────────────────────
    const topPages = await UserActivity.aggregate([
      { $match: { action: "PAGE_VIEW", createdAt: { $gte: last30Days } } },
      { $group: { _id: "$metadata.path", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { path: "$_id", count: 1, _id: 0 } },
    ]);

    // ── Users by country ─────────────────────────────────────────────────────
    const usersByCountry = await User.aggregate([
      { $match: { country: { $exists: true, $ne: null } } },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { country: "$_id", count: 1, _id: 0 } },
    ]);

    // ── Users by favorite team ────────────────────────────────────────────────
    const usersByFavoriteTeam = await User.aggregate([
      { $match: { favoriteTeam: { $exists: true, $ne: null } } },
      { $group: { _id: "$favoriteTeam", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { team: "$_id", count: 1, _id: 0 } },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalUsers,
          newUsersToday,
          activeToday,
          activeThisWeek,
          totalPredictions,
        },
        charts: {
          dailyRegistrations,
          dailyActiveUsers,
          dailyLogins,
          activityByType,
          topPages,
          usersByCountry,
          usersByFavoriteTeam,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching admin analytics:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
