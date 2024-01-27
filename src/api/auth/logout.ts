import type { Env } from "@/env";
import { setLuciaCookie } from "@/helper/auth";
import { Hono } from "hono";

export const logoutRouter = new Hono<Env>().get("/", async (c) => {
  const session = c.get("session");
  const lucia = c.get("lucia");
  if (!session) {
    return c.redirect("/");
  }
  await lucia.invalidateSession(session.id);
  const cookie = lucia.createBlankSessionCookie();
  setLuciaCookie(c, cookie);
  return c.redirect("/");
});
