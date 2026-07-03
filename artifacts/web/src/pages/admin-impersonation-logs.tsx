import { useListImpersonationLogs } from "@workspace/api-client-react";
import type { ImpersonationLog } from "@workspace/api-client-react";
import { DataGridPro, type ColDef } from "@/components/data-grid/data-grid-pro";
import { fmtDateTime, badgeRenderer } from "@/components/data-grid/cell-helpers";

export default function AdminImpersonationLogsPage() {
  const { data, isLoading, error, refetch } = useListImpersonationLogs();

  const columnDefs: ColDef<ImpersonationLog>[] = [
    {
      field: "startTime",
      headerName: "Started",
      minWidth: 170,
      filter: "agDateColumnFilter",
      valueFormatter: (p) => fmtDateTime(p.value),
    },
    {
      field: "adminName",
      headerName: "Admin",
      minWidth: 160,
      valueFormatter: (p) => p.value ?? "—",
    },
    {
      field: "targetName",
      headerName: "Impersonated User",
      minWidth: 180,
      flex: 1,
      valueFormatter: (p) => p.value ?? "—",
    },
    {
      field: "isActive",
      headerName: "Status",
      minWidth: 120,
      cellRenderer: badgeRenderer((v) => ({
        label: v ? "Active" : "Ended",
        tone: v ? "primary" : "secondary",
      })),
    },
    {
      field: "endTime",
      headerName: "Ended",
      minWidth: 170,
      filter: "agDateColumnFilter",
      valueFormatter: (p) => (p.value ? fmtDateTime(p.value) : "—"),
    },
    {
      field: "ipAddress",
      headerName: "IP Address",
      minWidth: 140,
      valueFormatter: (p) => p.value ?? "—",
    },
  ];

  return (
    <DataGridPro
      tableKey="admin-impersonation-logs"
      title="Impersonation Audit Log"
      description="History of super admin 'login as user' sessions."
      columnDefs={columnDefs}
      rowData={data ?? []}
      loading={isLoading}
      error={error ?? undefined}
      getRowId={(r) => String(r.id)}
      onRefresh={() => refetch()}
      exportFileName="impersonation-logs"
      emptyMessage="No impersonation sessions recorded yet."
    />
  );
}
