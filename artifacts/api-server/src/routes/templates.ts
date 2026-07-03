import { Router, type IRouter, type Response } from "express";
import { db } from "@workspace/db";
import { paperTemplates, classes, subjects } from "@workspace/db";
import { and, eq, desc } from "drizzle-orm";
import {
  ListTemplatesResponse,
  CreateTemplateBody,
  CreateTemplateResponse,
  UpdateTemplateParams,
  UpdateTemplateBody,
  UpdateTemplateResponse,
  DeleteTemplateParams,
} from "@workspace/api-zod";
import { asyncHandler } from "../lib/http";
import { attachUser, requireSchool, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();
router.use(attachUser, requireSchool);

async function ownsTaxonomy(
  schoolId: number,
  ids: { classId?: number | null; subjectId?: number | null },
): Promise<string | null> {
  if (ids.classId != null) {
    const [c] = await db
      .select({ id: classes.id })
      .from(classes)
      .where(and(eq(classes.id, ids.classId), eq(classes.schoolId, schoolId)));
    if (!c) return "Invalid class for this school";
  }
  if (ids.subjectId != null) {
    const [s] = await db
      .select({ id: subjects.id, classId: subjects.classId })
      .from(subjects)
      .where(and(eq(subjects.id, ids.subjectId), eq(subjects.schoolId, schoolId)));
    if (!s) return "Invalid subject for this school";
    if (ids.classId != null && s.classId !== ids.classId)
      return "Subject does not belong to the specified class";
  }
  return null;
}

async function fetchEnriched(schoolId: number, id: number) {
  const [row] = await db
    .select({
      template: paperTemplates,
      className: classes.name,
      subjectName: subjects.name,
    })
    .from(paperTemplates)
    .leftJoin(classes, eq(paperTemplates.classId, classes.id))
    .leftJoin(subjects, eq(paperTemplates.subjectId, subjects.id))
    .where(and(eq(paperTemplates.id, id), eq(paperTemplates.schoolId, schoolId)));
  return row;
}

function serialize(row: {
  template: typeof paperTemplates.$inferSelect;
  className: string | null;
  subjectName: string | null;
}) {
  const t = row.template;
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    classId: t.classId,
    subjectId: t.subjectId,
    className: row.className,
    subjectName: row.subjectName,
    medium: t.medium,
    totalMarks: t.totalMarks,
    durationMinutes: t.durationMinutes,
    createdAt: t.createdAt?.toISOString() ?? null,
  };
}

router.get(
  "/templates",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const rows = await db
      .select({
        template: paperTemplates,
        className: classes.name,
        subjectName: subjects.name,
      })
      .from(paperTemplates)
      .leftJoin(classes, eq(paperTemplates.classId, classes.id))
      .leftJoin(subjects, eq(paperTemplates.subjectId, subjects.id))
      .where(eq(paperTemplates.schoolId, schoolId))
      .orderBy(desc(paperTemplates.createdAt));
    res.json(ListTemplatesResponse.parse(rows.map(serialize)));
  }),
);

router.post(
  "/templates",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const body = CreateTemplateBody.parse(req.body);
    const ownershipError = await ownsTaxonomy(schoolId, {
      classId: body.classId,
      subjectId: body.subjectId,
    });
    if (ownershipError) {
      res.status(400).json({ error: ownershipError });
      return;
    }
    const [created] = await db
      .insert(paperTemplates)
      .values({
        schoolId,
        name: body.name,
        description: body.description ?? null,
        classId: body.classId ?? null,
        subjectId: body.subjectId ?? null,
        medium: body.medium ?? null,
        totalMarks: body.totalMarks ?? 0,
        durationMinutes: body.durationMinutes ?? null,
      })
      .returning();
    const enriched = await fetchEnriched(schoolId, created.id);
    res.status(201).json(CreateTemplateResponse.parse(serialize(enriched)));
  }),
);

router.patch(
  "/templates/:id",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const { id } = UpdateTemplateParams.parse(req.params);
    const body = UpdateTemplateBody.parse(req.body);
    const ownershipError = await ownsTaxonomy(schoolId, {
      classId: body.classId,
      subjectId: body.subjectId,
    });
    if (ownershipError) {
      res.status(400).json({ error: ownershipError });
      return;
    }
    const [updated] = await db
      .update(paperTemplates)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined
          ? { description: body.description }
          : {}),
        ...(body.classId !== undefined ? { classId: body.classId } : {}),
        ...(body.subjectId !== undefined ? { subjectId: body.subjectId } : {}),
        ...(body.medium !== undefined ? { medium: body.medium } : {}),
        ...(body.totalMarks !== undefined ? { totalMarks: body.totalMarks } : {}),
        ...(body.durationMinutes !== undefined
          ? { durationMinutes: body.durationMinutes }
          : {}),
        updatedAt: new Date(),
      })
      .where(
        and(eq(paperTemplates.id, id), eq(paperTemplates.schoolId, schoolId)),
      )
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Template not found" });
      return;
    }
    const enriched = await fetchEnriched(schoolId, updated.id);
    res.json(UpdateTemplateResponse.parse(serialize(enriched)));
  }),
);

router.delete(
  "/templates/:id",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const { id } = DeleteTemplateParams.parse(req.params);
    await db
      .delete(paperTemplates)
      .where(
        and(eq(paperTemplates.id, id), eq(paperTemplates.schoolId, schoolId)),
      );
    res.status(204).send();
  }),
);

export default router;
