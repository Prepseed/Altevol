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

const api = createBaseApi("/api/users");

const usersApi = {
  getUserData: () =>
    api
      .get("/")
      .then((res) => res.data)
      .catch((error) => fallback(error, "Failed to get user data")),
  sendOTP: (mobileNumber: string) =>
    api
      .post("/otp/send", { mobileNumber })
      .then((res) => res.data)
      .catch((error) => fallback(error, "Failed to send OTP")),
  verifyOtp: (mobileNumber: string, otp: string) =>
    api
      .post("/otp/verify", { mobileNumber, otp })
      .then((res) => res.data)
      .catch((error) => fallback(error, "Failed to verify OTP")),
  resendOtp: (mobileNumber: string) =>
    api
      .post("/otp/resend", { mobileNumber })
      .then((res) => res.data)
      .catch((error) => fallback(error, "Failed to resend OTP")),
  logout: () =>
    api
      .post("/logout")
      .then((res) => res.data)
      .catch((error) => fallback(error, "Logout failed")),
  checkIn: (uniqueCode: string) =>
    api
      .post("/check-in", { uniqueCode })
      .then((res) => res.data)
      .catch((error) => fallback(error, "Failed to check in")),
  listCheckIns: (params: { search?: string; page?: number; pageSize?: number } = {}) =>
    api
      .get("/check-ins", { params })
      .then((res) => res.data)
      .catch((error) => fallback(error, "Failed to load check-ins")),
  listMyCheckIns: (params: { page?: number; pageSize?: number } = {}) =>
    api
      .get("/check-ins/me", { params })
      .then((res) => res.data)
      .catch((error) => fallback(error, "Failed to load check-ins")),
  listPeople: (
    params: {
      search?: string;
      batch?: string;
      isActive?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ) =>
    api
      .get("/people", { params })
      .then((res) => res.data)
      .catch((error) => fallback(error, "Failed to load people")),
  updatePerson: (
    id: string,
    payload: { isActive?: boolean; batchId?: string }
  ) =>
    api
      .patch(`/people/${id}`, payload)
      .then((res) => res.data)
      .catch((error) => fallback(error, "Failed to update user")),
  dashboardStats: () =>
    api
      .get("/dashboard")
      .then((res) => res.data)
      .catch((error) => fallback(error, "Failed to load dashboard")),
};

export default usersApi;
