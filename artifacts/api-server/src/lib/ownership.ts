import { db } from "@workspace/db";
import { classes, subjects, questions } from "@workspace/db";
import { and, eq, inArray } from "drizzle-orm";

export async function ownsClassSubject(
  schoolId: number,
  classId: number,
  subjectId: number,
): Promise<string | null> {
  const [cls] = await db
    .select({ id: classes.id })
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.schoolId, schoolId)));
  if (!cls) return "Invalid class for this school";

  const [subject] = await db
    .select({ id: subjects.id, classId: subjects.classId })
    .from(subjects)
    .where(and(eq(subjects.id, subjectId), eq(subjects.schoolId, schoolId)));
  if (!subject) return "Invalid subject for this school";
  if (subject.classId !== classId)
    return "Subject does not belong to the selected class";

  return null;
}

export async function ownsQuestionIds(
  schoolId: number,
  questionIds: number[],
): Promise<string | null> {
  const unique = Array.from(
    new Set(
      questionIds.filter(
        (id): id is number => typeof id === "number" && Number.isFinite(id),
      ),
    ),
  );
  if (unique.length === 0) return null;

  const owned = await db
    .select({ id: questions.id })
    .from(questions)
    .where(
      and(inArray(questions.id, unique), eq(questions.schoolId, schoolId)),
    );

  if (owned.length !== unique.length)
    return "One or more questions do not belong to this school";

  return null;
}
