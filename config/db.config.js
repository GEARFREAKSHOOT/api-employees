import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;

export async function connectDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { dbName: "classdb" });
  console.log("✅ Connected to in-memory MongoDB");
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}
