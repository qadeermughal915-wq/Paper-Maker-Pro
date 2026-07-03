import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider } from "@clerk/react";

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
import CurriculumPage from "@/pages/curriculum";
import QuestionBankPage from "@/pages/question-bank";
import PapersPage from "@/pages/papers/index";
import NewPaperPage from "@/pages/papers/new";
import EditPaperPage from "@/pages/papers/edit";

import { AuthGuard } from "@/components/auth-guard";
import { AppShell } from "@/components/layout/app-shell";

const queryClient = new QueryClient();
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

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
              <Route path="/packages" component={PackagesPage} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/admin/schools" component={AdminSchoolsPage} />
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider 
        publishableKey={clerkPubKey}
        routerPush={(to) => window.location.href = to}
        routerReplace={(to) => window.location.replace(to)}
      >
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ClerkProvider>
    </QueryClientProvider>
  );
}

export default App;