import { useListAllUsers } from "@workspace/api-client-react";
import type { AdminUser } from "@workspace/api-client-react";
import { DataGridPro, type ColDef } from "@/components/data-grid/data-grid-pro";
import {
  fmtDate,
  badgeRenderer,
  statusTone,
} from "@/components/data-grid/cell-helpers";

export default function AdminUsersPage() {
  const { data, isLoading, error, refetch } = useListAllUsers();

  const columnDefs: ColDef<AdminUser>[] = [
    {
      field: "name",
      headerName: "Name",
      minWidth: 160,
      valueFormatter: (p) => p.value ?? "—",
    },
    { field: "email", headerName: "Email", minWidth: 200, flex: 2 },
    {
      field: "role",
      headerName: "Role",
      minWidth: 140,
      valueFormatter: (p) => String(p.value ?? "").replace(/_/g, " "),
      cellRenderer: badgeRenderer((v) => ({
        label: String(v).replace(/_/g, " "),
        tone: v === "super_admin" ? "primary" : "secondary",
      })),
    },
    {
      field: "schoolName",
      headerName: "School",
      minWidth: 160,
      valueFormatter: (p) => p.value ?? "—",
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
      field: "createdAt",
      headerName: "Joined",
      minWidth: 130,
      filter: "agDateColumnFilter",
      valueFormatter: (p) => fmtDate(p.value),
    },
  ];

  return (
    <DataGridPro
      tableKey="admin-users"
      title="Users"
      description="All users across every school on the platform."
      columnDefs={columnDefs}
      rowData={data ?? []}
      loading={isLoading}
      error={error ?? undefined}
      getRowId={(r) => String(r.id)}
      onRefresh={() => refetch()}
      exportFileName="users"
      emptyMessage="No users found."
    />
  );
}
