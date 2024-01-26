import { Hono } from "hono";
import { authRouter } from "./auth";

export const apiRouter = new Hono().route("/auth", authRouter);
