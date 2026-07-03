import { pgTable, serial, integer, boolean, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const impersonationLogs = pgTable("impersonation_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  targetUserId: integer("target_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  isActive: boolean("is_active").notNull().default(true),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ImpersonationLog = typeof impersonationLogs.$inferSelect;
export type InsertImpersonationLog = typeof impersonationLogs.$inferInsert;
