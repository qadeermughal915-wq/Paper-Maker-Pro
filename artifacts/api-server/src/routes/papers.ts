import { Router, type IRouter, type Response } from "express";
import { db } from "@workspace/db";
import {
  papers,
  paperQuestions,
  questions,
  classes,
  subjects,
  schools,
} from "@workspace/db";
import { and, eq, desc, inArray, sql } from "drizzle-orm";
import {
  ListPapersResponse,
  GeneratePaperBody,
  GeneratePaperResponse,
  CreatePaperBody,
  CreatePaperResponse,
  GetPaperParams,
  GetPaperResponse,
  UpdatePaperParams,
  UpdatePaperBody,
  UpdatePaperResponse,
  DeletePaperParams,
  GetPaperAvailabilityQueryParams,
  GetPaperAvailabilityResponse,
} from "@workspace/api-zod";
import { asyncHandler } from "../lib/http";
import { attachUser, requireSchool, type AuthedRequest } from "../lib/auth";
import { renderPaperPdf } from "../lib/pdf";
import { enforceLimit } from "../lib/limits";
import { ownsClassSubject, ownsQuestionIds } from "../lib/ownership";
import { validateLogoUrl } from "../lib/url-safety";

const router: IRouter = Router();

type Medium = "urdu" | "english" | "dual";
type QuestionType =
  | "mcq"
  | "short"
  | "long"
  | "exercise"
  | "conceptual"
  | "past_paper";

const TYPE_SECTIONS: Record<QuestionType, string> = {
  mcq: "Multiple Choice Questions",
  short: "Short Questions",
  long: "Long Questions",
  exercise: "Exercises",
  conceptual: "Conceptual Questions",
  past_paper: "Past Paper Questions",
};

async function loadPaperFull(schoolId: number, paperId: number) {
  const [row] = await db
    .select({
      paper: papers,
      className: classes.name,
      subjectName: subjects.name,
    })
    .from(papers)
    .leftJoin(classes, eq(papers.classId, classes.id))
    .leftJoin(subjects, eq(papers.subjectId, subjects.id))
    .where(and(eq(papers.id, paperId), eq(papers.schoolId, schoolId)));
  if (!row) return null;
  const pqs = await db
    .select()
    .from(paperQuestions)
    .where(eq(paperQuestions.paperId, paperId))
    .orderBy(paperQuestions.orderIndex);
  return {
    id: row.paper.id,
    title: row.paper.title,
    classId: row.paper.classId,
    subjectId: row.paper.subjectId,
    className: row.className,
    subjectName: row.subjectName,
    medium: row.paper.medium as Medium,
    totalMarks: row.paper.totalMarks,
    durationMinutes: row.paper.durationMinutes,
    examDate: row.paper.examDate,
    instructions: row.paper.instructions,
    schoolName: row.paper.schoolName,
    logoUrl: row.paper.logoUrl,
    createdAt: row.paper.createdAt?.toISOString() ?? null,
    questions: pqs.map((q) => ({
      id: q.id,
      questionId: q.questionId,
      order: q.orderIndex,
      section: q.section,
      type: q.type as QuestionType,
      marks: q.marks,
      text: q.text,
      options: q.options,
    })),
  };
}

router.use(attachUser, requireSchool);

router.get(
  "/papers",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const rows = await db
      .select({
        paper: papers,
        className: classes.name,
        subjectName: subjects.name,
        questionCount: sql<number>`count(${paperQuestions.id})::int`,
      })
      .from(papers)
      .leftJoin(classes, eq(papers.classId, classes.id))
      .leftJoin(subjects, eq(papers.subjectId, subjects.id))
      .leftJoin(paperQuestions, eq(paperQuestions.paperId, papers.id))
      .where(eq(papers.schoolId, schoolId))
      .groupBy(papers.id, classes.name, subjects.name)
      .orderBy(desc(papers.createdAt));
    res.json(
      ListPapersResponse.parse(
        rows.map((r) => ({
          id: r.paper.id,
          title: r.paper.title,
          className: r.className,
          subjectName: r.subjectName,
          medium: r.paper.medium as Medium,
          totalMarks: r.paper.totalMarks,
          questionCount: r.questionCount,
          createdAt: r.paper.createdAt?.toISOString() ?? null,
        })),
      ),
    );
  }),
);

