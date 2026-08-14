import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getBody, isAuthRequired } from "../utils/request";
import BatchModel from "./models/batch.model";
import UserModel from "../users/models/user.model";
import config from "@/config/config";

const SPORTS = ["cricket", "tennis"] as const;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function parseMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function normalizeTime(value: unknown) {
  const time = String(value || "").trim();
  if (!TIME_PATTERN.test(time)) return "";
  return time;
}

function timingError(startTime: string, endTime: string) {
  if (!startTime || !endTime) {
    return "Batch start and end time are required";
  }
  if (parseMinutes(endTime) <= parseMinutes(startTime)) {
    return "End time must be after start time";
  }
  return null;
}

function requireAdmin(auth: {
  success: boolean;
  user?: { role: string };
  error?: string;
}) {
  if (!auth.success || !auth.user) {
    return NextResponse.json(
      { success: false, error: auth.error || "Not authenticated" },
      { status: 401 }
    );
  }
  if (auth.user.role !== "admin" && auth.user.role !== "super") {
    return NextResponse.json(
      { success: false, error: "Admin access required" },
      { status: 403 }
    );
  }
  return null;
}

function serializeBatch(
  doc: {
    _id: Types.ObjectId;
    name: string;
    sport: string;
    startTime?: string;
    endTime?: string;
    sortOrder?: number;
    createdAt?: Date;
    updatedAt?: Date;
  },
  userCount = 0
) {
  return {
    id: String(doc._id),
    name: doc.name,
    sport: doc.sport,
    startTime: doc.startTime || "",
    endTime: doc.endTime || "",
    sortOrder: doc.sortOrder || 0,
    userCount,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const listBatches = async (req: NextRequest) => {
  try {
    const auth = await isAuthRequired(req);
    const denied = requireAdmin(auth);
    if (denied) return denied;

    const client = new Types.ObjectId(config.client);
    const batches = await BatchModel.find({
      client,
      isArchived: { $ne: true },
    })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    const counts = await UserModel.aggregate([
      {
        $match: {
          client,
          role: "user",
          batch: { $in: batches.map((batch) => batch._id) },
        },
      },
      { $group: { _id: "$batch", count: { $sum: 1 } } },
    ]);

    const countMap = new Map(
      counts.map((row: { _id: Types.ObjectId; count: number }) => [
        String(row._id),
        row.count,
      ])
    );

    return NextResponse.json({
      success: true,
      data: batches.map((batch) =>
        serializeBatch(batch, countMap.get(String(batch._id)) || 0)
      ),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load batches";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
};

export const createBatch = async (req: NextRequest) => {
  try {
    const auth = await isAuthRequired(req);
    const denied = requireAdmin(auth);
    if (denied) return denied;

    const body = await getBody(req);
    const name = String(body.name || "").trim();
    const sport = String(body.sport || "").trim().toLowerCase();
    const startTime = normalizeTime(body.startTime);
    const endTime = normalizeTime(body.endTime);

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Batch name is required" },
        { status: 400 }
      );
    }

    if (!SPORTS.includes(sport as (typeof SPORTS)[number])) {
      return NextResponse.json(
        { success: false, error: "Sport must be cricket or tennis" },
        { status: 400 }
      );
    }

    const timeError = timingError(startTime, endTime);
    if (timeError) {
      return NextResponse.json(
        { success: false, error: timeError },
        { status: 400 }
      );
    }

    const client = new Types.ObjectId(config.client);
    const existing = await BatchModel.findOne({
      client,
      name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      isArchived: { $ne: true },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "A batch with this name already exists" },
        { status: 400 }
      );
    }

    const last = await BatchModel.findOne({ client }).sort({ sortOrder: -1 }).lean();
    const doc = await BatchModel.create({
      name,
      sport,
      startTime,
      endTime,
      client,
      sortOrder: (last?.sortOrder || 0) + 1,
      isArchived: false,
    });

    return NextResponse.json({
      success: true,
      message: "Batch created",
      data: serializeBatch(doc, 0),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create batch";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
};

export const updateBatch = async (req: NextRequest, id: string) => {
  try {
    const auth = await isAuthRequired(req);
    const denied = requireAdmin(auth);
    if (denied) return denied;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid batch id" },
        { status: 400 }
      );
    }

    const body = await getBody(req);
    const client = new Types.ObjectId(config.client);
    const batch = await BatchModel.findOne({
      _id: id,
      client,
      isArchived: { $ne: true },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Batch not found" },
        { status: 404 }
      );
    }

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) {
        return NextResponse.json(
          { success: false, error: "Batch name is required" },
          { status: 400 }
        );
      }
      const duplicate = await BatchModel.findOne({
        client,
        _id: { $ne: batch._id },
        name: {
          $regex: new RegExp(
            `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            "i"
          ),
        },
        isArchived: { $ne: true },
      });
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: "A batch with this name already exists" },
          { status: 400 }
        );
      }
      batch.name = name;
    }

    if (body.sport !== undefined) {
      const sport = String(body.sport).trim().toLowerCase();
      if (!SPORTS.includes(sport as (typeof SPORTS)[number])) {
        return NextResponse.json(
          { success: false, error: "Sport must be cricket or tennis" },
          { status: 400 }
        );
      }
      batch.sport = sport;
    }

    const nextStart =
      body.startTime !== undefined
        ? normalizeTime(body.startTime)
        : String(batch.startTime || "");
    const nextEnd =
      body.endTime !== undefined
        ? normalizeTime(body.endTime)
        : String(batch.endTime || "");
    const timeError = timingError(nextStart, nextEnd);
    if (timeError) {
      return NextResponse.json(
        { success: false, error: timeError },
        { status: 400 }
      );
    }
    batch.startTime = nextStart;
    batch.endTime = nextEnd;

    await batch.save();
    const userCount = await UserModel.countDocuments({
      client,
      role: "user",
      batch: batch._id,
    });

    return NextResponse.json({
      success: true,
      message: "Batch updated",
      data: serializeBatch(batch, userCount),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update batch";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
};

export const deleteBatch = async (req: NextRequest, id: string) => {
  try {
    const auth = await isAuthRequired(req);
    const denied = requireAdmin(auth);
    if (denied) return denied;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid batch id" },
        { status: 400 }
      );
    }

    const client = new Types.ObjectId(config.client);
    const batch = await BatchModel.findOne({
      _id: id,
      client,
      isArchived: { $ne: true },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Batch not found" },
        { status: 404 }
      );
    }

    const userCount = await UserModel.countDocuments({
      client,
      role: "user",
      batch: batch._id,
    });

    if (userCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Move people out of this batch before deleting it",
        },
        { status: 400 }
      );
    }

    batch.isArchived = true;
    await batch.save();

    return NextResponse.json({
      success: true,
      message: "Batch deleted",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete batch";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
};
