import { useState } from "react";
import {
  useListTeachers,
  useCreateTeacher,
  useUpdateTeacher,
  useDeleteTeacher,
  getListTeachersQueryKey,
} from "@workspace/api-client-react";
import type { Teacher } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataGridPro, type ColDef } from "@/components/data-grid/data-grid-pro";
import { makeActionsColumn } from "@/components/data-grid/row-actions";
import { fmtDate, badgeRenderer } from "@/components/data-grid/cell-helpers";

export default function TeachersPage() {
  const { data: teachers, isLoading, error, refetch } = useListTeachers();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const deleteTeacher = useDeleteTeacher();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListTeachersQueryKey() });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    createTeacher.mutate(
      { data: { name, email } },
      {
        onSuccess: () => {
          invalidate();
          setIsAddOpen(false);
          setName("");
          setEmail("");
          toast({ title: "Teacher added successfully" });
        },
        onError: (err) =>
          toast({
            title: "Error",
            description: err.message,
            variant: "destructive",
          }),
      },
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to remove this teacher?")) return;
    deleteTeacher.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: "Teacher removed" });
        },
      },
    );
  };

  const columnDefs: ColDef<Teacher>[] = [
    { field: "name", headerName: "Name", editable: true, minWidth: 160 },
    { field: "email", headerName: "Email", editable: false, minWidth: 200 },
    {
      field: "role",
      headerName: "Role",
      minWidth: 130,
      valueFormatter: (p) => String(p.value ?? "").replace("_", " "),
      cellRenderer: badgeRenderer((v) => ({
        label: String(v).replace("_", " "),
        tone: v === "school_admin" ? "secondary" : "muted",
      })),
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 120,
      cellRenderer: badgeRenderer((v) => ({
        label: String(v),
        tone: v === "active" ? "success" : "muted",
      })),
    },
    {
      field: "createdAt",
      headerName: "Joined",
      minWidth: 130,
      editable: false,
      valueFormatter: (p) => fmtDate(p.value),
    },
    makeActionsColumn<Teacher>((row) => [
      {
        label: "Remove",
        icon: <Trash2 className="h-4 w-4 mr-2" />,
        destructive: true,
        hidden: () => row.role === "school_admin",
        onClick: () => handleDelete(row.id),
      },
    ]),
  ];

  return (
    <>
      <DataGridPro
        tableKey="teachers"
        title="Teachers"
        description="Manage staff access to your school."
        columnDefs={columnDefs}
        rowData={teachers ?? []}
        loading={isLoading}
        error={error ?? undefined}
        getRowId={(r) => String(r.id)}
        onRefresh={() => refetch()}
        onAdd={() => setIsAddOpen(true)}
        addLabel="Add Teacher"
        enableSelection
        bulkActions={[
          {
            label: "Remove selected",
            icon: <Trash2 className="h-4 w-4 mr-2" />,
            destructive: true,
            onClick: (rows) => {
              const removable = rows.filter((r) => r.role !== "school_admin");
              if (!removable.length) return;
              if (!confirm(`Remove ${removable.length} teacher(s)?`)) return;
              Promise.all(
                removable.map(
                  (r) =>
                    new Promise((res) =>
                      deleteTeacher.mutate({ id: r.id }, { onSettled: () => res(null) }),
                    ),
                ),
              ).then(() => {
                invalidate();
                toast({ title: "Teachers removed" });
              });
            },
          },
        ]}
        onCellEdited={(row, field, value) => {
          if (field !== "name") return;
          updateTeacher.mutate(
            { id: row.id, data: { name: String(value) } },
            {
              onSuccess: () => toast({ title: "Teacher updated" }),
              onError: (err) => {
                invalidate();
                toast({
                  title: "Error",
                  description: err.message,
                  variant: "destructive",
                });
              },
            },
          );
        }}
      />

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Teacher</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={createTeacher.isPending}
            >
              {createTeacher.isPending ? "Adding..." : (
                <>
                  <Plus className="h-4 w-4 mr-2" /> Add Teacher
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
