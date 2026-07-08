import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Feedback from "@/models/Feedback";
import User from "@/models/User";
import UserActivity from "@/models/UserActivity";

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const sort = searchParams.get("sort") || "popular"; // 'popular' or 'recent'
    const firebaseUid = searchParams.get("uid");

    // If no firebaseUid is provided, return empty data (guests don't see other users' feedback)
    if (!firebaseUid) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Check if the user is an admin
    const user = await User.findOne({ firebaseUid });
    const isAdmin = user?.role === "admin";

    const matchQuery: any = {};
    if (category && category !== "all") {
      matchQuery.category = category;
    }
    if (status && status !== "all") {
      matchQuery.status = status;
    }

    // Restrict to user's own comments if not an admin
    if (!isAdmin) {
      matchQuery.firebaseUid = firebaseUid;
    }

    // Build aggregation pipeline to compute upvotesCount dynamically
    const pipeline: any[] = [
      { $match: matchQuery },
      {
        $addFields: {
          upvotesCount: { $size: { $ifNull: ["$upvotes", []] } },
        },
      },
    ];

    // Apply sorting
    if (sort === "popular") {
      pipeline.push({ $sort: { upvotesCount: -1, createdAt: -1 } });
    } else {
      pipeline.push({ $sort: { createdAt: -1 } });
    }

    const items = await Feedback.aggregate(pipeline);

    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    console.error("Error in GET feedback:", error);
    return NextResponse.json(
      { error: error?.message || "Error al obtener comentarios" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      firebaseUid,
      title,
      content,
      category,
      authorName,
      authorPhoto,
      authorEmail,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "El título es requerido" },
        { status: 400 }
      );
    }
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "El contenido es requerido" },
        { status: 400 }
      );
    }

    // Retrieve local DB user if firebaseUid is provided
    let mongoUserId = undefined;
    if (firebaseUid) {
      const dbUser = await User.findOne({ firebaseUid });
      if (dbUser) {
        mongoUserId = dbUser._id;
      }
    }

    const newFeedback = await Feedback.create({
      user: mongoUserId,
      firebaseUid,
      authorName: authorName ? authorName.trim() : "Anónimo",
      authorPhoto,
      authorEmail,
      title: title.trim().substring(0, 100),
      content: content.trim().substring(0, 1000),
      category: category || "suggestion",
      status: "pending",
      upvotes: firebaseUid ? [firebaseUid] : [], // Auto-upvote by creator if authenticated
    });

    // Track feedback submission activity
    if (firebaseUid) {
      try {
        await UserActivity.create({
          firebaseUid,
          action: "FEEDBACK_SUBMITTED",
          metadata: {
            feedbackId: newFeedback._id,
            category: newFeedback.category,
            title: newFeedback.title,
          },
        });
      } catch (logError) {
        console.error("Error logging FEEDBACK_SUBMITTED activity:", logError);
      }
    }

    return NextResponse.json({ success: true, data: newFeedback });
  } catch (error: any) {
    console.error("Error in POST feedback:", error);
    return NextResponse.json(
      { error: error?.message || "Error al guardar comentario" },
      { status: 500 }
    );
  }
}
