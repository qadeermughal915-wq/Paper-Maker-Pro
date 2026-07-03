import { useListPapers, useDeletePaper, getListPapersQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Edit2, FileDown, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function PapersPage() {
  const { data: papers, isLoading } = useListPapers();
  const deletePaper = useDeletePaper();
  const queryClient = useQueryClient();

  const handleDelete = (id: number) => {
    if (!confirm("Delete this paper?")) return;
    deletePaper.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListPapersQueryKey() })
    });
  };

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-secondary">Exam Papers</h1>
          <p className="text-muted-foreground mt-1">Manage and generate printable papers.</p>
        </div>
        <Link href="/papers/new">
          <Button><Plus className="h-4 w-4 mr-2"/> New Paper</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {papers?.map(p => (
          <Card key={p.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-1 truncate" title={p.title}>{p.title}</h3>
              <div className="text-sm text-muted-foreground mb-4">
                {p.className} • {p.subjectName}
              </div>
              <div className="flex items-center justify-between text-sm mb-6 bg-muted/50 p-2 rounded">
                <div><span className="font-semibold">{p.totalMarks}</span> Marks</div>
                <div><span className="font-semibold">{p.questionCount}</span> Qs</div>
                <div className="capitalize">{p.medium}</div>
              </div>
              <div className="flex gap-2 justify-end">
                <Link href={`/papers/${p.id}`}>
                  <Button variant="outline" size="sm"><Edit2 className="h-4 w-4 mr-2"/> Edit</Button>
                </Link>
                <Button variant="default" size="sm" onClick={() => window.open(`${import.meta.env.BASE_URL}api/papers/${p.id}/pdf`, '_blank')}>
                  <FileDown className="h-4 w-4 mr-2"/> PDF
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!papers?.length && (
          <div className="col-span-full p-12 text-center border rounded-xl border-dashed">
            <h3 className="text-lg font-medium text-foreground">No papers yet</h3>
            <p className="text-muted-foreground mt-1 mb-4">Create your first exam paper to get started.</p>
            <Link href="/papers/new">
              <Button><Plus className="h-4 w-4 mr-2"/> New Paper</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}