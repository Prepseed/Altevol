import { Document, Types } from "mongoose";
import { JwtPayload } from "jsonwebtoken";

export default interface IUser extends Document {
  name: string;
  email: string;
  emailIdentifier: string;
  mobileNumber: string;
  salt: string;
  hash: string;
  username: string;
  uniqueCode: string;
  batch?: Types.ObjectId;
  feesPaid: boolean;
  role: string;
  client: Types.ObjectId;
  dp: string;
  facePhoto?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  dob?: Date;
  aclRole?: Types.ObjectId;
  aclTemplate?: Types.ObjectId;
  isActive: boolean;
  isArchived: boolean;
  gender?: string;
  loyaltyPoints?: number;
  anniversary?: Date;
  // Legacy fields for backward compatibility
  mobile?: string;
  password?: string;
  isMobileVerified?: boolean;
  isEmailVerified?: boolean;
  panNumber?: string;
  acl?: Types.ObjectId;
  branch?: Types.ObjectId[];
  phases?: Types.ObjectId[];
  shantiBatches?: Types.ObjectId[];
  shifts?: Types.ObjectId[];
  shiftSections?: Types.ObjectId[];
  cities?: string[];

  // Methods
  setPassword: (this: IUser, password: string) => void;
  validatePassword: (this: IUser, password: string) => boolean;
  verifyPassword: (this: IUser, password: string) => Promise<boolean>;
  generatePassword: (password: string) => Promise<string>;
  generateJWT: (this: IUser) => Promise<string>;
  verifyJWT: (jwt: string) => Promise<string | JwtPayload>;
}
