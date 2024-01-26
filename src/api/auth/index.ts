import { Hono } from "hono";
import { discordRouter } from "./discord";
import { googleRouter } from "./google";
import { logoutRouter } from "./logout";

export const authRouter = new Hono()
  .route("/google", googleRouter)
  .route("/discord", discordRouter)
  .route("/logout", logoutRouter);
