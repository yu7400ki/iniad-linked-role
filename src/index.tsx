import type { Env } from "@/env";
import { renderer } from "@/renderer";
import { Hono } from "hono";

const app = new Hono<Env>();

app.get("*", renderer);

app.get("/", (c) => {
  return c.render(<h1>Hello!</h1>);
});

export default app;
