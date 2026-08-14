import { NextRequest } from "next/server";
import {
  createEntryForm,
  getEntryForm,
  listEntryForms,
} from "./entry-form.controller";
import { notFound } from "../utils/request";

export default function entryFormRoutes(req: NextRequest, path: string) {
  const rest = path.replace(/^entry-form\/?/, "").replace(/\/$/, "");

  if (!rest && req.method === "POST") {
    return createEntryForm(req);
  }

  if (!rest && req.method === "GET") {
    return listEntryForms(req);
  }

  if (rest && req.method === "GET") {
    return getEntryForm(req, rest);
  }

  return notFound();
}
