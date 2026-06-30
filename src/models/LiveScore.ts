import mongoose, { Schema, Document, Model } from "mongoose";

export interface IScorer {
  name: string;
  minute: string;
  isPenalty: boolean;
  isOwnGoal: boolean;
}

export interface ILiveScore extends Document {
  matchId: string; // Tu match ID interno (MA1, MB2, "73", etc.)
  externalId: number; // ID de API-Football
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
  homeScorers: IScorer[];
  awayScorers: IScorer[];
  status: "scheduled" | "live" | "halftime" | "finished";
  elapsed: number | null; // Minuto del partido
  stage: "group" | "knockout";
  groupId?: string; // "A", "B", ... para fase de grupos
  manualOverride?: boolean;
  penaltiesManual?: boolean;
  lastSyncAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LiveScoreSchema: Schema = new Schema(
  {
    matchId: { type: String, required: true, unique: true },
    externalId: { type: Number, index: true },
    homeTeamName: { type: String, required: true },
    awayTeamName: { type: String, required: true },
    homeScore: { type: Number, default: null },
    awayScore: { type: Number, default: null },
    homePenalties: { type: Number, default: null },
    awayPenalties: { type: Number, default: null },
    homeScorers: { type: [Schema.Types.Mixed], default: [] },
    awayScorers: { type: [Schema.Types.Mixed], default: [] },
    status: {
      type: String,
      enum: ["scheduled", "live", "halftime", "finished"],
      default: "scheduled",
    },
    elapsed: { type: Number, default: null },
    stage: {
      type: String,
      enum: ["group", "knockout"],
      required: true,
    },
    groupId: { type: String },
    manualOverride: { type: Boolean, default: false },
    penaltiesManual: { type: Boolean, default: false },
    lastSyncAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookup of live/active matches
LiveScoreSchema.index({ status: 1 });

const LiveScore: Model<ILiveScore> =
  mongoose.models.LiveScore ||
  mongoose.model<ILiveScore>("LiveScore", LiveScoreSchema);

export default LiveScore;
