import { Router, type IRouter, type Response } from "express";
import { db } from "@workspace/db";
import { classes, subjects, chapters, topics } from "@workspace/db";
import { and, eq, asc } from "drizzle-orm";
import {
  ListClassesResponse,
  CreateClassBody,
  CreateClassResponse,
  UpdateClassParams,
  UpdateClassBody,
  UpdateClassResponse,
  DeleteClassParams,
  ListSubjectsQueryParams,
  ListSubjectsResponse,
  CreateSubjectBody,
  CreateSubjectResponse,
  UpdateSubjectParams,
  UpdateSubjectBody,
  UpdateSubjectResponse,
  DeleteSubjectParams,
  ListChaptersQueryParams,
  ListChaptersResponse,
  CreateChapterBody,
  CreateChapterResponse,
  UpdateChapterParams,
  UpdateChapterBody,
  UpdateChapterResponse,
  DeleteChapterParams,
  ListTopicsQueryParams,
  ListTopicsResponse,
  CreateTopicBody,
  CreateTopicResponse,
  UpdateTopicParams,
  UpdateTopicBody,
  UpdateTopicResponse,
  DeleteTopicParams,
} from "@workspace/api-zod";
import { asyncHandler } from "../lib/http";
import { attachUser, requireSchool, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();
router.use(attachUser, requireSchool);

/* ---------------- Classes ---------------- */
router.get(
  "/classes",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const rows = await db
      .select()
      .from(classes)
      .where(eq(classes.schoolId, schoolId))
      .orderBy(asc(classes.orderIndex), asc(classes.name));
    res.json(
      ListClassesResponse.parse(
        rows.map((c) => ({ id: c.id, name: c.name, orderIndex: c.orderIndex })),
      ),
    );
  }),
);

router.post(
  "/classes",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const body = CreateClassBody.parse(req.body);
    const [created] = await db
      .insert(classes)
      .values({ schoolId, name: body.name, orderIndex: body.orderIndex ?? 0 })
      .returning();
    res.json(
      CreateClassResponse.parse({
        id: created.id,
        name: created.name,
        orderIndex: created.orderIndex,
      }),
    );
  }),
);

router.patch(
  "/classes/:id",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const { id } = UpdateClassParams.parse(req.params);
    const body = UpdateClassBody.parse(req.body);
    const [updated] = await db
      .update(classes)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.orderIndex !== undefined ? { orderIndex: body.orderIndex } : {}),
      })
      .where(and(eq(classes.id, id), eq(classes.schoolId, schoolId)))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Class not found" });
      return;
    }
    res.json(
      UpdateClassResponse.parse({
        id: updated.id,
        name: updated.name,
        orderIndex: updated.orderIndex,
      }),
    );
  }),
);

router.delete(
  "/classes/:id",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const { id } = DeleteClassParams.parse(req.params);
    await db
      .delete(classes)
      .where(and(eq(classes.id, id), eq(classes.schoolId, schoolId)));
    res.status(204).send();
  }),
);

/* ---------------- Subjects ---------------- */
router.get(
  "/subjects",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const query = ListSubjectsQueryParams.parse(req.query);
    const conditions = [eq(subjects.schoolId, schoolId)];
    if (query.classId) conditions.push(eq(subjects.classId, query.classId));
    const rows = await db
      .select()
      .from(subjects)
      .where(and(...conditions))
      .orderBy(asc(subjects.name));
    res.json(
      ListSubjectsResponse.parse(
        rows.map((s) => ({ id: s.id, classId: s.classId, name: s.name })),
      ),
    );
  }),
);

router.post(
  "/subjects",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const body = CreateSubjectBody.parse(req.body);
    const [created] = await db
      .insert(subjects)
      .values({ schoolId, classId: body.classId, name: body.name })
      .returning();
    res.json(
      CreateSubjectResponse.parse({
        id: created.id,
        classId: created.classId,
        name: created.name,
      }),
    );
  }),
);

router.patch(
  "/subjects/:id",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const { id } = UpdateSubjectParams.parse(req.params);
    const body = UpdateSubjectBody.parse(req.body);
    const [updated] = await db
      .update(subjects)
      .set({ ...(body.name !== undefined ? { name: body.name } : {}) })
      .where(and(eq(subjects.id, id), eq(subjects.schoolId, schoolId)))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }
    res.json(
      UpdateSubjectResponse.parse({
        id: updated.id,
        classId: updated.classId,
        name: updated.name,
      }),
    );
  }),
);

