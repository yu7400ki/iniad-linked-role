import * as schema from "@/db/schema";
import { generateState } from "arctic";
import type { Discord, DiscordTokens } from "arctic";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";

export const getAuthorizationUrl = async (discord: Discord): Promise<[URL, string]> => {
  const state = generateState();
  const url = await discord.createAuthorizationURL(state, {
    scopes: ["role_connections.write", "identify"],
  });
  return [url, state];
};

export const validationCallback = async (discord: Discord, code: string) => {
  const tokens = await discord.validateAuthorizationCode(code);
  const response = await fetch("https://discord.com/api/v10/oauth2/@me", {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch user info");
  }
  const { user } = (await response.json()) as { user: DiscordUser };
  return { tokens, user };
};

export const getDiscordAccount = async (
  db: DrizzleD1Database<typeof schema>,
  discordId: string,
) => {
  const discordAccount = await db.query.discord.findFirst({
    where: eq(schema.discord.id, discordId),
    with: {
      user: true,
    },
  });
  return discordAccount ?? null;
};

export const getLinkedAccounts = async (db: DrizzleD1Database<typeof schema>, userId: string) => {
  const linkedAccounts = await db.query.user.findFirst({
    where: eq(schema.user.id, userId),
    with: {
      discord: true,
    },
  });
  return linkedAccounts ?? null;
};

export const linkAccount = async (
  db: DrizzleD1Database<typeof schema>,
  userId: string,
  discordUser: DiscordUser,
  tokens: DiscordTokens,
) => {
  const existingAccount = await getDiscordAccount(db, discordUser.id);
  const getLinkedAccount = async () => {
    if (!existingAccount) {
      const result = await db
        .insert(schema.discord)
        .values({
          id: discordUser.id,
          username: discordUser.username,
          discriminator: discordUser.discriminator,
          avatar: discordUser.avatar,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.accessTokenExpiresAt,
          userId: userId,
        })
        .returning();
      if (result.length === 0) {
        throw new Error("Failed to link account");
      }
      return result[0];
    }
    if (existingAccount.userId === userId) {
      const result = await db
        .update(schema.discord)
        .set({
          username: discordUser.username,
          discriminator: discordUser.discriminator,
          avatar: discordUser.avatar,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.accessTokenExpiresAt,
        })
        .where(eq(schema.discord.id, discordUser.id))
        .returning();
      if (result.length === 0) {
        throw new Error("Failed to link account");
      }
      return result[0];
    }
    return null;
  };
  const linkedAccount = await getLinkedAccount();
  return linkedAccount;
};

export const updateMetadata = async (
  clientId: string,
  accessToken: string,
  studentId: string,
  name: string,
) => {
  const metadata = {};
  const url = `https://discord.com/api/v10/users/@me/applications/${clientId}/role-connection`;
  const body = {
    platform_name: studentId,
    platform_username: name,
    metadata,
  };
  const response = await fetch(url, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to update metadata");
  }
};

export type DiscordUser = {
  id: string;
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
  bot?: boolean;
  system?: boolean;
  mfa_enabled?: boolean;
  verified?: boolean;
  email?: string | null;
  flags?: number;
  banner?: string | null;
  accent_color?: number | null;
  premium_type?: number;
  public_flags?: number;
  locale?: string;
  avatar_decoration?: string | null;
};
