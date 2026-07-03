import {
  pgTable,
  serial,
  text,
  integer,
  jsonb,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const userTableViews = pgTable("user_table_views", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tableKey: text("table_key").notNull(),
  name: text("name").notNull(),
  state: jsonb("state").$type<Record<string, unknown>>().notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type UserTableView = typeof userTableViews.$inferSelect;
export type InsertUserTableView = typeof userTableViews.$inferInsert;
