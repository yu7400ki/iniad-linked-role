import * as schema from "@/db/schema";
import type { Env } from "@/env";
import { renderer } from "@/renderer";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { apiRouter } from "./api";
import { sessionMiddleware } from "./middleware/session";

const app = new Hono<Env>();

app.get("*", renderer);
app.get("*", async (c, next) => {
  const db = drizzle(c.env.DB, { schema });
  c.set("db", db);
  await next();
});
app.get("*", sessionMiddleware());

app.route("/api", apiRouter);

app.get("/", (c) => {
  const session = c.get("session");
  if (!session) {
    return c.redirect("/login");
  }
  return c.render(
    <div>
      <h1>Hello! {session.user.givenName}</h1>
      <a href="/api/auth/logout">Logout</a>
    </div>,
  );
});

app.get("/login", (c) => {
  const query = new URL(c.req.url).searchParams;
  return c.render(
    <div>
      <h1>Login</h1>
      <a href={`/api/auth/google/login?${query}`}>Google</a>
    </div>,
  );
});

export default app;
