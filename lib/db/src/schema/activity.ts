import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { schools } from "./schools";
import { users } from "./users";

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  actorName: text("actor_name"),
  action: text("action").notNull(),
  entity: text("entity"),
  detail: text("detail"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const importHistory = pgTable("import_history", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  actorName: text("actor_name"),
  fileName: text("file_name").notNull(),
  total: integer("total").notNull().default(0),
  imported: integer("imported").notNull().default(0),
  failed: integer("failed").notNull().default(0),
  status: text("status").notNull().default("completed"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;
export type ImportHistory = typeof importHistory.$inferSelect;
export type InsertImportHistory = typeof importHistory.$inferInsert;
