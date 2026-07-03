import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { schools } from "./schools";

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull().default(0),
  currency: text("currency").notNull().default("PKR"),
  status: text("status").notNull().default("paid"),
  method: text("method"),
  reference: text("reference"),
  packageName: text("package_name"),
  paidAt: timestamp("paid_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
