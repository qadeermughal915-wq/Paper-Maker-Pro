import { Router, type IRouter, type Response } from "express";
import { db } from "@workspace/db";
import { userTableViews } from "@workspace/db";
import { and, eq, asc } from "drizzle-orm";
import {
  ListViewsQueryParams,
  ListViewsResponse,
  CreateViewBody,
  CreateViewResponse,
  UpdateViewParams,
  UpdateViewBody,
  UpdateViewResponse,
  DeleteViewParams,
} from "@workspace/api-zod";
import { asyncHandler } from "../lib/http";
import { attachUser, requireUser, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();
router.use("/views", attachUser, requireUser);

function serialize(v: typeof userTableViews.$inferSelect) {
  return {
    id: v.id,
    tableKey: v.tableKey,
    name: v.name,
    state: (v.state ?? {}) as Record<string, unknown>,
    isDefault: v.isDefault,
    createdAt: v.createdAt?.toISOString() ?? null,
  };
}

router.get(
  "/views",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const userId = req.localUser!.id;
    const query = ListViewsQueryParams.parse(req.query);
    const rows = await db
      .select()
      .from(userTableViews)
      .where(
        and(
          eq(userTableViews.userId, userId),
          eq(userTableViews.tableKey, query.tableKey),
        ),
      )
      .orderBy(asc(userTableViews.name));
    res.json(ListViewsResponse.parse(rows.map(serialize)));
  }),
);

router.post(
  "/views",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const userId = req.localUser!.id;
    const body = CreateViewBody.parse(req.body);
    if (body.isDefault) {
      await db
        .update(userTableViews)
        .set({ isDefault: false })
        .where(
          and(
            eq(userTableViews.userId, userId),
            eq(userTableViews.tableKey, body.tableKey),
          ),
        );
    }
    const [created] = await db
      .insert(userTableViews)
      .values({
        userId,
        tableKey: body.tableKey,
        name: body.name,
        state: body.state as Record<string, unknown>,
        isDefault: body.isDefault ?? false,
      })
      .returning();
    res.status(201).json(CreateViewResponse.parse(serialize(created)));
  }),
);

router.patch(
  "/views/:id",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const userId = req.localUser!.id;
    const { id } = UpdateViewParams.parse(req.params);
    const body = UpdateViewBody.parse(req.body);
    const [existing] = await db
      .select()
      .from(userTableViews)
      .where(and(eq(userTableViews.id, id), eq(userTableViews.userId, userId)));
    if (!existing) {
      res.status(404).json({ error: "View not found" });
      return;
    }
    if (body.isDefault) {
      await db
        .update(userTableViews)
        .set({ isDefault: false })
        .where(
          and(
            eq(userTableViews.userId, userId),
            eq(userTableViews.tableKey, existing.tableKey),
          ),
        );
    }
    const [updated] = await db
      .update(userTableViews)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.state !== undefined
          ? { state: body.state as Record<string, unknown> }
          : {}),
        ...(body.isDefault !== undefined ? { isDefault: body.isDefault } : {}),
      })
      .where(and(eq(userTableViews.id, id), eq(userTableViews.userId, userId)))
      .returning();
    res.json(UpdateViewResponse.parse(serialize(updated)));
  }),
);

router.delete(
  "/views/:id",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const userId = req.localUser!.id;
    const { id } = DeleteViewParams.parse(req.params);
    await db
      .delete(userTableViews)
      .where(and(eq(userTableViews.id, id), eq(userTableViews.userId, userId)));
    res.status(204).send();
  }),
);

export default router;
