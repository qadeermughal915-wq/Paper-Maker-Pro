import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetPaper,
  useUpdatePaper,
  useListQuestions,
  getGetPaperQueryKey,
  getListQuestionsQueryKey,
} from "@workspace/api-client-react";
import type { Question } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, FileDown, Save, ArrowLeft, ArrowUp, ArrowDown, Trash2, Plus, Repeat, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type QType = "mcq" | "short" | "long" | "exercise" | "conceptual" | "past_paper";

const TYPE_SECTIONS: Record<QType, string> = {
  mcq: "Multiple Choice Questions",
  short: "Short Questions",
  long: "Long Questions",
  exercise: "Exercises",
  conceptual: "Conceptual Questions",
  past_paper: "Past Paper Questions",
};

type EditableQuestion = {
  id?: number | null;
  questionId?: number | null;
  order: number;
  section: string;
  type: QType;
  marks: number;
  text: string;
  options?: string[] | null;
};

function questionToItem(q: Question): EditableQuestion {
  return {
    questionId: q.id,
    order: 0,
    section: TYPE_SECTIONS[q.type as QType] ?? "Questions",
    type: q.type as QType,
    marks: q.marks,
    text: q.text,
    options: q.options,
  };
}

export default function EditPaperPage() {
  const { id } = useParams();
  const paperId = Number(id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: paper, isLoading } = useGetPaper(paperId, { query: { enabled: !!paperId, queryKey: getGetPaperQueryKey(paperId) } });
  const updatePaper = useUpdatePaper();

  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [schoolName, setSchoolName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [items, setItems] = useState<EditableQuestion[]>([]);

  // picker state: null=closed, "add"=append mode, number=swap index
  const [pickerMode, setPickerMode] = useState<null | "add" | number>(null);
  const [pickerSearch, setPickerSearch] = useState("");

  useEffect(() => {
    if (paper) {
      setTitle(paper.title);
      setInstructions(paper.instructions || "");
      setDurationMinutes(paper.durationMinutes || 120);
      setSchoolName(paper.schoolName || "");
      setLogoUrl(paper.logoUrl || "");
      setItems(
        (paper.questions || []).map((q) => ({
          id: q.id,
          questionId: q.questionId,
          order: q.order,
          section: q.section,
          type: q.type as QType,
          marks: q.marks,
          text: q.text,
          options: q.options,
        })),
      );
    }
  }, [paper]);

  const totalMarks = items.reduce((sum, q) => sum + (q.marks || 0), 0);

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  };

  const remove = (index: number) => setItems(items.filter((_, i) => i !== index));

  const updateItem = (index: number, patch: Partial<EditableQuestion>) =>
    setItems(items.map((q, i) => (i === index ? { ...q, ...patch } : q)));

  const handlePick = (q: Question) => {
    const picked = questionToItem(q);
    if (pickerMode === "add") {
      setItems([...items, picked]);
    } else if (typeof pickerMode === "number") {
      setItems(items.map((it, i) => (i === pickerMode ? { ...picked } : it)));
    }
    setPickerMode(null);
    setPickerSearch("");
  };

  const handleSave = () => {
    const questions = items.map((q, i) => ({
      questionId: q.questionId ?? undefined,
      order: i + 1,
      section: q.section,
      type: q.type,
      marks: q.marks,
      text: q.text,
      options: q.options ?? undefined,
    }));
    updatePaper.mutate(
      {
        id: paperId,
        data: {
          title,
          instructions,
          durationMinutes,
          schoolName: schoolName || undefined,
          logoUrl: logoUrl || undefined,
          questions,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPaperQueryKey(paperId) });
          toast({ title: "Paper updated successfully" });
        },
        onError: (err: unknown) => {
          toast({
            variant: "destructive",
            title: "Failed to update paper",
            description: err instanceof Error ? err.message : "Please try again",
          });
        },
      },
    );
  };

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  if (!paper) return <div className="p-8 text-center text-destructive">Paper not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation('/papers')}><ArrowLeft className="h-4 w-4"/></Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-secondary">Edit Paper</h1>
          <p className="text-muted-foreground mt-1">{paper.className} • {paper.subjectName} • {totalMarks} Marks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave} disabled={updatePaper.isPending}>
            {updatePaper.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Save className="h-4 w-4 mr-2"/>} Save
          </Button>
          <Button onClick={() => window.open(`${import.meta.env.BASE_URL}api/papers/${paper.id}/pdf`, '_blank')}>
            <FileDown className="h-4 w-4 mr-2"/> Export PDF
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 bg-card p-6 rounded-xl border">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Duration (Minutes)</Label>
          <Input type="number" value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>School Name (header)</Label>
          <Input value={schoolName} onChange={e => setSchoolName(e.target.value)} placeholder="Shown in the PDF header" />
        </div>
        <div className="space-y-2">
          <Label>Logo URL (header)</Label>
          <Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://... (blank = paperz branding)" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Instructions</Label>
          <Input value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="e.g. Attempt all questions. Calculators are allowed." />
        </div>
      </div>

      <div className="space-y-4 mt-8">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-xl font-bold text-secondary">Questions ({items.length})</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Total: {totalMarks} Marks</span>
            <Button size="sm" onClick={() => { setPickerSearch(""); setPickerMode("add"); }}>
              <Plus className="h-4 w-4 mr-1"/> Add from Bank
            </Button>
          </div>
        </div>
        {items.length === 0 && (
          <p className="text-muted-foreground text-sm py-8 text-center">No questions yet. Use "Add from Bank" to include questions.</p>
        )}
        {items.map((q, i) => (
          <div key={q.id ?? `${i}-${q.text.slice(0, 8)}`} className="bg-card border rounded-lg p-5 space-y-3">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-bold text-muted-foreground">Q{i + 1}.</span>
                <div className="flex flex-col">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="h-3 w-3"/></Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => move(i, 1)} disabled={i === items.length - 1}><ArrowDown className="h-3 w-3"/></Button>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <Textarea value={q.text} onChange={e => updateItem(i, { text: e.target.value })} className="min-h-[64px] leading-relaxed" />
                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pl-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{String.fromCharCode(65 + oi)}.</span>
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{q.section}</div>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-2">
                <div className="flex items-center gap-1">
                  <Input type="number" value={q.marks} onChange={e => updateItem(i, { marks: Number(e.target.value) })} className="w-16 h-8 text-center" />
                  <span className="text-sm text-muted-foreground">Marks</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Swap with another question" onClick={() => { setPickerSearch(""); setPickerMode(i); }}><Repeat className="h-4 w-4"/></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Remove" onClick={() => remove(i)}><Trash2 className="h-4 w-4"/></Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <QuestionPicker
        open={pickerMode !== null}
        mode={pickerMode}
        classId={paper.classId}
        subjectId={paper.subjectId}
        search={pickerSearch}
        onSearchChange={setPickerSearch}
        usedIds={items.map((it) => it.questionId).filter((v): v is number => typeof v === "number")}
        onPick={handlePick}
        onClose={() => { setPickerMode(null); setPickerSearch(""); }}
      />
    </div>
  );
}

