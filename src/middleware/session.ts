import type { Env } from "@/env";
import { validateSession } from "@/helper/auth";
import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";

export const sessionMiddleware = () =>
  createMiddleware(async (c: Context<Env>, next) => {
    const db = c.get("db");
    const sessionId = getCookie(c, "session");
    if (!sessionId) {
      c.set("session", null);
    } else {
      const sessionUser = await validateSession(db, sessionId);
      c.set("session", sessionUser ?? null);
    }
    await next();
  });
