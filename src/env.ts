import type * as schema from "@/db/schema";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { Session } from "./helper/auth";
import type { User } from "./helper/auth";

export type Bindings = {
  DB: D1Database;
  ENV: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
};

export type Variables = {
  db: DrizzleD1Database<typeof schema>;
  session: (Session & { user: User }) | null;
};

export type Env = {
  Bindings: Bindings;
  Variables: Variables;
};
