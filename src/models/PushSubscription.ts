import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPushSubscription extends Document {
  firebaseUid: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PushSubscriptionSchema: Schema = new Schema(
  {
    firebaseUid: { type: String, required: true, index: true },
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  {
    timestamps: true,
  }
);

// One subscription per endpoint per user
PushSubscriptionSchema.index({ firebaseUid: 1, endpoint: 1 }, { unique: true });

const PushSubscriptionModel: Model<IPushSubscription> =
  mongoose.models.PushSubscription ||
  mongoose.model<IPushSubscription>("PushSubscription", PushSubscriptionSchema);

export default PushSubscriptionModel;
