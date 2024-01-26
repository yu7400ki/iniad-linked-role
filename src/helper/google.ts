import * as schema from "@/db/schema";
import { type Google, generateCodeVerifier, generateState } from "arctic";
import type { DrizzleD1Database } from "drizzle-orm/d1";

export const getAuthorizationUrl = async (google: Google): Promise<[URL, string, string]> => {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = await google.createAuthorizationURL(state, codeVerifier, {
    scopes: ["openid", "email", "profile"],
  });
  return [url, state, codeVerifier];
};

export const validationCallback = async (google: Google, code: string, codeVerifier: string) => {
  const tokens = await google.validateAuthorizationCode(code, codeVerifier);
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch user info");
  }
  const user = (await response.json()) as GoogleUser;
  return { tokens, user };
};

export const saveUser = async (db: DrizzleD1Database<typeof schema>, user: GoogleUser) => {
  const savedUser = await db
    .insert(schema.user)
    .values({
      id: user.sub,
      email: user.email,
      name: user.name,
      familyName: user.family_name,
      givenName: user.given_name,
      picture: user.picture,
    })
    .onConflictDoUpdate({
      target: schema.user.id,
      set: {
        email: user.email,
        name: user.name,
        familyName: user.family_name,
        givenName: user.given_name,
        picture: user.picture,
      },
    })
    .returning();
  if (saveUser.length === 0) {
    throw new Error("Failed to save user");
  }
  return savedUser[0];
};

export type GoogleUser = {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
  email: string;
  email_verified: boolean;
  hd: string;
};
