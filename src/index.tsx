import * as schema from "@/db/schema";
import type { Env } from "@/env";
import { renderer } from "@/renderer";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { apiRouter } from "./api";
import { getLinkedAccounts } from "./helper/discord";
import { authMiddleware } from "./middleware/auth";
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

app.get("/", authMiddleware(), async (c) => {
  const db = c.get("db");
  const session = c.get("session");
  if (!session) return c.redirect("/login");
  const linkedAccounts = await getLinkedAccounts(db, session.user.id);
  return c.render(
    <div>
      <h1>Hello! {session.user.givenName}</h1>
      <h2>Linked Discord Accounts</h2>
      <li>
        {linkedAccounts?.discord.map((account) => {
          return <ul>{account.username}</ul>;
        })}
      </li>
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

app.get("/linked-role", authMiddleware({ redirect: true }), async (c) => {
  const session = c.get("session");
  if (!session) return c.redirect("/login");
  return c.render(
    <div>
      <h1>Linked Role</h1>
      <p>
        Logged in as {session.user.givenName} ({session.user.email})
      </p>
      <a href="/api/auth/discord/login">Link Discord Account</a>
    </div>,
  );
});

export default app;
