import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPrediction extends Document {
  firebaseUid: string;
  groupStage: any; // Using Mixed type for flexibility with the complex group data structure
  knockoutStage: any; // Using Mixed type for knockout matches
  champion: string;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PredictionSchema: Schema = new Schema(
  {
    firebaseUid: { type: String, required: true },
    groupStage: { type: Schema.Types.Mixed, required: true },
    knockoutStage: { type: Schema.Types.Mixed, required: true },
    champion: { type: String },
    isComplete: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one prediction per user (can be relaxed later if we want multiple brackets)
PredictionSchema.index({ firebaseUid: 1 }, { unique: true });

const Prediction: Model<IPrediction> =
  mongoose.models.Prediction ||
  mongoose.model<IPrediction>("Prediction", PredictionSchema);

export default Prediction;
