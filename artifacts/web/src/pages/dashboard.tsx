import { Link } from "wouter";
import {
  useGetMe,
  useGetSchoolStats,
  useGetAdminStats,
  useListActivity,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Users,
  FileText,
  Building,
  DollarSign,
  LayoutTemplate,
  ClipboardList,
  Activity as ActivityIcon,
  Settings,
  Bell,
  CheckCircle2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export default function DashboardPage() {
  const { data: me } = useGetMe();

  if (me?.role === "super_admin") {
    return <SuperAdminDashboard />;
  }

  return <SchoolDashboard />;
}

function ActionTile({
  title,
  subtitle,
  icon: Icon,
  gradient,
  count,
  href,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  gradient: string;
  count?: number;
  href: string;
}) {
  return (
    <Link href={href}>
      <div
        className={`rounded-xl p-5 text-white shadow-sm cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-md ${gradient}`}
      >
        <div className="flex items-start justify-between">
          <div className="bg-white/20 rounded-lg p-2.5">
            <Icon className="h-6 w-6" />
          </div>
          {typeof count === "number" && (
            <span className="text-3xl font-bold leading-none">{count}</span>
          )}
        </div>
        <div className="mt-4">
          <p className="font-semibold text-base">{title}</p>
          {subtitle && <p className="text-xs text-white/80 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </Link>
  );
}

function timeAgo(dateStr?: string | null) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function SchoolDashboard() {
  const { data: stats, isLoading } = useGetSchoolStats();
  const { data: activity } = useListActivity();

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-secondary">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your school's content.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
          <ActionTile
            title="Generate Paper"
            subtitle="Create a new exam paper"
            icon={FileText}
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            href="/papers/new"
          />
          <ActionTile
            title="Templates"
            subtitle="Manage paper templates"
            icon={LayoutTemplate}
            gradient="bg-gradient-to-br from-green-500 to-green-600"
            href="/templates"
          />
          <ActionTile
            title="Saved Papers"
            subtitle="Download / Print Papers"
            icon={ClipboardList}
            gradient="bg-gradient-to-br from-orange-400 to-orange-500"
            count={stats?.papers ?? 0}
            href="/papers"
          />
          <ActionTile
            title="Teachers"
            subtitle="Manage teacher accounts"
            icon={Users}
            gradient="bg-gradient-to-br from-purple-500 to-purple-600"
            count={stats?.teachers ?? 0}
            href="/teachers"
          />
          <ActionTile
            title="Account Activities"
            subtitle="Check account activities"
            icon={ActivityIcon}
            gradient="bg-gradient-to-br from-teal-500 to-cyan-600"
            href="/activity"
          />
          <ActionTile
            title="Account Settings"
            subtitle="Update account settings"
            icon={Settings}
            gradient="bg-gradient-to-br from-red-500 to-red-600"
            href="/settings"
          />
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="bg-primary text-primary-foreground flex flex-row items-center gap-2 py-4">
            <Bell className="h-4 w-4" />
            <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {activity?.length ? (
              <div className="space-y-3 max-h-[420px] overflow-y-auto">
                {activity.slice(0, 15).map((item) => (
                  <div key={item.id} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-foreground">
                        <span className="font-medium">{item.actorName || "Someone"}</span>{" "}
                        {item.action}
                        {item.entity ? ` ${item.entity}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">{timeAgo(item.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No recent activity yet.
              </div>
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
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
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