router.post(
  "/papers/generate",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const body = GeneratePaperBody.parse(req.body);

    const [cls] = await db
      .select()
      .from(classes)
      .where(and(eq(classes.id, body.classId), eq(classes.schoolId, schoolId)));
    const [subject] = await db
      .select()
      .from(subjects)
      .where(
        and(eq(subjects.id, body.subjectId), eq(subjects.schoolId, schoolId)),
      );

    const selected: {
      questionId: number;
      order: number;
      section: string;
      type: QuestionType;
      marks: number;
      text: string;
      options?: string[] | null;
    }[] = [];
    const warnings: string[] = [];
    let order = 0;

    const mediumCondition = () => {
      if (body.medium === "english")
        return inArray(questions.medium, ["english", "dual"]);
      if (body.medium === "urdu")
        return inArray(questions.medium, ["urdu", "dual"]);
      return undefined;
    };

    if (body.totalMarks != null) {
      // Target-marks mode: pick questions to hit the requested total marks.
      const conditions = [
        eq(questions.schoolId, schoolId),
        eq(questions.classId, body.classId),
        eq(questions.subjectId, body.subjectId),
      ];
      if (body.chapterIds && body.chapterIds.length)
        conditions.push(inArray(questions.chapterId, body.chapterIds));
      if (body.difficulty)
        conditions.push(eq(questions.difficulty, body.difficulty));
      const mc = mediumCondition();
      if (mc) conditions.push(mc);
      // If specific types were requested (count > 0), restrict to them.
      const requestedTypes = (body.counts ?? [])
        .filter((c) => c.count > 0)
        .map((c) => c.type);
      if (requestedTypes.length)
        conditions.push(inArray(questions.type, requestedTypes));

      const pool = await db
        .select()
        .from(questions)
        .where(and(...conditions))
        .orderBy(sql`random()`);

      // Greedy fill: take larger-mark questions first, skipping any that
      // would overshoot the target, until the target is met exactly (or as
      // close as the available marks allow without exceeding it). Never error
      // on insufficient supply — fill what we can and warn the teacher.
      const byMarksDesc = [...pool].sort((a, b) => b.marks - a.marks);
      let running = 0;
      for (const q of byMarksDesc) {
        if (running >= body.totalMarks) break;
        if (running + q.marks > body.totalMarks) continue;
        order += 1;
        running += q.marks;
        selected.push({
          questionId: q.id,
          order,
          section: TYPE_SECTIONS[q.type as QuestionType],
          type: q.type as QuestionType,
          marks: q.marks,
          text: q.text,
          options: q.options,
        });
      }

      if (running < body.totalMarks) {
        warnings.push(
          `Requested ${body.totalMarks} marks but the question bank only had enough matching questions for ${running} marks. Add more questions or lower the target to fill the gap.`,
        );
      }
    } else {
      const counts =
        body.counts && body.counts.length
          ? body.counts
          : [{ type: "mcq" as QuestionType, count: 5 }];

      for (const c of counts) {
        if (c.count <= 0) continue;
        const conditions = [
          eq(questions.schoolId, schoolId),
          eq(questions.classId, body.classId),
          eq(questions.subjectId, body.subjectId),
          eq(questions.type, c.type),
        ];
        if (body.chapterIds && body.chapterIds.length)
          conditions.push(inArray(questions.chapterId, body.chapterIds));
        if (body.difficulty)
          conditions.push(eq(questions.difficulty, body.difficulty));
        const mc = mediumCondition();
        if (mc) conditions.push(mc);

        const pool = await db
          .select()
          .from(questions)
          .where(and(...conditions))
          .orderBy(sql`random()`)
          .limit(c.count);

        for (const q of pool) {
          order += 1;
          selected.push({
            questionId: q.id,
            order,
            section: TYPE_SECTIONS[c.type],
            type: c.type,
            marks: q.marks,
            text: q.text,
            options: q.options,
          });
        }

        if (pool.length < c.count) {
          warnings.push(
            `${TYPE_SECTIONS[c.type]}: requested ${c.count} but only ${pool.length} available in the question bank — included ${pool.length}.`,
          );
        }
      }
    }

    const totalMarks = selected.reduce((sum, q) => sum + q.marks, 0);

    res.json(
      GeneratePaperResponse.parse({
        id: null,
        title:
          body.title ||
          `${subject?.name ?? "Subject"} Paper - ${cls?.name ?? "Class"}`,
        classId: body.classId,
        subjectId: body.subjectId,
        className: cls?.name ?? null,
        subjectName: subject?.name ?? null,
        medium: body.medium,
        totalMarks,
        durationMinutes: body.durationMinutes ?? null,
        examDate: body.examDate ?? null,
        instructions: body.instructions ?? null,
        schoolName: null,
        logoUrl: null,
        createdAt: null,
        questions: selected,
        warnings,
      }),
    );
  }),
);

