import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import dayjs from "dayjs";
import {
  getBody,
  getQuery,
  isAuthRequired,
  setCookie,
  removeCookie,
  getAuthCookie,
} from "../utils/request";
import UserModel from "./models/user.model";
import OtpModel from "./models/otp.model";
import UserTokenModel from "./models/usertoken.model";
import CheckInModel from "./models/checkIn.model";
import BatchModel from "../batches/models/batch.model";
import EntryFormModel from "../entry-form/models/entryForm.model";
import config from "@/config/config";

function parseMobile(mobileNumber: string) {
  let countryCode = 91;
  let mobile = mobileNumber;

  if (mobileNumber.includes("-")) {
    const [code, number] = mobileNumber.split("-");
    countryCode = parseInt(code.replace("+", ""), 10) || 91;
    mobile = number;
  } else {
    mobile = mobileNumber.replace(/[+\s]/g, "");
  }

  return { countryCode, mobile };
}

function dummyNumbers() {
  return config.dummyOtpNumbers;
}

function serializeUserBatch(batch: unknown) {
  if (!batch || typeof batch !== "object" || !("name" in batch)) {
    return null;
  }

  const doc = batch as {
    _id?: Types.ObjectId;
    name?: string;
    sport?: string;
    startTime?: string;
    endTime?: string;
  };

  return {
    id: doc._id,
    name: doc.name || "",
    sport: doc.sport || "",
    startTime: doc.startTime || "",
    endTime: doc.endTime || "",
  };
}

function formatUser(user: { toObject: () => Record<string, unknown> }) {
  const raw = user.toObject();
  delete raw.password;
  delete raw.salt;
  delete raw.hash;
  raw.batch = serializeUserBatch(raw.batch);
  return raw;
}

