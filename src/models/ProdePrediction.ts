import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProdePrediction extends Document {
  firebaseUid: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProdePredictionSchema: Schema = new Schema(
  {
    firebaseUid: { type: String, required: true, index: true },
    matchId: { type: String, required: true, index: true },
    homeScore: { type: Number, required: true },
    awayScore: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

ProdePredictionSchema.index({ firebaseUid: 1, matchId: 1 }, { unique: true });

const ProdePrediction: Model<IProdePrediction> =
  mongoose.models.ProdePrediction ||
  mongoose.model<IProdePrediction>("ProdePrediction", ProdePredictionSchema);

export default ProdePrediction;
