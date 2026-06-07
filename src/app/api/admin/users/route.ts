import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import ProdePrediction from "@/models/ProdePrediction";

// Simple admin check via email header (can be upgraded to JWT/session later)
function isAdminEmail(email: string | null) {
  const adminEmails = ["mailjmq@gmail.com"];
  return email && adminEmails.includes(email);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminEmail = request.headers.get("x-admin-email");

    if (!isAdminEmail(adminEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";

    const query = search
      ? {
          $or: [
            { email: { $regex: search, $options: "i" } },
            { displayName: { $regex: search, $options: "i" } },
            { nickname: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    // Get prediction counts for each user
    const uids = users.map((u) => u.firebaseUid);
    const predictionCounts = await ProdePrediction.aggregate([
      { $match: { firebaseUid: { $in: uids } } },
      { $group: { _id: "$firebaseUid", count: { $sum: 1 } } },
    ]);
    const predCountMap = predictionCounts.reduce(
      (acc, curr) => ({ ...acc, [curr._id]: curr.count }),
      {} as Record<string, number>
    );

    const enrichedUsers = users.map((u) => ({
      ...u,
      predictionCount: predCountMap[u.firebaseUid] || 0,
    }));

    return NextResponse.json({
      success: true,
      data: enrichedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching admin users:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
