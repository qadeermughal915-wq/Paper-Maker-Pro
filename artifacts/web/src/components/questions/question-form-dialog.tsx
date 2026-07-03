import { useEffect, useState } from "react";
import {
  useListClasses,
  useListSubjects,
  useListChapters,
  useCreateQuestion,
  useUpdateQuestion,
  getListSubjectsQueryKey,
  getListChaptersQueryKey,
  getListQuestionsQueryKey,
} from "@workspace/api-client-react";
import type { Question, QuestionType, Medium, Difficulty } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X } from "lucide-react";

const TYPES: QuestionType[] = ["mcq", "short", "long", "exercise", "conceptual", "past_paper"];
const MEDIUMS: Medium[] = ["english", "urdu", "dual"];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export function QuestionFormDialog({
  open,
  onOpenChange,
  question,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question?: Question | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!question;

  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [type, setType] = useState<QuestionType>("short");
  const [medium, setMedium] = useState<Medium>("english");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [marks, setMarks] = useState(1);
  const [text, setText] = useState("");
  const [answer, setAnswer] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);

  useEffect(() => {
    if (!open) return;
    if (question) {
      setClassId(String(question.classId));
      setSubjectId(String(question.subjectId));
      setChapterId(question.chapterId ? String(question.chapterId) : "");
      setType(question.type);
      setMedium(question.medium);
      setDifficulty(question.difficulty);
      setMarks(question.marks);
      setText(question.text);
      setAnswer(question.answer ?? "");
      setOptions(question.options && question.options.length ? question.options : ["", "", "", ""]);
    } else {
      setClassId("");
      setSubjectId("");
      setChapterId("");
      setType("short");
      setMedium("english");
      setDifficulty("easy");
      setMarks(1);
      setText("");
      setAnswer("");
      setOptions(["", "", "", ""]);
    }
  }, [open, question]);

  const { data: classes } = useListClasses();
  const { data: subjects } = useListSubjects(
    { classId: Number(classId) || undefined },
    { query: { enabled: !!classId, queryKey: getListSubjectsQueryKey({ classId: Number(classId) || undefined }) } },
  );
  const { data: chapters } = useListChapters(
    { subjectId: Number(subjectId) || undefined },
    { query: { enabled: !!subjectId, queryKey: getListChaptersQueryKey({ subjectId: Number(subjectId) || undefined }) } },
  );

  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const isPending = createQuestion.isPending || updateQuestion.isPending;

  const handleSubmit = async () => {
    if (!classId || !subjectId || !text.trim()) {
      toast({ title: "Missing fields", description: "Class, subject and question text are required.", variant: "destructive" });
      return;
    }
    const cleanOptions = type === "mcq" ? options.map((o) => o.trim()).filter(Boolean) : undefined;

    try {
      if (isEdit && question) {
        await updateQuestion.mutateAsync({
          id: question.id,
          data: {
            chapterId: chapterId ? Number(chapterId) : null,
            type,
            medium,
            difficulty,
            marks,
            text: text.trim(),
            options: cleanOptions,
            answer: answer.trim() || undefined,
          },
        });
      } else {
        await createQuestion.mutateAsync({
          data: {
            classId: Number(classId),
            subjectId: Number(subjectId),
            chapterId: chapterId ? Number(chapterId) : null,
            type,
            medium,
            difficulty,
            marks,
            text: text.trim(),
            options: cleanOptions,
            answer: answer.trim() || undefined,
          },
        });
      }
      await queryClient.invalidateQueries({ queryKey: getListQuestionsQueryKey() });
      toast({ title: isEdit ? "Question updated" : "Question added" });
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast({ title: "Save failed", description: message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Question" : "Add Question"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Class</Label>
              <Select value={classId} onValueChange={(v) => { setClassId(v); setSubjectId(""); setChapterId(""); }} disabled={isEdit}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {classes?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Select value={subjectId} onValueChange={(v) => { setSubjectId(v); setChapterId(""); }} disabled={isEdit || !classId}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {subjects?.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Chapter (optional)</Label>
              <Select value={chapterId || "none"} onValueChange={(v) => setChapterId(v === "none" ? "" : v)} disabled={!subjectId}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {chapters?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v: QuestionType) => setType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Medium</Label>
              <Select value={medium} onValueChange={(v: Medium) => setMedium(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MEDIUMS.map((m) => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={(v: Difficulty) => setDifficulty(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Marks</Label>
              <Input type="number" min="0" value={marks} onChange={(e) => setMarks(Number(e.target.value))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Question Text</Label>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} dir={medium === "urdu" ? "rtl" : "ltr"} />
          </div>

          {type === "mcq" && (
            <div className="space-y-2">
              <Label>Options</Label>
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    value={opt}
                    placeholder={`Option ${i + 1}`}
                    dir={medium === "urdu" ? "rtl" : "ltr"}
                    onChange={(e) => setOptions((prev) => prev.map((o, idx) => (idx === i ? e.target.value : o)))}
                  />
                  {options.length > 2 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setOptions((prev) => [...prev, ""])}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add option
              </Button>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Answer (optional)</Label>
            <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={2} dir={medium === "urdu" ? "rtl" : "ltr"} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Add Question"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
