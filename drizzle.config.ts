import type { Config } from "drizzle-kit";
import crypto from "crypto";

// https://github.com/cloudflare/miniflare/blob/d0814db5cfb9e1ae7f7616d2842a02e575ad7b7e/packages/miniflare/src/plugins/shared/index.ts#L144C17
function durableObjectNamespaceIdFromName(uniqueKey: string, name: string) {
  const key = crypto.createHash("sha256").update(uniqueKey).digest();
  const nameHmac = crypto.createHmac("sha256", key).update(name).digest().subarray(0, 16);
  const hmac = crypto.createHmac("sha256", key).update(nameHmac).digest().subarray(0, 16);
  return Buffer.concat([nameHmac, hmac]).toString("hex");
}

const UNIQUE_KEY = "miniflare-D1DatabaseObject";
const PERSIST = "./.mf/d1";

export default {
  schema: "./src/db/*.ts",
  driver: "better-sqlite",
  out: "migrations",
  dbCredentials: {
    url: `${PERSIST}/${UNIQUE_KEY}/${durableObjectNamespaceIdFromName(UNIQUE_KEY, "DB")}.sqlite`,
  },
} satisfies Config;
