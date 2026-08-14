import { NextRequest } from "next/server";
import {
  getUserData,
  logout,
  sendOTP,
  verifyOtp,
  resendOtp,
  checkIn,
  listCheckIns,
  listMyCheckIns,
  getFamilyTree,
  getPersonFamilyTree,
  listPeople,
  updatePerson,
  getDashboardStats,
} from "./users.controller";
import { notFound } from "../utils/request";

export default function getUsersRoutes(req: NextRequest, path: string) {
  const route = path.replace("users", "");

  if (route === "" && req.method === "GET") {
    return getUserData(req);
  }

  if (route === "/logout" && req.method === "POST") {
    return logout(req);
  }

  if (route === "/otp/send" && req.method === "POST") {
    return sendOTP(req);
  }

  if (route === "/otp/verify" && req.method === "POST") {
    return verifyOtp(req);
  }

  if (route === "/otp/resend" && req.method === "POST") {
    return resendOtp(req);
  }

  if (route === "/check-in" && req.method === "POST") {
    return checkIn(req);
  }

  if (route === "/check-ins/me" && req.method === "GET") {
    return listMyCheckIns(req);
  }

  if (route === "/check-ins" && req.method === "GET") {
    return listCheckIns(req);
  }

  if (route === "/dashboard" && req.method === "GET") {
    return getDashboardStats(req);
  }

  if (route === "/family-tree" && req.method === "GET") {
    return getFamilyTree(req);
  }

  if (route === "/people" && req.method === "GET") {
    return listPeople(req);
  }

  const personTree = route.match(/^\/people\/([^/]+)\/family-tree$/);
  if (personTree && req.method === "GET") {
    return getPersonFamilyTree(req, personTree[1]);
  }

  if (route.startsWith("/people/") && req.method === "PATCH") {
    return updatePerson(req, route.replace("/people/", ""));
  }

  return notFound();
}
