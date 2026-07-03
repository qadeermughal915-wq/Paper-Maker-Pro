import { Router, type IRouter, type Response } from "express";
import { db } from "@workspace/db";
import { packages, subscriptions } from "@workspace/db";
import { and, eq, desc } from "drizzle-orm";
import {
  ListPackagesResponse,
  CreatePackageBody,
  CreatePackageResponse,
  UpdatePackageParams,
  UpdatePackageBody,
  UpdatePackageResponse,
  DeletePackageParams,
  GetSubscriptionResponse,
  SubscribeBody,
  SubscribeResponse,
} from "@workspace/api-zod";
import { asyncHandler } from "../lib/http";
import {
  attachUser,
  requireSchool,
  requireRole,
  type AuthedRequest,
} from "../lib/auth";

const router: IRouter = Router();

function serializePackage(p: typeof packages.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    billingPeriod: p.billingPeriod,
    maxTeachers: p.maxTeachers,
    maxQuestions: p.maxQuestions,
    maxPapers: p.maxPapers,
    features: p.features,
    isActive: p.isActive,
  };
}

router.get(
  "/packages",
  attachUser,
  asyncHandler(async (_req: AuthedRequest, res: Response) => {
    const rows = await db
      .select()
      .from(packages)
      .orderBy(packages.price);
    res.json(ListPackagesResponse.parse(rows.map(serializePackage)));
  }),
);

router.post(
  "/packages",
  attachUser,
  requireRole("super_admin"),
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const body = CreatePackageBody.parse(req.body);
    const [created] = await db
      .insert(packages)
      .values({
        name: body.name,
        price: body.price,
        billingPeriod: body.billingPeriod ?? "monthly",
        maxTeachers: body.maxTeachers ?? null,
        maxQuestions: body.maxQuestions ?? null,
        maxPapers: body.maxPapers ?? null,
        features: body.features ?? null,
        isActive: body.isActive ?? true,
      })
      .returning();
    res.json(CreatePackageResponse.parse(serializePackage(created)));
  }),
);

router.patch(
  "/packages/:id",
  attachUser,
  requireRole("super_admin"),
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { id } = UpdatePackageParams.parse(req.params);
    const body = UpdatePackageBody.parse(req.body);
    const [updated] = await db
      .update(packages)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.price !== undefined ? { price: body.price } : {}),
        ...(body.billingPeriod !== undefined
          ? { billingPeriod: body.billingPeriod }
          : {}),
        ...(body.maxTeachers !== undefined
          ? { maxTeachers: body.maxTeachers }
          : {}),
        ...(body.maxQuestions !== undefined
          ? { maxQuestions: body.maxQuestions }
          : {}),
        ...(body.maxPapers !== undefined ? { maxPapers: body.maxPapers } : {}),
        ...(body.features !== undefined ? { features: body.features } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      })
      .where(eq(packages.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Package not found" });
      return;
    }
    res.json(UpdatePackageResponse.parse(serializePackage(updated)));
  }),
);

router.delete(
  "/packages/:id",
  attachUser,
  requireRole("super_admin"),
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const { id } = DeletePackageParams.parse(req.params);
    await db.delete(packages).where(eq(packages.id, id));
    res.status(204).send();
  }),
);

async function currentSubscription(schoolId: number) {
  const [row] = await db
    .select({ subscription: subscriptions, packageName: packages.name })
    .from(subscriptions)
    .leftJoin(packages, eq(subscriptions.packageId, packages.id))
    .where(eq(subscriptions.schoolId, schoolId))
    .orderBy(desc(subscriptions.startedAt))
    .limit(1);
  if (!row) {
    return { id: null, packageId: null, packageName: null, status: "none" as const, startedAt: null, expiresAt: null };
  }
  return {
    id: row.subscription.id,
    packageId: row.subscription.packageId,
    packageName: row.packageName,
    status: row.subscription.status as "active" | "trial" | "expired" | "none",
    startedAt: row.subscription.startedAt?.toISOString() ?? null,
    expiresAt: row.subscription.expiresAt?.toISOString() ?? null,
  };
}

router.get(
  "/subscription",
  attachUser,
  requireSchool,
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    res.json(GetSubscriptionResponse.parse(await currentSubscription(schoolId)));
  }),
);

router.post(
  "/subscription",
  attachUser,
  requireSchool,
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    if (req.localUser!.role !== "school_admin") {
      res.status(403).json({ error: "Only school admins can subscribe" });
      return;
    }
    const schoolId = req.localUser!.schoolId!;
    const body = SubscribeBody.parse(req.body);
    const [pkg] = await db
      .select()
      .from(packages)
      .where(eq(packages.id, body.packageId));
    if (!pkg) {
      res.status(404).json({ error: "Package not found" });
      return;
    }
    await db
      .update(subscriptions)
      .set({ status: "expired" })
      .where(
        and(
          eq(subscriptions.schoolId, schoolId),
          eq(subscriptions.status, "active"),
        ),
      );
    await db.insert(subscriptions).values({
      schoolId,
      packageId: body.packageId,
      status: "active",
    });
    res.json(SubscribeResponse.parse(await currentSubscription(schoolId)));
  }),
);

export default router;
