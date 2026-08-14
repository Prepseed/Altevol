import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { getBody, getQuery, isAuthRequired } from "../utils/request";
import EntryFormModel from "./models/entryForm.model";
import config from "@/config/config";

const HEARD_FROM = [
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

const SPORTS = ["cricket", "tennis"] as const;
const PLAYER_LEVELS = ["beginner", "intermediate", "competitive"] as const;
const DEFAULT_PHASE_ID = "6a7ed78d63c16db253252f87";

function toBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === "yes" || value === "true" || value === 1 || value === "1") {
    return true;
  }
  if (value === "no" || value === "false" || value === 0 || value === "0") {
    return false;
  }
  return null;
}

function requireAdmin(auth: { success: boolean; user?: { role: string }; error?: string }) {
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

function serializeEntry(doc: {
  _id: Types.ObjectId;
  name: string;
  mobileNumber: string;
  email: string;
  howDidYouKnowAboutUs: string;
  howDidYouKnowOther?: string;
  visitedBefore: boolean;
  knownPersonHere: boolean;
  knownPersonName?: string;
  sport: string;
  playerLevel?: string;
  age?: number;
  preferredVisitDate?: Date;
  message?: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: doc._id,
    name: doc.name,
    mobileNumber: doc.mobileNumber,
    email: doc.email,
    howDidYouKnowAboutUs: doc.howDidYouKnowAboutUs,
    howDidYouKnowOther: doc.howDidYouKnowOther || "",
    visitedBefore: doc.visitedBefore,
    knownPersonHere: doc.knownPersonHere,
    knownPersonName: doc.knownPersonName || "",
    sport: doc.sport,
    playerLevel: doc.playerLevel || "",
    age: doc.age ?? null,
    preferredVisitDate: doc.preferredVisitDate || null,
    message: doc.message || "",
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const createEntryForm = async (req: NextRequest) => {
  try {
    const body = await getBody(req);
    const {
      name,
      mobileNumber,
      email,
      howDidYouKnowAboutUs,
      howDidYouKnowOther,
      visitedBefore,
      knownPersonHere,
      knownPersonName,
      sport,
      playerLevel,
      age,
      preferredVisitDate,
      message,
    } = body;

    if (!name || !mobileNumber || !email || !howDidYouKnowAboutUs || !sport) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Name, mobile number, email, how did you know about us, and sport are required",
        },
        { status: 400 }
      );
    }

    const mobile = String(mobileNumber).replace(/[+\s-]/g, "");
    if (!/^\d{10}$/.test(mobile)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid 10-digit mobile number" },
        { status: 400 }
      );
    }

    const emailValue = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (!HEARD_FROM.includes(howDidYouKnowAboutUs)) {
      return NextResponse.json(
        { success: false, error: "Invalid value for howDidYouKnowAboutUs" },
        { status: 400 }
      );
    }

    if (howDidYouKnowAboutUs === "other" && !String(howDidYouKnowOther || "").trim()) {
      return NextResponse.json(
        { success: false, error: "Please tell us how you heard about us" },
        { status: 400 }
      );
    }

    const visitedBeforeValue = toBoolean(visitedBefore);
    const knownPersonHereValue = toBoolean(knownPersonHere);
    if (visitedBeforeValue === null || knownPersonHereValue === null) {
      return NextResponse.json(
        {
          success: false,
          error: "visitedBefore and knownPersonHere must be true or false",
        },
        { status: 400 }
      );
    }

    if (knownPersonHereValue && !String(knownPersonName || "").trim()) {
      return NextResponse.json(
        { success: false, error: "Please enter the known person's name" },
        { status: 400 }
      );
    }

    if (!SPORTS.includes(sport)) {
      return NextResponse.json(
        { success: false, error: "Sport must be cricket or tennis" },
        { status: 400 }
      );
    }

    if (playerLevel && !PLAYER_LEVELS.includes(playerLevel)) {
      return NextResponse.json(
        { success: false, error: "Invalid player level" },
        { status: 400 }
      );
    }

    const client = new Types.ObjectId(config.client);
    const phase = new Types.ObjectId(DEFAULT_PHASE_ID);

    const doc = await EntryFormModel.create({
      name: String(name).trim(),
      mobileNumber: mobile,
      email: emailValue,
      howDidYouKnowAboutUs,
      howDidYouKnowOther:
        howDidYouKnowAboutUs === "other"
          ? String(howDidYouKnowOther).trim()
          : undefined,
      visitedBefore: visitedBeforeValue,
      knownPersonHere: knownPersonHereValue,
      knownPersonName: knownPersonHereValue
        ? String(knownPersonName).trim()
        : undefined,
      sport,
      playerLevel: playerLevel || undefined,
      age: age ? Number(age) : undefined,
      preferredVisitDate: preferredVisitDate
        ? new Date(preferredVisitDate)
        : undefined,
      message: message ? String(message).trim() : undefined,
      client,
      phase,
      status: "new",
    });

    return NextResponse.json({
      success: true,
      message: "Entry form submitted successfully",
      data: serializeEntry(doc),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to submit entry form";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
};

export const listEntryForms = async (req: NextRequest) => {
  try {
    const auth = await isAuthRequired(req);
    const denied = requireAdmin(auth);
    if (denied) return denied;

    const query = await getQuery(req);
    const search = String(query.search || "").trim();
    const sport = String(query.sport || "").trim();
    const status = String(query.status || "").trim();
    const page = Math.max(1, parseInt(query.page || "1", 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(query.pageSize || "20", 10) || 20)
    );

    const filter: Record<string, unknown> = {
      client: new Types.ObjectId(config.client),
    };

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { mobileNumber: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
      ];
    }

    if (sport && SPORTS.includes(sport as (typeof SPORTS)[number])) {
      filter.sport = sport;
    }

    if (status) {
      filter.status = status;
    }

    const [items, total] = await Promise.all([
      EntryFormModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      EntryFormModel.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: items.map((item) => serializeEntry(item)),
        total,
        page,
        pageSize,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load entry forms";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
};

export const getEntryForm = async (req: NextRequest, id: string) => {
  try {
    const auth = await isAuthRequired(req);
    const denied = requireAdmin(auth);
    if (denied) return denied;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid entry form id" },
        { status: 400 }
      );
    }

    const doc = await EntryFormModel.findOne({
      _id: id,
      client: new Types.ObjectId(config.client),
    }).lean();

    if (!doc) {
      return NextResponse.json(
        { success: false, error: "Entry form not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serializeEntry(doc),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load entry form";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
};
