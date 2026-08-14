import { Document, Types } from "mongoose";

export default interface IOtp extends Document {
  mobileNumber: string;
  countryCode?: number;
  clientId?: Types.ObjectId;
  otp: number;
  isExpired: boolean;
  attempt: number;
  createdAt?: Date;
  updatedAt?: Date;
}

