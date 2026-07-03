import { db } from "@workspace/db";
import {
  packages,
  classes,
  subjects,
  chapters,
  topics,
  questions,
  schools,
  payments,
  activityLogs,
  importHistory,
  paperTemplates,
} from "@workspace/db";
import { eq, sql } from "drizzle-orm";

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

const DEMO_METHODS = ["card", "bank_transfer", "easypaisa", "jazzcash"] as const;

export async function seedDemoData(schoolId: number): Promise<void> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(payments)
    .where(eq(payments.schoolId, schoolId));
  if (count > 0) return;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  await db.insert(payments).values(
    [
      { amount: 2500, status: "paid", packageName: "Standard", offset: 3 },
      { amount: 2500, status: "paid", packageName: "Standard", offset: 33 },
      { amount: 2500, status: "paid", packageName: "Standard", offset: 63 },
      { amount: 6000, status: "pending", packageName: "Premium", offset: 1 },
      { amount: 2500, status: "failed", packageName: "Standard", offset: 90 },
    ].map((p, i) => ({
      schoolId,
      amount: p.amount,
      currency: "PKR",
      status: p.status,
      method: DEMO_METHODS[i % DEMO_METHODS.length],
      reference: `TXN-${(now - p.offset * day).toString(36).toUpperCase()}`,
      packageName: p.packageName,
      paidAt: new Date(now - p.offset * day),
    })),
  );

  await db.insert(activityLogs).values(
    [
      { action: "created_paper", entity: "paper", detail: "Physics Mid-Term created", offset: 0 },
      { action: "added_question", entity: "question", detail: "3 questions added to Chemistry", offset: 1 },
      { action: "invited_teacher", entity: "teacher", detail: "Invited teacher ali@example.com", offset: 2 },
      { action: "imported_questions", entity: "question", detail: "Imported 42 questions", offset: 4 },
      { action: "updated_subscription", entity: "subscription", detail: "Renewed Standard plan", offset: 5 },
      { action: "exported_pdf", entity: "paper", detail: "Exported Class 9 Physics paper", offset: 6 },
    ].map((a) => ({
      schoolId,
      actorName: "Demo Admin",
      action: a.action,
      entity: a.entity,
      detail: a.detail,
      createdAt: new Date(now - a.offset * day),
    })),
  );

  await db.insert(importHistory).values(
    [
      { fileName: "physics_bank.csv", total: 45, imported: 42, failed: 3, status: "completed_with_errors", offset: 4 },
      { fileName: "chemistry_mcqs.xlsx", total: 30, imported: 30, failed: 0, status: "completed", offset: 10 },
      { fileName: "math_questions.csv", total: 60, imported: 58, failed: 2, status: "completed_with_errors", offset: 20 },
    ].map((h) => ({
      schoolId,
      actorName: "Demo Admin",
      fileName: h.fileName,
      total: h.total,
      imported: h.imported,
      failed: h.failed,
      status: h.status,
      createdAt: new Date(now - h.offset * day),
    })),
  );

  const [cls] = await db
    .select({ id: classes.id })
    .from(classes)
    .where(eq(classes.schoolId, schoolId))
    .limit(1);
  const [subj] = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(eq(subjects.schoolId, schoolId))
    .limit(1);

  await db.insert(paperTemplates).values([
    {
      schoolId,
      name: "Mid-Term Exam (35 marks)",
      description: "Standard mid-term layout: MCQs, short and long questions.",
      classId: cls?.id ?? null,
      subjectId: subj?.id ?? null,
      medium: "english",
      totalMarks: 35,
      durationMinutes: 90,
    },
    {
      schoolId,
      name: "Final Term Exam (75 marks)",
      description: "Comprehensive final term paper template.",
      classId: cls?.id ?? null,
      subjectId: subj?.id ?? null,
      medium: "english",
      totalMarks: 75,
      durationMinutes: 180,
    },
    {
      schoolId,
      name: "Monthly Test (20 marks)",
      description: "Quick monthly assessment.",
      classId: cls?.id ?? null,
      subjectId: subj?.id ?? null,
      medium: "dual",
      totalMarks: 20,
      durationMinutes: 45,
    },
  ]);
}

export async function backfillDemoData(): Promise<void> {
  const allSchools = await db.select({ id: schools.id }).from(schools);
  for (const s of allSchools) {
    await seedDemoData(s.id);
  }
}
