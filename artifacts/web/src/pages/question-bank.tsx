import { useState } from "react";
import { useListQuestions, useListClasses, useListSubjects, useListChapters, useListTopics, useDeleteQuestion, getListQuestionsQueryKey, getListSubjectsQueryKey, getListChaptersQueryKey, getListTopicsQueryKey } from "@workspace/api-client-react";
import type { Question } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Upload, Trash2, Search, Pencil } from "lucide-react";
import { QuestionFormDialog } from "@/components/questions/question-form-dialog";
import { ImportQuestionsDialog } from "@/components/questions/import-questions-dialog";

export default function QuestionBankPage() {
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");

  const { data: classes } = useListClasses();
  const { data: subjects } = useListSubjects(
    { classId: Number(classId) || undefined },
    { query: { enabled: !!classId, queryKey: getListSubjectsQueryKey({ classId: Number(classId) || undefined }) } },
  );
  const { data: chapters } = useListChapters(
    { subjectId: Number(subjectId) || undefined },
    { query: { enabled: !!subjectId && subjectId !== "all", queryKey: getListChaptersQueryKey({ subjectId: Number(subjectId) || undefined }) } },
  );
  const { data: topics } = useListTopics(
    { chapterId: Number(chapterId) || undefined },
    { query: { enabled: !!chapterId && chapterId !== "all", queryKey: getListTopicsQueryKey({ chapterId: Number(chapterId) || undefined }) } },
  );

  const activeClassId = classId && classId !== "all" ? Number(classId) : undefined;
  const activeSubjectId = subjectId && subjectId !== "all" ? Number(subjectId) : undefined;
  const activeChapterId = chapterId && chapterId !== "all" ? Number(chapterId) : undefined;
  const activeTopicId = topicId && topicId !== "all" ? Number(topicId) : undefined;
  const activeType = type && type !== "all" ? type : undefined;

  const { data: questions, isLoading } = useListQuestions({
    classId: activeClassId,
    subjectId: activeSubjectId,
    chapterId: activeChapterId,
    topicId: activeTopicId,
    type: activeType as any,
    search: search || undefined
  });

  const deleteQuestion = useDeleteQuestion();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (q: Question) => { setEditing(q); setFormOpen(true); };

  const handleDelete = (id: number) => {
    if(!confirm("Delete question?")) return;
    deleteQuestion.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListQuestionsQueryKey() })
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-secondary">Question Bank</h1>
          <p className="text-muted-foreground mt-1">Manage and organize exam questions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4 mr-2"/> Import CSV</Button>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2"/> Add Question</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search questions..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={classId} onValueChange={v => { setClassId(v); setSubjectId(""); setChapterId(""); setTopicId(""); }}>
            <SelectTrigger><SelectValue placeholder="Filter by Class" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={subjectId} onValueChange={v => { setSubjectId(v); setChapterId(""); setTopicId(""); }} disabled={!classId || classId === "all"}>
            <SelectTrigger><SelectValue placeholder="Filter by Subject" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects?.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={chapterId} onValueChange={v => { setChapterId(v); setTopicId(""); }} disabled={!subjectId || subjectId === "all"}>
            <SelectTrigger><SelectValue placeholder="Filter by Chapter" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Chapters</SelectItem>
              {chapters?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={topicId} onValueChange={setTopicId} disabled={!chapterId || chapterId === "all"}>
            <SelectTrigger><SelectValue placeholder="Filter by Topic" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {topics?.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue placeholder="Filter by Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="mcq">MCQ</SelectItem>
              <SelectItem value="short">Short Q</SelectItem>
              <SelectItem value="long">Long Q</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="h-32 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-4">
          {questions?.map(q => (
            <Card key={q.id}>
              <CardContent className="p-4 flex gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2 text-xs text-muted-foreground font-medium">
                    <span className="bg-muted px-2 py-0.5 rounded capitalize">{q.type.replace('_', ' ')}</span>
                    <span className="bg-muted px-2 py-0.5 rounded capitalize">{q.difficulty}</span>
                    <span className="bg-muted px-2 py-0.5 rounded">{q.marks} Marks</span>
                    <span>{q.className} • {q.subjectName}</span>
                  </div>
                  <p className="text-sm font-medium line-clamp-2">{q.text}</p>
                </div>
                <div className="shrink-0 flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(q)}><Pencil className="h-4 w-4"/></Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(q.id)}><Trash2 className="h-4 w-4"/></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {!questions?.length && (
            <div className="text-center p-12 border rounded-xl bg-muted/20">No questions found matching your filters.</div>
          )}
        </div>
      )}

      <QuestionFormDialog open={formOpen} onOpenChange={setFormOpen} question={editing} />
      <ImportQuestionsDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}