import { SignedIn, SignedOut } from "@/components/auth-state";
import { Redirect, useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>
        <AuthLoader>{children}</AuthLoader>
      </SignedIn>
      <SignedOut>
        <Redirect to="/sign-in" />
      </SignedOut>
    </>
  );
}

function AuthLoader({ children }: { children: React.ReactNode }) {
  const { data: me, isLoading } = useGetMe();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (me?.needsOnboarding && location !== "/onboarding") {
    return <Redirect to="/onboarding" />;
  }

  if (!me?.needsOnboarding && location === "/onboarding") {
    return <Redirect to="/dashboard" />;
  }

  return <>{children}</>;
}
