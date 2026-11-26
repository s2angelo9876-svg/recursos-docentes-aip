import "dotenv/config";
import { createDatabase } from "../server/database.js";
import { defineModels } from "../server/models.js";
import { migrate } from "../server/migrations/index.js";

const db = createDatabase(process.env.DATABASE_URL, process.env.DATABASE_CA_CERT);
try {
  defineModels(db);
  await migrate(db);
} finally {
  await db.close();
}
