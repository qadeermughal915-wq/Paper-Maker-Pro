import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { schools } from "./schools";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").unique(),
  email: text("email").notNull(),
  name: text("name"),
  role: text("role").notNull().default("teacher"),
  schoolId: integer("school_id").references(() => schools.id, {
    onDelete: "cascade",
  }),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
