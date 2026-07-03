import { Router, type IRouter, type Response } from "express";
import { db } from "@workspace/db";
import { questions, classes, subjects, chapters, topics } from "@workspace/db";
import { and, eq, desc, ilike, type SQL } from "drizzle-orm";
import {
  ListQuestionsQueryParams,
  ListQuestionsResponse,
  CreateQuestionBody,
  CreateQuestionResponse,
  ImportQuestionsBody,
  ImportQuestionsResponse,
  GetQuestionParams,
  GetQuestionResponse,
  UpdateQuestionParams,
  UpdateQuestionBody,
  UpdateQuestionResponse,
  DeleteQuestionParams,
} from "@workspace/api-zod";
import { asyncHandler } from "../lib/http";
import { attachUser, requireSchool, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();
router.use(attachUser, requireSchool);

const QUESTION_TYPES = [
  "mcq",
  "short",
  "long",
  "exercise",
  "conceptual",
  "past_paper",
] as const;
const MEDIUMS = ["urdu", "english", "dual"] as const;
const DIFFICULTIES = ["easy", "medium", "hard"] as const;

type QuestionType = (typeof QUESTION_TYPES)[number];
type Medium = (typeof MEDIUMS)[number];
type Difficulty = (typeof DIFFICULTIES)[number];

function serialize(row: {
  question: typeof questions.$inferSelect;
  className: string | null;
  subjectName: string | null;
  chapterName: string | null;
}) {
  const q = row.question;
  return {
    id: q.id,
    classId: q.classId,
    subjectId: q.subjectId,
    chapterId: q.chapterId,
    topicId: q.topicId,
    type: q.type as QuestionType,
    medium: q.medium as Medium,
    difficulty: q.difficulty as Difficulty,
    marks: q.marks,
    text: q.text,
    options: q.options,
    answer: q.answer,
    className: row.className,
    subjectName: row.subjectName,
    chapterName: row.chapterName,
    createdAt: q.createdAt?.toISOString() ?? null,
  };
}

async function ownsTaxonomy(
  schoolId: number,
  ids: {
    classId?: number | null;
    subjectId?: number | null;
    chapterId?: number | null;
    topicId?: number | null;
  },
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
  if (ids.chapterId != null) {
    const [ch] = await db
      .select({ id: chapters.id, subjectId: chapters.subjectId })
      .from(chapters)
      .where(and(eq(chapters.id, ids.chapterId), eq(chapters.schoolId, schoolId)));
    if (!ch) return "Invalid chapter for this school";
    if (ids.subjectId != null && ch.subjectId !== ids.subjectId)
      return "Chapter does not belong to the specified subject";
  }
  if (ids.topicId != null) {
    const [t] = await db
      .select({ id: topics.id, chapterId: topics.chapterId })
      .from(topics)
      .where(and(eq(topics.id, ids.topicId), eq(topics.schoolId, schoolId)));
    if (!t) return "Invalid topic for this school";
    if (ids.chapterId != null && t.chapterId !== ids.chapterId)
      return "Topic does not belong to the specified chapter";
  }
  return null;
}

async function fetchEnriched(schoolId: number, questionId: number) {
  const [row] = await db
    .select({
      question: questions,
      className: classes.name,
      subjectName: subjects.name,
      chapterName: chapters.name,
    })
    .from(questions)
    .leftJoin(classes, eq(questions.classId, classes.id))
    .leftJoin(subjects, eq(questions.subjectId, subjects.id))
    .leftJoin(chapters, eq(questions.chapterId, chapters.id))
    .where(and(eq(questions.id, questionId), eq(questions.schoolId, schoolId)));
  return row;
}

router.get(
  "/questions",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const query = ListQuestionsQueryParams.parse(req.query);
    const conditions: SQL[] = [eq(questions.schoolId, schoolId)];
    if (query.classId) conditions.push(eq(questions.classId, query.classId));
    if (query.subjectId)
      conditions.push(eq(questions.subjectId, query.subjectId));
    if (query.chapterId)
      conditions.push(eq(questions.chapterId, query.chapterId));
    if (query.topicId) conditions.push(eq(questions.topicId, query.topicId));
    if (query.type) conditions.push(eq(questions.type, query.type));
    if (query.medium) conditions.push(eq(questions.medium, query.medium));
    if (query.difficulty)
      conditions.push(eq(questions.difficulty, query.difficulty));
    if (query.search)
      conditions.push(ilike(questions.text, `%${query.search}%`));

    const rows = await db
      .select({
        question: questions,
        className: classes.name,
        subjectName: subjects.name,
        chapterName: chapters.name,
      })
      .from(questions)
      .leftJoin(classes, eq(questions.classId, classes.id))
      .leftJoin(subjects, eq(questions.subjectId, subjects.id))
      .leftJoin(chapters, eq(questions.chapterId, chapters.id))
      .where(and(...conditions))
      .orderBy(desc(questions.createdAt));

    res.json(ListQuestionsResponse.parse(rows.map(serialize)));
  }),
);

