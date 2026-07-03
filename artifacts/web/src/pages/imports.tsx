import { useListImports } from "@workspace/api-client-react";
import type { ImportRecord } from "@workspace/api-client-react";
import { DataGridPro, type ColDef } from "@/components/data-grid/data-grid-pro";
import {
  fmtDateTime,
  badgeRenderer,
  statusTone,
} from "@/components/data-grid/cell-helpers";

export default function ImportsPage() {
  const { data, isLoading, error, refetch } = useListImports();

  const columnDefs: ColDef<ImportRecord>[] = [
    {
      field: "createdAt",
      headerName: "When",
      minWidth: 160,
      filter: "agDateColumnFilter",
      valueFormatter: (p) => fmtDateTime(p.value),
    },
    { field: "fileName", headerName: "File", minWidth: 200, flex: 2 },
    {
      field: "actorName",
      headerName: "User",
      minWidth: 150,
      valueFormatter: (p) => p.value ?? "System",
    },
    {
      field: "total",
      headerName: "Total",
      minWidth: 100,
      filter: "agNumberColumnFilter",
    },
    {
      field: "imported",
      headerName: "Imported",
      minWidth: 110,
      filter: "agNumberColumnFilter",
    },
    {
      field: "failed",
      headerName: "Failed",
      minWidth: 100,
      filter: "agNumberColumnFilter",
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 150,
      cellRenderer: badgeRenderer((v) => ({
        label: String(v).replace(/_/g, " "),
        tone: statusTone(String(v)),
      })),
    },
  ];

  return (
    <DataGridPro
      tableKey="imports"
      title="Import History"
      description="Records of question imports and their results."
      columnDefs={columnDefs}
      rowData={data ?? []}
      loading={isLoading}
      error={error ?? undefined}
      getRowId={(r) => String(r.id)}
      onRefresh={() => refetch()}
      exportFileName="import-history"
      emptyMessage="No imports yet."
    />
  );
}