router.delete(
  "/subjects/:id",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const { id } = DeleteSubjectParams.parse(req.params);
    await db
      .delete(subjects)
      .where(and(eq(subjects.id, id), eq(subjects.schoolId, schoolId)));
    res.status(204).send();
  }),
);

/* ---------------- Chapters ---------------- */
router.get(
  "/chapters",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const query = ListChaptersQueryParams.parse(req.query);
    const conditions = [eq(chapters.schoolId, schoolId)];
    if (query.subjectId)
      conditions.push(eq(chapters.subjectId, query.subjectId));
    const rows = await db
      .select()
      .from(chapters)
      .where(and(...conditions))
      .orderBy(asc(chapters.orderIndex), asc(chapters.name));
    res.json(
      ListChaptersResponse.parse(
        rows.map((c) => ({
          id: c.id,
          subjectId: c.subjectId,
          name: c.name,
          orderIndex: c.orderIndex,
        })),
      ),
    );
  }),
);

router.post(
  "/chapters",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const body = CreateChapterBody.parse(req.body);
    const [created] = await db
      .insert(chapters)
      .values({
        schoolId,
        subjectId: body.subjectId,
        name: body.name,
        orderIndex: body.orderIndex ?? 0,
      })
      .returning();
    res.json(
      CreateChapterResponse.parse({
        id: created.id,
        subjectId: created.subjectId,
        name: created.name,
        orderIndex: created.orderIndex,
      }),
    );
  }),
);

router.patch(
  "/chapters/:id",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const { id } = UpdateChapterParams.parse(req.params);
    const body = UpdateChapterBody.parse(req.body);
    const [updated] = await db
      .update(chapters)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.orderIndex !== undefined ? { orderIndex: body.orderIndex } : {}),
      })
      .where(and(eq(chapters.id, id), eq(chapters.schoolId, schoolId)))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Chapter not found" });
      return;
    }
    res.json(
      UpdateChapterResponse.parse({
        id: updated.id,
        subjectId: updated.subjectId,
        name: updated.name,
        orderIndex: updated.orderIndex,
      }),
    );
  }),
);

router.delete(
  "/chapters/:id",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const { id } = DeleteChapterParams.parse(req.params);
    await db
      .delete(chapters)
      .where(and(eq(chapters.id, id), eq(chapters.schoolId, schoolId)));
    res.status(204).send();
  }),
);

/* ---------------- Topics ---------------- */
router.get(
  "/topics",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const query = ListTopicsQueryParams.parse(req.query);
    const conditions = [eq(topics.schoolId, schoolId)];
    if (query.chapterId) conditions.push(eq(topics.chapterId, query.chapterId));
    const rows = await db
      .select()
      .from(topics)
      .where(and(...conditions))
      .orderBy(asc(topics.name));
    res.json(
      ListTopicsResponse.parse(
        rows.map((t) => ({ id: t.id, chapterId: t.chapterId, name: t.name })),
      ),
    );
  }),
);

router.post(
  "/topics",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const body = CreateTopicBody.parse(req.body);
    const [created] = await db
      .insert(topics)
      .values({ schoolId, chapterId: body.chapterId, name: body.name })
      .returning();
    res.json(
      CreateTopicResponse.parse({
        id: created.id,
        chapterId: created.chapterId,
        name: created.name,
      }),
    );
  }),
);

router.patch(
  "/topics/:id",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const { id } = UpdateTopicParams.parse(req.params);
    const body = UpdateTopicBody.parse(req.body);
    const [updated] = await db
      .update(topics)
      .set({ ...(body.name !== undefined ? { name: body.name } : {}) })
      .where(and(eq(topics.id, id), eq(topics.schoolId, schoolId)))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Topic not found" });
      return;
    }
    res.json(
      UpdateTopicResponse.parse({
        id: updated.id,
        chapterId: updated.chapterId,
        name: updated.name,
      }),
    );
  }),
);

router.delete(
  "/topics/:id",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const { id } = DeleteTopicParams.parse(req.params);
    await db
      .delete(topics)
      .where(and(eq(topics.id, id), eq(topics.schoolId, schoolId)));
    res.status(204).send();
  }),
);

export default router;
