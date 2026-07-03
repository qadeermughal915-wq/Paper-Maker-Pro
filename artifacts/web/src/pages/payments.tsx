import {
  useListPayments,
} from "@workspace/api-client-react";
import type { Payment } from "@workspace/api-client-react";
import { DataGridPro, type ColDef } from "@/components/data-grid/data-grid-pro";
import {
  fmtDate,
  fmtCurrency,
  badgeRenderer,
  statusTone,
} from "@/components/data-grid/cell-helpers";

export default function PaymentsPage() {
  const { data, isLoading, error, refetch } = useListPayments();

  const columnDefs: ColDef<Payment>[] = [
    { field: "reference", headerName: "Reference", minWidth: 160 },
    {
      field: "packageName",
      headerName: "Package",
      minWidth: 130,
      valueFormatter: (p) => p.value ?? "—",
    },
    {
      field: "amount",
      headerName: "Amount",
      minWidth: 130,
      filter: "agNumberColumnFilter",
      valueFormatter: (p) => fmtCurrency(p.value, p.data?.currency ?? "PKR"),
    },
    {
      field: "method",
      headerName: "Method",
      minWidth: 130,
      valueFormatter: (p) => String(p.value ?? "—").replace("_", " "),
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 120,
      cellRenderer: badgeRenderer((v) => ({
        label: String(v),
        tone: statusTone(String(v)),
      })),
    },
    {
      field: "paidAt",
      headerName: "Date",
      minWidth: 130,
      filter: "agDateColumnFilter",
      valueFormatter: (p) => fmtDate(p.value ?? p.data?.createdAt),
    },
  ];

  return (
    <DataGridPro
      tableKey="payments"
      title="Payments"
      description="Billing history and transaction records."
      columnDefs={columnDefs}
      rowData={data ?? []}
      loading={isLoading}
      error={error ?? undefined}
      getRowId={(r) => String(r.id)}
      onRefresh={() => refetch()}
      exportFileName="payments"
      emptyMessage="No payments recorded yet."
    />
  );
}
