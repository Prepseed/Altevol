import dayjs from "dayjs";

(() => {
  if (
    process.env.NODE_ENV !== "development" &&
    process.env.NODE_ENV !== "production"
  ) {
    throw new Error("Invalid environment");
  }

  if (!process.env.MONGO_URL) throw new Error("MONGO_URL is not set");
  if (!process.env.MONGO_MAIN_DB) throw new Error("MONGO_MAIN_DB is not set");
  if (!process.env.BASE_URL) throw new Error("BASE_URL is not set");
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");
  if (!process.env.COOKIE_HOST_NAME) {
    throw new Error("COOKIE_HOST_NAME is not set");
  }
  if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is not set");
  if (!process.env.CLIENT) throw new Error("CLIENT is not set");

  if (!process.env.MASTER_OTP) process.env.MASTER_OTP = "655251";
  if (!process.env.DUMMY_OTP_NUMBERS) {
    process.env.DUMMY_OTP_NUMBERS = "9999990001,9999990002,9999990003,9999990004";
  }
})();

const config = {
  env: `${process.env.NODE_ENV}`,
  mongoUrl: `${process.env.MONGO_URL}/${process.env.MONGO_MAIN_DB}`,
  cookie: {
    expires: dayjs().add(60, "days").toDate(),
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    domain: process.env.COOKIE_HOST_NAME || "",
  },
  baseUrl: process.env.BASE_URL || "http://localhost:3000",
  jwtSecret: process.env.JWT_SECRET as string,
  cookieHostName: process.env.COOKIE_HOST_NAME as string,
  sessionSecret: process.env.SESSION_SECRET as string,
  masterOtp: process.env.MASTER_OTP as string,
  dummyOtpNumbers: process.env.DUMMY_OTP_NUMBERS
    ? process.env.DUMMY_OTP_NUMBERS.split(",").map((n) => n.trim())
    : ["9999990001", "9999990002", "9999990003", "9999990004"],
  client: process.env.CLIENT as string,
};

export default config;
