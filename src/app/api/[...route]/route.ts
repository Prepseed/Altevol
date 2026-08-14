import { getIp, getUserAgent } from "@/apis/utils/request";
import { NextRequest, NextResponse } from "next/server";
import usersRoutes from "@/apis/users/users.routes";
import entryFormRoutes from "@/apis/entry-form/entry-form.routes";
import batchesRoutes from "@/apis/batches/batches.routes";
import { connectToDb } from "@/config/db";
import mongoose from "mongoose";

const corsHeaders = {
  "Access-Control-Allow-Origin":
    process.env.NODE_ENV === "development" ? "*" : process.env.BASE_URL || "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Allow-Credentials": "true",
};

async function HealthCheck(req: NextRequest) {
  const { browser, os, ua } = getUserAgent(req);
  return NextResponse.json({
    success: true,
    msg: "Health check!",
    ip: getIp(req),
    userAgent: ua,
    browser: `${browser.name} | ${browser.version}`,
    os: `${os.name} | ${os.version}`,
    db: mongoose.connection.db?.databaseName || "not connected",
  });
}

async function allMethods(
  req: NextRequest,
  { params }: { params: Promise<{ route: string[] }> }
) {
  try {
    await connectToDb();
    const path = (await params).route.join("/");

    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 200, headers: corsHeaders });
    }

    let response: NextResponse;
    if (path === "health-check") {
      response = await HealthCheck(req);
    } else if (path.startsWith("users")) {
      response = await usersRoutes(req, path);
    } else if (path.startsWith("entry-form")) {
      response = await entryFormRoutes(req, path);
    } else if (path.startsWith("batches")) {
      response = await batchesRoutes(req, path);
    } else {
      response = NextResponse.json(
        { success: false, msg: "Route not found", path },
        { status: 404 }
      );
    }

    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export const GET = allMethods;
export const POST = allMethods;
export const PUT = allMethods;
export const PATCH = allMethods;
export const DELETE = allMethods;
export const OPTIONS = allMethods;