export const sendOTP = async (req: NextRequest) => {
  try {
    const { mobileNumber } = await getBody(req);

    if (!mobileNumber) {
      return NextResponse.json({
        success: false,
        error: "Mobile number is required",
      });
    }

    const clientId = config.client;
    const { countryCode, mobile } = parseMobile(mobileNumber);
    const isDummyNumber = dummyNumbers().includes(mobile);

    if (isDummyNumber) {
      const otp =
        config.env === "development"
          ? 123456
          : Math.floor(100000 + Math.random() * 900000);

      await OtpModel.findOneAndUpdate(
        {
          mobileNumber: mobile,
          countryCode,
          clientId: new Types.ObjectId(clientId),
        },
        { otp, isExpired: false, attempt: 0 },
        { new: true, upsert: true }
      );

      return NextResponse.json({
        success: true,
        message: "OTP sent successfully (dummy number)",
        ...(config.env === "development" && { otp }),
      });
    }

    const findUser = await UserModel.findOne({
      mobileNumber: mobile,
      client: new Types.ObjectId(clientId),
    });

    if (!findUser) {
      return NextResponse.json({
        success: false,
        error:
          "User not registered. Please contact the academy to create your login.",
      });
    }

    if (findUser.isActive === false) {
      return NextResponse.json({
        success: false,
        error: "User is inactive",
      });
    }

    const otp =
      config.env === "development"
        ? 123456
        : Math.floor(100000 + Math.random() * 900000);

    await OtpModel.findOneAndUpdate(
      {
        mobileNumber: mobile,
        countryCode,
        isExpired: false,
        clientId: new Types.ObjectId(clientId),
      },
      { otp, isExpired: false, attempt: 0, clientId: new Types.ObjectId(clientId) },
      { new: true, upsert: true }
    );

    if (config.env === "development") {
      console.log(`[DEV] OTP for ${mobile}: ${otp}`);
      return NextResponse.json({
        success: true,
        message: "OTP ready (development — SMS not sent)",
        otp,
      });
    }

    const otpSent = await fetch(
      "https://uq3o2bj9k4.execute-api.ap-south-1.amazonaws.com/api/sendOtp",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          mobileNumber: mobile.toString(),
          client_name: "Altevol",
          otp: otp.toString(),
          countryCode: countryCode.toString(),
        }),
      }
    );

    const data = await otpSent.json();
    if (data.success === true) {
      return NextResponse.json({
        success: true,
        message: "OTP sent successfully",
      });
    }

    return NextResponse.json(
      { success: false, message: "Error while sending OTP", data },
      { status: 500 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send OTP";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
};

export const verifyOtp = async (req: NextRequest) => {
  try {
    const { otp, mobileNumber } = await getBody(req);
    if (!otp || !mobileNumber) {
      return NextResponse.json(
        { success: false, error: "OTP and mobile number are required" },
        { status: 400 }
      );
    }

    const clientId = config.client;
    const { countryCode, mobile } = parseMobile(mobileNumber);
    const isDummyNumber = dummyNumbers().includes(mobile);
    const otpValue = parseInt(otp.toString(), 10);
    const otpValueStr = otpValue.toString();
    const isMasterOtp = otpValueStr === String(config.masterOtp);

    let findOtp = null;
    if (!isMasterOtp) {
      const otpQuery: {
        mobileNumber: string;
        clientId: Types.ObjectId;
        countryCode?: number;
        isExpired?: boolean;
      } = {
        mobileNumber: mobile,
        clientId: new Types.ObjectId(clientId),
      };
      if (countryCode !== 91) otpQuery.countryCode = countryCode;
      if (!isDummyNumber) otpQuery.isExpired = false;

      findOtp = await OtpModel.findOne(otpQuery).sort({ updatedAt: -1 });

      if (!findOtp) {
        return NextResponse.json(
          { success: false, error: "No OTP registered for this number" },
          { status: 400 }
        );
      }

      if (findOtp.attempt >= 3 && !isDummyNumber) {
        findOtp.isExpired = true;
        await findOtp.save();
        return NextResponse.json(
          { success: false, error: "Attempt limit reached. Please request a new OTP." },
          { status: 400 }
        );
      }

      if (otpValue !== findOtp.otp) {
        findOtp.attempt += 1;
        await findOtp.save();
        return NextResponse.json({ success: false, error: "Invalid OTP" });
      }
    }

    const user = await UserModel.findOne({
      mobileNumber: mobile,
      client: new Types.ObjectId(clientId),
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: "No user found with this mobile number",
      });
    }

    if (user.isActive === false) {
      return NextResponse.json({
        success: false,
        error: "User is inactive",
      });
    }

    const token = await user.generateJWT();
    await user.populate("batch", "name sport startTime endTime");
    const userResponse = formatUser(user);

    if (findOtp && !isDummyNumber) {
      findOtp.isExpired = true;
      findOtp.attempt = 0;
      await findOtp.save();
    }

    const response = NextResponse.json({
      success: true,
      data: userResponse,
      token,
    });
    setCookie(response, "auth", token);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to verify OTP";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
};

export const resendOtp = async (req: NextRequest) => {
  try {
    const { mobileNumber } = await getBody(req);
    if (!mobileNumber) {
      return NextResponse.json({
        success: false,
        error: "Mobile number is required",
      });
    }

    const { countryCode, mobile } = parseMobile(mobileNumber);
    const clientId = config.client;

    const findUser = await UserModel.findOne({
      mobileNumber: mobile,
      client: new Types.ObjectId(clientId),
    });

    if (!findUser) {
      return NextResponse.json({
        success: false,
        error:
          "User not registered. Please contact the academy to create your login.",
      });
    }

    const otpRegister = await OtpModel.findOneAndUpdate(
      {
        mobileNumber: mobile,
        countryCode,
        clientId: new Types.ObjectId(clientId),
      },
      config.env === "development"
        ? { otp: 123456, attempt: 0, isExpired: false }
        : { attempt: 0, isExpired: false },
      { new: true }
    );

    if (!otpRegister) {
      return NextResponse.json(
        { success: false, error: "OTP is expired. Please request a new OTP." },
        { status: 400 }
      );
    }

    if (config.env === "development") {
      return NextResponse.json({
        success: true,
        message: "OTP ready (development — SMS not sent)",
        otp: otpRegister.otp,
      });
    }

    return NextResponse.json({
      success: true,
      message: "OTP re-sent successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to resend OTP";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
};

export const getUserData = async (req: NextRequest) => {
  try {
    const { success, user, error } = await isAuthRequired(req);
    if (!success) {
      return NextResponse.json({ success: false, error }, { status: 401 });
    }

    const userData = await UserModel.findById(user?.id).populate(
      "batch",
      "name sport startTime endTime"
    );
    if (!userData) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const token = (await getAuthCookie(req)) || (await userData.generateJWT());
    return NextResponse.json({
      success: true,
      data: formatUser(userData),
      token,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get user";
    return NextResponse.json({ success: false, error: message });
  }
};

export const logout = async (req: NextRequest) => {
  try {
    const { success, user, error } = await isAuthRequired(req);
    if (!success || !user) {
      return NextResponse.json(
        { success: false, error: error || "Not authenticated" },
        { status: 401 }
      );
    }

    const token = await getAuthCookie(req);
    if (token) {
      await UserTokenModel.updateOne(
        { token, user: user.id },
        { $set: { expiresAt: new Date() } }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
    removeCookie(response, "auth");
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Logout failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
};

function isFeesPaid(value: unknown) {
  if (value === false || value === 0 || value === "false") return false;
  return true;
}

export const checkIn = async (req: NextRequest) => {
  try {
    const auth = await isAuthRequired(req);
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Not authenticated" },
        { status: 401 }
      );
    }

    const { uniqueCode } = await getBody(req);
    const code = String(uniqueCode || "").trim();
    if (!code) {
      return NextResponse.json(
        { success: false, error: "uniqueCode is required" },
        { status: 400 }
      );
    }

    const scannerRoles = ["admin", "super", "guard"];
    const canScanOthers = scannerRoles.includes(auth.user.role);

    const client = new Types.ObjectId(config.client);
    const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const user = await UserModel.findOne({
      client,
      isArchived: { $ne: true },
      uniqueCode: { $regex: new RegExp(`^${escaped}$`, "i") },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found for this unique code" },
        { status: 404 }
      );
    }

    if (!canScanOthers && String(user._id) !== auth.user.id) {
      return NextResponse.json(
        { success: false, error: "Only a guard can check in another user" },
        { status: 403 }
      );
    }

    if (user.role !== "user") {
      return NextResponse.json(
        { success: false, error: "Check-in is only for users" },
        { status: 400 }
      );
    }

    if (user.isActive === false || !isFeesPaid(user.feesPaid)) {
      return NextResponse.json(
        {
          success: false,
          error: "You cannot check in as you have not paid the fees",
          data: {
            userId: user._id,
            name: user.name,
            uniqueCode: user.uniqueCode,
            feesPaid: false,
            isActive: user.isActive !== false,
          },
        },
        { status: 400 }
      );
    }

    const alreadyToday = await CheckInModel.findOne({
      user: user._id,
      client,
      checkin: {
        $gte: dayjs().startOf("day").toDate(),
        $lte: dayjs().endOf("day").toDate(),
      },
    }).sort({ checkin: -1 });

    if (alreadyToday) {
      return NextResponse.json({
        success: true,
        message: "Already checked in",
        data: {
          id: alreadyToday._id,
          userId: user._id,
          name: user.name,
          uniqueCode: user.uniqueCode,
          feesPaid: true,
          checkin: alreadyToday.checkin,
          alreadyCheckedIn: true,
        },
      });
    }

    const record = await CheckInModel.create({
      user: user._id,
      uniqueCode: user.uniqueCode,
      checkin: new Date(),
      client,
      scannedBy: new Types.ObjectId(auth.user.id),
    });

    return NextResponse.json({
      success: true,
      message: "Checked in",
      data: {
        id: record._id,
        userId: user._id,
        name: user.name,
        uniqueCode: user.uniqueCode,
        feesPaid: true,
        checkin: record.checkin,
        alreadyCheckedIn: false,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to check in";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
};

function serializeCheckIn(doc: {
  _id: Types.ObjectId;
  user?: {
    _id?: Types.ObjectId;
    name?: string;
    mobileNumber?: string;
    uniqueCode?: string;
    email?: string;
    feesPaid?: boolean | number;
  } | Types.ObjectId;
  uniqueCode?: string;
  checkin?: Date;
}) {
  const populated =
    doc.user && typeof doc.user === "object" && "name" in doc.user
      ? doc.user
      : null;

  return {
    id: doc._id,
    userId: populated?._id || doc.user || null,
    name: populated?.name || "",
    mobileNumber: populated?.mobileNumber || "",
    email: populated?.email || "",
    uniqueCode: populated?.uniqueCode || doc.uniqueCode || "",
    feesPaid: isFeesPaid(populated?.feesPaid),
    checkin: doc.checkin,
  };
}

export const listCheckIns = async (req: NextRequest) => {
  try {
    const auth = await isAuthRequired(req);
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

    const query = await getQuery(req);
    const search = String(query.search || "").trim();
    const page = Math.max(1, parseInt(query.page || "1", 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(query.pageSize || "20", 10) || 20)
    );

    const client = new Types.ObjectId(config.client);
    const filter: Record<string, unknown> = { client };

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = { $regex: escaped, $options: "i" };
      const matchedUsers = await UserModel.find({
        client,
        $or: [{ name: regex }, { mobileNumber: regex }, { uniqueCode: regex }],
      })
        .select("_id")
        .lean();

      filter.$or = [
        { uniqueCode: regex },
        { user: { $in: matchedUsers.map((user) => user._id) } },
      ];
    }

    const [items, total, recent] = await Promise.all([
      CheckInModel.find(filter)
        .sort({ checkin: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .populate("user", "name mobileNumber uniqueCode email feesPaid")
        .lean(),
      CheckInModel.countDocuments(filter),
      CheckInModel.find({ client })
        .sort({ checkin: -1 })
        .limit(10)
        .populate("user", "name mobileNumber uniqueCode email feesPaid")
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: items.map((item) => serializeCheckIn(item)),
        recent: recent.map((item) => serializeCheckIn(item)),
        total,
        page,
        pageSize,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load check-ins";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
};

export const listMyCheckIns = async (req: NextRequest) => {
  try {
    const auth = await isAuthRequired(req);
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Not authenticated" },
        { status: 401 }
      );
    }

    const query = await getQuery(req);
    const page = Math.max(1, parseInt(query.page || "1", 10) || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(query.pageSize || "10", 10) || 10)
    );

    const client = new Types.ObjectId(config.client);
    const filter = {
      client,
      user: new Types.ObjectId(auth.user.id),
    };

    const [items, total] = await Promise.all([
      CheckInModel.find(filter)
        .sort({ checkin: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .populate("user", "name mobileNumber uniqueCode email feesPaid")
        .lean(),
      CheckInModel.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: items.map((item) => serializeCheckIn(item)),
        total,
        page,
        pageSize,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load your check-ins";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
};

function serializePerson(doc: {
  _id: Types.ObjectId;
  name?: string;
  mobileNumber?: string;
  email?: string;
  uniqueCode?: string;
  isActive?: boolean;
  feesPaid?: boolean | number;
  batch?: {
    _id?: Types.ObjectId;
    name?: string;
    sport?: string;
    startTime?: string;
    endTime?: string;
  } | Types.ObjectId | null;
}) {
  const batch =
    doc.batch && typeof doc.batch === "object" && "name" in doc.batch
      ? {
          id: String(doc.batch._id),
          name: doc.batch.name,
          sport: doc.batch.sport,
          startTime: doc.batch.startTime || "",
          endTime: doc.batch.endTime || "",
        }
      : null;

  return {
    id: doc._id,
    name: doc.name || "",
    mobileNumber: doc.mobileNumber || "",
    email: doc.email || "",
    uniqueCode: doc.uniqueCode || "",
    isActive: doc.isActive !== false,
    feesPaid: isFeesPaid(doc.feesPaid),
    batch,
  };
}

export const listPeople = async (req: NextRequest) => {
  try {
    const auth = await isAuthRequired(req);
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

    const query = await getQuery(req);
    const search = String(query.search || "").trim();
    const batchId = String(query.batch || "").trim();
    const activeFilter = String(query.isActive || "").trim();
    const page = Math.max(1, parseInt(query.page || "1", 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(query.pageSize || "20", 10) || 20)
    );

    const client = new Types.ObjectId(config.client);
    const filter: Record<string, unknown> = {
      client,
      role: "user",
      isArchived: { $ne: true },
    };

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = { $regex: escaped, $options: "i" };
      filter.$or = [
        { name: regex },
        { mobileNumber: regex },
        { uniqueCode: regex },
        { email: regex },
      ];
    }

    if (batchId && Types.ObjectId.isValid(batchId)) {
      filter.batch = new Types.ObjectId(batchId);
    }

    if (activeFilter === "true") filter.isActive = true;
    if (activeFilter === "false") filter.isActive = false;

    const [items, total] = await Promise.all([
      UserModel.find(filter)
        .sort({ name: 1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .populate("batch", "name sport startTime endTime")
        .select("name mobileNumber email uniqueCode isActive feesPaid batch")
        .lean(),
      UserModel.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: items.map((item) => serializePerson(item)),
        total,
        page,
        pageSize,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load people";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
};

export const updatePerson = async (req: NextRequest, id: string) => {
  try {
    const auth = await isAuthRequired(req);
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

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid user id" },
        { status: 400 }
      );
    }

    const client = new Types.ObjectId(config.client);
    const person = await UserModel.findOne({
      _id: id,
      client,
      role: "user",
      isArchived: { $ne: true },
    });

    if (!person) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const body = await getBody(req);

    if (typeof body.isActive === "boolean") {
      person.isActive = body.isActive;
      person.feesPaid = body.isActive;
      if (!body.isActive) {
        await UserTokenModel.updateMany(
          { user: person._id },
          { $set: { expiresAt: new Date() } }
        );
      }
    }

    if (body.batchId !== undefined) {
      const batchId = String(body.batchId || "").trim();
      if (!Types.ObjectId.isValid(batchId)) {
        return NextResponse.json(
          { success: false, error: "Invalid batch id" },
          { status: 400 }
        );
      }

      const batch = await BatchModel.findOne({
        _id: batchId,
        client,
        isArchived: { $ne: true },
      });

      if (!batch) {
        return NextResponse.json(
          { success: false, error: "Batch not found" },
          { status: 404 }
        );
      }

      person.batch = batch._id;
    }

    await person.save();
    await person.populate("batch", "name sport startTime endTime");

    return NextResponse.json({
      success: true,
      message: "User updated",
      data: serializePerson(person),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update user";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
};

export const getDashboardStats = async (req: NextRequest) => {
  try {
    const auth = await isAuthRequired(req);
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

    const client = new Types.ObjectId(config.client);
    const startOfToday = dayjs().startOf("day").toDate();
    const peopleFilter = {
      client,
      role: "user",
      isArchived: { $ne: true },
    };

    const [checkIns, todayCheckIns, entries, people, batches, batchCounts] =
      await Promise.all([
        CheckInModel.countDocuments({ client }),
        CheckInModel.countDocuments({
          client,
          checkin: { $gte: startOfToday },
        }),
        EntryFormModel.countDocuments({ client }),
        UserModel.countDocuments(peopleFilter),
        BatchModel.find({ client, isArchived: { $ne: true } })
          .sort({ sortOrder: 1, name: 1 })
          .lean(),
        UserModel.aggregate([
          {
            $match: {
              ...peopleFilter,
              batch: { $type: "objectId" },
            },
          },
          { $group: { _id: "$batch", count: { $sum: 1 } } },
        ]),
      ]);

    const countMap = new Map(
      batchCounts.map((row: { _id: Types.ObjectId; count: number }) => [
        String(row._id),
        row.count,
      ])
    );

    const batchSplit = batches.map((batch) => ({
      id: String(batch._id),
      name: batch.name,
      sport: batch.sport,
      count: countMap.get(String(batch._id)) || 0,
    }));

    const assigned = batchSplit.reduce((sum, batch) => sum + batch.count, 0);

    return NextResponse.json({
      success: true,
      data: {
        checkIns,
        todayCheckIns,
        entries,
        people,
        unassigned: Math.max(0, people - assigned),
        batches: batchSplit,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load dashboard";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
};
