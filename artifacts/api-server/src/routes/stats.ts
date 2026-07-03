import { Router, type IRouter, type Response } from "express";
import { db } from "@workspace/db";
import {
  schools,
  users,
  classes,
  subjects,
  questions,
  papers,
  paperQuestions,
  subscriptions,
  packages,
} from "@workspace/db";
import { and, eq, desc, sql, inArray } from "drizzle-orm";
import {
  GetSchoolStatsResponse,
  GetAdminStatsResponse,
  GetQuestionsByTypeResponse,
  GetRecentPapersResponse,
} from "@workspace/api-zod";
import { asyncHandler } from "../lib/http";
import {
  attachUser,
  requireSchool,
  requireRole,
  type AuthedRequest,
} from "../lib/auth";

const router: IRouter = Router();

async function countWhere(
  table: typeof users | typeof classes | typeof subjects | typeof questions | typeof papers,
  schoolId: number,
): Promise<number> {
  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(table)
    .where(eq((table as typeof users).schoolId, schoolId));
  return row.c;
}

router.get(
  "/stats/school",
  attachUser,
  requireSchool,
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const [teachers, classCount, subjectCount, questionCount, paperCount] =
      await Promise.all([
        countWhere(users, schoolId),
        countWhere(classes, schoolId),
        countWhere(subjects, schoolId),
        countWhere(questions, schoolId),
        countWhere(papers, schoolId),
      ]);
    res.json(
      GetSchoolStatsResponse.parse({
        teachers,
        classes: classCount,
        subjects: subjectCount,
        questions: questionCount,
        papers: paperCount,
      }),
    );
  }),
);

router.get(
  "/stats/questions-by-type",
  attachUser,
  requireSchool,
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const rows = await db
      .select({
        type: questions.type,
        count: sql<number>`count(*)::int`,
      })
      .from(questions)
      .where(eq(questions.schoolId, schoolId))
      .groupBy(questions.type);
    res.json(
      GetQuestionsByTypeResponse.parse(
        rows.map((r) => ({ type: r.type, count: r.count })),
      ),
    );
  }),
);

router.get(
  "/stats/recent-papers",
  attachUser,
  requireSchool,
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const rows = await db
      .select({
        paper: papers,
        className: classes.name,
        subjectName: subjects.name,
        questionCount: sql<number>`count(${paperQuestions.id})::int`,
      })
      .from(papers)
      .leftJoin(classes, eq(papers.classId, classes.id))
      .leftJoin(subjects, eq(papers.subjectId, subjects.id))
      .leftJoin(paperQuestions, eq(paperQuestions.paperId, papers.id))
      .where(eq(papers.schoolId, schoolId))
      .groupBy(papers.id, classes.name, subjects.name)
      .orderBy(desc(papers.createdAt))
      .limit(5);
    res.json(
      GetRecentPapersResponse.parse(
        rows.map((r) => ({
          id: r.paper.id,
          title: r.paper.title,
          className: r.className,
          subjectName: r.subjectName,
          medium: r.paper.medium as "urdu" | "english" | "dual",
          totalMarks: r.paper.totalMarks,
          questionCount: r.questionCount,
          createdAt: r.paper.createdAt?.toISOString() ?? null,
        })),
      ),
    );
  }),
);

router.get(
  "/stats/admin",
  attachUser,
  requireRole("super_admin"),
  asyncHandler(async (_req: AuthedRequest, res: Response) => {
    const [
      [schoolCount],
      [teacherCount],
      [questionCount],
      [paperCount],
    ] = await Promise.all([
      db.select({ c: sql<number>`count(*)::int` }).from(schools),
      db
        .select({ c: sql<number>`count(*)::int` })
        .from(users)
        .where(inArray(users.role, ["school_admin", "teacher"])),
      db.select({ c: sql<number>`count(*)::int` }).from(questions),
      db.select({ c: sql<number>`count(*)::int` }).from(papers),
    ]);

    const [revenueRow] = await db
      .select({ revenue: sql<number>`coalesce(sum(${packages.price}), 0)::int` })
      .from(subscriptions)
      .leftJoin(packages, eq(subscriptions.packageId, packages.id))
      .where(eq(subscriptions.status, "active"));

    res.json(
      GetAdminStatsResponse.parse({
        schools: schoolCount.c,
        teachers: teacherCount.c,
        questions: questionCount.c,
        papers: paperCount.c,
        revenue: revenueRow?.revenue ?? 0,
      }),
    );
  }),
);

export default router;
