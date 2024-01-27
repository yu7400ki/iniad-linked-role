import type { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle";
import { Lucia, TimeSpan } from "lucia";

export const createLucia = (adapter: DrizzleSQLiteAdapter, secure: boolean) => {
  return new Lucia(adapter, {
    sessionExpiresIn: new TimeSpan(1, "m"),
    sessionCookie: {
      attributes: {
        secure,
      },
    },
    getUserAttributes: (attributes) => ({
      email: attributes.email,
      name: attributes.name,
      familyName: attributes.familyName,
      givenName: attributes.givenName,
      picture: attributes.picture,
    }),
  });
};

declare module "lucia" {
  interface Register {
    Lucia: ReturnType<typeof createLucia>;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  email: string;
  name: string;
  familyName: string;
  givenName: string;
  picture: string;
}
