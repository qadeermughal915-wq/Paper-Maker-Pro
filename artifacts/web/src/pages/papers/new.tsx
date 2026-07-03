import { useState } from "react";
import { useLocation } from "wouter";
import { useListClasses, useListSubjects, useListChapters, useGeneratePaper, useCreatePaper, getListSubjectsQueryKey, getListChaptersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { QuestionType, Medium, Difficulty } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

export default function NewPaperPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("Mid Term Exam");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [medium, setMedium] = useState<Medium>("english");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [selectedChapters, setSelectedChapters] = useState<number[]>([]);

  // Selection mode: hit a target total marks, or specify per-type counts.
  const [mode, setMode] = useState<"marks" | "counts">("counts");
  const [totalMarks, setTotalMarks] = useState<number>(50);

  // Section counts
  const [counts, setCounts] = useState<Record<string, number>>({ mcq: 10, short: 5, long: 2 });

  const { data: classes } = useListClasses();
  const { data: subjects } = useListSubjects(
    { classId: Number(classId) || undefined },
    { query: { enabled: !!classId, queryKey: getListSubjectsQueryKey({ classId: Number(classId) || undefined }) } },
  );
  const { data: chapters } = useListChapters(
    { subjectId: Number(subjectId) || undefined },
    { query: { enabled: !!subjectId, queryKey: getListChaptersQueryKey({ subjectId: Number(subjectId) || undefined }) } },
  );

  const generatePaper = useGeneratePaper();
  const createPaper = useCreatePaper();

  const handleGenerate = async () => {
    if (!classId || !subjectId) {
      toast({ title: "Validation Error", description: "Class and Subject are required", variant: "destructive" });
      return;
    }

    const sections = Object.entries(counts).filter(([_, count]) => count > 0).map(([type, count]) => ({ type: type as QuestionType, count }));

    if (mode === "marks" && (!totalMarks || totalMarks < 1)) {
      toast({ title: "Validation Error", description: "Enter a target total marks of at least 1", variant: "destructive" });
      return;
    }

    try {
      const draft = await generatePaper.mutateAsync({
        data: {
          title,
          classId: Number(classId),
          subjectId: Number(subjectId),
          medium,
          difficulty: difficulty ? difficulty as Difficulty : null,
          chapterIds: selectedChapters.length > 0 ? selectedChapters : undefined,
          counts: sections,
          totalMarks: mode === "marks" ? totalMarks : undefined,
          durationMinutes: 120,
        }
      });

      // Automatically save it as a real paper
      const saved = await createPaper.mutateAsync({
        data: {
          title: draft.title,
          classId: draft.classId,
          subjectId: draft.subjectId,
          medium: draft.medium,
          durationMinutes: draft.durationMinutes ?? undefined,
          examDate: draft.examDate ?? undefined,
          instructions: draft.instructions ?? undefined,
          questions: draft.questions.map((q) => ({
            questionId: q.questionId ?? undefined,
            order: q.order,
            section: q.section,
            type: q.type,
            marks: q.marks,
            text: q.text,
            options: q.options ?? undefined,
          })),
        },
      });
      toast({ title: "Paper Generated successfully" });
      setLocation(`/papers/${saved.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast({ title: "Generation failed", description: message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-secondary">Build New Paper</h1>
        <p className="text-muted-foreground mt-1">Auto-generate a paper from the question bank.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paper Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Paper Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Medium</Label>
              <Select value={medium} onValueChange={(v: Medium) => setMedium(v)}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="urdu">Urdu</SelectItem>
                  <SelectItem value="dual">Dual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={classId} onValueChange={v => { setClassId(v); setSubjectId(""); setSelectedChapters([]); }}>
                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent>
                  {classes?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={subjectId} onValueChange={v => { setSubjectId(v); setSelectedChapters([]); }} disabled={!classId}>
                <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                <SelectContent>
                  {subjects?.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Difficulty Bias (Optional)</Label>
              <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                <SelectTrigger><SelectValue placeholder="Mixed / Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {chapters && chapters.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <Label>Chapters to Include (Leave empty for all)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {chapters.map(c => (
                  <div key={c.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`ch-${c.id}`} 
                      checked={selectedChapters.includes(c.id)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedChapters(prev => [...prev, c.id]);
                        else setSelectedChapters(prev => prev.filter(id => id !== c.id));
                      }}
                    />
                    <label htmlFor={`ch-${c.id}`} className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate" title={c.name}>
                      {c.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4 pt-4 border-t">
            <Label>How should we pick questions?</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === "counts" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("counts")}
              >
                By question count
              </Button>
              <Button
                type="button"
                variant={mode === "marks" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("marks")}
              >
                By total marks
              </Button>
            </div>

            {mode === "marks" ? (
              <div className="space-y-1 max-w-xs">
                <Label className="text-xs">Target Total Marks</Label>
                <Input
                  type="number"
                  min="1"
                  value={totalMarks}
                  onChange={e => setTotalMarks(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  We'll select questions to reach this total. Optionally limit the
                  question types below (leave all at 0 to allow any type).
                </p>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  {['mcq', 'short', 'long', 'exercise', 'conceptual', 'past_paper'].map(type => (
                    <div key={type} className="space-y-1">
                      <Label className="capitalize text-xs">{type.replace('_', ' ')}</Label>
                      <Input type="number" min="0" value={counts[type] || 0} onChange={e => setCounts({...counts, [type]: Number(e.target.value)})} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {['mcq', 'short', 'long', 'exercise', 'conceptual', 'past_paper'].map(type => (
                  <div key={type} className="space-y-1">
                    <Label className="capitalize text-xs">{type.replace('_', ' ')}</Label>
                    <Input type="number" min="0" value={counts[type] || 0} onChange={e => setCounts({...counts, [type]: Number(e.target.value)})} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button className="w-full" size="lg" onClick={handleGenerate} disabled={generatePaper.isPending || createPaper.isPending}>
            {(generatePaper.isPending || createPaper.isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
            Generate Paper
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}