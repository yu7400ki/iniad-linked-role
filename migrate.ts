import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import config from "./drizzle.config";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const sqlite = new Database(config.dbCredentials.url);
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: config.out });

sqlite.close();
