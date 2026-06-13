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
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    const query = search
      ? {
          $or: [
            { email: { $regex: search, $options: "i" } },
            { displayName: { $regex: search, $options: "i" } },
            { nickname: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const pipeline: any[] = [];
    if (search) {
      pipeline.push({ $match: query });
    }

    // Lookup prediction count
    pipeline.push({
      $lookup: {
        from: ProdePrediction.collection.name,
        localField: "firebaseUid",
        foreignField: "firebaseUid",
        as: "predictions",
      },
    });

    // Compute profile completeness and prediction count
    pipeline.push({
      $addFields: {
        predictionCount: { $size: "$predictions" },
        isProfileComplete: {
          $and: [
            { $gt: [{ $strLenCP: { $ifNull: ["$displayName", ""] } }, 0] },
            { $gt: [{ $strLenCP: { $ifNull: ["$nickname", ""] } }, 0] },
            { $gt: [{ $strLenCP: { $ifNull: ["$country", ""] } }, 0] },
            { $gt: [{ $strLenCP: { $ifNull: ["$favoriteTeam", ""] } }, 0] },
            { $gt: [{ $strLenCP: { $ifNull: ["$gender", ""] } }, 0] },
            {
              $or: [
                { $gt: ["$age", 0] },
                { $gt: [{ $strLenCP: { $ifNull: ["$birthDate", ""] } }, 0] },
              ],
            },
          ],
        },
      },
    });

    pipeline.push({
      $project: {
        predictions: 0,
      },
    });

    // Define sort
    let sortStage: any = {};
    if (sortBy === "displayName") {
      sortStage = { displayName: sortOrder };
    } else if (sortBy === "email") {
      sortStage = { email: sortOrder };
    } else if (sortBy === "country") {
      sortStage = { country: sortOrder };
    } else if (sortBy === "favoriteTeam") {
      sortStage = { favoriteTeam: sortOrder };
    } else if (sortBy === "profileComplete") {
      sortStage = { isProfileComplete: sortOrder };
    } else if (sortBy === "predictionCount") {
      sortStage = { predictionCount: sortOrder };
    } else if (sortBy === "loginCount") {
      sortStage = { loginCount: sortOrder };
    } else if (sortBy === "lastActiveAt") {
      sortStage = { lastActiveAt: sortOrder };
    } else if (sortBy === "excludeFromStats") {
      sortStage = { excludeFromStats: sortOrder };
    } else {
      sortStage = { createdAt: sortOrder };
    }

    pipeline.push({ $sort: sortStage });

    const countPipeline = [...pipeline, { $count: "count" }];

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const [users, totalResult] = await Promise.all([
      User.aggregate(pipeline),
      User.aggregate(countPipeline),
    ]);

    const total = totalResult[0]?.count || 0;

    return NextResponse.json({
      success: true,
      data: users,
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
      { status: 550 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const adminEmail = request.headers.get("x-admin-email");

    if (!isAdminEmail(adminEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const body = await request.json();
    const { firebaseUid, excludeFromStats } = body;

    if (!firebaseUid) {
      return NextResponse.json(
        { error: "firebaseUid is required" },
        { status: 400 }
      );
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid },
      { $set: { excludeFromStats: !!excludeFromStats } },
      { returnDocument: 'after' }
    ).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    console.error("Error updating user stats visibility:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 550 }
    );
  }
}
