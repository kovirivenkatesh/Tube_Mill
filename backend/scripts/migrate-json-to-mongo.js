/**
 * One-time import from backend/data/files/*.json into MongoDB (if files exist).
 * Run: node scripts/migrate-json-to-mongo.js
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { connectDatabase } from "../db/connect.js";
import { User } from "../models/User.js";
import { Submission } from "../models/Submission.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filesDir = path.join(__dirname, "..", "data", "files");

function readJson(name) {
  const fp = path.join(filesDir, `${name}.json`);
  if (!fs.existsSync(fp)) return [];
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

async function migrate() {
  await connectDatabase();

  const users = readJson("users");
  const submissions = readJson("submissions");

  if (users.length) {
    for (const u of users) {
      await User.updateOne({ id: u.id }, { $set: u }, { upsert: true });
    }
    console.log(`Imported ${users.length} users`);
  } else {
    console.log("No users.json to import");
  }

  if (submissions.length) {
    for (const s of submissions) {
      await Submission.updateOne({ id: s.id }, { $set: s }, { upsert: true });
    }
    console.log(`Imported ${submissions.length} submissions`);
  } else {
    console.log("No submissions.json to import");
  }

  process.exit(0);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
