import { NextRequest } from "next/server";
import {
  createBatch,
  deleteBatch,
  listBatches,
  updateBatch,
} from "./batches.controller";
import { notFound } from "../utils/request";

export default function batchesRoutes(req: NextRequest, path: string) {
  const rest = path.replace(/^batches\/?/, "").replace(/\/$/, "");

  if (!rest && req.method === "GET") {
    return listBatches(req);
  }

  if (!rest && req.method === "POST") {
    return createBatch(req);
  }

  if (rest && req.method === "PATCH") {
    return updateBatch(req, rest);
  }

  if (rest && req.method === "DELETE") {
    return deleteBatch(req, rest);
  }

  return notFound();
}
