import { db } from "@workspace/db";
import {
  packages,
  classes,
  subjects,
  chapters,
  topics,
  questions,
} from "@workspace/db";
import { sql } from "drizzle-orm";

export async function seedPlatformPackages(): Promise<void> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(packages);
  if (count > 0) return;

  await db.insert(packages).values([
    {
      name: "Starter",
      price: 0,
      billingPeriod: "monthly",
      maxTeachers: 2,
      maxQuestions: 200,
      maxPapers: 10,
      features: ["Up to 2 teachers", "200 questions", "10 papers", "PDF export"],
      isActive: true,
    },
    {
      name: "Standard",
      price: 2500,
      billingPeriod: "monthly",
      maxTeachers: 10,
      maxQuestions: 2000,
      maxPapers: 100,
      features: [
        "Up to 10 teachers",
        "2,000 questions",
        "100 papers",
        "CSV/Excel import",
        "PDF export",
      ],
      isActive: true,
    },
    {
      name: "Premium",
      price: 6000,
      billingPeriod: "monthly",
      maxTeachers: null,
      maxQuestions: null,
      maxPapers: null,
      features: [
        "Unlimited teachers",
        "Unlimited questions",
        "Unlimited papers",
        "CSV/Excel import",
        "Priority support",
      ],
      isActive: true,
    },
  ]);
}

export async function seedStarterCurriculum(schoolId: number): Promise<void> {
  const [cls] = await db
    .insert(classes)
    .values({ schoolId, name: "Class 9", orderIndex: 9 })
    .returning();

  const [subject] = await db
    .insert(subjects)
    .values({ schoolId, classId: cls.id, name: "Physics" })
    .returning();

  const [chapter] = await db
    .insert(chapters)
    .values({
      schoolId,
      subjectId: subject.id,
      name: "Physical Quantities and Measurement",
      orderIndex: 1,
    })
    .returning();

  const [topic] = await db
    .insert(topics)
    .values({ schoolId, chapterId: chapter.id, name: "Physical Quantities" })
    .returning();

  await db.insert(questions).values([
    {
      schoolId,
      classId: cls.id,
      subjectId: subject.id,
      chapterId: chapter.id,
      topicId: topic.id,
      type: "mcq",
      medium: "english",
      difficulty: "easy",
      marks: 1,
      text: "Which of the following is a base quantity?",
      options: ["Force", "Length", "Velocity", "Energy"],
      answer: "Length",
    },
    {
      schoolId,
      classId: cls.id,
      subjectId: subject.id,
      chapterId: chapter.id,
      topicId: topic.id,
      type: "short",
      medium: "english",
      difficulty: "medium",
      marks: 2,
      text: "Define physical quantity and give two examples.",
    },
    {
      schoolId,
      classId: cls.id,
      subjectId: subject.id,
      chapterId: chapter.id,
      topicId: topic.id,
      type: "long",
      medium: "english",
      difficulty: "hard",
      marks: 5,
      text: "Explain the International System of Units (SI) with its base units.",
    },
  ]);
}
