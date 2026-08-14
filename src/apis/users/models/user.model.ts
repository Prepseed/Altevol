import mongoose, { Model, Schema } from "mongoose";
import IUser from "../types/User";
import dbNames from "@/config/dbNames";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { JwtPayload, sign, verify } from "jsonwebtoken";
import config from "@/config/config";
import UserTokenModel from "./usertoken.model";

// Helper function to generate avatar URL from initials using DiceBear API
function generateAvatarFromInitials(name: string): string {
  if (!name || !name.trim()) {
    return "https://api.dicebear.com/7.x/initials/svg?seed=User";
  }

  // Extract initials from name (first letter of each word, max 2 letters)
  const words = name.trim().split(/\s+/);
  let initials = "";

  if (words.length >= 2) {
    // Take first letter of first word and first letter of last word
    initials = (words[0][0] + words[words.length - 1][0]).toUpperCase();
  } else if (words.length === 1) {
    // Take first two letters of single word
    initials = words[0].substring(0, 2).toUpperCase();
  }

  // Use name as seed for consistent avatar generation
  const seed = encodeURIComponent(name.trim());
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
}

// Helper function to get stripped email (removes dots and everything after +)
function getStrippedEmail(
  fullEmail: string,
  options?: { removeDots: boolean }
): string {
  const removeDots = options?.removeDots !== false;
  if (typeof fullEmail !== "string") {
    return fullEmail;
  }
  let strippedEmail = "";
  let isPlusSignOccurred = false;
  let hasAtOccurred = false;
  for (let i = 0; i < fullEmail.length; i += 1) {
    const c = fullEmail[i];
    if (c === ".") {
      if (hasAtOccurred || !removeDots) {
        strippedEmail += c;
      }
    } else if (c === "+") {
      isPlusSignOccurred = true;
    } else if (c === "@") {
      strippedEmail += c;
      isPlusSignOccurred = false;
      hasAtOccurred = true;
    } else if (c === " ") {
      // Skip spaces
    } else if (!isPlusSignOccurred) {
      strippedEmail += c;
    }
  }
  return strippedEmail.toLowerCase();
}

const schema = new Schema<any>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      unique: true,
    },
    emailIdentifier: {
      type: String,
      trim: true,
      index: true,
    },
    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
      index: true,
    },
    username: {
      type: String,
      trim: true,
    },
    uniqueCode: {
      type: String,
      trim: true,
      uppercase: false,
      index: true,
    },
    batch: {
      type: Schema.Types.ObjectId,
      ref: dbNames.altevolBatch,
      index: true,
    },
    salt: {
      type: String,
    },
    hash: {
      type: String,
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      default: "user",
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: "clients",
      required: [true, "Client ID is required"],
      index: true,
    },
    dp: {
      type: String,
      trim: true,
      default: "",
    },
    facePhoto: {
      type: String,
      trim: true,
      default: "",
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    dob: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    // ACL integrations: optional references to dynamic ACL role/config
    aclRole: {
      type: Schema.Types.ObjectId,
      ref: "roles",
    },
    aclTemplate: {
      type: Schema.Types.ObjectId,
      ref: "templates",
    },
    acl: {
      type: Schema.Types.ObjectId,
      ref: "acl",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    password: {
      type: String,
      trim: true,
    },
    isMobileVerified: {
      type: Boolean,
      default: false,
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
    },
    anniversary: {
      type: Date,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    panNumber: {
      type: String,
      trim: true,
    },

    // ===== SHANTI JUNIOR SPECIFIC FIELDS =====
    // These fields match exactly with node-backend user model

    branch: [
      {
        type: Schema.Types.ObjectId,
        ref: dbNames.branch,
        index: true,
      },
    ],
    phases: [
      {
        type: Schema.Types.ObjectId,
        ref: dbNames.phase,
        index: true,
      },
    ],
    shantiBatches: [
      {
        type: Schema.Types.ObjectId,
        ref: dbNames.batch,
        index: true,
      },
    ],
    shifts: [
      {
        type: Schema.Types.ObjectId,
        ref: dbNames.shift,
        index: true,
      },
    ],
    shiftSections: [
      {
        type: Schema.Types.ObjectId,
        ref: dbNames.section,
        index: true,
      },
    ],
    cities: [
      {
        type: String,
        trim: true,
      },
    ],


    // Parent-Child relationship
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      index: true,
    },
    children: [
      {
        type: Schema.Types.ObjectId,
        ref: "users",
      },
    ],

    // Staff specific
    staffRole: {
      type: String,
      enum: ["teacher", "admin", "coordinator", "support", "other"],
    },
    assignedBatches: [
      {
        type: Schema.Types.ObjectId,
        ref: "batches",
      },
    ],

    // Admission details
    admissionForm: {
      type: Schema.Types.ObjectId,
      ref: "admissionForms",
    },
    admissionDate: {
      type: Date,
    },
    admissionStatus: {
      type: String,
      enum: ["enquiry", "admitted", "cancelled", "graduated"],
      default: "enquiry",
      index: true,
    },

    // Payment
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid", "refunded"],
      default: "pending",
    },
    feesPaid: {
      type: Boolean,
      default: true,
      index: true,
    },
    totalFees: {
      type: Number,
      default: 0,
    },

    // Additional student info
    avatar: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "userCategories",
    },
    userCompleteDetails: {
      type: Schema.Types.ObjectId,
      ref: "userCompleteDetails",
    },

    // Contact
    alternatePhone: {
      type: String,
      trim: true,
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },

    // FCM Token for notifications
    fcmToken: {
      type: [String],
      default: [],
    },

    // Shanti Junior / JATF-style user (createRoleWiseUserForShantiJunior)
    subscriptions: { type: Schema.Types.Mixed, default: [] },
    milestones: { type: Schema.Types.Mixed, default: [] },
    settings: { type: Schema.Types.Mixed, default: {} },
    isVerified: { type: Boolean, default: false },

    // Last login timestamp (updated on GET /users)
    lastLoginTime: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Method to set password using salt and hash (from node-backend pattern)
