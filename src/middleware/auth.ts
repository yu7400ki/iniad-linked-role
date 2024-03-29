import type { Env } from "@/env";
import { createMiddleware } from "hono/factory";

export const authMiddleware = ({
  redirect,
}: {
  redirect?: string | boolean;
} = {}) =>
  createMiddleware<{
    Variables: {
      session: NonNullable<Env["Variables"]["session"]>;
      user: NonNullable<Env["Variables"]["user"]>;
    };
  }>(async (c, next) => {
    const session = c.get("session");
    if (!session) {
      if (typeof redirect === "string") {
        const query = new URLSearchParams({ redirect }).toString();
        return c.redirect(`/login?${query}`);
      }
      if (redirect) {
        const query = new URLSearchParams({ redirect: c.req.url }).toString();
        return c.redirect(`/login?${query}`);
      }
      if (redirect === undefined) {
        return c.redirect("/login");
      }
      return c.json({ error: "unauthorized" }, 401);
    }
    await next();
  });