function QuestionPicker(props: {
  open: boolean;
  mode: null | "add" | number;
  classId: number;
  subjectId: number;
  search: string;
  onSearchChange: (v: string) => void;
  usedIds: number[];
  onPick: (q: Question) => void;
  onClose: () => void;
}) {
  const { open, mode, classId, subjectId, search, onSearchChange, usedIds, onPick, onClose } = props;
  const params = { classId, subjectId, search: search || undefined };
  const { data: questions, isLoading } = useListQuestions(
    params,
    { query: { enabled: open, queryKey: getListQuestionsQueryKey(params) } },
  );

  const isSwap = typeof mode === "number";
  const available = (questions || []).filter((q) => isSwap || !usedIds.includes(q.id));

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{isSwap ? "Swap Question" : "Add Questions from Bank"}</DialogTitle>
          <DialogDescription>
            {isSwap ? "Pick a question to replace the selected one." : "Pick questions to append to this paper."}
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search questions..." value={search} onChange={e => onSearchChange(e.target.value)} />
        </div>
        <div className="overflow-y-auto flex-1 space-y-2 mt-2 pr-1">
          {isLoading && <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-primary"/></div>}
          {!isLoading && available.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No matching questions in this class/subject.</p>
          )}
          {available.map((q) => (
            <button
              key={q.id}
              onClick={() => onPick(q)}
              className="w-full text-left bg-card border rounded-lg p-3 hover:border-primary transition-colors"
            >
              <div className="flex justify-between gap-3">
                <p className="text-sm text-foreground line-clamp-2">{q.text}</p>
                <span className="shrink-0 text-xs bg-muted px-2 py-0.5 rounded h-fit">{q.marks} Marks</span>
              </div>
              <div className="text-xs text-muted-foreground uppercase mt-1">{TYPE_SECTIONS[q.type as QType] ?? q.type}</div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
