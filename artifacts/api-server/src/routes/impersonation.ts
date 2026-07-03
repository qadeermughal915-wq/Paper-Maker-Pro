import { Router, type IRouter, type Response } from "express";
import { getAuth } from "@clerk/express";
import { clerkClient } from "@clerk/express";
import { db } from "@workspace/db";
import { users, schools, impersonationLogs } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import {
  StartImpersonationParams,
  StartImpersonationResponse,
  StopImpersonationResponse,
  ListImpersonationLogsResponse,
} from "@workspace/api-zod";
import { asyncHandler } from "../lib/http";
import { attachUser, requireRole, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 10;
const attemptsByAdmin = new Map<number, number[]>();

function isRateLimited(adminId: number): boolean {
  const now = Date.now();
  const attempts = (attemptsByAdmin.get(adminId) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  attempts.push(now);
  attemptsByAdmin.set(adminId, attempts);
  return attempts.length > RATE_LIMIT_MAX_ATTEMPTS;
}

router.post(
  "/admin/impersonate/:userId",
  attachUser,
  requireRole("super_admin"),
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const admin = req.localUser!;
    const params = StartImpersonationParams.parse(req.params);

    if (isRateLimited(admin.id)) {
      res
        .status(429)
        .json({ error: "Too many impersonation attempts. Try again later." });
      return;
    }

    const [target] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
        schoolId: users.schoolId,
        schoolName: schools.name,
        createdAt: users.createdAt,
        clerkUserId: users.clerkUserId,
      })
      .from(users)
      .leftJoin(schools, eq(users.schoolId, schools.id))
      .where(eq(users.id, params.userId));

    if (!target) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (target.role === "super_admin") {
      res.status(400).json({ error: "Cannot impersonate another super admin" });
      return;
    }
    if (!target.clerkUserId) {
      res
        .status(400)
        .json({ error: "This user has not signed in yet and cannot be impersonated" });
      return;
    }

    const actorToken = await clerkClient.actorTokens.create({
      userId: target.clerkUserId,
      actor: { sub: admin.clerkUserId ?? req.clerkUserId ?? "" },
      expiresInSeconds: 60,
      sessionMaxDurationInSeconds: 60 * 60,
    });

    if (!actorToken.token) {
      res.status(500).json({ error: "Failed to create impersonation token" });
      return;
    }

    await db.insert(impersonationLogs).values({
      adminId: admin.id,
      targetUserId: target.id,
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    });

    res.json(
      StartImpersonationResponse.parse({
        signInToken: actorToken.token,
        targetUser: {
          id: target.id,
          name: target.name,
          email: target.email,
          role: target.role,
          status: target.status,
          schoolId: target.schoolId,
          schoolName: target.schoolName,
          createdAt: target.createdAt?.toISOString() ?? null,
          hasClerkAccount: true,
        },
      }),
    );
  }),
);

router.post(
  "/admin/stop-impersonation",
  attachUser,
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const auth = getAuth(req);
    const actor = auth?.actor as { sub?: string; type?: string } | null | undefined;
    const actorSub = actor && actor.type !== "agent" ? actor.sub : undefined;
    if (!actorSub) {
      res.status(400).json({ error: "Not currently impersonating" });
      return;
    }

    const targetUserId = req.localUser?.id;
    if (targetUserId) {
      await db
        .update(impersonationLogs)
        .set({ isActive: false, endTime: new Date() })
        .where(
          and(
            eq(impersonationLogs.targetUserId, targetUserId),
            eq(impersonationLogs.isActive, true),
          ),
        );
    }

    res.json(StopImpersonationResponse.parse({ success: true }));
  }),
);

router.get(
  "/admin/impersonation-logs",
  attachUser,
  requireRole("super_admin"),
  asyncHandler(async (_req: AuthedRequest, res: Response) => {
    const rows = await db
      .select({
        id: impersonationLogs.id,
        adminId: impersonationLogs.adminId,
        targetUserId: impersonationLogs.targetUserId,
        startTime: impersonationLogs.startTime,
        endTime: impersonationLogs.endTime,
        isActive: impersonationLogs.isActive,
        ipAddress: impersonationLogs.ipAddress,
        userAgent: impersonationLogs.userAgent,
      })
      .from(impersonationLogs)
      .orderBy(desc(impersonationLogs.startTime));

    const userIds = Array.from(
      new Set(rows.flatMap((r) => [r.adminId, r.targetUserId])),
    );
    const userRows = userIds.length
      ? await db
          .select({ id: users.id, name: users.name, email: users.email })
          .from(users)
      : [];
    const userMap = new Map(userRows.map((u) => [u.id, u]));

    res.json(
      ListImpersonationLogsResponse.parse(
        rows.map((r) => ({
          id: r.id,
          adminId: r.adminId,
          adminName: userMap.get(r.adminId)?.name ?? userMap.get(r.adminId)?.email ?? null,
          targetUserId: r.targetUserId,
          targetName:
            userMap.get(r.targetUserId)?.name ?? userMap.get(r.targetUserId)?.email ?? null,
          startTime: r.startTime.toISOString(),
          endTime: r.endTime?.toISOString() ?? null,
          isActive: r.isActive,
          ipAddress: r.ipAddress,
          userAgent: r.userAgent,
        })),
      ),
    );
  }),
);

export default router;
