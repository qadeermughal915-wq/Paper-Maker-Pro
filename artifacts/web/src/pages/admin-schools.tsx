import { useListAllSchools } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function AdminSchoolsPage() {
  const { data: schools, isLoading } = useListAllSchools();

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-secondary">All Schools</h1>
        <p className="text-muted-foreground mt-1">Platform-wide school directory.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">School Name</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Teachers</th>
                  <th className="px-4 py-3 font-medium">Questions</th>
                  <th className="px-4 py-3 font-medium">Papers</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {schools?.map(s => (
                  <tr key={s.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3">{s.packageName || "No Plan"}</td>
                    <td className="px-4 py-3 capitalize">{s.subscriptionStatus || "-"}</td>
                    <td className="px-4 py-3">{s.teacherCount}</td>
                    <td className="px-4 py-3">{s.questionCount}</td>
                    <td className="px-4 py-3">{s.paperCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!schools?.length && (
              <div className="p-8 text-center text-muted-foreground">No schools found.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}