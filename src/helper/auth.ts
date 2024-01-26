import crypto from "crypto";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { CookieOptions } from "hono/utils/cookie";

export const createSession = async (db: DrizzleD1Database<typeof schema>, userId: string) => {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  const session = await db
    .insert(schema.session)
    .values({
      id: sessionId,
      expiresAt,
      userId,
    })
    .returning();
  if (session.length === 0) {
    throw new Error("Failed to create session");
  }
  return session[0];
};

export const createSessionCookie = (session: Session | null, opt?: CookieOptions): Cookie => {
  return {
    name: "session",
    value: session?.id ?? "",
    options: {
      secure: true,
      path: "/",
      httpOnly: true,
      expires: session?.expiresAt ?? new Date(0),
      ...opt,
    },
  };
};

export const validateSession = async (
  db: DrizzleD1Database<typeof schema>,
  sessionId: string,
): Promise<(Session & { user: User }) | null> => {
  const session = await db.query.session.findFirst({
    with: {
      user: true,
    },
    where: eq(schema.session.id, sessionId),
  });
  if (!session) {
    return null;
  }
  if (session.expiresAt.getTime() < Date.now()) {
    await invalidateSession(db, sessionId);
    return null;
  }
  return session;
};

export const invalidateSession = async (
  db: DrizzleD1Database<typeof schema>,
  sessionId: string,
) => {
  await db.delete(schema.session).where(eq(schema.session.id, sessionId));
};

export type User = typeof schema.user.$inferSelect;
export type Session = typeof schema.session.$inferSelect;
export type Cookie = {
  name: string;
  value: string;
  options: CookieOptions;
};
