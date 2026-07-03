import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { schools } from "./schools";
import { packages } from "./packages";

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  packageId: integer("package_id").references(() => packages.id, {
    onDelete: "set null",
  }),
  status: text("status").notNull().default("active"),
  startedAt: timestamp("started_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;
