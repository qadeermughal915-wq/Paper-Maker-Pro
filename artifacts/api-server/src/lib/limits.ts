import { db } from "@workspace/db";
import {
  subscriptions,
  packages,
  users,
  questions,
  papers,
} from "@workspace/db";
import { and, eq, inArray, sql } from "drizzle-orm";

export type LimitedResource = "teachers" | "questions" | "papers";

async function activePackage(schoolId: number) {
  const [row] = await db
    .select({ pkg: packages })
    .from(subscriptions)
    .leftJoin(packages, eq(subscriptions.packageId, packages.id))
    .where(
      and(
        eq(subscriptions.schoolId, schoolId),
        eq(subscriptions.status, "active"),
      ),
    );
  return row?.pkg ?? null;
}

async function currentCount(
  schoolId: number,
  resource: LimitedResource,
): Promise<number> {
  if (resource === "teachers") {
    const [r] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(users)
      .where(
        and(
          eq(users.schoolId, schoolId),
          inArray(users.role, ["school_admin", "teacher"]),
        ),
      );
    return r?.n ?? 0;
  }
  if (resource === "questions") {
    const [r] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(questions)
      .where(eq(questions.schoolId, schoolId));
    return r?.n ?? 0;
  }
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(papers)
    .where(eq(papers.schoolId, schoolId));
  return r?.n ?? 0;
}

/**
 * Returns an error message if creating `additional` items of `resource`
 * would exceed the school's active plan limit, otherwise null.
 * Schools with no active package (or a package that does not cap the
 * resource) are treated as unlimited.
 */
export async function enforceLimit(
  schoolId: number,
  resource: LimitedResource,
  additional = 1,
): Promise<string | null> {
  const pkg = await activePackage(schoolId);
  if (!pkg) return null;
  const max =
    resource === "teachers"
      ? pkg.maxTeachers
      : resource === "questions"
        ? pkg.maxQuestions
        : pkg.maxPapers;
  if (max == null) return null;
  const count = await currentCount(schoolId, resource);
  if (count + additional > max) {
    return `Your "${pkg.name}" plan allows up to ${max} ${resource}. You currently have ${count}. Upgrade your plan to add more.`;
  }
  return null;
}
