import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFeedback extends Document {
  user?: mongoose.Types.ObjectId; // Reference to the User model if authenticated
  firebaseUid?: string; // Firebase UID for quick verification
  authorName: string;
  authorPhoto?: string;
  authorEmail?: string;
  title: string;
  content: string;
  category: "suggestion" | "bug" | "idea" | "other";
  status: "pending" | "reviewing" | "planned" | "progress" | "completed" | "rejected";
  upvotes: string[]; // List of firebaseUids of users who have upvoted
  adminResponse?: {
    content: string;
    respondedAt: Date;
    respondedBy: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    firebaseUid: { type: String },
    authorName: { type: String, required: true },
    authorPhoto: { type: String },
    authorEmail: { type: String },
    title: { type: String, required: true, maxlength: 100 },
    content: { type: String, required: true, maxlength: 1000 },
    category: {
      type: String,
      enum: ["suggestion", "bug", "idea", "other"],
      default: "suggestion",
    },
    status: {
      type: String,
      enum: ["pending", "reviewing", "planned", "progress", "completed", "rejected"],
      default: "pending",
    },
    upvotes: [{ type: String }],
    adminResponse: {
      content: { type: String },
      respondedAt: { type: Date },
      respondedBy: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

const Feedback: Model<IFeedback> =
  mongoose.models.Feedback || mongoose.model<IFeedback>("Feedback", FeedbackSchema);

export default Feedback;
