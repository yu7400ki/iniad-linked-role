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
          bindings: {
            ENV: "DEV",
            GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
            GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
            GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI as string,
            DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID as string,
            DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET as string,
            DISCORD_REDIRECT_URI: process.env.DISCORD_REDIRECT_URI as string,
          },
          d1Databases: ["DB"],
          d1Persist: true,
        }),
      ],
    }),
  ],
});
