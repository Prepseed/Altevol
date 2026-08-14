import createBaseApi from "./base";

type ApiError = {
  formattedError?: { success: false; error: string };
  response?: { data?: { success?: boolean; error?: string } };
  message?: string;
};

function fallback(error: ApiError, message: string) {
  return (
    error.formattedError ||
    error.response?.data || {
      success: false,
      error: error.message || message,
    }
  );
}

export type BatchRecord = {
  id: string;
  name: string;
  sport: string;
  startTime?: string;
  endTime?: string;
  sortOrder?: number;
  userCount?: number;
};

type BatchPayload = {
  name: string;
  sport: "cricket" | "tennis";
  startTime: string;
  endTime: string;
};

const api = createBaseApi("/api/batches");

const batchesApi = {
  list: () =>
    api
      .get("")
      .then((res) => res.data)
      .catch((error) => fallback(error, "Failed to load batches")),
  create: (payload: BatchPayload) =>
    api
      .post("/", payload)
      .then((res) => res.data)
      .catch((error) => fallback(error, "Failed to create batch")),
  update: (id: string, payload: Partial<BatchPayload>) =>
    api
      .patch(`/${id}`, payload)
      .then((res) => res.data)
      .catch((error) => fallback(error, "Failed to update batch")),
  remove: (id: string) =>
    api
      .delete(`/${id}`)
      .then((res) => res.data)
      .catch((error) => fallback(error, "Failed to delete batch")),
};

export default batchesApi;