router.post(
  "/questions",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const body = CreateQuestionBody.parse(req.body);
    const ownershipError = await ownsTaxonomy(schoolId, {
      classId: body.classId,
      subjectId: body.subjectId,
      chapterId: body.chapterId ?? null,
      topicId: body.topicId ?? null,
    });
    if (ownershipError) {
      res.status(400).json({ error: ownershipError });
      return;
    }
    const [created] = await db
      .insert(questions)
      .values({
        schoolId,
        classId: body.classId,
        subjectId: body.subjectId,
        chapterId: body.chapterId ?? null,
        topicId: body.topicId ?? null,
        type: body.type,
        medium: body.medium,
        difficulty: body.difficulty,
        marks: body.marks,
        text: body.text,
        options: body.options ?? null,
        answer: body.answer ?? null,
        createdBy: req.localUser!.id,
      })
      .returning();
    const enriched = await fetchEnriched(schoolId, created.id);
    res.json(CreateQuestionResponse.parse(serialize(enriched)));
  }),
);

router.post(
  "/questions/import",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const body = ImportQuestionsBody.parse(req.body);
    const errors: { row: number; message: string }[] = [];
    let imported = 0;

    const ownershipError = await ownsTaxonomy(schoolId, {
      classId: body.classId,
      subjectId: body.subjectId,
      chapterId: body.chapterId ?? null,
    });
    if (ownershipError) {
      res.status(400).json({ error: ownershipError });
      return;
    }

    for (let i = 0; i < body.rows.length; i++) {
      const row = body.rows[i];
      const rowNum = i + 1;
      if (!row.text || !row.text.trim()) {
        errors.push({ row: rowNum, message: "Missing question text" });
        continue;
      }
      const type = (row.type ?? "short").toLowerCase();
      const medium = (row.medium ?? "english").toLowerCase();
      const difficulty = (row.difficulty ?? "easy").toLowerCase();
      if (!QUESTION_TYPES.includes(type as QuestionType)) {
        errors.push({ row: rowNum, message: `Invalid type "${row.type}"` });
        continue;
      }
      if (!MEDIUMS.includes(medium as Medium)) {
        errors.push({ row: rowNum, message: `Invalid medium "${row.medium}"` });
        continue;
      }
      if (!DIFFICULTIES.includes(difficulty as Difficulty)) {
        errors.push({
          row: rowNum,
          message: `Invalid difficulty "${row.difficulty}"`,
        });
        continue;
      }
      const marks = row.marks ?? 1;
      if (!Number.isFinite(marks) || marks < 0) {
        errors.push({ row: rowNum, message: `Invalid marks "${row.marks}"` });
        continue;
      }
      try {
        await db.insert(questions).values({
          schoolId,
          classId: body.classId,
          subjectId: body.subjectId,
          chapterId: body.chapterId ?? null,
          type,
          medium,
          difficulty,
          marks,
          text: row.text.trim(),
          options: row.options ?? null,
          answer: row.answer ?? null,
          createdBy: req.localUser!.id,
        });
        imported++;
      } catch {
        errors.push({ row: rowNum, message: "Failed to insert row" });
      }
    }

    res.json(
      ImportQuestionsResponse.parse({
        imported,
        failed: errors.length,
        errors,
      }),
    );
  }),
);

router.get(
  "/questions/:id",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const { id } = GetQuestionParams.parse(req.params);
    const enriched = await fetchEnriched(schoolId, id);
    if (!enriched) {
      res.status(404).json({ error: "Question not found" });
      return;
    }
    res.json(GetQuestionResponse.parse(serialize(enriched)));
  }),
);

router.patch(
  "/questions/:id",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const { id } = UpdateQuestionParams.parse(req.params);
    const body = UpdateQuestionBody.parse(req.body);
    if (body.chapterId != null || body.topicId != null) {
      const ownershipError = await ownsTaxonomy(schoolId, {
        chapterId: body.chapterId ?? null,
        topicId: body.topicId ?? null,
      });
      if (ownershipError) {
        res.status(400).json({ error: ownershipError });
        return;
      }
    }
    const [updated] = await db
      .update(questions)
      .set({
        ...(body.chapterId !== undefined ? { chapterId: body.chapterId } : {}),
        ...(body.topicId !== undefined ? { topicId: body.topicId } : {}),
        ...(body.type !== undefined ? { type: body.type } : {}),
        ...(body.medium !== undefined ? { medium: body.medium } : {}),
        ...(body.difficulty !== undefined
          ? { difficulty: body.difficulty }
          : {}),
        ...(body.marks !== undefined ? { marks: body.marks } : {}),
        ...(body.text !== undefined ? { text: body.text } : {}),
        ...(body.options !== undefined ? { options: body.options } : {}),
        ...(body.answer !== undefined ? { answer: body.answer } : {}),
      })
      .where(and(eq(questions.id, id), eq(questions.schoolId, schoolId)))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Question not found" });
      return;
    }
    const enriched = await fetchEnriched(schoolId, updated.id);
    res.json(UpdateQuestionResponse.parse(serialize(enriched)));
  }),
);

router.delete(
  "/questions/:id",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const { id } = DeleteQuestionParams.parse(req.params);
    await db
      .delete(questions)
      .where(and(eq(questions.id, id), eq(questions.schoolId, schoolId)));
    res.status(204).send();
  }),
);

export default router;
