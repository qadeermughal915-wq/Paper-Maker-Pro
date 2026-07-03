import {
  useListPapers,
  useDeletePaper,
  getListPapersQueryKey,
} from "@workspace/api-client-react";
import type { PaperSummary } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Edit2, FileDown, Trash2 } from "lucide-react";
import { DataGridPro, type ColDef } from "@/components/data-grid/data-grid-pro";
import { makeActionsColumn } from "@/components/data-grid/row-actions";
import { badgeRenderer } from "@/components/data-grid/cell-helpers";

export default function PapersPage() {
  const { data: papers, isLoading, error, refetch } = useListPapers();
  const deletePaper = useDeletePaper();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleDelete = (id: number) => {
    if (!confirm("Delete this paper?")) return;
    deletePaper.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPapersQueryKey() });
          toast({ title: "Paper deleted" });
        },
      },
    );
  };

  const openPdf = (id: number) =>
    window.open(`${import.meta.env.BASE_URL}api/papers/${id}/pdf`, "_blank");

  const columnDefs: ColDef<PaperSummary>[] = [
    { field: "title", headerName: "Title", minWidth: 200, flex: 2 },
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
    {
      field: "totalMarks",
      headerName: "Marks",
      minWidth: 100,
      filter: "agNumberColumnFilter",
    },
    {
      field: "questionCount",
      headerName: "Questions",
      minWidth: 110,
      filter: "agNumberColumnFilter",
    },
    {
      field: "medium",
      headerName: "Medium",
      minWidth: 110,
      cellRenderer: badgeRenderer((v) => ({
        label: String(v),
        tone: "secondary",
      })),
    },
    makeActionsColumn<PaperSummary>((row) => [
      {
        label: "Edit",
        icon: <Edit2 className="h-4 w-4 mr-2" />,
        onClick: () => navigate(`/papers/${row.id}`),
      },
      {
        label: "Download PDF",
        icon: <FileDown className="h-4 w-4 mr-2" />,
        onClick: () => row.id != null && openPdf(row.id),
      },
      {
        label: "Delete",
        icon: <Trash2 className="h-4 w-4 mr-2" />,
        destructive: true,
        onClick: () => row.id != null && handleDelete(row.id),
      },
    ]),
  ];

  return (
    <DataGridPro
      tableKey="papers"
      title="Exam Papers"
      description="Manage and generate printable papers."
      columnDefs={columnDefs}
      rowData={papers ?? []}
      loading={isLoading}
      error={error ?? undefined}
      getRowId={(r) => String(r.id)}
      onRefresh={() => refetch()}
      onAdd={() => navigate("/papers/new")}
      addLabel="New Paper"
      exportFileName="papers"
      emptyMessage="No papers yet. Create your first exam paper to get started."
    />
  );
}
