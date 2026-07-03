import { Link, useLocation } from "wouter";
import {
  useGetMe,
  useGetSchool,
  useGetSubscription,
  getGetSchoolQueryKey,
  getGetSubscriptionQueryKey,
} from "@workspace/api-client-react";
import { UserButton } from "@clerk/react";
import logoIcon from "@assets/image_1783062400058.png";
import type { LucideIcon } from "lucide-react";
import { UserCog } from "lucide-react";
import { 
  LayoutDashboard, 
  BookOpen, 
  Database, 
  FileText, 
  Users, 
  Settings, 
  Package,
  Building,
  Menu,
  CreditCard,
  Activity,
  Upload,
  LayoutTemplate
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

function ValidTillBadge({ expiresAt }: { expiresAt?: string | null }) {
  if (!expiresAt) return null;
  const expired = new Date(expiresAt).getTime() < Date.now();
  const formatted = new Date(expiresAt)
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();

  return (
    <div
      className={`w-full text-center rounded-md py-1.5 text-xs font-bold tracking-wide ${
        expired ? "bg-destructive text-destructive-foreground" : "bg-emerald-500 text-white"
      }`}
    >
      {expired ? "EXPIRED" : "VALID TILL"} {formatted}
    </div>
  );
}

function SchoolProfileCard() {
  const { data: me } = useGetMe();
  const role = me?.role;
  const enabled = !!role && role !== "super_admin";
  const { data: school } = useGetSchool({ query: { enabled, queryKey: getGetSchoolQueryKey() } });
  const { data: subscription } = useGetSubscription({ query: { enabled, queryKey: getGetSubscriptionQueryKey() } });

  if (!enabled) return null;

  const roleLabel = role === "school_admin" ? "Administrator" : role === "teacher" ? "Teacher" : role;

  return (
    <div className="mx-4 mt-4 rounded-lg bg-sidebar-accent/40 border border-sidebar-border/50 p-4 flex flex-col items-center text-center gap-2">
      {school?.logoUrl ? (
        <img src={school.logoUrl} alt={school?.name} className="h-14 w-14 rounded-full object-cover border border-sidebar-border/50" />
      ) : (
        <div className="h-14 w-14 rounded-full bg-sidebar-primary/20 border border-sidebar-border/50 flex items-center justify-center text-sidebar-foreground font-bold text-lg">
          {school?.name?.[0]?.toUpperCase() ?? "S"}
        </div>
      )}
      <div>
        <p className="text-sm font-semibold text-sidebar-foreground truncate max-w-[9rem]">{me?.name || school?.name}</p>
        <p className="text-xs text-sidebar-foreground/60 capitalize">{roleLabel}</p>
      </div>
      <ValidTillBadge expiresAt={subscription?.expiresAt} />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: me } = useGetMe();
  const [location] = useLocation();
  const role = me?.role;

  const links: { href: string; label: string; icon: LucideIcon }[] = [];

  if (role === "super_admin") {
    links.push({ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard });
    links.push({ href: "/admin/schools", label: "Schools", icon: Building });
    links.push({ href: "/admin/users", label: "Users", icon: Users });
    links.push({ href: "/admin/packages", label: "Packages", icon: Package });
    links.push({ href: "/admin/impersonation-logs", label: "Impersonation Logs", icon: UserCog });
  } else {
    links.push({ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard });
    links.push({ href: "/question-bank", label: "Question Bank", icon: Database });
    links.push({ href: "/papers", label: "Papers", icon: FileText });
    links.push({ href: "/templates", label: "Templates", icon: LayoutTemplate });
    
    if (role === "school_admin") {
      links.push({ href: "/curriculum", label: "Curriculum", icon: BookOpen });
      links.push({ href: "/teachers", label: "Teachers", icon: Users });
      links.push({ href: "/imports", label: "Import History", icon: Upload });
      links.push({ href: "/activity", label: "Activity", icon: Activity });
      links.push({ href: "/payments", label: "Payments", icon: CreditCard });
      links.push({ href: "/packages", label: "Subscription", icon: Package });
      links.push({ href: "/settings", label: "Settings", icon: Settings });
    }
  }

  const NavLinks = () => (
    <nav className="space-y-1 mt-6">
      {links.map((link) => {
        const isActive = location === link.href || (link.href !== "/dashboard" && location.startsWith(link.href));
        const Icon = link.icon;
        
        return (
          <Link key={link.href} href={link.href}>
            <span className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
              isActive 
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground cursor-pointer"
            }`}>
              <Icon className="h-5 w-5" />
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-sidebar border-r border-sidebar-border shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border/50">
          <img src={logoIcon} alt="Paperz.pk" className="h-8 w-8 mr-3" />
          <span className="text-xl font-bold text-sidebar-foreground">paperz.pk</span>
        </div>
        <SchoolProfileCard />
        <div className="flex-1 px-4 py-4 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="p-4 border-t border-sidebar-border/50 flex items-center gap-3">
          <UserButton />
          <div className="flex flex-col truncate">
            <span className="text-sm font-medium text-sidebar-foreground truncate">{me?.name || me?.email}</span>
            <span className="text-xs text-sidebar-foreground/60 truncate capitalize">{role?.replace("_", " ")}</span>
          </div>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <header className="lg:hidden h-16 fixed top-0 left-0 right-0 bg-white border-b z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-0 border-none">
              <div className="h-16 flex items-center px-6 border-b border-sidebar-border/50">
                <img src={logoIcon} alt="Paperz.pk" className="h-8 w-8 mr-3" />
                <span className="text-xl font-bold text-sidebar-foreground">paperz.pk</span>
              </div>
              <div className="px-4 py-4">
                <NavLinks />
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-bold text-lg text-secondary">paperz.pk</span>
        </div>
        <UserButton />
      </header>

      {/* Main Content */}
      <main className="flex-1 lg:pl-64 pt-16 lg:pt-0">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}