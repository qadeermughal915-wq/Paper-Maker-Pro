import { Router, type IRouter, type Response } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { schools, users, packages, subscriptions } from "@workspace/db";
import { and, asc, eq } from "drizzle-orm";
import {
  GetMeResponse,
  OnboardSchoolBody,
  OnboardSchoolResponse,
} from "@workspace/api-zod";
import { asyncHandler } from "../lib/http";
import {
  fetchClerkIdentity,
  resolveLocalUser,
  type AuthedRequest,
} from "../lib/auth";
import { seedStarterCurriculum } from "../lib/seed";

const router: IRouter = Router();

async function buildMe(userId: number | null, opts: {
  email: string | null;
  name: string | null;
}) {
  if (!userId) {
    return {
      authenticated: true,
      needsOnboarding: true,
      id: null,
      email: opts.email,
      name: opts.name,
      role: null,
      schoolId: null,
      school: null,
    };
  }
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  let school = null;
  if (user.schoolId) {
    const [s] = await db
      .select()
      .from(schools)
      .where(eq(schools.id, user.schoolId));
    school = s
      ? {
          id: s.id,
          name: s.name,
          address: s.address,
          phone: s.phone,
          logoUrl: s.logoUrl,
          createdAt: s.createdAt?.toISOString() ?? null,
        }
      : null;
  }
  const needsOnboarding = user.role !== "super_admin" && !user.schoolId;
  return {
    authenticated: true,
    needsOnboarding,
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    schoolId: user.schoolId,
    school,
  };
}

router.get(
  "/me",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const auth = getAuth(req);
    const clerkUserId = auth?.userId;
    if (!clerkUserId) {
      res.json(
        GetMeResponse.parse({
          authenticated: false,
          needsOnboarding: false,
          id: null,
          email: null,
          name: null,
          role: null,
          schoolId: null,
          school: null,
        }),
      );
      return;
    }
    const identity = await fetchClerkIdentity(clerkUserId);
    const user = await resolveLocalUser(identity);
    const me = await buildMe(user?.id ?? null, {
      email: identity.email,
      name: identity.name,
    });
    res.json(GetMeResponse.parse(me));
  }),
);

router.post(
  "/onboarding/school",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const auth = getAuth(req);
    const clerkUserId = auth?.userId;
    if (!clerkUserId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const body = OnboardSchoolBody.parse(req.body);
    const identity = await fetchClerkIdentity(clerkUserId);
    const existing = await resolveLocalUser(identity);

    if (existing?.role === "super_admin") {
      res.status(400).json({ error: "Super admins do not belong to a school" });
      return;
    }
    if (existing?.schoolId) {
      res.status(400).json({ error: "You already belong to a school" });
      return;
    }

    const [school] = await db
      .insert(schools)
      .values({
        name: body.name,
        address: body.address ?? null,
        phone: body.phone ?? null,
        logoUrl: body.logoUrl ?? null,
      })
      .returning();

    let userId: number;
    if (existing) {
      const [updated] = await db
        .update(users)
        .set({ schoolId: school.id, role: "school_admin", status: "active" })
        .where(eq(users.id, existing.id))
        .returning();
      userId = updated.id;
    } else {
      const [created] = await db
        .insert(users)
        .values({
          clerkUserId,
          email: identity.email ?? "",
          name: identity.name,
          role: "school_admin",
          schoolId: school.id,
          status: "active",
        })
        .returning();
      userId = created.id;
    }

    // Assign a default subscription so plan limits apply from day one.
    // Prefer the cheapest active package (the free/starter tier).
    const [defaultPkg] = await db
      .select({ id: packages.id })
      .from(packages)
      .where(eq(packages.isActive, true))
      .orderBy(asc(packages.price), asc(packages.id))
      .limit(1);
    if (defaultPkg) {
      const [existingSub] = await db
        .select({ id: subscriptions.id })
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.schoolId, school.id),
            eq(subscriptions.status, "active"),
          ),
        );
      if (!existingSub) {
        await db.insert(subscriptions).values({
          schoolId: school.id,
          packageId: defaultPkg.id,
          status: "active",
        });
      }
    }

    await seedStarterCurriculum(school.id);

    const me = await buildMe(userId, {
      email: identity.email,
      name: identity.name,
    });
    res.json(OnboardSchoolResponse.parse(me));
  }),
);

export default router;
