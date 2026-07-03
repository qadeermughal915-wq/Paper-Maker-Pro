import { useListAllSchools } from "@workspace/api-client-react";
import type { AdminSchool } from "@workspace/api-client-react";
import { DataGridPro, type ColDef } from "@/components/data-grid/data-grid-pro";
import {
  fmtDate,
  badgeRenderer,
  statusTone,
} from "@/components/data-grid/cell-helpers";

export default function AdminSchoolsPage() {
  const { data: schools, isLoading, error, refetch } = useListAllSchools();

  const columnDefs: ColDef<AdminSchool>[] = [
    { field: "name", headerName: "School Name", minWidth: 180, flex: 2 },
    {
      field: "packageName",
      headerName: "Plan",
      minWidth: 130,
      valueFormatter: (p) => p.value ?? "No Plan",
    },
    {
      field: "subscriptionStatus",
      headerName: "Status",
      minWidth: 120,
      cellRenderer: badgeRenderer((v) => ({
        label: String(v),
        tone: statusTone(String(v)),
      })),
      valueFormatter: (p) => p.value ?? "—",
    },
    {
      field: "teacherCount",
      headerName: "Teachers",
      minWidth: 110,
      filter: "agNumberColumnFilter",
    },
    {
      field: "questionCount",
      headerName: "Questions",
      minWidth: 110,
      filter: "agNumberColumnFilter",
    },
    {
      field: "paperCount",
      headerName: "Papers",
      minWidth: 100,
      filter: "agNumberColumnFilter",
    },
    {
      field: "createdAt",
      headerName: "Joined",
      minWidth: 130,
      filter: "agDateColumnFilter",
      valueFormatter: (p) => fmtDate(p.value),
    },
  ];

  return (
    <DataGridPro
      tableKey="admin-schools"
      title="All Schools"
      description="Platform-wide school directory."
      columnDefs={columnDefs}
      rowData={schools ?? []}
      loading={isLoading}
      error={error ?? undefined}
      getRowId={(r) => String(r.id)}
      onRefresh={() => refetch()}
      exportFileName="schools"
      emptyMessage="No schools found."
    />
  );
}
