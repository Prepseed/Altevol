import mongoose, { Schema } from "mongoose";
import dbNames from "@/config/dbNames";

const BatchSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sport: {
      type: String,
      enum: ["cricket", "tennis"],
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      trim: true,
      default: "",
    },
    endTime: {
      type: String,
      trim: true,
      default: "",
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: dbNames.client,
      required: true,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true, collection: dbNames.altevolBatch }
);

BatchSchema.index({ client: 1, name: 1 }, { unique: true });

if (mongoose.models[dbNames.altevolBatch]) {
  delete mongoose.models[dbNames.altevolBatch];
}

const BatchModel = mongoose.model(
  dbNames.altevolBatch,
  BatchSchema,
  dbNames.altevolBatch
);

export default BatchModel;
