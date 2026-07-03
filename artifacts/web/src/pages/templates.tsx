import { useState } from "react";
import {
  useListTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useListClasses,
  useListSubjects,
  getListTemplatesQueryKey,
  getListSubjectsQueryKey,
} from "@workspace/api-client-react";
import type { PaperTemplate } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import { DataGridPro, type ColDef } from "@/components/data-grid/data-grid-pro";
import { makeActionsColumn } from "@/components/data-grid/row-actions";
import { fmtDate, badgeRenderer } from "@/components/data-grid/cell-helpers";

interface FormState {
  id?: number;
  name: string;
  description: string;
  classId: string;
  subjectId: string;
  medium: string;
  totalMarks: string;
  durationMinutes: string;
}

const EMPTY: FormState = {
  name: "",
  description: "",
  classId: "",
  subjectId: "",
  medium: "english",
  totalMarks: "",
  durationMinutes: "",
};

export default function TemplatesPage() {
  const { data, isLoading, error, refetch } = useListTemplates();
  const { data: classes } = useListClasses();
  const [form, setForm] = useState<FormState>(EMPTY);
  const { data: subjects } = useListSubjects(
    { classId: Number(form.classId) || undefined },
    {
      query: {
        enabled: !!form.classId,
        queryKey: getListSubjectsQueryKey({
          classId: Number(form.classId) || undefined,
        }),
      },
    },
  );
  const [open, setOpen] = useState(false);

  const create = useCreateTemplate();
  const update = useUpdateTemplate();
  const remove = useDeleteTemplate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });

  const openCreate = () => {
    setForm(EMPTY);
    setOpen(true);
  };
  const openEdit = (t: PaperTemplate) => {
    setForm({
      id: t.id,
      name: t.name,
      description: t.description ?? "",
      classId: t.classId ? String(t.classId) : "",
      subjectId: t.subjectId ? String(t.subjectId) : "",
      medium: t.medium ?? "english",
      totalMarks: t.totalMarks != null ? String(t.totalMarks) : "",
      durationMinutes:
        t.durationMinutes != null ? String(t.durationMinutes) : "",
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description || undefined,
      classId: form.classId ? Number(form.classId) : undefined,
      subjectId: form.subjectId ? Number(form.subjectId) : undefined,
      medium: form.medium || undefined,
      totalMarks: form.totalMarks ? Number(form.totalMarks) : undefined,
      durationMinutes: form.durationMinutes
        ? Number(form.durationMinutes)
        : undefined,
    };
    const onSuccess = () => {
      invalidate();
      setOpen(false);
      toast({ title: form.id ? "Template updated" : "Template created" });
    };
    const onError = (err: Error) =>
      toast({ title: "Error", description: err.message, variant: "destructive" });

    if (form.id) {
      update.mutate({ id: form.id, data: payload }, { onSuccess, onError });
    } else {
      create.mutate({ data: payload }, { onSuccess, onError });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this template?")) return;
    remove.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: "Template deleted" });
        },
      },
    );
  };

  const columnDefs: ColDef<PaperTemplate>[] = [
    { field: "name", headerName: "Name", minWidth: 200, flex: 2 },
    {
      field: "className",
      headerName: "Class",
      minWidth: 120,
      valueFormatter: (p) => p.value ?? "Any",
    },
    {
      field: "subjectName",
      headerName: "Subject",
      minWidth: 140,
      valueFormatter: (p) => p.value ?? "Any",
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
    {
      field: "totalMarks",
      headerName: "Marks",
      minWidth: 100,
      filter: "agNumberColumnFilter",
      valueFormatter: (p) => (p.value != null ? String(p.value) : "—"),
    },
    {
      field: "durationMinutes",
      headerName: "Duration",
      minWidth: 120,
      filter: "agNumberColumnFilter",
      valueFormatter: (p) => (p.value != null ? `${p.value} min` : "—"),
    },
    {
      field: "createdAt",
      headerName: "Created",
      minWidth: 130,
      valueFormatter: (p) => fmtDate(p.value),
    },
    makeActionsColumn<PaperTemplate>((row) => [
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

  return (
    <>
      <DataGridPro
        tableKey="templates"
        title="Paper Templates"
        description="Reusable exam paper blueprints."
        columnDefs={columnDefs}
        rowData={data ?? []}
        loading={isLoading}
        error={error ?? undefined}
        getRowId={(r) => String(r.id)}
        onRefresh={() => refetch()}
        onAdd={openCreate}
        addLabel="New Template"
        exportFileName="paper-templates"
        emptyMessage="No templates yet. Create one to get started."
        bulkActions={[
          {
            label: "Delete selected",
            icon: <Trash2 className="h-4 w-4 mr-2" />,
            destructive: true,
            onClick: (rows) => {
              if (!confirm(`Delete ${rows.length} template(s)?`)) return;
              Promise.all(
                rows.map(
                  (r) =>
                    new Promise((res) =>
                      remove.mutate({ id: r.id }, { onSettled: () => res(null) }),
                    ),
                ),
              ).then(() => {
                invalidate();
                toast({ title: "Templates deleted" });
              });
            },
          },
        ]}
        enableSelection
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Edit Template" : "New Template"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Mid-Term Exam"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Optional description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select
                  value={form.classId}
                  onValueChange={(v) =>
                    setForm({ ...form, classId: v, subjectId: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select
                  value={form.subjectId}
                  onValueChange={(v) => setForm({ ...form, subjectId: v })}
                  disabled={!form.classId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects?.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Medium</Label>
                <Select
                  value={form.medium}
                  onValueChange={(v) => setForm({ ...form, medium: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="urdu">Urdu</SelectItem>
                    <SelectItem value="dual">Dual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Total Marks</Label>
                <Input
                  type="number"
                  value={form.totalMarks}
                  onChange={(e) =>
                    setForm({ ...form, totalMarks: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm({ ...form, durationMinutes: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={create.isPending || update.isPending}
              >
                {form.id ? "Save changes" : "Create template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
