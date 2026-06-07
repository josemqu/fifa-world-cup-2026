import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProdeGroup extends Document {
  name: string;
  code: string;
  ownerUid: string;
  members: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProdeGroupSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    ownerUid: { type: String, required: true },
    members: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

ProdeGroupSchema.index({ members: 1 });

const ProdeGroup: Model<IProdeGroup> =
  mongoose.models.ProdeGroup ||
  mongoose.model<IProdeGroup>("ProdeGroup", ProdeGroupSchema);

export default ProdeGroup;
