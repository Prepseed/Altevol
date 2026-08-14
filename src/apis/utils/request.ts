import { NextRequest, NextResponse } from "next/server";
import { JwtPayload, verify } from "jsonwebtoken";
import config from "@/config/config";
import UserModel from "../users/models/user.model";
import UserTokenModel from "../users/models/usertoken.model";
import { UAParser } from "ua-parser-js";

export async function getBody(req: NextRequest) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

export async function getQuery(req: NextRequest) {
  const url = req.nextUrl || new URL(req.url);
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });
  return query;
}

export async function getAuthCookie(req: NextRequest): Promise<string | null> {
  return req.cookies.get("auth")?.value || null;
}

export async function getTokenFromHeaders(
  req: NextRequest
): Promise<string | null> {
  const token = req.headers.get("authorization");
  const parts = token?.split(" ");
  if (
    parts?.[0] &&
    (parts[0].toLowerCase() === "bearer" || parts[0].toLowerCase() === "token")
  ) {
    return parts[1] || null;
  }
  return null;
}

export async function getAuthToken(req: NextRequest): Promise<string | null> {
  return (await getAuthCookie(req)) || (await getTokenFromHeaders(req));
}

export function setCookie(
  response: NextResponse,
  name: string,
  value: string
): void {
  const cookieOptions: {
    name: string;
    value: string;
    expires: Date;
    path: string;
    secure: boolean;
    httpOnly: boolean;
    sameSite: "lax";
    domain?: string;
  } = {
    name,
    value,
    expires: config.cookie.expires,
    path: "/",
    secure: config.cookie.secure,
    httpOnly: config.cookie.httpOnly,
    sameSite: "lax",
  };

  if (
    config.cookie.domain &&
    config.cookie.domain.trim() !== "" &&
    process.env.NODE_ENV === "production"
  ) {
    cookieOptions.domain = config.cookie.domain;
  }

  response.cookies.set(cookieOptions);
}

export function removeCookie(response: NextResponse, name: string): void {
  response.cookies.set({
    name,
    value: "",
    expires: new Date(0),
    path: "/",
    secure: config.cookie.secure,
    httpOnly: config.cookie.httpOnly,
    sameSite: "lax",
  });
}

export async function isAuthRequired(req: NextRequest): Promise<{
  success: boolean;
  user?: { id: string; role: string };
  error?: string;
}> {
  try {
    const token = await getAuthToken(req);
    if (!token) {
      return { success: false, error: "No authentication token provided" };
    }

    let decoded: JwtPayload;
    try {
      decoded = verify(token, config.jwtSecret) as JwtPayload;
    } catch {
      return { success: false, error: "Invalid or expired token" };
    }

    const userToken = await UserTokenModel.findOne({
      token,
      expiresAt: { $gt: new Date() },
      user: decoded.id,
    });

    if (!userToken) {
      return { success: false, error: "Token not found or expired" };
    }

    const user = await UserModel.findById(decoded.id);
    if (!user || !user.isActive || user.isArchived) {
      return { success: false, error: "User not found or inactive" };
    }

    return {
      success: true,
      user: {
        id: user._id.toString(),
        role: user.role,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    return { success: false, error: message };
  }
}

export function getIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIp) return realIp;
  return "unknown";
}

export function getUserAgent(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  const parser = new UAParser(ua);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  return {
    ua,
    browser: {
      name: browser.name || "Unknown",
      version: browser.version || "Unknown",
    },
    os: {
      name: os.name || "Unknown",
      version: os.version || "Unknown",
    },
  };
}

export function notFound() {
  return NextResponse.json(
    { success: false, error: "Route not found" },
    { status: 404 }
  );
}
