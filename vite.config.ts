import build from "@hono/vite-cloudflare-pages";
import devServer from "@hono/vite-dev-server";
import pages from "@hono/vite-dev-server/cloudflare-pages";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    build(),
    devServer({
      entry: "src/index.tsx",
      plugins: [
        pages({
          d1Databases: ["DB"],
          d1Persist: true,
        }),
      ],
    }),
  ],
});
