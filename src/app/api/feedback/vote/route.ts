import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Feedback from "@/models/Feedback";

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { feedbackId, firebaseUid } = body;

    if (!feedbackId) {
      return NextResponse.json(
        { error: "El ID del comentario es requerido" },
        { status: 400 }
      );
    }
    if (!firebaseUid) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para votar" },
        { status: 401 }
      );
    }

    const feedback = await Feedback.findById(feedbackId);

    if (!feedback) {
      return NextResponse.json(
        { error: "Comentario no encontrado" },
        { status: 404 }
      );
    }

    // Toggle upvote
    const userIndex = feedback.upvotes.indexOf(firebaseUid);
    let isVoted = false;

    if (userIndex > -1) {
      // User has already voted, remove vote
      feedback.upvotes.splice(userIndex, 1);
    } else {
      // User has not voted, add vote
      feedback.upvotes.push(firebaseUid);
      isVoted = true;
    }

    await feedback.save();

    return NextResponse.json({
      success: true,
      upvotes: feedback.upvotes,
      upvotesCount: feedback.upvotes.length,
      hasVoted: isVoted,
    });
  } catch (error: any) {
    console.error("Error toggling vote:", error);
    return NextResponse.json(
      { error: error?.message || "Error al procesar el voto" },
      { status: 500 }
    );
  }
}
