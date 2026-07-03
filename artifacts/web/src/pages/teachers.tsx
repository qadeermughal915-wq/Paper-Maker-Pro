import { useState } from "react";
import { useListTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher, getListTeachersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2, Plus, Edit2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function TeachersPage() {
  const { data: teachers, isLoading } = useListTeachers();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  
  const createTeacher = useCreateTeacher();
  const deleteTeacher = useDeleteTeacher();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    createTeacher.mutate(
      { data: { name, email } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTeachersQueryKey() });
          setIsAddOpen(false);
          setName("");
          setEmail("");
          toast({ title: "Teacher added successfully" });
        },
        onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" })
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to remove this teacher?")) return;
    deleteTeacher.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTeachersQueryKey() });
          toast({ title: "Teacher removed" });
        }
      }
    );
  };

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-secondary">Teachers</h1>
          <p className="text-muted-foreground mt-1">Manage staff access to your school.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2"/> Add Teacher</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Teacher</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" />
              </div>
              <Button type="submit" className="w-full" disabled={createTeacher.isPending}>
                {createTeacher.isPending ? "Adding..." : "Add Teacher"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {!teachers?.length ? (
            <div className="p-8 text-center text-muted-foreground border-b last:border-0">No teachers found. Add one to get started.</div>
          ) : (
            <div className="divide-y">
              {teachers.map(t => (
                <div key={t.id} className="flex items-center justify-between p-4">
                  <div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-sm text-muted-foreground">{t.email}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs px-2 py-1 bg-muted rounded-full capitalize">{t.role.replace('_', ' ')}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${t.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                      {t.status}
                    </span>
                    {t.role !== 'school_admin' && (
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(t.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}