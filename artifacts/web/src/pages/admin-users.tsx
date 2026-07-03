import { useState } from "react";
import { useListAllUsers } from "@workspace/api-client-react";
import type { AdminUser } from "@workspace/api-client-react";
import { DataGridPro, type ColDef } from "@/components/data-grid/data-grid-pro";
import {
  fmtDate,
  badgeRenderer,
  statusTone,
} from "@/components/data-grid/cell-helpers";
import { Button } from "@/components/ui/button";
import { UserCog, Loader2 } from "lucide-react";
import { useImpersonation } from "@/hooks/use-impersonation";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsersPage() {
  const { data, isLoading, error, refetch } = useListAllUsers();
  const { startImpersonation } = useImpersonation();
  const { toast } = useToast();
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);

  const handleLoginAs = async (row: AdminUser) => {
    setPendingUserId(row.id);
    try {
      await startImpersonation(row.id);
    } catch (err) {
      toast({
        title: "Failed to start impersonation",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPendingUserId(null);
    }
  };

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
    {
      colId: "actions",
      headerName: "Actions",
      minWidth: 150,
      sortable: false,
      filter: false,
      cellRenderer: (params: { data?: AdminUser }) => {
        const row = params.data;
        if (!row) return null;
        const disabled =
          !row.hasClerkAccount ||
          row.role === "super_admin" ||
          pendingUserId === row.id;
        return (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            disabled={disabled}
            onClick={() => handleLoginAs(row)}
            title={
              row.role === "super_admin"
                ? "Cannot impersonate a super admin"
                : !row.hasClerkAccount
                  ? "User has no Clerk account"
                  : "Login as this user"
            }
          >
            {pendingUserId === row.id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <UserCog className="h-3 w-3" />
            )}
            Login as
          </Button>
        );
      },
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
