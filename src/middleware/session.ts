import type { Env } from "@/env";
import { setLuciaCookie } from "@/helper/auth";
import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";

export const sessionMiddleware = () =>
  createMiddleware(async (c: Context<Env>, next) => {
    const lucia = c.get("lucia");
    const sessionId = getCookie(c, lucia.sessionCookieName);
    if (!sessionId) {
      c.set("session", null);
    } else {
      const { session, user } = await lucia.validateSession(sessionId);
      if (session?.fresh) {
        setLuciaCookie(c, lucia.createSessionCookie(session.id));
      }
      if (!session) {
        setLuciaCookie(c, lucia.createBlankSessionCookie());
      }
      c.set("session", session);
      c.set("user", user);
    }
    await next();
  });
