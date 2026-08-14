import mongoose from "mongoose";
import config from "./config";

if (!config.mongoUrl) {
  throw new Error("MONGO_URL not found!");
}

const globalForMongoose = globalThis as typeof globalThis & {
  mongoose?: { conn: typeof mongoose.connection | null; promise: Promise<typeof mongoose.connection> | null };
};

let cached = globalForMongoose.mongoose;

if (!cached) {
  cached = globalForMongoose.mongoose = { conn: null, promise: null };
}

export async function connectToDb() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(config.mongoUrl, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
      })
      .then(() => mongoose.connection);
  }

  try {
    cached.conn = await cached.promise;
  } catch {
    cached.promise = null;
    throw new Error("Error while connecting database!");
  }

  return cached.conn;
}
