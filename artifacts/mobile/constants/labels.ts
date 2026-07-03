import type { Difficulty, Medium, QuestionType } from "@workspace/api-client-react";

export const questionTypeLabels: Record<QuestionType, string> = {
  mcq: "MCQ",
  short: "Short",
  long: "Long",
  exercise: "Exercise",
  conceptual: "Conceptual",
  past_paper: "Past Paper",
};

export const mediumLabels: Record<Medium, string> = {
  urdu: "Urdu",
  english: "English",
  dual: "Dual",
};

export const difficultyLabels: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const difficultyTone: Record<
  Difficulty,
  "success" | "warning" | "danger"
> = {
  easy: "success",
  medium: "warning",
  hard: "danger",
};