schema.methods.setPassword = function (this: IUser, password: string): void {
  this.salt = crypto.randomBytes(16).toString("hex");
  this.hash = crypto
    .pbkdf2Sync(password, this.salt, 10000, 512, "sha512")
    .toString("hex");
  // Also set password for backward compatibility
  this.password = bcrypt.hashSync(password, 10);
};

// Method to validate password using salt and hash (from node-backend pattern)
schema.methods.validatePassword = function (
  this: IUser,
  password: string
): boolean {
  if (!this.salt || !this.hash) {
    // Fallback to bcrypt for legacy users
    if (this.password) {
      return bcrypt.compareSync(password, this.password);
    }
    return false;
  }

  // Check master password in development/staging
  if (
    (config.env === "development" || config.env === "staging") &&
    config.masterPassword &&
    password === config.masterPassword
  ) {
    return true;
  }

  const hash = crypto
    .pbkdf2Sync(password, this.salt, 10000, 512, "sha512")
    .toString("hex");
  return this.hash === hash;
};

// Legacy method for backward compatibility
schema.methods.verifyPassword = async function (
  this: IUser,
  password: string
): Promise<boolean> {
  return this.validatePassword(password);
};

schema.methods.generatePassword = function (password: string): string {
  return bcrypt.hashSync(password, 10);
};

// Pre-save middleware to hash password, set emailIdentifier, and generate username.
// Mongoose 9 async hooks do not receive `next` — throw instead of calling it.
schema.pre("save", async function () {
  const user = this as any;

  // Set client from config if not provided (required for all users)
  if (!user.client) {
    if (config.client) {
      user.client = new mongoose.Types.ObjectId(config.client);
    } else {
      throw new Error(
        "Client ID is required. Set CLIENT environment variable."
      );
    }
  }

  // Set emailIdentifier from email if not already set
  if (this.isModified("email") && user.email && !user.emailIdentifier) {
    user.emailIdentifier = getStrippedEmail(String(user.email));
  }

  // Generate username from name, email, or mobileNumber if not provided
  if (user.isNew && !user.username) {
    let generatedUsername = "";

    // Priority: name > email > mobileNumber
    if (user.name && String(user.name).trim()) {
      generatedUsername = String(user.name)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    } else if (user.email && String(user.email).trim()) {
      const emailPart = String(user.email).split("@")[0];
      generatedUsername = emailPart
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    } else if (user.mobileNumber && String(user.mobileNumber).trim()) {
      generatedUsername = String(user.mobileNumber).trim();
    }

    if (!generatedUsername) {
      generatedUsername = `user-${Date.now()}`;
    }

    const UserModel = this.constructor as Model<any>;
    let finalUsername = generatedUsername;
    let counter = 1;

    while (
      await UserModel.findOne({
        username: finalUsername,
        client: user.client,
      })
    ) {
      finalUsername = `${generatedUsername}-${counter}`;
      counter++;
    }

    user.username = finalUsername;
  }

  if (this.isModified("password") && user.password) {
    user.setPassword(user.password);
  }

  if (user.isNew && !user.dp && user.name) {
    user.dp = generateAvatarFromInitials(String(user.name));
  }
});

schema.methods.generateJWT = async function (this: any): Promise<string> {
  // Trim secret to ensure no whitespace issues
  const secret = config.jwtSecret.trim();
  const token = sign({ id: this._id, role: this.role }, secret, {
    expiresIn: "60d",
  });
  await UserTokenModel.create({ user: this._id, token });
  return token;
};

schema.methods.verifyJWT = async function (
  jwt: string
): Promise<string | JwtPayload> {
  const decoded: JwtPayload = verify(jwt, config.jwtSecret) as JwtPayload;
  const userToken = await UserTokenModel.findOne({
    token: jwt,
    expiresAt: { $gt: new Date() },
    user: decoded.id,
  });
  if (!userToken) {
    return null;
  }
  return decoded;
};

// Compound unique index for username + client (username can be same across different clients)
schema.index({ username: 1, client: 1 }, { unique: true, sparse: true });
schema.index({ uniqueCode: 1, client: 1 }, { unique: true, sparse: true });

// Delete the model if it exists to avoid schema caching issues
if (mongoose.models[dbNames.user]) {
  delete mongoose.models[dbNames.user];
}

const UserModel = mongoose.model<IUser>(dbNames.user, schema);

export default UserModel;