router.get(
  "/papers/availability",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const rawChapterIds = req.query.chapterIds;
    const chapterIds =
      rawChapterIds === undefined
        ? undefined
        : Array.isArray(rawChapterIds)
          ? rawChapterIds
          : [rawChapterIds];
    const query = GetPaperAvailabilityQueryParams.parse({
      ...req.query,
      chapterIds,
    });

    const conditions = [
      eq(questions.schoolId, schoolId),
      eq(questions.classId, query.classId),
      eq(questions.subjectId, query.subjectId),
    ];
    if (query.chapterIds && query.chapterIds.length)
      conditions.push(inArray(questions.chapterId, query.chapterIds));
    if (query.difficulty)
      conditions.push(eq(questions.difficulty, query.difficulty));
    if (query.medium === "english")
      conditions.push(inArray(questions.medium, ["english", "dual"]));
    else if (query.medium === "urdu")
      conditions.push(inArray(questions.medium, ["urdu", "dual"]));

    const rows = await db
      .select({
        type: questions.type,
        count: sql<number>`count(*)::int`,
        marks: sql<number>`coalesce(sum(${questions.marks}), 0)::int`,
      })
      .from(questions)
      .where(and(...conditions))
      .groupBy(questions.type);

    const byType = new Map(rows.map((r) => [r.type, r]));
    const result = (Object.keys(TYPE_SECTIONS) as QuestionType[]).map(
      (type) => ({
        type,
        count: byType.get(type)?.count ?? 0,
        marks: byType.get(type)?.marks ?? 0,
      }),
    );

    res.json(GetPaperAvailabilityResponse.parse(result));
  }),
);

router.post(
  "/papers",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const body = CreatePaperBody.parse(req.body);
    const limitError = await enforceLimit(schoolId, "papers");
    if (limitError) {
      res.status(403).json({ error: limitError });
      return;
    }

    if (body.logoUrl !== undefined) {
      const logoError = await validateLogoUrl(body.logoUrl);
      if (logoError) {
        res.status(400).json({ error: logoError });
        return;
      }
    }

    const ownershipError = await ownsClassSubject(
      schoolId,
      body.classId,
      body.subjectId,
    );
    if (ownershipError) {
      res.status(400).json({ error: ownershipError });
      return;
    }

    const questionOwnershipError = await ownsQuestionIds(
      schoolId,
      body.questions
        .map((q) => q.questionId)
        .filter((id): id is number => typeof id === "number"),
    );
    if (questionOwnershipError) {
      res.status(400).json({ error: questionOwnershipError });
      return;
    }

    const totalMarks = body.questions.reduce((sum, q) => sum + q.marks, 0);

    const [school] = await db
      .select()
      .from(schools)
      .where(eq(schools.id, schoolId));

    const [created] = await db
      .insert(papers)
      .values({
        schoolId,
        title: body.title,
        classId: body.classId,
        subjectId: body.subjectId,
        medium: body.medium,
        totalMarks,
        durationMinutes: body.durationMinutes ?? null,
        examDate: body.examDate ?? null,
        instructions: body.instructions ?? null,
        schoolName: body.schoolName ?? school?.name ?? null,
        logoUrl: body.logoUrl ?? school?.logoUrl ?? null,
        createdBy: req.localUser!.id,
      })
      .returning();

    if (body.questions.length) {
      await db.insert(paperQuestions).values(
        body.questions.map((q) => ({
          paperId: created.id,
          questionId: q.questionId ?? null,
          orderIndex: q.order,
          section: q.section,
          type: q.type,
          marks: q.marks,
          text: q.text,
          options: q.options ?? null,
        })),
      );
    }

    const full = await loadPaperFull(schoolId, created.id);
    res.json(CreatePaperResponse.parse(full));
  }),
);

