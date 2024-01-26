import { Hono } from "hono";
import { googleRouter } from "./google";
import { logoutRouter } from "./logout";

export const authRouter = new Hono().route("/google", googleRouter).route("/logout", logoutRouter);
