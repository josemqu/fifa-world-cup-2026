import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      firebaseUid,
      email,
      displayName,
      nickname,
      country,
      favoriteTeam,
      gender,
      age,
      birthDate,
      role,
      preferences,
    } = body;

    if (!firebaseUid) {
      return NextResponse.json(
        { error: "firebaseUid is required" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      email,
      displayName,
      nickname,
      country,
      favoriteTeam,
      gender,
      age,
      birthDate,
      role,
      preferences,
      updatedAt: new Date(),
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    // Specific logic for admin role
    if (email === "mailjmq@gmail.com") {
      updateData.role = "admin";
    }

    // Find user by firebaseUid and update, or create if doesn't exist (upsert)
    const user = await User.findOneAndUpdate(
      { firebaseUid },
      {
        $set: updateData,
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, strict: false }
    ).lean();

    // user update successful
    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    console.error("Error in user API:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const firebaseUid = searchParams.get("uid");

    if (!firebaseUid) {
      return NextResponse.json(
        { error: "firebaseUid query param is required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ firebaseUid }).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
