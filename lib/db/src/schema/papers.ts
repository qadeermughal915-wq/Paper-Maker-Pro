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
import { questions } from "./questions";
import { users } from "./users";

export const papers = pgTable("papers", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  classId: integer("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  medium: text("medium").notNull(),
  totalMarks: integer("total_marks").notNull().default(0),
  durationMinutes: integer("duration_minutes"),
  examDate: text("exam_date"),
  instructions: text("instructions"),
  schoolName: text("school_name"),
  logoUrl: text("logo_url"),
  createdBy: integer("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paperQuestions = pgTable("paper_questions", {
  id: serial("id").primaryKey(),
  paperId: integer("paper_id")
    .notNull()
    .references(() => papers.id, { onDelete: "cascade" }),
  questionId: integer("question_id").references(() => questions.id, {
    onDelete: "set null",
  }),
  orderIndex: integer("order_index").notNull().default(0),
  section: text("section").notNull().default(""),
  type: text("type").notNull(),
  marks: integer("marks").notNull().default(1),
  text: text("text").notNull(),
  options: jsonb("options").$type<string[]>(),
});

export type Paper = typeof papers.$inferSelect;
export type InsertPaper = typeof papers.$inferInsert;
export type PaperQuestion = typeof paperQuestions.$inferSelect;
export type InsertPaperQuestion = typeof paperQuestions.$inferInsert;
