import { Router, type IRouter, type Response } from "express";
import { db } from "@workspace/db";
import { payments, activityLogs, importHistory } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import {
  ListPaymentsResponse,
  ListActivityResponse,
  ListImportsResponse,
} from "@workspace/api-zod";
import { asyncHandler } from "../lib/http";
import { attachUser, requireSchool, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();
router.use(
  ["/payments", "/activity", "/imports"],
  attachUser,
  requireSchool,
);

router.get(
  "/payments",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const rows = await db
      .select()
      .from(payments)
      .where(eq(payments.schoolId, schoolId))
      .orderBy(desc(payments.paidAt));
    res.json(
      ListPaymentsResponse.parse(
        rows.map((p) => ({
          id: p.id,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          method: p.method,
          reference: p.reference,
          packageName: p.packageName,
          paidAt: p.paidAt?.toISOString() ?? null,
          createdAt: p.createdAt?.toISOString() ?? null,
        })),
      ),
    );
  }),
);

router.get(
  "/activity",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const rows = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.schoolId, schoolId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(500);
    res.json(
      ListActivityResponse.parse(
        rows.map((a) => ({
          id: a.id,
          actorName: a.actorName,
          action: a.action,
          entity: a.entity,
          detail: a.detail,
          createdAt: a.createdAt?.toISOString() ?? null,
        })),
      ),
    );
  }),
);

router.get(
  "/imports",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const rows = await db
      .select()
      .from(importHistory)
      .where(eq(importHistory.schoolId, schoolId))
      .orderBy(desc(importHistory.createdAt))
      .limit(500);
    res.json(
      ListImportsResponse.parse(
        rows.map((r) => ({
          id: r.id,
          actorName: r.actorName,
          fileName: r.fileName,
          total: r.total,
          imported: r.imported,
          failed: r.failed,
          status: r.status,
          createdAt: r.createdAt?.toISOString() ?? null,
        })),
      ),
    );
  }),
);

export default router;
