import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification extends Document {
  firebaseUid: string;
  type: "missing_prediction" | "daily_winner" | "general";
  title: string;
  body: string;
  icon?: string;
  link?: string;
  read: boolean;
  sentAt: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    firebaseUid: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["missing_prediction", "daily_winner", "general"],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    icon: { type: String },
    link: { type: String },
    read: { type: Boolean, default: false },
    sentAt: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

// Efficient query for unread notifications per user
NotificationSchema.index({ firebaseUid: 1, read: 1, sentAt: -1 });

const NotificationModel: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default NotificationModel;
