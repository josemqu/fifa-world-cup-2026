import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ProdeGroup from "@/models/ProdeGroup";
import { generateGroupCode } from "@/utils/prodeUtils";

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const firebaseUid = searchParams.get("uid");

    if (!firebaseUid) {
      return NextResponse.json(
        { error: "uid query param is required" },
        { status: 400 }
      );
    }

    const groups = await ProdeGroup.find({ members: firebaseUid });

    return NextResponse.json({ success: true, data: groups });
  } catch (error) {
    console.error("Error fetching prode groups:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { firebaseUid, name } = body;

    if (!firebaseUid) {
      return NextResponse.json(
        { error: "firebaseUid is required" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    let code = generateGroupCode();
    let retries = 0;
    while (retries < 10) {
      const existing = await ProdeGroup.findOne({ code });
      if (!existing) break;
      code = generateGroupCode();
      retries++;
    }

    const group = await ProdeGroup.create({
      name,
      code,
      ownerUid: firebaseUid,
      members: [firebaseUid],
    });

    return NextResponse.json({ success: true, data: group });
  } catch (error) {
    console.error("Error creating prode group:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
