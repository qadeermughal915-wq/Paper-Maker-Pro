import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useGetPaper, useUpdatePaper, getGetPaperQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, FileDown, Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  useEffect(() => {
    if (paper) {
      setTitle(paper.title);
      setInstructions(paper.instructions || "");
      setDurationMinutes(paper.durationMinutes || 120);
    }
  }, [paper]);

  const handleSave = () => {
    updatePaper.mutate(
      { id: paperId, data: { title, instructions, durationMinutes } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPaperQueryKey(paperId) });
          toast({ title: "Paper updated successfully" });
        }
      }
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
          <p className="text-muted-foreground mt-1">{paper.className} • {paper.subjectName} • {paper.totalMarks} Marks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave} disabled={updatePaper.isPending}>
            <Save className="h-4 w-4 mr-2"/> Save
          </Button>
          <Button onClick={() => window.open(`${import.meta.env.BASE_URL}api/papers/${paper.id}/pdf`, '_blank')}>
            <FileDown className="h-4 w-4 mr-2"/> Export PDF
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 bg-card p-6 rounded-xl border">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Duration (Minutes)</Label>
          <Input type="number" value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} />
        </div>
        <div className="space-y-2 md:col-span-3">
          <Label>Instructions</Label>
          <Input value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="e.g. Attempt all questions. Calculators are allowed." />
        </div>
      </div>

      <div className="space-y-8 mt-8">
        <h2 className="text-xl font-bold text-secondary border-b pb-2">Questions</h2>
        {paper.questions?.map((q, i) => (
          <div key={q.id || i} className="bg-card border rounded-lg p-5 space-y-3">
            <div className="flex justify-between items-start gap-4">
              <div className="flex gap-3">
                <span className="font-bold text-muted-foreground mt-0.5">Q{q.order}.</span>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{q.text}</p>
              </div>
              <div className="shrink-0 bg-muted px-2 py-1 rounded text-sm font-medium">
                [{q.marks} Marks]
              </div>
            </div>
            {q.options && q.options.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pl-8 pt-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <span className="text-muted-foreground">{String.fromCharCode(65 + oi)}.</span>
                    <span className="text-sm">{opt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}