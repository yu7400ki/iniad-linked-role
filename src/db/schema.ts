import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  familyName: text("family_name").notNull(),
  givenName: text("given_name").notNull(),
  picture: text("picture").notNull(),
});

export const session = sqliteTable("user_session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", {
    mode: "timestamp",
  }).notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const userRelations = relations(user, ({ many }) => ({
  session: many(session),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));
