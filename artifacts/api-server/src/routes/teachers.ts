import { Router, type IRouter, type Response } from "express";
import { db } from "@workspace/db";
import { users } from "@workspace/db";
import { and, eq, inArray } from "drizzle-orm";
import {
  ListTeachersResponse,
  CreateTeacherBody,
  CreateTeacherResponse,
  UpdateTeacherParams,
  UpdateTeacherBody,
  UpdateTeacherResponse,
  DeleteTeacherParams,
} from "@workspace/api-zod";
import { asyncHandler } from "../lib/http";
import { attachUser, requireSchool, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

function serialize(u: typeof users.$inferSelect) {
  return {
    id: u.id,
    name: u.name ?? "",
    email: u.email,
    role: u.role as "super_admin" | "school_admin" | "teacher",
    status: u.status as "active" | "invited",
    createdAt: u.createdAt?.toISOString() ?? null,
  };
}

router.use(attachUser, requireSchool);

router.get(
  "/teachers",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const rows = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.schoolId, schoolId),
          inArray(users.role, ["school_admin", "teacher"]),
        ),
      );
    res.json(ListTeachersResponse.parse(rows.map(serialize)));
  }),
);

router.post(
  "/teachers",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    if (req.localUser!.role !== "school_admin") {
      res.status(403).json({ error: "Only school admins can add teachers" });
      return;
    }
    const schoolId = req.localUser!.schoolId!;
    const body = CreateTeacherBody.parse(req.body);

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email));
    if (existing) {
      res.status(409).json({ error: "A user with this email already exists" });
      return;
    }

    const [created] = await db
      .insert(users)
      .values({
        email: body.email,
        name: body.name,
        role: "teacher",
        schoolId,
        status: "invited",
      })
      .returning();
    res.json(CreateTeacherResponse.parse(serialize(created)));
  }),
);

router.patch(
  "/teachers/:id",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    if (req.localUser!.role !== "school_admin") {
      res.status(403).json({ error: "Only school admins can update teachers" });
      return;
    }
    const schoolId = req.localUser!.schoolId!;
    const { id } = UpdateTeacherParams.parse(req.params);
    const body = UpdateTeacherBody.parse(req.body);
    const [updated] = await db
      .update(users)
      .set({ ...(body.name !== undefined ? { name: body.name } : {}) })
      .where(and(eq(users.id, id), eq(users.schoolId, schoolId)))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Teacher not found" });
      return;
    }
    res.json(UpdateTeacherResponse.parse(serialize(updated)));
  }),
);

router.delete(
  "/teachers/:id",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    if (req.localUser!.role !== "school_admin") {
      res.status(403).json({ error: "Only school admins can remove teachers" });
      return;
    }
    const schoolId = req.localUser!.schoolId!;
    const { id } = DeleteTeacherParams.parse(req.params);
    if (id === req.localUser!.id) {
      res.status(400).json({ error: "You cannot remove yourself" });
      return;
    }
    await db
      .delete(users)
      .where(
        and(
          eq(users.id, id),
          eq(users.schoolId, schoolId),
          eq(users.role, "teacher"),
        ),
      );
    res.status(204).send();
  }),
);

export default router;
