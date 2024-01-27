import type { Env } from "@/env";
import {
  getAccessToken,
  getAuthorizationUrl,
  linkAccount,
  unlinkAccount,
  updateMetadata,
  validationCallback,
} from "@/helper/discord";
import { authMiddleware } from "@/middleware/auth";
import { Discord, OAuth2RequestError } from "arctic";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { createFactory } from "hono/factory";

const factory = createFactory<
  Env & {
    Variables: {
      discord: Discord;
      session: NonNullable<Env["Variables"]["session"]>;
      user: NonNullable<Env["Variables"]["user"]>;
    };
  }
>();

const middleware = factory.createMiddleware(async (c, next) => {
  const discord = new Discord(
    c.env.DISCORD_CLIENT_ID,
    c.env.DISCORD_CLIENT_SECRET,
    c.env.DISCORD_REDIRECT_URI,
  );
  c.set("discord", discord);
  await next();
});

const login = factory.createHandlers(authMiddleware({ redirect: true }), middleware, async (c) => {
  const discord = c.get("discord");
  const [url, state] = await getAuthorizationUrl(discord);
  setCookie(c, "discord-state", state, {
    secure: c.env.ENV !== "DEV",
    path: "/",
    httpOnly: true,
    maxAge: 60 * 10,
  });
  return c.redirect(url.toString());
});

const callback = factory.createHandlers(authMiddleware(), middleware, async (c) => {
  const discord = c.get("discord");
  const db = c.get("db");
  const user = c.get("user");
  const code = c.req.query("code");
  const state = c.req.query("state");
  const storedState = getCookie(c, "discord-state");
  if (!code || !state || !storedState || state !== storedState) {
    return c.json({ error: "invalid request" }, 400);
  }
  try {
    const { user: discordUser, tokens } = await validationCallback(discord, code);
    const linkedAccount = await linkAccount(db, user.id, discordUser, tokens);
    if (linkedAccount) {
      await updateMetadata(c.env.DISCORD_CLIENT_ID, linkedAccount.accessToken, user, {
        linked: true,
      });
    } else {
      return c.json({ error: "failed to link account" }, 500);
    }
    return c.redirect("/");
  } catch (err) {
    if (err instanceof OAuth2RequestError) {
      const { message, description } = err;
      return c.json({ error: message, description }, 400);
    }
    console.error(err);
    return c.text("Internal Server Error", 500);
  }
});

const unlink = factory.createHandlers(authMiddleware(), middleware, async (c) => {
  const data = await c.req.parseBody();
  const db = c.get("db");
  const user = c.get("user");
  const discord = c.get("discord");
  const discordId = data.id;
  if (!discordId || typeof discordId !== "string") {
    return c.json({ error: "invalid request" }, 400);
  }
  const accessToken = await getAccessToken(db, discord, discordId);
  if (!accessToken) {
    return c.json({ error: "invalid request" }, 400);
  }
  await updateMetadata(c.env.DISCORD_CLIENT_ID, accessToken, user, {
    linked: false,
  });
  await unlinkAccount(db, discordId);
  return c.redirect("/");
});

export const discordRouter = new Hono()
  .post("/login", ...login)
  .get("/callback", ...callback)
  .post("/unlink", ...unlink);
