import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ProdeGroup from "@/models/ProdeGroup";
import User from "@/models/User";

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
    const limit = parseInt(searchParams.get("limit") || "15");
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    let ownerUids: string[] = [];
    if (search) {
      const matchingUsers = await User.find({
        $or: [
          { displayName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ]
      }).select("firebaseUid").lean();
      ownerUids = matchingUsers.map(u => u.firebaseUid);
    }

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
      if (ownerUids.length > 0) {
        query.$or.push({ ownerUid: { $in: ownerUids } });
      }
    }

    const pipeline: any[] = [
      { $match: query }
    ];

    pipeline.push({
      $addFields: {
        membersCount: { $size: "$members" }
      }
    });

    let sortStage: any = {};
    if (sortBy === "name") {
      sortStage = { name: sortOrder };
    } else if (sortBy === "code") {
      sortStage = { code: sortOrder };
    } else if (sortBy === "membersCount") {
      sortStage = { membersCount: sortOrder };
    } else if (sortBy === "updatedAt") {
      sortStage = { updatedAt: sortOrder };
    } else {
      sortStage = { createdAt: sortOrder };
    }
    pipeline.push({ $sort: sortStage });

    const totalPipeline = [...pipeline];
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const [groups, totalResult] = await Promise.all([
      ProdeGroup.aggregate(pipeline),
      ProdeGroup.aggregate([...totalPipeline, { $count: "count" }])
    ]);

    const total = totalResult[0]?.count || 0;

    const allUids = new Set<string>();
    groups.forEach((g: any) => {
      if (g.ownerUid) allUids.add(g.ownerUid);
      if (g.members) g.members.forEach((m: string) => allUids.add(m));
    });

    const users = await User.find({ firebaseUid: { $in: Array.from(allUids) } })
      .select("firebaseUid email displayName nickname country favoriteTeam predictionCount")
      .lean();

    const userMap = users.reduce((acc, user) => {
      acc[user.firebaseUid] = user;
      return acc;
    }, {} as Record<string, any>);

    const enrichedGroups = groups.map((g: any) => {
      const owner = userMap[g.ownerUid] || { displayName: "Desconocido", email: "" };
      const membersList = (g.members || []).map((mUid: string) => userMap[mUid] || { firebaseUid: mUid, displayName: "Desconocido", email: "" });
      return {
        ...g,
        owner,
        membersList
      };
    });

    const totalGroups = await ProdeGroup.countDocuments();
    const avgMembersResult = await ProdeGroup.aggregate([
      { $project: { membersCount: { $size: "$members" } } },
      { $group: { _id: null, avgMembers: { $avg: "$membersCount" } } }
    ]);
    const avgMembers = avgMembersResult[0]?.avgMembers || 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeGroups = await ProdeGroup.countDocuments({
      updatedAt: { $gte: sevenDaysAgo }
    });

    return NextResponse.json({
      success: true,
      data: enrichedGroups,
      kpis: {
        totalGroups,
        avgMembers: Math.round(avgMembers * 10) / 10,
        activeGroups
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error("Error fetching admin groups:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const adminEmail = request.headers.get("x-admin-email");

    if (!isAdminEmail(adminEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json({ error: "groupId is required" }, { status: 400 });
    }

    await connectDB();

    const deletedGroup = await ProdeGroup.findByIdAndDelete(groupId);
    if (!deletedGroup) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Error deleting prode group as admin:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

