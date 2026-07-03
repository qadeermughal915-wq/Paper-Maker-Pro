import { useState } from "react";
import { useListPackages, useCreatePackage, useUpdatePackage, useDeletePackage, getListPackagesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Edit2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AdminPackagesPage() {
  const { data: packages, isLoading } = useListPackages();
  const createPkg = useCreatePackage();
  const updatePkg = useUpdatePackage();
  const deletePkg = useDeletePackage();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [form, setForm] = useState({
    name: "", price: 0, billingPeriod: "month", maxTeachers: "", maxQuestions: "", maxPapers: "", isActive: true, features: ""
  });

  const handleOpen = (pkg?: any) => {
    if (pkg) {
      setEditingId(pkg.id);
      setForm({
        name: pkg.name, price: pkg.price, billingPeriod: pkg.billingPeriod || "month",
        maxTeachers: pkg.maxTeachers?.toString() || "", maxQuestions: pkg.maxQuestions?.toString() || "",
        maxPapers: pkg.maxPapers?.toString() || "", isActive: pkg.isActive !== false,
        features: pkg.features?.join("\n") || ""
      });
    } else {
      setEditingId(null);
      setForm({ name: "", price: 0, billingPeriod: "month", maxTeachers: "", maxQuestions: "", maxPapers: "", isActive: true, features: "" });
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
      features: form.features ? form.features.split("\n").filter(Boolean) : []
    };

    const action = editingId 
      ? updatePkg.mutateAsync({ id: editingId, data }) 
      : createPkg.mutateAsync({ data });

    action.then(() => {
      queryClient.invalidateQueries({ queryKey: getListPackagesQueryKey() });
      setIsOpen(false);
      toast({ title: editingId ? "Package updated" : "Package created" });
    }).catch(err => {
      toast({ title: "Error", description: err.error, variant: "destructive" });
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this package?")) return;
    deletePkg.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPackagesQueryKey() });
        toast({ title: "Package deleted" });
      }
    });
  };

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-secondary">Manage Packages</h1>
          <p className="text-muted-foreground mt-1">Platform subscription plans.</p>
        </div>
        <Button onClick={() => handleOpen()}><Plus className="h-4 w-4 mr-2"/> Add Package</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {packages?.map(p => (
          <Card key={p.id} className={!p.isActive ? "opacity-60" : ""}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{p.name}</h3>
                  <div className="text-2xl font-bold">Rs. {p.price}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpen(p)}><Edit2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Status: {p.isActive ? "Active" : "Inactive"}</p>
                <p>Teachers: {p.maxTeachers || "Unlimited"}</p>
                <p>Questions: {p.maxQuestions || "Unlimited"}</p>
                <p>Papers: {p.maxPapers || "Unlimited"}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Package" : "New Package"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Price</Label>
                <Input required type="number" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Max Teachers</Label>
                <Input type="number" placeholder="Unlimited" value={form.maxTeachers} onChange={e => setForm({...form, maxTeachers: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Max Questions</Label>
                <Input type="number" placeholder="Unlimited" value={form.maxQuestions} onChange={e => setForm({...form, maxQuestions: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Max Papers</Label>
                <Input type="number" placeholder="Unlimited" value={form.maxPapers} onChange={e => setForm({...form, maxPapers: e.target.value})} />
              </div>
              <div className="space-y-2 flex items-center justify-between pt-6">
                <Label>Active</Label>
                <Switch checked={form.isActive} onCheckedChange={c => setForm({...form, isActive: c})} />
              </div>
            </div>
            <Button type="submit" className="w-full">Save Package</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}