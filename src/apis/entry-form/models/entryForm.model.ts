import mongoose, { Schema } from "mongoose";
import dbNames from "@/config/dbNames";

const heardFromValues = [
  "google",
  "instagram",
  "facebook",
  "youtube",
  "friend_family",
  "hoarding",
  "website",
  "walk_in",
  "other",
] as const;

const EntryFormSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    howDidYouKnowAboutUs: {
      type: String,
      enum: heardFromValues,
      required: true,
      index: true,
    },
    howDidYouKnowOther: { type: String, trim: true },
    visitedBefore: { type: Boolean, required: true, default: false },
    knownPersonHere: { type: Boolean, required: true, default: false },
    knownPersonName: { type: String, trim: true },
    sport: {
      type: String,
      enum: ["cricket", "tennis"],
      required: true,
      index: true,
    },
    playerLevel: {
      type: String,
      enum: ["beginner", "intermediate", "competitive"],
    },
    age: { type: Number, min: 3, max: 80 },
    preferredVisitDate: { type: Date },
    message: { type: String, trim: true },
    client: {
      type: Schema.Types.ObjectId,
      ref: dbNames.client,
      required: true,
      index: true,
    },
    phase: {
      type: Schema.Types.ObjectId,
      ref: dbNames.phase,
    },
    status: {
      type: String,
      enum: ["new", "contacted", "scheduled", "converted", "closed"],
      default: "new",
      index: true,
    },
  },
  { timestamps: true }
);

EntryFormSchema.index({ client: 1, createdAt: -1 });
EntryFormSchema.index({ client: 1, mobileNumber: 1 });

if (mongoose.models[dbNames.entryForm]) {
  delete mongoose.models[dbNames.entryForm];
}

const EntryFormModel = mongoose.model(dbNames.entryForm, EntryFormSchema);

export default EntryFormModel;
