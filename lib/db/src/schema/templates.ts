import {
  pgTable,
  serial,
  text,
  integer,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { schools } from "./schools";
import { classes, subjects } from "./taxonomy";

export const paperTemplates = pgTable("paper_templates", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  classId: integer("class_id").references(() => classes.id, {
    onDelete: "set null",
  }),
  subjectId: integer("subject_id").references(() => subjects.id, {
    onDelete: "set null",
  }),
  medium: text("medium"),
  totalMarks: integer("total_marks").notNull().default(0),
  durationMinutes: integer("duration_minutes"),
  config: jsonb("config").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type PaperTemplate = typeof paperTemplates.$inferSelect;
export type InsertPaperTemplate = typeof paperTemplates.$inferInsert;
