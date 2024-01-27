import type { Context } from "hono";
import type { Cookie } from "lucia";

export const setLuciaCookie = (c: Context, cookie: Cookie) => {
  c.header("Set-Cookie", cookie.serialize(), { append: true });
};
