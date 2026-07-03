import { useState } from "react";
import {
  useSearchQuestions,
  useListClasses,
  useListSubjects,
  useListChapters,
  useListTopics,
  useDeleteQuestion,
  getSearchQuestionsQueryKey,
  getListSubjectsQueryKey,
  getListChaptersQueryKey,
  getListTopicsQueryKey,
} from "@workspace/api-client-react";
import type { Question, QuestionType } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2 } from "lucide-react";
import { QuestionFormDialog } from "@/components/questions/question-form-dialog";
import { ImportQuestionsDialog } from "@/components/questions/import-questions-dialog";
import { DataGridPro, type ColDef } from "@/components/data-grid/data-grid-pro";
import { makeActionsColumn } from "@/components/data-grid/row-actions";
import { badgeRenderer } from "@/components/data-grid/cell-helpers";

export default function QuestionBankPage() {
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);

  const { data: classes } = useListClasses();
  const { data: subjects } = useListSubjects(
    { classId: Number(classId) || undefined },
    {
      query: {
        enabled: !!classId && classId !== "all",
        queryKey: getListSubjectsQueryKey({
          classId: Number(classId) || undefined,
        }),
      },
    },
  );
  const { data: chapters } = useListChapters(
    { subjectId: Number(subjectId) || undefined },
    {
      query: {
        enabled: !!subjectId && subjectId !== "all",
        queryKey: getListChaptersQueryKey({
          subjectId: Number(subjectId) || undefined,
        }),
      },
    },
  );
  const { data: topics } = useListTopics(
    { chapterId: Number(chapterId) || undefined },
    {
      query: {
        enabled: !!chapterId && chapterId !== "all",
        queryKey: getListTopicsQueryKey({
          chapterId: Number(chapterId) || undefined,
        }),
      },
    },
  );

  const activeClassId = classId && classId !== "all" ? Number(classId) : undefined;
  const activeSubjectId =
    subjectId && subjectId !== "all" ? Number(subjectId) : undefined;
  const activeChapterId =
    chapterId && chapterId !== "all" ? Number(chapterId) : undefined;
  const activeTopicId = topicId && topicId !== "all" ? Number(topicId) : undefined;
  const activeType = type && type !== "all" ? (type as QuestionType) : undefined;

  const params = {
    classId: activeClassId,
    subjectId: activeSubjectId,
    chapterId: activeChapterId,
    topicId: activeTopicId,
    type: activeType,
    search: search || undefined,
    page,
    pageSize,
    sortBy: sortBy || undefined,
    sortOrder: sortOrder || undefined,
  };

  const { data, isLoading, isFetching, error, refetch } = useSearchQuestions(
    params,
    { query: { queryKey: getSearchQuestionsQueryKey(params) } },
  );

  const deleteQuestion = useDeleteQuestion();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (q: Question) => {
    setEditing(q);
    setFormOpen(true);
  };

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getSearchQuestionsQueryKey() });

  const handleDelete = (id: number) => {
    if (!confirm("Delete question?")) return;
    deleteQuestion.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: "Question deleted" });
        },
      },
    );
  };

  const resetPage = () => setPage(0);

  const columnDefs: ColDef<Question>[] = [
    {
      field: "text",
      headerName: "Question",
      minWidth: 260,
      flex: 3,
      wrapText: false,
    },
    {
      field: "type",
      headerName: "Type",
      minWidth: 110,
      cellRenderer: badgeRenderer((v) => ({
        label: String(v).replace("_", " "),
        tone: "primary",
      })),
    },
    {
      field: "difficulty",
      headerName: "Difficulty",
      minWidth: 120,
      cellRenderer: badgeRenderer((v) => ({
        label: String(v),
        tone:
          v === "hard" ? "danger" : v === "medium" ? "warning" : "success",
      })),
    },
    {
      field: "marks",
      headerName: "Marks",
      minWidth: 90,
    },
    {
      field: "className",
      headerName: "Class",
      minWidth: 120,
      valueFormatter: (p) => p.value ?? "—",
    },
    {
      field: "subjectName",
      headerName: "Subject",
      minWidth: 140,
      valueFormatter: (p) => p.value ?? "—",
    },
    makeActionsColumn<Question>((row) => [
      {
        label: "Edit",
        icon: <Pencil className="h-4 w-4 mr-2" />,
        onClick: () => openEdit(row),
      },
      {
        label: "Delete",
        icon: <Trash2 className="h-4 w-4 mr-2" />,
        destructive: true,
        onClick: () => handleDelete(row.id),
      },
    ]),
  ];

  const filters = (
    <>
      <Select
        value={classId}
        onValueChange={(v) => {
          setClassId(v);
          setSubjectId("");
          setChapterId("");
          setTopicId("");
          resetPage();
        }}
      >
        <SelectTrigger className="h-9 w-[140px]">
          <SelectValue placeholder="Class" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Classes</SelectItem>
          {classes?.map((c) => (
            <SelectItem key={c.id} value={c.id.toString()}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={subjectId}
        onValueChange={(v) => {
          setSubjectId(v);
          setChapterId("");
          setTopicId("");
          resetPage();
        }}
        disabled={!classId || classId === "all"}
      >
        <SelectTrigger className="h-9 w-[140px]">
          <SelectValue placeholder="Subject" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Subjects</SelectItem>
          {subjects?.map((s) => (
            <SelectItem key={s.id} value={s.id.toString()}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={chapterId}
        onValueChange={(v) => {
          setChapterId(v);
          setTopicId("");
          resetPage();
        }}
        disabled={!subjectId || subjectId === "all"}
      >
        <SelectTrigger className="h-9 w-[140px]">
          <SelectValue placeholder="Chapter" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Chapters</SelectItem>
          {chapters?.map((c) => (
            <SelectItem key={c.id} value={c.id.toString()}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={topicId}
        onValueChange={(v) => {
          setTopicId(v);
          resetPage();
        }}
        disabled={!chapterId || chapterId === "all"}
      >
        <SelectTrigger className="h-9 w-[140px]">
          <SelectValue placeholder="Topic" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Topics</SelectItem>
          {topics?.map((t) => (
            <SelectItem key={t.id} value={t.id.toString()}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={type}
        onValueChange={(v) => {
          setType(v);
          resetPage();
        }}
      >
        <SelectTrigger className="h-9 w-[130px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="mcq">MCQ</SelectItem>
          <SelectItem value="short">Short Q</SelectItem>
          <SelectItem value="long">Long Q</SelectItem>
        </SelectContent>
      </Select>
    </>
  );

  return (
    <>
      <DataGridPro
        tableKey="question-bank"
        title="Question Bank"
        description="Manage and organize exam questions."
        columnDefs={columnDefs}
        rowData={data?.rows ?? []}
        loading={isLoading}
        error={error ?? undefined}
        getRowId={(r) => String(r.id)}
        onRefresh={() => refetch()}
        onAdd={openCreate}
        addLabel="Add Question"
        onImport={() => setImportOpen(true)}
        exportFileName="question-bank"
        toolbarFilters={filters}
        onClearFilters={() => {
          setClassId("");
          setSubjectId("");
          setChapterId("");
          setTopicId("");
          setType("");
          setSearch("");
          resetPage();
        }}
        emptyMessage="No questions found matching your filters."
        serverMode={{
          totalRows: data?.totalRows ?? 0,
          page,
          pageSize,
          loading: isFetching,
          onPaginationChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
          onSortChange: (by, order) => {
            setSortBy(by);
            setSortOrder(order);
            resetPage();
          },
          onSearchChange: (s) => {
            setSearch(s);
            resetPage();
          },
        }}
      />

      <QuestionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        question={editing}
      />
      <ImportQuestionsDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}
