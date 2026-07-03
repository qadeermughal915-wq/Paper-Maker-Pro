import { useListActivity } from "@workspace/api-client-react";
import type { Activity } from "@workspace/api-client-react";
import { DataGridPro, type ColDef } from "@/components/data-grid/data-grid-pro";
import { fmtDateTime, badgeRenderer } from "@/components/data-grid/cell-helpers";

export default function ActivityPage() {
  const { data, isLoading, error, refetch } = useListActivity();

  const columnDefs: ColDef<Activity>[] = [
    {
      field: "createdAt",
      headerName: "When",
      minWidth: 160,
      filter: "agDateColumnFilter",
      valueFormatter: (p) => fmtDateTime(p.value),
    },
    {
      field: "actorName",
      headerName: "User",
      minWidth: 150,
      valueFormatter: (p) => p.value ?? "System",
    },
    {
      field: "action",
      headerName: "Action",
      minWidth: 160,
      valueFormatter: (p) => String(p.value ?? "").replace(/_/g, " "),
      cellRenderer: badgeRenderer((v) => ({
        label: String(v).replace(/_/g, " "),
        tone: "primary",
      })),
    },
    {
      field: "entity",
      headerName: "Entity",
      minWidth: 120,
      valueFormatter: (p) => p.value ?? "—",
    },
    {
      field: "detail",
      headerName: "Details",
      minWidth: 240,
      flex: 2,
      valueFormatter: (p) => p.value ?? "—",
    },
  ];

  return (
    <DataGridPro
      tableKey="activity"
      title="Activity Log"
      description="Recent actions across your school."
      columnDefs={columnDefs}
      rowData={data ?? []}
      loading={isLoading}
      error={error ?? undefined}
      getRowId={(r) => String(r.id)}
      onRefresh={() => refetch()}
      exportFileName="activity-log"
      emptyMessage="No activity recorded yet."
    />
  );
}
