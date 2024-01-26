import * as schema from "@/db/schema";
import type { Env } from "@/env";
import { renderer } from "@/renderer";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { apiRouter } from "./api";
import { buttonVariants } from "./components/ui/button";
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
    <div class="min-h-dvh grid place-items-center max-w-5xl px-4 md:px-6 lg:px-8 mx-auto">
      <div class="flex flex-col gap-4">
        <div class="flex gap-2 items-center h-10">
          <img
            src={session.user.picture}
            alt={session.user.name}
            class="aspect-square h-full rounded-full"
          />
          <div>
            <p class="text-md">{session.user.name}</p>
            <p class="text-sm text-muted-foreground">{session.user.email}</p>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <p class="text-md">Linked Accounts</p>
          {linkedAccounts?.discord.length === 0 ? (
            <p class="text-sm text-muted-foreground">No linked accounts...</p>
          ) : (
            <ul>
              {linkedAccounts?.discord.map((account) => (
                <li class="flex items-center h-10 gap-2 p-2 bg-muted rounded-md">
                  <img
                    src={`https://cdn.discordapp.com/avatars/${account.id}/${account.avatar}.png`}
                    alt={account.username}
                    class="aspect-square h-full rounded-full"
                  />
                  <p class="mr-auto">{account.username}</p>
                  <a href={`/api/auth/discord/unlink?discord-id=${account.id}`} class="p-1">
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
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <a href="/api/auth/logout" class={buttonVariants()}>
          Logout
        </a>
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
        <a href={`/api/auth/google/login?${query}`} class={buttonVariants()}>
          Login with Google
        </a>
      </div>
    </div>,
  );
});

app.get("/linked-role", authMiddleware({ redirect: true }), async (c) => {
  const session = c.get("session");
  if (!session) return c.redirect("/login");
  return c.render(
    <div class="min-h-dvh grid place-items-center max-w-5xl px-4 md:px-6 lg:px-8 mx-auto">
      <div class="flex flex-col gap-6 items-center">
        <h1 class="text-4xl font-bold">Link Account</h1>
        <div class="flex flex-col items-center">
          <img
            src={session.user.picture}
            alt={session.user.name}
            class="aspect-square h-20 rounded-full mb-2"
          />
          <p class="text font-bold">{session.user.name}</p>
          <p class="text-sm text-muted-foreground">{session.user.email}</p>
        </div>
        <div class="flex flex-col w-full gap-1">
          <a href="/api/auth/discord/login" class={buttonVariants()}>
            Link Discord Account
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
