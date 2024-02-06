import * as schema from "@/db/schema";
import { session as sessionTable, user as userTable } from "@/db/schema";
import type { Env } from "@/env";
import { renderer } from "@/renderer";
import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { csrf } from "hono/csrf";
import { twMerge } from "tailwind-merge";
import { apiRouter } from "./api";
import { buttonVariants } from "./components/ui/button";
import { getLinkedAccounts } from "./helper/discord";
import { createLucia } from "./lib/auth";
import { authMiddleware } from "./middleware/auth";
import { sessionMiddleware } from "./middleware/session";

const app = new Hono<Env>();

app.get("*", renderer);
app.use("*", async (c, next) => {
  const db = drizzle(c.env.DB, { schema });
  c.set("db", db);
  await next();
});
app.use("*", async (c, next) => {
  const db = drizzle(c.env.DB);
  const adapter = new DrizzleSQLiteAdapter(db, sessionTable, userTable);
  const lucia = createLucia(adapter, c.env.ENV !== "production");
  c.set("lucia", lucia);
  await next();
});
app.use("*", csrf());
app.use("*", sessionMiddleware());

app.route("/api", apiRouter);

app.get("/", authMiddleware(), async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  if (!user) return c.redirect("/login");
  const linkedAccounts = await getLinkedAccounts(db, user.id);
  return c.render(
    <div class="min-h-dvh grid place-items-center max-w-5xl px-4 md:px-6 lg:px-8 mx-auto">
      <div class="flex flex-col gap-4">
        <div class="flex gap-2 items-center h-10">
          <img src={user.picture} alt={user.name} class="aspect-square h-full rounded-full" />
          <div>
            <p class="text-md">{user.name}</p>
            <p class="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <form method="POST" action="/api/auth/discord/unlink" class="flex flex-col gap-2">
          <p class="text-md">Linked Accounts</p>
          {linkedAccounts?.discord.length === 0 ? (
            <p class="text-sm text-muted-foreground">No linked accounts...</p>
          ) : (
            <ul>
              {linkedAccounts?.discord.map((account) => (
                <li class="flex items-center gap-2 h-10 p-2 bg-muted rounded-md">
                  <img
                    src={`https://cdn.discordapp.com/avatars/${account.id}/${account.avatar}.png`}
                    alt={account.username}
                    class="aspect-square h-full rounded-full"
                  />
                  <p class="mr-auto">{account.username}</p>
                  <button type="submit" class="p-1" name="id" value={account.id}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="icon icon-tabler icon-tabler-x"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      stroke-width="2"
                      stroke="currentColor"
                      fill="none"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <title>unlink</title>
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M18 6l-12 12" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>
        <form method="POST" action="/api/auth/logout" class="flex">
          <button type="submit" class={twMerge(buttonVariants(), "flex-1")}>
            Logout
          </button>
        </form>
      </div>
    </div>,
  );
});

app.get("/login", (c) => {
  const query = new URL(c.req.url).searchParams;
  return c.render(
    <div class="min-h-dvh grid place-items-center max-w-5xl px-4 md:px-6 lg:px-8 mx-auto">
      <div class="flex flex-col gap-6">
        <h1 class="text-4xl font-bold">INIAD Linked Role</h1>
        <a href={`/api/auth/google?${query.toString()}`} class={buttonVariants()}>
          Login with Google
        </a>
      </div>
    </div>,
  );
});

app.get("/linked-role", authMiddleware({ redirect: true }), async (c) => {
  const user = c.get("user");
  if (!user) return c.redirect("/login");
  return c.render(
    <div class="min-h-dvh grid place-items-center max-w-5xl px-4 md:px-6 lg:px-8 mx-auto">
      <div class="flex flex-col gap-6 items-center">
        <h1 class="text-4xl font-bold">Link Account</h1>
        <div class="flex flex-col items-center">
          <img src={user.picture} alt={user.name} class="aspect-square h-20 rounded-full mb-2" />
          <p class="text font-bold">{user.name}</p>
          <p class="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div class="flex flex-col w-full gap-1">
          <a href="/api/auth/discord" class={buttonVariants()}>
            Link Discord Role
          </a>
          <a href="/" class={buttonVariants({ variant: "outline" })}>
            Cancel
          </a>
        </div>
      </div>
    </div>,
  );
});

export default app;
