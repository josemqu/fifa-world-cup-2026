import mongoose, { Schema, Document, Model } from "mongoose";

export type ActivityAction =
  | "LOGIN"
  | "PAGE_VIEW"
  | "PREDICTION_MADE"
  | "PREDICTION_UPDATED"
  | "PROFILE_UPDATED";

export interface IUserActivity extends Document {
  firebaseUid: string;
  action: ActivityAction;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const UserActivitySchema: Schema = new Schema(
  {
    firebaseUid: { type: String, required: true, index: true },
    action: {
      type: String,
      enum: [
        "LOGIN",
        "PAGE_VIEW",
        "PREDICTION_MADE",
        "PREDICTION_UPDATED",
        "PROFILE_UPDATED",
      ],
      required: true,
    },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index for efficient date-range queries (analytics)
UserActivitySchema.index({ createdAt: -1 });
UserActivitySchema.index({ action: 1, createdAt: -1 });

const UserActivity: Model<IUserActivity> =
  mongoose.models.UserActivity ||
  mongoose.model<IUserActivity>("UserActivity", UserActivitySchema);

export default UserActivity;
