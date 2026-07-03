import { useState } from "react";
import {
  useListPackages,
  useCreatePackage,
  useUpdatePackage,
  useDeletePackage,
  getListPackagesQueryKey,
} from "@workspace/api-client-react";
import type { Package } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Edit2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataGridPro, type ColDef } from "@/components/data-grid/data-grid-pro";
import { makeActionsColumn } from "@/components/data-grid/row-actions";
import { fmtCurrency, badgeRenderer } from "@/components/data-grid/cell-helpers";

export default function AdminPackagesPage() {
  const { data: packages, isLoading, error, refetch } = useListPackages();
  const createPkg = useCreatePackage();
  const updatePkg = useUpdatePackage();
  const deletePkg = useDeletePackage();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "",
    price: 0,
    billingPeriod: "month",
    maxTeachers: "",
    maxQuestions: "",
    maxPapers: "",
    isActive: true,
    features: "",
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListPackagesQueryKey() });

  const handleOpen = (pkg?: Package) => {
    if (pkg) {
      setEditingId(pkg.id);
      setForm({
        name: pkg.name,
        price: pkg.price,
        billingPeriod: pkg.billingPeriod || "month",
        maxTeachers: pkg.maxTeachers?.toString() || "",
        maxQuestions: pkg.maxQuestions?.toString() || "",
        maxPapers: pkg.maxPapers?.toString() || "",
        isActive: pkg.isActive !== false,
        features: pkg.features?.join("\n") || "",
      });
    } else {
      setEditingId(null);
      setForm({
        name: "",
        price: 0,
        billingPeriod: "month",
        maxTeachers: "",
        maxQuestions: "",
        maxPapers: "",
        isActive: true,
        features: "",
      });
    }
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name,
      price: Number(form.price),
      billingPeriod: form.billingPeriod,
      maxTeachers: form.maxTeachers ? Number(form.maxTeachers) : undefined,
      maxQuestions: form.maxQuestions ? Number(form.maxQuestions) : undefined,
      maxPapers: form.maxPapers ? Number(form.maxPapers) : undefined,
      isActive: form.isActive,
      features: form.features ? form.features.split("\n").filter(Boolean) : [],
    };

    const action = editingId
      ? updatePkg.mutateAsync({ id: editingId, data })
      : createPkg.mutateAsync({ data });

    action
      .then(() => {
        invalidate();
        setIsOpen(false);
        toast({ title: editingId ? "Package updated" : "Package created" });
      })
      .catch((err) => {
        toast({
          title: "Error",
          description: err.error ?? err.message,
          variant: "destructive",
        });
      });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this package?")) return;
    deletePkg.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: "Package deleted" });
        },
      },
    );
  };

  const columnDefs: ColDef<Package>[] = [
    { field: "name", headerName: "Name", minWidth: 160, flex: 2 },
    {
      field: "price",
      headerName: "Price",
      minWidth: 130,
      filter: "agNumberColumnFilter",
      valueFormatter: (p) => fmtCurrency(p.value, "Rs."),
    },
    {
      field: "billingPeriod",
      headerName: "Billing",
      minWidth: 110,
      valueFormatter: (p) => p.value ?? "—",
    },
    {
      field: "maxTeachers",
      headerName: "Teachers",
      minWidth: 110,
      valueFormatter: (p) => p.value ?? "Unlimited",
    },
    {
      field: "maxQuestions",
      headerName: "Questions",
      minWidth: 110,
      valueFormatter: (p) => p.value ?? "Unlimited",
    },
    {
      field: "maxPapers",
      headerName: "Papers",
      minWidth: 100,
      valueFormatter: (p) => p.value ?? "Unlimited",
    },
    {
      field: "isActive",
      headerName: "Status",
      minWidth: 110,
      cellRenderer: badgeRenderer((v) => ({
        label: v ? "Active" : "Inactive",
        tone: v ? "success" : "muted",
      })),
    },
    makeActionsColumn<Package>((row) => [
      {
        label: "Edit",
        icon: <Edit2 className="h-4 w-4 mr-2" />,
        onClick: () => handleOpen(row),
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
        tableKey="admin-packages"
        title="Manage Packages"
        description="Platform subscription plans."
        columnDefs={columnDefs}
        rowData={packages ?? []}
        loading={isLoading}
        error={error ?? undefined}
        getRowId={(r) => String(r.id)}
        onRefresh={() => refetch()}
        onAdd={() => handleOpen()}
        addLabel="Add Package"
        exportFileName="packages"
        emptyMessage="No packages yet."
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Package" : "New Package"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Price</Label>
                <Input
                  required
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Max Teachers</Label>
                <Input
                  type="number"
                  placeholder="Unlimited"
                  value={form.maxTeachers}
                  onChange={(e) =>
                    setForm({ ...form, maxTeachers: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Max Questions</Label>
                <Input
                  type="number"
                  placeholder="Unlimited"
                  value={form.maxQuestions}
                  onChange={(e) =>
                    setForm({ ...form, maxQuestions: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Max Papers</Label>
                <Input
                  type="number"
                  placeholder="Unlimited"
                  value={form.maxPapers}
                  onChange={(e) =>
                    setForm({ ...form, maxPapers: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2 flex items-center justify-between pt-6">
                <Label>Active</Label>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(c) => setForm({ ...form, isActive: c })}
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Save Package
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
