import { Router, type IRouter, type Response } from "express";
import { db } from "@workspace/db";
import {
  schools,
  users,
  questions,
  papers,
  subscriptions,
  packages,
} from "@workspace/db";
import { and, eq, sql, desc } from "drizzle-orm";
import {
  ListAllSchoolsResponse,
  ListAllUsersResponse,
} from "@workspace/api-zod";
import { asyncHandler } from "../lib/http";
import { attachUser, requireRole, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

router.get(
  "/admin/schools",
  attachUser,
  requireRole("super_admin"),
  asyncHandler(async (_req: AuthedRequest, res: Response) => {
    const rows = await db.select().from(schools).orderBy(schools.name);

    const result = await Promise.all(
      rows.map(async (s) => {
        const [[teacherCount], [questionCount], [paperCount], subRow] =
          await Promise.all([
            db
              .select({ c: sql<number>`count(*)::int` })
              .from(users)
              .where(eq(users.schoolId, s.id)),
            db
              .select({ c: sql<number>`count(*)::int` })
              .from(questions)
              .where(eq(questions.schoolId, s.id)),
            db
              .select({ c: sql<number>`count(*)::int` })
              .from(papers)
              .where(eq(papers.schoolId, s.id)),
            db
              .select({
                status: subscriptions.status,
                packageName: packages.name,
              })
              .from(subscriptions)
              .leftJoin(packages, eq(subscriptions.packageId, packages.id))
              .where(
                and(
                  eq(subscriptions.schoolId, s.id),
                  eq(subscriptions.status, "active"),
                ),
              )
              .limit(1),
          ]);
        return {
          id: s.id,
          name: s.name,
          teacherCount: teacherCount.c,
          questionCount: questionCount.c,
          paperCount: paperCount.c,
          packageName: subRow[0]?.packageName ?? null,
          subscriptionStatus: subRow[0]?.status ?? "none",
          createdAt: s.createdAt?.toISOString() ?? null,
        };
      }),
    );

    res.json(ListAllSchoolsResponse.parse(result));
  }),
);

router.get(
  "/admin/users",
  attachUser,
  requireRole("super_admin"),
  asyncHandler(async (_req: AuthedRequest, res: Response) => {
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
        schoolId: users.schoolId,
        schoolName: schools.name,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(schools, eq(users.schoolId, schools.id))
      .orderBy(desc(users.createdAt));

    res.json(
      ListAllUsersResponse.parse(
        rows.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          status: u.status,
          schoolId: u.schoolId,
          schoolName: u.schoolName,
          createdAt: u.createdAt?.toISOString() ?? null,
        })),
      ),
    );
  }),
);

export default router;
