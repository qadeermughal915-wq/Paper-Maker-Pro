import { useState } from "react";
import { useListClasses, useCreateClass, useDeleteClass, useListSubjects, useCreateSubject, useDeleteSubject, useListChapters, useCreateChapter, useDeleteChapter, useListTopics, useCreateTopic, useDeleteTopic, getListClassesQueryKey, getListSubjectsQueryKey, getListChaptersQueryKey, getListTopicsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, ChevronRight } from "lucide-react";

export default function CurriculumPage() {
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);

  const { data: classes, isLoading: loadingClasses } = useListClasses();
  const { data: subjects, isLoading: loadingSubjects } = useListSubjects({ classId: selectedClass || undefined }, { query: { enabled: !!selectedClass, queryKey: getListSubjectsQueryKey({ classId: selectedClass || undefined }) } });
  const { data: chapters, isLoading: loadingChapters } = useListChapters({ subjectId: selectedSubject || undefined }, { query: { enabled: !!selectedSubject, queryKey: getListChaptersQueryKey({ subjectId: selectedSubject || undefined }) } });
  const { data: topics, isLoading: loadingTopics } = useListTopics({ chapterId: selectedChapter || undefined }, { query: { enabled: !!selectedChapter, queryKey: getListTopicsQueryKey({ chapterId: selectedChapter || undefined }) } });

  const queryClient = useQueryClient();
  const createClass = useCreateClass();
  const deleteClass = useDeleteClass();
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();
  const createChapter = useCreateChapter();
  const deleteChapter = useDeleteChapter();
  const createTopic = useCreateTopic();
  const deleteTopic = useDeleteTopic();

  const handleCreate = (type: string, parentId?: number | null) => {
    const name = prompt(`Enter ${type} name:`);
    if (!name) return;

    if (type === 'Class') {
      createClass.mutate({ data: { name } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() }) });
    } else if (type === 'Subject' && parentId) {
      createSubject.mutate({ data: { name, classId: parentId } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey({ classId: parentId }) }) });
    } else if (type === 'Chapter' && parentId) {
      createChapter.mutate({ data: { name, subjectId: parentId } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListChaptersQueryKey({ subjectId: parentId }) }) });
    } else if (type === 'Topic' && parentId) {
      createTopic.mutate({ data: { name, chapterId: parentId } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTopicsQueryKey({ chapterId: parentId }) }) });
    }
  };

  const handleDelete = (type: string, id: number, parentId?: number | null) => {
    if (!confirm("Are you sure?")) return;
    if (type === 'Class') {
      deleteClass.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() }) });
      if (selectedClass === id) setSelectedClass(null);
    } else if (type === 'Subject') {
      deleteSubject.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey({ classId: parentId! }) }) });
      if (selectedSubject === id) setSelectedSubject(null);
    } else if (type === 'Chapter') {
      deleteChapter.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListChaptersQueryKey({ subjectId: parentId! }) }) });
      if (selectedChapter === id) setSelectedChapter(null);
    } else if (type === 'Topic') {
      deleteTopic.mutate({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTopicsQueryKey({ chapterId: parentId! }) }) });
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-secondary">Curriculum</h1>
        <p className="text-muted-foreground mt-1">Manage classes, subjects, and topics.</p>
      </div>

      <div className="grid grid-cols-4 gap-4 flex-1">
        {/* Classes */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="bg-muted/30 py-3 px-4 flex flex-row items-center justify-between border-b">
            <CardTitle className="text-sm">Classes</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCreate('Class')}><Plus className="h-4 w-4"/></Button>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1">
            {loadingClasses ? <div className="p-4 text-center"><Loader2 className="animate-spin inline" /></div> : (
              <ul className="divide-y">
                {classes?.map(c => (
                  <li key={c.id} className={`flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 ${selectedClass === c.id ? 'bg-primary/10 border-l-2 border-primary' : ''}`} onClick={() => { setSelectedClass(c.id); setSelectedSubject(null); setSelectedChapter(null); }}>
                    <span className="text-sm font-medium truncate">{c.name}</span>
                    <div className="flex items-center">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleDelete('Class', c.id); }}><Trash2 className="h-3 w-3"/></Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Subjects */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="bg-muted/30 py-3 px-4 flex flex-row items-center justify-between border-b">
            <CardTitle className="text-sm">Subjects</CardTitle>
            {selectedClass && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCreate('Subject', selectedClass)}><Plus className="h-4 w-4"/></Button>}
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1">
            {!selectedClass ? <div className="p-4 text-center text-sm text-muted-foreground">Select a class</div> : loadingSubjects ? <div className="p-4 text-center"><Loader2 className="animate-spin inline" /></div> : (
              <ul className="divide-y">
                {subjects?.map(s => (
                  <li key={s.id} className={`flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 ${selectedSubject === s.id ? 'bg-primary/10 border-l-2 border-primary' : ''}`} onClick={() => { setSelectedSubject(s.id); setSelectedChapter(null); }}>
                    <span className="text-sm font-medium truncate">{s.name}</span>
                    <div className="flex items-center">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive opacity-0 hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleDelete('Subject', s.id, selectedClass); }}><Trash2 className="h-3 w-3"/></Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Chapters */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="bg-muted/30 py-3 px-4 flex flex-row items-center justify-between border-b">
            <CardTitle className="text-sm">Chapters</CardTitle>
            {selectedSubject && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCreate('Chapter', selectedSubject)}><Plus className="h-4 w-4"/></Button>}
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1">
            {!selectedSubject ? <div className="p-4 text-center text-sm text-muted-foreground">Select a subject</div> : loadingChapters ? <div className="p-4 text-center"><Loader2 className="animate-spin inline" /></div> : (
              <ul className="divide-y">
                {chapters?.map(c => (
                  <li key={c.id} className={`flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 ${selectedChapter === c.id ? 'bg-primary/10 border-l-2 border-primary' : ''}`} onClick={() => setSelectedChapter(c.id)}>
                    <span className="text-sm font-medium truncate">{c.name}</span>
                    <div className="flex items-center">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive opacity-0 hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleDelete('Chapter', c.id, selectedSubject); }}><Trash2 className="h-3 w-3"/></Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Topics */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="bg-muted/30 py-3 px-4 flex flex-row items-center justify-between border-b">
            <CardTitle className="text-sm">Topics</CardTitle>
            {selectedChapter && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCreate('Topic', selectedChapter)}><Plus className="h-4 w-4"/></Button>}
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1">
            {!selectedChapter ? <div className="p-4 text-center text-sm text-muted-foreground">Select a chapter</div> : loadingTopics ? <div className="p-4 text-center"><Loader2 className="animate-spin inline" /></div> : (
              <ul className="divide-y">
                {topics?.map(t => (
                  <li key={t.id} className="flex items-center justify-between p-3 hover:bg-muted/50">
                    <span className="text-sm font-medium truncate">{t.name}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive opacity-0 hover:opacity-100 transition-opacity" onClick={() => handleDelete('Topic', t.id, selectedChapter)}><Trash2 className="h-3 w-3"/></Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}