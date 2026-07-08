import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import ProdePrediction from "@/models/ProdePrediction";
import ProdeGroup from "@/models/ProdeGroup";
import Feedback from "@/models/Feedback";
import UserActivity from "@/models/UserActivity";

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

    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json(
        { error: "uid query parameter is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // 1. Fetch user profile details or mock a global profile
    let dbUser: any;
    if (uid === "all") {
      const usersList = await User.find({}, { loginCount: 1 }).lean();
      const totalLogins = usersList.reduce((sum, u: any) => sum + (u.loginCount || 0), 0);
      dbUser = {
        firebaseUid: "all",
        displayName: "Todos los Usuarios",
        nickname: "global",
        email: "global@analytics.app",
        role: "global",
        createdAt: new Date(2026, 0, 1).toISOString(),
        country: "Global",
        favoriteTeam: "Todos",
        age: null,
        loginCount: totalLogins
      };
    } else {
      dbUser = await User.findOne({ firebaseUid: uid }).lean();
      if (!dbUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    // 2. Fetch aggregate statistics
    const now = new Date();
    const last30Days = new Date(now);
    last30Days.setDate(last30Days.getDate() - 30);

    const activityFilter = uid === "all" ? {} : { firebaseUid: uid };
    const groupFilter = uid === "all" ? {} : { members: uid };

    const [
      predictionCount,
      groupsCount,
      feedbackCount,
      pageViewsCount,
      activitiesList,
      dailyPageViews,
      simpleUsers,
    ] = await Promise.all([
      ProdePrediction.countDocuments(activityFilter),
      ProdeGroup.countDocuments(groupFilter),
      Feedback.countDocuments(activityFilter),
      UserActivity.countDocuments({ ...activityFilter, action: "PAGE_VIEW" }),
      UserActivity.find(activityFilter)
        .sort({ createdAt: -1 })
        .limit(150)
        .lean(),
      UserActivity.aggregate([
        {
          $match: {
            ...activityFilter,
            action: "PAGE_VIEW",
            createdAt: { $gte: last30Days }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              path: "$metadata.path"
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.date": 1 } },
        {
          $project: {
            date: "$_id.date",
            path: "$_id.path",
            count: 1,
            _id: 0
          }
        }
      ]),
      User.find({}, { firebaseUid: 1, displayName: 1, email: 1, nickname: 1 })
        .sort({ displayName: 1 })
        .limit(1000)
        .lean(),
    ]);

    // 3. Populate user names for activities if display all mode is active
    let activities = activitiesList;
    if (uid === "all" && activitiesList.length > 0) {
      const uids = Array.from(new Set(activitiesList.map(a => a.firebaseUid)));
      const users = await User.find(
        { firebaseUid: { $in: uids } },
        { firebaseUid: 1, displayName: 1, email: 1, nickname: 1 }
      ).lean();
      const userMap = new Map(users.map(u => [u.firebaseUid, u]));

      activities = activitiesList.map((act: any) => {
        const u = userMap.get(act.firebaseUid);
        return {
          ...act,
          user: u ? {
            displayName: u.displayName,
            nickname: u.nickname,
            email: u.email
          } : null
        };
      });
    }

    // 4. Aggregate top pages visited
    const topPages = await UserActivity.aggregate([
      { $match: { ...activityFilter, action: "PAGE_VIEW" } },
      { $group: { _id: "$metadata.path", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { path: "$_id", count: 1, _id: 0 } },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        user: dbUser,
        stats: {
          loginCount: dbUser.loginCount || 0,
          predictionCount,
          groupsCount,
          feedbackCount,
          pageViewsCount,
        },
        topPages,
        activities,
        dailyPageViews,
        users: simpleUsers,
      },
    });
  } catch (error: any) {
    console.error("Error fetching user activity details:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
