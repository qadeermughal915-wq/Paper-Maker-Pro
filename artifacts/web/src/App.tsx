import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";

import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import DashboardPage from "@/pages/dashboard";
import OnboardingPage from "@/pages/onboarding";
import TeachersPage from "@/pages/teachers";
import SettingsPage from "@/pages/settings";
import PackagesPage from "@/pages/packages";
import AdminSchoolsPage from "@/pages/admin-schools";
import AdminPackagesPage from "@/pages/admin-packages";
import AdminUsersPage from "@/pages/admin-users";
import PaymentsPage from "@/pages/payments";
import ActivityPage from "@/pages/activity";
import ImportsPage from "@/pages/imports";
import TemplatesPage from "@/pages/templates";
import CurriculumPage from "@/pages/curriculum";
import QuestionBankPage from "@/pages/question-bank";
import PapersPage from "@/pages/papers/index";
import NewPaperPage from "@/pages/papers/new";
import EditPaperPage from "@/pages/papers/edit";

import { AuthGuard } from "@/components/auth-guard";
import { AppShell } from "@/components/layout/app-shell";

const queryClient = new QueryClient();

// REQUIRED — resolves the key from window.location.hostname so the same build
// serves multiple Clerk custom domains. Do not inline the env var directly.
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — empty in dev (Clerk hits dev FAPI directly), auto-set in prod.
// Do NOT gate on import.meta.env.PROD / NODE_ENV.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Clerk passes full paths to routerPush/routerReplace, but wouter's
// setLocation prepends the base — strip it to avoid doubling.
function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing Publishable Key");
}

function AuthenticatedApp() {
  return (
    <AuthGuard>
      <Switch>
        <Route path="/onboarding" component={OnboardingPage} />
        <Route>
          <AppShell>
            <Switch>
              <Route path="/dashboard" component={DashboardPage} />
              <Route path="/question-bank" component={QuestionBankPage} />
              <Route path="/curriculum" component={CurriculumPage} />
              <Route path="/papers" component={PapersPage} />
              <Route path="/papers/new" component={NewPaperPage} />
              <Route path="/papers/:id" component={EditPaperPage} />
              <Route path="/teachers" component={TeachersPage} />
              <Route path="/templates" component={TemplatesPage} />
              <Route path="/imports" component={ImportsPage} />
              <Route path="/activity" component={ActivityPage} />
              <Route path="/payments" component={PaymentsPage} />
              <Route path="/packages" component={PackagesPage} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/admin/schools" component={AdminSchoolsPage} />
              <Route path="/admin/users" component={AdminUsersPage} />
              <Route path="/admin/packages" component={AdminPackagesPage} />
              <Route component={NotFound} />
            </Switch>
          </AppShell>
        </Route>
      </Switch>
    </AuthGuard>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route component={AuthenticatedApp} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;