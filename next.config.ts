import type { NextConfig } from "next";

const serverOnlyPackages = ["mongoose", "bcrypt", "jsonwebtoken"];

const nextConfig: NextConfig = {
  env: {
    MONGO_URL: process.env.MONGO_URL,
    MONGO_MAIN_DB: process.env.MONGO_MAIN_DB,
    COOKIE_HOST_NAME: process.env.COOKIE_HOST_NAME,
    BASE_URL: process.env.BASE_URL,
  },
  serverExternalPackages: serverOnlyPackages,
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
