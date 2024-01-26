import type { Env } from "@/env";
import {
  getAuthorizationUrl,
  linkAccount,
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

const callback = factory.createHandlers(
  authMiddleware({ redirect: true }),
  middleware,
  async (c) => {
    const discord = c.get("discord");
    const db = c.get("db");
    const session = c.get("session");
    const code = c.req.query("code");
    const state = c.req.query("state");
    const storedState = getCookie(c, "discord-state");
    if (!code || !state || !storedState || state !== storedState) {
      return c.json({ error: "invalid request" }, 400);
    }
    try {
      const { user, tokens } = await validationCallback(discord, code);
      const linkedAccount = await linkAccount(db, session.user.id, user, tokens);
      if (linkedAccount) {
        await updateMetadata(c.env.DISCORD_CLIENT_ID, linkedAccount.accessToken, session.user);
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
  },
);

export const discordRouter = new Hono().get("/login", ...login).get("/callback", ...callback);
