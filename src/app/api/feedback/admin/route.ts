import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Feedback from "@/models/Feedback";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { feedbackId, firebaseUid, status, adminResponse } = body;

    if (!feedbackId) {
      return NextResponse.json(
        { error: "El ID del comentario es requerido" },
        { status: 400 }
      );
    }
    if (!firebaseUid) {
      return NextResponse.json(
        { error: "La autenticación es requerida" },
        { status: 401 }
      );
    }

    // Check if the user is an admin
    const user = await User.findOne({ firebaseUid });
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "No tienes permisos de administrador para realizar esta acción" },
        { status: 403 }
      );
    }

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return NextResponse.json(
        { error: "Comentario no encontrado" },
        { status: 404 }
      );
    }

    // Update status if provided
    if (status) {
      feedback.status = status;
    }

    // Update admin response if provided
    if (adminResponse !== undefined) {
      if (adminResponse.trim() === "") {
        // Clear response if empty string is passed
        feedback.adminResponse = undefined;
      } else {
        feedback.adminResponse = {
          content: adminResponse.trim(),
          respondedAt: new Date(),
          respondedBy: user.displayName || "Admin",
        };
      }
    }

    await feedback.save();

    return NextResponse.json({
      success: true,
      data: feedback,
    });
  } catch (error: any) {
    console.error("Error in admin feedback moderation:", error);
    return NextResponse.json(
      { error: error?.message || "Error al procesar la moderación" },
      { status: 500 }
    );
  }
}
