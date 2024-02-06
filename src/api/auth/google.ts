import type { Env } from "@/env";
import { setLuciaCookie } from "@/helper/auth";
import { getAuthorizationUrl, saveUser, validationCallback } from "@/helper/google";
import { Google, OAuth2RequestError } from "arctic";
import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import type { CookieOptions } from "hono/utils/cookie";

const middleware = createMiddleware<
  Env & {
    Variables: {
      google: Google;
    };
  }
>(async (c, next) => {
  const google = new Google(
    c.env.GOOGLE_CLIENT_ID,
    c.env.GOOGLE_CLIENT_SECRET,
    c.env.GOOGLE_REDIRECT_URI,
  );
  c.set("google", google);
  await next();
});

export const googleRouter = new Hono<Env>()
  .get("/", middleware, async (c) => {
    const redirect = c.req.query("redirect");
    const user = c.get("session");
    if (user) return c.redirect(redirect || "/");
    const google = c.get("google");
    const [url, state, codeVerifier] = await getAuthorizationUrl(google);
    const opt: CookieOptions = {
      secure: c.env.ENV !== "DEV",
      path: "/",
      httpOnly: true,
      maxAge: 60 * 10,
    };
    setCookie(c, "state", state, opt);
    setCookie(c, "code_verifier", codeVerifier, opt);
    setCookie(c, "redirect", redirect || "/", opt);
    url.searchParams.append("hd", "iniad.org");
    return c.redirect(url.toString());
  })

  .get("/callback", middleware, async (c) => {
    const google = c.get("google");
    const db = c.get("db");
    const code = c.req.query("code");
    const state = c.req.query("state");
    const lucia = c.get("lucia");
    const storedState = getCookie(c, "state");
    const storedCodeVerifier = getCookie(c, "code_verifier");
    const redirect = getCookie(c, "redirect");
    if (!code || !state || !storedState || !storedCodeVerifier || state !== storedState) {
      return c.json({ error: "invalid request" }, 400);
    }
    try {
      const { user } = await validationCallback(google, code, storedCodeVerifier);
      if (!user.email_verified || user.hd !== "iniad.org") {
        return c.text("Forbidden", 403);
      }
      const savedUser = await saveUser(db, user);
      const session = await lucia.createSession(savedUser.id, {
        email: savedUser.email,
        name: savedUser.name,
        familyName: savedUser.familyName,
        givenName: savedUser.givenName,
        picture: savedUser.picture,
      });
      const cookie = lucia.createSessionCookie(session.id);
      setLuciaCookie(c, cookie);
      return c.redirect(redirect || "/");
    } catch (err) {
      if (err instanceof OAuth2RequestError) {
        const { message, description } = err;
        return c.json({ error: message, description }, 400);
      }
      console.error(err);
      return c.text("Internal Server Error", 500);
    }
  });
