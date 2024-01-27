import type * as schema from "@/db/schema";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { Register } from "lucia";
import type { Session, User } from "lucia";

export type Bindings = {
  DB: D1Database;
  ENV: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  DISCORD_REDIRECT_URI: string;
  DISCORD_TOKEN: string;
};

export type Variables = {
  db: DrizzleD1Database<typeof schema>;
  session: Session | null;
  user: User | null;
  lucia: Register["Lucia"];
};

export type Env = {
  Bindings: Bindings;
  Variables: Variables;
};
