import { useGetMe, useGetSchoolStats, useGetAdminStats, useGetRecentPapers, useGetQuestionsByType } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, BookOpen, Database, FileText, Building, DollarSign } from "lucide-react";

export default function DashboardPage() {
  const { data: me } = useGetMe();

  if (me?.role === "super_admin") {
    return <SuperAdminDashboard />;
  }

  return <SchoolDashboard />;
}

function SchoolDashboard() {
  const { data: stats, isLoading } = useGetSchoolStats();
  const { data: recentPapers } = useGetRecentPapers();
  const { data: types } = useGetQuestionsByType();

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-secondary">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your school's content.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Papers" value={stats?.papers} icon={FileText} />
        <StatCard title="Questions in Bank" value={stats?.questions} icon={Database} />
        <StatCard title="Classes Setup" value={stats?.classes} icon={BookOpen} />
        <StatCard title="Teachers" value={stats?.teachers} icon={Users} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Papers</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPapers?.length ? (
              <div className="space-y-4">
                {recentPapers.map(paper => (
                  <div key={paper.id} className="flex justify-between items-center p-3 rounded-lg border bg-card">
                    <div>
                      <p className="font-medium">{paper.title}</p>
                      <p className="text-sm text-muted-foreground">{paper.className} • {paper.subjectName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{paper.totalMarks} Marks</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No papers created yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Question Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {types?.length ? (
              <div className="space-y-3">
                {types.map(t => (
                  <div key={t.type} className="flex items-center justify-between">
                    <span className="capitalize text-sm font-medium">{t.type.replace('_', ' ')}</span>
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">{t.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">Question bank is empty.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SuperAdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats();

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-secondary">Platform Admin</h1>
        <p className="text-muted-foreground mt-1">Global platform metrics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Schools" value={stats?.schools} icon={Building} />
        <StatCard title="Total Teachers" value={stats?.teachers} icon={Users} />
        <StatCard title="Total Papers" value={stats?.papers} icon={FileText} />
        <StatCard title="Monthly Revenue" value={`Rs. ${stats?.revenue || 0}`} icon={DollarSign} />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value || 0}</div>
      </CardContent>
    </Card>
  );
}