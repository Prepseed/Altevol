import mongoose, { Schema } from "mongoose";
import dbNames from "@/config/dbNames";

const CheckInSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: dbNames.user,
      required: true,
      index: true,
    },
    uniqueCode: {
      type: String,
      required: true,
      index: true,
    },
    checkin: {
      type: Date,
      required: true,
      default: Date.now,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: dbNames.client,
      required: true,
      index: true,
    },
    scannedBy: {
      type: Schema.Types.ObjectId,
      ref: dbNames.user,
    },
  },
  { timestamps: true }
);

CheckInSchema.index({ client: 1, user: 1, checkin: -1 });

if (mongoose.models[dbNames.checkIn]) {
  delete mongoose.models[dbNames.checkIn];
}

const CheckInModel = mongoose.model(dbNames.checkIn, CheckInSchema);

export default CheckInModel;
