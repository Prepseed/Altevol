import mongoose, { Schema, model, Types } from "mongoose";
import dbNames from "@/config/dbNames";

export interface IOtp {
  mobileNumber: string;
  countryCode?: number;
  clientId?: Types.ObjectId;
  otp: number;
  isExpired: boolean;
  attempt: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    mobileNumber: {
      type: String,
      required: true,
      index: true,
    },
    countryCode: {
      type: Number,
      default: 91,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "clients",
      index: true,
    },
    otp: {
      type: Number,
      required: true,
    },
    isExpired: {
      type: Boolean,
      default: false,
    },
    attempt: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
OtpSchema.index({ mobileNumber: 1, clientId: 1, countryCode: 1 });

// Delete the model if it exists to avoid schema caching issues
if (mongoose.models["otps"]) {
  delete mongoose.models["otps"];
}

const OtpModel = model<IOtp>("otps", OtpSchema);

export default OtpModel;

