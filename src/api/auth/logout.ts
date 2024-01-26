import type { Env } from "@/env";
import { createSessionCookie, invalidateSession } from "@/helper/auth";
import { Hono } from "hono";
import { setCookie } from "hono/cookie";

export const logoutRouter = new Hono<Env>().get("/", async (c) => {
  const session = c.get("session");
  const db = c.get("db");
  if (!session) {
    return c.redirect("/");
  }
  await invalidateSession(db, session.id);
  const cookie = createSessionCookie(null, {
    secure: c.env.ENV !== "DEV",
  });
  setCookie(c, cookie.name, cookie.value, cookie.options);
  return c.redirect("/");
});
