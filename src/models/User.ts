import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  displayName: string;
  nickname?: string;
  country?: string;
  favoriteTeam?: string;
  gender?: string;
  age?: number;
  birthDate?: string;
  role: "user" | "admin";
  excludeFromStats?: boolean;
  preferences: {
    language: string;
  };
  lastLoginAt?: Date;
  loginCount: number;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String },
    displayName: { type: String },
    nickname: { type: String },
    country: { type: String },
    favoriteTeam: { type: String },
    gender: { type: String },
    age: { type: Number },
    birthDate: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    excludeFromStats: { type: Boolean, default: false },
    preferences: {
      language: { type: String, default: "es" },
    },
    lastLoginAt: { type: Date },
    loginCount: { type: Number, default: 0 },
    lastActiveAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Prevent overwriting the model if it's already compiled
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
