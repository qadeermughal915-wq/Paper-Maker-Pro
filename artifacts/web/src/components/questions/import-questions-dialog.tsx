import { useRef, useState } from "react";
import {
  useListClasses,
  useListSubjects,
  useListChapters,
  useImportQuestions,
  getListSubjectsQueryKey,
  getListChaptersQueryKey,
  getListQuestionsQueryKey,
} from "@workspace/api-client-react";
import type { QuestionImportRow, ImportResult } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle } from "lucide-react";

function parseRows(data: ArrayBuffer): QuestionImportRow[] {
  const wb = XLSX.read(data, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  return raw
    .map((r) => {
      const lower: Record<string, unknown> = {};
      for (const key of Object.keys(r)) lower[key.trim().toLowerCase()] = r[key];
      const text = String(lower["text"] ?? lower["question"] ?? "").trim();
      const optionsRaw = String(lower["options"] ?? "").trim();
      const options = optionsRaw
        ? optionsRaw.split(/[|;]/).map((o) => o.trim()).filter(Boolean)
        : undefined;
      const marksRaw = lower["marks"];
      const marks = marksRaw === "" || marksRaw == null ? undefined : Number(marksRaw);
      return {
        text,
        type: lower["type"] ? String(lower["type"]).trim().toLowerCase() : undefined,
        medium: lower["medium"] ? String(lower["medium"]).trim().toLowerCase() : undefined,
        difficulty: lower["difficulty"] ? String(lower["difficulty"]).trim().toLowerCase() : undefined,
        marks: Number.isFinite(marks) ? marks : undefined,
        options,
        answer: lower["answer"] ? String(lower["answer"]).trim() : undefined,
      } as QuestionImportRow;
    })
    .filter((r) => r.text.length > 0);
}

export function ImportQuestionsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [rows, setRows] = useState<QuestionImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  const { data: classes } = useListClasses();
  const { data: subjects } = useListSubjects(
    { classId: Number(classId) || undefined },
    { query: { enabled: !!classId, queryKey: getListSubjectsQueryKey({ classId: Number(classId) || undefined }) } },
  );
  const { data: chapters } = useListChapters(
    { subjectId: Number(subjectId) || undefined },
    { query: { enabled: !!subjectId, queryKey: getListChaptersQueryKey({ subjectId: Number(subjectId) || undefined }) } },
  );

  const importQuestions = useImportQuestions();

  const reset = () => {
    setClassId("");
    setSubjectId("");
    setChapterId("");
    setRows([]);
    setFileName("");
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const parsed = parseRows(buf);
      setRows(parsed);
      setFileName(file.name);
      setResult(null);
      if (!parsed.length) {
        toast({ title: "No rows found", description: "Ensure your file has a 'text' column.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Could not read file", description: "Please upload a valid CSV or Excel file.", variant: "destructive" });
    }
  };

  const handleImport = async () => {
    if (!classId || !subjectId || !rows.length) {
      toast({ title: "Missing fields", description: "Select class, subject and a file with questions.", variant: "destructive" });
      return;
    }
    try {
      const res = await importQuestions.mutateAsync({
        data: {
          classId: Number(classId),
          subjectId: Number(subjectId),
          chapterId: chapterId ? Number(chapterId) : null,
          rows,
        },
      });
      setResult(res);
      await queryClient.invalidateQueries({ queryKey: getListQuestionsQueryKey() });
      toast({ title: "Import complete", description: `${res.imported} imported, ${res.failed} failed.` });
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast({ title: "Import failed", description: message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Questions</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Upload a CSV or Excel file. Columns: <span className="font-medium">text</span> (required),
            {" "}type, medium, difficulty, marks, options (separate with | ), answer.
          </p>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Class</Label>
              <Select value={classId} onValueChange={(v) => { setClassId(v); setSubjectId(""); setChapterId(""); }}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {classes?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Select value={subjectId} onValueChange={(v) => { setSubjectId(v); setChapterId(""); }} disabled={!classId}>
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

          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/40 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {fileName ? (
              <div className="flex items-center justify-center gap-2 text-sm font-medium">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                {fileName} — {rows.length} question{rows.length === 1 ? "" : "s"} detected
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-6 w-6" />
                <span className="text-sm">Click to choose a CSV or Excel file</span>
              </div>
            )}
          </div>

          {result && (
            <div className="rounded-lg border p-4 space-y-2 bg-muted/20">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {result.imported} imported
                {result.failed > 0 && (
                  <span className="flex items-center gap-1 text-amber-600 ml-2">
                    <AlertTriangle className="h-4 w-4" /> {result.failed} failed
                  </span>
                )}
              </div>
              {result.errors.length > 0 && (
                <ul className="text-xs text-muted-foreground max-h-32 overflow-y-auto space-y-0.5">
                  {result.errors.map((e, i) => (
                    <li key={i}>Row {e.row}: {e.message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Close</Button>
          <Button onClick={handleImport} disabled={importQuestions.isPending || !rows.length}>
            {importQuestions.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import {rows.length > 0 ? `${rows.length} Questions` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
