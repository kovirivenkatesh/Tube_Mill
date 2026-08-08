import mongoose from "mongoose";

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/tube-mill-app";
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("[mongodb] Connected:", mongoose.connection.name);
  const { seedAppConfigIfEmpty } = await import("./seedConfig.js");
  await seedAppConfigIfEmpty();
}
