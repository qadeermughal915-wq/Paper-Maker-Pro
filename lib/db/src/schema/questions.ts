import {
  pgTable,
  serial,
  text,
  integer,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { schools } from "./schools";
import { classes, subjects, chapters, topics } from "./taxonomy";
import { users } from "./users";

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  classId: integer("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  chapterId: integer("chapter_id").references(() => chapters.id, {
    onDelete: "set null",
  }),
  topicId: integer("topic_id").references(() => topics.id, {
    onDelete: "set null",
  }),
  type: text("type").notNull(),
  medium: text("medium").notNull(),
  difficulty: text("difficulty").notNull(),
  marks: integer("marks").notNull().default(1),
  text: text("text").notNull(),
  options: jsonb("options").$type<string[]>(),
  answer: text("answer"),
  createdBy: integer("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;