router.get(
  "/papers/:id",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const { id } = GetPaperParams.parse(req.params);
    const full = await loadPaperFull(schoolId, id);
    if (!full) {
      res.status(404).json({ error: "Paper not found" });
      return;
    }
    res.json(GetPaperResponse.parse(full));
  }),
);

router.patch(
  "/papers/:id",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const { id } = UpdatePaperParams.parse(req.params);
    const body = UpdatePaperBody.parse(req.body);

    const [existing] = await db
      .select()
      .from(papers)
      .where(and(eq(papers.id, id), eq(papers.schoolId, schoolId)));
    if (!existing) {
      res.status(404).json({ error: "Paper not found" });
      return;
    }

    if (body.logoUrl !== undefined) {
      const logoError = await validateLogoUrl(body.logoUrl);
      if (logoError) {
        res.status(400).json({ error: logoError });
        return;
      }
    }

    if (body.questions) {
      const questionOwnershipError = await ownsQuestionIds(
        schoolId,
        body.questions
          .map((q) => q.questionId)
          .filter((id): id is number => typeof id === "number"),
      );
      if (questionOwnershipError) {
        res.status(400).json({ error: questionOwnershipError });
        return;
      }
    }

    const totalMarks = body.questions
      ? body.questions.reduce((sum, q) => sum + q.marks, 0)
      : existing.totalMarks;

    await db
      .update(papers)
      .set({
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.medium !== undefined ? { medium: body.medium } : {}),
        ...(body.durationMinutes !== undefined
          ? { durationMinutes: body.durationMinutes }
          : {}),
        ...(body.examDate !== undefined ? { examDate: body.examDate } : {}),
        ...(body.instructions !== undefined
          ? { instructions: body.instructions }
          : {}),
        ...(body.schoolName !== undefined
          ? { schoolName: body.schoolName }
          : {}),
        ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl } : {}),
        ...(body.questions ? { totalMarks } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(papers.id, id), eq(papers.schoolId, schoolId)));

    if (body.questions) {
      await db.delete(paperQuestions).where(eq(paperQuestions.paperId, id));
      if (body.questions.length) {
        await db.insert(paperQuestions).values(
          body.questions.map((q) => ({
            paperId: id,
            questionId: q.questionId ?? null,
            orderIndex: q.order,
            section: q.section,
            type: q.type,
            marks: q.marks,
            text: q.text,
            options: q.options ?? null,
          })),
        );
      }
    }

    const full = await loadPaperFull(schoolId, id);
    res.json(UpdatePaperResponse.parse(full));
  }),
);

router.delete(
  "/papers/:id",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const { id } = DeletePaperParams.parse(req.params);
    await db
      .delete(papers)
      .where(and(eq(papers.id, id), eq(papers.schoolId, schoolId)));
    res.status(204).send();
  }),
);

router.get(
  "/papers/:id/pdf",
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const schoolId = req.localUser!.schoolId!;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid paper id" });
      return;
    }
    const full = await loadPaperFull(schoolId, id);
    if (!full) {
      res.status(404).json({ error: "Paper not found" });
      return;
    }
    const pdf = await renderPaperPdf({
      title: full.title,
      className: full.className,
      subjectName: full.subjectName,
      medium: full.medium,
      totalMarks: full.totalMarks,
      durationMinutes: full.durationMinutes,
      examDate: full.examDate,
      instructions: full.instructions,
      schoolName: full.schoolName,
      logoUrl: full.logoUrl,
      questions: full.questions.map((q) => ({
        order: q.order,
        section: q.section,
        type: q.type,
        marks: q.marks,
        text: q.text,
        options: q.options,
      })),
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="paper-${id}.pdf"`,
    );
    res.send(pdf);
  }),
);

export default router;
