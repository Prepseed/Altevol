import createBaseApi from "./base";

export type EntryFormPayload = {
  name: string;
  mobileNumber: string;
  email: string;
  howDidYouKnowAboutUs:
    | "google"
    | "instagram"
    | "facebook"
    | "youtube"
    | "friend_family"
    | "hoarding"
    | "website"
    | "walk_in"
    | "other";
  howDidYouKnowOther?: string;
  visitedBefore: boolean;
  knownPersonHere: boolean;
  knownPersonName?: string;
  sport: "cricket" | "tennis";
  playerLevel?: "beginner" | "intermediate" | "competitive";
  age?: number;
  preferredVisitDate?: string;
  message?: string;
};

export type EntryFormRecord = {
  id: string;
  name: string;
  mobileNumber: string;
  email: string;
  howDidYouKnowAboutUs: string;
  howDidYouKnowOther: string;
  visitedBefore: boolean;
  knownPersonHere: boolean;
  knownPersonName: string;
  sport: string;
  playerLevel: string;
  age: number | null;
  preferredVisitDate: string | null;
  message: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export type EntryFormListQuery = {
  search?: string;
  sport?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

const api = createBaseApi("/api/entry-form");

const entryFormApi = {
  submit: (payload: EntryFormPayload) =>
    api
      .post("/", payload)
      .then((res) => res.data)
      .catch((error) => {
        return (
          error.formattedError ||
          error.response?.data || {
            success: false,
            error: error.message || "Failed to submit entry form",
          }
        );
      }),

  list: (params: EntryFormListQuery = {}) =>
    api
      .get("/", { params })
      .then((res) => res.data)
      .catch((error) => {
        return (
          error.formattedError ||
          error.response?.data || {
            success: false,
            error: error.message || "Failed to load entry forms",
          }
        );
      }),

  getById: (id: string) =>
    api
      .get(`/${id}`)
      .then((res) => res.data)
      .catch((error) => {
        return (
          error.formattedError ||
          error.response?.data || {
            success: false,
            error: error.message || "Failed to load entry form",
          }
        );
      }),
};

export default entryFormApi;
